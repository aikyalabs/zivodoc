import { Outlet, useMatches, useNavigate, useLocation } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Search, ChevronRight } from 'lucide-react';

import { useProfile } from '@src/hooks/useProfile';
import { Kbd } from '@src/components/atoms/kbd';
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

const ID_PREFIXES = ['proj_', 'scan_', 'fnd_', 'user_', 'org_', 'role_'];

function buildBreadcrumbs(matches: { pathname: string }[]) {
  const crumbs: { label: string; href: string }[] = [];

  for (const match of matches) {
    const path = match.pathname;
    if (path === '/' || path === '/_authentication') continue;

    const segments = path.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (!last) continue;

    if (ID_PREFIXES.some((prefix) => last.toLowerCase().startsWith(prefix))) continue;

    const label = last.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    crumbs.push({ label, href: path });
  }

  return crumbs;
}

export function DashboardLayout() {
  const matches = useMatches();
  const breadcrumbs = buildBreadcrumbs(matches);
  const location = useLocation();
  const navigate = useNavigate();
  const { data: profile, isLoading: isLoadingProfile } = useProfile();

  const isOnboardingRoute = location.pathname.includes('/onboarding');

  useEffect(() => {
    if (isLoadingProfile || isOnboardingRoute) return;
    if (profile && !profile.onboardingCompleted) {
      navigate({ to: '/onboarding' });
    }
  }, [profile, isLoadingProfile, isOnboardingRoute]);

  if (isOnboardingRoute) {
    return <Outlet />;
  }

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
        <header className="h-14 shrink-0 border-b bg-card flex items-center px-3 gap-2.5 sticky top-0 z-20 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 shrink">
            <SidebarTrigger className="size-7" />
            <div className="flex items-center gap-1 text-[12.5px] min-w-0">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <span key={crumb.href} className="flex items-center gap-1 min-w-0">
                    {index > 0 && (
                      <ChevronRight size={11} className="text-muted-foreground/50 shrink-0" />
                    )}
                    <span
                      className={`whitespace-nowrap overflow-hidden text-ellipsis min-w-0 ${
                        isLast ? 'text-foreground font-semibold' : 'text-muted-foreground'
                      }`}
                    >
                      {crumb.label}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>

          <div className="flex-1 flex justify-center min-w-0">
            <button
              type="button"
              className="w-full max-w-[480px] min-w-0 flex items-center gap-2 px-2.5 py-1.5 bg-secondary border border-border rounded-lg text-muted-foreground text-[12.5px] whitespace-nowrap transition-colors hover:border-input cursor-pointer"
            >
              <Search size={13} />
              <span className="flex-1 text-left overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
                Search projects, findings…
              </span>
              <span className="inline-flex gap-0.5 shrink-0">
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <ThemeToggle />
            <div className="w-px h-5 bg-border mx-1" />
            <UserNav />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-5 pb-16">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
