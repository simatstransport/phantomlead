import React, { useState } from 'react';
import { 
  Sparkles, HelpCircle, Laptop, Zap, BookOpen 
} from 'lucide-react';
import { getToolsForPackage, ToolGuide } from '../utils/packageToolGuides';

interface PackageToolsUsageCardProps {
  packageCode?: string | null;
  packageName?: string | null;
}

export const PackageToolsUsageCard: React.FC<PackageToolsUsageCardProps> = ({
  packageCode,
  packageName,
}) => {
  const tools: ToolGuide[] = getToolsForPackage(packageCode);
  const [activeToolId, setActiveToolId] = useState<string>(tools[0]?.id || 'java');

  const currentTool = tools.find((t) => t.id === activeToolId) || tools[0];

  if (!tools || tools.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#09090b]/90 border border-emerald-500/30 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-500/10 via-cyan-500/10 to-transparent blur-3xl pointer-events-none" />

      {/* Header Deck */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Your Active Plan Tools &amp; Hotkeys
            </span>
            <span className="text-xs font-mono text-slate-400 bg-slate-900 border border-white/10 px-2.5 py-0.5 rounded-full">
              [{packageCode || 'PACKAGE'}]
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            How to Use Your Assistants
          </h3>
          <p className="text-xs text-slate-400">
            Tailored hotkey controls and sandbox replacement instructions for <strong className="text-white">{packageName || 'Your Subscribed Package'}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            {tools.length} Assistant{tools.length > 1 ? 's' : ''} Enabled
          </span>
        </div>
      </div>

      {/* Tool Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none relative z-10">
        {tools.map((tool) => {
          const isActive = tool.id === currentTool?.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveToolId(tool.id)}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer border ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/20'
                  : 'bg-black/60 text-slate-400 border-white/10 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-sm">{tool.icon}</span>
              <span>{tool.name}</span>
              <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-black/80 border border-white/20 text-slate-300 font-sans">
                {tool.shortcut}
              </kbd>
            </button>
          );
        })}
      </div>

      {/* Active Tool Detailed Operational Manual Card */}
      {currentTool && (
        <div className="relative rounded-2xl bg-black/70 border border-white/10 p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                {currentTool.icon}
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                  {currentTool.badge}
                </span>
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{currentTool.name}</span>
                </h4>
              </div>
            </div>

            {/* Hotkey Keybind Pill */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Trigger Hotkey:</span>
              <kbd className="px-4 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 font-mono text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                {currentTool.shortcut}
              </kbd>
              {currentTool.secondaryShortcut && (
                <span className="text-[11px] font-mono text-slate-500">
                  (or {currentTool.secondaryShortcut})
                </span>
              )}
            </div>
          </div>

          {/* Sequential Step-by-Step Execution Guide */}
          <div className="space-y-3 pt-2">
            <h5 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentTool.instructionTitle}</span>
            </h5>

            <div className="grid grid-cols-1 gap-2.5">
              {currentTool.instructions.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-300 leading-relaxed font-sans"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold flex items-center justify-center text-[11px] shrink-0">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Tip Footer */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2 font-mono">
            <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Pro-Tip:</strong> {currentTool.tips}
            </span>
          </div>
        </div>
      )}

      {/* Global SEB v3.10.2 Workflow Reminder */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 font-sans">
        <div className="flex items-center gap-2.5">
          <Laptop className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Launch <strong>Safe Exam Browser</strong> first. All hotkeys inject HUD overlays directly onto the exam screen.</span>
        </div>
        <span className="font-mono text-cyan-400 font-semibold shrink-0">
          SEB v3.10.2 Fully Supported
        </span>
      </div>
    </div>
  );
};
