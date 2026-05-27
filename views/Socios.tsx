import React, { useState, useEffect } from 'react';
import { MOCK_SOCIOS } from '../constants';
import { Socio, PropuestaSocio } from '../types';
import { 
  Mail, 
  Calendar, 
  Award, 
  UserCheck, 
  Heart, 
  ShieldCheck, 
  Users,
  Briefcase,
  ThumbsUp,
  Clock
} from 'lucide-react';

const Socios: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'activos' | 'propuestos'>('activos');
  
  // Load members from localStorage or fallback to mock
  const [socios, setSocios] = useState<Socio[]>(() => {
    const local = localStorage.getItem('club_leones_socios_v2');
    if (local) return JSON.parse(local);
    return MOCK_SOCIOS;
  });

  // Load proposals from localStorage
  const [propuestas, setPropuestas] = useState<PropuestaSocio[]>(() => {
    const local = localStorage.getItem('club_leones_propuestas');
    return local ? JSON.parse(local) : [];
  });

  // Filter only pending proposals
  const propuestasPendientes = propuestas.filter(p => p.estado === 'Pendiente');

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 md:px-8 py-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-blue-900 tracking-tight">Directorio de Socios</h1>
          <p className="text-lg text-slate-700 mt-2 font-medium">
            Conoce a los miembros activos que hacen posible nuestro servicio y a los nuevos candidatos en evaluación.
          </p>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('activos')}
          className={`flex items-center space-x-3 px-8 py-4 font-bold text-lg border-b-4 transition-all ${
            activeTab === 'activos'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-650 hover:text-slate-850'
          }`}
        >
          <Users size={20} />
          <span>Socios Activos ({socios.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('propuestos')}
          className={`flex items-center space-x-3 px-8 py-4 font-bold text-lg border-b-4 transition-all relative ${
            activeTab === 'propuestos'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-650 hover:text-slate-850'
          }`}
        >
          <UserCheck size={20} />
          <span>Candidatos Propuestos</span>
          {propuestasPendientes.length > 0 && (
            <span className="absolute top-3 right-0 bg-yellow-500 text-blue-900 text-xs font-black w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
              {propuestasPendientes.length}
            </span>
          )}
        </button>
      </div>

      {/* Content Section */}
      <div className="animate-in fade-in-50 duration-300">
        {activeTab === 'activos' ? (
          /* ACTIVE MEMBERS LIST */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {socios.map((socio) => (
              <div 
                key={socio.id} 
                className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-start space-x-6 hover:shadow-xl hover:border-slate-200 transition-all duration-300 group"
              >
                <img 
                  src={socio.foto} 
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-slate-50 shadow-inner group-hover:scale-105 transition-transform duration-300" 
                  alt={socio.nombre} 
                />
                <div className="space-y-3 flex-grow min-w-0">
                  <div>
                    <h3 className="font-extrabold text-xl text-slate-900 leading-tight truncate">{socio.nombre}</h3>
                    <span className={`inline-block text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full mt-1.5 ${
                      socio.puesto 
                        ? 'bg-yellow-500 text-blue-900' 
                        : 'bg-blue-50 text-blue-800'
                    }`}>
                      {socio.puesto || 'Socio Regular'}
                    </span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center text-slate-700 text-sm truncate font-medium">
                      <Mail size={14} className="mr-2.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{socio.correo}</span>
                    </div>
                    <div className="flex items-center text-slate-700 text-sm font-medium">
                      <Calendar size={14} className="mr-2.5 text-slate-500 flex-shrink-0" />
                      <span>Ingreso: {socio.fechaIngreso}</span>
                    </div>
                    {socio.puesto && (
                      <div className="flex items-center text-blue-900 text-sm font-bold bg-blue-50/50 px-3 py-1.5 rounded-xl w-fit">
                        <Award size={14} className="mr-2 text-yellow-500" />
                        Junta Directiva
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* PROPOSED MEMBERS LIST */
          <div className="space-y-8">
            {/* Note banner */}
            <div className="bg-yellow-50 border border-yellow-200/60 rounded-3xl p-6 flex items-start space-x-4 max-w-4xl">
              <Clock className="text-yellow-750 flex-shrink-0 mt-0.5" size={24} />
              <div>
                <h4 className="font-bold text-yellow-950 text-lg">Candidaturas en Proceso de Evaluación</h4>
                <p className="text-yellow-900 text-sm mt-1 leading-relaxed font-medium">
                  Las personas listadas a continuación han sido propuestas por socios activos del club debido a su vocación de servicio y calidades humanas. Sus propuestas se encuentran actualmente bajo revisión por parte de la Junta Directiva para su formalización y aprobación.
                </p>
              </div>
            </div>

            {propuestasPendientes.length === 0 ? (
              <div className="bg-white rounded-[2rem] border border-slate-100 p-16 text-center max-w-3xl">
                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-500">
                  <UserCheck size={36} />
                </div>
                <h3 className="text-2xl font-black text-slate-800">No hay propuestas pendientes</h3>
                <p className="text-slate-750 mt-2 max-w-md mx-auto font-medium">
                  Actualmente no existen candidaturas propuestas en evaluación. Si conoces a alguien idóneo para ser parte del club, puedes postularlo usando el formulario público.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {propuestasPendientes.map((propuesta) => (
                  <div 
                    key={propuesta.id} 
                    className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:border-slate-200 transition-all duration-300 flex flex-col space-y-6"
                  >
                    {/* Header info */}
                    <div className="flex items-start space-x-6">
                      <img 
                        src={propuesta.fotoCandidato || 'https://picsum.photos/seed/' + propuesta.id + '/200/200'} 
                        className="w-24 h-24 rounded-3xl object-cover border-4 border-slate-50 shadow-sm flex-shrink-0" 
                        alt={propuesta.nombreCandidato} 
                      />
                      <div className="space-y-2 min-w-0">
                        <span className="bg-yellow-50 text-yellow-800 border border-yellow-250 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                          En Evaluación
                        </span>
                        <h3 className="font-extrabold text-2xl text-slate-900 leading-snug truncate mt-1">{propuesta.nombreCandidato}</h3>
                        <div className="flex items-center text-slate-700 text-sm font-medium">
                          <Briefcase size={14} className="mr-2 text-slate-500 flex-shrink-0" />
                          <span className="truncate">{propuesta.profesionCandidato}</span>
                        </div>
                      </div>
                    </div>

                    {/* Proponent info */}
                    <div className="bg-slate-50/80 rounded-2xl p-4 flex items-center justify-between border border-slate-100">
                      <div className="flex items-center space-x-2 text-sm text-slate-750">
                        <ShieldCheck size={16} className="text-blue-900" />
                        <span>Propuesto por el socio activo:</span>
                      </div>
                      <span className="font-extrabold text-sm text-blue-900 bg-blue-50 px-3 py-1.5 rounded-xl">
                        {propuesta.proponente}
                      </span>
                    </div>

                    {/* Qualities / characteristics tags */}
                    <div className="space-y-3">
                      <h4 className="font-extrabold text-base text-slate-800 uppercase tracking-widest flex items-center">
                        <ThumbsUp size={14} className="mr-2 text-slate-500" />
                        Cualidades Destacadas
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {propuesta.caracteristicas.map((carac, index) => (
                          <span 
                            key={index} 
                            className="bg-blue-50/50 hover:bg-blue-50 border border-blue-100 text-blue-950 font-semibold px-3 py-1 rounded-xl text-sm transition-colors"
                          >
                            ✨ {carac}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Justification details */}
                    <div className="space-y-3 pt-2 border-t border-slate-100 flex-grow">
                      <div>
                        <h4 className="font-bold text-sm text-slate-650 uppercase tracking-wider">Motivo de Nominación</h4>
                        <p className="text-slate-800 text-sm mt-1 leading-relaxed italic bg-slate-50/30 p-3 rounded-2xl border border-slate-100/50 font-medium">
                          "{propuesta.motivoPropuesta}"
                        </p>
                      </div>
                      {propuesta.porQueBuenLeon && (
                        <div>
                          <h4 className="font-bold text-sm text-slate-650 uppercase tracking-wider mt-3">¿Por qué sería un buen León?</h4>
                          <p className="text-slate-800 text-sm mt-1 leading-relaxed italic bg-slate-50/30 p-3 rounded-2xl border border-slate-100/50 font-medium">
                            "{propuesta.porQueBuenLeon}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Socios;
