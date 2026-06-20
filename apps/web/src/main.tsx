import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import { App } from './App';
import { queryClient } from './lib/query-client';
import { ThemeProvider } from './context/ThemeContext';
import { initTheme } from './lib/theme';
import { AppShellSkeleton } from './components/AppShellSkeleton';

initTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<AppShellSkeleton />}>
          <App />
        </Suspense>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
