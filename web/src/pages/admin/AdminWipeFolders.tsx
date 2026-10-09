import React, { useEffect, useState } from 'react';
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
    setLoading(false);
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const handleWipe = async (id: string) => {
    if (!window.confirm("WARNING: Are you sure you want to WIPE this customer's folders?\n\nWithin the next 30 minutes, their Safe Exam Browser files will be completely deleted from their host machine.")) return;
    
    // Setting the status to REVOKED triggers the Heartbeat kill-switch
    const { error } = await supabase.from('licenses').update({ status: 'REVOKED' }).eq('id', id);
    if (!error) {
      fetchLicenses();
      alert("Trigger sent! Their files will be wiped the next time their computer pings the server (within 30 mins).");
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
                {l.uninstalled_at ? (
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
                  <button onClick={() => handleWipe(l.id)} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-red-900/40">
                    <MonitorX className="w-4 h-4" /> TRIGGER FOLDER DELETE
                  </button>
                ) : l.uninstalled_at ? (
                   <span className="text-gray-600 text-xs font-bold px-2 py-1">Already Deleted</span>
                ) : (
                   <span className="text-gray-500 text-xs italic px-2 py-1">Waiting for host...</span>
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
