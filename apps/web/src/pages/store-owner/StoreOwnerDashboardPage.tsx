import { StoreRaterDto } from '@ratehub/shared';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Store Owner Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Live customer ratings and performance analytics for your store
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            <div className="h-36 rounded-2xl bg-white/50 border border-white/60 p-6" />
            <div className="h-36 rounded-2xl bg-white/50 border border-white/60 p-6" />
            <div className="h-36 rounded-2xl bg-white/50 border border-white/60 p-6" />
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {(error as any).message || 'Failed to load store owner dashboard.'}
          </div>
        ) : (
          <>
            {/* Stat Cards Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Store Profile Card */}
              <GlassCard className="p-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Store Profile
                  </span>
                  <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">🏪</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 truncate">
                  {data?.store?.name || 'Unassigned Store'}
                </h3>
                <p className="text-xs text-slate-500 truncate">{data?.store?.address}</p>
                <p className="text-xs text-slate-400">{data?.store?.email}</p>
              </GlassCard>

              {/* Average Rating Card */}
              <GlassCard className="p-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Overall Average
                  </span>
                  <span className="p-2 rounded-xl bg-amber-50 text-amber-500 font-bold">★</span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {data?.averageRating !== null && data?.averageRating !== undefined
                      ? data.averageRating.toFixed(1)
                      : 'N/A'}
                  </span>
                  <span className="text-xs text-slate-400">/ 5.0</span>
                </div>
                <p className="text-xs text-slate-500">
                  {data?.averageRating !== null
                    ? 'Based on all customer feedback'
                    : 'No ratings submitted yet'}
                </p>
              </GlassCard>

              {/* Total Reviews Card */}
              <GlassCard className="p-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Total Reviews
                  </span>
                  <span className="p-2 rounded-xl bg-purple-50 text-purple-600">💬</span>
                </div>
                <div className="text-3xl font-extrabold text-slate-900">
                  {data?.totalRatings || 0}
                </div>
                <p className="text-xs text-slate-500">Unique customer ratings</p>
              </GlassCard>
            </div>

            {/* Customer Ratings Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Customer Ratings & Feedback</h2>
                <span className="text-xs text-slate-500 font-medium">
                  {data?.raters?.length || 0} Raters
                </span>
              </div>

              <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-sm overflow-hidden">
                {data?.raters?.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-sm font-semibold text-slate-700">No ratings yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Customer ratings for your store will appear here in real time.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                      <thead>
                        <tr className="bg-slate-50/50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          <th className="py-3.5 px-6">Customer Name</th>
                          <th className="py-3.5 px-6">Submitted Rating</th>
                          <th className="py-3.5 px-6">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/60 bg-transparent text-xs text-slate-700">
                        {data?.raters?.map((r, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-indigo-50/20 transition-colors duration-150"
                          >
                            <td className="py-3.5 px-6 font-semibold text-slate-900">
                              {r.name || 'Anonymous Customer'}
                            </td>
                            <td className="py-3.5 px-6">
                              <div className="inline-flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span
                                    key={star}
                                    className={`text-sm ${
                                      star <= r.rating ? 'text-amber-400' : 'text-slate-200'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                                <span className="ml-1.5 font-bold text-slate-900 text-xs">
                                  {r.rating} / 5
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-6 text-slate-500">
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
