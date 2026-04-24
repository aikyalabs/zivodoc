import { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@src/components/atoms/button';
import { Input } from '@src/components/atoms/input';
import { Label } from '@src/components/atoms/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/components/atoms/select';
import { ConfirmDialog } from '@src/components/molecules/ConfirmDialog';
import { PageHeader } from '@src/components/molecules/PageHeader';
import { useProject } from '@src/hooks/queries/useProject';
import { apiClient } from '@src/lib/queries/defaultQueryFn';

import type { ScanMode } from '@zivodoc/shared';

export const Route = createFileRoute('/_authentication/projects/$projectId/settings')({
  component: ProjectSettingsPage,
});

type ScanSchedule = 'manual' | 'daily' | 'weekly';

function ProjectSettingsPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: project, isLoading } = useProject(projectId);

  const [name, setName] = useState<string | null>(null);
  const [siteUrl, setSiteUrl] = useState<string | null>(null);
  const [repoUrl, setRepoUrl] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<ScanMode | null>(null);
  const [maxPages, setMaxPages] = useState<number | null>(null);
  const [defaultBranch, setDefaultBranch] = useState<string | null>(null);
  const [scanSchedule, setScanSchedule] = useState<ScanSchedule | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const currentName = name ?? project?.name ?? '';
  const currentSiteUrl = siteUrl ?? project?.siteUrl ?? '';
  const currentRepoUrl = repoUrl ?? project?.repoUrl ?? '';
  const currentScanMode = scanMode ?? project?.scanMode ?? 'site';
  const currentMaxPages = maxPages ?? project?.maxPages ?? 500;
  const currentDefaultBranch = defaultBranch ?? project?.defaultBranch ?? 'main';
  const currentScanSchedule = scanSchedule ?? project?.scanSchedule ?? 'manual';

  const hasChanges =
    project != null &&
    (currentName !== project.name ||
      currentSiteUrl !== (project.siteUrl ?? '') ||
      currentRepoUrl !== (project.repoUrl ?? '') ||
      currentScanMode !== project.scanMode ||
      currentMaxPages !== project.maxPages ||
      currentDefaultBranch !== project.defaultBranch ||
      currentScanSchedule !== project.scanSchedule);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !hasChanges) return;

    const data: Record<string, unknown> = {};
    if (currentName !== project.name) data.name = currentName;
    if (currentSiteUrl !== (project.siteUrl ?? '')) data.siteUrl = currentSiteUrl || null;
    if (currentRepoUrl !== (project.repoUrl ?? '')) data.repoUrl = currentRepoUrl || null;
    if (currentScanMode !== project.scanMode) data.scanMode = currentScanMode;
    if (currentMaxPages !== project.maxPages) data.maxPages = currentMaxPages;
    if (currentDefaultBranch !== project.defaultBranch) data.defaultBranch = currentDefaultBranch;
    if (currentScanSchedule !== project.scanSchedule) data.scanSchedule = currentScanSchedule;

    setSaving(true);
    try {
      await apiClient.patch(`/projects/${projectId}`, data);
      toast.success('Project updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setName(null);
      setSiteUrl(null);
      setRepoUrl(null);
      setScanMode(null);
      setMaxPages(null);
      setDefaultBranch(null);
      setScanSchedule(null);
    } catch {
      toast.error('Failed to update project.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiClient.delete(`/projects/${projectId}`);
      toast.success('Project deleted.');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate({ to: '/projects' });
    } catch {
      toast.error('Failed to delete project.');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) return <div className="text-sm text-muted-foreground">Project not found.</div>;

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Project Settings"
        description={`Configure ${project.name}`}
        breadcrumb={
          <Link
            to="/projects/$projectId"
            params={{ projectId }}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3" />
            Back to project
          </Link>
        }
      />

      <form onSubmit={handleSave} className="space-y-6 max-w-xl">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={currentName}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="siteUrl">Site URL</Label>
            <Input
              id="siteUrl"
              type="url"
              placeholder="https://docs.example.com"
              value={currentSiteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="repoUrl">Repo URL</Label>
            <Input
              id="repoUrl"
              type="url"
              placeholder="https://github.com/org/repo"
              value={currentRepoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="scanMode">Scan Mode</Label>
            <Select value={currentScanMode} onValueChange={(v) => setScanMode(v as ScanMode)}>
              <SelectTrigger id="scanMode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="site">Site</SelectItem>
                <SelectItem value="repo">Repo</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="maxPages">Max Pages</Label>
            <Input
              id="maxPages"
              type="number"
              min={1}
              max={5000}
              value={currentMaxPages}
              onChange={(e) => setMaxPages(Number(e.target.value))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="defaultBranch">Default Branch</Label>
            <Input
              id="defaultBranch"
              value={currentDefaultBranch}
              onChange={(e) => setDefaultBranch(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="scanSchedule">Scan Schedule</Label>
            <Select
              value={currentScanSchedule}
              onValueChange={(v) => setScanSchedule(v as ScanSchedule)}
            >
              <SelectTrigger id="scanSchedule">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={!hasChanges || saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      <div className="border-t pt-6 max-w-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-destructive">Delete Project</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Permanently delete this project and all its scans and findings.
            </p>
          </div>
          <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 size-3.5" />
            Delete
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete project"
        description={`Are you sure you want to delete "${project.name}"? This action cannot be undone. All scans and findings will be permanently removed.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
