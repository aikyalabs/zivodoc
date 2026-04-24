import type { ReactNode } from 'react';

import { cn } from '@src/lib/utils';

interface TimelineItem {
  id: string;
  icon: ReactNode;
  title: string;
  description?: string;
  meta?: string;
  action?: ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn('space-y-0', className)}>
      {items.map((item, index) => (
        <div key={item.id} className="relative flex gap-3 pb-6 last:pb-0">
          {/* Vertical line */}
          {index < items.length - 1 && (
            <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
          )}
          {/* Icon */}
          <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-card">
            {item.icon}
          </div>
          {/* Content */}
          <div className="flex min-w-0 flex-1 items-start justify-between gap-2 pt-0.5">
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight">{item.title}</p>
              {item.description && (
                <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {item.meta && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">{item.meta}</span>
              )}
              {item.action}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
