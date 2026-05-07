import { useState, useEffect } from 'react';
import { createFileRoute, useSearch } from '@tanstack/react-router';
import { Github, ExternalLink, Link2, Unlink, Loader2, CheckCircle2, Lock } from 'lucide-react';

import { Badge } from '@src/components/atoms/badge';
import { Button } from '@src/components/atoms/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@src/components/atoms/card';
import { Skeleton } from '@src/components/atoms/skeleton';
import { useGitHubInstallations } from '@src/hooks/queries/useGitHubInstallations';
import { useGitHubRepos } from '@src/hooks/queries/useGitHubRepos';
import { useLinkGitHubRepo } from '@src/hooks/mutations/useLinkGitHubRepo';
import { useUnlinkGitHubRepo } from '@src/hooks/mutations/useUnlinkGitHubRepo';
import { apiClient } from '@src/lib/queries/defaultQueryFn';

import type { ApiOkResponse } from '@zivodoc/shared';

export const Route = createFileRoute('/_authentication/settings/github')({
  component: GitHubSettingsPage,
});

function GitHubSettingsPage() {
  const { data: installations, isLoading } = useGitHubInstallations();
  const [selectedInstallation, setSelectedInstallation] = useState<number | null>(null);
  const search = useSearch({ strict: false }) as { status?: string };

  useEffect(() => {
    if (installations && installations.length > 0 && !selectedInstallation) {
      setSelectedInstallation(installations[0].installationId);
    }
  }, [installations, selectedInstallation]);

  const handleConnect = async () => {
    const response = await apiClient.get<ApiOkResponse<{ url: string }>>('/github/install-url');
    window.location.href = response.data.payload.url;
  };

  const hasInstallations = (installations?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">GitHub</h2>
          <p className="text-muted-foreground">
            Connect your GitHub repositories for automatic scanning.
          </p>
        </div>
        <Button
          onClick={handleConnect}
          size="sm"
          variant={hasInstallations ? 'outline' : 'default'}
        >
          <Github className="mr-1.5 h-3.5 w-3.5" />
          {hasInstallations ? 'Manage Installation' : 'Connect GitHub'}
        </Button>
      </div>

      {search?.status === 'success' && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="size-4" />
          GitHub App installed successfully.
        </div>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="py-6">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : !hasInstallations ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <Github className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No GitHub connection</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Install the zivodoc GitHub App to automatically scan your repos on every push and
                get results as Check Runs on PRs.
              </p>
              <Button onClick={handleConnect} size="sm" className="mt-2">
                <Github className="mr-1.5 h-3.5 w-3.5" />
                Connect GitHub
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {installations!.map((inst) => (
            <Card key={inst.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {inst.accountAvatarUrl ? (
                      <img
                        src={inst.accountAvatarUrl}
                        alt={inst.accountLogin}
                        className="size-8 rounded-full"
                      />
                    ) : (
                      <Github className="size-8" />
                    )}
                    <div>
                      <CardTitle className="text-base">{inst.accountLogin}</CardTitle>
                      <CardDescription className="text-xs">
                        {inst.accountType} ·{' '}
                        {inst.repositorySelection === 'all' ? 'All repos' : 'Selected repos'}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="success">Connected</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <RepoList installationId={inst.installationId} />
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

function RepoList({ installationId }: { installationId: number }) {
  const { data: repos, isLoading } = useGitHubRepos(installationId);
  const linkRepo = useLinkGitHubRepo();
  const unlinkRepo = useUnlinkGitHubRepo();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!repos || repos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No repositories accessible. Check your GitHub App installation settings.
      </p>
    );
  }

  return (
    <div className="divide-y">
      {repos.map((repo) => (
        <div key={repo.id} className="flex items-center justify-between py-3 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{repo.name}</p>
                {repo.private && <Lock className="size-3 text-muted-foreground shrink-0" />}
              </div>
              {repo.description && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{repo.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={repo.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="size-3.5" />
            </a>
            {repo.isLinked ? (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={unlinkRepo.isPending}
              >
                <Link2 className="mr-1.5 size-3" />
                Linked
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="text-xs"
                disabled={linkRepo.isPending}
                onClick={() =>
                  linkRepo.mutate({
                    installationId,
                    repoId: repo.id,
                    repoFullName: repo.fullName,
                    repoDefaultBranch: repo.defaultBranch,
                    repoPrivate: repo.private,
                    repoCloneUrl: `https://github.com/${repo.fullName}.git`,
                  })
                }
              >
                {linkRepo.isPending ? (
                  <Loader2 className="mr-1.5 size-3 animate-spin" />
                ) : (
                  <Link2 className="mr-1.5 size-3" />
                )}
                Link
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
