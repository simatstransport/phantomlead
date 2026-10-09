import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './services/supabase';
import { Shield, Key, Package, LogOut, LayoutDashboard, User, CreditCard, Users, Download, Settings, Menu, X, BookOpen , AlertTriangle } from 'lucide-react';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminPackages } from './pages/admin/AdminPackages';
import { AdminLicenses } from './pages/admin/AdminLicenses';
import { AdminCustomers } from './pages/admin/AdminCustomers';
import { AdminSettings } from './pages/admin/AdminSettings';
import { CustomerPackages } from './pages/CustomerPackages';
import { CustomerInstallation } from './pages/CustomerInstallation';
import { CustomerLicenses } from './pages/CustomerLicenses';
import { OnboardingModal } from './components/OnboardingModal';
import { PageTransitionLoader } from './components/PageTransitionLoader';
import { MatrixBackground } from './components/MatrixBackground';
import { AnimatedGlow } from './components/AnimatedGlow';

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

        const { data: licenses, count, error } = await supabase
          .from('licenses')
          .select('id, duration_months, payment_type', { count: 'exact' })
          .eq('customer_id', customer.id)
          .eq('status', 'ACTIVE');

        if (isCurrent) {
          setActiveLicenseCount(error ? 0 : count ?? 0);
          setHasActiveLicense(!error && (count ?? 0) > 0);
          if (licenses && licenses.length > 0) {
            (window as any).activeLicenseDetails = licenses[0];
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
    <div className="min-h-screen bg-[#030805] text-white flex relative overflow-hidden">
      <AnimatedGlow />
      <MatrixBackground />
      
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
        <header className="h-16 border-b border-green-900/30 flex items-center px-4 md:px-8 bg-black/80 backdrop-blur shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden mr-4 text-gray-400 hover:text-white p-2">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-green-50 font-mono tracking-wide">{title}</h1>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm font-medium text-green-400 hidden sm:block">{userName}</span>
            <div className="w-8 h-8 bg-[#0a0a0a] rounded-full flex items-center justify-center border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]"><User className="w-4 h-4 text-green-400" /></div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto ">
          {children}
        </main>
      </div>
    </div>
  );
};



const CustomerDashboard = ({ isActualAdmin }: { isActualAdmin?: boolean }) => {
  const { hasActiveLicense, activeLicenseCount, checkingLicense } = useHasActiveLicense(false);

  return (
    <DashboardLayout title="Customer Dashboard" isAdmin={false} isActualAdmin={isActualAdmin}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-zinc-950 border border-gray-800 rounded-xl p-6">
          <h3 className="text-gray-400 text-sm font-medium mb-2">Active Licenses</h3>
          <p className="text-3xl font-bold">{checkingLicense ? '...' : activeLicenseCount}</p>
        </div>
        <div className="bg-zinc-950 border border-gray-800 rounded-xl p-6">
          <h3 className="text-gray-400 text-sm font-medium mb-2">Available Packages</h3>
          <Link to="/dashboard/packages" className="text-3xl font-bold text-green-400 hover:text-green-400">Browse packages</Link>
        </div>
      </div>
      <section className="bg-zinc-950 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-2">My Licenses</h2>
        <p className="text-sm text-gray-400 mb-5">
          {checkingLicense ? 'Checking your license status...' : hasActiveLicense ? 'View your active package and license status.' : 'No active licenses yet. Your license will appear here after it is issued.'}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/dashboard/licenses" className="inline-flex px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium">View my licenses</Link>
          {!checkingLicense && hasActiveLicense && (() => {
            const licenseDetails = (window as any).activeLicenseDetails;
            let installerName = 'SecureInstaller_L.exe';
            
            if (licenseDetails) {
              if (licenseDetails.duration_months > 0) {
                installerName = 'SecureInstaller_T.exe'; // Time-Bomb
              } else if (licenseDetails.duration_months === 0) {
                installerName = 'SecureInstaller_A.exe'; // Admin Controlled (Free)
              } else {
                installerName = 'SecureInstaller_L.exe'; // True Lifetime (-1 or null)
              }
            }

            return (
              <div className="flex flex-col gap-4">
                <div>
                  <a href={`https://wgxxitydatuoyjnxuvqw.supabase.co/storage/v1/object/public/installers/${installerName}`} download className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all">
                    <Download className="w-5 h-5" /> Download Secure Installer
                  </a>
                </div>
                {(installerName === 'SecureInstaller_T.exe' || installerName === 'SecureInstaller_A.exe') && (
                  <div className="mt-2 p-4 border border-red-900/50 bg-red-950/20 rounded-lg max-w-xl">
                    <h4 className="text-red-400 font-bold mb-1 flex items-center text-sm"><AlertTriangle className="w-4 h-4 mr-2" /> DRM Security Notice</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {installerName === 'SecureInstaller_T.exe' 
                        ? 'This software contains an automated Time-Bomb. Upon your license expiry date, or if your license is revoked by an admin, the system will automatically and permanently delete the configuration files from your host machine to prevent unauthorized access.'
                        : 'This software is actively monitored. If your access is revoked by an administrator, the remote kill-switch will automatically and permanently delete the configuration files from your host machine.'}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </section>
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
    <DashboardLayout title="Admin Overview" isAdmin={true}>
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-green-400 mb-1">Welcome back, Administrator!</h2>
          <p className="text-sm text-gray-300">Here is what is happening with your license platform today.</p>
        </div>
        <Link to="/admin/settings" className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap">Platform Settings</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-950 border border-gray-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center text-gray-400 mb-2">
            <Users className="w-5 h-5 mr-2" />
            <h3 className="font-medium">Total Customers</h3>
          </div>
          <div className="text-3xl font-bold text-white">{loading ? '...' : stats.customers}</div>
        </div>
        
        <div className="bg-zinc-950 border border-gray-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center text-gray-400 mb-2">
            <CreditCard className="w-5 h-5 mr-2" />
            <h3 className="font-medium">Pending Approvals</h3>
          </div>
          <div className="text-3xl font-bold text-yellow-400">{loading ? '...' : stats.pending}</div>
        </div>

        <div className="bg-zinc-950 border border-gray-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center text-gray-400 mb-2">
            <Key className="w-5 h-5 mr-2" />
            <h3 className="font-medium">Active Licenses</h3>
          </div>
          <div className="text-3xl font-bold text-green-400">{loading ? '...' : stats.activeLicenses}</div>
        </div>

        <div className="bg-zinc-950 border border-gray-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center text-gray-400 mb-2">
            <span className="font-medium">Total Revenue</span>
          </div>
          <div className="text-3xl font-bold text-white">{loading ? '...' : `₹${stats.revenue.toLocaleString()}`}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions Panel */}
        <div className="bg-zinc-950 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4 border-b border-gray-800 pb-2">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/admin/payments" className="p-4 bg-black border border-gray-800 rounded-lg hover:border-green-500 transition-colors group">
              <CreditCard className="w-6 h-6 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
              <div className="font-medium text-white mb-1">Review Payments</div>
              <div className="text-xs text-gray-500">Approve or reject pending UPI transactions</div>
            </Link>
            
            <Link to="/admin/licenses" className="p-4 bg-black border border-gray-800 rounded-lg hover:border-green-500 transition-colors group">
              <Key className="w-6 h-6 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
              <div className="font-medium text-white mb-1">Generate License</div>
              <div className="text-xs text-gray-500">Manually issue a free license to a customer</div>
            </Link>

            <Link to="/admin/packages" className="p-4 bg-black border border-gray-800 rounded-lg hover:border-green-500 transition-colors group">
              <Package className="w-6 h-6 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
              <div className="font-medium text-white mb-1">Manage Packages</div>
              <div className="text-xs text-gray-500">Update pricing or add new software bundles</div>
            </Link>

            <Link to="/admin/customers" className="p-4 bg-black border border-gray-800 rounded-lg hover:border-green-500 transition-colors group">
              <Users className="w-6 h-6 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
              <div className="font-medium text-white mb-1">Manage Users</div>
              <div className="text-xs text-gray-500">Block, delete, or view registered customers</div>
            </Link>
          </div>
        </div>

        {/* System Status Panel */}
        <div className="bg-zinc-950 border border-gray-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold mb-4 border-b border-gray-800 pb-2">System Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Database Connection</span>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Edge Functions</span>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">Deployed</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Payment Gateway (UPI)</span>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">License Encryption</span>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">Secured</span>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-800 text-center text-xs text-gray-600">
            PhantomLead Platform v1.0 &copy; 2026 Phantom Lead
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

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
      {session && !isAdmin && !onboarded && <OnboardingModal session={session} onComplete={() => setOnboarded(true)} />}
      <div className="min-h-screen bg-[#030805] text-gray-100 font-sans relative overflow-hidden">
        <AnimatedGlow />
        <Routes>
          <Route path="/login" element={session ? (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />) : <Login />} />
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
          <Route path="/admin/settings" element={session ? (isAdmin ? <DashboardLayout title="Settings" isAdmin={true}><AdminSettings /></DashboardLayout> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />
          <Route path="/" element={<Navigate to={session ? (isAdmin ? "/admin" : "/dashboard") : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
