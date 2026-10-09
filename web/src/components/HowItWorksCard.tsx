import { Terminal, Sparkles, Key, ShieldCheck } from 'lucide-react';

export const HowItWorksCard = () => {
  return (
    <section className="mt-8 bg-zinc-950 border border-green-900/40 rounded-xl p-6 relative overflow-hidden shadow-xl shadow-green-950/10">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/30 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> How It Works
          </span>
          <span className="text-xs text-gray-400 font-mono">SEB v3.10.2 Verified</span>
        </div>
      </div>

      <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
        Suite for SEB 3.10.2: Seamless AI Answer & Code Pasting
      </h3>

      <p className="text-sm text-gray-300 leading-relaxed max-w-3xl mb-6">
        Enables seamless AI-powered Java and coding answer pasting directly inside{' '}
        <span className="text-green-400 font-semibold">SafeExamBrowser (SEB 3.10.2)</span>. The suite is engineered specifically to operate inside the secure SEB environment.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-800/80">
        {/* Card 1: SEB Execution */}
        <div className="bg-[#0b0f0c] border border-gray-800/80 hover:border-green-800/50 transition-all rounded-lg p-5">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 mb-3 shadow-[0_0_12px_rgba(34,197,94,0.15)]">
            <Terminal className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1.5">SEB 3.10.2 In-Session Pasting</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            Runs seamlessly inside SafeExamBrowser 3.10.2, enabling automated, fluid pasting of Java code, syntax, and complex answers.
          </p>
        </div>

        {/* Card 2: Viva Answer Producer */}
        <div className="bg-[#0b0f0c] border border-gray-800/80 hover:border-green-800/50 transition-all rounded-lg p-5">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 mb-3 shadow-[0_0_12px_rgba(34,197,94,0.15)]">
            <Sparkles className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1.5">Viva Answer Producer Suite</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            All specialized tools for real-time viva explanations, theoretical breakdowns, and rapid answer generation are fully available and ready.
          </p>
        </div>

        {/* Card 3: Requirements */}
        <div className="bg-[#0b0f0c] border border-gray-800/80 hover:border-green-800/50 transition-all rounded-lg p-5">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 mb-3 shadow-[0_0_12px_rgba(34,197,94,0.15)]">
            <Key className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1.5">What You Need</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            Zero complicated configuration. All you need to start is your software license key and your own personal{' '}
            <span className="text-green-400 font-semibold">Gemini API Key</span>.
          </p>
        </div>
      </div>
    </section>
  );
};
