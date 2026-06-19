import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';
import {
  getTheme,
  setTheme as setThemeExternal,
  subscribeTheme,
  toggleTheme as toggleThemeExternal,
  type Theme,
} from '../lib/theme';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => 'light' as Theme);

  const setTheme = useCallback((next: Theme) => {
    setThemeExternal(next);
  }, []);

  const toggleTheme = useCallback(() => {
    toggleThemeExternal();
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
