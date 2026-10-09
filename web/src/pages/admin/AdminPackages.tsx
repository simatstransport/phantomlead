import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { 
  Package, 
  ExternalLink, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  X, 
  Calculator,
  Layers,
  Sparkles
} from 'lucide-react';

export const calculateDurationPrice = (basePrice: number, months: number | null): number => {
  const p = Number(basePrice) || 3000;
  if (months === null) {
    return Math.round(p * 2.8 / 50) * 50;
  }
  if (months <= 1) return Math.round(p);
  const multiplier = Math.pow(months, 0.76);
  return Math.round((p * multiplier) / 50) * 50;
};

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
    price: '3000',
    version: '1.0.0',
    active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
    if (!error) {
      fetchPackages();
    } else {
      alert('Error updating package status: ' + error.message);
    }
  };

  const handleDeletePackage = async (pkg: any) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${pkg.package_name}" (${pkg.package_code})? This action cannot be undone.`);
    if (!confirmed) return;

    const { error } = await supabase.from('packages').delete().eq('id', pkg.id);
    if (error) {
      alert(`Cannot delete package: ${error.message}\n\nTip: If existing customer licenses or payments reference this package, you should Disable it instead of deleting.`);
    } else {
      alert(`Package "${pkg.package_name}" deleted successfully.`);
      fetchPackages();
    }
  };

  const handleOpenCreate = () => {
    setEditingPackageId(null);
    setModalForm({
      package_code: '',
      package_name: '',
      description: '',
      price: '3000',
      version: '1.0.0',
      active: true
    });
    setErrorMsg('');
    setSuccessMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pkg: any) => {
    setEditingPackageId(pkg.id);
    setModalForm({
      package_code: pkg.package_code,
      package_name: pkg.package_name,
      description: pkg.description || '',
      price: String(pkg.price),
      version: pkg.version || '1.0.0',
      active: pkg.active !== false
    });
    setErrorMsg('');
    setSuccessMsg('');
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const numPrice = Number(modalForm.price);
    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMsg('Please enter a valid base price.');
      setIsSubmitting(false);
      return;
    }

    const code = modalForm.package_code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    if (!code) {
      setErrorMsg('Package code is required.');
      setIsSubmitting(false);
      return;
    }

    if (editingPackageId) {
      // Full Access Update
      const { error } = await supabase.from('packages').update({
        package_code: code,
        package_name: modalForm.package_name.trim(),
        description: modalForm.description.trim(),
        price: numPrice,
        version: modalForm.version.trim() || '1.0.0',
        active: modalForm.active
      }).eq('id', editingPackageId);

      setIsSubmitting(false);
      if (error) {
        setErrorMsg('Error updating package: ' + error.message);
      } else {
        setSuccessMsg('Package updated successfully!');
        setTimeout(() => {
          setIsModalOpen(false);
          fetchPackages();
        }, 800);
      }
    } else {
      // Create New Package
      const { error } = await supabase.from('packages').insert({
        package_code: code,
        package_name: modalForm.package_name.trim(),
        description: modalForm.description.trim(),
        price: numPrice,
        version: modalForm.version.trim() || '1.0.0',
        active: modalForm.active
      });

      setIsSubmitting(false);
      if (error) {
        setErrorMsg('Error creating package: ' + error.message);
      } else {
        setSuccessMsg('Package created successfully!');
        setTimeout(() => {
          setIsModalOpen(false);
          fetchPackages();
        }, 800);
      }
    }
  };

  const currentModalPrice = Number(modalForm.price) || 0;

  if (loading) return <div className="text-gray-400">Loading package manager...</div>;

  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 shadow-2xl">
      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-6 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
              <Package className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">Full Package Management</h2>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Complete administrative control over all packages, codes, names, tools, adjustable month prices, and store visibility.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/packages"
            target="_blank"
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-700 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all hover:border-green-500/50 shadow-sm"
          >
            <ExternalLink className="w-4 h-4 text-green-400" /> Preview Student Store
          </Link>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Package
          </button>
        </div>
      </div>

      {/* Package Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
              <th className="pb-3.5 font-semibold">Package Code</th>
              <th className="pb-3.5 font-semibold">Package Name</th>
              <th className="pb-3.5 font-semibold">Included Tools / Description</th>
              <th className="pb-3.5 font-semibold">Base Price (1 Mo)</th>
              <th className="pb-3.5 font-semibold">Version</th>
              <th className="pb-3.5 font-semibold">Store Status</th>
              <th className="pb-3.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-800/60">
            {packages.map(p => (
              <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="py-4 font-mono text-green-400 font-bold">
                  {p.package_code}
                </td>
                <td className="py-4 font-semibold text-white">
                  {p.package_name}
                </td>
                <td className="py-4 text-gray-300 max-w-xs">
                  <div className="truncate text-xs leading-relaxed" title={p.description}>
                    {p.description || <span className="text-gray-600 italic">No description</span>}
                  </div>
                </td>
                <td className="py-4 font-extrabold text-white text-base">
                  ₹{p.price}
                  <span className="text-xs font-normal text-gray-500 block">/ month base</span>
                </td>
                <td className="py-4 font-mono text-xs text-gray-400">
                  v{p.version || '1.0.0'}
                </td>
                <td className="py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-max ${p.active ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {p.active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {p.active ? 'Active in Store' : 'Disabled'}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-700 hover:border-green-500 text-gray-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      title="Full access edit of all package properties"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-green-400" /> Full Edit
                    </button>
                    <button
                      onClick={() => togglePackageStatus(p.id, p.active)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${p.active ? 'bg-yellow-950/30 text-yellow-400 border-yellow-800/50 hover:bg-yellow-900/40' : 'bg-green-950/30 text-green-400 border-green-800/50 hover:bg-green-900/40'}`}
                      title={p.active ? 'Hide from student store' : 'Publish to student store'}
                    >
                      {p.active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDeletePackage(p)}
                      className="p-1.5 rounded-lg bg-red-950/30 text-red-400 hover:text-red-300 border border-red-900/40 hover:bg-red-900/50 transition-all cursor-pointer"
                      title="Delete package"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {packages.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-500">
                  No packages configured in database. Click "+ Create Package" to add your first package.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FULL ACCESS EDIT & CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111612] border border-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-800">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-green-400" />
                  {editingPackageId ? 'Full Edit: Package Properties' : 'Create New Package'}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Adjust code, display name, included tools, base pricing, and release version.
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 mb-4 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 mb-4 rounded-lg bg-green-950/60 border border-green-800 text-green-300 text-xs font-medium">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                    Package Code (Identifier)
                  </label>
                  <input
                    required
                    type="text"
                    value={modalForm.package_code}
                    onChange={e => setModalForm({...modalForm, package_code: e.target.value.toUpperCase()})}
                    className="w-full px-3.5 py-2.5 bg-black border border-gray-800 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-green-500 font-bold"
                    placeholder="e.g. FULL_ACCESS"
                  />
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    Unique uppercase token matched by installer licenses.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                    Package Name
                  </label>
                  <input
                    required
                    type="text"
                    value={modalForm.package_name}
                    onChange={e => setModalForm({...modalForm, package_name: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-black border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-green-500 font-semibold"
                    placeholder="e.g. Full Access Suite"
                  />
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    Public title shown in Buy Packages store.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                  Description / Included Tools List
                </label>
                <textarea
                  rows={2}
                  value={modalForm.description}
                  onChange={e => setModalForm({...modalForm, description: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-black border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-green-500 leading-relaxed"
                  placeholder="e.g. Java coding, Viva paragraph, LMS MCQ"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  Comma-separated list automatically renders as verified tool checkmarks in the student store.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                    Base 1-Month Price (₹ INR)
                  </label>
                  <input
                    required
                    type="number"
                    min="100"
                    step="50"
                    value={modalForm.price}
                    onChange={e => setModalForm({...modalForm, price: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-black border border-gray-800 rounded-lg text-white font-mono text-base font-bold focus:outline-none focus:border-green-500"
                    placeholder="e.g. 3000"
                  />
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    Base price for 1-month. Multi-month & lifetime scale from this.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                    Version Tag
                  </label>
                  <input
                    type="text"
                    value={modalForm.version}
                    onChange={e => setModalForm({...modalForm, version: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-black border border-gray-800 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-green-500"
                    placeholder="e.g. 3.10.2"
                  />
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    SEB extension release version (default 1.0.0).
                  </span>
                </div>
              </div>

              {/* Status Switch */}
              <div className="pt-2 flex items-center justify-between p-3 rounded-lg bg-black border border-gray-800">
                <div>
                  <span className="text-sm font-semibold text-white block">Publish to Student Store</span>
                  <span className="text-xs text-gray-400">Control if students can buy this package on `/dashboard/packages`</span>
                </div>
                <button
                  type="button"
                  onClick={() => setModalForm({...modalForm, active: !modalForm.active})}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${modalForm.active ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                >
                  {modalForm.active ? 'Active (Live)' : 'Disabled'}
                </button>
              </div>

              {/* DYNAMIC MONTHLY PRICE PREVIEW ACCORDION */}
              <div className="mt-4 p-4 rounded-xl bg-black border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <Calculator className="w-3.5 h-3.5 text-green-400" /> Dynamic Adjustable Month Pricing Preview
                  </span>
                  <span className="text-[11px] text-gray-500">Auto-scales in student store</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                  <div className="p-2 rounded bg-[#111] border border-gray-800/80">
                    <div className="text-gray-400 text-[10px]">1 Month</div>
                    <div className="font-bold text-white mt-0.5">₹{calculateDurationPrice(currentModalPrice, 1)}</div>
                  </div>
                  <div className="p-2 rounded bg-[#111] border border-gray-800/80">
                    <div className="text-gray-400 text-[10px]">2 Months</div>
                    <div className="font-bold text-white mt-0.5">₹{calculateDurationPrice(currentModalPrice, 2)}</div>
                  </div>
                  <div className="p-2 rounded bg-[#111] border border-gray-800/80">
                    <div className="text-gray-400 text-[10px]">3 Months</div>
                    <div className="font-bold text-white mt-0.5">₹{calculateDurationPrice(currentModalPrice, 3)}</div>
                  </div>
                  <div className="p-2 rounded bg-[#111] border border-gray-800/80">
                    <div className="text-gray-400 text-[10px]">6 Months</div>
                    <div className="font-bold text-white mt-0.5">₹{calculateDurationPrice(currentModalPrice, 6)}</div>
                  </div>
                  <div className="p-2 rounded bg-[#111] border border-gray-800/80">
                    <div className="text-gray-400 text-[10px]">12 Months</div>
                    <div className="font-bold text-white mt-0.5">₹{calculateDurationPrice(currentModalPrice, 12)}</div>
                  </div>
                  <div className="p-2 rounded bg-[#111] border border-green-900/50 text-green-400">
                    <div className="text-green-500 text-[10px] font-semibold">Lifetime</div>
                    <div className="font-extrabold text-green-400 mt-0.5">₹{calculateDurationPrice(currentModalPrice, null)}</div>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {isSubmitting ? 'Saving...' : editingPackageId ? 'Save Package Changes' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
