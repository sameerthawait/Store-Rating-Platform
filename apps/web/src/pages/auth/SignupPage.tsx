import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { GlassCard } from '../../components/ui/GlassCard';
import { Input } from '../../components/ui/Input';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { apiClient } from '../../lib/api-client';
import { SignupFormData, signupSchema } from '../../lib/validation/auth.schemas';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onTouched',
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      await apiClient.post('/auth/signup', data);

      navigate('/login', {
        state: {
          message: 'Account created successfully! Please sign in with your new credentials.',
          email: data.email,
        },
      });
    } catch (err: any) {
      setServerError(err.message || 'Signup failed. Please verify your details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-slate-50 dark:bg-obsidian-950 ambient-mesh text-slate-900 dark:text-slate-100 transition-colors duration-300 relative">
      {/* Top right Theme Switcher */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg relative z-10 animate-fadeIn">
        {/* Brand Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-obsidian-950 to-obsidian-900 dark:from-amber-400 dark:to-amber-500 border border-amber-500/30 dark:border-amber-300 text-amber-400 dark:text-obsidian-950 shadow-gold-glow mb-2">
            <span className="font-display font-extrabold text-2xl">R</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-slate-950 dark:text-white">
            Join the <span className="text-gold-gradient">RateHub Network</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-editorial text-base">
            Create an account to review and rate registered merchants
          </p>
        </div>

        <GlassCard className="p-8 sm:p-10" variant="default">
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name (20 to 60 characters)"
              type="text"
              placeholder="Alexander Montgomery James"
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Physical Address (max 400 characters)"
              type="text"
              placeholder="742 Evergreen Terrace, Springfield"
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

            <Button type="submit" isLoading={isLoading} className="w-full mt-4">
              Complete Registration
            </Button>
          </form>

          <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-amber-600 dark:text-amber-400 hover:underline transition-colors"
            >
              Sign in here
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
