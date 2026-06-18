import React from 'react';
import { Package, Plus, Search, Archive } from 'lucide-react';

export const Inventario: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center">
            <Archive className="text-blue-900 mr-3" size={28} />
            Control de Inventario y Patrimonio
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Gestión y registro de los bienes físicos del club.
          </p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-800 transition-colors shadow-md">
          <Plus size={18} />
          <span>Añadir Bien</span>
        </button>
      </div>

      <div className="bg-white p-12 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-blue-50 text-blue-900 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <Package size={48} />
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2">Módulo en Construcción</h3>
        <p className="text-slate-500 max-w-md">
          El Comité de Inventario y Patrimonio pronto tendrá aquí todas las herramientas necesarias para catalogar y dar seguimiento a los bienes del club.
        </p>
      </div>
    </div>
  );
};
