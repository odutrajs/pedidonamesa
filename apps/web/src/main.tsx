import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import { App } from './App';
import { queryClient } from './lib/query-client';

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center text-stone-500">
    Carregando...
  </div>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<PageLoader />}>
        <App />
      </Suspense>
    </QueryClientProvider>
  </StrictMode>,
);
