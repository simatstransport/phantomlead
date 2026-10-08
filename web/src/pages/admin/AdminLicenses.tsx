import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';

export const AdminLicenses = () => {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLicenses();
  }, []);

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
    if (!window.confirm('Are you sure you want to revoke this license? The customer software will lock out immediately.')) return;
    const { error } = await supabase.from('licenses').update({ status: 'REVOKED' }).eq('id', id);
    if (!error) fetchLicenses();
  };

  const handleGenerateFree = async () => {
    // In a full production UI, this would be a dropdown modal.
    const customerEmail = window.prompt("Enter the Customer's Email address:");
    if (!customerEmail) return;

    const packageCode = window.prompt("Enter the Package Code (e.g., FULL_ACCESS, JAVA_VIVA):", "FULL_ACCESS");
    if (!packageCode) return;

    const { data, error } = await supabase.functions.invoke('admin-generate-license', {
      body: { customer_email: customerEmail, package_code: packageCode }
    });

    if (error) alert("Error generating free license: " + error.message);
    else if (data?.license_key) {
      alert(`FREE license created. The customer can now view this key in My Licenses:\n\n${data.license_key}`);
      fetchLicenses();
    } else alert('License was created, but the key response was missing. Ask the customer to check My Licenses.');
  };

  if (loading) return <div className="text-gray-400">Loading licenses...</div>;

  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Global License Management</h2>
        <button onClick={handleGenerateFree} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">Generate FREE License</button>
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
                <span className={`px-2 py-1 rounded text-xs ${l.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {l.status}
                </span>
              </td>
              <td className="py-4 flex gap-2">
                {l.status === 'ACTIVE' && (
                  <button onClick={() => handleRevoke(l.id)} className="text-red-400 hover:text-red-300 text-sm">Revoke</button>
                )}
              </td>
            </tr>
          ))}
          {licenses.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-gray-500">No licenses found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
};
