import { AlertTriangle, Info, XCircle } from 'lucide-react';

import { Badge } from '@src/components/atoms/badge';
import { cn } from '@src/lib/utils';

type Severity = 'error' | 'warning' | 'info';

const config: Record<
  Severity,
  { icon: typeof XCircle; variant: 'error' | 'warning' | 'info'; label: string }
> = {
  error: { icon: XCircle, variant: 'error', label: 'Error' },
  warning: { icon: AlertTriangle, variant: 'warning', label: 'Warning' },
  info: { icon: Info, variant: 'info', label: 'Info' },
};

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
  showLabel?: boolean;
}

export function SeverityBadge({ severity, className, showLabel = true }: SeverityBadgeProps) {
  const { icon: Icon, variant, label } = config[severity];

  return (
    <Badge variant={variant} className={cn('gap-1', className)}>
      <Icon className="size-3" />
      {showLabel && label}
    </Badge>
  );
}
