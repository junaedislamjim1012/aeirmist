import { ErrorBoundary } from './components/ErrorBoundary';

// Register Service Worker for PWA/TWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    try {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('Service Worker registered successfully with scope:', registration.scope);
        })
        .catch((error) => {
          console.warn('Service Worker registration failed:', error);
        });
    } catch (error) {
      console.warn('Error during Service Worker registration setup:', error);
    }
  });
}

// Safe Storage Polyfill for iFrame / Sandbox Environments
(function() {
  if (typeof window === 'undefined') return;

  function createInMemoryStorage() {
    let store: Record<string, string> = {};
    return {
      getItem(key: string) {
        return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
      },
      setItem(key: string, value: string) {
        store[key] = String(value);
      },
      removeItem(key: string) {
        delete store[key];
      },
      clear() {
        store = {};
      },
      get length() {
        return Object.keys(store).length;
      },
      key(index: number) {
        return Object.keys(store)[index] || null;
      }
    };
  }

  // Test and polyfill localStorage
  let localCacheStore: any = null;
  function getLocalCache() {
    if (!localCacheStore) {
      localCacheStore = createInMemoryStorage();
    }
    return localCacheStore;
  }

  try {
    const test = window.localStorage;
    const testKey = '__storage_test__';
    test.setItem(testKey, testKey);
    test.removeItem(testKey);
  } catch (e) {
    console.warn("[Storage Polyfill] localStorage is blocked or throws error. Activating safe in-memory fallback.", e);
    try {
      Object.defineProperty(window, 'localStorage', {
        value: getLocalCache(),
        writable: true,
        configurable: true
      });
    } catch (err) {
      try {
        Object.defineProperty(Window.prototype, 'localStorage', {
          get: function() {
            return getLocalCache();
          },
          configurable: true
        });
      } catch (err2) {
        console.error("[Storage Polyfill] Failed to polyfill localStorage on Window.prototype.", err2);
      }
    }
  }

  // Test and polyfill sessionStorage
  let sessionCacheStore: any = null;
  function getSessionCache() {
    if (!sessionCacheStore) {
      sessionCacheStore = createInMemoryStorage();
    }
    return sessionCacheStore;
  }

  try {
    const test = window.sessionStorage;
    const testKey = '__session_test__';
    test.setItem(testKey, testKey);
    test.removeItem(testKey);
  } catch (e) {
    console.warn("[Storage Polyfill] sessionStorage is blocked or throws error. Activating safe in-memory fallback.", e);
    try {
      Object.defineProperty(window, 'sessionStorage', {
        value: getSessionCache(),
        writable: true,
        configurable: true
      });
    } catch (err) {
      try {
        Object.defineProperty(Window.prototype, 'sessionStorage', {
          get: function() {
            return getSessionCache();
          },
          configurable: true
        });
      } catch (err2) {
        console.error("[Storage Polyfill] Failed to polyfill sessionStorage on Window.prototype.", err2);
      }
    }
  }
})();

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {HelmetProvider} from 'react-helmet-async';
import App from './App.tsx';
import { OfflineBanner } from './components/ui/OfflineBanner.tsx';
import './index.css';

// Centralized Error Handling & Vite HMR Noise Silence
if (typeof window !== 'undefined') {
  // Silence typical Vite HMR connection errors in the console which are expected in this env
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = (...args) => {
    const errorStr = args.map(arg => String(arg)).join(' ');
    
    // Suppress typical environment noise or firestore quota errors from displaying heavily
    if (
      errorStr.includes('[vite] failed to connect to websocket') ||
      errorStr.includes('WebSocket closed without opened') ||
      errorStr.includes('quota-exceeded') ||
      errorStr.includes('Quota limit exceeded') ||
      errorStr.includes('resource-exhausted') ||
      errorStr.includes('Free daily write units per project')
    ) {
      // Log as a subtle warn/info instead of error to prevent blocking
      originalWarn.apply(console, ["[Suppressed Firestore Quota/HMR Noise]", ...args]);
      return;
    }
    
    originalError.apply(console, args);
  };

  console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && (
      args[0].includes('[vite] failed to connect')
    )) {
      return; // Suppress noise
    }
    originalWarn.apply(console, args);
  };

  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('Cannot set property fetch of #<Window>')) {
      console.warn('Suppressed environmental fetch patch error.');
      event.preventDefault();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    // Gracefully handle quota or network failures
    if (event.reason && (
      event.reason.code === 'quota-exceeded' || 
      String(event.reason).includes('Quota')
    )) {
      console.warn('System under heavy load. Pausing background tasks.');
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <OfflineBanner />
        <App />
      </ErrorBoundary>
    </HelmetProvider>
  </StrictMode>,
);
