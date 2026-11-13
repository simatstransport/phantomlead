import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { 
  Save, 
  ShieldCheck, 
  QrCode, 
  UserPlus, 
  Trash2, 
  Shield, 
  UserCheck, 
  AlertCircle,
  Crown,
  Search
} from 'lucide-react';

interface CoAdmin {
  email: string;
  name?: string;
  added_at: string;
  added_by?: string;
}

interface CustomerOption {
  id: string;
  email: string;
  full_name: string;
}

export const AdminSettings = () => {
  const [settings, setSettings] = useState<Record<string, any>>({
    allow_signups: true,
    support_email: 'support@phantomlead.com',
    contact_number: '+91 9000000000',
    company_name: 'Phantom Lead',
    merchant_upi_id: 'phantomlead@upi',
    merchant_upi_name: 'Phantom Lead',
    co_admins: []
  });
  const [coAdmins, setCoAdmins] = useState<CoAdmin[]>([]);
  const [newCoAdminEmail, setNewCoAdminEmail] = useState('');
  const [newCoAdminName, setNewCoAdminName] = useState('');
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchCustomersList();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase.from('admin_settings').select('key, value');
    if (error) {
      console.error(error);
    } else if (data && data.length > 0) {
      const loadedSettings = { ...settings };
      data.forEach(item => {
        loadedSettings[item.key] = item.value;
        if (item.key === 'co_admins' && Array.isArray(item.value)) {
          setCoAdmins(item.value);
        }
      });
      setSettings(loadedSettings);
    }
    setLoading(false);
  };

  const fetchCustomersList = async () => {
    try {
      const { data } = await supabase
        .from('customers')
        .select('id, email, full_name')
        .order('created_at', { ascending: false });
      if (data) {
        setCustomers(data);
      }
    } catch (err) {
      console.warn('Could not load customers for promotion dropdown:', err);
    }
  };

  const showNotice = (type: 'success' | 'error', message: string) => {
    setActionNotice({ type, message });
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handlePromoteCoAdmin = async (targetEmail: string, targetName?: string) => {
    const trimmedEmail = targetEmail.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      showNotice('error', 'Please provide a valid candidate email.');
      return;
    }

    // Check if already in list
    if (coAdmins.some(a => a.email.toLowerCase() === trimmedEmail)) {
      showNotice('error', `${trimmedEmail} is already promoted as Co-Admin.`);
      return;
    }

    const newEntry: CoAdmin = {
      email: trimmedEmail,
      name: targetName?.trim() || trimmedEmail.split('@')[0],
      added_at: new Date().toISOString()
    };

    const updatedList = [newEntry, ...coAdmins];
    setSaving(true);

    try {
      // 1. Update admin_settings table
      const { error: setErr } = await supabase
        .from('admin_settings')
        .upsert({
          key: 'co_admins',
          value: updatedList,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (setErr) throw setErr;

      // 2. Also try to elevate in profiles table if customer row exists with user_id
      try {
        const { data: customerRow } = await supabase
          .from('customers')
          .select('user_id')
          .eq('email', trimmedEmail)
          .single();

        if (customerRow?.user_id) {
          await supabase
            .from('profiles')
            .update({ role: 'co_admin' })
            .eq('id', customerRow.user_id);
        }
      } catch (profErr) {
        console.warn('Profiles update skipped (user will have co_admin via registry):', profErr);
      }

      setCoAdmins(updatedList);
      setSettings(prev => ({ ...prev, co_admins: updatedList }));
      setNewCoAdminEmail('');
      setNewCoAdminName('');
      showNotice('success', `Successfully promoted ${trimmedEmail} to Co-Admin.`);
    } catch (err: any) {
      showNotice('error', 'Failed to promote: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoAdmin = async (targetEmail: string) => {
    const trimmedEmail = targetEmail.trim().toLowerCase();
    if (!window.confirm(`Are you sure you want to REVOKE Co-Admin rights from "${trimmedEmail}"?`)) {
      return;
    }

    const updatedList = coAdmins.filter(a => a.email.toLowerCase() !== trimmedEmail);
    setSaving(true);

    try {
      // 1. Update admin_settings
      const { error: setErr } = await supabase
        .from('admin_settings')
        .upsert({
          key: 'co_admins',
          value: updatedList,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (setErr) throw setErr;

      // 2. Demote back in profiles table if applicable
      try {
        const { data: customerRow } = await supabase
          .from('customers')
          .select('user_id')
          .eq('email', trimmedEmail)
          .single();

        if (customerRow?.user_id) {
          await supabase
            .from('profiles')
            .update({ role: 'customer' })
            .eq('id', customerRow.user_id);
        }
      } catch (profErr) {
        console.warn('Profiles role revert skipped:', profErr);
      }

      setCoAdmins(updatedList);
      setSettings(prev => ({ ...prev, co_admins: updatedList }));
      showNotice('success', `Revoked Co-Admin permissions from ${trimmedEmail}.`);
    } catch (err: any) {
      showNotice('error', 'Failed to remove: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const upserts = Object.keys(settings).map(key => ({
      key,
      value: settings[key],
      updated_at: new Date().toISOString()
    }));
    
    const { error } = await supabase
      .from('admin_settings')
      .upsert(upserts, { onConflict: 'key' });

    setSaving(false);
    if (error) {
      console.error('Failed to save settings:', error);
      showNotice('error', 'Error saving settings: ' + error.message);
      return;
    }
    showNotice('success', 'Settings saved successfully!');
  };

  const filteredCustomerOptions = customers.filter(c => {
    if (!customerSearch.trim()) return false;
    const q = customerSearch.toLowerCase();
    return (
      c.email.toLowerCase().includes(q) ||
      (c.full_name && c.full_name.toLowerCase().includes(q))
    );
  }).slice(0, 5);

  if (loading) return <div className="text-slate-400 font-mono text-xs">Loading settings...</div>;

  return (
    <div className="max-w-4xl glass-panel border border-slate-800/80 dark:border-white/10 light:border-slate-200 rounded-3xl p-5 sm:p-8 shadow-2xl bg-[#0d1117] dark:bg-[#0d1117] light:bg-white space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800/80 dark:border-white/10 light:border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-400" /> Platform &amp; Administration Settings
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
            Global controls for user signups, co-admin delegation, payment settings, and contact metadata.
          </p>
        </div>
      </div>

      {actionNotice && (
        <div className={`p-4 rounded-2xl border text-sm flex items-center gap-3 ${
          actionNotice.type === 'success' 
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' 
            : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
        }`}>
          {actionNotice.type === 'success' ? <UserCheck className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{actionNotice.message}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 1: CO-ADMIN DELEGATION & MANAGEMENT */}
      {/* ======================================================== */}
      <div className="space-y-5 rounded-2xl bg-black/40 border border-emerald-500/20 p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Promote Co-Admin &amp; Delegated Staff</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Co-Admins gain access to the Admin Dashboard to manage licenses, approve payments, and support students.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full shrink-0">
            {coAdmins.length} Active Co-Admin{coAdmins.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Promote Form */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          <div className="md:col-span-6 relative">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Candidate Email or Search User <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="student@example.com"
                value={newCoAdminEmail}
                onChange={e => {
                  setNewCoAdminEmail(e.target.value);
                  setCustomerSearch(e.target.value);
                }}
                className="w-full pl-9 pr-3.5 py-2.5 bg-black/50 border border-white/10 focus:border-emerald-500 rounded-xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>

            {/* Quick Suggestions from Registered Customers */}
            {filteredCustomerOptions.length > 0 && customerSearch.trim().length > 1 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-slate-900 border border-white/15 rounded-xl shadow-2xl overflow-hidden">
                <div className="px-3 py-1.5 text-[10px] font-mono text-slate-400 border-b border-white/10 bg-black/40">
                  Select Registered Customer to Promote:
                </div>
                {filteredCustomerOptions.map(cust => (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => {
                      setNewCoAdminEmail(cust.email);
                      setNewCoAdminName(cust.full_name || '');
                      setCustomerSearch('');
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-emerald-500/15 flex items-center justify-between text-xs text-slate-200 border-b border-white/5 last:border-b-0"
                  >
                    <span className="font-semibold text-white">{cust.full_name || 'Customer'}</span>
                    <span className="font-mono text-emerald-400 text-[11px]">{cust.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-4">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Display Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Staff Manager"
              value={newCoAdminName}
              onChange={e => setNewCoAdminName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 focus:border-emerald-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="button"
              disabled={saving || !newCoAdminEmail.trim()}
              onClick={() => handlePromoteCoAdmin(newCoAdminEmail, newCoAdminName)}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 rounded-xl font-bold font-mono text-xs uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Promote</span>
            </button>
          </div>
        </div>

        {/* Existing Co-Admins List */}
        <div className="pt-3">
          <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
            Current Co-Admins &amp; Permissions
          </label>

          {coAdmins.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-white/10 bg-black/20 text-center text-xs text-slate-500 font-mono">
              No Co-Admins assigned yet. Promote a trusted team member above to grant admin access.
            </div>
          ) : (
            <div className="space-y-2">
              {coAdmins.map(admin => (
                <div
                  key={admin.email}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-black/50 border border-white/10 hover:border-emerald-500/40 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white flex items-center gap-2">
                        <span>{admin.name || admin.email.split('@')[0]}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          CO-ADMIN
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {admin.email} • Promoted on {new Date(admin.added_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Delete / Revoke Co-Admin Action */}
                  <button
                    type="button"
                    onClick={() => handleDeleteCoAdmin(admin.email)}
                    className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500/25 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono font-bold"
                    title={`Revoke Co-Admin rights from ${admin.email}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Delete Co-Admin</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 2: GLOBAL SETTINGS FORM */}
      {/* ======================================================== */}
      <form onSubmit={handleSave} className="space-y-6 pt-2">
        {/* USER ACCESS & SIGNUPS */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono font-bold text-slate-300 dark:text-slate-300 light:text-slate-700 border-b border-slate-800/80 dark:border-white/10 light:border-slate-200 pb-2 uppercase tracking-wider">
            User Access &amp; Signups
          </h3>
          
          <div className="flex items-center justify-between p-4 bg-black/40 dark:bg-black/40 light:bg-slate-50 rounded-xl border border-slate-800/80 dark:border-white/10 light:border-slate-200">
            <div>
              <div className="font-semibold text-sm text-white dark:text-white light:text-slate-900">Allow New Signups</div>
              <div className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-0.5">Permit new student accounts to register on the platform</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.allow_signups} 
                onChange={e => setSettings({ ...settings, allow_signups: e.target.checked })} 
              />
              <div className="w-11 h-6 bg-slate-800 dark:bg-slate-800 light:bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        {/* BRANDING & CONTACT INFORMATION */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono font-bold text-slate-300 dark:text-slate-300 light:text-slate-700 border-b border-slate-800/80 dark:border-white/10 light:border-slate-200 pb-2 uppercase tracking-wider">
            Branding &amp; Contact Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-600 mb-1">Company Name</label>
              <input 
                type="text" 
                value={settings.company_name || ''} 
                onChange={e => setSettings({ ...settings, company_name: e.target.value })} 
                className="w-full px-3.5 py-2.5 bg-black/40 dark:bg-black/40 light:bg-slate-50 border border-slate-800/80 dark:border-white/10 light:border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-white dark:text-white light:text-slate-900 text-sm font-mono" 
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-600 mb-1">Contact Number</label>
              <input 
                type="text" 
                value={settings.contact_number || ''} 
                onChange={e => setSettings({ ...settings, contact_number: e.target.value })} 
                className="w-full px-3.5 py-2.5 bg-black/40 dark:bg-black/40 light:bg-slate-50 border border-slate-800/80 dark:border-white/10 light:border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-white dark:text-white light:text-slate-900 text-sm font-mono" 
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-600 mb-1">Support Email</label>
            <input 
              type="email" 
              value={settings.support_email || ''} 
              onChange={e => setSettings({ ...settings, support_email: e.target.value })} 
              className="w-full px-3.5 py-2.5 bg-black/40 dark:bg-black/40 light:bg-slate-50 border border-slate-800/80 dark:border-white/10 light:border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-white dark:text-white light:text-slate-900 text-sm font-mono" 
            />
          </div>
        </div>

        {/* UPI PAYMENT SETTINGS */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono font-bold text-slate-300 dark:text-slate-300 light:text-slate-700 border-b border-slate-800/80 dark:border-white/10 light:border-slate-200 pb-2 uppercase tracking-wider flex items-center gap-2">
            <QrCode className="w-4 h-4 text-emerald-400" /> Merchant UPI Payment Gateway
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">
            Configure the UPI ID (VPA) and payee name displayed to students and customers during their package checkout process.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-600 mb-1">
                Merchant UPI ID (VPA) <span className="text-rose-400">*</span>
              </label>
              <input 
                type="text" 
                required
                placeholder="e.g. yourname@okaxis or company@upi"
                value={settings.merchant_upi_id || ''} 
                onChange={e => setSettings({ ...settings, merchant_upi_id: e.target.value })} 
                className="w-full px-3.5 py-2.5 bg-black/40 dark:bg-black/40 light:bg-slate-50 border border-emerald-500/30 rounded-xl focus:outline-none focus:border-emerald-500 text-white dark:text-white light:text-slate-900 text-sm font-mono font-bold" 
              />
              <span className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 mt-1 block">
                This exact UPI ID will be shown to customers to transfer payments.
              </span>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-400 light:text-slate-600 mb-1">
                Merchant / Business Name
              </label>
              <input 
                type="text" 
                placeholder="e.g. Phantom Lead"
                value={settings.merchant_upi_name || ''} 
                onChange={e => setSettings({ ...settings, merchant_upi_name: e.target.value })} 
                className="w-full px-3.5 py-2.5 bg-black/40 dark:bg-black/40 light:bg-slate-50 border border-slate-800/80 dark:border-white/10 light:border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 text-white dark:text-white light:text-slate-900 text-sm font-mono" 
              />
              <span className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 mt-1 block">
                Optional business display name shown next to the UPI handle.
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between">
            <span className="text-slate-300 dark:text-slate-300 light:text-slate-700 font-mono">Live Customer Preview:</span>
            <span className="font-mono font-bold text-emerald-400 dark:text-emerald-300 light:text-emerald-800 bg-black/60 dark:bg-black/60 light:bg-white px-3 py-1 rounded-lg border border-emerald-500/30">
              {settings.merchant_upi_id || 'phantomlead@upi'}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800/80 dark:border-white/10 light:border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            Changes propagate to all visitors immediately.
          </span>
          <button 
            type="submit" 
            disabled={saving} 
            className="flex items-center px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold font-mono text-xs uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
