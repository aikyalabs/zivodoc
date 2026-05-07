import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

import { Badge } from '@src/components/atoms/badge';
import { Button } from '@src/components/atoms/button';
import { Input } from '@src/components/atoms/input';
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

import type { ApiPaginatedResponse, PlanType } from '@zivodoc/shared';

export const Route = createFileRoute('/_authentication/admin/organizations')({
  component: AdminOrgsPage,
});

interface AdminOrg {
  id: string;
  name: string;
  slug: string;
  plan: PlanType;
  scanQuota: number;
  scansUsedThisMonth: number;
  maxPages: number;
  maxProjects: number;
  createdAt: string;
}

function AdminOrgsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'organizations', search],
    queryFn: async () => {
      const response = await apiClient.get<ApiPaginatedResponse<AdminOrg>>('/admin/organizations', {
        params: { limit: 50, search: search || undefined },
      });
      return response.data;
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/organizations/${id}`);
    },
    onSuccess: () => {
      toast.success('Organization deleted.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] });
    },
    onError: () => toast.error('Failed to delete organization.'),
  });

  const orgs = data?.payload ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Organizations</h2>
        <p className="text-muted-foreground">
          {total} {total === 1 ? 'organization' : 'organizations'} on the platform.
        </p>
      </div>

      <Input
        placeholder="Search by name or slug…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Scans (used / quota)</TableHead>
              <TableHead>Max projects</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {orgs.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <code>{o.slug}</code>
                </TableCell>
                <TableCell>
                  <Badge variant="muted">{o.plan}</Badge>
                </TableCell>
                <TableCell className="tabular-nums text-sm">
                  {o.scansUsedThisMonth} / {o.scanQuota}
                </TableCell>
                <TableCell className="tabular-nums">{o.maxProjects}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatRelativeTime(o.createdAt)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPendingDelete(o.id)}
                    aria-label="Delete organization"
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
        open={pendingDelete != null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete organization"
        description="This will cascade-delete all projects, scans, findings, and members. This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={remove.isPending}
        onConfirm={() => {
          if (pendingDelete) {
            remove.mutate(pendingDelete, { onSuccess: () => setPendingDelete(null) });
          }
        }}
      />
    </div>
  );
}
