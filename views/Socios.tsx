
import React from 'react';
import { MOCK_SOCIOS } from '../constants';
import { Mail, Calendar, Award } from 'lucide-react';

const Socios: React.FC = () => {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl">Directorio de Socios Activos</h1>
        <p className="text-slate-500">Conoce a los miembros que hacen posible nuestro servicio.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_SOCIOS.map((socio) => (
          <div key={socio.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-start space-x-6 hover:shadow-lg transition-all">
            <img src={socio.foto} className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-50" alt={socio.nombre} />
            <div className="space-y-2 flex-grow">
              <div>
                <h3 className="font-bold text-lg leading-tight">{socio.nombre}</h3>
                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">{socio.puesto || 'Socio'}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center text-slate-500 text-xs">
                  <Mail size={12} className="mr-2" />
                  {socio.correo}
                </div>
                <div className="flex items-center text-slate-500 text-xs">
                  <Calendar size={12} className="mr-2" />
                  Desde: {socio.fechaIngreso}
                </div>
                {socio.puesto && (
                  <div className="flex items-center text-slate-500 text-xs">
                    <Award size={12} className="mr-2 text-yellow-500" />
                    Junta Directiva
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Socios;
