import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  MOCK_SOCIOS, 
  MOCK_ACTIVIDADES, 
  MOCK_ACTAS, 
  MOCK_DONACIONES, 
  MOCK_BENEFICIOS,
  MOCK_PROPUESTAS
} from '../constants';
import { 
  Socio, 
  Actividad, 
  Acta, 
  Donacion, 
  Beneficio, 
  UserRole,
  PropuestaSocio,
  Solicitud,
  SolicitudVoluntario,
  Comision,
  ReunionAgenda,
  TareaComision,
  AgendaPunto,
  Asistencia,
  MinutaComision
} from '../types';
import { firebaseService } from '../services/firebaseService';
import { useClubData } from '../context/ClubDataContext';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import { getWrittenDateTimeSpanish } from '../utils/dateSpanishFormatter';
import { 
  TrendingUp, 
  Calendar, 
  CreditCard, 
  FileText, 
  Gift, 
  Award, 
  Plus, 
  Search, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle, 
  User,
  UserPlus,
  UserCheck,
  Trash2,
  Filter,
  Check,
  Send,
  X as XIcon,
  Download,
  Edit,
  Clock,
  Users,
  Loader2,
  Pencil,
  Building,
  QrCode,
  Phone,
  Mail,
  Briefcase,
  AlertCircle,
  Hash,
  ChevronDown,
  ChevronUp,
  Car,
  Archive,
  Camera,
  BookUser,
  Upload,
  Layers,
  Accessibility,
  XOctagon,
  Lock,
  Star,
  Share2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Printer,
  Trophy,
  Crown,
  ShieldCheck,
  Settings,
  Key,
  ClipboardList
} from 'lucide-react';
import { generateActaPDF, generateActaCode, generateReciboPagoPDF, generateAgendaPDF } from '../utils/pdfGenerator';
import { FormattedActa } from '../components/FormattedActa';
import { compressImageFile, validateImageFile } from '../utils/imageCompressor';
import { ParqueoManager } from '../components/ParqueoManager';
import { Presupuestos } from './Presupuestos';
import { Comisiones } from './Comisiones';
import { MinutasComisiones } from './MinutasComisiones';
import { Afiliacion } from './Afiliacion';
import { Inventario } from './Inventario';
import { GaleriaAdmin } from './GaleriaAdmin';
import { AgendaContactos } from './AgendaContactos';
import { LineaTiempoAdmin } from './LineaTiempoAdmin';
import { AsignacionFunciones } from './AsignacionFunciones';
import { RequerimientosActividades } from './RequerimientosActividades';
import { AdminActas } from './admin/AdminActas';
import { AdminCuotas } from './admin/AdminCuotas';
import { AdminCalendario } from './admin/AdminCalendario';
import { AdminConvencion } from './admin/AdminConvencion';
import { BibliotecaSolicitudesSecretaria } from './BibliotecaSolicitudesSecretaria';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

const CATEGORIAS_MODULOS = [
  {
    category: 'Principal',
    items: [
      { id: 'resumen', label: 'Resumen General', icon: TrendingUp },
      { id: 'asignacion_funciones', label: 'Asignación Funciones', icon: Settings }
    ]
  },
  {
    category: 'Presidencia',
    items: [
      { id: 'presidencia', label: 'Gestión de Solicitudes', icon: Layers },
      { id: 'agendas_reunion', label: 'Agendas de Reunión', icon: FileText },
      { id: 'ranking_lionistico', label: 'Ranking Lionístico', icon: Trophy },
      { id: 'convencion_admin', label: 'Configuración Convención', icon: Award }
    ]
  },
  {
    category: 'Secretaría',
    items: [
      { id: 'actas', label: 'Libro de Actas', icon: FileText },
      { id: 'comisiones', label: 'Gestión de Comisiones', icon: Briefcase },
      { id: 'archivo_solicitudes_secretaria', label: 'Biblioteca de Solicitudes', icon: Archive }
    ]
  },
  {
    category: 'Comité de Mercadeo',
    items: [
      { id: 'calendario', label: 'Actividades', icon: Calendar },
      { id: 'beneficios', label: 'Beneficios a Socios', icon: Award }
    ]
  },
  {
    category: 'Tesorería',
    items: [
      { id: 'cuotas', label: 'Control de Cuotas', icon: CreditCard },
      { id: 'parqueo', label: 'Gestión de Parqueo', icon: Car },
      { id: 'donaciones', label: 'Donaciones Recibidas', icon: Gift },
      { id: 'presupuestos', label: 'Presupuestos', icon: DollarSign }
    ]
  },
  {
    category: 'Comité de Afiliación',
    items: [
      { id: 'socios', label: 'Gestión de Socios', icon: Users },
      { id: 'afiliacion', label: 'Propuestas de Socios', icon: UserCheck }
    ]
  },
  {
    category: 'Comité de Servicio',
    items: [
      { id: 'minutas', label: 'Minutas de Comisiones', icon: FileText },
      { id: 'requerimientos_actividades', label: 'Requerimientos de Actividad', icon: ClipboardList }
    ]
  },
  {
    category: 'Comité de Patrimonio',
    items: [
      { id: 'inventario', label: 'Inventario', icon: Archive },
      { id: 'galeria_admin', label: 'Gestión de Galería', icon: Camera },
      { id: 'linea_tiempo_admin', label: 'Línea de Tiempo', icon: Clock }
    ]
  },
  {
    category: 'Comité de Gestión',
    items: [
      { id: 'agenda_contactos', label: 'Agenda de Contactos', icon: BookUser }
    ]
  }
];

const TEMA_COLOR_MAP: { [key: string]: 'blue' | 'emerald' | 'purple' | 'amber' | 'indigo' | 'orange' } = {
  abiertas: 'emerald',
  sillas: 'blue',
  salon: 'amber',
  internas: 'purple',
  agenda: 'indigo'
};

const THEME_ACCENTS: {
  [key: string]: {
    border: string;
    bg: string;
    text: string;
    badge: string;
  }
} = {
  blue: {
    border: 'border-blue-200',
    bg: 'bg-blue-50/50',
    text: 'text-blue-600',
    badge: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  emerald: {
    border: 'border-emerald-200',
    bg: 'bg-emerald-50/50',
    text: 'text-emerald-600',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  purple: {
    border: 'border-purple-200',
    bg: 'bg-purple-50/50',
    text: 'text-purple-600',
    badge: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  amber: {
    border: 'border-amber-200',
    bg: 'bg-amber-50/50',
    text: 'text-amber-600',
    badge: 'bg-amber-50 text-amber-750 border-amber-200'
  },
  indigo: {
    border: 'border-indigo-200',
    bg: 'bg-indigo-50/50',
    text: 'text-indigo-600',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  orange: {
    border: 'border-orange-200',
    bg: 'bg-orange-50/50',
    text: 'text-orange-600',
    badge: 'bg-orange-50 text-orange-700 border-orange-200'
  }
};

interface SuperAdminProps {
  user: Socio;
  onUpdateUser?: (user: Socio) => void;
}

type TabType = 'resumen' | 'socios' | 'calendario' | 'cuotas' | 'actas' | 'donaciones' | 'beneficios' | 'parqueo' | 'presupuestos' | 'comisiones' | 'minutas' | 'afiliacion' | 'inventario' | 'galeria_admin' | 'linea_tiempo_admin' | 'agenda_contactos' | 'presidencia' | 'agendas_reunion' | 'ranking_lionistico' | 'asignacion_funciones' | 'convencion_admin' | 'archivo_solicitudes_secretaria';

const SuperAdmin: React.FC<SuperAdminProps> = ({ user, onUpdateUser }) => {
  const { showAlert, showConfirm } = useModal();
  const { rolesConfig, puestosList } = useClubData();
  
  const alert = (msg: string) => {
    showAlert("Notificación", msg);
  };

  // Dynamic Tab Access based on Role Configuration
  const allowedTabs = useMemo(() => {
    const matchedConfig = rolesConfig.find(r => r.id === user.rol);
    if (matchedConfig) {
      return matchedConfig.allowedTabs || [];
    }

    // Fallback switch check
    switch (user.rol) {
      case UserRole.SUPER_ADMIN:
        return ['resumen', 'socios', 'calendario', 'cuotas', 'actas', 'donaciones', 'beneficios', 'parqueo', 'presupuestos', 'comisiones', 'minutas', 'afiliacion', 'inventario', 'galeria_admin', 'linea_tiempo_admin', 'agenda_contactos', 'presidencia', 'agendas_reunion', 'ranking_lionistico', 'asignacion_funciones', 'convencion_admin', 'archivo_solicitudes_secretaria'];
      case UserRole.TESORERO:
        return ['resumen', 'socios', 'cuotas', 'donaciones', 'parqueo', 'presupuestos', 'inventario', 'galeria_admin', 'linea_tiempo_admin'];
      case UserRole.SECRETARIO:
        return ['resumen', 'socios', 'calendario', 'actas', 'comisiones', 'minutas', 'agenda_contactos', 'presidencia', 'agendas_reunion', 'ranking_lionistico', 'archivo_solicitudes_secretaria'];
      case UserRole.ASESOR_SERVICIOS:
        return ['socios', 'calendario', 'beneficios', 'minutas'];
      case UserRole.PRESIDENTE_AFILIACION:
        return ['resumen', 'socios', 'calendario', 'cuotas', 'actas', 'donaciones', 'beneficios', 'parqueo', 'presupuestos', 'comisiones', 'minutas', 'afiliacion', 'agenda_contactos', 'presidencia', 'agendas_reunion', 'ranking_lionistico', 'archivo_solicitudes_secretaria'];
      default:
        return [];
    }
  }, [user.rol, rolesConfig]);

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = useMemo<TabType>(() => {
    const queryTab = searchParams.get('tab') as TabType;
    if (queryTab) return queryTab;
    const saved = sessionStorage.getItem('super_admin_active_tab') as TabType;
    if (saved) return saved;
    if (user.rol === UserRole.ASESOR_SERVICIOS) return 'calendario';
    return 'resumen';
  }, [searchParams, user.rol]);

  const setActiveTab = (tab: TabType) => {
    setSearchParams(prev => {
      prev.set('tab', tab);
      return prev;
    });
    sessionStorage.setItem('super_admin_active_tab', tab);
  };

  useEffect(() => {
    sessionStorage.setItem('super_admin_active_tab', activeTab);
  }, [activeTab]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Principal');
  const [moduleSearchQuery, setModuleSearchQuery] = useState('');

  // Filtrar categorías y expandir dinámicamente si hay búsqueda
  const filteredCategorias = useMemo(() => {
    if (!moduleSearchQuery.trim()) return CATEGORIAS_MODULOS;
    const queryStr = moduleSearchQuery.toLowerCase();
    return CATEGORIAS_MODULOS.map(group => {
      const matchedItems = group.items.filter(item => 
        item.label.toLowerCase().includes(queryStr) || 
        group.category.toLowerCase().includes(queryStr)
      );
      return {
        ...group,
        items: matchedItems
      };
    }).filter(group => group.items.length > 0);
  }, [moduleSearchQuery]);

  // Auto-expand category based on activeTab
  useEffect(() => {
    const groups = [
      { category: 'Principal', items: ['resumen', 'asignacion_funciones'] },
      { category: 'Presidencia', items: ['presidencia', 'agendas_reunion', 'ranking_lionistico'] },
      { category: 'Secretaría', items: ['actas', 'comisiones', 'archivo_solicitudes_secretaria'] },
      { category: 'Comité de Mercadeo', items: ['calendario', 'beneficios'] },
      { category: 'Tesorería', items: ['cuotas', 'parqueo', 'donaciones', 'presupuestos'] },
      { category: 'Comité de Afiliación', items: ['socios', 'afiliacion'] },
      { category: 'Comité de Servicio', items: ['minutas'] },
      { category: 'Comité de Patrimonio', items: ['inventario', 'galeria_admin', 'linea_tiempo_admin'] },
      { category: 'Comité de Gestión', items: ['agenda_contactos'] }
    ];
    const currentGroup = groups.find(g => g.items.includes(activeTab));
    if (currentGroup) {
      setExpandedCategory(currentGroup.category);
    }
  }, [activeTab]);

  const getTabStyles = (tabId: string, active: boolean) => {
    if (!active) return 'text-slate-600 hover:bg-slate-50 hover:text-blue-900 hover:shadow-sm';
    
    switch (tabId) {
      case 'actas':
      case 'calendario':
      case 'donaciones':
        return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20 scale-102';
      default:
        return 'bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-md shadow-blue-900/20 scale-102';
    }
  };

  const getMobileTabStyles = (tabId: string) => {
    switch (tabId) {
      case 'actas':
      case 'calendario':
      case 'donaciones':
        return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20';
      default:
        return 'bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-md shadow-blue-900/20';
    }
  };

  useEffect(() => {
    if (!allowedTabs.includes(activeTab)) {
      setActiveTab(allowedTabs[0] as TabType);
    }
  }, [allowedTabs, activeTab]);
  
  // Load data from global ClubDataContext to avoid redundant queries and fragmentation
  const {
    socios: dbSocios,
    propuestas: dbPropuestas,
    solicitudes: dbSolicitudes,
    actividades: dbActividades,
    voluntarios: dbVoluntarios,
    actas: dbActas,
    agendas: dbAgendas,
    comisiones: dbComisiones,
    tareasComisiones: dbTareasComisiones,
    minutas: dbMinutas,
    asistencias: dbAsistencias,
    loading: dbLoading
  } = useClubData();

  const { showToast } = useToast();

  const [socios, setSocios] = useState<Socio[]>(dbSocios);
  const [propuestas, setPropuestas] = useState<PropuestaSocio[]>(dbPropuestas);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(dbSolicitudes);
  const [actividades, setActividades] = useState<Actividad[]>(dbActividades);
  const [actas, setActas] = useState<Acta[]>(dbActas);
  const [voluntarios, setVoluntarios] = useState<SolicitudVoluntario[]>(dbVoluntarios);
  const [agendas, setAgendas] = useState<ReunionAgenda[]>(dbAgendas || []);
  const [comisiones, setComisiones] = useState<Comision[]>(dbComisiones || []);
  const [tareasComisiones, setTareasComisiones] = useState<TareaComision[]>(dbTareasComisiones || []);
  const [minutas, setMinutas] = useState<MinutaComision[]>(dbMinutas || []);
  const [asistencias, setAsistencias] = useState<Asistencia[]>(dbAsistencias || []);

  useEffect(() => { setSocios(dbSocios); }, [dbSocios]);
  useEffect(() => { setPropuestas(dbPropuestas); }, [dbPropuestas]);
  useEffect(() => { setSolicitudes(dbSolicitudes); }, [dbSolicitudes]);
  useEffect(() => { setActividades(dbActividades); }, [dbActividades]);
  useEffect(() => { setActas(dbActas); }, [dbActas]);
  useEffect(() => { setVoluntarios(dbVoluntarios); }, [dbVoluntarios]);
  useEffect(() => { setAgendas(dbAgendas || []); }, [dbAgendas]);
  useEffect(() => { setComisiones(dbComisiones || []); }, [dbComisiones]);
  useEffect(() => { setTareasComisiones(dbTareasComisiones || []); }, [dbTareasComisiones]);
  useEffect(() => { setMinutas(dbMinutas || []); }, [dbMinutas]);
  useEffect(() => { setAsistencias(dbAsistencias || []); }, [dbAsistencias]);

  // Sync global loading status
  useEffect(() => {
    setIsLoadingSocios(dbLoading.socios);
  }, [dbLoading.socios]);

  const [donaciones, setDonaciones] = useState<Donacion[]>(MOCK_DONACIONES);
  const [beneficios, setBeneficios] = useState<Beneficio[]>(() => {
    const local = localStorage.getItem('club_leones_beneficios');
    return local ? JSON.parse(local) : MOCK_BENEFICIOS;
  });
  const [calendarioSubTab, setCalendarioSubTab] = useState<'lista' | 'voluntarios'>('lista');
  const [voluntarioSearch, setVoluntarioSearch] = useState('');
  const [voluntarioFilterActividad, setVoluntarioFilterActividad] = useState('Todas');
  const [voluntarioFilterEstado, setVoluntarioFilterEstado] = useState('Todos');

  // Search & Filter States
  const [socioSearch, setSocioSearch] = useState('');

  // States para "Control de Solicitudes"
  const [controlSolicitudesFilterType, setControlSolicitudesFilterType] = useState<'todos' | 'abiertas' | 'internas' | 'sillas' | 'salon'>('todos');
  const [controlSolicitudesFilterStatus, setControlSolicitudesFilterStatus] = useState<'todos' | 'Pendiente' | 'Aprobada' | 'Rechazada'>('todos');
  const [controlSolicitudesArchiveFilter, setControlSolicitudesArchiveFilter] = useState<'activas' | 'archivadas' | 'todas'>('activas');
  const [controlSolicitudesSearchQuery, setControlSolicitudesSearchQuery] = useState('');

  // States para "Agenda Presidencia"
  const [presidenciaSubTab, setPresidenciaSubTab] = useState<'solicitudes' | 'agendas'>('solicitudes');
  const [rankingSubTab, setRankingSubTab] = useState<'socios' | 'comisiones' | 'asistencia'>('socios');
  const [asistenciaEventTipo, setAsistenciaEventTipo] = useState<'reunion' | 'actividad'>('reunion');
  const [asistenciaEventId, setAsistenciaEventId] = useState<string>('');
  const [asistenciaChecked, setAsistenciaChecked] = useState<{[key: string]: boolean}>({});
  const [asistenciaVoluntarioChecked, setAsistenciaVoluntarioChecked] = useState<{[key: string]: boolean}>({});
  const [isSavingAsistencia, setIsSavingAsistencia] = useState<boolean>(false);
  const [asistenciaSearchQuery, setAsistenciaSearchQuery] = useState<string>('');
  const [rankingSearchQuery, setRankingSearchQuery] = useState<string>('');
  
  // Load existing attendance checkmarks when selected event is changed
  useEffect(() => {
    if (!asistenciaEventId) {
      setAsistenciaChecked({});
      setAsistenciaVoluntarioChecked({});
      return;
    }
    const eventAtt = asistencias.filter(a => a.eventoId === asistenciaEventId);
    if (eventAtt.length > 0) {
      const checkedMap: {[key: string]: boolean} = {};
      const volCheckedMap: {[key: string]: boolean} = {};
      eventAtt.forEach(a => {
        if (a.tipo === 'actividad') {
          checkedMap[a.socioId] = a.asistio;
        } else if (a.tipo === 'voluntariado') {
          volCheckedMap[a.socioId] = a.asistio;
        } else if (a.tipo === 'reunion') {
          checkedMap[a.socioId] = a.asistio;
        }
      });
      setAsistenciaChecked(checkedMap);
      setAsistenciaVoluntarioChecked(volCheckedMap);
    } else {
      setAsistenciaChecked({});
      setAsistenciaVoluntarioChecked({});
    }
  }, [asistenciaEventId, asistencias]);

  const [showAgendaForm, setShowAgendaForm] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState<ReunionAgenda | null>(null);
  const [reorderingAgenda, setReorderingAgenda] = useState<ReunionAgenda | null>(null);
  const [reorderingPuntos, setReorderingPuntos] = useState<AgendaPunto[]>([]);
  const [isSavingReorder, setIsSavingReorder] = useState(false);
  const [agendaForm, setAgendaForm] = useState<{
    id?: string;
    titulo: string;
    fecha: string;
    hora: string;
    lugar: string;
    puntos: AgendaPunto[];
    categoria: 'protocolaria' | 'ordinaria' | 'extraordinaria' | 'comisiones';
    presidencia: string;
  }>({
    titulo: '',
    fecha: '',
    hora: '',
    lugar: '',
    puntos: [],
    categoria: 'ordinaria',
    presidencia: ''
  });
  const [isSavingAgenda, setIsSavingAgenda] = useState(false);
  const [agendaFormError, setAgendaFormError] = useState('');
  const [importFilterType, setImportFilterType] = useState<string>('');
  const [importSelectedRequestId, setImportSelectedRequestId] = useState<string>('');
  const [selectedComisionForPunto, setSelectedComisionForPunto] = useState<{[key: string]: string}>({});
  const [urgenciaForPunto, setUrgenciaForPunto] = useState<{[key: string]: 'Alta' | 'Media' | 'Baja'}>({});
  const [fechaLimiteForPunto, setFechaLimiteForPunto] = useState<{[key: string]: string}>({});
  const [showComisionConfigForPunto, setShowComisionConfigForPunto] = useState<{[key: string]: boolean}>({});

  // Actividades Search & Sort
  const [actividadSearch, setActividadSearch] = useState('');
  const [actividadSort, setActividadSort] = useState<'recientes' | 'antiguas' | 'az' | 'za'>('recientes');
  const [actividadFilter, setActividadFilter] = useState<'Todas' | 'Publicas' | 'Privadas'>('Todas');

  const filteredAndSortedActividades = useMemo(() => {
    let result = [...actividades];
    
    // Filter by type
    if (actividadFilter === 'Publicas') result = result.filter(a => a.publica);
    if (actividadFilter === 'Privadas') result = result.filter(a => !a.publica);
    
    // Filter by search term
    if (actividadSearch.trim()) {
      const q = actividadSearch.toLowerCase();
      result = result.filter(a => 
        a.titulo.toLowerCase().includes(q) || 
        a.descripcion.toLowerCase().includes(q) ||
        a.lugar.toLowerCase().includes(q)
      );
    }
    
    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.fecha.replace(' ', 'T')).getTime();
      const dateB = new Date(b.fecha.replace(' ', 'T')).getTime();
      switch (actividadSort) {
        case 'recientes': return dateB - dateA;
        case 'antiguas': return dateA - dateB;
        case 'az': return a.titulo.localeCompare(b.titulo);
        case 'za': return b.titulo.localeCompare(a.titulo);
        default: return dateB - dateA;
      }
    });
    
    return result;
  }, [actividades, actividadFilter, actividadSearch, actividadSort]);

  const filteredVoluntarios = useMemo(() => {
    let result = [...voluntarios];

    if (voluntarioFilterActividad !== 'Todas') {
      result = result.filter(v => v.actividadId === voluntarioFilterActividad);
    }

    if (voluntarioFilterEstado !== 'Todos') {
      result = result.filter(v => v.estado === voluntarioFilterEstado);
    }

    if (voluntarioSearch.trim()) {
      const term = voluntarioSearch.toLowerCase();
      result = result.filter(v => 
        v.nombre.toLowerCase().includes(term) ||
        v.correo.toLowerCase().includes(term)
      );
    }

    return result;
  }, [voluntarios, voluntarioFilterActividad, voluntarioFilterEstado, voluntarioSearch]);
  const [roleFilter, setRoleFilter] = useState('Todos');
  const [isLoadingSocios, setIsLoadingSocios] = useState(false);

  // Cuotas Redesign States
  const [cuotasFilterStatus, setCuotasFilterStatus] = useState<'Todos' | 'Al día' | 'Pendiente' | 'En mora'>('Todos');
  const [selectedSocioForCuotas, setSelectedSocioForCuotas] = useState<string | null>(null);
  const [showRegistrarPagoModal, setShowRegistrarPagoModal] = useState(false);
  const [registrarPagoData, setRegistrarPagoData] = useState({
    socioId: '',
    tipoPeriodo: 'Mensual' as 'Mensual' | 'Semestral' | 'Anual',
    mes: 'Enero',
    año: new Date().getFullYear(),
    semestre: '1er Semestre (Ene-Jun)',
    monto: 100,
    metodo: 'Transferencia' as 'Transferencia' | 'Depósito' | 'Efectivo',
    bancoReferencia: '',
    numeroReferencia: '',
    fechaPago: new Date().toISOString().substring(0, 10)
  });

  // Socio Form / QR states
  const [editingSocio, setEditingSocio] = useState<Socio | null>(null);
  const [clubSectionOpen, setClubSectionOpen] = useState(false);
  const [editSocioForm, setEditSocioForm] = useState<Partial<Socio>>({});
  const [isSavingSocio, setIsSavingSocio] = useState(false);
  const [socioSaveSuccess, setSocioSaveSuccess] = useState(false);
  const [socioSaveError, setSocioSaveError] = useState<string | null>(null);
  const [qrSocio, setQrSocio] = useState<Socio | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  // Check if editingSocio is a new registration
  const isNewSocio = useMemo(() => {
    if (!editingSocio) return false;
    return !socios.some(s => s.id === editingSocio.id);
  }, [editingSocio, socios]);

  // Check if current edit session is a self-edit
  const isSelfEdit = useMemo(() => {
    if (!editingSocio) return false;
    return editingSocio.id === user.id;
  }, [editingSocio, user.id]);

  const isClubSectionAllowed = useMemo(() => {
    if (!user) return false;
    return (
      user.rol === UserRole.SUPER_ADMIN ||
      user.rol === UserRole.PRESIDENTE_AFILIACION ||
      !!(user.puesto && user.puesto.toLowerCase().includes('presidente'))
    );
  }, [user]);

  const showClubRightColumn = isClubSectionAllowed && clubSectionOpen;
  const modalMaxWidth = showClubRightColumn ? 'max-w-4xl' : 'max-w-xl';
  const formColumnsClass = showClubRightColumn ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1';

  const [actaSearch, setActaSearch] = useState('');
  const [deleteActaConfirmId, setDeleteActaConfirmId] = useState<string | null>(null);
  const [deleteActaConfirmText, setDeleteActaConfirmText] = useState('');

  const [donacionSearch, setDonacionSearch] = useState('');
  const [actaFilterCategory, setActaFilterCategory] = useState('Todas');
  
  // Modals / Form States
  const [showAddActa, setShowAddActa] = useState(() => {
    return sessionStorage.getItem('super_admin_show_add_acta') === 'true';
  });

  useEffect(() => {
    sessionStorage.setItem('super_admin_show_add_acta', String(showAddActa));
    if (!showAddActa) {
      sessionStorage.removeItem('super_admin_acta_wizard_step');
      sessionStorage.removeItem('super_admin_acta_wizard_data');
    }
  }, [showAddActa]);

  const [editingActaId, setEditingActaId] = useState<string | null>(null);
  const [newActa, setNewActa] = useState({ titulo: '', autor: '', contenido: '', categoria: 'Ordinaria' });

  // Wizard state for structured minutes
  const [actaWizardStep, setActaWizardStep] = useState<'datos' | 'asistencia' | 'protocolo' | 'solicitudes' | 'libre' | 'vista_previa'>(() => {
    const saved = sessionStorage.getItem('super_admin_acta_wizard_step');
    if (saved) return saved as any;
    return 'datos';
  });

  useEffect(() => {
    if (showAddActa) {
      sessionStorage.setItem('super_admin_acta_wizard_step', actaWizardStep);
    }
  }, [actaWizardStep, showAddActa]);

  const [actaWizardData, setActaWizardData] = useState(() => {
    const saved = sessionStorage.getItem('super_admin_acta_wizard_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved minutes wizard data", e);
      }
    }
    return {
      titulo: '',
      categoria: 'Ordinaria' as 'Ordinaria' | 'Extraordinaria' | 'Reunión de Comisión',
      lugar: 'Quetzaltenango, Sede Social denominada "La Cueva", ubicada en la Calle Rodolfo Robles, 24-53 de la zona 1.',
      fechaHoraText: '',
      invocacionResponsableType: 'socio' as 'socio' | 'invitado',
      invocacionSocioId: '',
      invocacionInvitadoName: '',
      saludoResponsableType: 'socio' as 'socio' | 'invitado',
      saludoSocioId: '',
      saludoInvitadoName: '',
      solicitudesResoluciones: {} as Record<string, { decision: 'Aprobada' | 'Rechazada' | 'Pendiente', razon: string }>,
      puntosAgenda: [] as { tema: string; debate: string; acuerdo: string; socioSolicitante?: string; agendaContenido?: string; }[],
      asistencia: [] as string[],
      numeroActa: ''
    };
  });

  useEffect(() => {
    if (showAddActa) {
      sessionStorage.setItem('super_admin_acta_wizard_data', JSON.stringify(actaWizardData));
    }
  }, [actaWizardData, showAddActa]);

  const [newAgendaPoint, setNewAgendaPoint] = useState({ 
    tema: '', 
    debate: '', 
    acuerdo: '', 
    socioSolicitante: '', 
    agendaContenido: '' 
  });
  const [asistenciaSearch, setAsistenciaSearch] = useState('');
  const [selectedAgendaPointTab, setSelectedAgendaPointTab] = useState<'new' | number>('new');
  const [actaPreviewMode, setActaPreviewMode] = useState<'documento' | 'texto'>('documento');

  const handleImportAgendaToActa = (agendaId: string) => {
    const selected = (agendas || []).find(a => a.id === agendaId);
    if (!selected) return;
    
    const newPuntos = selected.puntos
      .filter(p => p.agregadoAActas !== false)
      .map(p => ({
        tema: p.titulo,
        debate: p.descripcion || '',
        acuerdo: '',
        agendaContenido: p.descripcion || ''
      }));
    
    setActaWizardData(prev => ({
      ...prev,
      titulo: selected.titulo,
      lugar: selected.lugar,
      puntosAgenda: newPuntos
    }));
    
    if (newPuntos.length > 0) {
      setSelectedAgendaPointTab(0);
    }
    
    showAlert('Agenda Importada', `Se cargaron ${newPuntos.length} puntos de agenda de "${selected.titulo}" al creador de actas.`);
  };

  const [showAddActividad, setShowAddActividad] = useState(false);
  const [showEditActividad, setShowEditActividad] = useState(false);
  const [editingActividad, setEditingActividad] = useState<Actividad | null>(null);
  const [newActividad, setNewActividad] = useState({ 
    titulo: '', 
    descripcion: '', 
    fecha: '', 
    lugar: '', 
    publica: true,
    conBotonDonacion: false,
    donacionUrl: '',
    imagen: ''
  });
  const [newActividadImageFile, setNewActividadImageFile] = useState<File | null>(null);
  const [editActividadImageFile, setEditActividadImageFile] = useState<File | null>(null);
  const [newActividadImagePreview, setNewActividadImagePreview] = useState<string | null>(null);
  const [editActividadImagePreview, setEditActividadImagePreview] = useState<string | null>(null);
  const [isSavingActividad, setIsSavingActividad] = useState(false);

  const [showAddDonacion, setShowAddDonacion] = useState(false);
  const [newDonacion, setNewDonacion] = useState({ donante: '', monto: '', proyecto: '', tipo: 'Individual' as 'Individual' | 'Empresarial' });

  const [showAddBeneficio, setShowAddBeneficio] = useState(false);
  const [newBeneficio, setNewBeneficio] = useState({ titulo: '', descripcion: '', convenioCon: '', descuento: '', categoria: 'Salud' as any });

  const [showEditPropuesta, setShowEditPropuesta] = useState(false);
  const [editingPropuesta, setEditingPropuesta] = useState<PropuestaSocio | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string } | null>(null);

  const canEditPropuestas = user.rol === UserRole.SUPER_ADMIN || user.rol === UserRole.PRESIDENTE_AFILIACION || user.rol === UserRole.SECRETARIO;

  const presidentName = useMemo(() => {
    const p = socios.find((s: any) => s.puesto?.toLowerCase().includes('presidente del club') || s.puesto?.toLowerCase() === 'presidente') || socios.find((s: any) => s.puesto?.toLowerCase().includes('presidente'));
    return p ? p.nombre : 'Edwin Ernesto Pacheco López';
  }, [socios]);

  const secretaryName = useMemo(() => {
    const s = socios.find((s: any) => s.puesto?.toLowerCase().includes('secretario del club') || s.puesto?.toLowerCase() === 'secretario') || socios.find((s: any) => s.puesto?.toLowerCase().includes('secretario'));
    return s ? s.nombre : 'Flor Rodríguez Cifuentes';
  }, [socios]);

  // Attendance and Quorum helpers
  const debateRef = useRef<HTMLTextAreaElement>(null);

  const sortedAllSocios = useMemo(() => {
    return [...socios].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [socios]);

  const presentSocios = useMemo(() => {
    const presentIds = new Set(actaWizardData.asistencia || []);
    return sortedAllSocios.filter(s => presentIds.has(s.id));
  }, [sortedAllSocios, actaWizardData.asistencia]);

  const selectableSocios = useMemo(() => {
    return presentSocios.length > 0 
      ? presentSocios 
      : sortedAllSocios.filter(s => s.estatus !== 'Inactive');
  }, [presentSocios, sortedAllSocios]);

  const agendaProposals = useMemo(() => {
    return solicitudes.filter(s => s.tipo === 'agenda');
  }, [solicitudes]);

  const handleInsertMemberMention = (memberName: string) => {
    const textarea = debateRef.current;
    if (!textarea) {
      if (selectedAgendaPointTab === 'new') {
        setNewAgendaPoint(prev => ({
          ...prev,
          debate: prev.debate ? `${prev.debate}\n${memberName}: ` : `${memberName}: `
        }));
      } else {
        const currentDebate = (actaWizardData.puntosAgenda || [])[selectedAgendaPointTab as number]?.debate || '';
        handleUpdateAgendaPoint(selectedAgendaPointTab as number, 'debate', 
          currentDebate ? `${currentDebate}\n${memberName}: ` : `${memberName}: `
        );
      }
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    
    const insertion = before.endsWith('\n') || start === 0 ? `${memberName}: ` : `\n${memberName}: `;
    const newValue = before + insertion + after;

    if (selectedAgendaPointTab === 'new') {
      setNewAgendaPoint(prev => ({
        ...prev,
        debate: newValue
      }));
    } else {
      handleUpdateAgendaPoint(selectedAgendaPointTab as number, 'debate', newValue);
    }

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + insertion.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const absentSocios = useMemo(() => {
    const presentIds = new Set(actaWizardData.asistencia || []);
    return sortedAllSocios.filter(s => !presentIds.has(s.id));
  }, [sortedAllSocios, actaWizardData.asistencia]);

  const filteredAbsentSocios = useMemo(() => {
    if (!asistenciaSearch.trim()) return absentSocios;
    const q = asistenciaSearch.toLowerCase();
    return absentSocios.filter(s => 
      s.nombre.toLowerCase().includes(q) || 
      (s.puesto && s.puesto.toLowerCase().includes(q))
    );
  }, [absentSocios, asistenciaSearch]);

  const handleMarkPresent = (id: string) => {
    setActaWizardData(prev => {
      const current = prev.asistencia || [];
      if (current.includes(id)) return prev;
      return {
        ...prev,
        asistencia: [...current, id]
      };
    });
    setAsistenciaSearch('');
  };

  const handleMarkAbsent = (id: string) => {
    setActaWizardData(prev => ({
      ...prev,
      asistencia: (prev.asistencia || []).filter(item => item !== id)
    }));
  };

  const handleAsistenciaSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredAbsentSocios.length > 0) {
        handleMarkPresent(filteredAbsentSocios[0].id);
      }
    }
  };

  // Auto-adjust protocol selection based on attendance list
  useEffect(() => {
    if (presentSocios.length > 0) {
      setActaWizardData(prev => {
        const updates: Partial<typeof prev> = {};
        const presentIds = new Set(presentSocios.map(s => s.id));
        if (prev.invocacionSocioId && !presentIds.has(prev.invocacionSocioId)) {
          updates.invocacionSocioId = presentSocios[0].id;
        } else if (!prev.invocacionSocioId) {
          updates.invocacionSocioId = presentSocios[0].id;
        }
        if (prev.saludoSocioId && !presentIds.has(prev.saludoSocioId)) {
          updates.saludoSocioId = presentSocios[0].id;
        } else if (!prev.saludoSocioId) {
          updates.saludoSocioId = presentSocios[0].id;
        }
        if (Object.keys(updates).length > 0) {
          return { ...prev, ...updates };
        }
        return prev;
      });
    }
  }, [presentSocios]);

  // Global KPIs calculation
  const totalDonaciones = useMemo(() => donaciones.reduce((sum, d) => sum + d.monto, 0), [donaciones]);
  const totalCuotasPendientes = useMemo(() => socios.reduce((sum, s) => sum + s.montoPendiente, 0), [socios]);
  const sociosAlDia = useMemo(() => socios.filter(s => s.estadoCuotas === 'Al día').length, [socios]);

  // Estadísticas para gráficos del Resumen General
  const solicitudesStats = useMemo(() => {
    const typesMap: {[key: string]: number} = {
      abiertas: 0,
      sillas: 0,
      salon: 0,
      internas: 0,
      agenda: 0
    };
    solicitudes.forEach(s => {
      if (typesMap[s.tipo] !== undefined) {
        typesMap[s.tipo]++;
      }
    });
    return [
      { name: 'Sillas Ruedas', cantidad: typesMap.sillas, color: '#3b82f6' },
      { name: 'Salón/Parqueo', cantidad: typesMap.salon, color: '#f59e0b' },
      { name: 'Ayuda Abierta', cantidad: typesMap.abiertas, color: '#10b981' },
      { name: 'Internas', cantidad: typesMap.internas, color: '#8b5cf6' },
      { name: 'Puntos Agenda', cantidad: typesMap.agenda, color: '#6366f1' }
    ];
  }, [solicitudes]);

  const cuotasStats = useMemo(() => {
    let alDia = 0;
    let pendiente = 0;
    let enMora = 0;
    socios.forEach(s => {
      if (s.estadoCuotas === 'Al día') alDia++;
      else if (s.estadoCuotas === 'Pendiente') pendiente++;
      else if (s.estadoCuotas === 'En mora') enMora++;
    });
    return [
      { name: 'Al día', value: alDia, color: '#10b981' },
      { name: 'Pendiente', value: pendiente, color: '#f59e0b' },
      { name: 'En mora', value: enMora, color: '#ef4444' }
    ];
  }, [socios]);
  
  // Handle proposals approval and rejection
  const handleAprobarPropuesta = async (propuestaId: string) => {
    const propuesta = propuestas.find(p => p.id === propuestaId);
    if (!propuesta) return;

    // 1. Update proposal status
    const nuevasPropuestas = propuestas.map(p => {
      if (p.id === propuestaId) return { ...p, estado: 'Aprobado' as const };
      return p;
    });
    setPropuestas(nuevasPropuestas);

    // 2. Add new member to list
    const nuevoSocio: Socio = {
      id: `socio-${Date.now()}`,
      nombre: propuesta.nombreCandidato,
      correo: propuesta.nombreCandidato.toLowerCase().replace(/[^a-z0-9]+/g, '') + '@leonesxela.com',
      rol: UserRole.SOCIO,
      puesto: 'Socio Ingresado',
      estadoCuotas: 'Al día',
      montoPendiente: 0,
      foto: propuesta.fotoCandidato || 'https://picsum.photos/seed/socio/200/200',
      fechaIngreso: new Date().toISOString().split('T')[0]
    };
    setSocios([nuevoSocio, ...socios]);

    try {
      await firebaseService.updateProposalStatus(propuestaId, 'Aprobado');
      await firebaseService.saveSocio(nuevoSocio);
      alert(`La propuesta para ${propuesta.nombreCandidato} ha sido aprobada. ¡Ahora es miembro activo del club!`);
    } catch (err) {
      console.error("Error approving proposal in Firebase:", err);
      alert(`La propuesta se aprobó localmente, pero no pudo guardarse en Firebase: ${err}`);
    }
  };

  const handlePendientePropuesta = async (propuestaId: string) => {
    const nuevasPropuestas = propuestas.map(p => {
      if (p.id === propuestaId) return { ...p, estado: 'Pendiente' as const };
      return p;
    });
    setPropuestas(nuevasPropuestas);
    
    try {
      await firebaseService.updateProposalStatus(propuestaId, 'Pendiente');
    } catch (err) {
      console.error("Error setting proposal to pending in Firebase:", err);
      alert(`No pudo guardarse en Firebase: ${err}`);
    }
  };

  const handleRechazarPropuesta = async (propuestaId: string) => {
    const nuevasPropuestas = propuestas.map(p => {
      if (p.id === propuestaId) return { ...p, estado: 'Rechazado' as const };
      return p;
    });
    setPropuestas(nuevasPropuestas);
    
    try {
      await firebaseService.updateProposalStatus(propuestaId, 'Rechazado');
      alert('La propuesta ha sido rechazada.');
    } catch (err) {
      console.error("Error rejecting proposal in Firebase:", err);
      alert(`La propuesta se rechazó localmente, pero no pudo guardarse en Firebase: ${err}`);
    }
  };

  const handleDeletePropuesta = async (propuestaId: string) => {
    if (!(await showConfirm("Eliminar Propuesta", "¿Está seguro de eliminar esta propuesta permanentemente? Esta acción no se puede deshacer.", { type: 'danger' }))) return;
    
    setPropuestas(propuestas.filter(p => p.id !== propuestaId));
    try {
      await firebaseService.deleteProposal(propuestaId);
    } catch (err) {
      console.error("Error deleting proposal:", err);
      alert("No se pudo eliminar en Firebase.");
    }
  };

  const handleEditPropuestaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPropuesta) return;

    if (!editingPropuesta.proponente || !editingPropuesta.nombreCandidato || !editingPropuesta.profesionCandidato || !editingPropuesta.motivoPropuesta || !editingPropuesta.porQueBuenLeon || !editingPropuesta.estadoCivil || !editingPropuesta.hijos) {
      alert('Por favor complete todos los campos obligatorios.');
      return;
    }

    const updatedPropuesta = {
      ...editingPropuesta,
      nombreEsposa: editingPropuesta.estadoCivil === 'Casado' ? editingPropuesta.nombreEsposa : ''
    };

    setPropuestas(propuestas.map(p => p.id === updatedPropuesta.id ? updatedPropuesta : p));
    setShowEditPropuesta(false);

    try {
      await firebaseService.updateProposal(updatedPropuesta.id, updatedPropuesta);
      alert("Propuesta actualizada con éxito.");
    } catch (err) {
      console.error("Error updating proposal:", err);
      alert("No se pudo actualizar en Firebase.");
    }
  };

  // Handle action handlers
  const compileActaText = (data: typeof actaWizardData): string => {
    const getSocioName = (id: string) => {
      const s = socios.find(member => member.id === id);
      return s ? s.nombre : 'Socio no encontrado';
    };

    const invocacionLabel = data.invocacionResponsableType === 'socio' 
      ? getSocioName(data.invocacionSocioId)
      : data.invocacionInvitadoName || 'Invitado especial';

    const saludoLabel = data.saludoResponsableType === 'socio' 
      ? getSocioName(data.saludoSocioId)
      : data.saludoInvitadoName || 'Invitado especial';

    // Attendance (Quorum) Formatting
    const presentNames = (data.asistencia || [])
      .map(id => {
        const s = socios.find(member => member.id === id);
        return s ? s.nombre : null;
      })
      .filter((name): name is string => name !== null)
      .sort((a, b) => a.localeCompare(b));

    let asistenciaSection = '';
    if (presentNames.length === 0) {
      asistenciaSection = 'No se registró asistencia de miembros en esta sesión.\n';
    } else {
      asistenciaSection = 'Se constató la asistencia y el quórum reglamentario de los siguientes miembros:\n' +
        presentNames.map((name, idx) => `   ${idx + 1}. ${name}`).join('\n') +
        `\n\n   Total de miembros presentes: ${presentNames.length} de ${socios.length}.\n`;
    }

    const pendingSols = solicitudes.filter(s => s.estado === 'Pendiente');
    let solicitudesSection = '';
    if (pendingSols.length === 0) {
      solicitudesSection = 'No se conocieron solicitudes en esta sesión.\n';
    } else {
      solicitudesSection = 'Se procedió a dar lectura a las solicitudes ingresadas en el sistema, resolviéndose de la siguiente manera:\n\n';
      pendingSols.forEach((sol, idx) => {
        const res = data.solicitudesResoluciones[sol.id] || { decision: 'Pendiente', razon: '' };
        
        let details = `Solicitud de ${sol.nombre} (Tipo: ${sol.tipo.toUpperCase()})`;
        if (sol.tipo === 'sillas') {
          details = `Solicitud de Silla de Ruedas para el beneficiario ${sol.nombreBeneficiario || sol.nombre} (Solicitante: ${sol.nombreSolicitante || 'N/A'})`;
        }
        
        solicitudesSection += `${idx + 1}. ${details}:\n`;
        solicitudesSection += `   - Decisión: ${res.decision}\n`;
        solicitudesSection += `   - Justificación: ${res.razon || 'Sin justificación registrada.'}\n\n`;
      });
    }

    let agendaSection = '';
    if (data.puntosAgenda && data.puntosAgenda.length > 0) {
      agendaSection = '\nPUNTOS DE AGENDA DISCUTIDOS:\n\n';
      data.puntosAgenda.forEach((p, idx) => {
        const propLabel = p.socioSolicitante ? ` (Solicitado por: ${p.socioSolicitante})` : '';
        agendaSection += `Punto ${idx + 1}: ${p.tema.trim() || 'Sin tema'}${propLabel}\n`;
        agendaSection += `   - Debate: ${p.debate.trim() || 'Sin debate registrado.'}\n`;
        agendaSection += `   - Acuerdo: ${p.acuerdo.trim() || 'Sin acuerdo registrado.'}\n\n`;
      });
    }

    return `En la ciudad de Quetzaltenango, siendo la fecha y hora ${data.fechaHoraText}, se reunieron los miembros en la Sede Social denominada "La Cueva", ubicada en la Calle Rodolfo Robles, 24-53 de la zona 1, con el fin de celebrar la sesión de ${data.categoria} correspondiente, bajo la redacción de este documento.

ASISTENCIA Y QUÓRUM:
${asistenciaSection}
PROTOCOLO DE APERTURA:
1. Invocación: Realizada por ${invocacionLabel}.
2. Saludo a la Bandera: Dirigido por ${saludoLabel}.

LECTURA DE SOLICITUDES:
${solicitudesSection}${agendaSection}
No habiendo más asuntos que tratar, se da por finalizada la presente sesión, procediéndose a la firma de conformidad del acta por los comparecientes en el registro oficial del club.`;
  };

  const handleOpenRedactarActa = () => {
    const defaultLugar = 'Quetzaltenango, Sede Social denominada "La Cueva", ubicada en la Calle Rodolfo Robles, 24-53 de la zona 1.';
    const autoDateTime = getWrittenDateTimeSpanish(new Date());
    
    const initialResoluciones: Record<string, { decision: 'Aprobada' | 'Rechazada' | 'Pendiente', razon: string }> = {};
    const pendingSols = solicitudes.filter(s => s.estado === 'Pendiente');
    pendingSols.forEach(s => {
      initialResoluciones[s.id] = { decision: 'Pendiente', razon: '' };
    });

    setEditingActaId(null);
    setActaWizardData({
      titulo: '',
      categoria: 'Ordinaria',
      lugar: defaultLugar,
      fechaHoraText: autoDateTime,
      invocacionResponsableType: 'socio',
      invocacionSocioId: socios[0]?.id || '',
      invocacionInvitadoName: '',
      saludoResponsableType: 'socio',
      saludoSocioId: socios[0]?.id || '',
      saludoInvitadoName: '',
      solicitudesResoluciones: initialResoluciones,
      puntosAgenda: [],
      asistencia: [],
      numeroActa: (actas.length + 1).toString()
    });
    setSelectedAgendaPointTab('new');
    setActaWizardStep('datos');
    setShowAddActa(true);
  };

  const handleEditActaClick = (acta: Acta) => {
    const defaultLugar = 'Quetzaltenango, Sede Social denominada "La Cueva", ubicada en la Calle Rodolfo Robles, 24-53 de la zona 1.';
    const wData = (acta as any).wizardData || {
      titulo: acta.titulo,
      categoria: acta.categoria || 'Ordinaria',
      lugar: defaultLugar,
      fechaHoraText: getWrittenDateTimeSpanish(new Date(acta.fecha)),
      invocacionResponsableType: 'socio',
      invocacionSocioId: socios[0]?.id || '',
      invocacionInvitadoName: '',
      saludoResponsableType: 'socio',
      saludoSocioId: socios[0]?.id || '',
      saludoInvitadoName: '',
      solicitudesResoluciones: {},
      puntosAgenda: [],
      asistencia: [],
      numeroActa: acta.numeroActa || '1'
    };

    if (!wData.asistencia) {
      wData.asistencia = [];
    }
    if (!wData.numeroActa) {
      wData.numeroActa = acta.numeroActa || '1';
    }

    setActaWizardData(wData);
    setSelectedAgendaPointTab('new');
    setEditingActaId(acta.id);
    setActaWizardStep('datos');
    setShowAddActa(true);
  };

  const handleUpdateAgendaPoint = (index: number, field: 'tema' | 'debate' | 'acuerdo' | 'socioSolicitante' | 'agendaContenido', value: string) => {
    setActaWizardData(prev => {
      const updated = [...(prev.puntosAgenda || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, puntosAgenda: updated };
    });
  };

  const handleAddAgendaPoint = () => {
    const temaFinal = newAgendaPoint.tema.trim() || `Punto de Agenda #${(actaWizardData.puntosAgenda || []).length + 1}`;
    const newPoint = { ...newAgendaPoint, tema: temaFinal };
    setActaWizardData(prev => ({
      ...prev,
      puntosAgenda: [...(prev.puntosAgenda || []), newPoint]
    }));
    setNewAgendaPoint({ 
      tema: '', 
      debate: '', 
      acuerdo: '', 
      socioSolicitante: '', 
      agendaContenido: '' 
    });
    setSelectedAgendaPointTab((actaWizardData.puntosAgenda || []).length);
  };

  const handleRemoveAgendaPoint = (index: number) => {
    setActaWizardData(prev => ({
      ...prev,
      puntosAgenda: (prev.puntosAgenda || []).filter((_, i) => i !== index)
    }));
    setSelectedAgendaPointTab('new');
  };

  const handleSaveStructuredActa = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitulo = actaWizardData.titulo.trim() || `Acta de Sesión - ${new Date().toLocaleDateString('es-GT')}`;

    const president = socios.find((s: any) => s.puesto?.toLowerCase().includes('presidente del club') || s.puesto?.toLowerCase() === 'presidente') || socios.find((s: any) => s.puesto?.toLowerCase().includes('presidente'));
    const presidentName = president ? president.nombre : 'Edwin Ernesto Pacheco López';

    const fechaActa = editingActaId 
      ? actas.find(a => a.id === editingActaId)?.fecha || new Date().toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const numActa = actaWizardData.numeroActa || '1';

    const code = generateActaCode(
      actaWizardData.categoria,
      fechaActa,
      numActa,
      presidentName,
      finalTitulo
    );

    const compiledText = compileActaText({
      ...actaWizardData,
      titulo: finalTitulo
    });
    
    let newActas: Acta[];

    if (editingActaId) {
      newActas = actas.map(a => {
        if (a.id === editingActaId) {
          const updatedItem = {
            ...a,
            titulo: finalTitulo,
            categoria: actaWizardData.categoria,
            contenido: compiledText,
            codigoRegistro: code,
            numeroActa: numActa,
            wizardData: {
              ...actaWizardData,
              titulo: finalTitulo,
              codigoRegistro: code,
              numeroActa: numActa
            }
          } as any;
          // Guardar en Firestore en segundo plano/asíncrono
          firebaseService.saveActa(updatedItem).catch(err => {
            console.error("Error al actualizar acta en Firestore:", err);
          });
          return updatedItem;
        }
        return a;
      });
      alert("¡Acta de sesión actualizada con éxito!");
    } else {
      const created: Acta = {
        id: `acta-${Date.now()}`,
        titulo: finalTitulo,
        fecha: fechaActa,
        contenido: compiledText,
        autor: user.nombre,
        pdfUrl: '#',
        categoria: actaWizardData.categoria,
        estado: 'Publicada',
        codigoRegistro: code,
        numeroActa: numActa,
        wizardData: {
          ...actaWizardData,
          titulo: finalTitulo,
          codigoRegistro: code,
          numeroActa: numActa
        }
      } as any;

      newActas = [created, ...actas];
      // Guardar en Firestore en segundo plano/asíncrono
      firebaseService.saveActa(created).catch(err => {
        console.error("Error al guardar nueva acta en Firestore:", err);
      });
      alert("¡Acta de sesión guardada y solicitudes actualizadas con éxito!");
    }

    setActas(newActas);
    localStorage.setItem('club_leones_actas', JSON.stringify(newActas));

    const pendingSols = solicitudes.filter(s => s.estado === 'Pendiente');
    const updatedSolicitudes = [...solicitudes];
    
    for (const sol of pendingSols) {
      const res = actaWizardData.solicitudesResoluciones[sol.id];
      if (res && (res.decision === 'Aprobada' || res.decision === 'Rechazada')) {
        const updatedSol: Solicitud = {
          ...sol,
          estado: res.decision,
          resolucionRazon: res.razon,
          fechaResolucion: new Date().toISOString()
        };

        try {
          await firebaseService.saveSolicitud(updatedSol);
        } catch (err) {
          console.error(`Error saving resolution for request ${sol.id}:`, err);
        }

        const idx = updatedSolicitudes.findIndex(s => s.id === sol.id);
        if (idx !== -1) {
          updatedSolicitudes[idx] = updatedSol;
        }
      }
    }

    setSolicitudes(updatedSolicitudes);
    localStorage.setItem('club_leones_solicitudes', JSON.stringify(updatedSolicitudes));

    setEditingActaId(null);
    setShowAddActa(false);
  };

  const handleAddActividad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActividad.titulo || !newActividad.fecha || !newActividad.lugar) return;
    setIsSavingActividad(true);
    try {
      let finalImageUrl = newActividad.imagen;
      if (newActividadImageFile) {
        const compressedBase64 = await compressImageFile(newActividadImageFile, 1200, 1200, 0.8);
        finalImageUrl = await firebaseService.uploadGaleriaImage(compressedBase64, 'actividad');
      }

      const created: Actividad = {
        id: `ev-${Date.now()}`,
        titulo: newActividad.titulo,
        descripcion: newActividad.descripcion,
        fecha: newActividad.fecha.replace('T', ' '),
        lugar: newActividad.lugar,
        imagen: finalImageUrl || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=800',
        publica: newActividad.publica,
        conBotonDonacion: newActividad.conBotonDonacion,
        donacionUrl: newActividad.conBotonDonacion ? (newActividad.donacionUrl || '#/donar') : ''
      };

      await firebaseService.saveActividad(created);
      setActividades([created, ...actividades]);
      setNewActividad({ titulo: '', descripcion: '', fecha: '', lugar: '', publica: true, conBotonDonacion: false, donacionUrl: '', imagen: '' });
      setNewActividadImageFile(null);
      setNewActividadImagePreview(null);
      setShowAddActividad(false);
      showAlert("Actividad programada exitosamente", "success");
    } catch (err: any) {
      console.error("Error saving new activity in Firestore:", err);
      showAlert(err.message || "Error al guardar la actividad", "error");
    } finally {
      setIsSavingActividad(false);
    }
  };

  const handleSaveEditedActividad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActividad || !editingActividad.titulo || !editingActividad.fecha || !editingActividad.lugar) return;
    setIsSavingActividad(true);
    try {
      let finalImageUrl = editingActividad.imagen;
      if (editActividadImageFile) {
        const compressedBase64 = await compressImageFile(editActividadImageFile, 1200, 1200, 0.8);
        finalImageUrl = await firebaseService.uploadGaleriaImage(compressedBase64, 'actividad');
      }

      const updated: Actividad = {
        ...editingActividad,
        fecha: editingActividad.fecha.replace('T', ' '),
        imagen: finalImageUrl,
        donacionUrl: editingActividad.conBotonDonacion ? (editingActividad.donacionUrl || '#/donar') : ''
      };

      await firebaseService.saveActividad(updated);
      setActividades(actividades.map(a => a.id === updated.id ? updated : a));
      setEditingActividad(null);
      setEditActividadImageFile(null);
      setEditActividadImagePreview(null);
      setShowEditActividad(false);
      showAlert("Actividad actualizada exitosamente", "success");
    } catch (err: any) {
      console.error("Error saving updated activity in Firestore:", err);
      showAlert(err.message || "Error al actualizar la actividad", "error");
    } finally {
      setIsSavingActividad(false);
    }
  };

  const handleAddDonacion = (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseFloat(newDonacion.monto);
    if (!newDonacion.donante || isNaN(montoNum) || !newDonacion.proyecto) return;
    const created: Donacion = {
      id: `don-${Date.now()}`,
      donante: newDonacion.donante,
      monto: montoNum,
      fecha: new Date().toISOString().split('T')[0],
      proyecto: newDonacion.proyecto,
      tipo: newDonacion.tipo
    };
    setDonaciones([created, ...donaciones]);
    setNewDonacion({ donante: '', monto: '', proyecto: '', tipo: 'Individual' });
    setShowAddDonacion(false);
  };

  const handleAddBeneficio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBeneficio.titulo || !newBeneficio.convenioCon || !newBeneficio.descuento) return;
    const created: Beneficio = {
      id: `ben-${Date.now()}`,
      titulo: newBeneficio.titulo,
      descripcion: newBeneficio.descripcion,
      convenioCon: newBeneficio.convenioCon,
      descuento: newBeneficio.descuento,
      categoria: newBeneficio.categoria
    };
    const updated = [created, ...beneficios];
    setBeneficios(updated);
    localStorage.setItem('club_leones_beneficios', JSON.stringify(updated));
    setNewBeneficio({ titulo: '', descripcion: '', convenioCon: '', descuento: '', categoria: 'Salud' });
    setShowAddBeneficio(false);
  };

  const handleRegistrarPago = (socioId: string) => {
    const socio = socios.find(s => s.id === socioId);
    if (!socio) return;
    setRegistrarPagoData(prev => ({
      ...prev,
      socioId,
      monto: socio.montoPendiente > 0 ? socio.montoPendiente : 100
    }));
    setShowRegistrarPagoModal(true);
  };

  const handleGuardarNuevoPago = async () => {
    const { socioId, tipoPeriodo, mes, año, semestre, monto, metodo, bancoReferencia, numeroReferencia, fechaPago } = registrarPagoData;
    if (!socioId) return;

    const socio = socios.find(s => s.id === socioId);
    if (!socio) return;

    let periodo = '';
    if (tipoPeriodo === 'Mensual') {
      periodo = `${mes} ${año}`;
    } else if (tipoPeriodo === 'Semestral') {
      periodo = `${semestre} ${año}`;
    } else {
      periodo = `Año ${año}`;
    }

    const nuevoPago = {
      id: `pago-${Date.now()}`,
      fechaPago,
      monto: Number(monto),
      periodo,
      tipoPeriodo,
      metodo,
      bancoReferencia: metodo !== 'Efectivo' ? bancoReferencia : undefined,
      numeroReferencia: metodo !== 'Efectivo' ? numeroReferencia : undefined
    };

    const nuevoMontoPendiente = Math.max(0, socio.montoPendiente - Number(monto));
    const nuevoEstadoCuotas = nuevoMontoPendiente === 0 
      ? 'Al día' as const
      : (nuevoMontoPendiente > 200 ? 'En mora' as const : 'Pendiente' as const);

    const updatedSocio: Socio = {
      ...socio,
      estadoCuotas: nuevoEstadoCuotas,
      montoPendiente: nuevoMontoPendiente,
      fechaUltimoPago: fechaPago,
      historialPagos: [nuevoPago, ...(socio.historialPagos || [])]
    };

    const newSocios = socios.map(s => s.id === socioId ? updatedSocio : s);
    setSocios(newSocios);
    localStorage.setItem('club_leones_socios', JSON.stringify(newSocios));

    try {
      await firebaseService.saveSocio(updatedSocio);
    } catch (err) {
      console.error("Error saving socio payment to Firebase:", err);
    }

    setShowRegistrarPagoModal(false);
    setRegistrarPagoData({
      socioId: '',
      tipoPeriodo: 'Mensual',
      mes: 'Enero',
      año: new Date().getFullYear(),
      semestre: '1er Semestre (Ene-Jun)',
      monto: 100,
      metodo: 'Transferencia',
      bancoReferencia: '',
      numeroReferencia: '',
      fechaPago: new Date().toISOString().substring(0, 10)
    });
  };

  const handleEnviarRecordatorio = (socio: Socio) => {
    alert(`Recordatorio de cobro de Q${socio.montoPendiente} enviado por correo a: ${socio.correo}`);
  };

  const handleQrClick = async (socio: Socio) => {
    if (socio.qrToken) {
      setQrSocio(socio);
      return;
    }

    setIsGeneratingQr(true);
    try {
      const token = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      const updatedSocio = { ...socio, qrToken: token };
      await firebaseService.saveSocio(updatedSocio);
      
      const newList = socios.map(s => s.id === socio.id ? updatedSocio : s);
      setSocios(newList);
      localStorage.setItem('club_leones_socios', JSON.stringify(newList));
      
      setQrSocio(updatedSocio);
    } catch (err) {
      console.error("Error generating QR token:", err);
      alert("Error al generar el token del código QR.");
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const handleRegenerarQrToken = async (socioId: string) => {
    const socio = socios.find(s => s.id === socioId);
    if (!socio) return;

    const confirmed = await showConfirm("Regenerar Código QR", "¿Está seguro de regenerar el código QR? El código QR anterior dejará de funcionar inmediatamente para iniciar sesión.", { type: 'warning', confirmText: 'Regenerar', cancelText: 'Cancelar' });
    if (!confirmed) return;

    setIsGeneratingQr(true);
    try {
      const token = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      const updatedSocio = { ...socio, qrToken: token };
      await firebaseService.saveSocio(updatedSocio);
      
      const newList = socios.map(s => s.id === socioId ? updatedSocio : s);
      setSocios(newList);
      localStorage.setItem('club_leones_socios', JSON.stringify(newList));
      
      setQrSocio(updatedSocio);
      alert("Código QR regenerado con éxito. El anterior ha sido invalidado.");
    } catch (err) {
      console.error("Error regenerating QR token:", err);
      alert("Error al regenerar el código QR.");
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const handleDownloadQr = async (socio: Socio) => {
    if (!socio.qrToken) return;
    
    const qrUrl = window.location.origin + window.location.pathname + '#/login?qr_token=' + socio.qrToken;
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(qrUrl)}`;
    
    try {
      const response = await fetch(apiUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `QR_Acceso_${socio.nombre.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Error downloading QR image blob:", err);
      // Fallback
      window.open(apiUrl, '_blank');
    }
  };

  const handleUpdateSolicitudStatus = async (solicitudId: string, nuevoEstado: 'Aprobada' | 'Rechazada') => {
    const solicitud = solicitudes.find(s => s.id === solicitudId);
    if (!solicitud) return;

    const updated: Solicitud = {
      ...solicitud,
      estado: nuevoEstado,
      faseTracking: 'resolucion'
    };

    try {
      await firebaseService.saveSolicitud(updated);
      const newList = solicitudes.map(s => s.id === solicitudId ? updated : s);
      setSolicitudes(newList);
      alert(`La solicitud ha sido ${nuevoEstado.toLowerCase()} exitosamente.`);
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Error al actualizar el estado de la solicitud.");
    }
  };

  const handleUpdateTrackingPhase = async (solicitudId: string, nuevaFase: 'recibido' | 'en_proceso' | 'en_analisis' | 'resolucion') => {
    const solicitud = solicitudes.find(s => s.id === solicitudId);
    if (!solicitud) return;

    const updated: Solicitud = {
      ...solicitud,
      faseTracking: nuevaFase
    };

    try {
      await firebaseService.saveSolicitud(updated);
      const newList = solicitudes.map(s => s.id === solicitudId ? updated : s);
      setSolicitudes(newList);
      alert("Fase de seguimiento actualizada.");
    } catch (err) {
      console.error("Error updating tracking phase:", err);
      alert("Error al actualizar la fase de seguimiento.");
    }
  };

  const handleToggleArchiveSolicitud = async (solicitudId: string, newArchivedState: boolean) => {
    const solicitud = solicitudes.find(s => s.id === solicitudId);
    if (!solicitud) return;

    const updated: Solicitud = {
      ...solicitud,
      archivada: newArchivedState
    };

    try {
      await firebaseService.saveSolicitud(updated);
      const newList = solicitudes.map(s => s.id === solicitudId ? updated : s);
      setSolicitudes(newList);
      alert(newArchivedState ? "La solicitud ha sido enviada al archivo." : "La solicitud ha sido restaurada a la lista activa.");
    } catch (err) {
      console.error("Error toggling archive status:", err);
      alert("Error al cambiar el estado de archivo de la solicitud.");
    }
  };

  const handleDeleteSolicitud = async (solicitudId: string) => {
    if (!(await showConfirm("Eliminar Solicitud", "¿Está seguro de eliminar esta solicitud permanentemente? Esta acción no se puede deshacer.", { type: 'danger', confirmText: 'Eliminar', cancelText: 'Cancelar' }))) {
      return;
    }

    try {
      await firebaseService.deleteSolicitud(solicitudId);
      const newList = solicitudes.filter(s => s.id !== solicitudId);
      setSolicitudes(newList);
      alert("Solicitud eliminada correctamente.");
    } catch (err) {
      console.error("Error deleting solicitud:", err);
      alert("Error al eliminar la solicitud en Firebase.");
    }
  };

  // ================= AGENDAS DE REUNIÓN =================

  const handleCreateAgenda = () => {
    const defaultPresident = (socios || []).find(s => 
      s.puesto?.toLowerCase().includes('presidente del club') || 
      s.puesto?.toLowerCase() === 'presidente' || 
      s.puesto?.toLowerCase().includes('presidente')
    )?.nombre || 'Edwin Ernesto Pacheco López';

    setEditingAgenda(null);
    setAgendaForm({
      titulo: '',
      fecha: new Date().toISOString().split('T')[0],
      hora: '08:00',
      lugar: 'Sede del Club',
      puntos: [],
      categoria: 'ordinaria',
      presidencia: defaultPresident
    });
    setAgendaFormError('');
    setSelectedComisionForPunto({});
    setUrgenciaForPunto({});
    setFechaLimiteForPunto({});
    setShowComisionConfigForPunto({});
    setShowAgendaForm(true);
  };

  const handleEditAgenda = (agenda: ReunionAgenda) => {
    const defaultPresident = (socios || []).find(s => 
      s.puesto?.toLowerCase().includes('presidente del club') || 
      s.puesto?.toLowerCase() === 'presidente' || 
      s.puesto?.toLowerCase().includes('presidente')
    )?.nombre || 'Edwin Ernesto Pacheco López';

    setEditingAgenda(agenda);
    setAgendaForm({
      id: agenda.id,
      titulo: agenda.titulo,
      fecha: agenda.fecha,
      hora: agenda.hora,
      lugar: agenda.lugar,
      puntos: [...agenda.puntos],
      categoria: agenda.categoria || 'ordinaria',
      presidencia: agenda.presidencia || defaultPresident
    });
    setAgendaFormError('');
    
    // Initialize points config states
    const selCom: {[key: string]: string} = {};
    const urg: {[key: string]: 'Alta' | 'Media' | 'Baja'} = {};
    const flim: {[key: string]: string} = {};
    const showCfg: {[key: string]: boolean} = {};
    
    agenda.puntos.forEach(p => {
      if (p.asignadoAComisionId) {
        selCom[p.id] = p.asignadoAComisionId;
        urg[p.id] = p.urgencia || 'Media';
        flim[p.id] = p.fechaLimite || '';
        showCfg[p.id] = true;
      }
    });
    
    setSelectedComisionForPunto(selCom);
    setUrgenciaForPunto(urg);
    setFechaLimiteForPunto(flim);
    setShowComisionConfigForPunto(showCfg);
    
    setShowAgendaForm(true);
  };

  const handleDeleteAgenda = async (id: string) => {
    const confirmed = await showConfirm(
      'Confirmar Eliminación',
      '¿Estás seguro de eliminar esta agenda? Se eliminarán también las tareas de comisiones pendientes asociadas a ella.',
      { type: 'danger', confirmText: 'Eliminar', cancelText: 'Cancelar' }
    );
    if (confirmed) {
      try {
        await firebaseService.deleteAgenda(id);
        
        // Also delete tasks of comisions associated with this agenda
        const tasks = (tareasComisiones || []).filter(t => t.agendaId === id);
        for (const t of tasks) {
          await firebaseService.deleteTareaComision(t.id);
        }
        showAlert('Agenda Eliminada', 'La agenda se eliminó correctamente.');
      } catch (err: any) {
        console.error(err);
        showAlert('Error', 'No se pudo eliminar la agenda.');
      }
    }
  };

  const handleSaveAgendaSubmit = async (estado: 'Borrador' | 'Finalizada') => {
    if (!agendaForm.titulo.trim()) {
      setAgendaFormError('Por favor, ingresa un título para la reunión.');
      return;
    }
    if (!agendaForm.fecha) {
      setAgendaFormError('Por favor, ingresa una fecha.');
      return;
    }
    if (!agendaForm.hora) {
      setAgendaFormError('Por favor, ingresa una hora.');
      return;
    }
    if (!agendaForm.lugar.trim()) {
      setAgendaFormError('Por favor, ingresa un lugar de reunión.');
      return;
    }
    if (agendaForm.puntos.length === 0) {
      setAgendaFormError('Por favor, agrega al menos un punto de agenda.');
      return;
    }
    if (agendaForm.puntos.some(p => !p.titulo.trim())) {
      setAgendaFormError('Todos los puntos de la agenda deben tener un título.');
      return;
    }
    
    setIsSavingAgenda(true);
    setAgendaFormError('');
    
    try {
      const agendaId = agendaForm.id || `agenda-${Date.now()}`;
      
      // Update points with comision data if set
      const processedPuntos = agendaForm.puntos.map(p => {
        const comId = selectedComisionForPunto[p.id];
        const isAssigned = showComisionConfigForPunto[p.id] && comId;
        const comision = isAssigned ? comisiones.find(c => c.id === comId) : undefined;
        const punto: Record<string, any> = {
          id: p.id,
          titulo: p.titulo,
          descripcion: p.descripcion || '',
          origenTipo: p.origenTipo || 'manual',
          agregadoAActas: p.agregadoAActas !== false
        };
        if (p.origenId) punto.origenId = p.origenId;
        if (p.proponenteNombre) punto.proponenteNombre = p.proponenteNombre;
        if (p.proponenteSocioId) punto.proponenteSocioId = p.proponenteSocioId;
        if (isAssigned && comId) {
          punto.asignadoAComisionId = comId;
          if (comision) punto.comisionNombre = comision.nombre;
          punto.urgencia = urgenciaForPunto[p.id] || 'Media';
          if (fechaLimiteForPunto[p.id]) punto.fechaLimite = fechaLimiteForPunto[p.id];
        }
        return punto;
      });
      
      const dateStr = agendaForm.fecha ? agendaForm.fecha.replace(/[^0-9]/g, '') : '';
      let agendaCode = editingAgenda?.codigo;
      
      if (!agendaCode || !agendaCode.startsWith(`AG-${dateStr}-`)) {
        const otherAgendas = (agendas || []).filter(a => a.id !== agendaId);
        const correlative = otherAgendas.length + 1;
        const padCorrelative = String(correlative).padStart(3, '0');
        agendaCode = `AG-${dateStr}-${padCorrelative}`;
      }
      
      const agendaObj: ReunionAgenda = {
        id: agendaId,
        titulo: agendaForm.titulo.trim(),
        fecha: agendaForm.fecha,
        hora: agendaForm.hora,
        lugar: agendaForm.lugar.trim(),
        puntos: processedPuntos,
        estado: estado,
        fechaCreacion: editingAgenda ? editingAgenda.fechaCreacion : new Date().toISOString().split('T')[0],
        autor: user.nombre || 'Administrador',
        categoria: agendaForm.categoria || 'ordinaria',
        codigo: agendaCode,
        presidencia: agendaForm.presidencia.trim() || 'Edwin Ernesto Pacheco López'
      };
      
      await firebaseService.saveAgenda(agendaObj);
      
      // If Finalizada, create/sync commission tasks
      if (estado === 'Finalizada') {
        // Clean up old pending tasks first
        const oldTasks = (tareasComisiones || []).filter(t => t.agendaId === agendaId && t.estado === 'Pendiente');
        for (const ot of oldTasks) {
          await firebaseService.deleteTareaComision(ot.id);
        }
        
        // Write new tasks for points that are assigned to a commission
        for (const pt of processedPuntos) {
          if (pt.asignadoAComisionId) {
            const task: TareaComision = {
              id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              comisionId: pt.asignadoAComisionId,
              agendaId: agendaId,
              agendaPuntoId: pt.id,
              punto: pt.titulo,
              descripcion: pt.descripcion || '',
              fechaAsignacion: new Date().toISOString().split('T')[0],
              fechaLimite: pt.fechaLimite,
              urgencia: pt.urgencia || 'Media',
              estado: 'Pendiente'
            };
            await firebaseService.saveTareaComision(task);
          }
        }
      }
      
      setShowAgendaForm(false);
      showAlert('Éxito', `La agenda se guardó como ${estado} correctamente.`);
    } catch (err: any) {
      console.error(err);
      setAgendaFormError(err.message || 'Error al guardar la agenda.');
    } finally {
      setIsSavingAgenda(false);
    }
  };

  const handleImportSolicitud = (sol: Solicitud) => {
    // Check if already imported
    if (agendaForm.puntos.some(p => p.origenId === sol.id)) {
      // Remove it
      setAgendaForm(prev => ({
        ...prev,
        puntos: prev.puntos.filter(p => p.origenId !== sol.id)
      }));
      return;
    }
    
    let tituloPunto = sol.nombre;
    if (sol.tipo === 'sillas' && sol.nombreBeneficiario) {
      tituloPunto = `Donación de Silla: ${sol.nombreBeneficiario}`;
    } else if (sol.tipo === 'salon' && sol.salonNombreSolicitante) {
      tituloPunto = `Préstamo de Salón: ${sol.salonNombreSolicitante}`;
    } else if (sol.tipo === 'agenda' && sol.agendaNombrePunto) {
      tituloPunto = sol.agendaNombrePunto;
    }
    
    let descPunto = sol.descripcion || '';
    if (sol.tipo === 'agenda' && sol.agendaContenido) {
      descPunto = sol.agendaContenido;
    }
    
    const proponenteName = (sol.tipo === 'agenda' && sol.agendaSocioNombre) 
      ? sol.agendaSocioNombre 
      : sol.nombre || '';

    const nuevoPunto: AgendaPunto = {
      id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      titulo: tituloPunto,
      descripcion: descPunto,
      origenTipo: 'solicitud',
      origenId: sol.id,
      proponenteNombre: proponenteName,
      agregadoAActas: true
    };
    
    setAgendaForm(prev => ({
      ...prev,
      puntos: [...prev.puntos, nuevoPunto]
    }));
  };

  const handleUpdatePuntoField = (id: string, field: keyof AgendaPunto, value: any) => {
    setAgendaForm(prev => ({
      ...prev,
      puntos: prev.puntos.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const handleRemovePuntoField = (id: string) => {
    setAgendaForm(prev => ({
      ...prev,
      puntos: prev.puntos.filter(p => p.id !== id)
    }));
  };

  const handleMovePunto = (index: number, direction: 'up' | 'down') => {
    const list = [...agendaForm.puntos];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    
    // Swap
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    
    setAgendaForm(prev => ({
      ...prev,
      puntos: list
    }));
  };

  const handleOpenReorderModal = (agenda: ReunionAgenda) => {
    setReorderingAgenda(agenda);
    setReorderingPuntos([...(agenda.puntos || [])]);
  };

  const handleMoveReorderPunto = (index: number, direction: 'up' | 'down') => {
    const list = [...reorderingPuntos];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    setReorderingPuntos(list);
  };

  const handleSaveReorderPuntos = async () => {
    if (!reorderingAgenda) return;
    setIsSavingReorder(true);
    try {
      const updatedAgenda: ReunionAgenda = {
        ...reorderingAgenda,
        puntos: reorderingPuntos
      };
      await firebaseService.saveAgenda(updatedAgenda);

      // If we are currently editing this agenda in the form, sync agendaForm.puntos
      if (agendaForm.id === reorderingAgenda.id) {
        setAgendaForm(prev => ({
          ...prev,
          puntos: reorderingPuntos
        }));
      }

      showToast("Orden de los puntos actualizado correctamente", "success");
      setReorderingAgenda(null);
    } catch (e) {
      console.error("Error al guardar reordenamiento de puntos:", e);
      showToast("Error al guardar el nuevo orden de los puntos", "error");
    } finally {
      setIsSavingReorder(false);
    }
  };

  const handleAddManualPunto = () => {
    const nuevoPunto: AgendaPunto = {
      id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      titulo: '',
      descripcion: '',
      origenTipo: 'manual',
      agregadoAActas: true
    };
    setAgendaForm(prev => ({
      ...prev,
      puntos: [...prev.puntos, nuevoPunto]
    }));
  };

  const handleLoadStandardAgendaTemplate = () => {
    const puntosEstandar: AgendaPunto[] = [
      { id: `p-std-1-${Date.now()}`, titulo: '1. Invocación Leonística y Saludo a la Bandera', descripcion: 'Lectura de la invocación oficial y respeto a los símbolos patrios y leoneses.', origenTipo: 'manual', agregadoAActas: true },
      { id: `p-std-2-${Date.now()}`, titulo: '2. Lectura y Aprobación del Acta de la Sesión Anterior', descripcion: 'Revisión de observaciones y firma del acta previa por Secretaría.', origenTipo: 'manual', agregadoAActas: true },
      { id: `p-std-3-${Date.now()}`, titulo: '3. Informe de la Presidencia', descripcion: 'Mensaje de la Presidencia sobre avances, correspondencia recibida y eventos distritales.', origenTipo: 'manual', agregadoAActas: true },
      { id: `p-std-4-${Date.now()}`, titulo: '4. Informes de Tesorería y Comisiones de Trabajo', descripcion: 'Presentación del estado financiero y reportes de comisiones de servicio e inventario.', origenTipo: 'manual', agregadoAActas: true },
      { id: `p-std-5-${Date.now()}`, titulo: '5. Asuntos Pendientes y Nuevos Proyectos de Servicio', descripcion: 'Debate de propuestas aprobadas y coordinación de próximas actividades del club.', origenTipo: 'manual', agregadoAActas: true },
      { id: `p-std-6-${Date.now()}`, titulo: '6. Asuntos Varios y Palabras Libres de los Socios', descripcion: 'Espacio para sugerencias, felicitaciones y avisos generales.', origenTipo: 'manual', agregadoAActas: true },
      { id: `p-std-7-${Date.now()}`, titulo: '7. Clausura de la Sesión', descripcion: 'Palabras finales y toque de campana por la Presidencia.', origenTipo: 'manual', agregadoAActas: true }
    ];
    setAgendaForm(prev => ({
      ...prev,
      puntos: [...prev.puntos, ...puntosEstandar]
    }));
    showToast("Plantilla con orden del día leonístico cargada exitosamente", "info");
  };

  // Filter requests that can be imported to the agenda
  const availableRequestsToImport = useMemo(() => {
    return solicitudes.filter(sol => {
      // Exclude archived requests
      if (sol.archivada) return false;

      // Exclude rejected requests
      if (sol.estado === 'Rechazado' || sol.estado === 'Rechazada') return false;
      
      // Exclude already imported requests
      const isAlreadyImported = agendaForm.puntos.some(p => p.origenId === sol.id);
      if (isAlreadyImported) return false;
      
      // Filter by selected category (if any)
      if (importFilterType && sol.tipo !== importFilterType) return false;
      
      return true;
    });
  }, [solicitudes, agendaForm.puntos, importFilterType]);

  const handleImportSelectedRequest = () => {
    if (!importSelectedRequestId) return;
    const req = solicitudes.find(r => r.id === importSelectedRequestId);
    if (req) {
      handleImportSolicitud(req);
      setImportSelectedRequestId(''); // Reset selection after importing
    }
  };

  const renderPresidenciaModulo = () => {
    return (
      <div className="space-y-6 w-full text-left">
        {/* Sub-Tabs Navigation */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setPresidenciaSubTab('solicitudes')}
            className={`py-3 px-6 text-sm font-black transition-all border-b-2 cursor-pointer ${
              presidenciaSubTab === 'solicitudes'
                ? 'border-blue-900 text-blue-900 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-blue-900'
            }`}
          >
            Gestión de Solicitudes
          </button>
          <button
            type="button"
            onClick={() => setPresidenciaSubTab('agendas')}
            className={`py-3 px-6 text-sm font-black transition-all border-b-2 cursor-pointer flex items-center space-x-2 ${
              presidenciaSubTab === 'agendas'
                ? 'border-blue-900 text-blue-900 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-blue-900'
            }`}
          >
            <span>Agendas de Reunión</span>
            <span className="bg-blue-100 text-blue-800 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
              Nuevo
            </span>
          </button>
        </div>

        {presidenciaSubTab === 'solicitudes' ? (
          renderControlSolicitudesList()
        ) : (
          renderAgendasModulo()
        )}
      </div>
    );
  };

  const renderAgendasModulo = () => {
    if (showAgendaForm) {
      return (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-black text-blue-900">
                {agendaForm.id ? 'Editar Agenda de Reunión' : 'Crear Agenda de Reunión'}
              </h3>
              <p className="text-xs text-slate-550 mt-1">
                Define los detalles de la sesión, añade puntos de debate y asigna comisiones de trabajo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAgendaForm(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-black text-slate-550 hover:bg-slate-50 transition-all cursor-pointer flex items-center space-x-1.5 self-start"
            >
              <XIcon size={14} />
              <span>Cancelar</span>
            </button>
          </div>

          {agendaFormError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start space-x-3 text-red-700 text-sm animate-in fade-in">
              <AlertCircle className="flex-shrink-0 mt-0.5 animate-bounce" size={18} />
              <span className="font-semibold">{agendaFormError}</span>
            </div>
          )}

          <div className="space-y-6">
            {/* Información General */}
            <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Información General de la Sesión</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest ml-1 mb-1 block">Título de la Reunión</label>
                  <input
                    type="text"
                    required
                    value={agendaForm.titulo}
                    onChange={(e) => setAgendaForm({ ...agendaForm, titulo: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                    placeholder="Ej. Sesión Ordinaria de Junta Directiva #15"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest ml-1 mb-1 block">Bajo la Presidencia de</label>
                  <input
                    type="text"
                    required
                    value={agendaForm.presidencia}
                    onChange={(e) => setAgendaForm({ ...agendaForm, presidencia: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                    placeholder="Ej. Edwin Ernesto Pacheco López"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest ml-1 mb-1 block">Fecha</label>
                  <input
                    type="date"
                    required
                    value={agendaForm.fecha}
                    onChange={(e) => setAgendaForm({ ...agendaForm, fecha: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest ml-1 mb-1 block">Hora</label>
                  <input
                    type="time"
                    required
                    value={agendaForm.hora}
                    onChange={(e) => setAgendaForm({ ...agendaForm, hora: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest ml-1 mb-1 block">Lugar</label>
                  <input
                    type="text"
                    required
                    value={agendaForm.lugar}
                    onChange={(e) => setAgendaForm({ ...agendaForm, lugar: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                    placeholder="Ej. Sede del Club"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest ml-1 mb-1 block">Tipo de Agenda</label>
                  <select
                    value={agendaForm.categoria || 'ordinaria'}
                    onChange={(e) => setAgendaForm({ ...agendaForm, categoria: e.target.value as any })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent cursor-pointer"
                  >
                    <option value="ordinaria">📝 Ordinaria</option>
                    <option value="extraordinaria">⚡ Extraordinaria</option>
                    <option value="protocolaria">🍷 Protocolaria (Social)</option>
                    <option value="comisiones">👥 Para Comisiones</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sección de Importación Horizontal */}
            <div className="bg-blue-50/30 border border-blue-200/50 p-5 rounded-2xl space-y-4">
              <div>
                <h4 className="font-extrabold text-blue-900 text-sm flex items-center space-x-1.5">
                  <Layers size={14} className="text-blue-900" />
                  <span>Importar desde Solicitudes / Puntos de Socios</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Agrega temas de solicitudes aprobadas o propuestas de socios directamente a la agenda.
                </p>
              </div>

              <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3.5">
                <div className="flex-1">
                  <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest ml-1 mb-1 block">Filtrar por Categoría</label>
                  <select
                    value={importFilterType}
                    onChange={(e) => {
                      setImportFilterType(e.target.value);
                      setImportSelectedRequestId(''); // Reset on change
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-900 outline-none cursor-pointer"
                  >
                    <option value="">-- Todas las Categorías --</option>
                    <option value="sillas">♿ Sillas de Ruedas</option>
                    <option value="abiertas">🔓 Solicitudes Abiertas</option>
                    <option value="internas">🔒 Solicitudes Internas</option>
                    <option value="salon">🏛️ Salón y Parqueo</option>
                    <option value="agenda">💬 Puntos de Agenda (Socios)</option>
                  </select>
                </div>

                <div className="flex-[2]">
                  <label className="text-[9px] font-black text-slate-455 uppercase tracking-widest ml-1 mb-1 block">Seleccione Solicitud / Propuesta</label>
                  <select
                    value={importSelectedRequestId}
                    onChange={(e) => setImportSelectedRequestId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-900 outline-none cursor-pointer"
                  >
                    <option value="">
                      {availableRequestsToImport.length === 0
                        ? "No hay solicitudes disponibles para importar"
                        : "-- Seleccione una opción para importar --"}
                    </option>
                    {availableRequestsToImport.map(r => {
                      let label = r.nombre;
                      if (r.tipo === 'sillas' && r.nombreBeneficiario) {
                        label = `♿ Silla - Beneficiario: ${r.nombreBeneficiario}`;
                      } else if (r.tipo === 'salon' && r.salonNombreSolicitante) {
                        label = `🏛️ Salón/Parqueo - Solicitante: ${r.salonNombreSolicitante} (${r.salonDia})`;
                      } else if (r.tipo === 'agenda' && r.agendaNombrePunto) {
                        label = `💬 Agenda Socio: ${r.agendaNombrePunto} (${r.agendaSocioNombre || 'Socio'})`;
                      } else {
                        const typeLabels = { abiertas: '🔓 Abierta', internas: '🔒 Interna' };
                        label = `${typeLabels[r.tipo] || r.tipo} - ${r.nombre}`;
                      }
                      if (label.length > 80) label = label.slice(0, 80) + '...';
                      return (
                        <option key={r.id} value={r.id}>{label}</option>
                      );
                    })}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleImportSelectedRequest}
                  disabled={!importSelectedRequestId}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-850 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer h-[36px] md:self-end"
                >
                  <Plus size={14} />
                  <span>Importar Punto</span>
                </button>
              </div>
            </div>

            {/* Listado de Puntos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-extrabold text-blue-900 text-sm flex items-center space-x-2">
                  <span className="bg-blue-100 text-blue-800 text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">1</span>
                  <span>Puntos del Orden del Día ({agendaForm.puntos.length})</span>
                </h4>
                <div className="flex items-center space-x-2">
                  {agendaForm.puntos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setReorderingAgenda(editingAgenda || ({ id: agendaForm.id || 'temp', titulo: agendaForm.titulo || 'Nueva Agenda', fecha: agendaForm.fecha, hora: agendaForm.hora, lugar: agendaForm.lugar, puntos: agendaForm.puntos, estado: 'Borrador', fechaCreacion: '', autor: '', codigo: '' } as any));
                        setReorderingPuntos([...agendaForm.puntos]);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-black rounded-lg transition-all flex items-center space-x-1 cursor-pointer shadow-2xs"
                      title="Abrir vista modal rápida para reordenar puntos"
                    >
                      <ArrowUpDown size={12} />
                      <span>Reordenar Puntos</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleLoadStandardAgendaTemplate}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-black rounded-lg transition-all flex items-center space-x-1 cursor-pointer shadow-xs"
                    title="Cargar los 7 puntos estándar del protocolo leonístico"
                  >
                    <FileText size={12} />
                    <span>Plantilla Leonística</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddManualPunto}
                    className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 text-[11px] font-black rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Añadir Punto Manual</span>
                  </button>
                </div>
              </div>

              {agendaForm.puntos.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-2 animate-in fade-in">
                  <p className="text-xs text-slate-400 font-bold">La agenda no tiene puntos definidos aún.</p>
                  <p className="text-[11px] text-slate-400">
                    Usa el botón para añadir un punto manual o selecciona una solicitud arriba para importarla.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {agendaForm.puntos.map((p, index) => {
                    return (
                      <div
                        key={p.id}
                        className="bg-white border border-slate-200/90 hover:border-blue-300 p-3.5 sm:p-4 rounded-2xl relative space-y-2.5 shadow-xs transition-all animate-in slide-in-from-bottom-2 duration-300"
                      >
                        {/* Header row: badge, tags & actions */}
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-black bg-blue-900 text-white w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                              {index + 1}
                            </span>
                            {p.origenTipo === 'solicitud' && (
                              <span className="text-[9px] font-black bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Vinculado a Solicitud
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMovePunto(index, 'up')}
                              className="px-2 py-1 bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-700 rounded-lg text-[10px] font-bold transition-all disabled:opacity-30 disabled:hover:bg-slate-100 disabled:hover:text-slate-700 flex items-center space-x-0.5 cursor-pointer"
                              title="Subir posición del punto"
                            >
                              <ArrowUp size={11} />
                              <span>Subir</span>
                            </button>
                            <button
                              type="button"
                              disabled={index === agendaForm.puntos.length - 1}
                              onClick={() => handleMovePunto(index, 'down')}
                              className="px-2 py-1 bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-700 rounded-lg text-[10px] font-bold transition-all disabled:opacity-30 disabled:hover:bg-slate-100 disabled:hover:text-slate-700 flex items-center space-x-0.5 cursor-pointer"
                              title="Bajar posición del punto"
                            >
                              <ArrowDown size={11} />
                              <span>Bajar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemovePuntoField(p.id)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer ml-1"
                              title="Eliminar punto"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Main Form Fields Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {/* Título (2 cols) */}
                          <div className="sm:col-span-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                              Título del Punto *
                            </label>
                            <input
                              type="text"
                              required
                              value={p.titulo}
                              onChange={(e) => handleUpdatePuntoField(p.id, 'titulo', e.target.value)}
                              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-900 outline-none"
                              placeholder="Ej. Presentación del informe financiero mensual"
                            />
                          </div>

                          {/* Proponente (1 col - Socio u Opción Abierta Terceros) */}
                          <div>
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                              Proponente <span className="text-[8px] font-normal text-slate-400">(Opcional)</span>
                            </label>
                            <div className="space-y-1">
                              <select
                                value={
                                  p.proponenteSocioId 
                                    ? p.proponenteSocioId 
                                    : p.proponenteNombre 
                                    ? 'custom' 
                                    : ''
                                }
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === 'custom') {
                                    handleUpdatePuntoField(p.id, 'proponenteSocioId', '');
                                    if (!p.proponenteNombre) handleUpdatePuntoField(p.id, 'proponenteNombre', 'Tercero / Persona Externa');
                                  } else if (val) {
                                    const matchedSocio = socios.find(s => s.id === val);
                                    handleUpdatePuntoField(p.id, 'proponenteSocioId', val);
                                    handleUpdatePuntoField(p.id, 'proponenteNombre', matchedSocio ? matchedSocio.nombre : '');
                                  } else {
                                    handleUpdatePuntoField(p.id, 'proponenteSocioId', '');
                                    handleUpdatePuntoField(p.id, 'proponenteNombre', '');
                                  }
                                }}
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-900 outline-none cursor-pointer"
                              >
                                <option value="">-- Sin proponente --</option>
                                <optgroup label="Socios del Club">
                                  {socios.map(s => (
                                    <option key={s.id} value={s.id}>{s.nombre} ({s.puesto || 'Socio'})</option>
                                  ))}
                                </optgroup>
                                <option value="custom">✍️ Otro / Persona Externa (Texto libre)</option>
                              </select>

                              {(!p.proponenteSocioId && (p.proponenteNombre || p.proponenteNombre === '')) && (
                                <input
                                  type="text"
                                  value={p.proponenteNombre || ''}
                                  onChange={(e) => handleUpdatePuntoField(p.id, 'proponenteNombre', e.target.value)}
                                  className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-800 focus:ring-2 focus:ring-blue-900 outline-none animate-in fade-in"
                                  placeholder="Escriba nombre del proponente o entidad..."
                                />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Descripción */}
                        <div>
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                            Descripción / Breves Antecedentes
                          </label>
                          <textarea
                            rows={1}
                            value={p.descripcion}
                            onChange={(e) => handleUpdatePuntoField(p.id, 'descripcion', e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-900 outline-none resize-y min-h-[34px]"
                            placeholder="Resumen o contexto..."
                          />
                        </div>

                        {/* Row 3: Checkboxes & Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`toggle-comision-${p.id}`}
                              checked={!!showComisionConfigForPunto[p.id]}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setShowComisionConfigForPunto(prev => ({ ...prev, [p.id]: checked }));
                                if (checked) {
                                  const firstCom = comisiones.filter(c => c.estado === 'Activa')[0]?.id || '';
                                  setSelectedComisionForPunto(prev => ({ ...prev, [p.id]: firstCom }));
                                  setUrgenciaForPunto(prev => ({ ...prev, [p.id]: 'Media' }));
                                  setFechaLimiteForPunto(prev => ({ ...prev, [p.id]: new Date(Date.now() + 7 * 24 * 365 * 240).toISOString().split('T')[0] }));
                                } else {
                                  setSelectedComisionForPunto(prev => { const c = { ...prev }; delete c[p.id]; return c; });
                                  setUrgenciaForPunto(prev => { const c = { ...prev }; delete c[p.id]; return c; });
                                  setFechaLimiteForPunto(prev => { const c = { ...prev }; delete c[p.id]; return c; });
                                }
                              }}
                              className="rounded text-blue-900 focus:ring-blue-900 w-3.5 h-3.5 cursor-pointer"
                            />
                            <label htmlFor={`toggle-comision-${p.id}`} className="text-[11px] font-bold text-slate-700 cursor-pointer">
                              Asignar a Comisión
                            </label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`toggle-actas-${p.id}`}
                              checked={p.agregadoAActas !== false}
                              onChange={(e) => handleUpdatePuntoField(p.id, 'agregadoAActas', e.target.checked)}
                              className="rounded text-blue-900 focus:ring-blue-900 w-3.5 h-3.5 cursor-pointer"
                            />
                            <label htmlFor={`toggle-actas-${p.id}`} className="text-[11px] font-bold text-slate-700 cursor-pointer">
                              Pre-cargar en Actas
                            </label>
                          </div>
                        </div>

                        {/* Optional Subpanel for Commission Settings */}
                        {showComisionConfigForPunto[p.id] && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 bg-slate-50/80 p-2.5 rounded-xl animate-in slide-in-from-top-1 duration-200">
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Comisión</label>
                              <select
                                value={selectedComisionForPunto[p.id] || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSelectedComisionForPunto(prev => ({ ...prev, [p.id]: val }));
                                }}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none"
                              >
                                <option value="">-- Seleccionar --</option>
                                {comisiones.filter(c => c.estado === 'Activa').map(c => (
                                  <option key={c.id} value={c.id}>{c.nombre}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Urgencia</label>
                              <select
                                value={urgenciaForPunto[p.id] || 'Media'}
                                onChange={(e) => {
                                  const val = e.target.value as 'Alta' | 'Media' | 'Baja';
                                  setUrgenciaForPunto(prev => ({ ...prev, [p.id]: val }));
                                }}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none"
                              >
                                <option value="Alta">Alta 🚨</option>
                                <option value="Media">Media ⚠️</option>
                                <option value="Baja">Baja 📋</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Fecha Límite</label>
                              <input
                                type="date"
                                value={fechaLimiteForPunto[p.id] || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFechaLimiteForPunto(prev => ({ ...prev, [p.id]: val }));
                                }}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Botones de Envío */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                disabled={isSavingAgenda}
                onClick={() => handleSaveAgendaSubmit('Borrador')}
                className="px-5 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-black transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {isSavingAgenda ? <Loader2 className="animate-spin" size={14} /> : null}
                <span>Guardar Borrador</span>
              </button>
              <button
                type="button"
                disabled={isSavingAgenda}
                onClick={() => handleSaveAgendaSubmit('Finalizada')}
                className="px-6 py-3 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl text-xs font-black shadow-md shadow-blue-900/10 hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {isSavingAgenda ? <Loader2 className="animate-spin" size={14} /> : null}
                <span>Publicar y Finalizar Agenda</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // List View of Agendas
    const sortedAgendas = [...(agendas || [])].sort((a, b) => b.fecha.localeCompare(a.fecha));

    const categoryConfig: {
      [key: string]: {
        label: string;
        badgeClass: string;
        borderClass: string;
      }
    } = {
      ordinaria: {
        label: '📝 Ordinaria',
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
        borderClass: 'border-t-4 border-t-blue-500 border-slate-200/80'
      },
      extraordinaria: {
        label: '⚡ Extraordinaria',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        borderClass: 'border-t-4 border-t-amber-500 border-slate-200/80'
      },
      protocolaria: {
        label: '🍷 Protocolaria',
        badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
        borderClass: 'border-t-4 border-t-purple-500 border-slate-200/80'
      },
      comisiones: {
        label: '👥 De Comisión',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        borderClass: 'border-t-4 border-t-emerald-500 border-slate-200/80'
      }
    };

    return (
      <div className="space-y-6 w-full text-left">
        {/* Header section with Create Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
          <div>
            <h3 className="text-base font-black text-blue-900">Historial de Agendas de Reunión</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Consulte agendas registradas, descargue el documento oficial en PDF o elabore una nueva agenda desde cero.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreateAgenda}
            className="px-5 py-3 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl text-xs font-black shadow-md shadow-blue-900/10 hover:shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer self-start sm:self-center"
          >
            <Plus size={14} />
            <span>Crear Agenda</span>
          </button>
        </div>

        {sortedAgendas.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center mx-auto">
              <FileText size={24} />
            </div>
            <h4 className="text-sm font-black text-slate-700">No hay agendas de reunión registradas</h4>
            <p className="text-xs text-slate-450 max-w-sm mx-auto">
              Comience por redactar la agenda para la próxima sesión del club. Podrá vincular propuestas de los socios e importarlas en un clic.
            </p>
            <button
              type="button"
              onClick={handleCreateAgenda}
              className="px-4 py-2 border border-blue-900 text-blue-900 font-black text-xs rounded-xl hover:bg-blue-50 transition-all cursor-pointer inline-flex items-center space-x-1"
            >
              <Plus size={12} />
              <span>Elaborar Primera Agenda</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedAgendas.map(agenda => {
              const isFinal = agenda.estado === 'Finalizada';
              const catCfg = categoryConfig[agenda.categoria || 'ordinaria'] || categoryConfig.ordinaria;
              return (
                <div
                  key={agenda.id}
                  className="bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all rounded-[2rem] p-6 flex flex-col justify-between space-y-4 shadow-sm relative overflow-hidden text-left"
                >
                  {/* Decorative Subtle Accent Band Based on Category */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                    agenda.categoria === 'protocolaria' 
                      ? 'from-purple-500 to-indigo-500' 
                      : agenda.categoria === 'extraordinaria' 
                      ? 'from-amber-500 to-red-500' 
                      : agenda.categoria === 'comisiones'
                      ? 'from-teal-500 to-emerald-500'
                      : 'from-blue-600 to-sky-600'
                  }`} />

                  <div className="space-y-4">
                    {/* Top Row: Document Code and Category Badge */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center space-x-1.5 text-slate-700">
                        <FileText size={13} className="text-slate-400" />
                        <span className="text-[11px] font-black tracking-wider text-slate-800 uppercase">
                          {agenda.codigo || 'AG-S/C'}
                        </span>
                      </div>
                      <span className={`text-[9px] font-black border px-2.5 py-0.5 rounded-full uppercase tracking-wider ${catCfg.badgeClass}`}>
                        {catCfg.label}
                      </span>
                    </div>

                    {/* Title and Subtitle */}
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-800 tracking-tight leading-snug line-clamp-2" title={agenda.titulo}>
                        {agenda.titulo}
                      </h4>
                      <div className="text-[10px] text-slate-400 font-bold flex flex-wrap gap-x-2 gap-y-0.5">
                        <span>Por: <span className="text-slate-600 font-semibold">{agenda.autor}</span></span>
                        <span>•</span>
                        <span>Creada: <span className="text-slate-600 font-semibold">{agenda.fechaCreacion}</span></span>
                      </div>
                    </div>

                    {/* Presidency Indicator */}
                    {agenda.presidencia && (
                      <div className="bg-slate-50/75 border border-slate-100 rounded-xl px-3 py-2 flex items-center space-x-2 text-[10px] text-slate-550">
                        <span className="font-black text-slate-400 uppercase tracking-wider text-[8px] flex-shrink-0">Presidencia</span>
                        <div className="h-3 w-px bg-slate-200" />
                        <span className="font-bold text-slate-700 line-clamp-1">{agenda.presidencia}</span>
                      </div>
                    )}

                    {/* Meeting Information */}
                    <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[10.5px] font-bold text-slate-600">
                      <div className="flex items-center space-x-1.5">
                        <Calendar size={13} className="text-slate-400 flex-shrink-0" />
                        <span className="line-clamp-1">{agenda.fecha}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Clock size={13} className="text-slate-400 flex-shrink-0" />
                        <span className="line-clamp-1">{agenda.hora}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 col-span-2">
                        <Building size={13} className="text-slate-400 flex-shrink-0" />
                        <span className="line-clamp-1 text-slate-500 font-semibold">{agenda.lugar}</span>
                      </div>
                    </div>

                    {/* Points Count */}
                    <div className="flex items-center justify-between text-[11.5px] font-bold text-slate-500 pt-1">
                      <span className="flex items-center space-x-1">
                        <span>Puntos a Tratar:</span>
                      </span>
                      <span className="bg-blue-50 text-blue-900 px-2 py-0.5 rounded-full text-[10px] font-black border border-blue-100">
                        {agenda.puntos.length} {agenda.puntos.length === 1 ? 'punto' : 'puntos'}
                      </span>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const publicUrl = `${window.location.origin}/#/agenda-publica/${agenda.id}`;
                          navigator.clipboard.writeText(publicUrl);
                          showToast("Enlace de agenda digital copiado al portapapeles", "success");
                        }}
                        className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200/60 hover:border-emerald-200 rounded-xl transition-all cursor-pointer"
                        title="Copiar Enlace Público para WhatsApp / Compartir"
                      >
                        <Share2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenReorderModal(agenda)}
                        className="p-2 text-slate-400 hover:text-blue-900 hover:bg-slate-50 border border-slate-200/60 rounded-xl transition-all cursor-pointer"
                        title="Reordenar Puntos de la Agenda"
                      >
                        <ArrowUpDown size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditAgenda(agenda)}
                        className="p-2 text-slate-400 hover:text-blue-900 hover:bg-slate-50 border border-slate-200/60 rounded-xl transition-all cursor-pointer"
                        title="Editar Agenda"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAgenda(agenda.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 rounded-xl transition-all cursor-pointer"
                        title="Eliminar Agenda"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenReorderModal(agenda)}
                        className="px-2.5 py-1.5 border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-900 rounded-xl text-[10px] font-black transition-all flex items-center space-x-1 cursor-pointer"
                        title="Reordenar Puntos"
                      >
                        <ArrowUpDown size={11} />
                        <span>Reordenar</span>
                      </button>
                      <a
                        href={`/#/agenda-publica/${agenda.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 rounded-xl text-[10px] font-black transition-all flex items-center space-x-1 cursor-pointer"
                        title="Ver versión digital pública"
                      >
                        <Share2 size={11} />
                        <span>Ver Digital</span>
                      </a>
                      <button
                        type="button"
                        onClick={async () => await generateAgendaPDF(agenda, 'open')}
                        className="px-2.5 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-[10px] font-black transition-all flex items-center space-x-1 hover:text-slate-800 cursor-pointer"
                        title="Ver PDF"
                      >
                        <Printer size={11} />
                        <span>Ver PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => await generateAgendaPDF(agenda, 'download')}
                        className="px-3 py-1.5 bg-blue-900 text-white shadow-sm hover:bg-blue-950 rounded-xl text-[10px] font-black transition-all flex items-center space-x-1 cursor-pointer"
                        title="Descargar PDF"
                      >
                        <Download size={11} />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de Reordenar Puntos */}
        {reorderingAgenda && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in zoom-in-95 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-blue-50 text-blue-900 rounded-xl">
                    <ArrowUpDown size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800">Reordenar Puntos de Agenda</h3>
                    <p className="text-[11px] text-slate-500 font-semibold line-clamp-1">
                      {reorderingAgenda.titulo}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReorderingAgenda(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  <XIcon size={16} />
                </button>
              </div>

              <p className="text-xs text-slate-600 font-medium">
                Organice la secuencia de los temas a tratar durante la reunión utilizando las flechas de posición. Los cambios se actualizarán de inmediato en la versión digital y el PDF.
              </p>

              {reorderingPuntos.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl">
                  Esta agenda no contiene puntos registrados.
                </div>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {reorderingPuntos.map((pt, idx) => (
                    <div
                      key={pt.id || idx}
                      className="flex items-center justify-between bg-slate-50/80 border border-slate-200/90 rounded-2xl p-3 text-xs transition-all hover:bg-white hover:shadow-xs"
                    >
                      <div className="flex items-center space-x-3 pr-2 min-w-0">
                        <span className="w-6 h-6 bg-blue-900 text-white rounded-full flex items-center justify-center font-black text-[11px] flex-shrink-0 shadow-xs">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <h5 className="font-bold text-slate-800 truncate" title={pt.titulo}>
                            {pt.titulo || 'Sin título'}
                          </h5>
                          {pt.proponenteNombre && (
                            <span className="text-[10px] text-amber-700 font-extrabold block">
                              Propuesto por: {pt.proponenteNombre}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveReorderPunto(idx, 'up')}
                          className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-blue-900 hover:text-white rounded-lg text-[10px] font-bold transition-all disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-700 flex items-center space-x-1 cursor-pointer shadow-2xs"
                          title="Subir posición"
                        >
                          <ArrowUp size={12} />
                          <span>Subir</span>
                        </button>
                        <button
                          type="button"
                          disabled={idx === reorderingPuntos.length - 1}
                          onClick={() => handleMoveReorderPunto(idx, 'down')}
                          className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-blue-900 hover:text-white rounded-lg text-[10px] font-bold transition-all disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-700 flex items-center space-x-1 cursor-pointer shadow-2xs"
                          title="Bajar posición"
                        >
                          <ArrowDown size={12} />
                          <span>Bajar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReorderingAgenda(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSavingReorder || reorderingPuntos.length === 0}
                  onClick={handleSaveReorderPuntos}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSavingReorder ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                  <span>Guardar Nuevo Orden</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ================= RANKING LIONÍSTICO LOGIC & VIEW =================

  // 1. Memoized list of attendances. If empty, generate simulated data based on past agendas/activities
  const asistenciasList = useMemo(() => {
    if (asistencias.length > 0) return asistencias;

    const simulated: Asistencia[] = [];
    const pastAgendas = agendas.filter(a => a.estado === 'Finalizada');
    const pastActividades = actividades;

    socios.forEach((socio, sIdx) => {
      const seed = socio.nombre.charCodeAt(0) + socio.nombre.charCodeAt(socio.nombre.length - 1);
      
      pastAgendas.forEach((agenda, aIdx) => {
        const attended = (seed + aIdx) % 5 !== 0; // 80% attendance
        simulated.push({
          id: `mock-att-reunion-${socio.id}-${agenda.id}`,
          socioId: socio.id,
          socioNombre: socio.nombre,
          tipo: 'reunion',
          eventoId: agenda.id,
          eventoTitulo: agenda.titulo,
          fecha: agenda.fecha,
          asistio: attended
        });
      });

      pastActividades.forEach((act, actIdx) => {
        const attended = (seed + actIdx) % 3 !== 0; // 66% attendance
        simulated.push({
          id: `mock-att-act-${socio.id}-${act.id}`,
          socioId: socio.id,
          socioNombre: socio.nombre,
          tipo: 'actividad',
          eventoId: act.id,
          eventoTitulo: act.titulo,
          fecha: act.fecha,
          asistio: attended
        });
        
        // Simulate active volunteering
        if (attended && (seed + actIdx) % 2 === 0) {
          simulated.push({
            id: `mock-att-vol-${socio.id}-${act.id}`,
            socioId: socio.id,
            socioNombre: socio.nombre,
            tipo: 'voluntariado',
            eventoId: act.id,
            eventoTitulo: act.titulo,
            fecha: act.fecha,
            asistio: true
          });
        }
      });
    });

    return simulated;
  }, [asistencias, agendas, actividades, socios]);

  // 2. Compute individual Socio points and ranks
  const sociosRankingData = useMemo(() => {
    return socios.map(socio => {
      const socioAsistencias = asistenciasList.filter(a => a.socioId === socio.id && a.asistio);
      const reunionCount = socioAsistencias.filter(a => a.tipo === 'reunion').length;
      const actividadCount = socioAsistencias.filter(a => a.tipo === 'actividad').length;
      const voluntariadoCount = socioAsistencias.filter(a => a.tipo === 'voluntariado').length;

      const ptsAsistencia = (reunionCount * 10) + (actividadCount * 15) + (voluntariadoCount * 20);

      // Proposals & agenda points
      const propuestasCount = propuestas.filter(p => 
        p.proponente === socio.id || 
        p.proponente.toLowerCase() === socio.nombre.toLowerCase()
      ).length;
      
      const agendaPointsCount = solicitudes.filter(s => 
        s.tipo === 'agenda' && 
        (s.usuarioCreador === socio.correo || s.nombre === socio.nombre)
      ).length;

      const ptsPropuestas = (propuestasCount * 30) + (agendaPointsCount * 20);

      // Commissions roles
      const memberComisiones = comisiones.filter(c => c.miembros.includes(socio.id));
      const comisionesCount = memberComisiones.length;
      const coordinatorCount = memberComisiones.filter(c => c.coordinador === socio.id).length;
      
      const ptsLiderazgo = (comisionesCount * 20) + (coordinatorCount * 15);

      // Cuotas compliance
      let ptsCuotas = 0;
      if (socio.estadoCuotas === 'Al día') ptsCuotas = 100;
      else if (socio.estadoCuotas === 'Pendiente') ptsCuotas = 50;

      const totalScore = ptsAsistencia + ptsPropuestas + ptsLiderazgo + ptsCuotas;

      return {
        socio,
        metrics: {
          reuniones: reunionCount,
          actividades: actividadCount,
          voluntariado: voluntariadoCount,
          propuestas: propuestasCount,
          puntosAgenda: agendaPointsCount,
          comisiones: comisionesCount,
          coordinator: coordinatorCount === 1,
          cuotasStatus: socio.estadoCuotas
        },
        scores: {
          asistencia: ptsAsistencia,
          propuestas: ptsPropuestas,
          liderazgo: ptsLiderazgo,
          cuotas: ptsCuotas
        },
        totalScore
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }, [socios, asistenciasList, propuestas, solicitudes, comisiones]);

  // 3. Compute Commission points and ranks
  const comisionesRankingData = useMemo(() => {
    return comisiones.map(comision => {
      const meetingsCount = minutas.filter(m => m.comisionId === comision.id).length;
      const resolvedTasksCount = tareasComisiones.filter(t => 
        t.comisionId === comision.id && 
        t.estado === 'Resuelta'
      ).length;

      const totalScore = (meetingsCount * 15) + (resolvedTasksCount * 25);
      const coordinator = socios.find(s => s.id === comision.coordinador);

      return {
        comision,
        coordinatorName: coordinator ? coordinator.nombre : 'No asignado',
        meetingsCount,
        resolvedTasksCount,
        totalScore
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }, [comisiones, minutas, tareasComisiones, socios]);

  // 4. Save manually logged attendance batch to Firebase
  const handleSaveAsistencia = async () => {
    if (!asistenciaEventId) {
      alert("Por favor, selecciona un evento.");
      return;
    }
    setIsSavingAsistencia(true);
    try {
      const selectedEvent = asistenciaEventTipo === 'reunion'
        ? agendas.find(a => a.id === asistenciaEventId)
        : actividades.find(a => a.id === asistenciaEventId);
        
      if (!selectedEvent) throw new Error("Evento no encontrado.");

      const attendancesToSave: Asistencia[] = [];
      socios.forEach(socio => {
        if (asistenciaEventTipo === 'reunion') {
          const existing = asistencias.find(a => a.eventoId === asistenciaEventId && a.socioId === socio.id && a.tipo === 'reunion');
          attendancesToSave.push({
            id: existing?.id || `att-reunion-${asistenciaEventId}-${socio.id}`,
            socioId: socio.id,
            socioNombre: socio.nombre,
            tipo: 'reunion',
            eventoId: asistenciaEventId,
            eventoTitulo: selectedEvent.titulo,
            fecha: selectedEvent.fecha,
            asistio: !!asistenciaChecked[socio.id]
          });
        } else {
          const existingAct = asistencias.find(a => a.eventoId === asistenciaEventId && a.socioId === socio.id && a.tipo === 'actividad');
          attendancesToSave.push({
            id: existingAct?.id || `att-act-${asistenciaEventId}-${socio.id}`,
            socioId: socio.id,
            socioNombre: socio.nombre,
            tipo: 'actividad',
            eventoId: asistenciaEventId,
            eventoTitulo: selectedEvent.titulo,
            fecha: selectedEvent.fecha,
            asistio: !!asistenciaChecked[socio.id]
          });

          const existingVol = asistencias.find(a => a.eventoId === asistenciaEventId && a.socioId === socio.id && a.tipo === 'voluntariado');
          attendancesToSave.push({
            id: existingVol?.id || `att-vol-${asistenciaEventId}-${socio.id}`,
            socioId: socio.id,
            socioNombre: socio.nombre,
            tipo: 'voluntariado',
            eventoId: asistenciaEventId,
            eventoTitulo: selectedEvent.titulo,
            fecha: selectedEvent.fecha,
            asistio: !!asistenciaVoluntarioChecked[socio.id]
          });
        }
      });

      await firebaseService.saveAsistenciasBatch(attendancesToSave);
      showAlert("Éxito", "La asistencia ha sido guardada en la base de datos.");
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Error al registrar la asistencia.");
    } finally {
      setIsSavingAsistencia(false);
    }
  };

  // 5. Render Ranking Module View
  const renderRankingLionistico = () => {
    // Quick statistics
    const topSocio = sociosRankingData[0];
    const topComision = comisionesRankingData[0];
    
    // Average attendance rate
    const totalRecords = asistenciasList.length;
    const attendedRecords = asistenciasList.filter(a => a.asistio).length;
    const averageAttendance = totalRecords > 0 ? Math.round((attendedRecords / totalRecords) * 100) : 84;

    // Filter members for leaderboard table search
    const filteredSociosRank = sociosRankingData.filter(item => 
      item.socio.nombre.toLowerCase().includes(rankingSearchQuery.toLowerCase())
    );

    return (
      <div className="space-y-6 w-full text-left">
        {/* Banner Hero header */}
        <div className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl overflow-hidden border border-slate-800">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center space-x-2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                <Trophy size={12} className="animate-pulse" />
                <span>Rendimiento y Liderazgo</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                Ranking Lionístico Oficial
              </h2>
              <p className="text-xs text-blue-100/80 font-medium">
                Monitoreo automático del compromiso en el club. Se evalúa asistencia en reuniones, voluntariados, propuestas legislativas y cumplimiento de aportaciones.
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center min-w-[110px]">
                <span className="text-[9px] font-black text-blue-200 uppercase tracking-wider block">Socio Líder</span>
                <span className="text-xs font-black text-white mt-1 block truncate max-w-[90px] mx-auto">
                  {topSocio ? topSocio.socio.nombre.split(' ')[0] : 'S/D'}
                </span>
                <span className="text-[10px] font-bold text-yellow-400 mt-0.5 block">{topSocio ? topSocio.totalScore : 0} pts</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center min-w-[110px]">
                <span className="text-[9px] font-black text-blue-200 uppercase tracking-wider block">Comisión Top</span>
                <span className="text-xs font-black text-white mt-1 block truncate max-w-[90px] mx-auto">
                  {topComision ? topComision.comision.nombre.split(' ')[0] : 'S/D'}
                </span>
                <span className="text-[10px] font-bold text-yellow-400 mt-0.5 block">{topComision ? topComision.totalScore : 0} pts</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center min-w-[110px]">
                <span className="text-[9px] font-black text-blue-200 uppercase tracking-wider block">Asistencia Gral.</span>
                <span className="text-xl font-black text-white mt-0.5 block">{averageAttendance}%</span>
                <span className="text-[8px] font-bold text-emerald-400 mt-0.5 block">Nivel Óptimo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-tabs navigator */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setRankingSubTab('socios')}
            className={`py-3 px-6 text-sm font-black transition-all border-b-2 cursor-pointer flex items-center space-x-1.5 ${
              rankingSubTab === 'socios'
                ? 'border-blue-900 text-blue-900 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-blue-900'
            }`}
          >
            <Trophy size={14} />
            <span>Ranking de Socios</span>
          </button>
          <button
            type="button"
            onClick={() => setRankingSubTab('comisiones')}
            className={`py-3 px-6 text-sm font-black transition-all border-b-2 cursor-pointer flex items-center space-x-1.5 ${
              rankingSubTab === 'comisiones'
                ? 'border-blue-900 text-blue-900 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-blue-900'
            }`}
          >
            <Users size={14} />
            <span>Desempeño de Comisiones</span>
          </button>
          <button
            type="button"
            onClick={() => setRankingSubTab('asistencia')}
            className={`py-3 px-6 text-sm font-black transition-all border-b-2 cursor-pointer flex items-center space-x-1.5 ${
              rankingSubTab === 'asistencia'
                ? 'border-blue-900 text-blue-900 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-blue-900'
            }`}
          >
            <Calendar size={14} />
            <span>Registrar Asistencia</span>
          </button>
        </div>

        {/* Sub-tab 1: Ranking de Socios */}
        {rankingSubTab === 'socios' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Podium View for Top 3 */}
            <div className="bg-slate-50 border border-slate-200/50 rounded-3xl p-6 sm:p-8 flex flex-col items-center">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-center mb-6">Podio de Honor del Club</h3>
              
              <div className="flex items-end justify-center gap-4 sm:gap-8 max-w-md w-full pt-12 pb-4">
                {/* 2nd Place */}
                {sociosRankingData[1] && (
                  <div className="flex flex-col items-center flex-1">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-slate-300 overflow-hidden bg-slate-200 shadow-md">
                        {sociosRankingData[1].socio.foto ? (
                          <img src={sociosRankingData[1].socio.foto} alt="2nd" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg font-black text-slate-500 uppercase">
                            {sociosRankingData[1].socio.nombre.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-slate-400">
                        <Crown size={22} />
                      </div>
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-400 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black shadow-sm">
                        2
                      </span>
                    </div>
                    <span className="text-xs font-black text-slate-750 mt-4 text-center truncate max-w-[80px] block">
                      {sociosRankingData[1].socio.nombre.split(' ')[0]}
                    </span>
                    <span className="text-[10px] font-bold text-slate-450 mt-0.5">{sociosRankingData[1].totalScore} pts</span>
                    {/* Podium pillar */}
                    <div className="w-16 sm:w-20 bg-slate-300/40 border border-slate-300/70 h-24 rounded-t-2xl mt-4 flex items-center justify-center">
                      <span className="text-slate-400/80 font-black text-xl">II</span>
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {sociosRankingData[0] && (
                  <div className="flex flex-col items-center flex-1 -mt-8">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full border-4 border-yellow-400 overflow-hidden bg-slate-200 shadow-lg ring-4 ring-yellow-400/10">
                        {sociosRankingData[0].socio.foto ? (
                          <img src={sociosRankingData[0].socio.foto} alt="1st" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl font-black text-slate-500 uppercase">
                            {sociosRankingData[0].socio.nombre.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-500">
                        <Crown size={28} className="animate-bounce" />
                      </div>
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 rounded-full w-6 h-6 flex items-center justify-center text-[11px] font-black shadow-md">
                        1
                      </span>
                    </div>
                    <span className="text-sm font-black text-slate-800 mt-4 text-center truncate max-w-[100px] block">
                      {sociosRankingData[0].socio.nombre.split(' ')[0]}
                    </span>
                    <span className="text-xs font-black text-yellow-600 mt-0.5">{sociosRankingData[0].totalScore} pts</span>
                    {/* Podium pillar */}
                    <div className="w-20 sm:w-24 bg-gradient-to-b from-yellow-300/30 to-yellow-400/10 border border-yellow-400/40 h-32 rounded-t-2xl mt-4 flex items-center justify-center shadow-inner">
                      <span className="text-yellow-500/80 font-black text-2xl">I</span>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {sociosRankingData[2] && (
                  <div className="flex flex-col items-center flex-1">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-amber-600 overflow-hidden bg-slate-200 shadow-md">
                        {sociosRankingData[2].socio.foto ? (
                          <img src={sociosRankingData[2].socio.foto} alt="3rd" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg font-black text-slate-500 uppercase">
                            {sociosRankingData[2].socio.nombre.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-amber-700">
                        <Crown size={22} />
                      </div>
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black shadow-sm">
                        3
                      </span>
                    </div>
                    <span className="text-xs font-black text-slate-750 mt-4 text-center truncate max-w-[80px] block">
                      {sociosRankingData[2].socio.nombre.split(' ')[0]}
                    </span>
                    <span className="text-[10px] font-bold text-slate-450 mt-0.5">{sociosRankingData[2].totalScore} pts</span>
                    {/* Podium pillar */}
                    <div className="w-16 sm:w-20 bg-amber-600/10 border border-amber-600/30 h-18 rounded-t-2xl mt-4 flex items-center justify-center">
                      <span className="text-amber-700/80 font-black text-xl">III</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Leaderboard Table List */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Tabla de Clasificación</h4>
                
                {/* Search box */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    value={rankingSearchQuery}
                    onChange={(e) => setRankingSearchQuery(e.target.value)}
                    placeholder="Buscar por nombre..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-xs font-bold text-slate-700 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider text-left">
                      <th className="py-4 px-5 w-16 text-center">Rango</th>
                      <th className="py-4 px-4">Socio</th>
                      <th className="py-4 px-4 text-center">Asistencia</th>
                      <th className="py-4 px-4 text-center">Propuestas</th>
                      <th className="py-4 px-4 text-center">Comisiones</th>
                      <th className="py-4 px-4 text-center">Aportes</th>
                      <th className="py-4 px-5 text-right w-24">Puntaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSociosRank.map((item, idx) => {
                      const rankingIndex = sociosRankingData.findIndex(s => s.socio.id === item.socio.id) + 1;
                      return (
                        <tr key={item.socio.id} className="border-b border-slate-100/70 hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-5 text-center">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black text-[10px] ${
                              rankingIndex === 1 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : rankingIndex === 2 
                                ? 'bg-slate-100 text-slate-800' 
                                : rankingIndex === 3 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-slate-50 text-slate-600'
                            }`}>
                              #{rankingIndex}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                                {item.socio.foto ? (
                                  <img src={item.socio.foto} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs font-black text-slate-500 uppercase">
                                    {item.socio.nombre.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div>
                                <span className="font-black text-slate-800 text-[13px] block leading-snug">{item.socio.nombre}</span>
                                <span className="text-[10px] font-semibold text-slate-400 block">{item.socio.puesto || 'Socio Activo'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="font-extrabold text-slate-800">{item.metrics.reuniones + item.metrics.actividades} asistencias</span>
                              <span className="text-[9px] text-slate-400">{item.scores.asistencia} pts</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="font-extrabold text-slate-800">{item.metrics.propuestas + item.metrics.puntosAgenda} props</span>
                              <span className="text-[9px] text-slate-400">{item.scores.propuestas} pts</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="font-extrabold text-slate-800">{item.metrics.comisiones} participadas</span>
                              <span className="text-[9px] text-slate-400">{item.scores.liderazgo} pts</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              item.metrics.cuotasStatus === 'Al día' 
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                : item.metrics.cuotasStatus === 'Pendiente'
                                ? 'bg-amber-50 text-amber-800 border border-amber-250'
                                : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>
                              {item.metrics.cuotasStatus}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right font-black text-slate-900 text-sm">
                            {item.totalScore} <span className="text-[9px] text-slate-400 font-bold block">puntos</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Sub-tab 2: Desempeño de Comisiones */}
        {rankingSubTab === 'comisiones' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Recharts Bar Chart */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Producción Legislativa y Resultados</h4>
              
              <div className="w-full h-80 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={comisionesRankingData.map(item => ({
                      name: item.comision.nombre.length > 15 ? item.comision.nombre.substring(0, 15) + '...' : item.comision.nombre,
                      'Reuniones (Minutas)': item.meetingsCount,
                      'Tareas Resueltas': item.resolvedTasksCount
                    }))}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" stroke="#94a3b8" style={{ fontSize: '10px' }} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" style={{ fontSize: '10px', fontWeight: 'bold' }} width={120} />
                    <Tooltip contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                    <Bar dataKey="Reuniones (Minutas)" fill="#1b365d" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="Tareas Resueltas" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Commissions List cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {comisionesRankingData.map((item, idx) => (
                <div key={item.comision.id} className="bg-white border border-slate-200/80 hover:shadow-md transition-all rounded-[2rem] p-6 space-y-4 shadow-sm relative overflow-hidden text-left">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-900 to-indigo-900" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black bg-blue-50 text-blue-900 border border-blue-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Comisión #{idx + 1}
                    </span>
                    <span className="text-sm font-black text-yellow-600">{item.totalScore} pts</span>
                  </div>

                  <div>
                    <h4 className="text-base font-black text-slate-800 tracking-tight leading-snug">{item.comision.nombre}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.comision.proposito}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Reuniones</span>
                      <span className="text-xl font-black text-slate-850 mt-1 block">{item.meetingsCount}</span>
                      <span className="text-[9px] font-bold text-slate-400 mt-0.5 block">Minutas firmadas</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Resultados</span>
                      <span className="text-xl font-black text-emerald-600 mt-1 block">{item.resolvedTasksCount}</span>
                      <span className="text-[9px] font-bold text-emerald-400 mt-0.5 block">Tareas resueltas</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>Coordinador:</span>
                    <span className="text-slate-800 font-extrabold">{item.coordinatorName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sub-tab 3: Registrar Asistencia Form */}
        {rankingSubTab === 'asistencia' && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-lg font-black text-blue-900">Controlador de Asistencia</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Selecciona un evento del club (sesiones de agenda finalizadas o actividades generales de servicio) y marca la participación de los socios.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 border border-slate-200/50 p-5 rounded-2xl">
              <div>
                <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest ml-1 mb-1 block">Tipo de Evento</label>
                <select
                  value={asistenciaEventTipo}
                  onChange={(e) => {
                    setAsistenciaEventTipo(e.target.value as any);
                    setAsistenciaEventId('');
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent cursor-pointer"
                >
                  <option value="reunion">📝 Sesión de Agenda (Finalizada)</option>
                  <option value="actividad">🤝 Actividad de Servicio / Voluntariado</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest ml-1 mb-1 block">Seleccionar Evento Específico</label>
                <select
                  value={asistenciaEventId}
                  onChange={(e) => setAsistenciaEventId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent cursor-pointer"
                >
                  <option value="">-- Selecciona el evento a registrar --</option>
                  {asistenciaEventTipo === 'reunion' ? (
                    agendas.filter(a => a.estado === 'Finalizada').map(a => (
                      <option key={a.id} value={a.id}>{a.fecha} - {a.titulo}</option>
                    ))
                  ) : (
                    actividades.map(a => (
                      <option key={a.id} value={a.id}>{a.fecha} - {a.titulo}</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {asistenciaEventId ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Lista de Socios</h4>
                  
                  {/* Checklist search box */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      value={asistenciaSearchQuery}
                      onChange={(e) => setAsistenciaSearchQuery(e.target.value)}
                      placeholder="Filtrar socio..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto p-1">
                  {socios.filter(s => s.nombre.toLowerCase().includes(asistenciaSearchQuery.toLowerCase())).map(socio => (
                    <div key={socio.id} className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                          {socio.foto ? (
                            <img src={socio.foto} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-black text-slate-500 uppercase">
                              {socio.nombre.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-800 text-xs block truncate max-w-[130px]">{socio.nombre}</span>
                          <span className="text-[9px] text-slate-450 uppercase tracking-wider block font-bold">{socio.puesto || 'Socio'}</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-200/50 pt-3 flex items-center justify-between gap-2">
                        {/* Attendance Toggle */}
                        <label className="flex items-center space-x-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={!!asistenciaChecked[socio.id]}
                            onChange={(e) => setAsistenciaChecked({ ...asistenciaChecked, [socio.id]: e.target.checked })}
                            className="w-4 h-4 rounded text-blue-900 border-slate-300 focus:ring-blue-900 cursor-pointer"
                          />
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-wide">Asistió</span>
                        </label>

                        {/* Volunteering Toggle (Only visible for activity events) */}
                        {asistenciaEventTipo === 'actividad' && (
                          <label className="flex items-center space-x-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!asistenciaVoluntarioChecked[socio.id]}
                              onChange={(e) => setAsistenciaVoluntarioChecked({ ...asistenciaVoluntarioChecked, [socio.id]: e.target.checked })}
                              className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-600 cursor-pointer"
                            />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-wide">Voluntario Activo</span>
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                  <button
                    type="button"
                    disabled={isSavingAsistencia}
                    onClick={handleSaveAsistencia}
                    className="px-6 py-3 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-black shadow-md shadow-blue-900/10 hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingAsistencia ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>Guardar Asistencia</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200/40 rounded-2xl p-10 text-center text-slate-400">
                <span className="text-xs font-bold">Selecciona un tipo de evento y un evento de la lista para gestionar la asistencia.</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderControlSolicitudesList = () => {
    // Filter list
    const filteredList = solicitudes.filter(sol => {
      // Exclude 'agenda' and 'cartas' from the unified list
      if (sol.tipo === 'agenda') return false; 
      
      if (controlSolicitudesArchiveFilter === 'activas' && sol.archivada) return false;
      if (controlSolicitudesArchiveFilter === 'archivadas' && !sol.archivada) return false;

      const matchesType = controlSolicitudesFilterType === 'todos' || sol.tipo === controlSolicitudesFilterType;
      const matchesStatus = controlSolicitudesFilterStatus === 'todos' || sol.estado === controlSolicitudesFilterStatus;
      
      const searchLower = controlSolicitudesSearchQuery.toLowerCase();
      const matchesSearch = 
        (sol.nombre && sol.nombre.toLowerCase().includes(searchLower)) ||
        (sol.descripcion && sol.descripcion.toLowerCase().includes(searchLower)) ||
        (sol.nombreBeneficiario && sol.nombreBeneficiario.toLowerCase().includes(searchLower)) ||
        (sol.nombreSolicitante && sol.nombreSolicitante.toLowerCase().includes(searchLower)) ||
        (sol.salonNombreSolicitante && sol.salonNombreSolicitante.toLowerCase().includes(searchLower));
        
      return matchesType && matchesStatus && matchesSearch;
    });

    if (dbLoading.solicitudes) {
      return (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 w-full">
          <div className="animate-spin text-blue-900"><Users size={36} /></div>
          <p className="text-slate-500 font-bold text-sm">Cargando solicitudes...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6 w-full text-left">
        {/* Leyenda y Filtros */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
              <Layers size={14} className="mr-1.5 text-slate-450" />
              Código de Colores / Categorías
            </h3>
            {/* Leyenda */}
            <div className="flex flex-wrap gap-2 text-[10px] font-bold">
              <span className="flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5"></span>
                ♿ Sillas de Ruedas
              </span>
              <span className="flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5"></span>
                🔓 Solicitudes Abiertas
              </span>
              <span className="flex items-center px-2 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 mr-1.5"></span>
                🔒 Solicitudes Internas
              </span>
              <span className="flex items-center px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5"></span>
                🏛️ Salón y Parqueo
              </span>
            </div>
          </div>

          {/* Filtros de Búsqueda */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Buscar por Nombre / Detalle
              </label>
              <input
                type="text"
                value={controlSolicitudesSearchQuery}
                onChange={(e) => setControlSolicitudesSearchQuery(e.target.value)}
                placeholder="Ej. Juan Pérez..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none text-xs font-semibold text-slate-800 bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Filtrar por Categoría
              </label>
              <select
                value={controlSolicitudesFilterType}
                onChange={(e) => setControlSolicitudesFilterType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none text-xs font-semibold bg-white cursor-pointer"
              >
                <option value="todos">Todas las categorías</option>
                <option value="sillas">♿ Sillas de Ruedas</option>
                <option value="abiertas">🔓 Solicitudes Abiertas</option>
                <option value="internas">🔒 Solicitudes Internas</option>
                <option value="salon">🏛️ Salón y Parqueo</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Filtrar por Estado
              </label>
              <select
                value={controlSolicitudesFilterStatus}
                onChange={(e) => setControlSolicitudesFilterStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none text-xs font-semibold bg-white cursor-pointer"
              >
                <option value="todos">Todos los estados</option>
                <option value="Pendiente">🟡 Pendientes</option>
                <option value="Aprobada">🟢 Aprobadas</option>
                <option value="Rechazada">🔴 Rechazadas</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Visualización / Archivo
              </label>
              <select
                value={controlSolicitudesArchiveFilter}
                onChange={(e) => setControlSolicitudesArchiveFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none text-xs font-bold text-blue-900 bg-white cursor-pointer"
              >
                <option value="activas">📥 Activas</option>
                <option value="archivadas">🗃️ Archivadas</option>
                <option value="todas">📋 Todas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Listado de Solicitudes Consolidado */}
        {filteredList.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/60 p-12 text-center w-full">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <FileText size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Sin resultados</h3>
            <p className="text-slate-500 text-xs mt-1 font-semibold">
              No se encontraron solicitudes que coincidan con los filtros seleccionados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            {filteredList.map((sol) => {
              // LEFT BORDER = Approval status
              const statusBorderColor = 
                sol.estado === 'Aprobada' ? 'border-l-4 border-l-emerald-500' :
                sol.estado === 'Rechazada' ? 'border-l-4 border-l-rose-500' :
                'border-l-4 border-l-yellow-500';

              // TOP BORDER = Request type color code
              const typeTopBorderColor = 
                sol.tipo === 'sillas' ? 'border-t-4 border-t-blue-500' :
                sol.tipo === 'abiertas' ? 'border-t-4 border-t-emerald-500' :
                sol.tipo === 'internas' ? 'border-t-4 border-t-purple-500' :
                sol.tipo === 'salon' ? 'border-t-4 border-t-amber-500' :
                'border-t-4 border-t-slate-300';

              // Request type tag
              let typeTag = null;
              if (sol.tipo === 'sillas') {
                typeTag = (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border bg-blue-50 text-blue-700 border-blue-200 flex items-center space-x-1">
                    <Accessibility size={12} className="mr-0.5" />
                    <span>Silla de Ruedas</span>
                  </span>
                );
              } else if (sol.tipo === 'abiertas') {
                typeTag = (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center space-x-1">
                    <FileText size={12} className="mr-0.5" />
                    <span>Abierta</span>
                  </span>
                );
              } else if (sol.tipo === 'internas') {
                typeTag = (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border bg-purple-50 text-purple-700 border-purple-200 flex items-center space-x-1">
                    <Lock size={12} className="mr-0.5" />
                    <span>Interna</span>
                  </span>
                );
              } else if (sol.tipo === 'salon') {
                typeTag = (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border bg-amber-50 text-amber-700 border-amber-200 flex items-center space-x-1">
                    <Building size={12} className="mr-0.5" />
                    <span>Salón/Parqueo</span>
                  </span>
                );
              }

              return (
                <div 
                  key={sol.id}
                  className={`bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md border border-slate-150 transition-all duration-300 flex flex-col justify-between ${statusBorderColor} ${typeTopBorderColor}`}
                >
                  <div className="p-5 space-y-3.5 flex-grow">
                    {/* Tags and Status */}
                    <div className="flex justify-between items-start gap-2">
                      {typeTag}
                      
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center space-x-1 ${
                        sol.estado === 'Aprobada' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        sol.estado === 'Rechazada' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                        'bg-yellow-50 text-yellow-700 border border-yellow-100'
                      }`}>
                        {sol.estado === 'Aprobada' && <CheckCircle size={10} className="mr-1" />}
                        {sol.estado === 'Rechazada' && <XOctagon size={10} className="mr-1" />}
                        {sol.estado === 'Pendiente' && <Clock size={10} className="mr-1" />}
                        <span>{sol.estado}</span>
                      </span>
                    </div>

                    {/* Rent-specific details */}
                    {sol.tipo === 'salon' && (
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-base text-slate-900 leading-snug break-words">
                            Reservación: {sol.salonDia}
                          </h3>
                          <div className="flex items-center text-xs font-semibold text-slate-400">
                            <Clock size={12} className="mr-1 text-slate-400 flex-shrink-0" />
                            <span>{sol.salonHoraInicio} - {sol.salonHoraFin} | Tipo: <strong className="text-slate-600 font-extrabold uppercase">{sol.salonTipoAlquiler}</strong></span>
                          </div>
                        </div>

                        <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100 space-y-2 text-xs font-medium">
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">Solicitante:</span>
                            <span className="font-extrabold text-slate-800">{sol.salonNombreSolicitante}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">Teléfono:</span>
                            <a href={`tel:${sol.salonTelefono}`} className="text-blue-900 font-extrabold flex items-center">
                              <Phone size={10} className="mr-0.5" />
                              <span>{sol.salonTelefono}</span>
                            </a>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">Asistentes:</span>
                            <span className="font-extrabold text-slate-800">{sol.salonAsistentes} personas</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">Limpieza:</span>
                            <span className="font-bold text-slate-700">
                              {sol.salonCompromisoLimpieza === 'dejar_limpio' ? 'Compromiso limpiar' : 'Servicio pagado'}
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-200/50">
                            <span className="text-slate-550 font-bold text-xs">Costo Total:</span>
                            <span className="font-black text-blue-900 text-xs">Q{sol.salonCostoTotal}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Wheelchair-specific details */}
                    {sol.tipo === 'sillas' && (
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-base text-slate-900 leading-snug break-words">
                            Beneficiario: {sol.nombreBeneficiario}
                          </h3>
                          <div className="flex items-center text-xs font-semibold text-slate-400">
                            <Calendar size={12} className="mr-1 text-slate-400 flex-shrink-0" />
                            <span>Edad: {sol.edadBeneficiario} años | Registro: {sol.fechaCreacion}</span>
                          </div>
                        </div>

                        <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100 space-y-2 text-xs font-medium">
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">Solicitante:</span>
                            <span className="font-extrabold text-slate-800">{sol.nombreSolicitante}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">DPI:</span>
                            <span className="font-mono text-slate-700">{sol.dpiSolicitante}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">Teléfono:</span>
                            <a href={`tel:${sol.telefonoSolicitante}`} className="text-blue-900 font-extrabold flex items-center">
                              <Phone size={10} className="mr-0.5" />
                              <span>{sol.telefonoSolicitante}</span>
                            </a>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-200/50">
                            <span className="text-slate-400 font-bold">Uso propuesto:</span>
                            <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">{sol.tiempoUso}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Open/Internal standard details */}
                    {(sol.tipo === 'abiertas' || sol.tipo === 'internas') && (
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-base text-slate-900 leading-snug break-words">
                            {sol.nombre}
                          </h3>
                          <div className="flex items-center text-xs font-semibold text-slate-400">
                            <Calendar size={12} className="mr-1 text-slate-400 flex-shrink-0" />
                            <span>Fecha límite sugerida: {sol.fecha}</span>
                          </div>
                        </div>

                        <p className="text-slate-600 text-xs leading-relaxed font-medium bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                          {sol.descripcion}
                        </p>

                        {sol.documentoUrl && (
                          <div className="pt-1">
                            <a
                              href={sol.documentoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs"
                              title={sol.documentoNombre || 'Ver carta o archivo adjunto'}
                            >
                              <FileText size={13} />
                              <span>📄 Ver Carta / Adjunto ({sol.documentoNombre || 'PDF/Imagen'})</span>
                            </a>
                          </div>
                        )}

                        <div className="space-y-1 pt-1.5">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Responsables:</span>
                          <div className="space-y-1">
                            {sol.responsables?.map((resp, i) => (
                              <div key={i} className="flex justify-between text-xs bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                <span className="font-bold text-slate-700">{resp.nombre}</span>
                                <a href={`tel:${resp.telefono}`} className="text-blue-900 font-bold flex items-center space-x-1">
                                  <Phone size={10} className="mr-0.5" />
                                  <span>{resp.telefono}</span>
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Fase de Seguimiento / Tracking */}
                    <div className="pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seguimiento:</span>
                        {(() => {
                          const currentPhase = sol.faseTracking || (
                            (sol.estado === 'Aprobada' || sol.estado === 'Rechazada') 
                              ? 'resolucion' 
                              : 'recibido'
                          );
                          
                          const badgeColors = 
                            currentPhase === 'recibido' ? 'bg-blue-50 text-blue-755 border-blue-200' :
                            currentPhase === 'en_proceso' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            currentPhase === 'en_analisis' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            'bg-green-50 text-green-700 border-green-200';

                          const phaseLabel = 
                            currentPhase === 'recibido' ? 'Recibido' :
                            currentPhase === 'en_proceso' ? 'En Proceso' :
                            currentPhase === 'en_analisis' ? 'En Análisis' :
                            'Resolución';

                          return (
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${badgeColors}`}>
                              {phaseLabel}
                            </span>
                          );
                        })()}
                      </div>

                      {/* Selector para cambiar de estado */}
                      <div className="flex items-center space-x-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1 sm:hidden">Actualizar:</label>
                        <select
                          value={sol.faseTracking || 'recibido'}
                          onChange={(e) => handleUpdateTrackingPhase(sol.id, e.target.value as any)}
                          className="px-2 py-1 bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-[9px] rounded-lg outline-none cursor-pointer focus:ring-1 focus:ring-blue-900 appearance-none pr-6 relative"
                          style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'3\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center', backgroundSize: '8px' }}
                        >
                          <option value="recibido">📥 Recibido</option>
                          <option value="en_proceso">⚙️ En Proceso</option>
                          <option value="en_analisis">🔍 En Análisis</option>
                          <option value="resolucion">🛡️ Resolución</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="bg-slate-50/80 px-5 py-3 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span className="truncate max-w-[150px]" title={sol.usuarioCreador}>Por: {sol.usuarioCreador || 'Público'}</span>
                    
                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      {sol.estado === 'Pendiente' && (
                        <>
                          <button
                            onClick={() => handleUpdateSolicitudStatus(sol.id, 'Aprobada')}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded-lg shadow-sm transition-all active:scale-95"
                            title="Aprobar Solicitud"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={() => handleUpdateSolicitudStatus(sol.id, 'Rechazada')}
                            className="bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded-lg shadow-sm transition-all active:scale-95"
                            title="Rechazar Solicitud"
                          >
                            <XIcon size={12} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleToggleArchiveSolicitud(sol.id, !sol.archivada)}
                        className={`p-1.5 rounded-lg border transition-all active:scale-95 flex items-center space-x-1 ${
                          sol.archivada
                            ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                        title={sol.archivada ? "Desarchivar Solicitud" : "Archivar Solicitud"}
                      >
                        <Archive size={12} />
                        <span className="hidden sm:inline">{sol.archivada ? 'Desarchivar' : 'Archivar'}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteSolicitud(sol.id)}
                        className="bg-slate-200 hover:bg-red-50 text-slate-500 hover:text-red-600 p-1.5 rounded-lg border border-slate-300/30 transition-all active:scale-95"
                        title="Eliminar Solicitud"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const handleEditSocioClick = (socio: Socio) => {
    setEditingSocio(socio);
    setEditSocioForm({ ...socio });
    setSocioSaveError(null);
    setSocioSaveSuccess(false);
  };

  const handleCreateSocioClick = () => {
    const year = new Date().getFullYear();
    const seq = String(socios.length + 1).padStart(3, '0');
    const blankSocio: Socio = {
      id: `socio-${Date.now()}`,
      nombre: '',
      correo: '',
      telefono: '',
      rol: UserRole.SOCIO,
      puesto: 'Socio Regular',
      puestosAdicionales: [],
      codigoSocio: `CLQ-${year}-${seq}`,
      estadoCuotas: 'Al día',
      montoPendiente: 0,
      foto: 'https://picsum.photos/seed/member-' + Math.floor(Math.random() * 1000) + '/200/200',
      fechaIngreso: new Date().toISOString().split('T')[0],
      estatus: 'Active',
      club: 'QUETZALTENANGO',
      profesion: '',
      dpi: '',
      fechaNacimiento: '',
      direccion: ''
    };
    setEditingSocio(blankSocio);
    setEditSocioForm({ ...blankSocio });
    setSocioSaveError(null);
    setSocioSaveSuccess(false);
  };


  const handleDeleteSocio = async (socio: Socio) => {
    if (socio.id === user.id) {
      alert("No puedes eliminar tu propia ficha desde el panel administrativo.");
      return;
    }
    const confirmed = await showConfirm("Eliminar Socio", `¿Está completamente seguro de que desea eliminar permanentemente la ficha de ${socio.nombre}? Esta acción no se puede deshacer y borrará al socio de Firestore y del Directorio público.`, { type: 'danger', confirmText: 'Eliminar', cancelText: 'Cancelar' });
    if (!confirmed) return;

    try {
      await firebaseService.deleteSocio(socio.id);
      
      const newSociosList = socios.filter(s => s.id !== socio.id);
      setSocios(newSociosList);
      localStorage.setItem('club_leones_socios', JSON.stringify(newSociosList));
      alert("Socio eliminado con éxito.");
    } catch (err: any) {
      console.error("Error deleting socio:", err);
      alert(`Ocurrió un error al eliminar el socio: ${err?.message || err}`);
    }
  };

  const handleShareSocioLink = (socioId: string) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#/completar-ficha-socio/${socioId}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        alert("¡Enlace de autogestión copiado con éxito! Puedes enviárselo al socio para que actualice sus datos.");
      })
      .catch(err => {
        console.error("Error copying link: ", err);
        // Fallback prompt
        window.prompt("Copia este enlace de autogestión para el socio:", shareUrl);
      });
  };

  const handleEditSocioPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setSocioSaveError(validation.error || "Imagen inválida");
      return;
    }
    try {
      const compressed = await compressImageFile(file, 400, 400, 0.7);
      setEditSocioForm(prev => ({ ...prev, foto: compressed }));
    } catch (err) {
      console.error("Error compressing image:", err);
      setSocioSaveError("No se pudo procesar la imagen.");
    }
  };

  const handleSaveSocioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSocio || !editSocioForm.nombre?.trim()) {
      setSocioSaveError("El nombre es obligatorio.");
      return;
    }
    if (editSocioForm.correo?.trim() && !/\S+@\S+\.\S+/.test(editSocioForm.correo)) {
      setSocioSaveError("Ingrese un correo electrónico válido.");
      return;
    }

    setIsSavingSocio(true);
    setSocioSaveError(null);

    try {
      const updated: Socio = {
        ...editingSocio,
        ...editSocioForm,
        editadoPor: user.nombre,
        fechaEdicion: new Date().toISOString()
      } as Socio;

      await firebaseService.saveSocio(updated);
      
      let newSociosList: Socio[];
      if (isNewSocio) {
        newSociosList = [updated, ...socios];
      } else {
        newSociosList = socios.map(s => s.id === updated.id ? updated : s);
      }
      setSocios(newSociosList);
      localStorage.setItem('club_leones_socios', JSON.stringify(newSociosList));

      // If editing self, notify parent to refresh auth state
      if (updated.id === user.id && onUpdateUser) {
        onUpdateUser(updated);
      }

      setSocioSaveSuccess(true);
      showToast(isNewSocio ? '¡Socio registrado con éxito!' : '¡Ficha de socio guardada exitosamente!', 'success');
      setTimeout(() => {
        setSocioSaveSuccess(false);
        setEditingSocio(null);
      }, 1500);
    } catch (err: any) {
      console.error("Error updating socio:", err);
      setSocioSaveError(err?.message || "No se pudo actualizar la ficha.");
      showToast('Error al guardar la información del socio.', 'error');
    } finally {
      setIsSavingSocio(false);
    }
  };

  const handleDeleteActividad = async (id: string) => {
    if (!(await showConfirm("Eliminar Actividad", "¿Está seguro de que desea eliminar esta actividad?", { type: 'danger', confirmText: 'Eliminar', cancelText: 'Cancelar' }))) return;
    try {
      await firebaseService.deleteActividad(id);
      setActividades(actividades.filter(a => a.id !== id));
    } catch (err) {
      console.error("Error deleting activity from Firestore:", err);
    }
  };

  const handleUpdateVoluntarioEstado = async (id: string, nuevoEstado: 'Aprobado' | 'Rechazado') => {
    const vol = voluntarios.find(v => v.id === id);
    if (!vol) return;
    const updated: SolicitudVoluntario = {
      ...vol,
      estado: nuevoEstado
    };
    try {
      await firebaseService.saveSolicitudVoluntario(updated);
      setVoluntarios(voluntarios.map(v => v.id === id ? updated : v));
      showAlert(`Solicitud de voluntariado ${nuevoEstado === 'Aprobado' ? 'aprobada' : 'rechazada'} con éxito.`, "success");
    } catch (err) {
      console.error("Error updating volunteer status:", err);
      showAlert("No se pudo actualizar el estado de la solicitud.", "error");
    }
  };

  const handleDeleteVoluntario = async (id: string) => {
    if (!(await showConfirm("Eliminar Solicitud", "¿Está seguro de que desea eliminar esta solicitud de voluntariado?", { type: 'danger', confirmText: 'Eliminar', cancelText: 'Cancelar' }))) return;
    try {
      await firebaseService.deleteSolicitudVoluntario(id);
      setVoluntarios(voluntarios.filter(v => v.id !== id));
      showAlert("Solicitud de voluntariado eliminada exitosamente.", "success");
    } catch (err) {
      console.error("Error deleting volunteer request:", err);
      showAlert("No se pudo eliminar la solicitud.", "error");
    }
  };

  const handleDeleteActa = async (id: string) => {
    try {
      await firebaseService.deleteActa(id);
    } catch (err) {
      console.error("Error al eliminar acta de Firestore:", err);
    }
    const updated = actas.filter(a => a.id !== id);
    setActas(updated);
    localStorage.setItem('club_leones_actas', JSON.stringify(updated));
    setDeleteActaConfirmId(null);
    setDeleteActaConfirmText('');
  };

  // Filtered views
  const filteredSocios = socios.filter(s => 
    s.nombre.toLowerCase().includes(socioSearch.toLowerCase()) ||
    s.correo.toLowerCase().includes(socioSearch.toLowerCase())
  );

  const filteredSociosCuotas = useMemo(() => {
    return socios.filter(s => {
      if (s.rol === UserRole.DONANTE || s.rol === UserRole.GUEST) return false;

      const matchesSearch = 
        s.nombre.toLowerCase().includes(socioSearch.toLowerCase()) ||
        s.correo.toLowerCase().includes(socioSearch.toLowerCase()) ||
        (s.codigoSocio && s.codigoSocio.toLowerCase().includes(socioSearch.toLowerCase()));
      
      const matchesStatus = cuotasFilterStatus === 'Todos' || s.estadoCuotas === cuotasFilterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [socios, socioSearch, cuotasFilterStatus]);

  const filteredSociosAdmin = useMemo(() => {
    const list = socios.filter(s => {
      const matchesSearch = 
        s.nombre.toLowerCase().includes(socioSearch.toLowerCase()) ||
        s.correo.toLowerCase().includes(socioSearch.toLowerCase());
      
      const matchesRole = roleFilter === 'Todos' || s.rol === roleFilter;
      
      return matchesSearch && matchesRole;
    });

    // Sort: Directiva first, then standard socios, alphabetically
    return list.sort((a, b) => {
      const aDirectiva = 
        a.rol === UserRole.SUPER_ADMIN ||
        a.rol === UserRole.SECRETARIO ||
        a.rol === UserRole.TESORERO ||
        a.rol === UserRole.ASESOR_SERVICIOS ||
        a.rol === UserRole.PRESIDENTE_AFILIACION ||
        (a.puesto && a.puesto.trim() !== '' && a.puesto.toLowerCase() !== 'socio' && a.puesto.toLowerCase() !== 'socio regular');
      
      const bDirectiva = 
        b.rol === UserRole.SUPER_ADMIN ||
        b.rol === UserRole.SECRETARIO ||
        b.rol === UserRole.TESORERO ||
        b.rol === UserRole.ASESOR_SERVICIOS ||
        b.rol === UserRole.PRESIDENTE_AFILIACION ||
        (b.puesto && b.puesto.trim() !== '' && b.puesto.toLowerCase() !== 'socio' && b.puesto.toLowerCase() !== 'socio regular');

      // Directiva = 1, regular = 2
      const aRank = aDirectiva ? 1 : 2;
      const bRank = bDirectiva ? 1 : 2;
      
      if (aRank !== bRank) {
        return aRank - bRank;
      }
      
      // Fallback alphabetical by name
      return a.nombre.localeCompare(b.nombre);
    });
  }, [socios, socioSearch, roleFilter]);

  const filteredActas = actas.filter(a => {
    const matchesSearch = a.titulo.toLowerCase().includes(actaSearch.toLowerCase()) || 
                          a.contenido.toLowerCase().includes(actaSearch.toLowerCase());
    const matchesCategory = actaFilterCategory === 'Todas' || a.categoria === actaFilterCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredDonaciones = donaciones.filter(d => 
    d.donante.toLowerCase().includes(donacionSearch.toLowerCase()) ||
    d.proyecto.toLowerCase().includes(donacionSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 animate-in fade-in duration-700">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="bg-yellow-500 text-blue-900 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest animate-pulse">
            Acceso {
              user.rol === UserRole.SUPER_ADMIN ? 'Super Administrador' :
              user.rol === UserRole.TESORERO ? 'Tesorero' :
              user.rol === UserRole.SECRETARIO ? 'Secretario' : 
              user.rol === UserRole.PRESIDENTE_AFILIACION ? 'Presidente de Afiliación' : 'Asesor de Servicios'
            }
          </span>
          <h1 className="text-5xl font-black text-blue-900 tracking-tight mt-3">Panel de Gestión de Módulos</h1>
          <p className="text-lg text-slate-500 mt-2">Gestiona las actividades, finanzas, actas y beneficios del club en un solo lugar.</p>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="hidden lg:block w-[19rem] flex-shrink-0">
          <nav className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-[2.5rem] p-5 shadow-md space-y-4 sticky top-28 max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="text-xs font-black text-slate-450 uppercase tracking-widest px-2 mb-2 flex items-center justify-between">
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 mr-2 shadow-sm animate-pulse"></span>
                Módulos
              </span>
              {moduleSearchQuery && (
                <span className="text-[10px] text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md font-bold">
                  {filteredCategorias.reduce((acc, cat) => acc + cat.items.filter(item => allowedTabs.includes(item.id)).length, 0)} encontrados
                </span>
              )}
            </div>

            {/* Buscador de Módulos */}
            <div className="relative px-1">
              <Search size={14} className="absolute left-4 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar módulo..."
                value={moduleSearchQuery}
                onChange={(e) => setModuleSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white focus:border-transparent transition-all shadow-inner"
              />
              {moduleSearchQuery && (
                <button 
                  onClick={() => setModuleSearchQuery('')}
                  className="absolute right-3.5 top-2.5 p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-100 rounded-md transition-all"
                >
                  <XIcon size={10} />
                </button>
              )}
            </div>

            <div className="space-y-2">
              {filteredCategorias.map(group => {
                const visibleItems = group.items.filter(tab => allowedTabs.includes(tab.id));
                if (visibleItems.length === 0) return null;
                
                const isExpanded = moduleSearchQuery.trim() !== '' || expandedCategory === group.category;
                
                return (
                  <div key={group.category} className="border border-slate-100/70 rounded-2xl overflow-hidden shadow-sm bg-white hover:border-slate-200/60 transition-all">
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : group.category)}
                      className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                        isExpanded ? 'bg-blue-50/40 border-b border-slate-100/10' : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div 
                        className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center whitespace-nowrap overflow-hidden text-ellipsis flex-1 pr-1"
                        title={group.category}
                      >
                        <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mr-2 transition-colors ${isExpanded ? 'bg-blue-900 shadow-sm shadow-blue-900/30' : 'bg-slate-300'}`}></span>
                        {group.category}
                      </div>
                      <ChevronDown size={12} className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-900' : ''}`} />
                    </button>
                    
                    <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="p-2 space-y-1 bg-slate-50/40">
                        {visibleItems.map(tab => {
                          const Icon = tab.icon;
                          const active = activeTab === tab.id;
                          return (
                            <Link
                              key={tab.id}
                              to={`/admin?tab=${tab.id}`}
                              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-bold transition-all duration-200 group relative ${
                                getTabStyles(tab.id, active)
                              }`}
                            >
                              {active && (
                                <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r" />
                              )}
                              <Icon 
                                size={15} 
                                className={`transition-colors flex-shrink-0 ${
                                  active 
                                    ? 'text-white' 
                                    : 'text-slate-400 group-hover:text-blue-900 group-hover:scale-105'
                                }`} 
                              />
                              <span className="text-xs truncate text-left flex-1" title={tab.label}>{tab.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredCategorias.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  No se encontraron módulos
                </div>
              )}
            </div>
          </nav>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 min-w-0">
          {/* Mobile Navigation Drawer & Drawer Trigger */}
          <div className="lg:hidden flex items-center justify-between bg-white border border-slate-200/80 p-4 rounded-[2rem] mb-6 shadow-sm">
            <div className="flex items-center space-x-3">
              {(() => {
                const currentTab = [
                  { id: 'resumen', label: 'Resumen General', icon: TrendingUp },
                  { id: 'asignacion_funciones', label: 'Asignación Funciones', icon: Settings },
                  { id: 'socios', label: 'Gestión de Socios', icon: Users },
                  { id: 'calendario', label: 'Actividades', icon: Calendar },
                  { id: 'cuotas', label: 'Control de Cuotas', icon: CreditCard },
                  { id: 'actas', label: 'Libro de Actas', icon: FileText },
                  { id: 'donaciones', label: 'Donaciones Recibidas', icon: Gift },
                  { id: 'beneficios', label: 'Beneficios a Socios', icon: Award },
                  { id: 'parqueo', label: 'Gestión de Parqueo', icon: Car },
                  { id: 'presupuestos', label: 'Presupuestos', icon: DollarSign },
                  { id: 'comisiones', label: 'Gestión de Comisiones', icon: Briefcase },
                  { id: 'minutas', label: 'Minutas de Comisiones', icon: FileText },
                  { id: 'afiliacion', label: 'Propuestas de Socios', icon: UserCheck },
                  { id: 'inventario', label: 'Inventario', icon: Archive },
                  { id: 'galeria_admin', label: 'Gestión de Galería', icon: Camera },
                  { id: 'linea_tiempo_admin', label: 'Línea de Tiempo', icon: Clock },
                  { id: 'agenda_contactos', label: 'Agenda de Contactos', icon: BookUser },
                  { id: 'presidencia', label: 'Gestión de Solicitudes', icon: Layers },
                  { id: 'agendas_reunion', label: 'Agendas de Reunión', icon: FileText },
                  { id: 'ranking_lionistico', label: 'Ranking Lionístico', icon: Trophy }
                ].find(t => t.id === activeTab);
                if (currentTab) {
                  const Icon = currentTab.icon;
                  return (
                    <div className="bg-blue-50 p-2 rounded-xl text-blue-900 shadow-inner">
                      <Icon size={18} />
                    </div>
                  );
                }
                return null;
              })()}
              <span className="font-extrabold text-slate-800 text-xs">
                {[
                  { id: 'resumen', label: 'Resumen General' },
                  { id: 'asignacion_funciones', label: 'Asignación Funciones' },
                  { id: 'socios', label: 'Gestión de Socios' },
                  { id: 'calendario', label: 'Actividades' },
                  { id: 'cuotas', label: 'Control de Cuotas' },
                  { id: 'actas', label: 'Libro de Actas' },
                  { id: 'donaciones', label: 'Donaciones Recibidas' },
                  { id: 'beneficios', label: 'Beneficios a Socios' },
                  { id: 'parqueo', label: 'Gestión de Parqueo' },
                  { id: 'presupuestos', label: 'Presupuestos' },
                  { id: 'comisiones', label: 'Gestión de Comisiones' },
                  { id: 'minutas', label: 'Minutas de Comisiones' },
                  { id: 'afiliacion', label: 'Propuestas de Socios' },
                  { id: 'inventario', label: 'Inventario' },
                  { id: 'galeria_admin', label: 'Gestión de Galería' },
                  { id: 'linea_tiempo_admin', label: 'Línea de Tiempo' },
                  { id: 'agenda_contactos', label: 'Agenda de Contactos' },
                  { id: 'presidencia', label: 'Gestión de Solicitudes' },
                  { id: 'agendas_reunion', label: 'Agendas de Reunión' },
                  { id: 'ranking_lionistico', label: 'Ranking Lionístico' }
                ].find(t => t.id === activeTab)?.label}
              </span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-blue-900 to-indigo-955 text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-md hover:shadow-lg active:scale-95 transition-all"
            >
              <Layers size={14} />
              <span>Ver Módulos</span>
            </button>
          </div>

          {/* Mobile Drawer Overlay */}
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="w-[18.5rem] max-w-[80vw] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 relative overflow-hidden">
                {/* Decorative Top Accent Line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-900 to-indigo-750" />
                
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 mt-1">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Módulos
                  </span>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-700 transition-colors active:scale-90"
                  >
                    <XIcon size={16} />
                  </button>
                </div>
                
                {/* Search Box */}
                <div className="p-4 border-b border-slate-100 relative">
                  <Search size={14} className="absolute left-7 top-6.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar módulo..."
                    value={moduleSearchQuery}
                    onChange={(e) => setModuleSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white focus:border-transparent transition-all"
                  />
                  {moduleSearchQuery && (
                    <button 
                      onClick={() => setModuleSearchQuery('')}
                      className="absolute right-7 top-5.5 p-1 text-slate-400 hover:bg-slate-100 rounded-md"
                    >
                      <XIcon size={10} />
                    </button>
                  )}
                </div>

                {/* Modules List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {filteredCategorias.map(group => {
                    const visibleItems = group.items.filter(tab => allowedTabs.includes(tab.id));
                    if (visibleItems.length === 0) return null;
                    
                    return (
                      <div key={group.category} className="space-y-1">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 py-1 flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2"></span>
                          {group.category}
                        </div>
                        {visibleItems.map(tab => {
                          const Icon = tab.icon;
                          const active = activeTab === tab.id;
                          return (
                            <Link
                              key={tab.id}
                              to={`/admin?tab=${tab.id}`}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-bold transition-all text-left ${
                                active
                                  ? 'bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-md'
                                  : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <Icon size={15} className={active ? 'text-white' : 'text-slate-400'} />
                              <span className="text-xs truncate flex-1">{tab.label}</span>
                              {active && <Check size={14} className="text-white" />}
                            </Link>
                          );
                        })}
                      </div>
                    );
                  })}
                  {filteredCategorias.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-xs italic">
                      No se encontraron módulos
                    </div>
                  )}
                </div>
              </div>
              {/* Click outside to close */}
              <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
            </div>
          )}
          {/* TAB: GESTIÓN DE SOCIOS */}
          {activeTab === 'socios' && (
            <div className="space-y-10 animate-in fade-in duration-500">
              
              {/* Legend visual card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
                <div className="flex items-center space-x-3 p-3 bg-amber-50/60 rounded-2xl border border-amber-100">
                  <div className="w-4 h-4 rounded-full bg-amber-500 border border-amber-600 flex-shrink-0" />
                  <div>
                    <p className="font-extrabold text-amber-900">Junta Directiva</p>
                    <p className="text-[10px] text-amber-700">Miembros con cargos directivos activos.</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-blue-50/60 rounded-2xl border border-blue-100">
                  <div className="w-4 h-4 rounded-full bg-blue-900 border border-blue-800 flex-shrink-0" />
                  <div>
                    <p className="font-extrabold text-blue-900">Socio Activo</p>
                    <p className="text-[10px] text-blue-700">Miembros activos con rol estándar.</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-slate-100/60 rounded-2xl border border-slate-200 flex-shrink-0 bg-slate-50">
                  <div className="w-4 h-4 rounded-full bg-slate-400 border border-slate-500 flex-shrink-0" />
                  <div>
                    <p className="font-extrabold text-slate-800">Inactivo</p>
                    <p className="text-[10px] text-slate-600">Miembros retirados u ocultos del directorio.</p>
                  </div>
                </div>
              </div>

              {/* Filters card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-xs font-bold text-slate-450 uppercase tracking-widest flex items-center">
                    <Filter size={14} className="mr-1.5 text-slate-400" />
                    Búsqueda y Filtros de Directorio
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateSocioClick}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-5 py-2.5 rounded-xl text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 w-full sm:w-auto"
                  >
                    <Plus size={16} />
                    <span>Registrar Socio</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Text Search */}
                  <div className="relative">
                    <Search size={18} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Buscar por nombre o correo..."
                      value={socioSearch}
                      onChange={e => setSocioSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-semibold"
                    />
                  </div>

                  {/* Role filter */}
                  <div>
                    <select 
                      value={roleFilter}
                      onChange={e => setRoleFilter(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-semibold bg-white"
                    >
                      <option value="Todos">Rol: Todos</option>
                      {rolesConfig.map(r => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* List display */}
              <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-sm overflow-hidden">
                {isLoadingSocios ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="animate-spin text-blue-900" size={36} />
                    <p className="text-slate-500 font-bold text-sm">Cargando directorio de socios...</p>
                  </div>
                ) : filteredSociosAdmin.length === 0 ? (
                  <div className="text-center py-16 space-y-4">
                    <Users className="mx-auto text-slate-300" size={48} />
                    <h4 className="text-lg font-bold text-slate-700">No se encontraron socios</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">Prueba cambiando los filtros o el texto del buscador.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                    {filteredSociosAdmin.map(socio => {
                      const isDirectiva = 
                        socio.rol === UserRole.SUPER_ADMIN ||
                        socio.rol === UserRole.SECRETARIO ||
                        socio.rol === UserRole.TESORERO ||
                        socio.rol === UserRole.ASESOR_SERVICIOS ||
                        socio.rol === UserRole.PRESIDENTE_AFILIACION ||
                        (socio.puesto && socio.puesto.trim() !== '' && socio.puesto.toLowerCase() !== 'socio' && socio.puesto.toLowerCase() !== 'socio regular');

                      // Layout color definitions
                      const cardBgColor = isDirectiva ? 'bg-amber-50/10' : 'bg-white';
                      const cardBorderColor = isDirectiva ? 'border-amber-200' : 'border-blue-100';
                      const leftBorderAccent = isDirectiva ? 'border-l-8 border-l-amber-500' : 'border-l-8 border-l-blue-900';
                      const avatarBorder = isDirectiva ? 'border-amber-400' : 'border-blue-900';

                      return (
                        <div 
                          key={socio.id}
                          className={`bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl border ${cardBorderColor} ${leftBorderAccent} ${cardBgColor} transition-all duration-300 flex flex-col justify-between p-6 space-y-4`}
                        >
                          {/* Top Info Header */}
                          <div className="flex items-start space-x-4">
                            <img 
                              src={socio.foto || `https://picsum.photos/seed/${socio.id}/100/100`} 
                              alt={socio.nombre} 
                              className={`w-16 h-16 rounded-full object-cover border-2 shadow-sm cursor-zoom-in ${avatarBorder}`}
                              onClick={() => setSelectedPhoto({ url: socio.foto, title: socio.nombre })}
                            />
                            <div className="min-w-0 flex-1 text-left">
                              <h4 className="font-extrabold text-slate-900 text-base leading-snug break-words flex flex-wrap items-center gap-1.5">
                                {socio.nombre || <span className="text-slate-400 italic">Sin nombre</span>}
                              </h4>
                              {socio.codigoSocio && (
                                <span className="inline-block text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded mt-1 border border-blue-100/60">
                                  # {socio.codigoSocio}
                                </span>
                              )}
                              <p className="text-xs text-slate-450 font-semibold mt-1">Ingresó: {socio.fechaIngreso}</p>
                            </div>
                          </div>

                          {/* Badges / Roles */}
                          <div className="flex flex-wrap gap-1.5 pt-1 text-left">
                            <span className="text-[10px] font-bold text-slate-800 bg-slate-100/80 px-2.5 py-0.5 rounded-lg border border-slate-200/50">
                              {socio.puesto || 'Socio Regular'}
                            </span>
                            {(socio.puestosAdicionales || []).map((pa, pi) => (
                              <span key={pi} className="text-[9px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60">
                                + {pa}
                              </span>
                            ))}
                            
                            {isDirectiva && (
                              <div className="w-full flex items-center space-x-1.5 mt-1">
                                <span className="bg-amber-100 text-amber-800 border border-amber-250 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center">
                                  <Star size={8} className="mr-1 text-amber-600 fill-amber-600 animate-pulse" />
                                  Junta Directiva
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Contact Info Section */}
                          <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50 space-y-2 text-xs font-semibold text-left">
                            {socio.profesion && (
                              <div className="flex items-center text-slate-700">
                                <Briefcase size={12} className="mr-2 text-slate-405 flex-shrink-0" />
                                <span className="truncate" title={socio.profesion}>{socio.profesion}</span>
                              </div>
                            )}
                            <div className="flex items-center text-slate-700">
                              <Mail size={12} className="mr-2 text-slate-405 flex-shrink-0" />
                              <span className="truncate" title={socio.correo}>{socio.correo}</span>
                            </div>
                            <div className="flex items-center text-slate-600">
                              <Phone size={12} className="mr-2 text-slate-405 flex-shrink-0" />
                              <span>{socio.telefono || 'Sin teléfono'}</span>
                            </div>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="flex flex-wrap items-center justify-end gap-1.5 pt-3 border-t border-slate-100">
                            <button
                              onClick={() => handleShareSocioLink(socio.id)}
                              className="bg-white hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 border border-slate-200/60 px-3 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center shadow-sm"
                              title="Copiar enlace de autogestión para el socio"
                            >
                              <Share2 size={13} className="mr-1.5" />
                              <span>Enlace</span>
                            </button>
                            <button
                              onClick={() => handleQrClick(socio)}
                              className="bg-white hover:bg-yellow-50 text-amber-600 hover:text-amber-700 border border-slate-200/60 px-3 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center shadow-sm disabled:opacity-50"
                              title="Generar código QR de acceso"
                              disabled={isGeneratingQr}
                            >
                              <QrCode size={13} className="mr-1.5" />
                              <span>QR</span>
                            </button>
                            <button
                              onClick={() => handleEditSocioClick(socio)}
                              className="bg-white hover:bg-blue-50 text-slate-650 hover:text-blue-900 border border-slate-200/60 px-3 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center shadow-sm"
                              title="Editar Ficha"
                            >
                              <Pencil size={13} className="mr-1.5" />
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={() => handleDeleteSocio(socio)}
                              className="bg-white hover:bg-red-50 text-slate-650 hover:text-red-650 border border-slate-200/60 px-3 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center shadow-sm"
                              title="Eliminar Socio"
                            >
                              <Trash2 size={13} className="mr-1.5" />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'resumen' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Welcome Hero Banner */}
              <div className="bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-blue-950">
                {/* Decorative glowing sphere */}
                <div className="absolute -right-16 -top-16 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-16 -bottom-16 w-60 h-60 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 space-y-2">
                  <div className="flex items-center space-x-2.5">
                    <span className="bg-yellow-500 text-blue-955 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      {user.rol === UserRole.SUPER_ADMIN ? 'Super Administrador' :
                       user.rol === UserRole.TESORERO ? 'Tesorero' :
                       user.rol === UserRole.SECRETARIO ? 'Secretario' : 
                       user.rol === UserRole.PRESIDENTE_AFILIACION ? 'Presidente de Afiliación' : 'Asesor de Servicios'}
                    </span>
                    <span className="text-xs text-blue-200 font-semibold">• Sesión Activa</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-serif font-black text-white">¡Hola, {user.nombre}!</h2>
                  <p className="text-sm text-slate-300 font-medium">
                    Bienvenido al panel general. Aquí tienes el estado en tiempo real del club para hoy.
                  </p>
                </div>
                
                <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-3xl text-right flex flex-col items-start md:items-end gap-1 flex-shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Fecha del Sistema</span>
                  <span className="font-extrabold text-white text-base">
                    {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                  <span className="text-xs text-blue-200 font-bold">{new Date().getFullYear()} • Quetzaltenango</span>
                </div>
              </div>

              {/* Quick Action Hub */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Accesos Rápidos</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                  {[
                    { label: 'Control Cuotas', tab: 'cuotas', icon: CreditCard, color: 'text-emerald-700 bg-emerald-50/60 border-emerald-100/80 hover:bg-emerald-100/60' },
                    { label: 'Ver Calendario', tab: 'calendario', icon: Calendar, color: 'text-amber-700 bg-amber-50/60 border-amber-100/80 hover:bg-amber-100/60' },
                    { label: 'Libro de Actas', tab: 'actas', icon: FileText, color: 'text-indigo-700 bg-indigo-50/60 border-indigo-100/80 hover:bg-indigo-100/60' },
                    { label: 'Ver Solicitudes', tab: 'presidencia', icon: Layers, color: 'text-blue-700 bg-blue-50/60 border-blue-100/80 hover:bg-blue-100/60' },
                    { label: 'Propuestas Socio', tab: 'afiliacion', icon: UserCheck, color: 'text-purple-700 bg-purple-50/60 border-purple-100/80 hover:bg-purple-100/60' },
                    { label: 'Ver Contactos', tab: 'agenda_contactos', icon: BookUser, color: 'text-slate-700 bg-slate-50 border-slate-200/80 hover:bg-slate-100/60' }
                  ].map(act => {
                    const Icon = act.icon;
                    const isAllowed = allowedTabs.includes(act.tab);
                    if (!isAllowed) return null;
                    
                    return (
                      <Link
                        key={act.label}
                        to={`/admin?tab=${act.tab}`}
                        className={`flex flex-col items-center justify-center p-5 rounded-[2rem] border text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md font-bold text-xs gap-3 ${act.color}`}
                      >
                        <div className="p-3 rounded-2xl bg-white shadow-inner flex-shrink-0">
                          <Icon size={20} />
                        </div>
                        <span>{act.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* KPIs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Socios Activos Card */}
                <div className="bg-gradient-to-br from-blue-900 to-indigo-950 p-6 rounded-[2.5rem] text-white shadow-lg relative overflow-hidden group hover:scale-[1.01] hover:shadow-xl transition-all duration-300">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Users size={120} />
                  </div>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="text-blue-200 text-xs font-bold uppercase tracking-widest">Estado de Socios</h3>
                      <p className="text-3xl font-black">{sociosAlDia} / {socios.length}</p>
                      <p className="text-[10px] text-yellow-400 font-semibold mt-1">
                        Solventes ({socios.length > 0 ? Math.round((sociosAlDia / socios.length) * 100) : 0}% del total)
                      </p>
                    </div>
                    {/* SVG Circular Progress Indicator */}
                    <div className="relative w-16 h-16 flex items-center justify-center bg-white/5 rounded-full p-2 border border-white/10">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="25"
                          className="stroke-white/10 fill-none"
                          strokeWidth="3.5"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="25"
                          className="stroke-yellow-400 fill-none transition-all duration-1000"
                          strokeWidth="3.5"
                          strokeDasharray={2 * Math.PI * 25}
                          strokeDashoffset={2 * Math.PI * 25 * (1 - (socios.length > 0 ? sociosAlDia / socios.length : 0))}
                        />
                      </svg>
                      <span className="absolute text-[10px] font-black">
                        {socios.length > 0 ? Math.round((sociosAlDia / socios.length) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full mt-5 overflow-hidden">
                    <div 
                      className="bg-yellow-450 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${socios.length > 0 ? (sociosAlDia / socios.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Donaciones Totales Card */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-md relative overflow-hidden group hover:scale-[1.01] hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-emerald-800">
                    <Gift size={120} />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-50 p-4 rounded-3xl text-emerald-700">
                      <Gift size={24} />
                    </div>
                    <div>
                      <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Donaciones</h3>
                      <p className="text-3xl font-black text-slate-800 mt-1">Q {totalDonaciones.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
                      <div className="flex items-center text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg w-fit mt-1 font-bold">
                        <CheckCircle size={10} className="mr-1" /> Acumulado anual
                      </div>
                    </div>
                  </div>
                </div>

                {/* Saldo Pendiente Card */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-md relative overflow-hidden group hover:scale-[1.01] hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-amber-850">
                    <CreditCard size={120} />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-50/70 p-4 rounded-3xl text-amber-600">
                      <CreditCard size={24} />
                    </div>
                    <div>
                      <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Saldo Pendiente</h3>
                      <p className="text-3xl font-black text-slate-800 mt-1">Q {totalCuotasPendientes.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
                      <div className="flex items-center text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg w-fit mt-1 font-bold">
                        <AlertTriangle size={10} className="mr-1 animate-pulse" /> Requiere seguimiento
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actividades Planificadas Card */}
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-6 rounded-[2.5rem] text-white shadow-lg relative overflow-hidden group hover:scale-[1.01] hover:shadow-xl transition-all duration-300">
                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Calendar size={120} />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-white/10 p-4 rounded-3xl text-white border border-white/10 shadow-inner">
                      <Calendar size={24} />
                    </div>
                    <div>
                      <h3 className="text-amber-100 text-xs font-bold uppercase tracking-widest">Actividades</h3>
                      <p className="text-3xl font-black mt-1">{actividades.length} Planificadas</p>
                      <p className="text-[10px] text-yellow-100 font-semibold mt-1">En agenda del club</p>
                    </div>
                  </div>
                </div>

                {/* Biblioteca de Actas Card */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-md relative overflow-hidden group hover:scale-[1.01] hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-blue-900">
                    <FileText size={120} />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-50 p-4 rounded-3xl text-blue-800">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Actas Registradas</h3>
                      <p className="text-3xl font-black text-slate-800 mt-1">{actas.length} redactadas</p>
                      <div className="flex items-center text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg w-fit mt-1 font-bold">
                        <CheckCircle size={10} className="mr-1" /> Archivo oficial
                      </div>
                    </div>
                  </div>
                </div>

                {/* Crecimiento Anual Card */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-md relative overflow-hidden group hover:scale-[1.01] hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-purple-900">
                    <Users size={120} />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-purple-50 p-4 rounded-3xl text-purple-800">
                      <Users size={24} />
                    </div>
                    <div>
                      <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Nuevos Socios</h3>
                      <p className="text-3xl font-black text-slate-800 mt-1">
                        {socios.filter(s => new Date(s.fechaIngreso).getFullYear() === new Date().getFullYear()).length} Nuevos
                      </p>
                      <div className="flex items-center text-[10px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg w-fit mt-1 font-bold">
                        <TrendingUp size={10} className="mr-1" /> Crecimiento {new Date().getFullYear()}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Data Visualization Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                
                {/* Solicitudes por Categoría Chart */}
                <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Estadísticas de Solicitudes</h3>
                    <p className="text-xs text-slate-450 font-bold">Distribución de las solicitudes registradas en Firestore</p>
                  </div>
                  <div className="h-64 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={solicitudesStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                          cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }}
                        />
                        <Bar dataKey="cantidad" radius={[8, 8, 0, 0]}>
                          {solicitudesStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Estatus Financiero Donut Chart */}
                <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Estatus de Solvencia</h3>
                    <p className="text-xs text-slate-450 font-bold">Estado financiero general de las cuotas de socios</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-around gap-6 h-full py-4">
                    <div className="relative w-44 h-44 flex-shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={cuotasStats}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {cuotasStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-black text-slate-800">{socios.length}</span>
                        <span className="text-[9px] font-black uppercase text-slate-400">Socios</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 w-full max-w-xs">
                      {cuotasStats.map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700">
                          <div className="flex items-center space-x-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span>{entry.name}</span>
                          </div>
                          <span className="bg-slate-200/70 text-slate-800 px-2.5 py-0.5 rounded-lg text-[10px] font-black">
                            {entry.value} ({socios.length > 0 ? Math.round((entry.value / socios.length) * 100) : 0}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Connected Real-time Lists */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                
                {/* Real-time Solicitudes Recientes List */}
                <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight">Solicitudes de Ayuda</h3>
                      <p className="text-xs text-slate-450 font-bold">Últimas solicitudes ingresadas en Firestore</p>
                    </div>
                    <Link to="/admin?tab=presidencia" className="text-xs text-blue-900 font-bold hover:underline">Ver todas</Link>
                  </div>
                  <div className="space-y-4">
                    {solicitudes.slice(0, 4).map(s => {
                      const theme = TEMA_COLOR_MAP[s.tipo] || 'blue';
                      const accent = THEME_ACCENTS[theme] || THEME_ACCENTS.blue;
                      
                      return (
                        <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100/50 transition-colors gap-3">
                          <div className="flex items-center min-w-0">
                            <div className={`p-3 rounded-xl mr-4 flex-shrink-0 ${accent.bg} ${accent.text}`}>
                              <Accessibility size={20} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-slate-800 text-sm truncate">
                                {s.tipo === 'sillas' ? s.nombreBeneficiario : s.nombre || s.salonNombreSolicitante || 'Solicitud'}
                              </p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border rounded-md ${accent.badge}`}>
                                  {s.tipo === 'sillas' ? 'Silla de Ruedas' : 
                                   s.tipo === 'salon' ? 'Salón/Parqueo' : 
                                   s.tipo === 'agenda' ? 'Punto de Agenda' : 
                                   s.tipo === 'internas' ? 'Interna' : 'Abierta'}
                                </span>
                                <span className="text-[10px] text-slate-450 font-bold">
                                  {s.fechaCreacion ? s.fechaCreacion.split('T')[0] : 'Sin fecha'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-end gap-2.5">
                            {s.faseTracking && (
                              <span className="text-[9px] font-extrabold bg-blue-50 text-blue-800 border border-blue-100 px-2 py-1 rounded-lg uppercase tracking-wider">
                                {s.faseTracking === 'recibido' ? 'Recibido' :
                                 s.faseTracking === 'en_proceso' ? 'En Proceso' :
                                 s.faseTracking === 'en_analisis' ? 'En Análisis' : 'Resuelta'}
                              </span>
                            )}
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                              s.estado === 'Aprobada' ? 'bg-green-50 text-green-700' :
                              s.estado === 'Rechazada' ? 'bg-red-50 text-red-700' :
                              'bg-amber-50 text-amber-700 border border-amber-200/50'
                            }`}>
                              {s.estado}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {solicitudes.length === 0 && (
                      <div className="text-center text-slate-400 text-xs py-8 italic border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        No hay solicitudes registradas en el sistema.
                      </div>
                    )}
                  </div>
                </div>

                {/* Cobros Pendientes */}
                <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight">Cobros Pendientes</h3>
                      <p className="text-xs text-slate-450 font-bold">Socios con saldo pendiente de pago</p>
                    </div>
                    <Link to="/admin?tab=cuotas" className="text-xs text-blue-900 font-bold hover:underline">Gestionar cuotas</Link>
                  </div>
                  <div className="space-y-4">
                    {socios.filter(s => s.montoPendiente > 0).slice(0, 4).map(s => (
                      <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                        <div className="flex items-center min-w-0">
                          <img 
                            src={s.foto} 
                            alt={s.nombre} 
                            className="w-10 h-10 rounded-full border border-slate-100 object-cover mr-4 cursor-zoom-in flex-shrink-0" 
                            onClick={() => setSelectedPhoto({ url: s.foto, title: s.nombre })}
                          />
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-800 text-sm truncate">{s.nombre}</p>
                            <p className="text-xs text-slate-400 mt-0.5 truncate">{s.puesto || 'Socio Regular'}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg ${
                            s.estadoCuotas === 'En mora' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {s.estadoCuotas}
                          </span>
                          <span className="text-sm font-black text-red-600 bg-red-50/50 px-3 py-1 rounded-xl">
                            Q {s.montoPendiente.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {socios.filter(s => s.montoPendiente > 0).length === 0 && (
                      <div className="text-center text-slate-400 text-xs py-8 italic border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        ¡Todo al día! No hay cobros pendientes.
                      </div>
                    )}
                  </div>
                </div>

                {/* Próximas Actividades */}
                <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight">Próximos Programas</h3>
                      <p className="text-xs text-slate-450 font-bold">Actividades en la agenda del club</p>
                    </div>
                    <Link to="/admin?tab=calendario" className="text-xs text-blue-900 font-bold hover:underline">Ver todas</Link>
                  </div>
                  <div className="space-y-4">
                    {actividades.slice(0, 4).map(act => (
                      <div key={act.id} className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                        <div className="bg-blue-50 text-blue-900 p-3 rounded-xl mr-4 flex-shrink-0">
                          <Calendar size={20} />
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="font-extrabold text-slate-800 text-sm truncate">{act.titulo}</p>
                          <p className="text-xs text-slate-450 font-medium mt-1 truncate">{act.fecha} • {act.lugar}</p>
                        </div>
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase ml-3 flex-shrink-0 ${
                          act.publica ? 'bg-green-50 text-green-700 border border-green-200/50' : 'bg-blue-50 text-blue-700 border border-blue-200/50'
                        }`}>
                          {act.publica ? 'Público' : 'Socio'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actas Recientes */}
                <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight">Libro de Actas</h3>
                      <p className="text-xs text-slate-450 font-bold">Últimas actas redactadas en biblioteca</p>
                    </div>
                    <Link to="/admin?tab=actas" className="text-xs text-blue-900 font-bold hover:underline">Ver biblioteca</Link>
                  </div>
                  <div className="space-y-4">
                    {actas.slice(0, 4).map(acta => (
                      <div key={acta.id} className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                        <div className="bg-amber-50 text-amber-600 p-3 rounded-xl mr-4 flex-shrink-0">
                          <FileText size={20} />
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="font-extrabold text-slate-800 text-sm truncate">{acta.titulo}</p>
                          <p className="text-xs text-slate-450 font-medium mt-1 truncate">Por {acta.autor} • {acta.fecha}</p>
                        </div>
                        <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full uppercase ml-3 flex-shrink-0 border border-slate-200">
                          {acta.categoria || 'Reunión'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB: ACTIVIDADES */}
          {activeTab === 'calendario' && <AdminCalendario />}

          {/* TAB: CONTROL DE CUOTAS */}
          {activeTab === 'cuotas' && <AdminCuotas />}

          {/* TAB: LIBRO DE ACTAS */}
          {activeTab === 'actas' && <AdminActas user={user} />}

          {/* TAB: DONACIONES RECIBIDAS */}
          {activeTab === 'donaciones' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">Registro de Donaciones</h3>
                <button 
                  onClick={() => setShowAddDonacion(true)}
                  className="bg-blue-900 hover:bg-blue-800 text-white font-black px-6 py-3 rounded-xl flex items-center space-x-2 shadow-lg shadow-blue-900/10"
                >
                  <Plus size={18} />
                  <span>Registrar Donación</span>
                </button>
              </div>

              {/* Add Donacion Modal */}
              {showAddDonacion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
                  <form onSubmit={handleAddDonacion} className="bg-white rounded-[2.5rem] p-10 md:p-12 max-w-lg w-full space-y-8 shadow-2xl border border-slate-100">
                    <div className="flex justify-between items-center">
                      <h4 className="text-2xl font-black text-slate-800">Registrar Donación Entrante</h4>
                      <button type="button" onClick={() => setShowAddDonacion(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><XIcon size={20} /></button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Nombre del Donante</label>
                        <input 
                          type="text" 
                          required 
                          value={newDonacion.donante} 
                          onChange={e => setNewDonacion({...newDonacion, donante: e.target.value})}
                          placeholder="Ej. Fundación Tigo o Nombre de Socio"
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Monto de Donación (Q)</label>
                          <div className="relative">
                            <span className="absolute left-4 top-3.5 text-slate-400 font-bold">Q</span>
                            <input 
                              type="number" 
                              required 
                              min="0"
                              step="0.01"
                              value={newDonacion.monto} 
                              onChange={e => setNewDonacion({...newDonacion, monto: e.target.value})}
                              placeholder="0.00"
                              className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all font-bold"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Donante</label>
                          <select
                            value={newDonacion.tipo}
                            onChange={e => setNewDonacion({...newDonacion, tipo: e.target.value as any})}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-slate-700 font-bold"
                          >
                            <option value="Individual">Individual</option>
                            <option value="Empresarial">Empresarial</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Proyecto o Causa Destinada</label>
                        <input 
                          type="text" 
                          required 
                          value={newDonacion.proyecto} 
                          onChange={e => setNewDonacion({...newDonacion, proyecto: e.target.value})}
                          placeholder="Ej. Jornada Médica 2024"
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-4 pt-4">
                      <button 
                        type="button" 
                        onClick={() => setShowAddDonacion(false)}
                        className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        className="w-1/2 bg-blue-900 hover:bg-blue-800 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-blue-900/10"
                      >
                        Registrar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Table of Donations */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-sm overflow-hidden">
                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold text-xs uppercase tracking-wider">
                        <th className="py-7 px-6">Donante</th>
                        <th className="py-7 px-6">Fecha</th>
                        <th className="py-7 px-6">Proyecto</th>
                        <th className="py-7 px-6">Tipo</th>
                        <th className="py-7 px-6 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredDonaciones.map(don => (
                        <tr key={don.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-7 px-6 font-extrabold text-slate-800 text-base">{don.donante}</td>
                          <td className="py-7 px-6 text-sm text-slate-500 font-medium">{don.fecha}</td>
                          <td className="py-7 px-6 text-sm text-slate-600 font-bold">{don.proyecto}</td>
                          <td className="py-7 px-6">
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                              don.tipo === 'Empresarial' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {don.tipo}
                            </span>
                          </td>
                          <td className="py-7 px-6 text-right font-black text-blue-900 text-lg">Q {don.monto.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View: Cards */}
                <div className="block md:hidden divide-y divide-slate-100">
                  {filteredDonaciones.map(don => (
                    <div key={don.id} className="p-6 space-y-4 hover:bg-slate-50/30 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-base leading-snug">{don.donante}</h4>
                          <span className={`inline-block text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase mt-1.5 ${
                            don.tipo === 'Empresarial' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-605'
                          }`}>
                            {don.tipo}
                          </span>
                        </div>
                        <span className="font-black text-blue-900 text-base">
                          Q {don.monto.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs font-semibold pt-1">
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase tracking-wider block mb-0.5">Fecha</span>
                          <span className="text-slate-700">{don.fecha}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase tracking-wider block mb-0.5">Proyecto / Causa</span>
                          <span className="text-slate-700 font-bold block truncate">{don.proyecto}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: BENEFICIOS DE SOCIOS */}
          {activeTab === 'beneficios' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">Beneficios y Convenios del Socio</h3>
                <button 
                  onClick={() => setShowAddBeneficio(true)}
                  className="bg-blue-900 hover:bg-blue-800 text-white font-black px-6 py-3 rounded-xl flex items-center space-x-2 shadow-lg shadow-blue-900/10"
                >
                  <Plus size={18} />
                  <span>Añadir Convenio</span>
                </button>
              </div>

              {/* Add Beneficio Modal */}
              {showAddBeneficio && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-300">
                  <form 
                    onSubmit={handleAddBeneficio} 
                    className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-10 space-y-6 relative animate-in zoom-in-95 duration-300 text-left"
                  >
                    <button 
                      type="button" 
                      onClick={() => setShowAddBeneficio(false)} 
                      className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
                    >
                      <XIcon size={20} />
                    </button>

                    <div className="pb-2">
                      <h4 className="text-2xl font-black text-slate-800 tracking-tight">Añadir Beneficio/Convenio</h4>
                      <p className="text-slate-500 text-xs mt-1 font-semibold">Completa los campos para registrar un nuevo beneficio del club.</p>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Nombre del Beneficio</label>
                        <input 
                          type="text" 
                          required 
                          value={newBeneficio.titulo} 
                          onChange={e => setNewBeneficio({...newBeneficio, titulo: e.target.value})}
                          placeholder="Ej. Descuento en Consultas Dentales"
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-semibold text-slate-800 bg-white"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Establecimiento / Alianza</label>
                          <input 
                            type="text" 
                            required 
                            value={newBeneficio.convenioCon} 
                            onChange={e => setNewBeneficio({...newBeneficio, convenioCon: e.target.value})}
                            placeholder="Ej. Clínica Dental Xela"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-semibold text-slate-800 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Descuento Ofrecido</label>
                          <input 
                            type="text" 
                            required 
                            value={newBeneficio.descuento} 
                            onChange={e => setNewBeneficio({...newBeneficio, descuento: e.target.value})}
                            placeholder="Ej. 20% o Q50"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-semibold text-slate-800 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Categoría</label>
                        <select
                          value={newBeneficio.categoria}
                          onChange={e => setNewBeneficio({...newBeneficio, categoria: e.target.value as any})}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700 bg-white cursor-pointer"
                        >
                          <option value="Salud">Salud</option>
                          <option value="Comercio">Comercio</option>
                          <option value="Recreación">Recreación</option>
                          <option value="Otros">Otros</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Descripción Corta</label>
                        <textarea 
                          rows={3} 
                          value={newBeneficio.descripcion} 
                          onChange={e => setNewBeneficio({...newBeneficio, descripcion: e.target.value})}
                          placeholder="Detalles sobre cómo aplicar el beneficio..."
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all resize-none text-sm font-semibold text-slate-800 bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-4 pt-4">
                      <button 
                        type="button" 
                        onClick={() => setShowAddBeneficio(false)}
                        className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        className="w-1/2 bg-blue-900 hover:bg-blue-800 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-blue-900/10"
                      >
                        Añadir
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Beneficios List */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {beneficios.map(ben => (
                  <div key={ben.id} className="bg-white p-8 md:p-9 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                          ben.categoria === 'Salud' 
                            ? 'bg-blue-50 text-blue-700' 
                            : ben.categoria === 'Comercio' 
                              ? 'bg-red-50 text-red-700' 
                              : ben.categoria === 'Recreación'
                                ? 'bg-yellow-50 text-yellow-700'
                                : 'bg-green-50 text-green-700'
                        }`}>
                          {ben.categoria}
                        </span>
                        <span className="text-xl font-black text-blue-900 pr-4">{ben.descuento} Desc.</span>
                      </div>
                      
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-lg leading-snug group-hover:text-blue-900 transition-colors">{ben.titulo}</h4>
                        <p className="text-xs text-slate-400 mt-1 font-semibold uppercase">{ben.convenioCon}</p>
                      </div>

                      <p className="text-slate-500 text-sm leading-relaxed">{ben.descripcion}</p>
                    </div>

                    <div className="border-t border-slate-100 mt-6 pt-4 flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activo</span>
                      <button 
                        onClick={async () => {
                          const confirmed = await showConfirm(
                            "Eliminar Convenio",
                            `¿Está seguro de que desea eliminar el convenio "${ben.titulo}" permanentemente?`,
                            { type: 'danger', confirmText: 'Eliminar', cancelText: 'Cancelar' }
                          );
                          if (confirmed) {
                            const updated = beneficios.filter(b => b.id !== ben.id);
                            setBeneficios(updated);
                            localStorage.setItem('club_leones_beneficios', JSON.stringify(updated));
                          }
                        }}
                        className="text-blue-600 hover:text-red-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Eliminar convenio"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'parqueo' && (
            <ParqueoManager />
          )}
          {activeTab === 'presupuestos' && (
            <Presupuestos />
          )}
          {activeTab === 'comisiones' && (
            <Comisiones />
          )}
          {activeTab === 'minutas' && (
            <MinutasComisiones />
          )}
          {activeTab === 'requerimientos_actividades' && (
            <RequerimientosActividades user={user} />
          )}
          {activeTab === 'afiliacion' && (
            <Afiliacion user={user} />
          )}
          {activeTab === 'inventario' && (
            <Inventario />
          )}
          {activeTab === 'galeria_admin' && (
            <GaleriaAdmin />
          )}
          {activeTab === 'linea_tiempo_admin' && (
            <LineaTiempoAdmin />
          )}
          {activeTab === 'agenda_contactos' && (
            <AgendaContactos />
          )}
          {activeTab === 'presidencia' && (
            renderControlSolicitudesList()
          )}
          {activeTab === 'agendas_reunion' && (
            renderAgendasModulo()
          )}
          {activeTab === 'ranking_lionistico' && (
            renderRankingLionistico()
          )}
          {activeTab === 'asignacion_funciones' && (
            <AsignacionFunciones />
          )}
          {activeTab === 'convencion_admin' && (
            <AdminConvencion />
          )}
          {activeTab === 'archivo_solicitudes_secretaria' && (
            <BibliotecaSolicitudesSecretaria user={user} />
          )}
        </main>
      </div>

      {/* --- UNIFIED MODAL FOR EDITING / REGISTERING SOCIO --- */}
      {editingSocio && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className={`bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full ${modalMaxWidth} max-h-[95vh] overflow-y-auto overflow-x-hidden p-6 sm:p-8 space-y-4 relative transition-all duration-300 animate-in zoom-in-95`}>
            <button 
              type="button"
              onClick={() => setEditingSocio(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
            >
              <XIcon size={20} />
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-blue-900">
                  {isNewSocio ? 'Registrar Nuevo Socio' : isSelfEdit ? 'Editar Mi Perfil' : 'Editar Ficha de Socio'}
                </h2>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  {isSelfEdit ? 'Actualizar mis datos personales de contacto' : 'Panel Administrativo de Control'}
                </p>
              </div>
              {isClubSectionAllowed && (
                <button
                  type="button"
                  onClick={() => setClubSectionOpen(!clubSectionOpen)}
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 shadow-sm hover:shadow active:scale-95 ${
                    clubSectionOpen 
                      ? 'bg-amber-50 text-amber-700 border-amber-250 hover:bg-amber-100' 
                      : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <span>{clubSectionOpen ? 'Ocultar Datos del Club' : 'Mostrar Datos del Club'}</span>
                  <Briefcase size={12} />
                </button>
              )}
            </div>

            {socioSaveError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start space-x-3 text-red-700 text-sm animate-in fade-in">
                <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
                <span>{socioSaveError}</span>
              </div>
            )}

            {socioSaveSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start space-x-3 text-green-700 text-sm animate-in fade-in">
                <CheckCircle className="flex-shrink-0 mt-0.5" size={18} />
                <span>¡Ficha guardada exitosamente!</span>
              </div>
            )}

            <form onSubmit={handleSaveSocioSubmit} className="space-y-6">
              <div className={`grid ${formColumnsClass} gap-8 items-start`}>
                
                {/* COLUMNA IZQUIERDA: DATOS PERSONALES */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100 flex items-center gap-2">
                    <User size={12} className="text-blue-900" />
                    <span>Datos Personales</span>
                  </h3>
                  
                  {/* Photo row */}
                  <div className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                    <div className="relative group flex-shrink-0">
                      <img 
                        src={editSocioForm.foto || `https://picsum.photos/seed/${editingSocio.id}/150/150`} 
                        alt="Avatar de socio" 
                        className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 shadow-sm"
                      />
                      <label 
                        htmlFor="socio-photo-upload"
                        className="absolute bottom-0 right-0 bg-yellow-500 text-blue-900 p-1.5 rounded-full border border-white shadow-sm hover:bg-yellow-600 cursor-pointer flex items-center justify-center"
                        title="Cambiar foto de socio"
                      >
                        <Plus size={10} />
                        <input 
                          type="file" 
                          id="socio-photo-upload" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleEditSocioPhotoChange} 
                        />
                      </label>
                    </div>
                    <div>
                      <span className="block text-[11px] font-extrabold text-slate-800">Fotografía de Ficha</span>
                      <span className="block text-[9px] text-slate-400 font-semibold">Formatos recomendados: JPG o PNG</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Nombre Completo *</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ej. Carlos Roberto Méndez"
                      value={editSocioForm.nombre || ''}
                      onChange={e => setEditSocioForm(prev => ({ ...prev, nombre: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Correo Electrónico</label>
                      <input 
                        type="email"
                        placeholder="carlos@gmail.com"
                        value={editSocioForm.correo || ''}
                        onChange={e => setEditSocioForm(prev => ({ ...prev, correo: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Teléfono</label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-[11px] font-semibold text-slate-400 select-none">
                          +502
                        </span>
                        <input 
                          type="text"
                          maxLength={8}
                          placeholder="55555555"
                          value={(editSocioForm.telefono || '').replace(/^\+502\s?/, '')}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '');
                            setEditSocioForm(prev => ({ ...prev, telefono: val ? `+502 ${val}` : '' }));
                          }}
                          className="w-full pl-11 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">DPI / Identificación</label>
                      <input 
                        type="text"
                        placeholder="2352 12345 0101"
                        value={editSocioForm.dpi || ''}
                        onChange={e => setEditSocioForm(prev => ({ ...prev, dpi: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Fecha Nacimiento</label>
                      <input 
                        type="date"
                        value={editSocioForm.fechaNacimiento || ''}
                        onChange={e => setEditSocioForm(prev => ({ ...prev, fechaNacimiento: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Profesión / Ocupación</label>
                    <input 
                      type="text"
                      placeholder="Ej. Ingeniero Civil"
                      value={editSocioForm.profesion || ''}
                      onChange={e => setEditSocioForm(prev => ({ ...prev, profesion: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Dirección de Residencia</label>
                    <input 
                      type="text"
                      placeholder="Ej. 12 Av. 10-55, Zona 1, Quetzaltenango"
                      value={editSocioForm.direccion || ''}
                      onChange={e => setEditSocioForm(prev => ({ ...prev, direccion: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 text-xs"
                    />
                  </div>
                </div>

                {/* COLUMNA DERECHA: DATOS INSTITUCIONALES */}
                {showClubRightColumn && (
                  <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100 flex items-center gap-2">
                    <Briefcase size={12} className="text-blue-900" />
                    <span>Datos del Club</span>
                  </h3>

                  <div>
                    <label className="flex items-center gap-1 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                      <Hash size={10} />
                      <span>Código de Socio</span>
                    </label>
                    <input 
                      type="text"
                      placeholder="CLQ-2026-001"
                      value={editSocioForm.codigoSocio || ''}
                      onChange={e => setEditSocioForm(prev => ({ ...prev, codigoSocio: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-blue-200 bg-blue-50/50 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-mono font-bold text-blue-900 text-xs tracking-wider"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Puesto Principal *</label>
                      <select 
                        value={editSocioForm.puesto || ''}
                        onChange={e => {
                          const val = e.target.value;
                          const matchedP = puestosList.find(p => p.nombre === val);
                          setEditSocioForm(prev => ({ 
                            ...prev, 
                            puesto: val,
                            rol: matchedP ? matchedP.rolAsociado : prev.rol
                          }));
                        }}
                        className="w-full px-2 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none text-xs font-semibold bg-white"
                      >
                        <option value="">Seleccione puesto...</option>
                        {puestosList.map(p => (
                          <option key={p.id} value={p.nombre}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Fecha de Ingreso</label>
                      <input 
                        type="date"
                        value={editSocioForm.fechaIngreso || ''}
                        onChange={e => setEditSocioForm(prev => ({ ...prev, fechaIngreso: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 text-xs"
                      />
                    </div>
                  </div>

                  {/* Puestos Adicionales */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                    <label className="flex items-center gap-1.5 text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">
                      <Briefcase size={10} />
                      <span>Cargos Adicionales</span>
                    </label>
                    <div className="space-y-1.5 max-h-[80px] overflow-y-auto pr-1">
                      {(editSocioForm.puestosAdicionales || []).map((pa, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white rounded-xl px-2.5 py-1.5 border border-amber-200">
                          <span className="flex-1 text-[11px] font-semibold text-slate-700">{pa}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (editSocioForm.puestosAdicionales || []).filter((_, idx) => idx !== i);
                              setEditSocioForm(prev => ({ ...prev, puestosAdicionales: updated }));
                            }}
                            className="p-0.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar cargo"
                          >
                            <XIcon size={12} />
                          </button>
                        </div>
                      ))}
                      {(editSocioForm.puestosAdicionales || []).length === 0 && (
                        <p className="text-[11px] text-amber-600 italic">Sin cargos adicionales asignados.</p>
                      )}
                    </div>
                    {/* Agregar nuevo puesto adicional */}
                    <div className="flex gap-2">
                      <select
                        id="nuevo-puesto-adicional"
                        className="flex-1 min-w-0 px-2 py-2 border border-amber-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                        defaultValue=""
                      >
                        <option value="" disabled>Seleccionar cargo...</option>
                        {puestosList.map(p => (
                          <option key={p.id} value={p.nombre}>{p.nombre}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const sel = document.getElementById('nuevo-puesto-adicional') as HTMLSelectElement;
                          const val = sel?.value;
                          if (!val) return;
                          const current = editSocioForm.puestosAdicionales || [];
                          if (!current.includes(val)) {
                            setEditSocioForm(prev => ({ ...prev, puestosAdicionales: [...current, val] }));
                          }
                          sel.value = '';
                        }}
                        className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1 flex-shrink-0"
                      >
                        <Plus size={12} />
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              </div>



              {/* Audit details at the bottom */}
              {!isNewSocio && editingSocio.fechaEdicion && (
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 flex flex-col sm:flex-row gap-2 justify-between text-[11px] font-bold text-slate-400">
                  <span>Última modificación: {new Date(editingSocio.fechaEdicion).toLocaleString('es-GT')}</span>
                  {editingSocio.editadoPor && <span>Por: {editingSocio.editadoPor}</span>}
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSocio(null)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingSocio}
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-900/50 text-white font-black rounded-xl shadow-lg transition-all text-sm flex items-center justify-center space-x-2"
                >
                  {isSavingSocio ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>{isNewSocio ? 'Registrar Socio' : isSelfEdit ? 'Guardar Perfil' : 'Guardar Cambios'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Viewer Modal */}
      {qrSocio && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-md p-6 sm:p-10 text-center space-y-6 relative animate-in zoom-in-95 duration-300">
            <button 
              type="button"
              onClick={() => setQrSocio(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
            >
              <XIcon size={20} />
            </button>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-blue-900">Código QR de Acceso</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                {qrSocio.nombre}
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                {qrSocio.puesto || 'Socio Regular'}
              </p>
            </div>

            {/* QR Image Display */}
            {qrSocio.qrToken ? (
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col items-center justify-center space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-inner">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                      window.location.origin + window.location.pathname + '#/login?qr_token=' + qrSocio.qrToken
                    )}`}
                    alt="Acceso QR"
                    className="w-56 h-56 object-contain"
                  />
                </div>
                
                <p className="text-[10px] text-slate-450 leading-relaxed font-semibold max-w-xs">
                  Escanea este código con la cámara de tu móvil para iniciar sesión automáticamente como este usuario.
                </p>
              </div>
            ) : (
              <div className="py-10 text-slate-450">
                <Loader2 className="animate-spin mx-auto text-blue-900 mb-2" size={32} />
                <p className="text-sm font-semibold">Generando credenciales QR...</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleDownloadQr(qrSocio)}
                className="w-full bg-blue-900 hover:bg-blue-800 text-white font-black py-3.5 rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 text-sm"
              >
                <Download size={16} />
                <span>Descargar Código QR (PNG)</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleRegenerarQrToken(qrSocio.id)}
                disabled={isGeneratingQr}
                className="w-full bg-slate-100 hover:bg-slate-200 hover:text-slate-800 text-slate-655 py-3 rounded-2xl transition-all flex items-center justify-center space-x-2 text-xs border border-slate-200 disabled:opacity-55"
              >
                <QrCode size={14} />
                <span>Regenerar / Invalidar Anterior</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PAYMENT REGISTRATION MODAL --- */}
      {showRegistrarPagoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-lg p-6 sm:p-10 space-y-6 relative animate-in zoom-in-95 duration-300">
            <button 
              type="button"
              onClick={() => setShowRegistrarPagoModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
            >
              <XIcon size={20} />
            </button>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-blue-900">Registrar Pago de Cuota</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                Control y Registro de Aportaciones
              </p>
            </div>

            <div className="space-y-4">
              {/* Socio Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Socio Beneficiario</label>
                <select
                  value={registrarPagoData.socioId}
                  onChange={e => {
                    const sId = e.target.value;
                    const socio = socios.find(s => s.id === sId);
                    setRegistrarPagoData(prev => ({
                      ...prev,
                      socioId: sId,
                      monto: socio && socio.montoPendiente > 0 ? socio.montoPendiente : prev.monto
                    }));
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                >
                  <option value="">Seleccione un socio...</option>
                  {socios.filter(s => s.rol !== UserRole.DONANTE && s.rol !== UserRole.GUEST).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} ({s.codigoSocio || 'Sin código'}) - Pendiente: Q{s.montoPendiente}
                    </option>
                  ))}
                </select>
              </div>

              {/* Period Type selector tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Frecuencia / Tipo Periodo</label>
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                  {(['Mensual', 'Semestral', 'Anual'] as const).map(tipo => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setRegistrarPagoData(prev => ({
                        ...prev,
                        tipoPeriodo: tipo,
                        monto: tipo === 'Mensual' ? 100 : tipo === 'Semestral' ? 600 : 1200
                      }))}
                      className={`py-2 rounded-lg font-black text-xs transition-all ${
                        registrarPagoData.tipoPeriodo === tipo 
                          ? 'bg-blue-900 text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>

              {/* Period Inputs depending on selector */}
              <div className="grid grid-cols-2 gap-4">
                {registrarPagoData.tipoPeriodo === 'Mensual' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mes</label>
                    <select
                      value={registrarPagoData.mes}
                      onChange={e => setRegistrarPagoData(prev => ({ ...prev, mes: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                    >
                      {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                )}

                {registrarPagoData.tipoPeriodo === 'Semestral' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Semestre</label>
                    <select
                      value={registrarPagoData.semestre}
                      onChange={e => setRegistrarPagoData(prev => ({ ...prev, semestre: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                    >
                      <option value="1er Semestre (Ene-Jun)">1er Semestre (Ene-Jun)</option>
                      <option value="2do Semestre (Jul-Dic)">2do Semestre (Jul-Dic)</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Año</label>
                  <input
                    type="number"
                    value={registrarPagoData.año}
                    onChange={e => setRegistrarPagoData(prev => ({ ...prev, año: parseInt(e.target.value) || 2026 }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              {/* Amount and Payment Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Monto (Q)</label>
                  <input
                    type="number"
                    value={registrarPagoData.monto}
                    onChange={e => setRegistrarPagoData(prev => ({ ...prev, monto: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha de Pago</label>
                  <input
                    type="date"
                    value={registrarPagoData.fechaPago}
                    onChange={e => setRegistrarPagoData(prev => ({ ...prev, fechaPago: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Método de Pago</label>
                <select
                  value={registrarPagoData.metodo}
                  onChange={e => setRegistrarPagoData(prev => ({ ...prev, metodo: e.target.value as any }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                >
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Depósito">Depósito Bancario</option>
                  <option value="Efectivo">Efectivo</option>
                </select>
              </div>

              {/* Reference Info (only if not Cash) */}
              {registrarPagoData.metodo !== 'Efectivo' && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Banco</label>
                    <input
                      type="text"
                      placeholder="Ej. Banco Industrial"
                      value={registrarPagoData.bancoReferencia}
                      onChange={e => setRegistrarPagoData(prev => ({ ...prev, bancoReferencia: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">No. Referencia / Boleta</label>
                    <input
                      type="text"
                      placeholder="Ej. 12345678"
                      value={registrarPagoData.numeroReferencia}
                      onChange={e => setRegistrarPagoData(prev => ({ ...prev, numeroReferencia: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRegistrarPagoModal(false)}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!registrarPagoData.socioId}
                onClick={handleGuardarNuevoPago}
                className="w-1/2 bg-green-600 hover:bg-green-700 text-white font-black py-3.5 rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-sm"
              >
                Guardar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center animate-in zoom-in-95 duration-300">
            <button 
              type="button"
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-slate-900/60 hover:bg-slate-900/90 rounded-full transition-colors"
              onClick={() => setSelectedPhoto(null)}
            >
              <XIcon size={24} />
            </button>
            <img 
              src={selectedPhoto.url} 
              alt={selectedPhoto.title} 
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-white text-base font-bold mt-4 bg-slate-900/80 px-4 py-2 rounded-xl shadow-lg border border-white/5">
              {selectedPhoto.title}
            </p>
          </div>
        </div>
      )}

      {/* Delete Acta Confirmation Modal */}
      {deleteActaConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-red-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-4 mb-6 text-red-600">
              <div className="bg-red-50 p-3 rounded-full border border-red-100">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-black">Eliminar Acta</h3>
            </div>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
              Estás a punto de eliminar esta acta de forma permanente. 
              <br/><br/>
              Para evitar eliminaciones por error, por favor escribe la palabra <strong className="font-bold text-slate-900">ELIMINAR</strong> en el recuadro de abajo.
            </p>
            <div className="mb-6">
              <input
                type="text"
                value={deleteActaConfirmText}
                onChange={(e) => setDeleteActaConfirmText(e.target.value)}
                placeholder="ELIMINAR"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all font-mono uppercase text-center text-sm"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setDeleteActaConfirmId(null);
                  setDeleteActaConfirmText('');
                }}
                className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 border border-slate-200 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (deleteActaConfirmText === 'ELIMINAR') {
                    handleDeleteActa(deleteActaConfirmId);
                  }
                }}
                disabled={deleteActaConfirmText !== 'ELIMINAR'}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/20 active:scale-95 flex items-center justify-center space-x-2"
              >
                <Trash2 size={16} />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdmin;
