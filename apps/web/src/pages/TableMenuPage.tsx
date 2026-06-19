import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { CreateOrderInput, MenuDto, ProductDto } from '@pedidonamesa/shared';
import { AppShell } from '../components/AppShell';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';

interface CartItem {
  product: ProductDto;
  quantity: number;
  notes?: string;
}

export function TableMenuPage() {
  const { token } = useParams<{ token: string }>();
  const [menu, setMenu] = useState<MenuDto | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    api<MenuDto>(`/menu/mesa/${token}`)
      .then(setMenu)
      .catch(() => setError('Mesa não encontrada'))
      .finally(() => setLoading(false));
  }, [token]);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart],
  );

  function addToCart(product: ProductDto) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i)),
    );
  }

  async function submitOrder() {
    if (!token || cart.length === 0) return;

    setSubmitting(true);
    setError('');

    const payload: CreateOrderInput = {
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        notes: item.notes,
      })),
      notes: orderNotes || undefined,
    };

    try {
      await api(`/orders/mesa/${token}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setCart([]);
      setOrderNotes('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch {
      setError('Não foi possível enviar o pedido. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AppShell title="Cardápio" subtitle="Carregando...">
        <p className="text-stone-500">Carregando cardápio...</p>
      </AppShell>
    );
  }

  if (!menu) {
    return (
      <AppShell title="Mesa não encontrada">
        <p className="text-red-600">{error || 'QR Code inválido'}</p>
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
                  <article key={product.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{product.name}</h3>
                        {product.description && (
                          <p className="mt-1 text-sm text-stone-500">{product.description}</p>
                        )}
                        <p className="mt-2 font-bold text-brand-700">
                          {formatCurrency(product.price)}
                        </p>
                      </div>
                      <button className="btn-primary shrink-0" onClick={() => addToCart(product)}>
                        +
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="card sticky top-24 p-4">
          <h2 className="text-lg font-bold">Seu pedido</h2>
          {cart.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">Adicione itens do cardápio</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {cart.map((item) => (
                <li key={item.product.id} className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-stone-500">
                      {formatCurrency(item.product.price)} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="btn-secondary px-2 py-1"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="text-sm font-semibold">{item.quantity}</span>
                    <button
                      className="btn-secondary px-2 py-1"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 border-t border-stone-200 pt-4">
            <label className="mb-1 block text-sm font-medium">Observações</label>
            <textarea
              className="input min-h-[72px]"
              placeholder="Ex: sem cebola, gelado..."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-bold">{formatCurrency(total)}</span>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            className="btn-primary mt-4 w-full"
            disabled={cart.length === 0 || submitting}
            onClick={submitOrder}
          >
            {submitting ? 'Enviando...' : 'Enviar pedido'}
          </button>
        </aside>
      </div>
    </AppShell>
  );
}
