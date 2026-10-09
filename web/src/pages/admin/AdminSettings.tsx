import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Save, AlertTriangle, Clock, ShieldCheck } from 'lucide-react';

export const AdminSettings = () => {
  const [settings, setSettings] = useState<Record<string, any>>({
    maintenance_mode: false,
    maintenance_end_time: '',
    maintenance_message: 'Our engineering team is actively upgrading system components. All customer sessions and logins are temporarily locked. Please come back and log in at the scheduled completion time.',
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

  const addTimeToEndTime = (hoursToAdd: number) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + Math.round(hoursToAdd * 60));
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    setSettings(prev => ({ ...prev, maintenance_end_time: localISOTime }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const upserts = Object.keys(settings).map(key => ({
      key,
      value: settings[key],
      updated_at: new Date().toISOString()
    }));
    
    for (const u of upserts) {
      const { data: existing } = await supabase.from('admin_settings').select('id').eq('key', u.key).maybeSingle();
      if (existing) {
        await supabase.from('admin_settings').update({ value: u.value, updated_at: u.updated_at }).eq('id', existing.id);
      } else {
        await supabase.from('admin_settings').insert(u);
      }
    }
    
    setSaving(false);
    alert('Settings saved successfully! ' + (settings.maintenance_mode ? 'Maintenance mode is now ACTIVE for all non-admin users.' : 'Maintenance mode is OFF.'));
  };

  if (loading) return <div className="text-gray-400">Loading settings...</div>;

  return (
    <div className="max-w-3xl bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-green-400" /> Platform Settings
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Global controls for Maintenance Mode, end-time scheduling, user signups, and branding.
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSave} className="space-y-6">
        {/* MAINTENANCE MODE SECTION */}
        <div className="p-5 bg-[#0e1410] border border-green-900/40 rounded-xl space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-bold text-base text-white flex items-center gap-2">
                Maintenance Mode
                {settings.maintenance_mode && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider animate-pulse">
                    Active (Lockout ON)
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-1 leading-relaxed max-w-lg">
                When active, all customer pages and logins are completely hidden and replaced with the Maintenance Page and loading countdown. Only logged-in Admins retain access.
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.maintenance_mode} 
                onChange={e => {
                  const isChecked = e.target.checked;
                  if (isChecked && !settings.maintenance_end_time) {
                    addTimeToEndTime(2); // default to +2 hours
                  }
                  setSettings({ ...settings, maintenance_mode: isChecked });
                }} 
              />
              <div className="w-12 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Expanded Maintenance Configuration when ON */}
          {settings.maintenance_mode && (
            <div className="pt-4 border-t border-gray-800/80 space-y-4">
              <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-lg text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Notice:</strong> All visitors and students will see the Maintenance Page with loading animation until the specified completion time.
                </span>
              </div>

              {/* Maintenance End Time Picker */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-green-400" /> Maintenance End Date & Time (IST / Local)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="datetime-local"
                    value={settings.maintenance_end_time || ''}
                    onChange={e => setSettings({ ...settings, maintenance_end_time: e.target.value })}
                    className="px-3.5 py-2.5 bg-black border border-gray-800 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-green-500"
                  />
                  
                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[11px] text-gray-500">Quick set:</span>
                    <button
                      type="button"
                      onClick={() => addTimeToEndTime(0.5)}
                      className="px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-mono font-medium border border-gray-800 cursor-pointer"
                    >
                      +30m
                    </button>
                    <button
                      type="button"
                      onClick={() => addTimeToEndTime(1)}
                      className="px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-mono font-medium border border-gray-800 cursor-pointer"
                    >
                      +1h
                    </button>
                    <button
                      type="button"
                      onClick={() => addTimeToEndTime(2)}
                      className="px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-mono font-medium border border-gray-800 cursor-pointer"
                    >
                      +2h
                    </button>
                    <button
                      type="button"
                      onClick={() => addTimeToEndTime(4)}
                      className="px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-mono font-medium border border-gray-800 cursor-pointer"
                    >
                      +4h
                    </button>
                    <button
                      type="button"
                      onClick={() => addTimeToEndTime(12)}
                      className="px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-mono font-medium border border-gray-800 cursor-pointer"
                    >
                      +12h
                    </button>
                  </div>
                </div>
                <span className="text-[11px] text-gray-500 mt-1 block">
                  The countdown and "Come and log in at this time" message will compute directly from this timestamp.
                </span>
              </div>

              {/* Custom Message to Users */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                  Custom Notice Message to Users
                </label>
                <textarea
                  rows={2}
                  value={settings.maintenance_message || ''}
                  onChange={e => setSettings({ ...settings, maintenance_message: e.target.value })}
                  placeholder="e.g. Upgrading systems for SafeExamBrowser 3.10.2 integration. Please come and log in at the scheduled time."
                  className="w-full px-3.5 py-2.5 bg-black border border-gray-800 rounded-lg text-white text-xs focus:outline-none focus:border-green-500 leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>

        {/* OTHER SETTINGS */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 border-b border-gray-800 pb-2 uppercase tracking-wider">
            User Access & Signups
          </h3>
          
          <div className="flex items-center justify-between p-4 bg-black rounded-lg border border-gray-800">
            <div>
              <div className="font-semibold text-sm text-white">Allow New Signups</div>
              <div className="text-xs text-gray-400 mt-0.5">Permit new student accounts to register on the platform</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.allow_signups} 
                onChange={e => setSettings({ ...settings, allow_signups: e.target.checked })} 
              />
              <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 border-b border-gray-800 pb-2 uppercase tracking-wider">
            Branding & Contact Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Company Name</label>
              <input type="text" value={settings.company_name} onChange={e => setSettings({ ...settings, company_name: e.target.value })} className="w-full px-3.5 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-600 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Contact Number</label>
              <input type="text" value={settings.contact_number} onChange={e => setSettings({ ...settings, contact_number: e.target.value })} className="w-full px-3.5 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-600 text-white text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Support Email</label>
            <input type="email" value={settings.support_email} onChange={e => setSettings({ ...settings, support_email: e.target.value })} className="w-full px-3.5 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-600 text-white text-sm" />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Changes propagate to all visitors immediately.
          </span>
          <button 
            type="submit" 
            disabled={saving} 
            className="flex items-center px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold disabled:opacity-50 transition-all cursor-pointer shadow-[0_0_15px_rgba(34,197,94,0.3)]"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
