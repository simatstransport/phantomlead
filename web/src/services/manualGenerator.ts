import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates an executive dark/electric cyan themed Installation Manual PDF for PhantomLead
 */
export const generateManualInstallationPDF = (customerName?: string): jsPDF => {
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

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(0, 255, 255);
  doc.text('PHANTOMLEAD WORKSTATION', 18, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(140, 160, 180);
  doc.text('OFFICIAL CLIENT SETUP GUIDE & OPERATING MANUAL (SEB v3.10.2)', 18, 25);

  // Status Badge: OFFICIAL GUIDE
  doc.setFillColor(10, 35, 45);
  doc.setDrawColor(0, 255, 255);
  doc.setLineWidth(0.4);
  doc.roundedRect(pageWidth - 62, 13, 44, 11, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 255, 255);
  doc.text('● VERIFIED MANUAL', pageWidth - 58, 20);

  // Divider
  doc.setDrawColor(25, 35, 50);
  doc.setLineWidth(0.3);
  doc.line(18, 30, pageWidth - 18, 30);

  // Client greeting
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(180, 195, 215);
  doc.text(`Prepared for: ${customerName || 'Valued Client'} | Auto-Generated Protocol Manual`, 18, 36);

  // Step 1: Pre-requisites & SEB
  const tableData = [
    [
      { content: 'STEP 1: PREPARATION & SEB INSTALLATION\n• Download & install Safe Exam Browser (SEB) version 3.10.2 (recommended).\n• Close any third-party screen sharing, remote desktop, or recording software.', styles: { textColor: [240, 245, 255] as [number, number, number] } }
    ],
    [
      { content: 'STEP 2: DOWNLOAD SECUREINSTALLER EXECUTABLE\n• Navigate to your PhantomLead Dashboard > My Licenses.\n• Click "Download SecureInstaller.exe". Keep it on your desktop or Downloads folder.\n• Ensure Windows Defender does not quarantine (it uses standard secure packing).', styles: { textColor: [240, 245, 255] as [number, number, number] } }
    ],
    [
      { content: 'STEP 3: EXECUTE & HARDWARE BINDING (1-PC LOCK)\n• Double-click SecureInstaller.exe.\n• When prompted, copy and paste your Cryptographic License Key from your dashboard.\n• The installer registers your machine HWID. Your license is bound strictly to 1 PC.', styles: { textColor: [240, 245, 255] as [number, number, number] } }
    ],
    [
      { content: 'STEP 4: OPERATIONAL KEYBOARD SHORTCUTS IN EXAM\n• Toggle Overlay / Helper: Ctrl + Shift + P (or custom hotkey)\n• Quick Hide / Panic Button: Esc or F9 (Instantly minimizes to tray background)\n• Telemetry Status: Automatically synced with Sentinel cloud.', styles: { textColor: [0, 255, 255] as [number, number, number], fontStyle: 'bold' as const } }
    ],
    [
      { content: 'STEP 5: AUTOMATED UNINSTALL & CLEAN WIPE\n• After examination, navigate to Admin/User dashboard to trigger Remote Wipe.\n• Alternatively, running the uninstaller cleans all local registry entries and temp files.', styles: { textColor: [200, 215, 235] as [number, number, number] } }
    ]
  ];

  autoTable(doc, {
    startY: 42,
    body: tableData,
    theme: 'plain',
    bodyStyles: {
      fillColor: [10, 14, 22],
      fontSize: 9,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: [13, 18, 28],
    },
    margin: { left: 18, right: 18 },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 160;

  // Troubleshooting Card
  const boxY = finalY + 8;
  doc.setFillColor(14, 24, 36);
  doc.setDrawColor(0, 255, 255);
  doc.setLineWidth(0.4);
  doc.roundedRect(18, boxY, pageWidth - 36, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 255, 255);
  doc.text('CRITICAL PROTOCOL & TROUBLESHOOTING TIPS:', 24, boxY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 195, 215);
  doc.text('1. "Already registered to another device": Contact support or use Unbind in your portal.', 24, boxY + 13);
  doc.text('2. "License Expired": Check your duration timer. Expired keys disengage automatically.', 24, boxY + 18);
  doc.text('3. Internet required on initial activation to exchange cryptographic hash with Supabase.', 24, boxY + 23);

  // Footer
  const footerY = pageHeight - 20;
  doc.setDrawColor(25, 35, 50);
  doc.setLineWidth(0.3);
  doc.line(18, footerY - 5, pageWidth - 18, footerY - 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 140, 160);
  doc.text('PhantomLead Security Platforms • Global Technical Desk: support@phantomlead.com', 18, footerY);

  // Bottom Cyan Accent
  doc.setFillColor(0, 255, 255);
  doc.rect(0, pageHeight - 2, pageWidth, 2, 'F');

  return doc;
};
