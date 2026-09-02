import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../store/auth.store';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Format errors & handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as any;

    // Handle 401 Unauthorized token expiry with automatic refresh attempt
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken && originalRequest.url !== '/auth/refresh' && originalRequest.url !== '/auth/login') {
        originalRequest._retry = true;
        try {
          const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefresh } = res.data;
          useAuthStore.getState().setTokens(accessToken, newRefresh || refreshToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        } catch (refreshErr) {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
      }
    }

    // Extract standardized error message
    const errorData = error.response?.data;
    let message = 'An unexpected error occurred. Please try again.';

    if (errorData) {
      if (typeof errorData.message === 'string') {
        message = errorData.message;
      } else if (Array.isArray(errorData.message)) {
        message = errorData.message.join(', ');
      }
    } else if (error.message) {
      message = error.message;
    }

    return Promise.reject(new Error(message));
  },
);
