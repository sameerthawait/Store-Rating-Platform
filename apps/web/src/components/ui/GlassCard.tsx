import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/50 shadow-2xl shadow-indigo-500/10 p-8 sm:p-10 transition-all duration-300 ${className}`}
      {...props}
    >
      {/* Subtle top glare reflection */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
      {children}
    </div>
  );
};
