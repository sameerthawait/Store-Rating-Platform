import { zodResolver } from '@hookform/resolvers/zod';
import { Role } from '@ratehub/shared';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { GlassCard } from '../../components/ui/GlassCard';
import { Input } from '../../components/ui/Input';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
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
      setServerError(err.message || 'Invalid email or password. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-slate-50 dark:bg-obsidian-950 dark:ambient-mesh-dark ambient-mesh-light text-slate-900 dark:text-slate-100 transition-colors duration-300 relative">
      {/* Top right Theme Switcher */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fadeIn">
        {/* Brand Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-obsidian-950 to-obsidian-900 dark:from-amber-400 dark:to-amber-500 border border-amber-500/30 dark:border-amber-300 text-amber-400 dark:text-obsidian-950 shadow-gold-glow mb-2">
            <span className="font-display font-extrabold text-2xl">R</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-slate-950 dark:text-white">
            Sign In to <span className="text-gold-gradient">RateHub</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-editorial text-base">
            Access the curated store ratings and analytics platform
          </p>
        </div>

        <GlassCard className="p-8 sm:p-10" variant="default">
          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center space-x-2">
              <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
              <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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

            <Button type="submit" isLoading={isLoading} className="w-full mt-2">
              Enter Platform
            </Button>
          </form>

          <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-semibold text-amber-600 dark:text-amber-400 hover:underline transition-colors"
            >
              Sign up here
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
