import { safeSetItem } from './utils/storage';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Error and Chunk-Loading Recovery Handlers
if (typeof window !== 'undefined') {
  // Manejador oficial de Vite para precarga de chunks nuevos tras deploy
  window.addEventListener('vite:preloadError', (event) => {
    console.warn('[Vite] Nuevo despliegue detectado. Actualizando versión...');
    event.preventDefault();
    const lastReload = localStorage.getItem('last_chunk_error_reload');
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload, 10) > 4000) {
      safeSetItem('last_chunk_error_reload', now.toString());
      window.location.reload();
    }
  });

  window.addEventListener('error', (event) => {
    const message = event.message || '';
    const error = event.error || {};
    const target = event.target as any;
    
    const isChunkError = 
      message.includes('Failed to fetch dynamically imported module') ||
      error.name === 'ChunkLoadError' ||
      (target && target.tagName === 'SCRIPT' && target.src && target.src.includes('/assets/'));
      
    if (isChunkError) {
      event.preventDefault();
      console.warn('[AutoRecovery] Recargando para obtener la versión más reciente...');
      const lastReload = localStorage.getItem('last_chunk_error_reload');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 4000) {
        safeSetItem('last_chunk_error_reload', now.toString());
        window.location.reload();
      }
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason || {};
    const message = typeof reason === 'string' ? reason : (reason.message || '');
    
    // 1. Silenciar error benigno originado por extensiones de navegador (Chrome/Firefox extensions)
    if (message.includes('message channel closed before a response was received') || 
        message.includes('A listener indicated an asynchronous response')) {
      event.preventDefault();
      return;
    }

    // 2. Manejar chunks dinámicos
    const isChunkError = 
      message.includes('Failed to fetch dynamically imported module') || 
      message.includes('Loading chunk') ||
      reason.name === 'ChunkLoadError';
      
    if (isChunkError) {
      event.preventDefault();
      console.warn('[AutoRecovery] Actualizando chunk...');
      const lastReload = localStorage.getItem('last_chunk_error_reload');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 4000) {
        safeSetItem('last_chunk_error_reload', now.toString());
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
