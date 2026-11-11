import http from 'http';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
const nodemailer = require(path.join(__dirname, 'web', 'node_modules', 'nodemailer'));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://wgxxitydatuoyjnxuvqw.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndneHhpdHlkYXR1b3lqbnh1dnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0Mzc0NDEsImV4cCI6MjEwNzAxMzQ0MX0.fGbnNvfFNOpbVUb1KzaxUF_2PBarovyX3pU58HVEoA0';
const GMAIL_USER = process.env.GMAIL_USER || 'brokenvidplay0@gmail.com';
const GMAIL_APP_PASSWORD = (process.env.GMAIL_APP_PASSWORD || 'uyfc tvol tsfc kwob').replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

/**
 * Dispatches an automated expiration notification email to the customer
 */
async function sendExpiryEmail(toEmail, toName, packageName) {
  if (!toEmail) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { margin: 0; padding: 0; background-color: #07090e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e2e8f0; }
        .wrapper { max-width: 600px; margin: 30px auto; background-color: #0d111a; border: 1px solid #1a2333; border-radius: 8px; overflow: hidden; }
        .header-bar { height: 4px; background: #ff2a2b; }
        .content { padding: 32px; }
        .brand { font-size: 24px; font-weight: 800; color: #ff2a2b; letter-spacing: 1px; margin-bottom: 4px; }
        .tagline { font-size: 11px; color: #64748b; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 24px; }
        .status-badge { display: inline-block; padding: 6px 14px; background: rgba(255, 42, 43, 0.1); border: 1px solid #ff2a2b; border-radius: 4px; color: #ff2a2b; font-size: 12px; font-weight: 700; margin-bottom: 20px; }
        .card { background: #131926; border: 1px solid #1e293b; border-radius: 6px; padding: 20px; margin-bottom: 20px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
        .label { color: #94a3b8; }
        .val { color: #ffffff; font-weight: 600; text-align: right; }
        .btn { display: inline-block; padding: 12px 24px; background: #00ffff; color: #000000; font-weight: 700; font-size: 14px; text-decoration: none; border-radius: 6px; margin-top: 10px; }
        .footer { padding: 20px 32px; background: #090c14; border-top: 1px solid #1a2333; font-size: 12px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header-bar"></div>
        <div class="content">
          <div class="brand">PHANTOMLEAD</div>
          <div class="tagline">Automated Sentinel Fleet Notification</div>
          
          <div class="status-badge">LICENSE PERIOD CONCLUDED</div>

          <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1;">
            Hello <strong>${toName || 'Client'}</strong>,<br/>
            Your software entitlement duration for <strong>${packageName || 'Exam Workstation'}</strong> has officially expired.
          </p>

          <div class="card">
            <div class="row">
              <span class="label">Product / Edition:</span>
              <span class="val">${packageName || 'Security Suite'}</span>
            </div>
            <div class="row">
              <span class="label">Hardware Binding:</span>
              <span class="val" style="color: #00ffff;">Unlocked & Freed</span>
            </div>
            <div class="row">
              <span class="label">Status:</span>
              <span class="val" style="color: #ff2a2b;">REVOKED / EXPIRED</span>
            </div>
          </div>

          <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
            Your previous device hardware lock has been disengaged automatically. If you require continued access or renewal for upcoming examination tests, you may re-subscribe directly from your portal:
          </p>

          <p style="text-align: center;">
            <a href="https://phantomlead.com/dashboard/packages" class="btn">Renew License &rarr;</a>
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} PhantomLead Security Platforms. Automated Expiration Dispatch.<br/>
          support@phantomlead.com
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"PhantomLead Expiration Daemon" <${GMAIL_USER}>`,
      to: toEmail,
      subject: `[NOTICE] License Duration Expired - PhantomLead Workstation`,
      html,
    });
    console.log(`[Timebomb Daemon] Sent expiration notice to ${toEmail}`);
  } catch (err) {
    console.error(`[Timebomb Daemon] Email error for ${toEmail}:`, err.message);
  }
}

/**
 * Sweeps expired licenses from Supabase REST API
 */
export async function runTimebombSweep() {
  console.log(`[Timebomb Daemon] Initiating expiration scan at ${new Date().toISOString()}...`);
  try {
    const nowIso = new Date().toISOString();
    const queryUrl = `${SUPABASE_URL}/rest/v1/licenses?status=eq.ACTIVE&expires_at=lte.${encodeURIComponent(nowIso)}&select=id,expires_at,device_id,customers(full_name,email),packages(package_name)`;

    const res = await fetch(queryUrl, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!res.ok) {
      console.warn('[Timebomb Daemon] Query returned status:', res.status);
      return { swept: 0 };
    }

    const expiredList = await res.json();
    console.log(`[Timebomb Daemon] Discovered ${expiredList.length} expired license(s).`);

    for (const lic of expiredList) {
      const custEmail = lic.customers?.email;
      const custName = lic.customers?.full_name;
      const pkgName = lic.packages?.package_name;

      // Update license status to EXPIRED and unbind device
      await fetch(`${SUPABASE_URL}/rest/v1/licenses?id=eq.${lic.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          status: 'EXPIRED',
          device_id: null,
          expired_at: nowIso,
          expiration_notified: true,
        }),
      });

      // Remove device binding if present
      if (lic.device_id) {
        await fetch(`${SUPABASE_URL}/rest/v1/devices?id=eq.${lic.device_id}`, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }).catch(() => null);
      }

      // Dispatch expiration notice email
      if (custEmail) {
        await sendExpiryEmail(custEmail, custName, pkgName);
      }
    }

    return { swept: expiredList.length };
  } catch (err) {
    console.error('[Timebomb Daemon Sweep Error]:', err.message);
    return { error: err.message };
  }
}

// If invoked as standalone daemon: sweep every 60 seconds
if (process.argv.includes('--daemon')) {
  console.log('[Timebomb Daemon] Standalone background worker online. Polling interval: 60s');
  setInterval(runTimebombSweep, 60000);
  runTimebombSweep();
}
