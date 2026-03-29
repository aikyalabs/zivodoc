import { Outlet, useMatches } from '@tanstack/react-router';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@src/components/atoms/breadcrumb';
import { Separator } from '@src/components/atoms/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@src/components/atoms/sidebar';
import { NavHeader } from '@src/components/molecules/NavHeader';
import { SidebarFooterMenu } from '@src/components/molecules/SidebarFooterMenu';
import { SidebarRouteGroup } from '@src/components/molecules/SidebarRouteGroup';
import { ThemeToggle } from '@src/components/molecules/ThemeToggle';
import { UserNav } from '@src/components/molecules/UserNav';
import { navigation } from '@src/lib/navigation';

function buildBreadcrumbs(matches: { pathname: string }[]) {
  const crumbs: { label: string; href: string }[] = [];

  for (const match of matches) {
    const path = match.pathname;
    if (path === '/' || path === '/_authentication') continue;

    // Extract the last segment and format it
    const segments = path.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (!last) continue;

    const label = last.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    crumbs.push({ label, href: path });
  }

  return crumbs;
}

export function DashboardLayout() {
  const matches = useMatches();
  const breadcrumbs = buildBreadcrumbs(matches);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <NavHeader />
        <SidebarContent>
          {navigation.map((group) => (
            <SidebarRouteGroup key={group.label} group={group} />
          ))}
        </SidebarContent>
        <SidebarFooterMenu />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  return (
                    <BreadcrumbItem key={crumb.href}>
                      {index > 0 && <BreadcrumbSeparator />}
                      {isLast ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <UserNav />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
