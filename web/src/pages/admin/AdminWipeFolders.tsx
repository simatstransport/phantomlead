import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Trash2, AlertTriangle, MonitorX } from 'lucide-react';

interface LicenseData {
  id: string;
  status: string;
  uninstalled_at?: string;
  payment_type: string;
  license_key_hash: string;
  packages: { package_name: string } | null;
  customers: { full_name: string; email: string } | null;
}

export const AdminWipeFolders = () => {
  const [licenses, setLicenses] = useState<LicenseData[]>([]);
  const [wipeLogs, setWipeLogs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const fetchLicenses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('licenses')
      .select('id, status, uninstalled_at, payment_type, license_key_hash, packages(package_name), customers(full_name, email)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLicenses(data as any);
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

  useEffect(() => {
    fetchLicenses();
  }, []);

  const handleWipe = async (id: string) => {
    if (!window.confirm("WARNING: Are you sure you want to WIPE this customer's folders?\n\nTheir Safe Exam Browser files and proprietary extensions will be immediately wiped from their host machine.")) return;
    
    // Setting status to REVOKED triggers the Heartbeat kill-switch
    const { error } = await supabase.from('licenses').update({ status: 'REVOKED', uninstalled_at: null }).eq('id', id);
    if (!error) {
      fetchLicenses();
      alert("✅ Wipe trigger sent! The customer's computer will remove files within seconds and confirm back.");
    } else {
      alert("❌ Error sending wipe trigger: " + error.message);
    }
  };

  if (loading) return <div className="text-gray-400">Loading customer data...</div>;

  return (
    <div className="bg-[#0a0a0a] border border-red-900/50 rounded-xl p-6 shadow-lg shadow-red-900/10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-red-500 flex items-center gap-2">
            <MonitorX className="w-7 h-7" /> Delete Folder of User
          </h2>
          <p className="text-sm text-gray-400 mt-1">Remotely trigger the deletion of host folders for any user.</p>
        </div>
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-red-900/30 text-gray-400">
            <th className="pb-3 font-medium">Customer Details</th>
            <th className="pb-3 font-medium">Package</th>
            <th className="pb-3 font-medium">License Type</th>
            <th className="pb-3 font-medium">Host Folder Status</th>
            <th className="pb-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {licenses.map(l => (
            <tr key={l.id} className="border-b border-red-900/10">
              <td className="py-4">
                <div className="font-bold text-gray-200">{l.customers?.full_name || 'Unknown Name'}</div>
                <div className="text-xs text-gray-500">{l.customers?.email || 'No email'}</div>
              </td>
              <td className="py-4 text-gray-300">{l.packages?.package_name}</td>
              <td className="py-4">
                <span className={`px-2 py-1 rounded text-xs ${l.payment_type === 'FREE' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {l.payment_type}
                </span>
              </td>
              <td className="py-4">
                {wipeLogs[l.id]?.action === 'HOST_WIPE_ERROR' ? (
                  <span 
                    onClick={() => alert(`Client Deletion Error:\n\n${wipeLogs[l.id].details?.error}\n\nTime: ${wipeLogs[l.id].created_at}`)}
                    className="text-xs text-red-300 flex items-center font-bold bg-red-900/60 px-3 py-1.5 rounded-lg border border-red-500 w-max cursor-pointer hover:bg-red-800 transition-colors"
                    title="Click to view error details"
                  >
                    <AlertTriangle className="w-4 h-4 mr-1.5 text-red-400 flex-shrink-0" /> WIPE FAILED (VIEW ERROR)
                  </span>
                ) : l.uninstalled_at ? (
                  <span className="text-xs text-red-500 flex items-center font-bold bg-red-950/40 px-3 py-1.5 rounded-lg border border-red-900 w-max">
                    <Trash2 className="w-4 h-4 mr-1.5" /> DELETED SUCCESSFULLY
                  </span>
                ) : l.status === 'REVOKED' ? (
                  <span className="text-xs text-yellow-500 flex items-center font-bold bg-yellow-950/40 px-3 py-1.5 rounded-lg border border-yellow-900 w-max">
                    <AlertTriangle className="w-4 h-4 mr-1.5" /> WIPE PENDING...
                  </span>
                ) : (
                  <span className="text-xs text-green-500 flex items-center font-bold bg-green-950/40 px-3 py-1.5 rounded-lg border border-green-900 w-max">
                    Installed (Active)
                  </span>
                )}
              </td>
              <td className="py-4 flex gap-2">
                {l.status === 'ACTIVE' ? (
                  <button onClick={() => handleWipe(l.id)} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-red-900/40 cursor-pointer">
                    <MonitorX className="w-4 h-4" /> TRIGGER FOLDER DELETE
                  </button>
                ) : wipeLogs[l.id]?.action === 'HOST_WIPE_ERROR' ? (
                  <button 
                    onClick={() => alert(`Client Deletion Error:\n\n${wipeLogs[l.id].details?.error}\n\nTime: ${wipeLogs[l.id].created_at}`)}
                    className="bg-red-950/80 border border-red-500 text-red-300 hover:bg-red-900 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-400" /> View Wipe Error
                  </button>
                ) : l.uninstalled_at ? (
                   <span className="text-gray-500 text-xs font-bold px-2 py-1">Already Deleted</span>
                ) : (
                   <span className="text-yellow-500/80 text-xs italic px-2 py-1 flex items-center gap-1">
                     <AlertTriangle className="w-3.5 h-3.5" /> Waiting for host...
                   </span>
                )}
              </td>
            </tr>
          ))}
          {licenses.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-gray-500">No users found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
};
