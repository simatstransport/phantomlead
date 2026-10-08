import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { CreditCard, CheckCircle } from 'lucide-react';

const packageGuides: Record<string, { purpose: string; includes: string[] }> = {
  FULL_ACCESS: {
    purpose: 'A complete toolkit for coursework, coding practice, and viva preparation.',
    includes: ['LMS MCQ', 'Java coding', 'Viva paragraph']
  },
  JAVA_VIVA: {
    purpose: 'For students practicing Java programming and preparing for viva questions.',
    includes: ['Java coding', 'Viva paragraph']
  },
  QA_PLACEMENT: {
    purpose: 'For LMS-based multiple-choice practice and QA or placement preparation.',
    includes: ['LMS MCQ']
  }
};

const installationSteps = [
  'After payment approval, open your dashboard and download SecureInstaller.exe.',
  'Run the installer and enter the license key issued for your package.',
  'Enter your Gemini API key when prompted, then let the installer validate and install the authorized tools.'
];

export const CustomerPackages = () => {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Checkout State
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [step, setStep] = useState(1); // 1 = Packages, 2 = Details, 3 = Payment
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    collegeName: '',
    academicYear: '',
    upiId: ''
  });

  useEffect(() => {
    fetchPackages();
    checkExistingCustomer();
  }, []);

  const fetchPackages = async () => {
    const { data } = await supabase.from('packages').select('*').eq('active', true).order('price', { ascending: true });
    setPackages(data || []);
    setLoading(false);
  };

  const checkExistingCustomer = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: cust } = await supabase.from('customers').select('*').eq('user_id', user.id).single();
    if (cust) {
      setFormData(prev => ({
        ...prev,
        fullName: cust.full_name || '',
        phone: cust.phone || '',
        collegeName: cust.college_name || '',
        academicYear: cust.academic_year || ''
      }));
    }
  };

  const handleBuyClick = (pkg: any) => {
    setSelectedPackage(pkg);
    setStep(2);
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Must be logged in");

    // Upsert customer details
    const { error: custError } = await supabase.from('customers').upsert({
      user_id: user.id,
      email: user.email,
      full_name: formData.fullName,
      phone: formData.phone,
      college_name: formData.collegeName,
      academic_year: formData.academicYear
    }, { onConflict: 'user_id' });

    if (custError) {
      alert("Error saving details: " + custError.message);
      return;
    }

    setStep(3);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: customer } = await supabase.from('customers').select('id').eq('user_id', user.id).single();

    const { error } = await supabase.from('payments').insert({
      customer_id: customer?.id,
      package_id: selectedPackage.id,
      amount: selectedPackage.price,
      upi_transaction_id: formData.upiId,
      status: 'PENDING'
    });

    if (error) {
      alert("Error submitting payment: " + error.message);
    } else {
      alert("Payment submitted successfully! Waiting for admin approval.");
      setStep(1);
      setSelectedPackage(null);
    }
  };

  if (loading) return <div className="text-gray-400">Loading available packages...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      {step === 1 && (
        <>
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Available Packages</h2>
            <p className="text-gray-400">Compare what each package includes and choose the tools you need.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.map(pkg => (
              <div key={pkg.id} className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-8 flex flex-col hover:border-green-600/50 transition-colors">
                <div className="mb-6 flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">{pkg.package_name}</h3>
                  <div className="text-3xl font-black text-green-500 mb-4">₹{pkg.price}</div>
                  <p className="text-sm font-medium text-gray-200 mb-2">What it is for</p>
                  <p className="text-gray-400 text-sm mb-5">{packageGuides[pkg.package_code]?.purpose || pkg.description}</p>

                  <p className="text-sm font-medium text-gray-200 mb-3">Included tools</p>
                  <div className="space-y-3">
                    {(packageGuides[pkg.package_code]?.includes || [pkg.description]).map((item: string) => (
                      <div key={item} className="flex items-center text-sm text-gray-300"><CheckCircle className="w-4 h-4 text-green-400 mr-3 shrink-0" /> {item}</div>
                    ))}
                  </div>

                  <details className="mt-6 border-t border-gray-800 pt-4">
                    <summary className="cursor-pointer text-sm font-medium text-green-400">How to install</summary>
                    <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-400">
                      {installationSteps.map(item => <li key={item}>{item}</li>)}
                    </ol>
                  </details>
                </div>
                <button onClick={() => handleBuyClick(pkg)} className="w-full py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl font-medium transition-colors">
                  Buy Now
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <div className="max-w-xl mx-auto bg-[#0a0a0a] border border-gray-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Student Details</h2>
          <p className="text-sm text-gray-400 mb-6">Purchasing: <span className="text-white">{selectedPackage?.package_name}</span> · ₹{selectedPackage?.price}</p>
          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Full Name</label>
              <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full px-4 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-600" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Mobile Number</label>
              <input required type="tel" inputMode="tel" autoComplete="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-600" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">College Name</label>
              <input required type="text" value={formData.collegeName} onChange={e => setFormData({...formData, collegeName: e.target.value})} className="w-full px-4 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-600" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Academic Year</label>
              <input required type="text" value={formData.academicYear} onChange={e => setFormData({...formData, academicYear: e.target.value})} className="w-full px-4 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-600" placeholder="e.g. 3rd Year" />
            </div>
            <div className="pt-4 flex gap-4">
              <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium">Back</button>
              <button type="submit" className="flex-1 py-3 bg-green-700 hover:bg-green-800 rounded-xl font-medium">Continue to Payment</button>
            </div>
          </form>
        </div>
      )}

      {step === 3 && (
        <div className="max-w-xl mx-auto bg-[#0a0a0a] border border-gray-800 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">UPI Payment</h2>
            <p className="text-gray-400">Scan or pay to the UPI ID below to complete your purchase of {selectedPackage?.package_name}.</p>
          </div>
          
          <div className="bg-black border border-gray-800 rounded-xl p-6 text-center mb-8">
            <div className="text-sm text-gray-400 mb-1">Amount to Pay</div>
            <div className="text-4xl font-black text-green-500 mb-6">₹{selectedPackage?.price}</div>
            <div className="text-sm text-gray-400 mb-1">Official UPI ID</div>
            <div className="text-xl font-mono text-white bg-[#0a0a0a] py-3 rounded-lg border border-gray-800 select-all">
              phantomlead@upi
            </div>
          </div>

          <div className="mb-8 rounded-xl border border-gray-800 p-5">
            <h3 className="font-semibold text-white mb-2">What this package is for</h3>
            <p className="text-sm text-gray-400 mb-4">{packageGuides[selectedPackage?.package_code]?.purpose || selectedPackage?.description}</p>
            <h3 className="font-semibold text-white mb-2">Installation after approval</h3>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-400">
              {installationSteps.map(item => <li key={item}>{item}</li>)}
            </ol>
          </div>

          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Paste UPI Transaction ID (Reference Number)</label>
              <input required type="text" value={formData.upiId} onChange={e => setFormData({...formData, upiId: e.target.value})} className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-600 font-mono text-center text-lg" placeholder="e.g. 3201498172" />
            </div>
            <div className="pt-4 flex gap-4">
              <button type="button" onClick={() => setStep(2)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium">Back</button>
              <button type="submit" className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-medium flex items-center justify-center">
                <CreditCard className="w-5 h-5 mr-2" /> Submit Payment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
