import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { X } from 'lucide-react';

import { Badge } from '@src/components/atoms/badge';
import { Button } from '@src/components/atoms/button';
import { Input } from '@src/components/atoms/input';
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

type StatusBucket = '2xx' | '4xx' | '5xx' | 'all';
type MethodFilter = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'all';
type RangeFilter = '1h' | '24h' | '7d' | 'all';

const RANGE_MS: Record<Exclude<RangeFilter, 'all'>, number> = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};

function statusVariant(code: number): 'muted' | 'destructive' {
  return code >= 400 ? 'destructive' : 'muted';
}

function AdminAuditLogsPage() {
  const [search, setSearch] = useState('');
  const [statusBucket, setStatusBucket] = useState<StatusBucket>('all');
  const [method, setMethod] = useState<MethodFilter>('all');
  const [range, setRange] = useState<RangeFilter>('all');

  const params: Record<string, string | number> = { limit: 100 };
  if (search) params.search = search;
  if (statusBucket !== 'all') params.statusBucket = statusBucket;
  if (method !== 'all') params.method = method;
  if (range !== 'all') {
    params.startDate = new Date(Date.now() - RANGE_MS[range]).toISOString();
  }

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit-logs', search, statusBucket, method, range],
    queryFn: async () => {
      const r = await apiClient.get<ApiPaginatedResponse<AuditLog>>('/admin/audit-logs', {
        params,
      });
      return r.data;
    },
  });

  const logs = data?.payload ?? [];
  const total = data?.meta?.total ?? 0;
  const hasFilters = statusBucket !== 'all' || method !== 'all' || range !== 'all' || !!search;

  const clearAll = () => {
    setSearch('');
    setStatusBucket('all');
    setMethod('all');
    setRange('all');
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Audit Logs</h2>
        <p className="text-muted-foreground">{total} entries — newest first.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search action, path, or actor id…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <FilterSelect
          value={statusBucket}
          onChange={(v) => setStatusBucket(v as StatusBucket)}
          options={[
            { v: 'all', label: 'All status' },
            { v: '2xx', label: '2xx' },
            { v: '4xx', label: '4xx' },
            { v: '5xx', label: '5xx' },
          ]}
        />
        <FilterSelect
          value={method}
          onChange={(v) => setMethod(v as MethodFilter)}
          options={[
            { v: 'all', label: 'All methods' },
            { v: 'GET', label: 'GET' },
            { v: 'POST', label: 'POST' },
            { v: 'PATCH', label: 'PATCH' },
            { v: 'DELETE', label: 'DELETE' },
          ]}
        />
        <FilterSelect
          value={range}
          onChange={(v) => setRange(v as RangeFilter)}
          options={[
            { v: 'all', label: 'All time' },
            { v: '1h', label: 'Last hour' },
            { v: '24h', label: 'Last 24h' },
            { v: '7d', label: 'Last 7 days' },
          ]}
        />
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <X className="size-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>

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

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { v: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.v} value={o.v}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
