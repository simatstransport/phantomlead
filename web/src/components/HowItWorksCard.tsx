import { Terminal, Sparkles, Key, ShieldCheck } from 'lucide-react';

export const HowItWorksCard = () => {
  return (
    <section className="mt-8 bg-zinc-950 border border-cyan-900/40 rounded-xl p-6 relative overflow-hidden shadow-xl shadow-cyan-950/15">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase tracking-wider flex items-center gap-1.5 font-mono shadow-[0_0_10px_rgba(6,182,212,0.15)]">
            <ShieldCheck className="w-3.5 h-3.5" /> How It Works
          </span>
          <span className="text-xs text-zinc-400 font-mono">SEB v3.10.2 Verified</span>
        </div>
      </div>

      <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
        Suite for SEB 3.10.2: Seamless AI Answer &amp; Code Pasting
      </h3>

      <p className="text-sm text-zinc-300 leading-relaxed max-w-3xl mb-6">
        Enables seamless AI-powered Java and coding answer pasting directly inside{' '}
        <span className="text-cyan-400 font-semibold drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">SafeExamBrowser (SEB 3.10.2)</span>. The suite is engineered specifically to operate inside the secure SEB environment.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-zinc-800/80">
        {/* Card 1: SEB Execution */}
        <div className="bg-[#070b14] border border-zinc-800/80 hover:border-cyan-500/50 transition-all rounded-xl p-5 group">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 shadow-[0_0_15px_rgba(6,182,212,0.25)] group-hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all">
            <Terminal className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1.5 group-hover:text-cyan-300 transition-colors">SEB 3.10.2 In-Session Pasting</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Runs seamlessly inside SafeExamBrowser 3.10.2, enabling automated, fluid pasting of Java code, syntax, and complex answers.
          </p>
        </div>

        {/* Card 2: Viva Answer Producer */}
        <div className="bg-[#070b14] border border-zinc-800/80 hover:border-cyan-500/50 transition-all rounded-xl p-5 group">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 shadow-[0_0_15px_rgba(6,182,212,0.25)] group-hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all">
            <Sparkles className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1.5 group-hover:text-cyan-300 transition-colors">Viva Answer Producer Suite</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            All specialized tools for real-time viva explanations, theoretical breakdowns, and rapid answer generation are fully available and ready.
          </p>
        </div>

        {/* Card 3: Requirements */}
        <div className="bg-[#070b14] border border-zinc-800/80 hover:border-cyan-500/50 transition-all rounded-xl p-5 group">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 shadow-[0_0_15px_rgba(6,182,212,0.25)] group-hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all">
            <Key className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1.5 group-hover:text-cyan-300 transition-colors">What You Need</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Zero complicated configuration. All you need to start is your software license key and your own personal{' '}
            <span className="text-cyan-400 font-semibold">Gemini API Key</span>.
          </p>
        </div>
      </div>

      {/* License Rules Notice */}
      <div className="mt-6 p-4 rounded-xl border border-red-900/40 bg-red-950/20 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-bold text-red-300 block uppercase tracking-wider text-[11px] font-mono">
            Strict License Protection Policy
          </span>
          <p className="text-zinc-300 leading-relaxed">
            Do not attempt to share your installed application or drive files. If you share or transfer these files, your license will be permanently canceled immediately with no refund.
          </p>
        </div>
      </div>
    </section>
  );
};
