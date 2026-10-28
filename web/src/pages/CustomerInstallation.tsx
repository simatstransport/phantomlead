import { useState } from 'react';
import { 
  Key, 
  Shield, 
  ShieldAlert, 
  Download, 
  BookOpen, 
  AlertTriangle, 
  Lightbulb, 
  ExternalLink, 
  Copy, 
  Check, 
  Laptop, 
  Cpu, 
  Command, 
  Terminal,
  ShieldCheck,
  Zap,
  Lock,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { downloadInstaller } from '../utils/download';
import { Link } from 'react-router-dom';

export const CustomerInstallation = () => {
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const handleDownload = async (installerName: string) => {
    setDownloadingFile(installerName);
    setDownloadNotice(`Fetching ${installerName}...`);
    try {
      await downloadInstaller(installerName, (state) => {
        if (state.status === 'downloading') {
          setDownloadNotice(`Downloading ${installerName} (${state.progress}%)...`);
        } else if (state.status === 'completed') {
          setDownloadNotice(`✓ Download started for ${installerName}! Check your browser downloads.`);
          setTimeout(() => setDownloadNotice(null), 5000);
        } else if (state.status === 'error') {
          setDownloadNotice('Download warning: Direct fallback initiated.');
          setTimeout(() => setDownloadNotice(null), 5000);
        }
      });
    } catch {
      setDownloadNotice('Download initiated.');
      setTimeout(() => setDownloadNotice(null), 4000);
    } finally {
      setDownloadingFile(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 px-2 sm:px-4">
      {/* Page Header Deck with Ambient Gradient Aurora */}
      <div className="relative overflow-hidden rounded-3xl glass-panel border border-white/15 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/15 via-purple-500/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                DEPLOYMENT PROTOCOL
              </span>
              <span className="text-xs font-mono text-slate-300 border border-white/10 bg-slate-900/60 px-2.5 py-0.5 rounded-full">
                SEB v3.10.2 VERIFIED
              </span>
              <span className="text-xs font-mono text-emerald-300 border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
                AUTO-WHITELIST ACTIVE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <BookOpen className="w-7 h-7 text-emerald-400 shrink-0" />
              Workstation Setup &amp; <span className="text-gradient-rainbow">Field Manual</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Step-by-step hardened installation protocol for Safe Exam Browser integration, hardware activation, and AI assistant keymaps.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              to="/dashboard/licenses"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-indigo-600 to-purple-600 hover:from-emerald-400 hover:to-purple-500 text-white font-bold text-xs font-mono uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
            >
              <Key className="w-4 h-4" />
              View License Keys
            </Link>
          </div>
        </div>

        {/* Quick Jump Bar with Distinct Colors */}
        <div className="mt-8 pt-5 border-t border-white/10 flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-slate-400 font-mono text-[11px] uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1.5 font-bold">
            <Command className="w-3.5 h-3.5 text-emerald-400" /> Jump To:
          </span>
          <button 
            onClick={() => scrollToSection('step-warning')}
            className="px-3 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 font-mono font-semibold shrink-0 transition-colors"
          >
            00. DRM Protocols
          </button>
          <button 
            onClick={() => scrollToSection('step-antivirus')}
            className="px-3 py-1.5 rounded-xl bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-800/50 font-mono font-semibold shrink-0 transition-colors"
          >
            01. Windows Security
          </button>
          <button 
            onClick={() => scrollToSection('step-gemini')}
            className="px-3 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 text-purple-300 border border-purple-800/50 font-mono font-semibold shrink-0 transition-colors"
          >
            02. Gemini API
          </button>
          <button 
            onClick={() => scrollToSection('step-seb-close')}
            className="px-3 py-1.5 rounded-xl bg-sky-950/50 hover:bg-sky-900/60 text-sky-300 border border-sky-800/50 font-mono font-semibold shrink-0 transition-colors"
          >
            03. Close SEB
          </button>
          <button 
            onClick={() => scrollToSection('step-installer')}
            className="px-3 py-1.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/50 font-mono font-semibold shrink-0 transition-colors"
          >
            04. Run Installer
          </button>
          <button 
            onClick={() => scrollToSection('step-shortcuts')}
            className="px-3 py-1.5 rounded-xl bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/50 font-mono font-semibold shrink-0 transition-colors"
          >
            05. Hotkey Matrix
          </button>
          <button 
            onClick={() => scrollToSection('step-quota')}
            className="px-3 py-1.5 rounded-xl bg-yellow-950/50 hover:bg-yellow-900/60 text-yellow-300 border border-yellow-800/50 font-mono font-semibold shrink-0 transition-colors"
          >
            💡 Quota Solutions
          </button>
        </div>
      </div>

      {/* STEP 00: Critical Anti-Piracy & Auto-Deletion Warning Deck */}
      <div id="step-warning" className="relative overflow-hidden rounded-3xl border border-rose-500/40 bg-gradient-to-br from-rose-950/40 via-[#18090b] to-[#0a0506] p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 text-rose-400 shadow-md">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest uppercase px-3 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                ACTIVE DRM DEFENSE
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                ZERO REPOSITORY TAMPER TOLERANCE
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-rose-200">
              Critical Notice: Automated Time-Bomb &amp; Hardware Sentinel Protocol
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              PhantomLead features hardware-enforced DRM to safeguard test environments. Please observe the following policies before running the executable:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-black/60 border border-rose-900/50 space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider font-mono">
                  <Zap className="w-4 h-4 text-rose-400" /> Time-Bomb Expiry Automation
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  For temporary packages (1, 2, or 3 months), an automated background sentinel purges all exam files and cryptographic traces on the exact expiration timestamp. Once expired, your account reverts to an unallocated state.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/60 border border-rose-900/50 space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider font-mono">
                  <Lock className="w-4 h-4 text-rose-400" /> Admin Kill-Switch Sentinel
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Attempting to share license keys across unregistered workstations or tampering with environment hooks triggers an immediate kill-switch on startup, wiping the suite and locking future assignments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Steps Container */}
      <div className="space-y-8">

        {/* STEP 1: Antivirus & Windows Security - Warm Amber */}
        <section id="step-antivirus" className="rounded-3xl glass-panel p-6 sm:p-8 space-y-6 border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-mono font-black text-amber-400 text-base shadow-sm">
                01
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  Pre-Flight: Turn Off Windows Security
                </h3>
                <p className="text-xs text-slate-400">
                  Required before downloading or launching SecureInstaller to prevent false-positive blocks.
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-950/60 border border-amber-800/60 text-amber-300">
              MANDATORY
            </span>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-5 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <p className="mb-2">
              <strong className="text-amber-300">Why this is necessary:</strong> Windows Security (Defender) aggressively blocks custom DLL hooks, memory injections, and automated scripts used by custom Safe Exam Browser helpers.
            </p>
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-mono pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Good News: SecureInstaller automatically registers persistent exclusions during installation so your background monitor is never interrupted once set up.</span>
            </div>
          </div>

          {/* Part 1: How to Open Windows Security */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              <Terminal className="w-4 h-4 text-emerald-400" /> Method 1: Launch Windows Security Fast
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Run Command (Fastest)</span>
                  <button
                    onClick={() => copyToClipboard('windowsdefender:')}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-mono font-bold transition-colors cursor-pointer border border-amber-500/30"
                  >
                    {copiedCmd ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCmd ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Press <kbd className="bg-slate-900 border border-white/20 px-2 py-0.5 rounded text-white font-mono shadow-sm">Win + R</kbd>, paste this command and press Enter:
                </p>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-amber-500/30 font-mono text-xs text-amber-400 flex items-center justify-between">
                  <code>windowsdefender:</code>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2.5">
                <span className="text-xs font-bold text-slate-200 block">Windows Search Bar</span>
                <p className="text-xs text-slate-400">
                  Press the <kbd className="bg-slate-900 border border-white/20 px-2 py-0.5 rounded text-white font-mono shadow-sm">Windows Key</kbd> on your keyboard, type <strong className="text-white">Windows Security</strong>, and click open.
                </p>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-slate-400 font-mono">
                  App Name: Windows Security (Shield Icon)
                </div>
              </div>
            </div>
          </div>

          {/* Part 2: Interactive Toggles Visual Display */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              <Shield className="w-4 h-4 text-amber-400" /> Toggles to Deactivate in Windows Security
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Toggle 1 */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 hover:border-amber-500/40 transition-all space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">1. Real-time Protection</span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-rose-950 border border-rose-800 text-rose-300 font-black">
                    TOGGLE OFF
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Go to <strong className="text-white">Virus &amp; threat protection</strong> &rarr; click <span className="text-amber-300 underline underline-offset-2">Manage settings</span> &rarr; switch <strong className="text-rose-400">Real-time protection</strong> to <strong className="text-white">OFF</strong>.
                </p>
              </div>

              {/* Toggle 2 */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 hover:border-amber-500/40 transition-all space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">2. Cloud Protection &amp; Sample Submission</span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-rose-950 border border-rose-800 text-rose-300 font-black">
                    TOGGLE OFF
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  In the same settings page, toggle <strong className="text-rose-400">Cloud-delivered protection</strong> and <strong className="text-rose-400">Automatic sample submission</strong> to <strong className="text-white">OFF</strong>.
                </p>
              </div>

              {/* Toggle 3 */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 hover:border-amber-500/40 transition-all space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">3. App &amp; Browser Control (SmartScreen)</span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-rose-950 border border-rose-800 text-rose-300 font-black">
                    TOGGLE OFF
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  In the left sidebar, click <strong className="text-white">App &amp; browser control</strong> &rarr; click <span className="text-amber-300 underline underline-offset-2">Reputation-based protection settings</span> &rarr; turn off <strong className="text-rose-400">Check apps and files</strong>.
                </p>
              </div>

              {/* Toggle 4 */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 hover:border-amber-500/40 transition-all space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">4. Third-Party Antivirus (If Any)</span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-800 text-amber-300 font-black">
                    PAUSE SHIELD
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  If running McAfee, Avast, Kaspersky, Quick Heal, Norton, or Bitdefender, right-click its system tray icon and select <strong className="text-white">Pause Protection for 15 minutes</strong>.
                </p>
              </div>
            </div>

            {/* SmartScreen Bypass Dialog Visualizer */}
            <div className="mt-3 p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 text-emerald-300 font-bold">
                <Lightbulb className="w-4 h-4 text-emerald-400" /> If Windows SmartScreen Pop-Up Appears:
              </div>
              <p className="leading-relaxed text-slate-400">
                If Windows shows a blue dialog stating <em className="text-slate-200">"Windows protected your PC"</em>, click <strong className="text-white underline">More info</strong>, then click the newly revealed <strong className="text-emerald-400 underline">Run anyway</strong> button.
              </p>
            </div>
          </div>
        </section>

        {/* STEP 2: Gemini API Key - Electric Purple */}
        <section id="step-gemini" className="rounded-3xl glass-panel p-6 sm:p-8 space-y-6 border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center font-mono font-black text-purple-400 text-base shadow-sm">
                02
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-purple-400" />
                  Obtain Google Gemini API Key
                </h3>
                <p className="text-xs text-slate-400">
                  Required for real-time coding assistance and intelligent answer generation during exams.
                </p>
              </div>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold font-mono transition-all"
            >
              Google AI Studio
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
              <div className="text-xs font-mono font-bold text-purple-400">Step 2.1</div>
              <p className="text-xs font-bold text-white">Sign in with Google</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Navigate to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-purple-300 underline">Google AI Studio</a> and log in with your primary Google account.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
              <div className="text-xs font-mono font-bold text-purple-400">Step 2.2</div>
              <p className="text-xs font-bold text-white">Create API Key</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Click the blue <strong className="text-white">Create API Key</strong> button. Choose an existing project or allow Google to create one.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
              <div className="text-xs font-mono font-bold text-purple-400">Step 2.3</div>
              <p className="text-xs font-bold text-white">Copy to Clipboard</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Copy the generated key (starts with <code className="text-amber-300 font-mono">AIzaSy...</code>) and keep it secure. You will paste this into the installer.
              </p>
            </div>
          </div>
        </section>

        {/* STEP 3: Close Background Processes - Sky Blue */}
        <section id="step-seb-close" className="rounded-3xl glass-panel p-6 sm:p-8 space-y-6 border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center font-mono font-black text-sky-400 text-base shadow-sm">
                03
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Laptop className="w-5 h-5 text-sky-400" />
                  Terminate Any Running SEB Instances
                </h3>
                <p className="text-xs text-slate-400">
                  Ensure Safe Exam Browser is completely closed before running setup.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
              <span className="font-mono text-sky-400 font-bold block">1. Open Task Manager</span>
              <p className="text-slate-400 leading-relaxed">
                Press <kbd className="bg-slate-900 border border-white/20 px-2 py-0.5 rounded text-white font-mono">Ctrl + Shift + Esc</kbd> on your keyboard.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
              <span className="font-mono text-sky-400 font-bold block">2. Locate SEB Processes</span>
              <p className="text-slate-400 leading-relaxed">
                Look for <strong className="text-white">Safe Exam Browser</strong> or <code className="text-slate-200 font-mono">SafeExamBrowser.exe</code> in Processes.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
              <span className="font-mono text-sky-400 font-bold block">3. Click End Task</span>
              <p className="text-slate-400 leading-relaxed">
                Right-click the process and click <strong className="text-rose-400">End Task</strong> to ensure no locked files remain.
              </p>
            </div>
          </div>
        </section>

        {/* STEP 4: Run SecureInstaller - Cyber Emerald */}
        <section id="step-installer" className="rounded-3xl glass-panel p-6 sm:p-8 space-y-6 border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-mono font-black text-emerald-400 text-base shadow-sm">
                04
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Download className="w-5 h-5 text-emerald-400" />
                  Deploy SecureInstaller
                </h3>
                <p className="text-xs text-slate-400">
                  Execute the installer with administrative privileges.
                </p>
              </div>
            </div>

            {/* Direct Download Action Button */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleDownload('SecureInstaller_L.exe')}
                disabled={downloadingFile === 'SecureInstaller_L.exe'}
                className="inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition-all cursor-pointer active:scale-95 disabled:opacity-75 disabled:cursor-wait"
              >
                {downloadingFile === 'SecureInstaller_L.exe' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <Download className="w-4 h-4 text-slate-950" />
                )}
                <span>{downloadingFile === 'SecureInstaller_L.exe' ? 'Downloading...' : 'Download SecureInstaller_L.exe'}</span>
              </button>
            </div>
          </div>

          {downloadNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in duration-200">
              {downloadingFile ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{downloadNotice}</span>
            </div>
          )}


          <div className="p-5 rounded-2xl glass-panel border border-emerald-500/30 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs space-y-2">
                <span className="font-mono text-emerald-400 font-bold block">Step 1</span>
                <p className="text-white font-bold">Download Package</p>
                <p className="text-slate-400 text-[11px]">Get the tailored .exe matching your active tier.</p>
              </div>

              <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs space-y-2">
                <span className="font-mono text-emerald-400 font-bold block">Step 2</span>
                <p className="text-white font-bold">Launch Installer</p>
                <p className="text-slate-400 text-[11px]">Run the downloaded .exe. Click "Run anyway" if prompted.</p>
              </div>

              <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs space-y-2">
                <span className="font-mono text-emerald-400 font-bold block">Step 3</span>
                <p className="text-white font-bold">Input Credentials</p>
                <p className="text-slate-400 text-[11px]">Enter your License Key and Gemini API Key.</p>
              </div>

              <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs space-y-2">
                <span className="font-mono text-emerald-400 font-bold block">Step 4</span>
                <p className="text-white font-bold">Automatic Setup</p>
                <p className="text-slate-400 text-[11px]">Wait for completion. Do not close the window.</p>
              </div>
            </div>
          </div>
        </section>

        {/* STEP 5: Safe Exam Browser & Tactical Hotkey Matrix - Cosmic Violet */}
        <section id="step-shortcuts" className="rounded-3xl glass-panel p-6 sm:p-8 space-y-6 border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center font-mono font-black text-indigo-400 text-base shadow-sm">
                05
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-400" />
                  Safe Exam Browser Execution &amp; Hotkey Command Deck
                </h3>
                <p className="text-xs text-slate-400">
                  Once SEB launches in full-screen kiosk lock, trigger your specific assistant overlay via these shortcuts.
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-950/60 border border-indigo-800/60 text-indigo-300">
              RUNTIME HUD
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 text-xs text-slate-300 leading-relaxed">
            <strong className="text-indigo-300">How to launch:</strong> Open <strong className="text-white">Safe Exam Browser</strong> from your Desktop or Start Menu. SEB will lock the display into full-screen sandbox mode. Use the keybinds below to summon and dismiss assistant overlays directly inside the browser.
          </div>

          {/* High-Tech Hotkey Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Java */}
            <div className="p-4 rounded-2xl bg-black/60 border border-purple-500/30 hover:border-purple-400/60 transition-all space-y-3 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 text-base">
                    ☕
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                      Java Coding Helper
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">module: java_coding</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-3 py-1 rounded-xl bg-purple-950/80 border border-purple-500/60 text-purple-300 font-mono text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.35)]">
                    Ctrl + K
                  </kbd>
                  <span className="text-[10px] font-mono text-slate-500">(or F10)</span>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Solves syntax errors, boilerplate structures, algorithms, and JUnit test cases in real-time.
              </p>
            </div>

            {/* Python */}
            <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/30 hover:border-emerald-400/60 transition-all space-y-3 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-base">
                    🐍
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                      Python 3 Coding Helper
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">module: python_coding</span>
                  </div>
                </div>
                <kbd className="px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-mono text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.35)]">
                  Ctrl + T
                </kbd>
              </div>
              <p className="text-xs text-slate-400">
                Data structures, algorithmic scripts, competitive challenges, and automated test pass helpers.
              </p>
            </div>

            {/* C Coding */}
            <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/30 hover:border-emerald-400/60 transition-all space-y-3 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-base">
                    ⚙️
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                      C Coding Helper
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">module: c_coding</span>
                  </div>
                </div>
                <kbd className="px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-mono text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.35)]">
                  Ctrl + Y
                </kbd>
              </div>
              <p className="text-xs text-slate-400">
                Pointers, memory management, low-level data structures, and standard library routines.
              </p>
            </div>

            {/* MCQ */}
            <div className="p-4 rounded-2xl bg-black/60 border border-blue-500/30 hover:border-blue-400/60 transition-all space-y-3 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 text-base">
                    🎯
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                      LMS MCQ Helper
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">module: lms_mcq</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-3 py-1 rounded-xl bg-blue-950/80 border border-blue-500/60 text-blue-300 font-mono text-xs font-bold shadow-[0_0_15px_rgba(59,130,246,0.35)]">
                    Ctrl + J
                  </kbd>
                  <span className="text-[10px] font-mono text-slate-500">(or F8)</span>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Instant question detection, multi-choice answer verification, and option deduction engine.
              </p>
            </div>

            {/* Reasoning MCQ */}
            <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/30 hover:border-cyan-400/60 transition-all space-y-3 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-base">
                    🧩
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      LMS Reasoning MCQ Helper
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">module: reasoning_mcq</span>
                  </div>
                </div>
                <kbd className="px-3 py-1 rounded-xl bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 font-mono text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.35)]">
                  Ctrl + I
                </kbd>
              </div>
              <p className="text-xs text-slate-400">
                Logical, analytical, and visual reasoning questions with diagram extraction and radio option solver.
              </p>
            </div>

            {/* Viva Paragraph */}
            <div className="p-4 rounded-2xl bg-black/60 border border-pink-500/30 hover:border-pink-400/60 transition-all space-y-3 group md:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 text-base">
                    📝
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-pink-300 transition-colors">
                      Viva &amp; Paragraph Explainer Helper
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">module: viva_paragraph</span>
                  </div>
                </div>
                <kbd className="px-3 py-1 rounded-xl bg-pink-950/80 border border-pink-500/60 text-pink-300 font-mono text-xs font-bold shadow-[0_0_15px_rgba(236,72,153,0.35)]">
                  Ctrl + L
                </kbd>
              </div>
              <p className="text-xs text-slate-400">
                Comprehensive paragraph synthesis, theoretical explanations, viva voce response builder, and technical definitions.
              </p>
            </div>
          </div>
        </section>

        {/* PRO TIP / QUOTA RESOLUTION DECK - Warm Sunset Amber */}
        <section id="step-quota" className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-[#181107] to-black p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm">
                <Lightbulb className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-amber-200 flex items-center gap-2">
                  💡 Pro Tip: Error While Loading Answers? (API Key Quota Limit)
                </h3>
                <p className="text-xs text-slate-400">
                  Quick troubleshooting for Google Gemini free-tier daily rate limits.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              If you get an error while loading answers inside Safe Exam Browser, it is due to your <strong>Google Gemini API key daily request limit being exhausted</strong>. Free-tier API keys automatically reset after <strong>8 to 18 hours</strong>.
            </p>

            <div className="p-5 sm:p-6 rounded-2xl bg-black/60 border border-amber-500/30 space-y-4">
              <h4 className="font-mono text-xs uppercase tracking-wider text-amber-300 font-bold flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> Need it working immediately? Follow these steps:
              </h4>

              <ol className="space-y-3.5 text-xs sm:text-sm text-slate-200">
                <li className="flex items-start gap-3">
                  <span className="font-mono text-amber-400 font-bold bg-amber-950/80 border border-amber-600/60 px-2.5 py-0.5 rounded-lg text-xs shrink-0">
                    1
                  </span>
                  <span>
                    Open <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-amber-400 font-bold underline underline-offset-2 hover:text-amber-300">Google AI Studio API Keys</a>, delete your old API key, and create a <strong>new API key</strong> (or sign in with a different Google account).
                  </span>
                </li>

                <li className="flex items-start gap-3">
                  <span className="font-mono text-amber-400 font-bold bg-amber-950/80 border border-amber-600/60 px-2.5 py-0.5 rounded-lg text-xs shrink-0">
                    2
                  </span>
                  <span>
                    Launch your <strong className="text-white">SecureInstaller.exe</strong> on your computer again.
                  </span>
                </li>

                <li className="flex items-start gap-3">
                  <span className="font-mono text-amber-400 font-bold bg-amber-950/80 border border-amber-600/60 px-2.5 py-0.5 rounded-lg text-xs shrink-0">
                    3
                  </span>
                  <span>
                    Enter your <strong className="text-white">same License Key</strong> (found in your My Licenses tab) and paste the <strong className="text-white">new API key</strong> there.
                  </span>
                </li>

                <li className="flex items-start gap-3">
                  <span className="font-mono text-amber-400 font-bold bg-amber-950/80 border border-amber-600/60 px-2.5 py-0.5 rounded-lg text-xs shrink-0">
                    4
                  </span>
                  <span>
                    Click <strong className="text-emerald-400">Install</strong> and let it finish the setup.
                  </span>
                </li>

                <li className="flex items-start gap-3">
                  <span className="font-mono text-amber-400 font-bold bg-amber-950/80 border border-amber-600/60 px-2.5 py-0.5 rounded-lg text-xs shrink-0">
                    5
                  </span>
                  <span className="text-emerald-300 font-medium">
                    Relaunch <strong>Safe Exam Browser</strong> — your extensions will run smoothly with fast answer generation again!
                  </span>
                </li>
              </ol>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
