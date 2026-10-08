import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Save } from 'lucide-react';

export const AdminSettings = () => {
  const [settings, setSettings] = useState<Record<string, any>>({
    maintenance_mode: false,
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
    
    // Convert to array of upserts
    const upserts = Object.keys(settings).map(key => ({
      key,
      value: settings[key],
      updated_at: new Date().toISOString()
    }));

    // In Supabase, to upsert on 'key', 'key' must be unique. Assuming it is, but we might need to delete & insert or just upsert if unique constraint exists.
    // If there is no unique constraint on key, upserting will fail without specifying the ON CONFLICT column.
    // Since we don't know if 'key' is uniquely constrained, let's just delete all and insert, or update individually.
    
    // Safe approach: check existing, then update or insert
    for (const u of upserts) {
      const { data: existing } = await supabase.from('admin_settings').select('id').eq('key', u.key).single();
      if (existing) {
        await supabase.from('admin_settings').update({ value: u.value, updated_at: u.updated_at }).eq('id', existing.id);
      } else {
        await supabase.from('admin_settings').insert(u);
      }
    }
    
    setSaving(false);
    alert('Settings saved successfully!');
  };

  if (loading) return <div className="text-gray-400">Loading settings...</div>;

  return (
    <div className="max-w-2xl bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-6">Global Platform Settings</h2>
      
      <form onSubmit={handleSave} className="space-y-6">
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white border-b border-gray-800 pb-2">Application Config</h3>
          
          <div className="flex items-center justify-between p-4 bg-gray-950 rounded-lg border border-gray-800">
            <div>
              <div className="font-medium">Maintenance Mode</div>
              <div className="text-sm text-gray-400">Lock out customers and show a maintenance screen</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={settings.maintenance_mode} onChange={e => setSettings({...settings, maintenance_mode: e.target.checked})} />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-950 rounded-lg border border-gray-800">
            <div>
              <div className="font-medium">Allow New Signups</div>
              <div className="text-sm text-gray-400">Let new users register accounts</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={settings.allow_signups} onChange={e => setSettings({...settings, allow_signups: e.target.checked})} />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white border-b border-gray-800 pb-2">Branding & Contact</h3>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Company Name</label>
            <input type="text" value={settings.company_name} onChange={e => setSettings({...settings, company_name: e.target.value})} className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Support Email</label>
            <input type="email" value={settings.support_email} onChange={e => setSettings({...settings, support_email: e.target.value})} className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Contact Number</label>
            <input type="text" value={settings.contact_number} onChange={e => setSettings({...settings, contact_number: e.target.value})} className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg focus:outline-none focus:border-indigo-500" />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-800">
          <button type="submit" disabled={saving} className="flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-50">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
