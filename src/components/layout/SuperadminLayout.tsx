import { type ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Moon, Shield, Sun, User } from 'lucide-react';
import { SuperadminSidebar } from './SuperadminSidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';

interface SuperadminLayoutProps {
  children: ReactNode;
}

export function SuperadminLayout({ children }: SuperadminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

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
            className="md:hidden shrink-0 h-10 w-10"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </Button>

          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 shrink-0">
            <Shield size={16} />
            <span className="text-sm font-semibold">Superadmin Panel</span>
          </div>
          <span className="text-muted-foreground text-xs ml-1 hidden sm:block truncate">
            Manage system-wide settings, users, and configuration
          </span>

          <div className="flex-1" />

          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="shrink-0">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full outline-none ring-2 ring-transparent focus:ring-ring transition-all cursor-pointer shrink-0">
                <Avatar className="h-8 w-8">
                  {user?.profile_picture && <AvatarImage src={user.profile_picture} alt={user.name} />}
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-3 py-2">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                <User size={14} className="mr-2" />
                Profile
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
