import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';

export const AdminPackages = () => {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    const { data, error } = await supabase.from('packages').select('*').order('created_at', { ascending: true });
    if (error) console.error(error);
    else setPackages(data || []);
    setLoading(false);
  };

  const togglePackageStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('packages').update({ active: !currentStatus }).eq('id', id);
    if (!error) fetchPackages();
  };

  if (loading) return <div className="text-gray-400">Loading packages...</div>;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Package Management</h2>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">+ New Package</button>
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-800 text-gray-400">
            <th className="pb-3 font-medium">Code</th>
            <th className="pb-3 font-medium">Name</th>
            <th className="pb-3 font-medium">Price</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {packages.map(p => (
            <tr key={p.id} className="border-b border-gray-800/50">
              <td className="py-4 font-medium">{p.package_code}</td>
              <td className="py-4">{p.package_name}</td>
              <td className="py-4">₹{p.price}</td>
              <td className="py-4">
                <span className={`px-2 py-1 rounded text-xs ${p.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {p.active ? 'Active' : 'Disabled'}
                </span>
              </td>
              <td className="py-4 flex gap-2">
                <button className="text-indigo-400 hover:text-indigo-300 text-sm">Edit Price</button>
                <button onClick={() => togglePackageStatus(p.id, p.active)} className="text-gray-400 hover:text-white text-sm ml-4">
                  {p.active ? 'Disable' : 'Enable'}
                </button>
              </td>
            </tr>
          ))}
          {packages.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-gray-500">No packages configured.</td></tr>}
        </tbody>
      </table>
    </div>
  );
};
