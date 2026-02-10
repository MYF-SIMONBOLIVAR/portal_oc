import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export const generateOrderPDF = (order: any, items: any[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // 1. Logo (Base64) - Asegúrate de que este string sea correcto
  const logoBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."; 

  try {
    if (logoBase64.length > 50) {
      doc.addImage(logoBase64, 'PNG', 14, 5, 40, 12);
    }
  } catch (e) {
    console.error("Error cargando el logo:", e);
  }

  // --- ENCABEZADO IZQUIERDO ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("MUELLES Y FRENOS SIMON BOLIVAR S.A.S", 14, 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("NIT: 900296641", 14, 27); 
  doc.text("CL 31 41 15 LC 6 P 2", 14, 32); 
  doc.text("Tel: 44447232   ITAGÜÍ", 14, 37);

  // --- ENCABEZADO DERECHO ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("ORDEN DE COMPRA", pageWidth - 14, 15, { align: 'right' }); 
  doc.setFontSize(13);
  doc.setTextColor(220, 38, 38); 
  doc.text(`No. ${order.consecutivo || 'N/A'}`, pageWidth - 14, 22, { align: 'right' }); 
  doc.setTextColor(0);

  // --- BLOQUE: DATOS DE ENTREGA Y PROVEEDOR ---
  doc.setDrawColor(200);
  doc.rect(14, 45, (pageWidth / 2) - 16, 25); 
  doc.rect((pageWidth / 2) + 2, 45, (pageWidth / 2) - 16, 25); 

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Datos de entrega", 16, 50); 
  doc.text("Proveedor", (pageWidth / 2) + 4, 50); 
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Fecha: ${order.fecha ? format(new Date(order.fecha), "dd/MM/yyyy") : "N/A"}`, 16, 55); 
  doc.text(`Dirección: CL 30 40-10`, 16, 60); 
  doc.text(`Ciudad: ITAGÜÍ`, 16, 65); 
  doc.text(`NIT: ${order.providerNit || 'N/A'}`, (pageWidth / 2) + 4, 55); 
  doc.text(`Proveedor: ${order.providerName || 'N/A'}`, (pageWidth / 2) + 4, 60, { maxWidth: 80 }); 

  // --- TABLA DE PRODUCTOS ---
  const tableRows = items.map((item) => {
    const bruto = Number(item.cantidad || 0) * Number(item.precioUnitario || 0);
    const iva = bruto * 0.19;
    const total = bruto + iva;
    return [
      item.referencia, 
      item.descripcion, 
      item.cantidad, 
      `$${Number(item.precioUnitario).toLocaleString("es-CO")}`, 
      `$${iva.toLocaleString("es-CO")}`, 
      `$${total.toLocaleString("es-CO")}` 
    ];
  });

  autoTable(doc, {
    startY: 80,
    head: [['Referencia', 'Descripción', 'Cant.', 'Precio U.', 'Impuestos', 'Total']], 
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
    styles: { fontSize: 8 },
  });

  // --- TOTALES ---
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const totalNeto = items.reduce((acc, item) => acc + (Number(item.cantidad) * Number(item.precioUnitario) * 1.19), 0);

  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL A PAGAR: $${totalNeto.toLocaleString("es-CO")}`, pageWidth - 14, finalY, { align: 'right' });

  doc.save(`Orden_Compra_${order.consecutivo}.pdf`);
};
