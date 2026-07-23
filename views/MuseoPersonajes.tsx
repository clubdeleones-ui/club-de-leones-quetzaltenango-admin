import React, { useState, useMemo } from 'react';
import { GaleriaItem } from '../types';
import { 
  Award, 
  Crown, 
  Users, 
  Search, 
  Calendar, 
  Quote, 
  Sparkles, 
  ShieldCheck, 
  BookOpen, 
  X, 
  Share2, 
  Building,
  Star,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface MuseoPersonajesProps {
  items: GaleriaItem[];
}

export const MuseoPersonajes: React.FC<MuseoPersonajesProps> = ({ items }) => {
  const { showToast } = useToast();

  const [activeRoleFilter, setActiveRoleFilter] = useState<'todos' | 'presidente' | 'directiva' | 'relevante' | 'fundador'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPersonaje, setSelectedPersonaje] = useState<GaleriaItem | null>(null);

  // Filter items assigned to "Museo de Personajes"
  const personajesList = useMemo(() => {
    return items.filter(item => {
      // Must belong to Museo de Personajes or have tipoPersonaje explicitly defined
      const isMuseo = item.categoria === 'Museo de Personajes' || !!item.tipoPersonaje;
      if (!isMuseo) return false;

      // Filter by role
      if (activeRoleFilter !== 'todos') {
        if (activeRoleFilter === 'presidente' && item.tipoPersonaje !== 'presidente') return false;
        if (activeRoleFilter === 'directiva' && item.tipoPersonaje !== 'directiva') return false;
        if (activeRoleFilter === 'relevante' && item.tipoPersonaje !== 'relevante') return false;
        if (activeRoleFilter === 'fundador' && item.tipoPersonaje !== 'fundador') return false;
      }

      // Filter by search query
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchTitle = item.titulo.toLowerCase().includes(q);
        const matchDesc = item.descripcion.toLowerCase().includes(q);
        const matchCargo = item.puestoCargo?.toLowerCase().includes(q);
        const matchPeriodo = item.periodoServicio?.toLowerCase().includes(q);
        const matchLogros = item.logrosDestacados?.some(l => l.toLowerCase().includes(q));

        if (!matchTitle && !matchDesc && !matchCargo && !matchPeriodo && !matchLogros) {
          return false;
        }
      }

      return true;
    });
  }, [items, activeRoleFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const museoItems = items.filter(i => i.categoria === 'Museo de Personajes' || !!i.tipoPersonaje);
    return {
      total: museoItems.length,
      presidentes: museoItems.filter(i => i.tipoPersonaje === 'presidente' || i.puestoCargo?.toLowerCase().includes('presidente')).length,
      directivas: museoItems.filter(i => i.tipoPersonaje === 'directiva').length,
      relevantes: museoItems.filter(i => i.tipoPersonaje === 'relevante' || i.tipoPersonaje === 'fundador').length,
    };
  }, [items]);

  const handleShare = (personaje: GaleriaItem) => {
    if (navigator.share) {
      navigator.share({
        title: `${personaje.titulo} - Museo de Personajes`,
        text: `${personaje.puestoCargo || 'Personaje Ilustre'} (${personaje.periodoServicio}): ${personaje.descripcion}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${personaje.titulo} - ${personaje.puestoCargo} (${personaje.periodoServicio})`);
      showToast("Enlace de ficha histórica copiado al portapapeles", "info");
    }
  };

  return (
    <div className="space-y-10 w-full animate-in fade-in duration-500 text-left">
      {/* Golden / Heritage Hero Banner */}
      <div className="relative rounded-[2.5rem] bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 p-8 sm:p-12 text-white shadow-2xl overflow-hidden border border-amber-500/20">
        {/* Decorative Background Pattern */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10 pointer-events-none">
          <Crown size={380} className="text-amber-400" />
        </div>
        <div className="absolute left-1/3 bottom-0 translate-y-1/2 opacity-5 pointer-events-none">
          <Sparkles size={300} className="text-yellow-300" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 backdrop-blur-md px-4 py-2 rounded-full text-xs font-black text-amber-300 border border-amber-400/30 shadow-lg">
            <Crown size={14} className="text-amber-400" />
            <span className="uppercase tracking-widest">Patrimonio e Historia Lionística</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Museo de Personajes <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent">Ilustres</span>
          </h1>

          <p className="text-amber-100/90 text-sm sm:text-base font-medium leading-relaxed max-w-2xl">
            Galería conmemorativa dedicada a los Presidentes Históricos, Juntas Directivas y socios visionarios que han forjado el legado de servicio social y filantropía del <span className="font-bold text-amber-300">Club de Leones Quetzaltenango</span>.
          </p>

          {/* Quick Counter Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-amber-500/20">
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <span className="text-[10px] font-black uppercase text-amber-200 block tracking-wider">Total Ilustres</span>
              <span className="text-2xl font-black text-white">{stats.total}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <span className="text-[10px] font-black uppercase text-amber-200 block tracking-wider">Presidentes</span>
              <span className="text-2xl font-black text-amber-300">{stats.presidentes}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <span className="text-[10px] font-black uppercase text-amber-200 block tracking-wider">Directivas</span>
              <span className="text-2xl font-black text-amber-300">{stats.directivas}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <span className="text-[10px] font-black uppercase text-amber-200 block tracking-wider">Relevantes / Fundadores</span>
              <span className="text-2xl font-black text-yellow-400">{stats.relevantes}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel: Search & Filter Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Role Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveRoleFilter('todos')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
                activeRoleFilter === 'todos'
                  ? 'bg-amber-900 text-white shadow-md shadow-amber-900/20 scale-102'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Building size={14} />
              <span>🏛️ Todos ({stats.total})</span>
            </button>
            <button
              onClick={() => setActiveRoleFilter('presidente')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
                activeRoleFilter === 'presidente'
                  ? 'bg-amber-900 text-white shadow-md shadow-amber-900/20 scale-102'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Crown size={14} className="text-amber-400" />
              <span>👑 Presidentes Históricos</span>
            </button>
            <button
              onClick={() => setActiveRoleFilter('directiva')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
                activeRoleFilter === 'directiva'
                  ? 'bg-amber-900 text-white shadow-md shadow-amber-900/20 scale-102'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Users size={14} />
              <span>👥 Juntas Directivas</span>
            </button>
            <button
              onClick={() => setActiveRoleFilter('relevante')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
                activeRoleFilter === 'relevante'
                  ? 'bg-amber-900 text-white shadow-md shadow-amber-900/20 scale-102'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Star size={14} className="text-amber-400" />
              <span>⭐ Personajes Relevantes</span>
            </button>
          </div>

          {/* Live Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, gestión o logros..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-amber-800 focus:bg-white transition-all shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Grid of Character Cards */}
      {personajesList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center space-y-4">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-700">
            <Crown size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">No se encontraron personajes</h3>
            <p className="text-slate-500 text-xs font-medium max-w-sm mx-auto">
              No existen registros que coincidan con la búsqueda o filtro seleccionado.
            </p>
          </div>
          <button
            onClick={() => { setActiveRoleFilter('todos'); setSearchQuery(''); }}
            className="px-4 py-2 bg-amber-900 hover:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            Restablecer Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {personajesList.map((personaje) => {
            const isPresidente = personaje.tipoPersonaje === 'presidente' || personaje.puestoCargo?.toLowerCase().includes('presidente');
            const isDirectiva = personaje.tipoPersonaje === 'directiva';

            return (
              <div
                key={personaje.id}
                className="group bg-white rounded-[2.5rem] border border-slate-200/90 hover:border-amber-400/60 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col justify-between relative transform hover:-translate-y-1.5"
              >
                {/* Header Badge */}
                <div className="relative h-72 w-full overflow-hidden bg-slate-900">
                  <img
                    src={personaje.url}
                    alt={personaje.titulo}
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>

                  {/* Role Badge */}
                  <div className="absolute top-4 left-4">
                    {isPresidente && (
                      <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg flex items-center space-x-1 border border-yellow-300">
                        <Crown size={12} />
                        <span>Presidente Histórico</span>
                      </span>
                    )}
                    {isDirectiva && (
                      <span className="bg-purple-900/90 backdrop-blur-md text-purple-100 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg flex items-center space-x-1 border border-purple-400/30">
                        <Users size={12} />
                        <span>Junta Directiva</span>
                      </span>
                    )}
                    {!isPresidente && !isDirectiva && (
                      <span className="bg-blue-900/90 backdrop-blur-md text-blue-100 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg flex items-center space-x-1 border border-blue-400/30">
                        <Star size={12} />
                        <span>Personaje Ilustre</span>
                      </span>
                    )}
                  </div>

                  {/* Period Badge */}
                  {personaje.periodoServicio && (
                    <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-full text-xs font-black flex items-center shadow-lg">
                      <Calendar size={12} className="mr-1.5" />
                      <span>{personaje.periodoServicio}</span>
                    </div>
                  )}

                  {/* Floating Title on Image */}
                  <div className="absolute bottom-4 left-6 right-6 text-white space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block">
                      {personaje.puestoCargo || 'Líder Lionístico'}
                    </span>
                    <h3 className="text-xl font-black leading-snug drop-shadow-md">
                      {personaje.titulo}
                    </h3>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-4 flex-grow flex flex-col justify-between">
                  <div className="space-y-3">
                    <p className="text-slate-600 text-xs leading-relaxed font-medium line-clamp-3">
                      {personaje.descripcion}
                    </p>

                    {/* Honorific Quote */}
                    {personaje.citaHonorifica && (
                      <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200/60 relative">
                        <Quote size={16} className="text-amber-400/50 absolute top-2 right-2" />
                        <p className="text-[11px] font-semibold italic text-amber-900 leading-relaxed pr-4">
                          {personaje.citaHonorifica}
                        </p>
                      </div>
                    )}

                    {/* Logros Highlights */}
                    {personaje.logrosDestacados && personaje.logrosDestacados.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Logros Destacados:</span>
                        <div className="space-y-1">
                          {personaje.logrosDestacados.slice(0, 2).map((logro, idx) => (
                            <div key={idx} className="flex items-start space-x-1.5 text-[11px] font-bold text-slate-700">
                              <CheckCircle2 size={12} className="text-amber-600 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-1">{logro}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Action */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedPersonaje(personaje)}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-900 to-slate-900 hover:from-amber-800 hover:to-slate-800 text-amber-200 text-xs font-black rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <BookOpen size={14} />
                      <span>Ver Ficha Histórica Completa</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Detail Modal / Ficha Histórica */}
      {selectedPersonaje && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] border border-amber-500/30 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden relative animate-in zoom-in-95 text-left">
            {/* Modal Header Image */}
            <div className="relative h-80 w-full bg-slate-900">
              <img
                src={selectedPersonaje.url}
                alt={selectedPersonaje.titulo}
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedPersonaje(null)}
                className="absolute top-5 right-5 p-2.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full transition-colors cursor-pointer border border-white/20 shadow-lg"
              >
                <X size={18} />
              </button>

              {/* Badges on Modal Image */}
              <div className="absolute top-5 left-5">
                <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg flex items-center space-x-1.5">
                  <Crown size={14} />
                  <span>{selectedPersonaje.puestoCargo || 'Personaje Ilustre'}</span>
                </span>
              </div>

              {/* Title & Period */}
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                {selectedPersonaje.periodoServicio && (
                  <span className="text-xs font-mono font-bold text-amber-300 bg-slate-900/80 px-3 py-1 rounded-full border border-amber-500/40 inline-block mb-1">
                    Gestión: {selectedPersonaje.periodoServicio}
                  </span>
                )}
                <h2 className="text-2xl sm:text-3xl font-black leading-tight text-white drop-shadow-lg">
                  {selectedPersonaje.titulo}
                </h2>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Biografía */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-amber-800 uppercase tracking-widest flex items-center">
                  <BookOpen size={14} className="mr-1.5 text-amber-700" />
                  <span>Reseña Biográfica & Impacto</span>
                </h4>
                <p className="text-slate-700 text-sm leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  {selectedPersonaje.descripcion}
                </p>
              </div>

              {/* Cita Célebre */}
              {selectedPersonaje.citaHonorifica && (
                <div className="bg-gradient-to-r from-amber-900 to-slate-900 text-white p-5 rounded-2xl border border-amber-500/30 relative space-y-2">
                  <Quote size={24} className="text-amber-400/40 absolute top-3 right-3" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block">Pensamiento Lionístico</span>
                  <p className="text-sm font-semibold italic leading-relaxed text-amber-100 pr-6">
                    {selectedPersonaje.citaHonorifica}
                  </p>
                </div>
              )}

              {/* Logros Clave */}
              {selectedPersonaje.logrosDestacados && selectedPersonaje.logrosDestacados.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-amber-800 uppercase tracking-widest flex items-center">
                    <Award size={14} className="mr-1.5 text-amber-700" />
                    <span>Logros y Legado Institucional</span>
                  </h4>
                  <div className="space-y-2">
                    {selectedPersonaje.logrosDestacados.map((logro, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 flex items-start space-x-3 shadow-2xs">
                        <div className="p-1 bg-amber-100 text-amber-900 rounded-lg mt-0.5">
                          <CheckCircle2 size={14} />
                        </div>
                        <span className="text-xs font-bold text-slate-800 leading-snug">{logro}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleShare(selectedPersonaje)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Share2 size={14} />
                  <span>Compartir Ficha</span>
                </button>

                <button
                  onClick={() => setSelectedPersonaje(null)}
                  className="px-6 py-2.5 bg-amber-900 hover:bg-amber-800 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer"
                >
                  Cerrar Ficha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
