import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils.js';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-tight transition-colors select-none',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary border border-primary/20',
        secondary: 'bg-secondary text-secondary-foreground border border-border',
        success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
        warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
        destructive: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
        outline: 'border border-border text-foreground bg-transparent',
        neutral: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full mr-1.5 shrink-0',
            variant === 'success' && 'bg-emerald-500 animate-pulse',
            variant === 'destructive' && 'bg-rose-500',
            variant === 'warning' && 'bg-amber-500',
            (!variant || variant === 'default') && 'bg-primary',
            variant === 'secondary' && 'bg-slate-400',
            variant === 'neutral' && 'bg-slate-400'
          )}
        />
      )}
      {children}
    </div>
  );
}
