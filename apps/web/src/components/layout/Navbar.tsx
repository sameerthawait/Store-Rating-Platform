import { Role } from '@ratehub/shared';
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/api-client';
import { useAuthStore } from '../../store/auth.store';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshToken, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch (err) {
      // Ignore failure on logout
    } finally {
      logout();
      navigate('/login', { replace: true });
    }
  };

  const isAdmin = user?.role === Role.ADMIN;
  const isStoreOwner = user?.role === Role.STORE_OWNER;

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm shadow-indigo-500/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/25">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Rate<span className="text-indigo-600">Hub</span>
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {isAdmin && (
              <>
                <Link
                  to="/admin/dashboard"
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive('/admin/dashboard')
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/admin/users"
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive('/admin/users')
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                  }`}
                >
                  Users
                </Link>
                <Link
                  to="/admin/stores"
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive('/admin/stores')
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                  }`}
                >
                  Stores
                </Link>
              </>
            )}

            {!isAdmin && !isStoreOwner && (
              <Link
                to="/stores"
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive('/stores')
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                Browse Stores
              </Link>
            )}

            {isStoreOwner && (
              <Link
                to="/store-owner/dashboard"
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive('/store-owner/dashboard')
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                My Store Dashboard
              </Link>
            )}
          </nav>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-900 truncate max-w-[160px]">
              {user?.name}
            </span>
            <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-600">
              {user?.role?.replace('_', ' ')}
            </span>
          </div>

          <Link
            to="/change-password"
            title="Change Password"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </Link>

          <button
            onClick={handleLogout}
            className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50/80 hover:bg-rose-100/80 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};
