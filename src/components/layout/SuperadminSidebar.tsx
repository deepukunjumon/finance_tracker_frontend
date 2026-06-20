import {
  ChevronLeft,
  FileText,
  LayoutDashboard,
  Settings,
  Shield,
  Tag,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { logout } from '@/api/auth';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const adminNav = [
  { to: '/superadmin',               label: 'Dashboard',    icon: LayoutDashboard, end: true },
  { to: '/superadmin/users',         label: 'Users',        icon: Users },
  { to: '/superadmin/currencies',    label: 'Currencies',   icon: TrendingUp },
  { to: '/superadmin/account-types', label: 'Acct Types',   icon: Wallet },
  { to: '/superadmin/categories',    label: 'Categories',   icon: Tag },
  { to: '/superadmin/audit-logs',    label: 'Audit Logs',   icon: FileText },
  { to: '/superadmin/settings',      label: 'App Settings', icon: Settings },
];

interface SuperadminSidebarProps {
  mobileOpen:    boolean;
  onMobileClose: () => void;
}

export function SuperadminSidebar({ mobileOpen, onMobileClose }: SuperadminSidebarProps) {
  const [collapsed,   setCollapsed]   = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const doLogout = async () => {
    try { await logout(); } catch { /* token may already be invalid */ }
    clearAuth();
    navigate('/login');
    toast.success('Logged out successfully.');
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-[var(--sidebar)] border-r border-amber-500/30 transition-all duration-300',
          // Mobile: slide in/out as overlay; Desktop: collapse to icon rail
          mobileOpen ? 'w-60 translate-x-0' : '-translate-x-full md:translate-x-0',
          !mobileOpen && (collapsed ? 'md:w-16' : 'md:w-60')
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-amber-500/30 shrink-0">
          {(!collapsed || mobileOpen) && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
                <Shield size={15} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[var(--sidebar-foreground)] font-bold text-xs truncate">Superadmin</p>
                <p className="text-amber-500 text-[10px] font-medium">Admin Panel</p>
              </div>
            </div>
          )}
          {collapsed && !mobileOpen && (
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center mx-auto">
              <Shield size={15} className="text-white" />
            </div>
          )}

          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-md text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] transition-colors shrink-0 md:hidden"
            aria-label="Close"
          >
            <X size={16} />
          </button>

          {/* Desktop collapse button */}
          {(!collapsed || mobileOpen) && (
            <button
              onClick={() => setCollapsed(true)}
              className="hidden md:flex p-1.5 rounded-md text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] transition-colors shrink-0"
              aria-label="Collapse"
            >
              <ChevronLeft size={16} />
            </button>
          )}

          {/* Desktop expand button */}
          {collapsed && !mobileOpen && (
            <button
              onClick={() => setCollapsed(false)}
              className="hidden md:flex absolute -right-3 top-6 w-6 h-6 rounded-full bg-background border border-border shadow-sm items-center justify-center hover:bg-accent transition-colors"
              aria-label="Expand"
            >
              <ChevronLeft size={12} className="rotate-180" />
            </button>
          )}
        </div>

        {/* Back to app */}
        {(!collapsed || mobileOpen) && (
          <div className="px-3 py-2 border-b border-amber-500/20">
            <NavLink
              to="/dashboard"
              onClick={onMobileClose}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-[var(--sidebar-accent)]"
            >
              <ChevronLeft size={14} />
              Back to App
            </NavLink>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {adminNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onMobileClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-2.5 py-2 rounded-md text-sm font-medium transition-colors',
                  'text-[var(--sidebar-foreground)] hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400',
                  isActive && 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold',
                  collapsed && !mobileOpen && 'md:justify-center md:px-0'
                )
              }
              title={collapsed && !mobileOpen ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {(!collapsed || mobileOpen) && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="shrink-0 px-2 pb-3 border-t border-amber-500/20 pt-3 space-y-1">
          {(!collapsed || mobileOpen) && user && (
            <div className="px-2.5 py-2 rounded-md bg-amber-500/10 mb-2">
              <p className="text-xs font-medium text-[var(--sidebar-foreground)] truncate">{user.name}</p>
              <p className="text-[10px] text-amber-500 font-medium">Superadmin</p>
            </div>
          )}
          <button
            onClick={() => setConfirmOpen(true)}
            className={cn(
              'w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-sm font-medium transition-colors',
              'text-[var(--sidebar-foreground)] hover:bg-destructive/10 hover:text-destructive cursor-pointer',
              collapsed && !mobileOpen && 'md:justify-center md:px-0'
            )}
            title={collapsed && !mobileOpen ? 'Logout' : undefined}
          >
            <X size={18} className="shrink-0" />
            {(!collapsed || mobileOpen) && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out?</AlertDialogTitle>
            <AlertDialogDescription>You'll be returned to the login screen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
