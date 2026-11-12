import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getToolsForPackage } from '../utils/packageToolGuides';

/**
 * Generates a high-contrast, perfectly visible Operating Manual & Tool Usage PDF.
 * Uses high-contrast light styling (Pure White / Deep Slate #0f172a / Cyan accents)
 * with structured border boxes so ALL text, hotkeys, and instructions are 100% visible,
 * crystal clear, and never washed out or hidden under dark fills.
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

  const tools = getToolsForPackage(packageCode || packageName);

  // Setup page decoration function for headers and footers
  const drawPageChrome = (pageNum: number, totalPages?: number) => {
    // Top Cyan Accent Bar
    doc.setFillColor(0, 168, 204);
    doc.rect(0, 0, pageWidth, 4, 'F');

    // Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // Deep slate
    doc.text('PHANTOMLEAD WORKSTATION', 16, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('OFFICIAL TOOL OPERATIONAL GUIDE & HOTKEY PROTOCOLS', 16, 21);

    // Verified Protocol Badge
    doc.setFillColor(240, 253, 250);
    doc.setDrawColor(13, 148, 136);
    doc.setLineWidth(0.4);
    doc.roundedRect(pageWidth - 62, 10, 46, 11, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(13, 148, 136);
    doc.text('VERIFIED GUIDE', pageWidth - 56, 17);

    // Header Divider Line
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(16, 25, pageWidth - 16, 25);

    // Footer
    const footerY = pageHeight - 10;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(16, footerY - 3, pageWidth - 16, footerY - 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('PhantomLead Security Platforms • Central Support: support@phantomlead.com', 16, footerY);

    if (totalPages) {
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 16, footerY, { align: 'right' });
    }

    // Bottom accent line
    doc.setFillColor(15, 23, 42);
    doc.rect(0, pageHeight - 1.5, pageWidth, 1.5, 'F');
  };

  // Convert tools into structured table rows
  const tableRows: any[] = [];

  tools.forEach((tool, idx) => {
    const col1 = [
      `${idx + 1}. ${tool.name.toUpperCase()}`,
      `Badge: ${tool.badge}`,
      `HOTKEY: ${tool.shortcut}${tool.secondaryShortcut ? `\n(or ${tool.secondaryShortcut})` : ''}`
    ].join('\n\n');

    const instructionsText = tool.instructions.map((inst, i) => `Step ${i + 1}: ${inst}`).join('\n\n');
    const col2 = `${instructionsText}\n\nPRO TIP: ${tool.tips}`;

    tableRows.push([col1, col2]);
  });

  autoTable(doc, {
    startY: 38,
    head: [['TOOL & SHORTCUT HOTKEY', 'EXACT OPERATIONAL STEPS & INSTRUCTIONS']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],      // Deep navy/slate header
      textColor: [255, 255, 255],   // Pure white text
      fontSize: 9,
      fontStyle: 'bold',
      cellPadding: 3.5,
      lineColor: [15, 23, 42],
      lineWidth: 0.3,
    },
    bodyStyles: {
      fillColor: [255, 255, 255],   // Crisp white background
      textColor: [15, 23, 42],      // High contrast deep black/slate text
      fontSize: 8.5,
      cellPadding: 4,
      lineColor: [203, 213, 225],   // Slate border
      lineWidth: 0.3,
      overflow: 'linebreak',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],   // Very subtle off-white alternate rows
    },
    columnStyles: {
      0: { cellWidth: 54, fontStyle: 'bold', textColor: [2, 132, 199] }, // Cyan-blue bold text
      1: { cellWidth: 'auto', textColor: [30, 41, 59] },
    },
    margin: { top: 38, bottom: 26, left: 16, right: 16 },
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
    didDrawPage: (data) => {
      drawPageChrome(data.pageNumber);

      // On Page 1, render candidate & plan meta strip
      if (data.pageNumber === 1) {
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.roundedRect(16, 27, pageWidth - 32, 8, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        doc.text(`Candidate: ${customerName || 'Valued Client'}`, 19, 32.5);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`Purchased Package: ${packageName || 'Phantom Assistant Suite'}`, pageWidth - 19, 32.5, { align: 'right' });
      }
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 160;

  // Add SEB v3.10.2 Exam Guidelines Box
  if (pageHeight - finalY < 36) {
    doc.addPage();
    drawPageChrome(doc.getNumberOfPages());
    drawExamProtocolBox(doc, 32, pageWidth);
  } else {
    drawExamProtocolBox(doc, finalY + 6, pageWidth);
  }

  // Draw accurate page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 16, pageHeight - 10, { align: 'right' });
  }

  return doc;
};

function drawExamProtocolBox(doc: jsPDF, y: number, pageWidth: number) {
  doc.setFillColor(254, 242, 242); // Soft red/amber alert box
  doc.setDrawColor(239, 68, 68);
  doc.setLineWidth(0.4);
  doc.roundedRect(16, y, pageWidth - 32, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(185, 28, 28); // Bold red title
  doc.text('CRITICAL PROTOCOLS (SAFE EXAM BROWSER v3.10.2):', 20, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(69, 10, 10);
  doc.text('1. Cursor Position: Place your mouse cursor inside the question prompt (NOT in the sandbox editor) before hotkey.', 20, y + 11);
  doc.text('2. MCQ Continuous Run: Press Ctrl+J once at start; click Next without re-pressing hotkeys across quiz.', 20, y + 16);
  doc.text('3. Panic Minimize: Press Esc or F9 at any time to instantly hide assistant overlays into background system tray.', 20, y + 21);
}
