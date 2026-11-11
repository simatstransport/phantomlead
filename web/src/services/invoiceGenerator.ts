import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  packageName: string;
  packageCode: string;
  amount: number;
  tax: number;
  total: number;
  currency: string;
  transactionRef: string;
  paymentMethod: string;
  isFree?: boolean;
  licenseKey?: string;
  companyName?: string;
  supportEmail?: string;
}

/**
 * Generates an executive dark/electric cyan themed PDF invoice for PhantomLead
 */
export const generatePhantomInvoicePDF = (data: InvoiceData): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Background: Deep Onyx / Obsidian (#07090E)
  doc.setFillColor(7, 9, 14);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Top Accent Header Bar: Electric Cyan (#00FFFF)
  doc.setFillColor(0, 255, 255);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Header Section: Brand Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(0, 255, 255); // Electric Cyan
  doc.text('PHANTOMLEAD', 18, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(140, 160, 180);
  doc.text('MILITARY-GRADE ENTERPRISE LICENSING & TELEMETRY', 18, 27);

  // Status Badge: PAID vs COMPLIMENTARY (Electric Cyan or Emerald pill)
  const isFree = data.isFree || data.amount === 0;
  doc.setFillColor(isFree ? 8 : 10, isFree ? 35 : 35, isFree ? 28 : 45);
  doc.setDrawColor(0, 255, 255);
  doc.setLineWidth(0.5);
  const badgeWidth = isFree ? 52 : 37;
  doc.roundedRect(pageWidth - (badgeWidth + 18), 14, badgeWidth, 12, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 255, 255);
  doc.text(isFree ? '★ COMPLIMENTARY' : '● VERIFIED PAID', pageWidth - (badgeWidth + 13), 22);

  // Divider Line
  doc.setDrawColor(25, 35, 50);
  doc.setLineWidth(0.3);
  doc.line(18, 33, pageWidth - 18, 33);

  // Invoice Details Box (Left: Billed To, Right: Invoice Meta)
  // Left Column: Customer Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 255, 255);
  doc.text('BILLED TO (CLIENT DETAILS)', 18, 42);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(240, 245, 255);
  doc.text(data.customerName || 'Verified Customer', 18, 49);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(150, 165, 185);
  doc.text(`Email: ${data.customerEmail}`, 18, 55);
  doc.text(`Payment Gateway: ${data.paymentMethod || 'UPI / QR Verification'}`, 18, 61);

  // Right Column: Invoice Metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 255, 255);
  doc.text('INVOICE METADATA', pageWidth - 85, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(150, 165, 185);
  doc.text(`Invoice No:`, pageWidth - 85, 49);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(data.invoiceNumber, pageWidth - 45, 49);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 165, 185);
  doc.text(`Date of Issue:`, pageWidth - 85, 55);
  doc.setTextColor(255, 255, 255);
  doc.text(data.date, pageWidth - 45, 55);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 165, 185);
  doc.text(`Transaction Ref (UTR):`, pageWidth - 85, 61);
  doc.setTextColor(0, 255, 255);
  doc.text(data.transactionRef ? `${data.transactionRef.substring(0, 16)}...` : 'N/A', pageWidth - 45, 61);

  // Line Items Table using autoTable
  const tableRows = [
    [
      { content: `${data.packageName}\nIdentifier: ${data.packageCode}\nStatus: Permanent Cryptographic Key Generation`, styles: { textColor: [230, 240, 255] as [number, number, number] } },
      { content: '1', styles: { halign: 'center' as const, textColor: [200, 220, 240] as [number, number, number] } },
      { content: `INR ${Number(data.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, styles: { halign: 'right' as const, textColor: [240, 245, 255] as [number, number, number] } },
      { content: `INR ${Number(data.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, styles: { halign: 'right' as const, textColor: [0, 255, 255] as [number, number, number], fontStyle: 'bold' as const } }
    ]
  ];

  autoTable(doc, {
    startY: 72,
    head: [['SECURITY PRODUCT / ENTITLEMENT', 'QTY', 'RATE', 'TOTAL']],
    body: tableRows,
    theme: 'plain',
    headStyles: {
      fillColor: [14, 20, 32],
      textColor: [0, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 4,
    },
    bodyStyles: {
      fillColor: [10, 13, 20],
      fontSize: 9,
      cellPadding: 5,
    },
    alternateRowStyles: {
      fillColor: [12, 16, 25],
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 20 },
      2: { cellWidth: 35 },
      3: { cellWidth: 35 },
    },
    margin: { left: 18, right: 18 },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 105;

  // Calculation Breakdown
  const summaryX = pageWidth - 85;
  let currentY = finalY + 8;

  doc.setDrawColor(25, 35, 50);
  doc.setLineWidth(0.3);
  doc.line(18, currentY - 2, pageWidth - 18, currentY - 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(150, 165, 185);
  doc.text('Subtotal:', summaryX, currentY + 5);
  doc.setTextColor(240, 245, 255);
  doc.text(`INR ${Number(data.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 18, currentY + 5, { align: 'right' });

  doc.setTextColor(150, 165, 185);
  doc.text('Tax (GST 0% / Included):', summaryX, currentY + 11);
  doc.setTextColor(240, 245, 255);
  doc.text(`INR ${Number(data.tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 18, currentY + 11, { align: 'right' });

  // Grand Total Highlight Box
  doc.setFillColor(14, 28, 38);
  doc.setDrawColor(0, 255, 255);
  doc.setLineWidth(0.4);
  doc.roundedRect(summaryX - 4, currentY + 16, 71, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL AMOUNT:', summaryX, currentY + 25);

  doc.setFontSize(11);
  doc.setTextColor(0, 255, 255);
  doc.text(`INR ${Number(data.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 20, currentY + 25, { align: 'right' });

  // Security & License Key Box (if available)
  if (data.licenseKey) {
    const keyBoxY = currentY + 37;
    doc.setFillColor(8, 14, 22);
    doc.setDrawColor(0, 255, 255);
    doc.setLineWidth(0.4);
    doc.roundedRect(18, keyBoxY, pageWidth - 36, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 255, 255);
    doc.text('ENTITLEMENT CRYPTOGRAPHIC LICENSE KEY:', 24, keyBoxY + 6);

    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(data.licenseKey, 24, keyBoxY + 13);
  }

  // Footer & Cryptographic Verification Notice
  const footerY = pageHeight - 25;
  doc.setDrawColor(25, 35, 50);
  doc.setLineWidth(0.3);
  doc.line(18, footerY - 5, pageWidth - 18, footerY - 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 140, 160);
  doc.text(`Generated by ${data.companyName || 'PhantomLead Security Platforms'} Engine. This is a computer-verified digital receipt.`, 18, footerY);
  doc.text(`Support & Enquiries: ${data.supportEmail || 'support@phantomlead.com'} | Global Incident Desk`, 18, footerY + 5);

  // Bottom Cyan Accent
  doc.setFillColor(0, 255, 255);
  doc.rect(0, pageHeight - 2, pageWidth, 2, 'F');

  return doc;
};
