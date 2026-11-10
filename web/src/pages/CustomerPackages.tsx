import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { 
  CreditCard, 
  CheckCircle2,
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
  ShieldCheck,
  Lock
} from 'lucide-react';

const packageGuides: Record<string, { purpose: string; badge: string; includes: string[]; highlight?: boolean }> = {
  FULL_ACCESS: {
    purpose: 'Complete all-in-one assistant bundle with all 6 tools for MCQs, reasoning, viva, and multi-language programming.',
    badge: 'Most Popular • All-in-One Suite',
    includes: ['LMS MCQ Helper', 'LMS Reasoning MCQ Helper', 'Viva Paragraph Explainer', 'Java Coding Helper', 'Python 3 Coding Helper', 'C Coding Helper'],
    highlight: true
  },
  JAVA_QA: {
    purpose: 'Specialized bundle combining Java programming, oral viva answers, and automated LMS multiple-choice helpers.',
    badge: 'Recommended for Java & Aptitude',
    includes: ['Java Coding Helper', 'Viva Paragraph Explainer', 'LMS MCQ Helper'],
    highlight: false
  },
  QA_PLACEMENT: {
    purpose: 'Engineered specifically for automated LMS multiple-choice questions, visual reasoning, and campus aptitude rounds.',
    badge: 'Aptitude & MCQ Rounds',
    includes: ['LMS MCQ Helper', 'LMS Reasoning MCQ Helper'],
    highlight: false
  },
  PYTHON_C: {
    purpose: 'Focused coding assistants for Python 3 and C programming courses, lab tests, and debugging assistance.',
    badge: 'Developer Duo',
    includes: ['Python 3 Coding Helper', 'C Coding Helper'],
    highlight: false
  },
  JAVA_VIVA: {
    purpose: 'Tailored for core Java laboratory exams, code writing, and automated technical viva voce paragraph explanations.',
    badge: 'Java Lab & Viva Prep',
    includes: ['Java Coding Helper', 'Viva Paragraph Explainer'],
    highlight: false
  }
};

const installationSteps = [
  'Once payment is verified, your license key appears instantly in your dashboard.',
  'Download your edition-matched SecureInstaller.exe directly from the Licenses tab.',
  'Run the installer, paste your license key and Gemini API key, and complete setup in under 60 seconds.'
];

export const calculateDurationPrice = (
  basePrice: number, 
  months: number | null, 
  packageCode?: string,
  customPricingMap?: Record<string, Record<string, number>>
): number => {
  // Check if admin has set custom pricing in admin_settings
  if (customPricingMap && packageCode && customPricingMap[packageCode]) {
    const pkgRates = customPricingMap[packageCode];
    if (months === null && pkgRates['lifetime'] !== undefined) {
      return Number(pkgRates['lifetime']);
    }
    if (months !== null && pkgRates[String(months)] !== undefined) {
      return Number(pkgRates[String(months)]);
    }
  }

  // Fallback defaults
  if (months === null) {
    return 5000;
  }
  
  const bp = Number(basePrice) || 2000;
  if (months <= 1) {
    if (bp > 0) return bp;
    if (packageCode === 'FULL_ACCESS' || packageCode === 'JAVA_QA') return 2000;
    return 1500;
  }
  
  if (months === 2) {
    if (packageCode === 'JAVA_QA') return 2800;
    if (packageCode === 'FULL_ACCESS') return 2500;
    return Math.round(bp * 1.35 / 50) * 50;
  }
  
  if (months >= 3) {
    if (packageCode === 'JAVA_QA') return 3500;
    if (packageCode === 'FULL_ACCESS') return 3000;
    return Math.round(bp * 1.7 / 50) * 50;
  }

  return bp;
};

export const getDiscountLabel = (months: number | null, packageCode?: string): string | null => {
  if (months === null) return 'Best Value • Permanent Access';
  if (months === 1) return 'Starter Plan • 30 Days';
  if (months === 2) {
    if (packageCode === 'JAVA_QA') return 'Save ₹1,200 • Popular Choice';
    if (packageCode === 'FULL_ACCESS') return 'Save ₹1,500 • High Value';
    return 'Save ₹1,000 • 60 Days';
  }
  if (months === 3) {
    if (packageCode === 'JAVA_QA') return 'Semester Pass • Save ₹2,500';
    if (packageCode === 'FULL_ACCESS') return 'Semester Pass • Save ₹3,000';
    return 'Semester Pass • Save ₹2,000';
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
  const [customPricingMap, setCustomPricingMap] = useState<Record<string, Record<string, number>>>({});

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
        .in('key', ['merchant_upi_id', 'merchant_upi_name', 'custom_package_pricing']);
      
      if (data) {
        data.forEach(item => {
          if (item.key === 'merchant_upi_id' && item.value) {
            setMerchantUpiId(String(item.value).trim());
          }
          if (item.key === 'merchant_upi_name' && item.value) {
            setMerchantUpiName(String(item.value).trim());
          }
          if (item.key === 'custom_package_pricing' && item.value && typeof item.value === 'object') {
            setCustomPricingMap(item.value);
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
    const price = calculateDurationPrice(pkg.price, duration, pkg.package_code, customPricingMap);
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

  // UPI payment URI for QR code
  const upiPayUri = `upi://pay?pa=${encodeURIComponent(merchantUpiId || 'phantomlead@upi')}&pn=${encodeURIComponent(merchantUpiName || 'Phantom Lead')}&am=${selectedPrice}&cu=INR&tn=${encodeURIComponent(`License - ${selectedPackage?.package_code || 'Package'}`)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(upiPayUri)}`;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 space-y-4">
        <div className="w-9 h-9 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-xs tracking-wider uppercase text-slate-400">Loading packages...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 px-3 sm:px-6">
      {/* Header & Clean Stepper */}
      <div className="relative rounded-2xl bg-slate-900/70 border border-white/10 p-5 sm:p-6 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Official Student License Portal</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-400 shrink-0" />
              Exam Assistant Packages
            </h1>
            <p className="text-xs text-slate-400">
              Select your required tool bundle, duration, and complete verification for instant license issuance.
            </p>
          </div>

          {/* Minimalist 3-Step Progress Indicator */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-mono">
            {/* Step 1 */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
              step === 1 
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold shadow-sm' 
                : step > 1
                ? 'bg-slate-800/60 border-white/10 text-slate-300'
                : 'bg-slate-900/60 border-white/5 text-slate-500'
            }`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                step > 1 ? 'bg-emerald-500 text-slate-950 font-bold' : step === 1 ? 'bg-emerald-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
              }`}>
                {step > 1 ? '✓' : '1'}
              </span>
              <span className="font-semibold text-xs">Plan</span>
            </div>

            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />

            {/* Step 2 */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
              step === 2 
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold shadow-sm' 
                : step > 2
                ? 'bg-slate-800/60 border-white/10 text-slate-300'
                : 'bg-slate-900/60 border-white/5 text-slate-500'
            }`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                step > 2 ? 'bg-emerald-500 text-slate-950 font-bold' : step === 2 ? 'bg-emerald-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
              }`}>
                {step > 2 ? '✓' : '2'}
              </span>
              <span className="font-semibold text-xs">Profile</span>
            </div>

            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />

            {/* Step 3 */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
              step === 3 
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold shadow-sm' 
                : 'bg-slate-900/60 border-white/5 text-slate-500'
            }`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                step === 3 ? 'bg-emerald-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
              }`}>
                3
              </span>
              <span className="font-semibold text-xs">Payment</span>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 1: Package Grid */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Choose the Right Plan for Your Exams
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Licenses lock to your laptop on first activation. Choose 1 to 3 months for exam terms or get permanent lifetime access.
            </p>
          </div>
          
          {/* Balanced 2-Column Responsive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {packages.map(pkg => {
              const currentDuration = packageDurations[pkg.id] !== undefined ? packageDurations[pkg.id] : 1;
              const calculatedPrice = calculateDurationPrice(pkg.price, currentDuration, pkg.package_code, customPricingMap);
              const discount = getDiscountLabel(currentDuration, pkg.package_code);
              const includesList = getPackageIncludes(pkg);
              const isFeatured = pkg.package_code === 'FULL_ACCESS';
              const guide = packageGuides[pkg.package_code] || {
                purpose: pkg.description || 'Full features',
                badge: 'Specialized Access',
                includes: includesList,
                highlight: false
              };

              return (
                <div 
                  key={pkg.id} 
                  className={`rounded-2xl flex flex-col justify-between transition-all duration-200 relative overflow-hidden backdrop-blur-xl ${
                    isFeatured
                      ? 'bg-slate-900/90 border-2 border-emerald-500/60 shadow-[0_0_35px_rgba(16,185,129,0.12)]'
                      : 'bg-slate-900/60 border border-white/10 hover:border-slate-700 hover:bg-slate-900/80 shadow-lg'
                  }`}
                >
                  {/* Top Badge Ribbon */}
                  {guide.badge && (
                    <div className={`py-1.5 px-4 text-center border-b ${
                      isFeatured 
                        ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300 font-semibold' 
                        : 'bg-slate-950/60 border-white/5 text-slate-400'
                    }`}>
                      <span className="text-[11px] font-mono tracking-wider uppercase flex items-center justify-center gap-1.5">
                        {isFeatured && <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        {guide.badge}
                      </span>
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      {/* Package Name & Code */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="text-xl font-bold text-white tracking-tight">
                            {pkg.package_name}
                          </h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-white/10 bg-slate-950/80 text-slate-300 font-medium shrink-0">
                            {pkg.package_code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                          {guide.purpose || pkg.description}
                        </p>
                      </div>

                      {/* Professional 4-Tab Duration Switcher */}
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-300 font-medium flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-emerald-400" /> Validity Term
                          </span>
                          <span className="text-slate-400 text-[10px]">
                            {currentDuration === null ? 'Permanent Key' : `${currentDuration} Month${currentDuration > 1 ? 's' : ''}`}
                          </span>
                        </div>

                        {/* Segmented Control Buttons */}
                        <div className="grid grid-cols-4 gap-1 p-1 bg-black/40 rounded-lg border border-white/5">
                          {[
                            { value: 1, label: '1 Mo', sub: 'Sprint' },
                            { value: 2, label: '2 Mos', sub: 'Popular' },
                            { value: 3, label: '3 Mos', sub: 'Semester' },
                            { value: null, label: 'Lifetime', sub: 'Forever' },
                          ].map(opt => {
                            const isSelected = currentDuration === opt.value;
                            return (
                              <button
                                key={opt.label}
                                type="button"
                                onClick={() => setPackageDurations({ ...packageDurations, [pkg.id]: opt.value })}
                                className={`py-2 px-1 rounded-md text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                                  isSelected 
                                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20' 
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                              >
                                <span className="text-xs font-bold leading-tight">{opt.label}</span>
                                <span className={`text-[9px] font-mono leading-tight mt-0.5 ${isSelected ? 'text-slate-900/80 font-medium' : 'text-slate-500'}`}>
                                  {opt.sub}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Price Display */}
                      <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 flex items-baseline justify-between">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
                              ₹{calculatedPrice.toLocaleString('en-IN')}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              / {currentDuration ? `${currentDuration} mo${currentDuration > 1 ? 's' : ''}` : 'lifetime'}
                            </span>
                          </div>
                          {discount && (
                            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
                              <Sparkles className="w-3 h-3 shrink-0" />
                              {discount}
                            </span>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-slate-800 text-slate-300 border border-white/10 flex items-center gap-1">
                            <Lock className="w-3 h-3 text-emerald-400" /> 1 Device Lock
                          </span>
                        </div>
                      </div>

                      {/* Included Assistants List */}
                      <div className="space-y-2 pt-1">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                          Included Assistants ({includesList.length})
                        </span>
                        <div className="space-y-1.5">
                          {includesList.map((item: string) => (
                            <div key={item} className="flex items-center text-xs text-slate-300 gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="font-medium">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button 
                      type="button"
                      onClick={() => handleBuyClick(pkg)} 
                      className={`w-full py-3 px-4 rounded-xl font-bold text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                        isFeatured
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25'
                          : 'bg-white/10 hover:bg-white/15 text-white border border-white/10 hover:border-white/20'
                      }`}
                    >
                      <span>Choose {pkg.package_name}</span>
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
        <div className="max-w-xl mx-auto rounded-2xl bg-slate-900/80 border border-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="border-b border-white/10 pb-5 space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-semibold">
              <User className="w-4 h-4" /> Step 2 • Student Verification
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Customer Details &amp; Registration
            </h2>
            <p className="text-xs text-slate-400">
              Provide your details so the system can verify payment and associate your hardware license key.
            </p>

            {/* Selected Package Summary Pill */}
            <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block font-mono text-[11px]">Selected Plan:</span>
                <span className="font-bold text-white text-sm">{selectedPackage?.package_name} ({selectedLabel})</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block font-mono text-[11px]">Total Payable:</span>
                <span className="text-emerald-400 font-bold text-lg font-mono">₹{selectedPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Full Name
              </label>
              <input 
                required 
                type="text" 
                value={formData.fullName} 
                onChange={e => setFormData({...formData, fullName: e.target.value})} 
                placeholder="e.g. John Doe"
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 text-white text-sm font-mono transition-all" 
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Mobile Number (10-Digit)
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
                phoneTouched && !phoneStatus.isValid 
                  ? 'border-rose-500' 
                  : 'border-white/10 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/30'
              }`}>
                <div className="inline-flex items-center px-3.5 bg-slate-900 border-r border-white/10 text-slate-300 text-xs font-mono font-bold select-none gap-1.5">
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
                  className="w-full px-4 py-2.5 bg-slate-950/80 text-white text-sm font-mono tracking-wider focus:outline-none"
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Used to verify payment and support device license recovery.
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-slate-400" /> College / University Name
              </label>
              <input 
                required 
                type="text" 
                value={formData.collegeName} 
                onChange={e => setFormData({...formData, collegeName: e.target.value})} 
                placeholder="e.g. Saveetha School of Engineering"
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 text-white text-sm font-mono transition-all" 
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Academic Year / Branch
              </label>
              <input 
                required 
                type="text" 
                value={formData.academicYear} 
                onChange={e => setFormData({...formData, academicYear: e.target.value})} 
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 text-white text-sm font-mono transition-all" 
                placeholder="e.g. 3rd Year B.Tech CSE" 
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="flex-1 py-3 bg-slate-800/80 hover:bg-slate-800 border border-white/10 rounded-xl font-medium cursor-pointer text-xs font-mono flex items-center justify-center gap-2 transition-colors text-slate-300"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Packages
              </button>
              <button 
                type="submit" 
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold cursor-pointer text-xs font-mono uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
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
        <div className="max-w-xl mx-auto rounded-2xl bg-slate-900/80 border border-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="text-center space-y-1.5 border-b border-white/10 pb-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-semibold">
              <CreditCard className="w-3.5 h-3.5" /> Step 3 • UPI Payment Settlement
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Direct UPI Payment
            </h2>
            <p className="text-xs text-slate-400">
              Scan the QR code or transfer the exact amount to the official merchant VPA using any UPI app (GPay, PhonePe, Paytm).
            </p>
          </div>
          
          {/* Payment Terminal Card */}
          <div className="rounded-xl border border-white/10 bg-slate-950/80 p-5 space-y-5">
            {/* Amount Card */}
            <div className="text-center pb-2 border-b border-white/5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-0.5">
                Total Amount Payable
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 tracking-tight font-mono">
                ₹{selectedPrice.toLocaleString('en-IN')}
              </div>
              <span className="text-xs font-mono text-slate-300 mt-1 block">
                {selectedPackage?.package_name} • {selectedLabel}
              </span>
            </div>

            {/* Dynamic QR Code & Merchant VPA */}
            <div className="flex flex-col sm:flex-row items-center gap-5 justify-center py-2">
              <div className="p-2.5 bg-white rounded-xl shadow-md shrink-0 flex items-center justify-center">
                <img 
                  src={qrCodeUrl} 
                  alt="UPI Payment QR Code" 
                  className="w-36 h-36 object-contain"
                  onError={(e) => {
                    // Fallback to hidden if QR server unreachable
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              <div className="space-y-3 text-center sm:text-left flex-1">
                <div>
                  <span className="text-[11px] font-mono text-slate-400 block">Merchant Name</span>
                  <span className="text-sm font-semibold text-white">{merchantUpiName || 'Phantom Lead'}</span>
                </div>
                
                <div>
                  <span className="text-[11px] font-mono text-slate-400 block mb-1">Official UPI VPA</span>
                  <div className="inline-flex items-center gap-2 p-2 rounded-lg bg-black/60 border border-white/10">
                    <span className="font-mono text-xs text-emerald-300 font-bold select-all">
                      {merchantUpiId || 'phantomlead@upi'}
                    </span>
                    <button
                      type="button"
                      onClick={copyUpiId}
                      className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {copiedUpi && (
                  <span className="text-[11px] text-emerald-400 font-mono block">
                    ✓ UPI ID copied to clipboard!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Payment Instructions */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10 space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-semibold block flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> How to Complete Payment:
            </span>
            <ol className="space-y-1.5 text-xs text-slate-400 list-decimal list-inside leading-relaxed">
              <li>Open Google Pay, PhonePe, or Paytm and scan the QR or pay to the UPI ID above.</li>
              <li>Complete the payment of <strong className="text-white font-mono">₹{selectedPrice.toLocaleString('en-IN')}</strong>.</li>
              <li>Find the <strong className="text-white">12-digit UPI Reference / UTR Number</strong> in your transaction receipt.</li>
              <li>Paste the UTR number below and submit for instant verification.</li>
            </ol>
          </div>

          {/* Next Steps Roadmap */}
          <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-medium block">
              What Happens Next:
            </span>
            <ul className="space-y-1.5 text-xs text-slate-400">
              {installationSteps.map((stepText, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-mono text-[11px] font-bold">0{idx + 1}.</span>
                  <span>{stepText}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* UTR Submission Form */}
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 text-center">
                Enter 12-Digit UPI Reference / UTR Number
              </label>
              <input 
                required 
                type="text" 
                maxLength={24}
                value={formData.upiId} 
                onChange={e => setFormData({...formData, upiId: e.target.value})} 
                className="w-full px-4 py-3 bg-slate-950/80 border border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 font-mono text-center text-lg text-white font-bold tracking-wider transition-all placeholder:text-slate-600" 
                placeholder="e.g. 403819284719" 
              />
              <span className="text-[11px] text-slate-500 mt-1 block text-center">
                Found on your payment app receipt as "UPI Ref ID" or "UTR Number".
              </span>
            </div>

            <div className="pt-2 flex gap-3">
              <button 
                type="button" 
                onClick={() => setStep(2)} 
                className="flex-1 py-3 bg-slate-800/80 hover:bg-slate-800 border border-white/10 rounded-xl font-medium cursor-pointer text-xs font-mono flex items-center justify-center gap-2 transition-colors text-slate-300"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Details
              </button>
              <button 
                type="submit" 
                disabled={submittingPayment}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 rounded-xl font-bold cursor-pointer text-xs font-mono uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {submittingPayment ? (
                  <span>Recording UTR...</span>
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
