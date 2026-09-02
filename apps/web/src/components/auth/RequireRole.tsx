import { Role } from '@ratehub/shared';
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

interface RequireRoleProps {
  role?: Role | 'admin' | 'normal' | 'store_owner';
}

export const RequireRole: React.FC<RequireRoleProps> = ({ role }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    // Redirect unauthorized user to their proper landing page
    if (user.role === Role.ADMIN || user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === Role.STORE_OWNER || user.role === 'store_owner') {
      return <Navigate to="/store-owner/dashboard" replace />;
    }
    return <Navigate to="/stores" replace />;
  }

  return <Outlet />;
};
