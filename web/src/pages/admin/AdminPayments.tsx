import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { processAndSendInvoice } from '../../services/billingService';
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Copy, 
  Check, 
  Mail,
  Trash2,
  Loader2,
  FileText
} from 'lucide-react';

export const AdminPayments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [copiedTxnId, setCopiedTxnId] = useState<string | null>(null);
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
      setActionAlert({ type: 'error', message: error.message || `Failed to ${actionStr.toLowerCase()} payment` });
    } else {
      setActionAlert({ 
        type: 'success', 
        message: status === 'APPROVED' ? '✅ Payment approved and license generated!' : '🚫 Payment rejected.' 
      });
      fetchPayments();

      // Automated Invoice PDF Generation and Email Dispatch upon Approval
      if (status === 'APPROVED') {
        const paymentItem = payments.find(p => p.id === id);
        if (paymentItem && paymentItem.customers?.email) {
          handleGenerateInvoice(paymentItem, false);
        }
      }

      setTimeout(() => setActionAlert(null), 5000);
    }
  };

  const handleGenerateInvoice = async (p: any, downloadOnly = false) => {
    try {
      setProcessingId(p.id);
      const res = await processAndSendInvoice({
        paymentId: p.id,
        customerId: p.customer_id,
        customerName: p.customers?.full_name || 'Customer',
        customerEmail: p.customers?.email || '',
        packageName: p.packages?.package_name || 'PhantomLead Security Package',
        packageCode: p.packages?.package_code || 'SECURITY_SUITE',
        amount: p.amount || 0,
        transactionRef: p.upi_transaction_id || 'VERIFIED',
      });

      if (downloadOnly) {
        res.pdfDoc.save(`${res.invoiceNumber}.pdf`);
        setActionAlert({
          type: 'success',
          message: `📄 Invoice ${res.invoiceNumber} downloaded successfully!`
        });
      } else {
        res.pdfDoc.save(`${res.invoiceNumber}.pdf`);
        setActionAlert({
          type: 'success',
          message: `✅ Invoice ${res.invoiceNumber} generated & sent to ${p.customers?.email}!`
        });
      }
    } catch (err: any) {
      console.error(err);
      setActionAlert({
        type: 'error',
        message: `Failed to compile invoice: ${err.message}`
      });
    } finally {
      setProcessingId(null);
      setTimeout(() => setActionAlert(null), 5000);
    }
  };

  const handleDeletePayment = async (id: string, utrId?: string, amount?: number) => {
    const label = utrId ? `UTR: "${utrId}" (₹${amount || 0})` : `Payment #${id}`;
    if (!window.confirm(`⚠️ Permanently DELETE payment entry ${label}?\n\nThis will remove this record completely. It will immediately update your Cleared Revenue and metrics to reflect the exact correct calculated total.`)) {
      return;
    }

    setProcessingId(id);
    try {
      // 1. If any licenses reference this payment_id, detach payment_id so foreign key constraint doesn't fail
      await supabase.from('licenses').update({ payment_id: null }).eq('payment_id', id);

      // 2. Delete the payment record
      const { error } = await supabase.from('payments').delete().eq('id', id);

      if (error) {
        setActionAlert({ type: 'error', message: `❌ Error deleting payment: ${error.message}` });
      } else {
        setActionAlert({ 
          type: 'success', 
          message: `🗑️ Payment record deleted successfully. Revenue recalculation complete.` 
        });
        fetchPayments();
        setTimeout(() => setActionAlert(null), 4000);
      }
    } catch (err: any) {
      setActionAlert({ type: 'error', message: `❌ Error: ${err.message}` });
    } finally {
      setProcessingId(null);
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
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 space-y-3">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-xs tracking-wider uppercase">Loading payment records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert Banner */}
      {actionAlert && (
        <div className={`p-4 rounded-2xl text-xs font-mono flex items-center justify-between border ${
          actionAlert.type === 'success' 
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' 
            : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
        }`}>
          <span>{actionAlert.message}</span>
          <button onClick={() => setActionAlert(null)} className="text-slate-400 hover:text-white">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Deck */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 dark:border-white/10 light:border-slate-200 bg-[#0d1117] dark:bg-[#0d1117] light:bg-white backdrop-blur-xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 dark:text-cyan-400 light:text-cyan-700 font-bold">
                TREASURY &amp; CLEARANCE DESK
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight flex items-center gap-3">
              <CreditCard className="w-7 h-7 text-cyan-400" />
              Payment Verification &amp; Approvals
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-400 light:text-slate-600">
              Audit incoming UPI references, clear student transactions, and trigger automated license issuance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 dark:text-slate-400 light:text-slate-600 border border-slate-800 dark:border-white/10 light:border-slate-200 bg-black/40 dark:bg-black/40 light:bg-slate-50 px-3 py-1.5 rounded-xl">
              Total Audited: <strong className="text-white dark:text-white light:text-slate-900 mr-2">{totalCount}</strong>
              Pending: <strong className="text-amber-400 font-bold">{pendingCount}</strong>
            </span>
          </div>
        </div>

        {/* Financial KPI Mini-Deck */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-800/80 dark:border-white/10 light:border-slate-200">
          <div className="p-3.5 rounded-xl bg-black/40 dark:bg-black/40 light:bg-slate-50 border border-amber-500/30">
            <span className="text-[10px] font-mono uppercase text-amber-400/90 dark:text-amber-400 light:text-amber-700 block mb-1 font-semibold">Pending Approval</span>
            <div className="text-2xl font-black text-amber-400 font-mono flex items-center gap-1.5">
              <span>{pendingCount}</span>
              {pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-black/40 dark:bg-black/40 light:bg-slate-50 border border-cyan-500/20">
            <span className="text-[10px] font-mono uppercase text-cyan-400/80 dark:text-cyan-400 light:text-cyan-700 block mb-1 font-semibold">Cleared Revenue</span>
            <div className="text-2xl font-black text-cyan-400 font-mono">₹{approvedRevenue.toLocaleString('en-IN')}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-black/40 dark:bg-black/40 light:bg-slate-50 border border-slate-800 dark:border-white/10 light:border-slate-200">
            <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1 font-semibold">Approved Orders</span>
            <div className="text-2xl font-black text-white dark:text-white light:text-slate-900 font-mono">{approvedCount}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-black/40 dark:bg-black/40 light:bg-slate-50 border border-rose-500/20">
            <span className="text-[10px] font-mono uppercase text-rose-400/80 dark:text-rose-400 light:text-rose-700 block mb-1 font-semibold">Rejected / Flagged</span>
            <div className="text-2xl font-black text-rose-400 font-mono">{rejectedCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student, email, package, or UPI UTR reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0d1117] dark:bg-[#0d1117] light:bg-white border border-slate-800/80 dark:border-white/10 light:border-slate-300 text-xs text-white dark:text-white light:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 font-mono transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0d1117] dark:bg-[#0d1117] light:bg-slate-100 border border-slate-800/80 dark:border-white/10 light:border-slate-200 shrink-0">
          {(['PENDING', 'ALL', 'APPROVED', 'REJECTED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
              }`}
            >
              <span>{tab === 'PENDING' ? 'Pending' : tab === 'ALL' ? 'All' : tab === 'APPROVED' ? 'Approved' : 'Rejected'}</span>
              {tab === 'PENDING' && pendingCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  statusFilter === 'PENDING' ? 'bg-black text-cyan-400' : 'bg-amber-500/20 text-amber-300'
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
        <div className="rounded-2xl border border-slate-800/80 dark:border-white/10 light:border-slate-200 bg-[#0d1117]/80 dark:bg-[#0d1117]/80 light:bg-white p-12 text-center space-y-3">
          <CreditCard className="w-10 h-10 text-slate-600 dark:text-slate-600 light:text-slate-400 mx-auto" />
          <p className="text-slate-400 dark:text-slate-400 light:text-slate-600 text-sm font-medium">No payments found in this view.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800/80 dark:border-white/10 light:border-slate-200 bg-[#0d1117] dark:bg-[#0d1117] light:bg-white backdrop-blur-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 dark:border-white/10 light:border-slate-200 bg-black/40 dark:bg-black/40 light:bg-slate-50 text-slate-400 dark:text-slate-400 light:text-slate-600 font-mono uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 font-semibold">Student Account</th>
                  <th className="py-3.5 px-4 font-semibold">Tier &amp; Duration</th>
                  <th className="py-3.5 px-4 font-semibold">Settlement Amount</th>
                  <th className="py-3.5 px-4 font-semibold">UPI UTR Reference</th>
                  <th className="py-3.5 px-4 font-semibold">Audit Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 dark:divide-white/5 light:divide-slate-200">
                {filteredPayments.map(p => {
                  const isPending = p.status === 'PENDING';
                  const isApproved = p.status === 'APPROVED';
                  const isProcessing = processingId === p.id;
                  const durationLabel = p.duration_months === null ? 'Lifetime Access' : `${p.duration_months} Month(s)`;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/30 dark:hover:bg-slate-800/30 light:hover:bg-slate-50 transition-colors">
                      {/* Customer */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-white dark:text-white light:text-slate-900 block text-sm">
                            {p.customers?.full_name || 'Enrolled Student'}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-400 light:text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-500" />
                            {p.customers?.email || 'No email registered'}
                          </span>
                        </div>
                      </td>

                      {/* Package */}
                      <td className="py-4 px-4 space-y-1">
                        <span className="font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 block text-xs">
                          {p.packages?.package_name || 'Security Package'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 dark:bg-black/40 light:bg-slate-100 border border-slate-800 dark:border-white/10 light:border-slate-200 text-cyan-400 dark:text-cyan-400 light:text-cyan-700 font-semibold">
                          <Clock className="w-3 h-3" />
                          {durationLabel}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-4">
                        <span className="text-base font-black text-white dark:text-white light:text-slate-900 font-mono block">
                          ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {p.submitted_at ? new Date(p.submitted_at).toLocaleDateString() : 'Recent'}
                        </span>
                      </td>

                      {/* UPI Txn ID */}
                      <td className="py-4 px-4">
                        <div className="inline-flex items-center gap-2 p-1.5 rounded-lg bg-black/60 border border-white/10">
                          <span className="font-mono text-xs font-bold text-amber-300 tracking-wider">
                            {p.upi_transaction_id || 'N/A'}
                          </span>
                          {p.upi_transaction_id && (
                            <button
                              onClick={() => copyToClipboard(p.upi_transaction_id, p.id)}
                              className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                              title="Copy UTR ID"
                            >
                              {copiedTxnId === p.id ? (
                                <Check className="w-3.5 h-3.5 text-cyan-400" />
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
                              ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
                              : 'bg-red-500/10 border border-red-500/30 text-red-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isPending ? 'bg-amber-400 animate-pulse' : isApproved ? 'bg-cyan-400' : 'bg-red-400'
                          }`} />
                          {p.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          {/* Invoice Action for Approved Payments */}
                          {isApproved && (
                            <button
                              onClick={() => handleGenerateInvoice(p, false)}
                              disabled={isProcessing}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/30 hover:text-white transition-all cursor-pointer font-mono text-xs font-semibold shadow-sm shadow-cyan-500/20 active:scale-95"
                              title="Send & Download PDF Invoice"
                            >
                              {isProcessing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                              )}
                              <span>Invoice</span>
                            </button>
                          )}

                          {isPending && (
                            <>
                              <button 
                                onClick={() => handleApproval(p.id, 'APPROVED')} 
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
                                title="Approve payment and issue license"
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
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 disabled:opacity-50 text-amber-400 text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer"
                                title="Reject payment"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {!isPending && (
                            <span className="text-zinc-500 font-mono text-[11px] px-2 py-0.5 rounded bg-white/[0.04] border border-white/5 mr-1">
                              {isApproved ? 'Approved' : 'Rejected'}
                            </span>
                          )}

                          {/* Delete Payment Button (Works for Approved, Rejected, and Pending to recalibrate total revenue) */}
                          <button
                            onClick={() => handleDeletePayment(p.id, p.upi_transaction_id, p.amount)}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 hover:text-white transition-all cursor-pointer font-mono text-xs font-semibold disabled:opacity-50"
                            title="Delete this payment record to calculate exact amount"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            )}
                            <span>Del</span>
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
