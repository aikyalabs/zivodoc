import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

import { Badge } from '@src/components/atoms/badge';
import { Button } from '@src/components/atoms/button';
import { Skeleton } from '@src/components/atoms/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@src/components/atoms/table';
import { ConfirmDialog } from '@src/components/molecules/ConfirmDialog';
import { apiClient } from '@src/lib/queries/defaultQueryFn';
import { formatRelativeTime } from '@src/lib/formatters';

import type { ApiPaginatedResponse } from '@zivodoc/shared';

export const Route = createFileRoute('/_authentication/admin/github')({
  component: AdminGitHubPage,
});

interface GhInstall {
  id: string;
  installationId: number;
  accountLogin: string;
  accountType: string;
  accountAvatarUrl: string | null;
  organizationId: string;
  organizationName: string | null;
  repositorySelection: string;
  suspendedAt: string | null;
  createdAt: string;
}

function AdminGitHubPage() {
  const queryClient = useQueryClient();
  const [confirmRevoke, setConfirmRevoke] = useState<GhInstall | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'github-installations'],
    queryFn: async () => {
      const r = await apiClient.get<ApiPaginatedResponse<GhInstall>>('/admin/github-installations');
      return r.data;
    },
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/github-installations/${id}`);
    },
    onSuccess: () => {
      toast.success('Installation revoked.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'github-installations'] });
      setConfirmRevoke(null);
    },
    onError: () => toast.error('Failed to revoke.'),
  });

  const installs = data?.payload ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">GitHub installations</h2>
        <p className="text-muted-foreground">
          Revoke removes our local link only. The customer must uninstall the GitHub App from their
          org settings to fully revoke access.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Org</TableHead>
              <TableHead>Repos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Installed</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {installs.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {i.accountAvatarUrl && (
                      <img
                        src={i.accountAvatarUrl}
                        alt=""
                        className="size-5 rounded-full"
                        loading="lazy"
                      />
                    )}
                    {i.accountLogin}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="muted">{i.accountType}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {i.organizationName ?? <code>{i.organizationId.slice(0, 16)}…</code>}
                </TableCell>
                <TableCell>
                  <Badge variant="muted">{i.repositorySelection}</Badge>
                </TableCell>
                <TableCell>
                  {i.suspendedAt ? (
                    <Badge variant="destructive">suspended</Badge>
                  ) : (
                    <Badge variant="muted">active</Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatRelativeTime(i.createdAt)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmRevoke(i)}
                    aria-label="Revoke installation"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ConfirmDialog
        open={confirmRevoke != null}
        onOpenChange={(o) => !o && setConfirmRevoke(null)}
        title="Revoke GitHub installation"
        description={`Removes the local link for ${confirmRevoke?.accountLogin}. Webhooks from GitHub will be ignored. Customer must uninstall the App on GitHub's side too.`}
        confirmLabel="Revoke"
        variant="destructive"
        loading={revoke.isPending}
        onConfirm={() => confirmRevoke && revoke.mutate(confirmRevoke.id)}
      />
    </div>
  );
}
