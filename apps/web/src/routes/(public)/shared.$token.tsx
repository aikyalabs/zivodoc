import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react';

import { apiClient } from '@src/lib/queries/defaultQueryFn';
import { Badge } from '@src/components/atoms/badge';

import type { ApiOkResponse, scanModelSchema } from '@zivodoc/shared';
import type { z } from 'zod';

type Scan = z.output<typeof scanModelSchema>;

type SharedScanPayload = {
  scan: Scan;
  projectName: string;
  findings: Array<{
    id: string;
    category: string;
    severity: string;
    source: string;
    line: number;
    title: string;
    description: string;
    status: string;
  }>;
};

export const Route = createFileRoute('/(public)/shared/$token')({
  component: SharedScanPage,
});

function SharedScanPage() {
  const { token } = Route.useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['shared-scan', token],
    queryFn: async () => {
      const response = await apiClient.get<ApiOkResponse<SharedScanPayload>>(
        `/public/shared-scans/${token}`,
      );
      return response.data.payload;
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md text-center space-y-3">
          <AlertCircle className="mx-auto size-8 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Shared scan not found</h1>
          <p className="text-sm text-muted-foreground">
            This share link is invalid or has been revoked.
          </p>
          <Link to="/" className="text-sm underline text-muted-foreground">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  const { scan, projectName, findings } = data;
  const completedAt = scan.completedAt ? new Date(scan.completedAt) : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-sm font-semibold tracking-tight">
            zivodoc
          </Link>
          <a
            href="https://zivodoc.com"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            Scan your own docs
            <ExternalLink className="size-3" />
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Shared scan report
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{projectName}</h1>
          {completedAt && (
            <p className="mt-1 text-sm text-muted-foreground">
              Scanned {completedAt.toLocaleString()}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Pages" value={scan.pagesScanned} />
          <Stat label="Errors" value={scan.errorCount} tone="error" />
          <Stat label="Warnings" value={scan.warningCount} tone="warning" />
          <Stat label="Info" value={scan.infoCount} tone="info" />
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Findings ({findings.length})
          </h2>
          {findings.length === 0 ? (
            <p className="text-sm text-muted-foreground border rounded-md p-6 text-center">
              No open findings.
            </p>
          ) : (
            <ul className="border rounded-md divide-y">
              {findings.map((f) => (
                <li key={f.id} className="p-4 flex flex-col sm:flex-row sm:items-start gap-3">
                  <Badge variant={severityVariant(f.severity)} className="shrink-0">
                    {f.severity}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{f.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 break-all">
                      {f.source}
                      {f.line > 0 && `:${f.line}`}
                    </p>
                    {f.description && (
                      <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">
                        {f.description}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
                    {f.category}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'error' | 'warning' | 'info';
}) {
  const valueClass =
    tone === 'error' && value > 0
      ? 'text-red-500 dark:text-red-400'
      : tone === 'warning' && value > 0
        ? 'text-amber-500 dark:text-amber-400'
        : '';
  return (
    <div className="border rounded-md p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-2xl font-semibold tabular-nums mt-1 ${valueClass}`}>{value}</p>
    </div>
  );
}

function severityVariant(severity: string): 'error' | 'warning' | 'info' | 'muted' {
  if (severity === 'error') return 'error';
  if (severity === 'warning') return 'warning';
  if (severity === 'info') return 'info';
  return 'muted';
}
