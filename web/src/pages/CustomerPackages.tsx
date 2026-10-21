import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { 
  CreditCard, 
  CheckCircle, 
  Clock, 
  Sparkles, 
  SlidersHorizontal, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  Copy, 
  User, 
  Phone, 
  School, 
  GraduationCap, 
  Package, 
  ChevronRight
} from 'lucide-react';

const packageGuides: Record<string, { purpose: string; badge: string; includes: string[] }> = {
  FULL_ACCESS: {
    purpose: 'Complete all-in-one suite with all 5 specialized assistants for LMS, Viva, Java, Python, and C.',
    badge: 'COMMAND SUITE • MOST POPULAR',
    includes: ['LMS MCQ Helper', 'Viva Paragraph Explainer', 'Java Coding Helper', 'Python 3 Coding Helper', 'C Coding Helper']
  },
  PYTHON_C: {
    purpose: 'Engineered for students practicing Python and C programming with AI answer and code assistance.',
    badge: 'DEVELOPER DUO',
    includes: ['Python 3 Coding Helper', 'C Coding Helper']
  },
  JAVA_VIVA: {
    purpose: 'For students practicing Java programming and preparing for oral viva voce questions.',
    badge: 'JAVA & ORAL EXAM',
    includes: ['Java Coding Helper', 'Viva Paragraph Explainer']
  },
  QA_PLACEMENT: {
    purpose: 'For LMS-based multiple-choice practice and QA or campus placement assessment rounds.',
    badge: 'MCQ & APTITUDE',
    includes: ['LMS MCQ Helper']
  }
};

const installationSteps = [
  'After payment approval, open your dashboard and download SecureInstaller.exe.',
  'Run the installer and enter the license key issued for your package.',
  'Enter your Gemini API key when prompted, then let the installer validate and install the authorized tools.'
];

export const calculateDurationPrice = (basePrice: number, months: number | null, packageCode?: string): number => {
  const p = Number(basePrice) || 3000;
  if (months === null) {
    if (packageCode === 'FULL_ACCESS' || p >= 5500) {
      return 7000;
    }
    if (packageCode === 'JAVA_VIVA') {
      return 5500;
    }
    if (packageCode === 'PYTHON_C') {
      return 5000;
    }
    if (packageCode === 'QA_PLACEMENT') {
      return 4500;
    }
    return Math.round((p * 1.4) / 50) * 50;
  }
  if (months <= 1) return Math.round(p);
  const multiplier = Math.pow(months, 0.76);
  return Math.round((p * multiplier) / 50) * 50;
};

export const getDiscountLabel = (months: number | null): string | null => {
  if (months === null) return 'Permanent Unlimited Access';
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

export const cleanIndianPhoneNumber = (raw: string): string => {
  let digits = (raw || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
};

export const isValidIndianPhoneNumber = (phone: string): { isValid: boolean; error?: string } => {
  const cleaned = cleanIndianPhoneNumber(phone);
  if (!cleaned) {
    return { isValid: false, error: 'Mobile number is required' };
  }
  if (cleaned.length < 10) {
    return { isValid: false, error: `Enter 10 digits (${cleaned.length}/10 entered)` };
  }
  if (cleaned.length > 10) {
    return { isValid: false, error: 'Cannot exceed 10 digits' };
  }
  if (!/^[6-9]/.test(cleaned)) {
    return { 
      isValid: false, 
      error: 'Invalid Indian number (must start with 6, 7, 8, or 9)' 
    };
  }
  if (!/^[6-9]\d{9}$/.test(cleaned)) {
    return { isValid: false, error: 'Invalid 10-digit mobile number' };
  }
  return { isValid: true };
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
  const [packageDurations, setPackageDurations] = useState<Record<string, number | null>>({});
  const [customSliderActive, setCustomSliderActive] = useState<Record<string, boolean>>({});

  const [step, setStep] = useState(1); // 1 = Packages, 2 = Details, 3 = Payment
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    collegeName: '',
    academicYear: '',
    upiId: ''
  });
  const [phoneTouched, setPhoneTouched] = useState(false);

  const phoneStatus = isValidIndianPhoneNumber(formData.phone);

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
        phone: cust.phone ? cleanIndianPhoneNumber(cust.phone) : '',
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
    const price = calculateDurationPrice(pkg.price, duration, pkg.package_code);
    const label = getDurationLabel(duration);
    
    setSelectedPackage(pkg);
    setSelectedDuration(duration);
    setSelectedPrice(price);
    setSelectedLabel(label);
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Must be logged in");

    setPhoneTouched(true);
    const phoneCheck = isValidIndianPhoneNumber(formData.phone);
    if (!phoneCheck.isValid) {
      alert("Invalid Indian Mobile Number:\n\n" + (phoneCheck.error || "Please enter a valid 10-digit Indian phone number starting with 6, 7, 8, or 9."));
      return;
    }

    const cleanPhone = cleanIndianPhoneNumber(formData.phone);

    // Upsert customer details
    const { error: custError } = await supabase.from('customers').update({
      full_name: formData.fullName.trim(),
      phone: cleanPhone,
      college_name: formData.collegeName.trim(),
      academic_year: formData.academicYear.trim()
    }).eq('user_id', user.id);

    if (custError) {
      alert("Error saving details: " + custError.message);
      return;
    }

    setFormData(prev => ({ ...prev, phone: cleanPhone }));
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.upiId.trim()) {
      alert("Please enter your UPI Transaction / UTR Reference ID.");
      return;
    }

    setSubmittingPayment(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSubmittingPayment(false);
      return;
    }

    const { data: customer } = await supabase.from('customers').select('id').eq('user_id', user.id).single();

    const { error } = await supabase.from('payments').insert({
      customer_id: customer?.id,
      package_id: selectedPackage.id,
      amount: selectedPrice,
      duration_months: selectedDuration,
      upi_transaction_id: formData.upiId.trim(),
      status: 'PENDING'
    });

    setSubmittingPayment(false);

    if (error) {
      alert("Error submitting payment: " + error.message);
    } else {
      alert("Payment submitted successfully! Your order has been placed for administrator clearance. Once verified, your license key will appear instantly on your My Licenses tab.");
      setStep(1);
      setSelectedPackage(null);
      setFormData(prev => ({ ...prev, upiId: '' }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText('phantomlead@upi');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-400 space-y-3">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-xs tracking-wider uppercase">Loading security packages...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 px-2 sm:px-4">
      {/* Checkout Progress Stepper */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#0c0d12]/90 backdrop-blur-xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                SECURITY SUITE STORE • INSTANT ISSUANCE
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Package className="w-6 h-6 text-cyan-400" />
              Hardened Safe Exam Browser Packages
            </h1>
          </div>

          {/* Stepper Pills */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
              step === 1 ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' : 'bg-black/40 border-zinc-800 text-zinc-500'
            }`}>
              <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold">1</span>
              <span>Packages</span>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
              step === 2 ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' : 'bg-black/40 border-zinc-800 text-zinc-500'
            }`}>
              <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold">2</span>
              <span>Student Profile</span>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
              step === 3 ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' : 'bg-black/40 border-zinc-800 text-zinc-500'
            }`}>
              <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold">3</span>
              <span>UPI Settlement</span>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 1: Package Grid */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Select Your Access Tier &amp; Duration
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Tailored specifically for SEB environments. Customize your license from 1 month up to 24 months, or secure Permanent Lifetime Access.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map(pkg => {
              const currentDuration = packageDurations[pkg.id] !== undefined ? packageDurations[pkg.id] : 1;
              const calculatedPrice = calculateDurationPrice(pkg.price, currentDuration, pkg.package_code);
              const discount = getDiscountLabel(currentDuration);
              const includesList = getPackageIncludes(pkg);
              const isSliderOpen = customSliderActive[pkg.id] || false;
              const isFeatured = pkg.package_code === 'FULL_ACCESS';
              const guide = packageGuides[pkg.package_code];

              return (
                <div 
                  key={pkg.id} 
                  className={`rounded-2xl flex flex-col transition-all duration-300 relative overflow-hidden group backdrop-blur-xl ${
                    isFeatured 
                      ? 'bg-gradient-to-b from-[#081024] via-[#050811] to-[#060707] border-2 border-cyan-500/60 shadow-[0_0_35px_rgba(6,182,212,0.15)] hover:border-cyan-400' 
                      : 'bg-[#0c0d12]/90 border border-zinc-800 hover:border-zinc-700 shadow-xl'
                  }`}
                >
                  {/* Featured Header Pill */}
                  {isFeatured && (
                    <div className="bg-gradient-to-r from-cyan-500 to-sky-400 py-1.5 px-4 text-center">
                      <span className="text-[10px] font-mono font-black text-black tracking-widest uppercase flex items-center justify-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> {guide?.badge || 'MOST POPULAR SUITE'}
                      </span>
                    </div>
                  )}

                  <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-6">
                    <div>
                      {/* Package Name & Code */}
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                          {pkg.package_name}
                        </h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 border border-zinc-800 text-zinc-400 font-semibold">
                          {pkg.package_code}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-400 mb-5 leading-relaxed min-h-[36px]">
                        {guide?.purpose || pkg.description}
                      </p>

                      {/* Adjustable Duration Controller Card */}
                      <div className="p-4 rounded-xl bg-black/70 border border-zinc-800/90 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-cyan-400" /> Duration
                          </span>
                          <button
                            type="button"
                            onClick={() => setCustomSliderActive(prev => ({ ...prev, [pkg.id]: !isSliderOpen }))}
                            className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <SlidersHorizontal className="w-3 h-3" />
                            {isSliderOpen ? 'Quick Pills' : 'Slider'}
                          </button>
                        </div>

                        {/* Quick Selection Pills */}
                        {!isSliderOpen ? (
                          <div className="grid grid-cols-3 gap-1.5">
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
                                  className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                                    isSelected 
                                      ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.3)]' 
                                      : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          /* Custom Slider */
                          <div className="space-y-3 pt-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-zinc-400 font-mono">Custom:</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const cur = currentDuration === null ? 1 : Math.max(1, currentDuration - 1);
                                    setPackageDurations({ ...packageDurations, [pkg.id]: cur });
                                  }}
                                  className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold"
                                >
                                  -
                                </button>
                                <span className="font-mono text-xs font-bold text-cyan-400 min-w-16 text-center">
                                  {currentDuration === null ? 'Lifetime' : `${currentDuration} Mo`}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const cur = currentDuration === null ? 1 : Math.min(24, currentDuration + 1);
                                    setPackageDurations({ ...packageDurations, [pkg.id]: cur });
                                  }}
                                  className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold"
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
                              className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
                            />

                            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                              <span>1m</span>
                              <span>6m</span>
                              <span>12m</span>
                              <span>24m</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setPackageDurations({ ...packageDurations, [pkg.id]: null })}
                              className={`w-full py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                                currentDuration === null 
                                  ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                              }`}
                            >
                              Switch to Lifetime Access
                            </button>
                          </div>
                        )}

                        {/* Discount Badge */}
                        {discount && (
                          <div className="pt-1 text-center">
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                              <Sparkles className="w-3 h-3" /> {discount}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Pricing Tag */}
                      <div className="my-5 p-3.5 rounded-xl bg-black/40 border border-zinc-800/60 flex items-baseline justify-between">
                        <div>
                          <div className="text-3xl font-black text-white tracking-tight">
                            ₹{calculatedPrice}
                          </div>
                          <span className="text-[11px] font-mono text-zinc-500">
                            {getDurationLabel(currentDuration)}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                          NODE LOCK: 1 PC
                        </span>
                      </div>

                      {/* Included Tools */}
                      <div className="space-y-2 mb-4">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">
                          Authorized Extension Modules
                        </span>
                        <div className="space-y-1.5">
                          {includesList.map((item: string) => (
                            <div key={item} className="flex items-center text-xs text-zinc-300">
                              <CheckCircle className="w-3.5 h-3.5 text-cyan-400 mr-2 shrink-0" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleBuyClick(pkg)} 
                      className={`w-full py-3 rounded-xl font-bold text-xs tracking-wider uppercase font-mono transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                        isFeatured
                          ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/25'
                          : 'bg-zinc-800 hover:bg-cyan-500 hover:text-black text-white shadow-black/40'
                      }`}
                    >
                      <span>Proceed to Purchase</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: Student Details Form */}
      {step === 2 && (
        <div className="max-w-xl mx-auto rounded-2xl border border-zinc-800 bg-[#0c0d12]/95 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <User className="w-4 h-4" /> STEP 02 • STUDENT VERIFICATION
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Customer Profile &amp; Enrollment
            </h2>
            <div className="mt-3 p-3 rounded-xl bg-black/60 border border-zinc-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-zinc-400 block font-mono text-[11px]">Selected Package:</span>
                <span className="font-bold text-white">{selectedPackage?.package_name} ({selectedLabel})</span>
              </div>
              <div className="text-right">
                <span className="text-zinc-400 block font-mono text-[11px]">Subtotal:</span>
                <span className="text-cyan-400 font-extrabold text-base">₹{selectedPrice}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" /> Full Name
              </label>
              <input 
                required 
                type="text" 
                value={formData.fullName} 
                onChange={e => setFormData({...formData, fullName: e.target.value})} 
                placeholder="e.g. John Doe"
                className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-xl focus:outline-none focus:border-cyan-500 text-white text-sm" 
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" /> Mobile Number (Indian 10-Digit)
                </label>
                {phoneStatus.isValid ? (
                  <span className="text-[11px] text-cyan-400 font-mono flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Valid
                  </span>
                ) : phoneTouched && (
                  <span className="text-[11px] text-red-400 font-mono flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {phoneStatus.error}
                  </span>
                )}
              </div>
              <div className={`relative flex rounded-xl overflow-hidden border transition-colors ${
                phoneTouched && !phoneStatus.isValid ? 'border-red-500' : 'border-zinc-800 focus-within:border-cyan-500'
              }`}>
                <div className="inline-flex items-center px-3.5 bg-zinc-900 border-r border-zinc-800 text-zinc-300 text-xs font-mono font-bold select-none gap-1.5">
                  <span>🇮🇳</span>
                  <span className="text-zinc-400">+91</span>
                </div>
                <input
                  required
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={formData.phone}
                  onBlur={() => setPhoneTouched(true)}
                  onChange={e => {
                    setPhoneTouched(true);
                    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({...formData, phone: digitsOnly});
                  }}
                  className="w-full px-4 py-2.5 bg-black text-white text-sm font-mono tracking-wider focus:outline-none"
                />
              </div>
              <span className="text-[11px] text-zinc-500 mt-1 block">
                Official Indian mobile number used for emergency license recovery.
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-cyan-400" /> College / University Name
              </label>
              <input 
                required 
                type="text" 
                value={formData.collegeName} 
                onChange={e => setFormData({...formData, collegeName: e.target.value})} 
                placeholder="e.g. National Institute of Technology"
                className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-xl focus:outline-none focus:border-cyan-500 text-white text-sm" 
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-cyan-400" /> Academic Year / Branch
              </label>
              <input 
                required 
                type="text" 
                value={formData.academicYear} 
                onChange={e => setFormData({...formData, academicYear: e.target.value})} 
                className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-xl focus:outline-none focus:border-cyan-500 text-white text-sm" 
                placeholder="e.g. 3rd Year B.Tech CSE" 
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl font-medium cursor-pointer text-xs font-mono flex items-center justify-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Packages
              </button>
              <button 
                type="submit" 
                className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl font-bold cursor-pointer text-xs font-mono uppercase tracking-wider shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>Continue to Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: UPI Payment Card */}
      {step === 3 && (
        <div className="max-w-xl mx-auto rounded-2xl border border-zinc-800 bg-[#0c0d12]/95 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2 border-b border-zinc-800/80 pb-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs">
              <CreditCard className="w-3.5 h-3.5" /> STEP 03 • SECURE UPI SETTLEMENT
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Direct UPI Payment
            </h2>
            <p className="text-xs text-zinc-400">
              Transfer the exact amount to the official merchant handle below using any UPI app (GPay, PhonePe, Paytm).
            </p>
          </div>
          
          {/* Payment Terminal Card */}
          <div className="rounded-xl border border-zinc-800 bg-black/80 p-5 space-y-4">
            <div className="text-center">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                Amount Payable
              </span>
              <div className="text-4xl font-black text-cyan-400 tracking-tight">
                ₹{selectedPrice}
              </div>
              <span className="text-xs font-mono text-zinc-500">
                {selectedPackage?.package_name} ({selectedLabel})
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-mono">Merchant UPI VPA:</span>
                <button
                  type="button"
                  onClick={copyUpiId}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-[11px] transition-colors"
                >
                  {copiedUpi ? <Check className="w-3 h-3 text-cyan-400" /> : <Copy className="w-3 h-3" />}
                  {copiedUpi ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="font-mono text-base font-bold text-white tracking-wider select-all">
                phantomlead@upi
              </div>
            </div>
          </div>

          {/* Activation Roadmap */}
          <div className="p-4 rounded-xl bg-black/60 border border-zinc-800 space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold block">
              Activation Roadmap Upon Clearance
            </span>
            <ol className="space-y-1.5 text-xs text-zinc-400">
              {installationSteps.map((stepText, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-mono text-zinc-500 shrink-0 text-[11px]">0{idx + 1}.</span>
                  <span>{stepText}</span>
                </li>
              ))}
            </ol>
          </div>

          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Paste 12-Digit UPI Ref / UTR Number
              </label>
              <input 
                required 
                type="text" 
                value={formData.upiId} 
                onChange={e => setFormData({...formData, upiId: e.target.value})} 
                className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl focus:outline-none focus:border-cyan-500 font-mono text-center text-lg text-white font-bold tracking-wider" 
                placeholder="e.g. 403819284719" 
              />
              <span className="text-[11px] text-zinc-500 mt-1 block text-center">
                Found in your payment app under "Transaction Details" or "UPI Ref ID".
              </span>
            </div>

            <div className="pt-2 flex gap-3">
              <button 
                type="button" 
                onClick={() => setStep(2)} 
                className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl font-medium cursor-pointer text-xs font-mono flex items-center justify-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button 
                type="submit" 
                disabled={submittingPayment}
                className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black rounded-xl font-bold cursor-pointer text-xs font-mono uppercase tracking-wider shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {submittingPayment ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Submit Verification</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
