import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Search, ChevronDown, X, Play } from 'lucide-react';
import { HitoHistorico } from '../types';
import { firebaseService } from '../services/firebaseService';

export const Historia: React.FC = () => {
  const [hitos, setHitos] = useState<HitoHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'Todos' | 'Club de Leones' | 'Ciudad de Quetzaltenango'>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [playVideoUrl, setPlayVideoUrl] = useState<string | null>(null);
  const [expandedHitos, setExpandedHitos] = useState<Record<string, boolean>>({});

  const getYoutubeId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const toggleExpand = (id: string) => {
    setExpandedHitos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const fetchHitos = async () => {
      try {
        const data = await firebaseService.getHitosHistoricos();
        // Filtrar solo los publicados
        const publishedData = data.filter(item => item.estado === 'Publicado');
        
        const getSortableDateValue = (fechaStr: string): number => {
          if (!fechaStr) return 0;
          const clean = fechaStr.toLowerCase();
          const yearMatch = clean.match(/\b(1[89]\d{2}|20\d{2})\b/);
          const year = yearMatch ? parseInt(yearMatch[0], 10) : 0;
          
          let month = 0;
          if (clean.includes('enero')) month = 1;
          else if (clean.includes('febrero')) month = 2;
          else if (clean.includes('marzo')) month = 3;
          else if (clean.includes('abril')) month = 4;
          else if (clean.includes('mayo')) month = 5;
          else if (clean.includes('junio')) month = 6;
          else if (clean.includes('julio')) month = 7;
          else if (clean.includes('agosto')) month = 8;
          else if (clean.includes('septiembre') || clean.includes('setiembre')) month = 9;
          else if (clean.includes('octubre')) month = 10;
          else if (clean.includes('noviembre')) month = 11;
          else if (clean.includes('diciembre')) month = 12;
          
          const dayMatchSpecific = clean.match(/^\s*\b(\d{1,2})\b/);
          let day = 0;
          if (dayMatchSpecific) {
            day = parseInt(dayMatchSpecific[1], 10);
          } else {
            const genericDayMatch = clean.match(/\b(\d{1,2})\b/);
            if (genericDayMatch) {
              day = parseInt(genericDayMatch[1], 10);
            }
          }
          return year * 10000 + month * 100 + day;
        };

        // Ordenar de forma segura cronológicamente (más antiguos primero en la línea de tiempo)
        const sorted = publishedData.sort((a, b) => {
          return getSortableDateValue(a.fecha) - getSortableDateValue(b.fecha);
        });
        
        setHitos(sorted);
      } catch (error) {
        console.error("Error fetching hitos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHitos();
  }, []);

  const filteredHitos = hitos.filter(hito => {
    const matchesFilter = filter === 'Todos' || hito.categoria === filter;
    const matchesSearch = hito.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          hito.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          hito.fecha.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto py-8">
      {/* Header Premium */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-[2rem] overflow-hidden mb-12 shadow-2xl relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
        
        <div className="relative z-10 p-10 md:p-16 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-white/5 backdrop-blur-md rounded-full mb-6 border border-white/10 shadow-lg">
            <Clock className="w-10 h-10 text-yellow-400" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
            Línea de Tiempo Histórica
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto font-light leading-relaxed">
            Un viaje a través del tiempo que entrelaza la historia del <span className="font-bold text-yellow-400">Club de Leones</span> con los momentos más trascendentales de la <span className="font-bold text-yellow-400">Ciudad de Quetzaltenango</span>.
          </p>
        </div>
      </div>

      {/* Controles de Filtrado */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 mb-12 flex flex-col md:flex-row gap-6 justify-between items-center sticky top-24 z-30">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar en la historia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none transition-all"
          />
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full md:w-auto">
          {(['Todos', 'Club de Leones', 'Ciudad de Quetzaltenango'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`flex-1 md:flex-none px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                filter === opt 
                  ? 'bg-white text-blue-900 shadow-md scale-100' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
              }`}
            >
              {opt === 'Todos' ? 'Ambos' : opt.split(' ')[0] === 'Club' ? 'Club de Leones' : 'Quetzaltenango'}
            </button>
          ))}
        </div>
      </div>

      {/* Línea de Tiempo */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-900 mb-4"></div>
          <p className="text-blue-900 font-bold animate-pulse">Viajando en el tiempo...</p>
        </div>
      ) : filteredHitos.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-2xl font-bold text-slate-700">No se encontraron hitos históricos</p>
          <p className="text-slate-500 mt-2">Prueba ajustando los filtros o el término de búsqueda.</p>
        </div>
      ) : (
        <div className="relative wrap overflow-hidden p-4 md:p-10 h-full">
          {/* Línea central */}
          <div className="absolute border-opacity-20 border-slate-400 h-full border-l-4 left-8 md:left-1/2 -ml-0.5 md:-ml-1 top-0 hidden md:block"></div>
          
          <div className="space-y-12">
            {filteredHitos.map((hito, index) => {
              const isClub = hito.categoria === 'Club de Leones';
              // Alternar lados en desktop si no está filtrado por uno solo,
              // o forzar el lado según el índice
              const isLeft = index % 2 === 0;

              return (
                <div key={hito.id} className={`flex flex-col md:flex-row md:justify-between items-start md:items-center w-full group ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                  
                  {/* Espacio vacío para empujar al lado correcto en Desktop */}
                  <div className="hidden md:block w-5/12"></div>
                  
                  {/* Nodo central */}
                  <div className={`z-20 flex items-center justify-center shadow-xl w-12 h-12 rounded-full border-4 border-white shrink-0 mb-4 md:mb-0 transition-transform duration-300 group-hover:scale-110 ${
                    isClub ? 'bg-blue-900 text-yellow-400' : 'bg-amber-600 text-white'
                  }`}>
                    {isClub ? <Clock size={20} /> : <MapPin size={20} />}
                  </div>

                  {/* Tarjeta de Contenido */}
                  <div className="w-full md:w-5/12 ml-4 md:ml-0 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                    {hito.imagenUrl && (
                      <div 
                        className={`h-48 md:h-64 w-full overflow-hidden relative group/img ${
                          hito.videoUrl ? 'cursor-pointer' : 'cursor-zoom-in'
                        }`}
                        onClick={() => {
                          if (hito.videoUrl) {
                            setPlayVideoUrl(hito.videoUrl);
                          } else {
                            setZoomImage(hito.imagenUrl);
                          }
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                        <img 
                          src={hito.imagenUrl} 
                          alt={hito.titulo} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-115"
                        />
                        
                        {/* Play Video Button overlay */}
                        {hito.videoUrl ? (
                          <div className="absolute inset-0 bg-black/35 flex items-center justify-center z-20 transition-all group-hover:bg-black/20">
                            <div className="w-16 h-16 rounded-full bg-red-600/90 hover:bg-red-600 hover:scale-110 text-white flex items-center justify-center shadow-2xl transition-all duration-300">
                              <Play size={28} className="ml-1 fill-current" />
                            </div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                            <span className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest scale-90 group-hover/img:scale-100 transition-all duration-300">
                              Hacer Zoom
                            </span>
                          </div>
                        )}

                        <div className="absolute bottom-4 left-4 z-20">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-md ${
                            isClub ? 'bg-blue-900/80 text-yellow-400' : 'bg-amber-600/80 text-white'
                          }`}>
                            {hito.categoria}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="p-6 md:p-8 relative">
                      {!hito.imagenUrl && (
                        <div className="mb-4">
                           <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                            isClub ? 'bg-blue-50 text-blue-900 border border-blue-100' : 'bg-amber-50 text-amber-800 border border-amber-100'
                          }`}>
                            {hito.categoria}
                          </span>
                        </div>
                      )}
                      <h3 className="font-extrabold text-2xl text-slate-800 mb-2 leading-tight">{hito.titulo}</h3>
                      <div className="inline-flex items-center space-x-2 text-blue-900 font-bold mb-4 bg-blue-50 px-3 py-1 rounded-lg">
                        <Clock size={16} />
                        <span>{hito.fecha}</span>
                      </div>
                      
                      {(() => {
                        const isExpanded = !!expandedHitos[hito.id];
                        return (
                          <div>
                            <p className={`text-slate-600 leading-relaxed text-base whitespace-pre-line ${isExpanded ? '' : 'line-clamp-4'}`}>
                              {hito.descripcion}
                            </p>
                            {hito.descripcion.length > 180 && (
                              <button
                                type="button"
                                onClick={() => toggleExpand(hito.id)}
                                className="mt-3.5 text-sm font-black text-blue-900 hover:text-blue-800 transition-all flex items-center gap-1.5 focus:outline-none"
                              >
                                <span>{isExpanded ? 'Ver menos' : 'Leer completa'}</span>
                                <ChevronDown size={15} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de Zoom de Imagen */}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setZoomImage(null)}
        >
          <div className="absolute top-4 right-4 z-50">
            <button 
              onClick={() => setZoomImage(null)}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all active:scale-95 border border-white/10 shadow-lg cursor-pointer"
            >
              <X size={24} />
            </button>
          </div>
          <div 
            className="relative max-w-4xl w-full max-h-[85vh] overflow-hidden rounded-3xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <img 
              src={zoomImage} 
              alt="Hito Histórico" 
              className="w-full h-full object-contain max-h-[85vh] mx-auto bg-slate-900/40"
            />
          </div>
        </div>
      )}

      {/* Modal de Reproducción de Video */}
      {playVideoUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setPlayVideoUrl(null)}
        >
          <div className="absolute top-4 right-4 z-50">
            <button 
              onClick={() => setPlayVideoUrl(null)}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all active:scale-95 border border-white/10 shadow-lg cursor-pointer"
            >
              <X size={24} />
            </button>
          </div>
          
          <div 
            className="bg-black rounded-3xl overflow-hidden w-full max-w-4xl aspect-video shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-300 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {getYoutubeId(playVideoUrl) ? (
              <iframe
                src={`https://www.youtube.com/embed/${getYoutubeId(playVideoUrl)}?autoplay=1`}
                title="YouTube video player"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white bg-slate-900 p-6">
                <p className="text-lg font-bold mb-2">Enlace de video no soportado</p>
                <a 
                  href={playVideoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-400 underline font-bold"
                >
                  Abrir enlace en pestaña nueva
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default Historia;
