import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Trash2, Check, AlertTriangle, Clock } from 'lucide-react';

export const AdminLicenses = () => {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [wipeLogs, setWipeLogs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [packageCode, setPackageCode] = useState('FULL_ACCESS');
  const [duration, setDuration] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState({ type: '', text: '' });
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);

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
      .select('*, customers(full_name, email), packages(package_name)')
      .order('issued_at', { ascending: false });
    if (error) {
      console.error(error);
    } else {
      // Automatically purge any expired licenses so both admin and customer pages stay fresh
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

  if (loading) return <div className="text-gray-400">Loading licenses...</div>;

  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-lg sm:text-xl font-bold">Global License Management</h2>
        <button onClick={handleOpenModal} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs sm:text-sm font-medium w-full sm:w-auto">Generate FREE License</button>
      </div>
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <table className="w-full min-w-[650px] text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-800 text-gray-400">
            <th className="pb-3 font-medium">Customer</th>
            <th className="pb-3 font-medium">Package</th>
            <th className="pb-3 font-medium">Type</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {licenses.map(l => (
            <tr key={l.id} className="border-b border-gray-800/50">
              <td className="py-4 font-medium">{l.customers?.full_name || l.customers?.email || 'N/A'}</td>
              <td className="py-4">{l.packages?.package_name}</td>
              <td className="py-4">
                <div className="flex flex-col gap-1 items-start">
                  <span className={`px-2 py-1 rounded text-xs ${l.payment_type === 'FREE' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {l.payment_type}
                  </span>
                  {l.duration_months === -10 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> 10-Min Demo
                    </span>
                  )}
                </div>
              </td>
              <td className="py-4">
                <div className="flex flex-col gap-1 items-start">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${l.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {l.status}
                  </span>
                  {wipeLogs[l.id]?.action === 'HOST_WIPE_ERROR' ? (
                    <span 
                      onClick={() => alert(`Client Deletion Error:\n\n${wipeLogs[l.id].details?.error}\n\nTime: ${wipeLogs[l.id].created_at}`)}
                      className="text-xs text-red-300 flex items-center font-bold bg-red-900/60 px-2 py-1 rounded border border-red-500 mt-1 cursor-pointer hover:bg-red-800 transition-colors"
                      title="Click to view error details"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 mr-1 text-red-400 flex-shrink-0" /> Wipe Failed (Click for Details)
                    </span>
                  ) : l.uninstalled_at ? (
                    <span className="text-xs text-red-400 flex items-center font-medium bg-red-950/50 px-2 py-0.5 rounded border border-red-900/60 mt-1">
                      <Trash2 className="w-3 h-3 mr-1 text-red-400" /> Extensions Wiped
                    </span>
                  ) : l.status === 'REVOKED' ? (
                    <span className="text-xs text-yellow-400 flex items-center font-medium bg-yellow-950/50 px-2 py-0.5 rounded border border-yellow-800/60 mt-1">
                      <AlertTriangle className="w-3 h-3 mr-1 text-yellow-400" /> Wipe Signal Sent (Pending)
                    </span>
                  ) : null}
                </div>
              </td>
              <td className="py-4 flex gap-2 items-center flex-wrap">
                {l.status === 'ACTIVE' ? (
                  <button onClick={() => handleRevoke(l.id)} className="bg-red-900/50 border border-red-500 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 shadow-lg shadow-red-900/20 cursor-pointer">
                    <Trash2 className="w-3 h-3" /> Trigger Extensions Wipe
                  </button>
                ) : wipeLogs[l.id]?.action === 'HOST_WIPE_ERROR' ? (
                  <button 
                    onClick={() => alert(`Client Deletion Error:\n\n${wipeLogs[l.id].details?.error}\n\nTime: ${wipeLogs[l.id].created_at}`)}
                    className="bg-red-950/80 border border-red-500 text-red-300 hover:bg-red-900 px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> View Wipe Error
                  </button>
                ) : l.uninstalled_at ? (
                  <span className="px-2.5 py-1 rounded text-xs font-medium bg-green-950/40 border border-green-800/60 text-green-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-green-400" /> Extensions Deleted &amp; Revoked
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded text-xs font-medium bg-yellow-950/40 border border-yellow-800/60 text-yellow-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-yellow-400 animate-spin" /> Wiping Extensions...
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteLicense(l.id)}
                  className="bg-zinc-900 hover:bg-red-950/80 border border-zinc-800 hover:border-red-700 text-gray-400 hover:text-red-300 px-2 py-1 rounded text-xs transition-all flex items-center gap-1 cursor-pointer"
                  title="Permanently delete this license record (resets customer to fresh account)"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </td>
            </tr>
          ))}
          {licenses.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-gray-500">No licenses found.</td></tr>}
        </tbody>
      </table>
      </div>

      {/* Generate Free License Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0a0a0a] border border-green-500/30 rounded-xl p-6 shadow-[0_0_15px_rgba(34,197,94,0.1)] relative">
            <h3 className="text-lg font-bold text-white mb-4">Generate FREE License</h3>
            
            {modalMessage.text && (
              <div className={`mb-4 p-3 text-sm rounded ${modalMessage.type === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-green-500/10 border border-green-500/20 text-green-400'}`}>
                {modalMessage.text}
              </div>
            )}

            <form onSubmit={handleGenerateFreeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Customer Email</label>
                <input 
                  type="email" 
                  required
                  value={customerEmail} 
                  onChange={e => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-500 text-white"
                  placeholder="e.g. student@college.edu"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">License Duration</label>
                <select 
                  required
                  value={duration === null ? '-1' : String(duration)} 
                  onChange={e => setDuration(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-500 text-white mb-3"
                >
                  <option value="-1">Permanent (True Lifetime - SecureInstaller_L)</option>
                  <option value="0">Permanent (Admin Controlled - SecureInstaller_A)</option>
                  <option value="-10">⏱️ 10 Minutes Demo Trial (Auto-Wipe - SecureInstaller_T)</option>
                  <option value="1">1 Month (Time-Bomb - SecureInstaller_T)</option>
                  <option value="2">2 Months (Time-Bomb - SecureInstaller_T)</option>
                  <option value="3">3 Months (Time-Bomb - SecureInstaller_T)</option>
                </select>

                {duration === -10 && (
                  <div className="p-3 mb-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong>Demo Auto-Wipe Protocol:</strong> This license uses the Time-Bomb installer. The 10-minute countdown starts automatically when the student activates it. When the 10 minutes expire, the student's machine will automatically delete and wipe all files. You can also click <em>"Trigger Extensions Wipe"</em> to revoke it instantly at any time.
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Package</label>
                <select 
                  required
                  value={packageCode} 
                  onChange={e => setPackageCode(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-500 text-white"
                >
                  {availablePackages.map(p => (
                    <option key={p.package_code} value={p.package_code}>
                      {p.package_name} ({p.package_code})
                    </option>
                  ))}
                  {availablePackages.length === 0 && (
                    <option value="FULL_ACCESS">Full Access (FULL_ACCESS)</option>
                  )}
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Generating...' : 'Confirm & Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
