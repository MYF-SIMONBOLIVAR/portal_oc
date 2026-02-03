import { processPendingWhatsAppNotifications } from "./whatsappNotificationWorker";

/**
 * Scheduler optimizado para Render
 * Se enfoca exclusivamente en el motor de notificaciones de WhatsApp.
 * La sincronización de Siesa se gestionará mediante un script externo.
 */

let syncInterval: NodeJS.Timeout | null = null;
let isRunning = false;

export function startScheduler() {
  if (syncInterval) {
    console.log("[Scheduler] El motor de notificaciones ya está activo.");
    return;
  }

  console.log("[Scheduler] Iniciando motor de notificaciones WhatsApp (Modo Ligero)");

  // Ejecución inmediata al arrancar el servidor
  executeNotificationJob();

  // Ciclo cada 5 minutos (Más frecuente ahora que es una tarea liviana)
  syncInterval = setInterval(() => {
    executeNotificationJob();
  }, 5 * 60 * 1000); 

  console.log("[Scheduler] Motor listo. Revisando base de datos cada 5 minutos.");
}

export function stopScheduler() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log("[Scheduler] Motor de notificaciones detenido.");
  }
}

async function executeNotificationJob() {
  if (isRunning) {
    console.log("[Scheduler] Una notificación ya está en proceso, saltando ejecución.");
    return;
  }

  isRunning = true;
  const jobStartTime = new Date();

  console.log(`[Scheduler] --- Iniciando Revisión de WhatsApps en ${jobStartTime.toISOString()} ---`);

  try {
    // PASO ÚNICO: Procesar notificaciones pendientes
    // Buscamos lo que el script externo (o inserciones manuales) haya dejado en la DB
    await processPendingWhatsAppNotifications();
    
    console.log("[Scheduler] ✓ Procesamiento de notificaciones finalizado.");
  } catch (error) {
    console.error("[Scheduler] ✗ Error crítico en el motor de mensajes:", error);
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
    mode: "WhatsApp Only (Lightweight)"
  };
}
