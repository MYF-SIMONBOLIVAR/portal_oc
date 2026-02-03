import { getDb } from "./db";
import { purchaseOrders, providers } from "./schema";
import { eq, and } from "drizzle-orm";
import { sendWhatsAppNotification, formatOrderNumber } from "./whatsapp";

/**
 * Procesa todas las órdenes que aún no han sido notificadas por WhatsApp.
 * Implementa un bloqueo preventivo para evitar envíos duplicados.
 */
export async function processPendingWhatsAppNotifications() {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[WhatsAppWorker] No se pudo conectar a la base de datos");
      return;
    }

    // PASO 1: Buscar órdenes pendientes (notificadoWpp === 0)
    const pendingOrders = await db
      .select({
        order: purchaseOrders,
        provider: providers,
      })
      .from(purchaseOrders)
      .innerJoin(providers, eq(purchaseOrders.providerId, providers.id))
      .where(eq(purchaseOrders.notificadoWpp, 0));

    if (pendingOrders.length === 0) {
      console.log("[WhatsAppWorker] No hay notificaciones pendientes.");
      return;
    }

    console.log(`[WhatsAppWorker] Detectadas ${pendingOrders.length} órdenes para procesar.`);

    for (const item of pendingOrders) {
      const { order, provider } = item;
      const ordenNumero = formatOrderNumber(order.tipoDocumento || "FOC", order.consecutivo);

      try {
        // --- PASO 2: BLOQUEO PREVENTIVO ---
        // Cambiamos a 2 para indicar que está "En proceso de envío"
        // Esto evita que otro ciclo del scheduler tome la misma orden
        await db
          .update(purchaseOrders)
          .set({ 
            notificadoWpp: 2, 
            fechaNotificacionWpp: new Date() 
          })
          .where(eq(purchaseOrders.id, order.id));

        console.log(`[WhatsAppWorker] 🛡️ Orden ${ordenNumero} bloqueada preventivamente. Enviando a ${provider.celular}...`);

        // --- PASO 3: LLAMADA A LA API DE WHATSAPP ---
        const success = await sendWhatsAppNotification({
          numero_telefonico: provider.celular,
          proveedor: provider.razonSocial,
          url: "https://repuestossimonbolivar.com/",
          orden_numero: ordenNumero,
        });

        if (success) {
          // --- PASO 4: ÉXITO TOTAL ---
          // Marcamos como 1 (Enviado y bloqueado permanentemente)
          await db
            .update(purchaseOrders)
            .set({ notificadoWpp: 1 })
            .where(eq(purchaseOrders.id, order.id));
          
          console.log(`[WhatsAppWorker] ✓ Notificación exitosa para la orden ${ordenNumero}.`);
        } else {
          // --- PASO 5: FALLO DE LA API ---
          // Revertimos a 0 para que se intente de nuevo en el próximo ciclo (5 min)
          await db
            .update(purchaseOrders)
            .set({ 
              notificadoWpp: 0, 
              fechaNotificacionWpp: null 
            })
            .where(eq(purchaseOrders.id, order.id));
          
          console.warn(`[WhatsAppWorker] ✗ La API rechazó el envío de ${ordenNumero}. Se liberó para reintento.`);
        }
      } catch (innerError) {
        // --- PASO 6: ERROR DE RED O CÓDIGO ---
        console.error(`[WhatsAppWorker] 🚨 Error procesando orden ${ordenNumero}:`, innerError);
        
        // Revertimos a 0 por seguridad
        await db
          .update(purchaseOrders)
          .set({ notificadoWpp: 0 })
          .where(eq(purchaseOrders.id, order.id));
      }
    }
  } catch (error) {
    console.error("[WhatsAppWorker] Error crítico en el proceso de notificaciones:", error);
  }
}

