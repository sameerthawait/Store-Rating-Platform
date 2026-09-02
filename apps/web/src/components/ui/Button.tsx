import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium rounded-xl px-5 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary:
      'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-indigo-600 focus:ring-indigo-500/20 active:from-indigo-700 active:to-indigo-800',
    secondary:
      'bg-white/80 text-slate-700 backdrop-blur-md border border-slate-200/80 shadow-sm hover:bg-white hover:border-slate-300 focus:ring-slate-400/20',
    outline:
      'border border-indigo-600/30 text-indigo-600 hover:bg-indigo-50/50 focus:ring-indigo-500/20',
    ghost:
      'text-slate-600 hover:bg-slate-100/60 hover:text-slate-900 focus:ring-slate-300/20',
    danger:
      'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-500/25 hover:from-rose-500 hover:to-rose-600 focus:ring-rose-500/20',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin text-current"
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
