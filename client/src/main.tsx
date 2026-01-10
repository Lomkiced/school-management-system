import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import './index.css';

// === GLOBAL CRASH LISTENER ===
// If the app dies before React starts, this will show the error.
window.addEventListener('error', (event) => {
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `
      <div style="padding: 2rem; color: #ef4444; font-family: sans-serif; text-align: center;">
        <h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">Critical Startup Error</h1>
        <p>The application failed to render. Please check the console.</p>
        <pre style="background: #f1f5f9; padding: 1rem; border-radius: 0.5rem; text-align: left; overflow: auto; margin-top: 1rem;">
          ${event.message}
        </pre>
        <button onclick="localStorage.clear(); window.location.reload()" style="margin-top: 20px; padding: 10px 20px; cursor: pointer; background: #333; color: #fff; border: none; border-radius: 4px;">
          Clear Cache & Retry
        </button>
      </div>
    `;
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Top-level Safety Net */}
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);