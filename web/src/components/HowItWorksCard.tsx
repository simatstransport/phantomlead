import { Terminal, Sparkles, ShieldCheck, Lock } from 'lucide-react';

export const HowItWorksCard = () => {
  return (
    <section className="mt-8 relative overflow-hidden rounded-2xl glass-panel p-6 sm:p-8 shadow-2xl border border-white/10">
      {/* Background Ambient Orbs */}
      <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider flex items-center gap-1.5 font-mono shadow-sm">
              <ShieldCheck className="w-4 h-4 text-cyan-400" /> How It Works
            </span>
            <span className="text-xs text-slate-400 font-mono px-2.5 py-0.5 rounded-full bg-slate-900/60 border border-white/5">
              SEB v3.10.2 Verified
            </span>
          </div>
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Hardened Safe Exam Environment
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight">
          Next-Gen AI Suite for Safe Exam Browser: <span className="text-gradient-rainbow">Zero-Lag In-Session Pasting</span>
        </h3>

        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl mb-8">
          Enables seamless, fluid AI-powered Java and coding answer pasting directly inside{' '}
          <strong className="text-cyan-300 font-semibold underline decoration-cyan-500/40 underline-offset-2">SafeExamBrowser 3.10.2</strong>. 
          The suite operates in low-level memory, invisible to browser heuristics and screen blockers.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6 border-t border-white/10">
          {/* Card 1: SEB Execution - Electric Cyan */}
          <div className="glass-panel-interactive rounded-2xl p-5 group border border-cyan-500/20 hover:border-cyan-400/50 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_20px_rgba(6,182,212,0.25)] group-hover:scale-105 transition-transform">
              <Terminal className="w-6 h-6" />
            </div>
            <div className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 mb-2">
              CORE PROTOCOL
            </div>
            <h4 className="text-base font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
              SEB 3.10.2 Native Injection
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bypasses browser clipboard lockdown smoothly. Paste Java, Python, and C answers without triggering browser security alerts.
            </p>
          </div>

          {/* Card 2: Viva Answer Producer - Radiant Violet / Purple */}
          <div className="glass-panel-interactive rounded-2xl p-5 group border border-purple-500/20 hover:border-purple-400/50 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 shadow-[0_0_20px_rgba(168,85,247,0.25)] group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-purple-500/10 text-purple-300 border border-purple-500/20 mb-2">
              REAL-TIME AI
            </div>
            <h4 className="text-base font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
              Viva &amp; Code Synthesis
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Powered by high-speed Gemini AI models. Generates instant paragraph explanations, step-by-step logic, and syntax-correct code.
            </p>
          </div>

          {/* Card 3: Requirements - Mint Emerald */}
          <div className="glass-panel-interactive rounded-2xl p-5 group border border-emerald-500/20 hover:border-emerald-400/50 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.25)] group-hover:scale-105 transition-transform">
              <Lock className="w-6 h-6" />
            </div>
            <div className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 mb-2">
              ZERO-FOOTPRINT DRM
            </div>
            <h4 className="text-base font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
              Hardware Lock &amp; Clean Wipe
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Binds securely to your single PC. When your session ends or license expires, auto-wipes all files leaving your host completely clean.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
