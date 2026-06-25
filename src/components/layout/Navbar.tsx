import { Bell, Menu, Moon, Sun, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useSidebarStore } from '@/store/sidebarStore';
import { logout } from '@/api/auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, clearAuth } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { isOpen, toggle } = useSidebarStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await logout(); } catch {}
    clearAuth();
    navigate('/login');
    toast.success('Logged out successfully.');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 border-b border-border bg-background flex items-center px-4 gap-4 transition-all duration-300',
        // Mobile: always full-width (sidebar is overlay). Desktop: offset by sidebar width.
        'left-0',
        isOpen ? 'md:left-60' : 'md:left-16'
      )}
    >
      {/* Hamburger — mobile only */}
      <Button variant="ghost" size="icon" className="md:hidden h-10 w-10" onClick={toggle} aria-label="Open menu">
        <Menu size={24} />
      </Button>

      <div className="flex-1" />

      {/* Theme toggle */}
      <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-8 sm:w-8" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'dark' ? <Sun className="size-5 sm:size-[18px]" /> : <Moon className="size-5 sm:size-[18px]" />}
      </Button>

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-8 sm:w-8" onClick={() => navigate('/notifications')} aria-label="Notifications">
        <Bell className="size-5 sm:size-[18px]" />
      </Button>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full outline-none ring-2 ring-transparent focus:ring-ring transition-all">
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
          <DropdownMenuItem onClick={() => navigate('/profile')}>
            <User size={14} className="mr-2" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
