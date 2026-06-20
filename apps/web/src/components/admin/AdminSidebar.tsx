import { memo, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ClipboardList,
  MessageCircle,
  Package,
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
  icon: typeof ClipboardList;
  path?: string;
  feature?: keyof Pick<
    RestaurantSettingsDto,
    'inventoryEnabled' | 'financeEnabled' | 'whatsappEnabled' | 'deliveryEnabled'
  >;
  children?: { label: string; path: string; feature?: 'deliveryEnabled' }[];
};

const ALL_MENU_ITEMS: MenuItem[] = [
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

const inactiveClass =
  'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100';

const activeClass =
  'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50';

function navLinkClass(isActive: boolean, disabled?: boolean) {
  return cn(
    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
    disabled
      ? 'cursor-not-allowed text-zinc-400 dark:text-zinc-600'
      : isActive
        ? activeClass
        : inactiveClass,
  );
}

function isFeatureEnabled(
  settings: RestaurantSettingsDto | undefined,
  feature?: MenuItem['feature'],
) {
  if (!feature) return true;
  if (!settings) return true;
  return settings[feature];
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

  return (
    <aside className="w-full shrink-0 lg:w-56">
      <nav className="space-y-1 rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
        {menuItems.map((item) => {
          if (item.children) {
            return (
              <div key={item.id}>
                <button
                  type="button"
                  onClick={() => setCardapioOpen((open) => !open)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                    isCardapioActive
                      ? 'text-zinc-900 dark:text-zinc-100'
                      : inactiveClass,
                  )}
                >
                  <span className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 transition',
                      cardapioOpen ? 'rotate-180' : '',
                    )}
                  />
                </button>

                {cardapioOpen && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-zinc-200 pl-3 dark:border-zinc-700">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) =>
                          cn(
                            'block rounded-md px-3 py-2 text-sm transition',
                            isActive
                              ? activeClass
                              : inactiveClass,
                          )
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.id}
              to={item.path!}
              className={({ isActive }) => navLinkClass(isActive)}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
});
