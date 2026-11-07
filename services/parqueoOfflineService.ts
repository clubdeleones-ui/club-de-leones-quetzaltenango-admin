import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { firebaseService } from './firebaseService';
import { VehiculoParqueo, RegistroBano } from '../types';

export interface PendingSyncItem {
  id: string;
  tipo: 'ingreso' | 'salida' | 'bano';
  data: VehiculoParqueo | any;
  timestamp: string;
}

const STORAGE_KEY = 'CLQ_PARQUEO_OFFLINE_QUEUE';

export const parqueoOfflineService = {
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  getPendingQueue(): PendingSyncItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.error('Error leyendo cola offline de parqueo:', e);
      return [];
    }
  },

  addToQueue(id: string, tipo: 'ingreso' | 'salida' | 'bano', data: any): void {
    if (typeof window === 'undefined') return;
    try {
      const queue = this.getPendingQueue();
      // Si ya existe un registro con el mismo id y tipo, actualizarlo en lugar de duplicar
      const existingIdx = queue.findIndex(item => item.id === id && item.tipo === tipo);
      const newItem: PendingSyncItem = {
        id,
        tipo,
        data,
        timestamp: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        queue[existingIdx] = newItem;
      } else {
        queue.push(newItem);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Error guardando en cola offline:', e);
    }
  },

  removeFromQueue(id: string, tipo: 'ingreso' | 'salida' | 'bano'): void {
    if (typeof window === 'undefined') return;
    try {
      const queue = this.getPendingQueue();
      const filtered = queue.filter(item => !(item.id === id && item.tipo === tipo));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('Error removiendo item de cola offline:', e);
    }
  },

  clearQueue(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Error limpiando cola offline:', e);
    }
  },

  /**
   * Intenta sincronizar todos los registros pendientes con Firestore.
   * Retorna el número de registros sincronizados exitosamente y cuántos fallaron.
   */
  async syncQueue(): Promise<{ syncedCount: number; failedCount: number }> {
    const queue = this.getPendingQueue();
    if (queue.length === 0) {
      return { syncedCount: 0, failedCount: 0 };
    }

    let syncedCount = 0;
    let failedCount = 0;
    const remainingQueue: PendingSyncItem[] = [];

    for (const item of queue) {
      try {
        if (item.tipo === 'ingreso' || item.tipo === 'salida') {
          await firebaseService.saveVehiculoParqueo(item.data);
          syncedCount++;
        } else if (item.tipo === 'bano') {
          await setDoc(doc(db, 'banos', item.id), item.data, { merge: true });
          syncedCount++;
        }
      } catch (err) {
        console.warn(`Error sincronizando item ${item.id} (${item.tipo}):`, err);
        failedCount++;
        remainingQueue.push(item);
      }
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingQueue));
    } catch (e) {
      console.error('Error actualizando cola offline tras sync:', e);
    }

    return { syncedCount, failedCount };
  }
};
