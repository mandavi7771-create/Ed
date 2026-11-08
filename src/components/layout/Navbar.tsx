import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Server, Globe, Shield, Terminal, User as UserIcon, LogOut, ChevronDown, Menu, X } from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const { user, logout, switchAccount } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Web Hosting', path: '/web-hosting' },
    { label: 'Domains', path: '/domain-search' },
    { label: 'Pricing', path: '/hosting-pricing' },
    { label: 'Help Center', path: '/help-center' },
    { label: 'Contact', path: '/contact-us' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single Text Element Wordmark */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 text-left font-bold tracking-tight text-white whitespace-nowrap shrink-0 group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30 group-hover:bg-blue-500 transition-colors">
              <Server className="w-4 h-4" />
            </div>
            <span className="text-xl tracking-tight text-white font-extrabold">
              Nexora<span className="text-blue-500 font-medium">Cloud</span>
            </span>
          </button>

          {/* Zone 2: 4-5 Clean Single-Line Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
                    isActive ? 'text-blue-400 font-semibold' : 'text-slate-300'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action / Profile Control */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:border-slate-700 transition-colors whitespace-nowrap shrink-0"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="max-w-[120px] truncate">{user.fullName}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 text-xs"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="font-semibold text-white truncate">{user.fullName}</p>
                      <p className="text-slate-400 truncate">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span>{user.id}</span>
                        <span>·</span>
                        <span className="capitalize">{user.role.replace('_', ' ')}</span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full text-left px-4 py-2 text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Server className="w-3.5 h-3.5 text-blue-400" />
                        Customer Dashboard
                      </button>
                      <button
                        onClick={() => navigate('/dashboard/deploy')}
                        className="w-full text-left px-4 py-2 text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Globe className="w-3.5 h-3.5 text-emerald-400" />
                        Website ZIP Deployment
                      </button>
                      <button
                        onClick={() => navigate('/dashboard/filemanager')}
                        className="w-full text-left px-4 py-2 text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                        File Manager
                      </button>
                      {['super_admin', 'admin', 'tech_manager', 'finance_manager'].includes(user.role) && (
                        <button
                          onClick={() => navigate('/admin')}
                          className="w-full text-left px-4 py-2 text-amber-400 hover:bg-slate-800 flex items-center gap-2 font-medium"
                        >
                          <Shield className="w-3.5 h-3.5 text-amber-400" />
                          Admin Console
                        </button>
                      )}
                    </div>

                    <div className="border-t border-slate-800 pt-1">
                      <button
                        onClick={() => switchAccount(user.role === 'customer' ? 'admin' : 'customer')}
                        className="w-full text-left px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-between"
                      >
                        <span>Switch to {user.role === 'customer' ? 'Super Admin' : 'Customer'}</span>
                        <span className="text-[10px] text-blue-400">1-Click</span>
                      </button>
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-rose-400 hover:bg-slate-800 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors shadow-sm shadow-blue-600/30 whitespace-nowrap shrink-0 flex items-center gap-1.5"
                >
                  <span>Continue with Google</span>
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-slate-400 hover:text-white focus:outline-none"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => {
                  navigate(link.path);
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg"
              >
                {link.label}
              </button>
            ))}
            <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
              <button
                onClick={() => {
                  switchAccount('customer');
                  setMobileMenuOpen(false);
                  navigate('/dashboard');
                }}
                className="text-left px-3 py-2 text-xs text-blue-400 hover:bg-slate-900 rounded-lg"
              >
                Quick Demo Customer Login
              </button>
              <button
                onClick={() => {
                  switchAccount('admin');
                  setMobileMenuOpen(false);
                  navigate('/admin');
                }}
                className="text-left px-3 py-2 text-xs text-amber-400 hover:bg-slate-900 rounded-lg"
              >
                Quick Super Admin Login
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
