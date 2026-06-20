import { type ReactNode, useState } from 'react';
import { Menu, Shield } from 'lucide-react';
import { SuperadminSidebar } from './SuperadminSidebar';
import { Button } from '@/components/ui/button';

interface SuperadminLayoutProps {
  children: ReactNode;
}

export function SuperadminLayout({ children }: SuperadminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SuperadminSidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content — no left margin on mobile; offset by sidebar on md+ */}
      <div className="flex flex-col min-h-screen transition-all duration-300 md:ml-60">
        {/* Amber top accent bar */}
        <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600 shrink-0" />

        {/* Admin topbar */}
        <header className="h-14 border-b bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-700/30 flex items-center px-4 gap-3 shrink-0">
          {/* Hamburger — mobile only */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </Button>

          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 shrink-0">
            <Shield size={16} />
            <span className="text-sm font-semibold">Superadmin Panel</span>
          </div>
          <span className="text-muted-foreground text-xs ml-1 hidden sm:block truncate">
            Manage system-wide settings, users, and configuration
          </span>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
