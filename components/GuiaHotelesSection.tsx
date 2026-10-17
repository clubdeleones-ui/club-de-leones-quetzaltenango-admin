import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  Car, 
  Phone, 
  MessageCircle, 
  Globe, 
  Download, 
  Check, 
  Coffee, 
  Wifi, 
  Sparkles, 
  ShieldCheck, 
  DollarSign, 
  Users, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  Home, 
  Star, 
  Award,
  Clock,
  Layers,
  Copy,
  CheckCircle2,
  Maximize2,
  Minimize2
} from 'lucide-react';

export interface HabitacionTarifa {
  nombre: string;
  capacidad: string;
  precio: number;
  precioTexto: string;
  descripcion?: string;
  incluyeDesayuno?: boolean;
}

export interface ApartamentoOpcion {
  nombre: string;
  distribucion: string;
  precios: { personas: string; precio: number; precioTexto: string }[];
}

export interface HotelGuia {
  id: string;
  nombre: string;
  subtitulo: string;
  zona: string;
  distanciaMinutos: number;
  distanciaTexto: string;
  tarifaEspecialLeon: boolean;
  precioMinimo: number;
  precioMinimoTexto: string;
  badge: {
    texto: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
  };
  descripcion: string;
  fotos: string[];
  amenidades: string[];
  habitaciones: HabitacionTarifa[];
  apartamentos?: ApartamentoOpcion[];
  contacto: {
    telefono?: string;
    whatsapp?: string;
    sitioWeb?: string;
    facebook?: string;
  };
  indicacionesReserva?: string;
  notaEspecial?: string;
}

export const HOTELES_CONVENCION: HotelGuia[] = [
  {
    id: 'bella-luna',
    nombre: 'Hotel Bella Luna',
    subtitulo: 'Carretera a Salcajá y Periférico de Quetzaltenango',
    zona: 'Periférico / Salcajá',
    distanciaMinutos: 3,
    distanciaTexto: 'A 3 minutos de La Colina Country Club',
    tarifaEspecialLeon: true,
    precioMinimo: 275,
    precioMinimoTexto: 'Q.275.00',
    badge: {
      texto: 'Tarifa Especial para Socios Leones',
      bgClass: 'bg-yellow-500/20',
      textClass: 'text-yellow-300',
      borderClass: 'border-yellow-500/40'
    },
    descripcion: 'Único hotel con tarifa especial exclusiva acordada para los socios y familias Leonísticas. Ubicado estratégicamente a 3 minutos del Centro de Convenciones La Colina Country Club.',
    fotos: [
      './images/hoteles_guia/bella-luna-1.webp',
      './images/hoteles_guia/bella-luna-2.webp'
    ],
    amenidades: [
      'Tarifa exclusiva socios',
      'Restaurante en jardín',
      'Servicio a la habitación',
      'Wi-Fi gratuito',
      'Estacionamiento frente a habitación'
    ],
    habitaciones: [
      {
        nombre: 'Habitación Doble (Convenio Leones)',
        capacidad: '2 Personas',
        precio: 275,
        precioTexto: 'Q.275.00',
        descripcion: 'Tarifa preferencial para convencionistas. Al reservar, identificarse como socio de su Club de Leones.'
      }
    ],
    contacto: {
      telefono: '7926 8123',
      sitioWeb: 'https://hotelbellaluna.com/'
    },
    indicacionesReserva: 'Al momento de solicitar su reserva vía telefónica o web, informe que asiste a la 75 Convención Nacional de Leones para aplicar su tarifa especial.',
    notaEspecial: 'Tarifa especial sujeta a disponibilidad de cupos.'
  },
  {
    id: 'loma-real-inn',
    nombre: 'Hotel Loma Real Inn',
    subtitulo: 'A la par de La Colina Country Club',
    zona: 'Inmediaciones Sede',
    distanciaMinutos: 1,
    distanciaTexto: 'A solo 1 minuto en vehículo de la Sede',
    tarifaEspecialLeon: false,
    precioMinimo: 200,
    precioMinimoTexto: 'Q.200.00',
    badge: {
      texto: 'El Hotel Más Cercano a la Sede',
      bgClass: 'bg-emerald-500/20',
      textClass: 'text-emerald-300',
      borderClass: 'border-emerald-500/40'
    },
    descripcion: 'Es el establecimiento más próximo al Centro de Convenciones. Se encuentra prácticamente a la par (1 minuto en vehículo). Por seguridad vial sobre la vía rápida, no se recomienda el traslado peatonal.',
    fotos: [
      './images/hoteles_guia/loma-real-1.webp',
      './images/hoteles_guia/loma-real-2.webp'
    ],
    amenidades: [
      'Proximidad inmediata (1 min)',
      'Baño privado',
      'Agua caliente garantizada',
      'TV con cable',
      'Wi-Fi y Parqueo'
    ],
    habitaciones: [
      {
        nombre: 'Habitación Individual',
        capacidad: '1 Persona (Cama Matrimonial)',
        precio: 200,
        precioTexto: 'Q.200.00',
        descripcion: 'Baño privado, agua caliente, TV con cable, Wi-Fi y parqueo.'
      },
      {
        nombre: 'Habitación Doble',
        capacidad: '2 Personas (2 Camas Matrimoniales)',
        precio: 375,
        precioTexto: 'Q.375.00',
        descripcion: 'Baño privado, agua caliente, TV con cable, Wi-Fi y parqueo.'
      },
      {
        nombre: 'Habitación Triple',
        capacidad: '3 Personas (2 Camas Matrimoniales)',
        precio: 550,
        precioTexto: 'Q.550.00',
        descripcion: 'Baño privado, agua caliente, TV con cable, Wi-Fi y parqueo.'
      },
      {
        nombre: 'Habitación Cuádruple',
        capacidad: '4 Personas (2 Camas Matrimoniales)',
        precio: 650,
        precioTexto: 'Q.650.00',
        descripcion: 'Baño privado, agua caliente, TV con cable, Wi-Fi y parqueo.'
      }
    ],
    contacto: {
      telefono: '7926 8260',
      whatsapp: '3970 3898',
      sitioWeb: 'https://hotellomarealinn.com/'
    },
    indicacionesReserva: 'Dispone de cama adicional por Q.100.00. Reserva sugerida con anticipación.',
    notaEspecial: 'Traslado en vehículo recomendado (1 min).'
  },
  {
    id: 'premiere-occidente',
    nombre: 'Hotel Premiere de Occidente',
    subtitulo: 'Centro Histórico, a 1 cuadra del Teatro Municipal',
    zona: 'Zona 1 (Centro Histórico)',
    distanciaMinutos: 15,
    distanciaTexto: 'A 15 minutos de La Colina Country Club',
    tarifaEspecialLeon: false,
    precioMinimo: 300,
    precioMinimoTexto: 'Q.300.00 / pers.',
    badge: {
      texto: 'Centro Histórico & Apartamentos Familiares',
      bgClass: 'bg-purple-500/20',
      textClass: 'text-purple-300',
      borderClass: 'border-purple-500/40'
    },
    descripcion: 'Ubicado en el corazón de Quetzaltenango a una cuadra del histórico Teatro Municipal. Ideal para quienes deseen combinar la convención con la belleza arquitectónica y gastronómica de Xela. Dispone de habitaciones y amplios apartamentos equipados para grupos y delegaciones.',
    fotos: [
      './images/hoteles_guia/premiere-occidente-1.webp',
      './images/hoteles_guia/premiere-occidente-2.webp'
    ],
    amenidades: [
      'Pleno Centro Histórico',
      'Apartamentos completos',
      'Cocinas totalmente equipadas',
      'Seguridad las 24 horas',
      'Estacionamiento incluido',
      'Wi-Fi y Clóset'
    ],
    habitaciones: [
      {
        nombre: 'Habitación 1 Persona',
        capacidad: '1 Persona',
        precio: 300,
        precioTexto: 'Q.300.00',
        descripcion: 'Baño privado, TV cable, 1 parqueo, seguridad 24h, Wi-Fi.'
      },
      {
        nombre: 'Habitación 2 Personas',
        capacidad: '2 Personas',
        precio: 500,
        precioTexto: 'Q.500.00',
        descripcion: 'Baño privado, TV cable, 1 parqueo, seguridad 24h, Wi-Fi.'
      },
      {
        nombre: 'Habitación 3 Personas',
        capacidad: '3 Personas',
        precio: 650,
        precioTexto: 'Q.650.00',
        descripcion: 'Baño privado, TV cable, 1 parqueo, seguridad 24h, Wi-Fi.'
      }
    ],
    apartamentos: [
      {
        nombre: 'Apartamento 1 (2 Baños Privados)',
        distribucion: 'Sala, comedor, cocina completamente equipada, 2 baños privados y 2 habitaciones (3 camas: 1 King y 2 Matrimoniales).',
        precios: [
          { personas: '1 Persona', precio: 500, precioTexto: 'Q.500.00' },
          { personas: '2 Personas', precio: 900, precioTexto: 'Q.900.00' },
          { personas: '3 a 4 Personas', precio: 1100, precioTexto: 'Q.1,100.00' },
          { personas: '5 a 6 Personas', precio: 1300, precioTexto: 'Q.1,300.00' }
        ]
      },
      {
        nombre: 'Apartamento 2 (1 Baño Privado)',
        distribucion: 'Sala, comedor, cocina equipada, baño privado y 2 habitaciones (3 camas: 1 King y 2 Matrimoniales).',
        precios: [
          { personas: '1 Persona', precio: 400, precioTexto: 'Q.400.00' },
          { personas: '2 Personas', precio: 700, precioTexto: 'Q.700.00' },
          { personas: '3 a 4 Personas', precio: 900, precioTexto: 'Q.900.00' },
          { personas: '5 a 6 Personas', precio: 1100, precioTexto: 'Q.1,100.00' }
        ]
      },
      {
        nombre: 'Apartamento 3 (1 Baño Privado)',
        distribucion: 'Sala, comedor, cocina equipada, baño privado y 2 habitaciones (3 camas: 1 King y 2 Matrimoniales).',
        precios: [
          { personas: '1 Persona', precio: 450, precioTexto: 'Q.450.00' },
          { personas: '2 Personas', precio: 800, precioTexto: 'Q.800.00' },
          { personas: '3 a 4 Personas', precio: 1000, precioTexto: 'Q.1,000.00' },
          { personas: '5 a 6 Personas', precio: 1200, precioTexto: 'Q.1,200.00' }
        ]
      }
    ],
    contacto: {
      telefono: '4217 5346',
      facebook: 'https://www.facebook.com/p/Hotel-Premiere-de-Occidente-./'
    },
    indicacionesReserva: 'Niños de 6 a 12 años: Q.50.00. Mayores de 13 años abonan tarifa regular. Excelente opción para compartir en comitiva de club.',
    notaEspecial: 'Las tarifas de habitaciones estándar se cotizan por persona.'
  },
  {
    id: 'grand-santa-maria',
    nombre: 'Grand Santa Maria Hotel',
    subtitulo: 'Zona 7, cercanía a centros comerciales y accesos viales',
    zona: 'Zona 7',
    distanciaMinutos: 25,
    distanciaTexto: 'A 25 minutos de La Colina Country Club',
    tarifaEspecialLeon: false,
    precioMinimo: 570,
    precioMinimoTexto: 'Q.570.00',
    badge: {
      texto: 'Desayunos de Cortesía Incluidos',
      bgClass: 'bg-amber-500/20',
      textClass: 'text-amber-300',
      borderClass: 'border-amber-500/40'
    },
    descripcion: 'Alojamiento confortable en la Zona 7 de Quetzaltenango, muy cerca de centros comerciales. Todas sus tarifas por noche incluyen desayunos de cortesía, ofreciendo descanso de alto nivel y excelente atención.',
    fotos: [
      './images/hoteles_guia/grand-santa-maria-1.webp',
      './images/hoteles_guia/grand-santa-maria-2.webp'
    ],
    amenidades: [
      'Desayuno de cortesía incluido',
      'Camas Queen y Matrimoniales',
      'Parqueo privado',
      'Wi-Fi de alta velocidad',
      'Atención personalizada'
    ],
    habitaciones: [
      {
        nombre: 'Habitación Sencilla',
        capacidad: '1 Cama Matrimonial',
        precio: 570,
        precioTexto: 'Q.570.00 / noche',
        incluyeDesayuno: true,
        descripcion: 'Incluye 1 desayuno de cortesía.'
      },
      {
        nombre: 'Habitación de Pareja',
        capacidad: '1 Cama Queen',
        precio: 670,
        precioTexto: 'Q.670.00 / noche',
        incluyeDesayuno: true,
        descripcion: 'Incluye 2 desayunos de cortesía.'
      },
      {
        nombre: 'Habitación Doble',
        capacidad: '2 Camas Matrimoniales',
        precio: 750,
        precioTexto: 'Q.750.00 / noche',
        incluyeDesayuno: true,
        descripcion: 'Incluye 2 desayunos de cortesía.'
      }
    ],
    contacto: {
      telefono: '7828 2800',
      whatsapp: '3013 2805',
      facebook: 'https://www.facebook.com/grandsantamaria'
    },
    indicacionesReserva: 'Mencione la 75 Convención de Leones al contactar por WhatsApp o llamada para consultar disponibilidad y opciones.'
  },
  {
    id: 'latam-hotel',
    nombre: 'LATAM Hotel Plaza Pradera Xela',
    subtitulo: 'Zona 3, dentro del C.C. Pradera Xela',
    zona: 'Zona 3 (Pradera Xela)',
    distanciaMinutos: 30,
    distanciaTexto: 'A 30 minutos de La Colina Country Club',
    tarifaEspecialLeon: false,
    precioMinimo: 799,
    precioMinimoTexto: 'Q.799.00',
    badge: {
      texto: 'Gama Alta & Centro Comercial Integrado',
      bgClass: 'bg-blue-500/20',
      textClass: 'text-blue-300',
      borderClass: 'border-blue-500/40'
    },
    descripcion: 'Ubicado dentro del Centro Comercial Pradera Xela, con acceso inmediato a Walmart, restaurantes de renombre, food court, farmacias, bancos y tiendas comerciales. Estándar corporativo e internacional.',
    fotos: [
      './images/hoteles_guia/latam-hotel-1.webp',
      './images/hoteles_guia/latam-hotel-2.webp'
    ],
    amenidades: [
      'Centro Comercial Pradera Xela',
      'Acceso directo a Walmart y Bancos',
      'Seguridad y parqueo de primer nivel',
      'Instalaciones corporativas',
      'Restaurante y Bar ejecutivo'
    ],
    habitaciones: [
      {
        nombre: 'Habitación Sencilla',
        capacidad: '1 Persona',
        precio: 799,
        precioTexto: 'Q.799.00',
        descripcion: 'Confort de estándar internacional.'
      },
      {
        nombre: 'Habitación Doble',
        capacidad: '2 Personas',
        precio: 899,
        precioTexto: 'Q.899.00',
        descripcion: 'Ideal para 2 adultos.'
      },
      {
        nombre: 'Junior Suite Doble',
        capacidad: 'Junior Suite',
        precio: 950,
        precioTexto: 'Q.950.00',
        descripcion: 'Espacio ampliado y amenidades premium.'
      }
    ],
    contacto: {
      telefono: '7797 7676',
      sitioWeb: 'https://www.latamhotelxela.com/'
    },
    indicacionesReserva: 'Consulte disponibilidad directamente en la web oficial o en recepción telefónica.'
  }
];

export const GuiaHotelesSection: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>('todos');
  const [selectedNights, setSelectedNights] = useState<number>(2); // 2 noches por defecto (Viernes a Domingo)
  
  // Control de acordeón desplegable: IDs de hoteles expandidos (inician todos cerrados por defecto)
  const [expandedHotelIds, setExpandedHotelIds] = useState<Set<string>>(() => new Set());
  
  const [expandedAptHotel, setExpandedAptHotel] = useState<string | null>(null);
  const [copiedHotelId, setCopiedHotelId] = useState<string | null>(null);

  // Filtrado de hoteles
  const filteredHoteles = useMemo(() => {
    switch (activeFilter) {
      case 'leones':
        return HOTELES_CONVENCION.filter(h => h.tarifaEspecialLeon);
      case 'cercanos':
        return HOTELES_CONVENCION.filter(h => h.distanciaMinutos <= 5);
      case 'centro':
        return HOTELES_CONVENCION.filter(h => h.zona.includes('Zona 1') || h.apartamentos);
      case 'desayuno':
        return HOTELES_CONVENCION.filter(h => h.habitaciones.some(hab => hab.incluyeDesayuno));
      case 'premium':
        return HOTELES_CONVENCION.filter(h => h.precioMinimo >= 700);
      default:
        return HOTELES_CONVENCION;
    }
  }, [activeFilter]);

  const toggleHotel = (hotelId: string) => {
    setExpandedHotelIds(prev => {
      const next = new Set(prev);
      if (next.has(hotelId)) {
        next.delete(hotelId);
      } else {
        next.add(hotelId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedHotelIds(new Set(HOTELES_CONVENCION.map(h => h.id)));
  };

  const collapseAll = () => {
    setExpandedHotelIds(new Set());
  };

  const handleCopyContact = (hotel: HotelGuia, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const textToCopy = `${hotel.nombre} • ${hotel.distanciaTexto}\nTeléfono: ${hotel.contacto.telefono || 'N/A'}${hotel.contacto.whatsapp ? ` | WhatsApp: ${hotel.contacto.whatsapp}` : ''}\nTarifa desde: ${hotel.precioMinimoTexto}\nGuía 75 Convención Leones Quetzaltenango`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedHotelId(hotel.id);
    setTimeout(() => setCopiedHotelId(null), 2500);
  };

  const allAreExpanded = filteredHoteles.every(h => expandedHotelIds.has(h.id));

  return (
    <section id="hoteles" className="my-8 sm:my-16 max-w-[1440px] mx-auto px-2 sm:px-6 lg:px-8 scroll-mt-10">
      
      {/* Encabezado Principal */}
      <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4 mb-8 sm:mb-10">
        <div className="inline-flex items-center space-x-2 bg-amber-100/90 border border-amber-300 text-amber-950 px-4.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-xs">
          <Building2 size={15} className="text-amber-700" />
          <span>Guía Oficial de Hospedaje</span>
        </div>
        
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-slate-900">
          Encuentra tu Hotel Ideal en Quetzaltenango
        </h2>
        
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-medium">
          El Comité Organizador preparó esta guía para facilitar tu estadía durante la <strong>75.ª Convención Nacional (Marzo 2027)</strong>. Haz clic en cualquier ficha para desplegar sus tarifas oficiales, fotografías y contactos directos.
        </p>

        {/* Banner Descarga PDF + Nota Oficial */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <a
            href="./pdfs/Guía de Hoteles 75 Convención D-3.pdf"
            download="Guia_Hoteles_75_Convencion_Leones.pdf"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-400 hover:from-yellow-400 hover:to-amber-300 text-blue-955 font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 shadow-lg shadow-yellow-500/20 cursor-pointer active:scale-95"
          >
            <Download size={15} />
            <span>Descargar Guía en PDF (Oficial)</span>
          </a>

          <a
            href="./pdfs/Guía de Hoteles 75 Convención D-3.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 bg-white hover:bg-slate-50 text-blue-950 font-bold px-4 py-2.5 rounded-xl text-xs border border-slate-200 transition-all shadow-xs cursor-pointer"
          >
            <ExternalLink size={14} />
            <span>Ver PDF en Pestaña</span>
          </a>
        </div>
      </div>

      {/* Barra de Controles: Filtros, Calculador de Noches y Toggle Expandir/Colapsar Todo */}
      <div className="bg-gradient-to-br from-[#0c1a38] via-[#09152e] to-[#060e1d] text-white border sm:border-2 border-yellow-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-6 shadow-xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Pills de Filtrado Rápido */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-2 w-full lg:w-auto">
            {[
              { id: 'todos', label: 'Todos los Hoteles' },
              { id: 'leones', label: '🦁 Tarifa Leones' },
              { id: 'cercanos', label: '⏱️ A 1-3 min de Sede' },
              { id: 'centro', label: '🏛️ Centro & Apartamentos' },
              { id: 'desayuno', label: '☕ Con Desayuno' },
              { id: 'premium', label: '⭐ Gama Alta' },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeFilter === f.id
                    ? 'bg-yellow-400 text-blue-955 shadow-md scale-[1.02]'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
                }`}
              >
                <span>{f.label}</span>
              </button>
            ))}
          </div>

          {/* Controles de Lado Derecho: Calculador de Noches y Botón Expandir/Colapsar Todo */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full lg:w-auto shrink-0">
            {/* Calculador de Presupuesto Rápido por Noches */}
            <div className="flex items-center space-x-2 bg-white/5 border border-white/15 px-3 py-1.5 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Clock size={12} className="text-yellow-400" />
                <span>Noches:</span>
              </span>
              <div className="inline-flex rounded-xl bg-black/40 p-0.5 border border-white/10">
                {[1, 2, 3].map(nights => (
                  <button
                    key={nights}
                    type="button"
                    onClick={() => setSelectedNights(nights)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      selectedNights === nights
                        ? 'bg-yellow-400 text-blue-955 shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {nights} {nights === 1 ? 'Noche' : 'Noches'}
                  </button>
                ))}
              </div>
            </div>

            {/* Botón Maestro Expandir / Colapsar Todo */}
            <button
              type="button"
              onClick={allAreExpanded ? collapseAll : expandAll}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-yellow-300 hover:text-yellow-200 border border-yellow-500/30 text-xs font-extrabold transition-all cursor-pointer active:scale-95 shadow-sm"
              title={allAreExpanded ? "Colapsar todas las fichas para ahorrar espacio" : "Desplegar todos los hoteles"}
            >
              {allAreExpanded ? (
                <>
                  <Minimize2 size={13} />
                  <span>Colapsar Todos</span>
                </>
              ) : (
                <>
                  <Maximize2 size={13} />
                  <span>Desplegar Todos</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Recordatorio Cordial del Comité */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-start space-x-2 text-[11px] text-slate-300 leading-relaxed font-medium">
          <AlertCircle size={14} className="text-yellow-400 shrink-0 mt-0.5" />
          <span>
            <strong>Aviso del Comité Organizador:</strong> Las tarifas y disponibilidad dependen de cada establecimiento. Recomendamos reservar pronto (muchos hoteles solicitan el pago de la 1ª noche para asegurar cupo y tarifa).
          </span>
        </div>
      </div>

      {/* Grid Desplegable: 2 Columnas en Escritorio (lg:grid-cols-2) y 1 Columna Optimizada en Móvil */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
        {filteredHoteles.map((hotel) => {
          const isExpanded = expandedHotelIds.has(hotel.id);
          const estimatedCost = hotel.precioMinimo * selectedNights;
          const isAptExpanded = expandedAptHotel === hotel.id;

          return (
            <div
              key={hotel.id}
              className={`bg-gradient-to-br from-[#0c1a38] via-[#09152e] to-[#060e1d] text-white border rounded-2xl sm:rounded-3xl shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-start ${
                isExpanded 
                  ? 'border-yellow-400/80 shadow-[0_15px_35px_rgba(0,0,0,0.45)] ring-1 ring-yellow-400/30' 
                  : 'border-yellow-500/30 hover:border-yellow-400/60 hover:shadow-2xl hover:shadow-yellow-500/10'
              }`}
            >
              {/* ENCABEZADO RESUMEN COMPACTO (Optimizado para móvil y web, cliqueable) */}
              <div
                onClick={() => toggleHotel(hotel.id)}
                className="p-3.5 sm:p-5 cursor-pointer select-none transition-colors hover:bg-white/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
              >
                {/* Lado Izquierdo: Foto miniatura + Nombre + Ubicación + Badges */}
                <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                  {/* Miniatura de la foto */}
                  {hotel.fotos && hotel.fotos[0] && (
                    <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 border border-yellow-500/40 shadow-md relative bg-slate-900">
                      <img 
                        src={hotel.fotos[0]} 
                        alt={hotel.nombre}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      {hotel.tarifaEspecialLeon && (
                        <div className="absolute top-0.5 left-0.5 bg-yellow-400 text-blue-955 text-[7.5px] font-black px-1 rounded shadow">
                          LEÓN
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-2xs ${hotel.badge.bgClass} ${hotel.badge.textClass} ${hotel.badge.borderClass}`}>
                        {hotel.badge.texto}
                      </span>

                      <span className="inline-flex items-center space-x-1 text-[10px] sm:text-[11px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        <Car size={10} className="text-amber-400" />
                        <span>{hotel.distanciaMinutos} min</span>
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight truncate hover:text-yellow-300 transition-colors">
                      {hotel.nombre}
                    </h3>

                    <div className="flex items-center space-x-1 text-slate-300 text-[11px] sm:text-xs font-medium truncate">
                      <MapPin size={11} className="text-yellow-400 shrink-0" />
                      <span className="truncate">{hotel.subtitulo}</span>
                    </div>
                  </div>
                </div>

                {/* Lado Derecho: Tarifa Base + Estimado de Noches + Acciones Rápidas */}
                <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-4 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-white/10 shrink-0">
                  <div className="text-left sm:text-right">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Desde</span>
                    <div className="text-base sm:text-xl font-black text-yellow-400 leading-tight">
                      {hotel.precioMinimoTexto}
                    </div>
                    <span className="text-[9.5px] text-yellow-300/80 font-semibold block">
                      ~Q.{estimatedCost.toLocaleString()} ({selectedNights}n)
                    </span>
                  </div>

                  {/* Botón WhatsApp Rápido en Resumen */}
                  {hotel.contacto.whatsapp ? (
                    <a
                      href={`https://wa.me/502${hotel.contacto.whatsapp.replace(/\s+/g, '')}?text=${encodeURIComponent(`Hola, me comunico para consultar disponibilidad de hospedaje con motivo de la 75 Convención de Leones en Quetzaltenango.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center justify-center p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all active:scale-95"
                      title={`WhatsApp directo con ${hotel.nombre}`}
                    >
                      <MessageCircle size={15} />
                    </a>
                  ) : hotel.contacto.telefono ? (
                    <a
                      href={`tel:${hotel.contacto.telefono.replace(/\s+/g, '')}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center justify-center p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all active:scale-95"
                      title={`Llamar a ${hotel.nombre}`}
                    >
                      <Phone size={15} />
                    </a>
                  ) : null}

                  {/* Indicador de Apertura / Cierre */}
                  <div className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-black text-yellow-300 transition-all">
                    <span>{isExpanded ? 'Cerrar' : 'Detalles'}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </div>
              </div>

              {/* CONTENIDO EXPANDIDO (Tarifas completas, Fotos, Amenidades, Contactos) */}
              {isExpanded && (
                <div className="border-t border-white/10 p-4 sm:p-7 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300 bg-black/20">
                  
                  {/* Galería de Fotos Reales */}
                  {hotel.fotos && hotel.fotos.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl overflow-hidden border border-white/10 bg-black/40 p-1.5">
                      {hotel.fotos.map((foto, fIdx) => (
                        <div key={fIdx} className="h-44 sm:h-56 rounded-xl overflow-hidden relative group/img bg-slate-900">
                          <img
                            src={foto}
                            alt={`${hotel.nombre} vista ${fIdx + 1}`}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-semibold">
                            Foto Oficial #{fIdx + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Descripción & Notas de Ubicación */}
                  <div className="space-y-2">
                    <p className="text-slate-200 text-xs sm:text-sm leading-relaxed font-medium">
                      {hotel.descripcion}
                    </p>
                    {hotel.notaEspecial && (
                      <div className="inline-flex items-center space-x-2 text-[11px] text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-xl">
                        <AlertCircle size={13} className="text-yellow-400 shrink-0" />
                        <span>{hotel.notaEspecial}</span>
                      </div>
                    )}
                  </div>

                  {/* Amenidades Principales */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                      Servicios y Amenidades Incluidas
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {hotel.amenidades.map((am, idx) => (
                        <span 
                          key={idx}
                          className="text-[11px] font-semibold bg-white/10 text-slate-200 border border-white/10 px-2.5 py-1 rounded-lg flex items-center space-x-1"
                        >
                          <Check size={12} className="text-yellow-400" />
                          <span>{am}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Desglose de Tarifas de Habitaciones */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-yellow-300 flex items-center gap-1.5">
                        <DollarSign size={14} className="text-yellow-400" />
                        <span>Tarifas Oficiales de Habitaciones (Por Noche)</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">Tarifas de la Guía Oficial</span>
                    </div>

                    <div className="space-y-2">
                      {hotel.habitaciones.map((hab, hIdx) => (
                        <div 
                          key={hIdx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-yellow-500/30 transition-all gap-2 text-left"
                        >
                          <div className="space-y-0.5">
                            <div className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                              <span>{hab.nombre}</span>
                              {hab.incluyeDesayuno && (
                                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] font-black px-1.5 py-0.5 rounded">
                                  Desayuno Incluido
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">
                              {hab.capacidad} {hab.descripcion ? `• ${hab.descripcion}` : ''}
                            </div>
                          </div>
                          <div className="text-left sm:text-right sm:shrink-0 pt-1 sm:pt-0">
                            <span className="text-base font-black text-yellow-400 block">
                              {hab.precioTexto}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ~Q.{(hab.precio * selectedNights).toLocaleString()} ({selectedNights} {selectedNights === 1 ? 'noche' : 'noches'})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Sección Especial de Apartamentos Equipados (Premiere de Occidente) */}
                    {hotel.apartamentos && (
                      <div className="pt-3 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => setExpandedAptHotel(isAptExpanded ? null : hotel.id)}
                          className="w-full flex items-center justify-between text-xs font-black text-purple-300 hover:text-purple-200 transition-colors p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <Home size={15} className="text-purple-400" />
                            <span>Ver {hotel.apartamentos.length} Apartamentos Equipados para Grupos (Hasta 6 personas)</span>
                          </span>
                          {isAptExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        {isAptExpanded && (
                          <div className="mt-3 space-y-3 animate-in fade-in duration-200">
                            {hotel.apartamentos.map((apt, aIdx) => (
                              <div key={aIdx} className="bg-black/40 border border-purple-500/30 rounded-xl p-3.5 space-y-2.5">
                                <h5 className="text-xs font-black text-purple-300">{apt.nombre}</h5>
                                <p className="text-[11px] text-slate-300 leading-relaxed">{apt.distribucion}</p>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                  {apt.precios.map((pr, pIdx) => (
                                    <div key={pIdx} className="bg-white/5 p-2 rounded-lg text-center border border-white/5">
                                      <span className="text-[10px] text-slate-400 block font-bold">{pr.personas}</span>
                                      <span className="text-xs font-black text-yellow-400 block">{pr.precioTexto}</span>
                                      <span className="text-[9px] text-slate-400">
                                        ~Q.{(pr.precio * selectedNights).toLocaleString()} ({selectedNights}n)
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Indicaciones para reservar */}
                  {hotel.indicacionesReserva && (
                    <div className="flex items-start space-x-2 text-xs text-slate-300 bg-white/5 border border-white/10 p-3.5 rounded-xl">
                      <Sparkles size={14} className="text-yellow-400 shrink-0 mt-0.5" />
                      <span><strong>Consejo para reservar:</strong> {hotel.indicacionesReserva}</span>
                    </div>
                  )}

                  {/* Acciones Directas de Contacto */}
                  <div className="pt-2 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                      {/* Botón WhatsApp */}
                      {hotel.contacto.whatsapp ? (
                        <a
                          href={`https://wa.me/502${hotel.contacto.whatsapp.replace(/\s+/g, '')}?text=${encodeURIComponent(`Hola, me comunico para consultar disponibilidad de hospedaje con motivo de la 75 Convención de Leones en Quetzaltenango.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-3 rounded-xl text-xs transition-all shadow-md cursor-pointer active:scale-95"
                        >
                          <MessageCircle size={15} />
                          <span>WhatsApp {hotel.contacto.whatsapp}</span>
                        </a>
                      ) : null}

                      {/* Botón Llamada */}
                      {hotel.contacto.telefono ? (
                        <a
                          href={`tel:${hotel.contacto.telefono.replace(/\s+/g, '')}`}
                          className="inline-flex items-center justify-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white font-black px-4 py-3 rounded-xl text-xs transition-all shadow-md cursor-pointer active:scale-95"
                        >
                          <Phone size={14} />
                          <span>Llamar: {hotel.contacto.telefono}</span>
                        </a>
                      ) : null}

                      {/* Botón Web o Facebook */}
                      {hotel.contacto.sitioWeb ? (
                        <a
                          href={hotel.contacto.sitioWeb}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center justify-center space-x-1.5 bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-3 rounded-xl text-xs border border-white/15 transition-all cursor-pointer ${
                            !hotel.contacto.whatsapp || !hotel.contacto.telefono ? '' : 'sm:col-span-2'
                          }`}
                        >
                          <Globe size={14} />
                          <span>Sitio Oficial</span>
                          <ExternalLink size={12} className="opacity-70" />
                        </a>
                      ) : hotel.contacto.facebook ? (
                        <a
                          href={hotel.contacto.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center justify-center space-x-1.5 bg-blue-700/60 hover:bg-blue-600 text-white font-bold px-4 py-3 rounded-xl text-xs border border-white/15 transition-all cursor-pointer ${
                            !hotel.contacto.whatsapp || !hotel.contacto.telefono ? '' : 'sm:col-span-2'
                          }`}
                        >
                          <Globe size={14} />
                          <span>Página Facebook</span>
                          <ExternalLink size={12} className="opacity-70" />
                        </a>
                      ) : null}
                    </div>

                    {/* Copiar datos al portapapeles */}
                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                      <button
                        type="button"
                        onClick={(e) => handleCopyContact(hotel, e)}
                        className="inline-flex items-center space-x-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer py-1"
                      >
                        {copiedHotelId === hotel.id ? (
                          <>
                            <CheckCircle2 size={13} className="text-emerald-400" />
                            <span className="text-emerald-400 font-bold">¡Datos copiados al portapapeles!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            <span>Copiar información de contacto</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleHotel(hotel.id)}
                        className="text-yellow-300 hover:text-yellow-200 font-semibold cursor-pointer"
                      >
                        Cerrar ficha ▲
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Alternativa de Airbnb y Casas Vacacionales */}
      <div className="mt-8 bg-gradient-to-r from-[#0c1a38] via-[#09152e] to-[#0c1a38] text-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-yellow-500/30 flex flex-col md:flex-row items-center justify-between gap-5 shadow-xl">
        <div className="space-y-1.5 text-center md:text-left">
          <div className="inline-flex items-center space-x-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            <Home size={12} />
            <span>Alternativa para Delegaciones y Grupos</span>
          </div>
          <h4 className="text-lg sm:text-xl font-black text-white">¿Prefieres alquilar una casa o apartamento completo en Airbnb?</h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl font-medium">
            Quetzaltenango cuenta con una nutrida oferta de alojamientos independientes en Airbnb a pocos minutos de La Colina Country Club y del Centro Histórico, ideales para delegaciones de 5 a 15 convencionistas.
          </p>
        </div>

        <a
          href="https://www.airbnb.com/s/Quetzaltenango--Guatemala/homes"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full md:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 shadow-lg shadow-rose-500/20 shrink-0 cursor-pointer active:scale-95"
        >
          <span>Buscar en Airbnb Xela</span>
          <ExternalLink size={14} />
        </a>
      </div>

    </section>
  );
};
