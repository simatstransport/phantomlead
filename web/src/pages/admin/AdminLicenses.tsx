import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { 
  Trash2, AlertTriangle, Clock, Search, Plus, 
  Laptop, Shield, RefreshCw, X, Download, Loader2, Key, CheckCircle2, ShieldAlert,
  CalendarPlus, Check, Mail
} from 'lucide-react';
import { downloadInstaller } from '../../utils/download';
import { processAndSendInvoice } from '../../services/billingService';

export const AdminLicenses = () => {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [wipeLogs, setWipeLogs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'REVOKED' | 'DEMO'>('ALL');
  
  // Notification toast message state
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Extend Expiry Modal state
  const [extendModalLicense, setExtendModalLicense] = useState<any | null>(null);
  const [selectedExtendDays, setSelectedExtendDays] = useState<number>(1);
  const [isExtending, setIsExtending] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [packageCode, setPackageCode] = useState('FULL_ACCESS');
  const [duration, setDuration] = useState<number | null>(null);
  const [lifetimeExe, setLifetimeExe] = useState<'L' | 'A'>('L');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState({ type: '', text: '' });
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [isSweepingTimebomb, setIsSweepingTimebomb] = useState(false);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);

  const handleManualSendInvoice = async (lic: any) => {
    const custEmail = lic.customers?.email;
    if (!custEmail) {
      setActionAlert({ type: 'error', message: 'Candidate has no email address associated.' });
      return;
    }

    setSendingEmailId(lic.id);
    setActionAlert({ type: 'info', message: `Generating PDF and emailing invoice to ${custEmail}...` });

    try {
      const isFree = lic.payment_type === 'FREE' || !lic.payment_id;
      const pkgName = lic.packages?.package_name || 'PhantomLead Security Package';
      const pkgCode = lic.packages?.package_code || 'SECURITY_SUITE';
      const custName = lic.customers?.full_name || custEmail.split('@')[0];

      const res = await processAndSendInvoice({
        paymentId: lic.payment_id || undefined,
        customerId: lic.customer_id,
        customerName: custName,
        customerEmail: custEmail,
        packageName: pkgName,
        packageCode: pkgCode,
        amount: isFree ? 0 : 2000,
        tax: 0,
        transactionRef: `MANUAL-${lic.id.substring(0, 8).toUpperCase()}`,
        paymentMethod: isFree ? 'Complimentary Grant (₹0)' : 'UPI / Direct Clearance',
        licenseKey: lic.license_key || undefined,
        isFree: isFree,
      });

      setActionAlert({
        type: 'success',
        message: `✅ Official PDF Invoice ${res.invoiceNumber} emailed successfully to ${custEmail}!`
      });
    } catch (err: any) {
      setActionAlert({
        type: 'error',
        message: `Failed to dispatch invoice: ${err.message}`
      });
    } finally {
      setSendingEmailId(null);
      setTimeout(() => setActionAlert(null), 5000);
    }
  };

  const handleRunTimebombSweep = async () => {
    setIsSweepingTimebomb(true);
    setActionAlert({ type: 'info', message: '⏳ Scanning fleet for expired licenses and disengaging hardware locks...' });

    try {
      const nowIso = new Date().toISOString();
      // Find all ACTIVE licenses that have passed expires_at
      const { data: expiredLicenses, error: fetchErr } = await supabase
        .from('licenses')
        .select('id, expires_at, device_id, customers(full_name, email), packages(package_name)')
        .eq('status', 'ACTIVE')
        .not('expires_at', 'is', null)
        .lte('expires_at', nowIso);

      if (fetchErr) throw fetchErr;

      if (!expiredLicenses || expiredLicenses.length === 0) {
        setActionAlert({ type: 'success', message: '✅ Fleet Scan Complete: Zero expired licenses found. All active nodes valid.' });
        return;
      }

      let count = 0;
      for (const lic of expiredLicenses) {
        await supabase
          .from('licenses')
          .update({
            status: 'EXPIRED',
            device_id: null,
            expired_at: nowIso,
            expiration_notified: true,
          })
          .eq('id', lic.id);

        if (lic.device_id) {
          await supabase.from('devices').delete().eq('id', lic.device_id);
        }
        count++;
      }

      setActionAlert({
        type: 'success',
        message: `💥 Timebomb Sweep Complete: ${count} expired license(s) revoked & hardware locks freed automatically!`
      });
      fetchLicenses();
    } catch (err: any) {
      setActionAlert({ type: 'error', message: `Sweep failed: ${err.message}` });
    } finally {
      setIsSweepingTimebomb(false);
      setTimeout(() => setActionAlert(null), 6000);
    }
  };

  const handleDownload = async (name: string) => {
    setDownloadingFile(name);
    try {
      await downloadInstaller(name);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloadingFile(null);
    }
  };

  useEffect(() => {
    fetchLicenses();
    fetchPackages();
    const interval = setInterval(fetchLicenses, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchPackages = async () => {
    const { data } = await supabase.from('packages').select('package_code, package_name');
    if (data) setAvailablePackages(data);
  };

  const fetchLicenses = async () => {
    const { data, error } = await supabase
      .from('licenses')
      .select('*, customers(full_name, email), packages(package_name, package_code), devices(hostname, registered_at)')
      .order('issued_at', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      // Keep licenses exactly as recorded in database (no automatic silent deletion)
      // Admins will delete manually when needed via the Delete button
      setLicenses(data || []);
    }

    const { data: logsData } = await supabase
      .from('audit_logs')
      .select('target_id, action, details, created_at')
      .in('action', ['HOST_WIPE_SUCCESS', 'HOST_WIPE_ERROR'])
      .order('created_at', { ascending: false });

    if (logsData) {
      const logsMap: Record<string, any> = {};
      logsData.forEach(log => {
        if (!logsMap[log.target_id]) {
          logsMap[log.target_id] = log;
        }
      });
      setWipeLogs(logsMap);
    }

    setLoading(false);
  };

  const handleDeleteLicense = async (id: string, customerName?: string) => {
    const targetLabel = customerName ? `for "${customerName}"` : '';
    if (!window.confirm(`⚠️ Permanently DELETE license ${targetLabel}?\n\nThis will completely remove this license from the database and immediately delete it from the customer's account (setting customer account to 100% fresh).`)) return;
    
    setProcessingId(id);
    try {
      // Find candidate details before deleting
      const targetLic = licenses.find(l => l.id === id);
      const custEmail = targetLic?.customers?.email;
      const custName = targetLic?.customers?.full_name || customerName;

      await supabase.from('installation_logs').delete().eq('license_id', id);
      const { error } = await supabase.from('licenses').delete().eq('id', id);
      if (error) {
        setActionAlert({ type: 'error', message: `❌ Error deleting license: ${error.message}` });
      } else {
        // Dispatch Deletion & Fresh Account Reset Email to Customer
        if (custEmail) {
          const apiUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
            ? '/api/send-invoice'
            : 'http://localhost:3001/api/send-invoice';

          fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              isDeletionNotice: true,
              toEmail: custEmail,
              toName: custName,
              timestamp: new Date().toISOString(),
            }),
          }).catch(err => console.warn('[Customer delete email notice]:', err));
        }

        setActionAlert({ 
          type: 'success', 
          message: `🗑️ License ${targetLabel} deleted & notification email sent to ${custEmail || 'customer'}. Customer account is now 100% fresh.` 
        });
        fetchLicenses();
        setTimeout(() => setActionAlert(null), 5000);
      }
    } catch (err: any) {
      setActionAlert({ type: 'error', message: `❌ Error: ${err.message}` });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRevokeLicense = async (id: string, customerName?: string) => {
    const targetLabel = customerName ? `for "${customerName}"` : '';
    if (!window.confirm(`⚠️ REVOKE LICENSE & UNBIND DEVICE ${targetLabel}?\n\nThis will revoke the license and immediately unbind the hardware lock so the user's bound key/device is cleared. You can delete this license record manually whenever you want.`)) return;
    
    setProcessingId(id);
    try {
      // Find the license to get device_id and customer details
      const targetLic = licenses.find(l => l.id === id);
      const custEmail = targetLic?.customers?.email;
      const custName = targetLic?.customers?.full_name || customerName;
      const pkgName = targetLic?.packages?.package_name;

      // Unbind device and revoke license (device_id: null clears the hardware lock)
      const { error } = await supabase
        .from('licenses')
        .update({ 
          status: 'REVOKED',
          device_id: null 
        })
        .eq('id', id);
        
      if (error) {
        setActionAlert({ type: 'error', message: `❌ Error revoking license: ${error.message}` });
      } else {
        // If there was a bound device, delete device record or clear it
        if (targetLic?.device_id) {
          await supabase.from('devices').delete().eq('id', targetLic.device_id);
        }

        // Dispatch Official Revocation Email to Customer
        if (custEmail) {
          const apiUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
            ? '/api/send-invoice'
            : 'http://localhost:3001/api/send-invoice';

          fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              isRevocationNotice: true,
              toEmail: custEmail,
              toName: custName,
              packageName: pkgName,
              timestamp: new Date().toISOString(),
            }),
          }).catch(err => console.warn('[Customer revoke email notice]:', err));
        }

        setActionAlert({ 
          type: 'success', 
          message: `✅ License ${targetLabel} revoked & notification emailed to ${custEmail || 'customer'}! Hardware node lock cleared.` 
        });
        fetchLicenses();
        setTimeout(() => setActionAlert(null), 5000);
      }
    } catch (err: any) {
      setActionAlert({ type: 'error', message: `❌ Error: ${err.message}` });
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenExtendModal = (license: any) => {
    setExtendModalLicense(license);
    setSelectedExtendDays(1);
  };

  const handleConfirmExtension = async () => {
    if (!extendModalLicense) return;

    // Safety constraint: maximum 5 days
    const daysToAdd = Math.min(Math.max(selectedExtendDays, 1), 5);
    setIsExtending(true);

    try {
      const now = Date.now();
      const currentExpiry = extendModalLicense.expires_at 
        ? new Date(extendModalLicense.expires_at).getTime() 
        : now;

      // If current expiry is in the past or within 10 minutes, calculate from now; otherwise add to current expiry
      const baseTime = currentExpiry > now ? currentExpiry : now;
      const newExpiryTime = new Date(baseTime + daysToAdd * 24 * 60 * 60 * 1000);
      const newExpiryIso = newExpiryTime.toISOString();

      const { error } = await supabase
        .from('licenses')
        .update({ 
          expires_at: newExpiryIso,
          status: 'ACTIVE' // restore to ACTIVE if it was expired
        })
        .eq('id', extendModalLicense.id);

      if (error) {
        setActionAlert({ type: 'error', message: `❌ Failed to extend license: ${error.message}` });
      } else {
        // Record in audit log
        await supabase.from('audit_logs').insert({
          action: 'LICENSE_EXTENSION_GRANTED',
          target_id: extendModalLicense.id,
          details: {
            days_added: daysToAdd,
            previous_expiry: extendModalLicense.expires_at,
            new_expiry: newExpiryIso,
            customer_email: extendModalLicense.customers?.email,
            customer_name: extendModalLicense.customers?.full_name,
            timestamp: new Date().toISOString()
          }
        });

        const customerName = extendModalLicense.customers?.full_name || extendModalLicense.customers?.email || 'Candidate';
        const customerEmail = extendModalLicense.customers?.email;
        const newExpiryFormatted = `${newExpiryTime.toLocaleDateString()} ${newExpiryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

        // Dispatch automated extension notification email to the customer
        if (customerEmail) {
          const apiUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
            ? '/api/send-invoice'
            : 'http://localhost:3001/api/send-invoice';

          fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              toEmail: customerEmail,
              toName: customerName,
              isExtension: true,
              extendedDays: daysToAdd,
              newExpiry: newExpiryFormatted,
              packageName: extendModalLicense.packages?.package_name || 'PhantomLead Workstation',
              transactionRef: `EXTEND-${Date.now().toString().slice(-6)}`,
            }),
          }).then(() => {
            console.log(`[Extension Email Sent] to ${customerEmail}`);
          }).catch(err => {
            console.warn('[Extension Email Notice]:', err);
          });
        }

        setActionAlert({
          type: 'success',
          message: `⏳ Granted +${daysToAdd} day(s) extension & emailed notification to ${customerName}! New expiry: ${newExpiryFormatted}`
        });
        setExtendModalLicense(null);
        fetchLicenses();
        setTimeout(() => setActionAlert(null), 6000);
      }
    } catch (err: any) {
      setActionAlert({ type: 'error', message: `❌ Error: ${err.message}` });
    } finally {
      setIsExtending(false);
    }
  };

  const handleOpenModal = () => {
    setCustomerEmail('');
    setPackageCode('FULL_ACCESS');
    setDuration(null);
    setLifetimeExe('L');
    setModalMessage({ type: '', text: '' });
    setIsModalOpen(true);
  };

  const handleGenerateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalMessage({ type: '', text: '' });

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      setModalMessage({ type: 'error', text: 'You must be logged in as an administrator.' });
      setIsSubmitting(false);
      return;
    }

    const res = await fetch('https://wgxxitydatuoyjnxuvqw.supabase.co/functions/v1/admin-generate-license', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        customer_email: customerEmail.trim(),
        package_code: packageCode,
        duration_months: duration === null ? (lifetimeExe === 'A' ? 0 : null) : duration
      })
    });

    const data = await res.json();
    setIsSubmitting(false);

    if (!res.ok) {
      setModalMessage({ type: 'error', text: data.error || 'Failed to generate license.' });
      return;
    }

    const issuedKey = data.license_key || data.raw_license_key;
    if (issuedKey) {
      const exeAssigned = duration === null 
        ? (lifetimeExe === 'A' ? 'SecureInstaller_A.exe (Admin-Controlled)' : 'SecureInstaller_L.exe (Lifetime Vault)')
        : 'SecureInstaller_T.exe (Timed Edition)';

      // Selected package metadata
      const selectedPkg = availablePackages.find(p => p.package_code === packageCode);
      const pkgName = selectedPkg?.package_name || packageCode;

      // Automatically compile & dispatch official PDF Entitlement Invoice via Gmail Nodemailer
      processAndSendInvoice({
        customerName: customerEmail.split('@')[0],
        customerEmail: customerEmail.trim(),
        packageName: `${pkgName} (Admin Grant)`,
        packageCode: packageCode,
        amount: 0,
        tax: 0,
        transactionRef: `FREE-GRANT-${Date.now().toString().slice(-6)}`,
        paymentMethod: 'Admin Complimentary Grant (₹0)',
        licenseKey: issuedKey,
        isFree: true,
      }).then(res => {
        console.log('[Free License Invoice Dispatched]:', res.invoiceNumber);
      }).catch(err => {
        console.warn('[Free License Invoice Notice]:', err);
      });

      setModalMessage({ 
        type: 'success', 
        text: `Success! Key: ${issuedKey} (${exeAssigned}) • Official PDF Invoice emailed to ${customerEmail.trim()}!` 
      });
      fetchLicenses();
      setTimeout(() => setIsModalOpen(false), 4000);
    } else {
      setModalMessage({ type: 'error', text: 'License created, but key was missing in response.' });
    }
  };

  const filteredLicenses = useMemo(() => {
    return licenses.filter(l => {
      const customerName = (l.customers?.full_name || '').toLowerCase();
      const customerEmailStr = (l.customers?.email || '').toLowerCase();
      const pkgName = (l.packages?.package_name || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch = !query || customerName.includes(query) || customerEmailStr.includes(query) || pkgName.includes(query);

      if (!matchesSearch) return false;

      if (statusFilter === 'ACTIVE') return l.status === 'ACTIVE';
      if (statusFilter === 'REVOKED') return l.status === 'REVOKED' || l.uninstalled_at;
      if (statusFilter === 'DEMO') return l.duration_months === -10;

      return true;
    });
  }, [licenses, searchQuery, statusFilter]);

  const activeCount = licenses.filter(l => l.status === 'ACTIVE').length;
  const boundNodesCount = licenses.filter(l => l.devices && l.devices.hostname).length;
  const demoCount = licenses.filter(l => l.duration_months === -10).length;
  const wipedCount = licenses.filter(l => l.uninstalled_at).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
        <p className="text-sm font-mono text-slate-400">Loading global fleet licenses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Modern Tactical Admin Deck Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 dark:border-white/10 light:border-slate-200 bg-[#0d1117] dark:bg-[#0d1117] light:bg-white backdrop-blur-2xl p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 dark:text-emerald-300 light:text-emerald-700 font-bold bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 rounded-full">
                ADMIN FLEET DECK • AUTO-SYNC 3S
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white dark:text-white light:text-slate-900 tracking-tight flex items-center gap-3">
              <Key className="w-7 h-7 text-emerald-400" />
              Global License &amp; <span className="text-gradient-rainbow">Hardware Nodes</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 max-w-xl leading-relaxed">
              Real-time monitoring of machine bindings, instant remote kill-switch, auto-wipe triggers, and client node locks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Installer Downloads */}
            <div className="flex items-center gap-1.5 bg-black/60 dark:bg-black/60 light:bg-slate-100 border border-slate-800 dark:border-white/10 light:border-slate-200 rounded-xl p-1.5 shadow-sm">
              <span className="text-[10px] font-mono text-emerald-400 dark:text-emerald-400 light:text-emerald-700 font-bold px-2 flex items-center gap-1">
                <Download className="w-3 h-3 text-emerald-400" /> EXEs:
              </span>
              <button
                onClick={() => handleDownload('SecureInstaller_L.exe')}
                disabled={downloadingFile === 'SecureInstaller_L.exe'}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 dark:text-emerald-300 light:text-emerald-800 font-mono text-xs font-bold border border-emerald-500/30 transition-all flex items-center gap-1 cursor-pointer"
                title="Download Lifetime Edition (.exe)"
              >
                {downloadingFile === 'SecureInstaller_L.exe' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                L-Life
              </button>
              <button
                onClick={() => handleDownload('SecureInstaller_T.exe')}
                disabled={downloadingFile === 'SecureInstaller_T.exe'}
                className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 dark:text-amber-300 light:text-amber-800 font-mono text-xs font-bold border border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer"
                title="Download Time-Bomb Edition (.exe)"
              >
                {downloadingFile === 'SecureInstaller_T.exe' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                T-Timed
              </button>
              <button
                onClick={() => handleDownload('SecureInstaller_A.exe')}
                disabled={downloadingFile === 'SecureInstaller_A.exe'}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 dark:text-cyan-300 light:text-cyan-800 font-mono text-xs font-bold border border-cyan-500/30 transition-all flex items-center gap-1 cursor-pointer"
                title="Download Admin Managed Edition (.exe)"
              >
                {downloadingFile === 'SecureInstaller_A.exe' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                A-Admin
              </button>
            </div>

            <button 
              onClick={handleRunTimebombSweep}
              disabled={isSweepingTimebomb}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-bold font-mono transition-all cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50"
              title="Scan and revoke all licenses whose validity has expired"
            >
              {isSweepingTimebomb ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              ) : (
                <Clock className="w-4 h-4 text-amber-400" />
              )}
              <span>Run Expiry Sweep</span>
            </button>

            <button 
              onClick={handleOpenModal} 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Plus className="w-4 h-4 text-slate-950" /> Issue Free License
            </button>
          </div>
        </div>

        {/* KPI Mini-Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80 dark:border-white/10 light:border-slate-200">
          <div className="p-4 rounded-xl bg-black/40 dark:bg-black/40 light:bg-slate-50 border border-emerald-500/30 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Active Licenses</span>
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {activeCount} <span className="text-xs text-slate-500 font-normal">/ {licenses.length} Total</span>
            </div>
            <div className="text-[10px] font-mono text-emerald-400/80 dark:text-emerald-400/80 light:text-emerald-700 mt-1">Live running deployments</div>
          </div>

          <div className="p-4 rounded-xl bg-black/40 dark:bg-black/40 light:bg-slate-50 border border-cyan-500/30 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Bound PC Nodes</span>
              <Laptop className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-cyan-400 font-mono">{boundNodesCount}</div>
            <div className="text-[10px] font-mono text-cyan-400/80 dark:text-cyan-400/80 light:text-cyan-700 mt-1">Hardware fingerprint locked</div>
          </div>

          <div className="p-4 rounded-xl bg-black/40 dark:bg-black/40 light:bg-slate-50 border border-amber-500/30 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">10-Min Demo Trials</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono">{demoCount}</div>
            <div className="text-[10px] font-mono text-amber-400/80 dark:text-amber-400/80 light:text-amber-700 mt-1">Auto-wipe countdown active</div>
          </div>

          <div className="p-4 rounded-xl bg-black/40 dark:bg-black/40 light:bg-slate-50 border border-rose-500/30 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Wipes Executed</span>
              <Trash2 className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400 font-mono">{wipedCount}</div>
            <div className="text-[10px] font-mono text-rose-400/80 dark:text-rose-400/80 light:text-rose-700 mt-1">Extensions sanitized from host</div>
          </div>
        </div>
      </div>

      {/* Action Notification Alert Banner */}
      {actionAlert && (
        <div className={`p-4 rounded-xl flex items-center justify-between gap-3 border shadow-sm animate-fadeIn ${
          actionAlert.type === 'success' 
            ? 'bg-emerald-950/60 dark:bg-emerald-950/60 light:bg-emerald-50 border-emerald-500/40 text-emerald-300 dark:text-emerald-300 light:text-emerald-800'
            : actionAlert.type === 'error'
            ? 'bg-rose-950/60 dark:bg-rose-950/60 light:bg-rose-50 border-rose-500/40 text-rose-300 dark:text-rose-300 light:text-rose-800'
            : 'bg-cyan-950/60 dark:bg-cyan-950/60 light:bg-cyan-50 border-cyan-500/40 text-cyan-300 dark:text-cyan-300 light:text-cyan-800'
        }`}>
          <div className="flex items-center gap-3">
            {actionAlert.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : actionAlert.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <Shield className="w-5 h-5 text-cyan-400 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-semibold">{actionAlert.message}</span>
          </div>
          <button 
            onClick={() => setActionAlert(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="rounded-2xl border border-slate-800/80 dark:border-white/10 light:border-slate-200 bg-[#0d1117] dark:bg-[#0d1117] light:bg-white backdrop-blur-2xl p-6 shadow-xl space-y-4">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80 dark:border-white/10 light:border-slate-200">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by candidate name, email, or package..."
              className="w-full pl-10 pr-9 py-2.5 bg-black/50 dark:bg-black/50 light:bg-slate-50 border border-slate-800/80 dark:border-white/10 light:border-slate-300 focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-white dark:text-white light:text-slate-900 placeholder-slate-500 focus:outline-none transition-all font-mono"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 dark:bg-black/40 light:bg-slate-100 border border-slate-800/80 dark:border-white/10 light:border-slate-200 shrink-0">
            {(['ALL', 'ACTIVE', 'DEMO', 'REVOKED'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === filter
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 hover:bg-white/[0.04] light:hover:bg-white'
                }`}
              >
                {filter === 'ALL' ? 'All' : filter === 'ACTIVE' ? 'Active' : filter === 'DEMO' ? '10-Min Demos' : 'Wiped / Revoked'}
              </button>
            ))}
          </div>
        </div>

        {/* Licenses Table */}
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full min-w-[850px] text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 dark:border-white/10 light:border-slate-200 text-slate-400 dark:text-slate-400 light:text-slate-500 text-xs font-mono uppercase tracking-wider bg-black/30 dark:bg-black/30 light:bg-slate-50">
                <th className="py-3 px-4 font-bold">Candidate / Account</th>
                <th className="py-3 px-4 font-bold">Package &amp; Edition</th>
                <th className="py-3 px-4 font-bold">Type</th>
                <th className="py-3 px-4 font-bold">Hardware Node</th>
                <th className="py-3 px-4 font-bold">Status / Sentinel</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 dark:divide-white/5 light:divide-slate-200 text-xs">
              {filteredLicenses.map(lic => {
                const isRevoked = lic.status === 'REVOKED' || lic.uninstalled_at;
                const isDemo = lic.duration_months === -10;
                const wipeLog = wipeLogs[lic.id];

                return (
                  <tr key={lic.id} className="hover:bg-slate-800/40 dark:hover:bg-slate-800/40 light:hover:bg-slate-50 transition-colors">
                    {/* Customer */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-white dark:text-white light:text-slate-900 text-sm">
                        {lic.customers?.full_name || 'Anonymous Candidate'}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 dark:text-slate-400 light:text-slate-500">
                        {lic.customers?.email}
                      </div>
                    </td>

                    {/* Package */}
                    <td className="py-4 px-4 space-y-1">
                      <span className="font-bold text-white dark:text-white light:text-slate-900 block">
                        {lic.packages?.package_name || 'Custom Package'}
                      </span>
                      <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 dark:text-emerald-300 light:text-emerald-700 font-bold">
                        {lic.packages?.package_code || 'STANDARD'}
                      </span>
                    </td>

                    {/* Type & Duration */}
                    <td className="py-4 px-4 space-y-1">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        lic.payment_type === 'FREE' 
                          ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 dark:text-cyan-300 light:text-cyan-800' 
                          : 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 dark:text-emerald-300 light:text-emerald-800'
                      }`}>
                        {lic.payment_type || 'PAID'}
                      </span>
                      <div className="text-[11px] font-mono text-slate-300 dark:text-slate-300 light:text-slate-600 flex items-center gap-1.5 mt-0.5">
                        <span>{isDemo ? '10-Min Trial' : lic.duration_months && lic.duration_months > 0 ? `${lic.duration_months} Mo` : '∞ Lifetime'}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                          lic.duration_months === 0 
                            ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300 dark:text-cyan-300 light:text-cyan-800' 
                            : lic.duration_months === -10 || (lic.duration_months && lic.duration_months > 0)
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 dark:text-amber-300 light:text-amber-800'
                            : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 dark:text-emerald-300 light:text-emerald-800'
                        }`}>
                          {lic.duration_months === 0 ? 'A.exe' : (lic.duration_months === -10 || (lic.duration_months && lic.duration_months > 0)) ? 'T.exe' : 'L.exe'}
                        </span>
                      </div>
                    </td>

                    {/* Hardware Node */}
                    <td className="py-4 px-4">
                      {lic.devices?.hostname ? (
                        <div className="flex items-center gap-1.5 text-emerald-300 font-mono text-[11px] font-bold">
                          <Laptop className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{lic.devices.hostname}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono text-[11px]">Unbound (Pending)</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold ${
                        isRevoked 
                          ? 'bg-rose-500/15 border border-rose-500/40 text-rose-300' 
                          : 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isRevoked ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'}`} />
                        {isRevoked ? (lic.uninstalled_at ? 'WIPED' : 'REVOKED') : 'ACTIVE'}
                      </span>
                      {wipeLog && (
                        <div className="text-[10px] font-mono text-slate-500 mt-1">
                          Wipe log: {wipeLog.action}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {/* Manual Send Invoice & Entitlement PDF Email Button */}
                        <button
                          onClick={() => handleManualSendInvoice(lic)}
                          disabled={sendingEmailId === lic.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/25 transition-all cursor-pointer font-mono text-xs font-semibold shadow-sm shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
                          title="Dispatch Official PDF Invoice & Entitlement Email to candidate"
                        >
                          {sendingEmailId === lic.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                          ) : (
                            <Mail className="w-3.5 h-3.5 text-cyan-400" />
                          )}
                          <span>Send Email</span>
                        </button>

                        {/* Extend Days Button (for timed licenses with an expiration date) */}
                        {!isRevoked && (lic.expires_at || lic.duration_months) && (
                          <button
                            onClick={() => handleOpenExtendModal(lic)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 transition-all cursor-pointer font-mono text-xs font-semibold"
                            title="Add extension days (up to 5 days max)"
                          >
                            <CalendarPlus className="w-3.5 h-3.5 text-cyan-400" />
                            <span>+ Extend</span>
                          </button>
                        )}

                        {!isRevoked ? (
                          <button
                            onClick={() => handleRevokeLicense(lic.id, lic.customers?.full_name || lic.customers?.email)}
                            disabled={processingId === lic.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 transition-all cursor-pointer font-mono text-xs font-semibold disabled:opacity-50"
                            title="Revoke license and trigger host wipe"
                          >
                            {processingId === lic.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                            )}
                            <span>Revoke</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-mono text-slate-500 px-2 py-1 bg-white/[0.03] rounded-lg border border-white/5">
                            Revoked
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteLicense(lic.id, lic.customers?.full_name || lic.customers?.email)}
                          disabled={processingId === lic.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500/25 transition-all cursor-pointer font-mono text-xs font-semibold disabled:opacity-50"
                          title="Delete license record (clears from customer account)"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0b0c14] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-400" /> Issue Free License Key
              </h3>
              <p className="text-xs text-slate-400">
                Grant immediate access without requiring a payment gateway transaction.
              </p>
            </div>

            {modalMessage.text && (
              <div className={`p-4 rounded-2xl text-xs font-mono ${
                modalMessage.type === 'success' 
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300' 
                  : 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
              }`}>
                {modalMessage.text}
              </div>
            )}

            <form onSubmit={handleGenerateLicense} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 uppercase">
                  Customer Email
                </label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="student@gmail.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/10 text-white text-xs focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 uppercase">
                  Package Module
                </label>
                <select
                  value={packageCode}
                  onChange={e => setPackageCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/10 text-white text-xs focus:border-purple-500 focus:outline-none"
                >
                  {availablePackages.map(p => (
                    <option key={p.package_code} value={p.package_code}>
                      {p.package_name} ({p.package_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 uppercase">
                  Duration (Months)
                </label>
                <select
                  value={duration === null ? 'null' : duration}
                  onChange={e => setDuration(e.target.value === 'null' ? null : parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/10 text-white text-xs focus:border-purple-500 focus:outline-none font-mono"
                >
                  <option value="null">∞ Lifetime Access (Select A or L EXE below)</option>
                  <option value="1">1 Month (Sprint) → T.exe</option>
                  <option value="2">2 Months (Mid-Sem) → T.exe</option>
                  <option value="3">3 Months (Semester Pass) → T.exe</option>
                  <option value="-10">⚡ 10-Minute Demo Trial → T.exe</option>
                </select>
              </div>

              {/* Selection of EXE for Lifetime: A exe vs L exe */}
              {duration === null && (
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-mono font-bold text-emerald-300 uppercase">
                      Select Lifetime Installer Edition (.EXE)
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">Required</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLifetimeExe('L')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        lifetimeExe === 'L'
                          ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                          : 'bg-black/60 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-bold text-emerald-300">L.exe (Lifetime)</span>
                        {lifetimeExe === 'L' && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                      </div>
                      <span className="text-[10px] text-slate-300 font-mono leading-tight">
                        SecureInstaller_L.exe
                      </span>
                      <span className="text-[9px] text-slate-500 mt-1">
                        Permanent offline vault. Local execution only.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLifetimeExe('A')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        lifetimeExe === 'A'
                          ? 'bg-purple-500/20 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                          : 'bg-black/60 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-bold text-purple-300">A.exe (Admin-Ctrl)</span>
                        {lifetimeExe === 'A' && <span className="w-2 h-2 rounded-full bg-purple-400" />}
                      </div>
                      <span className="text-[10px] text-slate-300 font-mono leading-tight">
                        SecureInstaller_A.exe
                      </span>
                      <span className="text-[9px] text-slate-500 mt-1">
                        Admin-controlled. Allows remote revoke &amp; auto-purge.
                      </span>
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs font-mono uppercase tracking-wider shadow-lg shadow-purple-500/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Issuing License...' : 'Confirm & Issue Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extend License Days Modal (Max 5 Days) */}
      {extendModalLicense && (() => {
        const now = Date.now();
        const currentExp = extendModalLicense.expires_at ? new Date(extendModalLicense.expires_at).getTime() : now;
        const base = currentExp > now ? currentExp : now;
        const projectedExp = new Date(base + selectedExtendDays * 24 * 60 * 60 * 1000);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#09090b] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-[0_25px_60px_rgba(0,0,0,0.95)] relative cinema-corner-mark">
              <button 
                onClick={() => setExtendModalLicense(null)}
                className="absolute right-5 top-5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-[10px] font-cinematic uppercase tracking-[0.2em] text-cyan-400 font-bold bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                    ARMAMENT EXTENSION
                  </span>
                </div>
                <h3 className="text-xl font-display uppercase tracking-wider text-white flex items-center gap-2">
                  <CalendarPlus className="w-5 h-5 text-cyan-400" /> Extend Expiry Window
                </h3>
                <p className="text-xs text-[#8a8a8a]">
                  Grant additional operating days (maximum 5 days) for candidate workstation runtime.
                </p>
              </div>

              {/* Target Candidate Summary */}
              <div className="p-3.5 rounded-xl bg-black/70 border border-white/10 space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[#8a8a8a]">Candidate:</span>
                  <span className="text-white font-bold">{extendModalLicense.customers?.full_name || 'Candidate'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8a8a8a]">Email:</span>
                  <span className="text-slate-300">{extendModalLicense.customers?.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8a8a8a]">Package:</span>
                  <span className="text-cyan-300 font-bold">{extendModalLicense.packages?.package_code || 'STANDARD'}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-[#8a8a8a]">Current Expiry:</span>
                  <span className="text-amber-400 font-semibold">
                    {extendModalLicense.expires_at ? new Date(extendModalLicense.expires_at).toLocaleDateString() : 'Expired'}
                  </span>
                </div>
              </div>

              {/* Days Selection Buttons (1 to 5 Days) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-cinematic uppercase tracking-wider">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" /> Select Days to Add
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    MAX 5 DAYS
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map(d => {
                    const isSelected = selectedExtendDays === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSelectedExtendDays(d)}
                        className={`py-3 rounded-xl font-cinematic uppercase tracking-wider font-bold text-xs transition-all cursor-pointer flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-105'
                            : 'bg-black/60 text-slate-400 hover:text-white hover:bg-white/[0.05] border border-white/10'
                        }`}
                      >
                        <span className="text-base leading-none">+{d}</span>
                        <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-slate-950' : 'text-slate-500'}`}>
                          {d === 1 ? 'Day' : 'Days'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Projected Expiry Preview */}
              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/40 text-xs flex items-center justify-between font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">New Expiry Timestamp:</span>
                  <span className="text-cyan-300 font-bold text-sm">
                    {projectedExp.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}{' • '}
                    {projectedExp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                  <Check className="w-4 h-4" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setExtendModalLicense(null)}
                  className="flex-1 py-3 rounded-xl bg-black/60 hover:bg-white/[0.05] border border-white/10 text-slate-300 font-cinematic uppercase tracking-wider text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmExtension}
                  disabled={isExtending}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-cinematic uppercase tracking-wider text-xs font-bold shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  {isExtending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Extending...</span>
                    </>
                  ) : (
                    <>
                      <CalendarPlus className="w-3.5 h-3.5" />
                      <span>Confirm +{selectedExtendDays} Day{selectedExtendDays > 1 ? 's' : ''}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
