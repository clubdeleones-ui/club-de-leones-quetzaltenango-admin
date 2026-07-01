import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Error and Chunk-Loading Recovery Handlers
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const message = event.message || '';
    const error = event.error || {};
    const target = event.target as any;
    
    const isChunkError = 
      message.includes('Failed to fetch dynamically imported module') ||
      error.name === 'ChunkLoadError' ||
      (target && target.tagName === 'SCRIPT' && target.src && target.src.includes('/assets/'));
      
    if (isChunkError) {
      console.warn('Recovering from chunk loading error. Reloading page...');
      const lastReload = localStorage.getItem('last_chunk_error_reload');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        localStorage.setItem('last_chunk_error_reload', now.toString());
        window.location.reload();
      }
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason || {};
    const message = reason.message || '';
    
    const isChunkError = 
      message.includes('Failed to fetch dynamically imported module') || 
      message.includes('Loading chunk') ||
      reason.name === 'ChunkLoadError';
      
    if (isChunkError) {
      console.warn('Recovering from unhandled chunk rejection. Reloading page...');
      const lastReload = localStorage.getItem('last_chunk_error_reload');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        localStorage.setItem('last_chunk_error_reload', now.toString());
        window.location.reload();
      }
    }
  });
}


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
