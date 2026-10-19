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
  Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const CustomerInstallation = () => {
  const [copiedCmd, setCopiedCmd] = useState(false);

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
    <div className="max-w-5xl mx-auto space-y-8 pb-16 px-2 sm:px-4">
      {/* Page Header Deck */}
      <div className="relative overflow-hidden rounded-2xl border border-green-500/30 bg-gradient-to-br from-[#0c120e] via-[#090b0a] to-[#050606] p-6 sm:p-8 shadow-[0_0_40px_rgba(34,197,94,0.06)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-green-500/10 border border-green-500/30 text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                DEPLOYMENT MANUAL
              </span>
              <span className="text-xs font-mono text-zinc-500 border border-zinc-800 bg-zinc-900/60 px-2.5 py-0.5 rounded-full">
                SEB v3.10.2 VERIFIED
              </span>
              <span className="text-xs font-mono text-emerald-400/90 border border-emerald-900/50 bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
                AUTO-WHITELIST ENABLED
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <BookOpen className="w-7 h-7 text-green-400 shrink-0" />
              Workstation Setup &amp; Field Guide
            </h1>
            <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Step-by-step hardened installation protocol for Safe Exam Browser integration, runtime hardware activation, and AI assistant keymaps.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              to="/dashboard/licenses"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-semibold text-xs tracking-wide shadow-lg shadow-green-500/20 transition-all active:scale-95"
            >
              <Key className="w-4 h-4" />
              View My License Keys
            </Link>
          </div>
        </div>

        {/* Quick Jump Bar */}
        <div className="mt-8 pt-5 border-t border-zinc-800/80 flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-zinc-500 font-mono text-[11px] uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Command className="w-3.5 h-3.5 text-zinc-400" /> Jump To:
          </span>
          <button 
            onClick={() => scrollToSection('step-warning')}
            className="px-3 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 font-mono shrink-0 transition-colors"
          >
            00. DRM Protocols
          </button>
          <button 
            onClick={() => scrollToSection('step-antivirus')}
            className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-mono shrink-0 transition-colors"
          >
            01. Windows Security
          </button>
          <button 
            onClick={() => scrollToSection('step-gemini')}
            className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-mono shrink-0 transition-colors"
          >
            02. Gemini API
          </button>
          <button 
            onClick={() => scrollToSection('step-seb-close')}
            className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-mono shrink-0 transition-colors"
          >
            03. Close SEB
          </button>
          <button 
            onClick={() => scrollToSection('step-installer')}
            className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-mono shrink-0 transition-colors"
          >
            04. Run Installer
          </button>
          <button 
            onClick={() => scrollToSection('step-shortcuts')}
            className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-mono shrink-0 transition-colors"
          >
            05. Hotkey Matrix
          </button>
          <button 
            onClick={() => scrollToSection('step-quota')}
            className="px-3 py-1 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/40 font-mono shrink-0 transition-colors"
          >
            Quota Solutions
          </button>
        </div>
      </div>

      {/* Critical Anti-Piracy & Auto-Deletion Warning Deck */}
      <div id="step-warning" className="relative overflow-hidden rounded-2xl border border-red-500/40 bg-gradient-to-br from-red-950/40 via-[#120708] to-black p-6 sm:p-7 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0 text-red-400">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                ACTIVE DRM DEFENSE
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                ZERO REPOSITORY TAMPER TOLERANCE
              </span>
            </div>
            <h2 className="text-lg font-bold text-red-200">
              Critical Notice: Automated Time-Bomb &amp; Hardware Sentinel Protocol
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              PhantomLead features hardware-enforced DRM to safeguard test environments. Please observe the following policies before running the executable:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-black/60 border border-red-900/50 space-y-2">
                <div className="flex items-center gap-2 text-red-300 font-semibold text-xs uppercase tracking-wider font-mono">
                  <Zap className="w-4 h-4 text-red-400" /> Time-Bomb Expiry Automation
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  For temporary packages (1, 2, or 3 months), an automated background sentinel purges all exam files and cryptographic traces on the exact expiration timestamp. Once expired, your account reverts to an unallocated state.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/60 border border-red-900/50 space-y-2">
                <div className="flex items-center gap-2 text-red-300 font-semibold text-xs uppercase tracking-wider font-mono">
                  <Lock className="w-4 h-4 text-red-400" /> Admin Kill-Switch Sentinel
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Attempting to share license keys across unregistered workstations or tampering with environment hooks triggers an immediate kill-switch on startup, wiping the suite and locking future assignments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Steps Container */}
      <div className="space-y-8">

        {/* STEP 1: Antivirus & Windows Security */}
        <section id="step-antivirus" className="rounded-2xl border border-zinc-800 bg-[#0c0d12]/90 backdrop-blur-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center font-mono font-bold text-red-400 text-sm">
                01
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                  Pre-Flight: Turn Off Windows Security
                </h3>
                <p className="text-xs text-zinc-400">
                  Required before downloading or launching SecureInstaller to prevent false-positive blocks.
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded text-[11px] font-mono bg-red-950/60 border border-red-800/60 text-red-400">
              MANDATORY
            </span>
          </div>

          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 sm:p-5 text-xs sm:text-sm text-zinc-300 leading-relaxed">
            <p className="mb-2">
              <strong className="text-red-300">Why this is necessary:</strong> Windows Security (Defender) aggressively blocks custom DLL hooks, memory injections, and automated scripts used by custom Safe Exam Browser helpers.
            </p>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono pt-1">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Good News: SecureInstaller automatically registers persistent exclusions during installation so your background monitor is never interrupted once set up.</span>
            </div>
          </div>

          {/* Part 1: How to Open Windows Security */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-zinc-300 uppercase tracking-wider">
              <Terminal className="w-4 h-4 text-zinc-400" /> Method 1: Launch Windows Security Fast
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-black/60 border border-zinc-800/90 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200">Run Command (Fastest)</span>
                  <button
                    onClick={() => copyToClipboard('windowsdefender:')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono transition-colors"
                  >
                    {copiedCmd ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCmd ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-zinc-400">
                  Press <kbd className="bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded text-white font-mono">Win + R</kbd>, paste this command and press Enter:
                </p>
                <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 font-mono text-xs text-yellow-400 flex items-center justify-between">
                  <code>windowsdefender:</code>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/60 border border-zinc-800/90 space-y-2">
                <span className="text-xs font-bold text-zinc-200 block">Windows Search Bar</span>
                <p className="text-xs text-zinc-400">
                  Press the <kbd className="bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded text-white font-mono">Windows Key</kbd> on your keyboard, type <strong className="text-white">Windows Security</strong>, and click open.
                </p>
                <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 font-mono">
                  App Name: Windows Security (Shield Icon)
                </div>
              </div>
            </div>
          </div>

          {/* Part 2: Interactive Toggles Visual Display */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-zinc-300 uppercase tracking-wider">
              <Shield className="w-4 h-4 text-red-400" /> Toggles to Deactivate in Windows Security
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Toggle 1 */}
              <div className="p-4 rounded-xl bg-black/60 border border-zinc-800 hover:border-red-500/30 transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200">1. Real-time Protection</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 border border-red-800 text-red-400 font-extrabold">
                    TOGGLE OFF
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Go to <strong className="text-white">Virus &amp; threat protection</strong> &rarr; click <span className="text-red-300 underline underline-offset-2">Manage settings</span> &rarr; switch <strong className="text-red-400">Real-time protection</strong> to <strong className="text-white">OFF</strong>.
                </p>
              </div>

              {/* Toggle 2 */}
              <div className="p-4 rounded-xl bg-black/60 border border-zinc-800 hover:border-red-500/30 transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200">2. Cloud Protection &amp; Sample Submission</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 border border-red-800 text-red-400 font-extrabold">
                    TOGGLE OFF
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  In the same settings page, toggle <strong className="text-red-400">Cloud-delivered protection</strong> and <strong className="text-red-400">Automatic sample submission</strong> to <strong className="text-white">OFF</strong>.
                </p>
              </div>

              {/* Toggle 3 */}
              <div className="p-4 rounded-xl bg-black/60 border border-zinc-800 hover:border-red-500/30 transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200">3. App &amp; Browser Control (SmartScreen)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 border border-red-800 text-red-400 font-extrabold">
                    TOGGLE OFF
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  In the left sidebar, click <strong className="text-white">App &amp; browser control</strong> &rarr; click <span className="text-red-300 underline underline-offset-2">Reputation-based protection settings</span> &rarr; turn off <strong className="text-red-400">Check apps and files</strong>.
                </p>
              </div>

              {/* Toggle 4 */}
              <div className="p-4 rounded-xl bg-black/60 border border-zinc-800 hover:border-red-500/30 transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200">4. Third-Party Antivirus (If Any)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-400 font-extrabold">
                    PAUSE SHIELD
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  If running McAfee, Avast, Kaspersky, Quick Heal, Norton, or Bitdefender, right-click its system tray icon and select <strong className="text-white">Pause Protection for 15 minutes</strong>.
                </p>
              </div>
            </div>

            {/* SmartScreen Bypass Dialog Visualizer */}
            <div className="mt-3 p-4 rounded-xl bg-blue-950/20 border border-blue-900/40 text-xs text-zinc-300 space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-bold">
                <Lightbulb className="w-4 h-4" /> If Windows SmartScreen Pop-Up Appears:
              </div>
              <p className="leading-relaxed text-zinc-400">
                If Windows shows a blue dialog stating <em className="text-zinc-200">"Windows protected your PC"</em>, click <strong className="text-white underline">More info</strong>, then click the newly revealed <strong className="text-green-400 underline">Run anyway</strong> button.
              </p>
            </div>
          </div>
        </section>

        {/* STEP 2: Gemini API Key */}
        <section id="step-gemini" className="rounded-2xl border border-zinc-800 bg-[#0c0d12]/90 backdrop-blur-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center font-mono font-bold text-green-400 text-sm">
                02
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-green-400" />
                  Obtain Google Gemini API Key
                </h3>
                <p className="text-xs text-zinc-400">
                  Required for real-time coding assistance and intelligent answer generation during exams.
                </p>
              </div>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-semibold transition-all"
            >
              Google AI Studio
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-black/60 border border-zinc-800/80 space-y-2">
              <div className="text-xs font-mono font-bold text-green-400">Step 2.1</div>
              <p className="text-xs font-semibold text-zinc-200">Sign in with Google</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Navigate to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-green-400 underline">Google AI Studio</a> and log in with your primary Google account.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/60 border border-zinc-800/80 space-y-2">
              <div className="text-xs font-mono font-bold text-green-400">Step 2.2</div>
              <p className="text-xs font-semibold text-zinc-200">Create Key</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Click the blue <strong className="text-white">Create API Key</strong> button. Choose an existing project or allow Google to create one.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/60 border border-zinc-800/80 space-y-2">
              <div className="text-xs font-mono font-bold text-green-400">Step 2.3</div>
              <p className="text-xs font-semibold text-zinc-200">Copy to Clipboard</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Copy the generated key (starts with <code className="text-amber-400 font-mono">AIzaSy...</code>) and keep it secure. You will paste this into the installer.
              </p>
            </div>
          </div>
        </section>

        {/* STEP 3: Close Background Processes */}
        <section id="step-seb-close" className="rounded-2xl border border-zinc-800 bg-[#0c0d12]/90 backdrop-blur-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-mono font-bold text-amber-400 text-sm">
                03
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Laptop className="w-5 h-5 text-amber-400" />
                  Terminate Any Running SEB Instances
                </h3>
                <p className="text-xs text-zinc-400">
                  Ensure Safe Exam Browser is completely closed before running setup.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-black/60 border border-zinc-800/80 space-y-2">
              <span className="font-mono text-amber-400 font-bold block">1. Open Task Manager</span>
              <p className="text-zinc-400 leading-relaxed">
                Press <kbd className="bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded text-white font-mono">Ctrl + Shift + Esc</kbd> on your keyboard.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-black/60 border border-zinc-800/80 space-y-2">
              <span className="font-mono text-amber-400 font-bold block">2. Locate SEB Processes</span>
              <p className="text-zinc-400 leading-relaxed">
                Look for <strong className="text-white">Safe Exam Browser</strong> or <code className="text-zinc-300 font-mono">SafeExamBrowser.exe</code> in Processes.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-black/60 border border-zinc-800/80 space-y-2">
              <span className="font-mono text-amber-400 font-bold block">3. Click End Task</span>
              <p className="text-zinc-400 leading-relaxed">
                Right-click the process and click <strong className="text-red-400">End Task</strong> to ensure no locked files remain.
              </p>
            </div>
          </div>
        </section>

        {/* STEP 4: Run SecureInstaller */}
        <section id="step-installer" className="rounded-2xl border border-zinc-800 bg-[#0c0d12]/90 backdrop-blur-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center font-mono font-bold text-blue-400 text-sm">
                04
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-400" />
                  Deploy SecureInstaller
                </h3>
                <p className="text-xs text-zinc-400">
                  Execute the installer with administrative privileges.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-gradient-to-r from-blue-950/20 to-black border border-blue-900/30 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-lg bg-black/50 border border-zinc-800 text-xs space-y-1.5">
                <span className="font-mono text-blue-400 font-semibold block">Step 1</span>
                <p className="text-zinc-200 font-bold">Download Package</p>
                <p className="text-zinc-400 text-[11px]">Get the tailored .exe matching your active tier.</p>
              </div>

              <div className="p-3.5 rounded-lg bg-black/50 border border-zinc-800 text-xs space-y-1.5">
                <span className="font-mono text-blue-400 font-semibold block">Step 2</span>
                <p className="text-zinc-200 font-bold">Launch Installer</p>
                <p className="text-zinc-400 text-[11px]">Run the downloaded .exe. Click "Run anyway" if prompted.</p>
              </div>

              <div className="p-3.5 rounded-lg bg-black/50 border border-zinc-800 text-xs space-y-1.5">
                <span className="font-mono text-blue-400 font-semibold block">Step 3</span>
                <p className="text-zinc-200 font-bold">Input Credentials</p>
                <p className="text-zinc-400 text-[11px]">Enter your License Key and Gemini API Key.</p>
              </div>

              <div className="p-3.5 rounded-lg bg-black/50 border border-zinc-800 text-xs space-y-1.5">
                <span className="font-mono text-blue-400 font-semibold block">Step 4</span>
                <p className="text-zinc-200 font-bold">Automatic Setup</p>
                <p className="text-zinc-400 text-[11px]">Wait for completion. Do not close the window.</p>
              </div>
            </div>
          </div>
        </section>

        {/* STEP 5: Safe Exam Browser & Tactical Hotkey Matrix */}
        <section id="step-shortcuts" className="rounded-2xl border border-zinc-800 bg-[#0c0d12]/90 backdrop-blur-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center font-mono font-bold text-purple-400 text-sm">
                05
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-purple-400" />
                  Safe Exam Browser Execution &amp; Hotkey Command Deck
                </h3>
                <p className="text-xs text-zinc-400">
                  Once SEB launches in full-screen kiosk lock, trigger your specific assistant overlay via these shortcuts.
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded text-[11px] font-mono bg-purple-950/60 border border-purple-800/60 text-purple-300">
              RUNTIME HUD
            </span>
          </div>

          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/40 text-xs text-zinc-300 leading-relaxed">
            <strong className="text-purple-300">How to launch:</strong> Open <strong className="text-white">Safe Exam Browser</strong> from your Desktop or Start Menu. SEB will lock the display into full-screen sandbox mode. Use the keybinds below to summon and dismiss assistant overlays directly inside the browser.
          </div>

          {/* High-Tech Hotkey Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Java */}
            <div className="p-4 rounded-xl bg-black/60 border border-purple-500/30 hover:border-purple-400/60 transition-all space-y-3 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 text-sm">
                    ☕
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                      Java Coding Helper
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-400">module: java_coding</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-2.5 py-1 rounded bg-purple-950/80 border border-purple-700/60 text-purple-300 font-mono text-xs font-bold shadow-[0_0_12px_rgba(168,85,247,0.3)]">
                    Ctrl + K
                  </kbd>
                  <span className="text-[10px] font-mono text-zinc-500">(or F10)</span>
                </div>
              </div>
              <p className="text-xs text-zinc-400">
                Solves syntax errors, boilerplate structures, algorithms, and JUnit test cases in real-time.
              </p>
            </div>

            {/* Python */}
            <div className="p-4 rounded-xl bg-black/60 border border-yellow-500/30 hover:border-yellow-400/60 transition-all space-y-3 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 text-sm">
                    🐍
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-yellow-300 transition-colors">
                      Python 3 Coding Helper
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-400">module: python_coding</span>
                  </div>
                </div>
                <kbd className="px-2.5 py-1 rounded bg-yellow-950/80 border border-yellow-700/60 text-yellow-300 font-mono text-xs font-bold shadow-[0_0_12px_rgba(234,179,8,0.3)]">
                  Ctrl + T
                </kbd>
              </div>
              <p className="text-xs text-zinc-400">
                Data structures, algorithmic scripts, competitive challenges, and automated test pass helpers.
              </p>
            </div>

            {/* C Coding */}
            <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/30 hover:border-cyan-400/60 transition-all space-y-3 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-sm">
                    ⚙️
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      C Coding Helper
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-400">module: c_coding</span>
                  </div>
                </div>
                <kbd className="px-2.5 py-1 rounded bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 font-mono text-xs font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                  Ctrl + Y
                </kbd>
              </div>
              <p className="text-xs text-zinc-400">
                Pointers, memory management, low-level data structures, and standard library routines.
              </p>
            </div>

            {/* MCQ */}
            <div className="p-4 rounded-xl bg-black/60 border border-blue-500/30 hover:border-blue-400/60 transition-all space-y-3 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 text-sm">
                    🎯
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                      LMS MCQ Helper
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-400">module: lms_mcq</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-2.5 py-1 rounded bg-blue-950/80 border border-blue-700/60 text-blue-300 font-mono text-xs font-bold shadow-[0_0_12px_rgba(59,130,246,0.3)]">
                    Ctrl + J
                  </kbd>
                  <span className="text-[10px] font-mono text-zinc-500">(or F8)</span>
                </div>
              </div>
              <p className="text-xs text-zinc-400">
                Instant question detection, multi-choice answer verification, and option deduction engine.
              </p>
            </div>

            {/* Viva Paragraph */}
            <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/30 hover:border-emerald-400/60 transition-all space-y-3 group md:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-sm">
                    📝
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                      Viva &amp; Paragraph Explainer Helper
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-400">module: viva_paragraph</span>
                  </div>
                </div>
                <kbd className="px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-mono text-xs font-bold shadow-[0_0_12px_rgba(34,197,94,0.3)]">
                  Ctrl + L
                </kbd>
              </div>
              <p className="text-xs text-zinc-400">
                Comprehensive paragraph synthesis, theoretical explanations, viva voce response builder, and technical definitions.
              </p>
            </div>
          </div>
        </section>

        {/* PRO TIP / QUOTA RESOLUTION DECK */}
        <section id="step-quota" className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-[#100c06] to-black p-6 sm:p-8 space-y-6 shadow-[0_0_30px_rgba(245,158,11,0.08)]">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-200 flex items-center gap-2">
                  Pro-Tip: "Error While Loading Answers" (Gemini Quota Reset)
                </h3>
                <p className="text-xs text-zinc-400">
                  Free-tier Google Gemini API keys are subject to daily request limits. Here is how to restore instant answers:
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              If an error appears inside SEB while requesting answers, your Google AI Studio free tier quota has reached its daily limit. Quotas reset automatically after 8 to 18 hours, or you can rotate to a fresh key instantly:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-black/60 border border-zinc-800 space-y-1.5">
                <span className="font-mono text-amber-400 font-bold text-xs">01</span>
                <p className="text-xs font-semibold text-zinc-200">Open Studio</p>
                <p className="text-[11px] text-zinc-400">Visit Google AI Studio or switch to an alternate Google account.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/60 border border-zinc-800 space-y-1.5">
                <span className="font-mono text-amber-400 font-bold text-xs">02</span>
                <p className="text-xs font-semibold text-zinc-200">Generate Key</p>
                <p className="text-[11px] text-zinc-400">Generate a new API key from the studio dashboard.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/60 border border-zinc-800 space-y-1.5">
                <span className="font-mono text-amber-400 font-bold text-xs">03</span>
                <p className="text-xs font-semibold text-zinc-200">Run Installer</p>
                <p className="text-[11px] text-zinc-400">Launch SecureInstaller.exe again on your computer.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/60 border border-zinc-800 space-y-1.5">
                <span className="font-mono text-amber-400 font-bold text-xs">04</span>
                <p className="text-xs font-semibold text-zinc-200">Paste &amp; Update</p>
                <p className="text-[11px] text-zinc-400">Enter your existing License Key and the new Gemini API Key.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/60 border border-zinc-800 space-y-1.5">
                <span className="font-mono text-amber-400 font-bold text-xs">05</span>
                <p className="text-xs font-semibold text-zinc-200">Relaunch SEB</p>
                <p className="text-[11px] text-zinc-400">Open Safe Exam Browser. Answers will now generate immediately!</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
