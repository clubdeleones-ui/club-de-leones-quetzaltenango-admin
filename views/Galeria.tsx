
import React from 'react';
import { MOCK_GALERIA } from '../constants';
import { Camera, Calendar } from 'lucide-react';

const Galeria: React.FC = () => {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="text-center max-w-3xl mx-auto">
        <div className="bg-yellow-100/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Camera className="text-blue-900 w-10 h-10" />
        </div>
        <h1 className="text-5xl font-extrabold text-blue-900">Galería Histórica</h1>
        <p className="text-xl text-slate-500 mt-4 leading-relaxed italic">
          Preservando el legado de servicio y hermandad del <span className="font-bold text-blue-900">Club de Leones Quetzaltenango</span> a través del tiempo.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {MOCK_GALERIA.map((item) => (
          <div key={item.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all">
            <div className="relative h-64 overflow-hidden">
              <img
                src={item.url}
                alt={item.titulo}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-4 right-4 bg-blue-900/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs flex items-center">
                <Calendar size={12} className="mr-1" />
                {item.fecha}
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2 flex items-center">
                <Camera size={18} className="mr-2 text-yellow-500" />
                {item.titulo}
              </h3>
              <p className="text-slate-600 text-sm">{item.descripcion}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="bg-slate-100 rounded-3xl p-12 text-center border-2 border-dashed border-slate-300">
        <p className="text-slate-400 italic">¿Tienes fotos antiguas del Club? Compártelas con Secretaría para incluirlas en el archivo digital.</p>
      </section>
    </div>
  );
};

export default Galeria;
