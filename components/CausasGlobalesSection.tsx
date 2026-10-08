import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Users, 
  Heart, 
  Eye, 
  Droplet, 
  Utensils, 
  Leaf, 
  TrendingUp, 
  Compass, 
  ShieldCheck, 
  Plus, 
  CheckCircle2, 
  ExternalLink, 
  Search, 
  Filter, 
  Award, 
  Handshake,
  Clock,
  ArrowRight
} from 'lucide-react';
import { CAUSAS_GLOBALES_GST_2026_2027, CausaGlobalGST } from '../config/causasGlobalesGST';
import { Actividad } from '../types';

interface CausasGlobalesSectionProps {
  actividadesExistentes: Actividad[];
  onProgramarParaCausa?: (causa: CausaGlobalGST) => void;
  isSocio: boolean;
}

export const CausasGlobalesSection: React.FC<CausasGlobalesSectionProps> = ({
  actividadesExistentes,
  onProgramarParaCausa,
  isSocio
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const categories = useMemo(() => {
    const list = Array.from(new Set(CAUSAS_GLOBALES_GST_2026_2027.map(c => c.causaGlobal)));
    return ['Todas', ...list];
  }, []);

  // Icon selector helper
  const renderCausaIcon = (key: CausaGlobalGST['iconoKey'], className = "w-5 h-5") => {
    switch (key) {
      case 'users':
        return <Users className={className} />;
      case 'ribbon-gold':
      case 'ribbon-purple':
        return <Heart className={className} />;
      case 'peace':
        return <Compass className={className} />;
      case 'lotus':
        return <Sparkles className={className} />;
      case 'eye':
        return <Eye className={className} />;
      case 'diabetes':
        return <Droplet className={className} />;
      case 'hunger':
        return <Utensils className={className} />;
      case 'environment':
        return <Leaf className={className} />;
      case 'chart':
        return <TrendingUp className={className} />;
      case 'handshake':
        return <Handshake className={className} />;
      default:
        return <Award className={className} />;
    }
  };

  // Filtrado de causas
  const filteredCausas = useMemo(() => {
    return CAUSAS_GLOBALES_GST_2026_2027.filter(c => {
      const matchCat = selectedCategory === 'Todas' || c.causaGlobal === selectedCategory;
      const term = searchTerm.toLowerCase();
      const matchSearch = !term || 
        c.conmemoracion.toLowerCase().includes(term) ||
        c.causaGlobal.toLowerCase().includes(term) ||
        c.fechaTexto.toLowerCase().includes(term) ||
        c.sugerenciaActividad.toLowerCase().includes(term);
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchTerm]);

  // Verificar si hay actividades programadas por el club en o cerca de esa fecha
  const getActividadesVinculadas = (causa: CausaGlobalGST): Actividad[] => {
    return actividadesExistentes.filter(act => {
      const actDate = act.fecha.split(' ')[0].split('T')[0];
      if (causa.tipo === 'dia') {
        return actDate === causa.fechaInicio;
      } else if (causa.fechaFin) {
        return actDate >= causa.fechaInicio && actDate <= causa.fechaFin;
      } else {
        // Coincidencia de mes y año
        const [y, m] = actDate.split('-');
        return parseInt(y) === causa.ano && parseInt(m) - 1 === causa.mesIndex;
      }
    });
  };

  return (
    <section className="mt-14 space-y-8 animate-in fade-in duration-500 text-left">
      
      {/* Banner Oficial GST Distrito D-3 Guatemala */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white p-6 sm:p-10 shadow-2xl border border-blue-800/60">
        
        {/* Glow ambient background effects */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-yellow-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-blue-800/80 pb-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 text-[11px] font-black uppercase tracking-widest">
              <Sparkles size={12} />
              Distrito D-3 Guatemala • Lions International
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Calendario de Causas Globales 2026 – 2027
            </h2>
            <p className="text-sm text-blue-200/90 font-medium max-w-2xl leading-relaxed">
              Guía oficial de fechas y semanas de servicio del <strong>Global Service Team (GST)</strong>. 
              Inspírate en estas conmemoraciones para programar y liderar las acciones solidarias de nuestro Club.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 flex items-center gap-4 shrink-0 shadow-lg">
            <div className="text-center px-2">
              <span className="block text-2xl font-black text-yellow-400 tracking-wider">GST</span>
              <span className="block text-[9px] uppercase tracking-widest font-extrabold text-blue-200">Distrito D-3</span>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div className="text-left text-xs font-black tracking-wider text-white">
              <span className="block text-yellow-300">SERVIR</span>
              <span className="block text-white">INSPIRAR</span>
              <span className="block text-blue-200">TRANSFORMAR</span>
            </div>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="pt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Scrollable category pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-thin">
            <span className="text-xs font-black text-blue-300 uppercase tracking-widest flex items-center gap-1 shrink-0 mr-1">
              <Filter size={13} />
              Causas:
            </span>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-yellow-400 text-blue-950 shadow-md font-black'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full lg:w-72">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-300" />
            <input
              type="text"
              placeholder="Buscar conmemoración o causa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-blue-300/60 focus:outline-none focus:border-yellow-400 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Grid de Conmemoraciones y Causas Globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCausas.map((causa) => {
          const vinculadas = getActividadesVinculadas(causa);
          const tieneActividad = vinculadas.length > 0;

          return (
            <div
              key={causa.id}
              className={`group rounded-[2rem] p-6 border transition-all duration-300 flex flex-col justify-between shadow-xs hover:shadow-xl hover:-translate-y-1 bg-white ${
                causa.color.border
              }`}
            >
              <div className="space-y-4">
                
                {/* Cabecera de la Tarjeta */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border shadow-2xs ${causa.color.bgBadge} ${causa.color.textBadge} ${causa.color.border}`}>
                    {causa.fechaTexto}
                  </span>

                  <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-xs" style={{ backgroundColor: `${causa.color.accentHex}18`, borderColor: `${causa.color.accentHex}40`, color: causa.color.accentHex }}>
                    {renderCausaIcon(causa.iconoKey)}
                  </span>
                </div>

                {/* Título de Causa y Conmemoración */}
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest block" style={{ color: causa.color.accentHex }}>
                    Causa Global: {causa.causaGlobal}
                  </span>
                  <h3 className="text-lg font-black text-slate-800 group-hover:text-blue-900 transition-colors mt-0.5">
                    {causa.conmemoracion}
                  </h3>
                </div>

                {/* Sugerencia Motivacional */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-150 text-xs text-slate-600 leading-relaxed font-medium">
                  <span className="font-extrabold text-slate-800 block mb-1 flex items-center gap-1.5">
                    💡 Idea de Servicio:
                  </span>
                  {causa.sugerenciaActividad}
                </div>

                {/* Badge de estado del Club */}
                {tieneActividad ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span className="truncate">
                      {vinculadas.length === 1 ? '1 actividad programada por el club' : `${vinculadas.length} actividades programadas`}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-[11px] font-medium">
                    <Clock size={14} className="text-amber-600 shrink-0" />
                    <span>¡Oportunidad de servicio abierta para tu comité!</span>
                  </div>
                )}
              </div>

              {/* Botón de Acción para Programar */}
              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onProgramarParaCausa && onProgramarParaCausa(causa)}
                  className="w-full py-2.5 px-4 rounded-xl text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer group-hover:brightness-110 active:scale-95"
                  style={{ backgroundColor: causa.color.accentHex }}
                >
                  <Plus size={15} />
                  <span>Proponer Actividad</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCausas.length === 0 && (
        <div className="py-16 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300">
          <p className="text-slate-500 font-bold text-sm">No se encontraron conmemoraciones para el filtro seleccionado.</p>
        </div>
      )}

      {/* Frase Institucional Final */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-yellow-500/10 border border-yellow-500/20 text-center space-y-1">
        <p className="text-sm font-black text-blue-950 uppercase tracking-wider">
          «Donde hay una necesidad, hay un León»
        </p>
        <p className="text-xs text-slate-600 font-medium">
          Club de Leones de Quetzaltenango • Comprometidos con las Metas Globales del Distrito D-3 Guatemala
        </p>
      </div>

    </section>
  );
};
