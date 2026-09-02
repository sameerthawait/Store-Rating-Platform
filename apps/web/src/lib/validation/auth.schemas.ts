import { USER_VALIDATION } from '@ratehub/shared';
import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  name: z
    .string()
    .min(
      USER_VALIDATION.NAME_MIN_LENGTH,
      `Name must be at least ${USER_VALIDATION.NAME_MIN_LENGTH} characters long`,
    )
    .max(
      USER_VALIDATION.NAME_MAX_LENGTH,
      `Name must not exceed ${USER_VALIDATION.NAME_MAX_LENGTH} characters`,
    ),
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
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
      `Password must be at least ${USER_VALIDATION.PASSWORD_MIN_LENGTH} characters long`,
    )
    .max(
      USER_VALIDATION.PASSWORD_MAX_LENGTH,
      `Password must not exceed ${USER_VALIDATION.PASSWORD_MAX_LENGTH} characters`,
    )
    .regex(
      USER_VALIDATION.PASSWORD_REGEX,
      USER_VALIDATION.PASSWORD_REQUIREMENTS_MESSAGE,
    ),
});

export type SignupFormData = z.infer<typeof signupSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(
      USER_VALIDATION.PASSWORD_MIN_LENGTH,
      `New password must be at least ${USER_VALIDATION.PASSWORD_MIN_LENGTH} characters long`,
    )
    .max(
      USER_VALIDATION.PASSWORD_MAX_LENGTH,
      `New password must not exceed ${USER_VALIDATION.PASSWORD_MAX_LENGTH} characters`,
    )
    .regex(
      USER_VALIDATION.PASSWORD_REGEX,
      USER_VALIDATION.PASSWORD_REQUIREMENTS_MESSAGE,
    ),
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
