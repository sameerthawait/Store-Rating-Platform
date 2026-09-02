import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { GlassCard } from '../../components/ui/GlassCard';
import { Input } from '../../components/ui/Input';
import { apiClient } from '../../lib/api-client';
import {
  ChangePasswordFormData,
  changePasswordSchema,
} from '../../lib/validation/auth.schemas';

export const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onTouched',
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsLoading(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      await apiClient.patch('/auth/change-password', data);
      setSuccessMessage('Password changed successfully! All other active sessions have been logged out.');
      reset();
    } catch (err: any) {
      setServerError(err.message || 'Failed to update password. Please verify your current password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md relative z-10 animate-fadeIn">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Change Password
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Update your account password securely
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
              error={errors.currentPassword?.message}
              {...register('currentPassword')}
            />

            <Input
              label="New Password (8-16 chars, 1 uppercase, 1 special)"
              type="password"
              placeholder="••••••••"
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />

            <Button type="submit" isLoading={isLoading} className="w-full mt-2">
              Update Password
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
            >
              ← Go back
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
