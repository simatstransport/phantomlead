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
  Mail
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
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-xs tracking-wider uppercase">Loading customer fleet...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Deck */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#0c0d12]/90 backdrop-blur-xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                IDENTITY &amp; ENROLLMENT REGISTRY
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Users className="w-7 h-7 text-cyan-400" />
              Customer Fleet Directory
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Manage student accounts, phone verification records, institutional tags, and access clearance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400 border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 rounded-xl">
              Total Records: <strong className="text-white">{totalCount}</strong>
            </span>
          </div>
        </div>

        {/* KPI Mini-Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-zinc-800/80">
          <div className="p-3.5 rounded-xl bg-black/60 border border-zinc-800/80">
            <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">Total Enrolled</span>
            <div className="text-2xl font-black text-white font-mono">{totalCount}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-black/60 border border-cyan-500/20">
            <span className="text-[10px] font-mono uppercase text-cyan-400/80 block mb-1">Active Accounts</span>
            <div className="text-2xl font-black text-cyan-400 font-mono">{activeCount}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-black/60 border border-red-500/20">
            <span className="text-[10px] font-mono uppercase text-red-400/80 block mb-1">Blocked / Suspended</span>
            <div className="text-2xl font-black text-red-400 font-mono">{blockedCount}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-black/60 border border-zinc-800/80">
            <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">Institutions</span>
            <div className="text-2xl font-black text-white font-mono">{collegesCount}</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, email, phone, or college..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0c0d12] border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0c0d12] border border-zinc-800 shrink-0">
          {(['ALL', 'ACTIVE', 'BLOCKED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                statusFilter === tab
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab === 'ALL' ? 'All' : tab === 'ACTIVE' ? 'Active' : 'Blocked'}
            </button>
          ))}
        </div>
      </div>

      {/* Error or Table */}
      {error ? (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs font-mono">
          Could not load customers: {error}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-[#0c0d12]/60 p-12 text-center space-y-3">
          <Users className="w-10 h-10 text-zinc-600 mx-auto" />
          <p className="text-zinc-400 text-sm font-medium">No customers found matching your criteria.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-[#0c0d12]/90 backdrop-blur-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-black/40 text-zinc-400 font-mono uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 font-semibold">Student Profile</th>
                  <th className="py-3.5 px-4 font-semibold">Contact Info</th>
                  <th className="py-3.5 px-4 font-semibold">Institution / Batch</th>
                  <th className="py-3.5 px-4 font-semibold">Account State</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredCustomers.map(customer => {
                  const isBlocked = customer.status === 'BLOCKED';
                  const initials = (customer.full_name || customer.email || 'U')
                    .split(' ')
                    .map(n => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr key={customer.id} className="hover:bg-zinc-900/40 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold font-mono text-xs shrink-0 ${
                            isBlocked 
                              ? 'bg-red-500/10 border border-red-500/30 text-red-400' 
                              : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
                          }`}>
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-white block text-sm">
                              {customer.full_name || 'Anonymous Student'}
                            </span>
                            <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
                              ID: {customer.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="font-mono text-xs">{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <Phone className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                            <span className="font-mono text-[11px]">+91 {customer.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* College & Academic Year */}
                      <td className="py-4 px-4">
                        {customer.college_name ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-zinc-300 font-medium">
                              <School className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              <span>{customer.college_name}</span>
                            </div>
                            {customer.academic_year && (
                              <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                                <GraduationCap className="w-3 h-3 text-zinc-500 shrink-0" />
                                <span>{customer.academic_year}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-600 font-mono text-[11px]">Unspecified</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold ${
                          isBlocked 
                            ? 'bg-red-500/10 border border-red-500/30 text-red-400' 
                            : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isBlocked ? 'bg-red-400' : 'bg-cyan-400 animate-pulse'}`} />
                          {isBlocked ? 'BLOCKED' : 'ACTIVE'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button 
                            onClick={() => handleToggleBlock(customer.id, customer.status)} 
                            className={`p-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                              isBlocked 
                                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20' 
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                            }`}
                            title={isBlocked ? 'Unblock user' : 'Block user'}
                          >
                            {isBlocked ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                          </button>

                          <button 
                            onClick={() => handleDelete(customer.id)} 
                            className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                            title="Delete user records"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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