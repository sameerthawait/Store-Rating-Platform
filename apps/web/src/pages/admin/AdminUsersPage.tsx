import { zodResolver } from '@hookform/resolvers/zod';
import { Role, USER_VALIDATION, UserDetailDto, UserDto } from '@ratehub/shared';
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

const createUserSchema = z.object({
  name: z
    .string()
    .min(
      USER_VALIDATION.NAME_MIN_LENGTH,
      `Name must be at least ${USER_VALIDATION.NAME_MIN_LENGTH} characters`,
    )
    .max(
      USER_VALIDATION.NAME_MAX_LENGTH,
      `Name must not exceed ${USER_VALIDATION.NAME_MAX_LENGTH} characters`,
    ),
  email: z.string().email('Please enter a valid email address'),
  address: z
    .string()
    .min(1, 'Address is required')
    .max(
      USER_VALIDATION.ADDRESS_MAX_LENGTH,
      `Address must not exceed ${USER_VALIDATION.ADDRESS_MAX_LENGTH} characters`,
    ),
  password: z
    .string()
    .min(
      USER_VALIDATION.PASSWORD_MIN_LENGTH,
      `Password must be at least ${USER_VALIDATION.PASSWORD_MIN_LENGTH} characters`,
    )
    .max(
      USER_VALIDATION.PASSWORD_MAX_LENGTH,
      `Password must not exceed ${USER_VALIDATION.PASSWORD_MAX_LENGTH} characters`,
    )
    .regex(USER_VALIDATION.PASSWORD_REGEX, USER_VALIDATION.PASSWORD_REQUIREMENTS_MESSAGE),
  role: z.enum([Role.NORMAL, Role.ADMIN, 'normal', 'admin']),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

export const AdminUsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter state synced with URL search params
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const sort = searchParams.get('sort') || 'created_at';
  const order = (searchParams.get('order') as 'asc' | 'desc') || 'desc';
  const nameFilter = searchParams.get('name') || '';
  const emailFilter = searchParams.get('email') || '';
  const addressFilter = searchParams.get('address') || '';
  const roleFilter = searchParams.get('role') || '';

  // Modals state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  // 1. Fetch Users Query
  const { data, isLoading } = useQuery({
    queryKey: [
      'admin-users',
      { page, limit, sort, order, name: nameFilter, email: emailFilter, address: addressFilter, role: roleFilter },
    ],
    queryFn: async () => {
      const res = await apiClient.get('/admin/users', {
        params: {
          page,
          limit,
          sort,
          order,
          name: nameFilter || undefined,
          email: emailFilter || undefined,
          address: addressFilter || undefined,
          role: roleFilter || undefined,
        },
      });
      return res.data;
    },
  });

  // 2. Fetch Selected User Detail Query
  const { data: userDetail, isLoading: isDetailLoading } = useQuery<UserDetailDto>({
    queryKey: ['admin-user-detail', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null as any;
      const res = await apiClient.get(`/admin/users/${selectedUserId}`);
      return res.data;
    },
    enabled: !!selectedUserId,
  });

  // 3. Add User Form & Mutation
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: Role.NORMAL,
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (formData: CreateUserFormData) => {
      const res = await apiClient.post('/admin/users', formData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-metrics'] });
      setIsAddUserOpen(false);
      reset();
      setAddError(null);
    },
    onError: (err: any) => {
      setAddError(err.message || 'Failed to create user account');
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

  const columns: Column<UserDto>[] = [
    {
      key: 'name',
      header: 'Full Name',
      sortable: true,
      render: (u) => (
        <span className="font-semibold text-slate-900 dark:text-white cursor-pointer hover:text-amber-500 dark:hover:text-amber-400 transition-colors">
          {u.name}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'Email Address',
      sortable: true,
      render: (u) => <span className="text-slate-600 dark:text-slate-300">{u.email}</span>,
    },
    {
      key: 'address',
      header: 'Address',
      sortable: true,
      render: (u) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate block" title={u.address}>
          {u.address}
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Platform Role',
      sortable: true,
      render: (u) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            u.role === Role.ADMIN
              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20'
              : u.role === Role.STORE_OWNER
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20'
          }`}
        >
          {u.role.replace('_', ' ')}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-obsidian-950 dark:ambient-mesh-dark ambient-mesh-light text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-white/10">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2">
              <span className="h-px w-6 bg-amber-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                User Management
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
              Directory of Accounts
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Filter, inspect credentials, and provision administrator or normal user accounts
            </p>
          </div>
          <Button onClick={() => setIsAddUserOpen(true)}>+ Add User</Button>
        </div>

        {/* 4-Field Filter Bar with Liquid Glass */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white/70 dark:bg-obsidian-950/60 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-glass dark:shadow-glass-dark">
          <input
            type="text"
            placeholder="Filter by Name..."
            value={nameFilter}
            onChange={(e) => updateParam('name', e.target.value)}
            className="rounded-xl bg-white/90 dark:bg-obsidian-900/80 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-white/10 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
          />

          <input
            type="text"
            placeholder="Filter by Email..."
            value={emailFilter}
            onChange={(e) => updateParam('email', e.target.value)}
            className="rounded-xl bg-white/90 dark:bg-obsidian-900/80 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-white/10 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
          />

          <input
            type="text"
            placeholder="Filter by Address..."
            value={addressFilter}
            onChange={(e) => updateParam('address', e.target.value)}
            className="rounded-xl bg-white/90 dark:bg-obsidian-900/80 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-white/10 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
          />

          <select
            value={roleFilter}
            onChange={(e) => updateParam('role', e.target.value)}
            className="rounded-xl bg-white/90 dark:bg-obsidian-900/80 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
          >
            <option value="">All Roles</option>
            <option value="admin">System Administrator</option>
            <option value="normal">Normal User</option>
            <option value="store_owner">Store Owner</option>
          </select>
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
          onRowClick={(user) => setSelectedUserId(user.id)}
          emptyMessage="No user accounts found matching your filters."
        />
      </main>

      {/* Add User Glass Modal */}
      <Modal
        isOpen={isAddUserOpen}
        onClose={() => {
          setIsAddUserOpen(false);
          setAddError(null);
        }}
        title="Provision New User"
        description="Create an Administrator or Normal User account"
      >
        {addError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
            {addError}
          </div>
        )}

        <form onSubmit={handleSubmit((d) => createUserMutation.mutate(d))} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Jane Doe (20-60 chars)"
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="newuser@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Address"
            placeholder="123 Platform Way, Springfield"
            error={errors.address?.message}
            {...register('address')}
          />

          <Input
            label="Password (8-16 chars, 1 uppercase, 1 special)"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="flex flex-col space-y-1.5 w-full text-left">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Role Assignment
            </label>
            <select
              {...register('role')}
              className="w-full rounded-xl bg-white/70 dark:bg-obsidian-900/80 px-4 py-2.5 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            >
              <option value="normal">Normal User</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>

          <Button type="submit" isLoading={createUserMutation.isPending} className="w-full mt-3">
            Provision User Account
          </Button>
        </form>
      </Modal>

      {/* User Detail Glass Modal */}
      <Modal
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
        title="User Account Details"
        description="Full profile and store rating intelligence"
      >
        {isDetailLoading || !userDetail ? (
          <div className="py-8 text-center text-slate-400">Loading user profile...</div>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="p-4 rounded-2xl bg-white/50 dark:bg-obsidian-900/60 border border-slate-200/60 dark:border-white/5 space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Full Name</span>
                <span className="font-display font-bold text-slate-900 dark:text-white text-base">{userDetail.name}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Email</span>
                <span className="text-slate-700 dark:text-slate-300 font-mono text-xs">{userDetail.email}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Address</span>
                <span className="text-slate-700 dark:text-slate-300">{userDetail.address}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Assigned Role</span>
                <span className="font-semibold text-amber-500 uppercase tracking-wider text-xs">
                  {userDetail.role.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Store Owner Rating Card (Conditional) */}
            {userDetail.role === Role.STORE_OWNER && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                    Owned Store Profile
                  </span>
                  <div className="flex items-center space-x-1.5 bg-white/90 dark:bg-obsidian-950 px-3 py-1 rounded-full shadow-xs">
                    <span className="text-amber-400 font-bold">★</span>
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      {userDetail.store?.averageRating !== null &&
                      userDetail.store?.averageRating !== undefined
                        ? userDetail.store.averageRating
                        : 'No ratings yet'}
                    </span>
                  </div>
                </div>

                {userDetail.store ? (
                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <p className="font-display font-bold text-slate-900 dark:text-white">{userDetail.store.name}</p>
                    <p className="text-slate-500 dark:text-slate-400">{userDetail.store.address}</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No store assigned yet.</p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
