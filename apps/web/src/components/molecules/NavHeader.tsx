import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@src/components/atoms/sidebar';

export function NavHeader() {
  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild>
            <a href="/dashboard">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <svg width="16" height="11" viewBox="0 0 480 320" fillRule="evenodd">
                  <path
                    d="M160,160 m-140,0 a140,140 0 1,0 280,0 a140,140 0 1,0 -280,0 M320,160 m-140,0 a140,140 0 1,0 280,0 a140,140 0 1,0 -280,0"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">zivodoc</span>
                <span className="truncate text-xs text-muted-foreground">Docs QA</span>
              </div>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}
