/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Anton"', 'Impact', 'sans-serif'],
        cinematic: ['"Oswald"', 'sans-serif'],
        serifDisplay: ['"Cinzel"', 'serif'],
      },
      colors: {
        cinema: {
          black: '#000000',
          dark: '#050505',
          panel: '#09090b',
          paper: '#ededed',
          dim: '#8a8a8a',
          dimmer: '#4e4e4e',
          red: '#de1b1c',
          'red-hot': '#ff2a2b',
          amber: '#e5a93b',
          gold: '#d4af37',
        },
        fincher: {
          obsidian: '#07090e',
          gunmetal: '#0d1117',
          steel: '#161b22',
          border: 'rgba(255, 255, 255, 0.08)',
          'light-bg': '#f8fafc',
          'light-panel': '#ffffff',
          'light-border': '#e2e8f0',
        },
        cyber: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          neon: '#00f0ff',
        },
        electric: {
          violet: '#8b5cf6',
          purple: '#a855f7',
          fuchsia: '#d946ef',
          pink: '#ec4899',
          indigo: '#6366f1',
          emerald: '#10b981',
          amber: '#f59e0b',
        }
      },
      boxShadow: {
        'glow-cyan': '0 0 25px rgba(6, 182, 212, 0.45)',
        'glow-indigo': '0 0 25px rgba(99, 102, 241, 0.45)',
        'glow-purple': '0 0 25px rgba(168, 85, 247, 0.45)',
        'glow-pink': '0 0 25px rgba(236, 72, 153, 0.45)',
        'glow-emerald': '0 0 25px rgba(16, 185, 129, 0.45)',
        'glow-amber': '0 0 25px rgba(245, 158, 11, 0.45)',
        'glass-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s infinite linear',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.85' },
        }
      }
    },
  },
  plugins: [],
}
