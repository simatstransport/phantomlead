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
  ChevronRight,
  Zap,
  ShieldCheck,
  QrCode
} from 'lucide-react';

const packageGuides: Record<string, { purpose: string; badge: string; includes: string[]; theme: 'violet' | 'emerald' | 'amber' | 'sky' }> = {
  FULL_ACCESS: {
    purpose: 'Complete all-in-one suite with all 6 specialized assistants for LMS MCQs, Visual Reasoning, Viva, Java, Python, and C.',
    badge: 'COMMAND SUITE • MOST POPULAR',
    includes: ['LMS MCQ Helper', 'LMS Reasoning MCQ Helper', 'Viva Paragraph Explainer', 'Java Coding Helper', 'Python 3 Coding Helper', 'C Coding Helper'],
    theme: 'violet'
  },
  PYTHON_C: {
    purpose: 'Engineered for students practicing Python and C programming with AI answer and code assistance.',
    badge: 'DEVELOPER DUO • PYTHON & C',
    includes: ['Python 3 Coding Helper', 'C Coding Helper'],
    theme: 'emerald'
  },
  JAVA_VIVA: {
    purpose: 'For students practicing Java programming and preparing for oral viva voce questions.',
    badge: 'JAVA & ORAL EXAM SUITE',
    includes: ['Java Coding Helper', 'Viva Paragraph Explainer'],
    theme: 'amber'
  },
  QA_PLACEMENT: {
    purpose: 'For LMS-based multiple-choice practice and QA or campus placement assessment rounds.',
    badge: 'MCQ & APTITUDE ROUNDS',
    includes: ['LMS MCQ Helper', 'LMS Reasoning MCQ Helper'],
    theme: 'sky'
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
  if (months === null) return 'Permanent Lifetime Access';
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
    return { isValid: false, error: 'Phone number is required' };
  }
  if (cleaned.length < 10) {
    return { isValid: false, error: `Enter complete 10-digit number (${cleaned.length}/10 entered)` };
  }
  if (cleaned.length > 10) {
    return { isValid: false, error: 'Enter only 10 digits (without +91/0 prefix)' };
  }
  const firstDigit = cleaned.charAt(0);
  if (!['6', '7', '8', '9'].includes(firstDigit)) {
    return { isValid: false, error: 'Must begin with 6, 7, 8, or 9 for Indian mobile numbers' };
  }
  return { isValid: true };
};

export const CustomerPackages = () => {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [packageDurations, setPackageDurations] = useState<Record<string, number | null>>({});
  const [customSliderActive, setCustomSliderActive] = useState<Record<string, boolean>>({});

  const [step, setStep] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(1);
  const [selectedPrice, setSelectedPrice] = useState<number>(0);
  const [selectedLabel, setSelectedLabel] = useState<string>('1 Month');

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    collegeName: '',
    academicYear: '',
    upiId: ''
  });

  const [phoneTouched, setPhoneTouched] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const phoneStatus = isValidIndianPhoneNumber(formData.phone);

  useEffect(() => {
    fetchPackages();
    fetchCustomerProfile();
  }, []);

  const fetchPackages = async () => {
    const { data } = await supabase.from('packages').select('*').order('price', { ascending: true });
    if (data) {
      setPackages(data);
      const initialDurations: Record<string, number | null> = {};
      data.forEach(pkg => {
        initialDurations[pkg.id] = 1;
      });
      setPackageDurations(initialDurations);
    }
    setLoading(false);
  };

  const fetchCustomerProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (customer) {
        setFormData(prev => ({
          ...prev,
          fullName: customer.full_name || '',
          phone: cleanIndianPhoneNumber(customer.phone || ''),
          collegeName: customer.college_name || '',
          academicYear: customer.academic_year || ''
        }));
      }
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
    setPhoneTouched(true);

    const validation = isValidIndianPhoneNumber(formData.phone);
    if (!validation.isValid) {
      alert(`Invalid Phone Number: ${validation.error}`);
      return;
    }

    const cleanPhone = cleanIndianPhoneNumber(formData.phone);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingCustomer) {
      await supabase.from('customers').update({
        full_name: formData.fullName,
        phone: cleanPhone,
        college_name: formData.collegeName,
        academic_year: formData.academicYear
      }).eq('id', existingCustomer.id);
    } else {
      await supabase.from('customers').insert({
        user_id: user.id,
        full_name: formData.fullName,
        phone: cleanPhone,
        college_name: formData.collegeName,
        academic_year: formData.academicYear
      });
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
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 space-y-4">
        <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(6,182,212,0.4)]" />
        <p className="font-mono text-xs tracking-wider uppercase text-cyan-300">Loading security packages...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 px-2 sm:px-4">
      {/* Checkout Progress Stepper with Multi-Color Badges */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-5 sm:p-7 shadow-2xl border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-300 font-bold">
                SECURITY SUITE STORE • INSTANT CLEARANCE
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Package className="w-6 h-6 text-cyan-400" />
              Hardened Safe Exam Browser <span className="text-gradient-rainbow">Access Packages</span>
            </h1>
          </div>

          {/* Stepper Pills */}
          <div className="flex items-center gap-2 text-xs font-mono">
            {/* Step 1 */}
            <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all ${
              step === 1 
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-400/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                : 'glass-panel text-slate-400 border-white/5'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 1 ? 'bg-emerald-400 text-black' : 'bg-slate-800 text-slate-400'
              }`}>1</span>
              <span className="font-semibold">Packages</span>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-600" />

            {/* Step 2 */}
            <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all ${
              step === 2 
                ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/50 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]' 
                : 'glass-panel text-slate-400 border-white/5'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 2 ? 'bg-purple-400 text-black' : 'bg-slate-800 text-slate-400'
              }`}>2</span>
              <span className="font-semibold">Profile</span>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-600" />

            {/* Step 3 */}
            <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all ${
              step === 3 
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-400/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                : 'glass-panel text-slate-400 border-white/5'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 3 ? 'bg-emerald-400 text-black' : 'bg-slate-800 text-slate-400'
              }`}>3</span>
              <span className="font-semibold">UPI Payment</span>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 1: Package Grid */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Select Your <span className="text-gradient-rainbow">Access Tier &amp; Duration</span>
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Tailored specifically for SEB environments. Customize your license from 1 month up to 24 months, or secure Permanent Lifetime Access.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map(pkg => {
              const currentDuration = packageDurations[pkg.id] !== undefined ? packageDurations[pkg.id] : 1;
              const calculatedPrice = calculateDurationPrice(pkg.price, currentDuration, pkg.package_code);
              const discount = getDiscountLabel(currentDuration);
              const includesList = getPackageIncludes(pkg);
              const isSliderOpen = customSliderActive[pkg.id] || false;
              const isFeatured = pkg.package_code === 'FULL_ACCESS';
              const guide = packageGuides[pkg.package_code] || {
                purpose: pkg.description || 'Full features',
                badge: 'SPECIALIZED ACCESS',
                includes: includesList,
                theme: 'sky'
              };

              // Determine styling based on package theme
              const themeStyles = {
                violet: {
                  card: 'border-2 border-purple-500/70 hover:border-pink-400 bg-gradient-to-b from-purple-950/40 via-[#0d1029]/90 to-[#070918] shadow-[0_0_35px_rgba(168,85,247,0.25)]',
                  badge: 'bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 text-white',
                  btn: 'bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/30',
                  accent: 'text-purple-400',
                  tagBg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
                  check: 'text-pink-400',
                },
                emerald: {
                  card: 'border border-emerald-500/40 hover:border-emerald-400 bg-gradient-to-b from-emerald-950/30 via-[#091514]/90 to-[#050b0a] shadow-[0_0_25px_rgba(16,185,129,0.15)]',
                  badge: 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black',
                  btn: 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25',
                  accent: 'text-emerald-400',
                  tagBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                  check: 'text-emerald-400',
                },
                amber: {
                  card: 'border border-amber-500/40 hover:border-amber-400 bg-gradient-to-b from-amber-950/30 via-[#181109]/90 to-[#0c0804] shadow-[0_0_25px_rgba(245,158,11,0.15)]',
                  badge: 'bg-gradient-to-r from-amber-500 to-orange-400 text-black',
                  btn: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold shadow-lg shadow-amber-500/25',
                  accent: 'text-amber-400',
                  tagBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                  check: 'text-amber-400',
                },
                sky: {
                  card: 'border border-sky-500/40 hover:border-sky-400 bg-gradient-to-b from-sky-950/30 via-[#0a1224]/90 to-[#050a14] shadow-[0_0_25px_rgba(56,189,248,0.15)]',
                  badge: 'bg-gradient-to-r from-sky-400 to-blue-500 text-black',
                  btn: 'bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-black font-extrabold shadow-lg shadow-sky-500/25',
                  accent: 'text-sky-400',
                  tagBg: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
                  check: 'text-sky-400',
                }
              }[guide.theme] || {
                card: 'glass-panel border-white/10 hover:border-emerald-500/30',
                badge: 'bg-emerald-500 text-black',
                btn: 'bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold shadow-lg shadow-emerald-500/25',
                accent: 'text-emerald-400',
                tagBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                check: 'text-emerald-400',
              };

              return (
                <div 
                  key={pkg.id} 
                  className={`rounded-3xl flex flex-col justify-between transition-all duration-300 relative overflow-hidden group backdrop-blur-2xl hover:-translate-y-1 ${themeStyles.card}`}
                >
                  {/* Featured Header Ribbon */}
                  {guide.badge && (
                    <div className={`py-1.5 px-3 text-center ${themeStyles.badge}`}>
                      <span className="text-[10px] font-mono font-black tracking-widest uppercase flex items-center justify-center gap-1.5">
                        {isFeatured ? <Sparkles className="w-3.5 h-3.5" /> : <Zap className="w-3 h-3" />}
                        {guide.badge}
                      </span>
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                    <div>
                      {/* Package Name & Code */}
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-black text-white tracking-tight">
                          {pkg.package_name}
                        </h3>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border font-semibold ${themeStyles.tagBg}`}>
                          {pkg.package_code}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 mb-5 leading-relaxed min-h-[38px]">
                        {guide.purpose || pkg.description}
                      </p>

                      {/* Adjustable Duration Controller Card */}
                      <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className={`w-3.5 h-3.5 ${themeStyles.accent}`} /> Term Duration
                          </span>
                          <button
                            type="button"
                            onClick={() => setCustomSliderActive(prev => ({ ...prev, [pkg.id]: !isSliderOpen }))}
                            className={`text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors ${themeStyles.accent} hover:underline`}
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
                              { value: null, label: '∞ Life' },
                            ].map(opt => {
                              const isSelected = currentDuration === opt.value;
                              return (
                                <button
                                  key={opt.label}
                                  type="button"
                                  onClick={() => setPackageDurations({ ...packageDurations, [pkg.id]: opt.value })}
                                  className={`py-1.5 px-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                                    isSelected 
                                      ? `${themeStyles.btn} shadow-md` 
                                      : 'glass-panel text-slate-400 hover:text-white hover:bg-slate-800'
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
                              <span className="text-slate-400 font-mono">Custom:</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const cur = currentDuration === null ? 1 : Math.max(1, currentDuration - 1);
                                    setPackageDurations({ ...packageDurations, [pkg.id]: cur });
                                  }}
                                  className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
                                >
                                  -
                                </button>
                                <span className={`font-mono text-xs font-bold min-w-16 text-center ${themeStyles.accent}`}>
                                  {currentDuration === null ? 'Lifetime' : `${currentDuration} Mo`}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const cur = currentDuration === null ? 1 : Math.min(24, currentDuration + 1);
                                    setPackageDurations({ ...packageDurations, [pkg.id]: cur });
                                  }}
                                  className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
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
                              className="w-full cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none accent-purple-500"
                            />

                            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                              <span>1m</span>
                              <span>6m</span>
                              <span>12m</span>
                              <span>24m</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setPackageDurations({ ...packageDurations, [pkg.id]: null })}
                              className={`w-full py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                                currentDuration === null 
                                  ? `${themeStyles.btn}` 
                                  : 'glass-panel text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              Switch to Lifetime Access
                            </button>
                          </div>
                        )}

                        {/* Discount Badge */}
                        {discount && (
                          <div className="pt-1 text-center">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-3 py-0.5 rounded-full border ${themeStyles.tagBg}`}>
                              <Sparkles className="w-3 h-3" /> {discount}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Pricing Tag */}
                      <div className="my-5 p-4 rounded-2xl bg-black/60 border border-white/10 flex items-baseline justify-between">
                        <div>
                          <div className="text-3xl font-black text-white tracking-tight">
                            ₹{calculatedPrice}
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">
                            {getDurationLabel(currentDuration)}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-slate-300">
                          NODE LOCK: 1 PC
                        </span>
                      </div>

                      {/* Included Tools */}
                      <div className="space-y-2.5 mb-4">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
                          Authorized Extension Modules
                        </span>
                        <div className="space-y-2">
                          {includesList.map((item: string) => (
                            <div key={item} className="flex items-center text-xs text-slate-200">
                              <CheckCircle className={`w-4 h-4 mr-2 shrink-0 ${themeStyles.check}`} />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleBuyClick(pkg)} 
                      className={`w-full py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase font-mono transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${themeStyles.btn}`}
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
        <div className="max-w-xl mx-auto rounded-3xl glass-panel p-6 sm:p-8 shadow-2xl border border-white/15 space-y-6">
          <div className="border-b border-white/10 pb-5">
            <div className="flex items-center gap-2 text-xs font-mono text-purple-400 mb-1.5">
              <User className="w-4 h-4" /> STEP 02 • STUDENT VERIFICATION
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Customer Profile &amp; Enrollment
            </h2>
            <div className="mt-3.5 p-4 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block font-mono text-[11px]">Selected Package:</span>
                <span className="font-bold text-white text-sm">{selectedPackage?.package_name} ({selectedLabel})</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block font-mono text-[11px]">Payable Total:</span>
                <span className="text-emerald-400 font-black text-lg">₹{selectedPrice}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" /> Full Name
              </label>
              <input 
                required 
                type="text" 
                value={formData.fullName} 
                onChange={e => setFormData({...formData, fullName: e.target.value})} 
                placeholder="e.g. John Doe"
                className="w-full px-4 py-3 bg-slate-950/80 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 text-white text-sm font-mono transition-all" 
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" /> Mobile Number (Indian 10-Digit)
                </label>
                {phoneStatus.isValid ? (
                  <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Valid
                  </span>
                ) : phoneTouched && (
                  <span className="text-[11px] text-rose-400 font-mono flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {phoneStatus.error}
                  </span>
                )}
              </div>
              <div className={`relative flex rounded-xl overflow-hidden border transition-all ${
                phoneTouched && !phoneStatus.isValid ? 'border-rose-500' : 'border-white/10 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/30'
              }`}>
                <div className="inline-flex items-center px-4 bg-slate-900 border-r border-white/10 text-slate-300 text-xs font-mono font-bold select-none gap-1.5">
                  <span>🇮🇳</span>
                  <span className="text-slate-400">+91</span>
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
                  className="w-full px-4 py-3 bg-slate-950/80 text-white text-sm font-mono tracking-wider focus:outline-none"
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Official Indian mobile number used for emergency license recovery.
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-blue-400" /> College / University Name
              </label>
              <input 
                required 
                type="text" 
                value={formData.collegeName} 
                onChange={e => setFormData({...formData, collegeName: e.target.value})} 
                placeholder="e.g. National Institute of Technology"
                className="w-full px-4 py-3 bg-slate-950/80 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 text-white text-sm font-mono transition-all" 
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-pink-400" /> Academic Year / Branch
              </label>
              <input 
                required 
                type="text" 
                value={formData.academicYear} 
                onChange={e => setFormData({...formData, academicYear: e.target.value})} 
                className="w-full px-4 py-3 bg-slate-950/80 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-400 text-white text-sm font-mono transition-all" 
                placeholder="e.g. 3rd Year B.Tech CSE" 
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="flex-1 py-3.5 glass-panel hover:bg-slate-800 border border-white/10 rounded-xl font-medium cursor-pointer text-xs font-mono flex items-center justify-center gap-2 transition-colors text-slate-300"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Packages
              </button>
              <button 
                type="submit" 
                className="flex-1 py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold cursor-pointer text-xs font-mono uppercase tracking-wider shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
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
        <div className="max-w-xl mx-auto rounded-3xl glass-panel p-6 sm:p-8 shadow-2xl border border-white/15 space-y-6">
          <div className="text-center space-y-2 border-b border-white/10 pb-5">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold">
              <CreditCard className="w-4 h-4" /> STEP 03 • SECURE UPI SETTLEMENT
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Direct UPI Payment Terminal
            </h2>
            <p className="text-xs text-slate-400">
              Transfer the exact amount to the official merchant handle below using any UPI app (GPay, PhonePe, Paytm).
            </p>
          </div>
          
          {/* Payment Terminal Card */}
          <div className="rounded-2xl border border-white/10 bg-black/60 p-6 space-y-5">
            <div className="text-center">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                Amount Payable
              </span>
              <div className="text-4xl font-black text-emerald-400 tracking-tight font-mono">
                ₹{selectedPrice}
              </div>
              <span className="text-xs font-mono text-slate-400 mt-0.5 block">
                {selectedPackage?.package_name} ({selectedLabel})
              </span>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-cyan-400" /> Merchant UPI VPA:
                </span>
                <button
                  type="button"
                  onClick={copyUpiId}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-mono text-xs font-bold transition-colors cursor-pointer border border-cyan-500/30"
                >
                  {copiedUpi ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedUpi ? 'Copied VPA' : 'Copy VPA'}
                </button>
              </div>
              <div className="font-mono text-lg font-bold text-white tracking-wider select-all text-center py-1">
                phantomlead@upi
              </div>
            </div>
          </div>

          {/* Activation Roadmap */}
          <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-2.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-300 font-bold block flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" /> Activation Roadmap Upon Clearance
            </span>
            <ol className="space-y-1.5 text-xs text-slate-300">
              {installationSteps.map((stepText, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-mono text-cyan-400 font-bold shrink-0 text-[11px]">0{idx + 1}.</span>
                  <span>{stepText}</span>
                </li>
              ))}
            </ol>
          </div>

          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 text-center">
                Paste 12-Digit UPI Ref / UTR Number
              </label>
              <input 
                required 
                type="text" 
                value={formData.upiId} 
                onChange={e => setFormData({...formData, upiId: e.target.value})} 
                className="w-full px-4 py-3 bg-slate-950/80 border border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 font-mono text-center text-lg text-white font-bold tracking-wider transition-all" 
                placeholder="e.g. 403819284719" 
              />
              <span className="text-[11px] text-slate-500 mt-1.5 block text-center">
                Found in your payment app under "Transaction Details" or "UPI Ref ID".
              </span>
            </div>

            <div className="pt-2 flex gap-3">
              <button 
                type="button" 
                onClick={() => setStep(2)} 
                className="flex-1 py-3.5 glass-panel hover:bg-slate-800 border border-white/10 rounded-xl font-medium cursor-pointer text-xs font-mono flex items-center justify-center gap-2 transition-colors text-slate-300"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button 
                type="submit" 
                disabled={submittingPayment}
                className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-50 text-white rounded-xl font-bold cursor-pointer text-xs font-mono uppercase tracking-wider shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {submittingPayment ? (
                  <span>Verifying Transaction...</span>
                ) : (
                  <>
                    <span>Submit Payment Proof</span>
                    <ArrowRight className="w-4 h-4" />
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
