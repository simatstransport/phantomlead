import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { 
  Trash2, AlertTriangle, Clock, Search, Plus, 
  Laptop, Shield, RefreshCw, X, CheckCircle2, Download, Loader2
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
      // Automatically purge any expired licenses so both admin and customer pages stay clean & fresh
      const now = Date.now();
      const valid = [];
      for (const lic of (data || [])) {
        if (lic.expires_at && new Date(lic.expires_at).getTime() <= now) {
          // Expired: delete logs and license in background
          supabase.from('installation_logs').delete().eq('license_id', lic.id).then(() => {
            supabase.from('licenses').delete().eq('id', lic.id);
          });
        } else {
          valid.push(lic);
        }
      }
      setLicenses(valid);
    }

    // Also fetch wipe success/error logs
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
        alert("✅ License deleted successfully! Customer account is now completely fresh.");
        fetchLicenses();
      }
    } catch (err: any) {
      alert("❌ System Error: " + (err.message || String(err)));
    }
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm("WARNING: Are you sure you want to WIPE this customer's folders? All application files and extensions will be permanently deleted from their computer.")) return;
    try {
      const { error } = await supabase.from('licenses').update({ status: 'REVOKED', uninstalled_at: null }).eq('id', id);
      if (error) {
        alert("❌ Error triggering wipe: " + error.message);
      } else {
        alert("✅ Host wipe signal sent! The customer's machine will wipe all files and report back. The badge will update to 'Folders Deleted & Revoked' once confirmed.");
        fetchLicenses();
      }
    } catch (err: any) {
      alert("❌ System Error: " + (err.message || String(err)));
    }
  };

  const handleOpenModal = () => {
    setCustomerEmail('');
    setPackageCode(availablePackages.length > 0 ? availablePackages[0].package_code : 'FULL_ACCESS');
    setModalMessage({ type: '', text: '' });
    setIsModalOpen(true);
  };

  const handleGenerateFreeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmail || !packageCode) return;
    
    setIsSubmitting(true);
    setModalMessage({ type: '', text: '' });

    const { data, error } = await supabase.functions.invoke('admin-generate-license', {
      body: { customer_email: customerEmail.trim(), package_code: packageCode, duration_months: duration }
    });

    setIsSubmitting(false);

    if (error) {
      setModalMessage({ type: 'error', text: "Error: " + error.message });
    } else if (data?.license_key) {
      setModalMessage({ type: 'success', text: "FREE license created! Key: " + data.license_key });
      fetchLicenses();
      setTimeout(() => setIsModalOpen(false), 3000);
    } else {
      setModalMessage({ type: 'error', text: 'License created, but key was missing in response.' });
    }
  };

  // Filtered licenses
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

  // Executive Stats
  const activeCount = licenses.filter(l => l.status === 'ACTIVE').length;
  const boundNodesCount = licenses.filter(l => l.devices && l.devices.hostname).length;
  const demoCount = licenses.filter(l => l.duration_months === -10).length;
  const wipedCount = licenses.filter(l => l.uninstalled_at).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm font-mono text-gray-400">Loading global fleet licenses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-zinc-950 via-[#070b14] to-zinc-950 border border-cyan-500/20 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              Admin Fleet Deck
            </span>
            <span className="text-gray-600">•</span>
            <span className="text-xs text-gray-400 font-mono">Auto-sync 3s</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Global License Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Monitor real-time host activation, remote kill-switch, auto-wipe triggers, and client node locks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Installer Downloads */}
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl p-1 text-xs">
            <span className="text-[11px] font-mono text-emerald-400 font-bold px-2 flex items-center gap-1">
              <Download className="w-3 h-3 text-emerald-400" /> Binaries:
            </span>
            <button
              onClick={() => handleDownload('SecureInstaller_L.exe')}
              disabled={downloadingFile === 'SecureInstaller_L.exe'}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-mono text-[11px] font-bold border border-emerald-500/30 transition-all flex items-center gap-1"
              title="Download Lifetime Edition (.exe)"
            >
              {downloadingFile === 'SecureInstaller_L.exe' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              L-Life
            </button>
            <button
              onClick={() => handleDownload('SecureInstaller_T.exe')}
              disabled={downloadingFile === 'SecureInstaller_T.exe'}
              className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-mono text-[11px] font-bold border border-amber-500/30 transition-all flex items-center gap-1"
              title="Download Time-Bomb Demo Edition (.exe)"
            >
              {downloadingFile === 'SecureInstaller_T.exe' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              T-Demo
            </button>
            <button
              onClick={() => handleDownload('SecureInstaller_A.exe')}
              disabled={downloadingFile === 'SecureInstaller_A.exe'}
              className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 font-mono text-[11px] font-bold border border-purple-500/30 transition-all flex items-center gap-1"
              title="Download Admin Managed Edition (.exe)"
            >
              {downloadingFile === 'SecureInstaller_A.exe' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              A-Admin
            </button>
          </div>

          <button 
            onClick={handleOpenModal} 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-xs sm:text-sm font-black shadow-lg shadow-emerald-500/25 transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-950" /> Generate FREE License
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#070b14] border border-gray-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span>ACTIVE LICENSES</span>
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-2 font-mono">
            {activeCount} <span className="text-xs text-gray-500 font-normal">/ {licenses.length} Total</span>
          </div>
          <div className="text-[11px] text-cyan-400 mt-1">Live running deployments</div>
        </div>

        <div className="bg-[#070b14] border border-gray-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span>BOUND PC NODES</span>
            <Laptop className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-2 font-mono">
            {boundNodesCount}
          </div>
          <div className="text-[11px] text-blue-400 mt-1">Hardware fingerprint locked</div>
        </div>

        <div className="bg-[#070b14] border border-gray-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span>10-MIN DEMO TRIALS</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-2 font-mono">
            {demoCount}
          </div>
          <div className="text-[11px] text-amber-400 mt-1">Auto-wipe countdown active</div>
        </div>

        <div className="bg-[#070b14] border border-gray-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
            <span>HOST WIPES EXECUTED</span>
            <Trash2 className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-2 font-mono">
            {wipedCount}
          </div>
          <div className="text-[11px] text-red-400 mt-1">Extensions wiped from host</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-[#070b14] border border-gray-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-gray-800">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, email, or package..."
              className="w-full pl-9 pr-4 py-2 bg-black border border-gray-800 focus:border-cyan-500 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['ALL', 'ACTIVE', 'DEMO', 'REVOKED'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === filter
                    ? 'bg-cyan-500 text-black shadow-sm'
                    : 'bg-zinc-900 text-gray-400 hover:text-white hover:bg-zinc-800'
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
              <tr className="border-b border-gray-800/80 text-gray-400 text-xs font-mono uppercase tracking-wider">
                <th className="pb-3 pr-4 font-semibold">Customer</th>
                <th className="pb-3 pr-4 font-semibold">Package &amp; Edition</th>
                <th className="pb-3 pr-4 font-semibold">Type</th>
                <th className="pb-3 pr-4 font-semibold">Hardware Node</th>
                <th className="pb-3 pr-4 font-semibold">Status / Sentinel</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-800/40">
              {filteredLicenses.map(l => {
                const customerName = l.customers?.full_name || 'Customer';
                const customerEmailStr = l.customers?.email || 'N/A';
                const hasDevice = l.devices && l.devices.hostname;

                return (
                  <tr key={l.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Customer */}
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-900/60 to-zinc-900 border border-cyan-800/50 flex items-center justify-center text-xs font-bold text-cyan-300 shrink-0">
                          {customerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs sm:text-sm">{customerName}</div>
                          <div className="text-[11px] text-gray-400 font-mono">{customerEmailStr}</div>
                        </div>
                      </div>
                    </td>

                    {/* Package */}
                    <td className="py-4 pr-4">
                      <div className="font-semibold text-white text-xs sm:text-sm">
                        {l.packages?.package_name || 'Standard Package'}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-gray-500 font-mono">
                          {l.packages?.package_code || 'CODE'}
                        </span>
                        {l.duration_months === -10 ? (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> 10-Min Demo
                          </span>
                        ) : l.duration_months && l.duration_months > 0 ? (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
                            {l.duration_months} Mo. Term
                          </span>
                        ) : l.duration_months === 0 ? (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-purple-500/20 border border-purple-500/40 text-purple-300">
                            Admin Managed
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-sky-500/20 border border-sky-500/40 text-sky-300">
                            Lifetime Full
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-4 pr-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                        l.payment_type === 'FREE' 
                          ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' 
                          : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                      }`}>
                        {l.payment_type}
                      </span>
                    </td>

                    {/* Hardware Node */}
                    <td className="py-4 pr-4">
                      {hasDevice ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-mono text-gray-200 flex items-center gap-1.5 truncate max-w-[170px]">
                            <Laptop className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            {l.devices.hostname}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono pl-5 mt-0.5">
                            {new Date(l.devices.registered_at).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 italic flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-600 shrink-0"></span>
                          Awaiting install
                        </span>
                      )}
                    </td>

                    {/* Status / Sentinel */}
                    <td className="py-4 pr-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                          l.status === 'ACTIVE' 
                            ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' 
                            : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${l.status === 'ACTIVE' ? 'bg-cyan-400' : 'bg-red-400'}`}></span>
                          {l.status}
                        </span>

                        {wipeLogs[l.id]?.action === 'HOST_WIPE_ERROR' ? (
                          <span 
                            onClick={() => alert(`Client Deletion Error:\n\n${wipeLogs[l.id].details?.error}\n\nTime: ${wipeLogs[l.id].created_at}`)}
                            className="text-[11px] text-red-300 flex items-center font-bold bg-red-900/60 px-2 py-0.5 rounded border border-red-500 cursor-pointer hover:bg-red-800 transition-colors"
                            title="Click to view error details"
                          >
                            <AlertTriangle className="w-3 h-3 mr-1 text-red-400 shrink-0" /> Wipe Failed
                          </span>
                        ) : l.uninstalled_at ? (
                          <span className="text-[10px] text-red-400 font-medium flex items-center bg-red-950/50 px-2 py-0.5 rounded border border-red-900/60">
                            <Trash2 className="w-2.5 h-2.5 mr-1" /> Wiped &amp; Confirmed
                          </span>
                        ) : l.status === 'REVOKED' ? (
                          <span className="text-[10px] text-yellow-400 font-medium flex items-center bg-yellow-950/50 px-2 py-0.5 rounded border border-yellow-800/60">
                            <Clock className="w-2.5 h-2.5 mr-1 animate-spin" /> Wipe In Progress
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {l.status === 'ACTIVE' && (
                          <button 
                            onClick={() => handleRevoke(l.id)} 
                            className="bg-red-950/60 hover:bg-red-900 border border-red-800/60 hover:border-red-600 text-red-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                            title="Remotely wipe all application files from customer machine"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            <span>Trigger Wipe</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteLicense(l.id)}
                          className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-gray-400 hover:text-red-400 px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer"
                          title="Permanently delete license record (Resets customer to 100% fresh account)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredLicenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 font-mono text-xs">
                    {searchQuery ? 'No licenses matched your search criteria.' : 'No licenses registered yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Free License Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-gradient-to-b from-zinc-950 to-[#070b14] border border-cyan-500/40 rounded-2xl p-6 sm:p-8 shadow-[0_0_35px_rgba(6,182,212,0.15)] relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold">Admin Provisioning</span>
            </div>
            <h3 className="text-xl font-black text-white mb-4">Generate FREE License Key</h3>
            
            {modalMessage.text && (
              <div className={`mb-4 p-3.5 text-xs sm:text-sm rounded-xl flex items-start gap-2.5 ${
                modalMessage.type === 'error' 
                  ? 'bg-red-500/10 border border-red-500/30 text-red-300' 
                  : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300'
              }`}>
                {modalMessage.type === 'error' ? (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                )}
                <div className="break-all font-mono">{modalMessage.text}</div>
              </div>
            )}

            <form onSubmit={handleGenerateFreeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Customer Email Address
                </label>
                <input 
                  type="email" 
                  required
                  value={customerEmail} 
                  onChange={e => setCustomerEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black border border-gray-800 rounded-xl focus:outline-none focus:border-cyan-500 text-white text-sm placeholder-gray-600"
                  placeholder="e.g. user@domain.com"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  License Duration &amp; Security Mode
                </label>
                <select 
                  required
                  value={duration === null ? '-1' : String(duration)} 
                  onChange={e => setDuration(parseInt(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-black border border-gray-800 rounded-xl focus:outline-none focus:border-cyan-500 text-white text-sm mb-3"
                >
                  <option value="-1">Permanent (True Lifetime - SecureInstaller_L)</option>
                  <option value="0">Permanent (Admin Controlled - SecureInstaller_A)</option>
                  <option value="-10">⏱️ 10 Minutes Demo Trial (Auto-Wipe - SecureInstaller_T)</option>
                  <option value="1">1 Month (Time-Bomb - SecureInstaller_T)</option>
                  <option value="2">2 Months (Time-Bomb - SecureInstaller_T)</option>
                  <option value="3">3 Months (Time-Bomb - SecureInstaller_T)</option>
                </select>

                {duration === -10 && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong>Demo Auto-Wipe Protocol:</strong> The 10-minute timer triggers automatically on first client PC run. When time runs out, host files are wiped and the license is automatically purged so the user gets a fresh account.
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Select Package
                </label>
                <select 
                  required
                  value={packageCode} 
                  onChange={e => setPackageCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black border border-gray-800 rounded-xl focus:outline-none focus:border-cyan-500 text-white text-sm"
                >
                  {availablePackages.map(pkg => (
                    <option key={pkg.package_code} value={pkg.package_code}>
                      {pkg.package_name} ({pkg.package_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Generating Cryptographic Key...' : 'Issue Free License Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
