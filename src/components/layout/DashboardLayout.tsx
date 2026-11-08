import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { NotificationItem } from '../../types';
import {
  Server,
  Globe,
  UploadCloud,
  FolderTree,
  Network,
  ShieldCheck,
  CreditCard,
  LifeBuoy,
  Bell,
  Home,
  LogOut,
  ChevronRight,
  User,
  CheckCircle2,
  X,
  Tag,
  Archive,
  RefreshCw,
} from 'lucide-react';

interface DashboardLayoutProps {
  currentPath: string;
  navigate: (path: string) => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ currentPath, navigate, children }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      api.getMyNotifications(user.id).then((res) => {
        setNotifications(res.notifications || []);
      }).catch(console.error);
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markRead = async (id: string) => {
    await api.markNotificationRead(id).catch(console.error);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const navItems = [
    { label: 'Overview', path: '/dashboard', icon: Home },
    { label: 'Domains', path: '/dashboard/domains', icon: Globe },
    { label: 'Hosting Services', path: '/dashboard/hosting', icon: Server },
    { label: 'My Coupons', path: '/dashboard/coupons', icon: Tag },
    { label: 'ZIP Deployment', path: '/dashboard/deploy', icon: UploadCloud, highlight: true },
    { label: 'File Manager', path: '/dashboard/filemanager', icon: FolderTree },
    { label: 'DNS Management', path: '/dashboard/dns', icon: Network },
    { label: 'SSL Certificates', path: '/dashboard/ssl', icon: ShieldCheck },
    { label: 'Backup Management', path: '/dashboard/backups', icon: Archive },
    { label: 'Renewal Management', path: '/dashboard/renewals', icon: RefreshCw },
    { label: 'Billing & Invoices', path: '/dashboard/billing', icon: CreditCard },
    { label: 'Support Tickets', path: '/dashboard/tickets', icon: LifeBuoy },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 shrink-0 flex flex-col justify-between">
        <div>
          {/* Brand header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <button onClick={() => navigate('/')} className="flex items-center gap-2.5 text-left">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-white block">Nexora Cloud</span>
                <span className="text-[10px] text-slate-400 block">Customer Console</span>
              </div>
            </button>
          </div>

          {/* Customer Summary Card */}
          <div className="p-4 mx-3 my-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs font-semibold">
                {user?.fullName?.charAt(0) || 'C'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.fullName}</p>
                <p className="text-[11px] text-blue-400 font-mono">{user?.id}</p>
              </div>
            </div>
            {user?.companyName && (
              <p className="text-[11px] text-slate-400 mt-2 truncate">Org: {user.companyName}</p>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : item.highlight
                      ? 'text-emerald-400 hover:bg-slate-800/80'
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
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span>Public Website</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar with Breadcrumbs & Notifications */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button onClick={() => navigate('/dashboard')} className="hover:text-slate-200">Customer</button>
            <span>/</span>
            <span className="text-slate-200 capitalize font-medium">
              {currentPath.replace('/dashboard', '').replace('/', '') || 'Overview'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                    <span className="text-xs font-semibold text-white">Notifications</span>
                    <span className="text-[11px] text-slate-500">{unreadCount} unread</span>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-center text-xs text-slate-500 py-4">No notifications yet.</p>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-lg border text-xs transition-colors ${
                            n.isRead
                              ? 'bg-slate-950/40 border-slate-800/50 text-slate-400'
                              : 'bg-blue-950/20 border-blue-900/50 text-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-slate-200 text-xs">{n.subject}</p>
                            {!n.isRead && (
                              <button
                                onClick={() => markRead(n.id)}
                                className="text-[10px] text-blue-400 hover:underline shrink-0"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                          <div
                            className="text-[11px] text-slate-400 mt-1"
                            dangerouslySetInnerHTML={{ __html: n.messageHtml }}
                          />
                          <p className="text-[10px] text-slate-500 mt-1">{new Date(n.sentAt).toLocaleDateString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Deploy CTA button */}
            <button
              onClick={() => navigate('/dashboard/deploy')}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg transition-colors shadow-sm"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Deploy Website ZIP</span>
            </button>
          </div>
        </header>

        {/* Content view */}
        <main className="p-6 max-w-7xl w-full mx-auto flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};
