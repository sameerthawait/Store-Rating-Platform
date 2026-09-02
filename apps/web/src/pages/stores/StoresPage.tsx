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
    // When mutate is called:
    onMutate: async ({ storeId, rating }) => {
      setErrorMessage(null);
      // Cancel outgoing queries to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['user-stores'] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(['user-stores', { search: debouncedSearch, page }]);

      // Optimistically update query cache
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
    // On error, roll back to snapshot
    onError: (err: any, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ['user-stores', { search: debouncedSearch, page }],
          context.previousData,
        );
      }
      setErrorMessage(err.message || 'Failed to submit rating. Please try again.');
    },
    // Always refetch to sync overall averages
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user-stores'] });
    },
  });

  const handleRate = async (storeId: string, rating: number) => {
    await rateMutation.mutateAsync({ storeId, rating });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Hero & Search Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Discover & Rate Stores
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Browse registered businesses, view community ratings, and share your feedback
            </p>
          </div>

          {/* Debounced Glass Search Input */}
          <div className="w-full md:w-96 relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <svg
                className="h-4 w-4 text-slate-400"
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
              placeholder="Search by store name or address..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-2xl bg-white/70 backdrop-blur-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 border border-white/60 shadow-sm outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/15 transition-all"
            />
          </div>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-bold">⚠️</span>
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs font-semibold text-rose-500 hover:text-rose-700"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Stores Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-44 rounded-2xl bg-white/50 border border-white/40 shadow-sm animate-pulse p-6 space-y-4"
              >
                <div className="h-5 bg-slate-200 rounded w-2/3" />
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="py-24 text-center rounded-3xl bg-white/40 border border-white/50 backdrop-blur-md">
            <svg
              className="mx-auto h-12 w-12 text-slate-300 mb-3"
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
            <h3 className="text-base font-semibold text-slate-800">No stores found</h3>
            <p className="text-xs text-slate-500 mt-1">
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
          <div className="flex items-center justify-between pt-4 border-t border-slate-200/60 text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-700">{(page - 1) * 12 + 1}</span> to{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(page * 12, data?.total)}
              </span>{' '}
              of <span className="font-semibold text-slate-700">{data?.total}</span> stores
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3.5 py-1.5 rounded-xl bg-white/80 border border-slate-200 text-slate-700 font-medium hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-2 font-medium text-slate-700">
                Page {page} of {data?.totalPages || 1}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data?.totalPages || 1, p + 1))}
                disabled={page >= (data?.totalPages || 1)}
                className="px-3.5 py-1.5 rounded-xl bg-white/80 border border-slate-200 text-slate-700 font-medium hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
