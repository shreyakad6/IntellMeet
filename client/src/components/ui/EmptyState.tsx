import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button.js';
import { cn } from '../../lib/utils.js';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  children
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-border bg-card/50',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 border border-primary/20">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
        {title}
      </h3>
      <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-sm leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
