import { ChevronRight } from 'lucide-react';
import { Link, useMatchRoute } from '@tanstack/react-router';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@src/components/atoms/collapsible';
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@src/components/atoms/sidebar';

import type { NavItem } from '@src/lib/navigation';

interface SidebarRouteMenuItemProps {
  item: NavItem;
}

export function SidebarRouteMenuItem({ item }: SidebarRouteMenuItemProps) {
  const matchRoute = useMatchRoute();
  const isActive = !!matchRoute({ to: item.url, fuzzy: true });

  // If this item has sub-items, render as collapsible
  if (item.items && item.items.length > 0) {
    const isChildActive = item.items.some((sub) => !!matchRoute({ to: sub.url }));

    return (
      <Collapsible asChild defaultOpen={isActive || isChildActive} className="group/collapsible">
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={item.title} isActive={isActive && !isChildActive}>
              <item.icon />
              <span>{item.title}</span>
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.items.map((sub) => {
                const isSubActive = !!matchRoute({ to: sub.url });
                return (
                  <SidebarMenuSubItem key={sub.title}>
                    <SidebarMenuSubButton asChild isActive={isSubActive}>
                      <Link to={sub.url}>
                        <span>{sub.title}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  // Simple item without sub-items
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
        <Link to={item.url}>
          <item.icon />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
