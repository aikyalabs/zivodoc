import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { Badge } from '@src/components/atoms/badge';
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
import { apiClient } from '@src/lib/queries/defaultQueryFn';
import { formatDateTime } from '@src/lib/formatters';

import type { ApiPaginatedResponse } from '@zivodoc/shared';

export const Route = createFileRoute('/_authentication/admin/audit-logs')({
  component: AdminAuditLogsPage,
});

interface AuditLog {
  id: string;
  actorId: string | null;
  organizationId: string | null;
  method: string;
  path: string;
  action: string;
  statusCode: number;
  ipAddress: string | null;
  duration: number;
  createdAt: string;
}

function statusVariant(code: number): 'muted' | 'destructive' {
  return code >= 400 ? 'destructive' : 'muted';
}

function AdminAuditLogsPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit-logs', search],
    queryFn: async () => {
      const response = await apiClient.get<ApiPaginatedResponse<AuditLog>>('/admin/audit-logs', {
        params: { limit: 100, search: search || undefined },
      });
      return response.data;
    },
  });

  const logs = data?.payload ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Audit Logs</h2>
        <p className="text-muted-foreground">{total} entries — newest first.</p>
      </div>

      <Input
        placeholder="Search by action, path, or actor id…"
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
              <TableHead>When</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Path</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDateTime(l.createdAt)}
                </TableCell>
                <TableCell className="font-medium text-xs">{l.action}</TableCell>
                <TableCell className="text-xs">
                  <code>{l.method}</code>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[280px] truncate">
                  {l.path}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(l.statusCode)}>{l.statusCode}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {l.actorId ? <code>{l.actorId.slice(0, 16)}…</code> : '—'}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {l.ipAddress ?? '—'}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground tabular-nums">
                  {l.duration}ms
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
