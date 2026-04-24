import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  EyeOff,
  ExternalLink,
  Shield,
} from 'lucide-react';

import { Badge } from '@src/components/atoms/badge';
import { Button } from '@src/components/atoms/button';
import { cn } from '@src/lib/utils';

import type { z } from 'zod';
import type { findingModelSchema } from '@zivodoc/shared';

type FindingData = z.output<typeof findingModelSchema>;

interface FindingRowProps {
  finding: FindingData;
  onUpdateStatus?: (id: string, status: 'resolved' | 'ignored') => void;
}

const severityStyles = {
  error: {
    border: 'border-l-red-500',
    bg: 'bg-red-500',
    label: 'Error',
    variant: 'error' as const,
  },
  warning: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-500',
    label: 'Warning',
    variant: 'warning' as const,
  },
  info: { border: 'border-l-blue-500', bg: 'bg-blue-500', label: 'Info', variant: 'info' as const },
};

const categoryLabels: Record<string, string> = {
  broken_link: 'Broken Link',
  broken_anchor: 'Broken Anchor',
  redirect_chain: 'Redirect Chain',
  syntax_error: 'Syntax Error',
  missing_page: 'Missing Page',
  slow_link: 'Slow Link',
  stale_ref: 'Stale Ref',
  insecure_link: 'Insecure Link',
  leaked_secret: 'Leaked Secret',
  internal_url: 'Internal URL',
  placeholder_text: 'Placeholder',
  empty_section: 'Empty Section',
  empty_code_block: 'Empty Code',
  missing_code_lang: 'No Language',
  heading_skip: 'Heading Skip',
  multiple_h1: 'Multiple H1',
  broken_image: 'Broken Image',
  todo_left: 'TODO Left',
  outdated_date: 'Outdated Date',
  duplicate_content: 'Duplicate',
  missing_alt_text: 'No Alt Text',
};

function formatSource(source: string, line: number): { display: string; full: string } {
  let display: string;
  try {
    display = new URL(source).pathname;
  } catch {
    const parts = source.split('/');
    display = parts.slice(-3).join('/');
  }
  const suffix = line > 0 ? `:${line}` : '';
  return { display: display + suffix, full: source + suffix };
}

export function FindingRow({ finding, onUpdateStatus }: FindingRowProps) {
  const [expanded, setExpanded] = useState(false);
  const sev = severityStyles[finding.severity];
  const confidence = (finding.rawData?.confidence as string) ?? 'high';
  const evidence = finding.rawData?.evidence as Record<string, unknown> | undefined;
  const { display: sourcePath, full: sourceFull } = formatSource(finding.source, finding.line);
  const isResolved =
    finding.status === 'resolved' ||
    finding.status === 'ignored' ||
    finding.status === 'auto_resolved';
  const isReopened = finding.status === 'reopened';
  const isNew = finding.seenCount === 1 && finding.status === 'open';
  const isAutoResolved = finding.status === 'auto_resolved';

  return (
    <div
      className={cn(
        'border-l-[3px] rounded-md border bg-card transition-colors',
        sev.border,
        isResolved && 'opacity-50',
      )}
    >
      {/* Compact row */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-accent/30 transition-colors"
      >
        {/* Expand icon */}
        <div className="mt-0.5 shrink-0 text-muted-foreground">
          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={sev.variant} className="text-[10px] px-1.5 py-0">
              {sev.label}
            </Badge>
            {confidence !== 'high' && (
              <Badge variant="muted" className="text-[10px] px-1.5 py-0">
                {confidence}
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {categoryLabels[finding.category] ?? finding.category}
            </Badge>
            {isNew && (
              <Badge variant="info" className="text-[10px] px-1.5 py-0">
                New
              </Badge>
            )}
            {isReopened && (
              <Badge variant="error" className="text-[10px] px-1.5 py-0">
                Regression
              </Badge>
            )}
            {isAutoResolved && (
              <Badge variant="success" className="text-[10px] px-1.5 py-0">
                Fixed
              </Badge>
            )}
            {finding.status === 'resolved' && (
              <Badge variant="success" className="text-[10px] px-1.5 py-0">
                Resolved
              </Badge>
            )}
            {finding.status === 'ignored' && (
              <Badge variant="muted" className="text-[10px] px-1.5 py-0">
                Ignored
              </Badge>
            )}
            {finding.seenCount > 1 && !isResolved && (
              <span className="text-[10px] text-muted-foreground">seen {finding.seenCount}x</span>
            )}
          </div>
          <p className="text-sm font-medium break-all">{finding.title}</p>
          <p className="text-xs text-muted-foreground break-all">{finding.description}</p>
        </div>

        {/* Source */}
        <div className="shrink-0 text-right hidden sm:block">
          <span className="font-mono text-xs text-muted-foreground" title={sourceFull}>
            {sourcePath}
          </span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t px-4 py-3 ml-7 space-y-4 min-w-0 overflow-hidden">
          {/* Source (mobile) */}
          <div className="sm:hidden">
            <p className="text-xs text-muted-foreground font-mono">{sourceFull}</p>
          </div>

          {/* Evidence */}
          {evidence && Object.keys(evidence).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="size-3" />
                Evidence
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {evidence.httpStatus && (
                  <EvidenceChip label="HTTP Status" value={String(evidence.httpStatus)} />
                )}
                {evidence.responseTimeMs && (
                  <EvidenceChip label="Response Time" value={`${evidence.responseTimeMs}ms`} />
                )}
                {evidence.matchedPattern && (
                  <EvidenceChip label="Pattern" value={String(evidence.matchedPattern)} />
                )}
                {evidence.expected && (
                  <EvidenceChip label="Expected" value={String(evidence.expected)} />
                )}
                {evidence.actual && <EvidenceChip label="Actual" value={String(evidence.actual)} />}
              </div>
              {evidence.snippet && (
                <pre className="text-xs bg-muted/50 rounded px-3 py-2 font-mono text-muted-foreground whitespace-pre-wrap break-all">
                  {String(evidence.snippet)}
                </pre>
              )}
              {evidence.redirectChain && Array.isArray(evidence.redirectChain) && (
                <div className="text-xs space-y-1">
                  <p className="text-muted-foreground font-medium">Redirect chain:</p>
                  {(evidence.redirectChain as string[]).map((url, i) => (
                    <p key={url} className="font-mono text-muted-foreground pl-2 break-all">
                      {i > 0 && '→ '}
                      {url}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Suggestion */}
          {finding.suggestion && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Suggestion
              </p>
              <p className="text-sm break-all">{finding.suggestion}</p>
            </div>
          )}

          {/* Source link */}
          {finding.source.startsWith('http') && (
            <a
              href={finding.source}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="size-3" />
              Open source page
            </a>
          )}

          {/* Actions */}
          {!isResolved && onUpdateStatus && (
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateStatus(finding.id, 'resolved');
                }}
                className="gap-1.5"
              >
                <CheckCircle2 className="size-3.5" />
                Resolve
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateStatus(finding.id, 'ignored');
                }}
                className="gap-1.5 text-muted-foreground"
              >
                <EyeOff className="size-3.5" />
                Ignore
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EvidenceChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-muted/50 px-2.5 py-1.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-xs font-medium font-mono">{value}</p>
    </div>
  );
}
