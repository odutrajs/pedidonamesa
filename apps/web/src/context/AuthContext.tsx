import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { queryClient } from '../lib/query-client';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  restaurantId: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const STORAGE_KEY = 'pedidonamesa_auth';

const AuthContext = createContext<AuthState | null>(null);

function loadStored(): { token: string; user: AuthUser } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = loadStored();
  const [token, setToken] = useState<string | null>(stored?.token ?? null);
  const [user, setUser] = useState<AuthUser | null>(stored?.user ?? null);

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      login: (newToken, newUser) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: newToken, user: newUser }));
      },
      logout: () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
        queryClient.clear();
      },
    }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
