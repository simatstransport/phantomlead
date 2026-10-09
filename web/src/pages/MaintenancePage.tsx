import { useEffect, useState } from 'react';
import { Shield, Clock, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';

interface MaintenanceProps {
  endTime?: string | null;
  message?: string | null;
  onCheckStatus?: () => void;
}

export const MaintenancePage = ({ endTime, message, onCheckStatus }: MaintenanceProps) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isPassed: boolean } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Live countdown timer calculation
  useEffect(() => {
    if (!endTime) {
      setTimeLeft(null);
      return;
    }

    const calculateTime = () => {
      const target = new Date(endTime).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isPassed: true });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, isPassed: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const handleManualRefresh = async () => {
    setIsChecking(true);
    if (onCheckStatus) {
      onCheckStatus();
    } else {
      const { data } = await supabase.from('admin_settings').select('key, value').eq('key', 'maintenance_mode').single();
      if (data && data.value === false) {
        window.location.reload();
      }
    }
    setTimeout(() => setIsChecking(false), 800);
  };

  const formattedEndTime = endTime ? (() => {
    try {
      const date = new Date(endTime);
      return date.toLocaleString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return endTime;
    }
  })() : null;

  return (
    <div className="min-h-screen bg-[#040805] text-gray-100 flex flex-col justify-between items-center p-6 relative overflow-hidden font-sans select-none">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-green-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Bar Branding */}
      <header className="w-full max-w-4xl flex justify-between items-center pt-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black border border-green-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.3)]">
            <Shield className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-lg tracking-wider font-mono">PHANTOMLEAD</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Platform Core</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <span className="text-xs font-mono text-amber-400 uppercase tracking-wider font-bold">
            Maintenance Active
          </span>
        </div>
      </header>

      {/* Main Center Card */}
      <main className="w-full max-w-xl my-auto z-10 text-center py-8">
        {/* Animated Cyberpunk Orbital Loader */}
        <div className="relative w-36 h-36 mx-auto mb-8 flex items-center justify-center">
          {/* Outer Rotating Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-green-500/20 border-t-green-400 animate-spin" style={{ animationDuration: '3s' }} />
          {/* Reverse Inner Ring */}
          <div className="absolute inset-2 rounded-full border-2 border-emerald-500/20 border-b-emerald-400 animate-spin" style={{ animationDuration: '4.5s', animationDirection: 'reverse' }} />
          {/* Pulsing Core Radar */}
          <div className="absolute inset-5 rounded-full bg-green-950/40 border border-green-500/30 animate-pulse flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.25)]">
            <Clock className="w-10 h-10 text-green-400" />
          </div>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-4 uppercase tracking-wider">
          <AlertTriangle className="w-3.5 h-3.5" /> Scheduled System Upgrade
        </div>

        {/* Main Heading */}
        <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
          We Are Currently Under Maintenance
        </h2>

        {/* Explanation Message */}
        <p className="text-sm text-gray-300 leading-relaxed max-w-md mx-auto mb-8">
          {message || 'Our team is performing scheduled core upgrades and security optimizations. All customer sessions and logins are temporarily locked.'}
        </p>

        {/* Expected End Time & Live Countdown Box */}
        <div className="bg-[#0b100c] border border-green-900/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden mb-6 text-left">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800/80">
            <span className="text-xs font-mono text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-400" /> Expected Completion Time
            </span>
            <button
              onClick={handleManualRefresh}
              disabled={isChecking}
              className="text-[11px] text-green-400 hover:text-green-300 font-medium flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
              title="Check if maintenance has concluded"
            >
              <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
              Check Status
            </button>
          </div>

          {formattedEndTime ? (
            <div className="mb-4">
              <div className="text-lg md:text-xl font-bold text-white tracking-tight">
                {formattedEndTime}
              </div>
              <p className="text-xs text-green-400/90 font-medium mt-1">
                Please wait until maintenance ends. Come back and log in at this scheduled time.
              </p>
            </div>
          ) : (
            <div className="mb-4">
              <div className="text-sm font-semibold text-white">
                Finishing System Upgrades
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Please check back shortly. System will unlock immediately upon completion.
              </p>
            </div>
          )}

          {/* Live Countdown Display */}
          {timeLeft && (
            <div className="pt-2">
              <div className="text-[11px] text-gray-400 uppercase tracking-wider mb-2 font-mono">
                {timeLeft.isPassed ? 'Finalizing Updates' : 'Estimated Time Remaining'}
              </div>
              {!timeLeft.isPassed ? (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-black/80 border border-gray-800 rounded-xl p-2.5">
                    <span className="text-2xl font-mono font-black text-green-400 block">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Hours</span>
                  </div>
                  <div className="bg-black/80 border border-gray-800 rounded-xl p-2.5">
                    <span className="text-2xl font-mono font-black text-green-400 block">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Minutes</span>
                  </div>
                  <div className="bg-black/80 border border-gray-800 rounded-xl p-2.5">
                    <span className="text-2xl font-mono font-black text-green-400 block">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Seconds</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-green-950/30 border border-green-800/40 rounded-xl text-center text-xs text-green-300 font-medium">
                  Maintenance is in its final phase. System will be live in any moment!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Note */}
        <p className="text-xs text-gray-500 italic max-w-sm mx-auto">
          This page automatically checks every 5 seconds and will unlock the platform once maintenance concludes.
        </p>
      </main>

      {/* Bottom Footer with discreet Admin Entrance */}
      <footer className="w-full max-w-4xl flex justify-between items-center pt-4 border-t border-gray-900 z-10 text-xs text-gray-600">
        <div>
          &copy; {new Date().getFullYear()} PhantomLead. All rights reserved.
        </div>
        <Link 
          to="/admin/login" 
          className="hover:text-gray-400 transition-colors flex items-center gap-1 font-mono text-[11px]"
        >
          Admin Portal <ArrowRight className="w-3 h-3" />
        </Link>
      </footer>
    </div>
  );
};
