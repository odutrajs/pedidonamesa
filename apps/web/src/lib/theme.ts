export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'pedidonamesa-theme';
const listeners = new Set<() => void>();

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const isDark = theme === 'dark';

  root.classList.remove('dark', 'light');
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.add('light');
  }

  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', isDark ? '#09090b' : '#ea580c');
}

export function setTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
  listeners.forEach((listener) => listener());
}

export function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function initTheme() {
  const theme = getTheme();
  applyTheme(theme);
}
