import React from 'react';
import { useThemeStore } from '../../store/theme.store';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Editorial Light Mode' : 'Switch to Liquid Dark Mode'}
      aria-label="Toggle visual theme"
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 ${
        isDark
          ? 'bg-obsidian-900/80 text-amber-400 hover:text-amber-300 border border-white/10 hover:border-amber-500/30 hover:shadow-gold-glow'
          : 'bg-white/80 text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-amber-400/50 shadow-sm'
      } backdrop-blur-md ${className}`}
    >
      {isDark ? (
        // Sun Icon for Dark Mode (indicating switch to light)
        <svg
          className="h-4 w-4 transition-transform duration-300 rotate-0 hover:rotate-45"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        // Moon Icon for Light Mode (indicating switch to dark)
        <svg
          className="h-4 w-4 transition-transform duration-300 -rotate-12 hover:rotate-0 text-slate-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
};
