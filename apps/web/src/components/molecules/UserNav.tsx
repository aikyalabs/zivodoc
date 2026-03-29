import { LogOut } from 'lucide-react';

import { Avatar, AvatarFallback } from '@src/components/atoms/avatar';
import { Button } from '@src/components/atoms/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@src/components/atoms/dropdown-menu';
import { useProfile } from '@src/hooks/useProfile';
import { useSession } from '@src/hooks/useSession';

export function UserNav() {
  const { data: profile } = useProfile();
  const { signOut } = useSession();

  const initials = profile ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase() : '??';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative size-8 rounded-full">
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profile ? `${profile.firstName} ${profile.lastName}` : 'Loading...'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">{profile?.email ?? ''}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="mr-2 size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
