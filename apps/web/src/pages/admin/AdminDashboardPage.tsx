import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { GlassCard } from '../../components/ui/GlassCard';
import { apiClient } from '../../lib/api-client';

interface DashboardMetrics {
  totalUsers: number;
  totalStores: number;
  totalRatings: number;
}

export const AdminDashboardPage: React.FC = () => {
  const { data: metrics, isLoading, isError } = useQuery<DashboardMetrics>({
    queryKey: ['admin-dashboard-metrics'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/dashboard');
      return res.data;
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Platform Overview
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Live aggregate statistics and platform management
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/admin/users"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white/80 hover:bg-white border border-slate-200/80 shadow-sm transition-all"
            >
              Manage Users
            </Link>
            <Link
              to="/admin/stores"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all"
            >
              Manage Stores
            </Link>
          </div>
        </div>

        {/* 3 Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Users */}
          <GlassCard className="flex items-center space-x-5 p-6 sm:p-6">
            <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Users
              </p>
              {isLoading ? (
                <div className="h-8 w-20 bg-slate-200 animate-pulse rounded mt-1" />
              ) : (
                <h3 className="text-3xl font-bold text-slate-900 mt-0.5">
                  {metrics?.totalUsers ?? 0}
                </h3>
              )}
            </div>
          </GlassCard>

          {/* Total Stores */}
          <GlassCard className="flex items-center space-x-5 p-6 sm:p-6">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Stores
              </p>
              {isLoading ? (
                <div className="h-8 w-20 bg-slate-200 animate-pulse rounded mt-1" />
              ) : (
                <h3 className="text-3xl font-bold text-slate-900 mt-0.5">
                  {metrics?.totalStores ?? 0}
                </h3>
              )}
            </div>
          </GlassCard>

          {/* Total Ratings */}
          <GlassCard className="flex items-center space-x-5 p-6 sm:p-6">
            <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Submitted Ratings
              </p>
              {isLoading ? (
                <div className="h-8 w-20 bg-slate-200 animate-pulse rounded mt-1" />
              ) : (
                <h3 className="text-3xl font-bold text-slate-900 mt-0.5">
                  {metrics?.totalRatings ?? 0}
                </h3>
              )}
            </div>
          </GlassCard>
        </div>
      </main>
    </div>
  );
};
