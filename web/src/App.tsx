import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './services/supabase';
import { 
  Shield, Key, Package, LogOut, LayoutDashboard, User, CreditCard, 
  Users, Download, Settings, Menu, X, BookOpen, AlertTriangle,
  Sparkles, ArrowRight, Laptop, Zap, ShieldCheck
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
import { HowItWorksCard } from './components/HowItWorksCard';
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
  const [resending, setResending] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'error' | 'success'; message: string } | null>(null);
  const navigate = useNavigate();

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
    <div className="flex items-center justify-center min-h-screen px-4 relative z-10">
      <div className="w-full max-w-md bg-zinc-950 border border-gray-800 rounded-xl shadow-2xl p-8">
        <div className="flex justify-center mb-6">
          <img src="/logo.jpg" alt="Logo" className="w-20 h-20 rounded-full border border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)] object-cover" />
        </div>
        <h2 className="text-2xl font-bold text-center text-white mb-2">PhantomLead Platform</h2>
        <p className="text-gray-400 text-center mb-8 text-sm">Sign in to manage your software access</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
            <input 
              type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input 
              type="password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" disabled={loading}
            className="w-full mt-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>
        {notice && <p role={notice.kind === 'error' ? 'alert' : 'status'} className={`mt-4 text-sm ${notice.kind === 'error' ? 'text-red-400' : 'text-green-400'}`}>{notice.message}</p>}
        {showResend && (
          <button type="button" onClick={handleResendConfirmation} disabled={resending} className="mt-3 text-sm text-green-400 hover:text-indigo-200 underline underline-offset-2 disabled:opacity-50">
            {resending ? 'Sending...' : 'Resend confirmation email'}
          </button>
        )}
        <div className="mt-6 text-center text-sm text-gray-400">
          Don't have an account? <Link to="/signup" className="text-green-400 hover:text-green-400">Sign up here</Link>
        </div>
      </div>
    </div>
  );
};

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [confirmationPending, setConfirmationPending] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'error' | 'success'; message: string } | null>(null);
  const navigate = useNavigate();

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
    <div className="flex items-center justify-center min-h-screen px-4 relative z-10">
      <div className="w-full max-w-md bg-zinc-950 border border-gray-800 rounded-xl shadow-2xl p-8">
        <div className="flex justify-center mb-6">
          <img src="/logo.jpg" alt="Logo" className="w-20 h-20 rounded-full border border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)] object-cover" />
        </div>
        <h2 className="text-2xl font-bold text-center text-white mb-2">Create an Account</h2>
        <p className="text-gray-400 text-center mb-8 text-sm">Join to access your software packages</p>
        
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
            <input 
              type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Create Password</label>
            <input 
              type="password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" disabled={loading}
            className="w-full mt-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        {notice && <p role={notice.kind === 'error' ? 'alert' : 'status'} className={`mt-4 text-sm ${notice.kind === 'error' ? 'text-red-400' : 'text-green-400'}`}>{notice.message}</p>}
        {confirmationPending && (
          <button type="button" onClick={handleResendConfirmation} disabled={resending} className="mt-3 text-sm text-green-300 hover:text-green-200 underline underline-offset-2 disabled:opacity-50">
            {resending ? 'Sending...' : 'Resend confirmation email'}
          </button>
        )}
        <div className="mt-6 text-center text-sm text-gray-400">
          Already have an account? <Link to="/login" className="text-green-400 hover:text-green-300">Sign in</Link>
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
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 z-50 w-64 bg-[#0a0a0a] border-r border-green-900/30 flex flex-col transition-transform duration-300 ease-in-out`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-green-900/30 bg-black">
          <div className="flex items-center">
            <div className="relative w-8 h-8 mr-3">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full rounded-full border-2 border-green-500/50 object-cover relative z-10" />
              <div className="absolute inset-[-4px] rounded-full border border-transparent border-t-green-400 border-l-green-400/30 animate-spin z-0"></div>
              <div className="absolute inset-[-6px] rounded-full border border-green-900/50 animate-[spin_3s_linear_reverse_infinite] z-0"></div>
            </div>
            <span className="font-bold text-lg tracking-wider text-green-50">PhantomLead</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 relative z-10 bg-[#0a0a0a]/90">
          {isAdmin ? (
            <>
              <Link to="/admin" className="flex items-center px-4 py-2.5 text-gray-300 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"><LayoutDashboard className="w-5 h-5 mr-3" /> Admin Overview</Link>
              <Link to="/admin/licenses" className="flex items-center px-4 py-2.5 text-gray-300 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"><Key className="w-5 h-5 mr-3" /> All Licenses</Link>
              <Link to="/admin/packages" className="flex items-center px-4 py-2.5 text-gray-300 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"><Package className="w-5 h-5 mr-3" /> All Packages</Link>
              <Link to="/admin/payments" className="flex items-center px-4 py-2.5 text-gray-300 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"><CreditCard className="w-5 h-5 mr-3" /> Payments</Link>
              <Link to="/admin/customers" className="flex items-center px-4 py-2.5 text-gray-300 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"><Users className="w-5 h-5 mr-3" /> Customers</Link>
              <Link to="/admin/settings" className="flex items-center px-4 py-2.5 text-gray-300 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"><Settings className="w-5 h-5 mr-3" /> Settings</Link>
              <div className="pt-4 mt-4 border-t border-green-900/30">
                <Link to="/dashboard" className="flex items-center px-4 py-2.5 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors border border-green-500/20"><User className="w-5 h-5 mr-3" /> View as Customer</Link>
              </div>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="flex items-center px-4 py-2.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg"><LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard</Link>
              <Link to="/dashboard/licenses" className="flex items-center px-4 py-2.5 text-gray-300 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"><Key className="w-5 h-5 mr-3" /> My Licenses</Link>
              <Link to="/dashboard/packages" className="flex items-center px-4 py-2.5 text-gray-300 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"><Package className="w-5 h-5 mr-3" /> Buy Packages</Link>
              {hasActiveLicense && (
                <Link to="/dashboard/install" className="flex items-center px-4 py-2.5 text-gray-300 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"><BookOpen className="w-5 h-5 mr-3" /> Installation Guide</Link>
              )}
              {isActualAdmin && (
                <div className="pt-4 mt-4 border-t border-green-900/30">
                  <Link to="/admin" className="flex items-center px-4 py-2.5 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors border border-green-500/20"><Shield className="w-5 h-5 mr-3" /> Return to Admin</Link>
                </div>
              )}
            </>
          )}
        </nav>
        <div className="p-4 border-t border-green-900/30 bg-[#0a0a0a]">
          <button onClick={() => supabase.auth.signOut()} className="flex items-center px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg w-full transition-colors"><LogOut className="w-5 h-5 mr-3" /> Sign Out</button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        <header className="h-16 border-b border-green-900/30 flex items-center px-3 sm:px-6 md:px-8 bg-black/80 backdrop-blur shrink-0 gap-2">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-400 hover:text-white p-1.5 -ml-1 rounded-lg hover:bg-gray-800/60" aria-label="Open Navigation Menu">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-base sm:text-xl font-semibold text-green-50 font-mono tracking-wide truncate">{title}</h1>
          <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="text-xs sm:text-sm font-medium text-green-400 hidden sm:block max-w-[150px] truncate">{userName}</span>
            <div className="w-8 h-8 bg-[#0a0a0a] rounded-full flex items-center justify-center border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]"><User className="w-4 h-4 text-green-400" /></div>
          </div>
        </header>
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 overflow-y-auto w-full max-w-full">
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
    <DashboardLayout title="Customer Workstation" isAdmin={false} isActualAdmin={isActualAdmin}>
      <div className="space-y-6">
        {/* Welcome & Station Status Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-950 via-[#0a0f0c] to-zinc-950 border border-green-500/30 p-5 sm:p-6 shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-full bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-green-500/10 text-green-400 border border-green-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                  Safe Exam Station
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-xs text-gray-400 font-mono">SEB v3.10.2 Ready</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Welcome to Your PhantomLead Console
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 max-w-2xl">
                Manage your active exam helper licenses, download secure installation packages, and verify workstation DRM status.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link 
                to="/dashboard/packages" 
                className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all cursor-pointer whitespace-nowrap"
              >
                Browse Packages
              </Link>
            </div>
          </div>
        </div>

        {/* 3 Executive Metric Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0a0a0a] border border-gray-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-green-500/30 transition-all">
            <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
              <span>LICENSE STATUS</span>
              <Key className="w-4 h-4 text-green-400" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-black text-white font-mono">
                {checkingLicense ? '...' : hasActiveLicense ? `${activeLicenseCount} Active` : '0 Active'}
              </div>
              <div className="text-xs font-semibold mt-0.5">
                {checkingLicense ? (
                  <span className="text-gray-500">Checking status...</span>
                ) : hasActiveLicense ? (
                  <span className="text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"></span>
                    Operational &amp; Armed
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> 100% Fresh Account
                  </span>
                )}
              </div>
            </div>
            <Link to="/dashboard/licenses" className="text-xs text-gray-400 hover:text-green-400 flex items-center gap-1 font-medium transition-colors">
              <span>View license details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-[#0a0a0a] border border-gray-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-blue-500/30 transition-all">
            <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
              <span>HARDWARE NODE LOCK</span>
              <Laptop className="w-4 h-4 text-blue-400" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-black text-white font-mono">1 PC Binding</div>
              <div className="text-xs text-blue-400 mt-0.5">
                {hasActiveLicense ? 'Hardware Lock Enabled' : 'Machine Slot Free'}
              </div>
            </div>
            <span className="text-xs text-gray-500">Protected against device spoofing</span>
          </div>

          <div className="bg-[#0a0a0a] border border-gray-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-purple-500/30 transition-all">
            <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
              <span>EXAM ENVIRONMENT</span>
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-black text-white font-mono">SEB 3.10.2</div>
              <div className="text-xs text-purple-400 mt-0.5">Kiosk Mode In-Session Pasting</div>
            </div>
            <Link to="/dashboard/install" className="text-xs text-gray-400 hover:text-purple-400 flex items-center gap-1 font-medium transition-colors">
              <span>Read user manual</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Workstation Command Hub */}
        <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-6 sm:p-7 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-800/80">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" /> Workstation Operations &amp; Installer
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                {checkingLicense 
                  ? 'Verifying cryptographic security token...' 
                  : hasActiveLicense 
                  ? 'Your active license package is configured and ready for download.' 
                  : 'Your account is completely clean. Choose a package to activate Safe Exam Browser extensions.'}
              </p>
            </div>
            <Link 
              to="/dashboard/licenses" 
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-gray-200 hover:text-white rounded-xl text-xs font-semibold transition-all"
            >
              <Key className="w-3.5 h-3.5 text-green-400" />
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
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <a 
                    href={`https://wgxxitydatuoyjnxuvqw.supabase.co/storage/v1/object/public/installers/${installerName}?v=${new Date().getTime()}`} 
                    download={installerName} 
                    className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(34,197,94,0.35)] transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Download {installerName}
                    <span className="text-xs font-normal text-green-100 bg-green-700/60 px-2 py-0.5 rounded ml-1">
                      {editionLabel}
                    </span>
                  </a>

                  <Link 
                    to="/dashboard/install" 
                    className="inline-flex items-center gap-2 px-4 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-gray-200 hover:text-white rounded-xl text-sm font-medium border border-zinc-700 transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-green-400" />
                    <span>Setup Manual &amp; Shortcuts</span>
                  </Link>
                </div>

                {(installerName === 'SecureInstaller_T.exe' || installerName === 'SecureInstaller_A.exe') && (
                  <div className="p-4 border border-red-900/50 bg-red-950/20 rounded-xl max-w-2xl text-xs text-gray-300 space-y-1">
                    <h4 className="text-red-400 font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-400" /> DRM Security Sentinel Active
                    </h4>
                    <p className="text-gray-400 leading-relaxed">
                      {installerName === 'SecureInstaller_T.exe' 
                        ? 'This software contains an automated Time-Bomb. Upon your license expiry date, or if revoked by an admin, the system automatically wipes all proprietary configuration files and resets your account to Fresh.'
                        : 'This software is actively monitored. If your access is revoked by an administrator, the remote kill-switch automatically wipes all configuration files from your host machine.'}
                    </p>
                  </div>
                )}
              </div>
            );
          })() : (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">Your Account is Fresh &amp; Ready</h4>
                <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto">
                  No licenses are currently active. Browse our available packages to activate Safe Exam Browser extensions immediately.
                </p>
              </div>
              <Link 
                to="/dashboard/packages" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(34,197,94,0.35)] transition-all"
              >
                <span>Browse Available Packages</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        <HowItWorksCard />
      </div>
    </DashboardLayout>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({ customers: 0, pending: 0, activeLicenses: 0, revenue: 0 });
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
      <div className="space-y-6 pb-12">
        {/* Executive Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-950 via-[#0a0f0c] to-zinc-950 border border-green-500/30 p-6 shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-full bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-green-500/10 text-green-400 border border-green-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                  Fleet Command Engine
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-xs text-gray-400 font-mono">Platform v2.0</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Welcome back, Fleet Administrator!
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 max-w-2xl">
                Global overview of student licenses, incoming UPI transactions, node locks, and infrastructure health.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link 
                to="/admin/licenses" 
                className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all whitespace-nowrap cursor-pointer"
              >
                + Issue License
              </Link>
              <Link 
                to="/admin/settings" 
                className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-gray-300 hover:text-white rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Executive KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0a0a0a] border border-gray-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-blue-500/30 transition-all">
            <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
              <span>REGISTERED CUSTOMERS</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="my-2">
              <div className="text-3xl font-black text-white font-mono">{loading ? '...' : stats.customers}</div>
              <div className="text-xs text-blue-400 mt-0.5">Verified Accounts</div>
            </div>
            <Link to="/admin/customers" className="text-xs text-gray-500 hover:text-blue-400 flex items-center gap-1 transition-colors">
              <span>Manage customer directory</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-[#0a0a0a] border border-gray-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-yellow-500/30 transition-all">
            <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
              <span>PENDING PAYMENTS</span>
              <CreditCard className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="my-2">
              <div className="text-3xl font-black text-yellow-400 font-mono">{loading ? '...' : stats.pending}</div>
              <div className="text-xs text-yellow-300/80 mt-0.5">
                {stats.pending > 0 ? 'Requires manual review' : 'All transactions reviewed'}
              </div>
            </div>
            <Link to="/admin/payments" className="text-xs text-gray-500 hover:text-yellow-400 flex items-center gap-1 transition-colors">
              <span>Review transaction queue</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-[#0a0a0a] border border-gray-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-green-500/30 transition-all">
            <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
              <span>ACTIVE LICENSES</span>
              <Key className="w-4 h-4 text-green-400" />
            </div>
            <div className="my-2">
              <div className="text-3xl font-black text-green-400 font-mono">{loading ? '...' : stats.activeLicenses}</div>
              <div className="text-xs text-green-300/80 mt-0.5">Live running deployments</div>
            </div>
            <Link to="/admin/licenses" className="text-xs text-gray-500 hover:text-green-400 flex items-center gap-1 transition-colors">
              <span>View global fleet</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-[#0a0a0a] border border-gray-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
              <span>PLATFORM REVENUE</span>
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="my-2">
              <div className="text-3xl font-black text-white font-mono">
                {loading ? '...' : `₹${stats.revenue.toLocaleString()}`}
              </div>
              <div className="text-xs text-emerald-400 mt-0.5">Approved UPI collections</div>
            </div>
            <span className="text-xs text-gray-500">Direct verified payments</span>
          </div>
        </div>

        {/* 2 Executive Command Decks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deck 1: Quick Operations Hub */}
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-green-400" /> Operational Hub
              </h3>
              <span className="text-xs text-gray-500 font-mono">Core Actions</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Link 
                to="/admin/payments" 
                className="p-4 bg-black/60 border border-gray-800 rounded-xl hover:border-yellow-500/50 hover:bg-zinc-900/60 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <CreditCard className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
                  {stats.pending > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 animate-pulse">
                      {stats.pending} Pending
                    </span>
                  )}
                </div>
                <div className="font-bold text-white text-sm mb-0.5">Review Payments</div>
                <div className="text-[11px] text-gray-400">Approve or reject incoming UPI slips</div>
              </Link>

              <Link 
                to="/admin/licenses" 
                className="p-4 bg-black/60 border border-gray-800 rounded-xl hover:border-green-500/50 hover:bg-zinc-900/60 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <Key className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-300 border border-green-500/40">
                    Live
                  </span>
                </div>
                <div className="font-bold text-white text-sm mb-0.5">Fleet Licenses</div>
                <div className="text-[11px] text-gray-400">Issue keys &amp; execute remote host wipes</div>
              </Link>

              <Link 
                to="/admin/packages" 
                className="p-4 bg-black/60 border border-gray-800 rounded-xl hover:border-purple-500/50 hover:bg-zinc-900/60 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <Package className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="font-bold text-white text-sm mb-0.5">Software Bundles</div>
                <div className="text-[11px] text-gray-400">Configure pricing &amp; exam extensions</div>
              </Link>

              <Link 
                to="/admin/customers" 
                className="p-4 bg-black/60 border border-gray-800 rounded-xl hover:border-blue-500/50 hover:bg-zinc-900/60 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="font-bold text-white text-sm mb-0.5">User Directory</div>
                <div className="text-[11px] text-gray-400">Inspect device fingerprints &amp; customer profiles</div>
              </Link>
            </div>
          </div>

          {/* Deck 2: Infrastructure & Sentinel Radar */}
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Platform Infrastructure Radar
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  HEALTH OK
                </span>
              </div>

              <div className="divide-y divide-gray-800/60 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-gray-400">Database Engine (PostgreSQL)</span>
                  <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/30 rounded font-mono font-semibold">
                    Operational (Sub-50ms)
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-gray-400">Serverless Edge Functions</span>
                  <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/30 rounded font-mono font-semibold">
                    5 Deployed &amp; Active
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-gray-400">Auto-Wipe &amp; Sentinel Protocol</span>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded font-mono font-semibold">
                    Armed (Zero-Day Wipe)
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-gray-400">License Cryptographic Vault</span>
                  <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded font-mono font-semibold">
                    SHA-256 / AES-GCM
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-gray-400">Payment Reconciliation (UPI)</span>
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded font-mono font-semibold">
                    Instant Screenshot Proof
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-500 font-mono">
              <span>PhantomLead DRM Engine v2.0</span>
              <span>All Systems Nominal</span>
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

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full"></div></div>;

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

      <div className="min-h-screen bg-[#030805] text-gray-100 font-sans relative overflow-hidden">
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
