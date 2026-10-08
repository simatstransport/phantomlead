import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './services/supabase';
import { Shield, Key, Package, LogOut, LayoutDashboard, User, CreditCard, Users, Download, Settings } from 'lucide-react';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminPackages } from './pages/admin/AdminPackages';
import { AdminLicenses } from './pages/admin/AdminLicenses';
import { AdminCustomers } from './pages/admin/AdminCustomers';
import { AdminSettings } from './pages/admin/AdminSettings';
import { CustomerPackages } from './pages/CustomerPackages';
import { CustomerLicenses } from './pages/CustomerLicenses';

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
    <div className="flex items-center justify-center min-h-screen bg-gray-950 px-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-8">
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-500/10 p-3 rounded-full border border-indigo-500/20">
            <Shield className="w-8 h-8 text-indigo-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-white mb-2">Secure License Platform</h2>
        <p className="text-gray-400 text-center mb-8 text-sm">Sign in to manage your software access</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
            <input 
              type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input 
              type="password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" disabled={loading}
            className="w-full mt-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>
        {notice && <p role={notice.kind === 'error' ? 'alert' : 'status'} className={`mt-4 text-sm ${notice.kind === 'error' ? 'text-red-400' : 'text-green-400'}`}>{notice.message}</p>}
        {showResend && (
          <button type="button" onClick={handleResendConfirmation} disabled={resending} className="mt-3 text-sm text-indigo-300 hover:text-indigo-200 underline underline-offset-2 disabled:opacity-50">
            {resending ? 'Sending...' : 'Resend confirmation email'}
          </button>
        )}
        <div className="mt-6 text-center text-sm text-gray-400">
          Don't have an account? <Link to="/signup" className="text-indigo-400 hover:text-indigo-300">Sign up here</Link>
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
    <div className="flex items-center justify-center min-h-screen bg-gray-950 px-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-8">
        <div className="flex justify-center mb-6">
          <div className="bg-green-500/10 p-3 rounded-full border border-green-500/20">
            <User className="w-8 h-8 text-green-400" />
          </div>
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

const DashboardLayout = ({ children, title, isAdmin }: { children: React.ReactNode, title: string, isAdmin?: boolean }) => {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <Shield className="w-6 h-6 text-indigo-400 mr-2" />
          <span className="font-bold text-lg">SecurePlatform</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {isAdmin ? (
            <>
              <Link to="/admin" className="flex items-center px-4 py-2.5 text-gray-400 hover:bg-gray-800 rounded-lg transition-colors"><LayoutDashboard className="w-5 h-5 mr-3" /> Admin Overview</Link>
              <Link to="/admin/licenses" className="flex items-center px-4 py-2.5 text-gray-400 hover:bg-gray-800 rounded-lg transition-colors"><Key className="w-5 h-5 mr-3" /> All Licenses</Link>
              <Link to="/admin/packages" className="flex items-center px-4 py-2.5 text-gray-400 hover:bg-gray-800 rounded-lg transition-colors"><Package className="w-5 h-5 mr-3" /> All Packages</Link>
              <Link to="/admin/payments" className="flex items-center px-4 py-2.5 text-gray-400 hover:bg-gray-800 rounded-lg transition-colors"><CreditCard className="w-5 h-5 mr-3" /> Payments</Link>
              <Link to="/admin/customers" className="flex items-center px-4 py-2.5 text-gray-400 hover:bg-gray-800 rounded-lg transition-colors"><Users className="w-5 h-5 mr-3" /> Customers</Link>
              <Link to="/admin/settings" className="flex items-center px-4 py-2.5 text-gray-400 hover:bg-gray-800 rounded-lg transition-colors"><Settings className="w-5 h-5 mr-3" /> Settings</Link>
              <div className="pt-4 mt-4 border-t border-gray-800">
                <Link to="/dashboard" className="flex items-center px-4 py-2.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"><User className="w-5 h-5 mr-3" /> View as Customer</Link>
              </div>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="flex items-center px-4 py-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg"><LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard</Link>
              <Link to="/dashboard/licenses" className="flex items-center px-4 py-2.5 text-gray-400 hover:bg-gray-800 rounded-lg transition-colors"><Key className="w-5 h-5 mr-3" /> My Licenses</Link>
              <Link to="/dashboard/packages" className="flex items-center px-4 py-2.5 text-gray-400 hover:bg-gray-800 rounded-lg transition-colors"><Package className="w-5 h-5 mr-3" /> Buy Packages</Link>
            </>
          )}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={() => supabase.auth.signOut()} className="flex items-center px-4 py-2 text-gray-400 hover:text-white w-full"><LogOut className="w-5 h-5 mr-3" /> Sign Out</button>
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-gray-800 flex items-center px-8 bg-gray-900/50">
          <h1 className="text-xl font-semibold">{title}</h1>
          <div className="ml-auto flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700"><User className="w-4 h-4 text-gray-400" /></div>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
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

        const { count, error } = await supabase
          .from('licenses')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', customer.id)
          .eq('status', 'ACTIVE');

        if (isCurrent) {
          setActiveLicenseCount(error ? 0 : count ?? 0);
          setHasActiveLicense(!error && (count ?? 0) > 0);
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

const GeminiApiKeyGuide = () => (
  <section className="mt-8 border-t border-gray-800 pt-8" aria-labelledby="gemini-key-guide">
    <h2 id="gemini-key-guide" className="text-xl font-bold mb-2">Generate your Gemini API key</h2>
    <p className="text-sm text-gray-400 mb-5">You will need this key when setting up the installer.</p>
    <ol className="list-decimal space-y-3 pl-5 text-sm text-gray-300">
      <li>Open <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-300 underline underline-offset-2">Google AI Studio API keys</a> and sign in to your Google account.</li>
      <li>Select a Google Cloud project, or create one if Google AI Studio asks you to.</li>
      <li>Select <strong>Create API key</strong> and choose the project for the key.</li>
      <li>Copy the generated key and keep it private. Do not share it or post it publicly.</li>
      <li>Run SecureInstaller and paste the key into the <strong>Gemini API Key</strong> field when prompted.</li>
    </ol>
    <h3 className="text-lg font-semibold mt-8 mb-2">After installation</h3>
    <ol className="list-decimal space-y-3 pl-5 text-sm text-gray-300">
      <li>Open <strong>Task Manager</strong>, search for <strong>Safe Exam Browser</strong>, and end all running SEB tasks. Then launch SecureInstaller.</li>
      <li>Launch Safe Exam Browser after SecureInstaller finishes installing.</li>
      <li>For Java coding, press <kbd className="rounded border border-gray-700 bg-gray-900 px-1.5 py-0.5 font-mono text-white">Ctrl</kbd> + <kbd className="rounded border border-gray-700 bg-gray-900 px-1.5 py-0.5 font-mono text-white">K</kbd>.</li>
      <li>For the viva quiz, press <kbd className="rounded border border-gray-700 bg-gray-900 px-1.5 py-0.5 font-mono text-white">Ctrl</kbd> + <kbd className="rounded border border-gray-700 bg-gray-900 px-1.5 py-0.5 font-mono text-white">L</kbd>.</li>
      <li>For QA, reasoning, or Java MCQ quizzes, press <kbd className="rounded border border-gray-700 bg-gray-900 px-1.5 py-0.5 font-mono text-white">Ctrl</kbd> + <kbd className="rounded border border-gray-700 bg-gray-900 px-1.5 py-0.5 font-mono text-white">J</kbd>.</li>
    </ol>
  </section>
);

const CustomerDashboard = () => {
  const { hasActiveLicense, activeLicenseCount, checkingLicense } = useHasActiveLicense(false);

  return (
    <DashboardLayout title="Customer Dashboard" isAdmin={false}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-gray-400 text-sm font-medium mb-2">Active Licenses</h3>
          <p className="text-3xl font-bold">{checkingLicense ? '...' : activeLicenseCount}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-gray-400 text-sm font-medium mb-2">Available Packages</h3>
          <Link to="/dashboard/packages" className="text-3xl font-bold text-indigo-400 hover:text-indigo-300">Browse packages</Link>
        </div>
      </div>
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-2">My Licenses</h2>
        <p className="text-sm text-gray-400 mb-5">
          {checkingLicense ? 'Checking your license status...' : hasActiveLicense ? 'View your active package and license status.' : 'No active licenses yet. Your license will appear here after it is issued.'}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/dashboard/licenses" className="inline-flex px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium">View my licenses</Link>
          {!checkingLicense && hasActiveLicense && (
            <a href="https://wgxxitydatuoyjnxuvqw.supabase.co/storage/v1/object/public/installers/SecureInstaller_v1.0.exe" download className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg font-medium">
              <Download className="w-4 h-4" /> Download SecureInstaller.exe
            </a>
          )}
        </div>
      </section>
      {!checkingLicense && hasActiveLicense && <GeminiApiKeyGuide />}
    </DashboardLayout>
  );
};

const AdminDashboard = () => {
  const { hasActiveLicense, checkingLicense } = useHasActiveLicense(true);

  return (
    <DashboardLayout title="Admin Control Panel" isAdmin={true}>
      <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg p-4 mb-6">
        ✓ You are logged in as a Global Administrator.
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">Recent Installations</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400">
              <th className="pb-3 font-medium">Customer</th>
              <th className="pb-3 font-medium">Package</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr className="border-b border-gray-800/50">
              <td className="py-4 font-medium">Test User</td>
              <td className="py-4"><span className="px-2 py-1 bg-gray-800 rounded text-xs">FULL_ACCESS</span></td>
              <td className="py-4"><span className="text-green-400 flex items-center">● Active</span></td>
              <td className="py-4 text-gray-400">Just now</td>
            </tr>
          </tbody>
        </table>
      </div>
      {!checkingLicense && hasActiveLicense && <GeminiApiKeyGuide />}
    </DashboardLayout>
  );
};

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

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

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>;

  return (
    <Router>
      <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
        <Routes>
          <Route path="/login" element={session ? (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />) : <Login />} />
          <Route path="/signup" element={session ? (isAdmin ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />) : <SignUp />} />
          <Route path="/dashboard" element={session ? <CustomerDashboard /> : <Navigate to="/login" />} />
          <Route path="/dashboard/licenses" element={session ? <DashboardLayout title="My Licenses" isAdmin={false}><CustomerLicenses /></DashboardLayout> : <Navigate to="/login" />} />
          <Route path="/dashboard/packages" element={session ? <CustomerPackages /> : <Navigate to="/login" />} />

          <Route path="/admin" element={session ? (isAdmin ? <AdminDashboard /> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />
          <Route path="/admin/licenses" element={session ? (isAdmin ? <AdminLicenses /> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />
          <Route path="/admin/packages" element={session ? (isAdmin ? <AdminPackages /> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />
          <Route path="/admin/payments" element={session ? (isAdmin ? <AdminPayments /> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />
          <Route path="/admin/customers" element={session ? (isAdmin ? <DashboardLayout title="Customers" isAdmin={true}><AdminCustomers /></DashboardLayout> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />
          <Route path="/admin/settings" element={session ? (isAdmin ? <DashboardLayout title="Settings" isAdmin={true}><AdminSettings /></DashboardLayout> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />
          <Route path="/" element={<Navigate to={session ? (isAdmin ? "/admin" : "/dashboard") : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
