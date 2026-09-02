import React, { useEffect, useRef, useState } from 'react';
import { StarRating } from './StarRating';

export interface StoreItem {
  id: string;
  name: string;
  address: string;
  overallRating: number | null;
  myRating: number | null;
}

interface StoreCardProps {
  store: StoreItem;
  onRate: (storeId: string, rating: number) => Promise<void>;
  isSubmitting?: boolean;
}

export const StoreCard: React.FC<StoreCardProps> = ({ store, onRate, isSubmitting = false }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Scroll entrance animation: triggers once per card
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (cardRef.current) {
            observer.unobserve(cardRef.current);
          }
        }
      },
      { threshold: 0.1 },
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className={`group relative overflow-hidden rounded-2xl p-6 flex flex-col justify-between space-y-5 transition-all duration-500
        bg-white/80 dark:bg-obsidian-950/70 backdrop-blur-xl 
        border border-slate-200/80 dark:border-white/10 
        shadow-glass dark:shadow-glass-dark 
        hover:translate-y-[-3px] hover:border-amber-400/40 dark:hover:border-amber-400/40 hover:shadow-gold-glow
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
    >
      {/* Specular Edge Top Reflection */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 dark:via-amber-400/40 to-transparent" />

      {/* Store Header & Overview */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-display font-bold text-slate-900 dark:text-white tracking-wide leading-snug group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
            {store.name}
          </h3>

          {/* Overall Average Rating Badge */}
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 shadow-xs flex-shrink-0">
            {store.overallRating !== null && store.overallRating !== undefined ? (
              <>
                <span className="text-amber-500 font-bold text-xs">★</span>
                <span className="text-xs font-bold font-sans text-amber-900 dark:text-amber-300">
                  {store.overallRating.toFixed(1)}
                </span>
              </>
            ) : (
              <span className="text-[11px] font-medium text-slate-400 italic">
                New Store
              </span>
            )}
          </div>
        </div>

        {/* Address Location Tag */}
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed flex items-start space-x-1.5">
          <svg
            className="h-3.5 w-3.5 text-amber-500/70 mt-0.5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>{store.address}</span>
        </p>
      </div>

      {/* Interactive Rating Control */}
      <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            {store.myRating ? 'Your Rating' : 'Rate this store'}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {store.myRating ? 'Click any star to update' : 'Select 1 to 5 stars'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <StarRating
            value={store.myRating}
            disabled={isSubmitting}
            onChange={(newRating) => onRate(store.id, newRating)}
          />
        </div>
      </div>
    </div>
  );
};
