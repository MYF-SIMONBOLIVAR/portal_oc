import { syncSiesaOrders } from "./siesaSyncWorker";
import { processPendingWhatsAppNotifications } from "./whatsappNotificationWorker";

/**
 * Scheduler para ejecutar trabajos automáticos
 * Ejecuta la sincronización de órdenes Siesa y notificaciones cada 10 minutos
 */

let syncInterval: NodeJS.Timeout | null = null;
let isRunning = false;

export function startScheduler() {
  if (syncInterval) {
    console.log("[Scheduler] Scheduler ya está ejecutándose");
    return;
  }

  console.log("[Scheduler] Iniciando scheduler de sincronización y notificaciones");

  // Ejecutar inmediatamente al iniciar
  executeSyncJob();

  // Luego ejecutar cada 10 minutos (600000 ms)
  syncInterval = setInterval(() => {
    executeSyncJob();
  }, 10 * 60 * 1000); // 10 minutos

  console.log("[Scheduler] Scheduler iniciado. Ciclo cada 10 minutos");
}

export function stopScheduler() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log("[Scheduler] Scheduler detenido");
  }
}

async function executeSyncJob() {
  if (isRunning) {
    console.log("[Scheduler] Una tarea ya está en progreso, saltando ejecución");
    return;
  }

  isRunning = true;
  const jobStartTime = new Date();

  try {
    console.log(`[Scheduler] --- Iniciando Ciclo de Trabajo en ${jobStartTime.toISOString()} ---`);

    // PASO A: Sincronizar con Siesa
    console.log("[Scheduler] Ejecutando Paso A: Sincronización Siesa...");
    
    // Forzamos el tipo o manejamos el resultado como 'any' para evitar el bloqueo del compilador
    const result: any = await syncSiesaOrders();

    if (result.success) {
      console.log(
        `[Scheduler] ✓ Sincronización Siesa exitosa. ` +
        `Nuevas: ${result.newOrdersCount}, Actualizadas: ${result.updatedOrdersCount}`
      );
    } else {
      // Usamos un fallback por si result.error es undefined
      console.error(`[Scheduler] ✗ Sincronización Siesa fallida:`, result.error || "Error desconocido");
    }

    // PASO B y C: Procesar notificaciones pendientes
    console.log("[Scheduler] Ejecutando Paso B y C: Procesando WhatsApps pendientes...");
    await processPendingWhatsAppNotifications();

  } catch (error) {
    console.error("[Scheduler] Error crítico durante el ciclo de trabajo:", error);
  } finally {
    isRunning = false;
    const jobEndTime = new Date();
    const duration = jobEndTime.getTime() - jobStartTime.getTime();
    console.log(`[Scheduler] --- Ciclo finalizado en ${duration}ms ---`);
  }
}

/**
 * Obtener estado del scheduler
 */
export function getSchedulerStatus() {
  return {
    isRunning: syncInterval !== null,
    isSyncInProgress: isRunning,
  };
}
