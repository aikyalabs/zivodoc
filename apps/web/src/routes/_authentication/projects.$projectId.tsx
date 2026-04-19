import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  Play,
  Loader2,
  Globe,
  GitBranch,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

import { Button } from '@src/components/atoms/button';
import { Badge } from '@src/components/atoms/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/components/atoms/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@src/components/atoms/table';
import { useProject } from '@src/hooks/queries/useProject';
import { useScans } from '@src/hooks/queries/useScans';
import { useFindings } from '@src/hooks/queries/useFindings';
import { useTriggerScan } from '@src/hooks/mutations/useTriggerScan';

import type { FindingCategory, FindingSeverity } from '@zivodoc/shared';

export const Route = createFileRoute('/_authentication/projects/$projectId')({
  component: ProjectDetailPage,
});

const severityIcon = {
  error: <XCircle className="size-4 text-destructive" />,
  warning: <AlertTriangle className="size-4 text-yellow-500" />,
  info: <Info className="size-4 text-blue-500" />,
};

const statusIcon = {
  pending: <Clock className="size-4 text-muted-foreground" />,
  running: <Loader2 className="size-4 animate-spin text-blue-500" />,
  completed: <CheckCircle2 className="size-4 text-green-500" />,
  failed: <XCircle className="size-4 text-destructive" />,
};

function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: scansData, isLoading: scansLoading } = useScans(projectId);
  const triggerScan = useTriggerScan(projectId);

  const scans = scansData?.payload ?? [];
  const latestScan = scans[0];

  // Findings for latest scan
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const { data: findingsData, isLoading: findingsLoading } = useFindings(latestScan?.id ?? '', {
    category: categoryFilter !== 'all' ? (categoryFilter as FindingCategory) : undefined,
    severity: severityFilter !== 'all' ? (severityFilter as FindingSeverity) : undefined,
  });

  const findings = findingsData?.payload ?? [];
  const findingsTotal = findingsData?.meta?.total ?? 0;

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) return <div>Project not found.</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="size-4" />
          Projects
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              {project.siteUrl && (
                <span className="flex items-center gap-1">
                  <Globe className="size-3.5" />
                  {project.siteUrl}
                </span>
              )}
              {project.repoUrl && (
                <span className="flex items-center gap-1">
                  <GitBranch className="size-3.5" />
                  {project.repoUrl}
                </span>
              )}
              <Badge variant="secondary">{project.scanMode}</Badge>
            </div>
          </div>
          <Button onClick={() => triggerScan.mutate()} disabled={triggerScan.isPending}>
            {triggerScan.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Play className="mr-2 size-4" />
            )}
            Run Scan
          </Button>
        </div>
      </div>

      {/* Scan stats */}
      {latestScan && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Status', value: latestScan.status, icon: statusIcon[latestScan.status] },
            { label: 'Pages Scanned', value: latestScan.pagesScanned },
            { label: 'Links Checked', value: latestScan.linksChecked },
            { label: 'Findings', value: latestScan.findingsCount },
          ].map((stat) => (
            <div key={stat.label} className="border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <div className="flex items-center gap-2">
                {stat.icon}
                <p className="text-xl font-semibold">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scan history */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Scan History</h2>
        {scansLoading ? (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        ) : scans.length === 0 ? (
          <p className="text-sm text-muted-foreground">No scans yet. Click "Run Scan" to start.</p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Pages</TableHead>
                  <TableHead>Findings</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scans.map((scan) => (
                  <TableRow key={scan.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {statusIcon[scan.status]}
                        <span className="capitalize">{scan.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>{scan.mode}</TableCell>
                    <TableCell>{scan.pagesScanned}</TableCell>
                    <TableCell>{scan.findingsCount}</TableCell>
                    <TableCell>
                      {scan.duration ? `${(scan.duration / 1000).toFixed(1)}s` : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(scan.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Findings */}
      {latestScan && latestScan.status === 'completed' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Findings <span className="text-muted-foreground font-normal">({findingsTotal})</span>
            </h2>
            <div className="flex items-center gap-2">
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All severity</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="broken_link">Broken link</SelectItem>
                  <SelectItem value="broken_anchor">Broken anchor</SelectItem>
                  <SelectItem value="syntax_error">Syntax error</SelectItem>
                  <SelectItem value="redirect_chain">Redirect chain</SelectItem>
                  <SelectItem value="missing_page">Missing page</SelectItem>
                  <SelectItem value="slow_link">Slow link</SelectItem>
                  <SelectItem value="stale_ref">Stale reference</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {findingsLoading ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          ) : findings.length === 0 ? (
            <div className="border rounded-lg p-8 text-center">
              <CheckCircle2 className="size-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No issues found. Your docs look good!</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severity</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Line</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {findings.map((finding) => (
                    <TableRow key={finding.id}>
                      <TableCell>{severityIcon[finding.severity]}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {finding.category.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{finding.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {finding.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-[200px] truncate">
                        {finding.source}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {finding.line > 0 ? `:${finding.line}` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
