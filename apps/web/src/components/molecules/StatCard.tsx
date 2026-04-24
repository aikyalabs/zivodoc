import type { LucideIcon } from 'lucide-react';

import { cn } from '@src/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: { value: string; positive?: boolean };
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

const variantStyles = {
  default: {
    icon: 'text-muted-foreground bg-muted',
    value: 'text-foreground',
  },
  success: {
    icon: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950',
    value: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    icon: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950',
    value: 'text-amber-600 dark:text-amber-400',
  },
  error: {
    icon: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950',
    value: 'text-red-600 dark:text-red-400',
  },
  info: {
    icon: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950',
    value: 'text-blue-600 dark:text-blue-400',
  },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  className,
  variant = 'default',
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className={cn('rounded-lg border bg-card p-4 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <div className={cn('flex size-8 items-center justify-center rounded-md', styles.icon)}>
            <Icon className="size-4" />
          </div>
        )}
      </div>
      <div className="flex items-end gap-2">
        <p className={cn('text-2xl font-semibold tracking-tight', styles.value)}>{value}</p>
        {trend && (
          <span
            className={cn(
              'mb-0.5 text-xs font-medium',
              trend.positive ? 'text-emerald-600' : 'text-red-600',
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
