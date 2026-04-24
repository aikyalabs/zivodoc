import type { ReactNode } from 'react';

import { cn } from '@src/lib/utils';

interface FilterBarProps {
  children: ReactNode;
  className?: string;
  label?: string;
  count?: number;
  action?: ReactNode;
}

export function FilterBar({ children, className, label, count, action }: FilterBarProps) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <div className="flex items-center gap-3">
        {label && (
          <h3 className="text-sm font-medium">
            {label}
            {count !== undefined && <span className="ml-1.5 text-muted-foreground">{count}</span>}
          </h3>
        )}
        <div className="flex items-center gap-2">{children}</div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
