import { Skeleton } from './ui/Skeleton';
import { ThemeToggle } from './ui/ThemeToggle';

function AppShellHeaderSkeleton({ showBrand = true }: { showBrand?: boolean }) {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <div className="min-w-0 flex-1 space-y-2">
          {showBrand && <Skeleton className="h-4 w-28" />}
          <Skeleton className="h-7 w-44 max-w-full sm:w-52" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="hidden h-9 w-24 rounded-lg sm:block" />
          <Skeleton className="hidden h-9 w-9 rounded-lg sm:block" />
          <ThemeToggle size="sm" />
        </div>
      </div>
    </header>
  );
}

function LoginContentSkeleton() {
  return (
    <div className="mx-auto max-w-sm">
      <Skeleton className="mb-6 h-4 w-28" />
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
      <Skeleton className="mx-auto mt-4 h-8 w-56 max-w-full" />
    </div>
  );
}

function GridContentSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-64 w-full rounded-xl" />
      ))}
    </div>
  );
}

function SidebarContentSkeleton() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <aside className="w-full shrink-0 lg:w-56">
        <div className="space-y-1 rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </aside>
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 border-b border-zinc-100 px-4 py-4 last:border-b-0 dark:border-zinc-800"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-5 w-48 max-w-full" />
                <Skeleton className="h-4 w-32" />
                <div className="flex flex-wrap gap-2 pt-1">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-5 w-5 shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export type AppShellSkeletonVariant = 'login' | 'grid' | 'sidebar' | 'content';

export function AppShellSkeleton({ variant = 'content' }: { variant?: AppShellSkeletonVariant }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppShellHeaderSkeleton showBrand={variant !== 'login'} />
      <main className="mx-auto max-w-6xl px-4 py-6">
        {variant === 'login' && <LoginContentSkeleton />}
        {variant === 'grid' && <GridContentSkeleton />}
        {variant === 'sidebar' && <SidebarContentSkeleton />}
        {variant === 'content' && <ContentSkeleton />}
      </main>
    </div>
  );
}
