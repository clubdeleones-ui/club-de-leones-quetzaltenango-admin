import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useClubData } from '../context/ClubDataContext';
import { Socio, UserRole } from '../types';
import { 
  Mail, 
  Calendar, 
  Award, 
  Users,
  Phone,
  Building,
  X,
  UserCheck
} from 'lucide-react';

interface SociosProps {
  user?: Socio | null;
}

const Socios: React.FC<SociosProps> = ({ user }) => {
  const { socios, rolesConfig } = useClubData();

  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string } | null>(null);

  const sociosActivos = React.useMemo(() => {
    const rolesOrderMap: Record<string, number> = {};
    rolesConfig.forEach((r, idx) => {
      rolesOrderMap[r.id] = r.orden !== undefined ? r.orden : idx;
    });

    return [...socios]
      .filter(s => s.estatus !== 'Inactive')
      .sort((a, b) => {
        const orderA = rolesOrderMap[a.rol || ''] ?? 999;
        const orderB = rolesOrderMap[b.rol || ''] ?? 999;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return a.nombre.localeCompare(b.nombre);
      });
  }, [socios, rolesConfig]);

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 md:px-8 py-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">Directorio de Socios</h1>
          <p className="text-base text-slate-750 mt-1 font-medium">
            Conoce a los miembros activos que hacen posible nuestro servicio.
          </p>
        </div>
        
        {/* Enlace para proponer candidato (solo socios y roles superiores, no donante ni guest) */}
        {user && user.rol !== UserRole.DONANTE && user.rol !== UserRole.GUEST && (
          <Link 
            to="/proponer-socio" 
            className="bg-blue-900 hover:bg-blue-800 text-white px-5 py-3 rounded-2xl text-sm font-black transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center space-x-2"
          >
            <UserCheck size={18} className="text-yellow-400" />
            <span>Proponer Candidato</span>
          </Link>
        )}
      </header>

      {/* ACTIVE MEMBERS LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-10 pt-4">
        {sociosActivos.map((socio) => (
          <div 
            key={socio.id} 
            className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl border border-slate-100 hover:border-blue-900/10 transition-all duration-500 flex flex-col relative group hover:-translate-y-2"
          >
            {/* Cabecera decorativa */}
            <div className="h-28 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 relative">
              {/* Patrón de líneas decorativas o círculos difusos en el fondo */}
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-300 via-transparent to-transparent"></div>
              
              {/* Badge de Estatus flotante premium */}
              <div className="absolute top-4 right-4">
                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center space-x-1.5 border backdrop-blur-md ${
                  socio.estatus === 'Pending' 
                    ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' 
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    socio.estatus === 'Pending' ? 'bg-yellow-500 animate-pulse' : 'bg-emerald-400 animate-pulse'
                  }`} />
                  <span>{socio.estatus === 'Pending' ? 'Pendiente' : 'Activo'}</span>
                </span>
              </div>
            </div>

            {/* Avatar y Contenido */}
            <div className="px-6 pb-8 pt-14 flex flex-col flex-grow items-center text-center relative">
              {/* Contenedor del Avatar flotando sobre la cabecera */}
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                <div className="relative">
                  {/* Anillo de color según jerarquía */}
                  <img 
                    src={socio.foto || `https://picsum.photos/seed/${socio.nombre}/200/200`} 
                    className={`w-24 h-24 rounded-full object-cover border-4 border-white shadow-xl group-hover:scale-105 transition-all duration-500 cursor-zoom-in ${
                      socio.rol === 'SUPER_ADMIN' || socio.rol === 'TESORERO' || socio.rol === 'SECRETARIO'
                        ? 'ring-4 ring-amber-400/80 ring-offset-2'
                        : 'ring-4 ring-blue-900/60 ring-offset-2'
                    }`} 
                    alt={socio.nombre}
                    onClick={() => setSelectedPhoto({
                      url: socio.foto || `https://picsum.photos/seed/${socio.nombre}/200/200`,
                      title: socio.nombre
                    })}
                  />
                  <div className="absolute bottom-0 right-0 bg-blue-950 text-amber-400 p-1.5 rounded-full border-2 border-white shadow-md">
                    <Award size={14} />
                  </div>
                </div>
              </div>

              {/* Nombre y Cargo */}
              <div className="space-y-2.5 w-full">
                <h3 className="font-bold text-lg text-slate-900 tracking-tight leading-snug group-hover:text-blue-950 transition-colors">
                  {socio.nombre}
                </h3>
                
                {/* Badge de Puesto + Código */}
                <div className="flex flex-col items-center gap-1.5">
                  <span className={`text-xs font-semibold uppercase tracking-wider px-3.5 py-1 rounded-full border ${
                    socio.rol === 'SUPER_ADMIN' || socio.rol === 'TESORERO' || socio.rol === 'SECRETARIO'
                      ? 'bg-amber-50 text-amber-800 border-amber-200/70'
                      : socio.rol === 'ASESOR_SERVICIOS' || socio.rol === 'PRESIDENTE_AFILIACION'
                      ? 'bg-indigo-50 text-indigo-800 border-indigo-200/70'
                      : 'bg-slate-50 text-slate-700 border-slate-200/70'
                  }`}>
                    {socio.puesto || 'Socio Regular'}
                  </span>
                  {(socio.puestosAdicionales || []).map((pa, pi) => (
                    <span key={pi} className="text-[11px] font-bold text-amber-800 bg-amber-50 px-3 py-0.5 rounded-full border border-amber-200">
                      + {pa}
                    </span>
                  ))}
                  {socio.codigoSocio && (
                    <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                      # {socio.codigoSocio}
                    </span>
                  )}
                </div>
                
                {/* Caja de Datos Premium */}
                <div className="w-full bg-slate-50/55 rounded-2xl p-4 border border-slate-100/90 text-left text-sm font-medium text-slate-700 space-y-3 mt-5">
                  {/* Club */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100/60 gap-1">
                    <span className="text-slate-450 flex items-center space-x-1.5 flex-shrink-0">
                      <Building size={16} className="text-slate-400 flex-shrink-0" />
                      <span>Club</span>
                    </span>
                    <span className="font-bold text-slate-800 text-left sm:text-right break-words w-full sm:w-auto">{socio.club || 'QUETZALTENANGO'}</span>
                  </div>

                  {/* Correo */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100/60 gap-1">
                    <span className="text-slate-450 flex items-center space-x-1.5 flex-shrink-0">
                      <Mail size={16} className="text-slate-400 flex-shrink-0" />
                      <span>Correo</span>
                    </span>
                    {socio.correo ? (
                      <a 
                        href={`mailto:${socio.correo}`}
                        className="font-bold text-blue-900 hover:text-blue-700 break-all text-left sm:text-right transition-colors w-full sm:w-auto"
                        title={socio.correo}
                      >
                        {socio.correo}
                      </a>
                    ) : (
                      <span className="text-slate-450 font-normal italic text-left sm:text-right w-full sm:w-auto">Sin correo registrado</span>
                    )}
                  </div>

                  {/* Teléfono */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100/60 gap-1">
                    <span className="text-slate-450 flex items-center space-x-1.5 flex-shrink-0">
                      <Phone size={16} className="text-slate-400 flex-shrink-0" />
                      <span>Teléfono</span>
                    </span>
                    {socio.telefono && socio.telefono !== 'Sin teléfono' && socio.telefono !== '' ? (
                      <a 
                        href={`tel:${socio.telefono}`}
                        className="font-bold text-slate-800 hover:text-blue-900 transition-colors break-words text-left sm:text-right w-full sm:w-auto"
                      >
                        {socio.telefono}
                      </a>
                    ) : (
                      <span className="text-slate-450 font-normal italic text-left sm:text-right w-full sm:w-auto">Sin teléfono registrado</span>
                    )}
                  </div>

                  {/* Gestión / Período */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-slate-450 flex items-center space-x-1.5 flex-shrink-0">
                      <Calendar size={16} className="text-slate-400 flex-shrink-0" />
                      <span>Gestión</span>
                    </span>
                    <span className="font-bold text-slate-800 text-left sm:text-right break-words w-full sm:w-auto">
                      {socio.fechaIngreso} al {socio.fechaFin && socio.fechaFin !== 'Sin fecha fin' ? socio.fechaFin : 'Indefinido'}
                    </span>
                  </div>
                </div>

                {/* Membresía / Solvencia */}
                <div className="flex items-center justify-between px-2 pt-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
                  <span>Membresía Financiera</span>
                  <span className={`flex items-center space-x-1 ${
                    socio.estadoCuotas === 'Al día' 
                      ? 'text-emerald-600' 
                      : socio.estadoCuotas === 'Pendiente'
                      ? 'text-yellow-600'
                      : 'text-rose-600'
                  }`}>
                    <span>●</span>
                    <span>{socio.estadoCuotas}</span>
                  </span>
                </div>

              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center animate-in zoom-in-95 duration-300">
            <button 
              type="button"
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-slate-900/60 hover:bg-slate-900/90 rounded-full transition-colors"
              onClick={() => setSelectedPhoto(null)}
            >
              <X size={24} />
            </button>
            <img 
              src={selectedPhoto.url} 
              alt={selectedPhoto.title} 
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-white text-base font-bold mt-4 bg-slate-900/80 px-4 py-2 rounded-xl shadow-lg border border-white/5">
              {selectedPhoto.title}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Socios;
