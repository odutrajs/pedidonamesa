import { ThemeToggle } from '../ui/ThemeToggle';
import { Badge } from '../ui/Badge';
import { Clock, MapPin } from 'lucide-react';

interface MenuLayoutProps {
  restaurantName: string;
  subtitle?: string;
  badge?: string;
  isDelivery?: boolean;
  children: React.ReactNode;
  categoryNav?: React.ReactNode;
}

export function MenuLayout({
  restaurantName,
  subtitle = 'Cardápio digital',
  badge,
  isDelivery = false,
  children,
  categoryNav,
}: MenuLayoutProps) {
  return (
    <div className="min-h-screen bg-black pb-24 text-white lg:pb-8">
      <div className="relative h-44 overflow-hidden bg-zinc-900 sm:h-52">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-700 via-zinc-900 to-black" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black" />
      </div>

      <div className="relative z-10 -mt-16 px-4">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl bg-zinc-900 p-4 ring-1 ring-zinc-800">
            <div className="flex items-start gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-xl font-bold text-white">
                {restaurantName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h1 className="truncate text-xl font-bold text-white">{restaurantName}</h1>
                    <p className="mt-0.5 text-sm text-zinc-400">{subtitle}</p>
                  </div>
                  <ThemeToggle size="sm" />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                  {isDelivery ? (
                    <span className="inline-flex items-center gap-1 font-medium text-brand-400">
                      <MapPin className="h-3.5 w-3.5" />
                      Entrega
                    </span>
                  ) : (
                    badge && <Badge variant="muted">{badge}</Badge>
                  )}
                  {isDelivery && (
                    <span className="inline-flex items-center gap-1 text-zinc-400">
                      <Clock className="h-3.5 w-3.5" />
                      25–40 min
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {categoryNav}

      <main className="mx-auto max-w-3xl px-4 py-5">{children}</main>
    </div>
  );
}
