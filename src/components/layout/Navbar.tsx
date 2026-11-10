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
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors shadow-sm whitespace-nowrap shrink-0 flex items-center gap-2 border border-slate-200"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" fill="#4285F4"/>
                    <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" fill="#34A853"/>
                    <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" fill="#FBBC05"/>
                    <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" fill="#EA4335"/>
                  </svg>
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
              {!user ? (
                <button
                  onClick={() => {
                    navigate('/login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-lg text-xs flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" fill="#4285F4"/>
                    <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" fill="#34A853"/>
                    <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" fill="#FBBC05"/>
                    <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" fill="#EA4335"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    navigate('/dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 px-3 bg-blue-600 text-white font-semibold rounded-lg text-xs"
                >
                  Open Customer Dashboard
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
