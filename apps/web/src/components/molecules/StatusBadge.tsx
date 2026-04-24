import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';

import { Badge } from '@src/components/atoms/badge';
import { cn } from '@src/lib/utils';

type Status = 'pending' | 'running' | 'completed' | 'failed';

const config: Record<
  Status,
  {
    icon: typeof Clock;
    variant: 'muted' | 'info' | 'success' | 'error';
    label: string;
    animate?: boolean;
  }
> = {
  pending: { icon: Clock, variant: 'muted', label: 'Pending' },
  running: { icon: Loader2, variant: 'info', label: 'Running', animate: true },
  completed: { icon: CheckCircle2, variant: 'success', label: 'Completed' },
  failed: { icon: XCircle, variant: 'error', label: 'Failed' },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { icon: Icon, variant, label, animate } = config[status];

  return (
    <Badge variant={variant} className={cn('gap-1', className)}>
      <Icon className={cn('size-3', animate && 'animate-spin')} />
      {label}
    </Badge>
  );
}
