import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './services/supabase';

// Placeholders for Pages
const Login = () => <div className="p-8"><h1 className="text-2xl font-bold mb-4">Login</h1><p>Customer Login Page</p></div>;
const Dashboard = () => <div className="p-8"><h1 className="text-2xl font-bold mb-4">Dashboard</h1><p>Customer Dashboard</p></div>;
const AdminDashboard = () => <div className="p-8"><h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1><p>Admin Operations</p></div>;

function App() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white font-sans">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={session ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/admin" element={session ? <AdminDashboard /> : <Navigate to="/login" />} />
          <Route path="/" element={<Navigate to={session ? "/dashboard" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
