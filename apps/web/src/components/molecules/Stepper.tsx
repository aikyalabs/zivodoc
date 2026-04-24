import { CheckIcon } from 'lucide-react';

import { cn } from '@src/lib/utils';

interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={step.label} className="flex items-center gap-2">
            {index > 0 && (
              <div
                className={cn(
                  'h-px w-8 sm:w-12 transition-colors',
                  isCompleted ? 'bg-primary' : 'bg-border',
                )}
              />
            )}
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-all',
                  isCompleted && 'bg-primary text-primary-foreground',
                  isCurrent && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                  !isCompleted && !isCurrent && 'border bg-muted text-muted-foreground',
                )}
              >
                {isCompleted ? <CheckIcon className="size-3.5" /> : index + 1}
              </div>
              <div className="hidden sm:block">
                <p
                  className={cn(
                    'text-sm font-medium leading-none',
                    isCurrent ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
