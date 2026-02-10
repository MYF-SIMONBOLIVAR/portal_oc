import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface OrderItem {
  reference: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxes: number;
  total: number;
}

interface Order {
  orderNumber: string;
  orderDate: Date;
  supplier: {
    name: string;
    nit: string;
    address: string;
    phone: string;
    email: string;
  };
  buyer: {
    nit: string;
    name: string;
    contact: string;
  };
  deliveryInfo: {
    date: string;
    address: string;
    city: string;
  };
  items: OrderItem[];
  notes?: string;
  totalBruto: number;
  descuentoGlobal: number;
  subtotal: number;
  impuestos: number;
  totalFinal: number;
  elaboratedBy?: string;
  approvedBy?: string;
  receivedBy?: string;
}

export const generateOrderPDF = (order: Order) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  const margin = 10;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // ============ ENCABEZADO ============
  
  // Logo y datos de la empresa (lado izquierdo)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(order.supplier.name, margin, yPosition);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  yPosition += 8;
  doc.text(`NIT: ${order.supplier.nit}`, margin, yPosition);
  
  yPosition += 5;
  doc.text(order.supplier.address, margin, yPosition);
  
  yPosition += 5;
  doc.text(`Tel: ${order.supplier.phone} Fax:`, margin, yPosition);
  
  yPosition += 5;
  doc.text(order.supplier.email, margin, yPosition);

  // Título ORDEN DE COMPRA (lado derecho)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const titleX = pageWidth - margin - 50;
  doc.text('ORDEN DE COMPRA', titleX, margin + 5);

  // Número de orden (lado derecho)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`No. ${order.orderNumber}`, titleX, margin + 15);

  yPosition += 15;

  // ============ SECCIÓN PROVEEDOR Y DATOS DE ENTREGA ============
  
  // Caja de Proveedor
  doc.setDrawColor(0);
  doc.rect(margin, yPosition, contentWidth / 2 - 2, 35);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Proveedor', margin + 2, yPosition + 4);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`NIT: ${order.buyer.nit}`, margin + 2, yPosition + 10);
  doc.text(`Proveedor: ${order.buyer.name}`, margin + 2, yPosition + 16);
  doc.text(`Comprador: ${order.buyer.contact}`, margin + 2, yPosition + 22);

  // Caja de Datos de Entrega
  const deliveryX = margin + contentWidth / 2;
  doc.rect(deliveryX, yPosition, contentWidth / 2 - 2, 35);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Datos de entrega', deliveryX + 2, yPosition + 4);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Fecha: ${order.deliveryInfo.date}`, deliveryX + 2, yPosition + 10);
  doc.text(`Dirección: ${order.deliveryInfo.address}`, deliveryX + 2, yPosition + 16);
  doc.text(`Ciudad: ${order.deliveryInfo.city}`, deliveryX + 2, yPosition + 22);

  yPosition += 40;

  // ============ SECCIÓN FACTURACIÓN ============
  
  doc.setDrawColor(0);
  doc.rect(margin, yPosition, contentWidth, 8);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Facturación', margin + 2, yPosition + 5);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  yPosition += 8;
  doc.text(`Enviar factura de venta electrónica al correo: ${order.supplier.email}`, margin + 2, yPosition + 2);

  yPosition += 8;

  // ============ TABLA DE ITEMS ============
  
  const tableColumns = ['Referencia', 'Descripción', 'Cantidad', 'Precio unitario', 'Impuestos', 'Valor total'];
  const tableData = order.items.map(item => [
    item.reference,
    item.description,
    item.quantity.toString(),
    `$${item.unitPrice.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
    `$${item.taxes.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
    `$${item.total.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`
  ]);

  autoTable(doc, {
    head: [tableColumns],
    body: tableData,
    startY: yPosition,
    margin: margin,
    theme: 'grid',
    headStyles: {
      fillColor: [200, 200, 200],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      halign: 'right'
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 20 },
      1: { halign: 'left', cellWidth: 60 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'right', cellWidth: 30 },
      5: { halign: 'right', cellWidth: 30 }
    }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // ============ SECCIÓN NOTAS Y TOTALES ============
  
  // Caja de Notas
  doc.setDrawColor(0);
  doc.rect(margin, yPosition, contentWidth / 2 - 2, 30);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Notas', margin + 2, yPosition + 5);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  if (order.notes) {
    const notesLines = doc.splitTextToSize(order.notes, contentWidth / 2 - 6);
    doc.text(notesLines, margin + 2, yPosition + 12);
  }

  // Caja de Totales
  const totalsX = margin + contentWidth / 2;
  doc.rect(totalsX, yPosition, contentWidth / 2 - 2, 30);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Totales', totalsX + 2, yPosition + 5);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  let totalYPos = yPosition + 12;
  
  doc.text('Total bruto', totalsX + 2, totalYPos);
  doc.text(`$${order.totalBruto.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, totalsX + contentWidth / 2 - 12, totalYPos, { align: 'right' });
  
  totalYPos += 5;
  doc.text('Dscto global', totalsX + 2, totalYPos);
  doc.text(`$${order.descuentoGlobal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, totalsX + contentWidth / 2 - 12, totalYPos, { align: 'right' });
  
  totalYPos += 5;
  doc.text('Subtotal', totalsX + 2, totalYPos);
  doc.text(`$${order.subtotal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, totalsX + contentWidth / 2 - 12, totalYPos, { align: 'right' });
  
  totalYPos += 5;
  doc.text('Vlr. Impuestos', totalsX + 2, totalYPos);
  doc.text(`$${order.impuestos.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, totalsX + contentWidth / 2 - 12, totalYPos, { align: 'right' });
  
  totalYPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Total', totalsX + 2, totalYPos);
  doc.text(`$${order.totalFinal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, totalsX + contentWidth / 2 - 12, totalYPos, { align: 'right' });

  yPosition += 35;

  // ============ SECCIÓN DE FIRMAS ============
  
  doc.setDrawColor(0);
  doc.rect(margin, yPosition, contentWidth, 25);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  const signatureY = yPosition + 18;
  const signatureSpacing = contentWidth / 3;
  
  // Líneas de firma
  doc.line(margin + 5, signatureY, margin + signatureSpacing - 5, signatureY);
  doc.line(margin + signatureSpacing + 5, signatureY, margin + 2 * signatureSpacing - 5, signatureY);
  doc.line(margin + 2 * signatureSpacing + 5, signatureY, margin + contentWidth - 5, signatureY);
  
  // Etiquetas de firma
  doc.text(order.elaboratedBy || 'Elaborado', margin + signatureSpacing / 2, signatureY + 5, { align: 'center' });
  doc.text(order.approvedBy || 'Aprobado', margin + signatureSpacing + signatureSpacing / 2, signatureY + 5, { align: 'center' });
  doc.text(order.receivedBy || 'Recibido', margin + 2 * signatureSpacing + signatureSpacing / 2, signatureY + 5, { align: 'center' });

  return doc;
};

// Función auxiliar para generar PDF y descargarlo
export const downloadOrderPDF = (order: Order, filename: string = 'orden_compra.pdf') => {
  const doc = generateOrderPDF(order);
  doc.save(filename);
};

