import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export const generateOrderPDF = (order: any, items: any[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Encabezado
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text("MUELLES Y FRENOS SIMON BOLIVAR S.A.S", 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Nit: 900296641", 14, 26);
  doc.text("Dirección: CL 30 40 - 10, ITAGÜÍ", 14, 31);

  // Título
  doc.setFontSize(14);
  doc.setTextColor(37, 99, 235);
  doc.text(`ORDEN DE COMPRA # ${order.consecutivo}`, 14, 45);

  // Tabla de productos
  const tableRows = items.map((item) => [
    item.referencia,
    item.descripcion,
    item.cantidad,
    `$${Number(item.precioUnitario).toLocaleString("es-CO")}`,
    `$${(Number(item.cantidad) * Number(item.precioUnitario)).toLocaleString("es-CO")}`,
    `$${(Number(item.cantidad) * Number(item.precioUnitario) * 0.19).toLocaleString("es-CO")}`,
    `$${Number(item.valorTotal || 0).toLocaleString("es-CO")}`,
  ]);

  autoTable(doc, {
    startY: 55,
    head: [['Ref.', 'Descripción', 'Cant.', 'Precio U.', 'Bruto', 'IVA', 'Total']],
    body: tableRows,
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 8 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Totales
  const totalBruto = items.reduce((acc, item) => acc + (Number(item.cantidad) * Number(item.precioUnitario)), 0);
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Subtotal: $${totalBruto.toLocaleString("es-CO")}`, pageWidth - 14, finalY, { align: 'right' });
  doc.text(`IVA (19%): $${(totalBruto * 0.19).toLocaleString("es-CO")}`, pageWidth - 14, finalY + 6, { align: 'right' });
  doc.setFontSize(12);
  doc.text(`TOTAL: $${Number(items.reduce((acc, item) => acc + Number(item.valorTotal || 0), 0)).toLocaleString("es-CO")}`, pageWidth - 14, finalY + 14, { align: 'right' });

  doc.save(`Orden_${order.consecutivo}.pdf`);
};
