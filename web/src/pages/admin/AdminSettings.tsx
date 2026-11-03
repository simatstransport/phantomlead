import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Save, ShieldCheck } from 'lucide-react';

export const AdminSettings = () => {
  const [settings, setSettings] = useState<Record<string, any>>({
    allow_signups: true,
    support_email: 'support@phantomlead.com',
    contact_number: '+91 9000000000',
    company_name: 'Phantom Lead'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase.from('admin_settings').select('key, value');
    if (error) {
      console.error(error);
    } else if (data && data.length > 0) {
      const loadedSettings = { ...settings };
      data.forEach(item => {
        loadedSettings[item.key] = item.value;
      });
      setSettings(loadedSettings);
    }
    setLoading(false);
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
      alert('Error saving settings: ' + error.message);
      return;
    }
    alert('Settings saved successfully!');
  };

  if (loading) return <div className="text-slate-400 font-mono text-xs">Loading settings...</div>;

  return (
    <div className="max-w-3xl glass-panel border border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl">
      <div className="flex items-center justify-between pb-4 sm:pb-6 mb-4 sm:mb-6 border-b border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 sm:w-6 h-5 sm:h-6 text-emerald-400" /> Platform Settings
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Global controls for user signups, access boundaries, and platform contact metadata.
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSave} className="space-y-6">
        {/* USER ACCESS & SIGNUPS */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono font-bold text-slate-300 border-b border-white/10 pb-2 uppercase tracking-wider">
            User Access &amp; Signups
          </h3>
          
          <div className="flex items-center justify-between p-4 bg-black/60 rounded-xl border border-white/10">
            <div>
              <div className="font-semibold text-sm text-white">Allow New Signups</div>
              <div className="text-xs text-slate-400 mt-0.5">Permit new student accounts to register on the platform</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.allow_signups} 
                onChange={e => setSettings({ ...settings, allow_signups: e.target.checked })} 
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        {/* BRANDING & CONTACT INFORMATION */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono font-bold text-slate-300 border-b border-white/10 pb-2 uppercase tracking-wider">
            Branding &amp; Contact Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">Company Name</label>
              <input 
                type="text" 
                value={settings.company_name || ''} 
                onChange={e => setSettings({ ...settings, company_name: e.target.value })} 
                className="w-full px-3.5 py-2.5 bg-black/80 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 text-white text-sm font-mono" 
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">Contact Number</label>
              <input 
                type="text" 
                value={settings.contact_number || ''} 
                onChange={e => setSettings({ ...settings, contact_number: e.target.value })} 
                className="w-full px-3.5 py-2.5 bg-black/80 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 text-white text-sm font-mono" 
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">Support Email</label>
            <input 
              type="email" 
              value={settings.support_email || ''} 
              onChange={e => setSettings({ ...settings, support_email: e.target.value })} 
              className="w-full px-3.5 py-2.5 bg-black/80 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 text-white text-sm font-mono" 
            />
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            Changes propagate to all visitors immediately.
          </span>
          <button 
            type="submit" 
            disabled={saving} 
            className="flex items-center px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold font-mono text-xs uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
