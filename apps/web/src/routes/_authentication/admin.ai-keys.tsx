import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { Badge } from '@src/components/atoms/badge';
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
import { formatRelativeTime } from '@src/lib/formatters';

import type { ApiPaginatedResponse } from '@zivodoc/shared';

export const Route = createFileRoute('/_authentication/admin/ai-keys')({
  component: AdminAiKeysPage,
});

interface AiKey {
  id: string;
  organizationId: string;
  organizationName: string | null;
  provider: string;
  model: string;
  keyPreview: string;
  lastUsedAt: string | null;
  lastVerifiedAt: string | null;
  createdAt: string;
}

function AdminAiKeysPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'ai-keys'],
    queryFn: async () => {
      const r = await apiClient.get<ApiPaginatedResponse<AiKey>>('/admin/ai-keys');
      return r.data;
    },
  });

  const keys = data?.payload ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">AI provider keys</h2>
        <p className="text-muted-foreground">
          Read-only view across orgs. Key values are encrypted at rest — only the preview prefix is
          shown.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Org</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Last used</TableHead>
              <TableHead>Last verified</TableHead>
              <TableHead>Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((k) => (
              <TableRow key={k.id}>
                <TableCell className="font-medium">
                  {k.organizationName ?? (
                    <code className="text-xs">{k.organizationId.slice(0, 16)}…</code>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="muted">{k.provider}</Badge>
                </TableCell>
                <TableCell className="text-xs">{k.model}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <code>{k.keyPreview}</code>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {k.lastUsedAt ? formatRelativeTime(k.lastUsedAt) : '—'}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {k.lastVerifiedAt ? formatRelativeTime(k.lastVerifiedAt) : '—'}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatRelativeTime(k.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
