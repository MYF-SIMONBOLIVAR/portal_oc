import { getDb } from "../db";
import { purchaseOrders, providers } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendWhatsAppNotification, formatOrderNumber } from "../whatsapp";

/**
 * Procesa todas las órdenes que aún no han sido notificadas por WhatsApp.
 * Este worker es independiente del origen de la orden (Siesa o Manual).
 */
export async function processPendingWhatsAppNotifications() {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[WhatsAppWorker] No se pudo conectar a la base de datos");
      return;
    }

    // PASO B: Buscar órdenes donde notificadoWpp es 0 (pendiente)
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

    // PASO C: Enviar mensaje con bloqueo de seguridad para evitar duplicados
    for (const item of pendingOrders) {
      const { order, provider } = item;
      const ordenNumero = formatOrderNumber(order.tipoDocumento || "FOC", order.consecutivo);

      // --- BLOQUEO DE SEGURIDAD ---
      // Marcamos la orden como enviada (1) ANTES de llamar a la API.
      // Si otro proceso corre al mismo tiempo, ya no verá esta orden como pendiente (0).
      await db
        .update(purchaseOrders)
        .set({ 
          notificadoWpp: 1, 
          fechaNotificacionWpp: new Date() 
        })
        .where(eq(purchaseOrders.id, order.id));

      console.log(`[WhatsAppWorker] Bloqueando orden ${ordenNumero} e iniciando envío a ${provider.celular}...`);

      const success = await sendWhatsAppNotification({
        numero_telefonico: provider.celular,
        proveedor: provider.razonSocial,
        url: "https://repuestossimonbolivar.com/",
        orden_numero: ordenNumero,
      } );

      if (success) {
        console.log(`[WhatsAppWorker] ✓ Notificación enviada exitosamente para la orden ${ordenNumero}.`);
      } else {
        // Si el envío falló realmente, revertimos el estado a 0 para que se reintente en el próximo ciclo (10 min)
        await db
          .update(purchaseOrders)
          .set({ 
            notificadoWpp: 0, 
            fechaNotificacionWpp: null 
          })
          .where(eq(purchaseOrders.id, order.id));
        
        console.warn(`[WhatsAppWorker] ✗ Falló el envío para ${ordenNumero}. Se ha restablecido a pendiente para reintento.`);
      }
    }
  } catch (error) {
    console.error("[WhatsAppWorker] Error crítico en el proceso de notificaciones:", error);
  }
}
