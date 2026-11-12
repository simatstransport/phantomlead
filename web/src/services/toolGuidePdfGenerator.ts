import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getToolsForPackage } from '../utils/packageToolGuides';

/**
 * Generates an executive dark/electric cyan themed Tool Usage & Shortcut Guide PDF
 * tailored specifically to the customer's purchased package.
 * Built with robust multi-page support and automatic page background painting so
 * table rows never overflow off-page or get clipped.
 */
export const generateToolUsageGuidePDF = (
  customerName: string,
  packageName: string,
  packageCode: string
): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Helper to paint page background and header on every page
  const paintPageDecorations = (pageNum: number, totalPages?: number) => {
    // Background: Deep Onyx / Obsidian (#07090E)
    doc.setFillColor(7, 9, 14);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Top Accent Header Bar: Electric Cyan (#00FFFF)
    doc.setFillColor(0, 255, 255);
    doc.rect(0, 0, pageWidth, 4, 'F');

    // Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(0, 255, 255);
    doc.text('PHANTOMLEAD WORKSTATION', 16, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(140, 160, 180);
    doc.text('OFFICIAL TOOL OPERATIONAL GUIDE & HOTKEY PROTOCOLS', 16, 21);

    // Status Badge
    doc.setFillColor(10, 35, 45);
    doc.setDrawColor(0, 255, 255);
    doc.setLineWidth(0.3);
    doc.roundedRect(pageWidth - 62, 11, 46, 10, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 255, 255);
    doc.text('● VERIFIED PROTOCOL', pageWidth - 59, 17);

    // Divider line
    doc.setDrawColor(25, 35, 50);
    doc.setLineWidth(0.3);
    doc.line(16, 25, pageWidth - 16, 25);

    // Footer
    const footerY = pageHeight - 10;
    doc.setDrawColor(25, 35, 50);
    doc.setLineWidth(0.3);
    doc.line(16, footerY - 3, pageWidth - 16, footerY - 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 140, 160);
    doc.text('PhantomLead Security Platforms • Central Support: support@phantomlead.com', 16, footerY);

    if (totalPages) {
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 16, footerY, { align: 'right' });
    }

    // Bottom Cyan Accent
    doc.setFillColor(0, 255, 255);
    doc.rect(0, pageHeight - 1.5, pageWidth, 1.5, 'F');
  };

  // Get only the tools belonging to this package
  const tools = getToolsForPackage(packageCode || packageName);

  // Build clean 2-column tabular rows
  // Column 1: Tool Name & Hotkey badge
  // Column 2: Step-by-Step Instructions & Pro-Tip
  const tableRows: any[] = [];

  tools.forEach((tool, idx) => {
    const col1 = [
      `#${idx + 1} ${tool.name.toUpperCase()}`,
      `Badge: ${tool.badge}`,
      `HOTKEY: ${tool.shortcut}${tool.secondaryShortcut ? `\n(or ${tool.secondaryShortcut})` : ''}`
    ].join('\n\n');

    const instructionsText = tool.instructions.map((inst, i) => `Step ${i + 1}: ${inst}`).join('\n\n');
    const col2 = `${instructionsText}\n\n★ PRO TIP: ${tool.tips}`;

    tableRows.push([col1, col2]);
  });

  autoTable(doc, {
    startY: 38,
    head: [['TOOL & SHORTCUT HOTKEY', 'EXACT OPERATIONAL STEPS & INSTRUCTIONS']],
    body: tableRows,
    theme: 'plain',
    headStyles: {
      fillColor: [14, 24, 38],
      textColor: [0, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      cellPadding: 3.5,
      lineColor: [0, 255, 255],
      lineWidth: 0.3,
    },
    bodyStyles: {
      fillColor: [10, 14, 22],
      textColor: [240, 245, 255],
      fontSize: 8,
      cellPadding: 3.5,
      lineColor: [26, 35, 51],
      lineWidth: 0.2,
      overflow: 'linebreak',
    },
    alternateRowStyles: {
      fillColor: [13, 18, 28],
    },
    columnStyles: {
      0: { cellWidth: 54, fontStyle: 'bold', textColor: [0, 255, 255] },
      1: { cellWidth: 'auto', textColor: [226, 232, 240] },
    },
    margin: { top: 38, bottom: 28, left: 16, right: 16 },
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
    didDrawPage: (data) => {
      // Paint the dark theme background and chrome for every page generated
      paintPageDecorations(data.pageNumber);

      // On Page 1, render candidate & plan banner
      if (data.pageNumber === 1) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(180, 195, 215);
        doc.text(`Candidate: ${customerName || 'Valued Client'}`, 16, 31);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 255, 255);
        doc.text(`Active Plan: ${packageName || 'Phantom Assistant Suite'}`, pageWidth - 16, 31, { align: 'right' });
      }
    },
  });

  // Calculate final vertical position after tables
  const finalY = (doc as any).lastAutoTable?.finalY || 160;

  // Add SEB v3.10.2 & Environment Safety Box
  // If remaining space on the last page is less than 35mm, add a new page
  if (pageHeight - finalY < 35) {
    doc.addPage();
    paintPageDecorations(doc.getNumberOfPages());
    drawProtocolBox(doc, 32, pageWidth);
  } else {
    drawProtocolBox(doc, finalY + 5, pageWidth);
  }

  // Update total pages number in footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 140, 160);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 16, pageHeight - 10, { align: 'right' });
  }

  return doc;
};

function drawProtocolBox(doc: jsPDF, y: number, pageWidth: number) {
  doc.setFillColor(14, 24, 36);
  doc.setDrawColor(0, 255, 255);
  doc.setLineWidth(0.3);
  doc.roundedRect(16, y, pageWidth - 32, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 255, 255);
  doc.text('CRITICAL SAFE EXAM BROWSER (SEB v3.10.2) PROTOCOLS:', 20, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text('1. Cursor Position: Always place your mouse cursor in the question area (NOT in code editor) before hotkey.', 20, y + 10);
  doc.text('2. MCQ Continuous Run: Press Ctrl+J once at start; click Next without re-pressing hotkeys across quiz.', 20, y + 14);
  doc.text('3. Panic Button: Press Esc or F9 at any time to instantly minimize overlays into background system tray.', 20, y + 18);
}
