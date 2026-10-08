import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './services/supabase';
import { Shield, Key, Package, LogOut, LayoutDashboard, User } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) alert(error.message);
    else navigate('/dashboard');
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
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    
    if (error) {
      alert(error.message);
    } else {
      alert('Account created successfully! You can now log in.');
      navigate('/login');
    }
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
          <Link to={isAdmin ? "/admin" : "/dashboard"} className="flex items-center px-4 py-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg"><LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard</Link>
          <Link to={isAdmin ? "/admin/licenses" : "/dashboard/licenses"} className="flex items-center px-4 py-2.5 text-gray-400 hover:bg-gray-800 rounded-lg transition-colors"><Key className="w-5 h-5 mr-3" /> Licenses</Link>
          <Link to={isAdmin ? "/admin/packages" : "/dashboard/packages"} className="flex items-center px-4 py-2.5 text-gray-400 hover:bg-gray-800 rounded-lg transition-colors"><Package className="w-5 h-5 mr-3" /> Packages</Link>
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

const PlaceholderPage = ({ title, desc, isAdmin }: { title: string, desc: string, isAdmin?: boolean }) => (
  <DashboardLayout title={title} isAdmin={isAdmin}>
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-gray-400">{desc}</p>
      <p className="mt-8 text-sm text-gray-500 border border-dashed border-gray-700 p-4 rounded-lg inline-block">
        (This database view will be fully connected in the next phase of UI design!)
      </p>
    </div>
  </DashboardLayout>
);

const CustomerDashboard = () => (
  <DashboardLayout title="Customer Dashboard" isAdmin={false}>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-gray-400 text-sm font-medium mb-2">Active Licenses</h3>
        <p className="text-3xl font-bold">1</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-gray-400 text-sm font-medium mb-2">Registered Devices</h3>
        <p className="text-3xl font-bold">1 / 1</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-gray-400 text-sm font-medium mb-2">Available Packages</h3>
        <p className="text-3xl font-bold text-indigo-400">View All →</p>
      </div>
    </div>
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">Your License Key</h2>
      <div className="flex gap-4">
        <input type="text" readOnly value="TEST-1234" className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 font-mono text-indigo-300" />
        <button className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium">Download Installer</button>
      </div>
    </div>
  </DashboardLayout>
);

const AdminDashboard = () => (
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
  </DashboardLayout>
);

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
          <Route path="/login" element={session ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/signup" element={session ? <Navigate to="/dashboard" /> : <SignUp />} />
          <Route path="/dashboard" element={session ? (isAdmin ? <Navigate to="/admin" /> : <CustomerDashboard />) : <Navigate to="/login" />} />
          <Route path="/dashboard/licenses" element={session ? <PlaceholderPage title="My Licenses" desc="View and manage your purchased licenses." isAdmin={false} /> : <Navigate to="/login" />} />
          <Route path="/dashboard/packages" element={session ? <PlaceholderPage title="Software Packages" desc="Browse and purchase new software packages." isAdmin={false} /> : <Navigate to="/login" />} />

          <Route path="/admin" element={session ? (isAdmin ? <AdminDashboard /> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />
          <Route path="/admin/licenses" element={session ? (isAdmin ? <PlaceholderPage title="Global License Management" desc="Manage all customer licenses and revoke keys." isAdmin={true} /> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />
          <Route path="/admin/packages" element={session ? (isAdmin ? <PlaceholderPage title="Package Management" desc="Create and upload new software packages and extensions." isAdmin={true} /> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />
          <Route path="/" element={<Navigate to={session ? "/dashboard" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
