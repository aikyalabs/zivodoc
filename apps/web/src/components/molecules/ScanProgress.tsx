import { CheckCircle2, Circle, Loader2, SkipForward } from 'lucide-react';

import { formatDuration } from '@src/lib/formatters';

import type { z } from 'zod';
import type { scanStepSchema } from '@zivodoc/shared';

type ScanStep = z.output<typeof scanStepSchema>;

interface ScanProgressProps {
  steps: ScanStep[];
  scanStatus: string;
}

const STEP_ICON_MAP: Record<string, (props: { className?: string }) => React.ReactElement> = {
  completed: ({ className }) => <CheckCircle2 className={className} />,
  running: ({ className }) => <Loader2 className={`${className} animate-spin`} />,
  skipped: ({ className }) => <SkipForward className={className} />,
  pending: ({ className }) => <Circle className={className} />,
};

const STEP_COLOR_MAP: Record<string, string> = {
  completed: 'text-emerald-500',
  running: 'text-blue-400',
  skipped: 'text-muted-foreground/50',
  pending: 'text-muted-foreground/30',
};

export function ScanProgress({ steps, scanStatus }: ScanProgressProps) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-1">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Scan Progress
        </p>
        {scanStatus === 'running' && (
          <span className="text-xs text-blue-400 flex items-center gap-1.5">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-blue-400" />
            </span>
            In progress
          </span>
        )}
      </div>
      {steps.map((step) => {
        const Icon = STEP_ICON_MAP[step.status] ?? STEP_ICON_MAP.pending;
        const color = STEP_COLOR_MAP[step.status] ?? STEP_COLOR_MAP.pending;

        return (
          <div key={step.name} className="flex items-center justify-between py-1.5 px-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon className={`size-3.5 shrink-0 ${color}`} />
              <span
                className={`text-sm ${step.status === 'pending' ? 'text-muted-foreground/50' : 'text-foreground'}`}
              >
                {step.label}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground tabular-nums">
              {step.itemsProcessed != null && step.status === 'completed' && (
                <span>{step.itemsProcessed} items</span>
              )}
              {step.findingsCount != null && step.findingsCount > 0 && (
                <span className="text-amber-500">{step.findingsCount} found</span>
              )}
              {step.durationMs != null && step.status === 'completed' && (
                <span>{formatDuration(step.durationMs)}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
