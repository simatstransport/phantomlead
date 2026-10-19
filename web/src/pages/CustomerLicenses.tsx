import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Copy, Check, Clock, Calendar, ShieldCheck, Laptop, AlertTriangle, Sparkles, BookOpen } from 'lucide-react';
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
    };
  }

  const expiryTime = new Date(expiresAt).getTime();
  const diffMs = expiryTime - now;

  if (diffMs <= 0) {
    return {
      countdownStr: '-00h : 00m : 00s',
      moreToExpireText: 'Expired (Time limit reached)',
      isExpired: true,
      isPermanent: false,
      urgency: 'expired' as const,
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
  };
};

const getInstallerInfo = (license: CustomerLicense) => {
  let installerName = 'SecureInstaller_L.exe';
  let editionLabel = 'Lifetime Full';
  let badgeColor = 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10';

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
  const [error, setError] = useState('');
  const [keyError, setKeyError] = useState('');
  const [keyActionError, setKeyActionError] = useState('');
  const [regeneratingLicenseId, setRegeneratingLicenseId] = useState('');
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

  const handleGenerateReplacementKey = async (licenseId: string) => {
    const confirmed = window.confirm('Your current key cannot be recovered. Generate a replacement? Any previous key for this license will stop working.');
    if (!confirmed) return;

    setRegeneratingLicenseId(licenseId);
    setKeyActionError('');
    const { data, error: functionError } = await supabase.functions.invoke('regenerate-my-license-key', {
      body: { license_id: licenseId }
    });
    setRegeneratingLicenseId('');

    if (functionError) {
      setKeyActionError(`Could not generate a key: ${functionError.message}. Ask the administrator to deploy the replacement-key function.`);
      return;
    }

    if (!data?.license_key) {
      setKeyActionError('The replacement key was not returned. Contact the administrator.');
      return;
    }

    setLicenses(current => current.map(license => (
      license.id === licenseId ? { ...license, license_key: data.license_key } : license
    )));
  };

  useEffect(() => {
    const fetchLicenses = async () => {
      const { data, error: queryError } = await supabase
        .from('licenses')
        .select('id, status, payment_type, duration_months, issued_at, expires_at, device_id, packages(package_name, package_code), customers(full_name), devices(registered_at, hostname)')
        .order('issued_at', { ascending: false });

      if (queryError) {
        setError(queryError.message);
      } else {
        const licenseRows = (data || []).map(license => ({
          ...(license as any as Omit<CustomerLicense, 'license_key'>),
          license_key: null
        }));
        setLicenses(licenseRows);

        const { data: keyData, error: keyQueryError } = await supabase.functions.invoke('get-my-license-keys', { method: 'GET' });
        if (keyQueryError) {
          setKeyError('License records loaded, but activation keys are unavailable. Ask the administrator to deploy the license-key function and configure its encryption secret.');
        } else {
          const keys = new Map<string, string | null>((keyData?.keys || []).map((entry: { license_id: string; license_key: string | null }) => [entry.license_id, entry.license_key]));
          setLicenses(licenseRows.map(license => ({
            ...license,
            license_key: keys.get(license.id) || null
          })));
        }
      }
      setLoading(false);
    };

    fetchLicenses();
  }, []);

  if (loading) return <p className="text-gray-400">Loading your licenses...</p>;

  const activeLicense = licenses.find(license => license.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      {/* Top Active License Spotlight Card */}
      {activeLicense && (() => {
        const { installerName, editionLabel, badgeColor } = getInstallerInfo(activeLicense);
        const deviceData = getDeviceData(activeLicense);
        const countdown = getTimeRemaining(activeLicense.expires_at, currentTime);
        const activatedFormatted = formatFullDateTime(deviceData?.registered_at);
        const expiresFormatted = formatFullDateTime(activeLicense.expires_at);

        return (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-950 via-[#0a0a0a] to-zinc-900 border border-green-500/30 p-5 sm:p-6 shadow-[0_0_25px_rgba(34,197,94,0.1)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-800/80">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-xs uppercase tracking-wider font-bold text-green-400">Active License</span>
                <span className="text-gray-600">•</span>
                <h3 className="font-bold text-white text-base sm:text-lg">
                  {activeLicense.packages?.package_name || 'Software Access'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}>
                  {editionLabel}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-zinc-800 text-gray-300 border border-zinc-700">
                  {activeLicense.packages?.package_code || ''}
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-5">
              {/* 1. License Key */}
              <div className="bg-black/40 border border-gray-800/80 rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-[11px] text-gray-400 uppercase font-semibold flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-green-400" /> License Key
                </span>
                {activeLicense.license_key ? (
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="text-green-400 font-mono font-bold text-xs sm:text-sm tracking-wider select-all break-all">
                      {activeLicense.license_key}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyKey(activeLicense.license_key!)}
                      title="Copy Key"
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white transition-all flex items-center gap-1 text-xs shrink-0 border border-zinc-700 cursor-pointer"
                    >
                      {copiedKey === activeLicense.license_key ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-green-400 font-medium">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-gray-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500 italic mt-1">Key unavailable</span>
                )}
                <span className="text-[10px] text-gray-500 mt-2">Enter this in SecureInstaller</span>
              </div>

              {/* 2. License Activated Date and Time */}
              <div className="bg-black/40 border border-gray-800/80 rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-[11px] text-gray-400 uppercase font-semibold flex items-center gap-1.5 mb-1.5">
                  <Laptop className="w-3.5 h-3.5 text-blue-400" /> Activated On
                </span>
                {activatedFormatted ? (
                  <div>
                    <div className="text-white font-medium text-xs sm:text-sm font-mono">
                      {activatedFormatted}
                    </div>
                    {deviceData?.hostname && (
                      <div className="text-[10px] text-gray-400 font-mono mt-1 flex items-center gap-1 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
                        PC: {deviceData.hostname}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="text-amber-400/90 text-xs sm:text-sm font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                      Not activated yet
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">Activates upon first run on PC</div>
                  </div>
                )}
                <span className="text-[10px] text-gray-500 mt-2">Binding: 1 Machine</span>
              </div>

              {/* 3. Expires On Date and Time */}
              <div className="bg-black/40 border border-gray-800/80 rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-[11px] text-gray-400 uppercase font-semibold flex items-center gap-1.5 mb-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" /> Expires On
                </span>
                {expiresFormatted ? (
                  <div>
                    <div className={`font-mono text-xs sm:text-sm font-medium ${countdown.isExpired ? 'text-red-400' : 'text-white'}`}>
                      {expiresFormatted}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">
                      {countdown.isExpired ? 'Expired — Files wiped' : 'Scheduled automatic wipe'}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-emerald-400 text-xs sm:text-sm font-medium flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Permanent Access
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">Lifetime (No expiration)</div>
                  </div>
                )}
                <span className="text-[10px] text-gray-500 mt-2">DRM Expiry Clock</span>
              </div>

              {/* 4. Live Countdown with Minus ("like 1 hour more to expire") */}
              <div className={`border rounded-xl p-3.5 flex flex-col justify-between transition-colors ${
                countdown.urgency === 'critical'
                  ? 'bg-rose-950/30 border-rose-500/40'
                  : countdown.urgency === 'warning'
                  ? 'bg-amber-950/20 border-amber-500/40'
                  : countdown.isExpired
                  ? 'bg-red-950/30 border-red-500/40'
                  : 'bg-black/40 border-gray-800/80'
              }`}>
                <span className="text-[11px] text-gray-400 uppercase font-semibold flex items-center gap-1.5 mb-1.5">
                  <Clock className={`w-3.5 h-3.5 ${
                    countdown.urgency === 'critical' ? 'text-rose-400 animate-spin' : 'text-cyan-400'
                  }`} />
                  Time Remaining
                </span>
                <div>
                  <div className={`font-mono font-extrabold text-sm sm:text-base tracking-tight ${
                    countdown.urgency === 'critical'
                      ? 'text-rose-400 animate-pulse'
                      : countdown.urgency === 'warning'
                      ? 'text-amber-400'
                      : countdown.isExpired
                      ? 'text-red-400'
                      : countdown.isPermanent
                      ? 'text-emerald-400'
                      : 'text-cyan-400'
                  }`}>
                    {countdown.countdownStr}
                  </div>
                  <div className={`text-xs mt-1 font-medium ${
                    countdown.urgency === 'critical'
                      ? 'text-rose-300'
                      : countdown.urgency === 'warning'
                      ? 'text-amber-300'
                      : countdown.isExpired
                      ? 'text-red-400'
                      : 'text-gray-300'
                  }`}>
                    {countdown.moreToExpireText}
                  </div>
                </div>
                <span className="text-[10px] text-gray-500 mt-2">Live ticking counter</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={`https://wgxxitydatuoyjnxuvqw.supabase.co/storage/v1/object/public/installers/${installerName}?v=${new Date().getTime()}`}
                  download={installerName}
                  className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-sm transition-all shadow-[0_0_15px_rgba(34,197,94,0.35)] cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download {installerName}
                  <span className="text-xs font-normal text-green-100 bg-green-700/60 px-2 py-0.5 rounded ml-1">
                    {editionLabel}
                  </span>
                </a>

                <Link
                  to="/dashboard/install"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-gray-200 hover:text-white rounded-lg text-sm font-medium border border-zinc-700 transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-green-400" />
                  <span>Installation Manual &amp; Shortcuts</span>
                </Link>
              </div>

              {(activeLicense.expires_at || activeLicense.duration_months === -10 || (activeLicense.duration_months && activeLicense.duration_months > 0)) && (
                <div className="flex items-center gap-2 text-xs text-amber-300/90 bg-amber-950/20 border border-amber-900/40 px-3 py-1.5 rounded-lg max-w-xl">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Time-Bomb Active:</strong> Upon expiry, files on your host machine will be automatically wiped.
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Licenses Table Card */}
      <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">All Issued Licenses</h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Activated date, exact expiration, live countdown with minus, and installer downloads.
            </p>
          </div>
        </div>

        {keyError && <p role="status" className="mb-5 text-sm text-yellow-300">{keyError}</p>}
        {keyActionError && <p role="alert" className="mb-5 text-sm text-red-400">{keyActionError}</p>}
        {error ? (
          <p role="alert" className="text-sm text-red-400">Could not load licenses: {error}</p>
        ) : licenses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-300 mb-4 text-sm">No licenses have been issued to your account yet.</p>
            <Link to="/dashboard/packages" className="inline-flex px-4 py-2 bg-green-700 hover:bg-green-800 rounded-lg font-medium text-sm">Browse packages</Link>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full min-w-[980px] text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="pb-3 pr-4 font-semibold">Package</th>
                  <th className="pb-3 pr-4 font-semibold">Status</th>
                  <th className="pb-3 pr-4 font-semibold">License Key</th>
                  <th className="pb-3 pr-4 font-semibold">Activated Date & Time</th>
                  <th className="pb-3 pr-4 font-semibold">Expires On Date & Time</th>
                  <th className="pb-3 pr-4 font-semibold">Time Remaining</th>
                  <th className="pb-3 font-semibold">Installer Download</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-800/40">
                {licenses.map(license => {
                  const { installerName, editionLabel, badgeColor } = getInstallerInfo(license);
                  const deviceData = getDeviceData(license);
                  const countdown = getTimeRemaining(license.expires_at, currentTime);
                  const activatedFormatted = formatFullDateTime(deviceData?.registered_at);
                  const expiresFormatted = formatFullDateTime(license.expires_at);

                  return (
                    <tr key={license.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Package */}
                      <td className="py-4 pr-4">
                        <div className="font-medium text-white">{license.packages?.package_name || 'Package'}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-gray-500 font-mono">{license.packages?.package_code || ''}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${badgeColor}`}>
                            {editionLabel}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 pr-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          license.status === 'ACTIVE'
                            ? countdown.isExpired
                              ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                              : 'bg-green-500/10 text-green-400 border border-green-500/30'
                            : 'bg-gray-800 text-gray-400'
                        }`}>
                          {countdown.isExpired ? 'EXPIRED' : license.status}
                        </span>
                      </td>

                      {/* License Key */}
                      <td className="py-4 pr-4 font-mono text-xs">
                        {license.license_key ? (
                          <div className="flex items-center gap-2">
                            <span className="text-green-400 font-bold tracking-wider select-all break-all bg-black/50 px-2 py-1 rounded border border-green-950">
                              {license.license_key}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyKey(license.license_key!)}
                              title="Copy License Key"
                              className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all flex items-center gap-1 text-xs font-sans shrink-0 border border-gray-700 cursor-pointer"
                            >
                              {copiedKey === license.license_key ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-green-400" />
                                  <span className="text-green-400 font-medium">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-gray-400" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="min-w-40">
                            <span className="block mb-2 text-gray-500">Key unavailable</span>
                            {license.status === 'ACTIVE' && (
                              <button
                                type="button"
                                onClick={() => handleGenerateReplacementKey(license.id)}
                                disabled={regeneratingLicenseId === license.id}
                                className="font-sans text-green-400 underline underline-offset-2 disabled:opacity-50 text-xs"
                              >
                                {regeneratingLicenseId === license.id ? 'Generating...' : 'Generate replacement key'}
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Activated Date and Time */}
                      <td className="py-4 pr-4">
                        {activatedFormatted ? (
                          <div className="flex flex-col">
                            <span className="text-gray-200 text-xs font-medium font-mono flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0"></span>
                              {activatedFormatted}
                            </span>
                            {deviceData?.hostname && (
                              <span className="text-[10px] text-gray-400 font-mono pl-3 mt-0.5 truncate max-w-[180px]">
                                PC: {deviceData.hostname}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-amber-400/90 text-xs flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                              Not activated yet
                            </span>
                            <span className="text-[10px] text-gray-500 pl-3 mt-0.5">
                              Activates on first PC run
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Expires On Date and Time */}
                      <td className="py-4 pr-4">
                        {expiresFormatted ? (
                          <div className="flex flex-col">
                            <span className={`text-xs font-medium font-mono flex items-center gap-1.5 ${
                              countdown.isExpired ? 'text-red-400' : 'text-gray-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                countdown.isExpired ? 'bg-red-500' : 'bg-purple-400'
                              }`}></span>
                              {expiresFormatted}
                            </span>
                            <span className="text-[10px] text-gray-500 pl-3 mt-0.5">
                              {countdown.isExpired ? 'Time-bomb wiped' : 'Auto-wipe upon expiry'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                            Permanent (No expiry)
                          </div>
                        )}
                      </td>

                      {/* Time Remaining (Live countdown with minus) */}
                      <td className="py-4 pr-4">
                        <div className="flex flex-col">
                          <span className={`font-mono font-bold text-xs tracking-tight ${
                            countdown.urgency === 'critical'
                              ? 'text-rose-400 animate-pulse'
                              : countdown.urgency === 'warning'
                              ? 'text-amber-400'
                              : countdown.isExpired
                              ? 'text-red-400'
                              : countdown.isPermanent
                              ? 'text-emerald-400'
                              : 'text-cyan-400'
                          }`}>
                            {countdown.countdownStr}
                          </span>
                          <span className={`text-[11px] font-medium mt-0.5 ${
                            countdown.urgency === 'critical'
                              ? 'text-rose-300'
                              : countdown.urgency === 'warning'
                              ? 'text-amber-300'
                              : countdown.isExpired
                              ? 'text-red-400'
                              : 'text-gray-400'
                          }`}>
                            {countdown.moreToExpireText}
                          </span>
                        </div>
                      </td>

                      {/* Installer Download */}
                      <td className="py-4">
                        {license.status === 'ACTIVE' && !countdown.isExpired ? (
                          <a
                            href={`https://wgxxitydatuoyjnxuvqw.supabase.co/storage/v1/object/public/installers/${installerName}?v=${new Date().getTime()}`}
                            download={installerName}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 hover:text-green-300 border border-green-500/30 rounded-lg text-xs font-medium transition-all shadow-[0_0_10px_rgba(34,197,94,0.15)] whitespace-nowrap"
                            title={`Download ${installerName} for this license`}
                          >
                            <Download className="w-3.5 h-3.5 shrink-0" />
                            <span>Download .EXE</span>
                          </a>
                        ) : (
                          <span className="text-xs text-gray-600 italic">
                            {countdown.isExpired ? 'Expired' : 'Inactive'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <HowItWorksCard />
    </div>
  );
};