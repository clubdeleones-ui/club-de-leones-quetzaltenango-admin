import React, { useState, useEffect } from 'react';
import { Camera, Calendar, Tag, Crown, ImageIcon, Building2, Sparkles } from 'lucide-react';
import { GaleriaItem } from '../types';
import { firebaseService } from '../services/firebaseService';
import { MOCK_GALERIA } from '../constants';
import { formatDisplayDate } from '../utils/dateSpanishFormatter';
import { MuseoPersonajes } from './MuseoPersonajes';
import { RentasSalonesSection } from '../components/RentasSalonesSection';

const Galeria: React.FC = () => {
  const [items, setItems] = useState<GaleriaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rentas' | 'museo' | 'fotos'>('rentas');

  useEffect(() => {
    const initializeGaleria = async () => {
      try {
        // Sync initial mock items if needed (fire and forget)
        await firebaseService.syncInitialGaleria(MOCK_GALERIA);
        // Fetch items from Firebase
        const data = await firebaseService.getGaleriaItems();
        setItems(data);
      } catch (error) {
        console.error("Error al inicializar la galería:", error);
      } finally {
        setLoading(false);
      }
    };
    initializeGaleria();
  }, []);

  // Filter regular gallery items (exclude Museo and Rentas from standard photo categories)
  const itemsGaleriaNormal = items.filter(i => 
    i.categoria !== 'Museo de Personajes' && 
    i.categoria !== 'Rentas & Salones del Club' && 
    !i.tipoPersonaje && 
    !i.esRenta && 
    !i.tipoEspacio
  );

  // Group items by category
  const itemsPorCategoria = itemsGaleriaNormal.reduce((acc, item) => {
    const cat = item.categoria || 'Historia del Club';
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, GaleriaItem[]>);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16 text-left">
      
      {/* Barra de Navegación de Secciones (Rediseño Ejecutivo sin redundancias) */}
      <div className="flex justify-center pt-2">
        <nav 
          aria-label="Pestañas de Galería y Patrimonio"
          className="inline-flex p-1.5 bg-white/90 backdrop-blur-md rounded-[2rem] border border-slate-200/90 shadow-md shadow-slate-200/50 flex-wrap justify-center gap-1.5 max-w-full"
        >
          {/* Botón 1: Salones y Rentas */}
          <button
            type="button"
            onClick={() => setActiveTab('rentas')}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'rentas'
                ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white shadow-lg shadow-amber-600/30 scale-102 ring-2 ring-amber-400/40'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Building2 size={16} className={activeTab === 'rentas' ? 'text-amber-200' : 'text-amber-600'} />
            <span>Salones & Rentas del Club</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              activeTab === 'rentas' ? 'bg-black/20 text-white' : 'bg-amber-100 text-amber-900'
            }`}>
              Eventos
            </span>
          </button>

          {/* Botón 2: Museo de Personajes */}
          <button
            type="button"
            onClick={() => setActiveTab('museo')}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'museo'
                ? 'bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 text-amber-300 shadow-lg shadow-slate-950/30 scale-102 ring-2 ring-amber-500/40'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Crown size={16} className={activeTab === 'museo' ? 'text-amber-400' : 'text-amber-700'} />
            <span>Museo de Personajes</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              activeTab === 'museo' ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-100 text-slate-700'
            }`}>
              Historia
            </span>
          </button>

          {/* Botón 3: Galería de Actividades */}
          <button
            type="button"
            onClick={() => setActiveTab('fotos')}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'fotos'
                ? 'bg-gradient-to-r from-blue-900 via-blue-950 to-indigo-950 text-white shadow-lg shadow-blue-900/30 scale-102 ring-2 ring-blue-400/40'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ImageIcon size={16} className={activeTab === 'fotos' ? 'text-blue-200' : 'text-blue-900'} />
            <span>Galería de Actividades</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              activeTab === 'fotos' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-900'
            }`}>
              Fotos
            </span>
          </button>
        </nav>
      </div>

      {/* Contenido Dinámico según la Pestaña Seleccionada */}
      {activeTab === 'rentas' ? (
        <RentasSalonesSection items={items} />
      ) : activeTab === 'museo' ? (
        <MuseoPersonajes items={items} />
      ) : (
        <div className="space-y-12">
          
          {/* Banner de Galería de Actividades */}
          <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-10 md:p-12 border-2 border-blue-400/40 shadow-2xl">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-72 h-72 bg-amber-600/15 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="inline-flex items-center space-x-2 bg-blue-400/20 text-blue-300 border border-blue-400/40 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
                <Sparkles size={14} className="text-blue-300 animate-pulse" />
                <span>Memoria Viva Leonística • Registro Fotográfico</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white">
                Galería de <span className="text-amber-400 underline decoration-amber-400/40 underline-offset-8">Actividades & Servicio</span>
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium">
                Explora el archivo fotográfico de las jornadas médicas, entregas de ayuda comunitaria, cenas de gala y momentos emblemáticos del Club de Leones de Quetzaltenango.
              </p>
            </div>
          </div>

          {Object.entries(itemsPorCategoria).length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <Camera size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg font-bold">Aún no hay fotos registradas en esta sección.</p>
            </div>
          ) : (
            <div className="space-y-16">
              {Object.entries(itemsPorCategoria).map(([categoria, galeriaItems]) => (
                <section key={categoria} className="space-y-8 relative">
                  {/* Category Header */}
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="bg-blue-900 text-white p-3 rounded-2xl shadow-md">
                      <Tag size={24} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-slate-800">{categoria}</h2>
                      <div className="h-1 w-20 bg-yellow-500 mt-2 rounded-full"></div>
                    </div>
                  </div>

                  {/* Gallery Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8">
                    {(galeriaItems as GaleriaItem[]).map((item) => (
                      <div key={item.id} className="group perspective-[1000px] h-[400px] w-full cursor-pointer">
                        <div 
                          className="relative w-full h-full transition-transform duration-700 ease-in-out shadow-sm hover:shadow-2xl rounded-[2rem] group-hover:[transform:rotateY(180deg)]" 
                          style={{ transformStyle: 'preserve-3d' }}
                        >
                          {/* Front side */}
                          <div 
                            className="absolute inset-0 bg-white rounded-[2rem] overflow-hidden border border-slate-200 flex flex-col" 
                            style={{ backfaceVisibility: 'hidden' }}
                          >
                            <div className="relative h-56 overflow-hidden flex-shrink-0 bg-slate-100">
                              <img
                                src={item.url}
                                alt={item.titulo}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                              <div className="absolute top-4 right-4 bg-blue-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center shadow-lg">
                                <Calendar size={12} className="mr-1.5" />
                                {formatDisplayDate(item.fecha)}
                              </div>
                            </div>
                            <div className="p-6 flex-1 flex flex-col justify-between bg-white">
                              <div>
                                <h3 className="text-xl font-extrabold mb-2 text-slate-800 line-clamp-1">
                                  {item.titulo}
                                </h3>
                                <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">
                                  {item.descripcion}
                                </p>
                              </div>
                              {item.contextoPremium && (
                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center space-x-2">
                                  <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                                  </span>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                                    Girar para Ficha Premium
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Back side */}
                          <div 
                            className="absolute inset-0 bg-gradient-to-br from-blue-950 to-blue-900 rounded-[2rem] overflow-hidden border-2 border-blue-800 p-8 flex flex-col justify-center text-center [transform:rotateY(180deg)] shadow-inner" 
                            style={{ backfaceVisibility: 'hidden' }}
                          >
                            <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500"></div>
                            <h4 className="text-yellow-500 font-black text-xl mb-4 border-b border-blue-800/50 pb-4 uppercase tracking-widest flex items-center justify-center">
                              <Camera size={18} className="mr-2" />
                              Ficha Premium
                            </h4>
                            <p className="text-blue-50 text-sm leading-relaxed overflow-y-auto custom-scrollbar italic flex-1 flex items-center justify-center font-medium">
                              {item.contextoPremium ? `"${item.contextoPremium}"` : "Información histórica adicional no disponible para esta fotografía."}
                            </p>
                            <div className="mt-6 flex justify-center">
                              <div className="bg-blue-800/50 p-2 rounded-full">
                                <div className="bg-yellow-500/20 text-yellow-500 p-1.5 rounded-full">
                                  <Tag size={16} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          <section className="bg-slate-50 rounded-3xl p-10 text-center border-2 border-dashed border-slate-200 shadow-xs">
            <div className="bg-white w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs border border-slate-200">
              <Camera className="text-slate-400 w-7 h-7" />
            </div>
            <p className="text-slate-500 text-xs font-medium max-w-lg mx-auto leading-relaxed">
              ¿Tienes fotos antiguas del Club? Compártelas con el <strong className="text-blue-900">Comité de Patrimonio</strong> para incluirlas en nuestro archivo digital y preservar juntos nuestra historia.
            </p>
          </section>
        </div>
      )}
    </div>
  );
};

export default Galeria;
