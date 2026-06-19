import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await api<{
        accessToken: string;
        user: { id: string; name: string; email: string; role: string; restaurantId: string };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      login(data.accessToken, data.user);

      if (data.user.role === 'KITCHEN') {
        navigate('/cozinha');
      } else {
        navigate('/admin');
      }
    } catch {
      setError('Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Entrar" subtitle="Admin, cozinha ou garçom">
      <form onSubmit={handleSubmit} className="card mx-auto max-w-md space-y-4 p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">E-mail</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Senha</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        <p className="text-center text-xs text-stone-500">
          Demo: admin@demo.com ou cozinha@demo.com — senha admin123
        </p>
      </form>
    </AppShell>
  );
}
