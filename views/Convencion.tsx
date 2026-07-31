import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Calendar, 
  Award, 
  Sparkles, 
  Clock, 
  Users, 
  CheckCircle2, 
  Compass, 
  Music, 
  Coffee, 
  Send,
  Flag,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  AlertCircle,
  Check,
  ExternalLink,
  Building2,
  Handshake
} from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { telegramService } from '../services/telegramService';
import { ConvencionConfig, ConvencionRegistro } from '../types';

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const ZONAS_CLUBS: Record<string, string[]> = {
  'Zona A-1': [
    'Guatemala Central',
    'Guatemala Tikal',
    'Guatemala Utatlán',
    'Guatemala Leo - León',
    'Mixco',
    'Otro Club'
  ],
  'Zona A-2': [
    'Guatemala 63',
    'Guatemala China',
    'Guatemala Nuevo Centenario',
    'Guatemala Quiché',
    'Otro Club'
  ],
  'Zona A-3': [
    'Guatemala Humanitaria',
    'Guatemala Nueva Era',
    'Guatemala Nueva Generación China',
    'Guatemala Reforma',
    'Guatemala Sacatepéquez',
    'Otro Club'
  ],
  'Zona B-1': [
    'Acatenango Centenario',
    'Antigua',
    'Chimaltenango',
    'Cotzumalguapa L C',
    'Escuintla',
    'Escuintla Universitario Susana de Maldonado',
    'Otro Club'
  ],
  'Zona B-2': [
    'Cotzumalguapa Profesionales',
    'Granados',
    'Guatemala 4 x 4 Off Road',
    'San Lucas Sacatepéquez',
    'Santa Cruz el Chol',
    'Tiquisate',
    'Otro Club'
  ],
  'Zona C-1': [
    'Huehuetenango',
    'Quetzaltenango',
    'Salcajá',
    'San Cristóbal Totonicapán',
    'Santa Cruz del Quiché',
    'Otro Club'
  ],
  'Zona C-2': [
    'Catarina El Sitio',
    'Malacatán',
    'San Pedro Sacatepéquez Valle de la Esmeralda',
    'San Rafael Pie de la Cuesta',
    'Otro Club'
  ],
  'Zona C-3': [
    'Coatepeque',
    'Retalhuleu',
    'Otro Club'
  ],
  'Zona C-4': [
    'Coatepeque Universitario',
    'Flores y Génova',
    'La Blanca',
    'Mazatenango Suchitepéquez',
    'Otro Club'
  ],
  'Zona D-1': [
    'Chiquimula',
    'Chiquimulilla',
    'Jalpatagua Servidores de la Humanidad',
    'Jutiapa',
    'Jutiapa Damas del Centenario',
    'Otro Club'
  ],
  'Zona D-2': [
    'Cobán Alta Verapaz',
    'Salamá',
    'San Jerónimo',
    'Otro Club'
  ],
  'Zona D-3': [
    'Jalapa',
    'Mataquescuintla',
    'Monjas',
    'Santa Cruz Naranjo',
    'Otro Club'
  ],
  'Otro / Internacional': [
    'Otro Club'
  ]
};

const REGION_ZONES: { region: string; color: string; zonas: string[] }[] = [
  { region: 'Región A', color: 'from-blue-500 to-blue-600', zonas: ['Zona A-1', 'Zona A-2', 'Zona A-3'] },
  { region: 'Región B', color: 'from-emerald-500 to-emerald-600', zonas: ['Zona B-1', 'Zona B-2'] },
  { region: 'Región C', color: 'from-amber-500 to-amber-600', zonas: ['Zona C-1', 'Zona C-2', 'Zona C-3', 'Zona C-4'] },
  { region: 'Región D', color: 'from-rose-500 to-rose-600', zonas: ['Zona D-1', 'Zona D-2', 'Zona D-3'] },
];

const CARGO_OPTIONS = [
  { value: 'Socio', label: 'Socio Regular', icon: '🦁' },
  { value: 'Presidente', label: 'Presidente de Club', icon: '🔨' },
  { value: 'Secretario', label: 'Secretario', icon: '📝' },
  { value: 'Tesorero', label: 'Tesorero', icon: '💰' },
  { value: 'Gobernador', label: 'Gobernador / Vicegobernador', icon: '🏛️' },
  { value: 'Leo', label: 'Socio Leo', icon: '🌟' },
  { value: 'Otro', label: 'Otro Cargo', icon: '🔷' },
];

const ALIANZAS_CONVENCION = [
  { id: 'alianza-1', name: 'Lions Clubs International', category: 'Organización Mundial', icon: '🦁', badge: 'Oficial' },
  { id: 'alianza-2', name: 'Distrito D3 Guatemala', category: 'Gobernación Distrital', icon: '🏛️', badge: 'Anfitrión' },
  { id: 'alianza-3', name: 'Colina Country Club', category: 'Sede Oficial', icon: '🏰', badge: 'Complejo' },
  { id: 'alianza-4', name: 'Municipalidad de Quetzaltenango', category: 'Cultura Altense', icon: '🇬🇹', badge: 'Gobierno' },
  { id: 'alianza-5', name: 'INGUAT', category: 'Turismo Guatemala', icon: '🌄', badge: 'Institucional' },
  { id: 'alianza-6', name: 'Club de Leones Quetzaltenango', category: 'Comité Organizador', icon: '👑', badge: 'Anfitriones' },
  { id: 'alianza-7', name: 'Leo Club International', category: 'Liderazgo Juvenil', icon: '⭐', badge: 'Juventud' },
  { id: 'alianza-8', name: 'Cámara de Comercio Xela', category: 'Desarrollo Regional', icon: '🤝', badge: 'Aliado' }
];

export default function Convencion() {
  const [config, setConfig] = useState<ConvencionConfig>({
    titulo: 'Distrito D3 Guatemala',
    lema: 'Rugiendo con fuerza, sirviendo con amor y uniendo voluntades por nuestra nación',
    fechaEvento: '2026-03-19',
    horaEvento: '08:00:00',
    fotoSede: 'https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?auto=format&fit=crop&w=800&q=80',
    inscripcionesAbiertas: true
  });

  const [countdown, setCountdown] = useState<CountdownState>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    club: 'Guatemala Central',
    cargo: 'Socio',
    distrito: 'Zona A-1'
  });

  const [telefonoDigitos, setTelefonoDigitos] = useState('');
  const [customClub, setCustomClub] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Custom dropdown states
  const [openDropdown, setOpenDropdown] = useState<'cargo' | 'zona' | 'club' | null>(null);
  const cargoRef = useRef<HTMLDivElement>(null);
  const zonaRef = useRef<HTMLDivElement>(null);
  const clubRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        cargoRef.current && !cargoRef.current.contains(e.target as Node) &&
        zonaRef.current && !zonaRef.current.contains(e.target as Node) &&
        clubRef.current && !clubRef.current.contains(e.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load config from Firestore on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const dbConfig = await firebaseService.getConvencionConfig();
        if (dbConfig) {
          setConfig(prev => ({
            ...prev,
            ...dbConfig,
            inscripcionesAbiertas: dbConfig.inscripcionesAbiertas !== undefined ? dbConfig.inscripcionesAbiertas : true
          }));
        }
      } catch (error) {
        console.error("Error al cargar configuración de convención:", error);
      } finally {
        setFetching(false);
      }
    };
    loadConfig();
  }, []);

  // Countdown timer logic based on dynamic config date
  useEffect(() => {
    const parseTargetDate = () => {
      try {
        if (!config.fechaEvento) return 0;
        const dateParts = config.fechaEvento.split('-'); // ["2026", "03", "19"]
        const timeParts = (config.horaEvento || "00:00:00").split(':'); // ["08", "00", "00"]
        
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // 0-indexed
        const day = parseInt(dateParts[2], 10);
        const hours = parseInt(timeParts[0] || "0", 10);
        const minutes = parseInt(timeParts[1] || "0", 10);
        const seconds = parseInt(timeParts[2] || "0", 10);
        
        return new Date(year, month, day, hours, minutes, seconds).getTime();
      } catch (e) {
        console.error("Error parsing date:", e);
        return 0;
      }
    };

    const targetDate = parseTargetDate();

    const calculateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0 || isNaN(difference)) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  }, [config.fechaEvento, config.horaEvento]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 8);
    setTelefonoDigitos(val);
    setForm(prev => ({
      ...prev,
      telefono: val ? `+502${val}` : ''
    }));
  };

  const handleZoneSelect = (selectedZone: string) => {
    const defaultClub = ZONAS_CLUBS[selectedZone]?.[0] || '';
    setForm(prev => ({
      ...prev,
      distrito: selectedZone,
      club: defaultClub
    }));
    setCustomClub('');
    setOpenDropdown(null);
  };

  const handleClubSelect = (selectedClub: string) => {
    setForm(prev => ({
      ...prev,
      club: selectedClub
    }));
    if (selectedClub !== 'Otro Club') {
      setCustomClub('');
    }
    setOpenDropdown(null);
  };

  const handleCargoSelect = (selectedCargo: string) => {
    setForm(prev => ({
      ...prev,
      cargo: selectedCargo
    }));
    setOpenDropdown(null);
  };

  const handleResetForm = () => {
    setForm({
      nombre: '',
      email: '',
      telefono: '',
      club: 'Guatemala Central',
      cargo: 'Socio',
      distrito: 'Zona A-1'
    });
    setTelefonoDigitos('');
    setCustomClub('');
    setIsSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (telefonoDigitos.length !== 8) {
      alert("Por favor, ingresa un número de teléfono válido de 8 dígitos.");
      return;
    }
    
    const finalClub = (form.distrito === 'Otro / Internacional' || form.club === 'Otro Club') 
      ? customClub.trim() 
      : form.club;

    if ((form.distrito === 'Otro / Internacional' || form.club === 'Otro Club') && !finalClub) {
      alert("Por favor, ingresa el nombre de tu club.");
      return;
    }

    setLoading(true);
    
    try {
      const nuevoRegistro: ConvencionRegistro = {
        id: `reg_${Date.now()}`,
        ...form,
        club: finalClub,
        fechaRegistro: new Date().toISOString()
      };
      
      await firebaseService.saveConvencionRegistro(nuevoRegistro);
      
      // 1. Enviar webhook de correo automático por Google Apps Script
      telegramService.sendGoogleScriptWebhook(nuevoRegistro, config?.googleScriptUrl).catch(err => {
        console.warn("No se pudo enviar webhook de correo:", err);
      });

      // 2. Enviar notificación por Telegram al comité organizador
      telegramService.notifyNuevaInscripcionConvencion(
        nuevoRegistro, 
        config?.telegramBotToken, 
        config?.telegramChatId
      ).catch(err => {
        console.warn("No se pudo enviar notificación de Telegram:", err);
      });

      setIsSubmitted(true);
    } catch (error) {
      console.error("Error al registrar participante:", error);
      alert("Hubo un problema al registrar tus datos. Por favor inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Music': return Music;
      case 'Flag': return Flag;
      case 'Coffee': return Coffee;
      case 'Award': return Award;
      case 'Sparkles': return Sparkles;
      case 'Clock': return Clock;
      case 'Users': return Users;
      default: return Sparkles;
    }
  };

  // Helper to format Spanish date
  const formatFriendlyDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 -mt-10 -mx-4 sm:-mx-6 lg:-mx-8 overflow-x-hidden">
      {/* Hero / Header Section */}
      <header className="relative bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 text-white overflow-hidden py-16 sm:py-32 border-b border-yellow-500/20 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(253,224,71,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.1),transparent_50%)]" />
        
        <div className="absolute -right-20 -bottom-20 w-72 sm:w-96 h-72 sm:h-96 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-72 sm:w-96 h-72 sm:h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider mb-4 sm:mb-6 animate-pulse">
            <Sparkles size={14} className="sm:w-4 sm:h-4" />
            <span>Convención Nacional</span>
          </div>

          <h1 className="text-3xl sm:text-6xl font-black tracking-tight leading-tight sm:leading-none bg-gradient-to-r from-white via-slate-100 to-yellow-300 bg-clip-text text-transparent px-2">
            {config.titulo}
          </h1>
          <p className="mt-4 sm:mt-6 text-base sm:text-2xl text-slate-200 font-serif max-w-3xl mx-auto italic leading-relaxed px-2">
            "{config.lema}"
          </p>

          {/* Location & Date Badge */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-xs sm:text-base font-bold text-slate-350">
            <div className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white/5 px-4 sm:px-5 py-2.5 rounded-2xl border border-white/10 shadow-sm">
              <Calendar className="text-yellow-400 shrink-0" size={16} />
              <span>Inicia el {formatFriendlyDate(config.fechaEvento)}</span>
            </div>
            <div className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white/5 px-4 sm:px-5 py-2.5 rounded-2xl border border-white/10 shadow-sm">
              <MapPin className="text-yellow-400 shrink-0" size={16} />
              <span>Quetzaltenango, Guatemala</span>
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="mt-10 sm:mt-16">
            <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-yellow-400 mb-3 sm:mb-4">El gran rugido inicia en:</p>
            <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-lg mx-auto">
              {[
                { label: 'Días', value: countdown.days },
                { label: 'Horas', value: countdown.hours },
                { label: 'Minutos', value: countdown.minutes },
                { label: 'Segundos', value: countdown.seconds }
              ].map((item, idx) => (
                <div key={idx} className="bg-blue-950/75 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 sm:p-5 flex flex-col items-center justify-center shadow-2xl">
                  <span className="text-xl sm:text-4xl font-extrabold text-white tracking-tight">{String(item.value).padStart(2, '0')}</span>
                  <span className="text-[9px] sm:text-xs font-black uppercase text-slate-400 mt-0.5 sm:mt-2 tracking-wider">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTA */}
          <div className="mt-8 sm:mt-12">
            <button 
              type="button"
              onClick={scrollToPreInscripcion}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-blue-955 font-black px-8 py-4 rounded-2xl text-base sm:text-lg transition-all shadow-xl shadow-yellow-500/20 active:scale-95 min-h-[48px] cursor-pointer"
            >
              <span>{config.inscripcionesAbiertas ? 'Pre-regístrate Aquí' : 'Ver Inscripciones'}</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Alianzas & Patrocinadores Prominent Marquee Section */}
      <section className="my-8 sm:my-12 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-950 via-blue-955 to-slate-950 rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-10 border-2 border-yellow-500/30 shadow-2xl shadow-blue-950/50 relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="mb-4 sm:mb-8 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-white/10 pb-4 sm:pb-6 relative z-10 text-center sm:text-left">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 sm:p-3 bg-yellow-500/20 rounded-2xl border border-yellow-500/40 text-yellow-400 shrink-0">
                <Handshake size={22} className="animate-pulse sm:w-6 sm:h-6" />
              </div>
              <div>
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-yellow-400 block">
                  Respaldos & Alianzas Institucionales
                </span>
                <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                  Aliados Estratégicos de la LXIV Convención
                </h3>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-350 max-w-md font-medium">
              Unidos por la fraternidad, la cultura y el liderazgo de servicio en Guatemala.
            </p>
          </div>

          {/* Marquee Track with gradient edge masks */}
          <div className="relative w-full overflow-hidden py-1 sm:py-2">
            {/* Gradient Masks */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-36 bg-gradient-to-r from-slate-950 to-transparent z-20" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-36 bg-gradient-to-l from-slate-950 to-transparent z-20" />

            {/* Scrolling Marquee Container with Square Slides and Text Below */}
            <div className="animate-marquee flex items-start space-x-4 sm:space-x-8 py-2 sm:py-3">
              {[
                ...((config.alianzas && config.alianzas.length > 0) ? config.alianzas : ALIANZAS_CONVENCION),
                ...((config.alianzas && config.alianzas.length > 0) ? config.alianzas : ALIANZAS_CONVENCION)
              ].map((aliado, index) => (
                <div 
                  key={index}
                  className="flex flex-col items-center group shrink-0 cursor-pointer"
                >
                  {/* Square Logo Slide Box — Fondo Blanco para PNGs y Transparencias */}
                  <div className="w-28 h-28 sm:w-44 sm:h-44 aspect-square rounded-2xl sm:rounded-3xl bg-white border-2 border-slate-200 group-hover:border-yellow-500 shadow-xl flex items-center justify-center p-3 sm:p-5 relative overflow-hidden transition-all duration-300 transform group-hover:-translate-y-1.5 group-hover:shadow-yellow-500/20">
                    {/* Badge Label */}
                    {aliado.badge && (
                      <span className="absolute top-2 right-2 text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-blue-955 bg-yellow-400 border border-yellow-500/50 px-2 sm:px-2.5 py-0.5 rounded-full shadow-sm z-10">
                        {aliado.badge}
                      </span>
                    )}

                    {/* Image or Icon */}
                    {aliado.logoUrl ? (
                      <img 
                        src={aliado.logoUrl} 
                        alt={aliado.name}
                        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-3xl sm:text-5xl group-hover:scale-110 transition-transform duration-300">
                        {aliado.icon || '🤝'}
                      </span>
                    )}
                  </div>

                  {/* Text Below the Square Slide */}
                  <div className="mt-2 sm:mt-3 text-center space-y-0.5 max-w-[110px] sm:max-w-[176px]">
                    <h4 className="text-xs sm:text-base font-extrabold text-white group-hover:text-yellow-300 transition-colors line-clamp-2 leading-tight">
                      {aliado.name}
                    </h4>
                    <p className="text-[10px] sm:text-xs text-slate-350 font-medium line-clamp-1">
                      {aliado.category}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ciudad Sede Section */}
      <section className="py-12 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-4 sm:space-y-6">
            <div className="inline-flex items-center space-x-2 bg-blue-900/10 border border-blue-900/20 text-blue-900 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
              <MapPin size={14} />
              <span>Ciudad Sede</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Quetzaltenango: La Cuna de la Cultura y el Escudo Altense
            </h2>
            
            <p className="text-slate-650 text-sm sm:text-base leading-relaxed">
              Xelajú nos recibe con sus brazos abiertos, sus impresionantes montañas, historia centenaria y el caluroso espíritu león de la región. Prepárate para vivir jornadas inolvidables de liderazgo y fraternidad.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
              <div className="bg-white border border-slate-200/80 p-4 sm:p-5 rounded-2xl shadow-sm space-y-1">
                <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider block">Clima Templado</span>
                <p className="text-slate-600 text-xs font-medium">Ideal para noches de gala y caminatas culturales por el centro histórico.</p>
              </div>
              <div className="bg-white border border-slate-200/80 p-4 sm:p-5 rounded-2xl shadow-sm space-y-1">
                <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider block">Gastronomía Única</span>
                <p className="text-slate-600 text-xs font-medium">Degusta el famoso Sheca, chocolate artesanal y platillos tradicionales.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white shadow-slate-300/50 group">
              <img 
                src={config.fotoSede || "https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&q=80&w=1200"} 
                alt="Quetzaltenango Sede"
                className="w-full h-64 sm:h-96 object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6">
                <div className="text-white space-y-1">
                  <span className="bg-yellow-500 text-blue-955 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {config.fotoSedeEtiqueta || "Sede Oficial"}
                  </span>
                  <p className="text-sm font-bold text-slate-100">
                    {config.fotoSedeDescripcion || "Quetzaltenango, Guatemala — Ciudad de la Estrella de Occidente"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Instalaciones del Evento Section (Colina Country Club) */}
      <section className="py-12 sm:py-20 bg-slate-100/70 border-t border-slate-200/80 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4">
            <div className="inline-flex items-center space-x-2 bg-yellow-500/20 border border-yellow-500/40 text-yellow-800 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
              <Building2 size={14} />
              <span>Instalaciones del Evento</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Colina Country Club
            </h2>
            <p className="text-slate-650 text-sm sm:text-base max-w-2xl mx-auto">
              Un exclusivo y prestigioso centro de convenciones en Quetzaltenango (Km 223.5 Carretera CITO 180), diseñado con salones monumentales, vistas panorámicas y jardines de primer nivel.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Card 1: Salón Doña Beatriz */}
            <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="relative h-48 sm:h-56 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80" 
                    alt="Salón Doña Beatriz Colina Country Club"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-blue-900/90 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow">
                    Salón Principal
                  </div>
                </div>
                <div className="p-5 sm:p-6 space-y-2 sm:space-y-3">
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">Salón Doña Beatriz</h3>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    El salón más grande e imponente de la región. Cuenta con dos balcones, área de bar, gran altura con acústica perfecta y capacidad para plenarias multitudinarias.
                  </p>
                </div>
              </div>
              <div className="p-5 sm:p-6 pt-0 border-t border-slate-100 flex items-center justify-between text-xs text-blue-900 font-extrabold mt-3 sm:mt-4">
                <span>Capacidad Auditorio</span>
                <span className="bg-yellow-500/15 text-yellow-800 px-2.5 py-1 rounded-lg">Hasta 1,000 Personas</span>
              </div>
            </div>

            {/* Card 2: Jardines y Áreas al Aire Libre */}
            <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="relative h-48 sm:h-56 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=1200&q=80" 
                    alt="Jardines Colina Country Club"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-emerald-800/90 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow">
                    Naturaleza & Vista
                  </div>
                </div>
                <div className="p-5 sm:p-6 space-y-2 sm:space-y-3">
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">Jardines & Áreas Exteriores</h3>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Hermosas áreas verdes y jardines campestres del complejo, diseñados para cócteles de bienvenida, actividades de convivencia y momentos de esparcimiento fraterno.
                  </p>
                </div>
              </div>
              <div className="p-5 sm:p-6 pt-0 border-t border-slate-100 flex items-center justify-between text-xs text-blue-900 font-extrabold mt-3 sm:mt-4">
                <span>Ambiente</span>
                <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg">Cóctel & Exteriores</span>
              </div>
            </div>

            {/* Card 3: Capilla & Servicios Gastronómicos */}
            <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="relative h-48 sm:h-56 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80" 
                    alt="Capilla y Banquetes Colina Country Club"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80";
                    }}
                  />
                  <div className="absolute top-4 left-4 bg-amber-800/90 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow">
                    Capilla & Banquetes
                  </div>
                </div>
                <div className="p-5 sm:p-6 space-y-2 sm:space-y-3">
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">Capilla Privada & Alta Cocina</h3>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Instalaciones integrales con capilla propia para actos de acción de gracias, además de un equipo culinario experto a cargo de los banquetes solemnes.
                  </p>
                </div>
              </div>
              <div className="p-5 sm:p-6 pt-0 border-t border-slate-100 flex items-center justify-between text-xs text-blue-900 font-extrabold mt-3 sm:mt-4">
                <span>Servicios</span>
                <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg">Banquetes & Capilla</span>
              </div>
            </div>
          </div>

          {/* Call to Action to Visit Colina Country Club Website */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-yellow-500/20 text-center sm:text-left">
            <div className="space-y-2 max-w-xl">
              <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                Conoce la Sede Virtualmente
              </span>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight">¿Quieres explorar todas las instalaciones del evento?</h3>
              <p className="text-slate-300 text-xs sm:text-sm">
                Visita el sitio oficial de Colina Country Club para descubrir más sobre sus galerías de fotos, salones y ubicación en Quetzaltenango.
              </p>
            </div>

            <a 
              href="https://colinacountryclub.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-blue-955 font-black px-6 py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-xl shadow-yellow-500/10 active:scale-95 shrink-0 min-h-[48px]"
            >
              <span>Visitar Sitio Oficial</span>
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* Actividades Culturales Section */}
      <section className="bg-slate-900 text-white py-12 sm:py-20 relative overflow-hidden border-y border-yellow-500/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(253,224,71,0.03),transparent_40%)]" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4">
            <div className="inline-flex items-center space-x-2 bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
              <Award size={14} />
              <span>Agenda de Hermandad</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight bg-gradient-to-r from-white to-yellow-300 bg-clip-text text-transparent">
              Actividades Culturales y Sociales
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
              La convención no es solo trabajo de planificación; también es el espacio ideal para disfrutar del arte, la hermandad y compartir tradiciones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-10 sm:mt-16">
            {(config.actividadesCulturales || []).map((act, index) => {
              const IconComponent = getIconComponent(act.iconName);
              return (
                <div 
                  key={act.id || index}
                  className="bg-slate-800/60 border border-slate-700/60 hover:border-yellow-500/40 rounded-3xl p-6 sm:p-8 transition-all duration-300 flex flex-col justify-between group hover:shadow-2xl hover:shadow-yellow-500/5"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <IconComponent size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight">{act.title}</h3>
                    <p className="text-slate-350 text-xs sm:text-sm leading-relaxed">{act.description}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-700/50 flex items-center justify-between text-xs text-yellow-400 font-extrabold">
                    <span>Cronograma</span>
                    <span>{act.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Experiencias Únicas Section */}
      <section className="py-12 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4 mb-10 sm:mb-16">
          <div className="inline-flex items-center space-x-2 bg-blue-900/10 border border-blue-900/20 text-blue-900 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
            <Compass size={14} />
            <span>Mística Leonística</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Experiencias Únicas de la Convención
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">
            Vive de cerca los pilares fundamentales que nos guían como Club de Leones a nivel mundial y nacional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {(config.experienciasUnicas || []).map((exp, index) => (
            <div 
              key={exp.id || index}
              className="bg-white border border-slate-150 hover:border-slate-250 rounded-3xl sm:rounded-[2rem] p-6 sm:p-8 shadow-xl shadow-slate-100/50 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-3 sm:space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-900 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full inline-block">
                  {exp.badge}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight pt-1">{exp.title}</h3>
                <p className="text-slate-650 text-xs sm:text-sm leading-relaxed">{exp.desc}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-blue-900 font-extrabold text-xs group cursor-pointer">
                <span>Conocer más detalles</span>
                <ChevronRight size={14} className="ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pre-registro Form Section */}
      <section id="pre-inscripcion" className="py-12 sm:py-20 bg-gradient-to-br from-blue-900 to-indigo-955 text-white relative overflow-visible border-t border-yellow-500/20 px-3 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(253,224,71,0.05),transparent_40%)] pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="bg-blue-950/80 backdrop-blur-xl border border-white/15 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-12 shadow-2xl">
            
            {fetching ? (
              <div className="text-center py-12 flex flex-col items-center justify-center">
                <Clock className="w-8 h-8 text-yellow-400 animate-spin" />
                <p className="mt-3 text-slate-350 text-sm font-bold">Cargando formulario de inscripciones...</p>
              </div>
            ) : config.inscripcionesAbiertas ? (
              !isSubmitted ? (
                <div>
                  <div className="text-center max-w-2xl mx-auto space-y-3 sm:space-y-4 mb-8 sm:mb-10">
                    <div className="inline-flex items-center space-x-2 bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
                      <ShieldCheck size={14} />
                      <span>Inscripciones</span>
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight bg-gradient-to-r from-white to-yellow-300 bg-clip-text text-transparent">
                      Formulario de Pre-inscripción
                    </h2>
                    <p className="text-slate-300 text-xs sm:text-base">
                      Pre-regístrate hoy mismo para asegurar tu cupo prioritario y recibir las tarifas especiales de hospedaje y credenciales en cuanto se abran las inscripciones formales.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {/* Nombre */}
                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-350" htmlFor="nombre">Nombre Completo</label>
                        <input 
                          type="text" 
                          id="nombre"
                          name="nombre"
                          value={form.nombre}
                          onChange={handleChange}
                          required
                          placeholder="Ej. Juan Pérez"
                          className="w-full bg-blue-900/60 border border-white/20 focus:border-yellow-500 rounded-2xl px-4 py-3.5 text-white text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder:text-slate-500 min-h-[48px]"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-350" htmlFor="email">Correo Electrónico</label>
                        <input 
                          type="email" 
                          id="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          required
                          placeholder="ejemplo@correo.com"
                          className="w-full bg-blue-900/60 border border-white/20 focus:border-yellow-500 rounded-2xl px-4 py-3.5 text-white text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder:text-slate-500 min-h-[48px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {/* Teléfono / Telegram */}
                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-350" htmlFor="telefono">Teléfono / Telegram</label>
                        <div className="flex items-center bg-blue-900/60 border border-white/20 focus-within:border-yellow-500 rounded-2xl focus-within:ring-2 focus-within:ring-yellow-500/20 transition-all overflow-hidden min-h-[48px]">
                          <span className="bg-white/10 px-3.5 sm:px-4 py-3.5 text-white text-sm font-bold border-r border-white/15 select-none shrink-0">
                            +502
                          </span>
                          <input 
                            type="text" 
                            id="telefono"
                            name="telefono"
                            value={telefonoDigitos}
                            onChange={handlePhoneChange}
                            required
                            maxLength={8}
                            placeholder="12345678"
                            className="w-full bg-transparent px-4 py-3.5 text-white text-base sm:text-sm focus:outline-none placeholder:text-slate-500"
                          />
                        </div>
                      </div>

                      {/* Cargo — Custom Dropdown */}
                      <div className="space-y-1.5 sm:space-y-2" ref={cargoRef}>
                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-350">Cargo Leonístico Actual</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenDropdown(openDropdown === 'cargo' ? null : 'cargo')}
                            className={`w-full flex items-center justify-between bg-blue-900/60 border ${openDropdown === 'cargo' ? 'border-yellow-500 ring-2 ring-yellow-500/20' : 'border-white/20'} rounded-2xl px-4 py-3.5 text-white text-base sm:text-sm transition-all text-left min-h-[48px]`}
                          >
                            <span className="flex items-center space-x-2 truncate">
                              <span>{CARGO_OPTIONS.find(c => c.value === form.cargo)?.icon}</span>
                              <span className="truncate">{CARGO_OPTIONS.find(c => c.value === form.cargo)?.label || form.cargo}</span>
                            </span>
                            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${openDropdown === 'cargo' ? 'rotate-180' : ''}`} />
                          </button>
                          {openDropdown === 'cargo' && (
                            <div className="absolute z-50 mt-2 w-full rounded-2xl border border-white/15 bg-blue-955/95 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                              {CARGO_OPTIONS.map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => handleCargoSelect(opt.value)}
                                  className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors text-left ${form.cargo === opt.value ? 'bg-yellow-500/15 text-yellow-400' : 'text-white hover:bg-white/10'}`}
                                >
                                  <span className="flex items-center space-x-3">
                                    <span className="text-base">{opt.icon}</span>
                                    <span className="font-semibold">{opt.label}</span>
                                  </span>
                                  {form.cargo === opt.value && <Check size={16} className="text-yellow-400 shrink-0" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tarjeta Informativa de Telegram — Ocupa el ancho de ambas columnas para simetría perfecta */}
                      <div className="sm:col-span-2 bg-blue-955/90 border border-yellow-500/30 rounded-2xl p-4 sm:p-5 space-y-3 text-xs">
                        <p className="text-slate-200 text-xs leading-relaxed flex items-start space-x-2">
                          <span className="text-yellow-400 text-base shrink-0">📲</span>
                          <span>
                            Te recomendamos tener instalada la aplicación oficial de <strong>Telegram</strong> en tu teléfono para recibir de forma automática avisos instantáneos, boletines del programa y beneficios exclusivos de tu inscripción.
                          </span>
                        </p>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2 border-t border-white/10">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-yellow-400 shrink-0 text-center sm:text-left">Descargar app oficial:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto">
                            <a 
                              href="https://play.google.com/store/apps/details?id=org.telegram.messenger" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center space-x-1.5 text-xs font-bold bg-white/10 hover:bg-yellow-500 hover:text-blue-955 text-white px-3.5 py-2 rounded-xl transition-all border border-white/15 shadow-sm min-h-[40px]"
                            >
                              <span>🤖 Android (Play Store)</span>
                            </a>
                            <a 
                              href="https://apps.apple.com/app/telegram-messenger/id686449807" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center space-x-1.5 text-xs font-bold bg-white/10 hover:bg-yellow-500 hover:text-blue-955 text-white px-3.5 py-2 rounded-xl transition-all border border-white/15 shadow-sm min-h-[40px]"
                            >
                              <span>🍎 iPhone (App Store)</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {/* Zona — Custom Dropdown */}
                      <div className="space-y-1.5 sm:space-y-2" ref={zonaRef}>
                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-350">Zona a la que pertenece</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenDropdown(openDropdown === 'zona' ? null : 'zona')}
                            className={`w-full flex items-center justify-between bg-blue-900/60 border ${openDropdown === 'zona' ? 'border-yellow-500 ring-2 ring-yellow-500/20' : 'border-white/20'} rounded-2xl px-4 py-3.5 text-white text-base sm:text-sm transition-all text-left min-h-[48px]`}
                          >
                            <span className="truncate">{form.distrito}</span>
                            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${openDropdown === 'zona' ? 'rotate-180' : ''}`} />
                          </button>
                          {openDropdown === 'zona' && (
                            <div className="absolute z-50 mt-2 w-full rounded-2xl border border-white/15 bg-blue-955/95 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-72 overflow-y-auto">
                              {REGION_ZONES.map((rg) => (
                                <div key={rg.region}>
                                  <div className={`px-4 py-2 bg-gradient-to-r ${rg.color} text-white text-[10px] font-black uppercase tracking-widest sticky top-0`}>
                                    🏛️ {rg.region}
                                  </div>
                                  {rg.zonas.map((z) => (
                                    <button
                                      key={z}
                                      type="button"
                                      onClick={() => handleZoneSelect(z)}
                                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-left ${form.distrito === z ? 'bg-yellow-500/15 text-yellow-400' : 'text-white hover:bg-white/10'}`}
                                    >
                                      <span className="font-semibold">{z}</span>
                                      {form.distrito === z && <Check size={14} className="text-yellow-400 shrink-0" />}
                                    </button>
                                  ))}
                                </div>
                              ))}
                              {/* Otro / Internacional */}
                              <div className="border-t border-white/10">
                                <button
                                  type="button"
                                  onClick={() => handleZoneSelect('Otro / Internacional')}
                                  className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors text-left ${form.distrito === 'Otro / Internacional' ? 'bg-yellow-500/15 text-yellow-400' : 'text-white hover:bg-white/10'}`}
                                >
                                  <span className="font-semibold">🌎 Otro / Internacional</span>
                                  {form.distrito === 'Otro / Internacional' && <Check size={14} className="text-yellow-400 shrink-0" />}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Club de Leones de Pertenencia — Custom Dropdown */}
                      <div className="space-y-1.5 sm:space-y-2" ref={clubRef}>
                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-350">Club de Leones de Pertenencia</label>
                        {form.distrito === 'Otro / Internacional' ? (
                          <input 
                            type="text" 
                            id="club"
                            name="club"
                            value={customClub}
                            onChange={(e) => setCustomClub(e.target.value)}
                            required
                            placeholder="Ej. Club de Leones Internacional"
                            className="w-full bg-blue-900/60 border border-white/20 focus:border-yellow-500 rounded-2xl px-4 py-3.5 text-white text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder:text-slate-500 min-h-[48px]"
                          />
                        ) : (
                          <>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setOpenDropdown(openDropdown === 'club' ? null : 'club')}
                                className={`w-full flex items-center justify-between bg-blue-900/60 border ${openDropdown === 'club' ? 'border-yellow-500 ring-2 ring-yellow-500/20' : 'border-white/20'} rounded-2xl px-4 py-3.5 text-white text-base sm:text-sm transition-all text-left min-h-[48px]`}
                              >
                                <span className="truncate">{form.club}</span>
                                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${openDropdown === 'club' ? 'rotate-180' : ''}`} />
                              </button>
                              {openDropdown === 'club' && (
                                <div className="absolute z-50 mt-2 w-full rounded-2xl border border-white/15 bg-blue-955/95 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto">
                                  {(ZONAS_CLUBS[form.distrito] || []).map((c) => (
                                    <button
                                      key={c}
                                      type="button"
                                      onClick={() => handleClubSelect(c)}
                                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-left ${form.club === c ? 'bg-yellow-500/15 text-yellow-400' : 'text-white hover:bg-white/10'} ${c === 'Otro Club' ? 'border-t border-white/10 italic text-slate-300' : ''}`}
                                    >
                                      <span className="font-semibold">{c === 'Otro Club' ? '✏️ Otro Club...' : c}</span>
                                      {form.club === c && <Check size={14} className="text-yellow-400 shrink-0" />}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            {form.club === 'Otro Club' && (
                              <input 
                                type="text" 
                                id="customClub"
                                value={customClub}
                                onChange={(e) => setCustomClub(e.target.value)}
                                required
                                placeholder="Escribe el nombre de tu Club"
                                className="w-full bg-blue-900/60 border border-white/20 focus:border-yellow-500 rounded-2xl px-4 py-3.5 text-white text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder:text-slate-500 mt-2 min-h-[48px]"
                              />
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-blue-955 font-black px-6 py-4 rounded-2xl text-base transition-all shadow-xl shadow-yellow-500/10 active:scale-95 disabled:opacity-50 min-h-[52px]"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-blue-955 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Send size={18} />
                            <span>Enviar Pre-registro</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="text-center py-12 space-y-6 animate-in fade-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-yellow-500 text-blue-955 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-yellow-500/10">
                    <CheckCircle2 size={44} />
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tight">¡Pre-inscripción Confirmada!</h3>
                  <p className="text-slate-200 text-base max-w-lg mx-auto leading-relaxed">
                    ¡Bienvenido, Compañero León <strong className="text-yellow-400 font-extrabold">{form.nombre}</strong>! Tu pre-inscripción a la Convención ha sido confirmada. Ahora podrás recibir información importante a tiempo de los avances, actividades del programa y beneficios tempranos por tu confirmación.
                  </p>
                  <div className="pt-6">
                    <button 
                      onClick={handleResetForm}
                      className="text-xs font-extrabold uppercase tracking-wider text-yellow-400 hover:text-yellow-500 border border-yellow-500/25 px-5 py-2.5 rounded-xl bg-yellow-500/5 transition-colors"
                    >
                      Registrar a otro socio
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="text-center py-16 space-y-4 animate-in fade-in duration-300">
                <div className="w-16 h-16 bg-white/5 border border-white/10 text-yellow-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">Inscripciones Abiertas Muy Pronto</h3>
                <p className="text-slate-300 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                  El portal de pre-registro digital para la Convención Nacional se habilitará en los próximos días. ¡Mantente atento al rugido de la hermandad!
                </p>
                <div className="pt-4">
                  <span className="inline-block bg-yellow-500/10 text-yellow-450 border border-yellow-500/20 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider">
                    Distrito D3 Guatemala
                  </span>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>
    </div>
  );
}
