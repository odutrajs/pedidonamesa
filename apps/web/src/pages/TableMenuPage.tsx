import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { CreateOrderInput, ProductDto } from '@pedidonamesa/shared';
import { AppShell } from '../components/AppShell';
import { CartSidebar } from '../components/menu/CartSidebar';
import { ProductCard } from '../components/menu/ProductCard';
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

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart],
  );

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
      <AppShell title="Cardápio" subtitle="Carregando...">
        <p className="text-stone-500">Carregando cardápio...</p>
      </AppShell>
    );
  }

  if (!menu) {
    return (
      <AppShell title="Mesa não encontrada">
        <p className="text-red-600">
          {menuError ? 'Mesa não encontrada' : 'QR Code inválido'}
        </p>
      </AppShell>
    );
  }

  const tableLabel = menu.table.label
    ? `Mesa ${menu.table.number} — ${menu.table.label}`
    : `Mesa ${menu.table.number}`;

  return (
    <AppShell title={menu.restaurant.name} subtitle={tableLabel}>
      {success && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
          Pedido enviado! A cozinha já recebeu.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {menu.categories.map((category) => (
            <section key={category.id}>
              <h2 className="mb-3 text-lg font-bold">{category.name}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {category.products.map((product) => (
                  <ProductCard key={product.id} product={product} onAdd={addToCart} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <CartSidebar
          cart={cart}
          orderNotes={orderNotes}
          total={total}
          error={error}
          submitting={submitOrder.isPending}
          onNotesChange={setOrderNotes}
          onUpdateQuantity={updateQuantity}
          onSubmit={handleSubmitOrder}
        />
      </div>
    </AppShell>
  );
}
