import { memo, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  MessageCircle,
  Package,
  Settings,
  ShoppingBag,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import type { RestaurantSettingsDto } from '@pedidonamesa/shared';
import { useRestaurantSettings } from '../../hooks/useSettings';
import { cn } from '../../lib/cn';

type MenuItem = {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  path?: string;
  feature?: keyof Pick<
    RestaurantSettingsDto,
    'inventoryEnabled' | 'financeEnabled' | 'whatsappEnabled' | 'deliveryEnabled'
  >;
  children?: { label: string; path: string; feature?: 'deliveryEnabled' }[];
};

const ALL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin',
  },
  {
    id: 'pedidos',
    label: 'Pedidos',
    icon: ClipboardList,
    path: '/admin/pedidos',
  },
  {
    id: 'cardapio',
    label: 'Cardápio',
    icon: UtensilsCrossed,
    children: [
      { label: 'Categorias', path: '/admin/cardapio/categorias' },
      { label: 'Produtos', path: '/admin/cardapio/produtos' },
      { label: 'Mesas', path: '/admin/cardapio/mesas' },
      { label: 'Delivery', path: '/admin/cardapio/delivery', feature: 'deliveryEnabled' },
    ],
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: MessageCircle,
    path: '/admin/whatsapp',
    feature: 'whatsappEnabled',
  },
  {
    id: 'estoque',
    label: 'Estoque',
    icon: Package,
    path: '/admin/estoque',
    feature: 'inventoryEnabled',
  },
  {
    id: 'carrinho',
    label: 'Carrinho',
    icon: ShoppingBag,
    path: '/admin/carrinho',
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    icon: Wallet,
    path: '/admin/financeiro',
    feature: 'financeEnabled',
  },
];

function isFeatureEnabled(
  settings: RestaurantSettingsDto | undefined,
  feature?: MenuItem['feature'],
) {
  if (!feature) return true;
  if (!settings) return true;
  return settings[feature];
}

function isPathActive(path: string, pathname: string) {
  if (path === '/admin') {
    return pathname === '/admin' || pathname === '/admin/';
  }
  return pathname.startsWith(path);
}

export const AdminSidebar = memo(function AdminSidebar() {
  const location = useLocation();
  const { data: settings } = useRestaurantSettings();
  const isCardapioActive = location.pathname.startsWith('/admin/cardapio');
  const [cardapioOpen, setCardapioOpen] = useState(isCardapioActive);

  const menuItems = useMemo(() => {
    return ALL_MENU_ITEMS.map((item) => {
      if (item.children) {
        const children = item.children.filter((child) => isFeatureEnabled(settings, child.feature));
        if (children.length === 0) return null;
        return { ...item, children };
      }
      if (!isFeatureEnabled(settings, item.feature)) return null;
      return item;
    }).filter(Boolean) as MenuItem[];
  }, [settings]);

  const mainItems = menuItems.filter((item) => item.id !== 'financeiro');
  const bottomItems = menuItems.filter((item) => item.id === 'financeiro');

  return (
    <aside className="flex h-full w-[72px] shrink-0 flex-col items-center border-r border-sidebar-border bg-sidebar py-4">
      <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
        P
      </div>

      <nav className="flex flex-1 flex-col items-center gap-1">
        {mainItems.map((item) => {
          if (item.children) {
            const active = isCardapioActive;
            return (
              <div key={item.id} className="relative flex flex-col items-center">
                <button
                  type="button"
                  title={item.label}
                  onClick={() => setCardapioOpen((open) => !open)}
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
                    active
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )}
                >
                  <item.icon className="h-5 w-5" />
                </button>
                {cardapioOpen && (
                  <div className="absolute left-full top-0 z-50 ml-2 min-w-[160px] rounded-lg border border-border bg-popover p-1 shadow-lg">
                    <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                      {item.label}
                    </p>
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) =>
                          cn(
                            'block rounded-md px-3 py-2 text-sm transition',
                            isActive
                              ? 'bg-accent text-accent-foreground'
                              : 'text-foreground hover:bg-accent/60',
                          )
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
                {active && (
                  <ChevronDown className="absolute -bottom-1 h-3 w-3 text-sidebar-foreground/50" />
                )}
              </div>
            );
          }

          const active = item.path ? isPathActive(item.path, location.pathname) : false;

          return (
            <NavLink
              key={item.id}
              to={item.path!}
              end={item.path === '/admin'}
              title={item.label}
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <item.icon className="h-5 w-5" />
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-1">
        {bottomItems.map((item) => {
          const active = item.path ? isPathActive(item.path, location.pathname) : false;
          return (
            <NavLink
              key={item.id}
              to={item.path!}
              title={item.label}
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <item.icon className="h-5 w-5" />
            </NavLink>
          );
        })}
        <button
          type="button"
          title="Configurações"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
});
