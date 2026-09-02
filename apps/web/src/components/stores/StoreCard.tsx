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

  // Scroll entrance: triggers once per card
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
      className={`rounded-2xl bg-white/80 backdrop-blur-md border border-white/70 shadow-lg shadow-indigo-500/5 p-6 flex flex-col justify-between space-y-5 transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      {/* Store Header & Overview */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
            {store.name}
          </h3>

          {/* Overall Average Rating Badge */}
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 shadow-xs flex-shrink-0">
            {store.overallRating !== null && store.overallRating !== undefined ? (
              <>
                <span className="text-amber-500 font-bold text-xs">★</span>
                <span className="text-xs font-bold text-slate-800">
                  {store.overallRating.toFixed(1)}
                </span>
              </>
            ) : (
              <span className="text-[11px] font-medium text-slate-400 italic">
                No ratings yet
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed flex items-start space-x-1.5">
          <svg
            className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0"
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
      <div className="pt-4 border-t border-slate-100/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col space-y-0.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">
            {store.myRating ? 'Your Rating' : 'Rate this store'}
          </span>
          <span className="text-[10px] text-slate-400">
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
