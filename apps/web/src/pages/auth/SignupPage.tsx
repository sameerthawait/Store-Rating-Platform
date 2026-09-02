import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { GlassCard } from '../../components/ui/GlassCard';
import { Input } from '../../components/ui/Input';
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

      // Redirect to login with success state
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
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute top-1/2 -right-40 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative z-10 animate-fadeIn">
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
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create your account
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Join RateHub to discover and review local businesses
          </p>
        </div>

        <GlassCard>
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
              label="Address (max 400 characters)"
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

            <Button type="submit" isLoading={isLoading} className="w-full mt-2">
              Create Account
            </Button>
          </form>

          <div className="mt-8 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Sign in here
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
