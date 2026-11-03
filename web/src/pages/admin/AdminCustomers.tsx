import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { 
  Users, 
  Trash2, 
  Ban, 
  CheckCircle, 
  Search, 
  Phone, 
  School, 
  GraduationCap, 
  Mail,
  ShieldAlert,
  UserCheck,
  Building2
} from 'lucide-react';

type Customer = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  college_name: string | null;
  academic_year: string | null;
  status: string;
  created_at: string;
};

export const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED'>('ALL');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const { data, error: queryError } = await supabase
      .from('customers')
      .select('id, full_name, email, phone, college_name, academic_year, status, created_at')
      .order('created_at', { ascending: false });

    if (queryError) setError(queryError.message);
    else setCustomers((data || []) as Customer[]);
    setLoading(false);
  };

  const handleToggleBlock = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
    const msg = newStatus === 'BLOCKED' 
      ? 'Are you sure you want to block this user? They will not be able to log in or use their licenses.'
      : 'Are you sure you want to unblock this user?';
      
    if (!window.confirm(msg)) return;

    const { error } = await supabase.from('customers').update({ status: newStatus }).eq('id', id);
    if (error) {
      alert("Error updating user: " + error.message);
    } else {
      fetchCustomers();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('WARNING: Are you absolutely sure you want to DELETE this customer? This will immediately wipe their database records.')) return;
    
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) {
      alert("Could not delete user. They might have active payments or licenses preventing deletion. (To force delete, those must be revoked/deleted first). Error: " + error.message);
    } else {
      fetchCustomers();
    }
  };

  // KPIs
  const totalCount = customers.length;
  const activeCount = useMemo(() => customers.filter(c => (c.status || 'ACTIVE') === 'ACTIVE').length, [customers]);
  const blockedCount = useMemo(() => customers.filter(c => c.status === 'BLOCKED').length, [customers]);
  const collegesCount = useMemo(() => new Set(customers.map(c => c.college_name).filter(Boolean)).size, [customers]);

  // Filtered
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const q = searchQuery.toLowerCase();
      const matchSearch = 
        (c.full_name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.college_name || '').toLowerCase().includes(q) ||
        (c.academic_year || '').toLowerCase().includes(q);

      const matchStatus = 
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && (c.status || 'ACTIVE') === 'ACTIVE') ||
        (statusFilter === 'BLOCKED' && c.status === 'BLOCKED');

      return matchSearch && matchStatus;
    });
  }, [customers, searchQuery, statusFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-400 space-y-3">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-xs tracking-wider uppercase text-purple-400">Loading student directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Modern Cyber Glass Header Deck */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0e0720]/80 via-[#0a0c18]/90 to-[#04060d] backdrop-blur-2xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-purple-500/15 via-pink-500/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-cyan-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-purple-300 font-bold bg-purple-950/60 border border-purple-500/30 px-3 py-0.5 rounded-full">
                COMMAND IDENTITY SUITE
              </span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Users className="w-8 h-8 text-pink-400" />
              Student Fleet &amp; <span className="text-gradient-rainbow">User Directory</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
              Real-time monitoring of campus enrollments, device bindings, verified phone numbers, and account integrity.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-mono text-slate-300 border border-white/10 bg-black/60 px-4 py-2 rounded-2xl shadow-inner">
              Enrolled: <strong className="text-emerald-400 text-sm ml-1 font-bold">{totalCount}</strong>
            </span>
          </div>
        </div>

        {/* Cyber Neon KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 shadow-lg hover:border-purple-500/40 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider">Total Fleet</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{totalCount}</div>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/30 shadow-lg shadow-emerald-500/5 hover:border-emerald-400 transition-all">
            <div className="flex items-center justify-between text-emerald-400/80 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider">Active</span>
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">{activeCount}</div>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-rose-500/30 shadow-lg shadow-rose-500/5 hover:border-rose-400 transition-all">
            <div className="flex items-center justify-between text-rose-400/80 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider">Suspended</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400 font-mono">{blockedCount}</div>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/30 shadow-lg shadow-cyan-500/5 hover:border-cyan-400 transition-all">
            <div className="flex items-center justify-between text-cyan-400/80 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider">Campuses</span>
              <Building2 className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-cyan-300 font-mono">{collegesCount}</div>
          </div>
        </div>
      </div>

      {/* Modern Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student name, email, phone, college..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-black/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60 shadow-lg transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/60 border border-white/10 shrink-0">
          {(['ALL', 'ACTIVE', 'BLOCKED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                statusFilter === tab
                  ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white shadow-md shadow-purple-500/30 scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab === 'ALL' ? 'All' : tab === 'ACTIVE' ? 'Active' : 'Blocked'}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      {error ? (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs font-mono">
          Could not load customers: {error}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-black/40 p-12 text-center space-y-3">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-slate-400 text-sm font-medium">No students found matching your search query.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-black/60 backdrop-blur-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-slate-900/40 text-slate-400 font-mono uppercase tracking-wider text-[11px]">
                  <th className="py-4 px-5 font-bold">Student Profile</th>
                  <th className="py-4 px-5 font-bold">Contact Details</th>
                  <th className="py-4 px-5 font-bold">Institution / Batch</th>
                  <th className="py-4 px-5 font-bold">Status</th>
                  <th className="py-4 px-5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredCustomers.map(customer => {
                  const isBlocked = customer.status === 'BLOCKED';
                  const initials = (customer.full_name || customer.email || 'U')
                    .split(' ')
                    .map(n => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr key={customer.id} className="hover:bg-purple-950/20 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black font-mono text-xs shrink-0 shadow-md ${
                            isBlocked 
                              ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400' 
                              : 'bg-gradient-to-tr from-purple-500/20 to-pink-500/20 border border-purple-500/40 text-purple-300'
                          }`}>
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-white block text-sm">
                              {customer.full_name || 'Anonymous Student'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              UID: {customer.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-5 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Mail className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span className="font-mono text-xs">{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-1.5 text-emerald-400">
                            <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="font-mono text-[11px] font-bold">+91 {customer.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* College & Academic Year */}
                      <td className="py-4 px-5">
                        {customer.college_name ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                              <School className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span>{customer.college_name}</span>
                            </div>
                            {customer.academic_year && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                                <GraduationCap className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span>{customer.academic_year}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600 font-mono text-[11px]">Direct Online User</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold ${
                          isBlocked 
                            ? 'bg-rose-500/15 border border-rose-500/40 text-rose-300' 
                            : 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isBlocked ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'}`} />
                          {isBlocked ? 'SUSPENDED' : 'AUTHORIZED'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button 
                            onClick={() => handleToggleBlock(customer.id, customer.status)} 
                            className={`p-2.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                              isBlocked 
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25' 
                                : 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                            }`}
                            title={isBlocked ? 'Unblock user' : 'Block user'}
                          >
                            {isBlocked ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </button>

                          <button 
                            onClick={() => handleDelete(customer.id)} 
                            className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500/25 transition-all cursor-pointer"
                            title="Delete user records"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
