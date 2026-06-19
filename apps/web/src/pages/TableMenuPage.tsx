import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QrCode } from 'lucide-react';
import type { CreateOrderInput, ProductDto } from '@pedidonamesa/shared';
import { MenuLayout } from '../components/menu/MenuLayout';
import { CategoryNav } from '../components/menu/CategoryNav';
import { CartSidebar } from '../components/menu/CartSidebar';
import { CartDrawer } from '../components/menu/CartDrawer';
import { ProductCard } from '../components/menu/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { Toast } from '../components/ui/Toast';
import { EmptyState } from '../components/ui/EmptyState';
import { useMenu, useSubmitOrder } from '../hooks/useMenu';

interface CartItem {
  product: ProductDto;
  quantity: number;
}

export function TableMenuPage() {
  const { token } = useParams<{ token: string }>();
  const { data: menu, isLoading, error: menuError } = useMenu(token);
  const submitOrder = useSubmitOrder(token);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart],
  );

  const itemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  useEffect(() => {
    if (menu?.categories.length && !activeCategory) {
      setActiveCategory(menu.categories[0].id);
    }
  }, [menu, activeCategory]);

  useEffect(() => {
    if (!menu?.categories.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          setActiveCategory(visible[0].target.id.replace('cat-', ''));
        }
      },
      { rootMargin: '-120px 0px -60% 0px', threshold: [0, 0.25, 0.5] },
    );

    menu.categories.forEach((cat) => {
      const el = sectionRefs.current[cat.id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [menu]);

  const scrollToCategory = useCallback((id: string) => {
    setActiveCategory(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const addToCart = useCallback((product: ProductDto) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i)),
    );
  }, []);

  const handleSubmitOrder = useCallback(() => {
    if (!token || cart.length === 0) return;

    setError('');

    const payload: CreateOrderInput = {
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        notes: item.notes,
      })),
      notes: orderNotes || undefined,
    };

    submitOrder.mutate(payload, {
      onSuccess: () => {
        setCart([]);
        setOrderNotes('');
        setDrawerOpen(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      },
      onError: () => {
        setError('Não foi possível enviar o pedido. Tente novamente.');
      },
    });
  }, [token, cart, orderNotes, submitOrder]);

  if (isLoading) {
    return (
      <MenuLayout restaurantName="Cardápio" tableLabel="Carregando...">
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </MenuLayout>
    );
  }

  if (!menu) {
    return (
      <MenuLayout restaurantName="Mesa não encontrada" tableLabel="">
        <EmptyState
          icon={<QrCode className="h-5 w-5" />}
          title="QR Code inválido"
          description={
            menuError
              ? 'Esta mesa não foi encontrada. Peça ao garçom um novo QR Code.'
              : 'Não foi possível carregar o cardápio. Verifique o link e tente novamente.'
          }
        />
      </MenuLayout>
    );
  }

  const tableLabel = menu.table.label
    ? `Mesa ${menu.table.number} — ${menu.table.label}`
    : `Mesa ${menu.table.number}`;

  const cartProps = {
    cart,
    orderNotes,
    total,
    error,
    submitting: submitOrder.isPending,
    onNotesChange: setOrderNotes,
    onUpdateQuantity: updateQuantity,
    onSubmit: handleSubmitOrder,
  };

  return (
    <>
      <Toast
        message="Pedido enviado! A cozinha já recebeu."
        visible={success}
        onClose={() => setSuccess(false)}
      />

      <MenuLayout
        restaurantName={menu.restaurant.name}
        tableLabel={tableLabel}
        categoryNav={
          menu.categories.length > 1 ? (
            <CategoryNav
              categories={menu.categories.map((c) => ({ id: c.id, name: c.name }))}
              activeId={activeCategory}
              onSelect={scrollToCategory}
            />
          ) : undefined
        }
      >
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-10">
            {menu.categories.map((category) => (
              <section
                key={category.id}
                id={`cat-${category.id}`}
                ref={(el) => {
                  sectionRefs.current[category.id] = el;
                }}
                className="section-scroll"
              >
                <h2 className="mb-4 text-lg font-semibold text-zinc-900">{category.name}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {category.products.map((product) => (
                    <ProductCard key={product.id} product={product} onAdd={addToCart} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <CartSidebar {...cartProps} />
        </div>
      </MenuLayout>

      <CartDrawer
        {...cartProps}
        open={drawerOpen}
        itemCount={itemCount}
        onOpen={() => setDrawerOpen(true)}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
