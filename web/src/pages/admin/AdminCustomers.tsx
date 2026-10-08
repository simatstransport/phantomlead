import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Trash2, Ban, CheckCircle } from 'lucide-react';

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

  if (loading) return <p className="text-gray-400">Loading customers...</p>;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-5">Customer Management</h2>
      {error ? (
        <p role="alert" className="text-sm text-red-400">Could not load customers: {error}</p>
      ) : customers.length === 0 ? (
        <p className="text-center py-8 text-gray-500">No customers have signed up yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="pb-3 pr-5 font-medium">Name</th>
                <th className="pb-3 pr-5 font-medium">Email</th>
                <th className="pb-3 pr-5 font-medium">Mobile / College</th>
                <th className="pb-3 pr-5 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {customers.map(customer => (
                <tr key={customer.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                  <td className="py-4 pr-5 font-medium">{customer.full_name}</td>
                  <td className="py-4 pr-5 text-gray-300">{customer.email}</td>
                  <td className="py-4 pr-5 text-gray-400">
                    {customer.phone || 'No phone'}
                    {customer.college_name && <div className="text-xs text-gray-500 mt-1">{customer.college_name} ({customer.academic_year})</div>}
                  </td>
                  <td className="py-4 pr-5">
                    <span className={`px-2 py-1 rounded text-xs ${customer.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {customer.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td className="py-4 flex justify-end gap-3">
                    <button 
                      onClick={() => handleToggleBlock(customer.id, customer.status)} 
                      className={`flex items-center text-sm ${customer.status === 'BLOCKED' ? 'text-green-400 hover:text-green-300' : 'text-yellow-500 hover:text-yellow-400'}`}
                      title={customer.status === 'BLOCKED' ? 'Unblock' : 'Block'}
                    >
                      {customer.status === 'BLOCKED' ? <CheckCircle className="w-4 h-4 mr-1" /> : <Ban className="w-4 h-4 mr-1" />}
                      {customer.status === 'BLOCKED' ? 'Unblock' : 'Block'}
                    </button>
                    <button 
                      onClick={() => handleDelete(customer.id)} 
                      className="flex items-center text-sm text-red-500 hover:text-red-400"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};