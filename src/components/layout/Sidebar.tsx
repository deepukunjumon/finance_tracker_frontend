import {
  BarChart3,
  Bell,
  ChevronLeft,
  CreditCard,
  LayoutDashboard,
  LogOut,
  PieChart,
  RefreshCw,
  Settings,
  Shield,
  Tag,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

import { useAuthStore } from '@/store/authStore';
import { useSidebarStore } from '@/store/sidebarStore';
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

const mainNav = [
  { to: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/accounts',     label: 'Accounts',     icon: Wallet },
  { to: '/transactions', label: 'Transactions', icon: CreditCard },
];

const planningNav = [
  { to: '/categories', label: 'Categories', icon: Tag },
  { to: '/budgets',    label: 'Budgets',    icon: PieChart },
  { to: '/recurring',  label: 'Recurring',  icon: RefreshCw },
];

const insightsNav = [
  { to: '/reports',       label: 'Reports',       icon: BarChart3 },
  { to: '/notifications', label: 'Notifications', icon: Bell },
];

const settingsNav = [
  { to: '/settings', label: 'Settings', icon: Settings },
];

interface NavSectionProps {
  label:    string;
  items:    { to: string; label: string; icon: React.ElementType }[];
  isOpen:   boolean;
  onNavigate?: () => void;
}

function NavSection({ label, items, isOpen, onNavigate }: NavSectionProps) {
  return (
    <div>
      {isOpen && (
        <p className="text-[10px] uppercase tracking-widest text-[var(--sidebar-foreground)]/40 px-3 mb-1 mt-4 font-semibold">
          {label}
        </p>
      )}
      {!isOpen && <div className="h-4" />}
      <div className="space-y-0.5">
        {items.map(({ to, label: itemLabel, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-2.5 py-2 rounded-md text-sm font-medium transition-colors',
                'text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]',
                isActive && 'bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)] font-semibold',
                !isOpen && 'justify-center px-0'
              )
            }
            title={!isOpen ? itemLabel : undefined}
          >
            <Icon size={18} className="shrink-0" />
            {isOpen && <span className="truncate">{itemLabel}</span>}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export function Sidebar() {
  const { isOpen, toggle, close } = useSidebarStore();
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const closeMobile = () => {
    if (window.innerWidth < 768) close();
  };

  const doLogout = async () => {
    try { await logout(); } catch { /* token may already be invalid */ }
    clearAuth();
    navigate('/login');
    toast.success('Logged out successfully.');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={close}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] transition-all duration-300',
          // Mobile: hidden when closed, slide in as overlay when open
          isOpen ? 'w-60' : '-translate-x-full md:translate-x-0 md:w-16'
        )}
      >
        {/* Logo / Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[var(--sidebar-border)] shrink-0">
          {isOpen && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <TrendingUp size={15} className="text-primary-foreground" />
              </div>
              <span className="text-[var(--sidebar-foreground)] font-bold text-sm tracking-tight truncate">
                FinanceTracker
              </span>
            </div>
          )}
          {!isOpen && (
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center mx-auto">
              <TrendingUp size={15} className="text-primary-foreground" />
            </div>
          )}
          <button
            onClick={toggle}
            className={cn(
              'p-1.5 rounded-md text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] transition-colors shrink-0',
              !isOpen && 'hidden'
            )}
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={16} />
          </button>
          {/* Expand button when collapsed */}
          {!isOpen && (
            <button
              onClick={toggle}
              className="hidden md:flex absolute -right-3 top-6 w-6 h-6 rounded-full bg-background border border-border shadow-sm items-center justify-center text-foreground hover:bg-accent transition-colors"
              aria-label="Expand sidebar"
            >
              <ChevronLeft size={12} className="rotate-180" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          <NavSection label="Menu"      items={mainNav}     isOpen={isOpen} onNavigate={closeMobile} />
          <NavSection label="Planning"  items={planningNav} isOpen={isOpen} onNavigate={closeMobile} />
          <NavSection label="Insights"  items={insightsNav} isOpen={isOpen} onNavigate={closeMobile} />
          <NavSection label="Account"   items={settingsNav} isOpen={isOpen} onNavigate={closeMobile} />

          {user?.role === 'superadmin' && (
            <div>
              {isOpen && (
                <p className="text-[10px] uppercase tracking-widest text-amber-500 px-3 mb-1 mt-4 font-semibold">
                  Admin
                </p>
              )}
              {!isOpen && <div className="h-4" />}
              <NavLink
                to="/superadmin"
                onClick={closeMobile}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-2.5 py-2 rounded-md text-sm font-medium transition-colors',
                    'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10',
                    isActive && 'bg-amber-500/10 font-semibold',
                    !isOpen && 'justify-center px-0'
                  )
                }
                title={!isOpen ? 'Superadmin' : undefined}
              >
                <Shield size={18} className="shrink-0" />
                {isOpen && <span className="truncate">Superadmin Panel</span>}
              </NavLink>
            </div>
          )}
        </nav>

        {/* Bottom: user info + logout */}
        <div className="shrink-0 px-2 pb-3 border-t border-[var(--sidebar-border)] pt-3 space-y-1">
          {isOpen && user && (
            <div className="px-2.5 py-2 rounded-md bg-[var(--sidebar-accent)]/50 mb-2">
              <p className="text-xs font-medium text-[var(--sidebar-foreground)] truncate">{user.name}</p>
              <p className="text-[10px] text-[var(--sidebar-foreground)]/60 truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={() => setConfirmOpen(true)}
            className={cn(
              'w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-sm font-medium transition-colors',
              'text-[var(--sidebar-foreground)] hover:bg-destructive/10 hover:text-destructive cursor-pointer',
              !isOpen && 'justify-center px-0'
            )}
            title={!isOpen ? 'Logout' : undefined}
          >
            <LogOut size={18} className="shrink-0" />
            {isOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll be returned to the login screen.
            </AlertDialogDescription>
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
