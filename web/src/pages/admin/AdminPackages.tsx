import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Package, ExternalLink, Plus, Edit2, CheckCircle2, XCircle, X } from 'lucide-react';

export const AdminPackages = () => {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [modalForm, setModalForm] = useState({
    package_code: '',
    package_name: '',
    description: '',
    price: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
    else alert('Error updating package status: ' + error.message);
  };

  const handleOpenCreate = () => {
    setEditingPackageId(null);
    setModalForm({
      package_code: '',
      package_name: '',
      description: '',
      price: '3000'
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pkg: any) => {
    setEditingPackageId(pkg.id);
    setModalForm({
      package_code: pkg.package_code,
      package_name: pkg.package_name,
      description: pkg.description || '',
      price: String(pkg.price)
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    const numPrice = Number(modalForm.price);
    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMsg('Please enter a valid positive price.');
      setIsSubmitting(false);
      return;
    }

    if (editingPackageId) {
      // Update existing package
      const { error } = await supabase.from('packages').update({
        package_name: modalForm.package_name.trim(),
        description: modalForm.description.trim(),
        price: numPrice
      }).eq('id', editingPackageId);

      setIsSubmitting(false);
      if (error) {
        setErrorMsg('Error updating package: ' + error.message);
      } else {
        setIsModalOpen(false);
        fetchPackages();
      }
    } else {
      // Create new package
      const code = modalForm.package_code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
      const { error } = await supabase.from('packages').insert({
        package_code: code,
        package_name: modalForm.package_name.trim(),
        description: modalForm.description.trim(),
        price: numPrice,
        active: true,
        version: '1.0.0'
      });

      setIsSubmitting(false);
      if (error) {
        setErrorMsg('Error creating package: ' + error.message);
      } else {
        setIsModalOpen(false);
        fetchPackages();
      }
    }
  };

  if (loading) return <div className="text-gray-400">Loading packages...</div>;

  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Package className="w-5 h-5 text-green-400" /> Package Management
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Configure packages, base prices, and active offerings. Changes sync directly to the customer Buy Packages store.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/packages"
            target="_blank"
            className="px-3.5 py-2 bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-700 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-green-400" /> View in Buy Packages Store
          </Link>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-[0_0_12px_rgba(34,197,94,0.2)] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Package
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-sm">
              <th className="pb-3 font-medium">Code</th>
              <th className="pb-3 font-medium">Name</th>
              <th className="pb-3 font-medium">Description / Tools</th>
              <th className="pb-3 font-medium">Base Price (1 Mo)</th>
              <th className="pb-3 font-medium">Store Status</th>
              <th className="pb-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {packages.map(p => (
              <tr key={p.id} className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors">
                <td className="py-4 font-mono text-green-400 font-semibold">{p.package_code}</td>
                <td className="py-4 font-medium text-white">{p.package_name}</td>
                <td className="py-4 text-gray-400 max-w-xs truncate" title={p.description}>{p.description || 'No description'}</td>
                <td className="py-4 font-bold text-white">₹{p.price}</td>
                <td className="py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-max ${p.active ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                    {p.active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {p.active ? 'Active in Store' : 'Disabled'}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="px-2.5 py-1 rounded bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit2 className="w-3 h-3 text-green-400" /> Edit
                    </button>
                    <button
                      onClick={() => togglePackageStatus(p.id, p.active)}
                      className={`px-2.5 py-1 rounded text-xs font-medium border cursor-pointer transition-colors ${p.active ? 'bg-red-950/40 text-red-400 border-red-900/50 hover:bg-red-900/60' : 'bg-green-950/40 text-green-400 border-green-900/50 hover:bg-green-900/60'}`}
                    >
                      {p.active ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {packages.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  No packages configured in database. Click "+ New Package" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">
                {editingPackageId ? 'Edit Package' : 'Create New Package'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 mb-4 rounded bg-red-950/60 border border-red-800 text-red-400 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-4">
              {!editingPackageId && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Package Code (Uppercase / Identifier)</label>
                  <input
                    required
                    type="text"
                    value={modalForm.package_code}
                    onChange={e => setModalForm({...modalForm, package_code: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-green-500"
                    placeholder="e.g. ADVANCED_SUITE"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Package Name</label>
                <input
                  required
                  type="text"
                  value={modalForm.package_name}
                  onChange={e => setModalForm({...modalForm, package_name: e.target.value})}
                  className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
                  placeholder="e.g. Full Access Suite"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Description / Tools Included (Comma separated)</label>
                <textarea
                  rows={3}
                  value={modalForm.description}
                  onChange={e => setModalForm({...modalForm, description: e.target.value})}
                  className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
                  placeholder="e.g. Java coding, Viva paragraph, LMS MCQ"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Base Price (INR for 1 Month)</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="50"
                  value={modalForm.price}
                  onChange={e => setModalForm({...modalForm, price: e.target.value})}
                  className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-green-500"
                  placeholder="e.g. 4000"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  Multi-month and lifetime prices in the student store will scale proportionally from this base price.
                </span>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-lg text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg text-sm font-bold cursor-pointer transition-colors"
                >
                  {isSubmitting ? 'Saving...' : editingPackageId ? 'Update Package' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
