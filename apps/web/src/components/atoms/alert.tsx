import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@src/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-3.5 [&>svg]:size-4',
  {
    variants: {
      variant: {
        default: 'bg-card text-foreground border',
        destructive: 'border-destructive/50 text-destructive [&>svg]:text-destructive',
        success: 'border-emerald-500/50 text-emerald-600 [&>svg]:text-emerald-500',
        warning: 'border-amber-500/50 text-amber-600 [&>svg]:text-amber-500',
        info: 'border-blue-500/50 text-blue-600 [&>svg]:text-blue-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Alert({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      data-variant={variant}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'h5'>) {
  return (
    <h5
      data-slot="alert-title"
      className={cn('font-medium leading-none tracking-tight', className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn('mt-1 text-sm opacity-80', className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, alertVariants };
