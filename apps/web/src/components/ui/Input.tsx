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
          className="text-xs font-semibold uppercase tracking-wider text-slate-700"
        >
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={`w-full rounded-xl bg-white/60 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 backdrop-blur-md border transition-all duration-200 outline-none
              ${
                error
                  ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                  : 'border-slate-200/80 hover:border-slate-300 focus:border-indigo-500 focus:bg-white/90 focus:ring-4 focus:ring-indigo-500/15'
              }
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs font-medium text-rose-500 animate-fadeIn">{error}</p>
        )}
        {!error && helperText && (
          <p className="text-xs text-slate-500">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
