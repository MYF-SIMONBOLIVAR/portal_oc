import axios from "axios";
import { ENV } from "./env";

// --- INTERFACES ---
export interface WhatsAppNotificationPayload {
  numero_telefonico: string;
  proveedor: string;
  url: string;
  orden_numero: string;
}

export interface ConfirmationNotificationPayload {
  consecutivo: string;
  proveedor: string;
  url: string;
  celular: string;
}

export interface RejectionNotificationPayload {
  consecutivo: string;
  proveedor: string;
  motivo: string;
  celular: string;
}

/**
 * 1. Notificación de Nueva Orden (Al proveedor)
 */
export async function sendWhatsAppNotification(
  payload: WhatsAppNotificationPayload
): Promise<boolean> {
  try {
    const apiUrl = "https://repuestossimonbolivar.com/api/whatsapp/test?tipo=proveedores_orden_compra";
    const token = ENV.whatsappApiToken || "t{;tB9oO}0WSix=qi!/{f";

    const telefonoDestino = payload.numero_telefonico.replace(/\s+/g, '');
    
    const response = await axios.post(
      apiUrl,
      { ...payload, numero_telefonico: telefonoDestino },
      { headers: { "Content-Type": "application/json", "Token": token }, timeout: 15000 }
    );

    return response.status === 200 || response.status === 201;
  } catch (error: any) {
    console.error("[WhatsApp] Error en sendWhatsAppNotification:", error.response?.data || error.message);
    return false;
  }
}

/**
 * 2. Notificación de APROBACIÓN (Al administrador)
 */
export async function sendConfirmationNotification(
  payload: ConfirmationNotificationPayload
): Promise<boolean> {
  try {
    const apiUrl = "https://repuestossimonbolivar.com/api/whatsapp/test?tipo=proveedores_orden_compra_aprobada";
    const token = "t{;tB9oO}0WSix=qi!/{f";

    const response = await axios.post(
      apiUrl,
      {
        orden_compra: payload.consecutivo, 
        proveedor: payload.proveedor,
        url: payload.url,                 
        numero_telefonico: payload.celular,
      },
      { headers: { "Content-Type": "application/json", "Token": token } }
    );

    return response.status === 200 || response.status === 201;
  } catch (error: any) {
    console.error("[WhatsApp] Error en sendConfirmationNotification:", error.response?.data || error.message);
    return false;
  }
}

/**
 * 3. Notificación de RECHAZO (Al administrador)
 * Se dispara cuando el proveedor declina la orden
 */
export async function sendRejectionNotification(
  payload: RejectionNotificationPayload
): Promise<boolean> {
  try {
    // URL para rechazos (Asegúrate de que este sea el 'tipo' correcto en tu API)
    const apiUrl = "https://repuestossimonbolivar.com/api/whatsapp/test?tipo=proveedores_orden_compra_rechazada";
    const token = "t{;tB9oO}0WSix=qi!/{f";

    console.log(`[WhatsApp] Enviando rechazo de orden ${payload.consecutivo} por: ${payload.motivo}`);

    const response = await axios.post(
      apiUrl,
      {
        orden_compra: payload.consecutivo,
        proveedor: payload.proveedor,
        url: payload.url,   
        numero_telefonico: payload.celular,
        
      },
      { headers: { "Content-Type": "application/json", "Token": token } }
    );

    return response.status === 200 || response.status === 201;
  } catch (error: any) {
    console.error("[WhatsApp] Error en sendRejectionNotification:", error.response?.data || error.message);
    return false;
  }
}

/**
 * Formatea el número de orden
 */
export function formatOrderNumber(tipoDocto: string, consec: string | number): string {
  const consecutivoStr = String(consec).padStart(6, "0");
  return `${tipoDocto}-${consecutivoStr}`;
}
