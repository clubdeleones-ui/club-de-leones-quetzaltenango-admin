import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AlertTriangle, Info, HelpCircle, X } from 'lucide-react';

interface AlertConfig {
  title: string;
  message: string;
  resolve: () => void;
}

interface ConfirmConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  resolve: (value: boolean) => void;
}

interface ModalContextType {
  showAlert: (title: string, message: string) => Promise<void>;
  showConfirm: (
    title: string,
    message: string,
    options?: { confirmText?: string; cancelText?: string; type?: 'danger' | 'warning' | 'info' }
  ) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(null);

  const showAlert = (title: string, message: string): Promise<void> => {
    return new Promise((resolve) => {
      setAlertConfig({ title, message, resolve });
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    options?: { confirmText?: string; cancelText?: string; type?: 'danger' | 'warning' | 'info' }
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmConfig({
        title,
        message,
        confirmText: options?.confirmText || 'Confirmar',
        cancelText: options?.cancelText || 'Cancelar',
        type: options?.type || 'warning',
        resolve,
      });
    });
  };

  const handleAlertClose = () => {
    if (alertConfig) {
      alertConfig.resolve();
      setAlertConfig(null);
    }
  };

  const handleConfirmAction = (value: boolean) => {
    if (confirmConfig) {
      confirmConfig.resolve(value);
      setConfirmConfig(null);
    }
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* Alert Modal */}
      {alertConfig && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 relative text-left">
            <button 
              onClick={handleAlertClose}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              <X size={20} />
            </button>
            <div className="flex items-center space-x-4 mb-5 text-blue-900">
              <div className="bg-blue-50 p-3 rounded-full border border-blue-100">
                <Info size={24} />
              </div>
              <h3 className="text-xl font-black leading-tight">{alertConfig.title}</h3>
            </div>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed whitespace-pre-line">
              {alertConfig.message}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAlertClose}
                className="bg-blue-900 hover:bg-blue-800 text-white font-black px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 text-xs w-full sm:w-auto cursor-pointer"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmConfig && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 relative text-left">
            <button 
              onClick={() => handleConfirmAction(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              <X size={20} />
            </button>
            <div className={`flex items-center space-x-4 mb-5 ${
              confirmConfig.type === 'danger' ? 'text-red-600' :
              confirmConfig.type === 'info' ? 'text-blue-900' :
              'text-amber-600'
            }`}>
              <div className={`p-3 rounded-full border ${
                confirmConfig.type === 'danger' ? 'bg-red-50 border-red-100' :
                confirmConfig.type === 'info' ? 'bg-blue-50 border-blue-100' :
                'bg-amber-50 border-amber-100'
              }`}>
                {confirmConfig.type === 'danger' ? <AlertTriangle size={24} /> :
                 confirmConfig.type === 'info' ? <Info size={24} /> :
                 <HelpCircle size={24} />}
              </div>
              <h3 className="text-xl font-black leading-tight">{confirmConfig.title}</h3>
            </div>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed whitespace-pre-line">
              {confirmConfig.message}
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={() => handleConfirmAction(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-3 rounded-xl transition-colors text-xs cursor-pointer w-full sm:w-auto"
              >
                {confirmConfig.cancelText}
              </button>
              <button
                type="button"
                onClick={() => handleConfirmAction(true)}
                className={`text-white font-black px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 text-xs cursor-pointer w-full sm:w-auto ${
                  confirmConfig.type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/10' :
                  confirmConfig.type === 'info' ? 'bg-blue-900 hover:bg-blue-800 shadow-blue-900/10' :
                  'bg-amber-500 hover:bg-amber-600 shadow-amber-500/10'
                }`}
              >
                {confirmConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
