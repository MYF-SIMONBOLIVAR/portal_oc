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

    // --- PASO A: Siesa (Aislado) ---
    try {
      console.log("[Scheduler] Ejecutando Paso A: Sincronización Siesa...");
      // Le damos un tiempo límite o simplemente lo ejecutamos
      await syncSiesaOrders();
      console.log("[Scheduler] ✓ Paso A completado");
    } catch (error) {
      console.error("[Scheduler] ✗ Error en Paso A (Siesa):", error);
    }

    // --- PASO B y C: WhatsApp (Aislado) ---
    try {
      console.log("[Scheduler] Ejecutando Paso B y C: Procesando WhatsApps pendientes...");
      await processPendingWhatsAppNotifications();
      console.log("[Scheduler] ✓ Paso B y C completados");
    } catch (error) {
      console.error("[Scheduler] ✗ Error en Paso B/C (WhatsApp):", error);
    }

  } catch (error) {
    console.error("[Scheduler] Error crítico general en el ciclo:", error);
  } finally {
    isRunning = false;
    const duration = new Date().getTime() - jobStartTime.getTime();
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
