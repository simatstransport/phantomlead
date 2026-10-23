import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { User, School, GraduationCap } from 'lucide-react';

export const OnboardingModal = ({ session, onComplete }: { session: any, onComplete: () => void }) => {
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    college_name: '',
    academic_year: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkProfile = async () => {
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from('customers')
        .select('full_name, college_name, academic_year')
        .eq('user_id', session.user.id)
        .single();

      if (!error && data) {
        if (!data.full_name || !data.college_name || !data.academic_year) {
          setNeedsOnboarding(true);
        } else {
          onComplete(); // Already has everything
        }
      } else {
        // Customer record might not even exist yet
        setNeedsOnboarding(true);
      }
      setLoading(false);
    };

    checkProfile();
  }, [session, onComplete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!formData.full_name || !formData.college_name || !formData.academic_year) {
      setError('Please fill out all fields.');
      setSubmitting(false);
      return;
    }

    try {
      const { data, error: updateError } = await supabase.from('customers').update({
        full_name: formData.full_name,
        college_name: formData.college_name,
        academic_year: formData.academic_year,
        updated_at: new Date().toISOString()
      }).eq('user_id', session.user.id).select();

      if (updateError) throw updateError;
      
      if (!data || data.length === 0) {
        const { error: insertError } = await supabase.from('customers').insert({
          user_id: session.user.id,
          email: session.user.email,
          full_name: formData.full_name,
          college_name: formData.college_name,
          academic_year: formData.academic_year,
          phone: ''
        });
        if (insertError) throw insertError;
      }

      setNeedsOnboarding(false);
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Could not save profile details.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !needsOnboarding) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md relative overflow-hidden rounded-3xl glass-panel p-7 sm:p-8 shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
              FIRST TIME ENROLLMENT
            </span>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight mb-2">
            Complete Your Student Profile
          </h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Please register your academic details to configure your workstation and bind security licenses.
          </p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" /> Full Name
              </label>
              <input 
                type="text" 
                required
                value={formData.full_name} 
                onChange={e => setFormData({...formData, full_name: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-950/70 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 text-white font-mono text-sm transition-all"
                placeholder="e.g. Alex Mercer"
              />
            </div>
            
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-purple-400" /> College / University Name
              </label>
              <input 
                type="text" 
                required
                value={formData.college_name} 
                onChange={e => setFormData({...formData, college_name: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-950/70 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 text-white font-mono text-sm transition-all"
                placeholder="e.g. National Institute of Technology"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-pink-400" /> Academic Year / Branch
              </label>
              <select 
                required
                value={formData.academic_year} 
                onChange={e => setFormData({...formData, academic_year: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-950/70 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-400 text-white font-mono text-sm transition-all"
              >
                <option value="" disabled className="bg-slate-950">Select your year</option>
                <option value="1st Year" className="bg-slate-950">1st Year</option>
                <option value="2nd Year" className="bg-slate-950">2nd Year</option>
                <option value="3rd Year" className="bg-slate-950">3rd Year</option>
                <option value="4th Year" className="bg-slate-950">4th Year</option>
                <option value="Graduated" className="bg-slate-950">Graduated / Alumni</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-indigo-600 to-purple-600 hover:from-emerald-400 hover:to-purple-500 text-white font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition-all mt-6 disabled:opacity-50 shadow-lg shadow-indigo-500/30 cursor-pointer active:scale-95"
            >
              {submitting ? 'Configuring Profile...' : 'Save & Enter Platform'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
