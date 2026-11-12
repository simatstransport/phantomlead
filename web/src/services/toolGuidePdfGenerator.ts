import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getToolsForPackage } from '../utils/packageToolGuides';

/**
 * Generates an executive dark/electric cyan themed Tool Usage & Shortcut Guide PDF
 * tailored specifically to the customer's purchased package.
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

  // Background: Deep Onyx / Obsidian (#07090E)
  doc.setFillColor(7, 9, 14);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Top Accent Header Bar: Electric Cyan (#00FFFF)
  doc.setFillColor(0, 255, 255);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Brand Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(0, 255, 255);
  doc.text('PHANTOMLEAD WORKSTATION', 18, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(140, 160, 180);
  doc.text('OFFICIAL TOOL OPERATIONAL GUIDE & HOTKEY PROTOCOLS', 18, 25);

  // Status Badge
  doc.setFillColor(10, 35, 45);
  doc.setDrawColor(0, 255, 255);
  doc.setLineWidth(0.4);
  doc.roundedRect(pageWidth - 66, 13, 48, 11, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 255, 255);
  doc.text('● PLAN-SPECIFIC GUIDE', pageWidth - 63, 20);

  // Divider
  doc.setDrawColor(25, 35, 50);
  doc.setLineWidth(0.3);
  doc.line(18, 30, pageWidth - 18, 30);

  // Client and Plan info bar
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(180, 195, 215);
  doc.text(`Candidate: ${customerName || 'Valued Client'}`, 18, 36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 255, 255);
  doc.text(`Active Security Plan: ${packageName || 'Phantom Assistant Suite'}`, pageWidth - 18, 36, { align: 'right' });

  // Get only the tools belonging to this package
  const tools = getToolsForPackage(packageCode || packageName);

  // Table Data with instructions for each tool
  const tableData: any[] = [];

  tools.forEach((tool, idx) => {
    const shortcutStr = tool.secondaryShortcut 
      ? `TRIGGER HOTKEY: ${tool.shortcut} (or ${tool.secondaryShortcut})`
      : `TRIGGER HOTKEY: ${tool.shortcut}`;

    const instructionsText = tool.instructions.map((inst, i) => `  ${i + 1}. ${inst}`).join('\n');
    const fullContent = `${idx + 1}. ${tool.name.toUpperCase()} [${tool.badge.toUpperCase()}]\n${shortcutStr}\n\nOPERATIONAL STEPS:\n${instructionsText}\n\n★ PRO TIP: ${tool.tips}`;

    tableData.push([
      {
        content: fullContent,
        styles: {
          textColor: [240, 245, 255] as [number, number, number],
          cellPadding: 4,
          lineColor: [26, 35, 51] as [number, number, number],
          lineWidth: 0.2
        }
      }
    ]);
  });

  autoTable(doc, {
    startY: 42,
    body: tableData,
    theme: 'plain',
    bodyStyles: {
      fillColor: [10, 14, 22],
      fontSize: 8.5,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: [13, 18, 28],
    },
    margin: { left: 18, right: 18 },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 180;

  // SEB v3.10.2 & Environment Safety Box
  const boxY = Math.min(finalY + 6, pageHeight - 48);
  doc.setFillColor(14, 24, 36);
  doc.setDrawColor(0, 255, 255);
  doc.setLineWidth(0.4);
  doc.roundedRect(18, boxY, pageWidth - 36, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 255, 255);
  doc.text('CRITICAL EXAM PROTOCOLS (SAFE EXAM BROWSER v3.10.2):', 24, boxY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 195, 215);
  doc.text('1. Always place your cursor in the question text (NOT inside code editor sandbox) before pressing code hotkeys.', 24, boxY + 11);
  doc.text('2. MCQ Continuous Run: Press Ctrl+J once; click Next without re-pressing hotkeys across question sequences.', 24, boxY + 15);
  doc.text('3. Panic Minimize: Press Esc or F9 at any time to instantly hide assistant overlays into background tray.', 24, boxY + 19);

  // Footer
  const footerY = pageHeight - 14;
  doc.setDrawColor(25, 35, 50);
  doc.setLineWidth(0.3);
  doc.line(18, footerY - 4, pageWidth - 18, footerY - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 140, 160);
  doc.text('PhantomLead Security Platforms • Central Identity & Telemetry Desk: support@phantomlead.com', 18, footerY);

  // Bottom Cyan Accent
  doc.setFillColor(0, 255, 255);
  doc.rect(0, pageHeight - 2, pageWidth, 2, 'F');

  return doc;
};
