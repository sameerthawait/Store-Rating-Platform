import React, { useState } from 'react';

interface StarRatingProps {
  value: number | null;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const displayRating = hoveredRating !== null ? hoveredRating : value || 0;

  const handleKeyDown = (e: React.KeyboardEvent, starIndex: number) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(starIndex);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(5, (value || 0) + 1);
      onChange(next);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const prev = Math.max(1, (value || 0) - 1);
      onChange(prev);
    } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
      e.preventDefault();
      onChange(parseInt(e.key, 10));
    }
  };

  return (
    <div
      className="inline-flex items-center space-x-1"
      role="radiogroup"
      aria-label="Star rating 1 to 5"
      onMouseLeave={() => !disabled && setHoveredRating(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= displayRating;

        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            tabIndex={disabled ? -1 : 0}
            disabled={disabled}
            onClick={() => !disabled && onChange(star)}
            onMouseEnter={() => !disabled && setHoveredRating(star)}
            onKeyDown={(e) => handleKeyDown(e, star)}
            className={`p-1 rounded-lg transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
              disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-110 active:scale-95'
            }`}
          >
            <svg
              className={`h-6 w-6 transition-colors duration-150 ${
                isFilled ? 'text-amber-400 fill-amber-400 drop-shadow-sm' : 'text-slate-200 fill-slate-100 hover:text-amber-200'
              }`}
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
};
