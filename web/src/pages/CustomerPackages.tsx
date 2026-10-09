import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { CreditCard, CheckCircle, Clock, Sparkles, SlidersHorizontal } from 'lucide-react';

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

export const calculateDurationPrice = (basePrice: number, months: number | null): number => {
  const p = Number(basePrice) || 3000;
  if (months === null) {
    // Lifetime full access (~2.8x base monthly price)
    return Math.round(p * 2.8 / 50) * 50;
  }
  if (months <= 1) return Math.round(p);
  const multiplier = Math.pow(months, 0.76);
  return Math.round((p * multiplier) / 50) * 50;
};

export const getDiscountLabel = (months: number | null): string | null => {
  if (months === null) return 'Unlimited Access';
  if (months === 2) return 'Save 15%';
  if (months === 3) return 'Save 23% (Popular)';
  if (months === 6) return 'Save 35%';
  if (months === 12) return 'Save 45% (Best Value)';
  if (months > 1) {
    const undiscounted = months;
    const multi = Math.pow(months, 0.76);
    const pct = Math.round((1 - (multi / undiscounted)) * 100);
    return `Save ${pct}%`;
  }
  return null;
};

export const CustomerPackages = () => {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Checkout State
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(1);
  const [selectedPrice, setSelectedPrice] = useState<number>(0);
  const [selectedLabel, setSelectedLabel] = useState<string>('');
  
  // Per-package duration adjustments
  // packageDurations stores { [pkgId]: number | null } where null = Lifetime
  const [packageDurations, setPackageDurations] = useState<Record<string, number | null>>({});
  // customSliderActive stores whether custom slider mode is open for that card
  const [customSliderActive, setCustomSliderActive] = useState<Record<string, boolean>>({});

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

  const getDurationLabel = (months: number | null): string => {
    if (months === null) return 'Lifetime Access';
    if (months === 1) return '1 Month Access';
    return `${months} Months Access`;
  };

  const handleBuyClick = (pkg: any) => {
    const duration = packageDurations[pkg.id] !== undefined ? packageDurations[pkg.id] : 1;
    const price = calculateDurationPrice(pkg.price, duration);
    const label = getDurationLabel(duration);
    
    setSelectedPackage(pkg);
    setSelectedDuration(duration);
    setSelectedPrice(price);
    setSelectedLabel(label);
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
            <h2 className="text-3xl font-extrabold mb-3 text-white tracking-tight">Available Packages & Adjustable Durations</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-sm">
              Select your package and freely customize the duration from 1 month to 24 months, or choose Lifetime Access.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.map(pkg => {
              const currentDuration = packageDurations[pkg.id] !== undefined ? packageDurations[pkg.id] : 1;
              const calculatedPrice = calculateDurationPrice(pkg.price, currentDuration);
              const discount = getDiscountLabel(currentDuration);
              const includesList = getPackageIncludes(pkg);
              const isSliderOpen = customSliderActive[pkg.id] || false;

              return (
                <div key={pkg.id} className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-7 flex flex-col hover:border-green-600/50 transition-all shadow-xl relative overflow-hidden group">
                  <div className="mb-6 flex-1">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-2xl font-bold text-white tracking-tight">{pkg.package_name}</h3>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-gray-400 font-semibold">
                        {pkg.package_code}
                      </span>
                    </div>

                    {/* Adjustable Duration Selector */}
                    <div className="my-5 p-3.5 bg-black/80 rounded-xl border border-gray-800">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-green-400" /> Choose Duration
                        </span>
                        <button
                          type="button"
                          onClick={() => setCustomSliderActive(prev => ({ ...prev, [pkg.id]: !isSliderOpen }))}
                          className="text-[11px] text-green-400 hover:text-green-300 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                          {isSliderOpen ? 'Quick Pills' : 'Custom Slider'}
                        </button>
                      </div>

                      {/* Quick Month Pills */}
                      {!isSliderOpen ? (
                        <div className="grid grid-cols-3 gap-1.5 mb-2">
                          {[
                            { value: 1, label: '1 Mo' },
                            { value: 2, label: '2 Mos' },
                            { value: 3, label: '3 Mos' },
                            { value: 6, label: '6 Mos' },
                            { value: 12, label: '12 Mos' },
                            { value: null, label: '∞ Lifetime' },
                          ].map(opt => {
                            const isSelected = currentDuration === opt.value;
                            return (
                              <button
                                key={opt.label}
                                type="button"
                                onClick={() => setPackageDurations({ ...packageDurations, [pkg.id]: opt.value })}
                                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-green-600 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]' 
                                    : 'bg-[#141414] text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        /* Adjustable Custom Month Slider & Stepper */
                        <div className="space-y-3 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Selected Months:</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const cur = currentDuration === null ? 1 : Math.max(1, currentDuration - 1);
                                  setPackageDurations({ ...packageDurations, [pkg.id]: cur });
                                }}
                                className="w-6 h-6 rounded bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                              >
                                -
                              </button>
                              <span className="font-mono text-sm font-bold text-green-400 min-w-16 text-center">
                                {currentDuration === null ? 'Lifetime' : `${currentDuration} Mo`}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const cur = currentDuration === null ? 1 : Math.min(24, currentDuration + 1);
                                  setPackageDurations({ ...packageDurations, [pkg.id]: cur });
                                }}
                                className="w-6 h-6 rounded bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <input
                            type="range"
                            min="1"
                            max="24"
                            step="1"
                            value={currentDuration === null ? 12 : currentDuration}
                            onChange={(e) => setPackageDurations({ ...packageDurations, [pkg.id]: parseInt(e.target.value) })}
                            className="w-full accent-green-500 cursor-pointer h-1.5 bg-gray-800 rounded-lg appearance-none"
                          />

                          <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                            <span>1 Mo</span>
                            <span>6 Mos</span>
                            <span>12 Mos</span>
                            <span>24 Mos</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setPackageDurations({ ...packageDurations, [pkg.id]: null })}
                            className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              currentDuration === null 
                                ? 'bg-green-600 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]' 
                                : 'bg-[#141414] text-gray-300 hover:bg-gray-800'
                            }`}
                          >
                            Switch to Lifetime Access (Full)
                          </button>
                        </div>
                      )}

                      {/* Discount Badge */}
                      {discount && (
                        <div className="mt-2 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-400 bg-green-500/10 px-2.5 py-0.5 rounded-full border border-green-500/20">
                            <Sparkles className="w-3 h-3" /> {discount}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Price Display */}
                    <div className="mb-4">
                      <div className="text-3xl font-black text-green-400 tracking-tight">
                        ₹{calculatedPrice}
                      </div>
                      <span className="text-xs font-medium text-gray-400">
                        Total for {getDurationLabel(currentDuration)}
                      </span>
                    </div>

                    {/* Purpose */}
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">What it is for</p>
                    <p className="text-gray-400 text-xs mb-5 leading-relaxed">{packageGuides[pkg.package_code]?.purpose || pkg.description}</p>

                    {/* Tools Included */}
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2.5">Included tools</p>
                    <div className="space-y-2.5 mb-5">
                      {includesList.map((item: string) => (
                        <div key={item} className="flex items-center text-xs text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-400 mr-2.5 shrink-0" /> {item}
                        </div>
                      ))}
                    </div>

                    {/* Installation Details */}
                    <details className="border-t border-gray-800/80 pt-3">
                      <summary className="cursor-pointer text-xs font-medium text-green-400 hover:text-green-300">How to install</summary>
                      <ol className="mt-2.5 list-decimal space-y-1.5 pl-4 text-xs text-gray-400">
                        {installationSteps.map(item => <li key={item}>{item}</li>)}
                      </ol>
                    </details>
                  </div>

                  <button 
                    onClick={() => handleBuyClick(pkg)} 
                    className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(34,197,94,0.25)] hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] cursor-pointer"
                  >
                    Buy Now ({getDurationLabel(currentDuration)})
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {step === 2 && (
        <div className="max-w-xl mx-auto bg-[#0a0a0a] border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold mb-2 text-white">Student Details</h2>
          <p className="text-sm text-gray-400 mb-6">
            Purchasing: <span className="text-white font-bold">{selectedPackage?.package_name} ({selectedLabel})</span> · <span className="text-green-400 font-extrabold text-base">₹{selectedPrice}</span>
          </p>
          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Full Name</label>
              <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full px-4 py-2.5 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-600 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Mobile Number</label>
              <input required type="tel" inputMode="tel" autoComplete="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2.5 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-600 text-white text-sm font-mono" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">College Name</label>
              <input required type="text" value={formData.collegeName} onChange={e => setFormData({...formData, collegeName: e.target.value})} className="w-full px-4 py-2.5 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-600 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Academic Year</label>
              <input required type="text" value={formData.academicYear} onChange={e => setFormData({...formData, academicYear: e.target.value})} className="w-full px-4 py-2.5 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-600 text-white text-sm" placeholder="e.g. 3rd Year" />
            </div>
            <div className="pt-4 flex gap-4">
              <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium cursor-pointer text-sm">Back</button>
              <button type="submit" className="flex-1 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold cursor-pointer transition-colors text-sm shadow-[0_0_15px_rgba(34,197,94,0.3)]">Continue to Payment</button>
            </div>
          </form>
        </div>
      )}

      {step === 3 && (
        <div className="max-w-xl mx-auto bg-[#0a0a0a] border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-1.5 text-white">UPI Payment</h2>
            <p className="text-gray-400 text-xs">
              Complete your payment for <span className="text-white font-bold">{selectedPackage?.package_name} ({selectedLabel})</span>.
            </p>
          </div>
          
          <div className="bg-black border border-gray-800 rounded-xl p-6 text-center mb-6 shadow-inner">
            <div className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Amount to Pay</div>
            <div className="text-4xl font-black text-green-400 mb-5">₹{selectedPrice}</div>
            <div className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Official UPI ID</div>
            <div className="text-lg font-mono text-white bg-[#0e0e0e] py-2.5 rounded-lg border border-gray-800 select-all font-bold">
              phantomlead@upi
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-gray-800 p-4 bg-zinc-950/60 text-xs">
            <h3 className="font-semibold text-white mb-1.5">What this package includes:</h3>
            <p className="text-gray-400 mb-3 leading-relaxed">{packageGuides[selectedPackage?.package_code]?.purpose || selectedPackage?.description}</p>
            <h3 className="font-semibold text-white mb-1.5">Activation steps:</h3>
            <ol className="list-decimal space-y-1 pl-4 text-gray-400">
              {installationSteps.map(item => <li key={item}>{item}</li>)}
            </ol>
          </div>

          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">
                Paste UPI Transaction ID (Reference / UTR Number)
              </label>
              <input 
                required 
                type="text" 
                value={formData.upiId} 
                onChange={e => setFormData({...formData, upiId: e.target.value})} 
                className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:outline-none focus:border-green-600 font-mono text-center text-lg text-white font-bold tracking-wider" 
                placeholder="e.g. 3201498172" 
              />
            </div>
            <div className="pt-4 flex gap-4">
              <button type="button" onClick={() => setStep(2)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium cursor-pointer text-sm">Back</button>
              <button type="submit" className="flex-1 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold flex items-center justify-center cursor-pointer shadow-[0_0_15px_rgba(34,197,94,0.3)] text-sm">
                <CreditCard className="w-4 h-4 mr-2" /> Submit Payment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
