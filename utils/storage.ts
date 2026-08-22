// Helper seguro de almacenamiento local: evita crashes por cuota/privacidad.
export function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e: any) {
    if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
      console.warn(`LocalStorage quota exceeded escribiendo "${key}". Se desaloja caché temporal e se intenta de nuevo.`);
      const nonEssentialKeys = ['club_leones_galeria', 'club_leones_linea_tiempo', 'club_leones_requerimientos'];
      nonEssentialKeys.forEach(k => {
        if (k !== key) {
          try { localStorage.removeItem(k); } catch (_) {}
        }
      });
      try {
        localStorage.setItem(key, value);
      } catch (retryErr) {
        console.error(`Falló escribir "${key}" incluso tras desalojar:`, retryErr);
      }
    } else {
      console.error(`Error guardando en localStorage para "${key}":`, e);
    }
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error(`Error eliminando "${key}" de localStorage:`, e);
  }
}

export function safeGetItem(key: string, fallback: string | null = null): string | null {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch (e) {
    console.error(`Error leyendo "${key}" de localStorage:`, e);
    return fallback;
  }
}