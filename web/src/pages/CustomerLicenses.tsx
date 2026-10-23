import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Download, Copy, Check, Clock, Calendar, ShieldCheck, Laptop, 
  AlertTriangle, Sparkles, BookOpen, Cpu, RefreshCw, HardDrive, 
  CheckCircle2, ArrowRight, Key
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

  let countdownStr = '';
  if (days > 0) {
    countdownStr = `-${days}d ${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`;
  } else {
    countdownStr = `-${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`;
  }

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
    urgency = 'critical';
  } else if (diffMs < 60 * 60 * 1000) {
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

export const CustomerLicenses = () => {
  const [activeLicense, setActiveLicense] = useState<CustomerLicense | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Live 1-second ticker for exact countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getInstallerInfo = (license: CustomerLicense) => {
    let installerName = 'SecureInstaller_L.exe';
    let editionLabel = 'Lifetime Edition';
    let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';

    if (license.duration_months === -10) {
      installerName = 'SecureInstaller_T.exe';
      editionLabel = '10-Minute Demo Trial';
      badgeColor = 'bg-rose-500/15 text-rose-300 border-rose-500/40';
    } else if (license.duration_months && license.duration_months > 0) {
      installerName = 'SecureInstaller_T.exe';
      editionLabel = `${license.duration_months} Month${license.duration_months > 1 ? 's' : ''} Term`;
      badgeColor = 'bg-amber-500/15 text-amber-300 border-amber-500/40';
    } else if (license.expires_at) {
      installerName = 'SecureInstaller_T.exe';
      editionLabel = 'Time-Bomb Term';
      badgeColor = 'bg-amber-500/15 text-amber-300 border-amber-500/40';
    } else if (license.duration_months === 0) {
      installerName = 'SecureInstaller_A.exe';
      editionLabel = 'Admin Managed Access';
      badgeColor = 'bg-purple-500/15 text-purple-300 border-purple-500/40';
    } else {
      installerName = 'SecureInstaller_L.exe';
      editionLabel = 'Permanent Lifetime';
      badgeColor = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
    }

    return { installerName, editionLabel, badgeColor };
  };

  const fetchLicenses = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setError(null);
    setKeyError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('licenses')
        .select(`
          id,
          status,
          payment_type,
          duration_months,
          issued_at,
          expires_at,
          device_id,
          packages (package_name, package_code),
          customers (full_name),
          devices (registered_at, hostname)
        `)
        .order('issued_at', { ascending: false });

      if (queryError) {
        console.error('License fetch error:', queryError);
        setError(queryError.message || 'Could not retrieve active license data.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const now = Date.now();
      const validLicenses: CustomerLicense[] = [];
      const expiredLicenses: any[] = [];

      for (const lic of (data || [])) {
        const isExpired = lic.expires_at && new Date(lic.expires_at).getTime() <= now;
        const isRevoked = lic.status === 'REVOKED' || lic.status === 'EXPIRED';

        if (isExpired || isRevoked) {
          expiredLicenses.push(lic);
        } else if (lic.status === 'ACTIVE') {
          validLicenses.push({
            ...(lic as any),
            license_key: null
          });
        }
      }

      // Purge expired licenses in background
      if (expiredLicenses.length > 0) {
        for (const expLic of expiredLicenses) {
          supabase.from('installation_logs').delete().eq('license_id', expLic.id).then(() => {
            supabase.from('licenses').delete().eq('id', expLic.id);
          });
        }
      }

      if (validLicenses.length > 0) {
        const primaryLicense = validLicenses[0];
        setActiveLicense(primaryLicense);

        // Fetch decrypted activation keys via get-my-license-keys edge function
        try {
          const { data: keyData, error: keyQueryError } = await supabase.functions.invoke('get-my-license-keys', { method: 'GET' });
          if (keyQueryError) {
            console.warn('Key fetch error:', keyQueryError);
            setKeyError('License records loaded, but activation keys are unavailable.');
          } else if (keyData?.keys) {
            const keys = new Map<string, string | null>(
              (keyData.keys || []).map((entry: { license_id: string; license_key: string | null }) => [entry.license_id, entry.license_key])
            );
            const decryptedKey = keys.get(primaryLicense.id) || null;
            setActiveLicense(prev => prev ? {
              ...prev,
              license_key: decryptedKey
            } : null);
          }
        } catch (kErr) {
          console.warn('Failed to invoke get-my-license-keys:', kErr);
        }
      } else {
        setActiveLicense(null);
      }
    } catch (err: any) {
      console.error('Unexpected error loading licenses:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(16,185,129,0.4)]" />
        <p className="font-mono text-xs tracking-wider uppercase text-emerald-300">
          Syncing cryptographic license state...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 px-2 sm:px-4">
      {/* Top Header Deck */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-300 font-bold">
              CRYPTOGRAPHIC KEY VAULT • DRM ARMAMENT
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Key className="w-6 h-6 text-emerald-400" />
            Software Licenses &amp; <span className="text-gradient-rainbow">Machine Locks</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchLicenses(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 glass-panel hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-white/10 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh license state"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Status'}</span>
          </button>
        </div>
      </div>

      {keyError && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          {keyError}
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CASE 1: FRESH ACCOUNT (No active license)                                  */}
      {/* ========================================================================= */}
      {!activeLicense ? (
        <div className="relative overflow-hidden rounded-3xl glass-panel p-8 sm:p-12 shadow-2xl border border-white/15 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.15),transparent_70%)] pointer-events-none" />

          {/* Central Hologram Shield with Rotating Orbital Rings */}
          <div className="relative mx-auto mb-6 w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-emerald-400/30 animate-[spin_6s_linear_infinite]" />
            <div className="absolute inset-[-8px] rounded-full border border-dashed border-purple-400/25 animate-[spin_10s_linear_reverse_infinite]" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-indigo-500/20 to-purple-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.35)]">
              <Sparkles className="w-8 h-8 text-emerald-400" />
            </div>
          </div>

          {/* Fresh Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-mono font-bold tracking-wider uppercase mb-3 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            Account Status: 100% Fresh
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight max-w-xl mx-auto mb-3">
            Your Account is Completely <span className="text-gradient-rainbow">Fresh &amp; Ready</span>
          </h2>

          <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">
            No active or expired licenses are currently attached to this account. All previous exam configurations and machine bindings have been cleared, giving you an unrestricted workstation ready for new software activation.
          </p>

          {/* 3 High-Tech Status Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto mb-8 text-left">
            <div className="glass-panel-interactive rounded-2xl p-5 border border-emerald-500/20 hover:border-emerald-400/50 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-2 text-emerald-400">
                <HardDrive className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Hardware Slot</span>
              </div>
              <div className="text-base font-bold text-white font-mono">1/1 Slot Free</div>
              <div className="text-[11px] text-slate-400 mt-1">Ready to pair with your PC on first install</div>
            </div>

            <div className="glass-panel-interactive rounded-2xl p-5 border border-emerald-500/20 hover:border-emerald-400/50 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-2 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Clean State</span>
              </div>
              <div className="text-base font-bold text-white font-mono">Zero Restrictions</div>
              <div className="text-[11px] text-slate-400 mt-1">No expired time-bombs or lingering locks running</div>
            </div>

            <div className="glass-panel-interactive rounded-2xl p-5 border border-purple-500/20 hover:border-purple-400/50 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-2 text-purple-400">
                <Cpu className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">AI Integration</span>
              </div>
              <div className="text-base font-bold text-white font-mono">Gemini 1.5 Ready</div>
              <div className="text-[11px] text-slate-400 mt-1">Instant activation upon provisioning any package</div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/dashboard/packages"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-emerald-500 via-indigo-600 to-purple-600 hover:from-emerald-400 hover:to-purple-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] cursor-pointer active:scale-95"
            >
              <span>Browse Packages &amp; Activate Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/dashboard/install"
              className="inline-flex items-center gap-2 px-6 py-3.5 glass-panel hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl font-medium text-sm transition-all border border-white/10"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>View Installation Guide</span>
            </Link>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* CASE 2: ACTIVE LICENSE (Tactical Operations Deck)                          */
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
              <div className="relative overflow-hidden rounded-3xl glass-panel border border-white/15 p-6 sm:p-8 shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/10 via-purple-500/10 to-transparent blur-3xl pointer-events-none" />

                {/* Tactical Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                      </span>
                      <span className="text-[11px] font-mono uppercase tracking-widest font-bold text-emerald-300">
                        ACTIVE STATION ARMED
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-xs font-mono text-slate-300">
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
                    <span className="px-3 py-1 rounded-full text-xs font-mono bg-slate-900 text-slate-300 border border-white/10">
                      [{activeLicense.packages?.package_code || 'CODE'}]
                    </span>
                  </div>
                </div>

                {/* 3 Modular Cyber Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 py-6">
                  {/* Card 1: Cryptographic License Key Vault */}
                  <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between border border-emerald-500/30 hover:border-emerald-400/50 transition-all">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-mono uppercase font-bold text-slate-300 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-emerald-400" /> License Key Vault
                        </span>
                        <span className="text-[10px] text-emerald-300 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                          Encrypted
                        </span>
                      </div>

                      {activeLicense.license_key ? (
                        <div className="bg-black/70 border border-emerald-500/30 rounded-xl p-3.5 flex flex-col gap-2.5">
                          <span className="text-emerald-300 font-mono font-bold text-sm sm:text-base tracking-widest select-all break-all text-center">
                            {activeLicense.license_key}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyKey(activeLicense.license_key!)}
                            className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-white transition-all flex items-center justify-center gap-1.5 text-xs font-bold font-mono border border-emerald-500/40 cursor-pointer shadow-sm active:scale-95"
                          >
                            {copiedKey === activeLicense.license_key ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span>Key Copied to Clipboard!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 text-emerald-400" />
                                <span>Copy License Key</span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 italic py-4 text-center">Key unavailable</div>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-3 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Paste into SecureInstaller when prompted</span>
                    </div>
                  </div>

                  {/* Card 2: Hardware Lock & Machine Radar */}
                  <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between border border-blue-500/30 hover:border-blue-400/50 transition-all">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-mono uppercase font-bold text-slate-300 flex items-center gap-1.5">
                          <Laptop className="w-4 h-4 text-blue-400" /> Hardware Binding
                        </span>
                        <span className="text-[10px] text-blue-300 font-mono bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/50">
                          Slot 1/1
                        </span>
                      </div>

                      {activatedFormatted ? (
                        <div className="bg-black/70 border border-blue-500/30 rounded-xl p-3.5 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-mono text-slate-200">
                            <span className="w-2 h-2 rounded-full bg-blue-400" />
                            <span className="text-slate-400">Activated:</span>
                            <strong className="text-white">{activatedFormatted}</strong>
                          </div>
                          {deviceData?.hostname && (
                            <div className="text-xs font-mono text-blue-300 bg-blue-950/40 px-2 py-1 rounded-lg border border-blue-800/40 truncate">
                              💻 Host: {deviceData.hostname}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 space-y-1.5">
                          <div className="text-amber-400 text-xs font-semibold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            Pending First PC Setup
                          </div>
                          <div className="text-[11px] text-slate-400 leading-relaxed">
                            Will bind to your computer upon entering key in SecureInstaller
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 mt-3 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Strict 1-Computer Device Lock</span>
                    </div>
                  </div>

                  {/* Card 3: Expiry Reactor & Live Countdown */}
                  <div className={`rounded-2xl p-5 flex flex-col justify-between transition-all border ${
                    countdown.urgency === 'critical'
                      ? 'bg-rose-950/30 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                      : countdown.urgency === 'warning'
                      ? 'bg-amber-950/30 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                      : 'glass-panel border-emerald-500/30 hover:border-emerald-400/50'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-mono uppercase font-bold text-slate-300 flex items-center gap-1.5">
                          <Clock className={`w-4 h-4 ${countdown.urgency === 'critical' ? 'text-rose-400 animate-spin' : countdown.urgency === 'warning' ? 'text-amber-400' : 'text-emerald-400'}`} />
                          Time Remaining
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          countdown.urgency === 'critical'
                            ? 'bg-rose-950/80 text-rose-300 border-rose-700/60'
                            : countdown.urgency === 'warning'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                            : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
                        }`}>
                          Live Clock
                        </span>
                      </div>

                      <div className={`rounded-xl p-3.5 text-center ${
                        countdown.urgency === 'critical'
                          ? 'bg-rose-950/50 border border-rose-800/60'
                          : countdown.urgency === 'warning'
                          ? 'bg-amber-950/50 border border-amber-800/60'
                          : 'bg-black/70 border border-emerald-500/30'
                      }`}>
                        <div className={`font-mono font-black text-xl sm:text-2xl tracking-wider ${
                          countdown.urgency === 'critical'
                            ? 'text-rose-400 animate-pulse'
                            : countdown.urgency === 'warning'
                            ? 'text-amber-400'
                            : countdown.isPermanent
                            ? 'text-emerald-300 text-lg'
                            : 'text-emerald-400'
                        }`}>
                          {countdown.countdownStr}
                        </div>
                        <div className={`text-xs mt-1 font-semibold ${
                          countdown.urgency === 'critical'
                            ? 'text-rose-300'
                            : countdown.urgency === 'warning'
                            ? 'text-amber-300'
                            : countdown.isPermanent
                            ? 'text-emerald-300'
                            : 'text-slate-300'
                        }`}>
                          {countdown.moreToExpireText}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-3 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>
                        {expiresFormatted ? `Expires: ${expiresFormatted}` : 'Permanent (No Expiry)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Dock Action Bar */}
                <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={`https://wgxxitydatuoyjnxuvqw.supabase.co/storage/v1/object/public/installers/${installerName}?v=${new Date().getTime()}`}
                      download={installerName}
                      className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-emerald-500 via-indigo-600 to-purple-600 hover:from-emerald-400 hover:to-purple-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] cursor-pointer active:scale-95"
                    >
                      <Download className="w-4 h-4" /> Download {installerName}
                      <span className="text-xs font-normal text-white bg-black/30 px-2 py-0.5 rounded ml-1 border border-white/20">
                        {editionLabel}
                      </span>
                    </a>

                    <Link
                      to="/dashboard/install"
                      className="inline-flex items-center gap-2 px-5 py-3.5 glass-panel hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-sm font-medium border border-white/10 transition-colors"
                    >
                      <BookOpen className="w-4 h-4 text-emerald-400" />
                      <span>Installation Manual &amp; Shortcuts</span>
                    </Link>
                  </div>

                  {(activeLicense.expires_at || activeLicense.duration_months === -10 || (activeLicense.duration_months && activeLicense.duration_months > 0)) && (
                    <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3.5 py-2.5 rounded-xl max-w-md">
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
