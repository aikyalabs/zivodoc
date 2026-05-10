import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
import { LogOut } from 'lucide-react';

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
import { formatDateTime, formatRelativeTime } from '@src/lib/formatters';

import type { ApiPaginatedResponse } from '@zivodoc/shared';

export const Route = createFileRoute('/_authentication/admin/sessions')({
  component: AdminSessionsPage,
});

interface ActiveSession {
  token: string;
  userId: string;
  userEmail: string;
  expiresAt: string;
  lastActivity: string;
}

function AdminSessionsPage() {
  const queryClient = useQueryClient();
  const [confirmRevoke, setConfirmRevoke] = useState<ActiveSession | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'sessions'],
    queryFn: async () => {
      const r = await apiClient.get<ApiPaginatedResponse<ActiveSession>>('/admin/sessions', {
        params: { limit: 100 },
      });
      return r.data;
    },
  });

  const revoke = useMutation({
    mutationFn: async (token: string) => {
      await apiClient.delete(`/admin/sessions/${token}`);
    },
    onSuccess: () => {
      toast.success('Session revoked.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] });
      setConfirmRevoke(null);
    },
    onError: () => toast.error('Failed to revoke session.'),
  });

  const sessions = data?.payload ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Active sessions</h2>
        <p className="text-muted-foreground">
          {total} session{total === 1 ? '' : 's'} not yet expired.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Last activity</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Token</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((s) => (
              <TableRow key={s.token}>
                <TableCell className="font-medium">{s.userEmail}</TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatRelativeTime(s.lastActivity)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDateTime(s.expiresAt)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <code>{s.token.slice(0, 16)}…</code>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmRevoke(s)}
                    aria-label="Revoke session"
                  >
                    <LogOut className="size-4 text-destructive" />
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
        title="Revoke session"
        description={`The user (${confirmRevoke?.userEmail ?? ''}) will be logged out on their next request. Other sessions for this user are preserved.`}
        confirmLabel="Revoke"
        variant="destructive"
        loading={revoke.isPending}
        onConfirm={() => confirmRevoke && revoke.mutate(confirmRevoke.token)}
      />
    </div>
  );
}
