import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { getQueryClient } from './lib/queryClient';
import './index.css';

// Get optimized query client instance
const queryClient = getQueryClient();

// Register service worker for PWA (production only)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('SW registered:', registration.scope);
      },
      (error) => {
        console.log('SW registration failed:', error);
      }
    );
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'white',
              color: '#1f2937',
              padding: '16px',
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
              style: {
                background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                borderLeft: '4px solid #10b981',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
              style: {
                background: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)',
                borderLeft: '4px solid #ef4444',
              },
            },
            loading: {
              iconTheme: {
                primary: '#6366f1',
                secondary: '#ffffff',
              },
              style: {
                background: 'linear-gradient(135deg, #ffffff 0%, #eef2ff 100%)',
                borderLeft: '4px solid #6366f1',
              },
            },
          }}
        />
      </BrowserRouter>
      {/* Only show devtools in development */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} position="bottom" />}
    </QueryClientProvider>
  </React.StrictMode>
);
