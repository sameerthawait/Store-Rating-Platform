import { StoreRaterDto } from '@ratehub/shared';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { RatingBreakdownChart } from '../../components/charts/RatingBreakdownChart';
import { Navbar } from '../../components/layout/Navbar';
import { GlassCard } from '../../components/ui/GlassCard';
import { apiClient } from '../../lib/api-client';

interface StoreOverview {
  id: string;
  name: string;
  email: string;
  address: string;
}

interface StoreOwnerDashboardData {
  store: StoreOverview;
  averageRating: number | null;
  totalRatings: number;
  raters: StoreRaterDto[];
}

export const StoreOwnerDashboardPage: React.FC = () => {
  const { data, isLoading, error } = useQuery<StoreOwnerDashboardData>({
    queryKey: ['store-owner-dashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/store-owner/dashboard');
      return res.data;
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-obsidian-950 ambient-mesh text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-white/10">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2">
              <span className="h-px w-6 bg-amber-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                Merchant Intelligence
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
              Store Analytics Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Real-time customer rating analytics, score distributions, and feedback history
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            <div className="h-36 rounded-2xl bg-white/40 dark:bg-obsidian-950/40 border border-slate-200/50 dark:border-white/5 p-6" />
            <div className="h-36 rounded-2xl bg-white/40 dark:bg-obsidian-950/40 border border-slate-200/50 dark:border-white/5 p-6" />
            <div className="h-36 rounded-2xl bg-white/40 dark:bg-obsidian-950/40 border border-slate-200/50 dark:border-white/5 p-6" />
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm">
            {(error as any).message || 'Failed to load store owner dashboard.'}
          </div>
        ) : (
          <>
            {/* Stat Cards Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Store Profile Card */}
              <GlassCard className="p-6 space-y-3" variant="default" hoverEffect>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                    Store Identity
                  </span>
                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500">🏪</span>
                </div>
                <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white truncate">
                  {data?.store?.name || 'Unassigned Store'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{data?.store?.address}</p>
                <div className="pt-2 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-400 dark:text-slate-500">
                  {data?.store?.email}
                </div>
              </GlassCard>

              {/* Overall Average Rating Card */}
              <GlassCard className="p-6 space-y-2" variant="gold" hoverEffect>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                    Average Score
                  </span>
                  <span className="text-amber-400 text-lg">★</span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-extrabold font-display text-slate-900 dark:text-white">
                    {data?.averageRating !== null && data?.averageRating !== undefined
                      ? data.averageRating.toFixed(1)
                      : '0.0'}
                  </span>
                  <span className="text-xs text-slate-400">/ 5.0</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {data?.averageRating !== null
                    ? 'Computed live from customer reviews'
                    : 'Awaiting initial reviews'}
                </p>
              </GlassCard>

              {/* Total Customer Ratings Card */}
              <GlassCard className="p-6 space-y-2" variant="default" hoverEffect>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                    Total Reviews
                  </span>
                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500">💬</span>
                </div>
                <div className="text-4xl font-extrabold font-display text-slate-900 dark:text-white">
                  {data?.totalRatings || 0}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Unique verified raters</p>
              </GlassCard>
            </div>

            {/* Visual Rating Breakdown Distribution Chart */}
            <RatingBreakdownChart
              ratings={data?.raters || []}
              averageRating={data?.averageRating ?? null}
              totalRatings={data?.totalRatings || 0}
            />

            {/* Customer Ratings Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white tracking-wide">
                    Customer Reviews History
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Individual ratings submitted by platform users
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                  {data?.raters?.length || 0} Submissions
                </span>
              </div>

              <div className="rounded-2xl bg-white/70 dark:bg-obsidian-950/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-glass dark:shadow-glass-dark overflow-hidden">
                {data?.raters?.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No ratings yet</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Customer feedback for your store will appear here dynamically.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 dark:divide-white/5">
                      <thead>
                        <tr className="bg-slate-50/60 dark:bg-obsidian-900/40 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          <th className="py-3.5 px-6">Customer</th>
                          <th className="py-3.5 px-6">Submitted Rating</th>
                          <th className="py-3.5 px-6">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs text-slate-700 dark:text-slate-300">
                        {data?.raters?.map((r, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-amber-500/5 transition-colors duration-150"
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-3">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-obsidian-950 font-bold flex items-center justify-center text-xs shadow-xs">
                                  {r.name ? r.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                  {r.name || 'Anonymous Customer'}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="inline-flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span
                                    key={star}
                                    className={`text-sm ${
                                      star <= r.rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-700'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                                <span className="ml-2 font-bold text-slate-900 dark:text-white text-xs">
                                  {r.rating} / 5
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-slate-500 dark:text-slate-400">
                              {r.submittedAt
                                ? new Date(r.submittedAt).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : 'Recent'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
