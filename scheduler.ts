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

  console.log(`[Scheduler] --- Iniciando Ciclo de Trabajo en ${jobStartTime.toISOString()} ---`);

  // --- EJECUCIÓN EN PARALELO O PROTEGIDA ---
  
  // 1. Intentar Siesa (con su propio try/catch para que no mate al resto)
  try {
    console.log("[Scheduler] Ejecutando Paso A: Sincronización Siesa...");
    const result: any = await syncSiesaOrders();
    console.log(`[Scheduler] ✓ Paso A Finalizado`);
  } catch (e) {
    console.error("[Scheduler] ✗ Falló Paso A (Siesa):", e);
  }

  // 2. Intentar WhatsApp (SIEMPRE se ejecuta, aunque Siesa falle o tarde)
  try {
    console.log("[Scheduler] Ejecutando Paso B y C: Procesando WhatsApps pendientes...");
    await processPendingWhatsAppNotifications();
    console.log(`[Scheduler] ✓ Paso B/C Finalizado`);
  } catch (e) {
    console.error("[Scheduler] ✗ Falló Paso B (WhatsApp):", e);
  }

  isRunning = false;
  const duration = new Date().getTime() - jobStartTime.getTime();
  console.log(`[Scheduler] --- Ciclo finalizado en ${duration}ms ---`);
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
