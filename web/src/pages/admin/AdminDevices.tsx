import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { 
  Laptop, 
  Radio, 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  RotateCcw, 
  Check, 
  Copy, 
  AlertTriangle,
  Cpu,
  Fingerprint,
  Lock,
  Unlock,
  Loader2
} from 'lucide-react';

export interface DeviceTelemetry {
  id: string;
  customer_id: string;
  fingerprint: string;
  hostname: string | null;
  os_info: string | null;
  registered_at: string;
  last_active_at: string;
  is_blacklisted: boolean;
  blacklist_reason: string | null;
  blacklisted_at: string | null;
  ip_address: string | null;
  status: string | null;
  customers?: {
    full_name: string;
    email: string;
  };
  licenses?: {
    id: string;
    status: string;
    payment_type: string;
    packages?: {
      package_name: string;
      package_code: string;
    };
  }[];
}

export const AdminDevices = () => {
  const [devices, setDevices] = useState<DeviceTelemetry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'BLACKLISTED'>('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [copiedFp, setCopiedFp] = useState<string | null>(null);
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchDevices();

    // Realtime telemetry subscription
    const channel = supabase
      .channel('devices_telemetry_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => {
        fetchDevices();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select(`
          *,
          customers(full_name, email),
          licenses(id, status, payment_type, packages(package_name, package_code))
        `)
        .order('registered_at', { ascending: false });

      if (error) throw error;
      setDevices(data || []);
    } catch (err: any) {
      console.error('[Telemetry fetch error]:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlacklist = async (device: DeviceTelemetry) => {
    const willBlacklist = !device.is_blacklisted;
    const promptMsg = willBlacklist
      ? `🚨 EMERGENCY BAN: Are you sure you want to BLACKLIST device:\nHost: "${device.hostname || 'Unknown'}"\nHWID: "${device.fingerprint}"?\n\nThis device will be immediately blocked from launching any software or validating keys.`
      : `Pardon device and restore authorization for HWID: "${device.fingerprint}"?`;

    if (!window.confirm(promptMsg)) return;

    let reason: string | null = null;
    if (willBlacklist) {
      reason = window.prompt('Enter reason for blacklist (e.g., Suspicious Multibinding, Chargeback, Crack Attempt):', 'Unauthorized hardware distribution');
      if (!reason) reason = 'Admin Hardware Flag';
    }

    setProcessingId(device.id);
    try {
      const { error } = await supabase
        .from('devices')
        .update({
          is_blacklisted: willBlacklist,
          blacklist_reason: willBlacklist ? reason : null,
          blacklisted_at: willBlacklist ? new Date().toISOString() : null,
          status: willBlacklist ? 'BLACKLISTED' : 'ONLINE',
        })
        .eq('id', device.id);

      if (error) throw error;

      // Log into audit trail
      await supabase.from('audit_logs').insert({
        action: willBlacklist ? 'DEVICE_BLACKLISTED' : 'DEVICE_UNBLACKLISTED',
        target_id: device.id,
        details: { fingerprint: device.fingerprint, hostname: device.hostname, reason },
      });

      setActionAlert({
        type: 'success',
        message: willBlacklist
          ? `🚫 HWID ${device.fingerprint.substring(0, 10)}... has been BLACKLISTED.`
          : `✅ Device authorization restored.`,
      });

      fetchDevices();
    } catch (err: any) {
      setActionAlert({ type: 'error', message: `Action failed: ${err.message}` });
    } finally {
      setProcessingId(null);
      setTimeout(() => setActionAlert(null), 4000);
    }
  };

  const handleUnbindHardware = async (device: DeviceTelemetry) => {
    if (!window.confirm(`⚠️ UNBIND HARDWARE:\nThis will remove the hardware binding for device "${device.hostname || device.fingerprint}".\n\nThe customer will be allowed to rebind their license to a new PC cleanly.`)) {
      return;
    }

    setProcessingId(device.id);
    try {
      // 1. Detach from any licenses
      await supabase.from('licenses').update({ device_id: null }).eq('device_id', device.id);

      // 2. Delete the device registration record
      const { error } = await supabase.from('devices').delete().eq('id', device.id);
      if (error) throw error;

      // Log audit
      await supabase.from('audit_logs').insert({
        action: 'DEVICE_UNBOUND',
        target_id: device.id,
        details: { fingerprint: device.fingerprint, hostname: device.hostname },
      });

      setActionAlert({
        type: 'success',
        message: `🔓 Device unbound successfully. Customer slot freed.`,
      });
      fetchDevices();
    } catch (err: any) {
      setActionAlert({ type: 'error', message: `Unbind error: ${err.message}` });
    } finally {
      setProcessingId(null);
      setTimeout(() => setActionAlert(null), 4000);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFp(text);
    setTimeout(() => setCopiedFp(null), 2000);
  };

  const filteredDevices = useMemo(() => {
    return devices.filter(d => {
      if (filter === 'ACTIVE' && d.is_blacklisted) return false;
      if (filter === 'BLACKLISTED' && !d.is_blacklisted) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const host = (d.hostname || '').toLowerCase();
      const fp = (d.fingerprint || '').toLowerCase();
      const cust = (d.customers?.full_name || '').toLowerCase();
      const email = (d.customers?.email || '').toLowerCase();
      const os = (d.os_info || '').toLowerCase();

      return host.includes(q) || fp.includes(q) || cust.includes(q) || email.includes(q) || os.includes(q);
    });
  }, [devices, filter, searchQuery]);

  const metrics = useMemo(() => {
    const total = devices.length;
    const blacklisted = devices.filter(d => d.is_blacklisted).length;
    const active = total - blacklisted;
    return { total, active, blacklisted };
  }, [devices]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Telemetry Header */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden border border-cyan-500/30">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-400">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <h1 className="text-xl font-bold tracking-wider uppercase text-white font-mono flex items-center gap-2">
                HARDWARE TELEMETRY &amp; BLACKLIST RADAR
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Live machine hardware bindings, unique HWID fingerprint radar, and zero-trust remote blacklisting.
            </p>
          </div>

          <button
            onClick={() => { setLoading(true); fetchDevices(); }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/60 hover:bg-slate-900 border border-white/10 text-slate-300 text-xs font-mono transition-all cursor-pointer self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Poll Telemetry</span>
          </button>
        </div>

        {/* Live Threat Counter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/20">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-cyan-400" /> Total Monitored Rigs
            </span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {metrics.total}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/20">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Authorized Hardware
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {metrics.active}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-rose-500/20">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Blacklisted HWIDs
            </span>
            <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
              {metrics.blacklisted}
            </div>
          </div>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionAlert && (
        <div className={`p-4 rounded-xl border font-mono text-xs flex items-center gap-2.5 animate-in fade-in duration-200 ${
          actionAlert.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {actionAlert.type === 'success' ? <Check className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />}
          <span>{actionAlert.message}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Hostname, Fingerprint, Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/60 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['ALL', 'ACTIVE', 'BLACKLISTED'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                filter === mode
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm shadow-cyan-500/20'
                  : 'bg-black/40 text-slate-400 border border-white/5 hover:bg-slate-900 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Main Telemetry Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-black/60 text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                <th className="py-3.5 px-4">Hardware Target</th>
                <th className="py-3.5 px-4">Fingerprint HWID</th>
                <th className="py-3.5 px-4">Client Entitlement</th>
                <th className="py-3.5 px-4">Heartbeat &amp; Registered</th>
                <th className="py-3.5 px-4">Radar Status</th>
                <th className="py-3.5 px-4 text-right">Countermeasures</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs font-mono">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                    <span>Scanning telemetry frequencies...</span>
                  </td>
                </tr>
              ) : filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No hardware fingerprints matched the filter.
                  </td>
                </tr>
              ) : (
                filteredDevices.map((d) => {
                  const isProcessing = processingId === d.id;
                  const isBanned = d.is_blacklisted;

                  return (
                    <tr 
                      key={d.id} 
                      className={`hover:bg-white/[0.02] transition-colors ${
                        isBanned ? 'bg-rose-950/15' : ''
                      }`}
                    >
                      {/* Hardware Target */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl border ${
                            isBanned 
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                              : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                          }`}>
                            <Cpu className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-white tracking-wide flex items-center gap-1.5">
                              <span>{d.hostname || 'DESKTOP-RIG'}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                              {d.os_info || 'Windows NT 10.0 x64'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Fingerprint HWID */}
                      <td className="py-4 px-4">
                        <div className="inline-flex items-center gap-2 p-1.5 rounded-lg bg-black/60 border border-white/10">
                          <Fingerprint className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="font-mono text-xs font-semibold text-cyan-300 tracking-wider">
                            {d.fingerprint ? `${d.fingerprint.substring(0, 16)}...` : 'N/A'}
                          </span>
                          {d.fingerprint && (
                            <button
                              onClick={() => copyToClipboard(d.fingerprint)}
                              className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                              title="Copy Full HWID"
                            >
                              {copiedFp === d.fingerprint ? (
                                <Check className="w-3.5 h-3.5 text-cyan-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Client Entitlement */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-200">
                            {d.customers?.full_name || 'Anonymous User'}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate max-w-[160px]">
                            {d.customers?.email || 'N/A'}
                          </span>
                          {d.licenses && d.licenses.length > 0 && (
                            <span className="text-[9px] text-emerald-400 font-bold mt-0.5">
                              ● {d.licenses[0].packages?.package_code || 'ACTIVE KEY'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Timestamps */}
                      <td className="py-4 px-4 text-slate-400">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] text-slate-300">
                            {d.registered_at ? new Date(d.registered_at).toLocaleDateString() : 'N/A'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Active: {d.last_active_at ? new Date(d.last_active_at).toLocaleTimeString() : 'Recent'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isBanned
                            ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                            : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isBanned ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'
                          }`} />
                          {isBanned ? 'BLACKLISTED' : 'AUTHORIZED'}
                        </span>
                        {isBanned && d.blacklist_reason && (
                          <div className="text-[9px] text-rose-300 mt-1 max-w-[140px] truncate" title={d.blacklist_reason}>
                            ⚠️ {d.blacklist_reason}
                          </div>
                        )}
                      </td>

                      {/* Countermeasures */}
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          {/* Toggle Blacklist Button */}
                          <button
                            onClick={() => handleToggleBlacklist(d)}
                            disabled={isProcessing}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 active:scale-95 ${
                              isBanned
                                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300'
                                : 'bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300'
                            }`}
                            title={isBanned ? 'Pardon and restore HWID' : 'Ban this hardware permanently'}
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : isBanned ? (
                              <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-rose-400" />
                            )}
                            <span>{isBanned ? 'Pardon' : 'Blacklist'}</span>
                          </button>

                          {/* Unbind Hardware Button */}
                          <button
                            onClick={() => handleUnbindHardware(d)}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-slate-900 border border-white/10 text-slate-400 hover:text-white text-xs transition-all cursor-pointer disabled:opacity-50"
                            title="Unbind machine from license without revoking payment"
                          >
                            <RotateCcw className="w-3 h-3 text-cyan-400" />
                            <span>Unbind</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
