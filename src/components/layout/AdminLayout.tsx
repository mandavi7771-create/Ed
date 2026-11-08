import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert,
  Users,
  Globe,
  Server,
  ShoppingCart,
  CreditCard,
  RotateCcw,
  Sliders,
  DollarSign,
  Tag,
  LifeBuoy,
  Settings,
  UserCheck,
  FileText,
  Activity,
  ArrowLeft,
  LogOut,
} from 'lucide-react';

interface AdminLayoutProps {
  currentPath: string;
  navigate: (path: string) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ currentPath, navigate, children }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Overview', path: '/admin', icon: Activity },
    { label: 'Customers', path: '/admin/customers', icon: Users },
    { label: 'Domain Registry', path: '/admin/domains', icon: Globe },
    { label: 'Hosting Accounts', path: '/admin/hosting', icon: Server },
    { label: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { label: 'Payments', path: '/admin/payments', icon: CreditCard },
    { label: 'Refunds', path: '/admin/refunds', icon: RotateCcw },
    { label: 'Hosting Plans (11)', path: '/admin/plans', icon: Sliders },
    { label: 'Domain Pricing & TLDs', path: '/admin/domain-pricing', icon: DollarSign },
    { label: '₹1 Domain Offer', path: '/admin/promo-domains', icon: Tag },
    { label: 'Support Queue', path: '/admin/tickets', icon: LifeBuoy },
    { label: 'Website Settings', path: '/admin/settings', icon: Settings },
    { label: 'Staff & Roles (RBAC)', path: '/admin/staff', icon: UserCheck },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 shrink-0 flex flex-col justify-between">
        <div>
          {/* Admin Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white shadow-sm shadow-amber-600/30">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-white block">Nexora Admin</span>
                <span className="text-[10px] text-amber-400 block font-mono">Operations Console</span>
              </div>
            </div>
          </div>

          {/* Admin Profile Card */}
          <div className="p-3 mx-3 my-3 bg-amber-950/20 rounded-xl border border-amber-900/40">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-amber-200 truncate">{user?.fullName || 'Administrator'}</p>
              <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
                {user?.role?.replace('_', ' ') || 'Super Admin'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">{user?.email}</p>
          </div>

          {/* Admin Navigation */}
          <nav className="px-3 py-2 space-y-0.5 max-h-[calc(100vh-230px)] overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                    isActive
                      ? 'bg-amber-600 text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom controls */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Customer View</span>
            </div>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>

      {/* Admin Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="text-amber-400 font-semibold">Admin</span>
            <span>/</span>
            <span className="text-slate-200 capitalize font-medium">
              {currentPath.replace('/admin', '').replace('/', '') || 'Overview'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-800/80 rounded-lg border border-slate-700 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Infrastructure: 4 Nodes Healthy</span>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Public Site
            </button>
          </div>
        </header>

        <main className="p-6 max-w-7xl w-full mx-auto flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};
