import React from 'react';
import { Link } from 'react-router-dom';
import { Gift, Heart, ArrowLeft } from 'lucide-react';

const Donar: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto my-12 p-8 md:p-14 bg-white rounded-[2.5rem] border border-slate-100/90 shadow-2xl text-center space-y-8 animate-in zoom-in-95 duration-500">
      <div className="w-20 h-20 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mx-auto shadow-md">
        <Gift size={40} />
      </div>
      
      <div className="space-y-3">
        <span className="bg-blue-50 text-blue-900 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
          Soporte y Donaciones
        </span>
        <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">Pasarela de Donaciones en Construcción</h1>
        <p className="text-slate-650 text-base max-w-lg mx-auto leading-relaxed font-medium">
          Agradecemos profundamente tu vocación de servicio y generosidad. Estamos trabajando en integrar un canal de donaciones en línea seguro y transparente para apoyar nuestros proyectos en Quetzaltenango.
        </p>
      </div>

      {/* Info card of ongoing projects */}
      <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 text-left space-y-4 max-w-md mx-auto">
        <h3 className="font-bold text-slate-800 flex items-center space-x-2 text-sm">
          <Heart size={16} className="text-red-500" />
          <span>Tus aportes harán posible:</span>
        </h3>
        <ul className="text-xs text-slate-600 space-y-2 font-medium">
          <li>✨ Jornadas de Oftalmología y donación de lentes.</li>
          <li>✨ Campañas médicas pediátricas gratuitas en comunidades rurales.</li>
          <li>✨ Kits de víveres y apoyo alimenticio a adultos mayores.</li>
          <li>✨ Equipamiento y útiles escolares para escuelas locales.</li>
        </ul>
      </div>

      <p className="text-xs text-blue-900/60 font-semibold max-w-sm mx-auto">
        Si deseas realizar una donación de manera inmediata mediante transferencia bancaria u otros medios físicos, contáctanos a:
        <a href="mailto:clubdeleonesquetzaltenango@gmail.com" className="block text-blue-900 hover:underline mt-1 font-bold">
          clubdeleonesquetzaltenango@gmail.com
        </a>
      </p>

      <div className="pt-4">
        <Link 
          to="/" 
          className="inline-flex items-center space-x-2 bg-blue-900 hover:bg-blue-800 text-white font-black px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/10"
        >
          <ArrowLeft size={16} />
          <span>Volver al Inicio</span>
        </Link>
      </div>
    </div>
  );
};

export default Donar;
