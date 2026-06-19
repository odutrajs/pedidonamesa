import { Badge } from '../ui/Badge';

interface MenuLayoutProps {
  restaurantName: string;
  tableLabel: string;
  children: React.ReactNode;
  categoryNav?: React.ReactNode;
}

export function MenuLayout({
  restaurantName,
  tableLabel,
  children,
  categoryNav,
}: MenuLayoutProps) {
  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-6">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
                {restaurantName}
              </h1>
              <p className="text-sm text-zinc-500">Cardápio digital</p>
            </div>
            <Badge variant="muted">{tableLabel}</Badge>
          </div>
        </div>
        {categoryNav}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
