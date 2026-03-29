import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from '@src/components/atoms/sidebar';
import { SidebarRouteMenuItem } from '@src/components/molecules/SidebarRouteMenuItem';
import { useProfile } from '@src/hooks/useProfile';

import type { NavGroup } from '@src/lib/navigation';
import type { UserRole } from '@template/shared';

interface SidebarRouteGroupProps {
  group: NavGroup;
}

export function SidebarRouteGroup({ group }: SidebarRouteGroupProps) {
  const { data: profile } = useProfile();
  const userRole: UserRole | undefined = profile?.role;

  const filteredItems = group.items.filter((item) => {
    if (!item.roles) return true;
    if (!userRole) return false;
    return item.roles.includes(userRole);
  });

  if (filteredItems.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {filteredItems.map((item) => (
            <SidebarRouteMenuItem key={item.title} item={item} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
