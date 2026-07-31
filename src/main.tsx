import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupFetchInterceptor } from './utils/apiLogger';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

// Initialize global API fetch interceptor for diagnostic logging
setupFetchInterceptor();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
