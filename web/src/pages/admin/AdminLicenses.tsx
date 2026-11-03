import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { 
  Trash2, AlertTriangle, Clock, Search, Plus, 
  Laptop, Shield, RefreshCw, X, Download, Loader2, Key
} from 'lucide-react';
import { downloadInstaller } from '../../utils/download';

export const AdminLicenses = () => {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [wipeLogs, setWipeLogs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'REVOKED' | 'DEMO'>('ALL');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [packageCode, setPackageCode] = useState('FULL_ACCESS');
  const [duration, setDuration] = useState<number | null>(null);
  const [lifetimeExe, setLifetimeExe] = useState<'L' | 'A'>('L');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState({ type: '', text: '' });
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  const handleDownload = async (name: string) => {
    setDownloadingFile(name);
    try {
      await downloadInstaller(name);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloadingFile(null);
    }
  };

  useEffect(() => {
    fetchLicenses();
    fetchPackages();
    const interval = setInterval(fetchLicenses, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchPackages = async () => {
    const { data } = await supabase.from('packages').select('package_code, package_name');
    if (data) setAvailablePackages(data);
  };

  const fetchLicenses = async () => {
    const { data, error } = await supabase
      .from('licenses')
      .select('*, customers(full_name, email), packages(package_name, package_code), devices(hostname, registered_at)')
      .order('issued_at', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      const now = Date.now();
      const valid = [];
      for (const lic of (data || [])) {
        if (lic.expires_at && new Date(lic.expires_at).getTime() <= now) {
          supabase.from('installation_logs').delete().eq('license_id', lic.id).then(() => {
            supabase.from('licenses').delete().eq('id', lic.id);
          });
        } else {
          valid.push(lic);
        }
      }
      setLicenses(valid);
    }

    const { data: logsData } = await supabase
      .from('audit_logs')
      .select('target_id, action, details, created_at')
      .in('action', ['HOST_WIPE_SUCCESS', 'HOST_WIPE_ERROR'])
      .order('created_at', { ascending: false });

    if (logsData) {
      const logsMap: Record<string, any> = {};
      logsData.forEach(log => {
        if (!logsMap[log.target_id]) {
          logsMap[log.target_id] = log;
        }
      });
      setWipeLogs(logsMap);
    }

    setLoading(false);
  };

  const handleDeleteLicense = async (id: string) => {
    if (!window.confirm("Permanently delete this license record? The customer's account will immediately become 100% fresh.")) return;
    try {
      await supabase.from('installation_logs').delete().eq('license_id', id);
      const { error } = await supabase.from('licenses').delete().eq('id', id);
      if (error) {
        alert("❌ Error deleting license: " + error.message);
      } else {
        fetchLicenses();
      }
    } catch (err: any) {
      alert("❌ Error: " + err.message);
    }
  };

  const handleRevokeLicense = async (id: string) => {
    if (!window.confirm("⚠️ REVOKE LICENSE & TRIGGER INSTANT TIME-BOMB WIPE?\n\nThis will trigger the Sentinel to immediately wipe all Safe Exam Browser extension files on the host computer.")) return;
    try {
      const { error } = await supabase
        .from('licenses')
        .update({ status: 'REVOKED' })
        .eq('id', id);
        
      if (error) {
        alert("❌ Error revoking license: " + error.message);
      } else {
        alert("✅ License REVOKED. Kill-switch activated on host machine.");
        fetchLicenses();
      }
    } catch (err: any) {
      alert("❌ Error: " + err.message);
    }
  };

  const handleOpenModal = () => {
    setCustomerEmail('');
    setPackageCode('FULL_ACCESS');
    setDuration(null);
    setLifetimeExe('L');
    setModalMessage({ type: '', text: '' });
    setIsModalOpen(true);
  };

  const handleGenerateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalMessage({ type: '', text: '' });

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      setModalMessage({ type: 'error', text: 'You must be logged in as an administrator.' });
      setIsSubmitting(false);
      return;
    }

    const res = await fetch('https://wgxxitydatuoyjnxuvqw.supabase.co/functions/v1/admin-generate-license', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        customer_email: customerEmail.trim(),
        package_code: packageCode,
        duration_months: duration === null ? (lifetimeExe === 'A' ? 0 : null) : duration
      })
    });

    const data = await res.json();
    setIsSubmitting(false);

    if (!res.ok) {
      setModalMessage({ type: 'error', text: data.error || 'Failed to generate license.' });
      return;
    }

    const issuedKey = data.license_key || data.raw_license_key;
    if (issuedKey) {
      const exeAssigned = duration === null 
        ? (lifetimeExe === 'A' ? 'SecureInstaller_A.exe (Admin-Controlled)' : 'SecureInstaller_L.exe (Lifetime Vault)')
        : 'SecureInstaller_T.exe (Timed Edition)';
      setModalMessage({ 
        type: 'success', 
        text: `Success! License Key: ${issuedKey} • Target: ${exeAssigned}` 
      });
      fetchLicenses();
      setTimeout(() => setIsModalOpen(false), 3500);
    } else {
      setModalMessage({ type: 'error', text: 'License created, but key was missing in response.' });
    }
  };

  const filteredLicenses = useMemo(() => {
    return licenses.filter(l => {
      const customerName = (l.customers?.full_name || '').toLowerCase();
      const customerEmailStr = (l.customers?.email || '').toLowerCase();
      const pkgName = (l.packages?.package_name || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch = !query || customerName.includes(query) || customerEmailStr.includes(query) || pkgName.includes(query);

      if (!matchesSearch) return false;

      if (statusFilter === 'ACTIVE') return l.status === 'ACTIVE';
      if (statusFilter === 'REVOKED') return l.status === 'REVOKED' || l.uninstalled_at;
      if (statusFilter === 'DEMO') return l.duration_months === -10;

      return true;
    });
  }, [licenses, searchQuery, statusFilter]);

  const activeCount = licenses.filter(l => l.status === 'ACTIVE').length;
  const boundNodesCount = licenses.filter(l => l.devices && l.devices.hostname).length;
  const demoCount = licenses.filter(l => l.duration_months === -10).length;
  const wipedCount = licenses.filter(l => l.uninstalled_at).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
        <p className="text-sm font-mono text-slate-400">Loading global fleet licenses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Modern Cyber Glass Header Deck */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0e0720]/80 via-[#0a0c18]/90 to-[#04060d] backdrop-blur-2xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-purple-500/15 via-emerald-500/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-pink-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-purple-300 font-bold bg-purple-950/60 border border-purple-500/30 px-3 py-0.5 rounded-full">
                ADMIN FLEET DECK • AUTO-SYNC 3S
              </span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Key className="w-8 h-8 text-purple-400" />
              Global License &amp; <span className="text-gradient-rainbow">Hardware Nodes</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
              Real-time monitoring of machine bindings, instant remote kill-switch, auto-wipe triggers, and client node locks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Installer Downloads */}
            <div className="flex items-center gap-1.5 bg-black/60 border border-white/10 rounded-2xl p-1.5 shadow-lg">
              <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 flex items-center gap-1">
                <Download className="w-3 h-3 text-emerald-400" /> EXEs:
              </span>
              <button
                onClick={() => handleDownload('SecureInstaller_L.exe')}
                disabled={downloadingFile === 'SecureInstaller_L.exe'}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30 transition-all flex items-center gap-1 cursor-pointer"
                title="Download Lifetime Edition (.exe)"
              >
                {downloadingFile === 'SecureInstaller_L.exe' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                L-Life
              </button>
              <button
                onClick={() => handleDownload('SecureInstaller_T.exe')}
                disabled={downloadingFile === 'SecureInstaller_T.exe'}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-mono text-xs font-bold border border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer"
                title="Download Time-Bomb Edition (.exe)"
              >
                {downloadingFile === 'SecureInstaller_T.exe' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                T-Timed
              </button>
              <button
                onClick={() => handleDownload('SecureInstaller_A.exe')}
                disabled={downloadingFile === 'SecureInstaller_A.exe'}
                className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 font-mono text-xs font-bold border border-purple-500/30 transition-all flex items-center gap-1 cursor-pointer"
                title="Download Admin Managed Edition (.exe)"
              >
                {downloadingFile === 'SecureInstaller_A.exe' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                A-Admin
              </button>
            </div>

            <button 
              onClick={handleOpenModal} 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-purple-500/30 transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Plus className="w-4 h-4 text-white" /> Issue Free License
            </button>
          </div>
        </div>

        {/* KPI Mini-Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/30 shadow-lg shadow-emerald-500/5 hover:border-emerald-400 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider">Active Licenses</span>
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {activeCount} <span className="text-xs text-slate-500 font-normal">/ {licenses.length} Total</span>
            </div>
            <div className="text-[10px] font-mono text-emerald-400/80 mt-1">Live running deployments</div>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/30 shadow-lg shadow-cyan-500/5 hover:border-cyan-400 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider">Bound PC Nodes</span>
              <Laptop className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-cyan-300 font-mono">{boundNodesCount}</div>
            <div className="text-[10px] font-mono text-cyan-400/80 mt-1">Hardware fingerprint locked</div>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-amber-500/30 shadow-lg shadow-amber-500/5 hover:border-amber-400 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider">10-Min Demo Trials</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono">{demoCount}</div>
            <div className="text-[10px] font-mono text-amber-400/80 mt-1">Auto-wipe countdown active</div>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-rose-500/30 shadow-lg shadow-rose-500/5 hover:border-rose-400 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider">Wipes Executed</span>
              <Trash2 className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400 font-mono">{wipedCount}</div>
            <div className="text-[10px] font-mono text-rose-400/80 mt-1">Extensions sanitized from host</div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-3xl border border-white/10 bg-black/60 backdrop-blur-2xl p-6 shadow-2xl space-y-4">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, email, or package..."
              className="w-full pl-10 pr-9 py-2.5 bg-black/70 border border-white/10 focus:border-purple-500 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/60 border border-white/10 shrink-0">
            {(['ALL', 'ACTIVE', 'DEMO', 'REVOKED'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === filter
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {filter === 'ALL' ? 'All' : filter === 'ACTIVE' ? 'Active' : filter === 'DEMO' ? '10-Min Demos' : 'Wiped / Revoked'}
              </button>
            ))}
          </div>
        </div>

        {/* Licenses Table */}
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full min-w-[850px] text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-xs font-mono uppercase tracking-wider bg-slate-900/30">
                <th className="py-3 px-4 font-bold">Customer</th>
                <th className="py-3 px-4 font-bold">Package &amp; Edition</th>
                <th className="py-3 px-4 font-bold">Type</th>
                <th className="py-3 px-4 font-bold">Hardware Node</th>
                <th className="py-3 px-4 font-bold">Status / Sentinel</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredLicenses.map(lic => {
                const isRevoked = lic.status === 'REVOKED' || lic.uninstalled_at;
                const isDemo = lic.duration_months === -10;
                const wipeLog = wipeLogs[lic.id];

                return (
                  <tr key={lic.id} className="hover:bg-purple-950/20 transition-colors">
                    {/* Customer */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-white text-sm">
                        {lic.customers?.full_name || 'Anonymous User'}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {lic.customers?.email}
                      </div>
                    </td>

                    {/* Package */}
                    <td className="py-4 px-4 space-y-1">
                      <span className="font-bold text-white block">
                        {lic.packages?.package_name || 'Custom Package'}
                      </span>
                      <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold">
                        {lic.packages?.package_code || 'STANDARD'}
                      </span>
                    </td>

                    {/* Type & Duration */}
                    <td className="py-4 px-4 space-y-1">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        lic.payment_type === 'FREE' 
                          ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300' 
                          : 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                      }`}>
                        {lic.payment_type || 'PAID'}
                      </span>
                      <div className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5 mt-0.5">
                        <span>{isDemo ? '10-Min Trial' : lic.duration_months && lic.duration_months > 0 ? `${lic.duration_months} Mo` : '∞ Lifetime'}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                          lic.duration_months === 0 
                            ? 'bg-purple-500/15 border-purple-500/30 text-purple-300' 
                            : lic.duration_months === -10 || (lic.duration_months && lic.duration_months > 0)
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                            : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        }`}>
                          {lic.duration_months === 0 ? 'A.exe' : (lic.duration_months === -10 || (lic.duration_months && lic.duration_months > 0)) ? 'T.exe' : 'L.exe'}
                        </span>
                      </div>
                    </td>

                    {/* Hardware Node */}
                    <td className="py-4 px-4">
                      {lic.devices?.hostname ? (
                        <div className="flex items-center gap-1.5 text-emerald-300 font-mono text-[11px] font-bold">
                          <Laptop className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{lic.devices.hostname}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono text-[11px]">Unbound (Pending)</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold ${
                        isRevoked 
                          ? 'bg-rose-500/15 border border-rose-500/40 text-rose-300' 
                          : 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isRevoked ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'}`} />
                        {isRevoked ? (lic.uninstalled_at ? 'WIPED' : 'REVOKED') : 'ACTIVE'}
                      </span>
                      {wipeLog && (
                        <div className="text-[10px] font-mono text-slate-500 mt-1">
                          Wipe log: {wipeLog.action}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {!isRevoked && (
                          <button
                            onClick={() => handleRevokeLicense(lic.id)}
                            className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 transition-all cursor-pointer"
                            title="Revoke and kill-switch"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteLicense(lic.id)}
                          className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500/25 transition-all cursor-pointer"
                          title="Delete license record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0b0c14] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-400" /> Issue Free License Key
              </h3>
              <p className="text-xs text-slate-400">
                Grant immediate access without requiring a payment gateway transaction.
              </p>
            </div>

            {modalMessage.text && (
              <div className={`p-4 rounded-2xl text-xs font-mono ${
                modalMessage.type === 'success' 
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300' 
                  : 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
              }`}>
                {modalMessage.text}
              </div>
            )}

            <form onSubmit={handleGenerateLicense} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 uppercase">
                  Customer Email
                </label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="student@gmail.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/10 text-white text-xs focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 uppercase">
                  Package Module
                </label>
                <select
                  value={packageCode}
                  onChange={e => setPackageCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/10 text-white text-xs focus:border-purple-500 focus:outline-none"
                >
                  {availablePackages.map(p => (
                    <option key={p.package_code} value={p.package_code}>
                      {p.package_name} ({p.package_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 uppercase">
                  Duration (Months)
                </label>
                <select
                  value={duration === null ? 'null' : duration}
                  onChange={e => setDuration(e.target.value === 'null' ? null : parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/10 text-white text-xs focus:border-purple-500 focus:outline-none font-mono"
                >
                  <option value="null">∞ Lifetime Access (Select A or L EXE below)</option>
                  <option value="1">1 Month (Sprint) → T.exe</option>
                  <option value="2">2 Months (Mid-Sem) → T.exe</option>
                  <option value="3">3 Months (Semester Pass) → T.exe</option>
                  <option value="-10">⚡ 10-Minute Demo Trial → T.exe</option>
                </select>
              </div>

              {/* Selection of EXE for Lifetime: A exe vs L exe */}
              {duration === null && (
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-mono font-bold text-emerald-300 uppercase">
                      Select Lifetime Installer Edition (.EXE)
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">Required</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLifetimeExe('L')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        lifetimeExe === 'L'
                          ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                          : 'bg-black/60 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-bold text-emerald-300">L.exe (Lifetime)</span>
                        {lifetimeExe === 'L' && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                      </div>
                      <span className="text-[10px] text-slate-300 font-mono leading-tight">
                        SecureInstaller_L.exe
                      </span>
                      <span className="text-[9px] text-slate-500 mt-1">
                        Permanent offline vault. Local execution only.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLifetimeExe('A')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        lifetimeExe === 'A'
                          ? 'bg-purple-500/20 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                          : 'bg-black/60 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-bold text-purple-300">A.exe (Admin-Ctrl)</span>
                        {lifetimeExe === 'A' && <span className="w-2 h-2 rounded-full bg-purple-400" />}
                      </div>
                      <span className="text-[10px] text-slate-300 font-mono leading-tight">
                        SecureInstaller_A.exe
                      </span>
                      <span className="text-[9px] text-slate-500 mt-1">
                        Admin-controlled. Allows remote revoke &amp; auto-purge.
                      </span>
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs font-mono uppercase tracking-wider shadow-lg shadow-purple-500/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Issuing License...' : 'Confirm & Issue Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
