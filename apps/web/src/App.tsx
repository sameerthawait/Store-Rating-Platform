import { Role } from '@ratehub/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RequireRole } from './components/auth/RequireRole';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminStoresPage } from './pages/admin/AdminStoresPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { ChangePasswordPage } from './pages/auth/ChangePasswordPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { StoreOwnerDashboardPage } from './pages/store-owner/StoreOwnerDashboardPage';
import { StoresPage } from './pages/stores/StoresPage';
import { useAuthStore } from './store/auth.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

// Root route redirects based on authentication and role
const RootRedirect: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === Role.ADMIN) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user.role === Role.STORE_OWNER) {
    return <Navigate to="/store-owner/dashboard" replace />;
  }

  return <Navigate to="/stores" replace />;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public / Unauthenticated Routes */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Authenticated Global Routes */}
          <Route element={<RequireRole />}>
            <Route path="/stores" element={<StoresPage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
          </Route>

          {/* Store Owner Protected Routes */}
          <Route element={<RequireRole role={Role.STORE_OWNER} />}>
            <Route
              path="/store-owner/dashboard"
              element={<StoreOwnerDashboardPage />}
            />
          </Route>

          {/* Admin Protected Routes */}
          <Route element={<RequireRole role={Role.ADMIN} />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/stores" element={<AdminStoresPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
