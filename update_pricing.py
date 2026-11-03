import re

with open('web/src/pages/CustomerPackages.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

state_old = "const [selectedPackage, setSelectedPackage] = useState<any>(null);"
state_new = """const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [packageDurations, setPackageDurations] = useState<Record<string, number | null>>({});"""

content = content.replace(state_old, state_new)

tiers = """
const PRICING_TIERS = [
  { duration: 1, label: '1 Month Access', price: 3000 },
  { duration: 2, label: '2 Months Access', price: 5000 },
  { duration: 3, label: '3 Months Access', price: 6000 },
  { duration: null, label: 'Lifetime Access (Full)', price: 8000 }
];
"""
content = content.replace('export const CustomerPackages = () => {', tiers + '\nexport const CustomerPackages = () => {')

handle_buy_old = """  const handleBuyClick = (pkg: any) => {
    setSelectedPackage(pkg);
    setStep(2);
  };"""
handle_buy_new = """  const handleBuyClick = (pkg: any) => {
    const duration = packageDurations[pkg.id] !== undefined ? packageDurations[pkg.id] : PRICING_TIERS[0].duration;
    setSelectedPackage(pkg);
    setSelectedDuration(duration);
    setStep(2);
  };"""
content = content.replace(handle_buy_old, handle_buy_new)

submit_old = """    const { error } = await supabase.from('payments').insert({
      customer_id: customer?.id,
      package_id: selectedPackage.id,
      amount: selectedPackage.price,
      upi_transaction_id: formData.upiId,
      status: 'PENDING'
    });"""
submit_new = """
    const tier = PRICING_TIERS.find(t => t.duration === selectedDuration) || PRICING_TIERS[0];
    const { error } = await supabase.from('payments').insert({
      customer_id: customer?.id,
      package_id: selectedPackage.id,
      amount: tier.price,
      duration_months: selectedDuration,
      upi_transaction_id: formData.upiId,
      status: 'PENDING'
    });"""
content = content.replace(submit_old, submit_new)

step1_old = """                  <h3 className="text-2xl font-bold text-white mb-2">{pkg.package_name}</h3>
                  <div className="text-3xl font-black text-green-500 mb-4">₹{pkg.price}</div>"""
step1_new = """                  <h3 className="text-2xl font-bold text-white mb-2">{pkg.package_name}</h3>
                  <div className="mb-4">
                    <label className="block text-sm text-gray-400 mb-2">Select Duration</label>
                    <select 
                      className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:border-green-500"
                      value={packageDurations[pkg.id] !== undefined ? (packageDurations[pkg.id] === null ? 'null' : String(packageDurations[pkg.id])) : '1'}
                      onChange={(e) => setPackageDurations({...packageDurations, [pkg.id]: e.target.value === 'null' ? null : parseInt(e.target.value)})}
                    >
                      {PRICING_TIERS.map(t => (
                        <option key={t.duration === null ? 'lifetime' : t.duration} value={t.duration === null ? 'null' : String(t.duration)}>
                          {t.label} - ₹{t.price}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-3xl font-black text-green-500 mb-4">
                    ₹{PRICING_TIERS.find(t => t.duration === (packageDurations[pkg.id] !== undefined ? packageDurations[pkg.id] : 1))?.price}
                  </div>"""
content = content.replace(step1_old, step1_new)

step2_old = 'Purchasing: <span className="text-white">{selectedPackage?.package_name}</span> @ ₹{selectedPackage?.price}'
step2_new = 'Purchasing: <span className="text-white">{selectedPackage?.package_name}</span> - {PRICING_TIERS.find(t => t.duration === selectedDuration)?.label} @ ₹{PRICING_TIERS.find(t => t.duration === selectedDuration)?.price}'
content = content.replace(step2_old, step2_new)

step3_old = '<div className="text-4xl font-black text-green-500 mb-6">₹{selectedPackage?.price}</div>'
step3_new = '<div className="text-4xl font-black text-green-500 mb-6">₹{PRICING_TIERS.find(t => t.duration === selectedDuration)?.price}</div>'
content = content.replace(step3_old, step3_new)

with open('web/src/pages/CustomerPackages.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated CustomerPackages')
