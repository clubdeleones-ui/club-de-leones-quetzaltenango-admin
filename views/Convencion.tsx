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
  Check
} from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
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
  { value: 'Presidente', label: 'Presidente de Club', icon: '👑' },
  { value: 'Secretario', label: 'Secretario', icon: '📝' },
  { value: 'Tesorero', label: 'Tesorero', icon: '💰' },
  { value: 'Gobernador', label: 'Gobernador / Vicegobernador', icon: '🏛️' },
  { value: 'Leo', label: 'Socio Leo', icon: '🌟' },
  { value: 'Otro', label: 'Otro Cargo', icon: '🔷' },
];

export default function Convencion() {
  const [config, setConfig] = useState<ConvencionConfig>({
    titulo: 'Distrito D3 Guatemala',
    lema: 'Rugiendo con fuerza, sirviendo con amor y uniendo voluntades por nuestra nación',
    fechaEvento: '2026-03-19',
    horaEvento: '08:00:00',
    fotoSede: 'https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?auto=format&fit=crop&w=800&q=80',
    inscripcionesAbiertas: false
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
        setConfig(dbConfig);
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
    <div className="bg-slate-50 min-h-screen text-slate-800 -mt-10 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Hero / Header Section */}
      <header className="relative bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 text-white overflow-hidden py-24 sm:py-32 border-b border-yellow-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(253,224,71,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.1),transparent_50%)]" />
        
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute -left-20 -top-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 px-4 py-2 rounded-full text-sm font-black uppercase tracking-wider mb-6 animate-pulse">
            <Sparkles size={16} />
            <span>Convención Nacional</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-slate-100 to-yellow-300 bg-clip-text text-transparent">
            {config.titulo}
          </h1>
          <p className="mt-6 text-lg sm:text-2xl text-slate-200 font-serif max-w-3xl mx-auto italic leading-relaxed">
            "{config.lema}"
          </p>

          {/* Location & Date Badge */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm sm:text-base font-bold text-slate-350">
            <div className="flex items-center space-x-2 bg-white/5 px-5 py-2.5 rounded-2xl border border-white/10 shadow-sm">
              <Calendar className="text-yellow-400" size={18} />
              <span>Inicia el {formatFriendlyDate(config.fechaEvento)}</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/5 px-5 py-2.5 rounded-2xl border border-white/10 shadow-sm">
              <MapPin className="text-yellow-400" size={18} />
              <span>Quetzaltenango, Guatemala</span>
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="mt-12 sm:mt-16">
            <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-yellow-400 mb-4">El gran rugido inicia en:</p>
            <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-lg mx-auto">
              {[
                { label: 'Días', value: countdown.days },
                { label: 'Horas', value: countdown.hours },
                { label: 'Minutos', value: countdown.minutes },
                { label: 'Segundos', value: countdown.seconds }
              ].map((item, idx) => (
                <div key={idx} className="bg-blue-950/75 backdrop-blur-md border border-white/10 rounded-2xl p-3 sm:p-5 flex flex-col items-center justify-center shadow-2xl">
                  <span className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">{String(item.value).padStart(2, '0')}</span>
                  <span className="text-[10px] sm:text-xs font-black uppercase text-slate-400 mt-1 sm:mt-2 tracking-wider">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTA */}
          <div className="mt-12">
            <a 
              href="#pre-inscripcion" 
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-blue-955 font-black px-8 py-4 rounded-2xl text-base sm:text-lg transition-all shadow-xl shadow-yellow-500/20 hover:scale-105 active:scale-95"
            >
              <span>{config.inscripcionesAbiertas ? 'Pre-regístrate Aquí' : 'Ver Inscripciones'}</span>
              <ChevronRight size={20} />
            </a>
          </div>
        </div>
      </header>

      {/* Sede Section */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-blue-900/10 border border-blue-900/20 text-blue-900 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
              <MapPin size={14} />
              <span>Ciudad Sede</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Quetzaltenango: La Cuna de la Cultura y el Fraternismo
            </h2>
            
            <p className="text-slate-650 text-base sm:text-lg leading-relaxed">
              Este año, abrimos las puertas de la majestuosa y emblemática **Quetzaltenango (Xela)**. Rodeada de imponentes volcanes, arquitectura neoclásica señorial y un clima templado idóneo para estrechar lazos leonísticos de servicio.
            </p>
            <p className="text-slate-650 text-base sm:text-lg leading-relaxed">
              La sede oficial contará con amplios salones equipados con la más alta tecnología para albergar las sesiones plenarias, foros de capacitación y celebraciones solemnes de nuestro querido Distrito D3.
            </p>
            
            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="font-extrabold text-slate-900 text-lg">Teatro Municipal</h4>
                <p className="text-xs text-slate-550 mt-1">Escenario de eventos especiales y conmemorativos.</p>
              </div>
              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="font-extrabold text-slate-900 text-lg">Hospitalidad Altense</h4>
                <p className="text-xs text-slate-550 mt-1">La calidez de nuestra gente dispuesta a servirte.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/10 to-blue-500/10 rounded-[2rem] transform rotate-3" />
            <div className="relative bg-white p-4 rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden transform -rotate-1 transition-transform hover:rotate-0 duration-500">
              <img 
                src={config.fotoSede || "https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?auto=format&fit=crop&w=800&q=80"} 
                alt="Teatro Municipal Quetzaltenango" 
                className="w-full h-80 object-cover rounded-[1.5rem]"
              />
              <div className="absolute bottom-6 left-6 right-6 bg-slate-955/80 backdrop-blur-md p-4 rounded-xl text-white">
                <p className="text-xs font-black uppercase text-yellow-400 tracking-wider">
                  {config.fotoSedeEtiqueta || "Histórico y Cultural"}
                </p>
                <p className="font-bold text-sm mt-1">
                  {config.fotoSedeDescripcion || "Sede Oficial de la Convención"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Actividades Culturales Section */}
      <section className="bg-slate-900 text-white py-20 relative overflow-hidden border-y border-yellow-500/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(253,224,71,0.03),transparent_40%)]" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
              <Award size={14} />
              <span>Agenda de Hermandad</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-none bg-gradient-to-r from-white to-yellow-300 bg-clip-text text-transparent">
              Actividades Culturales y Sociales
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
              La convención no es solo trabajo de planificación; también es el espacio ideal para disfrutar del arte, la hermandad y compartir traditions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 sm:mt-16">
            {(config.actividadesCulturales || []).map((act, index) => {
              const Icon = getIconComponent(act.iconName);
              return (
                <div 
                  key={act.id || index} 
                  className="group relative bg-white/5 border border-white/10 hover:border-yellow-500/30 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-2 hover:bg-white/10 flex flex-col justify-between shadow-lg"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon size={22} />
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight">{act.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{act.description}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-yellow-400 font-bold">
                    <div className="flex items-center space-x-1.5">
                      <Clock size={13} />
                      <span>{act.time}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Experiencias Únicas Section */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center space-x-2 bg-blue-900/10 border border-blue-900/20 text-blue-900 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(config.experienciasUnicas || []).map((exp, index) => (
            <div 
              key={exp.id || index}
              className="bg-white border border-slate-100 hover:border-slate-200 rounded-[2rem] p-8 shadow-xl shadow-slate-100/50 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-900 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full inline-block">
                  {exp.badge}
                </span>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight pt-2">{exp.title}</h3>
                <p className="text-slate-650 text-sm leading-relaxed">{exp.desc}</p>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center text-blue-900 font-extrabold text-xs group cursor-pointer">
                <span>Conocer más detalles</span>
                <ChevronRight size={14} className="ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pre-registro Form Section */}
      <section id="pre-inscripcion" className="py-20 bg-gradient-to-br from-blue-900 to-indigo-950 text-white relative overflow-hidden border-t border-yellow-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(253,224,71,0.05),transparent_40%)]" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="bg-blue-950/70 backdrop-blur-lg border border-white/10 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl">
            
            {fetching ? (
              <div className="text-center py-12 flex flex-col items-center justify-center">
                <Clock className="w-8 h-8 text-yellow-400 animate-spin" />
                <p className="mt-3 text-slate-350 text-sm font-bold">Cargando formulario de inscripciones...</p>
              </div>
            ) : config.inscripcionesAbiertas ? (
              !isSubmitted ? (
                <div>
                  <div className="text-center max-w-2xl mx-auto space-y-4 mb-10">
                    <div className="inline-flex items-center space-x-2 bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
                      <ShieldCheck size={14} />
                      <span>Inscripciones</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-none bg-gradient-to-r from-white to-yellow-300 bg-clip-text text-transparent">
                      Formulario de Pre-inscripción
                    </h2>
                    <p className="text-slate-300 text-sm sm:text-base">
                      Pre-regístrate hoy mismo para asegurar tu cupo prioritario y recibir las tarifas especiales de hospedaje y credenciales en cuanto se abran las inscripciones formales.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Nombre */}
                      <div className="space-y-2">
                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-350" htmlFor="nombre">Nombre Completo</label>
                        <input 
                          type="text" 
                          id="nombre"
                          name="nombre"
                          value={form.nombre}
                          onChange={handleChange}
                          required
                          placeholder="Ej. Juan Pérez"
                          className="w-full bg-blue-900/50 border border-white/15 focus:border-yellow-500 rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder:text-slate-550"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-350" htmlFor="email">Correo Electrónico</label>
                        <input 
                          type="email" 
                          id="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          required
                          placeholder="ejemplo@correo.com"
                          className="w-full bg-blue-900/50 border border-white/15 focus:border-yellow-500 rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder:text-slate-555"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Teléfono */}
                      <div className="space-y-2">
                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-350" htmlFor="telefono">Teléfono / WhatsApp</label>
                        <div className="flex items-center bg-blue-900/50 border border-white/15 focus-within:border-yellow-500 rounded-2xl focus-within:ring-2 focus-within:ring-yellow-500/20 transition-all overflow-hidden">
                          <span className="bg-white/10 px-4 py-3.5 text-white text-sm font-bold border-r border-white/15 select-none">
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
                            className="w-full bg-transparent px-4 py-3.5 text-white text-sm focus:outline-none placeholder:text-slate-555"
                          />
                        </div>
                      </div>

                      {/* Cargo — Custom Dropdown */}
                      <div className="space-y-2" ref={cargoRef}>
                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-350">Cargo Leonístico Actual</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenDropdown(openDropdown === 'cargo' ? null : 'cargo')}
                            className={`w-full flex items-center justify-between bg-blue-900/50 border ${openDropdown === 'cargo' ? 'border-yellow-500 ring-2 ring-yellow-500/20' : 'border-white/15'} rounded-2xl px-4 py-3.5 text-white text-sm transition-all text-left`}
                          >
                            <span className="flex items-center space-x-2">
                              <span>{CARGO_OPTIONS.find(c => c.value === form.cargo)?.icon}</span>
                              <span>{CARGO_OPTIONS.find(c => c.value === form.cargo)?.label || form.cargo}</span>
                            </span>
                            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${openDropdown === 'cargo' ? 'rotate-180' : ''}`} />
                          </button>
                          {openDropdown === 'cargo' && (
                            <div className="absolute z-50 mt-2 w-full rounded-2xl border border-white/15 bg-blue-950/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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
                                  {form.cargo === opt.value && <Check size={16} className="text-yellow-400" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Zona — Custom Dropdown */}
                      <div className="space-y-2" ref={zonaRef}>
                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-350">Zona a la que pertenece</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenDropdown(openDropdown === 'zona' ? null : 'zona')}
                            className={`w-full flex items-center justify-between bg-blue-900/50 border ${openDropdown === 'zona' ? 'border-yellow-500 ring-2 ring-yellow-500/20' : 'border-white/15'} rounded-2xl px-4 py-3.5 text-white text-sm transition-all text-left`}
                          >
                            <span>{form.distrito}</span>
                            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${openDropdown === 'zona' ? 'rotate-180' : ''}`} />
                          </button>
                          {openDropdown === 'zona' && (
                            <div className="absolute z-50 mt-2 w-full rounded-2xl border border-white/15 bg-blue-950/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-72 overflow-y-auto">
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
                                      {form.distrito === z && <Check size={14} className="text-yellow-400" />}
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
                                  {form.distrito === 'Otro / Internacional' && <Check size={14} className="text-yellow-400" />}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Club de Leones de Pertenencia — Custom Dropdown */}
                      <div className="space-y-2" ref={clubRef}>
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
                            className="w-full bg-blue-900/50 border border-white/15 focus:border-yellow-500 rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder:text-slate-555"
                          />
                        ) : (
                          <>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setOpenDropdown(openDropdown === 'club' ? null : 'club')}
                                className={`w-full flex items-center justify-between bg-blue-900/50 border ${openDropdown === 'club' ? 'border-yellow-500 ring-2 ring-yellow-500/20' : 'border-white/15'} rounded-2xl px-4 py-3.5 text-white text-sm transition-all text-left`}
                              >
                                <span>{form.club}</span>
                                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${openDropdown === 'club' ? 'rotate-180' : ''}`} />
                              </button>
                              {openDropdown === 'club' && (
                                <div className="absolute z-50 mt-2 w-full rounded-2xl border border-white/15 bg-blue-950/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto">
                                  {(ZONAS_CLUBS[form.distrito] || []).map((c) => (
                                    <button
                                      key={c}
                                      type="button"
                                      onClick={() => handleClubSelect(c)}
                                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-left ${form.club === c ? 'bg-yellow-500/15 text-yellow-400' : 'text-white hover:bg-white/10'} ${c === 'Otro Club' ? 'border-t border-white/10 italic text-slate-300' : ''}`}
                                    >
                                      <span className="font-semibold">{c === 'Otro Club' ? '✏️ Otro Club...' : c}</span>
                                      {form.club === c && <Check size={14} className="text-yellow-400" />}
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
                                className="w-full bg-blue-900/50 border border-white/15 focus:border-yellow-500 rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder:text-slate-555 mt-2"
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
                        className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-blue-955 font-black px-6 py-4 rounded-2xl text-base transition-all shadow-xl shadow-yellow-500/10 hover:scale-[1.01] active:scale-95 disabled:opacity-50"
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
                  <h3 className="text-3xl font-black text-white tracking-tight">¡Pre-registro Exitoso!</h3>
                  <p className="text-slate-300 text-base max-w-md mx-auto leading-relaxed">
                    Gracias, León **{form.nombre}**. Hemos guardado tus datos de forma prioritaria en la lista de espera oficial de la convención en Firestore. Te mantendremos informado tan pronto abramos el portal de inscripciones.
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
