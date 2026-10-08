import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

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
      // Update the existing customer record (created by trigger)
      const { data, error: updateError } = await supabase.from('customers').update({
        full_name: formData.full_name,
        college_name: formData.college_name,
        academic_year: formData.academic_year,
        updated_at: new Date().toISOString()
      }).eq('user_id', session.user.id).select();

      if (updateError) throw updateError;
      
      if (!data || data.length === 0) {
        throw new Error('Customer record not found. Please contact support.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-green-500/30 rounded-xl p-8 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
        <h2 className="text-2xl font-bold text-green-400 mb-2">Complete Your Profile</h2>
        <p className="text-sm text-gray-400 mb-6">Welcome to PhantomLead. Please provide your student details to activate your dashboard.</p>
        
        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
            <input 
              type="text" 
              required
              value={formData.full_name} 
              onChange={e => setFormData({...formData, full_name: e.target.value})}
              className="w-full px-4 py-2.5 bg-black border border-green-900/50 rounded-lg focus:outline-none focus:border-green-500 text-green-50 font-mono"
              placeholder="e.g. John Doe"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">College Name</label>
            <input 
              type="text" 
              required
              value={formData.college_name} 
              onChange={e => setFormData({...formData, college_name: e.target.value})}
              className="w-full px-4 py-2.5 bg-black border border-green-900/50 rounded-lg focus:outline-none focus:border-green-500 text-green-50 font-mono"
              placeholder="e.g. MIT"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Academic Year</label>
            <select 
              required
              value={formData.academic_year} 
              onChange={e => setFormData({...formData, academic_year: e.target.value})}
              className="w-full px-4 py-2.5 bg-black border border-green-900/50 rounded-lg focus:outline-none focus:border-green-500 text-green-50 font-mono"
            >
              <option value="" disabled>Select your year</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
              <option value="Graduated">Graduated / Alumni</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors mt-6 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};
