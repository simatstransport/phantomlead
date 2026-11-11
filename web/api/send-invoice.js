import nodemailer from 'nodemailer';

const GMAIL_USER = process.env.GMAIL_USER || 'brokenvidplay0@gmail.com';
const GMAIL_APP_PASSWORD = (process.env.GMAIL_APP_PASSWORD || 'uyfc tvol tsfc kwob').replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health check endpoint
  if (req.method === 'GET') {
    try {
      await transporter.verify();
      return res.status(200).json({ 
        status: 'online', 
        service: 'PhantomLead Vercel Serverless Email Engine',
        gmail: GMAIL_USER,
        smtp_verified: true
      });
    } catch (verifyErr) {
      return res.status(500).json({
        status: 'error',
        error: verifyErr.message,
        smtp_verified: false
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { 
        toEmail, 
        toName, 
        invoiceNumber, 
        packageName, 
        amount, 
        transactionRef, 
        pdfBase64, 
        manualBase64,
        licenseKey,
        isWelcome,
        currency = 'INR' 
      } = req.body;

      if (!toEmail) {
        return res.status(400).json({ error: 'toEmail is required in payload' });
      }

      console.log(`[Vercel Serverless Email] Sending transmission to ${toEmail} (isWelcome: ${Boolean(isWelcome)})`);

      const attachments = [];

      if (pdfBase64) {
        attachments.push({
          filename: `${invoiceNumber || 'Official-Receipt'}.pdf`,
          content: pdfBase64.replace(/^data:application\/pdf;filename=.+;base64,/, '').replace(/^data:application\/pdf;base64,/, ''),
          encoding: 'base64',
        });
      }

      if (manualBase64) {
        attachments.push({
          filename: 'PhantomLead-Installation-Manual.pdf',
          content: manualBase64.replace(/^data:application\/pdf;filename=.+;base64,/, '').replace(/^data:application\/pdf;base64,/, ''),
          encoding: 'base64',
        });
      }

      let emailSubject = `[INVOICE ${invoiceNumber}] Official Receipt & Setup Manual - PhantomLead`;
      let htmlContent = '';

      if (isWelcome) {
        emailSubject = `Welcome to PhantomLead - Account Initialized & Protocol Guidelines`;
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { margin: 0; padding: 0; background-color: #07090e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e2e8f0; }
              .wrapper { max-width: 600px; margin: 30px auto; background-color: #0d111a; border: 1px solid #1a2333; border-radius: 8px; overflow: hidden; }
              .header-bar { height: 4px; background: #00ffff; }
              .content { padding: 32px; }
              .brand { font-size: 24px; font-weight: 800; color: #00ffff; letter-spacing: 1px; margin-bottom: 4px; }
              .tagline { font-size: 11px; color: #64748b; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 24px; }
              .status-badge { display: inline-block; padding: 6px 14px; background: rgba(0, 255, 255, 0.1); border: 1px solid #00ffff; border-radius: 4px; color: #00ffff; font-size: 12px; font-weight: 700; margin-bottom: 20px; }
              .footer { padding: 20px 32px; background: #090c14; border-top: 1px solid #1a2333; font-size: 12px; color: #64748b; text-align: center; }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="header-bar"></div>
              <div class="content">
                <div class="brand">PHANTOMLEAD</div>
                <div class="tagline">Official Access &amp; Session Initialized</div>
                
                <div class="status-badge">ACCOUNT ONLINE &bull; READY</div>

                <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                  Hello <strong>${toName || 'Candidate'}</strong>,<br/>
                  Welcome to the <strong>PhantomLead Examination Workstation</strong> platform. Your account session has been initialized.
                </p>

                <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
                  From your student portal, you can select customized package bundles for automated LMS multiple-choice questions, oral viva explainer paragraph generators, and coding assistants (Java, Python 3, C).
                </p>

                <p style="font-size: 13px; color: #64748b;">
                  If you have already submitted proof of payment, your license key and installation manual PDF will be emailed to you immediately upon Admin verification.
                </p>
              </div>
              <div class="footer">
                &copy; ${new Date().getFullYear()} PhantomLead Security Platforms. support@phantomlead.com
              </div>
            </div>
          </body>
          </html>
        `;
      } else {
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { margin: 0; padding: 0; background-color: #07090e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e2e8f0; }
              .wrapper { max-width: 600px; margin: 30px auto; background-color: #0d111a; border: 1px solid #1a2333; border-radius: 8px; overflow: hidden; }
              .header-bar { height: 4px; background: #00ffff; }
              .content { padding: 32px; }
              .brand { font-size: 24px; font-weight: 800; color: #00ffff; letter-spacing: 1px; margin-bottom: 4px; }
              .tagline { font-size: 11px; color: #64748b; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 24px; }
              .status-badge { display: inline-block; padding: 6px 14px; background: rgba(0, 255, 255, 0.1); border: 1px solid #00ffff; border-radius: 4px; color: #00ffff; font-size: 12px; font-weight: 700; margin-bottom: 20px; }
              .card { background: #131926; border: 1px solid #1e293b; border-radius: 6px; padding: 20px; margin-bottom: 20px; }
              .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
              .label { color: #94a3b8; }
              .val { color: #ffffff; font-weight: 600; text-align: right; }
              .cyan-val { color: #00ffff; font-weight: 700; }
              .divider { height: 1px; background: #1e293b; margin: 15px 0; }
              .key-box { background: #080d16; border: 1px solid #00ffff; border-radius: 6px; padding: 14px; margin-top: 15px; font-family: monospace; font-size: 14px; color: #00ffff; text-align: center; word-break: break-all; }
              .footer { padding: 20px 32px; background: #090c14; border-top: 1px solid #1a2333; font-size: 12px; color: #64748b; text-align: center; }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="header-bar"></div>
              <div class="content">
                <div class="brand">PHANTOMLEAD</div>
                <div class="tagline">Official Billing &amp; Entitlement Notification</div>
                
                <div class="status-badge">PAYMENT APPROVED &bull; LICENSE ISSUED</div>

                <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                  Hello <strong>${toName || 'Valued Client'}</strong>,<br/>
                  Your payment for <strong>${packageName}</strong> has been <strong>approved</strong>. Your cryptographic license key and complete installation guide have been generated.
                </p>

                <div class="card">
                  <div class="row">
                    <span class="label">Invoice No:</span>
                    <span class="val">${invoiceNumber}</span>
                  </div>
                  <div class="row">
                    <span class="label">Transaction Ref / UTR:</span>
                    <span class="val">${transactionRef || 'VERIFIED'}</span>
                  </div>
                  <div class="row">
                    <span class="label">Security Package:</span>
                    <span class="val">${packageName}</span>
                  </div>
                  <div class="divider"></div>
                  <div class="row" style="font-size: 16px;">
                    <span class="label" style="color: #ffffff; font-weight: bold;">Amount Paid:</span>
                    <span class="cyan-val">${currency} ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>

                  ${licenseKey ? `
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 14px; text-transform: uppercase; font-weight: bold;">Cryptographic License Key (Copy into Installer):</div>
                    <div class="key-box">${licenseKey}</div>
                  ` : ''}
                </div>

                <!-- CRITICAL SECURITY PROTOCOLS & ANTI-TAMPER POLICY -->
                <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 6px; padding: 16px; margin: 20px 0;">
                  <div style="color: #ff4d4d; font-weight: 800; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;">
                    ⚠️ MANDATORY SECURITY RULES &amp; SYSTEM INTEGRITY POLICY
                  </div>
                  <ol style="margin: 0; padding-left: 18px; font-size: 12px; color: #fca5a5; line-height: 1.6;">
                    <li style="margin-bottom: 6px;">
                      <strong>Zero-Sharing &amp; 1-PC Lock:</strong> This license key is cryptographically bounded to your specific machine hardware upon first activation. Sharing, re-distributing, or running this key on multiple computers is strictly prohibited.
                    </li>
                    <li style="margin-bottom: 6px;">
                      <strong>Background Integrity Analysis:</strong> The Sentinel runtime conducts active integrity telemetry during examination sessions. Any attempt to modify, reverse-engineer, decompile, or violate the official installation setup guide will trigger an automated alert.
                    </li>
                    <li>
                      <strong>Immediate Revocation &amp; No Refund Policy:</strong> Any unauthorized hardware mismatch or policy violation results in <em>immediate, irreversible license revocation</em> with automatic remote host sanitization. In such events, <strong>no refunds or reinstatement will be granted</strong> under any circumstances.
                    </li>
                  </ol>
                </div>

                <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
                  <strong>2 PDF Documents Attached:</strong><br/>
                  1. 📄 <strong>Official Tax Invoice &amp; Entitlement Receipt</strong><br/>
                  2. 📘 <strong>PhantomLead Installation Manual &amp; SEB Setup Guide</strong>
                </p>
              </div>
              <div class="footer">
                &copy; ${new Date().getFullYear()} PhantomLead Security Platforms. All rights reserved.<br/>
                Direct Dispatch &bull; support@phantomlead.com
              </div>
            </div>
          </body>
          </html>
        `;
      }

      const mailOptions = {
        from: `"PhantomLead Security Platforms" <billing-automated@phantomlead.com>`,
        replyTo: `"PhantomLead Support Desk" <support@phantomlead.com>`,
        to: toEmail,
        subject: emailSubject,
        html: htmlContent,
        attachments
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[Vercel Serverless Email SUCCESS] MessageId: ${info.messageId}`);

      return res.status(200).json({
        success: true,
        messageId: info.messageId,
        invoiceNumber,
        toEmail
      });

    } catch (err) {
      console.error('[Vercel Serverless Email ERROR]:', err);
      return res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
