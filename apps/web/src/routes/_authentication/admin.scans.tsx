import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Ban } from 'lucide-react';

import { Badge } from '@src/components/atoms/badge';
import { Button } from '@src/components/atoms/button';
import { Skeleton } from '@src/components/atoms/skeleton';
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
import { ConfirmDialog } from '@src/components/molecules/ConfirmDialog';
import { apiClient } from '@src/lib/queries/defaultQueryFn';
import { formatRelativeTime } from '@src/lib/formatters';

import type { ApiPaginatedResponse, ScanMode, ScanStatus } from '@zivodoc/shared';

export const Route = createFileRoute('/_authentication/admin/scans')({
  component: AdminScansPage,
});

interface AdminScan {
  id: string;
  projectId: string;
  organizationId: string;
  status: ScanStatus;
  mode: ScanMode;
  branch: string | null;
  pagesScanned: number;
  findingsCount: number;
  duration: number | null;
  errorMessage: string | null;
  createdAt: string;
}

type StatusFilter = ScanStatus | 'all';
type RangeFilter = '1h' | '24h' | '7d' | 'all';

const RANGE_MS: Record<Exclude<RangeFilter, 'all'>, number> = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};

function statusVariant(s: ScanStatus): 'muted' | 'destructive' {
  return s === 'failed' ? 'destructive' : 'muted';
}

function AdminScansPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>('all');
  const [range, setRange] = useState<RangeFilter>('all');
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  const params: Record<string, string | number> = { limit: 100 };
  if (status !== 'all') params.status = status;
  if (range !== 'all') params.startDate = new Date(Date.now() - RANGE_MS[range]).toISOString();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'scans', status, range],
    queryFn: async () => {
      const r = await apiClient.get<ApiPaginatedResponse<AdminScan>>('/admin/scans', { params });
      return r.data;
    },
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/admin/scans/${id}/cancel`);
    },
    onSuccess: () => {
      toast.success('Scan cancelled.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'scans'] });
      setConfirmCancel(null);
    },
    onError: () => toast.error('Failed to cancel scan.'),
  });

  const scans = data?.payload ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Scans</h2>
        <p className="text-muted-foreground">{total} scans across all organizations.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={range} onValueChange={(v) => setRange(v as RangeFilter)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="1h">Last hour</SelectItem>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Org</TableHead>
              <TableHead>Pages</TableHead>
              <TableHead>Findings</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {scans.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatRelativeTime(s.createdAt)}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(s.status)}>{s.status}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="muted">{s.mode}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <code>{s.projectId.slice(0, 16)}…</code>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <code>{s.organizationId.slice(0, 16)}…</code>
                </TableCell>
                <TableCell className="tabular-nums text-sm">{s.pagesScanned}</TableCell>
                <TableCell className="tabular-nums text-sm">{s.findingsCount}</TableCell>
                <TableCell className="tabular-nums text-xs text-muted-foreground">
                  {s.duration != null ? `${s.duration}ms` : '—'}
                </TableCell>
                <TableCell>
                  {(s.status === 'pending' || s.status === 'running') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmCancel(s.id)}
                      aria-label="Cancel scan"
                    >
                      <Ban className="size-4 text-destructive" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ConfirmDialog
        open={confirmCancel != null}
        onOpenChange={(o) => !o && setConfirmCancel(null)}
        title="Cancel scan"
        description="Marks the scan as failed. Workers may still finish their current step. The scan slot will be free immediately."
        confirmLabel="Cancel scan"
        variant="destructive"
        loading={cancel.isPending}
        onConfirm={() => confirmCancel && cancel.mutate(confirmCancel)}
      />
    </div>
  );
}
