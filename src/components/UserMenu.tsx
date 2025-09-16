import {
  LogOut,
  Settings,
  UserCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useAuthUser } from '../store/authStore';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function UserMenu() {
  const navigate = useNavigate();
  const { logout, isLoading } = useAuth();
  const user = useAuthUser();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  // Get user initials for avatar fallback
  const getUserInitials = (displayName?: string) => {
    if (!displayName) return 'U';
    return displayName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={user.avatarUrl}
              alt={user.displayName || 'User'}
            />
            <AvatarFallback>
              {getUserInitials(user.displayName)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.displayName || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              ID: {user.id.slice(0, 8)}...
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleProfileClick}>
          <UserCircle className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleSettingsClick}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoading}
          className="text-red-600 focus:text-red-600"
        >
          {/* {isLoading ? (
            <LoadingSpinner className="mr-2 h-4 w-4" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )} */}
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact version for mobile
export function UserMenuCompact() {
  const navigate = useNavigate();
  const { logout, isLoading } = useAuth();
  const user = useAuthUser();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center space-x-3 px-4 py-2">
      <Avatar className="h-8 w-8">
        <AvatarImage
          src={user.avatarUrl}
          alt={user.displayName || 'User'}
        />
        <AvatarFallback>
          {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {user.displayName || 'User'}
        </p>
        <p className="text-xs text-gray-500 truncate">
          ID: {user.id.slice(0, 8)}...
        </p>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        disabled={isLoading}
        className="text-red-600 hover:text-red-700"
      >
        {/* {isLoading ? (
          <LoadingSpinner className="h-4 w-4" />
        ) : (
          <LogOut className="h-4 w-4" />
        )} */}
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}