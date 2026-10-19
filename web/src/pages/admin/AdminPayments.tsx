import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Copy, 
  Check, 
  Mail
} from 'lucide-react';

export const AdminPayments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [copiedTxnId, setCopiedTxnId] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from('payments')
      .select('*, customers(full_name, email), packages(package_name, package_code)')
      .order('submitted_at', { ascending: false });
    
    if (error) console.error(error);
    else setPayments(data || []);
    setLoading(false);
  };

  const handleApproval = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const actionStr = status === 'APPROVED' ? 'APPROVE' : 'REJECT';
    
    if (status === 'REJECTED' && !window.confirm('Are you sure you want to REJECT this payment?')) {
      return;
    }

    setProcessingId(id);
    const { error } = await supabase.functions.invoke('admin-approve-payment', {
      body: { payment_id: id, action: actionStr }
    });
    
    setProcessingId(null);
    if (error) {
      alert(error.message || `Failed to ${actionStr.toLowerCase()} payment`);
    } else {
      fetchPayments();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTxnId(id);
    setTimeout(() => setCopiedTxnId(null), 2000);
  };

  // KPIs
  const totalCount = payments.length;
  const pendingCount = useMemo(() => payments.filter(p => p.status === 'PENDING').length, [payments]);
  const approvedCount = useMemo(() => payments.filter(p => p.status === 'APPROVED').length, [payments]);
  const rejectedCount = useMemo(() => payments.filter(p => p.status === 'REJECTED').length, [payments]);

  const approvedRevenue = useMemo(() => {
    return payments
      .filter(p => p.status === 'APPROVED')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [payments]);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const q = searchQuery.toLowerCase();
      const matchSearch = 
        (p.customers?.full_name || '').toLowerCase().includes(q) ||
        (p.customers?.email || '').toLowerCase().includes(q) ||
        (p.packages?.package_name || '').toLowerCase().includes(q) ||
        (p.upi_transaction_id || '').toLowerCase().includes(q);

      const matchStatus = 
        statusFilter === 'ALL' || p.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [payments, searchQuery, statusFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-400 space-y-3">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-xs tracking-wider uppercase">Loading payment records...</p>
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
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-green-400 font-semibold">
                TREASURY &amp; CLEARANCE DESK
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <CreditCard className="w-7 h-7 text-green-400" />
              Payment Verification &amp; Approvals
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Audit incoming UPI references, clear student transactions, and trigger automated license issuance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400 border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 rounded-xl">
              Total Audited: <strong className="text-white mr-2">{totalCount}</strong>
              Pending: <strong className="text-amber-400 font-bold">{pendingCount}</strong>
            </span>
          </div>
        </div>

        {/* Financial KPI Mini-Deck */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-zinc-800/80">
          <div className="p-3.5 rounded-xl bg-black/60 border border-amber-500/30">
            <span className="text-[10px] font-mono uppercase text-amber-400/90 block mb-1">Pending Approval</span>
            <div className="text-2xl font-black text-amber-400 font-mono flex items-center gap-1.5">
              <span>{pendingCount}</span>
              {pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-black/60 border border-green-500/20">
            <span className="text-[10px] font-mono uppercase text-green-400/80 block mb-1">Cleared Revenue</span>
            <div className="text-2xl font-black text-green-400 font-mono">₹{approvedRevenue.toLocaleString('en-IN')}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-black/60 border border-zinc-800/80">
            <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">Approved Orders</span>
            <div className="text-2xl font-black text-white font-mono">{approvedCount}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-black/60 border border-red-500/20">
            <span className="text-[10px] font-mono uppercase text-red-400/80 block mb-1">Rejected / Flagged</span>
            <div className="text-2xl font-black text-red-400 font-mono">{rejectedCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student, email, package, or UPI UTR reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0c0d12] border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-green-500/60 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0c0d12] border border-zinc-800 shrink-0">
          {(['PENDING', 'ALL', 'APPROVED', 'REJECTED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab
                  ? 'bg-green-500 text-black shadow-md shadow-green-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>{tab === 'PENDING' ? 'Pending' : tab === 'ALL' ? 'All' : tab === 'APPROVED' ? 'Approved' : 'Rejected'}</span>
              {tab === 'PENDING' && pendingCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  statusFilter === 'PENDING' ? 'bg-black text-green-400' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      {filteredPayments.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-[#0c0d12]/60 p-12 text-center space-y-3">
          <CreditCard className="w-10 h-10 text-zinc-600 mx-auto" />
          <p className="text-zinc-400 text-sm font-medium">No payments found in this view.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-[#0c0d12]/90 backdrop-blur-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-black/40 text-zinc-400 font-mono uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 font-semibold">Student Account</th>
                  <th className="py-3.5 px-4 font-semibold">Tier &amp; Duration</th>
                  <th className="py-3.5 px-4 font-semibold">Settlement Amount</th>
                  <th className="py-3.5 px-4 font-semibold">UPI UTR Reference</th>
                  <th className="py-3.5 px-4 font-semibold">Audit Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredPayments.map(p => {
                  const isPending = p.status === 'PENDING';
                  const isApproved = p.status === 'APPROVED';
                  const isProcessing = processingId === p.id;
                  const durationLabel = p.duration_months === null ? 'Lifetime Access' : `${p.duration_months} Month(s)`;

                  return (
                    <tr key={p.id} className="hover:bg-zinc-900/40 transition-colors">
                      {/* Customer */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-white block text-sm">
                            {p.customers?.full_name || 'Enrolled Student'}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-zinc-500" />
                            {p.customers?.email || 'No email registered'}
                          </span>
                        </div>
                      </td>

                      {/* Package */}
                      <td className="py-4 px-4 space-y-1">
                        <span className="font-bold text-zinc-200 block text-xs">
                          {p.packages?.package_name || 'Security Package'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-green-400">
                          <Clock className="w-3 h-3" />
                          {durationLabel}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-4">
                        <span className="text-base font-black text-white font-mono block">
                          ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {p.submitted_at ? new Date(p.submitted_at).toLocaleDateString() : 'Recent'}
                        </span>
                      </td>

                      {/* UPI Txn ID */}
                      <td className="py-4 px-4">
                        <div className="inline-flex items-center gap-2 p-1.5 rounded-lg bg-black/60 border border-zinc-800">
                          <span className="font-mono text-xs font-bold text-amber-300 tracking-wider">
                            {p.upi_transaction_id || 'N/A'}
                          </span>
                          {p.upi_transaction_id && (
                            <button
                              onClick={() => copyToClipboard(p.upi_transaction_id, p.id)}
                              className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
                              title="Copy UTR ID"
                            >
                              {copiedTxnId === p.id ? (
                                <Check className="w-3.5 h-3.5 text-green-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold ${
                          isPending 
                            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' 
                            : isApproved
                              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                              : 'bg-red-500/10 border border-red-500/30 text-red-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isPending ? 'bg-amber-400 animate-pulse' : isApproved ? 'bg-green-400' : 'bg-red-400'
                          }`} />
                          {p.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        {isPending ? (
                          <div className="inline-flex items-center gap-2">
                            <button 
                              onClick={() => handleApproval(p.id, 'APPROVED')} 
                              disabled={isProcessing}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-md shadow-green-500/20 active:scale-95 cursor-pointer"
                            >
                              {isProcessing ? (
                                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5" />
                              )}
                              <span>Approve</span>
                            </button>

                            <button 
                              onClick={() => handleApproval(p.id, 'REJECTED')} 
                              disabled={isProcessing}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 disabled:opacity-50 text-red-400 text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-600 font-mono text-[11px]">
                            {isApproved ? 'License Granted' : 'Transaction Closed'}
                          </span>
                        )}
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
