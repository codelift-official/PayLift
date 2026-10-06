import { usePlatformAuthStore } from './platform/store/platformAuthStore';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import * as Sentry from '@sentry/react';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { queryClient } from './lib/queryClient';
import './index.css';

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.2,
    beforeSend: (evt) => {
      // scrub tokens from request headers
      if (evt.request?.headers) {
        delete evt.request.headers.Authorization;
      }
      return evt;
    },
  });
}

// Hydrate platform auth store before mounting
usePlatformAuthStore.getState().hydrate();

async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCKS === 'true') {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'warn' });
  }
}

enableMocking().then(() => {
  // Expose queryClient for Playwright/Cypress test access in mock/dev mode only
  if (import.meta.env.VITE_USE_MOCKS === 'true') {
    (window as any).__queryClient = queryClient;
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
            <Toaster richColors position="top-center" closeButton />
          </BrowserRouter>
        </QueryClientProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
});
