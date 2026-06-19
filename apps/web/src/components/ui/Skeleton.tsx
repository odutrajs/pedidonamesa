import { cn } from '../../lib/cn';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800', className)} />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex gap-3.5 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-col sm:gap-0 sm:p-0">
      <Skeleton className="h-[88px] w-[88px] shrink-0 rounded-xl sm:aspect-[16/10] sm:h-auto sm:w-full sm:rounded-none sm:rounded-t-2xl" />
      <div className="flex flex-1 flex-col justify-between space-y-2 py-0.5 sm:p-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-9 w-9 rounded-full sm:w-24 sm:rounded-lg" />
        </div>
      </div>
    </div>
  );
}
