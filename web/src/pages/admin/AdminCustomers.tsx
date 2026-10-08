import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';

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
    const fetchCustomers = async () => {
      const { data, error: queryError } = await supabase
        .from('customers')
        .select('id, full_name, email, phone, college_name, academic_year, status, created_at')
        .order('created_at', { ascending: false });

      if (queryError) setError(queryError.message);
      else setCustomers((data || []) as Customer[]);
      setLoading(false);
    };

    fetchCustomers();
  }, []);

  if (loading) return <p className="text-gray-400">Loading customers...</p>;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-5">Registered customers</h2>
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
                <th className="pb-3 pr-5 font-medium">Mobile</th>
                <th className="pb-3 pr-5 font-medium">College</th>
                <th className="pb-3 pr-5 font-medium">Year</th>
                <th className="pb-3 pr-5 font-medium">Status</th>
                <th className="pb-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {customers.map(customer => (
                <tr key={customer.id} className="border-b border-gray-800/50">
                  <td className="py-4 pr-5 font-medium">{customer.full_name}</td>
                  <td className="py-4 pr-5">{customer.email}</td>
                  <td className="py-4 pr-5">{customer.phone || 'Not provided'}</td>
                  <td className="py-4 pr-5">{customer.college_name || 'Not provided'}</td>
                  <td className="py-4 pr-5">{customer.academic_year || 'Not provided'}</td>
                  <td className="py-4 pr-5">{customer.status}</td>
                  <td className="py-4">{new Date(customer.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};