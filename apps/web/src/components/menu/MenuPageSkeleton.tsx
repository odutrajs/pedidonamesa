import { Skeleton } from '../ui/Skeleton';
import { ThemeToggle } from '../ui/ThemeToggle';

function ProductListRowSkeleton({ showDivider = true }: { showDivider?: boolean }) {
  return (
    <div
      className={`flex items-stretch gap-3 px-4 py-3.5 ${
        showDivider ? 'border-b border-zinc-800/80 last:border-b-0' : ''
      }`}
    >
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-3/5 rounded-md bg-zinc-800" />
        <Skeleton className="h-3 w-full rounded-md bg-zinc-800/80" />
        <Skeleton className="h-3 w-4/5 rounded-md bg-zinc-800/80" />
        <Skeleton className="mt-1 h-4 w-24 rounded-md bg-zinc-800" />
      </div>
      <Skeleton className="h-[72px] w-[72px] shrink-0 rounded-xl bg-zinc-800" />
    </div>
  );
}

function ProductCategorySectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <section>
      <Skeleton className="mb-3 h-6 w-36 rounded-md bg-zinc-800" />
      <div className="overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-zinc-800">
        {Array.from({ length: rows }).map((_, index) => (
          <ProductListRowSkeleton key={index} showDivider={index < rows - 1} />
        ))}
      </div>
    </section>
  );
}

function CategoryNavSkeleton() {
  return (
    <nav className="sticky top-0 z-30 border-b border-zinc-800 bg-black/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
        {['w-24', 'w-32', 'w-20', 'w-28'].map((width, index) => (
          <Skeleton key={index} className={`h-5 shrink-0 rounded-md bg-zinc-800 ${width}`} />
        ))}
      </div>
    </nav>
  );
}

function RestaurantCardSkeleton() {
  return (
    <div className="relative z-10 -mt-16 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl bg-zinc-900 p-4 ring-1 ring-zinc-800">
          <div className="flex items-start gap-3">
            <Skeleton className="h-14 w-14 shrink-0 rounded-xl bg-zinc-800" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-6 w-48 max-w-full rounded-md bg-zinc-800" />
                  <Skeleton className="h-4 w-28 rounded-md bg-zinc-800/80" />
                </div>
                <ThemeToggle size="sm" />
              </div>
              <Skeleton className="mt-3 h-5 w-32 rounded-md bg-zinc-800/80" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartSidebarSkeleton() {
  return (
    <aside className="sticky top-20 hidden rounded-2xl bg-zinc-900 p-5 ring-1 ring-zinc-800 lg:block">
      <Skeleton className="h-6 w-40 rounded-md bg-zinc-800" />
      <div className="mt-6 space-y-3">
        <Skeleton className="h-20 w-full rounded-xl bg-zinc-800/80" />
        <Skeleton className="h-20 w-full rounded-xl bg-zinc-800/80" />
      </div>
      <div className="mt-6 space-y-2">
        <Skeleton className="h-4 w-24 rounded-md bg-zinc-800/80" />
        <Skeleton className="h-20 w-full rounded-lg bg-zinc-800/80" />
      </div>
      <div className="mt-6 flex items-center justify-between">
        <Skeleton className="h-5 w-12 rounded-md bg-zinc-800/80" />
        <Skeleton className="h-7 w-20 rounded-md bg-zinc-800" />
      </div>
      <Skeleton className="mt-4 h-12 w-full rounded-xl bg-zinc-800" />
    </aside>
  );
}

export function MenuPageSkeleton() {
  return (
    <div className="min-h-screen bg-black pb-24 text-white lg:pb-8">
      <Skeleton className="h-44 w-full rounded-none bg-zinc-900 sm:h-52" />

      <RestaurantCardSkeleton />
      <CategoryNavSkeleton />

      <main className="mx-auto max-w-3xl px-4 py-5">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <ProductCategorySectionSkeleton rows={4} />
            <ProductCategorySectionSkeleton rows={3} />
          </div>
          <CartSidebarSkeleton />
        </div>
      </main>
    </div>
  );
}
