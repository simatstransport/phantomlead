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
  Sparkles,
  Send,
  Users,
  Loader2
} from 'lucide-react';
import { 
  fetchActiveUsersForPackage, 
  broadcastPackageUpdate, 
  ActivePackageUser 
} from '../../services/packageUpdateService';

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
  const [autoNotifyOnSave, setAutoNotifyOnSave] = useState(false);
  const [originalVersion, setOriginalVersion] = useState('1.0.0');

  // Broadcast Modal State
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastPkg, setBroadcastPkg] = useState<any | null>(null);
  const [activeUsersLoading, setActiveUsersLoading] = useState(false);
  const [activeUsers, setActiveUsers] = useState<ActivePackageUser[]>([]);
  const [broadcastNotes, setBroadcastNotes] = useState('');
  const [testOnlyAdmin, setTestOnlyAdmin] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState<{ current: number; total: number; email: string } | null>(null);
  const [broadcastResult, setBroadcastResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
    setAutoNotifyOnSave(false);
    setOriginalVersion('1.0.0');
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
    setOriginalVersion(pkg.version || '1.0.0');
    setAutoNotifyOnSave(false);
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

  const handleOpenBroadcastModal = async (pkg: any) => {
    setBroadcastPkg(pkg);
    setBroadcastResult(null);
    setBroadcastProgress(null);
    setTestOnlyAdmin(false);

    let defaultNotes = '• New LMS Skill Assess Helper integrated with automated Ctrl+U keyboard shortcut.\n• Updated Safe Exam Browser (SEB 3.10.x) zero-detection whitelist signatures.\n• Enhanced AI accuracy and low-latency response generation.\n• Seamless in-place upgrade — no license key reset required.';
    if (pkg.package_code === 'FULL_ACCESS') {
      defaultNotes = '• All 7 extensions upgraded: Skill Assess, LMS MCQs, Viva Explainer, Java, Python 3, and C coding helpers.\n• Full Ctrl+U multi-question auto-solver support for LMS skill tests.\n• Updated Safe Exam Browser (SEB 3.10.x) compatibility.\n• Faster Gemini AI inference engine with lower latency.';
    } else if (pkg.package_code === 'JAVA_QA') {
      defaultNotes = '• Skill Assess Helper (Ctrl+U) added alongside Java Coding, Viva Paragraphs, and LMS MCQs.\n• SEB 3.10.x whitelist signatures updated.\n• Enhanced code generation accuracy.';
    }
    setBroadcastNotes(defaultNotes);

    setIsBroadcastModalOpen(true);
    setActiveUsersLoading(true);

    try {
      const users = await fetchActiveUsersForPackage(pkg.id);
      setActiveUsers(users);
    } catch {
      setActiveUsers([]);
    } finally {
      setActiveUsersLoading(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastPkg) return;
    setIsBroadcasting(true);
    setBroadcastResult(null);

    try {
      const res = await broadcastPackageUpdate({
        packageId: broadcastPkg.id,
        packageName: broadcastPkg.package_name,
        packageCode: broadcastPkg.package_code,
        version: broadcastPkg.version || '2.0.0',
        releaseNotes: broadcastNotes,
        targetEmails: testOnlyAdmin ? ['brokenvidplay0@gmail.com'] : undefined,
        onProgress: (current, total, email) => {
          setBroadcastProgress({ current, total, email });
        }
      });

      if (res.success) {
        setBroadcastResult({
          type: 'success',
          message: `✓ ${res.message}`
        });
      } else {
        setBroadcastResult({
          type: 'error',
          message: res.message || 'Failed to dispatch broadcast emails.'
        });
      }
    } catch (err: any) {
      setBroadcastResult({
        type: 'error',
        message: err.message || 'Unexpected error dispatching emails.'
      });
    } finally {
      setIsBroadcasting(false);
    }
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

        if (autoNotifyOnSave) {
          setSuccessMsg('Package updated! Dispatched automatic update emails to active users in background.');
          broadcastPackageUpdate({
            packageId: editingPackageId,
            packageName: modalForm.package_name,
            packageCode: code,
            version: modalForm.version,
            releaseNotes: `Version ${modalForm.version} deployed: Integrated new Skill Assess Helper (Ctrl+U), updated SEB 3.10.x whitelist signatures, and enhanced AI accuracy.`
          }).then(res => {
            console.log('[Auto-Notify Update Result]:', res);
          }).catch(e => {
            console.warn('[Auto-Notify Update Failed]:', e);
          });
        } else {
          setSuccessMsg('Package and month-wise prices updated successfully!');
        }

        setTimeout(() => {
          setIsModalOpen(false);
          fetchPackages();
          fetchPricingMatrix();
        }, 900);
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
                        onClick={() => handleOpenBroadcastModal(p)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:border-amber-400 text-amber-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        title="Broadcast package update announcement email to valid active license holders"
                      >
                        <Send className="w-3.5 h-3.5 text-amber-400" /> Send Update Email
                      </button>
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

              {/* AUTOMATED EMAIL DISPATCH TOGGLE (SHOWN WHEN EDITING AN EXISTING PACKAGE) */}
              {editingPackageId && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="auto_notify_users"
                    checked={autoNotifyOnSave}
                    onChange={e => setAutoNotifyOnSave(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-black border-gray-700 cursor-pointer shrink-0"
                  />
                  <label htmlFor="auto_notify_users" className="text-xs text-amber-200 cursor-pointer select-none">
                    <strong className="block text-white font-bold mb-1 flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-amber-400" />
                      Automatically email update notification to all valid active package users
                    </strong>
                    When enabled, saving this package will immediately dispatch an official release notification email (v{modalForm.version}{modalForm.version !== originalVersion ? ` - updated from v${originalVersion}` : ''}) to all valid, non-expired license holders of this package in the background.
                  </label>
                </div>
              )}

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

      {/* ========================================================================= */}
      {/* MANUAL TRIGGER: BROADCAST PACKAGE UPDATE EMAIL MODAL                      */}
      {/* ========================================================================= */}
      {isBroadcastModalOpen && broadcastPkg && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0e131d] border border-amber-500/40 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative my-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-5 pb-4 border-b border-gray-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Send className="w-4 h-4" />
                  </span>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                    Release Broadcast Desk
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  Send Update Email to Active Users
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Dispatches official software release notifications exclusively to valid, active license holders.
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsBroadcastModalOpen(false);
                  setBroadcastResult(null);
                  setBroadcastProgress(null);
                }} 
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {broadcastResult && (
              <div className={`p-4 mb-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
                broadcastResult.type === 'success' 
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' 
                  : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
              }`}>
                {broadcastResult.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{broadcastResult.message}</span>
              </div>
            )}

            {/* Package Specs Card */}
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 mb-4 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Target Package:</span>
                <span className="text-white font-bold">
                  {broadcastPkg.package_name} (<span className="text-cyan-400 font-mono">{broadcastPkg.package_code}</span>)
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Release Version:</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/50 text-cyan-300 font-mono font-bold">
                  v{broadcastPkg.version || '1.0.0'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-800">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  Audience (Active &amp; Valid Licenses):
                </span>
                <span className="text-emerald-400 font-bold font-mono">
                  {activeUsersLoading ? 'Scanning fleet...' : `${activeUsers.length} Active Customer${activeUsers.length !== 1 ? 's' : ''}`}
                </span>
              </div>
            </div>

            {/* Live Progress Bar during sending */}
            {broadcastProgress && (
              <div className="p-4 mb-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-xs space-y-2">
                <div className="flex justify-between text-cyan-300 font-mono">
                  <span>Dispatching Update Emails...</span>
                  <span>{broadcastProgress.current} / {broadcastProgress.total}</span>
                </div>
                <div className="w-full bg-black/60 rounded-full h-2 overflow-hidden border border-cyan-500/30">
                  <div 
                    className="bg-cyan-400 h-full transition-all duration-300"
                    style={{ width: `${(broadcastProgress.current / broadcastProgress.total) * 100}%` }}
                  />
                </div>
                <div className="text-[11px] text-gray-400 truncate">
                  Currently emailing: <span className="text-white font-mono">{broadcastProgress.email}</span>
                </div>
              </div>
            )}

            {/* Release Notes Input */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                  Release Highlights (Included in Email HTML)
                </label>
                <textarea
                  rows={4}
                  value={broadcastNotes}
                  onChange={e => setBroadcastNotes(e.target.value)}
                  disabled={isBroadcasting}
                  className="w-full px-3.5 py-2.5 bg-black border border-gray-800 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500 leading-relaxed font-sans"
                  placeholder="Describe what's new (e.g. New Skill Assess tool, shortcuts, SEB whitelist)..."
                />
              </div>

              {/* Safety Test Mode Toggle */}
              <div className="p-3 rounded-lg bg-gray-900/80 border border-gray-800 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="test_mode"
                  checked={testOnlyAdmin}
                  onChange={e => setTestOnlyAdmin(e.target.checked)}
                  disabled={isBroadcasting}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-black border-gray-700 cursor-pointer"
                />
                <label htmlFor="test_mode" className="text-xs text-gray-300 cursor-pointer select-none">
                  <span className="text-white font-semibold block">Safety Guard (Test Mode)</span>
                  Send preview email only to Admin (<span className="text-cyan-400 font-mono">brokenvidplay0@gmail.com</span>)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  disabled={isBroadcasting}
                  className="px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendBroadcast}
                  disabled={isBroadcasting || (activeUsers.length === 0 && !testOnlyAdmin)}
                  className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isBroadcasting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Broadcasting Emails...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{testOnlyAdmin ? 'Send Test Email to Admin' : `Broadcast to ${activeUsers.length} Active Users`}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
