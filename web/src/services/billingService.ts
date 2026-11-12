import { generatePhantomInvoicePDF, InvoiceData } from './invoiceGenerator';
import { generateManualInstallationPDF } from './manualGenerator';
import { supabase } from './supabase';

// Prioritize Vercel production serverless API `/api/send-invoice`, fall back to localhost if local
const getEmailApiUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return '/api/send-invoice';
  }
  return 'http://localhost:3001/api/send-invoice';
};

export interface ProcessAndSendInvoiceParams {
  paymentId?: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  packageName: string;
  packageCode: string;
  amount: number;
  tax?: number;
  transactionRef: string;
  paymentMethod?: string;
  licenseKey?: string;
  isFree?: boolean;
}

/**
 * Generates an invoice, saves record into Supabase, and dispatches via Nodemailer
 */
export const processAndSendInvoice = async (params: ProcessAndSendInvoiceParams) => {
  const timestamp = Date.now().toString().slice(-6);
  const invoiceNumber = `PL-INV-${new Date().getFullYear()}-${timestamp}`;
  const total = Number(params.amount) + Number(params.tax || 0);

  const isFree = params.isFree || Number(params.amount) === 0;
  const invoiceData: InvoiceData = {
    invoiceNumber,
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    customerName: params.customerName || 'Verified Customer',
    customerEmail: params.customerEmail,
    packageName: params.packageName,
    packageCode: params.packageCode,
    amount: Number(params.amount),
    tax: Number(params.tax || 0),
    total,
    currency: 'INR',
    transactionRef: params.transactionRef,
    paymentMethod: params.paymentMethod || (isFree ? 'Admin Complimentary Grant (₹0)' : 'UPI / Direct Clearance'),
    isFree,
    licenseKey: params.licenseKey,
    companyName: 'PhantomLead Security Platforms',
    supportEmail: 'support@phantomlead.com',
  };

  // 1. Generate PDF Invoice & PDF Manual
  const pdfDoc = generatePhantomInvoicePDF(invoiceData);
  const pdfBase64 = pdfDoc.output('datauristring');

  const manualDoc = generateManualInstallationPDF(params.customerName);
  const manualBase64 = manualDoc.output('datauristring');

  // 2. Persist record to Supabase invoices table (gracefully skip if table not created yet)
  try {
    if (params.customerId) {
      await supabase.from('invoices').insert({
        invoice_number: invoiceNumber,
        payment_id: params.paymentId || null,
        customer_id: params.customerId,
        customer_name: params.customerName,
        customer_email: params.customerEmail,
        package_name: params.packageName,
        package_code: params.packageCode,
        amount: params.amount,
        tax: params.tax || 0,
        total,
        currency: 'INR',
        payment_method: params.paymentMethod || (isFree ? 'Complimentary Grant' : 'UPI / Direct Clearance'),
        transaction_ref: params.transactionRef,
        status: isFree ? 'COMPLIMENTARY' : 'PAID',
      });
    }
  } catch (dbErr) {
    console.warn('[PhantomLead Invoices DB Notice]:', dbErr);
  }

  // 3. Dispatch Email via Nodemailer Serverless Endpoint (Vercel) / Local Daemon
  let emailSuccess = false;
  let emailNotice = '';

  try {
    const apiUrl = getEmailApiUrl();
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toEmail: params.customerEmail,
        toName: params.customerName,
        invoiceNumber,
        packageName: params.packageName,
        packageCode: params.packageCode,
        amount: total,
        transactionRef: params.transactionRef,
        pdfBase64,
        manualBase64,
        licenseKey: params.licenseKey,
        currency: 'INR',
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success !== false) {
      emailSuccess = true;
      emailNotice = `Invoice ${invoiceNumber} emailed directly to ${params.customerEmail}!`;
    } else {
      throw new Error(data.error || `Server responded with ${res.status}: ${res.statusText}`);
    }
  } catch (err: any) {
    console.error('[Email Dispatch Error]:', err);
    throw new Error(`Email Dispatch Blocked: ${err.message}`);
  }

  return {
    invoiceNumber,
    pdfDoc,
    emailSuccess,
    emailNotice,
    invoiceData,
  };
};
