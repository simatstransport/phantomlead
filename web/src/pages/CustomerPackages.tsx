import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { 
  CreditCard, 
  CheckCircle,
  Clock,
  Sparkles, 
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

export const calculateDurationPrice = (_basePrice: number, months: number | null, packageCode?: string): number => {
  // Lifetime Access (all packages: 5000 RS)
  if (months === null) {
    return 5000;
  }
  
  // 1 Month
  if (months <= 1) {
    if (packageCode === 'FULL_ACCESS') return 2000;
    return 1500;
  }
  
  // 2 Months
  if (months === 2) {
    if (packageCode === 'FULL_ACCESS') return 2500;
    return 2000;
  }
  
  // 3 Months (Maximum term)
  if (months >= 3) {
    if (packageCode === 'FULL_ACCESS') return 3000;
    return 2500;
  }

  return 2000;
};

export const getDiscountLabel = (months: number | null, packageCode?: string): string | null => {
  if (months === null) return '👑 Godmode Forever (Best Deal)';
  if (months === 1) return '🔥 Starter Sprint';
  if (months === 2) {
    if (packageCode === 'FULL_ACCESS') return '⚡ Save ₹1,500 (Campus Choice)';
    return '⚡ Save ₹1,000 (Campus Choice)';
  }
  if (months === 3) {
    if (packageCode === 'FULL_ACCESS') return '🚀 Semester Pass (Save ₹3,000)';
    return '🚀 Semester Pass (Save ₹2,000)';
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
  const [merchantUpiId, setMerchantUpiId] = useState('phantomlead@upi');
  const [merchantUpiName, setMerchantUpiName] = useState('Phantom Lead');

  const phoneStatus = isValidIndianPhoneNumber(formData.phone);

  useEffect(() => {
    fetchPackages();
    fetchCustomerProfile();
    fetchMerchantSettings();
  }, []);

  const fetchMerchantSettings = async () => {
    try {
      const { data } = await supabase
        .from('admin_settings')
        .select('key, value')
        .in('key', ['merchant_upi_id', 'merchant_upi_name']);
      
      if (data) {
        data.forEach(item => {
          if (item.key === 'merchant_upi_id' && item.value) {
            setMerchantUpiId(String(item.value).trim());
          }
          if (item.key === 'merchant_upi_name' && item.value) {
            setMerchantUpiName(String(item.value).trim());
          }
        });
      }
    } catch (e) {
      console.warn('Could not load merchant settings:', e);
    }
  };

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
      alert("Payment details submitted successfully! Your UTR reference has been recorded. Admin will manually verify the payment and approve your license shortly.");
      setStep(1);
      setSelectedPackage(null);
      setFormData(prev => ({ ...prev, upiId: '' }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(merchantUpiId || 'phantomlead@upi');
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
                ? 'bg-[#de1b1c]/15 border-[#de1b1c]/50 text-white font-bold shadow-[0_0_15px_rgba(222,27,28,0.25)]' 
                : 'bg-black/60 text-[#8a8a8a] border-white/5'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 1 ? 'bg-[#de1b1c] text-white' : 'bg-white/10 text-[#8a8a8a]'
              }`}>1</span>
              <span className="font-semibold uppercase tracking-wider text-xs">1. Select Package</span>
            </div>

            <ChevronRight className="w-4 h-4 text-[#4e4e4e]" />

            {/* Step 2 */}
            <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all ${
              step === 2 
                ? 'bg-[#de1b1c]/15 border-[#de1b1c]/50 text-white font-bold shadow-[0_0_15px_rgba(222,27,28,0.25)]' 
                : 'bg-black/60 text-[#8a8a8a] border-white/5'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 2 ? 'bg-[#de1b1c] text-white' : 'bg-white/10 text-[#8a8a8a]'
              }`}>2</span>
              <span className="font-semibold uppercase tracking-wider text-xs">2. Profile Details</span>
            </div>

            <ChevronRight className="w-4 h-4 text-[#4e4e4e]" />

            {/* Step 3 */}
            <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all ${
              step === 3 
                ? 'bg-[#de1b1c]/15 border-[#de1b1c]/50 text-white font-bold shadow-[0_0_15px_rgba(222,27,28,0.25)]' 
                : 'bg-black/60 text-[#8a8a8a] border-white/5'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 3 ? 'bg-[#de1b1c] text-white' : 'bg-white/10 text-[#8a8a8a]'
              }`}>3</span>
              <span className="font-semibold uppercase tracking-wider text-xs">3. Payment</span>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 1: Package Grid */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#de1b1c]/40 bg-[#de1b1c]/15 text-[#ededed] text-[11px] font-mono font-bold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-[#de1b1c]" />
              <span>CHOOSE YOUR PLAN</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight uppercase text-white">
              SELECT YOUR <span className="text-[#de1b1c]">EXAM PACKAGE</span>
            </h2>
            <p className="text-[#8a8a8a] text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
              Locked to your machine on activation. Choose validity up to <span className="text-white font-bold font-mono">3 Months</span> or get a <span className="text-[#de1b1c] font-bold font-mono">Permanent Lifetime Key</span>.
            </p>
          </div>
          
          {/* Balanced 2x2 Grid Layout for 4 Packages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {packages.map(pkg => {
              const currentDuration = packageDurations[pkg.id] !== undefined ? packageDurations[pkg.id] : 1;
              const calculatedPrice = calculateDurationPrice(pkg.price, currentDuration, pkg.package_code);
              const discount = getDiscountLabel(currentDuration, pkg.package_code);
              const includesList = getPackageIncludes(pkg);
              const isFeatured = pkg.package_code === 'FULL_ACCESS';
              const guide = packageGuides[pkg.package_code] || {
                purpose: pkg.description || 'Full features',
                badge: 'SPECIALIZED ACCESS',
                includes: includesList,
                theme: 'sky'
              };

              const cardClasses = isFeatured
                ? 'border-2 border-[#de1b1c] bg-[#09090b] shadow-[0_0_35px_rgba(222,27,28,0.25)]'
                : 'border border-white/10 hover:border-[#de1b1c]/50 bg-[#09090b]/80 shadow-[0_20px_40px_rgba(0,0,0,0.8)]';

              return (
                <div 
                  key={pkg.id} 
                  className={`rounded-2xl flex flex-col justify-between transition-all duration-300 relative overflow-hidden group backdrop-blur-2xl hover:-translate-y-1.5 cinema-corner-mark ${cardClasses}`}
                >
                  {/* Featured Header Ribbon */}
                  {guide.badge && (
                    <div className={`py-1.5 px-3 text-center ${isFeatured ? 'bg-[#de1b1c] text-white font-bold' : 'bg-black/80 text-[#8a8a8a] border-b border-white/10'}`}>
                      <span className="text-[10px] font-cinematic font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-1.5">
                        {isFeatured ? <Sparkles className="w-3.5 h-3.5 text-white" /> : <Zap className="w-3 h-3 text-[#de1b1c]" />}
                        {guide.badge}
                      </span>
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                    <div>
                      {/* Package Name & Code */}
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-2xl font-display uppercase tracking-wide text-white">
                          {pkg.package_name}
                        </h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg border border-white/15 bg-black/60 text-[#ededed] font-semibold">
                          {pkg.package_code}
                        </span>
                      </div>

                      <p className="text-xs text-[#8a8a8a] mb-5 leading-relaxed min-h-[38px]">
                        {guide.purpose || pkg.description}
                      </p>

                      {/* Clean 4-Button Term Selector (Max 3 Mos + Lifetime) */}
                      <div className="p-3.5 rounded-xl bg-black/70 border border-white/10 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-cinematic uppercase tracking-wider font-bold text-[#ededed] flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#de1b1c]" /> SELECT TERM
                          </span>
                          <span className="text-[10px] font-mono text-[#8a8a8a]">
                            Max 3 Mo or ∞
                          </span>
                        </div>

                        {/* Direct 4 Option Buttons: 1 Mo, 2 Mos, 3 Mos, ∞ Lifetime */}
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { value: 1, label: '1 MO', desc: 'Sprint' },
                            { value: 2, label: '2 MOS', desc: 'Mid-Sem' },
                            { value: 3, label: '3 MOS', desc: 'Semester' },
                            { value: null, label: '∞ LIFETIME', desc: 'Permanent' },
                          ].map(opt => {
                            const isSelected = currentDuration === opt.value;
                            return (
                              <button
                                key={opt.label}
                                type="button"
                                onClick={() => setPackageDurations({ ...packageDurations, [pkg.id]: opt.value })}
                                className={`py-2 px-2.5 rounded-lg text-left transition-all cursor-pointer flex flex-col justify-center ${
                                  isSelected 
                                    ? 'bg-[#de1b1c] text-white shadow-[0_0_15px_rgba(222,27,28,0.4)] scale-[1.02]' 
                                    : 'bg-black/60 text-[#8a8a8a] hover:text-white hover:bg-white/[0.06] border border-white/5'
                                }`}
                              >
                                <span className="font-cinematic text-xs font-bold leading-none">{opt.label}</span>
                                <span className={`text-[9px] font-mono mt-0.5 ${isSelected ? 'text-white/80' : 'text-[#8a8a8a]'}`}>{opt.desc}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Discount Badge */}
                        {discount && (
                          <div className="pt-1 text-center">
                            <span className="inline-flex items-center gap-1 text-[11px] font-cinematic uppercase tracking-wider font-bold px-3 py-0.5 rounded-full border border-[#de1b1c]/40 bg-[#de1b1c]/15 text-[#ff2a2b]">
                              <Sparkles className="w-3 h-3" /> {discount}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Pricing Tag */}
                      <div className="my-5 p-4 rounded-xl bg-black/70 border border-white/10 flex items-baseline justify-between">
                        <div>
                          <div className="text-3xl font-display uppercase tracking-wider text-white">
                            ₹{calculatedPrice}
                          </div>
                          <span className="text-[11px] font-mono text-[#8a8a8a]">
                            {getDurationLabel(currentDuration)}
                          </span>
                        </div>
                        <span className="text-[10px] font-cinematic uppercase tracking-wider px-2.5 py-1 rounded-lg bg-black border border-[#de1b1c]/40 text-[#de1b1c] font-bold">
                          1 NODE LOCK
                        </span>
                      </div>

                      {/* Included Tools */}
                      <div className="space-y-2.5 mb-4">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#8a8a8a] block font-bold">
                          INCLUDED ASSISTANTS
                        </span>
                        <div className="space-y-2">
                          {includesList.map((item: string) => (
                            <div key={item} className="flex items-center text-xs text-[#ededed]">
                              <CheckCircle className="w-4 h-4 mr-2 shrink-0 text-[#de1b1c]" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleBuyClick(pkg)} 
                      className="w-full py-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 bg-[#de1b1c] hover:bg-[#ff2a2b] text-white shadow-md"
                    >
                      <span>SELECT PACKAGE</span>
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
                className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-white rounded-xl font-bold cursor-pointer text-xs font-mono uppercase tracking-wider shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
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
                  <QrCode className="w-4 h-4 text-cyan-400" /> Direct Merchant VPA {merchantUpiName ? `(${merchantUpiName})` : ''}:
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
                {merchantUpiId || 'phantomlead@upi'}
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
