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

export const getPricingTiers = (basePrice: number) => {
  const p = Number(basePrice) || 3000;
  return [
    { duration: 1, label: '1 Month Access', price: Math.round(p) },
    { duration: 2, label: '2 Months Access', price: Math.round(p * 1.65 / 50) * 50 },
    { duration: 3, label: '3 Months Access', price: Math.round(p * 2.2 / 50) * 50 },
    { duration: null, label: 'Lifetime Access (Full)', price: Math.round(p * 2.8 / 50) * 50 }
  ];
};

export const CustomerPackages = () => {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Checkout State
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<number>(0);
  const [selectedLabel, setSelectedLabel] = useState<string>('');
  const [packageDurations, setPackageDurations] = useState<Record<string, number | null>>({});
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
    const tiers = getPricingTiers(pkg.price);
    const duration = packageDurations[pkg.id] !== undefined ? packageDurations[pkg.id] : tiers[0].duration;
    const tier = tiers.find(t => t.duration === duration) || tiers[0];
    
    setSelectedPackage(pkg);
    setSelectedDuration(duration);
    setSelectedPrice(tier.price);
    setSelectedLabel(tier.label);
    setStep(2);
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Must be logged in");

    // Upsert customer details
    const { error: custError } = await supabase.from('customers').update({
      full_name: formData.fullName,
      phone: formData.phone,
      college_name: formData.collegeName,
      academic_year: formData.academicYear
    }).eq('user_id', user.id);

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
      amount: selectedPrice,
      duration_months: selectedDuration,
      upi_transaction_id: formData.upiId.trim(),
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

  const getPackageIncludes = (pkg: any): string[] => {
    if (packageGuides[pkg.package_code]?.includes) {
      return packageGuides[pkg.package_code].includes;
    }
    if (pkg.description && pkg.description.includes(',')) {
      return pkg.description.split(',').map((s: string) => s.trim());
    }
    return [pkg.description || 'Full extension features'];
  };

  if (loading) return <div className="text-gray-400">Loading available packages...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      {step === 1 && (
        <>
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Available Packages</h2>
            <p className="text-gray-400">Compare what each package includes and choose the duration that suits you.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.map(pkg => {
              const tiers = getPricingTiers(pkg.price);
              const currentDuration = packageDurations[pkg.id] !== undefined ? packageDurations[pkg.id] : tiers[0].duration;
              const currentTier = tiers.find(t => t.duration === currentDuration) || tiers[0];
              const includesList = getPackageIncludes(pkg);

              return (
                <div key={pkg.id} className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-8 flex flex-col hover:border-green-600/50 transition-colors shadow-lg">
                  <div className="mb-6 flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-2xl font-bold text-white">{pkg.package_name}</h3>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-gray-400">{pkg.package_code}</span>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm text-gray-400 mb-2 font-medium">Select Duration</label>
                      <select 
                        className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:border-green-500 font-medium"
                        value={currentDuration === null ? 'null' : String(currentDuration)}
                        onChange={(e) => setPackageDurations({
                          ...packageDurations, 
                          [pkg.id]: e.target.value === 'null' ? null : parseInt(e.target.value)
                        })}
                      >
                        {tiers.map(t => (
                          <option key={t.duration === null ? 'lifetime' : t.duration} value={t.duration === null ? 'null' : String(t.duration)}>
                            {t.label} - ₹{t.price}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="text-3xl font-black text-green-500 mb-4 tracking-tight">
                      ₹{currentTier.price}
                      <span className="text-xs font-normal text-gray-400 ml-2">({currentTier.label})</span>
                    </div>

                    <p className="text-sm font-medium text-gray-200 mb-2">What it is for</p>
                    <p className="text-gray-400 text-sm mb-5 leading-relaxed">{packageGuides[pkg.package_code]?.purpose || pkg.description}</p>

                    <p className="text-sm font-medium text-gray-200 mb-3">Included tools</p>
                    <div className="space-y-3">
                      {includesList.map((item: string) => (
                        <div key={item} className="flex items-center text-sm text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-400 mr-3 shrink-0" /> {item}
                        </div>
                      ))}
                    </div>

                    <details className="mt-6 border-t border-gray-800 pt-4">
                      <summary className="cursor-pointer text-sm font-medium text-green-400 hover:text-green-300">How to install</summary>
                      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-400">
                        {installationSteps.map(item => <li key={item}>{item}</li>)}
                      </ol>
                    </details>
                  </div>
                  <button onClick={() => handleBuyClick(pkg)} className="w-full py-3 bg-green-700 hover:bg-green-600 text-white rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(34,197,94,0.2)] cursor-pointer">
                    Buy Now
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {step === 2 && (
        <div className="max-w-xl mx-auto bg-[#0a0a0a] border border-gray-800 rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-2">Student Details</h2>
          <p className="text-sm text-gray-400 mb-6">
            Purchasing: <span className="text-white font-semibold">{selectedPackage?.package_name} ({selectedLabel})</span> · <span className="text-green-400 font-bold">₹{selectedPrice}</span>
          </p>
          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Full Name</label>
              <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full px-4 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-600 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Mobile Number</label>
              <input required type="tel" inputMode="tel" autoComplete="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-600 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">College Name</label>
              <input required type="text" value={formData.collegeName} onChange={e => setFormData({...formData, collegeName: e.target.value})} className="w-full px-4 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-600 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Academic Year</label>
              <input required type="text" value={formData.academicYear} onChange={e => setFormData({...formData, academicYear: e.target.value})} className="w-full px-4 py-2 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-600 text-white" placeholder="e.g. 3rd Year" />
            </div>
            <div className="pt-4 flex gap-4">
              <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium cursor-pointer">Back</button>
              <button type="submit" className="flex-1 py-3 bg-green-700 hover:bg-green-600 rounded-xl font-bold cursor-pointer transition-colors">Continue to Payment</button>
            </div>
          </form>
        </div>
      )}

      {step === 3 && (
        <div className="max-w-xl mx-auto bg-[#0a0a0a] border border-gray-800 rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">UPI Payment</h2>
            <p className="text-gray-400 text-sm">
              Complete your payment for <span className="text-white font-semibold">{selectedPackage?.package_name} ({selectedLabel})</span>.
            </p>
          </div>
          
          <div className="bg-black border border-gray-800 rounded-xl p-6 text-center mb-6">
            <div className="text-sm text-gray-400 mb-1">Total Amount</div>
            <div className="text-4xl font-black text-green-500 mb-6">₹{selectedPrice}</div>
            <div className="text-sm text-gray-400 mb-1">Official UPI ID</div>
            <div className="text-xl font-mono text-white bg-[#0a0a0a] py-3 rounded-lg border border-gray-800 select-all font-bold">
              phantomlead@upi
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-gray-800 p-5 bg-zinc-950/60">
            <h3 className="font-semibold text-white mb-2 text-sm">What this package includes:</h3>
            <p className="text-xs text-gray-400 mb-4">{packageGuides[selectedPackage?.package_code]?.purpose || selectedPackage?.description}</p>
            <h3 className="font-semibold text-white mb-2 text-sm">Activation steps:</h3>
            <ol className="list-decimal space-y-1 pl-5 text-xs text-gray-400">
              {installationSteps.map(item => <li key={item}>{item}</li>)}
            </ol>
          </div>

          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Paste UPI Transaction ID (Reference / UTR Number)</label>
              <input required type="text" value={formData.upiId} onChange={e => setFormData({...formData, upiId: e.target.value})} className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-600 font-mono text-center text-lg text-white font-bold" placeholder="e.g. 3201498172" />
            </div>
            <div className="pt-4 flex gap-4">
              <button type="button" onClick={() => setStep(2)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium cursor-pointer">Back</button>
              <button type="submit" className="flex-1 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold flex items-center justify-center cursor-pointer shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                <CreditCard className="w-5 h-5 mr-2" /> Submit Payment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
