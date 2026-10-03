import { ComponentType, lazy, LazyExoticComponent } from 'react';
import { safeSetItem } from './storage';

/**
 * Carga perezosa (lazy loading) con reintento automático y recarga transparente.
 * Evita que el usuario vea pantallas de error ("Algo salió mal") cuando se despliega
 * una nueva versión en producción y los hashes de los archivos JavaScript cambian.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T } | any>,
  pageKey?: string
): LazyExoticComponent<T> {
  return lazy(async () => {
    const refreshKey = `chunk_refreshed_${pageKey || 'generic'}`;
    const lastRefreshTime = sessionStorage.getItem(refreshKey);
    const now = Date.now();
    // Permitir recarga si nunca se ha hecho o si la última ocurrió hace más de 10 segundos
    const canRefresh = !lastRefreshTime || (now - parseInt(lastRefreshTime, 10)) > 10000;

    try {
      const component = await componentImport();
      sessionStorage.removeItem(refreshKey);
      return component.default ? component : { default: component };
    } catch (error: any) {
      const msg = ((error?.message || '') + ' ' + (error?.name || '') + ' ' + String(error || '')).toLowerCase();
      const isChunkOrFetchError =
        msg.includes('fetch dynamically imported module') ||
        msg.includes('importing a module script failed') ||
        msg.includes('chunkloaderror') ||
        msg.includes('loading chunk') ||
        msg.includes('dynamic import') ||
        msg.includes('failed to load resource') ||
        msg.includes('error loading module') ||
        msg.includes('mime type');

      if (isChunkOrFetchError && canRefresh) {
        console.warn(`[AutoRecovery] Actualizando automáticamente assets para ${pageKey || 'módulo'}...`);
        sessionStorage.setItem(refreshKey, now.toString());
        safeSetItem('last_chunk_error_reload', now.toString());
        
        // Recargar la página para descargar los nuevos assets del deploy
        window.location.reload();

        // Devolvemos una promesa permanente para que React Suspense espere
        // la recarga en lugar de disparar el ErrorBoundary
        return new Promise(() => {});
      }

      throw error;
    }
  });
}
