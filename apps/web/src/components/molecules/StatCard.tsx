import type { LucideIcon } from 'lucide-react';

import { cn } from '@src/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  description?: string;
  trend?: { value: string; positive?: boolean };
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

const variantStyles = {
  default: {
    icon: 'text-muted-foreground',
    value: '',
  },
  success: {
    icon: 'text-emerald-600 dark:text-emerald-400',
    value: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    icon: 'text-amber-600 dark:text-amber-400',
    value: 'text-amber-600 dark:text-amber-400',
  },
  error: {
    icon: 'text-red-600 dark:text-red-400',
    value: 'text-red-600 dark:text-red-400',
  },
  info: {
    icon: 'text-blue-600 dark:text-blue-400',
    value: 'text-blue-600 dark:text-blue-400',
  },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  description,
  trend,
  className,
  variant = 'default',
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className={cn('rounded-xl border bg-card p-6 shadow-sm', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && <Icon className={cn('size-4', styles.icon)} />}
      </div>
      <div className="mt-2 flex items-end gap-2">
        <p className={cn('text-2xl font-bold', styles.value)}>{value}</p>
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
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}
