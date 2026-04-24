import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Plus,
  Globe,
  GitBranch,
  Loader2,
  FolderSearch,
  ArrowRight,
  ExternalLink,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Scan,
  Activity,
} from 'lucide-react';

import { Badge } from '@src/components/atoms/badge';
import { Button } from '@src/components/atoms/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@src/components/atoms/dialog';
import { Input } from '@src/components/atoms/input';
import { Label } from '@src/components/atoms/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/components/atoms/select';
import { EmptyState } from '@src/components/molecules/EmptyState';
import { PageHeader } from '@src/components/molecules/PageHeader';
import { useProjects } from '@src/hooks/queries/useProjects';
import { useCreateProject } from '@src/hooks/mutations/useCreateProject';

import type { ScanMode } from '@zivodoc/shared';

export const Route = createFileRoute('/_authentication/projects/')({
  component: ProjectsPage,
});

function formatRelativeTime(date: string | null | undefined): string {
  if (!date) return 'Never';
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;

  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ProjectsPage() {
  const { data, isLoading } = useProjects();
  const projects = data?.payload ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Manage your documentation projects and run quality scans."
        action={<CreateProjectDialog />}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderSearch}
          title="No projects yet"
          description="Add your first docs project to start scanning for broken links, stale API refs, and code errors."
          action={<CreateProjectDialog />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const url = project.siteUrl ?? project.repoUrl ?? '';
            const displayUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
            const isSite = project.scanMode === 'site' || project.scanMode === 'both';
            const ModeIcon = isSite ? Globe : GitBranch;

            const status = project.lastScanStatus ?? null;
            const lastDate = project.lastScanDate ?? null;
            const totalScans = project.totalScans ?? 0;
            const totalFindings = project.totalFindings ?? 0;
            const hasScans = totalScans > 0;

            return (
              <Link
                key={project.id}
                to="/projects/$projectId"
                params={{ projectId: project.id }}
                className="group flex flex-col rounded-lg border bg-card hover:border-foreground/20 transition-all overflow-hidden"
              >
                <div className="p-4 pb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                      <ModeIcon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{project.name}</p>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        <ExternalLink className="size-3 shrink-0" />
                        {displayUrl}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0" />
                </div>

                <div className="px-4 pb-3">
                  {!hasScans ? (
                    <Badge variant="muted" className="gap-1">
                      <Clock className="size-3" />
                      Never scanned
                    </Badge>
                  ) : status === 'completed' ? (
                    <Badge variant={totalFindings > 0 ? 'warning' : 'success'} className="gap-1">
                      {totalFindings > 0 ? (
                        <AlertTriangle className="size-3" />
                      ) : (
                        <CheckCircle2 className="size-3" />
                      )}
                      {totalFindings > 0 ? `${totalFindings} issues` : 'Healthy'}
                    </Badge>
                  ) : status === 'running' || status === 'pending' ? (
                    <Badge variant="info" className="gap-1">
                      <Loader2 className="size-3 animate-spin" />
                      Scanning...
                    </Badge>
                  ) : status === 'failed' ? (
                    <Badge variant="error" className="gap-1">
                      <XCircle className="size-3" />
                      Failed
                    </Badge>
                  ) : (
                    <Badge variant="muted">{project.scanMode}</Badge>
                  )}
                </div>

                <div className="border-t px-4 py-2.5 flex items-center justify-between text-xs text-muted-foreground bg-muted/30">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Scan className="size-3" />
                      {totalScans} {totalScans === 1 ? 'scan' : 'scans'}
                    </span>
                    {totalFindings > 0 && (
                      <span className="flex items-center gap-1">
                        <Activity className="size-3" />
                        {totalFindings} findings
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {formatRelativeTime(lastDate)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [scanMode, setScanMode] = useState<ScanMode>('site');
  const createProject = useCreateProject();

  const resetForm = () => {
    setName('');
    setSiteUrl('');
    setRepoUrl('');
    setScanMode('site');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProject.mutate(
      {
        name: name.trim(),
        siteUrl: siteUrl.trim() || null,
        repoUrl: repoUrl.trim() || null,
        scanMode,
      },
      {
        onSuccess: () => {
          resetForm();
          setOpen(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 size-4" />
          Add Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>Add a docs site or repository to scan.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project name</Label>
            <Input
              id="projectName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="My Docs"
            />
          </div>

          <div className="space-y-2">
            <Label>Scan mode</Label>
            <Select value={scanMode} onValueChange={(v) => setScanMode(v as ScanMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="site">Site crawl (URL)</SelectItem>
                <SelectItem value="repo">Repo scan (Git)</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(scanMode === 'site' || scanMode === 'both') && (
            <div className="space-y-2">
              <Label htmlFor="siteUrl">Docs site URL</Label>
              <Input
                id="siteUrl"
                type="url"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="https://docs.example.com"
                required={scanMode === 'site'}
              />
            </div>
          )}

          {(scanMode === 'repo' || scanMode === 'both') && (
            <div className="space-y-2">
              <Label htmlFor="repoUrl">Repository URL</Label>
              <Input
                id="repoUrl"
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/org/docs"
                required={scanMode === 'repo'}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {createProject.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
