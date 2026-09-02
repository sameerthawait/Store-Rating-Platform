import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gold' | 'flat';
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  variant = 'default',
  hoverEffect = false,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'gold':
        return 'border-amber-500/30 bg-gradient-to-b from-amber-500/[0.07] to-transparent dark:from-amber-500/[0.08] dark:to-obsidian-950/70 shadow-gold-glow';
      case 'flat':
        return 'bg-white/50 dark:bg-obsidian-900/40 border-slate-200/60 dark:border-white/5';
      default:
        return 'bg-white/75 dark:bg-obsidian-950/60 border-slate-200/80 dark:border-white/10 shadow-glass dark:shadow-glass-dark';
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl backdrop-blur-xl border transition-all duration-300 ${getVariantStyles()} ${
        hoverEffect
          ? 'hover:translate-y-[-2px] hover:border-amber-500/40 hover:shadow-gold-glow'
          : ''
      } ${className}`}
      {...props}
    >
      {/* Specular top reflection line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 dark:via-amber-400/30 to-transparent" />
      {children}
    </div>
  );
};
