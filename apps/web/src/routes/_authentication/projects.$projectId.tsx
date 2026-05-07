import { useState } from 'react';
import { createFileRoute, Link, Outlet, useMatchRoute } from '@tanstack/react-router';
import {
  ArrowLeft,
  Play,
  Loader2,
  Globe,
  GitBranch,
  CheckCircle2,
  FileSearch,
  Link2,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Settings,
  Download,
} from 'lucide-react';

import { Badge } from '@src/components/atoms/badge';
import { Button } from '@src/components/atoms/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/components/atoms/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@src/components/atoms/tabs';
import { DataTable, type DataTableColumn } from '@src/components/molecules/DataTable';
import { EmptyState } from '@src/components/molecules/EmptyState';
import { FindingRow } from '@src/components/molecules/FindingRow';
import { ScanProgress } from '@src/components/molecules/ScanProgress';
import { StatCard } from '@src/components/molecules/StatCard';
import { StatusBadge } from '@src/components/molecules/StatusBadge';
import { ChatEmbedSnippet } from '@src/components/molecules/ChatEmbedSnippet';
import { useProject } from '@src/hooks/queries/useProject';
import { useScan } from '@src/hooks/queries/useScan';
import { useScans } from '@src/hooks/queries/useScans';
import { useProjectFindings } from '@src/hooks/queries/useProjectFindings';
import { useTriggerScan } from '@src/hooks/mutations/useTriggerScan';
import { useUpdateFinding } from '@src/hooks/mutations/useUpdateFinding';
import { apiClient } from '@src/lib/queries/defaultQueryFn';
import { formatDuration, formatDateTime } from '@src/lib/formatters';

import type { FindingCategory, FindingSeverity, FindingStatus } from '@zivodoc/shared';
import type { z } from 'zod';
import type { scanModelSchema } from '@zivodoc/shared';

type Scan = z.output<typeof scanModelSchema>;

export const Route = createFileRoute('/_authentication/projects/$projectId')({
  component: ProjectDetailPage,
});

const scanColumns: DataTableColumn<Scan>[] = [
  {
    key: 'status',
    header: 'Status',
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    key: 'mode',
    header: 'Mode',
    render: (row) => <Badge variant="muted">{row.mode}</Badge>,
  },
  {
    key: 'pages',
    header: 'Pages',
    className: 'text-right tabular-nums',
    render: (row) => <span>{row.pagesScanned}</span>,
  },
  {
    key: 'findings',
    header: 'Findings',
    className: 'text-right tabular-nums',
    render: (row) => {
      return row.findingsCount > 0 ? (
        <span className="text-amber-500 dark:text-amber-400">{row.findingsCount}</span>
      ) : (
        <span className="text-muted-foreground">0</span>
      );
    },
  },
  {
    key: 'duration',
    header: 'Duration',
    className: 'text-right tabular-nums text-muted-foreground',
    render: (row) => <span>{row.duration ? formatDuration(row.duration) : '—'}</span>,
  },
  {
    key: 'date',
    header: 'Date',
    className: 'text-right text-muted-foreground',
    render: (row) => <span>{formatDateTime(row.createdAt)}</span>,
  },
];

const PAGE_SIZE = { scans: 10, findings: 25 } as const;

function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  const matchRoute = useMatchRoute();
  const isChildRoute = matchRoute({ to: '/projects/$projectId/settings', params: { projectId } });

  if (isChildRoute) return <Outlet />;

  return <ProjectDetailContent projectId={projectId} />;
}

function ProjectDetailContent({ projectId }: { projectId: string }) {
  const triggerScan = useTriggerScan(projectId);
  const updateFinding = useUpdateFinding();

  const { data: project, isLoading: isLoadingProject } = useProject(projectId);

  const [scanPage, setScanPage] = useState(0);
  const { data: scanListResponse, isLoading: isLoadingScans } = useScans(
    projectId,
    PAGE_SIZE.scans,
    scanPage * PAGE_SIZE.scans,
  );
  const scanList = scanListResponse?.payload ?? [];
  const scanCount = scanListResponse?.meta?.total ?? 0;

  const { data: latestScanResponse } = useScans(projectId, 1, 0);
  const latestScan = latestScanResponse?.payload?.[0];
  const isScanRunning = latestScan?.status === 'pending' || latestScan?.status === 'running';

  const { data: pollingScan } = useScan(latestScan?.id ?? '', isScanRunning);

  const [severity, setSeverity] = useState<FindingSeverity | 'all'>('all');
  const [category, setCategory] = useState<FindingCategory | 'all'>('all');
  const [status, setStatus] = useState<FindingStatus | 'all'>('all');
  const [findingPage, setFindingPage] = useState(0);

  // Project-level findings (not scan-level)
  const { data: findingResponse, isLoading: isLoadingFindings } = useProjectFindings(
    projectId,
    {
      category: category !== 'all' ? (category as FindingCategory) : undefined,
      severity: severity !== 'all' ? (severity as FindingSeverity) : undefined,
      status: status !== 'all' ? (status as FindingStatus) : undefined,
    },
    PAGE_SIZE.findings,
    findingPage * PAGE_SIZE.findings,
  );
  const findingList = findingResponse?.payload ?? [];
  const findingCount = findingResponse?.meta?.total ?? 0;
  const findingTotalPages = Math.ceil(findingCount / PAGE_SIZE.findings);

  const handleUpdateFinding = (findingId: string, newStatus: 'resolved' | 'ignored') => {
    updateFinding.mutate({ findingId, status: newStatus });
  };

  const handleExportCsv = async () => {
    try {
      const response = await apiClient.get(`/projects/${projectId}/findings/export`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `findings-${projectId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent
    }
  };

  if (isLoadingProject) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) return <div className="text-sm text-muted-foreground">Project not found.</div>;

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="size-3" />
          Projects
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight truncate">{project.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {project.siteUrl && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Globe className="size-3 shrink-0" />
                  <span className="truncate max-w-[250px]">{project.siteUrl}</span>
                </span>
              )}
              {project.repoUrl && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <GitBranch className="size-3 shrink-0" />
                  <span className="truncate max-w-[250px]">{project.repoUrl}</span>
                </span>
              )}
              <Badge variant="muted">{project.scanMode}</Badge>
              {project.scanSchedule !== 'manual' && (
                <Badge variant="info">{project.scanSchedule}</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" asChild>
              <Link to="/projects/$projectId/settings" params={{ projectId }}>
                <Settings className="mr-2 size-3.5" />
                Settings
              </Link>
            </Button>
            <Button
              onClick={() => triggerScan.mutate()}
              disabled={triggerScan.isPending || isScanRunning}
              size="sm"
            >
              {triggerScan.isPending || isScanRunning ? (
                <Loader2 className="mr-2 size-3.5 animate-spin" />
              ) : (
                <Play className="mr-2 size-3.5" />
              )}
              {isScanRunning ? 'Scanning...' : 'Run Scan'}
            </Button>
          </div>
        </div>
      </div>

      {scanCount === 0 && !isLoadingScans && (
        <EmptyState
          icon={Play}
          title="No scans yet"
          description="Run your first scan to check your docs for broken links, code errors, and content issues."
          action={
            <Button onClick={() => triggerScan.mutate()} disabled={triggerScan.isPending}>
              <Play className="mr-2 size-4" />
              Run First Scan
            </Button>
          }
        />
      )}

      {latestScan && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Status"
            value={latestScan.status.charAt(0).toUpperCase() + latestScan.status.slice(1)}
            icon={FileSearch}
            variant={
              latestScan.status === 'completed'
                ? 'success'
                : latestScan.status === 'failed'
                  ? 'error'
                  : latestScan.status === 'running'
                    ? 'info'
                    : 'default'
            }
          />
          <StatCard label="Pages Scanned" value={latestScan.pagesScanned} icon={FileText} />
          <StatCard label="Links Checked" value={latestScan.linksChecked} icon={Link2} />
          <StatCard
            label="Open Issues"
            value={findingCount}
            icon={AlertTriangle}
            variant={findingCount > 0 ? 'warning' : 'success'}
          />
        </div>
      )}

      {pollingScan?.steps && isScanRunning && (
        <ScanProgress steps={pollingScan.steps} scanStatus={pollingScan.status} />
      )}

      {latestScan?.steps && latestScan.status === 'completed' && !isScanRunning && (
        <ScanProgress steps={latestScan.steps} scanStatus={latestScan.status} />
      )}

      {scanCount > 0 && (
        <Tabs defaultValue="findings">
          <TabsList>
            <TabsTrigger value="findings">
              Issues
              {findingCount > 0 && (
                <Badge variant="muted" className="ml-1.5 px-1.5 py-0 text-[10px]">
                  {findingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">
              Scan History
              <Badge variant="muted" className="ml-1.5 px-1.5 py-0 text-[10px]">
                {scanCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="embed">Chat Embed</TabsTrigger>
          </TabsList>

          <TabsContent value="findings">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{findingCount}</span>{' '}
                  {findingCount === 1 ? 'issue' : 'issues'}
                </p>
                <div className="flex items-center gap-2">
                  <Select
                    value={status}
                    onValueChange={(v) => {
                      setStatus(v);
                      setFindingPage(0);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[130px] text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Open issues</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="reopened">Regressions</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="ignored">Ignored</SelectItem>
                      <SelectItem value="auto_resolved">Auto-fixed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={severity}
                    onValueChange={(v) => {
                      setSeverity(v);
                      setFindingPage(0);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[120px] text-xs">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All severity</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={category}
                    onValueChange={(v) => {
                      setCategory(v);
                      setFindingPage(0);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[150px] text-xs">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      <SelectItem value="broken_link">Broken Link</SelectItem>
                      <SelectItem value="broken_anchor">Broken Anchor</SelectItem>
                      <SelectItem value="redirect_chain">Redirect Chain</SelectItem>
                      <SelectItem value="insecure_link">Insecure Link</SelectItem>
                      <SelectItem value="slow_link">Slow Link</SelectItem>
                      <SelectItem value="leaked_secret">Leaked Secret</SelectItem>
                      <SelectItem value="syntax_error">Syntax Error</SelectItem>
                      <SelectItem value="todo_left">TODO Left</SelectItem>
                      <SelectItem value="internal_url">Internal URL</SelectItem>
                      <SelectItem value="runtime_error">Runtime Error</SelectItem>
                      <SelectItem value="type_error">Type Error</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={handleExportCsv}>
                    <Download className="mr-2 size-3.5" />
                    CSV
                  </Button>
                </div>
              </div>

              {isLoadingFindings && (
                <div className="flex justify-center py-12">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {!isLoadingFindings && findingList.length === 0 && (
                <EmptyState
                  icon={CheckCircle2}
                  title="No issues found"
                  description={
                    category !== 'all' || severity !== 'all' || status !== 'all'
                      ? 'No findings match your current filters.'
                      : 'Your docs look good!'
                  }
                  compact
                />
              )}

              {!isLoadingFindings && findingList.length > 0 && (
                <div className="space-y-2">
                  {findingList.map((finding) => (
                    <FindingRow
                      key={finding.id}
                      finding={finding}
                      onUpdateStatus={handleUpdateFinding}
                    />
                  ))}
                </div>
              )}

              {findingTotalPages > 1 && !isLoadingFindings && (
                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {findingPage * PAGE_SIZE.findings + 1}–
                    {Math.min((findingPage + 1) * PAGE_SIZE.findings, findingCount)} of{' '}
                    {findingCount}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      Page {findingPage + 1} of {findingTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon-xs"
                      onClick={() => setFindingPage((p) => Math.max(0, p - 1))}
                      disabled={findingPage === 0}
                    >
                      <ChevronLeft className="size-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-xs"
                      onClick={() => setFindingPage((p) => Math.min(findingTotalPages - 1, p + 1))}
                      disabled={findingPage >= findingTotalPages - 1}
                    >
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {latestScan?.status === 'failed' && (
              <div className="flex flex-col items-center justify-center py-12 text-center mt-4">
                <AlertTriangle className="size-8 text-destructive" />
                <p className="mt-3 text-sm font-medium">Last scan failed</p>
                <p className="mt-1 text-xs text-muted-foreground max-w-md">
                  {latestScan.errorMessage ?? 'An unexpected error occurred.'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => triggerScan.mutate()}
                  disabled={triggerScan.isPending}
                >
                  Retry Scan
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <DataTable
              columns={scanColumns}
              data={scanList}
              keyExtractor={(row) => row.id}
              loading={isLoadingScans}
              emptyMessage="No scans yet"
              pagination={{
                total: scanCount,
                page: scanPage,
                pageSize: PAGE_SIZE.scans,
                onPageChange: setScanPage,
              }}
            />
          </TabsContent>

          <TabsContent value="embed">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Embed the docs chatbot</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Drop this snippet into any docs page. The widget renders a floating bubble that
                  answers questions using the content indexed from the most recent successful scan.
                </p>
              </div>
              <ChatEmbedSnippet projectId={projectId} />
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
