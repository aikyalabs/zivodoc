import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Activity,
  Users,
  Building2,
  ScrollText,
  AlertTriangle,
  CheckCircle2,
  Layers,
} from 'lucide-react';

import { Skeleton } from '@src/components/atoms/skeleton';
import { StatCard } from '@src/components/molecules/StatCard';
import { apiClient } from '@src/lib/queries/defaultQueryFn';

import type { ApiOkResponse } from '@zivodoc/shared';

export const Route = createFileRoute('/_authentication/admin/')({
  component: AdminOverviewPage,
});

interface AdminStats {
  totalUsers: number;
  totalOrgs: number;
  activeUsers: number;
  disabledUsers: number;
}

interface ScanSummary {
  today: { total: number; completed: number; failed: number; running: number };
  week: { total: number; completed: number; failed: number };
  month: { total: number };
  topOrgs: { orgId: string; name: string; count: number }[];
}

interface QueueSummary {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

function AdminOverviewPage() {
  const { data: statsResp, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const r = await apiClient.get<ApiOkResponse<AdminStats>>('/admin/stats');
      return r.data.payload;
    },
  });

  const { data: scans, isLoading: scansLoading } = useQuery({
    queryKey: ['admin', 'scans', 'summary'],
    queryFn: async () => {
      const r = await apiClient.get<ApiOkResponse<ScanSummary>>('/admin/scans/summary');
      return r.data.payload;
    },
  });

  const { data: queue } = useQuery({
    queryKey: ['admin', 'queue', 'summary'],
    queryFn: async () => {
      const r = await apiClient.get<ApiOkResponse<QueueSummary>>('/admin/queue/summary');
      return r.data.payload;
    },
    refetchInterval: 5_000,
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Platform overview</h2>
        <p className="text-muted-foreground">Live stats across users, orgs, and scans.</p>
      </div>

      <Section title="Users & orgs">
        {statsLoading ? (
          <SkeletonGrid count={4} />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total users" value={statsResp?.totalUsers ?? 0} icon={Users} />
            <StatCard
              label="Active"
              value={statsResp?.activeUsers ?? 0}
              icon={CheckCircle2}
              variant="success"
            />
            <StatCard
              label="Disabled"
              value={statsResp?.disabledUsers ?? 0}
              icon={AlertTriangle}
              variant="warning"
            />
            <StatCard label="Organizations" value={statsResp?.totalOrgs ?? 0} icon={Building2} />
          </div>
        )}
      </Section>

      <Section title="Scans">
        {scansLoading ? (
          <SkeletonGrid count={4} />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Today"
              value={scans?.today.total ?? 0}
              icon={Activity}
              description={`${scans?.today.completed ?? 0} ok · ${scans?.today.failed ?? 0} failed · ${scans?.today.running ?? 0} running`}
            />
            <StatCard
              label="Last 7 days"
              value={scans?.week.total ?? 0}
              description={`${scans?.week.completed ?? 0} ok · ${scans?.week.failed ?? 0} failed`}
            />
            <StatCard label="This month" value={scans?.month.total ?? 0} />
            <StatCard
              label="Failed today"
              value={scans?.today.failed ?? 0}
              variant={scans && scans.today.failed > 0 ? 'error' : 'default'}
            />
          </div>
        )}
      </Section>

      <Section title="Scan queue (live)">
        {!queue ? (
          <SkeletonGrid count={4} />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Waiting"
              value={queue.waiting}
              icon={Layers}
              variant={queue.waiting > 0 ? 'info' : 'default'}
            />
            <StatCard
              label="Active"
              value={queue.active}
              variant={queue.active > 0 ? 'success' : 'default'}
            />
            <StatCard
              label="Failed"
              value={queue.failed}
              variant={queue.failed > 0 ? 'error' : 'default'}
            />
            <StatCard label="Delayed" value={queue.delayed} />
          </div>
        )}
      </Section>

      <Section title="Top orgs by scan volume (this month)">
        {scansLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : !scans?.topOrgs.length ? (
          <p className="text-sm text-muted-foreground">No scans yet this month.</p>
        ) : (
          <div className="border rounded-md divide-y">
            {scans.topOrgs.map((o) => (
              <Link
                key={o.orgId}
                to="/admin/organizations"
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <span className="font-medium">{o.name}</span>
                <span className="tabular-nums text-sm text-muted-foreground">{o.count} scans</span>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Section title="Quick links">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickLink to="/admin/users" icon={Users} label="Manage users" />
          <QuickLink to="/admin/organizations" icon={Building2} label="Manage orgs" />
          <QuickLink to="/admin/audit-logs" icon={ScrollText} label="Audit logs" />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function SkeletonGrid({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: typeof Users; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 border rounded-md px-4 py-3 hover:bg-muted/40 transition-colors"
    >
      <Icon className="size-4 text-muted-foreground" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
