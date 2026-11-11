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

export const calculateDurationPrice = (_basePrice: number, months: number | null, packageCode?: string): number => {
  // Lifetime Access (all packages: 5000 RS)
  if (months === null) {
    return 5000;
  }
  
  // 1 Month
  if (months <= 1) {
    if (packageCode === 'FULL_ACCESS' || packageCode === 'JAVA_QA') return 2000;
    return 1500;
  }
  
  // 2 Months
  if (months === 2) {
    if (packageCode === 'JAVA_QA') return 2800;
    if (packageCode === 'FULL_ACCESS') return 2500;
    return 2000;
  }
  
  // 3 Months (Maximum term)
  if (months >= 3) {
    if (packageCode === 'JAVA_QA') return 3500;
    if (packageCode === 'FULL_ACCESS') return 3000;
    return 2500;
  }

  return 2000;
};

export const AdminPackages = () => {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [pricingMatrix, setPricingMatrix] = useState<Record<string, Record<string, number>>>({});
  const [modalForm, setModalForm] = useState({
    package_code: '',
    package_name: '',
    description: '',
    price: '2000',
    version: '1.0.0',
    active: true,
    price_1m: '2000',
    price_2m: '2500',
    price_3m: '3000',
    price_lifetime: '5000'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchPackages();
    fetchPricingMatrix();
  }, []);

  const fetchPricingMatrix = async () => {
    try {
      const { data } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'custom_package_pricing')
        .maybeSingle();

      if (data && data.value && typeof data.value === 'object') {
        setPricingMatrix(data.value);
      }
    } catch (e) {
      console.warn('Could not load custom pricing matrix', e);
    }
  };

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
      price: '2000',
      version: '1.0.0',
      active: true,
      price_1m: '2000',
      price_2m: '2500',
      price_3m: '3000',
      price_lifetime: '5000'
    });
    setErrorMsg('');
    setSuccessMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pkg: any) => {
    setEditingPackageId(pkg.id);
    const custom = pricingMatrix[pkg.package_code] || {};
    const p1 = custom['1'] !== undefined ? String(custom['1']) : String(pkg.price || '2000');
    const p2 = custom['2'] !== undefined ? String(custom['2']) : String(calculateDurationPrice(pkg.price, 2, pkg.package_code));
    const p3 = custom['3'] !== undefined ? String(custom['3']) : String(calculateDurationPrice(pkg.price, 3, pkg.package_code));
    const pLife = custom['lifetime'] !== undefined ? String(custom['lifetime']) : String(calculateDurationPrice(pkg.price, null, pkg.package_code));

    setModalForm({
      package_code: pkg.package_code,
      package_name: pkg.package_name,
      description: pkg.description || '',
      price: p1,
      version: pkg.version || '1.0.0',
      active: pkg.active !== false,
      price_1m: p1,
      price_2m: p2,
      price_3m: p3,
      price_lifetime: pLife
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

    const p1 = Number(modalForm.price_1m) || Number(modalForm.price) || 2000;
    const p2 = Number(modalForm.price_2m) || 2500;
    const p3 = Number(modalForm.price_3m) || 3000;
    const pLife = Number(modalForm.price_lifetime) || 5000;

    const updatedMatrix = {
      ...pricingMatrix,
      [code]: {
        '1': p1,
        '2': p2,
        '3': p3,
        'lifetime': pLife
      }
    };

    const packagePayload = {
      package_code: code,
      package_name: modalForm.package_name.trim(),
      description: modalForm.description.trim(),
      price: p1,
      version: modalForm.version.trim() || '1.0.0',
      active: modalForm.active
    };

    if (editingPackageId) {
      // 1. Update package in DB
      const { error } = await supabase.from('packages').update(packagePayload).eq('id', editingPackageId);

      // 2. Save month-wise pricing matrix into admin_settings
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.functions.invoke('admin-manage-packages', {
          body: {
            action: 'SAVE_PRICING_MATRIX',
            pricing_matrix: updatedMatrix
          }
        });
      }

      setIsSubmitting(false);
      if (error) {
        setErrorMsg('Error updating package: ' + error.message);
      } else {
        setPricingMatrix(updatedMatrix);
        setSuccessMsg('Package and month-wise prices updated successfully!');
        setTimeout(() => {
          setIsModalOpen(false);
          fetchPackages();
          fetchPricingMatrix();
        }, 800);
      }
    } else {
      // Create New Package
      const { error } = await supabase.from('packages').insert(packagePayload);

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.functions.invoke('admin-manage-packages', {
          body: {
            action: 'SAVE_PRICING_MATRIX',
            pricing_matrix: updatedMatrix
          }
        });
      }

      setIsSubmitting(false);
      if (error) {
        setErrorMsg('Error creating package: ' + error.message);
      } else {
        setPricingMatrix(updatedMatrix);
        setSuccessMsg('Package and month-wise prices created successfully!');
        setTimeout(() => {
          setIsModalOpen(false);
          fetchPackages();
          fetchPricingMatrix();
        }, 800);
      }
    }
  };



  if (loading) return <div className="text-gray-400">Loading package manager...</div>;

  return (
    <div className="bg-[#070b14] border border-gray-800 rounded-xl p-4 sm:p-6 shadow-2xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Package className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Full Package Management</h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Complete administrative control over all packages, codes, names, tools, adjustable month prices, and store visibility.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/dashboard/packages"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 sm:px-4 py-2 bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-700 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all hover:border-cyan-500/50 shadow-sm"
          >
            <ExternalLink className="w-4 h-4 text-cyan-400" /> Preview Store
          </Link>
          <button
            onClick={handleOpenCreate}
            className="px-3 sm:px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Package
          </button>
        </div>
      </div>

      {/* Package Table */}
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <table className="w-full min-w-[750px] text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
              <th className="pb-3.5 font-semibold">Package Code</th>
              <th className="pb-3.5 font-semibold">Package Name</th>
              <th className="pb-3.5 font-semibold">Included Tools / Description</th>
              <th className="pb-3.5 font-semibold">Month-Wise Rates</th>
              <th className="pb-3.5 font-semibold">Version</th>
              <th className="pb-3.5 font-semibold">Store Status</th>
              <th className="pb-3.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-800/60">
            {packages.map(p => {
              const custom = pricingMatrix[p.package_code] || {};
              const r1 = custom['1'] !== undefined ? custom['1'] : (Number(p.price) || 2000);
              const r2 = custom['2'] !== undefined ? custom['2'] : calculateDurationPrice(p.price, 2, p.package_code);
              const r3 = custom['3'] !== undefined ? custom['3'] : calculateDurationPrice(p.price, 3, p.package_code);
              const rLife = custom['lifetime'] !== undefined ? custom['lifetime'] : calculateDurationPrice(p.price, null, p.package_code);

              return (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="py-4 font-mono text-cyan-400 font-bold">
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
                  <td className="py-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-black/60 border border-white/10 text-[11px] font-mono text-gray-200">
                        1M: <strong className="text-emerald-400">₹{r1}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-black/60 border border-white/10 text-[11px] font-mono text-gray-200">
                        2M: <strong className="text-emerald-400">₹{r2}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-black/60 border border-white/10 text-[11px] font-mono text-gray-200">
                        3M: <strong className="text-emerald-400">₹{r3}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/50 text-[11px] font-mono text-cyan-300 font-bold">
                        ∞: ₹{rLife}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 font-mono text-xs text-gray-400">
                    v{p.version || '1.0.0'}
                  </td>
                  <td className="py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-max ${p.active ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      {p.active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {p.active ? 'Active in Store' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-700 hover:border-cyan-500 text-gray-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        title="Full access edit of all package properties and month rates"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-cyan-400" /> Edit Rates
                      </button>
                      <button
                        onClick={() => togglePackageStatus(p.id, p.active)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${p.active ? 'bg-yellow-950/30 text-yellow-400 border-yellow-800/50 hover:bg-yellow-900/40' : 'bg-cyan-950/30 text-cyan-400 border-cyan-800/50 hover:bg-cyan-900/40'}`}
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
              );
            })}
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
                  <Layers className="w-5 h-5 text-cyan-400" />
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
              <div className="p-3 mb-4 rounded-lg bg-cyan-950/60 border border-cyan-800 text-cyan-300 text-xs font-medium">
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
                    className="w-full px-3.5 py-2.5 bg-black border border-gray-800 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-500 font-bold"
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
                    className="w-full px-3.5 py-2.5 bg-black border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 font-semibold"
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
                  className="w-full px-3.5 py-2.5 bg-black border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 leading-relaxed"
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
                    className="w-full px-3.5 py-2.5 bg-black border border-gray-800 rounded-lg text-white font-mono text-base font-bold focus:outline-none focus:border-cyan-500"
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
                    className="w-full px-3.5 py-2.5 bg-black border border-gray-800 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${modalForm.active ? 'bg-cyan-500 text-black' : 'bg-gray-800 text-gray-400'}`}
                >
                  {modalForm.active ? 'Active (Live)' : 'Disabled'}
                </button>
              </div>

              {/* MONTH-WISE PRICING CONTROLS */}
              <div className="mt-4 p-4 rounded-xl bg-black border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Calculator className="w-3.5 h-3.5 text-cyan-400" /> Month-Wise Price Customization
                  </span>
                  <span className="text-[11px] text-gray-400">Directly syncs to Student Store</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      1 Month (₹)
                    </label>
                    <input
                      type="number"
                      step="50"
                      value={modalForm.price_1m}
                      onChange={e => {
                        const val = e.target.value;
                        setModalForm({ ...modalForm, price_1m: val, price: val });
                      }}
                      className="w-full px-3 py-2 bg-[#111] border border-gray-800 rounded-lg text-white font-mono text-sm font-bold focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      2 Months (₹)
                    </label>
                    <input
                      type="number"
                      step="50"
                      value={modalForm.price_2m}
                      onChange={e => setModalForm({ ...modalForm, price_2m: e.target.value })}
                      className="w-full px-3 py-2 bg-[#111] border border-gray-800 rounded-lg text-white font-mono text-sm font-bold focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      3 Months (₹)
                    </label>
                    <input
                      type="number"
                      step="50"
                      value={modalForm.price_3m}
                      onChange={e => setModalForm({ ...modalForm, price_3m: e.target.value })}
                      className="w-full px-3 py-2 bg-[#111] border border-gray-800 rounded-lg text-white font-mono text-sm font-bold focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-cyan-400 mb-1">
                      Lifetime (₹)
                    </label>
                    <input
                      type="number"
                      step="50"
                      value={modalForm.price_lifetime}
                      onChange={e => setModalForm({ ...modalForm, price_lifetime: e.target.value })}
                      className="w-full px-3 py-2 bg-[#111] border border-cyan-800/60 rounded-lg text-cyan-300 font-mono text-sm font-extrabold focus:outline-none focus:border-cyan-400"
                    />
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
                  className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2"
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
