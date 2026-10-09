import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Trash2 } from 'lucide-react';

export const AdminLicenses = () => {
  const [licenses, setLicenses] = useState<any[]>([]);
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
    if (error) console.error(error);
    else setLicenses(data || []);
    setLoading(false);
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm('WARNING: Are you sure you want to WIPE this customer\'s folders? Within the next 30 minutes (or on their next restart), their Safe Exam Browser files will be permanently deleted from their host machine.')) return;
    const { error } = await supabase.from('licenses').update({ status: 'REVOKED' }).eq('id', id);
    if (!error) fetchLicenses();
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
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Global License Management</h2>
        <button onClick={handleOpenModal} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">Generate FREE License</button>
      </div>
      <table className="w-full text-left border-collapse">
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
                <span className={`px-2 py-1 rounded text-xs ${l.payment_type === 'FREE' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {l.payment_type}
                </span>
              </td>
                              <td className="py-4">
                  <div className="flex flex-col gap-1 items-start">
                    <span className={`px-2 py-1 rounded text-xs ${l.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {l.status}
                    </span>
                    {l.uninstalled_at && (
                      <span className="text-xs text-red-500 flex items-center font-bold bg-red-950/40 px-2 py-1 rounded border border-red-900 mt-1">
                        <Trash2 className="w-3 h-3 mr-1" /> Host Folders Wiped
                      </span>
                    )}
                  </div>
                </td>
              <td className="py-4 flex gap-2">
                {l.status === 'ACTIVE' && (
                  <button onClick={() => handleRevoke(l.id)} className="bg-red-900/50 border border-red-500 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 shadow-lg shadow-red-900/20">
                      <Trash2 className="w-3 h-3" /> Trigger Host Wipe
                    </button>
                )}
              </td>
            </tr>
          ))}
          {licenses.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-gray-500">No licenses found.</td></tr>}
        </tbody>
      </table>

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
                  className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-500 text-white mb-4"
                >
                  <option value="-1">Permanent (True Lifetime - SecureInstaller_L)</option>
                  <option value="0">Permanent (Admin Controlled - SecureInstaller_A)</option>
                  <option value="1">1 Month (Time-Bomb - SecureInstaller_T)</option>
                  <option value="2">2 Months (Time-Bomb - SecureInstaller_T)</option>
                  <option value="3">3 Months (Time-Bomb - SecureInstaller_T)</option>
                </select>
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
