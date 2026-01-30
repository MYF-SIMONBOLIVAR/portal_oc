import { fetchSiesaOrders, mapSiesaOrderToDb, SiesaOrderItem } from "./siesa";
import { getDb } from "../db";
import { purchaseOrders, providers, syncLogs, orderItems } from "./schema";
import { eq, desc, and } from "drizzle-orm";

/**
 * Worker que sincroniza órdenes de compra desde la API de Siesa
 */
export async function syncSiesaOrders() {
  const startTime = new Date();
  let newOrdersCount = 0;
  let updatedOrdersCount = 0;

  try {
    console.log("[SiesaSyncWorker] Iniciando sincronización incremental...");

    const db = await getDb();
    if (!db) throw new Error("Database connection not available");

    // 1. Obtener fecha de última sincronización exitosa
    const lastLog = await db
      .select()
      .from(syncLogs)
      .where(eq(syncLogs.status, "exitosa"))
      .orderBy(desc(syncLogs.syncEndedAt))
      .limit(1);

    const lastSyncDate = lastLog.length > 0 
      ? new Date(lastLog[0].syncEndedAt!) 
      : new Date(new Date().setHours(0, 0, 0, 0));

    // 2. Obtener datos de Siesa
    
    // 2. Obtener datos de Siesa
    // Ahora rawResponse ya es directamente el Array de registros (SiesaOrderItem[])
    const siesaData: SiesaOrderItem[] = await fetchSiesaOrders();

    if (siesaData.length === 0) {
        console.log("[SiesaSyncWorker] No se encontraron datos nuevos o la respuesta fue vacía.");
        // Aquí el código seguirá ejecutándose sin romperse
    } else {
        console.log(`[SiesaSyncWorker] Se obtuvieron ${siesaData.length} registros para procesar.`);
    }

    // 3. AGRUPACIÓN: Agrupar por Consecutivo + NIT
    const ordersMap = new Map<string, SiesaOrderItem[]>();
    
    for (const item of siesaData) {
      const key = `${item.f200_nit_prov}-${item.f420_consec_docto}`;
      if (!ordersMap.has(key)) {
        ordersMap.set(key, []);
      }
      ordersMap.get(key)!.push(item);
    }

    console.log(`[SiesaSyncWorker] Procesando ${ordersMap.size} órdenes únicas.`);

    // 4. PROCESAR CADA ORDEN
    for (const [key, items] of Array.from(ordersMap.entries())) {
      try {
        const firstItem = items[0];
        // Validar que la fecha sea válida antes de comparar
        const fechaAprobaStr = firstItem.f420_fecha_ts_aprobacion;
        const fechaAproba = fechaAprobaStr ? new Date(fechaAprobaStr) : new Date(0);

        // Salta si la orden es más antigua que la última sincronización
        if (fechaAproba <= lastSyncDate) continue;

        // --- BUSCAR O CREAR PROVEEDOR ---
        let providerResult = await db.select().from(providers).where(eq(providers.nit, firstItem.f200_nit_prov)).limit(1);
        let providerId: number;

        if (providerResult.length === 0) {
          const [res] = await db.insert(providers).values({
            nit: firstItem.f200_nit_prov,
            razonSocial: firstItem.f200_razon_social_prov || "Proveedor Sin Nombre",
            email: `prov_${firstItem.f200_nit_prov}@sistema.com`,
            celular: "0000000000",
            telefono: "N/A",
            passwordHash: "temp-hash",
            estado: "activo",
          });
          providerId = (res as any).insertId;
        } else {
          providerId = providerResult[0].id;
        }

        const mappedItems = items.map(item => mapSiesaOrderToDb(item));

        // --- VERIFICAR EXISTENCIA DE LA ORDEN ---
        const existingOrder = await db.select().from(purchaseOrders)
          .where(and(
            eq(purchaseOrders.providerId, providerId), 
            eq(purchaseOrders.consecutivo, firstItem.f420_consec_docto)
          ))
          .limit(1);

        let orderId: number;

        if (existingOrder.length === 0) {
          // CASO A: CREAR CABECERA
          const [orderRes] = await db.insert(purchaseOrders).values({
            providerId,
            siesaId: (firstItem as any).f420_id_interno?.toString().trim() || null,
            consecutivo: firstItem.f420_consec_docto,
            fecha: new Date(firstItem.f420_fecha),
            referencia: firstItem.f120_referencia || "N/A",
            descripcion: firstItem.f120_descripcion || "N/A",
            valorTotal: "0",
            subtotal: "0",
            impuestos: "0",
            estadoOrden: "pendiente",
            notificadoWpp: 0,
          });
          
          orderId = (orderRes as any).insertId;
          newOrdersCount++;
        } else {
          // CASO B: ORDEN EXISTENTE
          orderId = existingOrder[0].id;
          updatedOrdersCount++;
        }

        // --- INSERTAR PRODUCTOS (ANEXADO) ---
        for (const mItem of mappedItems) {
          const itemExists = await db.select().from(orderItems)
            .where(and(
              eq(orderItems.purchaseOrderId, orderId),
              eq(orderItems.referencia, mItem.referencia)
            ))
            .limit(1);

          if (itemExists.length === 0) {
            await db.insert(orderItems).values({
              purchaseOrderId: orderId,
              referencia: mItem.referencia,
              descripcion: mItem.descripcion,
              cantidad: String(mItem.cantidad),
              precioUnitario: String(mItem.precioUnitario),
              impuestos: String(mItem.impuestos),
              valorTotal: String(mItem.valorTotal),
            });
          }
        }

        // --- RECALCULAR TOTALES ---
        const currentItems = await db.select().from(orderItems).where(eq(orderItems.purchaseOrderId, orderId));
        
        const total = currentItems.reduce((sum, i) => sum + parseFloat(i.valorTotal || "0"), 0);
        const impuestos = currentItems.reduce((sum, i) => sum + parseFloat(i.impuestos || "0"), 0);
        const subtotal = total - impuestos;

        await db.update(purchaseOrders)
          .set({ 
            valorTotal: String(total.toFixed(2)),
            subtotal: String(subtotal.toFixed(2)),
            impuestos: String(impuestos.toFixed(2)) 
          })
          .where(eq(purchaseOrders.id, orderId));

      } catch (err) {
        console.error(`[SiesaSyncWorker] Error procesando orden ${key}:`, err);
      }
    }

    // 5. Registrar Log Final
    await db.insert(syncLogs).values({
      syncStartedAt: startTime,
      syncEndedAt: new Date(),
      status: "exitosa",
      recordsProcessed: siesaData.length,
      recordsCreated: newOrdersCount,
      recordsUpdated: updatedOrdersCount,
    });

    console.log(`[SiesaSyncWorker] Finalizado. Nuevas: ${newOrdersCount}, Actualizadas: ${updatedOrdersCount}`);
    return { success: true, newOrdersCount, updatedOrdersCount };

  } catch (error) {
    console.error("[SiesaSyncWorker] Error crítico:", error);
    return { success: false };
  }
}
