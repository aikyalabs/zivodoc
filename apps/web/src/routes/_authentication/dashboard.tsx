import { createFileRoute, Link } from '@tanstack/react-router';
import {
  ArrowRight,
  FolderSearch,
  Plus,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  FolderOpen,
  Scan,
  ShieldCheck,
  Globe,
  GitBranch,
  ExternalLink,
} from 'lucide-react';

import { Badge } from '@src/components/atoms/badge';
import { Button } from '@src/components/atoms/button';
import { Skeleton } from '@src/components/atoms/skeleton';
import { EmptyState } from '@src/components/molecules/EmptyState';
import { StatCard } from '@src/components/molecules/StatCard';
import { StatusBadge } from '@src/components/molecules/StatusBadge';
import { useProfile } from '@src/hooks/useProfile';
import { useProjects } from '@src/hooks/queries/useProjects';
import { useDashboardStats } from '@src/hooks/queries/useDashboardStats';

export const Route = createFileRoute('/_authentication/dashboard')({
  component: DashboardPage,
});

const CATEGORY_LABELS: Record<string, string> = {
  broken_link: 'Broken Link',
  broken_anchor: 'Broken Anchor',
  redirect_chain: 'Redirect',
  slow_link: 'Slow Link',
  syntax_error: 'Syntax Error',
  leaked_secret: 'Leaked Secret',
  insecure_link: 'Insecure Link',
  internal_url: 'Internal URL',
  todo_left: 'TODO Left',
  placeholder_text: 'Placeholder',
};

function formatRelativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function DashboardPage() {
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const { data: projectsData, isLoading: isLoadingProjects } = useProjects();
  const { data: stats, isLoading: isLoadingStats } = useDashboardStats();
  const projects = projectsData?.payload ?? [];
  const isAdmin = profile?.role === 'admin';
  const isLoading = isLoadingProfile || isLoadingProjects || isLoadingStats;

  const greeting = getGreeting();

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          {isLoadingProfile ? (
            <Skeleton className="h-8 w-64" />
          ) : (
            <h1 className="text-2xl font-semibold tracking-tight">
              {greeting}, {profile?.firstName}
            </h1>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin
              ? 'Platform overview across all organizations.'
              : "Here's how your docs are doing."}
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/projects">
            <Plus className="mr-2 size-4" />
            Add Project
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderSearch}
          title="No projects yet"
          description="Add your first docs project to start scanning for broken links, stale API refs, and code errors."
          action={
            <Button asChild>
              <Link to="/projects">
                <Plus className="mr-2 size-4" />
                Add Project
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Projects" value={stats?.totalProjects ?? 0} icon={FolderOpen} />
            <StatCard label="Total Scans" value={stats?.totalScans ?? 0} icon={Scan} />
            <StatCard
              label="Open Issues"
              value={stats?.openFindings ?? 0}
              icon={AlertTriangle}
              variant={(stats?.openFindings ?? 0) > 0 ? 'warning' : 'success'}
            />
            <StatCard
              label="Resolved"
              value={stats?.resolvedFindings ?? 0}
              icon={ShieldCheck}
              variant="success"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium">Recent Scans</h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/projects" className="text-muted-foreground">
                    All projects
                    <ArrowRight className="ml-1 size-3.5" />
                  </Link>
                </Button>
              </div>
              {(stats?.recentScans?.length ?? 0) === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No scans yet. Run your first scan from a project.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border bg-card divide-y">
                  {stats?.recentScans.slice(0, 6).map((scan) => {
                    const project = projects.find((p) => p.id === scan.projectId);
                    return (
                      <Link
                        key={scan.id}
                        to="/projects/$projectId"
                        params={{ projectId: scan.projectId }}
                        className="flex items-center justify-between p-3 hover:bg-accent/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <StatusBadge
                            status={scan.status as 'pending' | 'running' | 'completed' | 'failed'}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {project?.name ?? 'Unknown'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {scan.pagesScanned} pages · {scan.findingsCount} findings
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">
                          {formatRelativeTime(scan.createdAt)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-medium">Critical Issues</h2>
              {(stats?.topFindings?.length ?? 0) === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <CheckCircle2 className="size-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">No critical issues</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All your docs are looking healthy.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border bg-card divide-y">
                  {stats?.topFindings.slice(0, 6).map((finding) => {
                    const project = projects.find((p) => p.id === finding.projectId);
                    return (
                      <Link
                        key={finding.id}
                        to="/projects/$projectId"
                        params={{ projectId: finding.projectId }}
                        className="flex items-start gap-3 p-3 hover:bg-accent/30 transition-colors"
                      >
                        <div className="mt-0.5 shrink-0">
                          <XCircle className="size-4 text-red-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{finding.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="muted" className="text-[10px] px-1.5 py-0">
                              {CATEGORY_LABELS[finding.category] ?? finding.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{project?.name}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Your Projects</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/projects" className="text-muted-foreground">
                  View all
                  <ArrowRight className="ml-1 size-3.5" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {projects.slice(0, 6).map((project) => {
                const url = project.siteUrl ?? project.repoUrl ?? '';
                const displayUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
                const isSite = project.scanMode === 'site' || project.scanMode === 'both';
                const ModeIcon = isSite ? Globe : GitBranch;
                const lastStatus = project.lastScanStatus as string | null;
                const totalFindings = (project.totalFindings as number) ?? 0;

                return (
                  <Link
                    key={project.id}
                    to="/projects/$projectId"
                    params={{ projectId: project.id }}
                    className="group flex items-center gap-3 rounded-lg border bg-card p-4 hover:border-foreground/20 transition-colors"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                      <ModeIcon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{project.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{displayUrl}</p>
                    </div>
                    <div className="shrink-0">
                      {lastStatus === 'completed' && totalFindings > 0 ? (
                        <Badge variant="warning" className="text-[10px]">
                          {totalFindings}
                        </Badge>
                      ) : lastStatus === 'completed' ? (
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      ) : lastStatus === 'running' || lastStatus === 'pending' ? (
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      ) : (
                        <Clock className="size-4 text-muted-foreground" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
