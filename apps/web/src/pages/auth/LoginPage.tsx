import { zodResolver } from '@hookform/resolvers/zod';
import { Role } from '@ratehub/shared';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { GlassCard } from '../../components/ui/GlassCard';
import { Input } from '../../components/ui/Input';
import { apiClient } from '../../lib/api-client';
import { LoginFormData, loginSchema } from '../../lib/validation/auth.schemas';
import { useAuthStore } from '../../store/auth.store';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const successMessage = (location.state as any)?.message;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: (location.state as any)?.email || '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const response = await apiClient.post('/auth/login', data);
      const { user, accessToken, refreshToken } = response.data;

      setAuth(user, accessToken, refreshToken);

      // Role-based redirection
      if (user.role === Role.ADMIN || user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === Role.STORE_OWNER || user.role === 'store_owner') {
        navigate('/store-owner/dashboard', { replace: true });
      } else {
        navigate('/stores', { replace: true });
      }
    } catch (err: any) {
      setServerError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute top-1/2 -left-40 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fadeIn">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-xl shadow-indigo-500/30 mb-4">
            <svg
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome to RateHub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Sign in to your account to continue
          </p>
        </div>

        <GlassCard>
          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-700 text-sm flex items-center space-x-2">
              <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{successMessage}</span>
            </div>
          )}

          {serverError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50/80 border border-rose-200/80 text-rose-700 text-sm flex items-center space-x-2">
              <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            <Button type="submit" isLoading={isLoading} className="w-full">
              Sign In
            </Button>
          </form>

          <div className="mt-8 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Sign up here
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
