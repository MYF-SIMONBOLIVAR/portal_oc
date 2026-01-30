import axios from "axios";
import { ENV } from "./_core/env";

export interface SiesaOrderItem {
  f420_id_tipo_docto: string;
  f420_consec_docto: string;
  f200_razon_social_prov: string;
  f200_nit_prov: string;
  f420_fecha: string;
  f150_descripcion: string;
  f120_referencia: string;
  f420_desc_estado: string;
  f120_descripcion: string;
  f421_cant_pedida: number;
  f421_precio_unitario: number;
  f421_vlr_imp: number;
  f421_vlr_neto: number;
  f421_notas: string;
  f421_vlr_bruto: number;
  f421_vlr_dscto_global: number;
  f200_razon_social_comprador: string;
  f420_fecha_ts_aprobacion: string;
}

export interface SiesaResponse {
  data: SiesaOrderItem[];
  success: boolean;
  message?: string;
}

/**
 * Consulta la API de Siesa para obtener órdenes de compra aprobadas
 */
// server/siesa/index.ts (o donde tengas tus llamadas a Siesa)

export async function fetchSiesaOrders() {
    const urlBase = "https://connektaqa.siesacloud.com/api/v3/ejecutarconsultaestandar?idCompania=7129&descripcion=API_v2_Compras_Ordenes";
    const headers = {
        "conniKey": "Connikey-muellesyfrenos-QZBCMEMX",
        "conniToken": "QZBCMEMXQJBGMU00RDFIMKKYRZJSNUEWQZBZOFM2UTVPNUKYUDVQNQ",
        "Content-Type": "application/json"
    };

    let paginaActual = 1360; 
    let ultimaPaginaValida = 1360;
    const MAX_PAGINAS = 5000;

    console.log("[Siesa] Buscando últimas órdenes (Paginación Inversa)...");

    while (paginaActual < MAX_PAGINAS) {
    const url = `${urlBase}&paginacion=numPag=${paginaActual}|tamPag=100`;
    let text = ''; // Declarar 'text' fuera del try para que sea accesible en el catch
    try {
        const response = await fetch(url, { headers });
        text = await response.text(); // Leer la respuesta como texto

        if (!text || text.trim().length === 0) {
            // ... (lógica existente)
            break;
        }

        const data: any = JSON.parse(text);
        // ... (lógica existente)

    } catch (error) {
        // ¡AQUÍ ESTÁ EL CAMBIO IMPORTANTE!
        console.error("[Siesa] Error en búsqueda de página:", error);
        console.error("[Siesa] Respuesta recibida que causó el error:", text); // Registra el texto de la respuesta
        break;
    }
}

    console.log(`[Siesa] Escaneando página final: ${ultimaPaginaValida}`);

    const urlFinal = `${urlBase}&paginacion=numPag=${ultimaPaginaValida}|tamPag=100`;
    const finalRes = await fetch(urlFinal, { headers });
    
    // --- CAMBIO DE SEGURIDAD 2 ---
    let finalText = ''; // Declarar 'finalText' fuera del try
try {
    const finalRes = await fetch(urlFinal, { headers });
    finalText = await finalRes.text();

    if (!finalText || finalText.trim().length === 0) {
        console.log("[Siesa] La página final no devolvió datos.");
        return [];
    }
    
    const finalData: any = JSON.parse(finalText);
    return finalData?.detalle?.Table || [];

} catch (e) {
    // ¡Y AQUÍ TAMBIÉN!
    console.error("[Siesa] Error parseando JSON final:", e);
    console.error("[Siesa] Respuesta final recibida que causó el error:", finalText); // Registra el texto de la respuesta
    return [];
  }
}

/**
 * Mapea los datos de Siesa a nuestro formato de base de datos
 * Corrige los campos de precios según la estructura de Siesa:
 * - f421_precio_unitario: Precio unitario del producto
 * - f421_cant_pedida: Cantidad pedida
 * - f421_vlr_neto: Subtotal (Precio Unitario × Cantidad)
 * - f421_vlr_imp: Impuestos (19% del Subtotal)
 * - f421_vlr_bruto: Valor Bruto (Subtotal sin impuestos)
 * - f421_vlr_dscto_global: Descuento global
 */
export function mapSiesaOrderToDb(siesaOrder: SiesaOrderItem) {
  // Convertir valores numéricos (pueden venir con separadores de miles)
  const precioUnitario = parseFloat(
    String(siesaOrder.f421_precio_unitario).replace(/[.,]/g, "") || "0"
  ) / 100; 
  const cantidad = parseFloat(String(siesaOrder.f421_cant_pedida)) || 0;
  const descuentoGlobal = parseFloat(
    String(siesaOrder.f421_vlr_dscto_global).replace(/[.,]/g, "") || "0"
  ) / 100;

  // Calcular valores correctos
  const subtotal = precioUnitario * cantidad; // Precio × Cantidad
  const impuestos = subtotal * 0.19; // 19% de impuestos
  const valorTotal = subtotal + impuestos; // Subtotal + Impuestos
  const valorBruto = subtotal; // Valor bruto es el subtotal sin impuestos

  return {
    consecutivo: siesaOrder.f420_consec_docto,
    nit: siesaOrder.f200_nit_prov,
    razonSocial: siesaOrder.f200_razon_social_prov,
    fecha: new Date(siesaOrder.f420_fecha),
    ciudad: "N/A", 
    referencia: siesaOrder.f120_referencia,
    descripcion: siesaOrder.f120_descripcion,
    cantidad,
    precioUnitario,
    valorBruto,
    impuestos,
    subtotal,
    descuentoGlobal,
    valorTotal,
    notas: siesaOrder.f421_notas,
    estadoOrden: "pendiente" as const, // Siempre comienza como pendiente
    compradorRazonSocial: siesaOrder.f200_razon_social_comprador,
    siesaOrderId: `${siesaOrder.f420_id_tipo_docto}-${siesaOrder.f420_consec_docto}`, // ID único de Siesa
  };
}
