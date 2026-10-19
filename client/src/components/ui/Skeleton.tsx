import React from 'react';
import { cn } from '../../lib/utils.js';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-secondary/80', className)}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="p-5 rounded-xl border border-border bg-card space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
}

export function MeetingRowSkeleton() {
  return (
    <div className="p-4 flex items-center justify-between border-b border-border/60">
      <div className="flex items-center space-x-3.5">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Skeleton className="h-7 w-20 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}
