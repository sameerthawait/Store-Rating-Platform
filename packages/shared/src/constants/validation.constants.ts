export const USER_VALIDATION = {
  NAME_MIN_LENGTH: 20,
  NAME_MAX_LENGTH: 60,
  ADDRESS_MAX_LENGTH: 400,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 16,
  PASSWORD_REGEX: /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,16}$/,
  PASSWORD_REQUIREMENTS_MESSAGE:
    'Password must be 8-16 characters long, contain at least 1 uppercase letter and at least 1 special character.',
} as const;

export const STORE_VALIDATION = {
  NAME_MIN_LENGTH: 3,
  NAME_MAX_LENGTH: 60,
  ADDRESS_MAX_LENGTH: 400,
} as const;

export const RATING_VALIDATION = {
  MIN_RATING: 1,
  MAX_RATING: 5,
} as const;
