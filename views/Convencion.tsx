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
  Handshake,
  CreditCard,
  Smartphone,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  Info,
  Layers,
  Lock,
  Hotel
} from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { telegramService } from '../services/telegramService';
import { recurrenteService } from '../services/recurrenteService';
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

  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [telefonoDigitos, setTelefonoDigitos] = useState('');
  const [dpiDigitos, setDpiDigitos] = useState('');
  const [customClub, setCustomClub] = useState('');
  const [paqueteSeleccionado, setPaqueteSeleccionado] = useState<'base' | 'completo'>('base');
  const [telegramConfirmed, setTelegramConfirmed] = useState(false);
  const [isRedirectingPayment, setIsRedirectingPayment] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Custom dropdown states
  const [openDropdown, setOpenDropdown] = useState<'cargo' | 'zona' | 'club' | null>(null);
  const cargoRef = useRef<HTMLDivElement>(null);
  const zonaRef = useRef<HTMLDivElement>(null);
  const clubRef = useRef<HTMLDivElement>(null);

  const scrollToPreInscripcion = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('pre-inscripcion');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

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

  const handleDpiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 13);
    setDpiDigitos(val);
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

  const handleNextStep = (targetStep: 1 | 2 | 3 | 4) => {
    if (targetStep === 2) {
      if (!form.nombre.trim()) {
        alert("Por favor, ingresa tu Nombre Completo.");
        return;
      }
      if (!dpiDigitos.trim()) {
        alert("Por favor, ingresa tu número de DPI o Documento de Identificación.");
        return;
      }
      if (!form.email.trim() || !form.email.includes('@')) {
        alert("Por favor, ingresa un Correo Electrónico válido.");
        return;
      }
      if (telefonoDigitos.length !== 8) {
        alert("Por favor, ingresa un número de teléfono válido de 8 dígitos.");
        return;
      }
    }

    if (targetStep === 3) {
      const finalClub = (form.distrito === 'Otro / Internacional' || form.club === 'Otro Club') 
        ? customClub.trim() 
        : form.club;

      if ((form.distrito === 'Otro / Internacional' || form.club === 'Otro Club') && !finalClub) {
        alert("Por favor, ingresa el nombre de tu Club de Leones.");
        return;
      }
    }

    setWizardStep(targetStep);
    const element = document.getElementById('pre-inscripcion');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
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
    setDpiDigitos('');
    setCustomClub('');
    setWizardStep(1);
    setPaqueteSeleccionado('base');
    setTelegramConfirmed(false);
    setIsSubmitted(false);
  };

  const handleFinalSubmit = async (metodo: 'recurrente' | 'transferencia') => {
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
    const montoTotal = paqueteSeleccionado === 'completo' ? 1050 : 650;
    const paqueteNombre = paqueteSeleccionado === 'completo' 
      ? 'Inscripción Convención + Hotel Incluido + Actividades Culturales' 
      : 'Inscripción Convención Base';
    
    try {
      const nuevoRegistro: ConvencionRegistro = {
        id: `reg_${Date.now()}`,
        ...form,
        club: finalClub,
        dpi: dpiDigitos.trim(),
        paquete: paqueteSeleccionado,
        montoPagar: montoTotal,
        estadoPago: metodo === 'recurrente' ? 'Checkout_Creado' : 'Pendiente',
        fechaRegistro: new Date().toISOString()
      };
      
      await firebaseService.saveConvencionRegistro(nuevoRegistro);
      
      // Send webhook & Telegram notifications
      telegramService.sendGoogleScriptWebhook(nuevoRegistro, config?.googleScriptUrl).catch(err => {
        console.warn("No se pudo enviar webhook de correo:", err);
      });

      telegramService.notifyNuevaInscripcionConvencion(
        nuevoRegistro, 
        config?.telegramBotToken, 
        config?.telegramChatId
      ).catch(err => {
        console.warn("No se pudo enviar notificación de Telegram:", err);
      });

      if (metodo === 'recurrente') {
        setIsRedirectingPayment(true);
        try {
          const currentUrl = window.location.href.split('#')[0];
          const checkoutResponse = await recurrenteService.createCheckout({
            items: [
              {
                name: `Convención Nacional - ${paqueteNombre}`,
                amount_in_cents: montoTotal * 100,
                currency: 'GTQ',
                quantity: 1
              }
            ],
            userEmail: form.email.trim(),
            successUrl: `${currentUrl}#pre-inscripcion?pago=exitoso&id=${nuevoRegistro.id}`,
            cancelUrl: `${currentUrl}#pre-inscripcion?pago=cancelado`,
            metadata: {
              registroId: nuevoRegistro.id,
              nombre: form.nombre,
              club: finalClub,
              paquete: paqueteSeleccionado
            }
          });

          if (checkoutResponse && checkoutResponse.checkout_url) {
            nuevoRegistro.recurrenteCheckoutUrl = checkoutResponse.checkout_url;
            await firebaseService.saveConvencionRegistro(nuevoRegistro);
            window.location.href = checkoutResponse.checkout_url;
            return;
          }
        } catch (payErr) {
          console.error("Error al conectar con la pasarela de pagos:", payErr);
          alert("Tu pre-registro fue guardado con éxito. En breve un comisionado se comunicará contigo para asistirte con el pago.");
        }
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error("Error al registrar participante:", error);
      alert("Hubo un problema al registrar tus datos. Por favor inténtalo de nuevo.");
    } finally {
      setLoading(false);
      setIsRedirectingPayment(false);
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
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans antialiased overflow-x-hidden selection:bg-yellow-500 selection:text-blue-955 pb-16">
      {/* Dynamic Hero Header Section Block - Royal Blue Banner */}
      <header className="relative py-16 sm:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-blue-955 via-blue-900 to-indigo-955 text-white text-center border-b-4 border-yellow-500 shadow-2xl">
        {/* Custom Header Background Image */}
        {config.headerBgUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-center pointer-events-none transition-all duration-700"
            style={{ backgroundImage: `url("${config.headerBgUrl}")` }}
          />
        )}
        {/* Overlay Color & Transparency Layer */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-blue-955 via-blue-900 to-indigo-955 pointer-events-none transition-opacity duration-300"
          style={{ opacity: (config.headerBgOverlayOpacity !== undefined ? config.headerBgOverlayOpacity : 75) / 100 }}
        />
        {/* Ambient Radial Background Glows */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(253,224,71,0.15),transparent_50%)] pointer-events-none z-0" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(30,58,138,0.3),transparent_50%)] pointer-events-none z-0" />
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-5xl mx-auto relative z-10 space-y-6 sm:space-y-8">
          {/* Badge & Dates */}
          <div className="inline-flex items-center space-x-2 bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 px-4 py-2 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider mb-2 backdrop-blur-md shadow-lg shadow-black/20 animate-pulse">
            <Sparkles size={16} className="text-yellow-400" />
            <span>LXIV Convención Nacional Lions</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-tight sm:leading-none bg-gradient-to-r from-white via-slate-100 to-yellow-300 bg-clip-text text-transparent px-2">
            {config.titulo || 'Distrito D3 Guatemala'}
          </h1>

          {/* Lema Motto */}
          <p className="text-slate-200 text-base sm:text-2xl max-w-3xl mx-auto italic font-serif leading-relaxed px-2 drop-shadow-sm">
            "{config.lema || 'Rugiendo con fuerza, sirviendo con amor y uniendo voluntades por nuestra nación'}"
          </p>

          {/* Location & Date Badge */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-xs sm:text-base font-bold text-slate-200">
            <div className="w-full sm:w-auto flex items-center justify-center space-x-2.5 bg-blue-955/80 border border-white/15 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-xl hover:border-yellow-500/40 transition-all">
              <Calendar className="text-yellow-400 shrink-0" size={18} />
              <span>Del 19 al 22 de Marzo, 2026</span>
            </div>
            <div className="w-full sm:w-auto flex items-center justify-center space-x-2.5 bg-blue-955/80 border border-white/15 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-xl hover:border-yellow-500/40 transition-all">
              <MapPin className="text-yellow-400 shrink-0" size={18} />
              <span>Quetzaltenango, Guatemala</span>
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="mt-10 sm:mt-16">
            <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-yellow-400 mb-3 sm:mb-5">El gran rugido inicia en:</p>
            <div className="grid grid-cols-4 gap-2.5 sm:gap-5 max-w-xl mx-auto">
              {[
                { label: 'Días', value: countdown.days },
                { label: 'Horas', value: countdown.hours },
                { label: 'Minutos', value: countdown.minutes },
                { label: 'Segundos', value: countdown.seconds }
              ].map((item, idx) => (
                <div key={idx} className="bg-blue-955/90 border border-yellow-500/30 rounded-2xl sm:rounded-3xl p-3 sm:p-5 flex flex-col items-center justify-center shadow-2xl backdrop-blur-xl group hover:border-yellow-500/70 transition-all">
                  <span className="text-2xl sm:text-4xl font-black text-white tracking-tight group-hover:text-yellow-400 transition-colors">{String(item.value).padStart(2, '0')}</span>
                  <span className="text-[9px] sm:text-xs font-black uppercase text-slate-350 mt-1 sm:mt-2 tracking-widest">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTA */}
          <div className="mt-8 sm:mt-12">
            <button 
              type="button"
              onClick={scrollToPreInscripcion}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-400 hover:from-yellow-400 hover:to-amber-300 text-blue-955 font-black px-8 py-4 rounded-2xl text-base sm:text-lg transition-all duration-300 shadow-2xl shadow-yellow-500/30 hover:shadow-yellow-500/50 transform hover:-translate-y-0.5 active:scale-95 min-h-[52px] cursor-pointer"
            >
              <span>{config.inscripcionesAbiertas ? 'Pre-regístrate Aquí' : 'Ver Inscripciones'}</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* SECCIÓN 2: Alianzas & Patrocinadores Marquee Block — FONDO BLANCO */}
      <section className="my-10 sm:my-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white text-slate-800 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 border border-slate-200 shadow-2xl relative overflow-hidden">
          {/* Section Header */}
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200 pb-4 sm:pb-6 relative z-10 text-center sm:text-left">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 sm:p-3 bg-blue-900/10 rounded-2xl border border-blue-900/20 text-blue-900 shrink-0 shadow-sm">
                <Handshake size={22} className="animate-pulse sm:w-6 sm:h-6 text-blue-900" />
              </div>
              <div>
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-blue-900 block">
                  Respaldos & Alianzas Institucionales
                </span>
                <h3 className="text-lg sm:text-2xl font-black text-blue-955 tracking-tight">
                  Aliados Estratégicos de la LXIV Convención
                </h3>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md font-medium">
              Unidos por la fraternidad, la cultura y el liderazgo de servicio en Guatemala.
            </p>
          </div>

          {/* Marquee Track with gradient edge masks */}
          <div className="relative w-full overflow-hidden py-1 sm:py-2">
            {/* Gradient Masks */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-36 bg-gradient-to-r from-white to-transparent z-20" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-36 bg-gradient-to-l from-white to-transparent z-20" />

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
                  {/* Square Logo Slide Box — Fondo Blanco con Sombra Elegante */}
                  <div className="w-28 h-28 sm:w-44 sm:h-44 aspect-square rounded-2xl sm:rounded-3xl bg-slate-50 border-2 border-slate-200 group-hover:border-blue-900 shadow-md flex items-center justify-center p-3 sm:p-5 relative overflow-hidden transition-all duration-300 transform group-hover:-translate-y-1.5 group-hover:shadow-xl">
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
                    <h4 className="text-xs sm:text-base font-extrabold text-blue-955 group-hover:text-blue-700 transition-colors line-clamp-2 leading-tight">
                      {aliado.name}
                    </h4>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium line-clamp-1">
                      {aliado.category}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 3: Ciudad Sede (Quetzaltenango) Block */}
      <section className="my-10 sm:my-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 text-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-12 border-2 border-yellow-500/30 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-6 space-y-4 sm:space-y-6">
              <div className="inline-flex items-center space-x-2 bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
                <MapPin size={14} className="text-yellow-400" />
                <span>Ciudad Sede</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Quetzaltenango: La Cuna de la Cultura y el Escudo Altense
              </h2>
              
              <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                Xelajú nos recibe con sus brazos abiertos, sus impresionantes montañas, historia centenaria y el caluroso espíritu león de la región. Prepárate para vivir jornadas inolvidables de liderazgo y fraternidad.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
                <div className="bg-blue-955/80 border border-white/15 p-5 rounded-2xl shadow-xl hover:border-yellow-500/50 transition-all space-y-1">
                  <span className="text-xs font-black text-yellow-400 uppercase tracking-wider block">Clima Templado</span>
                  <p className="text-slate-300 text-xs font-medium">Ideal para noches de gala y caminatas culturales por el centro histórico.</p>
                </div>
                <div className="bg-blue-955/80 border border-white/15 p-5 rounded-2xl shadow-xl hover:border-yellow-500/50 transition-all space-y-1">
                  <span className="text-xs font-black text-yellow-400 uppercase tracking-wider block">Gastronomía Única</span>
                  <p className="text-slate-300 text-xs font-medium">Degusta el famoso Sheca, chocolate artesanal y platillos tradicionales.</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white shadow-slate-300/60 group">
                <img 
                  src={config.fotoSede || "https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&q=80&w=1200"} 
                  alt="Quetzaltenango Sede"
                  className="w-full h-64 sm:h-96 object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-955/90 via-blue-955/20 to-transparent flex items-end p-6">
                  <div className="text-white space-y-1">
                    <span className="bg-yellow-400 text-blue-955 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow">
                      {config.fotoSedeEtiqueta || "Sede Oficial"}
                    </span>
                    <p className="text-sm font-bold text-slate-100 pt-1">
                      {config.fotoSedeDescripcion || "Quetzaltenango, Guatemala — Ciudad de la Estrella de Occidente"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 4: Instalaciones del Evento (Colina Country Club) Block — FONDO BLANCO */}
      <section className="my-10 sm:my-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white text-slate-800 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-12 border border-slate-200 shadow-2xl space-y-8 sm:space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4">
            <div className="inline-flex items-center space-x-2 bg-blue-900/10 border border-blue-900/20 text-blue-900 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
              <Building2 size={14} className="text-blue-900" />
              <span>Instalaciones del Evento</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-blue-955 tracking-tight leading-tight">
              Colina Country Club
            </h2>
            <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">
              Un exclusivo y prestigioso centro de convenciones en Quetzaltenango (Km 223.5 Carretera CITO 180), diseñado con salones monumentales, vistas panorámicas y jardines de primer nivel.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Card 1: Salón Doña Beatriz */}
            <div className="bg-slate-50 rounded-3xl overflow-hidden border border-slate-200 hover:border-blue-900 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="relative h-48 sm:h-56 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80" 
                    alt="Salón Doña Beatriz Colina Country Club"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-blue-955/90 border border-white/20 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow">
                    Salón Principal
                  </div>
                </div>
                <div className="p-5 sm:p-6 space-y-2 sm:space-y-3">
                  <h3 className="text-lg sm:text-xl font-extrabold text-blue-955 group-hover:text-blue-700 transition-colors">Salón Doña Beatriz</h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    El salón más grande e imponente de la región. Cuenta con dos balcones, área de bar, gran altura con acústica perfecta y capacidad para plenarias multitudinarias.
                  </p>
                </div>
              </div>
              <div className="p-5 sm:p-6 pt-0 border-t border-slate-200 flex items-center justify-between text-xs text-slate-700 font-extrabold mt-4">
                <span>Capacidad Auditorio</span>
                <span className="bg-blue-100 text-blue-900 border border-blue-200 px-3 py-1 rounded-xl">Hasta 1,000 Personas</span>
              </div>
            </div>

            {/* Card 2: Jardines y Áreas al Aire Libre */}
            <div className="bg-slate-50 rounded-3xl overflow-hidden border border-slate-200 hover:border-blue-900 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="relative h-48 sm:h-56 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=1200&q=80" 
                    alt="Jardines Colina Country Club"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-emerald-900/90 border border-white/20 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow">
                    Naturaleza & Vista
                  </div>
                </div>
                <div className="p-5 sm:p-6 space-y-2 sm:space-y-3">
                  <h3 className="text-lg sm:text-xl font-extrabold text-blue-955 group-hover:text-blue-700 transition-colors">Jardines & Áreas Exteriores</h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    Hermosas áreas verdes y jardines campestres del complejo, diseñados para cócteles de bienvenida, actividades de convivencia y momentos de esparcimiento fraterno.
                  </p>
                </div>
              </div>
              <div className="p-5 sm:p-6 pt-0 border-t border-slate-200 flex items-center justify-between text-xs text-slate-700 font-extrabold mt-4">
                <span>Ambiente</span>
                <span className="bg-emerald-100 text-emerald-900 border border-emerald-200 px-3 py-1 rounded-xl">Cóctel & Exteriores</span>
              </div>
            </div>

            {/* Card 3: Capilla & Servicios Gastronómicos */}
            <div className="bg-slate-50 rounded-3xl overflow-hidden border border-slate-200 hover:border-blue-900 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
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
                  <div className="absolute top-4 left-4 bg-amber-900/90 border border-white/20 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow">
                    Capilla & Banquetes
                  </div>
                </div>
                <div className="p-5 sm:p-6 space-y-2 sm:space-y-3">
                  <h3 className="text-lg sm:text-xl font-extrabold text-blue-955 group-hover:text-blue-700 transition-colors">Capilla Privada & Alta Cocina</h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    Instalaciones integrales con capilla propia para actos de acción de gracias, además de un equipo culinario experto a cargo de los banquetes solemnes.
                  </p>
                </div>
              </div>
              <div className="p-5 sm:p-6 pt-0 border-t border-slate-200 flex items-center justify-between text-xs text-slate-700 font-extrabold mt-4">
                <span>Servicios</span>
                <span className="bg-amber-100 text-amber-900 border border-amber-200 px-3 py-1 rounded-xl">Banquetes & Capilla</span>
              </div>
            </div>
          </div>

          {/* Call to Action to Visit Colina Country Club Website — Banner Destacado en Azul Oscuro León */}
          <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 text-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 border-2 border-yellow-500/40 relative overflow-hidden text-center sm:text-left group">
            {/* Ambient Glows */}
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-2 max-w-xl relative z-10">
              <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider inline-block shadow-sm">
                Conoce la Sede Virtualmente
              </span>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">¿Quieres explorar todas las instalaciones del evento?</h3>
              <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
                Visita el sitio oficial de Colina Country Club para descubrir más sobre sus galerías de fotos, salones y ubicación en Quetzaltenango.
              </p>
            </div>

            <a 
              href="https://colinacountryclub.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-400 hover:from-yellow-400 hover:to-amber-300 text-blue-955 font-black px-6 py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all duration-300 shadow-xl shadow-yellow-500/20 active:scale-95 shrink-0 min-h-[48px] cursor-pointer relative z-10"
            >
              <span>Visitar Sitio Oficial</span>
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* SECCIÓN 5: Actividades Culturales y Sociales Block */}
      <section className="my-10 sm:my-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 text-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-12 border-2 border-yellow-500/30 shadow-2xl relative overflow-hidden">
          <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4">
            <div className="inline-flex items-center space-x-2 bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
              <Award size={14} />
              <span>Agenda de Hermandad</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
              Actividades Culturales y Sociales
            </h2>
            <p className="text-slate-200 text-sm sm:text-base max-w-2xl mx-auto">
              La convención no es solo trabajo de planificación; también es el espacio ideal para disfrutar del arte, la hermandad y compartir tradiciones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-10 sm:mt-16">
            {(config.actividadesCulturales || []).map((act, index) => {
              const IconComponent = getIconComponent(act.iconName);
              return (
                <div 
                  key={act.id || index}
                  className="bg-blue-955/90 border border-white/15 hover:border-yellow-500/50 rounded-3xl p-6 sm:p-8 transition-all duration-300 flex flex-col justify-between group hover:shadow-2xl hover:shadow-yellow-500/10 shadow-xl"
                >
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 flex items-center justify-center group-hover:scale-110 group-hover:bg-yellow-400 group-hover:text-blue-955 transition-all duration-300 shadow-md">
                      <IconComponent size={26} />
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-yellow-300 transition-colors">{act.title}</h3>
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{act.description}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-yellow-400 font-extrabold">
                    <span>Cronograma</span>
                    <span className="bg-yellow-500/20 border border-yellow-500/30 px-3 py-1 rounded-lg text-yellow-300">{act.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECCIÓN 6: Experiencias Únicas Block — FONDO BLANCO */}
      <section className="my-10 sm:my-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white text-slate-800 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-12 border border-slate-200 shadow-2xl relative">
          <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4 mb-10 sm:mb-16">
            <div className="inline-flex items-center space-x-2 bg-blue-900/10 border border-blue-900/20 text-blue-900 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
              <Compass size={14} className="text-blue-900" />
              <span>Mística Leonística</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-blue-955 tracking-tight leading-tight">
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
                className="bg-slate-50 border border-slate-200 hover:border-blue-900 rounded-3xl p-6 sm:p-8 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-3 sm:space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-900 bg-blue-100 border border-blue-200 px-3 py-1 rounded-full inline-block">
                    {exp.badge}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-blue-955 tracking-tight pt-1 group-hover:text-blue-700 transition-colors">{exp.title}</h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{exp.desc}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200 flex items-center text-blue-900 font-extrabold text-xs group-hover:text-blue-700 transition-colors">
                  <span>Conocer más detalles</span>
                  <ChevronRight size={14} className="ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN 7: Formulario de Pre-registro Digital Guiado (4 Pasos) */}
      <section id="pre-inscripcion" className="my-10 sm:my-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-10">
        <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 text-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-12 border-2 border-yellow-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(253,224,71,0.12),transparent_40%)] pointer-events-none" />
          <div className="relative z-10">
            
            {fetching ? (
              <div className="text-center py-12 flex flex-col items-center justify-center">
                <Clock className="w-8 h-8 text-yellow-400 animate-spin" />
                <p className="mt-3 text-slate-350 text-sm font-bold">Cargando formulario de inscripciones...</p>
              </div>
            ) : config.inscripcionesAbiertas ? (
              !isSubmitted ? (
                <div>
                  {/* Encabezado del Formulario Guiado */}
                  <div className="text-center max-w-2xl mx-auto space-y-3 sm:space-y-4 mb-8">
                    <div className="inline-flex items-center space-x-2 bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
                      <ShieldCheck size={14} />
                      <span>Pre-inscripción Oficial Convención 2026</span>
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
                      Inscripción Guiada en 4 Pasos
                    </h2>
                    <p className="text-slate-200 text-xs sm:text-base">
                      Completa tu pre-registro paso a paso para asegurar tu lugar en la Convención Nacional de Leones Guatemala en Quetzaltenango.
                    </p>
                  </div>

                  {/* Barra de Progreso por Pasos (Wizard Stepper) */}
                  <div className="mb-10 max-w-3xl mx-auto">
                    <div className="flex items-center justify-between relative px-2 sm:px-6">
                      {/* Línea Conectora */}
                      <div className="absolute top-5 left-8 right-8 h-1 bg-white/10 -translate-y-1/2 rounded-full z-0" />
                      <div 
                        className="absolute top-5 left-8 h-1 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300 -translate-y-1/2 rounded-full z-0 transition-all duration-500" 
                        style={{ width: `${((wizardStep - 1) / 3) * 88}%` }}
                      />

                      {/* Paso 1 */}
                      <button
                        type="button"
                        onClick={() => setWizardStep(1)}
                        className={`relative z-10 flex flex-col items-center group cursor-pointer ${wizardStep >= 1 ? 'text-yellow-300' : 'text-slate-400'}`}
                      >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs transition-all duration-300 shadow-md ${
                          wizardStep === 1 ? 'bg-yellow-500 text-blue-955 ring-4 ring-yellow-500/30 scale-110' :
                          wizardStep > 1 ? 'bg-emerald-500 text-white' : 'bg-blue-950 border border-white/20 text-slate-300'
                        }`}>
                          {wizardStep > 1 ? <Check size={18} /> : '1'}
                        </div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider mt-2.5 hidden sm:inline">1. Datos</span>
                      </button>

                      {/* Paso 2 */}
                      <button
                        type="button"
                        onClick={() => wizardStep > 1 && setWizardStep(2)}
                        disabled={wizardStep < 1}
                        className={`relative z-10 flex flex-col items-center group cursor-pointer ${wizardStep >= 2 ? 'text-yellow-300' : 'text-slate-400'}`}
                      >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs transition-all duration-300 shadow-md ${
                          wizardStep === 2 ? 'bg-yellow-500 text-blue-955 ring-4 ring-yellow-500/30 scale-110' :
                          wizardStep > 2 ? 'bg-emerald-500 text-white' : 'bg-blue-950 border border-white/20 text-slate-300'
                        }`}>
                          {wizardStep > 2 ? <Check size={18} /> : '2'}
                        </div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider mt-2.5 hidden sm:inline">2. Afiliación</span>
                      </button>

                      {/* Paso 3 */}
                      <button
                        type="button"
                        onClick={() => wizardStep > 2 && setWizardStep(3)}
                        disabled={wizardStep < 2}
                        className={`relative z-10 flex flex-col items-center group cursor-pointer ${wizardStep >= 3 ? 'text-yellow-300' : 'text-slate-400'}`}
                      >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs transition-all duration-300 shadow-md ${
                          wizardStep === 3 ? 'bg-yellow-500 text-blue-955 ring-4 ring-yellow-500/30 scale-110' :
                          wizardStep > 3 ? 'bg-emerald-500 text-white' : 'bg-blue-950 border border-white/20 text-slate-300'
                        }`}>
                          {wizardStep > 3 ? <Check size={18} /> : '3'}
                        </div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider mt-2.5 hidden sm:inline">3. Telegram</span>
                      </button>

                      {/* Paso 4 */}
                      <button
                        type="button"
                        onClick={() => wizardStep > 3 && setWizardStep(4)}
                        disabled={wizardStep < 3}
                        className={`relative z-10 flex flex-col items-center group cursor-pointer ${wizardStep >= 4 ? 'text-yellow-300' : 'text-slate-400'}`}
                      >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs transition-all duration-300 shadow-md ${
                          wizardStep === 4 ? 'bg-yellow-500 text-blue-955 ring-4 ring-yellow-500/30 scale-110' : 'bg-blue-955 border border-white/20 text-slate-300'
                        }`}>
                          4
                        </div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider mt-2.5 hidden sm:inline">4. Pago</span>
                      </button>
                    </div>
                  </div>

                  {/* CONTENIDO DEL PASO 1: DATOS PERSONALES */}
                  {wizardStep === 1 && (
                    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="bg-blue-900/40 p-4 rounded-2xl border border-white/10 flex items-center space-x-3">
                        <Users className="text-yellow-400 shrink-0" size={20} />
                        <div>
                          <h3 className="text-sm font-black text-white uppercase tracking-wider">Paso 1: Datos Personales de Identificación</h3>
                          <p className="text-xs text-slate-300 font-medium">Ingresa tus datos básicos de contacto para emisión de credencial oficial.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-left">
                        {/* Nombre Completo */}
                        <div className="space-y-1.5 sm:space-y-2">
                          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300" htmlFor="nombre">Nombre Completo *</label>
                          <input 
                            type="text" 
                            id="nombre"
                            name="nombre"
                            value={form.nombre}
                            onChange={handleChange}
                            required
                            placeholder="Ej. Juan Pérez"
                            className="w-full bg-blue-900/60 border border-white/20 focus:border-yellow-500 rounded-2xl px-4 py-3.5 text-white text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder:text-slate-400 min-h-[48px]"
                          />
                        </div>

                        {/* DPI / Documento Identificación */}
                        <div className="space-y-1.5 sm:space-y-2">
                          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300" htmlFor="dpi">DPI / Documento de Identificación *</label>
                          <input 
                            type="text" 
                            id="dpi"
                            name="dpi"
                            value={dpiDigitos}
                            onChange={handleDpiChange}
                            required
                            maxLength={13}
                            placeholder="Ej. 2500 12345 0901"
                            className="w-full bg-blue-900/60 border border-white/20 focus:border-yellow-500 rounded-2xl px-4 py-3.5 text-white text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder:text-slate-400 min-h-[48px]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-left">
                        {/* Email */}
                        <div className="space-y-1.5 sm:space-y-2">
                          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300" htmlFor="email">Correo Electrónico *</label>
                          <input 
                            type="email" 
                            id="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            placeholder="ejemplo@correo.com"
                            className="w-full bg-blue-900/60 border border-white/20 focus:border-yellow-500 rounded-2xl px-4 py-3.5 text-white text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder:text-slate-400 min-h-[48px]"
                          />
                        </div>

                        {/* Teléfono / WhatsApp */}
                        <div className="space-y-1.5 sm:space-y-2">
                          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300" htmlFor="telefono">Teléfono / WhatsApp *</label>
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
                              className="w-full bg-transparent px-4 py-3.5 text-white text-base sm:text-sm focus:outline-none placeholder:text-slate-400"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Cargo Leonístico Actual */}
                      <div className="space-y-1.5 sm:space-y-2 text-left" ref={cargoRef}>
                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300">Cargo Leonístico Actual *</label>
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
                            <div className="absolute z-50 mt-2 w-full rounded-2xl border border-white/15 bg-blue-955/95 backdrop-blur-xl shadow-2xl shadow-black/80 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                              {CARGO_OPTIONS.map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => handleCargoSelect(opt.value)}
                                  className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors text-left ${form.cargo === opt.value ? 'bg-yellow-500/20 text-yellow-300 font-bold' : 'text-white hover:bg-white/10'}`}
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

                      {/* Botón Paso 1 */}
                      <div className="pt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleNextStep(2)}
                          className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-400 hover:from-yellow-400 hover:to-amber-300 text-blue-955 font-black px-8 py-4 rounded-2xl text-sm transition-all duration-300 shadow-xl shadow-yellow-500/20 active:scale-95 cursor-pointer"
                        >
                          <span>Siguiente: Afiliación (Paso 2)</span>
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CONTENIDO DEL PASO 2: AFILIACIÓN LEONÍSTICA */}
                  {wizardStep === 2 && (
                    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="bg-blue-900/40 p-4 rounded-2xl border border-white/10 flex items-center space-x-3">
                        <Building2 className="text-yellow-400 shrink-0" size={20} />
                        <div>
                          <h3 className="text-sm font-black text-white uppercase tracking-wider">Paso 2: Afiliación Leonística</h3>
                          <p className="text-xs text-slate-300 font-medium">Selecciona la Zona/Distrito y el Club de Leones al que perteneces.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-left">
                        {/* Zona / Distrito */}
                        <div className="space-y-1.5 sm:space-y-2" ref={zonaRef}>
                          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300">Zona o Distrito a la que pertenece *</label>
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
                              <div className="absolute z-50 mt-2 w-full rounded-2xl border border-white/15 bg-blue-955/95 backdrop-blur-xl shadow-2xl shadow-black/80 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-72 overflow-y-auto">
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
                                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-left ${form.distrito === z ? 'bg-yellow-500/20 text-yellow-300 font-bold' : 'text-white hover:bg-white/10'}`}
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
                                    className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors text-left ${form.distrito === 'Otro / Internacional' ? 'bg-yellow-500/20 text-yellow-300 font-bold' : 'text-white hover:bg-white/10'}`}
                                  >
                                    <span className="font-semibold">🌎 Otro / Internacional</span>
                                    {form.distrito === 'Otro / Internacional' && <Check size={14} className="text-yellow-400 shrink-0" />}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Club de Leones de Pertenencia */}
                        <div className="space-y-1.5 sm:space-y-2" ref={clubRef}>
                          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300">Club de Leones de Pertenencia *</label>
                          {form.distrito === 'Otro / Internacional' ? (
                            <input 
                              type="text" 
                              id="club"
                              name="club"
                              value={customClub}
                              onChange={(e) => setCustomClub(e.target.value)}
                              required
                              placeholder="Ej. Club de Leones Internacional"
                              className="w-full bg-blue-900/60 border border-white/20 focus:border-yellow-500 rounded-2xl px-4 py-3.5 text-white text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder:text-slate-400 min-h-[48px]"
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
                                  <div className="absolute z-50 mt-2 w-full rounded-2xl border border-white/15 bg-blue-955/95 backdrop-blur-xl shadow-2xl shadow-black/80 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto">
                                    {(ZONAS_CLUBS[form.distrito] || []).map((c) => (
                                      <button
                                        key={c}
                                        type="button"
                                        onClick={() => handleClubSelect(c)}
                                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-left ${form.club === c ? 'bg-yellow-500/20 text-yellow-300 font-bold' : 'text-white hover:bg-white/10'} ${c === 'Otro Club' ? 'border-t border-white/10 italic text-slate-300' : ''}`}
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
                                  className="w-full bg-blue-900/60 border border-white/20 focus:border-yellow-500 rounded-2xl px-4 py-3.5 text-white text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder:text-slate-400 mt-2 min-h-[48px]"
                                />
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Resumen de Afiliación */}
                      <div className="bg-blue-955/80 p-5 rounded-2xl border border-white/15 text-left space-y-2">
                        <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Resumen de Registro de Afiliación:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-200">
                          <div>• <strong>Socio:</strong> {form.nombre || 'Por ingresar'}</div>
                          <div>• <strong>Cargo:</strong> {form.cargo}</div>
                          <div>• <strong>Zona / Distrito:</strong> {form.distrito}</div>
                          <div>• <strong>Club:</strong> {form.club === 'Otro Club' ? (customClub || 'Otro Club') : form.club}</div>
                        </div>
                      </div>

                      {/* Botones Paso 2 */}
                      <div className="pt-4 flex flex-col sm:flex-row justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setWizardStep(1)}
                          className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white font-black px-6 py-4 rounded-2xl text-sm transition-all border border-white/15 cursor-pointer"
                        >
                          <ArrowLeft size={18} />
                          <span>Anterior (Paso 1)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNextStep(3)}
                          className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-400 hover:from-yellow-400 hover:to-amber-300 text-blue-955 font-black px-8 py-4 rounded-2xl text-sm transition-all duration-300 shadow-xl shadow-yellow-500/20 active:scale-95 cursor-pointer"
                        >
                          <span>Siguiente: Notificaciones (Paso 3)</span>
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CONTENIDO DEL PASO 3: TELEGRAM & NOTIFICACIONES */}
                  {wizardStep === 3 && (
                    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="bg-blue-900/40 p-4 rounded-2xl border border-white/10 flex items-center space-x-3">
                        <MessageSquare className="text-yellow-400 shrink-0" size={20} />
                        <div>
                          <h3 className="text-sm font-black text-white uppercase tracking-wider">Paso 3: Notificaciones y Bot Oficial de Telegram</h3>
                          <p className="text-xs text-slate-300 font-medium">Instala Telegram y suscríbete al Bot para recibir noticias, mapas y el programa de la convención en tiempo real.</p>
                        </div>
                      </div>

                      {/* Beneficios de Telegram Card */}
                      <div className="bg-gradient-to-br from-blue-955 via-blue-900 to-slate-900 p-6 rounded-2xl border border-yellow-500/40 space-y-4 text-left shadow-xl">
                        <h4 className="text-base font-black text-yellow-300 flex items-center space-x-2">
                          <span>📱 ¿Por qué usar el Bot Oficial de Telegram en la Convención?</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-1">
                            <span className="text-lg">⚡</span>
                            <h5 className="font-extrabold text-white text-xs">Avisos en Tiempo Real</h5>
                            <p className="text-slate-300 text-[11px] font-medium leading-relaxed">Notificaciones al instante sobre cambios de agenda, salas de reuniones y la Junta de Gobernadores.</p>
                          </div>
                          <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-1">
                            <span className="text-lg">📍</span>
                            <h5 className="font-extrabold text-white text-xs">Ubicaciones y Mapas</h5>
                            <p className="text-slate-300 text-[11px] font-medium leading-relaxed">Accesos GPS directos al Hotel Sede, lugares culturales y eventos de confraternidad.</p>
                          </div>
                          <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-1">
                            <span className="text-lg">📜</span>
                            <h5 className="font-extrabold text-white text-xs">Credencial & Programa</h5>
                            <p className="text-slate-300 text-[11px] font-medium leading-relaxed">Descarga en 1-clic de tu credencial digital interactiva y el folleto completo del programa.</p>
                          </div>
                        </div>

                        {/* Instrucciones de Descarga y Suscripción */}
                        <div className="pt-2 space-y-3">
                          <span className="block text-xs font-extrabold uppercase tracking-wider text-yellow-400">Instrucciones para suscribirte al Bot Oficial:</span>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Descarga App */}
                            <div className="bg-blue-900/60 p-4 rounded-xl border border-white/15 space-y-2">
                              <span className="text-xs font-black text-white uppercase tracking-wider">1. Instalar la App Telegram:</span>
                              <div className="flex flex-col gap-2 pt-1">
                                <a 
                                  href="https://play.google.com/store/apps/details?id=org.telegram.messenger" 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center space-x-2 text-xs font-extrabold bg-white/10 hover:bg-yellow-500 hover:text-blue-955 text-white px-3.5 py-2.5 rounded-xl transition-all border border-white/15"
                                >
                                  <span>🤖 Android (Google Play Store)</span>
                                </a>
                                <a 
                                  href="https://apps.apple.com/app/telegram-messenger/id686449807" 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center space-x-2 text-xs font-extrabold bg-white/10 hover:bg-yellow-500 hover:text-blue-955 text-white px-3.5 py-2.5 rounded-xl transition-all border border-white/15"
                                >
                                  <span>🍎 iPhone (Apple App Store)</span>
                                </a>
                              </div>
                            </div>

                            {/* Suscribirse al Bot */}
                            <div className="bg-blue-900/60 p-4 rounded-xl border border-white/15 space-y-2 flex flex-col justify-between">
                              <div>
                                <span className="text-xs font-black text-white uppercase tracking-wider">2. Suscribirte al Bot Oficial:</span>
                                <p className="text-[11px] text-slate-300 font-medium mt-1">
                                  Abre el enlace para iniciar el chat con el bot oficial de notificaciones:
                                </p>
                              </div>
                              <a 
                                href="https://t.me/ClubLeonesXelaBot" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center space-x-2 text-xs font-black bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white px-4 py-3 rounded-xl transition-all shadow-lg border border-cyan-400/30 active:scale-95"
                              >
                                <Send size={15} />
                                <span>🤖 Unirse a @ClubLeonesXelaBot</span>
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Checkbox de Confirmación */}
                        <div className="pt-2 border-t border-white/10">
                          <label className="flex items-start space-x-3 cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={telegramConfirmed}
                              onChange={e => setTelegramConfirmed(e.target.checked)}
                              className="mt-0.5 w-4 h-4 text-yellow-500 rounded border-white/30 focus:ring-yellow-500"
                            />
                            <span className="text-xs text-slate-200 font-semibold leading-relaxed">
                              Entendido. He leído las instrucciones y/o ya estoy suscrito al Bot Oficial de Telegram para recibir alertas de la Convención.
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* Botones Paso 3 */}
                      <div className="pt-4 flex flex-col sm:flex-row justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setWizardStep(2)}
                          className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white font-black px-6 py-4 rounded-2xl text-sm transition-all border border-white/15 cursor-pointer"
                        >
                          <ArrowLeft size={18} />
                          <span>Anterior (Paso 2)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNextStep(4)}
                          className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-400 hover:from-yellow-400 hover:to-amber-300 text-blue-955 font-black px-8 py-4 rounded-2xl text-sm transition-all duration-300 shadow-xl shadow-yellow-500/20 active:scale-95 cursor-pointer"
                        >
                          <span>Siguiente: Pasarela de Pago (Paso 4)</span>
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CONTENIDO DEL PASO 4: PASARELA DE PAGO & CONFIRMACIÓN */}
                  {wizardStep === 4 && (
                    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="bg-blue-900/40 p-4 rounded-2xl border border-white/10 flex items-center space-x-3">
                        <CreditCard className="text-yellow-400 shrink-0" size={20} />
                        <div>
                          <h3 className="text-sm font-black text-white uppercase tracking-wider">Paso 4: Paquete de Inscripción y Pasarela de Pago</h3>
                          <p className="text-xs text-slate-300 font-medium">Selecciona tu paquete de inscripción y la opción de pago en cuotas o contado.</p>
                        </div>
                      </div>

                      {/* Selección de Paquete de Convención */}
                      <div className="space-y-3 text-left">
                        <label className="text-xs font-extrabold uppercase tracking-wider text-yellow-400">Selecciona tu Paquete de Inscripción:</label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Opción A: Base */}
                          <div 
                            onClick={() => setPaqueteSeleccionado('base')}
                            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 relative overflow-hidden ${
                              paqueteSeleccionado === 'base' 
                                ? 'bg-yellow-500/15 border-yellow-500 shadow-xl shadow-yellow-500/10' 
                                : 'bg-blue-900/40 border-white/15 hover:border-white/30'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-black uppercase tracking-wider text-yellow-300 bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/40">
                                Convención Base
                              </span>
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                paqueteSeleccionado === 'base' ? 'border-yellow-400 bg-yellow-500 text-blue-955' : 'border-white/30'
                              }`}>
                                {paqueteSeleccionado === 'base' && <Check size={12} className="stroke-[3]" />}
                              </div>
                            </div>
                            <div>
                              <span className="text-3xl font-black text-white">Q. 650.00</span>
                              <span className="text-xs text-slate-300 block font-semibold mt-0.5">Tarifa Oficial de Inscripción</span>
                            </div>
                            <ul className="text-xs text-slate-300 space-y-1.5 font-medium pt-2 border-t border-white/10">
                              <li className="flex items-center space-x-1.5">
                                <Check size={14} className="text-emerald-400 shrink-0" />
                                <span>Acceso a todas las Plenarias Oficiales</span>
                              </li>
                              <li className="flex items-center space-x-1.5">
                                <Check size={14} className="text-emerald-400 shrink-0" />
                                <span>Credencial Interactiva de Convencionista</span>
                              </li>
                              <li className="flex items-center space-x-1.5">
                                <Check size={14} className="text-emerald-400 shrink-0" />
                                <span>Carpeta de trabajo y Cenas de Gala</span>
                              </li>
                            </ul>
                          </div>

                          {/* Opción B: Completo */}
                          <div 
                            onClick={() => setPaqueteSeleccionado('completo')}
                            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 relative overflow-hidden ${
                              paqueteSeleccionado === 'completo' 
                                ? 'bg-amber-500/20 border-amber-400 shadow-xl shadow-amber-500/10' 
                                : 'bg-blue-900/40 border-white/15 hover:border-white/30'
                            }`}
                          >
                            <span className="absolute -right-12 top-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-blue-955 text-[9px] font-black uppercase tracking-widest px-10 py-1 rotate-45 shadow-md">
                              Recomendado
                            </span>

                            <div className="flex justify-between items-start">
                              <span className="text-xs font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/40 flex items-center space-x-1">
                                <Hotel size={12} className="mr-1" />
                                <span>Paquete Completo + Hotel + Cultura</span>
                              </span>
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                paqueteSeleccionado === 'completo' ? 'border-amber-400 bg-amber-500 text-blue-955' : 'border-white/30'
                              }`}>
                                {paqueteSeleccionado === 'completo' && <Check size={12} className="stroke-[3]" />}
                              </div>
                            </div>
                            <div>
                              <span className="text-3xl font-black text-white">Q. 1,050.00</span>
                              <span className="text-xs text-amber-300 block font-bold mt-0.5">Base Q.650 + Hotel y Cultura Q.400</span>
                            </div>
                            <ul className="text-xs text-slate-200 space-y-1.5 font-medium pt-2 border-t border-white/10">
                              <li className="flex items-center space-x-1.5">
                                <Check size={14} className="text-amber-400 shrink-0" />
                                <span>Todo lo de la Inscripción Base</span>
                              </li>
                              <li className="flex items-center space-x-1.5">
                                <Check size={14} className="text-amber-400 shrink-0" />
                                <span><strong>Hospedaje Incluido</strong> en Hotel Sede Oficial</span>
                              </li>
                              <li className="flex items-center space-x-1.5">
                                <Check size={14} className="text-amber-400 shrink-0" />
                                <span>Recorrido Cultural Guiado por Xela + Almuerzo Típico</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Sección Atractiva Vendedora de Cuotas */}
                      <div className="bg-gradient-to-r from-blue-955 via-slate-900 to-blue-955 p-6 rounded-2xl border border-yellow-500/40 text-left space-y-3.5 shadow-xl">
                        <div className="flex items-center space-x-2 text-yellow-300">
                          <CreditCard size={22} className="text-yellow-400 shrink-0" />
                          <h4 className="text-base font-black tracking-tight">💳 ¡Disfruta de la Convención Pagando en Cómodas Cuotas!</h4>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                          Aprovecha las opciones de financiamiento con tu tarjeta de crédito favorita (Visa o MasterCard) para asegurar tu paquete completo sin descuidar tu presupuesto. ¡Vive la experiencia de la convención al máximo!
                        </p>

                        {/* Aclaración importante sobre las 12 cuotas según requerimiento */}
                        <div className="bg-blue-900/50 p-3.5 rounded-xl border border-white/15 text-xs text-slate-300 flex items-start space-x-2.5">
                          <Info size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                          <p className="leading-relaxed">
                            <strong className="text-yellow-300">Aviso sobre Cuotas:</strong> A partir de 12 cuotas aplica un recargo mínimo por financiamiento del procesador de pagos según el banco emisor de tu tarjeta, detallado claramente en la pantalla de la pasarela según el banco y tarjeta seleccionados.
                          </p>
                        </div>
                      </div>

                      {/* Resumen Final de Pago */}
                      <div className="bg-blue-955/90 p-5 rounded-2xl border border-white/15 text-left space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-300 border-b border-white/10 pb-2">
                          <span>Socio Registrar: <strong>{form.nombre}</strong></span>
                          <span>Club: <strong>{form.club === 'Otro Club' ? customClub : form.club}</strong></span>
                        </div>
                        <div className="flex justify-between items-center pt-1 text-sm font-black">
                          <span className="text-white">Total a Cancelar:</span>
                          <span className="text-2xl text-yellow-400">Q. {paqueteSeleccionado === 'completo' ? '1,050.00' : '650.00'}</span>
                        </div>
                      </div>

                      {/* Acciones de Pago */}
                      <div className="space-y-3 pt-2">
                        <button
                          type="button"
                          onClick={() => handleFinalSubmit('recurrente')}
                          disabled={loading || isRedirectingPayment}
                          className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-400 text-white font-black px-6 py-4 rounded-2xl text-base transition-all duration-300 shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          {loading || isRedirectingPayment ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Conectando con Pasarela Recurrente GT...</span>
                            </div>
                          ) : (
                            <>
                              <CreditCard size={20} />
                              <span>💳 Proceder al Pago Seguro (Q. {paqueteSeleccionado === 'completo' ? '1,050.00' : '650.00'})</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleFinalSubmit('transferencia')}
                          disabled={loading || isRedirectingPayment}
                          className="w-full flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3.5 rounded-2xl text-xs transition-all border border-white/15 cursor-pointer"
                        >
                          <Send size={15} />
                          <span>Confirmar Pre-Registro y Pagar Después / Transferencia</span>
                        </button>
                      </div>

                      {/* Botón Regresar */}
                      <div className="pt-2 flex justify-start">
                        <button
                          type="button"
                          onClick={() => setWizardStep(3)}
                          className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white font-black px-5 py-3 rounded-2xl text-xs transition-all border border-white/15 cursor-pointer"
                        >
                          <ArrowLeft size={16} />
                          <span>Anterior (Paso 3)</span>
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center py-12 space-y-6 animate-in fade-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-yellow-500 text-blue-955 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-yellow-500/20">
                    <CheckCircle2 size={44} />
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tight">¡Pre-inscripción Confirmada!</h3>
                  <p className="text-slate-200 text-base max-w-lg mx-auto leading-relaxed">
                    ¡Bienvenido, Compañero León <strong className="text-yellow-400 font-extrabold">{form.nombre}</strong>! Tu pre-inscripción a la Convención ha sido registrada con éxito. Recibirás tu credencial digital y las alertas de notificaciones oficiales en Telegram.
                  </p>
                  <div className="pt-6">
                    <button 
                      onClick={handleResetForm}
                      className="text-xs font-extrabold uppercase tracking-wider text-yellow-400 hover:text-yellow-300 border border-yellow-500/30 px-5 py-2.5 rounded-xl bg-yellow-500/10 transition-colors cursor-pointer"
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
                  <span className="inline-block bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider">
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
