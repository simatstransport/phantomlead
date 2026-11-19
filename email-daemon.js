import http from 'http';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Require nodemailer from web/node_modules
const require = createRequire(import.meta.url);
const nodemailer = require(path.join(__dirname, 'web', 'node_modules', 'nodemailer'));

const PORT = 3001;
const GMAIL_USER = process.env.GMAIL_USER || 'brokenvidplay0@gmail.com';
const GMAIL_APP_PASSWORD = (process.env.GMAIL_APP_PASSWORD || 'twjh usbh hrcz rlkn').replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'online', service: 'PhantomLead Email Billing Daemon', gmail: GMAIL_USER }));
    return;
  }

  if (req.method === 'POST' && req.url === '/api/send-invoice') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { 
          toEmail, 
          toName, 
          invoiceNumber, 
          packageName, 
          amount, 
          transactionRef, 
          pdfBase64, 
          currency = 'INR',
          isPackageUpdateAlert,
          version,
          releaseNotes,
          downloadUrl
        } = payload;

        if (!toEmail) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing toEmail in payload' }));
          return;
        }

        if (isPackageUpdateAlert) {
          const updateHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { margin: 0; padding: 0; background-color: #07090e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e2e8f0; }
                .wrapper { max-width: 600px; margin: 30px auto; background-color: #0d111a; border: 1px solid #1a2333; border-radius: 8px; overflow: hidden; }
                .header-bar { height: 4px; background: #00ffff; }
                .content { padding: 32px; }
                .brand { font-size: 22px; font-weight: 800; color: #00ffff; letter-spacing: 1px; }
                .status-badge { display: inline-block; padding: 6px 14px; background: rgba(0, 255, 255, 0.1); border: 1px solid #00ffff; border-radius: 4px; color: #00ffff; font-size: 12px; font-weight: 700; margin: 16px 0; }
                .card { background: #131926; border: 1px solid #1e293b; border-radius: 6px; padding: 20px; margin-bottom: 20px; }
                .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
                .label { color: #94a3b8; }
                .val { color: #ffffff; font-weight: 600; text-align: right; }
                .cyan-val { color: #00ffff; font-weight: 700; }
                .highlights-box { background: rgba(0, 255, 255, 0.05); border: 1px solid rgba(0, 255, 255, 0.2); border-radius: 6px; padding: 16px; margin: 20px 0; }
                .btn { display: inline-block; padding: 12px 24px; background: #00ffff; color: #000000; font-weight: 800; text-decoration: none; border-radius: 6px; font-size: 14px; letter-spacing: 0.5px; }
                .footer { padding: 18px 32px; background: #090c14; border-top: 1px solid #1a2333; font-size: 11px; color: #64748b; text-align: center; }
              </style>
            </head>
            <body>
              <div class="wrapper">
                <div class="header-bar"></div>
                <div class="content">
                  <div class="brand">PHANTOMLEAD SYSTEM RELEASE SENTINEL</div>
                  <div class="status-badge">🚀 SOFTWARE UPDATE RELEASED &bull; v${version || '2.0.0'}</div>

                  <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">
                    Hello <strong>${toName || 'Valued Candidate'}</strong>,<br/>
                    An official software update (<strong>v${version || '2.0.0'}</strong>) has been deployed for your active <strong>${packageName || 'PhantomLead Security Suite'}</strong> package.
                  </p>

                  <div class="card">
                    <div class="row">
                      <span class="label">Software Package:</span>
                      <span class="val">${packageName || 'Security Workstation'}</span>
                    </div>
                    <div class="row">
                      <span class="label">Release Version:</span>
                      <span class="cyan-val">v${version || '2.0.0'}</span>
                    </div>
                    <div class="row">
                      <span class="label">License Status:</span>
                      <span class="val" style="color: #10b981; font-weight: bold;">ACTIVE &bull; 100% ELIGIBLE FOR UPDATE</span>
                    </div>
                  </div>

                  <div class="highlights-box">
                    <div style="font-size: 12px; font-weight: bold; color: #00ffff; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
                      ⚡ What's New in This Release:
                    </div>
                    <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #e2e8f0; line-height: 1.7;">
                      ${releaseNotes ? `<li>${releaseNotes.replace(/\n/g, '<br/>')}</li>` : `
                      <li><strong>New LMS Skill Assess Helper:</strong> Seamless multi-question assessment solver with instant automated keyboard shortcut <code>Ctrl+U</code>.</li>
                      <li><strong>SEB 3.10.x Compatibility:</strong> Updated integrity signatures and zero-detection background whitelist verification.</li>
                      <li><strong>AI Engine Optimization:</strong> Low latency Gemini AI reasoning engine with enhanced code and viva answer generation.</li>
                      <li><strong>Zero Data Loss Upgrade:</strong> Seamless in-place upgrade — keep your existing machine binding and license key without re-registration.</li>
                      `}
                    </ul>
                  </div>

                  <div style="text-align: center; margin: 28px 0 16px;">
                    <a href="${downloadUrl || 'https://myphantolead.vercel.app/dashboard/licenses'}" class="btn">
                      Access Dashboard &amp; Download Update &rarr;
                    </a>
                  </div>
                </div>
                <div class="footer">
                  &copy; ${new Date().getFullYear()} PhantomLead Security Platforms &bull; Central Release Sentinel<br/>
                  Automated Release Notification &bull; support@phantomlead.com
                </div>
              </div>
            </body>
            </html>
          `;

          const info = await transporter.sendMail({
            from: `"PhantomLead Release Sentinel" <${GMAIL_USER}>`,
            replyTo: `"PhantomLead Support Desk" <support@phantomlead.com>`,
            to: toEmail,
            subject: `[UPDATE AVAILABLE] Version v${version} Released for ${packageName} - PhantomLead`,
            html: updateHtml,
          });

          console.log(`[PhantomLead Email Daemon] Dispatched update email for ${packageName} v${version} to ${toEmail} (MessageId: ${info.messageId})`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, messageId: info.messageId, toEmail }));
          return;
        }

        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { margin: 0; padding: 0; background-color: #07090e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; }
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
              .footer { padding: 20px 32px; background: #090c14; border-top: 1px solid #1a2333; font-size: 12px; color: #64748b; text-align: center; }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="header-bar"></div>
              <div class="content">
                <div class="brand">PHANTOMLEAD</div>
                <div class="tagline">Official Billing & Entitlement Notification</div>
                
                <div class="status-badge">PAYMENT VERIFIED & CLEARED</div>

                <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                  Hello <strong>${toName || 'Valued Client'}</strong>,<br/>
                  Your transaction for <strong>${packageName}</strong> has been approved. Your official billing invoice and software entitlement receipt is attached.
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
                </div>

                <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
                  The digitally signed PDF receipt is attached. You can also view and download all active software license keys from your secure PhantomLead Dashboard.
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

        const mailOptions = {
          from: `"PhantomLead Billing" <${GMAIL_USER}>`,
          to: toEmail,
          subject: `[INVOICE ${invoiceNumber}] Official Receipt - PhantomLead Security Platforms`,
          html: htmlContent,
          attachments: pdfBase64 ? [
            {
              filename: `${invoiceNumber}.pdf`,
              content: pdfBase64.replace(/^data:application\/pdf;filename=.+;base64,/, '').replace(/^data:application\/pdf;base64,/, ''),
              encoding: 'base64',
            }
          ] : []
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[PhantomLead Email Daemon] Dispatched invoice ${invoiceNumber} to ${toEmail} (MessageId: ${info.messageId})`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, messageId: info.messageId, invoiceNumber }));

      } catch (err) {
        console.error('[PhantomLead Email Daemon Error]', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, () => {
  console.log(`[PhantomLead Daemon] Email Billing API online at http://localhost:${PORT}`);
});
