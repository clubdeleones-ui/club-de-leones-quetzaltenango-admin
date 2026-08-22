import React, { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';
import { AlertTriangle, X as XIcon, CheckCircle2, Copy } from 'lucide-react';

interface ConfirmOptions {
  title?: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface PromptOptions {
  title?: string;
  message?: ReactNode;
  defaultValue?: string;
  okLabel?: string;
  cancelLabel?: string;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

type Pending =
  | { kind: 'confirm'; options: ConfirmOptions; resolve: (value: boolean) => void }
  | { kind: 'prompt'; options: PromptOptions; resolve: (value: string | null) => void }
  | null;

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pending, setPending] = useState<Pending>(null);
  const [promptValue, setPromptValue] = useState('');
  const promptInputRef = useRef<HTMLInputElement | null>(null);

  const close = useCallback(() => {
    setPending(null);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ kind: 'confirm', options, resolve });
    });
  }, []);

  const prompt = useCallback((options: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      setPromptValue(options.defaultValue ?? '');
      setPending({ kind: 'prompt', options, resolve });
    });
  }, []);

  const handleResolve = (value: boolean | string | null) => {
    if (pending) {
      if (pending.kind === 'confirm') {
        pending.resolve(Boolean(value));
      } else {
        pending.resolve(typeof value === 'string' ? value : null);
      }
    }
    close();
  };

  const handleCopyPrompt = () => {
    if (pending && pending.kind === 'prompt' && promptValue) {
      navigator.clipboard
        ?.writeText(promptValue)
        .catch(() => {});
    }
  };

  if (!pending) {
    return (
      <ConfirmContext.Provider value={{ confirm, prompt }}>
        {children}
      </ConfirmContext.Provider>
    );
  }

  const isPrompt = pending.kind === 'prompt';

  return (
    <ConfirmContext.Provider value={{ confirm, prompt }}>
      {children}
      <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => handleResolve(isPrompt ? null : false)}
        />
        <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md animate-in zoom-in-95 fade-in duration-200">
          <div className="flex items-start justify-between px-6 pt-6 pb-2">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              isPrompt
                ? 'bg-blue-100 text-blue-900'
                : pending.kind === 'confirm' && pending.options.danger
                  ? 'bg-red-100 text-red-600'
                  : 'bg-amber-100 text-amber-700'
            }`}>
              {isPrompt ? (
                <Copy size={22} />
              ) : pending.kind === 'confirm' && pending.options.danger ? (
                <AlertTriangle size={22} />
              ) : (
                <CheckCircle2 size={22} />
              )}
            </div>
            <button
              onClick={() => handleResolve(isPrompt ? null : false)}
              className="text-slate-400 hover:text-slate-700 transition-colors"
              aria-label="Cerrar"
            >
              <XIcon size={20} />
            </button>
          </div>
          <div className="px-6 pt-3 pb-6">
            <h3 className="text-lg font-black text-slate-900 mb-1.5">
              {pending.options.title ?? (isPrompt ? 'Copiar enlace' : '¿Estás seguro?')}
            </h3>
            <div className="text-sm text-slate-600 leading-relaxed">{pending.options.message}</div>
            {isPrompt && (
              <div className="mt-4 flex items-center gap-2">
                <input
                  ref={promptInputRef}
                  type="text"
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
                />
                <button
                  onClick={handleCopyPrompt}
                  title="Copiar al portapapeles"
                  className="shrink-0 w-10 h-10 rounded-xl bg-blue-900 text-white hover:bg-blue-800 transition-colors flex items-center justify-center"
                >
                  <Copy size={17} />
                </button>
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleResolve(isPrompt ? null : false)}
                className="flex-1 rounded-2xl border border-slate-300 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {pending.options.cancelLabel ?? 'Cancelar'}
              </button>
              <button
                onClick={() => {
                  if (isPrompt) {
                    handleResolve(promptValue);
                  } else {
                    handleResolve(true);
                  }
                }}
                className={`flex-1 rounded-2xl py-3 text-sm font-extrabold text-white transition-colors shadow-sm ${
                  pending.options.confirmLabel === 'Eliminar' || (pending.options as ConfirmOptions).danger
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-blue-900 hover:bg-blue-800'
                }`}
              >
                {pending.options.confirmLabel ?? (isPrompt ? 'Listo' : 'Confirmar')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};