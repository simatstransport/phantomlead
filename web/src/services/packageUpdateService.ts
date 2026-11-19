import { supabase } from './supabase';

export interface ActivePackageUser {
  licenseId: string;
  customerId: string;
  name: string;
  email: string;
  expiresAt: string | null;
  isPermanent: boolean;
  issuedAt: string;
}

export interface BroadcastUpdateParams {
  packageId: string;
  packageName: string;
  packageCode: string;
  version: string;
  releaseNotes?: string;
  targetEmails?: string[];
  onProgress?: (current: number, total: number, email: string) => void;
}

export interface BroadcastUpdateResult {
  success: boolean;
  totalFound: number;
  totalSent: number;
  failedEmails: string[];
  message: string;
}

// Determines the correct email dispatch API URL (Vercel Serverless / Local Daemon)
const getEmailApiUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return '/api/send-invoice';
  }
  return 'http://localhost:3001/api/send-invoice';
};

/**
 * Queries all valid, active, non-expired license holders for a given package.
 * Excludes revoked, expired, or blocked accounts. Deduplicates by customer email.
 */
export const fetchActiveUsersForPackage = async (packageId: string): Promise<ActivePackageUser[]> => {
  try {
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from('licenses')
      .select(`
        id,
        status,
        issued_at,
        expires_at,
        customers (id, full_name, email, status)
      `)
      .eq('package_id', packageId)
      .eq('status', 'ACTIVE')
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`);

    if (error) {
      console.error('[packageUpdateService] Error fetching active users:', error);
      throw error;
    }

    const seenEmails = new Set<string>();
    const activeUsers: ActivePackageUser[] = [];

    for (const lic of (data || [])) {
      const cust = Array.isArray(lic.customers) ? lic.customers[0] : lic.customers;
      if (!cust || !cust.email) continue;
      if (cust.status === 'BLOCKED') continue;

      const normEmail = cust.email.trim().toLowerCase();
      if (seenEmails.has(normEmail)) continue;
      seenEmails.add(normEmail);

      const isPermanent = !lic.expires_at;

      activeUsers.push({
        licenseId: lic.id,
        customerId: cust.id,
        name: cust.full_name || 'Valued Candidate',
        email: cust.email.trim(),
        expiresAt: lic.expires_at,
        isPermanent,
        issuedAt: lic.issued_at,
      });
    }

    return activeUsers;
  } catch (err) {
    console.error('[packageUpdateService] Failed to load active package users:', err);
    return [];
  }
};

/**
 * Dispatches the package update announcement email to valid active users of the package.
 */
export const broadcastPackageUpdate = async (
  params: BroadcastUpdateParams
): Promise<BroadcastUpdateResult> => {
  const { packageId, packageName, packageCode, version, releaseNotes, targetEmails, onProgress } = params;

  let recipients: { name: string; email: string }[] = [];

  if (targetEmails && targetEmails.length > 0) {
    recipients = targetEmails.map(e => ({ name: 'Admin Test Recipient', email: e.trim() }));
  } else {
    const activeUsers = await fetchActiveUsersForPackage(packageId);
    recipients = activeUsers.map(u => ({ name: u.name, email: u.email }));
  }

  if (recipients.length === 0) {
    return {
      success: true,
      totalFound: 0,
      totalSent: 0,
      failedEmails: [],
      message: 'Zero active valid license holders found for this package. No emails needed.',
    };
  }

  const apiUrl = getEmailApiUrl();
  let totalSent = 0;
  const failedEmails: string[] = [];

  for (let i = 0; i < recipients.length; i++) {
    const user = recipients[i];
    if (onProgress) {
      onProgress(i + 1, recipients.length, user.email);
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPackageUpdateAlert: true,
          toEmail: user.email,
          toName: user.name,
          packageName,
          packageCode,
          version,
          releaseNotes: releaseNotes || '',
          downloadUrl: 'https://myopphantom.vercel.app/dashboard/licenses',
        }),
      });

      const resJson = await response.json().catch(() => ({}));

      if (response.ok && resJson.success !== false) {
        totalSent++;
      } else {
        console.warn(`[packageUpdateService] Failed sending to ${user.email}:`, resJson);
        failedEmails.push(user.email);
      }
    } catch (e: any) {
      console.error(`[packageUpdateService] Network/API error sending to ${user.email}:`, e);
      failedEmails.push(user.email);
    }

    // Small delay to prevent SMTP rate-limiting
    if (i < recipients.length - 1) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  return {
    success: totalSent > 0,
    totalFound: recipients.length,
    totalSent,
    failedEmails,
    message: `Dispatched update notifications to ${totalSent} of ${recipients.length} active users.`,
  };
};
