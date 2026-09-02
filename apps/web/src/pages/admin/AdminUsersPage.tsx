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
    .min(USER_VALIDATION.NAME_MIN_LENGTH, `Name must be at least ${USER_VALIDATION.NAME_MIN_LENGTH} chars`)
    .max(USER_VALIDATION.NAME_MAX_LENGTH, `Name must not exceed ${USER_VALIDATION.NAME_MAX_LENGTH} chars`),
  email: z.string().email('Please enter a valid email address'),
  address: z
    .string()
    .min(1, 'Address is required')
    .max(USER_VALIDATION.ADDRESS_MAX_LENGTH, `Address must not exceed ${USER_VALIDATION.ADDRESS_MAX_LENGTH} chars`),
  password: z
    .string()
    .min(USER_VALIDATION.PASSWORD_MIN_LENGTH, `Password must be at least ${USER_VALIDATION.PASSWORD_MIN_LENGTH} chars`)
    .max(USER_VALIDATION.PASSWORD_MAX_LENGTH, `Password must not exceed ${USER_VALIDATION.PASSWORD_MAX_LENGTH} chars`)
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
  const roleFilter = searchParams.get('role') || '';

  // Modals state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  // 1. Fetch Users Query
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', { page, limit, sort, order, name: nameFilter, role: roleFilter }],
    queryFn: async () => {
      const res = await apiClient.get('/admin/users', {
        params: {
          page,
          limit,
          sort,
          order,
          name: nameFilter || undefined,
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
      setAddError(err.message || 'Failed to create user');
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
      header: 'Name',
      sortable: true,
      render: (u) => <span className="font-semibold text-slate-900">{u.name}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
    },
    {
      key: 'address',
      header: 'Address',
      sortable: true,
      render: (u) => (
        <span className="truncate max-w-xs block text-slate-500" title={u.address}>
          {u.address}
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (u) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
            u.role === Role.ADMIN || u.role === 'admin'
              ? 'bg-purple-50 text-purple-700 border border-purple-200'
              : u.role === Role.STORE_OWNER || u.role === 'store_owner'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          {u.role.replace('_', ' ')}
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              View, search, filter, and provision user accounts
            </p>
          </div>
          <Button onClick={() => setIsAddUserOpen(true)}>+ Add User</Button>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white/60 backdrop-blur-xl p-4 rounded-2xl border border-white/50 shadow-sm">
          <input
            type="text"
            placeholder="Search by name..."
            value={nameFilter}
            onChange={(e) => updateParam('name', e.target.value)}
            className="rounded-xl bg-white px-4 py-2 text-xs text-slate-900 placeholder-slate-400 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
          />

          <select
            value={roleFilter}
            onChange={(e) => updateParam('role', e.target.value)}
            className="rounded-xl bg-white px-4 py-2 text-xs text-slate-700 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
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
          emptyMessage="No users found matching your filters."
        />
      </main>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddUserOpen}
        onClose={() => {
          setIsAddUserOpen(false);
          setAddError(null);
        }}
        title="Add New User"
        description="Provision an Administrator or Normal User account"
      >
        {addError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {addError}
          </div>
        )}
        <form
          onSubmit={handleSubmit((data) => createUserMutation.mutate(data))}
          className="space-y-4"
        >
          <Input
            label="Full Name"
            placeholder="Alexander Montgomery James"
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="Email"
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
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Role
            </label>
            <select
              {...register('role')}
              className="w-full rounded-xl bg-white/60 px-4 py-3 text-sm text-slate-900 border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/15"
            >
              <option value="normal">Normal User</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>

          <Button type="submit" isLoading={createUserMutation.isPending} className="w-full mt-2">
            Create User Account
          </Button>
        </form>
      </Modal>

      {/* User Detail Modal */}
      <Modal
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
        title="User Details"
        description="Full profile and store rating information"
      >
        {isDetailLoading || !userDetail ? (
          <div className="py-8 text-center text-slate-400">Loading user profile...</div>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-2">
              <div>
                <span className="text-xs font-semibold text-slate-400 block uppercase">Name</span>
                <span className="font-bold text-slate-900 text-base">{userDetail.name}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 block uppercase">Email</span>
                <span className="text-slate-700">{userDetail.email}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 block uppercase">Address</span>
                <span className="text-slate-700">{userDetail.address}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 block uppercase">Role</span>
                <span className="font-semibold text-indigo-600 uppercase tracking-wider text-xs">
                  {userDetail.role.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Store Owner Rating Card (Conditional) */}
            {userDetail.role === 'store_owner' && (
              <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                    Owned Store Profile
                  </span>
                  <div className="flex items-center space-x-1.5 bg-white px-3 py-1 rounded-full shadow-sm">
                    <span className="text-amber-500 font-bold">★</span>
                    <span className="font-bold text-slate-800 text-xs">
                      {userDetail.store?.averageRating !== null &&
                      userDetail.store?.averageRating !== undefined
                        ? userDetail.store.averageRating
                        : 'No ratings yet'}
                    </span>
                  </div>
                </div>

                {userDetail.store ? (
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-800">{userDetail.store.name}</p>
                    <p>{userDetail.store.address}</p>
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
