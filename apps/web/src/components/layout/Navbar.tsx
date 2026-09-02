import { Role } from '@ratehub/shared';
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/api-client';
import { useAuthStore } from '../../store/auth.store';
import { ThemeToggle } from '../ui/ThemeToggle';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshToken, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <header className="sticky top-0 z-40 w-full bg-white/70 dark:bg-obsidian-950/70 backdrop-blur-2xl border-b border-slate-200/80 dark:border-white/10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Editorial Brand Logo */}
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-obsidian-950 to-obsidian-900 dark:from-amber-400 dark:to-amber-500 border border-amber-500/30 dark:border-amber-300 text-amber-400 dark:text-obsidian-950 flex items-center justify-center shadow-gold-glow group-hover:scale-105 transition-transform">
              <span className="font-display font-extrabold text-base">R</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg tracking-widest text-slate-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                RATEHUB<span className="text-amber-500 text-xl leading-none">.</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-400 dark:text-slate-500 -mt-1">
                Curated Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {isAdmin && (
              <>
                <Link
                  to="/admin/dashboard"
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                    isActive('/admin/dashboard')
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-white/5'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/admin/users"
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                    isActive('/admin/users')
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-white/5'
                  }`}
                >
                  Users
                </Link>
                <Link
                  to="/admin/stores"
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                    isActive('/admin/stores')
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-white/5'
                  }`}
                >
                  Stores
                </Link>
              </>
            )}

            {!isAdmin && !isStoreOwner && (
              <Link
                to="/stores"
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                  isActive('/stores')
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-white/5'
                }`}
              >
                Browse Stores
              </Link>
            )}

            {isStoreOwner && (
              <Link
                to="/store-owner/dashboard"
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                  isActive('/store-owner/dashboard')
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-white/5'
                }`}
              >
                Store Analytics
              </Link>
            )}
          </nav>
        </div>

        {/* Right Section: Theme Toggle, User Profile & Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <ThemeToggle />

          {/* User Info (Desktop) */}
          <div className="hidden sm:flex flex-col text-right pl-2 border-l border-slate-200 dark:border-white/10">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[150px]">
              {user?.name}
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-amber-600 dark:text-amber-400">
              {user?.role?.replace('_', ' ')}
            </span>
          </div>

          {/* Change Password Link */}
          <Link
            to="/change-password"
            title="Change Password"
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </Link>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200/60 dark:border-rose-800/30 transition-colors"
          >
            Logout
          </button>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
            aria-label="Toggle navigation menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 py-4 space-y-2 bg-white/95 dark:bg-obsidian-950/95 backdrop-blur-2xl border-b border-slate-200 dark:border-white/10 animate-fadeIn">
          {isAdmin && (
            <>
              <Link
                to="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-amber-500/10 hover:text-amber-500"
              >
                Dashboard
              </Link>
              <Link
                to="/admin/users"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-amber-500/10 hover:text-amber-500"
              >
                Users
              </Link>
              <Link
                to="/admin/stores"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-amber-500/10 hover:text-amber-500"
              >
                Stores
              </Link>
            </>
          )}

          {!isAdmin && !isStoreOwner && (
            <Link
              to="/stores"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-amber-500/10 hover:text-amber-500"
            >
              Browse Stores
            </Link>
          )}

          {isStoreOwner && (
            <Link
              to="/store-owner/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-amber-500/10 hover:text-amber-500"
            >
              Store Analytics
            </Link>
          )}

          <div className="pt-2 border-t border-slate-100 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
            Signed in as <span className="font-semibold text-slate-900 dark:text-white">{user?.name}</span>
          </div>
        </div>
      )}
    </header>
  );
};
