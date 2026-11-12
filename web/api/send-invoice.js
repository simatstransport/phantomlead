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
  // Production CORS Hardening
  const allowedOrigins = [
    'https://myphantolead.vercel.app',
    'https://phantomlead.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    // If request comes from another subdomain on vercel.app
    if (origin.endsWith('.vercel.app')) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Hardened Security Headers on API responses
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health check endpoint (information disclosure minimized)
  if (req.method === 'GET') {
    try {
      await transporter.verify();
      return res.status(200).json({ 
        status: 'online', 
        service: 'PhantomLead Vercel Serverless Email Engine',
        smtp_verified: true
      });
    } catch (verifyErr) {
      return res.status(500).json({
        status: 'error',
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
        packageCode,
        amount, 
        transactionRef, 
        pdfBase64, 
        manualBase64,
        licenseKey,
        isWelcome,
        isExtension,
        extendedDays,
        newExpiry,
        isNewUserAlert,
        candidateEmail,
        candidateName,
        collegeName,
        academicYear,
        timestamp,
        // UTR Submission Alert to Admin
        isUtrSubmissionAlert,
        utrNumber,
        packageNameSubmitted,
        amountSubmitted,
        customerPhone,
        // License Revocation / Deletion Alert to Customer
        isRevocationNotice,
        isDeletionNotice,
        currency = 'INR' 
      } = req.body;

      // 1. Handle Admin Alert: Candidate Submitted Payment UTR Slip
      if (isUtrSubmissionAlert) {
        console.log(`[Admin Alert] Payment submitted: ${candidateEmail} - UTR: ${utrNumber}`);
        const utrHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { margin: 0; padding: 0; background-color: #07090e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e2e8f0; }
              .wrapper { max-width: 600px; margin: 30px auto; background-color: #0d111a; border: 1px solid #1a2333; border-radius: 8px; overflow: hidden; }
              .header-bar { height: 4px; background: #f59e0b; }
              .content { padding: 32px; }
              .brand { font-size: 22px; font-weight: 800; color: #f59e0b; letter-spacing: 1px; }
              .status-badge { display: inline-block; padding: 6px 14px; background: rgba(245, 158, 11, 0.1); border: 1px solid #f59e0b; border-radius: 4px; color: #f59e0b; font-size: 12px; font-weight: 700; margin: 16px 0; }
              .card { background: #131926; border: 1px solid #1e293b; border-radius: 6px; padding: 20px; }
              .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
              .label { color: #94a3b8; }
              .val { color: #ffffff; font-weight: 600; text-align: right; }
              .amber-val { color: #f59e0b; font-weight: 700; font-family: monospace; font-size: 15px; }
              .cyan-val { color: #00ffff; font-weight: 700; }
              .btn { display: inline-block; padding: 10px 20px; background: #f59e0b; color: #000; font-weight: bold; text-decoration: none; border-radius: 6px; font-size: 13px; margin-top: 15px; }
              .footer { padding: 18px 32px; background: #090c14; border-top: 1px solid #1a2333; font-size: 11px; color: #64748b; text-align: center; }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="header-bar"></div>
              <div class="content">
                <div class="brand">PHANTOMLEAD CLEARING DESK</div>
                <div class="status-badge">⚡ INCOMING PAYMENT SUBMISSION (PENDING REVIEW)</div>

                <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">
                  A candidate has submitted their UPI payment reference slip and is awaiting admin approval:
                </p>

                <div class="card">
                  <div class="row">
                    <span class="label">Candidate Name:</span>
                    <span class="val">${candidateName || 'Verified Candidate'}</span>
                  </div>
                  <div class="row">
                    <span class="label">Email Address:</span>
                    <span class="val">${candidateEmail}</span>
                  </div>
                  ${customerPhone ? `
                  <div class="row">
                    <span class="label">Phone / Contact:</span>
                    <span class="val">${customerPhone}</span>
                  </div>
                  ` : ''}
                  <div class="row">
                    <span class="label">Package Requested:</span>
                    <span class="cyan-val">${packageNameSubmitted || 'Security Suite'}</span>
                  </div>
                  <div class="row">
                    <span class="label">Amount Transferred:</span>
                    <span class="val" style="color: #10b981; font-weight: bold; font-size: 16px;">INR ${Number(amountSubmitted || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div style="height: 1px; background: #1e293b; margin: 12px 0;"></div>
                  <div class="row">
                    <span class="label" style="color: #f59e0b; font-weight: bold;">Submitted UTR / Ref:</span>
                    <span class="amber-val">${utrNumber}</span>
                  </div>
                </div>

                <div style="text-align: center;">
                  <a href="https://myphantolead.vercel.app/admin/payments" class="btn">Open Admin Payments to Approve &rarr;</a>
                </div>
              </div>
              <div class="footer">
                PhantomLead Automated Merchant Clearing System
              </div>
            </div>
          </body>
          </html>
        `;

        await transporter.sendMail({
          from: `"PhantomLead Clearing" <${GMAIL_USER}>`,
          to: GMAIL_USER,
          subject: `[PAYMENT PENDING] INR ${amountSubmitted} - UTR: ${utrNumber} (${candidateName || candidateEmail})`,
          html: utrHtml,
        });

        return res.status(200).json({ success: true, message: 'Admin UTR alert dispatched' });
      }

      // 2. Handle Customer Alert: License Revocation
      if (isRevocationNotice) {
        console.log(`[Customer Alert] Sending revocation notice to: ${toEmail}`);
        const revokeHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { margin: 0; padding: 0; background-color: #07090e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e2e8f0; }
              .wrapper { max-width: 600px; margin: 30px auto; background-color: #0d111a; border: 1px solid #1a2333; border-radius: 8px; overflow: hidden; }
              .header-bar { height: 4px; background: #ff2a2b; }
              .content { padding: 32px; }
              .brand { font-size: 22px; font-weight: 800; color: #ff2a2b; letter-spacing: 1px; }
              .status-badge { display: inline-block; padding: 6px 14px; background: rgba(255, 42, 43, 0.1); border: 1px solid #ff2a2b; border-radius: 4px; color: #ff2a2b; font-size: 12px; font-weight: 700; margin: 16px 0; }
              .card { background: #131926; border: 1px solid #1e293b; border-radius: 6px; padding: 20px; }
              .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
              .label { color: #94a3b8; }
              .val { color: #ffffff; font-weight: 600; text-align: right; }
              .red-val { color: #ff2a2b; font-weight: 700; }
              .footer { padding: 18px 32px; background: #090c14; border-top: 1px solid #1a2333; font-size: 11px; color: #64748b; text-align: center; }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="header-bar"></div>
              <div class="content">
                <div class="brand">PHANTOMLEAD SECURITY SENTINEL</div>
                <div class="status-badge">🛑 LICENSE STATUS: REVOKED</div>

                <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">
                  Hello <strong>${toName || 'Candidate'}</strong>,<br/>
                  This is an official administrative notice that your license clearance for <strong>${packageName || 'PhantomLead Workstation'}</strong> has been <strong>revoked</strong>.
                </p>

                <div class="card">
                  <div class="row">
                    <span class="label">Software Bundle:</span>
                    <span class="val">${packageName || 'Security Workstation'}</span>
                  </div>
                  <div class="row">
                    <span class="label">Hardware Node Lock:</span>
                    <span class="val" style="color: #00ffff;">Disengaged & Cleared</span>
                  </div>
                  <div class="row">
                    <span class="label">Clearance Status:</span>
                    <span class="red-val">TERMINATED / REVOKED</span>
                  </div>
                </div>

                <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin-top: 16px;">
                  Your previous PC machine binding has been unlocked. If you believe this action was taken in error or if you wish to appeal or acquire a new pass, please contact our support desk:
                </p>
                <p style="font-size: 13px; color: #00ffff; font-family: monospace;">
                  Support: support@phantomlead.com
                </p>
              </div>
              <div class="footer">
                PhantomLead Security Platforms &bull; Central Identity Dispatch
              </div>
            </div>
          </body>
          </html>
        `;

        await transporter.sendMail({
          from: `"PhantomLead Security Platforms" <billing-automated@phantomlead.com>`,
          replyTo: `"PhantomLead Support Desk" <support@phantomlead.com>`,
          to: toEmail,
          subject: `[NOTICE] License Revocation Notice - PhantomLead Workstation`,
          html: revokeHtml,
        });

        return res.status(200).json({ success: true, message: 'Revocation notice delivered' });
      }

      // 3. Handle Customer Alert: License Deletion / Account Reset
      if (isDeletionNotice) {
        console.log(`[Customer Alert] Sending deletion reset notice to: ${toEmail}`);
        const deleteHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { margin: 0; padding: 0; background-color: #07090e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e2e8f0; }
              .wrapper { max-width: 600px; margin: 30px auto; background-color: #0d111a; border: 1px solid #1a2333; border-radius: 8px; overflow: hidden; }
              .header-bar { height: 4px; background: #64748b; }
              .content { padding: 32px; }
              .brand { font-size: 22px; font-weight: 800; color: #00ffff; letter-spacing: 1px; }
              .status-badge { display: inline-block; padding: 6px 14px; background: rgba(100, 116, 139, 0.15); border: 1px solid #64748b; border-radius: 4px; color: #cbd5e1; font-size: 12px; font-weight: 700; margin: 16px 0; }
              .card { background: #131926; border: 1px solid #1e293b; border-radius: 6px; padding: 20px; }
              .footer { padding: 18px 32px; background: #090c14; border-top: 1px solid #1a2333; font-size: 11px; color: #64748b; text-align: center; }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="header-bar"></div>
              <div class="content">
                <div class="brand">PHANTOMLEAD PLATFORMS</div>
                <div class="status-badge">ACCOUNT STATUS: RESET &bull; 100% FRESH</div>

                <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">
                  Hello <strong>${toName || 'Candidate'}</strong>,<br/>
                  Your previous license profile and associated hardware bindings have been <strong>deleted and reset</strong> by the administrator.
                </p>

                <div class="card">
                  <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 0;">
                    Your account has been restored to a clean, fresh state. You are now free to select a new software package or submit a fresh enrollment without previous hardware conflicts.
                  </p>
                </div>

                <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin-top: 16px;">
                  To select a new package, log into your student workstation portal anytime:
                </p>
                <p style="text-align: center;">
                  <a href="https://myphantolead.vercel.app/dashboard/packages" style="display: inline-block; padding: 10px 20px; background: #00ffff; color: #000; font-weight: bold; text-decoration: none; border-radius: 6px; font-size: 13px;">View Available Packages &rarr;</a>
                </p>
              </div>
              <div class="footer">
                PhantomLead Security Platforms &bull; support@phantomlead.com
              </div>
            </div>
          </body>
          </html>
        `;

        await transporter.sendMail({
          from: `"PhantomLead Security Platforms" <billing-automated@phantomlead.com>`,
          replyTo: `"PhantomLead Support Desk" <support@phantomlead.com>`,
          to: toEmail,
          subject: `[ACCOUNT UPDATE] Your License Profile Has Been Reset - PhantomLead`,
          html: deleteHtml,
        });

        return res.status(200).json({ success: true, message: 'Deletion notice delivered' });
      }

      // Handle Admin New User Enrollment Alert
      if (isNewUserAlert) {
        console.log(`[Admin Alert] New candidate enrolled: ${candidateEmail}`);
        const alertHtml = `
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
              .card { background: #131926; border: 1px solid #1e293b; border-radius: 6px; padding: 20px; }
              .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
              .label { color: #94a3b8; }
              .val { color: #ffffff; font-weight: 600; text-align: right; }
              .cyan-val { color: #00ffff; font-weight: 700; }
              .footer { padding: 18px 32px; background: #090c14; border-top: 1px solid #1a2333; font-size: 11px; color: #64748b; text-align: center; }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="header-bar"></div>
              <div class="content">
                <div class="brand">PHANTOMLEAD SENTINEL</div>
                <div class="status-badge">● NEW CANDIDATE ENROLLMENT ALERT</div>

                <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">
                  An incoming student has just completed their initial platform registration and verified their profile details:
                </p>

                <div class="card">
                  <div class="row">
                    <span class="label">Candidate Name:</span>
                    <span class="cyan-val">${candidateName || 'Not specified'}</span>
                  </div>
                  <div class="row">
                    <span class="label">Google / Auth Email:</span>
                    <span class="val">${candidateEmail}</span>
                  </div>
                  <div class="row">
                    <span class="label">College / Institute:</span>
                    <span class="val">${collegeName || 'Not specified'}</span>
                  </div>
                  <div class="row">
                    <span class="label">Academic Year / Batch:</span>
                    <span class="val">${academicYear || 'Not specified'}</span>
                  </div>
                  <div class="row">
                    <span class="label">Enrolled At:</span>
                    <span class="val" style="color: #94a3b8; font-size: 12px;">${timestamp || new Date().toISOString()}</span>
                  </div>
                </div>

                <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
                  This is a single-time automated briefing dispatched only upon first-time profile submission. No routine login alerts are sent.
                </p>
              </div>
              <div class="footer">
                PhantomLead Security Telemetry &bull; Admin Incident Protocol
              </div>
            </div>
          </body>
          </html>
        `;

        await transporter.sendMail({
          from: `"PhantomLead Telemetry" <${GMAIL_USER}>`,
          to: GMAIL_USER,
          subject: `[ALERT] New Candidate Enrolled: ${candidateName} (${candidateEmail})`,
          html: alertHtml,
        });

        return res.status(200).json({ success: true, message: 'Admin alert dispatched' });
      }

      if (!toEmail) {
        return res.status(400).json({ error: 'toEmail is required in payload' });
      }

      console.log(`[Vercel Serverless Email] Sending transmission to ${toEmail} (isWelcome: ${Boolean(isWelcome)}, isExtension: ${Boolean(isExtension)})`);

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

      if (isExtension) {
        emailSubject = `[OFFICIAL NOTICE] License Extension Granted (+${extendedDays || 1} Days) - PhantomLead`;
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
              .footer { padding: 20px 32px; background: #090c14; border-top: 1px solid #1a2333; font-size: 12px; color: #64748b; text-align: center; }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="header-bar"></div>
              <div class="content">
                <div class="brand">PHANTOMLEAD</div>
                <div class="tagline">Official License Lifecycle Management</div>
                
                <div class="status-badge">TIME EXTENSION APPROVED &bull; ACTIVE</div>

                <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                  Hello <strong>${toName || 'Candidate'}</strong>,<br/>
                  Your administrator has granted an official validity time extension for your <strong>PhantomLead Workstation</strong> license.
                </p>

                <div class="card">
                  <div class="row">
                    <span class="label">Extension Granted:</span>
                    <span class="cyan-val">+${extendedDays || 1} Day(s) Extra Access</span>
                  </div>
                  <div class="row">
                    <span class="label">New Expiration Window:</span>
                    <span class="val">${newExpiry || 'Updated in Portal'}</span>
                  </div>
                  <div class="divider"></div>
                  <div class="row">
                    <span class="label">Software Status:</span>
                    <span class="val" style="color: #10b981; font-weight: bold;">ACTIVE &bull; CONTINUOUS CLEARANCE</span>
                  </div>
                </div>

                <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
                  You do not need to generate a new key or re-install the software. Your existing machine binding and license key will remain authorized through this new expiration timestamp.
                </p>
              </div>
              <div class="footer">
                &copy; ${new Date().getFullYear()} PhantomLead Security Platforms. support@phantomlead.com
              </div>
            </div>
          </body>
          </html>
        `;
      } else if (isWelcome) {
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

                <!-- PLAN-SPECIFIC TOOL SHORTCUTS & USAGE INSTRUCTIONS -->
                ${(() => {
                  const code = (packageCode || packageName || '').toUpperCase();
                  const showMcq = code.includes('MCQ') || code.includes('QA') || code.includes('FULL') || !code;
                  const showReasoning = code.includes('REASONING') || code.includes('PLACEMENT') || code.includes('FULL');
                  const showJava = code.includes('JAVA') || code.includes('FULL') || !code;
                  const showViva = code.includes('VIVA') || code.includes('JAVA') || code.includes('FULL') || !code;
                  const showC = code.includes('C_') || code.includes('PYTHON_C') || (code.includes('C') && !code.includes('MCQ')) || code.includes('FULL');
                  const showPython = code.includes('PYTHON') || code.includes('FULL');

                  return `
                    <div style="background: #0f172a; border: 1px solid #00ffff; border-radius: 8px; padding: 20px; margin: 24px 0;">
                      <div style="color: #00ffff; font-weight: 800; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; display: flex; align-items: center;">
                        ⚡ OPERATING INSTRUCTIONS FOR YOUR PLAN: ${packageName || 'ASSISTANT SUITE'}
                      </div>
                      <p style="font-size: 12px; color: #94a3b8; margin: 0 0 16px 0;">
                        Open <strong>Safe Exam Browser (SEB v3.10.2)</strong>. Only the tools included in your active plan below will trigger:
                      </p>

                      <div style="display: flex; flex-direction: column; gap: 14px;">
                        ${showMcq ? `
                          <div style="background: rgba(59, 130, 246, 0.08); border-left: 3px solid #3b82f6; padding: 12px 14px; border-radius: 4px;">
                            <div style="font-size: 13px; font-weight: bold; color: #60a5fa; margin-bottom: 4px;">
                              🎯 1. LMS MCQ Helper &bull; <code style="background: #1e293b; color: #93c5fd; padding: 2px 6px; border-radius: 4px;">Ctrl + J</code> (or <code style="background: #1e293b; color: #93c5fd; padding: 2px 6px; border-radius: 4px;">Ctrl + I</code> / F8)
                            </div>
                            <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5;">
                              &bull; After attempting a quiz question, press <strong>Ctrl + J</strong> once.<br/>
                              &bull; The assistant automatically analyzes options and selects the correct answer.<br/>
                              &bull; <strong>Continuous Execution:</strong> When you click "Next", you do NOT need to press Ctrl + J again! It runs continuously once triggered.
                            </div>
                          </div>
                        ` : ''}

                        ${showReasoning ? `
                          <div style="background: rgba(6, 182, 212, 0.08); border-left: 3px solid #06b6d4; padding: 12px 14px; border-radius: 4px;">
                            <div style="font-size: 13px; font-weight: bold; color: #22d3ee; margin-bottom: 4px;">
                              🧩 2. LMS Reasoning MCQ Helper &bull; <code style="background: #1e293b; color: #67e8f9; padding: 2px 6px; border-radius: 4px;">Ctrl + I</code>
                            </div>
                            <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5;">
                              &bull; Designed for visual patterns, analytical sequences, and deduction questions.<br/>
                              &bull; Press <strong>Ctrl + I</strong> to solve and lock deduction radio choices.
                            </div>
                          </div>
                        ` : ''}

                        ${showJava ? `
                          <div style="background: rgba(168, 85, 247, 0.08); border-left: 3px solid #a855f7; padding: 12px 14px; border-radius: 4px;">
                            <div style="font-size: 13px; font-weight: bold; color: #c084fc; margin-bottom: 4px;">
                              ☕ 3. Java Coding Helper &bull; <code style="background: #1e293b; color: #d8b4fe; padding: 2px 6px; border-radius: 4px;">Ctrl + K</code> (or F10)
                            </div>
                            <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5;">
                              &bull; Place your mouse cursor inside the <strong>Question area</strong> (NOT in the code sandbox editor).<br/>
                              &bull; Press <strong>Ctrl + K</strong>. A pop-up HUD overlay appears in the bottom-right corner.<br/>
                              &bull; Click <strong>"Replace Code"</strong>: it will automatically inject the complete solution into the code sandbox.<br/>
                              &bull; <strong>Auto-Correction:</strong> If compiler errors or test fails occur, press Ctrl + K again and click <strong>"Regenerate Code"</strong> for the corrected version.
                            </div>
                          </div>
                        ` : ''}

                        ${showViva ? `
                          <div style="background: rgba(236, 72, 153, 0.08); border-left: 3px solid #ec4899; padding: 12px 14px; border-radius: 4px;">
                            <div style="font-size: 13px; font-weight: bold; color: #f472b6; margin-bottom: 4px;">
                              📝 4. Java Viva Paragraph Helper &bull; <code style="background: #1e293b; color: #fbcfe8; padding: 2px 6px; border-radius: 4px;">Ctrl + L</code>
                            </div>
                            <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5;">
                              &bull; Functions identical to Java Coding, but triggers via <strong>Ctrl + L</strong>.<br/>
                              &bull; A pop-up HUD appears in the <strong>top-right</strong> corner with full theoretical and viva answers.<br/>
                              &bull; Click <strong>"Push to Sandbox"</strong> to transfer the paragraph directly into your answer editor.
                            </div>
                          </div>
                        ` : ''}

                        ${showC ? `
                          <div style="background: rgba(16, 185, 129, 0.08); border-left: 3px solid #10b981; padding: 12px 14px; border-radius: 4px;">
                            <div style="font-size: 13px; font-weight: bold; color: #34d399; margin-bottom: 4px;">
                              ⚙️ 5. C Coding Helper &bull; <code style="background: #1e293b; color: #a7f3d0; padding: 2px 6px; border-radius: 4px;">Ctrl + Y</code>
                            </div>
                            <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5;">
                              &bull; Same workflow as Java: place cursor in question description (outside sandbox).<br/>
                              &bull; Press <strong>Ctrl + Y</strong> &rarr; click <strong>"Replace Code"</strong> to inject verified C program.<br/>
                              &bull; Press <strong>Ctrl + Y</strong> again if compiler flags an error and click <strong>"Regenerate"</strong>.
                            </div>
                          </div>
                        ` : ''}

                        ${showPython ? `
                          <div style="background: rgba(16, 185, 129, 0.08); border-left: 3px solid #10b981; padding: 12px 14px; border-radius: 4px;">
                            <div style="font-size: 13px; font-weight: bold; color: #34d399; margin-bottom: 4px;">
                              🐍 6. Python 3 Coding Helper &bull; <code style="background: #1e293b; color: #a7f3d0; padding: 2px 6px; border-radius: 4px;">Ctrl + T</code>
                            </div>
                            <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5;">
                              &bull; Place cursor in question area &rarr; press <strong>Ctrl + T</strong>.<br/>
                              &bull; Pop-up HUD appears in the bottom-right &rarr; click <strong>"Replace Code"</strong> for clean, indented Python 3 scripts.<br/>
                              &bull; Press <strong>Ctrl + T</strong> again to regenerate if adjustments are needed.
                            </div>
                          </div>
                        ` : ''}
                      </div>
                    </div>
                  `;
                })()}

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
