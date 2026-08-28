import { safeSetItem } from '../utils/storage';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  props: Props;

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const isChunkError = 
      error.message?.includes('Failed to fetch dynamically imported module') ||
      error.name === 'ChunkLoadError' ||
      error.message?.includes('chunk') ||
      error.message?.includes('dynamic import');
      
    if (isChunkError) {
      console.warn('[ErrorBoundary] Actualizando assets del despliegue más reciente...');
      const lastReload = localStorage.getItem('last_chunk_error_reload');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 6000) {
        safeSetItem('last_chunk_error_reload', now.toString());
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    } else {
      console.error('Uncaught application error:', error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      const isChunkError = 
        this.state.error?.message?.includes('Failed to fetch dynamically imported module') ||
        this.state.error?.name === 'ChunkLoadError' ||
        this.state.error?.message?.includes('chunk') ||
        this.state.error?.message?.includes('dynamic import');

      // Si es un error de chunk o versión nueva, mostramos una pantalla de transición elegante y limpia
      if (isChunkError) {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-900/10 flex items-center justify-center mb-4">
              <div className="w-10 h-10 border-3 border-blue-900 border-t-amber-500 rounded-full animate-spin"></div>
            </div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight">Actualizando sistema...</h2>
            <p className="text-xs text-slate-500 mt-1">Cargando la versión más reciente del Club de Leones.</p>
          </div>
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">Algo salió mal</h1>
            <p className="text-slate-500 mb-6 text-sm">
              Ha ocurrido un detalle inesperado en la interfaz. Por favor, recarga la página para continuar.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-xl font-bold transition-all w-full shadow-md cursor-pointer"
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
