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
    const alreadyRefreshed = sessionStorage.getItem(refreshKey) === 'true';

    try {
      const component = await componentImport();
      sessionStorage.removeItem(refreshKey);
      return component.default ? component : { default: component };
    } catch (error: any) {
      const isChunkOrFetchError =
        error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.message?.includes('Loading chunk') ||
        error?.name === 'ChunkLoadError' ||
        error?.message?.includes('importing');

      if (isChunkOrFetchError && !alreadyRefreshed) {
        console.warn(`[AutoRecovery] Actualizando versión para módulo ${pageKey || 'activo'}...`);
        sessionStorage.setItem(refreshKey, 'true');
        safeSetItem('last_chunk_error_reload', Date.now().toString());
        
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
