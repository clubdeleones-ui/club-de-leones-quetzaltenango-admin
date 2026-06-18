import React, { useState, useEffect } from 'react';
import { Camera, Calendar, Tag } from 'lucide-react';
import { GaleriaItem } from '../types';
import { firebaseService } from '../services/firebaseService';
import { MOCK_GALERIA } from '../constants';

const Galeria: React.FC = () => {
  const [items, setItems] = useState<GaleriaItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Group items by category
  const itemsPorCategoria = items.reduce((acc, item) => {
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
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-16 animate-in fade-in duration-700 pb-16">
      <header className="text-center max-w-3xl mx-auto">
        <div className="bg-yellow-100/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Camera className="text-blue-900 w-10 h-10" />
        </div>
        <h1 className="text-5xl font-extrabold text-blue-900 tracking-tight">Galería Histórica</h1>
        <p className="text-xl text-slate-500 mt-5 leading-relaxed italic">
          Preservando el legado de servicio y hermandad del <span className="font-bold text-blue-900">Club de Leones Quetzaltenango</span> a través del tiempo.
        </p>
      </header>

      {Object.entries(itemsPorCategoria).length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
          <Camera size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 text-lg">Aún no hay fotos en la galería.</p>
        </div>
      ) : (
        <div className="space-y-20">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {galeriaItems.map((item) => (
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
                            {item.fecha}
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

      <section className="bg-slate-50 rounded-3xl p-12 text-center border-2 border-dashed border-slate-300 shadow-sm mt-12">
        <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
          <Camera className="text-slate-400 w-8 h-8" />
        </div>
        <p className="text-slate-500 font-medium max-w-lg mx-auto">
          ¿Tienes fotos antiguas del Club? Compártelas con el <strong className="text-blue-900">Comité de Patrimonio</strong> para incluirlas en nuestro archivo digital y preservar juntos nuestra historia.
        </p>
      </section>
    </div>
  );
};

export default Galeria;
