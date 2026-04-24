import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

import { Button } from '@src/components/atoms/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@src/components/atoms/dialog';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: 'default' | 'destructive';
  loading?: boolean;
  icon?: ReactNode;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'default',
  loading = false,
  icon,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            {(icon || variant === 'destructive') && (
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-full ${variant === 'destructive' ? 'bg-red-50 dark:bg-red-950' : 'bg-muted'}`}
              >
                {icon ?? <AlertTriangle className="size-5 text-red-600 dark:text-red-400" />}
              </div>
            )}
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-1.5">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={loading}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
