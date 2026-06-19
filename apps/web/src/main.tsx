import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import { App } from './App';
import { queryClient } from './lib/query-client';
import { ThemeProvider } from './context/ThemeContext';
import { initTheme } from './lib/theme';

initTheme();

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center text-zinc-500 dark:text-zinc-400">
    Carregando...
  </div>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<PageLoader />}>
          <App />
        </Suspense>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
