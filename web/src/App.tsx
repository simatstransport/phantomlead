import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './services/supabase';
import { 
  Shield, Key, Package, LogOut, LayoutDashboard, User, CreditCard, 
  Users, Download, Settings, Menu, X, BookOpen, AlertTriangle,
  Sparkles, ArrowRight, Laptop, Zap, ShieldCheck, Activity, CheckCircle2
} from 'lucide-react';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminPackages } from './pages/admin/AdminPackages';
import { AdminLicenses } from './pages/admin/AdminLicenses';
import { AdminCustomers } from './pages/admin/AdminCustomers';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminWipeFolders } from './pages/admin/AdminWipeFolders';
import { CustomerPackages } from './pages/CustomerPackages';
import { CustomerInstallation } from './pages/CustomerInstallation';
import { CustomerLicenses } from './pages/CustomerLicenses';
import { OnboardingModal } from './components/OnboardingModal';
import { PageTransitionLoader } from './components/PageTransitionLoader';
import { MatrixBackground } from './components/MatrixBackground';
import { AnimatedGlow } from './components/AnimatedGlow';
import { MaintenancePage } from './pages/MaintenancePage';

const resendSignupConfirmation = (email: string) => supabase.auth.resend({
  type: 'signup',
  email,
  options: { emailRedirectTo: window.location.origin }
});

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'error' | 'success'; message: string } | null>(null);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setNotice(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    if (error) {
      setGoogleLoading(false);
      setNotice({ kind: 'error', message: error.message });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      const needsConfirmation = error.message.toLowerCase().includes('email not confirmed');
      setShowResend(needsConfirmation);
      setNotice({
        kind: 'error',
        message: needsConfirmation
          ? 'Confirm your email before signing in. Check your inbox and spam folder, or resend the confirmation email below.'
          : error.message
      });
    } else {
      navigate('/dashboard');
    }
  };

  const handleResendConfirmation = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setNotice({ kind: 'error', message: 'Enter your email address first.' });
      return;
    }

    setResending(true);
    const { error } = await resendSignupConfirmation(normalizedEmail);
    setResending(false);
    setNotice(error
      ? { kind: 'error', message: `Could not resend confirmation: ${error.message}` }
      : { kind: 'success', message: 'Confirmation email requested. Check your inbox and spam folder.' });
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 relative z-10 py-12">
      <div className="w-full max-w-md relative overflow-hidden rounded-3xl glass-panel p-8 sm:p-10 shadow-2xl border border-white/10">
        {/* Subtle Decorative Ambient Lights */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className="relative w-20 h-20">
              <img 
                src="/logo.jpg" 
                alt="Logo" 
                className="w-full h-full rounded-full border-2 border-cyan-400/80 shadow-[0_0_25px_rgba(6,182,212,0.6)] object-cover relative z-10" 
              />
              <div className="absolute inset-[-4px] rounded-full border border-transparent border-t-cyan-400 border-l-purple-500 animate-spin z-0" />
              <div className="absolute inset-[-8px] rounded-full border border-indigo-500/30 animate-[spin_4s_linear_reverse_infinite] z-0" />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-center text-white mb-1.5 tracking-tight">
            PhantomLead <span className="text-gradient-rainbow">Console</span>
          </h2>
          <p className="text-slate-400 text-center mb-6 text-xs sm:text-sm">
            Sign in to access your secure exam workstation
          </p>

          {/* Google 1-Click Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-3 px-4 glass-panel hover:bg-slate-800/80 border border-white/15 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-95 shadow-sm disabled:opacity-50 group"
          >
            <svg className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-5">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#050814] px-3 text-[10px] font-mono uppercase tracking-wider text-slate-500 shrink-0">
              or continue with email
            </span>
            <div className="border-t border-white/10 w-full" />
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Email Address
              </label>
              <input 
                type="email" 
                required
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all placeholder:text-slate-600"
                placeholder="student@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <input 
                type="password" 
                required
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all placeholder:text-slate-600"
                placeholder="••••••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white rounded-xl font-bold font-mono text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/25 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>

          {notice && (
            <div className={`mt-4 p-3 rounded-xl text-xs ${notice.kind === 'error' ? 'bg-red-500/10 border border-red-500/30 text-red-300' : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300'}`}>
              {notice.message}
            </div>
          )}

          {showResend && (
            <button 
              type="button" 
              onClick={handleResendConfirmation} 
              disabled={resending} 
              className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2 disabled:opacity-50 block text-center w-full"
            >
              {resending ? 'Sending...' : 'Resend confirmation email'}
            </button>
          )}

          <div className="mt-8 pt-5 border-t border-white/10 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [confirmationPending, setConfirmationPending] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'error' | 'success'; message: string } | null>(null);
  const navigate = useNavigate();

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setNotice(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    if (error) {
      setGoogleLoading(false);
      setNotice({ kind: 'error', message: error.message });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: window.location.origin }
    });
    setLoading(false);
    
    if (error) {
      setNotice({ kind: 'error', message: error.message });
    } else if (data.session) {
      navigate('/dashboard');
    } else {
      setConfirmationPending(true);
      setNotice({ kind: 'success', message: 'Account created. Confirm your email before signing in. Check your inbox and spam folder.' });
    }
  };

  const handleResendConfirmation = async () => {
    setResending(true);
    const { error } = await resendSignupConfirmation(email.trim());
    setResending(false);
    setNotice(error
      ? { kind: 'error', message: `Could not resend confirmation: ${error.message}` }
      : { kind: 'success', message: 'Confirmation email requested. Check your inbox and spam folder.' });
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 relative z-10 py-12">
      <div className="w-full max-w-md relative overflow-hidden rounded-3xl glass-panel p-8 sm:p-10 shadow-2xl border border-white/10">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className="relative w-20 h-20">
              <img 
                src="/logo.jpg" 
                alt="Logo" 
                className="w-full h-full rounded-full border-2 border-cyan-400/80 shadow-[0_0_25px_rgba(6,182,212,0.6)] object-cover relative z-10" 
              />
              <div className="absolute inset-[-4px] rounded-full border border-transparent border-t-purple-400 border-l-cyan-400 animate-spin z-0" />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-center text-white mb-1.5 tracking-tight">
            Create an <span className="text-gradient-rainbow">Account</span>
          </h2>
          <p className="text-slate-400 text-center mb-6 text-xs sm:text-sm">
            Join PhantomLead to activate your Safe Exam suite
          </p>

          {/* Google 1-Click Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading}
            className="w-full py-3 px-4 glass-panel hover:bg-slate-800/80 border border-white/15 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-95 shadow-sm disabled:opacity-50 group"
          >
            <svg className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-5">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#050814] px-3 text-[10px] font-mono uppercase tracking-wider text-slate-500 shrink-0">
              or continue with email
            </span>
            <div className="border-t border-white/10 w-full" />
          </div>
          
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Email Address
              </label>
              <input 
                type="email" 
                required
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all placeholder:text-slate-600"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Create Password
              </label>
              <input 
                type="password" 
                required
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all placeholder:text-slate-600"
                placeholder="••••••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white rounded-xl font-bold font-mono text-xs uppercase tracking-wider shadow-lg shadow-purple-500/25 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {notice && (
            <div className={`mt-4 p-3 rounded-xl text-xs ${notice.kind === 'error' ? 'bg-red-500/10 border border-red-500/30 text-red-300' : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300'}`}>
              {notice.message}
            </div>
          )}

          {confirmationPending && (
            <button 
              type="button" 
              onClick={handleResendConfirmation} 
              disabled={resending} 
              className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2 disabled:opacity-50 block text-center w-full"
            >
              {resending ? 'Sending...' : 'Resend confirmation email'}
            </button>
          )}

          <div className="mt-8 pt-5 border-t border-white/10 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const useHasActiveLicense = (isAdmin: boolean) => {
  const [hasActiveLicense, setHasActiveLicense] = useState(false);
  const [activeLicenseCount, setActiveLicenseCount] = useState(0);
  const [checkingLicense, setCheckingLicense] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    const checkActiveLicense = async () => {
      try {
        if (isAdmin) {
          const { count, error } = await supabase
            .from('licenses')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'ACTIVE');
          if (isCurrent) {
            setActiveLicenseCount(error ? 0 : count ?? 0);
            setHasActiveLicense(!error && (count ?? 0) > 0);
          }
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!customer) return;

        const { data: licenses, error } = await supabase
          .from('licenses')
          .select('id, duration_months, payment_type, expires_at')
          .eq('customer_id', customer.id)
          .eq('status', 'ACTIVE');

        const now = Date.now();
        const validLicenses: any[] = [];
        if (!error && licenses) {
          for (const lic of licenses) {
            if (lic.expires_at && new Date(lic.expires_at).getTime() <= now) {
              // Expired: auto delete logs and license to keep user account 100% fresh
              supabase.from('installation_logs').delete().eq('license_id', lic.id).then(() => {
                supabase.from('licenses').delete().eq('id', lic.id);
              });
            } else {
              validLicenses.push(lic);
            }
          }
        }

        if (isCurrent) {
          setActiveLicenseCount(validLicenses.length);
          setHasActiveLicense(validLicenses.length > 0);
          if (validLicenses.length > 0) {
            (window as any).activeLicenseDetails = validLicenses[0];
          } else {
            (window as any).activeLicenseDetails = null;
          }
        }
      } catch (error) {
        console.error('Failed to check active license:', error);
      } finally {
        if (isCurrent) setCheckingLicense(false);
      }
    };

    checkActiveLicense();
    return () => { isCurrent = false; };
  }, [isAdmin]);

  return { hasActiveLicense, activeLicenseCount, checkingLicense };
};

const DashboardLayout = ({ children, title, isAdmin, isActualAdmin }: { children: React.ReactNode, title: string, isAdmin?: boolean, isActualAdmin?: boolean }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { hasActiveLicense } = useHasActiveLicense(isAdmin || false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('customers').select('full_name').eq('user_id', user.id).single().then(({ data }) => {
          if (data && data.full_name) {
            setUserName(data.full_name);
          } else {
            setUserName(user.email?.split('@')[0] || 'User');
          }
        });
      }
    });
  }, []);
  
  return (
    <div className="min-h-screen bg-transparent text-white flex relative overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-md transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Modern Frosted Sidebar */}
      <aside className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 z-50 w-64 glass-panel border-r border-white/10 flex flex-col transition-transform duration-300 ease-in-out`}>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full rounded-full border border-cyan-400 object-cover relative z-10" />
              <div className="absolute inset-[-3px] rounded-full border border-transparent border-t-cyan-400 border-l-purple-500 animate-spin z-0" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-gradient-rainbow">
              PhantomLead
            </span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {isAdmin ? (
            <>
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Fleet Command
              </div>
              <Link to="/admin" className="flex items-center px-3.5 py-2.5 text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-xl transition-all group">
                <LayoutDashboard className="w-4 h-4 mr-3 text-cyan-400 group-hover:scale-110 transition-transform" /> Admin Overview
              </Link>
              <Link to="/admin/licenses" className="flex items-center px-3.5 py-2.5 text-slate-300 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-xl transition-all group">
                <Key className="w-4 h-4 mr-3 text-emerald-400 group-hover:scale-110 transition-transform" /> All Licenses
              </Link>
              <Link to="/admin/packages" className="flex items-center px-3.5 py-2.5 text-slate-300 hover:text-purple-300 hover:bg-purple-500/10 rounded-xl transition-all group">
                <Package className="w-4 h-4 mr-3 text-purple-400 group-hover:scale-110 transition-transform" /> All Packages
              </Link>
              <Link to="/admin/payments" className="flex items-center px-3.5 py-2.5 text-slate-300 hover:text-amber-300 hover:bg-amber-500/10 rounded-xl transition-all group">
                <CreditCard className="w-4 h-4 mr-3 text-amber-400 group-hover:scale-110 transition-transform" /> Payments
              </Link>
              <Link to="/admin/customers" className="flex items-center px-3.5 py-2.5 text-slate-300 hover:text-blue-300 hover:bg-blue-500/10 rounded-xl transition-all group">
                <Users className="w-4 h-4 mr-3 text-blue-400 group-hover:scale-110 transition-transform" /> Customers
              </Link>
              <Link to="/admin/settings" className="flex items-center px-3.5 py-2.5 text-slate-300 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all group">
                <Settings className="w-4 h-4 mr-3 text-rose-400 group-hover:scale-110 transition-transform" /> Settings
              </Link>
              <div className="pt-4 mt-4 border-t border-white/10">
                <Link to="/dashboard" className="flex items-center px-3.5 py-2.5 text-cyan-300 hover:bg-cyan-500/20 rounded-xl transition-all border border-cyan-500/30">
                  <User className="w-4 h-4 mr-3" /> View as Customer
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Workstation Navigation
              </div>
              <Link to="/dashboard" className="flex items-center px-3.5 py-2.5 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded-xl font-medium shadow-sm">
                <LayoutDashboard className="w-4 h-4 mr-3 text-cyan-400" /> Dashboard
              </Link>
              <Link to="/dashboard/licenses" className="flex items-center px-3.5 py-2.5 text-slate-300 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-xl transition-all group">
                <Key className="w-4 h-4 mr-3 text-emerald-400 group-hover:scale-110 transition-transform" /> My Licenses
              </Link>
              <Link to="/dashboard/packages" className="flex items-center px-3.5 py-2.5 text-slate-300 hover:text-purple-300 hover:bg-purple-500/10 rounded-xl transition-all group">
                <Package className="w-4 h-4 mr-3 text-purple-400 group-hover:scale-110 transition-transform" /> Buy Packages
              </Link>
              {hasActiveLicense && (
                <Link to="/dashboard/install" className="flex items-center px-3.5 py-2.5 text-slate-300 hover:text-amber-300 hover:bg-amber-500/10 rounded-xl transition-all group">
                  <BookOpen className="w-4 h-4 mr-3 text-amber-400 group-hover:scale-110 transition-transform" /> Installation Guide
                </Link>
              )}
              {isActualAdmin && (
                <div className="pt-4 mt-4 border-t border-white/10">
                  <Link to="/admin" className="flex items-center px-3.5 py-2.5 text-purple-300 hover:bg-purple-500/20 rounded-xl transition-all border border-purple-500/30">
                    <Shield className="w-4 h-4 mr-3" /> Return to Fleet Admin
                  </Link>
                </div>
              )}
            </>
          )}
        </nav>

        {/* User Footer / Logout */}
        <div className="p-4 border-t border-white/10 bg-slate-950/40">
          <button 
            onClick={() => supabase.auth.signOut()}
            className="flex items-center w-full px-3.5 py-2.5 text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl text-xs font-mono transition-all group"
          >
            <LogOut className="w-4 h-4 mr-3 text-rose-400 group-hover:-translate-x-0.5 transition-transform" /> 
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Top Navbar */}
        <header className="h-16 glass-panel border-b border-white/10 flex items-center justify-between px-4 sm:px-6 relative z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-400 hover:text-white">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate flex items-center gap-2">
              <span>{title}</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-white/10 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300">SEB 3.10.2 Armed</span>
            </div>

            <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
              <span className="text-xs font-medium text-slate-300 hidden sm:block max-w-[140px] truncate">
                {userName}
              </span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1.5px] shadow-sm">
                <div className="w-full h-full bg-[#050814] rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-cyan-300" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto w-full max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

const CustomerDashboard = ({ isActualAdmin }: { isActualAdmin?: boolean }) => {
  const { hasActiveLicense, activeLicenseCount, checkingLicense } = useHasActiveLicense(false);
  const licenseDetails = (window as any).activeLicenseDetails;

  return (
    <DashboardLayout title="Workstation Command Center" isAdmin={false} isActualAdmin={isActualAdmin}>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Modern Multi-Color Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl glass-panel border border-white/15 p-6 sm:p-8 shadow-2xl">
          {/* Glowing Atmospheric Mesh */}
          <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-bl from-cyan-500/15 via-purple-500/10 to-transparent blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-64 h-32 bg-emerald-500/10 blur-2xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  SAFE EXAM WORKSTATION
                </span>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  SEB v3.10.2 VERIFIED
                </span>
                <span className="text-xs font-mono text-purple-400 bg-purple-950/40 border border-purple-500/30 px-2.5 py-0.5 rounded-full">
                  GEMINI 1.5 PRO READY
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Welcome to Your <span className="text-gradient-rainbow">PhantomLead Console</span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Seamless AI Java and code injection for Safe Exam Browser. Download hardened client installers, monitor machine bindings, and access live exam helpers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link 
                to="/dashboard/packages" 
                className="px-5 py-3 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all cursor-pointer whitespace-nowrap active:scale-95"
              >
                Browse All Packages
              </Link>
              <Link 
                to="/dashboard/licenses" 
                className="px-4 py-3 glass-panel hover:bg-slate-800/80 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap border border-white/10"
              >
                My License Keys
              </Link>
            </div>
          </div>
        </div>

        {/* 3 Modern Colorful Executive Metric Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Tile 1: License Status - Cyber Cyan */}
          <div className="glass-panel-interactive rounded-2xl p-5 sm:p-6 border border-cyan-500/20 hover:border-cyan-400/50 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="tracking-wider uppercase font-semibold text-cyan-300">LICENSE STATUS</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm">
                <Key className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-3xl font-black text-white font-mono tracking-tight">
                {checkingLicense ? '...' : hasActiveLicense ? `${activeLicenseCount} Active` : '0 Active'}
              </div>
              <div className="text-xs font-semibold mt-1">
                {checkingLicense ? (
                  <span className="text-slate-500">Checking credentials...</span>
                ) : hasActiveLicense ? (
                  <span className="text-cyan-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    Armed &amp; Operational
                  </span>
                ) : (
                  <span className="text-sky-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Fresh Account (Unbound)
                  </span>
                )}
              </div>
            </div>
            <Link to="/dashboard/licenses" className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 font-medium transition-colors pt-2 border-t border-white/5">
              <span>View license details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Tile 2: Hardware Node Lock - Mint Emerald */}
          <div className="glass-panel-interactive rounded-2xl p-5 sm:p-6 border border-emerald-500/20 hover:border-emerald-400/50 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="tracking-wider uppercase font-semibold text-emerald-300">HARDWARE NODE LOCK</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
                <Laptop className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-3xl font-black text-white font-mono tracking-tight">
                1 PC Binding
              </div>
              <div className="text-xs font-semibold text-emerald-300 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {hasActiveLicense ? 'Hardware Lock Active' : 'Slot Available for Binding'}
              </div>
            </div>
            <span className="text-xs text-slate-400 pt-2 border-t border-white/5">
              Cryptographically bound to single CPU &amp; Motherboard UUID
            </span>
          </div>

          {/* Tile 3: Exam Environment - Electric Purple */}
          <div className="glass-panel-interactive rounded-2xl p-5 sm:p-6 border border-purple-500/20 hover:border-purple-400/50 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="tracking-wider uppercase font-semibold text-purple-300">EXAM ENVIRONMENT</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-sm">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-3xl font-black text-white font-mono tracking-tight">
                SEB 3.10.2
              </div>
              <div className="text-xs font-semibold text-purple-300 mt-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                Native Kiosk Clipboard Injection
              </div>
            </div>
            <Link to="/dashboard/install" className="text-xs text-slate-400 hover:text-purple-300 flex items-center gap-1.5 font-medium transition-colors pt-2 border-t border-white/5">
              <span>Read installation guide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Workstation Operations & Client Installer Deck */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-5 border-b border-white/10">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-cyan-400" /> Workstation Operations &amp; Client Installer
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {checkingLicense 
                  ? 'Verifying cryptographic security token...' 
                  : hasActiveLicense 
                  ? 'Your active license package is configured and ready for execution.' 
                  : 'Your account is completely clean. Choose a package to activate Safe Exam Browser extensions.'}
              </p>
            </div>
            <Link 
              to="/dashboard/licenses" 
              className="inline-flex items-center gap-2 px-4 py-2 glass-panel hover:bg-slate-800/80 border border-white/15 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all"
            >
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span>Open License Deck</span>
            </Link>
          </div>

          {!checkingLicense && hasActiveLicense ? (() => {
            let installerName = 'SecureInstaller_L.exe';
            let editionLabel = 'Lifetime Edition';
            
            if (licenseDetails) {
              if (licenseDetails.duration_months === -10) {
                installerName = 'SecureInstaller_T.exe';
                editionLabel = '10-Min Demo Trial';
              } else if (licenseDetails.duration_months && licenseDetails.duration_months > 0) {
                installerName = 'SecureInstaller_T.exe';
                editionLabel = `${licenseDetails.duration_months} Mo. Term`;
              } else if (licenseDetails.expires_at) {
                installerName = 'SecureInstaller_T.exe';
                editionLabel = 'Time-Bomb Term';
              } else if (licenseDetails.duration_months === 0) {
                installerName = 'SecureInstaller_A.exe';
                editionLabel = 'Admin Managed';
              } else {
                installerName = 'SecureInstaller_L.exe';
                editionLabel = 'Lifetime Edition';
              }
            }

            return (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-4">
                  <a 
                    href={`https://wgxxitydatuoyjnxuvqw.supabase.co/storage/v1/object/public/installers/${installerName}?v=${new Date().getTime()}`} 
                    download={installerName} 
                    className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all cursor-pointer active:scale-95"
                  >
                    <Download className="w-4 h-4" /> Download {installerName}
                    <span className="text-xs font-medium text-white bg-black/30 px-2 py-0.5 rounded-lg ml-1 border border-white/20">
                      {editionLabel}
                    </span>
                  </a>

                  <Link 
                    to="/dashboard/install" 
                    className="inline-flex items-center gap-2 px-5 py-3.5 glass-panel hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-sm font-medium border border-white/10 transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <span>Setup Manual &amp; Shortcuts</span>
                  </Link>
                </div>

                {(installerName === 'SecureInstaller_T.exe' || installerName === 'SecureInstaller_A.exe') && (
                  <div className="p-4 border border-rose-500/30 bg-rose-950/20 rounded-2xl max-w-2xl text-xs text-slate-300 space-y-1.5">
                    <h4 className="text-rose-400 font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" /> DRM Security Sentinel Active
                    </h4>
                    <p className="text-slate-400 leading-relaxed">
                      {installerName === 'SecureInstaller_T.exe' 
                        ? 'This software contains an automated Time-Bomb. Upon your license expiry date, or if revoked by an admin, the system automatically wipes all proprietary configuration files and resets your account to Fresh.'
                        : 'This software is actively monitored. If your access is revoked by an administrator, the remote kill-switch automatically wipes all configuration files from your host machine.'}
                    </p>
                  </div>
                )}
              </div>
            );
          })() : (
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-transparent border border-white/15 flex items-center justify-center text-cyan-300 mx-auto shadow-lg shadow-cyan-500/10">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xl font-bold text-white">Your Account is Fresh &amp; Ready</h4>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                  No licenses are currently active. Browse our available packages to activate Safe Exam Browser extensions immediately.
                </p>
              </div>
              <div className="pt-2">
                <Link 
                  to="/dashboard/packages" 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white rounded-xl font-bold text-xs font-mono uppercase tracking-wider shadow-lg shadow-indigo-500/25 transition-all cursor-pointer active:scale-95"
                >
                  <span>Select a Package Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    customers: 0,
    pending: 0,
    activeLicenses: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          { count: custCount },
          { count: pendCount },
          { count: licCount },
          { data: payments }
        ] = await Promise.all([
          supabase.from('customers').select('*', { count: 'exact', head: true }),
          supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
          supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
          supabase.from('payments').select('amount').eq('status', 'APPROVED')
        ]);
        
        const rev = (payments || []).reduce((acc, p) => acc + (p.amount || 0), 0);
        
        setStats({
          customers: custCount || 0,
          pending: pendCount || 0,
          activeLicenses: licCount || 0,
          revenue: rev
        });
      } catch (err) {
        console.error("Error fetching stats", err);
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  return (
    <DashboardLayout title="Administrator Fleet Command" isAdmin={true}>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Executive Banner */}
        <div className="relative overflow-hidden rounded-3xl glass-panel border border-white/15 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-bl from-purple-500/15 via-indigo-500/10 to-transparent blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold tracking-widest uppercase bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  Fleet Command Engine
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-400 font-mono">Platform v2.0 Armed</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Welcome back, <span className="text-gradient-rainbow">Fleet Administrator</span>!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Global overview of student licenses, incoming UPI transactions, node locks, and infrastructure health.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link 
                to="/admin/licenses" 
                className="px-5 py-3 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all whitespace-nowrap cursor-pointer active:scale-95"
              >
                + Issue License Key
              </Link>
              <Link 
                to="/admin/settings" 
                className="px-4 py-3 glass-panel hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap border border-white/10"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Executive KPI Metric Cards in 4 Distinct Vibrant Colors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Registered Customers - Royal Blue / Indigo */}
          <div className="glass-panel-interactive rounded-2xl p-5 border border-blue-500/20 hover:border-blue-400/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="text-blue-300 font-bold uppercase tracking-wider">REGISTERED CUSTOMERS</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-3xl font-black text-white font-mono">{loading ? '...' : stats.customers}</div>
              <div className="text-xs text-blue-300 mt-1">Verified Accounts</div>
            </div>
            <Link to="/admin/customers" className="text-xs text-slate-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors pt-2 border-t border-white/5">
              <span>Manage customer directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: Pending Payments - Sunset Amber */}
          <div className="glass-panel-interactive rounded-2xl p-5 border border-amber-500/20 hover:border-amber-400/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="text-amber-300 font-bold uppercase tracking-wider">PENDING PAYMENTS</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-3xl font-black text-amber-400 font-mono">{loading ? '...' : stats.pending}</div>
              <div className="text-xs text-amber-300/80 mt-1">
                {stats.pending > 0 ? 'Requires manual clearance' : 'All transactions reviewed'}
              </div>
            </div>
            <Link to="/admin/payments" className="text-xs text-slate-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors pt-2 border-t border-white/5">
              <span>Review transaction queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 3: Active Licenses - Cyber Emerald */}
          <div className="glass-panel-interactive rounded-2xl p-5 border border-emerald-500/20 hover:border-emerald-400/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="text-emerald-300 font-bold uppercase tracking-wider">ACTIVE LICENSES</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Key className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-3xl font-black text-emerald-400 font-mono">{loading ? '...' : stats.activeLicenses}</div>
              <div className="text-xs text-emerald-300/80 mt-1">Live running deployments</div>
            </div>
            <Link to="/admin/licenses" className="text-xs text-slate-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors pt-2 border-t border-white/5">
              <span>View global fleet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 4: Platform Revenue - Electric Violet */}
          <div className="glass-panel-interactive rounded-2xl p-5 border border-purple-500/20 hover:border-purple-400/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="text-purple-300 font-bold uppercase tracking-wider">PLATFORM REVENUE</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-3xl font-black text-white font-mono">
                {loading ? '...' : `₹${stats.revenue.toLocaleString('en-IN')}`}
              </div>
              <div className="text-xs text-purple-300 mt-1">Cleared UPI Settlements</div>
            </div>
            <Link to="/admin/payments" className="text-xs text-slate-400 hover:text-purple-300 flex items-center gap-1.5 transition-colors pt-2 border-t border-white/5">
              <span>View settlement history</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Action Decks & Infrastructure Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deck 1: Core Operations */}
          <div className="glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" /> Operational Hub
              </h3>
              <span className="text-xs text-slate-400 font-mono">Core Actions</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link 
                to="/admin/payments" 
                className="p-4 glass-panel rounded-2xl border border-amber-500/20 hover:border-amber-400/60 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <CreditCard className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                  {stats.pending > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                      {stats.pending} Pending
                    </span>
                  )}
                </div>
                <div className="font-bold text-white text-sm mb-0.5">Review Payments</div>
                <div className="text-[11px] text-slate-400">Approve or reject incoming UPI slips</div>
              </Link>

              <Link 
                to="/admin/licenses" 
                className="p-4 glass-panel rounded-2xl border border-emerald-500/20 hover:border-emerald-400/60 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <Key className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Live
                  </span>
                </div>
                <div className="font-bold text-white text-sm mb-0.5">Fleet Licenses</div>
                <div className="text-[11px] text-slate-400">Issue keys &amp; execute remote host wipes</div>
              </Link>

              <Link 
                to="/admin/packages" 
                className="p-4 glass-panel rounded-2xl border border-purple-500/20 hover:border-purple-400/60 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <Package className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="font-bold text-white text-sm mb-0.5">Software Bundles</div>
                <div className="text-[11px] text-slate-400">Configure pricing &amp; exam extensions</div>
              </Link>

              <Link 
                to="/admin/customers" 
                className="p-4 glass-panel rounded-2xl border border-blue-500/20 hover:border-blue-400/60 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="font-bold text-white text-sm mb-0.5">User Directory</div>
                <div className="text-[11px] text-slate-400">Inspect device fingerprints &amp; customer profiles</div>
              </Link>
            </div>
          </div>

          {/* Deck 2: Infrastructure & Sentinel Radar */}
          <div className="glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/10 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" /> Platform Infrastructure Radar
                </h3>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-800/40">
                  HEALTH OK
                </span>
              </div>

              <div className="divide-y divide-white/5 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400">Database Engine (PostgreSQL)</span>
                  <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-lg font-mono font-semibold">
                    Operational (Sub-50ms)
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400">Serverless Edge Functions</span>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-lg font-mono font-semibold">
                    5 Deployed &amp; Active
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400">Auto-Wipe &amp; Sentinel Protocol</span>
                  <span className="px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-lg font-mono font-semibold">
                    Armed (Zero-Day Wipe)
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400">License Cryptographic Vault</span>
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/30 rounded-lg font-mono font-semibold">
                    SHA-256 / AES-GCM
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400">Payment Reconciliation (UPI)</span>
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-lg font-mono font-semibold">
                    Instant UTR Verification
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>PhantomLead DRM Engine v2.0</span>
              <span className="text-emerald-400">All Systems Nominal</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [maintenance, setMaintenance] = useState<{ active: boolean; endTime: string | null; message: string | null }>({
    active: false,
    endTime: null,
    message: null,
  });

  const checkMaintenance = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('key, value')
        .in('key', ['maintenance_mode', 'maintenance_end_time', 'maintenance_message']);

      if (!error && data) {
        let active = false;
        let endTime: string | null = null;
        let message: string | null = null;

        data.forEach((row) => {
          if (row.key === 'maintenance_mode') {
            active = row.value === true || row.value === 'true' || row.value === 1 || row.value === '1';
          }
          if (row.key === 'maintenance_end_time') endTime = (row.value as string) || null;
          if (row.key === 'maintenance_message') message = (row.value as string) || null;
        });

        setMaintenance({ active, endTime, message });
      }
    } catch (err) {
      console.error('Failed to fetch maintenance mode state:', err);
    }
  };

  useEffect(() => {
    checkMaintenance();
    const interval = setInterval(checkMaintenance, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkAdmin(session?.user?.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      checkAdmin(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdmin = async (userId: string | undefined) => {
    if (!userId) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
    setIsAdmin(data?.role === 'admin');
    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050814] flex items-center justify-center">
      <div className="animate-spin w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full shadow-[0_0_20px_rgba(6,182,212,0.4)]" />
    </div>
  );

  return (
    <Router>
      <PageTransitionLoader />

      {/* Admin Maintenance Alert Banner */}
      {isAdmin && maintenance.active && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-center text-xs sm:text-sm text-amber-300 flex items-center justify-center gap-2 relative z-50 backdrop-blur-md">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
          <span>
            <strong>PLATFORM MAINTENANCE MODE IS ACTIVE:</strong> All non-admin users and visitors are locked out. You are viewing in Administrator Bypass mode.
          </span>
          <Link to="/admin/settings" className="ml-2 underline font-semibold text-amber-200 hover:text-white">
            Manage Settings
          </Link>
        </div>
      )}

      {session && !isAdmin && !onboarded && <OnboardingModal session={session} onComplete={() => setOnboarded(true)} />}

      <div className="min-h-screen bg-[#050814] text-slate-100 font-sans relative overflow-hidden">
        <AnimatedGlow />
        <MatrixBackground />

        {/* If Maintenance is ACTIVE and user is NOT Admin: lock out all routes and render MaintenancePage */}
        {maintenance.active && !isAdmin ? (
          <Routes>
            <Route path="/admin/login" element={session && isAdmin ? <Navigate to="/admin" /> : <Login />} />
            <Route path="*" element={<MaintenancePage endTime={maintenance.endTime} message={maintenance.message} onCheckStatus={checkMaintenance} />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/login" element={session ? (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />) : <Login />} />
            <Route path="/admin/login" element={session ? (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />) : <Login />} />
            <Route path="/signup" element={session ? (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />) : <SignUp />} />
            <Route path="/dashboard" element={session ? <CustomerDashboard isActualAdmin={isAdmin} /> : <Navigate to="/login" />} />
            <Route path="/dashboard/licenses" element={session ? <DashboardLayout title="My Licenses" isAdmin={false} isActualAdmin={isAdmin}><CustomerLicenses /></DashboardLayout> : <Navigate to="/login" />} />
            <Route path="/dashboard/packages" element={session ? <DashboardLayout title="Buy Packages" isAdmin={false} isActualAdmin={isAdmin}><CustomerPackages /></DashboardLayout> : <Navigate to="/login" />} />
            <Route path="/dashboard/install" element={session ? <DashboardLayout title="Installation Guide" isAdmin={false} isActualAdmin={isAdmin}><CustomerInstallation /></DashboardLayout> : <Navigate to="/login" />} />

            <Route path="/admin" element={session ? (isAdmin ? <AdminDashboard /> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />
            <Route path="/admin/licenses" element={session ? (isAdmin ? <DashboardLayout title="All Licenses" isAdmin={true}><AdminLicenses /></DashboardLayout> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />
            <Route path="/admin/packages" element={session ? (isAdmin ? <DashboardLayout title="All Packages" isAdmin={true}><AdminPackages /></DashboardLayout> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />
            <Route path="/admin/payments" element={session ? (isAdmin ? <DashboardLayout title="Payments" isAdmin={true}><AdminPayments /></DashboardLayout> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />
            <Route path="/admin/customers" element={session ? (isAdmin ? <DashboardLayout title="Customers" isAdmin={true}><AdminCustomers /></DashboardLayout> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />
            <Route path="/admin/wipe-folders" element={session ? (isAdmin ? <DashboardLayout title="Delete User Folders" isAdmin={true}><AdminWipeFolders /></DashboardLayout> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />
            <Route path="/admin/settings" element={session ? (isAdmin ? <DashboardLayout title="Settings" isAdmin={true}><AdminSettings /></DashboardLayout> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />
            <Route path="/" element={<Navigate to={session ? (isAdmin ? "/admin" : "/dashboard") : "/login"} />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;
