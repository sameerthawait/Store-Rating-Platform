import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'editorial-black' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-3.5 py-1.5 text-xs rounded-xl tracking-wide',
    md: 'px-5 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-xl',
    lg: 'px-7 py-3.5 text-sm font-semibold uppercase tracking-widest rounded-xl',
  };

  const baseStyles =
    'relative inline-flex items-center justify-center font-sans transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500/40 disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary:
      'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-obsidian-950 font-bold shadow-gold-glow hover:brightness-110 hover:shadow-gold-glow-lg border border-amber-300/40',
    'editorial-black':
      'bg-obsidian-950 text-white dark:text-amber-300 border border-white/20 dark:border-amber-500/30 hover:border-amber-400 hover:shadow-gold-glow shadow-sm',
    secondary:
      'bg-white/80 dark:bg-obsidian-900/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:border-amber-400/40 dark:hover:border-amber-400/40 backdrop-blur-md shadow-sm',
    outline:
      'border border-slate-400/50 dark:border-white/20 text-slate-800 dark:text-slate-100 hover:border-amber-500 hover:text-amber-500 dark:hover:border-amber-400 dark:hover:text-amber-400 backdrop-blur-sm',
    ghost:
      'text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/5',
    danger:
      'bg-rose-500/90 text-white hover:bg-rose-600 shadow-sm border border-rose-400/30',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="mr-2 h-3.5 w-3.5 animate-spin text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};
