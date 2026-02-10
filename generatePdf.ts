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

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  let yPosition = margin;

  const centerX = pageWidth / 2;

  // ============ ENCABEZADO ============

  // --- LOGO CENTRADO Y MÁS GRANDE ---
  const logoWidth = 60;   
  const logoHeight = 30;  
  const logoX = (pageWidth - logoWidth) / 2;

  doc.addImage(
    order.supplier.logo, // base64 o imagen
    'PNG',               // o 'JPEG'
    logoX,
    yPosition,
    logoWidth,
    logoHeight
  );

  yPosition += logoHeight + 5;

  // --- DATOS DE LA EMPRESA (CENTRADOS) ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(order.supplier.name, centerX, yPosition, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  yPosition += 8;
  doc.text(`NIT: ${order.supplier.nit}`, centerX, yPosition, { align: 'center' });

  yPosition += 5;
  doc.text(order.supplier.address, centerX, yPosition, { align: 'center' });

  yPosition += 5;
  doc.text(`Tel: ${order.supplier.phone} Fax:`, centerX, yPosition, { align: 'center' });

  yPosition += 5;
  doc.text(order.supplier.email, centerX, yPosition, { align: 'center' });
};


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
