import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="flex flex-col space-y-1.5 w-full text-left">
        <label
          htmlFor={inputId}
          className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={`w-full rounded-xl px-4 py-2.5 text-sm transition-all duration-200 outline-none backdrop-blur-md
              bg-white/70 dark:bg-obsidian-900/70 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500
              ${
                error
                  ? 'border border-rose-500/80 bg-rose-50/20 dark:bg-rose-950/20 focus:ring-2 focus:ring-rose-500/20'
                  : 'border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 focus:border-amber-400 dark:focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:focus:ring-amber-400/20'
              }
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1 mt-1">
            <svg className="h-3 w-3 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
