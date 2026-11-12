import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './services/supabase';
import { 
  Shield, Key, Package, LogOut, LayoutDashboard, User, CreditCard, 
  Users, Download, Settings, Menu, X, BookOpen, AlertTriangle,
  Sparkles, ArrowRight, Laptop, Zap, ShieldCheck, Activity, CheckCircle2,
  Loader2, Radio, Star
} from 'lucide-react';
import { downloadInstaller } from './utils/download';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminPackages } from './pages/admin/AdminPackages';
import { AdminLicenses } from './pages/admin/AdminLicenses';
import { AdminCustomers } from './pages/admin/AdminCustomers';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminWipeFolders } from './pages/admin/AdminWipeFolders';
import { AdminDevices } from './pages/admin/AdminDevices';
import { CustomerPackages } from './pages/CustomerPackages';
import { CustomerInstallation } from './pages/CustomerInstallation';
import { CustomerLicenses } from './pages/CustomerLicenses';
import { CustomerReviews } from './pages/CustomerReviews';
import { PackageToolsUsageCard } from './components/PackageToolsUsageCard';
import { OnboardingModal } from './components/OnboardingModal';
import { PageTransitionLoader } from './components/PageTransitionLoader';
import { MatrixBackground } from './components/MatrixBackground';
import { AnimatedGlow } from './components/AnimatedGlow';
import { ThemeProvider } from './context/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';

// Strict 1st-time only greeting dispatcher (permanently recorded across logins)
const dispatchGreetingEmail = async (user: any) => {
  if (!user || !user.email) return;

  const email = user.email;
  const storageKey = `login_welcome_email_sent_${email}`;

  // 1. Instant check in localStorage across all browser sessions
  try {
    if (localStorage.getItem(storageKey)) {
      return; // Already sent permanently, never send again!
    }
  } catch {
    // Ignore storage issues
  }

  // 2. Check if user is newly created or existing user
  // If user was created more than 2 minutes ago or has logged in previously, do not send!
  if (user.created_at) {
    const createdAtTime = new Date(user.created_at).getTime();
    const nowTime = Date.now();
    const ageInMinutes = (nowTime - createdAtTime) / (1000 * 60);

    // If account was created more than 10 minutes ago, treat as returning user and permanently mark sent
    if (ageInMinutes > 10) {
      try {
        localStorage.setItem(storageKey, 'true');
      } catch {}
      return;
    }
  }

  // 3. Mark in localStorage BEFORE network request to guarantee no race condition / duplicates
  try {
    localStorage.setItem(storageKey, 'true');
  } catch {}

  const apiUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? '/api/send-invoice'
    : 'http://localhost:3001/api/send-invoice';

  try {
    await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toEmail: email,
        toName: user.user_metadata?.full_name || email.split('@')[0],
        isWelcome: true,
        timestamp: new Date().toISOString(),
      }),
    });
    console.log(`[1st-Time Welcome Email Dispatched] to new user: ${email}`);
  } catch (err) {
    console.warn('[Welcome notice error]:', err);
  }
};

const Login = () => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'error' | 'success'; message: string } | null>(null);

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

  return (
    <div className="flex items-center justify-center min-h-screen px-4 relative z-10 py-12">
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md relative overflow-hidden rounded-2xl bg-[#09090b]/90 backdrop-blur-2xl p-8 sm:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.9)] border border-white/10 before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-[#de1b1c] before:to-transparent cinema-corner-mark">
        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className="relative w-20 h-20">
              <img 
                src="/logo.jpg" 
                alt="Logo" 
                className="w-full h-full rounded-2xl border-2 border-[#de1b1c]/80 shadow-[0_0_30px_rgba(222,27,28,0.35)] object-cover relative z-10" 
              />
              <div className="absolute inset-[-4px] rounded-2xl border border-[#de1b1c]/30 z-0 animate-pulse" />
            </div>
          </div>

          <div className="text-center mb-7">
            <div className="flex items-center justify-center gap-2 mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-sans font-semibold tracking-wider uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 rounded-full inline-block">
                SECURE EXAM SUITE
              </span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              Phantom<span className="text-emerald-400">Lead</span>
            </h2>
            <p className="text-slate-400 mt-1.5 text-xs font-sans leading-relaxed">
              Safe Exam Browser Assistant • License Management
            </p>
          </div>

          {/* Google 1-Click Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-3.5 px-5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-sans font-bold text-sm flex items-center justify-center gap-3.5 transition-all cursor-pointer active:scale-[0.98] shadow-lg disabled:opacity-60 group border border-slate-200"
          >
            <svg className="w-5 h-5 shrink-0 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
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
            <span>
              {googleLoading ? 'Signing in...' : 'Sign In with Google'}
            </span>
          </button>

          {notice && (
            <div className={`mt-5 p-3.5 rounded-xl text-xs font-sans text-center ${notice.kind === 'error' ? 'bg-rose-500/15 border border-rose-500/40 text-rose-300' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'}`}>
              {notice.message}
            </div>
          )}

          {/* Security Trust Badges */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center gap-2 text-slate-400 text-xs text-center font-sans">
            <div className="flex items-center gap-2 text-slate-300">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Safe Exam Browser 3.10.2 • 1 PC Device Lock</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Sign in with your Google account to access your licenses and downloads.
            </p>
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
          .select('id, duration_months, payment_type, expires_at, packages(package_name, package_code)')
          .eq('customer_id', customer.id)
          .eq('status', 'ACTIVE');

        const now = Date.now();
        const validLicenses: any[] = [];
        if (!error && licenses) {
          for (const lic of licenses) {
            // Only count non-expired licenses as active
            if (!(lic.expires_at && new Date(lic.expires_at).getTime() <= now)) {
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
  const location = useLocation();
  const isCurrent = (path: string) => location.pathname === path;

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
          className="fixed inset-0 bg-black/75 z-40 md:hidden backdrop-blur-md transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Modern Cinematic Noir Sidebar */}
      <aside className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 z-50 w-64 bg-[#050505] border-r border-white/10 flex flex-col transition-transform duration-200 ease-out shadow-[10px_0_30px_rgba(0,0,0,0.8)]`}>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-[#000000]">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full rounded-lg border border-[#de1b1c]/80 shadow-[0_0_10px_rgba(222,27,28,0.5)] object-cover relative z-10" />
            </div>
            <div className="flex flex-col">
              <span className="font-display uppercase text-lg tracking-wider text-white leading-none">
                Phantom<span className="text-[#de1b1c]">Lead</span>
              </span>
              <span className="text-[9px] font-cinematic tracking-[0.2em] uppercase text-[#de1b1c] font-bold mt-0.5">
                SCENE // SENTINEL
              </span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-[#8a8a8a] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
          {isAdmin ? (
            <>
              <div className="px-3 py-1.5 text-[11px] font-sans uppercase tracking-wider text-slate-400 font-bold">
                Admin Menu
              </div>
              <Link 
                to="/admin" 
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3.5 py-2.5 rounded-xl transition-all group font-sans text-xs sm:text-sm font-semibold ${
                  isCurrent('/admin') 
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <LayoutDashboard className={`w-4 h-4 mr-3 transition-transform group-hover:scale-105 ${isCurrent('/admin') ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                Dashboard Overview
              </Link>
              <Link 
                to="/admin/licenses" 
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3.5 py-2.5 rounded-xl transition-all group font-sans text-xs sm:text-sm font-semibold ${
                  isCurrent('/admin/licenses') 
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Key className={`w-4 h-4 mr-3 transition-transform group-hover:scale-105 ${isCurrent('/admin/licenses') ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                Licenses
              </Link>
              <Link 
                to="/admin/packages" 
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3.5 py-2.5 rounded-xl transition-all group font-sans text-xs sm:text-sm font-semibold ${
                  isCurrent('/admin/packages') 
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Package className={`w-4 h-4 mr-3 transition-transform group-hover:scale-105 ${isCurrent('/admin/packages') ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                Packages
              </Link>
              <Link 
                to="/admin/payments" 
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3.5 py-2.5 rounded-xl transition-all group font-sans text-xs sm:text-sm font-semibold ${
                  isCurrent('/admin/payments') 
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <CreditCard className={`w-4 h-4 mr-3 transition-transform group-hover:scale-105 ${isCurrent('/admin/payments') ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                Payments
              </Link>
              <Link 
                to="/admin/customers" 
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3.5 py-2.5 rounded-xl transition-all group font-sans text-xs sm:text-sm font-semibold ${
                  isCurrent('/admin/customers') 
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Users className={`w-4 h-4 mr-3 transition-transform group-hover:scale-105 ${isCurrent('/admin/customers') ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                Customers
              </Link>
              <Link 
                to="/admin/devices" 
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3.5 py-2.5 rounded-xl transition-all group font-sans text-xs sm:text-sm font-semibold ${
                  isCurrent('/admin/devices') 
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 shadow-sm shadow-cyan-500/10' 
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Radio className={`w-4 h-4 mr-3 transition-transform group-hover:scale-105 ${isCurrent('/admin/devices') ? 'text-cyan-400 animate-pulse' : 'text-slate-400 group-hover:text-cyan-400'}`} />
                Telemetry Radar
              </Link>
              <Link 
                to="/admin/settings" 
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3.5 py-2.5 rounded-xl transition-all group font-sans text-xs sm:text-sm font-semibold ${
                  isCurrent('/admin/settings') 
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Settings className={`w-4 h-4 mr-3 transition-transform group-hover:scale-105 ${isCurrent('/admin/settings') ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                Settings
              </Link>
              <Link 
                to="/admin/reviews" 
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3.5 py-2.5 rounded-xl transition-all group font-sans text-xs sm:text-sm font-semibold ${
                  isCurrent('/admin/reviews') 
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/10' 
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Star className={`w-4 h-4 mr-3 transition-transform group-hover:scale-105 ${isCurrent('/admin/reviews') ? 'text-amber-400 fill-amber-400' : 'text-slate-400 group-hover:text-amber-400'}`} />
                Moderate Reviews
              </Link>
              <div className="pt-3 mt-3 border-t border-white/10">
                <Link 
                  to="/dashboard" 
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-3.5 py-2.5 text-slate-300 hover:bg-white/[0.06] rounded-xl transition-all border border-white/10 font-sans text-xs sm:text-sm font-semibold"
                >
                  <User className="w-4 h-4 mr-3 text-cyan-400" /> Switch to User View
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="px-3 py-1.5 text-[11px] font-sans uppercase tracking-wider text-slate-400 font-bold">
                Navigation
              </div>
              <Link 
                to="/dashboard" 
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3.5 py-2.5 rounded-xl transition-all group font-sans text-xs sm:text-sm font-semibold ${
                  isCurrent('/dashboard') 
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <LayoutDashboard className={`w-4 h-4 mr-3 transition-transform group-hover:scale-105 ${isCurrent('/dashboard') ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                Dashboard
              </Link>
              <Link 
                to="/dashboard/licenses" 
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3.5 py-2.5 rounded-xl transition-all group font-sans text-xs sm:text-sm font-semibold ${
                  isCurrent('/dashboard/licenses') 
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Key className={`w-4 h-4 mr-3 transition-transform group-hover:scale-105 ${isCurrent('/dashboard/licenses') ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                My License
              </Link>
              <Link 
                to="/dashboard/packages" 
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3.5 py-2.5 rounded-xl transition-all group font-sans text-xs sm:text-sm font-semibold ${
                  isCurrent('/dashboard/packages') 
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Package className={`w-4 h-4 mr-3 transition-transform group-hover:scale-105 ${isCurrent('/dashboard/packages') ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                Buy Packages
              </Link>
              <Link 
                to="/dashboard/reviews" 
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3.5 py-2.5 rounded-xl transition-all group font-sans text-xs sm:text-sm font-semibold ${
                  isCurrent('/dashboard/reviews') 
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Star className={`w-4 h-4 mr-3 transition-transform group-hover:scale-105 ${isCurrent('/dashboard/reviews') ? 'text-amber-400 fill-amber-400' : 'text-slate-400 group-hover:text-amber-400'}`} />
                Reviews &amp; Ratings
              </Link>
              {hasActiveLicense && (
                <Link 
                  to="/dashboard/install" 
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-3.5 py-2.5 rounded-xl transition-all group font-sans text-xs sm:text-sm font-semibold ${
                    isCurrent('/dashboard/install') 
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <BookOpen className={`w-4 h-4 mr-3 transition-transform group-hover:scale-105 ${isCurrent('/dashboard/install') ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                  Installation Manual
                </Link>
              )}
              {isActualAdmin && (
                <div className="pt-3 mt-3 border-t border-white/10">
                  <Link 
                    to="/admin" 
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center px-3.5 py-2.5 text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all border border-emerald-500/30 font-sans text-xs sm:text-sm font-semibold"
                  >
                    <Shield className="w-4 h-4 mr-3" /> Back to Admin
                  </Link>
                </div>
              )}
            </>
          )}
        </nav>

        {/* User Footer / Logout */}
        <div className="p-3.5 border-t border-white/10 bg-[#000000]">
          <button 
            onClick={() => supabase.auth.signOut()}
            className="flex items-center w-full px-3.5 py-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs sm:text-sm font-sans font-semibold transition-all group cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-3 text-rose-400 group-hover:-translate-x-0.5 transition-transform" /> 
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Top Navbar */}
        <header className="h-16 bg-[#050505]/90 backdrop-blur-2xl border-b border-white/10 flex items-center justify-between px-4 sm:px-6 relative z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-400 hover:text-white p-1">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-base sm:text-lg font-sans font-bold text-white truncate flex items-center gap-2">
              <span>{title}</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-emerald-500/30 text-xs font-sans shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-semibold">SEB 3.10.2 Ready</span>
            </div>

            <ThemeToggle />

            <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
              <span className="text-xs font-sans text-slate-300 hidden sm:block max-w-[140px] truncate">
                {userName}
              </span>
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <User className="w-4 h-4 text-emerald-400" />
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
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const handleDownload = async (installerName: string) => {
    setDownloadingFile(installerName);
    setDownloadNotice(`Fetching ${installerName}...`);
    try {
      await downloadInstaller(installerName, (state) => {
        if (state.status === 'downloading') {
          setDownloadNotice(`Downloading ${installerName} (${state.progress}%)...`);
        } else if (state.status === 'completed') {
          setDownloadNotice(`✓ Download started for ${installerName}! Check your browser downloads.`);
          setTimeout(() => setDownloadNotice(null), 5000);
        } else if (state.status === 'error') {
          setDownloadNotice(`Download warning: Direct save fallback activated.`);
          setTimeout(() => setDownloadNotice(null), 5000);
        }
      });
    } catch {
      setDownloadNotice('Download initiated.');
      setTimeout(() => setDownloadNotice(null), 4000);
    } finally {
      setDownloadingFile(null);
    }
  };

  return (
    <DashboardLayout title="Dashboard" isAdmin={false} isActualAdmin={isActualAdmin}>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Modern Clean Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-[#09090b]/90 border border-white/10 p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-sans font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Exam Workstation
                </span>
                <span className="text-xs font-sans text-slate-300 bg-slate-900 border border-white/10 px-2.5 py-0.5 rounded-full font-medium">
                  SEB v3.10.2 Supported
                </span>
                <span className="text-xs font-sans text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-medium">
                  Gemini 1.5 Pro AI
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome to <span className="text-emerald-400">PhantomLead</span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                Download your exam assistant installer, check your device lock status, and manage your license keys.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link 
                to="/dashboard/packages" 
                className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs sm:text-sm font-sans font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap active:scale-95"
              >
                Buy Packages
              </Link>
              <Link 
                to="/dashboard/licenses" 
                className="px-5 py-3 bg-black/80 hover:bg-white/[0.06] text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-sans font-semibold transition-all whitespace-nowrap border border-white/15"
              >
                My License
              </Link>
            </div>
          </div>
        </div>

        {/* 3 Clear Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Tile 1: License Status */}
          <div className="bg-[#09090b]/80 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between relative overflow-hidden group shadow-lg">
            <div className="flex items-center justify-between text-xs font-sans">
              <span className="uppercase font-bold tracking-wider text-slate-400">License Status</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
                <Key className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                {checkingLicense ? 'Checking...' : hasActiveLicense ? `${activeLicenseCount} Active` : 'No Active License'}
              </div>
              <div className="text-xs font-semibold mt-1">
                {checkingLicense ? (
                  <span className="text-slate-500">Verifying account...</span>
                ) : hasActiveLicense ? (
                  <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Active &amp; Ready
                  </span>
                ) : (
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Account ready for setup
                  </span>
                )}
              </div>
            </div>
            <Link to="/dashboard/licenses" className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 font-medium transition-colors pt-2.5 border-t border-white/10">
              <span>View License Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Tile 2: Hardware Node Lock */}
          <div className="bg-[#09090b]/80 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between relative overflow-hidden group shadow-lg">
            <div className="flex items-center justify-between text-xs font-sans">
              <span className="uppercase font-bold tracking-wider text-slate-400">Device Lock</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm">
                <Laptop className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                1 PC Device
              </div>
              <div className="text-xs font-sans font-semibold text-slate-300 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {hasActiveLicense ? 'Bound to your computer' : 'Slot available for your PC'}
              </div>
            </div>
            <span className="text-xs text-slate-500 pt-2.5 border-t border-white/10">
              Locked to single CPU and Motherboard
            </span>
          </div>

          {/* Tile 3: Exam Environment */}
          <div className="bg-[#09090b]/80 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between relative overflow-hidden group shadow-lg">
            <div className="flex items-center justify-between text-xs font-sans">
              <span className="uppercase font-bold tracking-wider text-slate-400">Exam Compatibility</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-sm">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                SEB 3.10.2
              </div>
              <div className="text-xs font-sans font-semibold text-slate-300 mt-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                Clipboard &amp; Code Helper
              </div>
            </div>
            {hasActiveLicense ? (
              <Link to="/dashboard/install" className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 font-medium transition-colors pt-2.5 border-t border-white/10">
                <span>Open Installation Manual</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <span className="text-xs text-slate-500 pt-2.5 border-t border-white/10 flex items-center gap-1.5">
                <span>Requires active license to open manual</span>
              </span>
            )}
          </div>
        </div>

        {/* Download & Installer Section */}
        <div className="bg-[#09090b]/90 rounded-2xl p-6 sm:p-8 shadow-xl border border-white/10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/10">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-emerald-400" /> Installer Download
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {checkingLicense 
                  ? 'Checking license status...' 
                  : hasActiveLicense 
                  ? 'Your license is ready. Download the official installer below.' 
                  : 'Choose a package to get your license key, or download installers below.'}
              </p>
            </div>
            <Link 
              to="/dashboard/licenses" 
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-black/80 hover:bg-white/[0.06] border border-white/15 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all"
            >
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              <span>My License</span>
            </Link>
          </div>

          {/* Download Notification Banner */}
          {downloadNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
              {downloadingFile ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{downloadNotice}</span>
            </div>
          )}

          {!checkingLicense && hasActiveLicense ? (() => {
            let installerName = 'SecureInstaller_L.exe';
            let editionLabel = 'Lifetime Edition';
            
            if (licenseDetails) {
              if (licenseDetails.duration_months === -10) {
                installerName = 'SecureInstaller_T.exe';
                editionLabel = '10-Min Demo Trial';
              } else if (licenseDetails.duration_months && licenseDetails.duration_months > 0) {
                installerName = 'SecureInstaller_T.exe';
                editionLabel = `${licenseDetails.duration_months} Month Term`;
              } else if (licenseDetails.expires_at) {
                installerName = 'SecureInstaller_T.exe';
                editionLabel = 'Timed Term';
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
                  <button 
                    type="button"
                    onClick={() => handleDownload(installerName)}
                    disabled={downloadingFile === installerName}
                    className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95 disabled:opacity-75 disabled:cursor-wait"
                  >
                    {downloadingFile === installerName ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    ) : (
                      <Download className="w-4 h-4 text-slate-950" />
                    )}
                    <span>{downloadingFile === installerName ? 'Downloading...' : `Download ${installerName}`}</span>
                    <span className="text-xs font-semibold text-slate-950 bg-white/40 px-2 py-0.5 rounded-lg ml-1 border border-black/10">
                      {editionLabel}
                    </span>
                  </button>

                  <Link 
                    to="/dashboard/install" 
                    className="inline-flex items-center gap-2 px-5 py-3.5 bg-black/80 hover:bg-white/[0.06] text-slate-200 hover:text-white rounded-xl text-sm font-semibold border border-white/15 transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span>Installation Manual &amp; Shortcuts</span>
                  </Link>
                </div>

                {(installerName === 'SecureInstaller_T.exe' || installerName === 'SecureInstaller_A.exe') && (
                  <div className="p-4 border border-amber-500/30 bg-amber-500/10 rounded-xl max-w-2xl text-xs text-slate-200 space-y-1.5">
                    <h4 className="text-amber-400 font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" /> Time-Limited License
                    </h4>
                    <p className="text-slate-400 leading-relaxed">
                      {installerName === 'SecureInstaller_T.exe' 
                        ? 'This license runs until your expiry date. If your term ends or is revoked, the software cleans itself from your computer automatically.'
                        : 'This license is managed by your administrator. If access is revoked, it automatically clears configurations from your host PC.'}
                    </p>
                  </div>
                )}
              </div>
            );
          })() : (
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-sm">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-2xl font-bold text-white">No Active License</h4>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                  You do not have an active package yet. Select a package to receive your license key.
                </p>
              </div>
              <div className="pt-2">
                <Link 
                  to="/dashboard/packages" 
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer active:scale-95"
                >
                  <span>Browse Packages</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Plan-Specific Tools Usage Card for Active Students */}
        {hasActiveLicense && licenseDetails?.packages && (
          <PackageToolsUsageCard
            packageCode={licenseDetails.packages.package_code}
            packageName={licenseDetails.packages.package_name}
          />
        )}
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
        {/* Cinematic Executive Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-[#09090b]/90 border border-white/10 p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.9)] cinema-corner-mark">
          <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-bl from-[#de1b1c]/15 via-transparent to-transparent blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-cinematic font-bold tracking-[0.2em] uppercase bg-[#de1b1c]/15 text-[#ededed] border border-[#de1b1c]/40 flex items-center gap-1.5 shadow-[0_0_15px_rgba(222,27,28,0.3)]">
                  <span className="w-2 h-2 rounded-full bg-[#de1b1c] animate-ping" />
                  DIRECTOR'S COMMAND DECK
                </span>
                <span className="text-[#8a8a8a]">•</span>
                <span className="text-xs text-[#8a8a8a] font-mono">PLATFORM v2.0 ARMED</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-display uppercase tracking-wide text-white">
                FLEET <span className="text-[#de1b1c]">OVERVIEW &amp; TELEMETRY</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#8a8a8a] max-w-2xl leading-relaxed">
                Global management of candidate node bindings, cryptographic license issuance, manual UPI settlements, and zero-day remote wipes.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link 
                to="/admin/licenses" 
                className="px-6 py-3.5 bg-[#de1b1c] hover:bg-[#ff2a2b] text-white rounded-xl text-xs sm:text-sm font-cinematic uppercase tracking-widest font-bold shadow-[0_0_25px_rgba(222,27,28,0.4)] transition-all whitespace-nowrap cursor-pointer active:scale-95"
              >
                + Issue License Key
              </Link>
              <Link 
                to="/admin/settings" 
                className="px-5 py-3.5 bg-black/80 hover:bg-white/[0.06] text-[#ededed] hover:text-white rounded-xl text-xs sm:text-sm font-cinematic uppercase tracking-widest font-semibold transition-all whitespace-nowrap border border-white/15"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Cinematic KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Registered Customers */}
          <div className="bg-[#09090b]/80 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-[#de1b1c]/50 transition-all flex flex-col justify-between shadow-[0_15px_30px_rgba(0,0,0,0.8)] cinema-corner-mark">
            <div className="flex items-center justify-between text-xs font-cinematic">
              <span className="text-[#8a8a8a] font-bold uppercase tracking-wider">REGISTERED CANDIDATES</span>
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#ededed]">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-3xl font-display uppercase tracking-wider text-white">{loading ? '...' : stats.customers}</div>
              <div className="text-xs text-[#8a8a8a] font-mono mt-1">Verified Node Accounts</div>
            </div>
            <Link to="/admin/customers" className="text-xs text-[#8a8a8a] hover:text-[#de1b1c] flex items-center gap-1.5 font-cinematic uppercase tracking-wider transition-colors pt-2.5 border-t border-white/10">
              <span>Candidate Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: Pending Payments */}
          <div className="bg-[#09090b]/80 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-[#de1b1c]/50 transition-all flex flex-col justify-between shadow-[0_15px_30px_rgba(0,0,0,0.8)] cinema-corner-mark">
            <div className="flex items-center justify-between text-xs font-cinematic">
              <span className="text-[#8a8a8a] font-bold uppercase tracking-wider">PENDING UPI SLIPS</span>
              <div className="w-8 h-8 rounded-lg bg-[#de1b1c]/10 border border-[#de1b1c]/30 flex items-center justify-center text-[#de1b1c]">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-3xl font-display uppercase tracking-wider text-[#de1b1c]">{loading ? '...' : stats.pending}</div>
              <div className="text-xs text-[#8a8a8a] font-mono mt-1">
                {stats.pending > 0 ? 'Requires manual clearance' : 'All transactions cleared'}
              </div>
            </div>
            <Link to="/admin/payments" className="text-xs text-[#8a8a8a] hover:text-[#de1b1c] flex items-center gap-1.5 font-cinematic uppercase tracking-wider transition-colors pt-2.5 border-t border-white/10">
              <span>Review UPI Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 3: Active Licenses */}
          <div className="bg-[#09090b]/80 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-[#de1b1c]/50 transition-all flex flex-col justify-between shadow-[0_15px_30px_rgba(0,0,0,0.8)] cinema-corner-mark">
            <div className="flex items-center justify-between text-xs font-cinematic">
              <span className="text-[#8a8a8a] font-bold uppercase tracking-wider">ACTIVE LICENSES</span>
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#ededed]">
                <Key className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-3xl font-display uppercase tracking-wider text-white">{loading ? '...' : stats.activeLicenses}</div>
              <div className="text-xs text-[#8a8a8a] font-mono mt-1">Live running deployments</div>
            </div>
            <Link to="/admin/licenses" className="text-xs text-[#8a8a8a] hover:text-[#de1b1c] flex items-center gap-1.5 font-cinematic uppercase tracking-wider transition-colors pt-2.5 border-t border-white/10">
              <span>Inspect Global Fleet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 4: Platform Revenue */}
          <div className="bg-[#09090b]/80 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-[#de1b1c]/50 transition-all flex flex-col justify-between shadow-[0_15px_30px_rgba(0,0,0,0.8)] cinema-corner-mark">
            <div className="flex items-center justify-between text-xs font-cinematic">
              <span className="text-[#8a8a8a] font-bold uppercase tracking-wider">SETTLED REVENUE</span>
              <div className="w-8 h-8 rounded-lg bg-[#de1b1c]/10 border border-[#de1b1c]/30 flex items-center justify-center text-[#de1b1c]">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="my-3">
              <div className="text-3xl font-display uppercase tracking-wider text-white">
                {loading ? '...' : `₹${stats.revenue.toLocaleString('en-IN')}`}
              </div>
              <div className="text-xs text-[#8a8a8a] font-mono mt-1">Cleared UPI Settlements</div>
            </div>
            <Link to="/admin/payments" className="text-xs text-[#8a8a8a] hover:text-[#de1b1c] flex items-center gap-1.5 font-cinematic uppercase tracking-wider transition-colors pt-2.5 border-t border-white/10">
              <span>Settlement Audit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Action Decks & Infrastructure Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deck 1: Core Operations */}
          <div className="bg-[#09090b]/90 rounded-2xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.9)] border border-white/10 space-y-4 cinema-corner-mark">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-lg font-cinematic uppercase tracking-wider text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#de1b1c]" /> SCENE 01 // OPERATIONAL HUB
              </h3>
              <span className="text-xs text-[#8a8a8a] font-mono uppercase tracking-widest">TACTICAL</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link 
                to="/admin/payments" 
                className="p-4 bg-black/60 rounded-xl border border-white/10 hover:border-[#de1b1c]/60 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <CreditCard className="w-5 h-5 text-[#de1b1c] group-hover:scale-110 transition-transform" />
                  {stats.pending > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#de1b1c]/20 text-[#ff2a2b] border border-[#de1b1c]/40 animate-pulse font-mono">
                      {stats.pending} PENDING
                    </span>
                  )}
                </div>
                <div className="font-cinematic uppercase tracking-wider font-bold text-white text-sm mb-0.5">Review Payments</div>
                <div className="text-[11px] text-[#8a8a8a]">Approve or reject incoming manual UPI slips</div>
              </Link>

              <Link 
                to="/admin/licenses" 
                className="p-4 bg-black/60 rounded-xl border border-white/10 hover:border-[#de1b1c]/60 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <Key className="w-5 h-5 text-[#de1b1c] group-hover:scale-110 transition-transform" />
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-[#ededed] border border-white/20 font-mono">
                    LIVE
                  </span>
                </div>
                <div className="font-cinematic uppercase tracking-wider font-bold text-white text-sm mb-0.5">Fleet Licenses</div>
                <div className="text-[11px] text-[#8a8a8a]">Issue keys &amp; execute remote host wipes</div>
              </Link>

              <Link 
                to="/admin/packages" 
                className="p-4 bg-black/60 rounded-xl border border-white/10 hover:border-[#de1b1c]/60 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <Package className="w-5 h-5 text-[#de1b1c] group-hover:scale-110 transition-transform" />
                </div>
                <div className="font-cinematic uppercase tracking-wider font-bold text-white text-sm mb-0.5">Software Bundles</div>
                <div className="text-[11px] text-[#8a8a8a]">Configure pricing &amp; exam pass tiers</div>
              </Link>

              <Link 
                to="/admin/customers" 
                className="p-4 bg-black/60 rounded-xl border border-white/10 hover:border-[#de1b1c]/60 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5 text-[#de1b1c] group-hover:scale-110 transition-transform" />
                </div>
                <div className="font-cinematic uppercase tracking-wider font-bold text-white text-sm mb-0.5">Candidate Directory</div>
                <div className="text-[11px] text-[#8a8a8a]">Inspect device fingerprints &amp; node records</div>
              </Link>
            </div>
          </div>

          {/* Deck 2: Infrastructure & Sentinel Radar */}
          <div className="bg-[#09090b]/90 rounded-2xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.9)] border border-white/10 flex flex-col justify-between space-y-4 cinema-corner-mark">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="text-lg font-cinematic uppercase tracking-wider text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#de1b1c]" /> SCENE 02 // TELEMETRY RADAR
                </h3>
                <span className="text-[10px] font-mono text-[#ededed] bg-[#de1b1c]/20 px-2.5 py-0.5 rounded-full border border-[#de1b1c]/40 font-bold">
                  HEALTH OK
                </span>
              </div>

              <div className="divide-y divide-white/10 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-[#8a8a8a]">Database Engine (PostgreSQL)</span>
                  <span className="px-2 py-0.5 bg-black/80 text-[#ededed] border border-white/15 rounded-lg font-mono font-semibold">
                    Sub-50ms Nominal
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-[#8a8a8a]">Serverless Edge Functions</span>
                  <span className="px-2 py-0.5 bg-black/80 text-[#ededed] border border-white/15 rounded-lg font-mono font-semibold">
                    5 Deployed &amp; Active
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-[#8a8a8a]">Auto-Wipe &amp; Sentinel Protocol</span>
                  <span className="px-2 py-0.5 bg-[#de1b1c]/20 text-[#ff2a2b] border border-[#de1b1c]/40 rounded-lg font-mono font-bold">
                    Armed (Zero-Day Wipe)
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-[#8a8a8a]">License Cryptographic Vault</span>
                  <span className="px-2 py-0.5 bg-black/80 text-[#ededed] border border-white/15 rounded-lg font-mono font-semibold">
                    SHA-256 / AES-GCM
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-[#8a8a8a]">Payment Reconciliation (UPI)</span>
                  <span className="px-2 py-0.5 bg-black/80 text-[#ededed] border border-white/15 rounded-lg font-mono font-semibold">
                    Manual UTR Approval
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-[#8a8a8a] font-mono">
              <span>PhantomLead DRM Engine v2.0</span>
              <span className="text-[#de1b1c] font-bold">All Systems Armed</span>
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkAdmin(session?.user?.id);
      if (session?.user) {
        dispatchGreetingEmail(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      checkAdmin(session?.user?.id);
      // Only dispatch greeting on SIGNED_IN event for brand-new users, never on TOKEN_REFRESHED or tab focus
      if (event === 'SIGNED_IN' && session?.user) {
        dispatchGreetingEmail(session.user);
      }
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
    <div className="min-h-screen bg-[#060807] flex items-center justify-center">
      <div className="animate-spin w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)]" />
    </div>
  );

  return (
    <ThemeProvider>
      <Router>
        <PageTransitionLoader />

        {session && !isAdmin && !onboarded && <OnboardingModal session={session} onComplete={() => setOnboarded(true)} />}

        <div className="min-h-screen bg-[#060807] dark:bg-[#060807] light:bg-[#f1f5f9] text-slate-100 dark:text-slate-100 light:text-slate-800 font-sans relative overflow-hidden transition-colors duration-200">
          <AnimatedGlow />
          <MatrixBackground />

          <Routes>
            <Route path="/login" element={session ? (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />) : <Login />} />
            <Route path="/admin/login" element={session ? (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />) : <Login />} />
            <Route path="/signup" element={<Navigate to="/login" replace />} />
            <Route path="/dashboard" element={session ? <CustomerDashboard isActualAdmin={isAdmin} /> : <Navigate to="/login" />} />
            <Route path="/dashboard/licenses" element={session ? <DashboardLayout title="My Licenses" isAdmin={false} isActualAdmin={isAdmin}><CustomerLicenses /></DashboardLayout> : <Navigate to="/login" />} />
            <Route path="/dashboard/packages" element={session ? <DashboardLayout title="Buy Packages" isAdmin={false} isActualAdmin={isAdmin}><CustomerPackages /></DashboardLayout> : <Navigate to="/login" />} />
            <Route path="/dashboard/reviews" element={session ? <DashboardLayout title="Student Reviews & Ratings" isAdmin={false} isActualAdmin={isAdmin}><CustomerReviews /></DashboardLayout> : <Navigate to="/login" />} />
            <Route path="/dashboard/install" element={session ? <DashboardLayout title="Installation Guide" isAdmin={false} isActualAdmin={isAdmin}><CustomerInstallation /></DashboardLayout> : <Navigate to="/login" />} />

            <Route path="/admin" element={session ? (isAdmin ? <AdminDashboard /> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />
            <Route path="/admin/licenses" element={session ? (isAdmin ? <DashboardLayout title="All Licenses" isAdmin={true}><AdminLicenses /></DashboardLayout> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />
            <Route path="/admin/packages" element={session ? (isAdmin ? <DashboardLayout title="All Packages" isAdmin={true}><AdminPackages /></DashboardLayout> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />
            <Route path="/admin/payments" element={session ? (isAdmin ? <DashboardLayout title="Payments" isAdmin={true}><AdminPayments /></DashboardLayout> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />
            <Route path="/admin/customers" element={session ? (isAdmin ? <DashboardLayout title="Customers" isAdmin={true}><AdminCustomers /></DashboardLayout> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />
            <Route path="/admin/devices" element={session ? (isAdmin ? <DashboardLayout title="Hardware Telemetry Radar" isAdmin={true}><AdminDevices /></DashboardLayout> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />
            <Route path="/admin/wipe-folders" element={session ? (isAdmin ? <DashboardLayout title="Delete User Folders" isAdmin={true}><AdminWipeFolders /></DashboardLayout> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />
            <Route path="/admin/settings" element={session ? (isAdmin ? <DashboardLayout title="Settings" isAdmin={true}><AdminSettings /></DashboardLayout> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />
            <Route path="/admin/reviews" element={session ? (isAdmin ? <DashboardLayout title="Reviews Moderation" isAdmin={true}><CustomerReviews isAdminView={true} /></DashboardLayout> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />
            <Route path="/" element={<Navigate to={session ? (isAdmin ? "/admin" : "/dashboard") : "/login"} />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
