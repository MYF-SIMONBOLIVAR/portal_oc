import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export const generateOrderPDF = (order: any, items: any[]) => {
  const doc = new jsPDF();
  
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
  doc.setTextColor(220, 38, 38); // Rojo
  doc.text(`No. ${order.consecutivo || 'FOC-00000000'}`, pageWidth - 14, 22, { align: 'right' }); 
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
  // Entrega
  doc.text(`Fecha: ${order.fecha ? format(new Date(order.fecha), "dd/MM/yyyy") : "N/A"}`, 16, 55); 
  doc.text(`Dirección: CL 30 40-10`, 16, 60); 
  doc.text(`Ciudad: ITAGÜÍ`, 16, 65); 
  // Proveedor
  doc.text(`NIT: ${order.providerNit || 'N/A'}`, (pageWidth / 2) + 4, 55); 
  doc.text(`Proveedor: ${order.providerName || 'N/A'}`, (pageWidth / 2) + 4, 60, { maxWidth: 80 }); 

  // --- COMPRADOR Y FACTURACIÓN ---
  doc.setFontSize(9);
  doc.text(`Comprador: ${order.comprador || 'MIRA SIERRA JUAN PABLO'}`, 14, 80); 
  doc.setFont("helvetica", "bold");
  doc.text("Facturación:", 14, 87); 
  doc.setFont("helvetica", "normal");
  doc.text("Enviar factura de venta electrónica al correo: recepcion@repuestossimonbolivar.com", 14, 92); 

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
    startY: 100,
    head: [['Referencia', 'Descripción', 'Cantidad', 'Precio unitario', 'Impuestos', 'Valor total']], 
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    }
  });

  // --- TOTALES (RECUADRO FINAL) ---
  const finalY = (doc as any).lastAutoTable.finalY + 5;
  const totalBruto = items.reduce((acc, item) => acc + (Number(item.cantidad) * Number(item.precioUnitario)), 0); 
  const totalIVA = totalBruto * 0.19; 
  const granTotal = totalBruto + totalIVA; 

  doc.setDrawColor(0);
  doc.rect(pageWidth - 85, finalY, 71, 35); 
  
  doc.setFontSize(9);
  doc.text("Total bruto:", pageWidth - 83, finalY + 7); 
  doc.text(`$${totalBruto.toLocaleString("es-CO")}`, pageWidth - 16, finalY + 7, { align: 'right' }); 
  
  doc.text("Dscto global:", pageWidth - 83, finalY + 14); 
  doc.text("$0.00", pageWidth - 16, finalY + 14, { align: 'right' }); 
  
  doc.text("Subtotal:", pageWidth - 83, finalY + 21); 
  doc.text(`$${totalBruto.toLocaleString("es-CO")}`, pageWidth - 16, finalY + 21, { align: 'right' }); 
  
  doc.text("Vlr. Impuestos:", pageWidth - 83, finalY + 28); 
  doc.text(`$${totalIVA.toLocaleString("es-CO")}`, pageWidth - 16, finalY + 28, { align: 'right' }); 
  
  doc.setFont("helvetica", "bold");
  doc.text("Total:", pageWidth - 83, finalY + 33); 
  doc.text(`$${granTotal.toLocaleString("es-CO")}`, pageWidth - 16, finalY + 33, { align: 'right' }); 

  // --- FIRMAS ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Elaborado", 14, finalY + 50); 
  doc.text("Aprobado", 60, finalY + 50); 
  doc.text("Recibido", 110, finalY + 50); 
  doc.line(14, finalY + 48, 50, finalY + 48);
  doc.line(60, finalY + 48, 100, finalY + 48);
  doc.line(110, finalY + 48, 150, finalY + 48);

  doc.save(`Orden_Compra_${order.consecutivo}.pdf`);
};
