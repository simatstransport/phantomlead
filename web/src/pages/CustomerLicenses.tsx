import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Download, Copy, Check, Clock, Calendar, ShieldCheck, Laptop, 
  AlertTriangle, Sparkles, BookOpen, Cpu, Zap, RefreshCw, HardDrive, 
  CheckCircle2, ArrowRight
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { HowItWorksCard } from '../components/HowItWorksCard';

type CustomerLicense = {
  id: string;
  status: string;
  payment_type: string;
  duration_months?: number | null;
  issued_at: string;
  expires_at: string | null;
  device_id?: string | null;
  license_key: string | null;
  packages: { package_name: string; package_code: string };
  customers: { full_name: string };
  devices?: { registered_at: string; hostname?: string | null } | { registered_at: string; hostname?: string | null }[] | null;
};

// Formats an ISO date into full readable date and time: e.g. "19 Oct 2026, 01:15:20 PM"
const formatFullDateTime = (dateStr: string | null | undefined): string | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

// Safely extracts device info from PostgREST relationship
const getDeviceData = (license: CustomerLicense): { registered_at: string; hostname?: string | null } | null => {
  if (!license.devices) return null;
  if (Array.isArray(license.devices)) {
    return license.devices[0] || null;
  }
  return license.devices;
};

// Calculates live ticking countdown with minus sign and natural language subtext
const getTimeRemaining = (expiresAt: string | null | undefined, now: number) => {
  if (!expiresAt) {
    return {
      countdownStr: '♾️ Lifetime',
      moreToExpireText: 'Permanent access (Never expires)',
      isExpired: false,
      isPermanent: true,
      urgency: 'permanent' as const,
      diffMs: Infinity,
    };
  }

  const expiryTime = new Date(expiresAt).getTime();
  const diffMs = expiryTime - now;

  if (diffMs <= 0) {
    return {
      countdownStr: '-00h : 00m : 00s',
      moreToExpireText: 'Expired (Auto-wiped)',
      isExpired: true,
      isPermanent: false,
      urgency: 'expired' as const,
      diffMs: 0,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  // Format with minus sign e.g. -01h : 14m : 23s
  let countdownStr = '';
  if (days > 0) {
    countdownStr = `-${days}d ${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`;
  } else {
    countdownStr = `-${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`;
  }

  // Natural language subtext (user requested "like 1 hour more to expire")
  let moreToExpireText = '';
  if (days > 0) {
    moreToExpireText = `${days} day${days > 1 ? 's' : ''} ${hours > 0 ? `${hours} hr ` : ''}more to expire`;
  } else if (hours > 0) {
    moreToExpireText = `${hours} hour${hours > 1 ? 's' : ''} ${minutes > 0 ? `${minutes} min ` : ''}more to expire`;
  } else if (minutes > 0) {
    moreToExpireText = `${minutes} min${minutes > 1 ? 's' : ''} ${seconds} sec more to expire`;
  } else {
    moreToExpireText = `${seconds} sec${seconds > 1 ? 's' : ''} more to expire`;
  }

  let urgency: 'normal' | 'warning' | 'critical' = 'normal';
  if (diffMs < 15 * 60 * 1000) {
    // Under 15 minutes (or 10-minute trial)
    urgency = 'critical';
  } else if (diffMs < 60 * 60 * 1000) {
    // Under 1 hour
    urgency = 'warning';
  }

  return {
    countdownStr,
    moreToExpireText,
    isExpired: false,
    isPermanent: false,
    urgency,
    diffMs,
  };
};

const getInstallerInfo = (license: CustomerLicense) => {
  let installerName = 'SecureInstaller_L.exe';
  let editionLabel = 'Lifetime Full';
  let badgeColor = 'border-sky-500/30 text-sky-400 bg-sky-500/10';

  if (license.duration_months === -10) {
    installerName = 'SecureInstaller_T.exe';
    editionLabel = '10-Min Demo Trial';
    badgeColor = 'border-amber-500/30 text-amber-400 bg-amber-500/10';
  } else if (license.duration_months && license.duration_months > 0) {
    installerName = 'SecureInstaller_T.exe';
    editionLabel = `${license.duration_months} Mo. Term`;
    badgeColor = 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10';
  } else if (license.expires_at) {
    installerName = 'SecureInstaller_T.exe';
    editionLabel = 'Time-Bomb Term';
    badgeColor = 'border-amber-500/30 text-amber-400 bg-amber-500/10';
  } else if (license.duration_months === 0) {
    installerName = 'SecureInstaller_A.exe';
    editionLabel = 'Admin Managed';
    badgeColor = 'border-purple-500/30 text-purple-400 bg-purple-500/10';
  }

  return { installerName, editionLabel, badgeColor };
};

export const CustomerLicenses = () => {
  const [licenses, setLicenses] = useState<CustomerLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [keyError, setKeyError] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live ticker updating every 1000ms
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Purge expired license records so account is 100% fresh
  const purgeExpiredLicense = async (licenseId: string) => {
    try {
      await supabase.from('installation_logs').delete().eq('license_id', licenseId);
      await supabase.from('licenses').delete().eq('id', licenseId);
    } catch (err) {
      console.warn('Auto-purge expired license error:', err);
    }
  };

  const fetchLicenses = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const { data, error: queryError } = await supabase
        .from('licenses')
        .select('id, status, payment_type, duration_months, issued_at, expires_at, device_id, packages(package_name, package_code), customers(full_name), devices(registered_at, hostname)')
        .order('issued_at', { ascending: false });

      if (queryError) {
        setError(queryError.message);
      } else {
        const now = Date.now();
        // Check for any expired licenses or revoked licenses to automatically delete
        const validLicenses: any[] = [];
        const expiredLicenses: any[] = [];

        for (const lic of (data || [])) {
          const isExpired = lic.expires_at && new Date(lic.expires_at).getTime() <= now;
          const isRevoked = lic.status === 'REVOKED' || lic.status === 'EXPIRED';

          if (isExpired || isRevoked) {
            expiredLicenses.push(lic);
          } else {
            validLicenses.push(lic);
          }
        }

        // Auto-delete expired licenses in the background so customer account is completely fresh!
        if (expiredLicenses.length > 0) {
          for (const expLic of expiredLicenses) {
            purgeExpiredLicense(expLic.id);
          }
        }

        const licenseRows = validLicenses.map(license => ({
          ...(license as any as Omit<CustomerLicense, 'license_key'>),
          license_key: null
        }));
        setLicenses(licenseRows);

        if (licenseRows.length > 0) {
          const { data: keyData, error: keyQueryError } = await supabase.functions.invoke('get-my-license-keys', { method: 'GET' });
          if (keyQueryError) {
            setKeyError('License records loaded, but activation keys are unavailable.');
          } else {
            const keys = new Map<string, string | null>((keyData?.keys || []).map((entry: { license_id: string; license_key: string | null }) => [entry.license_id, entry.license_key]));
            setLicenses(licenseRows.map(license => ({
              ...license,
              license_key: keys.get(license.id) || null
            })));
          }
        }
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  // Check if active license just expired in real-time
  useEffect(() => {
    const active = licenses.find(l => l.status === 'ACTIVE');
    if (active && active.expires_at) {
      const diff = new Date(active.expires_at).getTime() - currentTime;
      if (diff <= 0) {
        // Expired right now in front of user's eyes! Purge and reset to fresh!
        purgeExpiredLicense(active.id).then(() => {
          setLicenses([]);
        });
      }
    }
  }, [currentTime, licenses]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
          <Zap className="w-5 h-5 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
        </div>
        <p className="text-sm font-mono text-gray-400">Loading secure crypto license terminal...</p>
      </div>
    );
  }

  const activeLicense = licenses.find(license => license.status === 'ACTIVE');

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Cyber Command Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#070b14] border border-gray-800/80 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-cyan-500/5 to-transparent pointer-events-none" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              License Terminal v2.0
            </span>
            <span className="text-gray-600 text-xs">•</span>
            <span className="text-xs font-mono text-gray-400">Node-Locked DRM</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            License Command &amp; Security Station
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Real-time cryptographic key status, hardware node binding, and auto-wipe monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchLicenses(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-medium text-gray-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            title="Refresh license state"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Status'}</span>
          </button>
        </div>
      </div>

      {keyError && (
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs">
          {keyError}
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CASE 1: FRESH ACCOUNT (No active license)                                  */}
      {/* ========================================================================= */}
      {!activeLicense ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0e1610] via-[#090d0a] to-[#050706] border border-cyan-500/30 p-8 sm:p-12 shadow-[0_0_50px_rgba(6,182,212,0.1)] text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.15),transparent_70%)] pointer-events-none" />

          {/* Central Hologram Shield */}
          <div className="relative mx-auto mb-6 w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-[spin_6s_linear_infinite]" />
            <div className="absolute inset-[-8px] rounded-full border border-dashed border-cyan-400/20 animate-[spin_10s_linear_reverse_infinite]" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-sky-950/40 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.3)]">
              <Sparkles className="w-8 h-8 text-cyan-400" />
            </div>
          </div>

          {/* Fresh Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono font-bold tracking-wider uppercase mb-3">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            Account Status: 100% Fresh
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight max-w-xl mx-auto mb-3">
            Your Account is Completely Fresh &amp; Ready
          </h2>

          <p className="text-sm text-gray-300 max-w-2xl mx-auto leading-relaxed mb-8">
            No active or expired licenses are currently attached to this account. All previous exam configurations and machine bindings have been completely cleared, giving you a fresh, unrestricted workstation ready for new software activation.
          </p>

          {/* 3 High-Tech Status Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8 text-left">
            <div className="bg-black/40 border border-gray-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-2 mb-2 text-cyan-400">
                <HardDrive className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-200">Hardware Slot</span>
              </div>
              <div className="text-base font-bold text-white font-mono">1/1 Slot Free</div>
              <div className="text-[11px] text-gray-400 mt-1">Ready to pair with your computer on first install</div>
            </div>

            <div className="bg-black/40 border border-gray-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-2 mb-2 text-cyan-400">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-200">Clean State</span>
              </div>
              <div className="text-base font-bold text-white font-mono">Zero Restrictions</div>
              <div className="text-[11px] text-gray-400 mt-1">No expired time-bombs or lingering locks running</div>
            </div>

            <div className="bg-black/40 border border-gray-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-2 mb-2 text-purple-400">
                <Cpu className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-200">AI Integration</span>
              </div>
              <div className="text-base font-bold text-white font-mono">Gemini 1.5 Ready</div>
              <div className="text-[11px] text-gray-400 mt-1">Instant activation upon provisioning any license</div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/dashboard/packages"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white rounded-xl font-bold text-sm shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.02] cursor-pointer"
            >
              <span>Browse Packages &amp; Activate Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/dashboard/install"
              className="inline-flex items-center gap-2 px-5 py-3.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 text-gray-300 hover:text-white rounded-xl font-medium text-sm transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>View Installation Guide</span>
            </Link>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* CASE 2: ACTIVE LICENSE (Tactical Operations Deck - NOT the usual table!)    */
        /* ========================================================================= */
        (() => {
          const { installerName, editionLabel, badgeColor } = getInstallerInfo(activeLicense);
          const deviceData = getDeviceData(activeLicense);
          const countdown = getTimeRemaining(activeLicense.expires_at, currentTime);
          const activatedFormatted = formatFullDateTime(deviceData?.registered_at);
          const expiresFormatted = formatFullDateTime(activeLicense.expires_at);

          return (
            <div className="space-y-6">
              {/* Tactical Main Card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#070c18] via-[#050811] to-[#040605] border border-cyan-500/40 p-6 sm:p-8 shadow-[0_0_35px_rgba(6,182,212,0.15)]">
                <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

                {/* Tactical Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-gray-800/80">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                      </span>
                      <span className="text-[11px] font-mono uppercase tracking-widest font-bold text-cyan-400">
                        ACTIVE STATION ARMED
                      </span>
                      <span className="text-gray-600">•</span>
                      <span className="text-xs font-mono text-gray-400">
                        {activeLicense.customers?.full_name || 'Customer'}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {activeLicense.packages?.package_name || 'Software Access Package'}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badgeColor}`}>
                      {editionLabel}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-mono bg-zinc-900 text-gray-300 border border-zinc-700">
                      [{activeLicense.packages?.package_code || 'CODE'}]
                    </span>
                  </div>
                </div>

                {/* 3 Modular Cyber Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 py-6">
                  {/* Card 1: Cryptographic License Key Vault */}
                  <div className="bg-black/50 border border-gray-800/90 rounded-2xl p-5 flex flex-col justify-between hover:border-cyan-500/40 transition-all shadow-inner">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-mono uppercase font-bold text-gray-400 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-cyan-400" /> License Key Vault
                        </span>
                        <span className="text-[10px] text-cyan-400/80 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                          Encrypted
                        </span>
                      </div>

                      {activeLicense.license_key ? (
                        <div className="bg-[#050a06] border border-cyan-900/60 rounded-xl p-3 flex flex-col gap-2">
                          <span className="text-cyan-400 font-mono font-bold text-sm sm:text-base tracking-widest select-all break-all text-center">
                            {activeLicense.license_key}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyKey(activeLicense.license_key!)}
                            className="w-full py-2 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 hover:text-white transition-all flex items-center justify-center gap-1.5 text-xs font-bold font-sans border border-cyan-800/70 cursor-pointer shadow-sm"
                          >
                            {copiedKey === activeLicense.license_key ? (
                              <>
                                <Check className="w-4 h-4 text-cyan-400" />
                                <span>Key Copied to Clipboard!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 text-cyan-400" />
                                <span>Copy License Key</span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 italic py-4 text-center">Key unavailable</div>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-3 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Paste into SecureInstaller when prompted</span>
                    </div>
                  </div>

                  {/* Card 2: Hardware Lock & Machine Radar */}
                  <div className="bg-black/50 border border-gray-800/90 rounded-2xl p-5 flex flex-col justify-between hover:border-blue-500/40 transition-all shadow-inner">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-mono uppercase font-bold text-gray-400 flex items-center gap-1.5">
                          <Laptop className="w-4 h-4 text-blue-400" /> Hardware Binding
                        </span>
                        <span className="text-[10px] text-blue-400/80 font-mono bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/50">
                          Slot 1/1
                        </span>
                      </div>

                      {activatedFormatted ? (
                        <div className="bg-[#05080c] border border-blue-900/50 rounded-xl p-3.5 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-mono text-gray-200">
                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                            <span className="text-gray-400">Activated:</span>
                            <strong className="text-white">{activatedFormatted}</strong>
                          </div>
                          {deviceData?.hostname && (
                            <div className="text-xs font-mono text-blue-300 bg-blue-950/40 px-2 py-1 rounded border border-blue-900/40 truncate">
                              💻 Host: {deviceData.hostname}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-amber-950/20 border border-amber-900/50 rounded-xl p-3.5 space-y-1.5">
                          <div className="text-amber-400 text-xs font-semibold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                            Pending First PC Setup
                          </div>
                          <div className="text-[11px] text-gray-400 leading-relaxed">
                            Will bind to your computer upon entering key in SecureInstaller
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-[11px] text-gray-400 mt-3 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Strict 1-Computer Device Lock</span>
                    </div>
                  </div>

                  {/* Card 3: Expiry Reactor & Live Countdown */}
                  <div className={`rounded-2xl p-5 flex flex-col justify-between transition-all shadow-inner border ${
                    countdown.urgency === 'critical'
                      ? 'bg-rose-950/30 border-rose-500/50'
                      : countdown.urgency === 'warning'
                      ? 'bg-amber-950/25 border-amber-500/50'
                      : 'bg-black/50 border-gray-800/90 hover:border-cyan-500/40'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-mono uppercase font-bold text-gray-400 flex items-center gap-1.5">
                          <Clock className={`w-4 h-4 ${countdown.urgency === 'critical' ? 'text-rose-400 animate-spin' : 'text-cyan-400'}`} />
                          Time Remaining
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          countdown.urgency === 'critical'
                            ? 'bg-rose-950/80 text-rose-300 border-rose-700/60'
                            : countdown.urgency === 'warning'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                            : 'bg-cyan-950/60 text-cyan-400 border-cyan-800/50'
                        }`}>
                          Live Clock
                        </span>
                      </div>

                      <div className={`rounded-xl p-3.5 text-center ${
                        countdown.urgency === 'critical'
                          ? 'bg-rose-950/40 border border-rose-800/60'
                          : countdown.urgency === 'warning'
                          ? 'bg-amber-950/40 border border-amber-800/60'
                          : 'bg-[#05080a] border border-cyan-900/50'
                      }`}>
                        <div className={`font-mono font-black text-xl sm:text-2xl tracking-wider ${
                          countdown.urgency === 'critical'
                            ? 'text-rose-400 animate-pulse'
                            : countdown.urgency === 'warning'
                            ? 'text-amber-400'
                            : countdown.isPermanent
                            ? 'text-sky-400 text-lg'
                            : 'text-cyan-400'
                        }`}>
                          {countdown.countdownStr}
                        </div>
                        <div className={`text-xs mt-1 font-semibold ${
                          countdown.urgency === 'critical'
                            ? 'text-rose-300'
                            : countdown.urgency === 'warning'
                            ? 'text-amber-300'
                            : countdown.isPermanent
                            ? 'text-sky-300'
                            : 'text-gray-300'
                        }`}>
                          {countdown.moreToExpireText}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-gray-400 mt-3 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>
                        {expiresFormatted ? `Expires: ${expiresFormatted}` : 'Permanent (No Expiry)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Dock Action Bar */}
                <div className="pt-6 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={`https://wgxxitydatuoyjnxuvqw.supabase.co/storage/v1/object/public/installers/${installerName}?v=${new Date().getTime()}`}
                      download={installerName}
                      className="inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Download {installerName}
                      <span className="text-xs font-normal text-cyan-100 bg-cyan-700/60 px-2 py-0.5 rounded ml-1">
                        {editionLabel}
                      </span>
                    </a>

                    <Link
                      to="/dashboard/install"
                      className="inline-flex items-center gap-2 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-gray-300 hover:text-white rounded-xl text-sm font-medium border border-zinc-700 transition-colors"
                    >
                      <BookOpen className="w-4 h-4 text-cyan-400" />
                      <span>Installation Manual &amp; Shortcuts</span>
                    </Link>
                  </div>

                  {(activeLicense.expires_at || activeLicense.duration_months === -10 || (activeLicense.duration_months && activeLicense.duration_months > 0)) && (
                    <div className="flex items-center gap-2 text-xs text-amber-300/90 bg-amber-950/20 border border-amber-900/40 px-3.5 py-2 rounded-xl max-w-md">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        <strong>Auto-Wipe Sentinel:</strong> Upon expiry, files on your host machine will be wiped and your account will automatically return to <strong>Fresh Status</strong>.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()
      )}

      <HowItWorksCard />
    </div>
  );
};