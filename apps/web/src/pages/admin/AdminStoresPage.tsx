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
  name: z.string().min(20, 'Store name must be at least 20 chars').max(60, 'Store name must not exceed 60 chars'),
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

  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // 1. Fetch Stores Query
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stores', { page, limit, sort, order, name: nameFilter }],
    queryFn: async () => {
      const res = await apiClient.get('/admin/stores', {
        params: {
          page,
          limit,
          sort,
          order,
          name: nameFilter || undefined,
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
      render: (s) => <span className="font-semibold text-slate-900">{s.name}</span>,
    },
    {
      key: 'email',
      header: 'Store Email',
      sortable: true,
    },
    {
      key: 'address',
      header: 'Address',
      sortable: true,
      render: (s) => (
        <span className="truncate max-w-xs block text-slate-500" title={s.address}>
          {s.address}
        </span>
      ),
    },
    {
      key: 'rating',
      header: 'Average Rating',
      sortable: true,
      render: (s) => (
        <div className="inline-flex items-center space-x-1.5">
          {s.averageRating !== null && s.averageRating !== undefined ? (
            <>
              <span className="text-amber-500 font-bold">★</span>
              <span className="font-bold text-slate-900 text-xs">{s.averageRating}</span>
            </>
          ) : (
            <span className="text-xs text-slate-400 italic">No ratings yet</span>
          )}
        </div>
      ),
    },
    {
      key: 'owner',
      header: 'Store Owner',
      render: (s) => (
        <span className="text-xs font-medium text-slate-700">
          {s.owner?.name || 'Unassigned'}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Store Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              View, sort by computed rating, search, and provision stores
            </p>
          </div>
          <Button onClick={() => setIsAddStoreOpen(true)}>+ Add Store</Button>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center bg-white/60 backdrop-blur-xl p-4 rounded-2xl border border-white/50 shadow-sm">
          <input
            type="text"
            placeholder="Search stores by name..."
            value={nameFilter}
            onChange={(e) => updateParam('name', e.target.value)}
            className="w-full max-w-md rounded-xl bg-white px-4 py-2 text-xs text-slate-900 placeholder-slate-400 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
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

      {/* Add Store Modal */}
      <Modal
        isOpen={isAddStoreOpen}
        onClose={() => {
          setIsAddStoreOpen(false);
          setAddError(null);
        }}
        title="Add New Store & Owner"
        description="Provision a store and create its dedicated owner account atomically"
        maxWidth="max-w-2xl"
      >
        {addError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {addError}
          </div>
        )}
        <form
          onSubmit={handleSubmit((data) => createStoreMutation.mutate(data))}
          className="space-y-6"
        >
          {/* Store Info Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 border-b pb-1">
              Store Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Store Name (20 to 60 chars)"
                placeholder="Apex Electronics Superstore"
                error={errors.name?.message}
                {...register('name')}
              />
              <Input
                label="Store Email"
                type="email"
                placeholder="contact@apexelectronics.com"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>
            <Input
              label="Store Physical Address"
              placeholder="100 Silicon Way, Tech District, San Francisco, CA"
              error={errors.address?.message}
              {...register('address')}
            />
          </div>

          {/* Owner Info Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 border-b pb-1">
              Store Owner Account
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Owner Full Name (20 to 60 chars)"
                placeholder="Marcus Vance Tech Lead"
                error={errors.owner?.name?.message}
                {...register('owner.name')}
              />
              <Input
                label="Owner Login Email"
                type="email"
                placeholder="marcus@apexelectronics.com"
                error={errors.owner?.email?.message}
                {...register('owner.email')}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Owner Address"
                placeholder="100 Silicon Way, San Francisco, CA"
                error={errors.owner?.address?.message}
                {...register('owner.address')}
              />
              <Input
                label="Owner Password (8-16 chars)"
                type="password"
                placeholder="••••••••"
                error={errors.owner?.password?.message}
                {...register('owner.password')}
              />
            </div>
          </div>

          <Button type="submit" isLoading={createStoreMutation.isPending} className="w-full">
            Create Store & Provision Owner
          </Button>
        </form>
      </Modal>
    </div>
  );
};
