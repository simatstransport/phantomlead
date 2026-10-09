import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Copy, Check } from 'lucide-react';
import { supabase } from '../services/supabase';

type CustomerLicense = {
  id: string;
  status: string;
  payment_type: string;
  issued_at: string;
  expires_at: string | null;
  license_key: string | null;
  packages: { package_name: string; package_code: string };
  customers: { full_name: string };
};

export const CustomerLicenses = () => {
  const [licenses, setLicenses] = useState<CustomerLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyError, setKeyError] = useState('');
  const [keyActionError, setKeyActionError] = useState('');
  const [regeneratingLicenseId, setRegeneratingLicenseId] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateReplacementKey = async (licenseId: string) => {
    const confirmed = window.confirm('Your current key cannot be recovered. Generate a replacement? Any previous key for this license will stop working.');
    if (!confirmed) return;

    setRegeneratingLicenseId(licenseId);
    setKeyActionError('');
    const { data, error: functionError } = await supabase.functions.invoke('regenerate-my-license-key', {
      body: { license_id: licenseId }
    });
    setRegeneratingLicenseId('');

    if (functionError) {
      setKeyActionError(`Could not generate a key: ${functionError.message}. Ask the administrator to deploy the replacement-key function.`);
      return;
    }

    if (!data?.license_key) {
      setKeyActionError('The replacement key was not returned. Contact the administrator.');
      return;
    }

    setLicenses(current => current.map(license => (
      license.id === licenseId ? { ...license, license_key: data.license_key } : license
    )));
  };

  useEffect(() => {
    const fetchLicenses = async () => {
      const { data, error: queryError } = await supabase
        .from('licenses')
        .select('id, status, payment_type, issued_at, expires_at, packages(package_name, package_code), customers(full_name)')
        .order('issued_at', { ascending: false });

      if (queryError) {
        setError(queryError.message);
      } else {
        const licenseRows = (data || []).map(license => ({
          ...(license as any as Omit<CustomerLicense, 'license_key'>),
          license_key: null
        }));
        setLicenses(licenseRows);

        const { data: keyData, error: keyQueryError } = await supabase.functions.invoke('get-my-license-keys', { method: 'GET' });
        if (keyQueryError) {
          setKeyError('License records loaded, but activation keys are unavailable. Ask the administrator to deploy the license-key function and configure its encryption secret.');
        } else {
        const keys = new Map<string, string | null>((keyData?.keys || []).map((entry: { license_id: string; license_key: string | null }) => [entry.license_id, entry.license_key]));
          setLicenses(licenseRows.map(license => ({
            ...license,
            license_key: keys.get(license.id) || null
          })));
        }
      }
      setLoading(false);
    };

    fetchLicenses();
  }, []);

  if (loading) return <p className="text-gray-400">Loading your licenses...</p>;

  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-2">Your licenses</h2>
      <p className="text-sm text-gray-400 mb-6">Use the key shown on your license when activating SecureInstaller.</p>
      {(() => {
        const activeLicense = licenses.find(license => license.status === 'ACTIVE');
        if (!activeLicense) return null;
        
        let installerName = 'SecureInstaller_L.exe';
        if (activeLicense.expires_at) {
          installerName = 'SecureInstaller_T.exe';
        } else if (activeLicense.payment_type === 'FREE') {
          installerName = 'SecureInstaller_A.exe';
        } else {
          installerName = 'SecureInstaller_L.exe';
        }
        
        return (
          <a href={`https://wgxxitydatuoyjnxuvqw.supabase.co/storage/v1/object/public/installers/${installerName}?v=${new Date().getTime()}`} download className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg font-medium">
            <Download className="w-4 h-4" /> Download SecureInstaller.exe
          </a>
        );
      })()}
      {keyError && <p role="status" className="mb-5 text-sm text-yellow-300">{keyError}</p>}
      {keyActionError && <p role="alert" className="mb-5 text-sm text-red-400">{keyActionError}</p>}
      {error ? (
        <p role="alert" className="text-sm text-red-400">Could not load licenses: {error}</p>
      ) : licenses.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-300 mb-4">No licenses have been issued to your account yet.</p>
          <Link to="/dashboard/packages" className="inline-flex px-4 py-2 bg-green-700 hover:bg-green-800 rounded-lg font-medium">Browse packages</Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="pb-3 pr-5 font-medium">Package</th>
                <th className="pb-3 pr-5 font-medium">Owner</th>
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
                    <div className="font-medium text-white">{license.packages?.package_name || 'Package'}</div>
                    <div className="text-xs text-gray-500">{license.packages?.package_code || ''}</div>
                  </td>
                  <td className="py-4 pr-5">
                    <div className="text-sm text-gray-300">{license.customers?.full_name || 'You'}</div>
                  </td>
                  <td className="py-4 pr-5">{license.status}</td>
                  <td className="py-4 pr-5">{license.payment_type}</td>
                  <td className="py-4 pr-5 font-mono text-xs">
                    {license.license_key ? (
                      <div className="flex items-center gap-2">
                        <span className="text-green-400 font-bold tracking-wider select-all break-all">
                          {license.license_key}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyKey(license.license_key!)}
                          title="Copy License Key"
                          className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all flex items-center gap-1 text-xs font-sans shrink-0 border border-gray-700 cursor-pointer"
                        >
                          {copiedKey === license.license_key ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-green-400" />
                              <span className="text-green-400 font-medium">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-gray-400" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="min-w-40">
                        <span className="block mb-2">Key unavailable</span>
                        {license.status === 'ACTIVE' && (
                          <button type="button" onClick={() => handleGenerateReplacementKey(license.id)} disabled={regeneratingLicenseId === license.id} className="font-sans text-green-400 underline underline-offset-2 disabled:opacity-50">
                            {regeneratingLicenseId === license.id ? 'Generating...' : 'Generate replacement key'}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
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