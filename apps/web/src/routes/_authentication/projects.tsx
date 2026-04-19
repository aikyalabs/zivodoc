import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Plus, Globe, GitBranch, Loader2, ExternalLink } from 'lucide-react';

import { Button } from '@src/components/atoms/button';
import { Input } from '@src/components/atoms/input';
import { Label } from '@src/components/atoms/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@src/components/atoms/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/components/atoms/select';
import { Badge } from '@src/components/atoms/badge';
import { useProjects } from '@src/hooks/queries/useProjects';
import { useCreateProject } from '@src/hooks/mutations/useCreateProject';

export const Route = createFileRoute('/_authentication/projects')({
  component: ProjectsPage,
});

function ProjectsPage() {
  const { data, isLoading } = useProjects();
  const projects = data?.payload ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Manage your docs projects and run scans.</p>
        </div>
        <CreateProjectDialog />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Globe className="size-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold">No projects yet</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Add your first docs project to start scanning for broken links, stale API refs, and code
            errors.
          </p>
          <div className="mt-6">
            <CreateProjectDialog />
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              to="/projects/$projectId"
              params={{ projectId: project.id }}
              className="group block border rounded-lg p-5 hover:border-foreground/20 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold group-hover:underline">{project.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
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
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{project.scanMode}</Badge>
                  <ExternalLink className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </Link>
          ))}
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
  const [scanMode, setScanMode] = useState('site');
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
        scanMode: scanMode as 'site' | 'repo' | 'both',
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 size-4" />
          Add Project
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>New Project</SheetTitle>
          <SheetDescription>Add a docs site or repo to scan.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pt-4">
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
            <Select value={scanMode} onValueChange={setScanMode}>
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

          <Button type="submit" className="mt-2" disabled={createProject.isPending}>
            {createProject.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {createProject.isPending ? 'Creating...' : 'Create Project'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
