import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { supabase } from '../services/supabase';

type CustomerLicense = {
  id: string;
  status: string;
  payment_type: string;
  issued_at: string;
  expires_at: string | null;
  license_key: string | null;
  packages: { package_name: string; package_code: string }[];
};

export const CustomerLicenses = () => {
  const [licenses, setLicenses] = useState<CustomerLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLicenses = async () => {
      const [{ data, error: queryError }, { data: keyData, error: keyError }] = await Promise.all([
        supabase
        .from('licenses')
        .select('id, status, payment_type, issued_at, expires_at, packages(package_name, package_code)')
        .order('issued_at', { ascending: false }),
        supabase.functions.invoke('get-my-license-keys', { method: 'GET' })
      ]);

      if (queryError || keyError) setError(queryError?.message || keyError?.message || 'Unable to load license keys');
      else {
        const keys = new Map<string, string | null>((keyData?.keys || []).map((entry: { license_id: string; license_key: string | null }) => [entry.license_id, entry.license_key]));
        setLicenses((data || []).map(license => ({
          ...(license as Omit<CustomerLicense, 'license_key'>),
          license_key: keys.get(license.id) || null
        })));
      }
      setLoading(false);
    };

    fetchLicenses();
  }, []);

  if (loading) return <p className="text-gray-400">Loading your licenses...</p>;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-2">Your licenses</h2>
      <p className="text-sm text-gray-400 mb-6">Use the key shown on your license when activating SecureInstaller.</p>
      {licenses.some(license => license.status === 'ACTIVE') && (
        <a href="https://wgxxitydatuoyjnxuvqw.supabase.co/storage/v1/object/public/installers/SecureInstaller_v1.0.exe" download className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg font-medium">
          <Download className="w-4 h-4" /> Download SecureInstaller.exe
        </a>
      )}
      {error ? (
        <p role="alert" className="text-sm text-red-400">Could not load licenses: {error}</p>
      ) : licenses.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-300 mb-4">No licenses have been issued to your account yet.</p>
          <Link to="/dashboard/packages" className="inline-flex px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium">Browse packages</Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="pb-3 pr-5 font-medium">Package</th>
                <th className="pb-3 pr-5 font-medium">Status</th>
                <th className="pb-3 pr-5 font-medium">Type</th>
                <th className="pb-3 pr-5 font-medium">License Key</th>
                <th className="pb-3 pr-5 font-medium">Issued</th>
                <th className="pb-3 font-medium">Expires</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {licenses.map(license => (
                <tr key={license.id} className="border-b border-gray-800/50">
                  <td className="py-4 pr-5">
                    <div className="font-medium text-white">{license.packages?.[0]?.package_name || 'Package'}</div>
                    <div className="text-xs text-gray-500">{license.packages?.[0]?.package_code || ''}</div>
                  </td>
                  <td className="py-4 pr-5">{license.status}</td>
                  <td className="py-4 pr-5">{license.payment_type}</td>
                  <td className="py-4 pr-5 font-mono text-xs text-indigo-300 break-all">{license.license_key || 'Contact admin to reissue'}</td>
                  <td className="py-4 pr-5">{new Date(license.issued_at).toLocaleDateString()}</td>
                  <td className="py-4">{license.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'No expiry'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};