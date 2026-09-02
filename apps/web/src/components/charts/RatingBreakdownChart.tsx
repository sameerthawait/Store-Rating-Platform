import React from 'react';

interface RaterItem {
  rating: number;
}

interface RatingBreakdownChartProps {
  ratings: RaterItem[];
  averageRating: number | null;
  totalRatings: number;
}

export const RatingBreakdownChart: React.FC<RatingBreakdownChartProps> = ({
  ratings,
  averageRating,
  totalRatings,
}) => {
  // Calculate distribution for 1 to 5 stars
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  ratings.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) {
      counts[r.rating as 1 | 2 | 3 | 4 | 5] = (counts[r.rating as 1 | 2 | 3 | 4 | 5] || 0) + 1;
    }
  });

  const tiers = [5, 4, 3, 2, 1] as const;

  return (
    <div className="p-6 rounded-2xl bg-white/70 dark:bg-obsidian-950/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-glass dark:shadow-glass-dark space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Rating Distribution & Analytics
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Breakdown across all verified customer scores
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-2xl font-bold font-display text-slate-900 dark:text-white">
              {averageRating !== null && averageRating !== undefined
                ? averageRating.toFixed(1)
                : '0.0'}
            </div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-amber-500">
              Overall Score
            </div>
          </div>
          <div className="flex items-center text-amber-400 text-lg">★</div>
        </div>
      </div>

      {/* 5-Star down to 1-Star Progress Rows */}
      <div className="space-y-3">
        {tiers.map((star) => {
          const count = counts[star];
          const percentage = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;

          return (
            <div key={star} className="flex items-center space-x-3 text-xs group">
              {/* Star Label */}
              <div className="w-12 flex items-center space-x-1 font-semibold text-slate-700 dark:text-slate-300">
                <span>{star}</span>
                <span className="text-amber-400">★</span>
              </div>

              {/* Progress Bar Track */}
              <div className="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-obsidian-900/80 overflow-hidden relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 transition-all duration-700 ease-out group-hover:brightness-110 shadow-sm"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Percent & Count */}
              <div className="w-20 text-right flex items-center justify-end space-x-1.5 text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  {percentage}%
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  ({count})
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Chips */}
      <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-500/20 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          {totalRatings > 0
            ? `${Math.round(((counts[5] + counts[4]) / totalRatings) * 100)}% Positive Sentiment`
            : 'No reviews yet'}
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-medium">
          Total Reviews: {totalRatings}
        </span>
      </div>
    </div>
  );
};
