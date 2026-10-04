import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
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
  Hotel,
  Star,
  Flame,
  Zap,
  Shield,
  Mail,
  Save,
  RotateCcw,
  QrCode,
  Search,
  Download,
  Share2,
  MessageCircle,
  X
} from 'lucide-react';
import QRCode from 'qrcode';
import { firebaseService } from '../services/firebaseService';
import { telegramService } from '../services/telegramService';
import { gmailService } from '../services/gmailService';
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

export const ALIANZAS_CONVENCION = [
  { 
    id: 'pat-1', 
    name: 'LXXV Convención Nacional 2027', 
    category: 'Identidad Oficial', 
    badge: '', 
    logoUrl: 'images/patrocinadores/logo-convencion.png', 
    icon: '🏛️' 
  },
  { 
    id: 'pat-2', 
    name: 'Club de Leones Quetzaltenango', 
    category: 'Club Anfitrión Fundador', 
    badge: '', 
    logoUrl: 'images/patrocinadores/logo-horizontal.jpg', 
    icon: '🦁' 
  },
  { 
    id: 'pat-3', 
    name: 'Tigo Guatemala', 
    category: 'Telecomunicaciones & Red', 
    badge: '', 
    logoUrl: 'images/patrocinadores/tigo.jpeg', 
    icon: '📱' 
  },
  { 
    id: 'pat-4', 
    name: "McDonald's Guatemala", 
    category: 'Franquicias & Alimentación', 
    badge: '', 
    logoUrl: 'images/patrocinadores/mc.jpeg', 
    icon: '🍔' 
  },
  { 
    id: 'pat-5', 
    name: 'Ron Botran', 
    category: 'Tradición Licorera de Origen', 
    badge: '', 
    logoUrl: 'images/patrocinadores/botran.png', 
    icon: '🥃' 
  },
  { 
    id: 'pat-6', 
    name: 'Red Bull', 
    category: 'Energía & Bebidas', 
    badge: '', 
    logoUrl: 'images/patrocinadores/red-bull.png', 
    icon: '⚡' 
  },
  { 
    id: 'pat-7', 
    name: 'cbc Guatemala', 
    category: 'Bebidas & Distribución Global', 
    badge: '', 
    logoUrl: 'images/patrocinadores/cbc.png', 
    icon: '🥤' 
  },
  { 
    id: 'pat-8', 
    name: 'Bosha Company', 
    category: 'Textiles & Soluciones de Marca', 
    badge: '', 
    logoUrl: 'images/patrocinadores/bosha.png', 
    icon: '👔' 
  },
  { 
    id: 'pat-9', 
    name: 'Cervecería de Occidente - Cebada', 
    category: 'Bebidas de Tradición Altense', 
    badge: '', 
    logoUrl: 'images/patrocinadores/cebada.jpg', 
    icon: '🌾' 
  },
  { 
    id: 'pat-10', 
    name: 'Mary Kay Guatemala', 
    category: 'Belleza & Cuidado Personal', 
    badge: '', 
    logoUrl: 'images/patrocinadores/mary-kay.png', 
    icon: '✨' 
  },
  { 
    id: 'pat-11', 
    name: 'iCopy Soluciones Digitales', 
    category: 'Tecnología & Diseño Gráfico', 
    badge: '', 
    logoUrl: 'images/patrocinadores/icopy.jpg', 
    icon: '🖨️' 
  },
  { 
    id: 'pat-12', 
    name: 'Metro Supermercados', 
    category: 'Comercio & Retail Regional', 
    badge: '', 
    logoUrl: 'images/patrocinadores/metro.png', 
    icon: '🛒' 
  },
  { 
    id: 'pat-13', 
    name: 'Lácteos Yes', 
    category: 'Nutrición & Productos Lácteos', 
    badge: '', 
    logoUrl: 'images/patrocinadores/yes.jpeg', 
    icon: '🥛' 
  },
  { 
    id: 'pat-14', 
    name: 'Seguros La Estrella', 
    category: 'Protección & Finanzas', 
    badge: '', 
    logoUrl: 'images/patrocinadores/strella.png', 
    icon: '⭐' 
  },
  { 
    id: 'pat-15', 
    name: 'Licda. Olga Figueroa', 
    category: 'Asesoría Profesional & Jurídica', 
    badge: '', 
    logoUrl: 'images/patrocinadores/olga-figueroa.jpeg', 
    icon: '⚖️' 
  }
];

export const DEFAULT_ACTIVIDADES_CULTURALES = [
  {
    id: 'act-1',
    title: 'Desfile de Banderas y Sesión Inaugural',
    description: 'Apertura oficial con honores de gala, marcha de estandartes leonísticos y mensaje solemne de autoridades distritales.',
    time: 'Jueves 19 • 16:00 hrs',
    iconName: 'Flag'
  },
  {
    id: 'act-2',
    title: 'Noche Típica Quetzalteca & Convivencia',
    description: 'Velada mágica con concierto de marimba en vivo, degustación de gastronomía tradicional, shecas calientes y fraternidad.',
    time: 'Viernes 20 • 19:30 hrs',
    iconName: 'Music'
  },
  {
    id: 'act-3',
    title: 'Plenarias Magistrales y Elecciones Distritales',
    description: 'Jornadas de capacitación en liderazgo global, toma de acuerdos trascendentales y elección democrática del nuevo Gabinete.',
    time: 'Sábado 21 • 08:30 hrs',
    iconName: 'Award'
  },
  {
    id: 'act-4',
    title: 'Cena de Gala y Baile de Coronación',
    description: 'Banquete solemne de clausura en el Salón Doña Beatriz con orquesta internacional y reconocimiento al mérito leonístico.',
    time: 'Sábado 21 • 20:00 hrs',
    iconName: 'Sparkles'
  },
  {
    id: 'act-5',
    title: 'Paseo Turístico & Tour Cultural por Xela',
    description: 'Recorrido guiado por el Centro Histórico, Teatro Municipal, pasaje Enríquez y miradores emblemáticos de los Altos.',
    time: 'Domingo 22 • 09:00 hrs',
    iconName: 'Coffee'
  },
  {
    id: 'act-6',
    title: 'Clausura Solemne y Almuerzo de Despedida',
    description: 'Acto de juramentación de nuevas autoridades leonísticas, intercambio de pines conmemorativos y despedida fraterna.',
    time: 'Domingo 22 • 13:00 hrs',
    iconName: 'Users'
  }
];

export const DEFAULT_EXPERIENCIAS = [
  {
    id: 'exp-1',
    badge: 'Mística & Servicio',
    title: 'Hermandad Leonística Sin Fronteras',
    desc: 'Un encuentro único para reencontrarse con compañeros leones de toda la nación, fortalecer lazos de amistad sincera y renovar votos de servicio hacia los más necesitados.'
  },
  {
    id: 'exp-2',
    badge: 'Cultura Viva',
    title: 'La Esencia y Majestad de Xelajú',
    desc: 'Sumérgete en la riqueza arquitectónica, cultural y climática de la ciudad de la Estrella de Occidente, cuna de poetas, artistas y hombres ilustres de Guatemala.'
  },
  {
    id: 'exp-3',
    badge: 'Liderazgo Global',
    title: 'Formación de Alto Nivel para el Futuro',
    desc: 'Seminarios de vanguardia con ponentes nacionales e internacionales sobre filantropía moderna, proyectos de alto impacto social y crecimiento de clubes.'
  }
];

/**
 * Representación del Número 74 en el Sistema Vigesimal Maya (Base 20)
 * Nivel 2 (Arriba, Veintenas): 3 puntos ( • • • ) = 3 x 20 = 60
 * Nivel 1 (Abajo, Unidades): 4 puntos sobre 2 barras (cada barra = 5) = 4 + 10 = 14
 * Total = 60 + 14 = 74 (Oxk'al Kanlajuj)
 */
export const MayaNumeral74: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div 
      className={`inline-flex items-center gap-2 sm:gap-2.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500/25 via-yellow-500/30 to-amber-500/25 border border-yellow-400/60 shadow-lg shadow-black/30 backdrop-blur-md group hover:border-yellow-300 transition-all ${className}`}
      title="74 en Sistema Vigesimal Maya: 3 veintenas (60) + 14 unidades = 74 (Oxk'al Kanlajuj)"
    >
      <svg
        viewBox="0 0 54 44"
        className="w-8 h-6 sm:w-9 sm:h-7 drop-shadow-[0_2px_8px_rgba(234,179,8,0.5)] shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="mayaGoldConv" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="45%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>

        {/* Nivel Superior: Veintenas (20s) -> 3 puntos = 60 */}
        <circle cx="17" cy="7" r="3.2" fill="url(#mayaGoldConv)" stroke="#FFFBEB" strokeWidth="0.8" />
        <circle cx="27" cy="7" r="3.2" fill="url(#mayaGoldConv)" stroke="#FFFBEB" strokeWidth="0.8" />
        <circle cx="37" cy="7" r="3.2" fill="url(#mayaGoldConv)" stroke="#FFFBEB" strokeWidth="0.8" />

        {/* Divisoria ceremonial sutil */}
        <line x1="8" y1="16" x2="46" y2="16" stroke="#FEF08A" strokeOpacity="0.45" strokeWidth="0.8" strokeDasharray="1.5 1.5" />

        {/* Nivel Inferior: Unidades (1s) -> 14 (4 puntos + 2 barras) */}
        <circle cx="12" cy="22.5" r="2.8" fill="url(#mayaGoldConv)" stroke="#FFFBEB" strokeWidth="0.7" />
        <circle cx="22" cy="22.5" r="2.8" fill="url(#mayaGoldConv)" stroke="#FFFBEB" strokeWidth="0.7" />
        <circle cx="32" cy="22.5" r="2.8" fill="url(#mayaGoldConv)" stroke="#FFFBEB" strokeWidth="0.7" />
        <circle cx="42" cy="22.5" r="2.8" fill="url(#mayaGoldConv)" stroke="#FFFBEB" strokeWidth="0.7" />

        {/* Barra 1 (valor 5) */}
        <rect x="8" y="29.5" width="38" height="4" rx="2" fill="url(#mayaGoldConv)" stroke="#FFFBEB" strokeWidth="0.8" />

        {/* Barra 2 (valor 5) */}
        <rect x="8" y="37" width="38" height="4" rx="2" fill="url(#mayaGoldConv)" stroke="#FFFBEB" strokeWidth="0.8" />
      </svg>

      <div className="flex flex-col text-left leading-none">
        <span className="text-[9px] uppercase tracking-widest text-yellow-300 font-extrabold flex items-center gap-1">
          <span>Glifo Maya</span>
          <span className="text-[8px] bg-yellow-400/25 text-yellow-200 px-1 py-0.2 rounded font-mono font-bold">74</span>
        </span>
        <span className="text-[10px] sm:text-xs font-black text-white font-serif tracking-tight mt-0.5">
          Oxk'al Kanlajuj
        </span>
      </div>
    </div>
  );
};

/**
 * Representación del Número 75 en el Sistema Vigesimal Maya (Base 20)
 * Nivel 2 (Arriba, Veintenas): 3 puntos ( • • • ) = 3 x 20 = 60
 * Nivel 1 (Abajo, Unidades): 3 barras (cada barra = 5) = 15
 * Total = 60 + 15 = 75 (Oxk'al Holajuj)
 */
export const MayaNumeral75: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div 
      className={`inline-flex items-center gap-2 sm:gap-2.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500/25 via-yellow-500/30 to-amber-500/25 border border-yellow-400/60 shadow-lg shadow-black/30 backdrop-blur-md group hover:border-yellow-300 transition-all ${className}`}
      title="75 en Sistema Vigesimal Maya: 3 veintenas (60) + 15 unidades = 75 (Oxk'al Holajuj)"
    >
      <svg
        viewBox="0 0 54 44"
        className="w-8 h-6 sm:w-9 sm:h-7 drop-shadow-[0_2px_8px_rgba(234,179,8,0.5)] shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="mayaGoldConv75" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="45%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>

        {/* Nivel Superior: Veintenas (20s) -> 3 puntos = 60 */}
        <circle cx="17" cy="6" r="3.2" fill="url(#mayaGoldConv75)" stroke="#FFFBEB" strokeWidth="0.8" />
        <circle cx="27" cy="6" r="3.2" fill="url(#mayaGoldConv75)" stroke="#FFFBEB" strokeWidth="0.8" />
        <circle cx="37" cy="6" r="3.2" fill="url(#mayaGoldConv75)" stroke="#FFFBEB" strokeWidth="0.8" />

        {/* Divisoria ceremonial sutil */}
        <line x1="8" y1="13" x2="46" y2="13" stroke="#FEF08A" strokeOpacity="0.45" strokeWidth="0.8" strokeDasharray="1.5 1.5" />

        {/* Nivel Inferior: Unidades (1s) -> 15 (3 barras de 5) */}
        <rect x="8" y="17.5" width="38" height="4.5" rx="2.2" fill="url(#mayaGoldConv75)" stroke="#FFFBEB" strokeWidth="0.8" />
        <rect x="8" y="25.5" width="38" height="4.5" rx="2.2" fill="url(#mayaGoldConv75)" stroke="#FFFBEB" strokeWidth="0.8" />
        <rect x="8" y="33.5" width="38" height="4.5" rx="2.2" fill="url(#mayaGoldConv75)" stroke="#FFFBEB" strokeWidth="0.8" />
      </svg>

      <div className="flex flex-col text-left leading-none">
        <span className="text-[9px] uppercase tracking-widest text-yellow-300 font-extrabold flex items-center gap-1">
          <span>Glifo Maya</span>
          <span className="text-[8px] bg-yellow-400/25 text-yellow-200 px-1 py-0.2 rounded font-mono font-bold">75</span>
        </span>
        <span className="text-[10px] sm:text-xs font-black text-white font-serif tracking-tight mt-0.5">
          Oxk'al Holajuj
        </span>
      </div>
    </div>
  );
};

export default function Convencion() {
  const { showToast } = useToast();
  const [config, setConfig] = useState<ConvencionConfig>({
    titulo: 'Distrito D3 Guatemala',
    lema: 'Rugiendo con fuerza, sirviendo con amor y uniendo voluntades por nuestra nación',
    fechaEvento: '2027-03-19',
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

  // Clave y estructura para persistencia de borrador en localStorage
  const CONVENCION_DRAFT_KEY = 'club_leones_convencion_form_draft_v1';

  interface ConvencionDraftData {
    form: {
      nombre: string;
      email: string;
      telefono: string;
      club: string;
      cargo: string;
      distrito: string;
    };
    wizardStep: 1 | 2 | 3 | 4;
    telefonoDigitos: string;
    dpiDigitos: string;
    customClub: string;
    includeHotel: boolean;
    includeCultural: boolean;
    includeFamiliar: boolean;
    telegramOption: 'telegram' | 'email' | null;
    telegramVerified?: boolean;
    savedAt?: number;
  }

  const initialDraft = useMemo((): ConvencionDraftData | null => {
    try {
      const raw = localStorage.getItem(CONVENCION_DRAFT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as ConvencionDraftData;
      }
    } catch (err) {
      console.warn("Error al recuperar borrador del formulario de convención:", err);
    }
    return null;
  }, []);

  const [form, setForm] = useState(() => initialDraft?.form || {
    nombre: '',
    email: '',
    telefono: '',
    club: 'Guatemala Central',
    cargo: 'Socio',
    distrito: 'Zona A-1'
  });

  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(() => initialDraft?.wizardStep || 1);
  const [telefonoDigitos, setTelefonoDigitos] = useState(() => initialDraft?.telefonoDigitos || '');
  const [dpiDigitos, setDpiDigitos] = useState(() => initialDraft?.dpiDigitos || '');
  const [customClub, setCustomClub] = useState(() => initialDraft?.customClub || '');
  const [includeHotel, setIncludeHotel] = useState<boolean>(false);
  const [includeCultural, setIncludeCultural] = useState<boolean>(false);
  const [includeFamiliar, setIncludeFamiliar] = useState<boolean>(false);
  const [telegramOption, setTelegramOption] = useState<'telegram' | 'email' | null>(() => initialDraft?.telegramOption || null);
  const [telegramVerified, setTelegramVerified] = useState<boolean>(() => !!initialDraft?.telegramVerified);
  const [isDraftRestored, setIsDraftRestored] = useState<boolean>(() => {
    return !!(
      initialDraft && 
      (initialDraft.form?.nombre || initialDraft.form?.email || initialDraft.telefonoDigitos || (initialDraft.wizardStep && initialDraft.wizardStep > 1))
    );
  });

  const baseCost = config.tarifaBase && config.tarifaBase > 0 ? config.tarifaBase : 650;
  const hotelCost = includeHotel ? (config.tarifaHotel || 400) : 0;
  const culturalCost = includeCultural ? (config.tarifaCultural || 150) : 0;
  const familiarCost = includeFamiliar ? (config.tarifaFamiliar || 450) : 0;
  const montoTotal = baseCost + hotelCost + culturalCost + familiarCost;
  const [isRedirectingPayment, setIsRedirectingPayment] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [searchParams] = useSearchParams();
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    id: string;
    nombre: string;
    club: string;
    paquete: string;
    monto: number;
    metodo: 'recurrente' | 'transferencia';
    estadoPago: string;
  } | null>(null);

  // Custom dropdown states
  const [openDropdown, setOpenDropdown] = useState<'cargo' | 'zona' | 'club' | null>(null);
  const [clubSearchTerm, setClubSearchTerm] = useState('');
  const cargoRef = useRef<HTMLDivElement>(null);
  const zonaRef = useRef<HTMLDivElement>(null);
  const clubRef = useRef<HTMLDivElement>(null);

  // Derivar la lista de aliados garantizando que siempre se muestren los 15 logos oficiales
  const displayAlianzas = useMemo(() => {
    if (config.alianzas && config.alianzas.length >= 10) {
      const isLegacy = config.alianzas.some(a => a.name === 'Lluvia de Ideas Editorial' || a.id === 'alianza-1');
      if (!isLegacy) return config.alianzas;
    }
    return ALIANZAS_CONVENCION;
  }, [config.alianzas]);

  // Derivar actividades culturales garantizando itinerario representativo
  const displayActividades = useMemo(() => {
    if (config.actividadesCulturales && config.actividadesCulturales.length > 0) {
      return config.actividadesCulturales;
    }
    return DEFAULT_ACTIVIDADES_CULTURALES;
  }, [config.actividadesCulturales]);

  // Derivar experiencias únicas
  const displayExperiencias = useMemo(() => {
    if (config.experienciasUnicas && config.experienciasUnicas.length > 0) {
      return config.experienciasUnicas;
    }
    return DEFAULT_EXPERIENCIAS;
  }, [config.experienciasUnicas]);

  const [showStickyBar, setShowStickyBar] = useState(false);

  // Estados para Búsqueda y Visualización de Entrada QR
  const [isQrSearchModalOpen, setIsQrSearchModalOpen] = useState(false);
  const [qrSearchQuery, setQrSearchQuery] = useState('');
  const [isSearchingQr, setIsSearchingQr] = useState(false);
  const [foundRegistroQr, setFoundRegistroQr] = useState<ConvencionRegistro | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [qrSearchError, setQrSearchError] = useState<string>('');

  const handleSearchQr = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = qrSearchQuery.trim();
    if (!query) {
      setQrSearchError("Por favor ingresa tu correo, teléfono o folio de registro.");
      return;
    }

    setIsSearchingQr(true);
    setQrSearchError('');
    setFoundRegistroQr(null);
    setQrCodeDataUrl('');

    try {
      const match = await firebaseService.searchConvencionRegistro(query);

      if (!match) {
        setQrSearchError("No encontramos ninguna inscripción con esos datos. Revisa el correo, teléfono o folio que utilizaste al registrarte, o llena tu formulario.");
        return;
      }

      setFoundRegistroQr(match);
      const qrPayload = JSON.stringify({
        evento: "LXXV Convención Nacional Club de Leones",
        sede: "Quetzaltenango 2027",
        folio: match.id,
        participante: match.nombre,
        club: match.club,
        paquete: match.paquete || 'General',
        monto: match.montoPagar || baseCost,
        estado: match.estadoPago || 'Pendiente',
        fecha: match.fechaRegistro
      });

      const dataUrl = await QRCode.toDataURL(qrPayload, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0c1a38',
          light: '#ffffff'
        }
      });
      setQrCodeDataUrl(dataUrl);
    } catch (err) {
      console.error("Error al buscar entrada QR:", err);
      setQrSearchError("Ocurrió un error al buscar tu entrada. Intenta de nuevo.");
    } finally {
      setIsSearchingQr(false);
    }
  };

  const handleDownloadQr = () => {
    if (!qrCodeDataUrl || !foundRegistroQr) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = `Entrada_QR_${foundRegistroQr.nombre.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShareQrWhatsApp = () => {
    if (!foundRegistroQr) return;
    const text = `🦁 *Mi Entrada Oficial - LXXV Convención Nacional Club de Leones (Quetzaltenango 2027)*\n\n` +
      `👤 *Participante:* ${foundRegistroQr.nombre}\n` +
      `🏛️ *Club:* ${foundRegistroQr.club} (${foundRegistroQr.cargo})\n` +
      `🎟️ *Folio:* ${foundRegistroQr.id}\n` +
      `✨ *Paquete:* ${foundRegistroQr.paquete || 'Inscripción Base'}\n` +
      `💳 *Estado:* ${foundRegistroQr.estadoPago || 'Pendiente'}\n\n` +
      `Verifica tu entrada en: https://clubdeleonesquetzaltenango.org/#/convencion`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY;
      const formEl = document.getElementById('pre-inscripcion');
      if (formEl) {
        const formTop = formEl.offsetTop;
        // Mostrar sticky bar si ha scrolleado más de 600px pero aún no ha llegado al formulario
        setShowStickyBar(scrollPos > 600 && scrollPos < (formTop - 200));
      } else {
        setShowStickyBar(scrollPos > 600);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToPreInscripcion = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('pre-inscripcion');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToInstalaciones = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('instalaciones');
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

  // Procesar retorno de pasarela Recurrente GT (?pago=exitoso&id=...)
  useEffect(() => {
    const handleUrlStatus = async () => {
      const getParam = (name: string): string | null => {
        const fromRouter = searchParams.get(name);
        if (fromRouter) return fromRouter;
        const fromSearch = new URLSearchParams(window.location.search).get(name);
        if (fromSearch) return fromSearch;
        if (window.location.hash.includes('?')) {
          const hashQuery = window.location.hash.split('?')[1];
          return new URLSearchParams(hashQuery).get(name);
        }
        return null;
      };

      const pago = getParam('pago');
      const regId = getParam('id');

      if (pago === 'exitoso' && regId) {
        try {
          const reg = await firebaseService.getConvencionRegistroById(regId);
          if (reg) {
            if (reg.estadoPago !== 'Pagado') {
              reg.estadoPago = 'Pagado';
              await firebaseService.saveConvencionRegistro(reg);
              // Enviar correo automático oficial de confirmación de pago y entrada QR por Gmail
              gmailService.sendRegistrationEmail(reg, 'pago_confirmado', undefined, config?.googleScriptUrl).catch(err => {
                console.warn("No se pudo enviar correo de confirmación de pago por Gmail:", err);
              });
            }
            try {
              localStorage.removeItem(CONVENCION_DRAFT_KEY);
            } catch (e) {}
            setForm({
              nombre: reg.nombre,
              email: reg.email,
              telefono: reg.telefono,
              club: reg.club,
              cargo: reg.cargo,
              distrito: reg.distrito
            });
            setPaymentSuccessData({
              id: reg.id,
              nombre: reg.nombre,
              club: reg.club,
              paquete: reg.paquete || 'Inscripción Convención',
              monto: reg.montoPagar || 650,
              metodo: 'recurrente',
              estadoPago: 'Pagado'
            });
            setIsSubmitted(true);
            showToast("¡Pago completado con éxito! Tu inscripción oficial a la Convención está confirmada.", "success");
            
            setTimeout(() => {
              const el = document.getElementById('pre-inscripcion');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 400);
          }
        } catch (err) {
          console.error("Error al procesar retorno de pago:", err);
        }
      } else if (pago === 'cancelado') {
        showToast("El proceso de pago con tarjeta fue cancelado. Puedes volver a intentarlo o seleccionar transferencia bancaria.", "info");
      }
    };

    handleUrlStatus();
  }, [searchParams]);

  // Auto-guardado de progreso del formulario en localStorage
  useEffect(() => {
    if (isSubmitted) {
      try {
        localStorage.removeItem(CONVENCION_DRAFT_KEY);
      } catch (e) {}
      return;
    }

    const hasData = Boolean(
      form.nombre.trim() ||
      form.email.trim() ||
      telefonoDigitos.trim() ||
      dpiDigitos.trim() ||
      customClub.trim() ||
      includeHotel ||
      includeCultural ||
      includeFamiliar ||
      telegramOption ||
      telegramVerified ||
      wizardStep > 1
    );

    if (hasData) {
      try {
        const draft: ConvencionDraftData = {
          form,
          wizardStep,
          telefonoDigitos,
          dpiDigitos,
          customClub,
          includeHotel,
          includeCultural,
          includeFamiliar,
          telegramOption,
          telegramVerified,
          savedAt: Date.now()
        };
        localStorage.setItem(CONVENCION_DRAFT_KEY, JSON.stringify(draft));
      } catch (err) {
        console.warn("No se pudo guardar el borrador en localStorage:", err);
      }
    }
  }, [
    form,
    wizardStep,
    telefonoDigitos,
    dpiDigitos,
    customClub,
    includeHotel,
    includeCultural,
    includeFamiliar,
    telegramOption,
    telegramVerified,
    isSubmitted
  ]);

  // Load config from Firestore on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const dbConfig = await firebaseService.getConvencionConfig();
        if (dbConfig) {
          const isLegacy = !dbConfig.alianzas || 
            dbConfig.alianzas.length < 10 || 
            dbConfig.alianzas.some(a => a.name === 'Lluvia de Ideas Editorial' || a.id === 'alianza-1');

          const finalAlianzas = isLegacy ? ALIANZAS_CONVENCION : dbConfig.alianzas;

          setConfig(prev => ({
            ...prev,
            ...dbConfig,
            alianzas: finalAlianzas,
            inscripcionesAbiertas: dbConfig.inscripcionesAbiertas !== undefined ? dbConfig.inscripcionesAbiertas : true
          }));

          if (isLegacy) {
            firebaseService.saveConvencionConfig({
              ...dbConfig,
              alianzas: ALIANZAS_CONVENCION
            }).catch(err => console.warn("Auto-sincronización de alianzas:", err));
          }
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
        const dateParts = config.fechaEvento.split('-');
        if (dateParts.length < 3) return 0;
        
        let year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // 0-indexed
        const day = parseInt(dateParts[2], 10);
        
        // Safely parse hours, minutes, seconds (horaEvento may be a text or time format)
        let hours = 8;
        let minutes = 0;
        let seconds = 0;
        if (config.horaEvento && config.horaEvento.includes(':')) {
          const timeParts = config.horaEvento.split(':');
          const h = parseInt(timeParts[0], 10);
          const m = parseInt(timeParts[1], 10);
          const s = parseInt(timeParts[2], 10);
          if (!isNaN(h)) hours = h;
          if (!isNaN(m)) minutes = m;
          if (!isNaN(s)) seconds = s;
        }

        if (isNaN(year) || isNaN(month) || isNaN(day)) return 0;

        let target = new Date(year, month, day, hours, minutes, seconds).getTime();
        const now = new Date().getTime();

        return target;
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

  const isInternacional = form.distrito === 'Otro / Internacional';

  const handleDpiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isInternacional) {
      setDpiDigitos(e.target.value.slice(0, 20));
    } else {
      const val = e.target.value.replace(/\D/g, '').slice(0, 13);
      setDpiDigitos(val);
    }
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

  const handleNextStep = (step: 1 | 2 | 3 | 4) => {
    if (step === 2) {
      if (!form.nombre.trim() || !form.email.trim() || !telefonoDigitos.trim() || !dpiDigitos.trim()) {
        showToast("Por favor completa todos los campos requeridos del Paso 1.", "error");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim())) {
        showToast("Por favor ingresa un correo electrónico válido.", "error");
        return;
      }
      if (telefonoDigitos.length !== 8) {
        showToast("El número de teléfono debe tener exactamente 8 dígitos.", "error");
        return;
      }
      if (isInternacional) {
        if (dpiDigitos.trim().length < 5) {
          showToast("Por favor ingresa un número de Pasaporte o documento de identificación válido (mínimo 5 caracteres).", "error");
          return;
        }
      } else {
        if (dpiDigitos.length !== 13) {
          showToast("El número de DPI debe tener 13 dígitos numéricos (o selecciona 'Otro / Internacional' si eres del extranjero).", "error");
          return;
        }
      }
    }

    if (step === 3) {
      if (form.distrito === 'Otro / Internacional' || form.club === 'Otro Club') {
        if (!customClub.trim()) {
          showToast("Por favor escribe el nombre de tu club.", "error");
          return;
        }
      }
    }

    if (step === 4) {
      if (!telegramOption) {
        showToast("Por favor indícanos si tienes Telegram o si prefieres recibir todo por correo electrónico.", "warning");
        return;
      }
    }

    setWizardStep(step);
    const element = document.getElementById('pre-inscripcion');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleResetForm = () => {
    try {
      localStorage.removeItem(CONVENCION_DRAFT_KEY);
    } catch (e) {}
    setIsDraftRestored(false);
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
    setIncludeHotel(false);
    setIncludeCultural(false);
    setIncludeFamiliar(false);
    setTelegramOption(null);
    setTelegramVerified(false);
    setPaymentSuccessData(null);
    setWizardStep(1);
    setIsSubmitted(false);
  };

  const handleFinalSubmit = async (metodo: 'recurrente' | 'transferencia') => {
    if (telefonoDigitos.length !== 8) {
      showToast("Por favor, ingresa un número de teléfono válido de 8 dígitos.", "error");
      return;
    }
    
    const finalClub = (form.distrito === 'Otro / Internacional' || form.club === 'Otro Club') 
      ? customClub.trim() 
      : form.club;

    if ((form.distrito === 'Otro / Internacional' || form.club === 'Otro Club') && !finalClub) {
      showToast("Por favor, ingresa el nombre de tu club.", "error");
      return;
    }

    setLoading(true);
    const selectedComplementos: string[] = ['Inscripción Base (Q. 650)'];
    if (includeHotel) selectedComplementos.push('Hospedaje Hotel Sede (+ Q. 400)');
    if (includeCultural) selectedComplementos.push('Paquete Inmersivo Cultural (+ Q. 150)');
    if (includeFamiliar) selectedComplementos.push('Paquete Familiar Inmersivo Cultural (+ Q. 450)');

    const paqueteNombre = selectedComplementos.join(' + ');

    const checkoutItems = [
      {
        name: 'Inscripción Convención Base',
        amount_in_cents: 65000,
        currency: 'GTQ' as const,
        quantity: 1
      }
    ];

    if (includeHotel) {
      checkoutItems.push({
        name: 'Complemento: Hospedaje en Hotel Sede y Tour',
        amount_in_cents: 40000,
        currency: 'GTQ' as const,
        quantity: 1
      });
    }

    if (includeCultural) {
      checkoutItems.push({
        name: 'Complemento: Paquete Inmersivo Cultural',
        amount_in_cents: 15000,
        currency: 'GTQ' as const,
        quantity: 1
      });
    }

    if (includeFamiliar) {
      checkoutItems.push({
        name: 'Complemento: Paquete Familiar Inmersivo Cultural',
        amount_in_cents: 45000,
        currency: 'GTQ' as const,
        quantity: 1
      });
    }
    
    try {
      const nuevoRegistro: ConvencionRegistro = {
        id: `reg_${Date.now()}`,
        ...form,
        club: finalClub,
        dpi: dpiDigitos.trim(),
        paquete: paqueteNombre,
        includeHotel,
        includeCultural,
        includeFamiliar,
        preferenciaNotificacion: telegramOption || 'email',
        telegramVerificado: telegramOption === 'telegram' ? telegramVerified : false,
        montoPagar: montoTotal,
        estadoPago: metodo === 'recurrente' ? 'Checkout_Creado' : 'Pendiente',
        fechaRegistro: new Date().toISOString(),
        ultimoTipoNotificacion: 'pre_registro',
        ultimoMensajeEnviado: '🦁 Confirmación de Pre-Inscripción: LXXV Convención Nacional',
        fechaUltimoMensaje: new Date().toISOString(),
        canalUltimoMensaje: 'gmail',
        notificacionesEnviadas: ['pre_registro'],
        mensajesEnviados: [{
          id: `msg_${Date.now()}_pre`,
          fecha: new Date().toISOString(),
          canal: 'gmail',
          tipo: 'pre_registro',
          asunto: '🦁 Confirmación de Pre-Inscripción: LXXV Convención Nacional',
          mensajeResumen: 'Bienvenido y confirmación de pre-registro recibida.'
        }]
      };
      
      await firebaseService.saveConvencionRegistro(nuevoRegistro);
      
      // Enviar correo informativo automático por Gmail & notificación de Telegram
      gmailService.sendRegistrationEmail(
        nuevoRegistro, 
        'pre_registro', 
        { customWelcomeText: config?.mensajeBienvenidaEmail }, 
        config?.googleScriptUrl
      ).catch(err => {
        console.warn("No se pudo enviar correo de bienvenida por Gmail:", err);
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
            items: checkoutItems,
            userEmail: form.email.trim(),
            successUrl: `${currentUrl}#/convencion?pago=exitoso&id=${nuevoRegistro.id}`,
            cancelUrl: `${currentUrl}#/convencion?pago=cancelado`,
            metadata: {
              registroId: nuevoRegistro.id,
              nombre: form.nombre,
              club: finalClub,
              paquete: paqueteNombre
            }
          });

          if (checkoutResponse && checkoutResponse.checkout_url) {
            nuevoRegistro.recurrenteCheckoutUrl = checkoutResponse.checkout_url;
            await firebaseService.saveConvencionRegistro(nuevoRegistro);
            window.location.href = checkoutResponse.checkout_url;
            return;
          }
        } catch (payErr: any) {
          console.error("Error al conectar con la pasarela de pagos Recurrente GT:", payErr);
          showToast(`Tu pre-registro fue guardado con éxito. ${payErr?.message || 'No se pudo generar el enlace directo de pago.'} Puedes realizar tu pago por transferencia bancaria.`, "info");
        }
      }

      try {
        localStorage.removeItem(CONVENCION_DRAFT_KEY);
      } catch (e) {}
      setIsDraftRestored(false);
      setPaymentSuccessData({
        id: nuevoRegistro.id,
        nombre: nuevoRegistro.nombre,
        club: finalClub,
        paquete: paqueteNombre,
        monto: montoTotal,
        metodo: metodo,
        estadoPago: 'Pendiente'
      });
      setIsSubmitted(true);
      showToast(
        metodo === 'transferencia' 
          ? "¡Pre-registro guardado con éxito! Por favor realiza tu depósito o transferencia bancaria para asegurar tu cupo." 
          : "¡Pre-registro guardado con éxito!", 
        "success"
      );
    } catch (error) {
      console.error("Error al registrar participante:", error);
      showToast("Hubo un problema al registrar tus datos. Por favor inténtalo de nuevo.", "error");
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
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased overflow-x-hidden selection:bg-yellow-500 selection:text-blue-955 pb-24 relative">
      {/* Dynamic Hero Header Section Block - Floating Royal Banner */}
      <div className="pt-2 sm:pt-8 max-w-[1440px] mx-auto px-2 sm:px-6 lg:px-8">
        <header className="relative w-full py-10 sm:py-16 lg:py-20 px-3 sm:px-6 lg:px-8 overflow-hidden text-center z-10 rounded-2xl sm:rounded-[2.5rem] bg-gradient-to-br from-[#0c1a38] via-[#09152e] to-[#060e1d] text-white border sm:border-2 border-yellow-500/40 shadow-2xl">
          {/* Custom Header Background Image with Gradient Overlay */}
          {config.headerBgUrl && (
            <div 
              className="absolute inset-0 bg-cover bg-center pointer-events-none transition-all duration-700 opacity-20 scale-105"
              style={{ backgroundImage: `url("${config.headerBgUrl}")` }}
            />
          )}
          <div 
            className="absolute inset-0 bg-gradient-to-b from-transparent via-[#071024]/85 to-[#060d1d] pointer-events-none"
          />

          {/* Gran Resplandor Dorado detrás del Logo Central */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-[480px] sm:h-[480px] lg:w-[600px] lg:h-[600px] rounded-full bg-gradient-to-tr from-yellow-500/25 via-amber-400/20 to-blue-500/15 blur-3xl pointer-events-none animate-pulse" />

          <div className="max-w-5xl mx-auto relative z-10 space-y-6 sm:space-y-8">
            {/* Barra Conmemorativa Superior Unificada: Insignia 75 + Glifo Maya + 80 Años + Live Status */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-500/20 via-amber-500/25 to-yellow-500/20 border border-yellow-400/50 text-yellow-300 px-3.5 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider backdrop-blur-xl shadow-lg shadow-black/40">
                <Sparkles size={15} className="text-yellow-400 animate-pulse" />
                <span>LXXV Convención Nacional Lions</span>
                <span className="bg-yellow-400 text-blue-955 font-black text-[10px] px-2 py-0.5 rounded-full font-mono">
                  75ª
                </span>
              </div>

              {/* Número 75 en Numeración Maya Ceremonial */}
              <MayaNumeral75 />

              {/* 80 Años Conmemorativo */}
              <div className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-yellow-500/30 text-yellow-300 px-3.5 py-2 rounded-2xl text-xs font-black uppercase tracking-wider backdrop-blur-md">
                <Award size={14} className="text-yellow-400" />
                <span>80 Años • Club Quetzaltenango</span>
              </div>

              {/* Live Status Badge */}
              <div className="hidden sm:inline-flex items-center space-x-2 bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 px-3.5 py-2 rounded-2xl text-xs font-black uppercase tracking-wider backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Inscripciones Habilitadas</span>
              </div>
            </div>

            {/* ELEMENTO CENTRAL PROTAGÓNICO: Logotipo Oficial de la Convención */}
            <div className="relative py-2 sm:py-4 flex flex-col items-center justify-center">
              {/* Resplandor áurico circular concéntrico */}
              <div className="absolute w-52 h-52 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full bg-yellow-400/20 blur-3xl pointer-events-none" />
              
              <div className="relative z-10 transition-all duration-700 hover:scale-[1.03] select-none group cursor-default">
                <img 
                  src="/images/logo-convencion.png" 
                  alt="Logo Oficial LXXV Convención Nacional Distrito D-3 Guatemala - Club de Leones Quetzaltenango 80 Años" 
                  className="w-56 h-56 xs:w-64 xs:h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[410px] lg:h-[410px] object-contain drop-shadow-[0_25px_60px_rgba(234,179,8,0.5)] filter transition-all duration-500 group-hover:drop-shadow-[0_30px_70px_rgba(234,179,8,0.7)]"
                  loading="eager"
                />
              </div>

              {/* Insignia decorativa sutil bajo el emblema */}
              <div className="mt-2 inline-flex items-center space-x-2 px-4 py-1 rounded-full bg-yellow-500/10 border border-yellow-400/30 text-yellow-300 text-[11px] font-extrabold uppercase tracking-widest backdrop-blur-md">
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                <span>Emblema Oficial Conmemorativo</span>
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
              </div>
            </div>

            {/* Main Title con Kicker Superior */}
            <div className="space-y-2">
              <span className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.3em] text-yellow-400/90 block">
                Gran Encuentro Anual de Liderazgo, Servicio y Hermandad
              </span>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight sm:leading-none bg-gradient-to-r from-white via-amber-100 to-yellow-300 bg-clip-text text-transparent px-2 drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
                {config.titulo || 'Distrito D-3 Guatemala'}
              </h1>
            </div>

            {/* Lema Oficial con Comillas Decorativas */}
            <div className="relative max-w-3xl mx-auto px-4">
              <p className="text-slate-200 text-sm sm:text-xl italic font-serif leading-relaxed drop-shadow-md">
                <span className="text-yellow-400 font-serif text-2xl sm:text-3xl mr-1">“</span>
                {config.lema || 'Rugiendo con fuerza, sirviendo con amor y uniendo voluntades por nuestra nación'}
                <span className="text-yellow-400 font-serif text-2xl sm:text-3xl ml-1">”</span>
              </p>
            </div>

            {/* Glassmorphic Modern Date & Location Card con Resplandor */}
            <div className="pt-2 max-w-2xl mx-auto">
              <div className="relative p-0.5 rounded-3xl bg-gradient-to-r from-yellow-500/50 via-amber-400/30 to-yellow-500/50 shadow-[0_15px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl group hover:border-yellow-400/70 transition-all duration-300">
                <div className="bg-gradient-to-br from-[#0c1a38]/95 via-[#081226]/95 to-[#0c1a38]/95 rounded-[1.4rem] p-4 sm:p-5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                  
                  {/* Fechas del Evento */}
                  <div className="flex items-center space-x-3.5 w-full sm:w-auto">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500/25 to-amber-500/10 border border-yellow-400/40 flex flex-col items-center justify-center text-yellow-300 shrink-0 shadow-lg">
                      <Calendar size={20} className="text-yellow-400" />
                      <span className="text-[8px] font-black uppercase tracking-tighter text-yellow-200 mt-0.5">2027</span>
                    </div>
                    <div>
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-yellow-400/90 block">
                        Fecha Oficial Confirmada
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                        {config.fechaEventoTexto || 'Del 19 al 22 de Marzo, 2027'}
                      </h3>
                      <p className="text-[11px] text-slate-300 font-medium">
                        Jueves a Domingo • 4 Días de Convención
                      </p>
                    </div>
                  </div>

                  {/* Divisor vertical en desktop */}
                  <div className="hidden sm:block w-px h-11 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

                  {/* Sede y Ciudad */}
                  <div className="flex items-center space-x-3.5 w-full sm:w-auto border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0 shadow-lg">
                      <MapPin size={22} className="text-yellow-400 animate-bounce" />
                    </div>
                    <div>
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400 block">
                        Ciudad Sede
                      </span>
                      <h4 className="text-base sm:text-lg font-black text-white tracking-tight">
                        Quetzaltenango
                      </h4>
                      <p className="text-[11px] text-slate-300 font-medium">
                        Colina Country Club • Guatemala
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Reloj de Cuenta Regresiva de Alta Precisión */}
            <div className="pt-2 max-w-xl mx-auto">
              <div className="inline-flex items-center space-x-2 text-xs font-extrabold uppercase tracking-widest text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 px-3.5 py-1.5 rounded-full mb-4">
                <Clock size={13} className="text-yellow-400 animate-spin" />
                <span>La cuenta regresiva ha comenzado:</span>
              </div>

              <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
                {[
                  { label: 'Días', value: countdown.days },
                  { label: 'Horas', value: countdown.hours },
                  { label: 'Minutos', value: countdown.minutes },
                  { label: 'Segundos', value: countdown.seconds }
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    className="relative p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-yellow-400/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl group hover:border-yellow-400/80 hover:scale-105 transition-all duration-300"
                  >
                    <span className="text-2xl sm:text-4xl lg:text-5xl font-black font-mono text-yellow-300 tracking-tight group-hover:text-yellow-200 transition-colors drop-shadow-[0_2px_10px_rgba(234,179,8,0.4)]">
                      {String(item.value).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] sm:text-[11px] font-black uppercase text-slate-300 mt-1 sm:mt-2 tracking-widest block">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action CTAs Principales */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button 
                type="button"
                onClick={scrollToPreInscripcion}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-400 hover:from-yellow-400 hover:to-amber-300 text-blue-955 font-black px-8 py-4 sm:py-4.5 rounded-2xl text-base sm:text-lg transition-all duration-300 shadow-[0_10px_35px_rgba(245,158,11,0.4)] hover:shadow-[0_15px_45px_rgba(245,158,11,0.6)] transform hover:-translate-y-1 active:scale-95 min-h-[56px] cursor-pointer group"
              >
                <Zap size={20} className="fill-blue-955 group-hover:scale-110 transition-transform" />
                <span>{config.inscripcionesAbiertas ? 'Pre-regístrate Aquí y Asegura tu Cupo' : 'Ver Inscripciones'}</span>
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                type="button"
                onClick={scrollToInstalaciones}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/15 text-white font-extrabold px-6 py-4 rounded-2xl text-sm transition-all border border-white/20 hover:border-yellow-400/50 backdrop-blur-md cursor-pointer"
              >
                <Compass size={17} className="text-yellow-400" />
                <span>Explorar Sede & Programa</span>
              </button>
            </div>

            {/* Social Proof & Garantías */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-300">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Organización Oficial Distrito D3</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Pago en Cuotas con Tarjeta</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Cupos Limitados por Aforo Oficial</span>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* BANNER FLOTANTE: Conoce la Sede Virtualmente (Colina Country Club) */}
      <section id="instalaciones" className="my-6 sm:my-10 max-w-[1440px] mx-auto px-2 sm:px-6 lg:px-8 scroll-mt-10">
        <div className="bg-gradient-to-r from-[#0c1a38] via-[#09152e] to-[#0c1a38] text-white rounded-2xl sm:rounded-[2.5rem] p-4.5 sm:p-8 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6 border sm:border-2 border-yellow-500/40 relative overflow-hidden text-center sm:text-left group">
          <div className="space-y-2 max-w-xl relative z-10">
            <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider inline-block shadow-sm">
              Conoce la Sede Virtualmente
            </span>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">¿Quieres explorar todas las instalaciones del evento?</h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
              Visita el sitio oficial de Colina Country Club para descubrir más sobre sus galerías de fotos, salones y ubicación en Quetzaltenango.
            </p>
          </div>

          <a 
            href="https://colinacountryclub.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-400 hover:from-yellow-400 hover:to-amber-300 text-blue-955 font-black px-6 py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all duration-300 shadow-xl shadow-yellow-500/20 active:scale-95 shrink-0 min-h-[48px] cursor-pointer relative z-10"
          >
            <span>Visitar Sitio Oficial</span>
            <ExternalLink size={16} />
          </a>
        </div>
      </section>

      {/* SECCIÓN 2: Alianzas & Patrocinadores Marquee Block — FLOTANTE */}
      <section className="my-8 sm:my-16 max-w-[1440px] mx-auto px-2 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-blue-900/10 rounded-2xl border border-blue-900/20 text-blue-900 shrink-0 shadow-sm">
              <Handshake size={24} />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-600 block">
                Respaldos & Alianzas Institucionales
              </span>
              <h3 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Aliados Estratégicos de la LXXV Convención
              </h3>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md font-medium">
            Instituciones y empresas unidas por la fraternidad, la cultura y el liderazgo de servicio en Guatemala.
          </p>
        </div>

        {/* Contenedor Flotante del Carrusel */}
        <div className="bg-gradient-to-br from-[#0c1a38] via-[#09152e] to-[#060e1d] text-white border sm:border-2 border-yellow-500/30 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-8 shadow-xl relative overflow-hidden">
          {/* Gradient Masks */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-36 bg-gradient-to-r from-[#0c1a38] to-transparent z-20" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-36 bg-gradient-to-l from-[#0c1a38] to-transparent z-20" />

          {/* Scrolling Marquee Container with Square Slides and Clean Text */}
          <div 
            className="animate-marquee flex items-start space-x-4 sm:space-x-8 py-2 sm:py-4"
            style={{ animationDuration: '45s' }}
          >
            {[
              ...displayAlianzas,
              ...displayAlianzas
            ].map((aliado, index) => (
              <div 
                key={`${aliado.id}-${index}`}
                className="flex flex-col items-center group shrink-0 cursor-pointer"
              >
                {/* Square Logo Slide Box — Fondo Blanco Cristalino con Elevación Hover */}
                <div className="w-28 h-28 sm:w-44 sm:h-44 aspect-square rounded-2xl sm:rounded-3xl bg-white border-2 border-slate-100 group-hover:border-yellow-400 shadow-md group-hover:shadow-[0_10px_25px_rgba(234,179,8,0.25)] flex items-center justify-center p-3.5 sm:p-6 relative overflow-hidden transition-all duration-300 transform group-hover:-translate-y-1.5">
                  {/* Image or Icon */}
                  {aliado.logoUrl ? (
                    <img 
                      src={aliado.logoUrl} 
                      alt={aliado.name}
                      loading="lazy"
                      className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.sponsor-fallback-icon')) {
                          const iconEl = document.createElement('span');
                          iconEl.className = 'sponsor-fallback-icon text-3xl sm:text-5xl group-hover:scale-110 transition-transform duration-300';
                          iconEl.textContent = aliado.icon || '🤝';
                          parent.appendChild(iconEl);
                        }
                      }}
                    />
                  ) : (
                    <span className="text-3xl sm:text-5xl group-hover:scale-110 transition-transform duration-300">
                      {aliado.icon || '🤝'}
                    </span>
                  )}
                </div>

                {/* Text Below the Square Slide */}
                <div className="mt-2.5 sm:mt-3 text-center space-y-0.5 max-w-[110px] sm:max-w-[176px]">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-200 group-hover:text-yellow-300 transition-colors line-clamp-2 leading-tight">
                    {aliado.name}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN 3: Ciudad Sede (Quetzaltenango) Block — CONTENEDORES FLOTANTES */}
      <section className="my-8 sm:my-16 max-w-[1440px] mx-auto px-2 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* Contenedor Flotante Izquierdo: Información y Atractivos */}
          <div className="lg:col-span-6 bg-gradient-to-br from-[#0c1b3b] via-[#09152e] to-[#071126] text-white rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10 border border-yellow-500/30 shadow-xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
                <MapPin size={14} className="text-yellow-400" />
                <span>Ciudad Sede Oficial</span>
              </div>
              
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Quetzaltenango: La Cuna de la Cultura y el Escudo Altense
              </h2>
              
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Xelajú nos recibe con sus brazos abiertos, sus impresionantes montañas, historia centenaria y el caluroso espíritu león de la región occidental. Prepárate para vivir jornadas inolvidables de liderazgo y fraternidad.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
              <div className="bg-white/[0.05] border border-white/10 p-5 rounded-2xl shadow-md hover:border-yellow-500/50 transition-all space-y-1">
                <span className="text-xs font-black text-yellow-400 uppercase tracking-wider block">Clima Templado</span>
                <p className="text-slate-300 text-xs font-medium">Ideal para noches de gala solemnes y caminatas culturales por el centro histórico.</p>
              </div>
              <div className="bg-white/[0.05] border border-white/10 p-5 rounded-2xl shadow-md hover:border-yellow-500/50 transition-all space-y-1">
                <span className="text-xs font-black text-yellow-400 uppercase tracking-wider block">Gastronomía Única</span>
                <p className="text-slate-300 text-xs font-medium">Degusta las famosas Shecas calientes, chocolate artesanal y banquetes tradicionales.</p>
              </div>
            </div>
          </div>

          {/* Contenedor Flotante Derecho: Foto de la Sede */}
          <div className="lg:col-span-6 rounded-2xl sm:rounded-[2.5rem] overflow-hidden shadow-xl border border-yellow-500/30 min-h-[360px] sm:min-h-[440px] relative group">
            <img 
              src={config.fotoSede || "https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&q=80&w=1200"} 
              alt="Quetzaltenango Sede"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 absolute inset-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060e1d]/95 via-[#060e1d]/30 to-transparent flex items-end p-6 z-10">
              <div className="text-white space-y-1.5">
                <span className="bg-yellow-400 text-blue-955 text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow">
                  {config.fotoSedeEtiqueta || "Sede Oficial"}
                </span>
                <p className="text-sm sm:text-base font-bold text-slate-100 pt-1">
                  {config.fotoSedeDescripcion || "Quetzaltenango, Guatemala — Ciudad de la Estrella de Occidente"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 4: Actividades Culturales y Sociales — CONTENEDORES FLOTANTES */}
      <section className="my-8 sm:my-16 max-w-[1440px] mx-auto px-2 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4 mb-8 sm:mb-12">
          <div className="inline-flex items-center space-x-2 bg-blue-900/10 border border-blue-900/20 text-blue-900 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
            <Award size={14} />
            <span>Agenda de Hermandad & Convivencia</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-slate-900">
            Actividades Culturales y Sociales
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-medium">
            La convención no es solo trabajo de planificación; también es el espacio ideal para disfrutar del arte, la música en vivo, la hermandad y nuestras tradiciones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
          {displayActividades.map((act, index) => {
            const IconComponent = getIconComponent(act.iconName);
            return (
              <div 
                key={act.id || index}
                className="bg-gradient-to-br from-[#0c1a38] via-[#09152e] to-[#060e1d] text-white border border-yellow-500/30 hover:border-yellow-400 rounded-2xl sm:rounded-3xl p-6 sm:p-8 transition-all duration-300 flex flex-col justify-between group shadow-xl hover:shadow-2xl hover:shadow-yellow-500/15 hover:-translate-y-1.5"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 flex items-center justify-center group-hover:scale-110 group-hover:bg-yellow-400 group-hover:text-blue-955 transition-all duration-300 shadow-md">
                    <IconComponent size={26} />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-yellow-300 transition-colors">{act.title}</h3>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">{act.description}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-yellow-400 font-extrabold">
                  <span>Cronograma Oficial</span>
                  <span className="bg-yellow-500/20 border border-yellow-500/30 px-3 py-1 rounded-lg text-yellow-300">{act.time}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECCIÓN 6: Experiencias Únicas — CONTENEDORES FLOTANTES */}
      <section className="my-8 sm:my-16 max-w-[1440px] mx-auto px-2 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4 mb-8 sm:mb-12">
          <div className="inline-flex items-center space-x-2 bg-blue-900/10 border border-blue-900/20 text-blue-900 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
            <Compass size={14} className="text-amber-500" />
            <span>Mística Leonística</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Experiencias Únicas de la Convención
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-medium">
            Vive de cerca los pilares fundamentales que nos guían como Club de Leones a nivel mundial y nacional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
          {displayExperiencias.map((exp, index) => (
            <div 
              key={exp.id || index}
              className="bg-gradient-to-br from-[#0c1a38] via-[#09152e] to-[#060e1d] text-white border border-yellow-500/30 hover:border-yellow-400 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl hover:shadow-yellow-500/15 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1.5"
            >
              <div className="space-y-3 sm:space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-yellow-300 bg-yellow-500/20 border border-yellow-500/40 px-3 py-1 rounded-full inline-block">
                  {exp.badge}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight pt-1 group-hover:text-yellow-300 transition-colors">{exp.title}</h3>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">{exp.desc}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center text-yellow-300 font-extrabold text-xs group-hover:text-yellow-200 transition-colors">
                <span>Conocer más detalles</span>
                <ChevronRight size={14} className="ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECCIÓN 7: Formulario de Pre-registro Digital Guiado (4 Pasos) — GALA & CONVERSIÓN FLOTANTE */}
      <section id="pre-inscripcion" className="my-6 sm:my-20 max-w-[1440px] mx-auto px-2 sm:px-6 lg:px-8 scroll-mt-10">
        <div className="bg-gradient-to-br from-[#0c1a38] via-[#09152e] to-[#060e1d] text-white rounded-2xl sm:rounded-[2.5rem] p-3.5 sm:p-12 lg:p-14 border sm:border-2 border-yellow-500/40 shadow-[0_25px_60px_rgba(0,0,0,0.35)] relative">
          {/* Acentos de Luz de Fondo encapsulados para no recortar menús desplegables */}
          <div className="absolute inset-0 rounded-2xl sm:rounded-[2.5rem] overflow-hidden pointer-events-none z-0">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl -translate-y-1/2" />
            <div className="absolute bottom-0 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl translate-y-1/3" />
          </div>

          <div className="relative z-10">
            
            {fetching ? (
              <div className="text-center py-16 flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-yellow-500/10 border border-yellow-400/30 flex items-center justify-center shadow-lg">
                  <Clock className="w-8 h-8 text-yellow-400 animate-spin" />
                </div>
                <p className="text-slate-300 text-sm font-bold tracking-wide">Cargando formulario de inscripciones oficiales...</p>
              </div>
            ) : config.inscripcionesAbiertas ? (
              !isSubmitted ? (
                <div>
                  {/* Encabezado del Formulario Guiado */}
                  <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4 mb-10">
                    <div className="inline-flex items-center space-x-2 bg-yellow-500/15 border border-yellow-400/30 text-yellow-300 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm">
                      <ShieldCheck size={14} className="text-yellow-400" />
                      <span>Pre-inscripción Oficial • Quetzaltenango 2027</span>
                    </div>
                    
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight bg-gradient-to-r from-white via-amber-100 to-yellow-300 bg-clip-text text-transparent">
                      Asegura tu Lugar en 4 Simples Pasos
                    </h2>
                    
                    <p className="text-slate-300 text-xs sm:text-base max-w-xl mx-auto leading-relaxed font-medium">
                      Forma parte del rugido histórico en Xela. Completa tus datos para emitir tu credencial digital, elegir tus complementos y formalizar tu participación oficial.
                    </p>

                    {/* Badges de Garantía */}
                    <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-[11px] font-extrabold text-slate-300">
                      <span className="flex items-center space-x-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-emerald-300">
                        <Save size={12} className="text-emerald-400" />
                        <span>Auto-guardado activo</span>
                      </span>
                      <span className="flex items-center space-x-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                        <Lock size={12} className="text-emerald-400" />
                        <span>Conexión Encriptada SSL</span>
                      </span>
                      <span className="flex items-center space-x-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                        <CreditCard size={12} className="text-yellow-400" />
                        <span>Pasarela Segura Recurrente GT</span>
                      </span>
                      <span className="flex items-center space-x-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                        <Sparkles size={12} className="text-cyan-400" />
                        <span>Emisión Inmediata</span>
                      </span>
                    </div>

                    {/* Botón de Acceso Rápido para Consultar Entrada QR */}
                    <div className="pt-2 flex justify-center">
                      <button
                        type="button"
                        onClick={() => { setIsQrSearchModalOpen(true); setQrSearchError(''); }}
                        className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-500/20 via-amber-400/25 to-yellow-500/20 hover:from-yellow-400 hover:to-amber-300 hover:text-blue-955 text-yellow-300 border border-yellow-400/40 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-md cursor-pointer group"
                      >
                        <QrCode size={15} className="group-hover:scale-110 transition-transform text-yellow-400" />
                        <span>¿Ya te registraste? Encuentra tu Entrada QR Oficial aquí</span>
                      </button>
                    </div>
                  </div>

                  {/* Banner de Borrador Restaurado */}
                  {isDraftRestored && (
                    <div className="mb-6 max-w-3xl mx-auto p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-300 animate-in fade-in duration-300 shadow-md">
                      <div className="flex items-center space-x-2.5">
                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                        <div>
                          <span className="font-black text-white block sm:inline mr-1">Progreso recuperado:</span>
                          <span className="text-emerald-200">Restauramos los datos y el paso donde te quedaste para que continúes sin volver a empezar.</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetForm}
                        className="inline-flex items-center space-x-1.5 text-[11px] font-black text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 self-end sm:self-auto"
                      >
                        <RotateCcw size={13} />
                        <span>Empezar de cero</span>
                      </button>
                    </div>
                  )}

                  {/* Barra de Progreso por Pasos (Wizard Stepper Dinámico) */}
                  <div className="mb-8 sm:mb-12 max-w-3xl mx-auto w-full">
                    <div className="bg-white/[0.03] border border-white/10 rounded-2xl sm:rounded-3xl p-3 sm:p-6 backdrop-blur-md">
                      <div className="flex items-center justify-between relative px-1 sm:px-6">
                        {/* Línea Base Gris */}
                        <div className="absolute top-4.5 sm:top-5 left-6 sm:left-10 right-6 sm:right-10 h-1 bg-white/10 -translate-y-1/2 rounded-full z-0" />
                        
                        {/* Línea Activa Gradiente */}
                        <div 
                          className="absolute top-4.5 sm:top-5 left-6 sm:left-10 h-1 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300 -translate-y-1/2 rounded-full z-0 transition-all duration-500 shadow-[0_0_12px_rgba(234,179,8,0.5)]" 
                          style={{ width: `${((wizardStep - 1) / 3) * 82}%` }}
                        />

                        {/* Paso 1: Datos */}
                        <button
                          type="button"
                          onClick={() => setWizardStep(1)}
                          className={`relative z-10 flex flex-col items-center group cursor-pointer transition-all ${wizardStep >= 1 ? 'text-yellow-300' : 'text-slate-400'}`}
                        >
                          <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-xs sm:text-sm transition-all duration-300 shadow-lg ${
                            wizardStep === 1 ? 'bg-gradient-to-tr from-yellow-500 to-amber-400 text-blue-955 ring-2 sm:ring-4 ring-yellow-400/40 scale-105 sm:scale-110 shadow-yellow-500/40' :
                            wizardStep > 1 ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-[#09152e] border border-white/20 text-slate-300 group-hover:border-yellow-400/50'
                          }`}>
                            {wizardStep > 1 ? <Check size={16} className="sm:size-5 stroke-[3]" /> : '1'}
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-wider mt-2.5 hidden sm:inline">1. Datos</span>
                          <span className="text-[9px] font-bold text-slate-400 sm:hidden mt-1">Paso 1</span>
                        </button>

                        {/* Paso 2: Afiliación */}
                        <button
                          type="button"
                          onClick={() => wizardStep > 1 && setWizardStep(2)}
                          disabled={wizardStep < 1}
                          className={`relative z-10 flex flex-col items-center group cursor-pointer transition-all ${wizardStep >= 2 ? 'text-yellow-300' : 'text-slate-400'}`}
                        >
                          <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-xs sm:text-sm transition-all duration-300 shadow-lg ${
                            wizardStep === 2 ? 'bg-gradient-to-tr from-yellow-500 to-amber-400 text-blue-955 ring-2 sm:ring-4 ring-yellow-400/40 scale-105 sm:scale-110 shadow-yellow-500/40' :
                            wizardStep > 2 ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-[#09152e] border border-white/20 text-slate-300 group-hover:border-yellow-400/50'
                          }`}>
                            {wizardStep > 2 ? <Check size={16} className="sm:size-5 stroke-[3]" /> : '2'}
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-wider mt-2.5 hidden sm:inline">2. Afiliación</span>
                          <span className="text-[9px] font-bold text-slate-400 sm:hidden mt-1">Paso 2</span>
                        </button>

                        {/* Paso 3: Telegram */}
                        <button
                          type="button"
                          onClick={() => wizardStep > 2 && setWizardStep(3)}
                          disabled={wizardStep < 2}
                          className={`relative z-10 flex flex-col items-center group cursor-pointer transition-all ${wizardStep >= 3 ? 'text-yellow-300' : 'text-slate-400'}`}
                        >
                          <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-xs sm:text-sm transition-all duration-300 shadow-lg ${
                            wizardStep === 3 ? 'bg-gradient-to-tr from-yellow-500 to-amber-400 text-blue-955 ring-2 sm:ring-4 ring-yellow-400/40 scale-105 sm:scale-110 shadow-yellow-500/40' :
                            wizardStep > 3 ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-[#09152e] border border-white/20 text-slate-300 group-hover:border-yellow-400/50'
                          }`}>
                            {wizardStep > 3 ? <Check size={16} className="sm:size-5 stroke-[3]" /> : '3'}
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-wider mt-2.5 hidden sm:inline">3. Telegram</span>
                          <span className="text-[9px] font-bold text-slate-400 sm:hidden mt-1">Paso 3</span>
                        </button>

                        {/* Paso 4: Pago */}
                        <button
                          type="button"
                          onClick={() => wizardStep > 3 && setWizardStep(4)}
                          disabled={wizardStep < 3}
                          className={`relative z-10 flex flex-col items-center group cursor-pointer transition-all ${wizardStep >= 4 ? 'text-yellow-300' : 'text-slate-400'}`}
                        >
                          <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-xs sm:text-sm transition-all duration-300 shadow-lg ${
                            wizardStep === 4 ? 'bg-gradient-to-tr from-yellow-500 to-amber-400 text-blue-955 ring-2 sm:ring-4 ring-yellow-400/40 scale-105 sm:scale-110 shadow-yellow-500/40' : 'bg-[#09152e] border border-white/20 text-slate-300 group-hover:border-yellow-400/50'
                          }`}>
                            4
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-wider mt-2.5 hidden sm:inline">4. Pago & Cuotas</span>
                          <span className="text-[9px] font-bold text-slate-400 sm:hidden mt-1">Paso 4</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* CONTENIDO DEL PASO 1: DATOS PERSONALES */}
                  {wizardStep === 1 && (
                    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="bg-yellow-500/10 p-4.5 sm:p-5 rounded-2xl border border-yellow-400/30 flex items-center space-x-3.5 backdrop-blur-md">
                        <div className="w-10 h-10 rounded-xl bg-yellow-400/20 flex items-center justify-center text-yellow-300 shrink-0">
                          <Users size={22} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-white uppercase tracking-wider">Paso 1: Datos Personales de Identificación</h3>
                          <p className="text-xs text-slate-300 font-medium mt-0.5">Ingresa tus datos exactos para la emisión de tu credencial digital y carpeta oficial.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-left">
                        {/* Nombre Completo */}
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center space-x-1.5" htmlFor="nombre">
                            <span>Nombre Completo *</span>
                          </label>
                          <input 
                            type="text" 
                            id="nombre"
                            name="nombre"
                            value={form.nombre}
                            onChange={handleChange}
                            required
                            placeholder="Ej. Juan Pérez López"
                            className="w-full bg-[#0a162e]/90 border border-white/20 focus:border-yellow-400 rounded-2xl px-4 py-3.5 text-white text-base sm:text-sm focus:outline-none focus:ring-4 focus:ring-yellow-400/20 transition-all placeholder:text-slate-400 min-h-[48px] shadow-inner"
                          />
                        </div>

                        {/* DPI / Documento Identificación */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center space-x-1.5" htmlFor="dpi">
                              <span>{isInternacional ? 'Pasaporte / Doc. Identificación *' : 'DPI / Documento de Identificación *'}</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const nextDistrito = isInternacional ? 'Zona A-1' : 'Otro / Internacional';
                                setForm(prev => ({
                                  ...prev,
                                  distrito: nextDistrito,
                                  club: nextDistrito === 'Otro / Internacional' ? 'Otro Club' : (ZONAS_CLUBS[nextDistrito]?.[0] || '')
                                }));
                              }}
                              className="text-[10px] text-yellow-300 hover:text-yellow-200 underline font-extrabold cursor-pointer"
                            >
                              {isInternacional ? '🇬🇹 Soy de Guatemala (DPI)' : '🌎 ¿Vienes del extranjero?'}
                            </button>
                          </div>
                          <input 
                            type="text" 
                            id="dpi"
                            name="dpi"
                            value={dpiDigitos}
                            onChange={handleDpiChange}
                            required
                            maxLength={isInternacional ? 20 : 13}
                            placeholder={isInternacional ? "Ej. Pasaporte A1234567" : "Ej. 2500 12345 0901"}
                            className="w-full bg-[#0a162e]/90 border border-white/20 focus:border-yellow-400 rounded-2xl px-4 py-3.5 text-white text-base sm:text-sm focus:outline-none focus:ring-4 focus:ring-yellow-400/20 transition-all placeholder:text-slate-400 min-h-[48px] shadow-inner font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-left">
                        {/* Email */}
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center space-x-1.5" htmlFor="email">
                            <span>Correo Electrónico *</span>
                          </label>
                          <input 
                            type="email" 
                            id="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            placeholder="tu.correo@ejemplo.com"
                            className="w-full bg-[#0a162e]/90 border border-white/20 focus:border-yellow-400 rounded-2xl px-4 py-3.5 text-white text-base sm:text-sm focus:outline-none focus:ring-4 focus:ring-yellow-400/20 transition-all placeholder:text-slate-400 min-h-[48px] shadow-inner"
                          />
                        </div>

                        {/* Teléfono / WhatsApp */}
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center space-x-1.5" htmlFor="telefono">
                            <span>Teléfono / WhatsApp *</span>
                          </label>
                          <div className="flex items-center bg-[#0a162e]/90 border border-white/20 focus-within:border-yellow-400 rounded-2xl focus-within:ring-4 focus-within:ring-yellow-400/20 transition-all overflow-hidden min-h-[48px] shadow-inner">
                            <span className="bg-white/10 px-3.5 sm:px-4 py-3.5 text-yellow-300 text-sm font-black border-r border-white/15 select-none shrink-0">
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
                              className="w-full bg-transparent px-4 py-3.5 text-white text-base sm:text-sm focus:outline-none placeholder:text-slate-400 font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Cargo Leonístico Actual */}
                      <div className={`space-y-2 text-left relative ${openDropdown === 'cargo' ? 'z-50' : 'z-20'}`} ref={cargoRef}>
                        <label className="text-xs font-black uppercase tracking-wider text-slate-300">Cargo Leonístico Actual *</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenDropdown(openDropdown === 'cargo' ? null : 'cargo')}
                            className={`w-full flex items-center justify-between bg-[#0a162e]/90 border ${openDropdown === 'cargo' ? 'border-yellow-400 ring-4 ring-yellow-400/20' : 'border-white/20'} rounded-2xl px-4 py-3.5 text-white text-base sm:text-sm transition-all text-left min-h-[48px] shadow-inner cursor-pointer`}
                          >
                            <span className="flex items-center space-x-2 truncate">
                              <span>{CARGO_OPTIONS.find(c => c.value === form.cargo)?.icon}</span>
                              <span className="truncate font-semibold">{CARGO_OPTIONS.find(c => c.value === form.cargo)?.label || form.cargo}</span>
                            </span>
                            <ChevronDown size={18} className={`text-yellow-400 transition-transform duration-200 shrink-0 ml-2 ${openDropdown === 'cargo' ? 'rotate-180' : ''}`} />
                          </button>
                          {openDropdown === 'cargo' && (
                            <div className="absolute z-[150] mt-2 w-full rounded-2xl border-2 border-yellow-500/60 bg-[#06152d] shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-60 sm:max-h-72 overflow-y-auto no-scrollbar">
                              {CARGO_OPTIONS.map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => handleCargoSelect(opt.value)}
                                  className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors text-left cursor-pointer ${form.cargo === opt.value ? 'bg-yellow-500/25 text-yellow-300 font-bold border-l-4 border-yellow-400' : 'text-white font-medium hover:bg-[#102a52]'}`}
                                >
                                  <span className="flex items-center space-x-3">
                                    <span className="text-base">{opt.icon}</span>
                                    <span>{opt.label}</span>
                                  </span>
                                  {form.cargo === opt.value && <Check size={16} className="text-yellow-400 shrink-0 stroke-[3]" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Botón Paso 1 */}
                      <div className="pt-6 flex justify-end relative z-10">
                        <button
                          type="button"
                          onClick={() => handleNextStep(2)}
                          className="w-full sm:w-auto flex items-center justify-center space-x-3 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-400 hover:from-yellow-400 hover:to-amber-300 text-blue-955 font-black px-8 py-4 rounded-2xl text-base transition-all duration-300 shadow-[0_10px_30px_rgba(245,158,11,0.35)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.5)] active:scale-95 cursor-pointer transform hover:-translate-y-0.5"
                        >
                          <span>Continuar: Afiliación (Paso 2)</span>
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CONTENIDO DEL PASO 2: AFILIACIÓN LEONÍSTICA */}
                  {wizardStep === 2 && (
                    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="bg-yellow-500/10 p-4.5 sm:p-5 rounded-2xl border border-yellow-400/30 flex items-center space-x-3.5 backdrop-blur-md">
                        <div className="w-10 h-10 rounded-xl bg-yellow-400/20 flex items-center justify-center text-yellow-300 shrink-0">
                          <Building2 size={22} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-white uppercase tracking-wider">Paso 2: Afiliación Leonística</h3>
                          <p className="text-xs text-slate-300 font-medium mt-0.5">Selecciona la Zona/Distrito y el Club de Leones al que perteneces.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-left">
                        {/* Zona / Distrito */}
                        <div className={`space-y-2 relative ${openDropdown === 'zona' ? 'z-50' : 'z-20'}`} ref={zonaRef}>
                          <label className="text-xs font-black uppercase tracking-wider text-slate-300">Zona o Distrito a la que pertenece *</label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenDropdown(openDropdown === 'zona' ? null : 'zona')}
                              className={`w-full flex items-center justify-between bg-[#0a162e]/90 border ${openDropdown === 'zona' ? 'border-yellow-400 ring-4 ring-yellow-400/20' : 'border-white/20'} rounded-2xl px-4 py-3.5 text-white text-base sm:text-sm transition-all text-left min-h-[48px] shadow-inner cursor-pointer`}
                            >
                              <span className="truncate font-semibold">{form.distrito}</span>
                              <ChevronDown size={18} className={`text-yellow-400 transition-transform duration-200 shrink-0 ml-2 ${openDropdown === 'zona' ? 'rotate-180' : ''}`} />
                            </button>
                            {openDropdown === 'zona' && (
                              <div className="absolute z-[100] mt-2 w-full rounded-2xl border-2 border-yellow-500/60 bg-[#06152d] shadow-[0_20px_50px_rgba(0,0,0,0.95)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-72 overflow-y-auto no-scrollbar">
                                {REGION_ZONES.map((rg) => (
                                  <div key={rg.region}>
                                    <div className={`px-4 py-2 bg-gradient-to-r ${rg.color} text-white text-[10px] font-black uppercase tracking-widest sticky top-0 z-10`}>
                                      🏛️ {rg.region}
                                    </div>
                                    {rg.zonas.map((z) => (
                                      <button
                                        key={z}
                                        type="button"
                                        onClick={() => handleZoneSelect(z)}
                                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-left cursor-pointer ${form.distrito === z ? 'bg-yellow-500/25 text-yellow-300 font-bold border-l-4 border-yellow-400' : 'text-white font-medium hover:bg-[#102a52]'}`}
                                      >
                                        <span>{z}</span>
                                        {form.distrito === z && <Check size={14} className="text-yellow-400 shrink-0 stroke-[3]" />}
                                      </button>
                                    ))}
                                  </div>
                                ))}
                                {/* Otro / Internacional */}
                                <div className="border-t border-white/10">
                                  <button
                                    type="button"
                                    onClick={() => handleZoneSelect('Otro / Internacional')}
                                    className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors text-left cursor-pointer ${form.distrito === 'Otro / Internacional' ? 'bg-yellow-500/25 text-yellow-300 font-bold border-l-4 border-yellow-400' : 'text-white font-medium hover:bg-[#102a52]'}`}
                                  >
                                    <span>🌎 Otro / Internacional</span>
                                    {form.distrito === 'Otro / Internacional' && <Check size={14} className="text-yellow-400 shrink-0 stroke-[3]" />}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Club de Leones de Pertenencia */}
                        <div className={`space-y-2 relative ${openDropdown === 'club' ? 'z-50' : 'z-10'}`} ref={clubRef}>
                          <label className="text-xs font-black uppercase tracking-wider text-slate-300">Club de Leones de Pertenencia *</label>
                          {form.distrito === 'Otro / Internacional' ? (
                            <input 
                              type="text" 
                              id="club"
                              name="club"
                              value={customClub}
                              onChange={(e) => setCustomClub(e.target.value)}
                              required
                              placeholder="Ej. Club de Leones Internacional"
                              className="w-full bg-[#0a162e]/90 border border-white/20 focus:border-yellow-400 rounded-2xl px-4 py-3.5 text-white text-base sm:text-sm focus:outline-none focus:ring-4 focus:ring-yellow-400/20 transition-all placeholder:text-slate-400 min-h-[48px] shadow-inner"
                            />
                          ) : (
                            <>
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setOpenDropdown(openDropdown === 'club' ? null : 'club')}
                                  className={`w-full flex items-center justify-between bg-[#0a162e]/90 border ${openDropdown === 'club' ? 'border-yellow-400 ring-4 ring-yellow-400/20' : 'border-white/20'} rounded-2xl px-4 py-3.5 text-white text-base sm:text-sm transition-all text-left min-h-[48px] shadow-inner cursor-pointer`}
                                >
                                  <span className="truncate font-semibold">{form.club}</span>
                                  <ChevronDown size={18} className={`text-yellow-400 transition-transform duration-200 shrink-0 ml-2 ${openDropdown === 'club' ? 'rotate-180' : ''}`} />
                                </button>
                                {openDropdown === 'club' && (
                                  <div className="absolute z-[100] mt-2 w-full rounded-2xl border-2 border-yellow-500/60 bg-[#06152d] shadow-[0_20px_50px_rgba(0,0,0,0.95)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-64 overflow-y-auto no-scrollbar">
                                    <div className="p-2 border-b border-white/10 sticky top-0 bg-[#06152d] z-10">
                                      <input
                                        type="text"
                                        value={clubSearchTerm}
                                        onChange={(e) => setClubSearchTerm(e.target.value)}
                                        placeholder="Filtrar club..."
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full bg-[#0a1b38] border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-yellow-400"
                                      />
                                    </div>
                                    {(ZONAS_CLUBS[form.distrito] || [])
                                      .filter(c => !clubSearchTerm || c.toLowerCase().includes(clubSearchTerm.toLowerCase()))
                                      .map((c) => (
                                      <button
                                        key={c}
                                        type="button"
                                        onClick={() => {
                                          handleClubSelect(c);
                                          setClubSearchTerm('');
                                        }}
                                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-left cursor-pointer ${form.club === c ? 'bg-yellow-500/25 text-yellow-300 font-bold border-l-4 border-yellow-400' : 'text-white font-medium hover:bg-[#102a52]'} ${c === 'Otro Club' ? 'border-t border-white/10 italic text-slate-300' : ''}`}
                                      >
                                        <span>{c === 'Otro Club' ? '✏️ Otro Club...' : c}</span>
                                        {form.club === c && <Check size={14} className="text-yellow-400 shrink-0 stroke-[3]" />}
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
                                  placeholder="Escribe el nombre exacto de tu Club"
                                  className="w-full bg-[#0a162e]/90 border border-white/20 focus:border-yellow-400 rounded-2xl px-4 py-3.5 text-white text-base sm:text-sm focus:outline-none focus:ring-4 focus:ring-yellow-400/20 transition-all placeholder:text-slate-400 mt-2 min-h-[48px] shadow-inner"
                                />
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Resumen de Afiliación Estilo Credencial */}
                      <div className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 sm:p-6 rounded-2xl border border-white/15 text-left space-y-3 shadow-lg">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="text-[11px] font-black text-yellow-400 uppercase tracking-widest flex items-center space-x-1.5">
                            <Sparkles size={13} />
                            <span>Resumen de Ficha Leonística:</span>
                          </span>
                          <span className="text-[10px] font-extrabold uppercase text-slate-400 bg-white/5 px-2.5 py-0.5 rounded-full">
                            Verificado
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-200">
                          <div><span className="text-slate-400">Socio:</span> <strong className="text-white">{form.nombre || 'Por ingresar'}</strong></div>
                          <div><span className="text-slate-400">Cargo:</span> <strong className="text-yellow-300">{form.cargo}</strong></div>
                          <div><span className="text-slate-400">Zona / Región:</span> <strong className="text-white">{form.distrito}</strong></div>
                          <div><span className="text-slate-400">Club:</span> <strong className="text-white">{form.club === 'Otro Club' ? (customClub || 'Otro Club') : form.club}</strong></div>
                        </div>
                      </div>

                      {/* Botones Paso 2 */}
                      <div className="pt-6 flex flex-col sm:flex-row justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setWizardStep(1)}
                          className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/15 text-white font-extrabold px-6 py-4 rounded-2xl text-sm transition-all border border-white/15 cursor-pointer"
                        >
                          <ArrowLeft size={18} />
                          <span>Anterior (Paso 1)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNextStep(3)}
                          className="w-full sm:w-auto flex items-center justify-center space-x-3 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-400 hover:from-yellow-400 hover:to-amber-300 text-blue-955 font-black px-8 py-4 rounded-2xl text-base transition-all duration-300 shadow-[0_10px_30px_rgba(245,158,11,0.35)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.5)] active:scale-95 cursor-pointer transform hover:-translate-y-0.5"
                        >
                          <span>Continuar: Telegram (Paso 3)</span>
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CONTENIDO DEL PASO 3: TELEGRAM & PREFERENCIA DE NOTIFICACIONES */}
                  {wizardStep === 3 && (
                    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
                      {/* Banner Informativo */}
                      <div className="bg-yellow-500/10 p-4.5 sm:p-5 rounded-2xl border border-yellow-400/30 flex items-center space-x-3.5 backdrop-blur-md">
                        <div className="w-10 h-10 rounded-xl bg-yellow-400/20 flex items-center justify-center text-yellow-300 shrink-0">
                          <MessageSquare size={22} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-white uppercase tracking-wider">Paso 3: Preferencia de Notificaciones & Telegram (Opcional)</h3>
                          <p className="text-xs text-slate-300 font-medium mt-0.5">Elige cómo prefieres recibir tus credenciales oficiales, itinerario en vivo y novedades del evento.</p>
                        </div>
                      </div>

                      {/* Selector Principal de Preferencias */}
                      <div className="bg-gradient-to-br from-[#0c1a38] via-[#09152e] to-[#071126] p-6 sm:p-8 rounded-3xl border border-cyan-400/30 space-y-6 text-left shadow-2xl relative overflow-hidden">
                        <div className="border-b border-white/10 pb-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 block">Canal de Comunicación</span>
                          <h4 className="text-lg sm:text-xl font-black text-white">
                            ¿Cómo deseas recibir tus avisos y credencial de la Convención?
                          </h4>
                          <p className="text-xs text-slate-300 mt-1 font-medium">
                            Selecciona la opción que más te convenga para asegurar tu comunicación:
                          </p>
                        </div>

                        {/* Opciones Interactivas con Checkboxes / Radio Cards */}
                        <div className="space-y-3.5">
                          {/* Opción 1: Tengo instalado Telegram */}
                          <div 
                            onClick={() => setTelegramOption('telegram')}
                            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer select-none ${
                              telegramOption === 'telegram'
                                ? 'bg-cyan-500/15 border-cyan-400 ring-2 ring-cyan-400/30 shadow-lg'
                                : 'bg-white/[0.03] border-white/10 hover:border-white/25 hover:bg-white/[0.05]'
                            }`}
                          >
                            <label className="flex items-start space-x-3.5 cursor-pointer">
                              <input 
                                type="radio" 
                                name="preferencia_telegram"
                                checked={telegramOption === 'telegram'}
                                onChange={() => setTelegramOption('telegram')}
                                className="mt-1 w-5 h-5 text-cyan-400 bg-slate-900 border-white/30 focus:ring-cyan-400 cursor-pointer shrink-0"
                              />
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-black text-white text-sm sm:text-base">
                                    Sí, tengo instalado Telegram
                                  </span>
                                  <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                                    Recomendado
                                  </span>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                  Deseo unirme al Bot Oficial para recibir mapas GPS, itinerario en vivo, cambios de agenda y mi credencial digital con alertas al instante.
                                </p>
                              </div>
                            </label>

                            {/* Desplegable de Configuración y Verificación si tiene Telegram marcado */}
                            {telegramOption === 'telegram' && (
                              <div className="mt-4 pt-4 border-t border-cyan-400/25 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-white/10 space-y-3.5">
                                  {/* Paso A: Abrir chat con el bot */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="text-xs text-slate-300">
                                      <span className="font-extrabold text-cyan-300 block mb-0.5 text-xs sm:text-sm">
                                        Paso 1: Abre el Bot Oficial en Telegram
                                      </span>
                                      <span>Toca el botón azul para abrir el chat con el bot y presiona <strong className="text-white font-bold">“Iniciar / Start”</strong>:</span>
                                    </div>
                                    <a 
                                      href={`https://t.me/ConvencionLeonesbot?start=${encodeURIComponent(form.telefono ? 'socio_' + form.telefono : 'inscripcion')}`}
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center space-x-2 text-xs font-black bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 hover:from-blue-400 hover:to-cyan-400 text-white px-4 py-2.5 rounded-xl transition-all shadow-md border border-cyan-300/40 active:scale-95 cursor-pointer shrink-0"
                                    >
                                      <Send size={15} />
                                      <span>Abrir @ConvencionLeonesbot</span>
                                      <ExternalLink size={13} className="opacity-70" />
                                    </a>
                                  </div>

                                  {/* Paso B: Casilla interactiva para confirmar que ya verificó su número */}
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTelegramVerified(!telegramVerified);
                                    }}
                                    className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-start sm:items-center space-x-3 ${
                                      telegramVerified 
                                        ? 'bg-emerald-500/20 border-emerald-400/80 ring-2 ring-emerald-400/40 shadow-md' 
                                        : 'bg-white/[0.04] border-white/15 hover:border-cyan-400/40 hover:bg-white/[0.07]'
                                    }`}
                                  >
                                    <input 
                                      type="checkbox"
                                      id="checkTelegramVerified"
                                      checked={telegramVerified}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        setTelegramVerified(e.target.checked);
                                      }}
                                      className="mt-0.5 sm:mt-0 w-5 h-5 rounded text-emerald-400 bg-slate-900 border-white/30 focus:ring-emerald-400 cursor-pointer shrink-0"
                                    />
                                    <div className="flex-1 text-left">
                                      <div className="flex items-center space-x-2 flex-wrap">
                                        <span className="font-black text-white text-xs sm:text-sm">
                                          Paso 2: Ya inicié el bot y verifiqué mi número de teléfono
                                        </span>
                                        {telegramVerified && (
                                          <span className="bg-emerald-500/30 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-emerald-400/30">
                                            Confirmado
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[11px] text-slate-300 block mt-0.5 font-medium">
                                        {form.telefono 
                                          ? `Confirmas que tu número (${form.telefono}) fue verificado en el bot para recibir avisos y credenciales.` 
                                          : 'Marca esta casilla para confirmar que ya interactuaste con el bot en Telegram.'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* BOTÓN DE TELEGRAM EN EL FORMULARIO INDICANDO SI ESTÁ CONECTADO AL BOT */}
                                <div className="pt-1">
                                  {telegramVerified ? (
                                    <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                                      <div className="flex items-center justify-between px-1">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                                          <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                          </span>
                                          <span>Estado de Conexión al Bot: Activo</span>
                                        </span>
                                        <span className="text-[10px] text-emerald-300 font-bold">
                                          {form.telefono || 'Número móvil'} sincronizado
                                        </span>
                                      </div>

                                      <a 
                                        href={`https://t.me/ConvencionLeonesbot?start=${encodeURIComponent(form.telefono ? 'socio_' + form.telefono : 'inscripcion')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-sm shadow-[0_10px_30px_rgba(16,185,129,0.35)] border-2 border-emerald-300/50 transition-all transform hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer group"
                                      >
                                        <div className="flex items-center space-x-3.5 text-left">
                                          <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-inner">
                                            <Send size={22} className="stroke-[2.5]" />
                                          </div>
                                          <div>
                                            <div className="flex items-center space-x-2">
                                              <span className="text-white font-black text-sm sm:text-base tracking-tight flex items-center space-x-1.5">
                                                <span>🟢 Conectado al Bot de Telegram</span>
                                              </span>
                                              <span className="bg-white/25 text-white border border-white/40 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                                Verificado
                                              </span>
                                            </div>
                                            <p className="text-[11px] text-emerald-100 font-medium mt-0.5">
                                              @ConvencionLeonesbot • Recibirás credenciales digitales, mapas y alertas en vivo aquí
                                            </p>
                                          </div>
                                        </div>
                                        
                                        <div className="hidden sm:flex items-center space-x-1.5 text-xs text-white bg-white/15 group-hover:bg-white/25 px-3.5 py-2 rounded-xl border border-white/20 transition-colors shrink-0">
                                          <CheckCircle2 size={15} className="text-emerald-300" />
                                          <span>Conectado</span>
                                          <ExternalLink size={13} className="opacity-80" />
                                        </div>
                                      </a>
                                    </div>
                                  ) : (
                                    <div className="space-y-1.5">
                                      <div className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] text-slate-400 text-xs sm:text-sm border border-dashed border-white/20">
                                        <div className="flex items-center space-x-3 text-left">
                                          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 shrink-0">
                                            <Send size={18} />
                                          </div>
                                          <div>
                                            <span className="text-slate-300 font-bold block text-xs sm:text-sm">
                                              Bot de Telegram: Pendiente de Verificación de Número
                                            </span>
                                            <span className="text-[11px] text-slate-400 block font-normal">
                                              Inicia el bot y marca la casilla del Paso 2 para habilitar tu botón de conexión.
                                            </span>
                                          </div>
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 shrink-0">
                                          En Espera
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Opción 2: No tengo Telegram, enviadme al correo */}
                          <div 
                            onClick={() => setTelegramOption('email')}
                            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer select-none ${
                              telegramOption === 'email'
                                ? 'bg-emerald-500/15 border-emerald-400 ring-2 ring-emerald-400/30 shadow-lg'
                                : 'bg-white/[0.03] border-white/10 hover:border-white/25 hover:bg-white/[0.05]'
                            }`}
                          >
                            <label className="flex items-start space-x-3.5 cursor-pointer">
                              <input 
                                type="radio" 
                                name="preferencia_telegram"
                                checked={telegramOption === 'email'}
                                onChange={() => setTelegramOption('email')}
                                className="mt-1 w-5 h-5 text-emerald-400 bg-slate-900 border-white/30 focus:ring-emerald-400 cursor-pointer shrink-0"
                              />
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-black text-white text-sm sm:text-base">
                                    No tengo instalado Telegram, enviadme al correo
                                  </span>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                  Prefiero recibir mis confirmaciones de pago, credencial digital y actualizaciones directamente en mi correo electrónico sin instalar aplicaciones adicionales.
                                </p>
                              </div>
                            </label>

                            {/* Mensaje de Confirmación de Correo si está marcado */}
                            {telegramOption === 'email' && (
                              <div className="mt-4 pt-4 border-t border-emerald-400/25 flex items-center space-x-2.5 text-xs text-emerald-300 font-medium animate-in fade-in slide-in-from-top-2 duration-200">
                                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                                <span>
                                  ¡Entendido! Te enviaremos toda la información y tu entrada oficial a: <strong className="text-white font-bold">{form.email || 'tu correo registrado'}</strong>.
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* SECCIÓN INFORMATIVA DE VENTAJAS Y DESCARGA (Siempre visible abajo) */}
                        <div className="pt-6 border-t border-white/10 space-y-5">
                          <div>
                            <span className="text-xs font-black uppercase tracking-wider text-yellow-400 block">
                              Ventajas de seguir la Convención en Telegram (Opcional):
                            </span>
                            <p className="text-xs text-slate-400 mt-0.5 font-medium">
                              Si en cualquier momento deseas instalar la aplicación, contarás con estos beneficios adicionales:
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                            <div className="bg-white/[0.04] p-4 rounded-2xl border border-white/10 space-y-1.5 hover:border-cyan-400/40 transition-colors">
                              <span className="text-2xl">⚡</span>
                              <h5 className="font-extrabold text-white text-xs">Avisos en Tiempo Real</h5>
                              <p className="text-slate-300 text-[11px] font-medium leading-relaxed">Alertas instantáneas sobre cambios de agenda, salas de plenarias y actividades solemnes.</p>
                            </div>
                            <div className="bg-white/[0.04] p-4 rounded-2xl border border-white/10 space-y-1.5 hover:border-cyan-400/40 transition-colors">
                              <span className="text-2xl">📍</span>
                              <h5 className="font-extrabold text-white text-xs">Ubicaciones y Mapas GPS</h5>
                              <p className="text-slate-300 text-[11px] font-medium leading-relaxed">Rutas guiadas a Colina Country Club, Hotel Sede y puntos turísticos de Quetzaltenango.</p>
                            </div>
                            <div className="bg-white/[0.04] p-4 rounded-2xl border border-white/10 space-y-1.5 hover:border-cyan-400/40 transition-colors">
                              <span className="text-2xl">📜</span>
                              <h5 className="font-extrabold text-white text-xs">Credencial & Programa</h5>
                              <p className="text-slate-300 text-[11px] font-medium leading-relaxed">Descarga directa de tu credencial digital y folleto oficial de la convención en tu celular.</p>
                            </div>
                          </div>

                          {/* Enlaces de Tiendas para Descargar */}
                          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/10 space-y-2.5">
                            <span className="text-xs font-black text-slate-300 uppercase tracking-wider block">
                              ¿Deseas descargar Telegram en tu teléfono?
                            </span>
                            <div className="flex flex-col sm:flex-row gap-2.5">
                              <a 
                                href="https://play.google.com/store/apps/details?id=org.telegram.messenger" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex-1 inline-flex items-center justify-center space-x-2 text-xs font-extrabold bg-white/10 hover:bg-yellow-400 hover:text-blue-955 text-white px-4 py-2.5 rounded-xl transition-all border border-white/15"
                              >
                                <span>🤖 Descargar para Android (Google Play)</span>
                              </a>
                              <a 
                                href="https://apps.apple.com/app/telegram-messenger/id686449807" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex-1 inline-flex items-center justify-center space-x-2 text-xs font-extrabold bg-white/10 hover:bg-yellow-400 hover:text-blue-955 text-white px-4 py-2.5 rounded-xl transition-all border border-white/15"
                              >
                                <span>🍎 Descargar para iPhone (App Store)</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Botones Paso 3 */}
                      <div className="pt-6 flex flex-col sm:flex-row justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setWizardStep(2)}
                          className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/15 text-white font-extrabold px-6 py-4 rounded-2xl text-sm transition-all border border-white/15 cursor-pointer"
                        >
                          <ArrowLeft size={18} />
                          <span>Anterior (Paso 2)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNextStep(4)}
                          className="w-full sm:w-auto flex items-center justify-center space-x-3 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-400 hover:from-yellow-400 hover:to-amber-300 text-blue-955 font-black px-8 py-4 rounded-2xl text-base transition-all duration-300 shadow-[0_10px_30px_rgba(245,158,11,0.35)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.5)] active:scale-95 cursor-pointer transform hover:-translate-y-0.5"
                        >
                          <span>Continuar: Paquetes y Pago (Paso 4)</span>
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CONTENIDO DEL PASO 4: PASARELA DE PAGO & CONFIRMACIÓN */}
                  {wizardStep === 4 && (
                    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="bg-yellow-500/10 p-4.5 sm:p-5 rounded-2xl border border-yellow-400/30 flex items-center space-x-3.5 backdrop-blur-md">
                        <div className="w-10 h-10 rounded-xl bg-yellow-400/20 flex items-center justify-center text-yellow-300 shrink-0">
                          <CreditCard size={22} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-white uppercase tracking-wider">Paso 4: Paquetes de Inscripción, Cuotas y Pasarela de Pago</h3>
                          <p className="text-xs text-slate-300 font-medium mt-0.5">Elige complementos opcionales, revisa el cálculo y selecciona tu forma de pago segura.</p>
                        </div>
                      </div>

                      {/* Selección de Paquete de Convención y Complementos */}
                      <div className="space-y-4 text-left">
                        {/* 1. Tarifa Base Obligatoria */}
                        <div className="bg-gradient-to-r from-yellow-500/20 via-amber-500/15 to-yellow-500/20 border-2 border-yellow-400 rounded-3xl p-5 sm:p-6 shadow-[0_15px_35px_rgba(234,179,8,0.2)] space-y-4 relative overflow-hidden">
                          <span className="absolute -right-11 top-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-blue-955 text-[9px] font-black uppercase tracking-widest px-10 py-1 rotate-45 shadow-md">
                            Obligatorio
                          </span>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center space-x-3.5">
                              <div className="w-10 h-10 rounded-2xl bg-yellow-400 text-blue-955 flex items-center justify-center font-black shadow-md shrink-0">
                                <Check size={20} className="stroke-[3]" />
                              </div>
                              <div>
                                <h4 className="text-lg font-black text-white tracking-tight">Inscripción Base a la Convención Nacional</h4>
                                <span className="text-xs text-yellow-300 font-extrabold block">Tarifa Oficial de Convencionista Quetzaltenango 2027</span>
                              </div>
                            </div>
                            <div className="text-left sm:text-right pl-13 sm:pl-0">
                              <span className="text-3xl font-black text-yellow-300 tracking-tight drop-shadow">Q. {baseCost.toLocaleString()}.00</span>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-white/10">
                            <ul className="text-xs text-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-medium">
                              <li className="flex items-center space-x-2">
                                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                                <span>Asamblea y Plenarias Oficiales</span>
                              </li>
                              <li className="flex items-center space-x-2">
                                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                                <span>Credencial Digital Oficial</span>
                              </li>
                              <li className="flex items-center space-x-2">
                                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                                <span>Carpeta & Cenas de Gala</span>
                              </li>
                            </ul>
                          </div>
                        </div>

                        {/* 2. Anuncio de Paquetes Opcionales Posteriores */}
                        <div className="bg-gradient-to-r from-blue-900/40 via-indigo-950/40 to-blue-900/30 p-5 sm:p-6 rounded-3xl border border-yellow-400/30 text-left space-y-3 shadow-xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full blur-2xl pointer-events-none" />
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-2xl bg-yellow-500/20 border border-yellow-400/40 flex items-center justify-center text-yellow-300 shrink-0 shadow-inner">
                              <Sparkles size={20} />
                            </div>
                            <div>
                              <h4 className="text-sm sm:text-base font-black text-white tracking-tight">
                                Paquetes & Experiencias Opcionales
                              </h4>
                              <p className="text-[11px] text-cyan-200 font-semibold">
                                Hospedaje en Hotel Sede, Tours Inmersivos y Actividades Familiares
                              </p>
                            </div>
                          </div>

                          <div className="bg-[#081530]/80 p-4 rounded-2xl border border-white/10 text-xs sm:text-sm text-slate-200 flex items-start space-x-3">
                            <Info size={19} className="text-yellow-400 shrink-0 mt-0.5" />
                            <p className="leading-relaxed font-semibold text-slate-100">
                              Recibirás paquetes opcionales para mejorar la experiencia en la convención una vez estés inscrito.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Sección Atractiva Vendedora de Cuotas */}
                      <div className="bg-gradient-to-r from-[#0c1a38] via-[#0e2147] to-[#0c1a38] p-6 rounded-3xl border border-yellow-400/40 text-left space-y-4 shadow-xl">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center space-x-2.5 text-yellow-300">
                            <CreditCard size={24} className="text-yellow-400 shrink-0" />
                            <h4 className="text-base sm:text-lg font-black tracking-tight text-white">
                              ¡Disfruta de la Convención Pagando en Cuotas con tu Tarjeta!
                            </h4>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="bg-white/10 px-2.5 py-1 rounded-lg text-xs font-black text-white">VISA</span>
                            <span className="bg-white/10 px-2.5 py-1 rounded-lg text-xs font-black text-white">Mastercard</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-200 leading-relaxed font-medium">
                          Aprovecha las opciones de financiamiento con tu tarjeta de crédito para asegurar tu paquete completo sin desbalancear tu presupuesto. ¡Vive la experiencia de la convención al máximo!
                        </p>

                        {/* Aclaración importante sobre las 12 cuotas */}
                        <div className="bg-white/[0.04] p-3.5 rounded-2xl border border-white/10 text-xs text-slate-300 flex items-start space-x-3">
                          <Info size={18} className="text-yellow-400 shrink-0 mt-0.5" />
                          <p className="leading-relaxed text-[11px]">
                            <strong className="text-yellow-300">Aviso de Financiamiento:</strong> A partir de 12 cuotas aplica un recargo mínimo por financiamiento del procesador de pagos según el banco emisor de tu tarjeta, detallado claramente en la pantalla de la pasarela según el banco y tarjeta seleccionados.
                          </p>
                        </div>
                      </div>

                      {/* Resumen Final de Pago Desglosado */}
                      <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 rounded-3xl border border-white/15 text-left space-y-3 shadow-2xl">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-bold text-slate-300 border-b border-white/10 pb-3">
                          <div>Socio: <strong className="text-white">{form.nombre}</strong></div>
                          <div>Club: <strong className="text-white">{form.club === 'Otro Club' ? customClub : form.club}</strong></div>
                        </div>

                        {/* Canal de Avisos & Estado Telegram */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1.5 border-b border-white/10 text-xs">
                          <span className="text-slate-300 font-medium">Canal de Notificaciones:</span>
                          {telegramOption === 'telegram' ? (
                            telegramVerified ? (
                              <a 
                                href={`https://t.me/ConvencionLeonesbot?start=${encodeURIComponent(form.telefono ? 'socio_' + form.telefono : 'inscripcion')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-3 py-1 rounded-full text-[11px] font-extrabold hover:bg-emerald-500/30 transition-colors cursor-pointer"
                              >
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                <Send size={12} />
                                <span>🟢 Conectado al Bot (@ConvencionLeonesbot)</span>
                              </a>
                            ) : (
                              <span className="inline-flex items-center space-x-1.5 bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 px-3 py-1 rounded-full text-[11px] font-bold">
                                <Send size={12} />
                                <span>Telegram (Pendiente de verificar número)</span>
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center space-x-1.5 bg-slate-800 text-slate-300 border border-white/15 px-3 py-1 rounded-full text-[11px] font-bold">
                              <Mail size={12} className="text-emerald-400" />
                              <span>Correo Electrónico ({form.email})</span>
                            </span>
                          )}
                        </div>

                        {/* Desglose de Ítems */}
                        <div className="space-y-2 text-xs text-slate-300 py-1">
                          <div className="flex justify-between items-center font-medium">
                            <span>• Inscripción Oficial Base de Convencionista:</span>
                            <span className="font-bold text-white">Q. {baseCost.toLocaleString()}.00</span>
                          </div>
                          {includeHotel && (
                            <div className="flex justify-between items-center font-medium">
                              <span>• Hospedaje Hotel Sede & Tour:</span>
                              <span className="font-bold text-white">Q. {(config.tarifaHotel || 400).toLocaleString()}.00</span>
                            </div>
                          )}
                          {includeCultural && (
                            <div className="flex justify-between items-center font-medium">
                              <span>• Paquete Inmersivo Cultural:</span>
                              <span className="font-bold text-white">Q. {(config.tarifaCultural || 150).toLocaleString()}.00</span>
                            </div>
                          )}
                          {includeFamiliar && (
                            <div className="flex justify-between items-center font-medium">
                              <span>• Paquete Familiar Inmersivo:</span>
                              <span className="font-bold text-white">Q. {(config.tarifaFamiliar || 450).toLocaleString()}.00</span>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-white/15 text-sm sm:text-base font-black">
                          <span className="text-white tracking-wide">MONTO TOTAL A CANCELAR:</span>
                          <span className="text-3xl font-black text-yellow-300 tracking-tight drop-shadow">
                            Q. {montoTotal.toLocaleString()}.00
                          </span>
                        </div>
                      </div>

                      {/* Acciones de Pago con Máxima Llamada a la Acción */}
                      <div className="space-y-3.5 pt-2">
                        <button
                          type="button"
                          onClick={() => handleFinalSubmit('recurrente')}
                          disabled={loading || isRedirectingPayment}
                          className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-400 text-white font-black px-6 py-4.5 rounded-2xl text-base sm:text-lg transition-all duration-300 shadow-[0_10px_35px_rgba(16,185,129,0.4)] hover:shadow-[0_15px_45px_rgba(16,185,129,0.6)] active:scale-95 disabled:opacity-50 cursor-pointer transform hover:-translate-y-0.5 min-h-[56px]"
                        >
                          {loading || isRedirectingPayment ? (
                            <div className="flex items-center space-x-3">
                              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Conectando con Pasarela Segura Recurrente GT...</span>
                            </div>
                          ) : (
                            <>
                              <CreditCard size={22} />
                              <span>Pagar con Tarjeta en Línea (Q. {montoTotal.toLocaleString()}.00)</span>
                              <ArrowRight size={20} />
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleFinalSubmit('transferencia')}
                          disabled={loading || isRedirectingPayment}
                          className="w-full flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/15 text-white font-bold px-6 py-3.5 rounded-2xl text-xs sm:text-sm transition-all border border-white/20 hover:border-yellow-400/40 cursor-pointer min-h-[46px]"
                        >
                          <Send size={15} />
                          <span>Pre-registrarme con Opción de Depósito / Transferencia Bancaria (Banrural)</span>
                        </button>
                      </div>

                      {/* Botón Regresar */}
                      <div className="pt-2 flex justify-start">
                        <button
                          type="button"
                          onClick={() => setWizardStep(3)}
                          className="flex items-center space-x-2 bg-white/10 hover:bg-white/15 text-white font-black px-5 py-3 rounded-2xl text-xs transition-all border border-white/15 cursor-pointer"
                        >
                          <ArrowLeft size={16} />
                          <span>Anterior (Paso 3)</span>
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                /* PANTALLA DE CONFIRMACIÓN EXITOSA — PASE VIP DORADO */
                <div className="text-center py-10 sm:py-16 space-y-6 sm:space-y-8 animate-in fade-in zoom-in duration-300 max-w-2xl mx-auto">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-yellow-400 via-amber-400 to-yellow-500 text-blue-955 rounded-3xl flex items-center justify-center mx-auto shadow-[0_15px_40px_rgba(245,158,11,0.5)] ring-8 ring-yellow-400/20">
                    <CheckCircle2 size={48} className="stroke-[2.5]" />
                  </div>
                  
                  <div className="space-y-2">
                    <span className="inline-flex items-center space-x-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
                      <ShieldCheck size={14} />
                      <span>{paymentSuccessData?.metodo === 'recurrente' || paymentSuccessData?.estadoPago === 'Pagado' ? 'Inscripción y Pago Confirmados' : 'Pre-inscripción Registrada Oficialmente'}</span>
                    </span>
                    <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                      ¡Bienvenido a la LXXV Convención!
                    </h3>
                    <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                      Compañero León <strong className="text-yellow-400 font-extrabold">{form.nombre}</strong> ({form.club === 'Otro Club' ? customClub : form.club}), tus datos han sido procesados satisfactoriamente.
                    </p>
                  </div>

                  {/* Resumen del Registro */}
                  <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/20 rounded-3xl p-6 sm:p-7 text-left space-y-4 shadow-2xl backdrop-blur-xl">
                    <div className="flex justify-between items-center border-b border-white/10 pb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 block">ID Oficial de Registro</span>
                        <span className="text-xs font-mono font-bold text-white">{paymentSuccessData?.id || 'Generado'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Total Paquete</span>
                        <span className="text-xl font-black text-yellow-300">Q. {(paymentSuccessData?.monto || montoTotal).toLocaleString()}.00</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-200 space-y-1.5">
                      <p>• <strong>Paquete:</strong> {paymentSuccessData?.paquete || 'Inscripción Convención Nacional'}</p>
                      <p>• <strong>Estado del Pago:</strong> {paymentSuccessData?.metodo === 'recurrente' || paymentSuccessData?.estadoPago === 'Pagado' ? (
                        <span className="text-emerald-400 font-bold ml-1">Pagado con Tarjeta (Recurrente GT)</span>
                      ) : (
                        <span className="text-amber-300 font-bold ml-1">Pendiente de depósito / transferencia bancaria</span>
                      )}</p>
                    </div>

                    {/* Si seleccionó transferencia, mostrar cuenta de Banrural */}
                    {paymentSuccessData?.metodo === 'transferencia' && (
                      <div className="bg-amber-500/15 border border-amber-400/40 rounded-2xl p-4.5 mt-3 space-y-2.5">
                        <div className="flex items-center space-x-2 text-amber-300 font-black text-xs">
                          <Building2 size={16} />
                          <span>Datos para Depósito o Transferencia Banrural:</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-200">
                          <div><span className="text-slate-400">Banco:</span> <strong>Banrural</strong></div>
                          <div><span className="text-slate-400">Tipo de Cuenta:</span> <strong>Monetaria</strong></div>
                          <div><span className="text-slate-400">No. Cuenta:</span> <strong className="text-yellow-400 font-mono text-sm">3827008588</strong></div>
                          <div><span className="text-slate-400">A Nombre:</span> <strong>Club de Leones de Quetzaltenango</strong></div>
                        </div>
                        <p className="text-[11px] text-slate-300 pt-1.5 border-t border-white/10 font-medium">
                          Al realizar tu pago, envía la fotografía de tu boleta a la Comisión Organizadora con tu nombre y club.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Acciones: Telegram Bot y Registrar a otro */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <a
                      href="https://t.me/ConvencionLeonesbot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-black px-6 py-4 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-xl active:scale-95"
                    >
                      <Send size={16} />
                      <span>Abrir Bot de Telegram (@ConvencionLeonesbot)</span>
                    </a>
                    
                    <button 
                      onClick={handleResetForm}
                      className="w-full sm:w-auto text-xs font-black uppercase tracking-wider text-yellow-300 hover:text-yellow-200 border border-yellow-500/30 px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      Registrar a otro participante
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="text-center py-16 space-y-4 animate-in fade-in duration-300">
                <div className="w-16 h-16 bg-white/5 border border-white/10 text-yellow-400 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
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

      {/* BARRA STICKY FLOTANTE DE CONVERSIÓN RÁPIDA (Al hacer scroll) */}
      {showStickyBar && config.inscripcionesAbiertas && !isSubmitted && (
        <aside 
          aria-label="Registro rápido"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="bg-[#09152e]/95 border-2 border-yellow-400/80 rounded-2xl p-3.5 sm:p-4 shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl flex items-center justify-between gap-4 max-w-md">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-400/20 text-yellow-400 flex items-center justify-center font-black shrink-0 border border-yellow-400/40">
                <Zap size={20} className="animate-pulse" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 block">LXXV Convención Xela</span>
                <span className="text-xs sm:text-sm font-black text-white">Tarifa Base Q. {baseCost.toLocaleString()}.00</span>
              </div>
            </div>

            <button
              type="button"
              onClick={scrollToPreInscripcion}
              className="bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-400 hover:from-yellow-400 hover:to-amber-300 text-blue-955 font-black px-4 sm:px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-yellow-500/30 active:scale-95 transition-all shrink-0 cursor-pointer flex items-center space-x-1.5"
            >
              <span>Inscribirme</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </aside>
      )}
      {/* MODAL INTERACTIVO: ENCONTRAR Y CONSULTAR ENTRADA QR OFICIAL */}
      {isQrSearchModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-gradient-to-br from-[#0c1a38] via-[#09152e] to-[#060e1d] text-white rounded-3xl border-2 border-yellow-500/50 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
            {/* Header del Modal */}
            <div className="bg-white/[0.04] border-b border-white/10 p-5 sm:p-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-yellow-500/20 text-yellow-300 border border-yellow-400/40 flex items-center justify-center">
                  <QrCode size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                    Consulta tu Entrada QR Oficial
                  </h3>
                  <p className="text-[11px] text-slate-300 font-medium">LXXV Convención Nacional Club de Leones</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsQrSearchModalOpen(false); setFoundRegistroQr(null); setQrSearchQuery(''); }}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-5 sm:p-6 space-y-5">
              {!foundRegistroQr ? (
                /* Formulario de Búsqueda */
                <form onSubmit={handleSearchQr} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-300 block">
                      Ingresa tu Correo Electrónico o Teléfono:
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        required
                        value={qrSearchQuery}
                        onChange={e => setQrSearchQuery(e.target.value)}
                        placeholder="Ej. socio@leones.org o 55554444"
                        className="w-full bg-[#071126] border border-white/20 focus:border-yellow-400 rounded-2xl pl-11 pr-4 py-3.5 text-white text-sm outline-none focus:ring-4 focus:ring-yellow-400/20 transition-all font-semibold placeholder:text-slate-500"
                      />
                      <Search size={18} className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      También puedes ingresar tu número de folio o tu nombre registrado.
                    </p>
                  </div>

                  {qrSearchError && (
                    <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 font-medium animate-in fade-in">
                      {qrSearchError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSearchingQr}
                    className="w-full inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-400 hover:from-yellow-400 hover:to-amber-300 text-blue-955 font-black py-4 rounded-2xl text-sm transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isSearchingQr ? (
                      <span>Buscando tu inscripción...</span>
                    ) : (
                      <>
                        <Search size={16} />
                        <span>Buscar mi Entrada QR</span>
                      </>
                    )}
                  </button>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                    <span>¿No te has inscrito aún?</span>
                    <button
                      type="button"
                      onClick={() => { setIsQrSearchModalOpen(false); scrollToPreInscripcion({ preventDefault: () => {} } as any); }}
                      className="font-black text-yellow-300 hover:text-white underline cursor-pointer"
                    >
                      Pre-inscribirme ahora
                    </button>
                  </div>
                </form>
              ) : (
                /* Ficha de Credencial & QR Encontrada */
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="bg-white p-5 rounded-2xl text-slate-900 text-center space-y-3 shadow-xl border-4 border-yellow-500/60 relative overflow-hidden">
                    {/* Header de la Credencial */}
                    <div className="border-b border-slate-200 pb-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-blue-900 block">
                        LXXV Convención Nacional Club de Leones
                      </span>
                      <h4 className="text-lg font-black text-slate-950 uppercase tracking-tight">
                        {foundRegistroQr.nombre}
                      </h4>
                      <p className="text-xs text-slate-600 font-bold">
                        {foundRegistroQr.club} • {foundRegistroQr.cargo} ({foundRegistroQr.distrito})
                      </p>
                    </div>

                    {/* Código QR Generado */}
                    {qrCodeDataUrl && (
                      <div className="py-1 flex justify-center">
                        <img 
                          src={qrCodeDataUrl} 
                          alt={`QR Entrada ${foundRegistroQr.nombre}`} 
                          className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl border-2 border-slate-200 shadow-md"
                        />
                      </div>
                    )}

                    {/* Estado y Folio */}
                    <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-xs">
                      <div className="text-left">
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Folio Oficial</span>
                        <span className="font-mono font-black text-slate-800 text-xs">{foundRegistroQr.id}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        foundRegistroQr.estadoPago === 'Pagado'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {foundRegistroQr.estadoPago || 'Pre-registrado'}
                      </span>
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      className="inline-flex items-center justify-center space-x-2 bg-yellow-500 hover:bg-yellow-400 text-blue-955 font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow cursor-pointer active:scale-95"
                    >
                      <Download size={15} />
                      <span>Descargar QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleShareQrWhatsApp}
                      className="inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow cursor-pointer active:scale-95"
                    >
                      <MessageCircle size={15} />
                      <span>Enviar a WhatsApp</span>
                    </button>
                  </div>

                  <div className="pt-1">
                    <a
                      href={`https://t.me/ConvencionLeonesbot?start=qr_${foundRegistroQr.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow cursor-pointer active:scale-95"
                    >
                      <Send size={15} />
                      <span>Abrir en Telegram (@ConvencionLeonesbot)</span>
                    </a>
                  </div>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => { setFoundRegistroQr(null); setQrSearchQuery(''); }}
                      className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Buscar otra entrada
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
