import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';

export const AdminPayments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from('payments')
      .select('*, customers(full_name, email), packages(package_name)')
      .order('submitted_at', { ascending: false });
    
    if (error) console.error(error);
    else setPayments(data || []);
    setLoading(false);
  };

  const handleApproval = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    // Convert status to edge function action format
    const actionStr = status === 'APPROVED' ? 'APPROVE' : 'REJECT';
    const { error } = await supabase.functions.invoke('admin-approve-payment', {
      body: { payment_id: id, action: actionStr }
    });
    
    if (error) {
      alert(error.message || 'Failed to approve payment');
    } else {
      alert(`Payment ${status}`);
      fetchPayments();
    }
  };

  if (loading) return <div className="text-gray-400">Loading payments...</div>;

  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">Payment Approvals</h2>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-800 text-gray-400">
            <th className="pb-3 font-medium">Customer</th>
            <th className="pb-3 font-medium">Package</th>
            <th className="pb-3 font-medium">Amount</th>
            <th className="pb-3 font-medium">UPI Txn ID</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {payments.map(p => (
            <tr key={p.id} className="border-b border-gray-800/50">
              <td className="py-4 font-medium">{p.customers?.full_name || p.customers?.email}</td>
              <td className="py-4">{p.packages?.package_name}</td>
              <td className="py-4">₹{p.amount}</td>
              <td className="py-4 font-mono">{p.upi_transaction_id}</td>
              <td className="py-4">
                <span className={`px-2 py-1 rounded text-xs ${p.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' : p.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {p.status}
                </span>
              </td>
              <td className="py-4 flex gap-2">
                {p.status === 'PENDING' && (
                  <>
                    <button onClick={() => handleApproval(p.id, 'APPROVED')} className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-xs">Approve</button>
                    <button onClick={() => handleApproval(p.id, 'REJECTED')} className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-xs">Reject</button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {payments.length === 0 && <tr><td colSpan={6} className="py-4 text-center text-gray-500">No payments found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
};
