import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { StoreCard, StoreItem } from '../../components/stores/StoreCard';
import { useDebounce } from '../../hooks/useDebounce';
import { apiClient } from '../../lib/api-client';

export const StoresPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [page, setPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Fetch stores discovery query
  const { data, isLoading } = useQuery({
    queryKey: ['user-stores', { search: debouncedSearch, page }],
    queryFn: async () => {
      const res = await apiClient.get('/stores', {
        params: {
          search: debouncedSearch || undefined,
          page,
          limit: 12,
        },
      });
      return res.data;
    },
  });

  // 2. Optimistic Rating Mutation
  const rateMutation = useMutation({
    mutationFn: async ({ storeId, rating }: { storeId: string; rating: number }) => {
      const res = await apiClient.post('/ratings', { storeId, rating });
      return res.data;
    },
    onMutate: async ({ storeId, rating }) => {
      setErrorMessage(null);
      await queryClient.cancelQueries({ queryKey: ['user-stores'] });

      const previousData = queryClient.getQueryData(['user-stores', { search: debouncedSearch, page }]);

      queryClient.setQueryData(['user-stores', { search: debouncedSearch, page }], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((item: StoreItem) => {
            if (item.id === storeId) {
              return {
                ...item,
                myRating: rating,
              };
            }
            return item;
          }),
        };
      });

      return { previousData };
    },
    onError: (err: any, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ['user-stores', { search: debouncedSearch, page }],
          context.previousData,
        );
      }
      setErrorMessage(err.message || 'Failed to submit rating. Please try again.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user-stores'] });
    },
  });

  const handleRate = async (storeId: string, rating: number) => {
    await rateMutation.mutateAsync({ storeId, rating });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-obsidian-950 dark:ambient-mesh-dark ambient-mesh-light text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
        {/* Luxury Editorial Hero Section */}
        <div className="relative rounded-3xl p-8 sm:p-12 overflow-hidden bg-white/60 dark:bg-obsidian-950/60 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 shadow-glass dark:shadow-glass-dark">
          {/* Subtle gold specular line */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
          
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center space-x-2">
              <span className="h-px w-8 bg-amber-500" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                Discover & Rate
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-display font-bold text-slate-950 dark:text-white tracking-tight leading-tight">
              The Curated Collection of <span className="text-gold-gradient">Registered Stores</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-editorial text-base sm:text-lg leading-relaxed max-w-2xl">
              Explore authentic businesses on the platform, view verified community ratings, and submit your personal feedback with real-time updates.
            </p>
          </div>

          {/* Search Bar with Glass Glow */}
          <div className="mt-8 max-w-xl relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <svg
                className="h-4 w-4 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by store name or physical address..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-2xl bg-white/80 dark:bg-obsidian-900/80 backdrop-blur-xl pl-11 pr-4 py-3.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-white/10 shadow-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
            />
          </div>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-bold">⚠️</span>
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs font-semibold text-rose-500 hover:text-rose-700 dark:hover:text-rose-300"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Stores Grid Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-display font-bold tracking-wide text-slate-900 dark:text-white">
              All Stores
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {data?.total ? `${data.total} businesses available` : 'Searching directory...'}
            </p>
          </div>
        </div>

        {/* Stores Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-48 rounded-2xl bg-white/40 dark:bg-obsidian-950/40 border border-slate-200/50 dark:border-white/5 shadow-sm animate-pulse p-6 space-y-4"
              >
                <div className="h-5 bg-slate-200 dark:bg-white/10 rounded w-2/3" />
                <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-full" />
                <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="py-24 text-center rounded-3xl bg-white/50 dark:bg-obsidian-950/50 border border-slate-200 dark:border-white/10 backdrop-blur-xl">
            <svg
              className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No stores found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {debouncedSearch
                ? `No stores matching "${debouncedSearch}" were found.`
                : 'No registered stores are available yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.data?.map((store: StoreItem) => (
              <StoreCard
                key={store.id}
                store={store}
                onRate={handleRate}
                isSubmitting={rateMutation.isPending}
              />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && data?.total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200/80 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
            <div>
              Showing <span className="font-semibold text-slate-900 dark:text-white">{(page - 1) * 12 + 1}</span> to{' '}
              <span className="font-semibold text-slate-900 dark:text-white">
                {Math.min(page * 12, data?.total)}
              </span>{' '}
              of <span className="font-semibold text-slate-900 dark:text-white">{data?.total}</span> stores
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 rounded-xl bg-white dark:bg-obsidian-900/80 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-medium hover:border-amber-400/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-3 font-semibold text-slate-800 dark:text-slate-200">
                Page {page} of {data?.totalPages || 1}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data?.totalPages || 1, p + 1))}
                disabled={page >= (data?.totalPages || 1)}
                className="px-4 py-2 rounded-xl bg-white dark:bg-obsidian-900/80 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-medium hover:border-amber-400/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
