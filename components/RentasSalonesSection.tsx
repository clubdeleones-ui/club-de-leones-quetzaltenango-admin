import React, { useState, useMemo } from 'react';
import { 
  Building2, Users, Car, Briefcase, Sparkles, CheckCircle2, Phone, Calendar, 
  MapPin, Clock, ArrowRight, ExternalLink, ShieldCheck, Tag, Info, ChevronRight, 
  X, ChevronLeft, Image as ImageIcon, Maximize2
} from 'lucide-react';
import { GaleriaItem } from '../types';
import { formatDisplayDate } from '../utils/dateSpanishFormatter';

interface RentasSalonesSectionProps {
  items: GaleriaItem[];
}

interface ConsolidatedEspacio extends GaleriaItem {
  allImages: string[];
}

export const RentasSalonesSection: React.FC<RentasSalonesSectionProps> = ({ items }) => {
  const [selectedTipo, setSelectedTipo] = useState<'todos' | 'salon' | 'parqueo' | 'oficina'>('todos');
  
  // Estado para el visor Lightbox de fotos
  const [lightboxData, setLightboxData] = useState<{
    espacio: ConsolidatedEspacio;
    currentIndex: number;
  } | null>(null);

  // Estado para el modal de Ficha Completa
  const [modalItem, setModalItem] = useState<ConsolidatedEspacio | null>(null);

  // Filtrar y consolidar espacios en renta (agrupa automáticamente si hay múltiples fotos o items del mismo espacio)
  const espaciosConsolidados = useMemo<ConsolidatedEspacio[]>(() => {
    const rawRentas = items.filter(item => 
      item.categoria === 'Rentas & Salones del Club' || 
      item.esRenta || 
      item.tipoEspacio !== undefined
    );

    const map = new Map<string, ConsolidatedEspacio>();

    rawRentas.forEach(item => {
      // Clave normalizada por título para consolidar fotos del mismo salón (ej. "Salón Itzmanía")
      const cleanTitle = (item.titulo || '')
        .trim()
        .toLowerCase()
        .replace(/^(foto|vista|ángulo|salon|salón)\s+/i, '')
        .replace(/\s+\d+$/, '')
        .trim();

      const key = cleanTitle.length > 3 ? cleanTitle : item.id;

      if (!map.has(key)) {
        const initialImages: string[] = [];
        if (item.url) initialImages.push(item.url);
        if (Array.isArray(item.fotos)) {
          item.fotos.forEach(f => {
            if (f && !initialImages.includes(f)) initialImages.push(f);
          });
        }

        map.set(key, {
          ...item,
          allImages: initialImages.length > 0 ? initialImages : [item.url || '']
        });
      } else {
        const existing = map.get(key)!;
        // Agregar nuevas fotos no duplicadas al collage del espacio
        if (item.url && !existing.allImages.includes(item.url)) {
          existing.allImages.push(item.url);
        }
        if (Array.isArray(item.fotos)) {
          item.fotos.forEach(f => {
            if (f && !existing.allImages.includes(f)) existing.allImages.push(f);
          });
        }
        // Enriquecer datos si el nuevo item tiene más información
        if (!existing.descripcion && item.descripcion) existing.descripcion = item.descripcion;
        if (!existing.capacidadPersonas && item.capacidadPersonas) existing.capacidadPersonas = item.capacidadPersonas;
        if (!existing.dimensionesArea && item.dimensionesArea) existing.dimensionesArea = item.dimensionesArea;
        if (!existing.tarifaReferencial && item.tarifaReferencial) existing.tarifaReferencial = item.tarifaReferencial;
        if ((!existing.amenidades || existing.amenidades.length === 0) && item.amenidades) {
          existing.amenidades = item.amenidades;
        }
      }
    });

    return Array.from(map.values());
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedTipo === 'todos') return espaciosConsolidados;
    return espaciosConsolidados.filter(item => item.tipoEspacio === selectedTipo);
  }, [espaciosConsolidados, selectedTipo]);

  const defaultWhatsapp = '50277612345'; // WhatsApp de contacto

  // Controles del Lightbox
  const openLightbox = (espacio: ConsolidatedEspacio, index: number = 0) => {
    setLightboxData({ espacio, currentIndex: index });
  };

  const nextLightboxImage = () => {
    if (!lightboxData) return;
    const total = lightboxData.espacio.allImages.length;
    setLightboxData({
      ...lightboxData,
      currentIndex: (lightboxData.currentIndex + 1) % total
    });
  };

  const prevLightboxImage = () => {
    if (!lightboxData) return;
    const total = lightboxData.espacio.allImages.length;
    setLightboxData({
      ...lightboxData,
      currentIndex: (lightboxData.currentIndex - 1 + total) % total
    });
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 text-left">
      
      {/* Banner Institucional de la Sede Social "La Cueva" */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-blue-950 via-slate-900 to-amber-950 text-white p-6 sm:p-10 md:p-12 border-2 border-amber-400/40 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 bg-amber-400/20 text-amber-300 border border-amber-400/40 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
            <Sparkles size={14} className="text-amber-400 animate-pulse" />
            <span>Sede Social "La Cueva" • Alquiler de Instalaciones</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white">
            Espacios para tus <span className="text-amber-400 underline decoration-amber-400/40 underline-offset-8">Eventos & Proyectos</span>
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium">
            El Club de Leones de Quetzaltenango pone a tu disposición amplios salones para eventos sociales, bodas, graduaciones, seminarios corporativos, parqueo privado interno y oficinas en una ubicación céntrica y segura de la zona 1.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-700/60">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
              <MapPin size={16} className="text-amber-400 flex-shrink-0" />
              <span>Zona 1 Céntrica</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
              <Users size={16} className="text-amber-400 flex-shrink-0" />
              <span>Capacidad Flexible</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
              <Car size={16} className="text-amber-400 flex-shrink-0" />
              <span>Parqueo Interno</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
              <ShieldCheck size={16} className="text-amber-400 flex-shrink-0" />
              <span>Seguridad & Prestigio</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSelectedTipo('todos')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
              selectedTipo === 'todos'
                ? 'bg-blue-950 text-white shadow-md shadow-blue-950/20 scale-102'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Building2 size={15} />
            <span>Todos los Espacios ({espaciosConsolidados.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTipo('salon')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
              selectedTipo === 'salon'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20 scale-102'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users size={15} />
            <span>Salones de Eventos ({espaciosConsolidados.filter(i => i.tipoEspacio === 'salon' || !i.tipoEspacio).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTipo('parqueo')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
              selectedTipo === 'parqueo'
                ? 'bg-blue-800 text-white shadow-md shadow-blue-800/20 scale-102'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Car size={15} />
            <span>Parqueo ({espaciosConsolidados.filter(i => i.tipoEspacio === 'parqueo').length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTipo('oficina')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
              selectedTipo === 'oficina'
                ? 'bg-indigo-700 text-white shadow-md shadow-indigo-700/20 scale-102'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Briefcase size={15} />
            <span>Oficinas & Módulos ({espaciosConsolidados.filter(i => i.tipoEspacio === 'oficina').length})</span>
          </button>
        </div>

        <span className="text-xs font-bold text-slate-500">
          Calle Rodolfo Robles 24-53, Zona 1, Quetzaltenango
        </span>
      </div>

      {/* Lista de Fichas Principales con Collage Integrado */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8 space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <Building2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">
            {espaciosConsolidados.length === 0 ? "Catálogo de Salones y Rentas en Preparación" : "No hay espacios registrados en esta categoría"}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Puedes cotizar directamente con nosotros o solicitar una visita a las instalaciones.
          </p>
          <a
            href={`https://wa.me/${defaultWhatsapp}?text=${encodeURIComponent('Hola, deseo cotizar el alquiler de un salón o espacio en el Club de Leones de Quetzaltenango.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Phone size={16} />
            <span>Cotizar por WhatsApp</span>
          </a>
        </div>
      ) : (
        <div className="space-y-12">
          {filteredItems.map(item => {
            const isSalon = item.tipoEspacio === 'salon' || !item.tipoEspacio;
            const isParqueo = item.tipoEspacio === 'parqueo';
            const isOficina = item.tipoEspacio === 'oficina';
            const tel = item.telefonoContacto || defaultWhatsapp;
            const photos = item.allImages.filter(Boolean);

            return (
              <article 
                key={item.id} 
                className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col lg:flex-row group border-t-4 border-t-amber-500 text-left"
              >
                
                {/* SECCIÓN 1: COLLAGE FOTOGRÁFICO INTEGRADO (50% en desktop) */}
                <div className="lg:w-1/2 p-4 sm:p-6 bg-slate-50/60 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-150">
                  <div className="space-y-3">
                    
                    {/* FOTO PRINCIPAL DESTACADA */}
                    <div 
                      className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden cursor-pointer shadow-md group/main"
                      onClick={() => openLightbox(item, 0)}
                    >
                      <img 
                        src={photos[0] || item.url} 
                        alt={item.titulo} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover/main:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
                      
                      {/* Badge Tipo de Espacio */}
                      <div className="absolute top-3 left-3">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-md backdrop-blur-md flex items-center space-x-1.5 text-white ${
                          isSalon ? 'bg-amber-600/95' : isParqueo ? 'bg-blue-800/95' : 'bg-indigo-700/95'
                        }`}>
                          {isSalon ? <Users size={12} /> : isParqueo ? <Car size={12} /> : <Briefcase size={12} />}
                          <span>{isSalon ? 'Salón de Eventos' : isParqueo ? 'Parqueo Seguro' : isOficina ? 'Oficina / Módulo' : 'Espacio del Club'}</span>
                        </span>
                      </div>

                      {/* Botón Ver en Pantalla Completa */}
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openLightbox(item, 0); }}
                        className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white p-2 rounded-xl backdrop-blur-md transition-all shadow-md cursor-pointer flex items-center space-x-1 text-xs font-bold"
                      >
                        <Maximize2 size={14} />
                        <span className="hidden sm:inline">Ampliar</span>
                      </button>

                      {/* Tarifa Referencial */}
                      {item.tarifaReferencial && (
                        <div className="absolute bottom-3 left-3 bg-amber-500 text-blue-950 px-3 py-1 rounded-xl text-xs font-black shadow-md">
                          {item.tarifaReferencial}
                        </div>
                      )}

                      {/* Indicador de fotos */}
                      <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1">
                        <ImageIcon size={12} />
                        <span>{photos.length} {photos.length === 1 ? 'foto' : 'fotos'}</span>
                      </div>
                    </div>

                    {/* MINIATURAS / COLLAGE DE FOTOS SECUNDARIAS */}
                    {photos.length > 1 && (
                      <div className="grid grid-cols-4 gap-2 pt-1">
                        {photos.slice(0, 4).map((photoUrl, pIdx) => {
                          const isLastAndMore = pIdx === 3 && photos.length > 4;
                          return (
                            <div 
                              key={pIdx}
                              onClick={() => openLightbox(item, pIdx)}
                              className="relative aspect-4/3 rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-amber-400 transition-all shadow-xs group/thumb bg-slate-200"
                            >
                              <img 
                                src={photoUrl} 
                                alt={`${item.titulo} foto ${pIdx + 1}`} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-110"
                              />
                              {isLastAndMore ? (
                                <div className="absolute inset-0 bg-slate-950/80 text-white flex flex-col items-center justify-center p-1 text-center backdrop-blur-xs">
                                  <span className="text-xs font-black text-amber-300">+{photos.length - 4}</span>
                                  <span className="text-[9px] font-bold uppercase">Ver más</span>
                                </div>
                              ) : (
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                  <Maximize2 size={12} className="text-white" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 text-center pt-3 font-medium">
                    Haz clic en cualquier fotografía para abrir la galería interactiva
                  </p>
                </div>

                {/* SECCIÓN 2: INFORMACIÓN Y FICHA TÉCNICA (50% en desktop) */}
                <div className="lg:w-1/2 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    
                    {/* Encabezado del Espacio */}
                    <div>
                      <div className="flex items-center space-x-2 text-xs font-black text-amber-700 uppercase tracking-widest mb-1">
                        <Sparkles size={14} className="text-amber-500" />
                        <span>Instalación Oficial</span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black text-blue-950 tracking-tight">
                        {item.titulo}
                      </h3>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      {item.descripcion}
                    </p>

                    {item.contextoPremium && (
                      <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/70 text-xs text-amber-900 italic font-medium leading-relaxed">
                        "{item.contextoPremium}"
                      </div>
                    )}

                    {/* Especificaciones Clave */}
                    <div className="grid grid-cols-2 gap-2.5 pt-2 text-xs font-bold text-slate-700">
                      {item.capacidadPersonas && (
                        <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                          <Users size={16} className="text-amber-600 flex-shrink-0" />
                          <div>
                            <span className="block text-[10px] text-slate-400 uppercase font-black">Capacidad:</span>
                            <span className="font-extrabold text-slate-900">{item.capacidadPersonas}</span>
                          </div>
                        </div>
                      )}

                      {item.dimensionesArea && (
                        <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                          <Building2 size={16} className="text-blue-900 flex-shrink-0" />
                          <div>
                            <span className="block text-[10px] text-slate-400 uppercase font-black">Dimensiones:</span>
                            <span className="font-extrabold text-slate-900">{item.dimensionesArea}</span>
                          </div>
                        </div>
                      )}

                      {item.disponibilidadHorario && (
                        <div className="col-span-2 flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                          <Clock size={16} className="text-slate-500 flex-shrink-0" />
                          <div>
                            <span className="block text-[10px] text-slate-400 uppercase font-black">Disponibilidad:</span>
                            <span className="font-extrabold text-slate-900">{item.disponibilidadHorario}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Amenidades y Servicios */}
                    {item.amenidades && item.amenidades.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                          Amenidades y Servicios Incluidos:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {item.amenidades.map((amenidad, aIdx) => (
                            <div key={aIdx} className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 bg-amber-50/50 p-2 rounded-xl border border-amber-200/50">
                              <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />
                              <span className="truncate">{amenidad}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Acciones de Contacto y Reserva */}
                  <div className="pt-4 border-t border-slate-150 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setModalItem(item)}
                      className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-2xl transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Info size={15} />
                      <span>Ficha Completa</span>
                    </button>

                    <a
                      href={`https://wa.me/${tel.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola, deseo solicitar información, disponibilidad y cotización para el espacio: "${item.titulo}" del Club de Leones de Quetzaltenango.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:flex-1 py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs rounded-2xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer"
                    >
                      <Phone size={15} />
                      <span>Cotizar y Agendar Visita</span>
                    </a>
                  </div>
                </div>

              </article>
            );
          })}
        </div>
      )}

      {/* LIGHTBOX / VISOR DE FOTOS EN PANTALLA COMPLETA */}
      {lightboxData && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setLightboxData(null)}
        >
          {/* Header del Lightbox */}
          <div className="flex items-center justify-between text-white pb-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <div>
              <span className="text-amber-400 text-xs font-black uppercase tracking-wider block">Galería del Espacio</span>
              <h3 className="text-lg sm:text-xl font-black">{lightboxData.espacio.titulo}</h3>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-slate-400 bg-white/10 px-3 py-1.5 rounded-full">
                {lightboxData.currentIndex + 1} / {lightboxData.espacio.allImages.length}
              </span>
              <button
                type="button"
                onClick={() => setLightboxData(null)}
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Imagen Central con Flechas de Navegación */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden my-2" onClick={e => e.stopPropagation()}>
            <img 
              src={lightboxData.espacio.allImages[lightboxData.currentIndex]} 
              alt={lightboxData.espacio.titulo} 
              className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200" 
            />

            {lightboxData.espacio.allImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevLightboxImage}
                  className="absolute left-2 sm:left-4 bg-slate-900/80 hover:bg-slate-900 text-white p-3 rounded-full backdrop-blur-md transition-all shadow-xl cursor-pointer"
                >
                  <ChevronLeft size={24} />
                </button>

                <button
                  type="button"
                  onClick={nextLightboxImage}
                  className="absolute right-2 sm:right-4 bg-slate-900/80 hover:bg-slate-900 text-white p-3 rounded-full backdrop-blur-md transition-all shadow-xl cursor-pointer"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          {/* Miniaturas Inferiores del Lightbox */}
          <div className="flex items-center justify-center space-x-2 overflow-x-auto py-2 flex-shrink-0 max-w-2xl mx-auto" onClick={e => e.stopPropagation()}>
            {lightboxData.espacio.allImages.map((imgUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setLightboxData({ ...lightboxData, currentIndex: idx })}
                className={`w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 transition-all cursor-pointer border-2 ${
                  idx === lightboxData.currentIndex 
                    ? 'border-amber-400 scale-105 shadow-md' 
                    : 'border-transparent opacity-50 hover:opacity-100'
                }`}
              >
                <img src={imgUrl} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DE FICHA COMPLETA DEL ESPACIO */}
      {modalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] max-w-2xl w-full shadow-2xl border border-amber-300/80 overflow-hidden animate-in zoom-in-95 duration-200 text-left max-h-[90vh] flex flex-col">
            
            <div className="relative h-64 sm:h-72 bg-slate-900 flex-shrink-0">
              <img 
                src={modalItem.allImages[0] || modalItem.url} 
                alt={modalItem.titulo} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
              
              <button
                type="button"
                onClick={() => setModalItem(null)}
                className="absolute top-4 right-4 bg-slate-900/70 hover:bg-slate-900 text-white p-2 rounded-full backdrop-blur-md transition-all cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="absolute bottom-4 left-6 right-6 text-white">
                <span className="inline-block px-3 py-1 bg-amber-500 text-blue-950 text-[10px] font-black uppercase tracking-wider rounded-full mb-1">
                  {modalItem.tipoEspacio === 'salon' ? 'Salón de Eventos' : modalItem.tipoEspacio === 'parqueo' ? 'Estacionamiento' : 'Oficina'}
                </span>
                <h3 className="text-2xl font-black text-white">{modalItem.titulo}</h3>
              </div>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Descripción del Espacio</h4>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  {modalItem.descripcion}
                </p>
                {modalItem.contextoPremium && (
                  <p className="text-xs text-blue-900 italic mt-2 bg-blue-50/80 p-3 rounded-xl border border-blue-100">
                    "{modalItem.contextoPremium}"
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/70 text-xs">
                {modalItem.capacidadPersonas && (
                  <div>
                    <span className="block font-bold text-slate-400 uppercase text-[10px]">Capacidad:</span>
                    <span className="font-black text-slate-800">{modalItem.capacidadPersonas}</span>
                  </div>
                )}
                {modalItem.dimensionesArea && (
                  <div>
                    <span className="block font-bold text-slate-400 uppercase text-[10px]">Área / Superficie:</span>
                    <span className="font-black text-slate-800">{modalItem.dimensionesArea}</span>
                  </div>
                )}
                {modalItem.tarifaReferencial && (
                  <div>
                    <span className="block font-bold text-slate-400 uppercase text-[10px]">Tarifa Referencial:</span>
                    <span className="font-black text-amber-700">{modalItem.tarifaReferencial}</span>
                  </div>
                )}
                {modalItem.disponibilidadHorario && (
                  <div>
                    <span className="block font-bold text-slate-400 uppercase text-[10px]">Horarios & Disponibilidad:</span>
                    <span className="font-black text-slate-800">{modalItem.disponibilidadHorario}</span>
                  </div>
                )}
              </div>

              {modalItem.amenidades && modalItem.amenidades.length > 0 && (
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Servicios y Amenidades Incluidas</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {modalItem.amenidades.map((amenidad, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-xs font-bold text-slate-700 bg-white p-2 rounded-xl border border-slate-200/80">
                        <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
                        <span>{amenidad}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setModalItem(null)}
                className="px-5 py-2.5 text-slate-600 font-bold text-xs hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Cerrar
              </button>
              
              <a
                href={`https://wa.me/${(modalItem.telefonoContacto || defaultWhatsapp).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola, deseo cotizar y agendar una visita para el espacio: "${modalItem.titulo}" del Club de Leones Quetzaltenango.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all flex items-center space-x-2 shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
              >
                <Phone size={14} />
                <span>Contactar y Agendar Visita</span>
              </a>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
