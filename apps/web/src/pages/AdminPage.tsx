import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';

interface Category {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  categoryId: string;
  available: boolean;
  sortOrder: number;
}

interface TableRow {
  id: string;
  number: number;
  label: string | null;
  token: string;
  active: boolean;
}

export function AdminPage() {
  const { token, logout } = useAuth();
  const [tab, setTab] = useState<'categories' | 'products' | 'tables'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<TableRow[]>([]);

  const [categoryName, setCategoryName] = useState('');
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    categoryId: '',
    description: '',
  });
  const [tableNumber, setTableNumber] = useState('');
  const [tableLabel, setTableLabel] = useState('');

  async function loadAll() {
    if (!token) return;
    const [cats, prods, tabs] = await Promise.all([
      api<Category[]>('/admin/categories', {}, token),
      api<Product[]>('/admin/products', {}, token),
      api<TableRow[]>('/admin/tables', {}, token),
    ]);
    setCategories(cats);
    setProducts(prods);
    setTables(tabs);
    if (!productForm.categoryId && cats[0]) {
      setProductForm((f) => ({ ...f, categoryId: cats[0].id }));
    }
  }

  useEffect(() => {
    loadAll();
  }, [token]);

  async function createCategory(e: FormEvent) {
    e.preventDefault();
    if (!token || !categoryName.trim()) return;
    await api('/admin/categories', {
      method: 'POST',
      body: JSON.stringify({ name: categoryName }),
    }, token);
    setCategoryName('');
    await loadAll();
  }

  async function createProduct(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    await api('/admin/products', {
      method: 'POST',
      body: JSON.stringify({
        name: productForm.name,
        description: productForm.description || undefined,
        price: Number(productForm.price),
        categoryId: productForm.categoryId,
      }),
    }, token);
    setProductForm({ name: '', price: '', categoryId: productForm.categoryId, description: '' });
    await loadAll();
  }

  async function createTable(e: FormEvent) {
    e.preventDefault();
    if (!token || !tableNumber) return;
    await api('/admin/tables', {
      method: 'POST',
      body: JSON.stringify({
        number: Number(tableNumber),
        label: tableLabel || undefined,
      }),
    }, token);
    setTableNumber('');
    setTableLabel('');
    await loadAll();
  }

  async function toggleProduct(id: string, available: boolean) {
    if (!token) return;
    await api(`/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ available }),
    }, token);
    await loadAll();
  }

  async function regenerateToken(id: string) {
    if (!token) return;
    await api(`/admin/tables/${id}/regenerate-token`, { method: 'POST' }, token);
    await loadAll();
  }

  const tabs = [
    { id: 'categories' as const, label: 'Categorias' },
    { id: 'products' as const, label: 'Produtos' },
    { id: 'tables' as const, label: 'Mesas' },
  ];

  return (
    <AppShell
      title="Administração"
      subtitle="Cardápio, mesas e QR codes"
      actions={
        <div className="flex gap-2">
          <a className="btn-secondary" href="/cozinha">Cozinha</a>
          <button className="btn-secondary" onClick={logout}>Sair</button>
        </div>
      }
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'categories' && (
        <div className="space-y-4">
          <form onSubmit={createCategory} className="card flex flex-wrap gap-3 p-4">
            <input
              className="input max-w-xs"
              placeholder="Nome da categoria"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
            <button className="btn-primary">Adicionar categoria</button>
          </form>
          <ul className="space-y-2">
            {categories.map((c) => (
              <li key={c.id} className="card flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold">{c.name}</p>
                  {c.description && <p className="text-sm text-stone-500">{c.description}</p>}
                </div>
                <span className="text-xs text-stone-500">{c.active ? 'Ativa' : 'Inativa'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'products' && (
        <div className="space-y-4">
          <form onSubmit={createProduct} className="card grid gap-3 p-4 md:grid-cols-2">
            <input
              className="input"
              placeholder="Nome do produto"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
            />
            <input
              className="input"
              placeholder="Preço"
              type="number"
              step="0.01"
              value={productForm.price}
              onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
            />
            <select
              className="input"
              value={productForm.categoryId}
              onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              className="input"
              placeholder="Descrição"
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
            />
            <button className="btn-primary md:col-span-2">Adicionar produto</button>
          </form>
          <ul className="space-y-2">
            {products.map((p) => (
              <li key={p.id} className="card flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-stone-500">
                    {formatCurrency(Number(p.price))} · {categories.find((c) => c.id === p.categoryId)?.name}
                  </p>
                </div>
                <button
                  className={p.available ? 'btn-secondary' : 'btn-primary'}
                  onClick={() => toggleProduct(p.id, !p.available)}
                >
                  {p.available ? 'Desativar' : 'Ativar'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'tables' && (
        <div className="space-y-4">
          <form onSubmit={createTable} className="card flex flex-wrap gap-3 p-4">
            <input
              className="input max-w-[120px]"
              placeholder="Número"
              type="number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
            />
            <input
              className="input max-w-xs"
              placeholder="Label (opcional)"
              value={tableLabel}
              onChange={(e) => setTableLabel(e.target.value)}
            />
            <button className="btn-primary">Criar mesa</button>
          </form>
          <ul className="space-y-3">
            {tables.map((t) => (
              <li key={t.id} className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      Mesa {t.number}{t.label ? ` — ${t.label}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-stone-500 break-all">Token: {t.token}</p>
                    <a
                      className="mt-2 inline-block text-sm font-medium text-brand-700"
                      href={`/mesa/${t.token}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir cardápio da mesa →
                    </a>
                  </div>
                  <button className="btn-secondary" onClick={() => regenerateToken(t.id)}>
                    Novo QR
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AppShell>
  );
}
