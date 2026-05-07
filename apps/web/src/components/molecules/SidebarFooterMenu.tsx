import { LogOut, MoreHorizontal } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@src/components/atoms/dropdown-menu';
import { SidebarFooter, useSidebar } from '@src/components/atoms/sidebar';
import { useProfile } from '@src/hooks/useProfile';
import { useSession } from '@src/hooks/useSession';

export function SidebarFooterMenu() {
  const { data: profile } = useProfile();
  const { signOut } = useSession();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const initials = profile ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase() : '??';
  const displayName = profile ? `${profile.firstName} ${profile.lastName}` : '';
  const roleBadge =
    profile?.role === 'admin' ? 'ADMIN' : profile?.role === 'owner' ? 'OWNER' : 'MEMBER';

  return (
    <SidebarFooter className="border-t border-sidebar-border px-3 py-3">
      <div className={`flex items-center gap-2 ${isCollapsed ? 'justify-center' : ''}`}>
        <div
          className="w-[26px] h-[26px] rounded-full shrink-0 text-white text-[11px] font-semibold flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #3a3c4a, #6a6c8a)' }}
        >
          {initials}
        </div>
        {!isCollapsed && (
          <>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold leading-tight truncate text-sidebar-primary">
                {displayName}
              </div>
              <div className="text-[10.5px] text-sidebar-foreground mt-0.5">
                <span className="border border-sidebar-border px-1 rounded-[3px] font-mono text-[10px]">
                  {roleBadge}
                </span>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-[22px] h-[22px] rounded-md inline-flex items-center justify-center text-sidebar-foreground border border-transparent bg-transparent hover:bg-sidebar-accent cursor-pointer">
                  <MoreHorizontal size={12} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" sideOffset={8}>
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </SidebarFooter>
  );
}
