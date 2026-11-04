import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer select-none text-xs font-mono font-medium ${
        theme === 'dark'
          ? 'bg-slate-900/90 border-slate-700/80 text-amber-300 hover:border-amber-500/50 hover:bg-slate-800'
          : 'bg-white/90 border-slate-300 text-slate-800 shadow-sm hover:bg-slate-50 hover:border-slate-400'
      } ${className}`}
      title={`Toggle Light/Dark Mode (Current: ${theme.toUpperCase()})`}
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400 transition-transform hover:rotate-45" />
          <span className="hidden sm:inline text-[11px] text-slate-300">Light</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-indigo-600 transition-transform hover:-rotate-12" />
          <span className="hidden sm:inline text-[11px] text-slate-700 font-semibold">Dark</span>
        </>
      )}
    </button>
  );
};
