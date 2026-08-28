import React, { useState, useMemo } from 'react';
import { 
  Building2, Users, Car, Briefcase, Sparkles, CheckCircle2, Phone, Calendar, 
  MapPin, Clock, ArrowRight, ExternalLink, ShieldCheck, Tag, Info, ChevronRight, X
} from 'lucide-react';
import { GaleriaItem } from '../types';
import { formatDisplayDate } from '../utils/dateSpanishFormatter';

interface RentasSalonesSectionProps {
  items: GaleriaItem[];
}

export const RentasSalonesSection: React.FC<RentasSalonesSectionProps> = ({ items }) => {
  const [selectedTipo, setSelectedTipo] = useState<'todos' | 'salon' | 'parqueo' | 'oficina'>('todos');
  const [modalItem, setModalItem] = useState<GaleriaItem | null>(null);

  // Filtrar items correspondientes a rentas
  const rentasItems = useMemo(() => {
    return items.filter(item => 
      item.categoria === 'Rentas & Salones del Club' || 
      item.esRenta || 
      item.tipoEspacio !== undefined
    );
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedTipo === 'todos') return rentasItems;
    return rentasItems.filter(item => item.tipoEspacio === selectedTipo);
  }, [rentasItems, selectedTipo]);

  const defaultWhatsapp = '50277612345'; // WhatsApp de contacto del club

  return (
    <div className="space-y-12 animate-in fade-in duration-500 text-left">
      
      {/* Banner Principal de Promoción de Instalaciones */}
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
            El Club de Leones de Quetzaltenango pone a disposición de la comunidad sus amplios salones de eventos sociales y corporativos, estacionamiento privado y oficinas en una ubicación céntrica y segura de la zona 1.
          </p>

          {/* Highlights de las instalaciones */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-700/60">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
              <MapPin size={16} className="text-amber-400 flex-shrink-0" />
              <span>Zona 1 Céntrica</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
              <Users size={16} className="text-amber-400 flex-shrink-0" />
              <span>Hasta 300 personas</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
              <Car size={16} className="text-amber-400 flex-shrink-0" />
              <span>Parqueo Privado</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
              <ShieldCheck size={16} className="text-amber-400 flex-shrink-0" />
              <span>Seguridad & Prestigio</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros por Tipo de Espacio */}
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
            <span>Todos los Espacios ({rentasItems.length})</span>
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
            <span>Salones de Eventos ({rentasItems.filter(i => i.tipoEspacio === 'salon').length})</span>
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
            <span>Parqueo ({rentasItems.filter(i => i.tipoEspacio === 'parqueo').length})</span>
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
            <span>Oficinas & Módulos ({rentasItems.filter(i => i.tipoEspacio === 'oficina').length})</span>
          </button>
        </div>

        <span className="text-xs font-bold text-slate-500">
          Ubicación: Calle Rodolfo Robles 24-53, Zona 1, Quetzaltenango
        </span>
      </div>

      {/* Grid de Espacios en Alquiler */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8 space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <Building2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">
            {rentasItems.length === 0 ? "Catálogo de Salones y Rentas en Preparación" : "No hay espacios registrados en esta categoría"}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            {rentasItems.length === 0 
              ? "Pronto estarán disponibles las fotografías y especificaciones completas de los salones, parqueo y oficinas. Puedes contactarnos directamente para cotizaciones."
              : "Selecciona otra categoría o explora todos los espacios disponibles."}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map(item => {
            const isSalon = item.tipoEspacio === 'salon' || !item.tipoEspacio;
            const isParqueo = item.tipoEspacio === 'parqueo';
            const isOficina = item.tipoEspacio === 'oficina';
            const tel = item.telefonoContacto || defaultWhatsapp;

            return (
              <div 
                key={item.id} 
                className="bg-white rounded-[2rem] border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group hover:border-amber-400/60 text-left"
              >
                {/* Imagen del Espacio */}
                <div className="relative h-64 overflow-hidden bg-slate-100 cursor-pointer" onClick={() => setModalItem(item)}>
                  <img 
                    src={item.url} 
                    alt={item.titulo}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
                  
                  {/* Badge de Tipo de Espacio */}
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-md backdrop-blur-md flex items-center space-x-1.5 text-white ${
                      isSalon ? 'bg-amber-600/95' : isParqueo ? 'bg-blue-800/95' : 'bg-indigo-700/95'
                    }`}>
                      {isSalon ? <Users size={12} /> : isParqueo ? <Car size={12} /> : <Briefcase size={12} />}
                      <span>{isSalon ? 'Salón de Eventos' : isParqueo ? 'Parqueo Seguro' : isOficina ? 'Oficina / Módulo' : 'Espacio del Club'}</span>
                    </span>
                  </div>

                  {/* Tarifa Referencial */}
                  {item.tarifaReferencial && (
                    <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md text-slate-900 px-3 py-1 rounded-xl text-xs font-black shadow-md border border-slate-200/60">
                      {item.tarifaReferencial}
                    </div>
                  )}
                </div>

                {/* Contenido / Detalles */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-blue-950 transition-colors line-clamp-1">
                      {item.titulo}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {item.descripcion}
                    </p>
                  </div>

                  {/* Especificaciones clave */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs font-bold text-slate-700">
                    {item.capacidadPersonas && (
                      <div className="flex items-center space-x-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <Users size={14} className="text-amber-600 flex-shrink-0" />
                        <span className="truncate">{item.capacidadPersonas}</span>
                      </div>
                    )}
                    {item.dimensionesArea && (
                      <div className="flex items-center space-x-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <Building2 size={14} className="text-blue-900 flex-shrink-0" />
                        <span className="truncate">{item.dimensionesArea}</span>
                      </div>
                    )}
                    {item.disponibilidadHorario && (
                      <div className="col-span-2 flex items-center space-x-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <Clock size={14} className="text-slate-500 flex-shrink-0" />
                        <span className="truncate">{item.disponibilidadHorario}</span>
                      </div>
                    )}
                  </div>

                  {/* Amenidades destacadas (hasta 3) */}
                  {item.amenidades && item.amenidades.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.amenidades.slice(0, 3).map((amenidad, aIdx) => (
                        <span key={aIdx} className="inline-flex items-center text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60 px-2 py-0.5 rounded-lg">
                          <CheckCircle2 size={10} className="mr-1 text-amber-600" />
                          {amenidad}
                        </span>
                      ))}
                      {item.amenidades.length > 3 && (
                        <span className="text-[10px] font-bold text-slate-400 self-center">
                          +{item.amenidades.length - 3} más
                        </span>
                      )}
                    </div>
                  )}

                  {/* Botones de Acción */}
                  <div className="pt-3 border-t border-slate-100 flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setModalItem(item)}
                      className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Info size={14} />
                      <span>Ver Ficha</span>
                    </button>

                    <a
                      href={`https://wa.me/${tel.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola, deseo solicitar cotización y disponibilidad del espacio: "${item.titulo}" del Club de Leones de Quetzaltenango.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-sm shadow-emerald-600/20 active:scale-95 cursor-pointer"
                    >
                      <Phone size={14} />
                      <span>Cotizar</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Detalle Completo de Espacio */}
      {modalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] max-w-2xl w-full shadow-2xl border border-amber-300/80 overflow-hidden animate-in zoom-in-95 duration-200 text-left max-h-[90vh] flex flex-col">
            
            {/* Cabecera del Modal con Imagen */}
            <div className="relative h-64 sm:h-72 bg-slate-900 flex-shrink-0">
              <img 
                src={modalItem.url} 
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

            {/* Contenido Scrolleable */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Descripción del Espacio</h4>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  {modalItem.descripcion}
                </p>
                {modalItem.contextoPremium && (
                  <p className="text-xs text-blue-900/80 italic mt-2 bg-blue-50/60 p-3 rounded-xl border border-blue-100">
                    "{modalItem.contextoPremium}"
                  </p>
                )}
              </div>

              {/* Grid de Especificaciones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/70 text-xs">
                {modalItem.capacidadPersonas && (
                  <div>
                    <span className="block font-bold text-slate-400 uppercase text-[10px]">Capacidad:</span>
                    <span className="font-black text-slate-800">{modalItem.capacidadPersonas}</span>
                  </div>
                )}
                {modalItem.dimensionesArea && (
                  <div>
                    <span className="block font-bold text-slate-400 uppercase text-[10px]">Área / Dimensiones:</span>
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

              {/* Amenidades Completas */}
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

            {/* Footer Modal */}
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
