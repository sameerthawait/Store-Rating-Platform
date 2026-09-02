import { zodResolver } from '@hookform/resolvers/zod';
import { StoreDto, USER_VALIDATION } from '@ratehub/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';
import { Column, DataTable } from '../../components/ui/DataTable';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { apiClient } from '../../lib/api-client';

const createStoreSchema = z.object({
  name: z.string().min(3, 'Store name must be at least 3 chars').max(60, 'Store name must not exceed 60 chars'),
  email: z.string().email('Please enter a valid store email address'),
  address: z.string().min(1, 'Store address is required').max(400, 'Address must not exceed 400 chars'),
  owner: z.object({
    name: z.string().min(USER_VALIDATION.NAME_MIN_LENGTH, `Owner name must be at least ${USER_VALIDATION.NAME_MIN_LENGTH} chars`).max(USER_VALIDATION.NAME_MAX_LENGTH, `Owner name must not exceed ${USER_VALIDATION.NAME_MAX_LENGTH} chars`),
    email: z.string().email('Please enter a valid owner login email'),
    address: z.string().min(1, 'Owner address is required').max(USER_VALIDATION.ADDRESS_MAX_LENGTH),
    password: z.string().min(USER_VALIDATION.PASSWORD_MIN_LENGTH, `Password must be at least ${USER_VALIDATION.PASSWORD_MIN_LENGTH} chars`).max(USER_VALIDATION.PASSWORD_MAX_LENGTH, `Password must not exceed ${USER_VALIDATION.PASSWORD_MAX_LENGTH} chars`).regex(USER_VALIDATION.PASSWORD_REGEX, USER_VALIDATION.PASSWORD_REQUIREMENTS_MESSAGE),
  }),
});

type CreateStoreFormData = z.infer<typeof createStoreSchema>;

export const AdminStoresPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const sort = searchParams.get('sort') || 'created_at';
  const order = (searchParams.get('order') as 'asc' | 'desc') || 'desc';
  const nameFilter = searchParams.get('name') || '';
  const emailFilter = searchParams.get('email') || '';
  const addressFilter = searchParams.get('address') || '';

  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // 1. Fetch Stores Query
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stores', { page, limit, sort, order, name: nameFilter, email: emailFilter, address: addressFilter }],
    queryFn: async () => {
      const res = await apiClient.get('/admin/stores', {
        params: {
          page,
          limit,
          sort,
          order,
          name: nameFilter || undefined,
          email: emailFilter || undefined,
          address: addressFilter || undefined,
        },
      });
      return res.data;
    },
  });

  // 2. Add Store Form & Mutation
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateStoreFormData>({
    resolver: zodResolver(createStoreSchema),
  });

  const createStoreMutation = useMutation({
    mutationFn: async (formData: CreateStoreFormData) => {
      const res = await apiClient.post('/admin/stores', formData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-metrics'] });
      setIsAddStoreOpen(false);
      reset();
      setAddError(null);
    },
    onError: (err: any) => {
      setAddError(err.message || 'Failed to create store');
    },
  });

  const updateParam = (key: string, val: string | number | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (val === undefined || val === '') {
      next.delete(key);
    } else {
      next.set(key, String(val));
    }
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  const columns: Column<StoreDto>[] = [
    {
      key: 'name',
      header: 'Store Name',
      sortable: true,
      render: (s) => (
        <span className="font-semibold text-slate-900 dark:text-white font-display">
          {s.name}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'Store Email',
      sortable: true,
      render: (s) => <span className="text-slate-600 dark:text-slate-300 font-mono text-xs">{s.email}</span>,
    },
    {
      key: 'address',
      header: 'Physical Address',
      sortable: true,
      render: (s) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate block" title={s.address}>
          {s.address}
        </span>
      ),
    },
    {
      key: 'rating',
      header: 'Average Score',
      sortable: true,
      render: (s) => (
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
          {s.averageRating !== null && s.averageRating !== undefined ? (
            <>
              <span className="text-amber-400 font-bold text-xs">★</span>
              <span className="font-bold text-slate-900 dark:text-white text-xs">{s.averageRating}</span>
            </>
          ) : (
            <span className="text-[10px] text-slate-400 italic">No ratings</span>
          )}
        </div>
      ),
    },
    {
      key: 'owner',
      header: 'Assigned Owner',
      render: (s) => (
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
          {s.owner?.name || 'Unassigned'}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-obsidian-950 ambient-mesh text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-white/10">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2">
              <span className="h-px w-6 bg-amber-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                Store Directory
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
              Store Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Sort by computed ratings (nulls last), search multi-field parameters, and provision stores
            </p>
          </div>
          <Button onClick={() => setIsAddStoreOpen(true)}>+ Add Store</Button>
        </div>

        {/* Filter Bar with Liquid Glass */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/70 dark:bg-obsidian-950/60 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-glass dark:shadow-glass-dark">
          <input
            type="text"
            placeholder="Filter stores by Name..."
            value={nameFilter}
            onChange={(e) => updateParam('name', e.target.value)}
            className="rounded-xl bg-white/90 dark:bg-obsidian-900/80 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-white/10 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
          />

          <input
            type="text"
            placeholder="Filter stores by Email..."
            value={emailFilter}
            onChange={(e) => updateParam('email', e.target.value)}
            className="rounded-xl bg-white/90 dark:bg-obsidian-900/80 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-white/10 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
          />

          <input
            type="text"
            placeholder="Filter stores by Address..."
            value={addressFilter}
            onChange={(e) => updateParam('address', e.target.value)}
            className="rounded-xl bg-white/90 dark:bg-obsidian-900/80 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-white/10 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
          />
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={data?.data || []}
          total={data?.total || 0}
          page={page}
          limit={limit}
          totalPages={data?.totalPages || 1}
          sort={sort}
          order={order}
          isLoading={isLoading}
          onSortChange={(col) => {
            const nextOrder = sort === col && order === 'asc' ? 'desc' : 'asc';
            const next = new URLSearchParams(searchParams);
            next.set('sort', col);
            next.set('order', nextOrder);
            setSearchParams(next);
          }}
          onPageChange={(nextPage) => updateParam('page', nextPage)}
          emptyMessage="No stores found matching your filters."
        />
      </main>

      {/* Add Store Glass Modal */}
      <Modal
        isOpen={isAddStoreOpen}
        onClose={() => {
          setIsAddStoreOpen(false);
          setAddError(null);
        }}
        title="Provision Store Profile"
        description="Atomically establishes the store and assigns its initial owner"
      >
        {addError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
            {addError}
          </div>
        )}

        <form onSubmit={handleSubmit((d) => createStoreMutation.mutate(d))} className="space-y-5">
          <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-white/5">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              1. Store Details
            </h4>
            <Input
              label="Store Name (3-60 chars)"
              placeholder="e.g. Apex Electronics Superstore"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Store Public Email"
              type="email"
              placeholder="contact@store.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Store Physical Address"
              placeholder="100 Silicon Way, Tech District, San Francisco, CA"
              error={errors.address?.message}
              {...register('address')}
            />
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              2. Store Owner Login Credentials
            </h4>
            <Input
              label="Owner Full Name (20-60 chars)"
              placeholder="Marcus Vance (Tech Owner)"
              error={errors.owner?.name?.message}
              {...register('owner.name')}
            />
            <Input
              label="Owner Login Email"
              type="email"
              placeholder="owner@store.com"
              error={errors.owner?.email?.message}
              {...register('owner.email')}
            />
            <Input
              label="Owner Address"
              placeholder="Owner residential or office address"
              error={errors.owner?.address?.message}
              {...register('owner.address')}
            />
            <Input
              label="Owner Initial Password (8-16 chars, 1 uppercase, 1 special)"
              type="password"
              placeholder="••••••••"
              error={errors.owner?.password?.message}
              {...register('owner.password')}
            />
          </div>

          <Button type="submit" isLoading={createStoreMutation.isPending} className="w-full mt-4">
            Provision Store & Owner
          </Button>
        </form>
      </Modal>
    </div>
  );
};
