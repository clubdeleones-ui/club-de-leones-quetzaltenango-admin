import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  SolicitudVoluntario
} from '../types';
import { firebaseService } from '../services/firebaseService';
import { useClubData } from '../context/ClubDataContext';
import { useModal } from '../context/ModalContext';
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
  UserPlus,
  UserCheck,
  Trash2,
  Filter,
  Check,
  Send,
  X,
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
  Car,
  Archive,
  Camera,
  BookUser,
  Upload,
  Layers,
  Accessibility,
  XOctagon,
  Lock
} from 'lucide-react';
import { generateActaPDF, generateActaCode, generateReciboPagoPDF } from '../utils/pdfGenerator';
import { FormattedActa } from '../components/FormattedActa';
import { compressImageFile } from '../utils/imageCompressor';
import { ParqueoManager } from '../components/ParqueoManager';
import { Presupuestos } from './Presupuestos';
import { Comisiones } from './Comisiones';
import { MinutasComisiones } from './MinutasComisiones';
import { Afiliacion } from './Afiliacion';
import { Inventario } from './Inventario';
import { GaleriaAdmin } from './GaleriaAdmin';
import { AgendaContactos } from './AgendaContactos';
import { LineaTiempoAdmin } from './LineaTiempoAdmin';

const PUESTOS_PREDEFINIDOS = [
  'Presidente del Club',
  'Primer Vicepresidente del Club',
  'Segundo Vicepresidente del Club',
  'Tercer Vicepresidente del Club',
  'Secretario del Club',
  'Tesorero del Club',
  'Domador del Club',
  'Asesor de Servicios del Club',
  'Asesor de Mercadotecnia',
  'Presidente del Comité de Aumento de Socios del Club',
  'Presidente del Comité Zona Joven del Club',
  'Presidente del Comité del Paz Póster',
  'Presidente del Comité de Medio Ambiente',
  'Presidente',
  'Vicepresidente',
  'Secretario',
  'Tesorero',
  'Asesor de Servicios',
  'Presidente de Afiliación',
  'Vocal 1',
  'Vocal 2',
  'Socio Regular',
  'Socio Distinguido',
  'Donante Distinguido'
];

const ROLES_LIST = [
  { value: UserRole.SOCIO, label: 'Socio Regular' },
  { value: UserRole.SUPER_ADMIN, label: 'Super Administrador' },
  { value: UserRole.SECRETARIO, label: 'Secretario' },
  { value: UserRole.TESORERO, label: 'Tesorero' },
  { value: UserRole.ASESOR_SERVICIOS, label: 'Asesor de Servicios' },
  { value: UserRole.PRESIDENTE_AFILIACION, label: 'Presidente de Afiliación' },
  { value: UserRole.DONANTE, label: 'Donante' }
];

interface SuperAdminProps {
  user: Socio;
  onUpdateUser?: (user: Socio) => void;
}

type TabType = 'resumen' | 'socios' | 'calendario' | 'cuotas' | 'actas' | 'donaciones' | 'beneficios' | 'parqueo' | 'presupuestos' | 'comisiones' | 'minutas' | 'afiliacion' | 'inventario' | 'galeria_admin' | 'linea_tiempo_admin' | 'agenda_contactos' | 'control_solicitudes';

const SuperAdmin: React.FC<SuperAdminProps> = ({ user, onUpdateUser }) => {
  const { showAlert, showConfirm } = useModal();
  const alert = (msg: string) => {
    showAlert("Notificación", msg);
  };

  // Dynamic Tab Access based on Role
  const allowedTabs = useMemo(() => {
    switch (user.rol) {
      case UserRole.SUPER_ADMIN:
        return ['resumen', 'socios', 'calendario', 'cuotas', 'actas', 'donaciones', 'beneficios', 'parqueo', 'presupuestos', 'comisiones', 'minutas', 'afiliacion', 'inventario', 'galeria_admin', 'linea_tiempo_admin', 'agenda_contactos', 'control_solicitudes'];
      case UserRole.TESORERO:
        return ['resumen', 'socios', 'cuotas', 'donaciones', 'parqueo', 'presupuestos', 'inventario', 'galeria_admin', 'linea_tiempo_admin'];
      case UserRole.SECRETARIO:
        return ['resumen', 'socios', 'calendario', 'actas', 'comisiones', 'minutas', 'agenda_contactos', 'control_solicitudes'];
      case UserRole.ASESOR_SERVICIOS:
        return ['socios', 'calendario', 'beneficios', 'minutas'];
      case UserRole.PRESIDENTE_AFILIACION:
        return ['resumen', 'socios', 'calendario', 'cuotas', 'actas', 'donaciones', 'beneficios', 'parqueo', 'presupuestos', 'comisiones', 'minutas', 'afiliacion', 'agenda_contactos', 'control_solicitudes'];
      default:
        return [];
    }
  }, [user.rol]);

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const saved = sessionStorage.getItem('super_admin_active_tab');
    if (saved) return saved as TabType;
    if (user.rol === UserRole.ASESOR_SERVICIOS) return 'calendario';
    return 'resumen';
  });

  useEffect(() => {
    sessionStorage.setItem('super_admin_active_tab', activeTab);
  }, [activeTab]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Principal');

  // Auto-expand category based on activeTab
  useEffect(() => {
    const groups = [
      { category: 'Principal', items: ['resumen'] },
      { category: 'Secretaría', items: ['actas', 'control_solicitudes', 'beneficios', 'calendario', 'comisiones'] },
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
    loading: dbLoading
  } = useClubData();

  const [socios, setSocios] = useState<Socio[]>(dbSocios);
  const [propuestas, setPropuestas] = useState<PropuestaSocio[]>(dbPropuestas);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(dbSolicitudes);
  const [actividades, setActividades] = useState<Actividad[]>(dbActividades);
  const [actas, setActas] = useState<Acta[]>(dbActas);
  const [voluntarios, setVoluntarios] = useState<SolicitudVoluntario[]>(dbVoluntarios);

  useEffect(() => { setSocios(dbSocios); }, [dbSocios]);
  useEffect(() => { setPropuestas(dbPropuestas); }, [dbPropuestas]);
  useEffect(() => { setSolicitudes(dbSolicitudes); }, [dbSolicitudes]);
  useEffect(() => { setActividades(dbActividades); }, [dbActividades]);
  useEffect(() => { setActas(dbActas); }, [dbActas]);
  useEffect(() => { setVoluntarios(dbVoluntarios); }, [dbVoluntarios]);

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
  const [controlSolicitudesSearchQuery, setControlSolicitudesSearchQuery] = useState('');

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
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [financialFilter, setFinancialFilter] = useState('Todos');
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
    localStorage.setItem('club_leones_socios_v4', JSON.stringify(newSocios));

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
      localStorage.setItem('club_leones_socios_v4', JSON.stringify(newList));
      
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
      localStorage.setItem('club_leones_socios_v4', JSON.stringify(newList));
      
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
      estado: nuevoEstado
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

  const renderControlSolicitudesList = () => {
    // Filter list
    const filteredList = solicitudes.filter(sol => {
      // Exclude 'agenda' and 'cartas' from the unified list
      if (sol.tipo === 'agenda') return false; 
      
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
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
                            <X size={12} />
                          </button>
                        </>
                      )}
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
      localStorage.setItem('club_leones_socios_v4', JSON.stringify(newSociosList));
      alert("Socio eliminado con éxito.");
    } catch (err: any) {
      console.error("Error deleting socio:", err);
      alert(`Ocurrió un error al eliminar el socio: ${err?.message || err}`);
    }
  };

  const handleEditSocioPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
    if (!editingSocio || !editSocioForm.nombre?.trim() || !editSocioForm.correo?.trim()) {
      setSocioSaveError("El nombre y el correo son obligatorios.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(editSocioForm.correo)) {
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
      localStorage.setItem('club_leones_socios_v4', JSON.stringify(newSociosList));

      // If editing self, notify parent to refresh auth state
      if (updated.id === user.id && onUpdateUser) {
        onUpdateUser(updated);
      }

      setSocioSaveSuccess(true);
      setTimeout(() => {
        setSocioSaveSuccess(false);
        setEditingSocio(null);
      }, 1500);
    } catch (err: any) {
      console.error("Error updating socio:", err);
      setSocioSaveError(err?.message || "No se pudo actualizar la ficha.");
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
    return socios.filter(s => {
      const matchesSearch = 
        s.nombre.toLowerCase().includes(socioSearch.toLowerCase()) ||
        s.correo.toLowerCase().includes(socioSearch.toLowerCase());
      
      const matchesRole = roleFilter === 'Todos' || s.rol === roleFilter;
      
      const matchesStatus = 
        statusFilter === 'Todos' ||
        (statusFilter === 'Activos' && s.estatus !== 'Inactive') ||
        (statusFilter === 'Inactivos' && s.estatus === 'Inactive');
      
      const matchesFinancial = 
        financialFilter === 'Todos' ||
        (financialFilter === 'al_dia' && s.estadoCuotas === 'Al día') ||
        (financialFilter === 'pendiente' && s.estadoCuotas === 'Pendiente') ||
        (financialFilter === 'en_mora' && s.estadoCuotas === 'En mora');

      return matchesSearch && matchesRole && matchesStatus && matchesFinancial;
    });
  }, [socios, socioSearch, roleFilter, statusFilter, financialFilter]);

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
          <nav className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[2.5rem] p-5 shadow-sm space-y-2 sticky top-28 max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="text-sm font-black text-slate-400 uppercase tracking-wider px-4 mb-4 flex items-center">
              <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
              Navegación Módulos
            </div>
            {[
              {
                category: 'Principal',
                items: [
                  { id: 'resumen', label: 'Resumen General', icon: TrendingUp }
                ]
              },
              {
                category: 'Secretaría',
                items: [
                  { id: 'actas', label: 'Libro de Actas', icon: FileText },
                  { id: 'control_solicitudes', label: 'Control de Solicitudes', icon: Layers },
                  { id: 'beneficios', label: 'Beneficios a Socios', icon: Award },
                  { id: 'calendario', label: 'Actividades', icon: Calendar },
                  { id: 'comisiones', label: 'Gestión de Comisiones', icon: Briefcase }
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
                  { id: 'afiliacion', label: 'Comité de Afiliación', icon: UserCheck }
                ]
              },
              {
                category: 'Comité de Servicio',
                items: [
                  { id: 'minutas', label: 'Minutas de Comisiones', icon: FileText }
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
            ].map(group => {
              const visibleItems = group.items.filter(tab => allowedTabs.includes(tab.id));
              if (visibleItems.length === 0) return null;
              
              const isExpanded = expandedCategory === group.category;
              
              return (
                <div key={group.category} className="mb-2 border border-slate-100/50 rounded-2xl overflow-hidden shadow-sm bg-white">
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : group.category)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors ${
                      isExpanded ? 'bg-blue-50/50' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div 
                      className="text-sm font-black text-slate-500 uppercase tracking-tight flex items-center whitespace-nowrap overflow-hidden text-ellipsis flex-1 pr-1"
                      title={group.category}
                    >
                      <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mr-2 transition-colors ${isExpanded ? 'bg-blue-500' : 'bg-slate-300'}`}></span>
                      {group.category}
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-2 space-y-1 bg-slate-50/30">
                      {visibleItems.map(tab => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-bold transition-all duration-200 ${
                              getTabStyles(tab.id, active)
                            }`}
                          >
                            <Icon 
                              size={16} 
                              className={`transition-colors flex-shrink-0 ${
                                active 
                                  ? 'text-white' 
                                  : 'text-slate-400 group-hover:text-blue-600'
                              }`} 
                            />
                            <span className="text-sm truncate text-left flex-1" title={tab.label}>{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 min-w-0">
          {/* Mobile Navigation Dropdown */}
          <div className="lg:hidden w-full max-w-sm relative z-30 mb-8">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`w-full flex items-center justify-between px-6 py-4 font-black rounded-2xl shadow-lg transition-all active:scale-[0.99] text-sm ${
                getMobileTabStyles(activeTab)
              }`}
            >
              <div className="flex items-center space-x-3">
                {(() => {
                  const currentTab = [
                    { id: 'resumen', label: 'Resumen General', icon: TrendingUp },
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
                    { id: 'afiliacion', label: 'Comité de Afiliación', icon: UserCheck },
                    { id: 'inventario', label: 'Inventario', icon: Archive },
                    { id: 'galeria_admin', label: 'Gestión de Galería', icon: Camera },
                    { id: 'linea_tiempo_admin', label: 'Línea de Tiempo', icon: Clock },
                    { id: 'agenda_contactos', label: 'Agenda de Contactos', icon: BookUser },
                    { id: 'control_solicitudes', label: 'Control de Solicitudes', icon: Layers }
                  ].find(t => t.id === activeTab);
                  if (currentTab) {
                    const Icon = currentTab.icon;
                    return <Icon size={18} className="text-white" />;
                  }
                  return null;
                })()}
                <span>
                  {[
                    { id: 'resumen', label: 'Resumen General' },
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
                    { id: 'afiliacion', label: 'Comité de Afiliación' },
                    { id: 'inventario', label: 'Inventario' },
                    { id: 'galeria_admin', label: 'Gestión de Galería' },
                    { id: 'linea_tiempo_admin', label: 'Línea de Tiempo' },
                    { id: 'agenda_contactos', label: 'Agenda de Contactos' },
                    { id: 'control_solicitudes', label: 'Control de Solicitudes' }
                  ].find(t => t.id === activeTab)?.label}
                </span>
              </div>
              <ChevronDown size={18} className={`text-white transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
            </button>
 
            {isMobileMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/80 py-2.5 z-40 animate-in fade-in slide-in-from-top-2 duration-300 max-h-[60vh] overflow-y-auto">
                {[
                  {
                    category: 'Principal',
                    items: [
                      { id: 'resumen', label: 'Resumen General', icon: TrendingUp }
                    ]
                  },
                  {
                    category: 'Secretaría',
                    items: [
                      { id: 'actas', label: 'Libro de Actas', icon: FileText },
                      { id: 'control_solicitudes', label: 'Control de Solicitudes', icon: Layers },
                      { id: 'beneficios', label: 'Beneficios a Socios', icon: Award },
                      { id: 'calendario', label: 'Actividades', icon: Calendar },
                      { id: 'comisiones', label: 'Gestión de Comisiones', icon: Briefcase }
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
                      { id: 'afiliacion', label: 'Comité de Afiliación', icon: UserCheck }
                    ]
                  },
                  {
                    category: 'Comité de Servicio',
                    items: [
                      { id: 'minutas', label: 'Minutas de Comisiones', icon: FileText }
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
                ].map(group => {
                  const visibleItems = group.items.filter(tab => allowedTabs.includes(tab.id));
                  if (visibleItems.length === 0) return null;
                  
                  return (
                    <div key={group.category}>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-6 py-2 bg-slate-50/50">
                        {group.category}
                      </div>
                      {visibleItems.map(tab => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                              setActiveTab(tab.id as TabType);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-6 py-3.5 text-sm font-extrabold transition-all text-left ${
                              active 
                                ? 'bg-slate-50 text-blue-900 font-black' 
                                : 'text-slate-600 hover:bg-slate-50 hover:text-blue-900'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <Icon size={18} className={active ? 'text-blue-900' : 'text-slate-400'} />
                              <span>{tab.label}</span>
                            </div>
                            {active && <Check size={16} className="text-blue-900" />}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      {ROLES_LIST.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status filter */}
                  <div>
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-semibold bg-white"
                    >
                      <option value="Todos">Estatus: Todos</option>
                      <option value="Activos">Estatus: Activos</option>
                      <option value="Inactivos">Estatus: Inactivos</option>
                    </select>
                  </div>

                  {/* Financial filter */}
                  <div>
                    <select
                      value={financialFilter}
                      onChange={e => setFinancialFilter(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-semibold bg-white"
                    >
                      <option value="Todos">Cuotas: Todos</option>
                      <option value="al_dia">Cuotas: Al día</option>
                      <option value="pendiente">Cuotas: Pendiente</option>
                      <option value="en_mora">Cuotas: En mora</option>
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
                  <>
                    {/* Desktop View: Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-250 text-slate-400 font-bold text-xs uppercase tracking-wider">
                            <th className="py-6.5 px-6">Miembro</th>
                            <th className="py-6.5 px-6">Contacto</th>
                            <th className="py-6.5 px-6">Puesto y Rol</th>
                            <th className="py-6.5 px-6 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredSociosAdmin.map(socio => {
                            const isInactive = socio.estatus === 'Inactive';
                            const isDirectiva = !isInactive && (
                              socio.rol === UserRole.SUPER_ADMIN ||
                              socio.rol === UserRole.SECRETARIO ||
                              socio.rol === UserRole.TESORERO ||
                              socio.rol === UserRole.ASESOR_SERVICIOS ||
                              socio.rol === UserRole.PRESIDENTE_AFILIACION
                            );
                            
                            const rowBorderColor = isInactive 
                              ? 'border-l-4 border-l-slate-400' 
                              : isDirectiva 
                              ? 'border-l-4 border-l-amber-500' 
                              : 'border-l-4 border-l-blue-900';

                            return (
                              <tr 
                                key={socio.id} 
                                className={`hover:bg-slate-50/50 transition-colors ${rowBorderColor} ${
                                  isInactive ? 'opacity-65 bg-slate-50/20' : ''
                                }`}
                              >
                                <td className="py-6.5 px-6">
                                  <div className="flex items-center space-x-3.5">
                                    <img 
                                      src={socio.foto || `https://picsum.photos/seed/${socio.id}/100/100`} 
                                      alt={socio.nombre} 
                                      className={`w-11 h-11 rounded-full object-cover border-2 shadow-sm cursor-zoom-in ${
                                        isInactive ? 'border-slate-300' : isDirectiva ? 'border-amber-400' : 'border-blue-900'
                                      }`}
                                      onClick={() => setSelectedPhoto({ url: socio.foto, title: socio.nombre })}
                                    />
                                    <div className="min-w-0">
                                      <p className="font-extrabold text-slate-800 text-sm leading-tight flex items-center">
                                        {socio.nombre || <span className="text-slate-400 italic">Sin nombre</span>}
                                        {isInactive && (
                                          <span className="ml-2 bg-slate-200 text-slate-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Inactivo</span>
                                        )}
                                      </p>
                                      {socio.codigoSocio && (
                                        <p className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded mt-1 w-fit border border-blue-100">
                                          # {socio.codigoSocio}
                                        </p>
                                      )}
                                      <p className="text-xs text-slate-400 mt-1 font-semibold">Ingresó: {socio.fechaIngreso}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-6.5 px-6">
                                  <div className="text-xs space-y-1 font-semibold">
                                    <div className="flex items-center text-slate-700">
                                      <Mail size={12} className="mr-1.5 text-slate-400" />
                                      <span className="truncate max-w-[180px]">{socio.correo}</span>
                                    </div>
                                    <div className="flex items-center text-slate-600">
                                      <Phone size={12} className="mr-1.5 text-slate-400" />
                                      <span>{socio.telefono || 'Sin teléfono'}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-6.5 px-6">
                                  <div className="space-y-1.5">
                                    <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200/50 block w-fit">
                                      {socio.puesto || 'Socio Regular'}
                                    </span>
                                    {(socio.puestosAdicionales || []).map((pa, pi) => (
                                      <span key={pi} className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 block w-fit">
                                        + {pa}
                                      </span>
                                    ))}
                                    <div className="flex items-center space-x-1.5">
                                      {isInactive ? (
                                        <span className="bg-slate-100 text-slate-600 border border-slate-250 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                          Inactivo
                                        </span>
                                      ) : isDirectiva ? (
                                        <span className="bg-amber-100 text-amber-800 border border-amber-250 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                          Directiva
                                        </span>
                                      ) : (
                                        <span className="bg-blue-50 text-blue-900 border border-blue-250 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                          Socio Activo
                                        </span>
                                      )}
                                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        ({socio.rol})
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-6.5 px-6 text-right">
                                  <div className="flex items-center justify-end space-x-2">
                                    <button
                                      onClick={() => handleQrClick(socio)}
                                      className="bg-white hover:bg-yellow-50 text-amber-600 hover:text-amber-700 border border-slate-200/60 p-2 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center shadow-sm disabled:opacity-50"
                                      title="Generar código QR de acceso"
                                      disabled={isGeneratingQr}
                                    >
                                      <QrCode size={13} className="mr-1" />
                                      <span>QR</span>
                                    </button>
                                    <button
                                      onClick={() => handleEditSocioClick(socio)}
                                      className="bg-white hover:bg-blue-50 text-slate-605 hover:text-blue-900 border border-slate-200/60 p-2 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center shadow-sm"
                                      title="Editar Ficha"
                                    >
                                      <Pencil size={13} className="mr-1" />
                                      <span>Editar</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSocio(socio)}
                                      className="bg-white hover:bg-red-50 text-slate-605 hover:text-red-600 border border-slate-200/60 p-2 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center shadow-sm"
                                      title="Eliminar Socio"
                                    >
                                      <Trash2 size={13} className="mr-1" />
                                      <span>Eliminar</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile View: Cards */}
                    <div className="block md:hidden divide-y divide-slate-100">
                      {filteredSociosAdmin.map(socio => {
                        const isInactive = socio.estatus === 'Inactive';
                        const isDirectiva = !isInactive && (
                          socio.rol === UserRole.SUPER_ADMIN ||
                          socio.rol === UserRole.SECRETARIO ||
                          socio.rol === UserRole.TESORERO ||
                          socio.rol === UserRole.ASESOR_SERVICIOS ||
                          socio.rol === UserRole.PRESIDENTE_AFILIACION
                        );
                        
                        const rowBorderColor = isInactive 
                          ? 'border-l-4 border-l-slate-400' 
                          : isDirectiva 
                          ? 'border-l-4 border-l-amber-500' 
                          : 'border-l-4 border-l-blue-900';

                        return (
                          <div 
                            key={socio.id} 
                            className={`p-6 space-y-4 hover:bg-slate-50/30 transition-colors ${rowBorderColor} ${
                              isInactive ? 'opacity-65 bg-slate-50/10' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-4">
                              <img 
                                src={socio.foto || `https://picsum.photos/seed/${socio.id}/100/100`} 
                                alt={socio.nombre} 
                                className={`w-14 h-14 rounded-full object-cover border-2 shadow-sm cursor-zoom-in ${
                                  isInactive ? 'border-slate-300' : isDirectiva ? 'border-amber-400' : 'border-blue-900'
                                }`}
                                onClick={() => setSelectedPhoto({ url: socio.foto, title: socio.nombre })}
                              />
                              <div className="min-w-0 flex-grow">
                                <h4 className="font-extrabold text-slate-800 text-base leading-snug flex flex-wrap items-center gap-1.5">
                                  <span>{socio.nombre || <span className="text-slate-400 italic">Sin nombre</span>}</span>
                                  {isInactive && (
                                    <span className="bg-slate-200 text-slate-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Inactivo</span>
                                  )}
                                </h4>
                                {socio.codigoSocio && (
                                  <span className="inline-block text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded mt-0.5 border border-blue-100">
                                    # {socio.codigoSocio}
                                  </span>
                                )}
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{socio.puesto || 'Socio Regular'}</p>
                                {(socio.puestosAdicionales || []).map((pa, pi) => (
                                  <span key={pi} className="inline-block text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 mt-0.5 mr-1">
                                    + {pa}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="text-xs font-semibold pt-1">
                              <span className="text-slate-400 text-[10px] uppercase tracking-wider block mb-1">Contacto</span>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-slate-700">
                                <div className="flex items-center truncate">
                                  <Mail size={12} className="mr-1.5 text-slate-400 flex-shrink-0" />
                                  <span className="truncate">{socio.correo}</span>
                                </div>
                                <div className="flex items-center">
                                  <Phone size={12} className="mr-1.5 text-slate-400 flex-shrink-0" />
                                  <span>{socio.telefono || 'Sin teléfono'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-3 border-t border-slate-100 gap-2">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Ingreso: {socio.fechaIngreso} ({socio.rol})</span>
                              <div className="flex space-x-2 w-full sm:w-auto justify-end">
                                <button
                                  onClick={() => handleQrClick(socio)}
                                  className="bg-white hover:bg-yellow-50 text-amber-600 hover:text-amber-700 border border-slate-200/60 px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center shadow-sm disabled:opacity-50"
                                  disabled={isGeneratingQr}
                                >
                                  <QrCode size={13} className="mr-1" />
                                  <span>QR</span>
                                </button>
                                <button
                                  onClick={() => handleEditSocioClick(socio)}
                                  className="bg-white hover:bg-blue-50 text-slate-650 hover:text-blue-900 border border-slate-200/60 px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center shadow-sm"
                                >
                                  <Pencil size={13} className="mr-1" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteSocio(socio)}
                                  className="bg-white hover:bg-red-50 text-slate-650 hover:text-red-650 border border-slate-200/60 px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center shadow-sm"
                                >
                                  <Trash2 size={13} className="mr-1" />
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB: RESUMEN GENERAL */}
          {activeTab === 'resumen' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* KPIs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                
                {/* Socios Activos */}
                <div className="bg-gradient-to-br from-blue-900 to-indigo-950 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                    <Award size={120} />
                  </div>
                  <h3 className="text-blue-200 text-sm font-bold uppercase tracking-widest">Total de Socios</h3>
                  <p className="text-4xl font-black mt-2">{sociosAlDia} / {socios.length}</p>
                  <p className="text-xs text-yellow-400 mt-3 font-semibold">Socios solventes ("Al día")</p>
                </div>

                {/* Actas */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-sm relative overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none text-blue-900">
                    <FileText size={120} />
                  </div>
                  <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest">Biblioteca de Actas</h3>
                  <p className="text-4xl font-black text-slate-800 mt-2">{actas.length} Actas</p>
                  <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg w-fit mt-3 font-semibold">
                    <CheckCircle size={12} className="mr-1" /> Documentos redactados
                  </div>
                </div>

                {/* Donaciones */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-sm relative overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none text-blue-900">
                    <Gift size={120} />
                  </div>
                  <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest">Total Donaciones</h3>
                  <p className="text-4xl font-black text-slate-800 mt-2">Q {totalDonaciones.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
                  <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg w-fit mt-3 font-semibold">
                    <CheckCircle size={12} className="mr-1" /> Acumulado anual
                  </div>
                </div>

                {/* Actividades */}
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                    <Calendar size={120} />
                  </div>
                  <h3 className="text-amber-100 text-sm font-bold uppercase tracking-widest">Programas Planificados</h3>
                  <p className="text-4xl font-black mt-2">{actividades.length} Actividades</p>
                  <p className="text-xs text-yellow-100 mt-3 font-semibold">En agenda y calendario</p>
                </div>

                {/* Saldo Cuotas */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-sm relative overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none text-blue-900">
                    <CreditCard size={120} />
                  </div>
                  <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest">Saldo de Cuotas Pendiente</h3>
                  <p className="text-4xl font-black text-slate-800 mt-2">Q {totalCuotasPendientes.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
                  <div className="flex items-center text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg w-fit mt-3 font-semibold">
                    <AlertTriangle size={12} className="mr-1" /> Requiere seguimiento
                  </div>
                </div>

                {/* Nuevos Ingresos */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-sm relative overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none text-blue-900">
                    <Users size={120} />
                  </div>
                  <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest">Nuevos Ingresos</h3>
                  <p className="text-4xl font-black text-slate-800 mt-2">{socios.filter(s => new Date(s.fechaIngreso).getFullYear() === new Date().getFullYear()).length} Este Año</p>
                  <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg w-fit mt-3 font-semibold">
                    <CheckCircle size={12} className="mr-1" /> Crecimiento del club
                  </div>
                </div>

              </div>

              {/* Quick Summary Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Cobros Pendientes */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Cobros Pendientes</h3>
                    <button onClick={() => setActiveTab('cuotas')} className="text-sm text-blue-900 font-bold hover:underline">Gestionar cuotas</button>
                  </div>
                  <div className="space-y-4">
                    {socios.filter(s => s.montoPendiente > 0).slice(0, 3).map(s => (
                      <div key={s.id} className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                        <img 
                          src={s.foto} 
                          alt={s.nombre} 
                          className="w-10 h-10 rounded-full border border-slate-100 object-cover mr-4 cursor-zoom-in" 
                          onClick={() => setSelectedPhoto({ url: s.foto, title: s.nombre })}
                        />
                        <div className="flex-grow min-w-0">
                          <p className="font-extrabold text-slate-800 truncate">{s.nombre}</p>
                          <p className="text-xs text-slate-400 mt-1 truncate">{s.puesto || 'Socio Regular'}</p>
                        </div>
                        <span className="text-sm font-black text-red-600 bg-red-50 px-3 py-1 rounded-xl ml-3">
                          Q {s.montoPendiente.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {socios.filter(s => s.montoPendiente > 0).length === 0 && (
                      <div className="text-center text-slate-400 text-sm py-4 italic">No hay cobros pendientes. ¡Todo al día!</div>
                    )}
                  </div>
                </div>

                {/* Próximos Programas */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Próximos Programas</h3>
                    <button onClick={() => setActiveTab('calendario')} className="text-sm text-blue-900 font-bold hover:underline">Ver todos</button>
                  </div>
                  <div className="space-y-4">
                    {actividades.slice(0, 3).map(act => (
                      <div key={act.id} className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                        <div className="bg-blue-50 text-blue-900 p-3 rounded-xl mr-4">
                          <Calendar size={20} />
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="font-extrabold text-slate-800 truncate">{act.titulo}</p>
                          <p className="text-xs text-slate-400 mt-1 truncate">{act.fecha} • {act.lugar}</p>
                        </div>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ml-3 ${
                          act.publica ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {act.publica ? 'Público' : 'Socio'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Donaciones Recientes */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Donaciones Recientes</h3>
                    <button onClick={() => setActiveTab('donaciones')} className="text-sm text-blue-900 font-bold hover:underline">Ver todas</button>
                  </div>
                  <div className="space-y-4">
                    {donaciones.slice(0, 3).map(don => (
                      <div key={don.id} className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                        <div className="bg-green-50 text-green-600 p-3 rounded-xl mr-4">
                          <Gift size={20} />
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="font-extrabold text-slate-800 truncate">{don.donante}</p>
                          <p className="text-xs text-slate-400 mt-1 truncate">{don.proyecto} • {don.fecha}</p>
                        </div>
                        <span className="text-sm font-black text-green-600 bg-green-50 px-3 py-1 rounded-xl ml-3">
                          + Q {don.monto.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actas Recientes */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Actas Recientes</h3>
                    <button onClick={() => setActiveTab('actas')} className="text-sm text-blue-900 font-bold hover:underline">Ver biblioteca</button>
                  </div>
                  <div className="space-y-4">
                    {actas.slice(0, 3).map(acta => (
                      <div key={acta.id} className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                        <div className="bg-yellow-50 text-yellow-600 p-3 rounded-xl mr-4">
                          <FileText size={20} />
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="font-extrabold text-slate-800 truncate">{acta.titulo}</p>
                          <p className="text-xs text-slate-400 mt-1">Por {acta.autor} • {acta.fecha}</p>
                        </div>
                        <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full uppercase ml-3">
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
          {activeTab === 'calendario' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight">Gestión de Actividades</h3>
                  <p className="text-xs text-slate-550 font-bold uppercase tracking-wider mt-1">Crea, edita y publica los próximos eventos del club</p>
                </div>
                <button 
                  onClick={() => setShowAddActividad(true)}
                  className="bg-blue-900 hover:bg-blue-800 text-white font-black px-6 py-3.5 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-blue-900/10 active:scale-95 transition-all text-sm"
                >
                  <Plus size={18} />
                  <span>Programar Actividad</span>
                </button>
              </div>

              {/* Add Activity Form Modal */}
              {showAddActividad && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
                  <form onSubmit={handleAddActividad} className="bg-white rounded-[2.5rem] p-6 sm:p-10 max-w-lg w-full space-y-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300 my-8">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-2xl font-black text-blue-900">Nueva Actividad</h4>
                        <p className="text-[10px] text-slate-450 font-bold uppercase tracking-widest mt-0.5">Programación y Difusión</p>
                      </div>
                      <button type="button" onClick={() => setShowAddActividad(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} /></button>
                    </div>

                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Título de la Actividad</label>
                        <input 
                          type="text" 
                          required 
                          value={newActividad.titulo} 
                          onChange={e => setNewActividad({...newActividad, titulo: e.target.value})}
                          placeholder="Ej. Jornada Médica Visual"
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Descripción Detallada</label>
                        <textarea 
                          rows={4} 
                          required
                          value={newActividad.descripcion} 
                          onChange={e => setNewActividad({...newActividad, descripcion: e.target.value})}
                          placeholder="Describe el propósito del evento, quiénes pueden asistir y cómo participar..."
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all resize-none text-sm leading-relaxed"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha y Hora</label>
                          <input 
                            type="datetime-local" 
                            required 
                            value={newActividad.fecha} 
                            onChange={e => setNewActividad({...newActividad, fecha: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ubicación / Lugar</label>
                          <input 
                            type="text" 
                            required 
                            value={newActividad.lugar} 
                            onChange={e => setNewActividad({...newActividad, lugar: e.target.value})}
                            placeholder="Ej. Parque Central Xela"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Imagen / Afiche de la Actividad</label>
                        <div className="space-y-3">
                          <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100/50 hover:border-blue-900/30 transition-all overflow-hidden relative group">
                              {newActividadImagePreview ? (
                                <>
                                  <img src={newActividadImagePreview} alt="Preview" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                                    Cambiar Imagen
                                  </div>
                                </>
                              ) : (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                                  <Upload className="w-8 h-8 text-slate-400 mb-2 group-hover:text-blue-900 transition-colors" />
                                  <p className="mb-1 text-xs font-bold text-slate-500 uppercase tracking-wider">Subir archivo de imagen</p>
                                  <p className="text-[10px] text-slate-400">PNG, JPG o WEBP (se comprimirá automáticamente)</p>
                                </div>
                              )}
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setNewActividadImageFile(file);
                                    try {
                                      const compressed = await compressImageFile(file, 800, 800, 0.7);
                                      setNewActividadImagePreview(compressed);
                                    } catch (err) {
                                      console.error("Error compressing preview image:", err);
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        setNewActividadImagePreview(reader.result as string);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }
                                }}
                              />
                            </label>
                          </div>
                          
                          <div className="relative flex items-center">
                            <div className="flex-grow border-t border-slate-200"></div>
                            <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">O ingresar URL</span>
                            <div className="flex-grow border-t border-slate-200"></div>
                          </div>

                          <input 
                            type="text" 
                            value={newActividad.imagen} 
                            onChange={e => {
                              setNewActividad({...newActividad, imagen: e.target.value});
                              setNewActividadImageFile(null);
                              setNewActividadImagePreview(null);
                            }}
                            placeholder="https://images.unsplash.com/... (Opcional)"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-mono"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 pt-2">
                        <div className="flex items-center space-x-3">
                          <input 
                            type="checkbox" 
                            id="publica" 
                            checked={newActividad.publica} 
                            onChange={e => setNewActividad({...newActividad, publica: e.target.checked})}
                            className="w-5 h-5 rounded text-blue-900 border-slate-350 focus:ring-blue-900"
                          />
                          <label htmlFor="publica" className="text-sm font-bold text-slate-700 select-none cursor-pointer">Hacer actividad pública en el sitio web</label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input 
                            type="checkbox" 
                            id="conBotonDonacion" 
                            checked={newActividad.conBotonDonacion} 
                            onChange={e => setNewActividad({...newActividad, conBotonDonacion: e.target.checked})}
                            className="w-5 h-5 rounded text-blue-900 border-slate-350 focus:ring-blue-900"
                          />
                          <label htmlFor="conBotonDonacion" className="text-sm font-bold text-slate-700 select-none cursor-pointer">Habilitar Botón de Donaciones</label>
                        </div>
                      </div>

                      {newActividad.conBotonDonacion && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Enlace de Donación Personalizado (Opcional)</label>
                          <input 
                            type="text" 
                            value={newActividad.donacionUrl} 
                            onChange={e => setNewActividad({...newActividad, donacionUrl: e.target.value})}
                            placeholder="Ej. #/donar o link de pago externo (dejar vacío para general)"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-mono"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-3 pt-4 border-t border-slate-100">
                      <button 
                        type="button" 
                        onClick={() => setShowAddActividad(false)}
                        className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl transition-colors text-sm"
                        disabled={isSavingActividad}
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        disabled={isSavingActividad}
                        className="w-1/2 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-900/50 text-white font-black py-3.5 rounded-2xl transition-all shadow-md hover:shadow-lg text-sm flex items-center justify-center space-x-2"
                      >
                        {isSavingActividad ? (
                          <>
                            <Loader2 className="animate-spin" size={16} />
                            <span>Guardando...</span>
                          </>
                        ) : (
                          <span>Agregar</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Edit Activity Form Modal */}
              {showEditActividad && editingActividad && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
                  <form onSubmit={handleSaveEditedActividad} className="bg-white rounded-[2.5rem] p-6 sm:p-10 max-w-lg w-full space-y-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300 my-8">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-2xl font-black text-blue-900">Editar Actividad</h4>
                        <p className="text-[10px] text-slate-450 font-bold uppercase tracking-widest mt-0.5">Modificación de Contenido</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => {
                          setShowEditActividad(false);
                          setEditingActividad(null);
                        }} 
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Título de la Actividad</label>
                        <input 
                          type="text" 
                          required 
                          value={editingActividad.titulo} 
                          onChange={e => setEditingActividad({...editingActividad, titulo: e.target.value})}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Descripción Detallada</label>
                        <textarea 
                          rows={4} 
                          required
                          value={editingActividad.descripcion} 
                          onChange={e => setEditingActividad({...editingActividad, descripcion: e.target.value})}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all resize-none text-sm leading-relaxed"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha y Hora</label>
                          <input 
                            type="datetime-local" 
                            required 
                            value={editingActividad.fecha.includes(' ') ? editingActividad.fecha.replace(' ', 'T') : editingActividad.fecha} 
                            onChange={e => setEditingActividad({...editingActividad, fecha: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ubicación / Lugar</label>
                          <input 
                            type="text" 
                            required 
                            value={editingActividad.lugar} 
                            onChange={e => setEditingActividad({...editingActividad, lugar: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Imagen / Afiche de la Actividad</label>
                        <div className="space-y-3">
                          <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100/50 hover:border-blue-900/30 transition-all overflow-hidden relative group">
                              {(editActividadImagePreview || editingActividad.imagen) ? (
                                <>
                                  <img src={editActividadImagePreview || editingActividad.imagen} alt="Preview" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                                    Cambiar Imagen
                                  </div>
                                </>
                              ) : (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                                  <Upload className="w-8 h-8 text-slate-400 mb-2 group-hover:text-blue-900 transition-colors" />
                                  <p className="mb-1 text-xs font-bold text-slate-500 uppercase tracking-wider">Subir archivo de imagen</p>
                                  <p className="text-[10px] text-slate-400">PNG, JPG o WEBP (se comprimirá automáticamente)</p>
                                </div>
                              )}
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setEditActividadImageFile(file);
                                    try {
                                      const compressed = await compressImageFile(file, 800, 800, 0.7);
                                      setEditActividadImagePreview(compressed);
                                    } catch (err) {
                                      console.error("Error compressing preview image:", err);
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        setEditActividadImagePreview(reader.result as string);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }
                                }}
                              />
                            </label>
                          </div>
                          
                          <div className="relative flex items-center">
                            <div className="flex-grow border-t border-slate-200"></div>
                            <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">O ingresar URL</span>
                            <div className="flex-grow border-t border-slate-200"></div>
                          </div>

                          <input 
                            type="text" 
                            value={editingActividad.imagen} 
                            onChange={e => {
                              setEditingActividad({...editingActividad, imagen: e.target.value});
                              setEditActividadImageFile(null);
                              setEditActividadImagePreview(null);
                            }}
                            placeholder="https://images.unsplash.com/... (Opcional)"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-mono"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 pt-2">
                        <div className="flex items-center space-x-3">
                          <input 
                            type="checkbox" 
                            id="edit-publica" 
                            checked={editingActividad.publica} 
                            onChange={e => setEditingActividad({...editingActividad, publica: e.target.checked})}
                            className="w-5 h-5 rounded text-blue-900 border-slate-350 focus:ring-blue-900"
                          />
                          <label htmlFor="edit-publica" className="text-sm font-bold text-slate-700 select-none cursor-pointer">Hacer actividad pública en el sitio web</label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input 
                            type="checkbox" 
                            id="edit-conBotonDonacion" 
                            checked={editingActividad.conBotonDonacion || false} 
                            onChange={e => setEditingActividad({...editingActividad, conBotonDonacion: e.target.checked})}
                            className="w-5 h-5 rounded text-blue-900 border-slate-350 focus:ring-blue-900"
                          />
                          <label htmlFor="edit-conBotonDonacion" className="text-sm font-bold text-slate-700 select-none cursor-pointer">Habilitar Botón de Donaciones</label>
                        </div>
                      </div>

                      {(editingActividad.conBotonDonacion) && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Enlace de Donación Personalizado (Opcional)</label>
                          <input 
                            type="text" 
                            value={editingActividad.donacionUrl || ''} 
                            onChange={e => setEditingActividad({...editingActividad, donacionUrl: e.target.value})}
                            placeholder="Ej. #/donar o link de pago externo"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-mono"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-3 pt-4 border-t border-slate-100">
                      <button 
                        type="button" 
                        onClick={() => {
                          setShowEditActividad(false);
                          setEditingActividad(null);
                          setEditActividadImageFile(null);
                          setEditActividadImagePreview(null);
                        }}
                        className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl transition-colors text-sm"
                        disabled={isSavingActividad}
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        disabled={isSavingActividad}
                        className="w-1/2 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-900/50 text-white font-black py-3.5 rounded-2xl transition-all shadow-md hover:shadow-lg text-sm flex items-center justify-center space-x-2"
                      >
                        {isSavingActividad ? (
                          <>
                            <Loader2 className="animate-spin" size={16} />
                            <span>Guardando...</span>
                          </>
                        ) : (
                          <span>Guardar Cambios</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Sub tabs for Calendario: Actividades vs Voluntarios */}
              <div className="flex border-b border-slate-200 gap-6 mb-2">
                <button
                  onClick={() => setCalendarioSubTab('lista')}
                  className={`pb-4 text-sm font-extrabold transition-all relative ${
                    calendarioSubTab === 'lista'
                      ? 'text-blue-900 border-b-2 border-blue-900'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Actividades Programadas ({actividades.length})
                </button>
                <button
                  onClick={() => setCalendarioSubTab('voluntarios')}
                  className={`pb-4 text-sm font-extrabold transition-all relative ${
                    calendarioSubTab === 'voluntarios'
                      ? 'text-blue-900 border-b-2 border-blue-900'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Solicitudes de Voluntarios ({voluntarios.length})
                </button>
              </div>

              {calendarioSubTab === 'lista' ? (
                /* Activities Filters & List */
                <div className="space-y-6">
                {/* Filters */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full md:w-1/3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Buscar actividad..."
                      value={actividadSearch}
                      onChange={e => setActividadSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all text-sm outline-none"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <Filter size={16} className="text-slate-400 hidden sm:block" />
                      <select 
                        value={actividadFilter}
                        onChange={e => setActividadFilter(e.target.value as any)}
                        className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-900 appearance-none cursor-pointer"
                      >
                        <option value="Todas">Todas las Actividades</option>
                        <option value="Publicas">Solo Públicas</option>
                        <option value="Privadas">Solo Privadas</option>
                      </select>
                    </div>
                    <select 
                      value={actividadSort}
                      onChange={e => setActividadSort(e.target.value as any)}
                      className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-900 appearance-none cursor-pointer"
                    >
                      <option value="recientes">Más recientes</option>
                      <option value="antiguas">Más antiguas</option>
                      <option value="az">Alfabético (A-Z)</option>
                      <option value="za">Alfabético (Z-A)</option>
                    </select>
                  </div>
                </div>

                {/* Cards Grid */}
                {filteredAndSortedActividades.length === 0 ? (
                  <div className="bg-white p-10 rounded-2xl border border-slate-200/80 shadow-sm text-center">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No se encontraron actividades que coincidan con la búsqueda.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {filteredAndSortedActividades.map(act => (
                      <div key={act.id} className="bg-white rounded-[2rem] overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group">
                        <div className="relative h-48 overflow-hidden bg-slate-100 shrink-0">
                          <img 
                            src={act.imagen || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=800'} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            alt={act.titulo}
                          />
                          <div className="absolute top-4 left-4 flex flex-col gap-2">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-sm backdrop-blur-md ${
                              act.publica ? 'bg-green-500/90 text-white' : 'bg-slate-800/90 text-white'
                            }`}>
                              {act.publica ? 'Público' : 'Solo Socios'}
                            </span>
                            {act.conBotonDonacion && (
                              <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase bg-rose-500/90 text-white shadow-sm backdrop-blur-md flex items-center space-x-1">
                                <Gift size={10} />
                                <span>Donaciones</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                          <h4 className="font-extrabold text-slate-800 text-lg leading-tight mb-3 line-clamp-2">{act.titulo}</h4>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-start space-x-2 text-slate-500">
                              <Calendar size={14} className="mt-0.5 shrink-0 text-blue-900/60" />
                              <span className="text-xs font-semibold">{act.fecha}</span>
                            </div>
                            <div className="flex items-start space-x-2 text-slate-500">
                              <Building size={14} className="mt-0.5 shrink-0 text-blue-900/60" />
                              <span className="text-xs font-medium line-clamp-2">{act.lugar}</span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-slate-600 line-clamp-3 mb-6 flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            {act.descripcion || "Sin descripción proporcionada."}
                          </p>

                          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 mt-auto">
                            <button 
                              onClick={() => {
                                setEditingActividad(act);
                                setShowEditActividad(true);
                              }}
                              className="flex items-center justify-center space-x-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-900 py-2.5 rounded-xl transition-colors text-sm font-bold"
                            >
                              <Edit size={16} />
                              <span>Editar</span>
                            </button>
                            <button 
                              onClick={() => handleDeleteActividad(act.id)}
                              className="flex items-center justify-center space-x-2 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 py-2.5 rounded-xl transition-colors text-sm font-bold"
                            >
                              <Trash2 size={16} />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              ) : (
                /* Volunteer Requests Section */
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Filters & Search */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-1/3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Buscar por nombre o correo..."
                        value={voluntarioSearch}
                        onChange={e => setVoluntarioSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all text-sm outline-none font-semibold text-slate-800"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                      {/* Activity Filter */}
                      <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <Filter size={16} className="text-slate-400 hidden sm:block" />
                        <select 
                          value={voluntarioFilterActividad}
                          onChange={e => setVoluntarioFilterActividad(e.target.value)}
                          className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-900 appearance-none cursor-pointer font-bold"
                        >
                          <option value="Todas">Todas las Actividades</option>
                          {actividades.map(act => (
                            <option key={act.id} value={act.id}>{act.titulo}</option>
                          ))}
                        </select>
                      </div>

                      {/* Status Filter */}
                      <select 
                        value={voluntarioFilterEstado}
                        onChange={e => setVoluntarioFilterEstado(e.target.value)}
                        className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-900 appearance-none cursor-pointer font-bold"
                      >
                        <option value="Todos">Todos los Estados</option>
                        <option value="Pendiente">Pendientes</option>
                        <option value="Aprobado">Aprobados</option>
                        <option value="Rechazado">Rechazados</option>
                      </select>
                    </div>
                  </div>

                  {/* List / Table */}
                  {filteredVoluntarios.length === 0 ? (
                    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200/80 shadow-sm text-center">
                      <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-semibold text-base">No se encontraron solicitudes de voluntariado.</p>
                      <p className="text-slate-400 text-xs mt-1">Las personas que se apunten en la web pública aparecerán aquí.</p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table View */}
                      <div className="hidden lg:block bg-white rounded-[2.5rem] border border-slate-200/80 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-left">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold text-xs uppercase tracking-wider">
                                <th className="py-6 px-6">Voluntario</th>
                                <th className="py-6 px-6">Teléfono</th>
                                <th className="py-6 px-6">Actividad</th>
                                <th className="py-6 px-6">Fecha Registro</th>
                                <th className="py-6 px-6">Mensaje / Motivación</th>
                                <th className="py-6 px-6">Estado</th>
                                <th className="py-6 px-6 text-right">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {filteredVoluntarios.map(v => (
                                <tr key={v.id} className="hover:bg-slate-50/30 transition-colors">
                                  <td className="py-5 px-6">
                                    <p className="font-extrabold text-slate-800 text-sm">{v.nombre}</p>
                                    <p className="text-xs text-slate-450 mt-0.5">{v.correo}</p>
                                  </td>
                                  <td className="py-5 px-6">
                                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                                      {v.telefono}
                                    </span>
                                  </td>
                                  <td className="py-5 px-6 text-xs font-bold text-slate-700 max-w-[150px] truncate">
                                    {v.actividadTitulo}
                                  </td>
                                  <td className="py-5 px-6 text-xs text-slate-500 font-semibold">
                                    {new Date(v.fechaRegistro).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </td>
                                  <td className="py-5 px-6 text-xs text-slate-650 max-w-xs truncate" title={v.mensaje}>
                                    {v.mensaje || <span className="text-slate-350 italic">Sin mensaje</span>}
                                  </td>
                                  <td className="py-5 px-6">
                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                                      v.estado === 'Aprobado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                      v.estado === 'Rechazado' ? 'bg-red-50 text-red-700 border border-red-200' :
                                      'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}>
                                      {v.estado}
                                    </span>
                                  </td>
                                  <td className="py-5 px-6 text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                      {v.estado === 'Pendiente' && (
                                        <>
                                          <button
                                            onClick={() => handleUpdateVoluntarioEstado(v.id, 'Aprobado')}
                                            className="w-8 h-8 rounded-xl bg-green-50 hover:bg-green-500 text-green-600 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95"
                                            title="Aprobar Solicitud"
                                          >
                                            <Check size={16} />
                                          </button>
                                          <button
                                            onClick={() => handleUpdateVoluntarioEstado(v.id, 'Rechazado')}
                                            className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-500 text-red-600 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95"
                                            title="Rechazar Solicitud"
                                          >
                                            <X size={16} />
                                          </button>
                                        </>
                                      )}
                                      <button
                                        onClick={() => handleDeleteVoluntario(v.id)}
                                        className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 flex items-center justify-center transition-all shadow-sm active:scale-95"
                                        title="Eliminar Registro"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Mobile Cards View */}
                      <div className="lg:hidden space-y-4">
                        {filteredVoluntarios.map(v => (
                          <div key={v.id} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-extrabold text-slate-800 text-base">{v.nombre}</p>
                                <p className="text-xs text-slate-450 mt-0.5">{v.correo}</p>
                              </div>
                              <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                v.estado === 'Aprobado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                v.estado === 'Rechazado' ? 'bg-red-50 text-red-700 border border-red-200' :
                                'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {v.estado}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
                              <div>
                                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Actividad:</span>
                                <p className="text-slate-750 font-extrabold mt-0.5">{v.actividadTitulo}</p>
                              </div>
                              <div>
                                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Teléfono:</span>
                                <p className="text-slate-750 font-extrabold mt-0.5">{v.telefono}</p>
                              </div>
                            </div>
                            {v.mensaje && (
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                                <span className="text-slate-450 font-bold uppercase tracking-wider text-[8px] block mb-1">Mensaje:</span>
                                <p className="text-slate-650 font-medium italic">{v.mensaje}</p>
                              </div>
                            )}
                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                              {v.estado === 'Pendiente' && (
                                <>
                                  <button
                                    onClick={() => handleUpdateVoluntarioEstado(v.id, 'Aprobado')}
                                    className="px-3 py-1.5 rounded-xl bg-green-50 hover:bg-green-500 text-green-700 hover:text-white text-xs font-black transition-all shadow-sm active:scale-95 flex items-center gap-1"
                                  >
                                    <Check size={14} />
                                    <span>Aprobar</span>
                                  </button>
                                  <button
                                    onClick={() => handleUpdateVoluntarioEstado(v.id, 'Rechazado')}
                                    className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-500 text-red-700 hover:text-white text-xs font-black transition-all shadow-sm active:scale-95 flex items-center gap-1"
                                  >
                                    <X size={14} />
                                    <span>Rechazar</span>
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDeleteVoluntario(v.id)}
                                className="p-2 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-550 hover:text-red-600 transition-all active:scale-95"
                                title="Eliminar"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: CONTROL DE CUOTAS */}
          {activeTab === 'cuotas' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight">Cobros y Control de Cuotas</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Gestión Financiera de Aportaciones de Socios</p>
                </div>
                <button 
                  onClick={() => {
                    setRegistrarPagoData(prev => ({
                      ...prev,
                      socioId: '',
                      monto: 100
                    }));
                    setShowRegistrarPagoModal(true);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white font-black px-6 py-3 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-green-600/10 active:scale-95 transition-all w-full md:w-auto"
                >
                  <Plus size={18} />
                  <span>Registrar Pago</span>
                </button>
              </div>

              {/* KPI Widgets */}
              {(() => {
                const totalRecaudado = socios.reduce((sum, s) => {
                  const pagosSocio = s.historialPagos?.reduce((pSum, p) => pSum + p.monto, 0) || 0;
                  return sum + pagosSocio;
                }, 0);
                const totalPendiente = socios.reduce((sum, s) => sum + (s.montoPendiente || 0), 0);
                const sociosAlDia = socios.filter(s => s.rol !== UserRole.DONANTE && s.rol !== UserRole.GUEST && s.estadoCuotas === 'Al día').length;
                const sociosTotal = socios.filter(s => s.rol !== UserRole.DONANTE && s.rol !== UserRole.GUEST).length;
                const porcentajeSolvencia = sociosTotal > 0 ? Math.round((sociosAlDia / sociosTotal) * 100) : 100;
                const sociosEnMora = socios.filter(s => s.rol !== UserRole.DONANTE && s.rol !== UserRole.GUEST && s.estadoCuotas === 'En mora').length;

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
                      <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                        <TrendingUp size={24} />
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Recaudado</span>
                        <span className="text-xl font-black text-slate-800">Q {totalRecaudado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
                      <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                        <DollarSign size={24} />
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Monto por Cobrar</span>
                        <span className="text-xl font-black text-slate-800">Q {totalPendiente.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                        <CheckCircle size={24} />
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Solvencia General</span>
                        <span className="text-xl font-black text-slate-800">{porcentajeSolvencia}% ({sociosAlDia}/{sociosTotal})</span>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
                      <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                        <Clock size={24} />
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Socios en Mora</span>
                        <span className="text-xl font-black text-slate-800">{sociosEnMora} Socios</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Controls: Search & Filter */}
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:flex-grow">
                  <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={socioSearch}
                    onChange={e => setSocioSearch(e.target.value)}
                    placeholder="Buscar socio por nombre, correo o código..."
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm shadow-sm"
                  />
                </div>
                <div className="flex items-center space-x-3 w-full sm:w-auto flex-shrink-0">
                  <Filter size={18} className="text-slate-400 flex-shrink-0 hidden xs:block" />
                  <select 
                    value={cuotasFilterStatus} 
                    onChange={e => setCuotasFilterStatus(e.target.value as any)}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-900 w-full sm:w-56 shadow-sm"
                  >
                    <option value="Todos">Todos los Estados</option>
                    <option value="Al día">Al día</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="En mora">En mora</option>
                  </select>
                </div>
              </div>

              {/* Members Cuotas List / Table */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-sm overflow-hidden">
                
                {/* Desktop View: Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold text-xs uppercase tracking-wider">
                        <th className="py-6 px-6">Socio</th>
                        <th className="py-6 px-6">Estado</th>
                        <th className="py-6 px-6">Historial Visual (2026)</th>
                        <th className="py-6 px-6">Monto Pendiente</th>
                        <th className="py-6 px-6 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSociosCuotas.map(s => {
                        const isExpanded = selectedSocioForCuotas === s.id;
                        
                        // Determine payment types for visual rendering
                        const hasSemestral = s.historialPagos?.some(p => p.tipoPeriodo === 'Semestral');
                        const hasAnual = s.historialPagos?.some(p => p.tipoPeriodo === 'Anual');

                        return (
                          <React.Fragment key={s.id}>
                            <tr className={`hover:bg-slate-50/30 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/20' : ''}`} onClick={() => setSelectedSocioForCuotas(isExpanded ? null : s.id)}>
                              <td className="py-5 px-6 flex items-center space-x-4">
                                <img 
                                  src={s.foto} 
                                  alt={s.nombre} 
                                  className="w-10 h-10 rounded-full border border-slate-100 object-cover cursor-zoom-in" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPhoto({ url: s.foto, title: s.nombre });
                                  }}
                                />
                                <div>
                                  <p className="font-extrabold text-slate-800">{s.nombre}</p>
                                  <p className="text-xs text-slate-450 mt-0.5">{s.codigoSocio || 'Sin código'} • {s.correo}</p>
                                </div>
                              </td>
                              <td className="py-5 px-6">
                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                  s.estadoCuotas === 'Al día' 
                                    ? 'bg-green-50 text-green-700 border border-green-200/50' 
                                    : s.estadoCuotas === 'Pendiente' 
                                      ? 'bg-yellow-50 text-yellow-700 border border-yellow-200/50' 
                                      : 'bg-red-50 text-red-700 border border-red-200/50'
                                }`}>
                                  {s.estadoCuotas}
                                </span>
                              </td>
                              <td className="py-5 px-6" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-1">
                                  {hasAnual ? (
                                    // Render Annual badge
                                    (() => {
                                      const paid = s.historialPagos?.some(p => p.tipoPeriodo === 'Anual' && p.periodo.includes('2026'));
                                      return (
                                        <div 
                                          title={paid ? "Anual 2026 Pagado" : "Anual 2026 Pendiente"} 
                                          className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                                            paid ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-slate-100 text-slate-400 border border-slate-200'
                                          }`}
                                        >
                                          Anual 2026
                                        </div>
                                      );
                                    })()
                                  ) : hasSemestral ? (
                                    // Render Semestral badges
                                    ['1er Semestre', '2do Semestre'].map((sem, idx) => {
                                      const paid = s.historialPagos?.some(p => p.tipoPeriodo === 'Semestral' && p.periodo.includes(sem));
                                      return (
                                        <div 
                                          key={idx}
                                          title={`${sem} 2026: ${paid ? 'Pagado' : 'Pendiente'}`}
                                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                            paid ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-400 border border-slate-200'
                                          }`}
                                        >
                                          {idx === 0 ? 'Semestre 1' : 'Semestre 2'}
                                        </div>
                                      );
                                    })
                                  ) : (
                                    // Render Monthly badges (12 months)
                                    ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((month, idx) => {
                                      const fullMonthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                                      const paid = s.historialPagos?.some(p => p.tipoPeriodo === 'Mensual' && p.periodo.includes(fullMonthNames[idx]));
                                      
                                      // If month has passed (0-indexed current month is e.g. June=5) and unpaid
                                      const currentMonthIdx = new Date().getMonth();
                                      const isPastUnpaid = idx <= currentMonthIdx && !paid;
                                      
                                      return (
                                        <div 
                                          key={idx}
                                          title={`${fullMonthNames[idx]} 2026: ${paid ? 'Pagado' : isPastUnpaid ? 'Atrasado' : 'Próximo'}`}
                                          className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black uppercase border ${
                                            paid 
                                              ? 'bg-green-500 text-white border-green-600' 
                                              : isPastUnpaid 
                                                ? 'bg-red-500 text-white border-red-600 animate-pulse'
                                                : 'bg-slate-100 text-slate-400 border-slate-200'
                                          }`}
                                        >
                                          {month.substring(0, 1)}
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              </td>
                              <td className="py-5 px-6 font-extrabold text-slate-800 text-base">Q {s.montoPendiente.toFixed(2)}</td>
                              <td className="py-5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => handleRegistrarPago(s.id)}
                                    className="bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-3.5 py-2 rounded-xl font-bold text-xs transition-colors flex items-center space-x-1 shadow-sm"
                                    title="Registrar aportación"
                                  >
                                    <Check size={14} />
                                    <span>Cobrar</span>
                                  </button>
                                  <button
                                    onClick={() => handleEnviarRecordatorio(s)}
                                    className="bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 p-2 rounded-xl font-bold text-xs transition-colors shadow-sm"
                                    title="Enviar aviso por correo"
                                  >
                                    <Send size={14} />
                                  </button>
                                  <div className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors">
                                    <ChevronDown className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} size={16} onClick={() => setSelectedSocioForCuotas(isExpanded ? null : s.id)} />
                                  </div>
                                </div>
                              </td>
                            </tr>
                            
                            {/* Expanded Detail Panel */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={5} className="bg-slate-50/50 p-6 border-b border-slate-100">
                                  <div className="space-y-6 max-w-5xl mx-auto">
                                    
                                    {/* Warnings Section */}
                                    {s.estadoCuotas === 'En mora' ? (
                                      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-800 flex items-start space-x-3 text-sm">
                                        <AlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
                                        <div>
                                          <span className="font-extrabold block">Alerta de Atraso Crítico (En Mora)</span>
                                          <p className="mt-1 leading-relaxed">
                                            El socio presenta un atraso mayor a 60 días con un saldo pendiente acumulado de <strong className="font-black">Q {s.montoPendiente.toFixed(2)}</strong>. 
                                            Su último pago registrado fue el <strong className="font-bold">{s.fechaUltimoPago || 'No registrado'}</strong>. 
                                            Se recomienda suspender temporalmente sus beneficios corporativos y enviar una notificación formal de cobro.
                                          </p>
                                        </div>
                                      </div>
                                    ) : s.estadoCuotas === 'Pendiente' ? (
                                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 flex items-start space-x-3 text-sm">
                                        <AlertCircle className="text-amber-500 mt-0.5 flex-shrink-0" size={18} />
                                        <div>
                                          <span className="font-extrabold block">Aviso de Cuota Pendiente</span>
                                          <p className="mt-1 leading-relaxed">
                                            El socio tiene un pago pendiente por valor de <strong className="font-black">Q {s.montoPendiente.toFixed(2)}</strong>. 
                                            Su cuenta se encuentra activa pero requiere ponerse al día a la brevedad.
                                          </p>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-green-800 flex items-start space-x-3 text-sm">
                                        <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={18} />
                                        <div>
                                          <span className="font-extrabold block">Cuenta Solvente</span>
                                          <p className="mt-1 leading-relaxed">
                                            El socio se encuentra al día con sus cuotas obligatorias. ¡Gracias por su puntualidad! 
                                            Último pago registrado el <strong className="font-bold">{s.fechaUltimoPago || 'N/A'}</strong>.
                                          </p>
                                        </div>
                                      </div>
                                    )}

                                    {/* Payments History Table */}
                                    <div className="space-y-3">
                                      <h5 className="font-extrabold text-slate-800 text-sm flex items-center space-x-2">
                                        <CreditCard size={16} className="text-blue-900" />
                                        <span>Historial Detallado de Transacciones</span>
                                      </h5>
                                      
                                      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                        <table className="w-full text-left border-collapse text-xs">
                                          <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                                              <th className="p-4">Fecha Pago</th>
                                              <th className="p-4">Período Aportación</th>
                                              <th className="p-4">Tipo</th>
                                              <th className="p-4">Monto</th>
                                              <th className="p-4">Método</th>
                                              <th className="p-4">Referencia / Banco</th>
                                              <th className="p-4 text-right">Comprobante</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100 text-slate-650">
                                            {s.historialPagos && s.historialPagos.length > 0 ? (
                                              s.historialPagos.map(pago => (
                                                <tr key={pago.id} className="hover:bg-slate-50/40">
                                                  <td className="p-4 font-semibold">{pago.fechaPago}</td>
                                                  <td className="p-4 font-bold text-slate-800">{pago.periodo}</td>
                                                  <td className="p-4">{pago.tipoPeriodo}</td>
                                                  <td className="p-4 font-extrabold text-slate-800">Q {pago.monto.toFixed(2)}</td>
                                                  <td className="p-4">
                                                    <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase ${
                                                      pago.metodo === 'Transferencia' ? 'bg-blue-50 text-blue-700' : pago.metodo === 'Depósito' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                      {pago.metodo}
                                                    </span>
                                                  </td>
                                                  <td className="p-4">
                                                    {pago.metodo !== 'Efectivo' ? (
                                                      <span>{pago.numeroReferencia || 'S/N'} • <span className="font-bold">{pago.bancoReferencia || 'N/A'}</span></span>
                                                    ) : (
                                                      <span className="text-slate-400 italic">Efectivo</span>
                                                    )}
                                                  </td>
                                                  <td className="p-4 text-right">
                                                    <button
                                                      onClick={() => generateReciboPagoPDF(s, pago)}
                                                      className="text-blue-900 hover:text-blue-800 font-black flex items-center space-x-1 ml-auto border border-blue-200/50 hover:bg-blue-50/50 px-2.5 py-1.5 rounded-lg shadow-sm transition-all"
                                                      title="Descargar PDF"
                                                    >
                                                      <Download size={12} />
                                                      <span>Recibo PDF</span>
                                                    </button>
                                                  </td>
                                                </tr>
                                              ))
                                            ) : (
                                              <tr>
                                                <td colSpan={7} className="p-8 text-center text-slate-400 italic bg-slate-50/20">
                                                  No se han registrado transacciones de aportaciones para este socio.
                                                </td>
                                              </tr>
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                      {filteredSociosCuotas.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-12 text-slate-400 italic">
                            No se encontraron socios con esos criterios.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View: Cards */}
                <div className="block lg:hidden divide-y divide-slate-100">
                  {filteredSociosCuotas.map(s => {
                    const isExpanded = selectedSocioForCuotas === s.id;
                    const hasSemestral = s.historialPagos?.some(p => p.tipoPeriodo === 'Semestral');
                    const hasAnual = s.historialPagos?.some(p => p.tipoPeriodo === 'Anual');

                    return (
                      <div key={s.id} className="hover:bg-slate-50/20 transition-colors">
                        {/* Main row card */}
                        <div className="p-6 space-y-4 cursor-pointer" onClick={() => setSelectedSocioForCuotas(isExpanded ? null : s.id)}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 min-w-0">
                              <img 
                                src={s.foto} 
                                alt={s.nombre} 
                                className="w-11 h-11 rounded-full border border-slate-100 object-cover cursor-zoom-in flex-shrink-0" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPhoto({ url: s.foto, title: s.nombre });
                                }}
                              />
                              <div className="min-w-0">
                                <h4 className="font-extrabold text-slate-800 text-sm leading-tight break-words">{s.nombre}</h4>
                                <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">{s.codigoSocio || 'Sin código'}</p>
                              </div>
                            </div>
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border flex-shrink-0 ${
                              s.estadoCuotas === 'Al día' 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : s.estadoCuotas === 'Pendiente' 
                                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200' 
                                  : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {s.estadoCuotas}
                            </span>
                          </div>

                          {/* Visual mini history */}
                          <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                            <span className="text-slate-400 text-[9px] uppercase tracking-wider font-bold block">Historial aportaciones 2026:</span>
                            <div className="flex items-center gap-1 flex-wrap">
                              {hasAnual ? (
                                (() => {
                                  const paid = s.historialPagos?.some(p => p.tipoPeriodo === 'Anual' && p.periodo.includes('2026'));
                                  return (
                                    <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                      paid ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-slate-150 text-slate-400 border border-slate-200'
                                    }`}>
                                      Anual 2026
                                    </div>
                                  );
                                })()
                              ) : hasSemestral ? (
                                ['1er Semestre', '2do Semestre'].map((sem, idx) => {
                                  const paid = s.historialPagos?.some(p => p.tipoPeriodo === 'Semestral' && p.periodo.includes(sem));
                                  return (
                                    <div 
                                      key={idx}
                                      className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                        paid ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-400 border border-slate-200'
                                      }`}
                                    >
                                      Semestre {idx + 1}
                                    </div>
                                  );
                                })
                              ) : (
                                ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((month, idx) => {
                                  const fullMonthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                                  const paid = s.historialPagos?.some(p => p.tipoPeriodo === 'Mensual' && p.periodo.includes(fullMonthNames[idx]));
                                  const currentMonthIdx = new Date().getMonth();
                                  const isPastUnpaid = idx <= currentMonthIdx && !paid;

                                  return (
                                    <div 
                                      key={idx}
                                      className={`w-5 h-5 rounded flex items-center justify-center text-[8px] font-black uppercase border ${
                                        paid 
                                          ? 'bg-green-500 text-white border-green-600' 
                                          : isPastUnpaid 
                                            ? 'bg-red-500 text-white border-red-600'
                                            : 'bg-slate-100 text-slate-400 border-slate-200'
                                      }`}
                                    >
                                      {month}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            <div>
                              <span className="text-slate-400 text-[9px] uppercase tracking-wider font-bold block">Pendiente</span>
                              <span className="font-extrabold text-slate-800 text-sm">Q {s.montoPendiente.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRegistrarPago(s.id);
                                }}
                                className="bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-3 py-2 rounded-xl font-bold text-xs transition-colors flex items-center space-x-1"
                              >
                                <Check size={12} />
                                <span>Cobrar</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEnviarRecordatorio(s);
                                }}
                                className="bg-slate-50 text-slate-600 border border-slate-200 p-2.5 rounded-xl transition-colors"
                              >
                                <Send size={12} />
                              </button>
                              <div className="p-2 text-slate-400">
                                <ChevronDown className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} size={16} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Mobile Expanded detail panel */}
                        {isExpanded && (
                          <div className="bg-slate-50 p-4 border-t border-slate-100 space-y-4 text-xs">
                            
                            {/* Alert Warnings */}
                            {s.estadoCuotas === 'En mora' ? (
                              <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-red-800 flex items-start space-x-2">
                                <AlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={16} />
                                <div>
                                  <span className="font-bold block text-[11px]">Atraso Crítico (En Mora)</span>
                                  <p className="mt-1 leading-relaxed text-[10px]">
                                    Atraso mayor a 60 días. Saldo pendiente acumulado: <strong>Q {s.montoPendiente.toFixed(2)}</strong>.
                                    Último pago registrado el <strong>{s.fechaUltimoPago || 'No registrado'}</strong>.
                                  </p>
                                </div>
                              </div>
                            ) : s.estadoCuotas === 'Pendiente' ? (
                              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-800 flex items-start space-x-2">
                                <AlertCircle className="text-amber-500 mt-0.5 flex-shrink-0" size={16} />
                                <div>
                                  <span className="font-bold block text-[11px]">Cuota Pendiente</span>
                                  <p className="mt-1 leading-relaxed text-[10px]">
                                    Saldo pendiente: <strong>Q {s.montoPendiente.toFixed(2)}</strong>.
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-green-50 border border-green-200 rounded-xl p-3.5 text-green-800 flex items-start space-x-2">
                                <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                                <div>
                                  <span className="font-bold block text-[11px]">Cuenta Solvente</span>
                                  <p className="mt-1 leading-relaxed text-[10px]">
                                    Al día. Último pago: <strong>{s.fechaUltimoPago || 'N/A'}</strong>.
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Detailed Payment History List */}
                            <div className="space-y-3">
                              <h5 className="font-extrabold text-slate-800 text-xs flex items-center space-x-2">
                                <CreditCard size={14} className="text-blue-900" />
                                <span>Historial de Pagos</span>
                              </h5>

                              {s.historialPagos && s.historialPagos.length > 0 ? (
                                <div className="space-y-2">
                                  {s.historialPagos.map(pago => (
                                    <div key={pago.id} className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-2">
                                      <div className="space-y-0.5">
                                        <p className="font-bold text-slate-800 text-[11px]">{pago.periodo} ({pago.tipoPeriodo})</p>
                                        <p className="text-[10px] text-slate-450">Fecha: {pago.fechaPago} • {pago.metodo}</p>
                                        {pago.metodo !== 'Efectivo' && (
                                          <p className="text-[9px] text-slate-500 font-medium">Ref: {pago.numeroReferencia} ({pago.bancoReferencia})</p>
                                        )}
                                      </div>
                                      <div className="text-right flex flex-col items-end gap-1.5">
                                        <span className="font-extrabold text-slate-800 text-xs">Q {pago.monto.toFixed(2)}</span>
                                        <button
                                          onClick={() => generateReciboPagoPDF(s, pago)}
                                          className="text-blue-900 font-bold border border-blue-100 hover:bg-blue-50 px-2 py-1 rounded-md text-[9px] flex items-center space-x-1"
                                        >
                                          <Download size={10} />
                                          <span>Recibo</span>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center text-slate-400 italic py-4 bg-white rounded-xl border border-slate-200">
                                  No hay transacciones registradas.
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredSociosCuotas.length === 0 && (
                    <div className="text-center py-12 text-slate-450 italic">
                      No se encontraron socios con esos criterios.
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB: LIBRO DE ACTAS */}
          {activeTab === 'actas' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {showAddActa ? (
                <div className="bg-white rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-10 md:p-14 border border-slate-200/80 shadow-sm space-y-6 sm:space-y-10 animate-in fade-in duration-300">
                  
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                    <div>
                      <h4 className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight">Redactar Acta de Sesión</h4>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Estandarización y Gestión Digital</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setShowAddActa(false)} 
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold px-5 py-2.5 rounded-xl transition-all text-sm flex items-center space-x-1.5 self-start sm:self-auto shadow-sm"
                    >
                      <X size={16} />
                      <span>Volver al Listado</span>
                    </button>
                  </div>

                  {/* Step Indicator */}
                  {/* Mobile Compact Progress */}
                  <div className="block md:hidden text-center space-y-2 mb-6">
                    <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-wider px-1">
                      <span>Redacción de Acta</span>
                      <span className="text-amber-600 font-extrabold">
                        Paso {['datos', 'asistencia', 'protocolo', 'solicitudes', 'libre', 'vista_previa'].indexOf(actaWizardStep) + 1} de 6
                      </span>
                    </div>
                    <div className="text-base font-extrabold text-blue-900">
                      {actaWizardStep === 'datos' && 'Datos Generales de la Sesión'}
                      {actaWizardStep === 'asistencia' && 'Control de Asistencia y Quórum'}
                      {actaWizardStep === 'protocolo' && 'Puntos de Protocolo'}
                      {actaWizardStep === 'solicitudes' && 'Resolución de Solicitudes'}
                      {actaWizardStep === 'libre' && 'Redacción de Agenda Libre'}
                      {actaWizardStep === 'vista_previa' && 'Previsualización y Publicación'}
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full w-full overflow-hidden mt-1 shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${((['datos', 'asistencia', 'protocolo', 'solicitudes', 'libre', 'vista_previa'].indexOf(actaWizardStep) + 1) / 6) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Desktop Full Stepper */}
                  <div className="hidden md:flex justify-between items-center relative my-8 px-8">
                    <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-slate-100 rounded-full z-0"></div>
                    <div 
                      className="absolute left-8 top-1/2 -translate-y-1/2 h-1 bg-amber-500 rounded-full z-0 transition-all duration-500"
                      style={{ width: `${(['datos', 'asistencia', 'protocolo', 'solicitudes', 'libre', 'vista_previa'].indexOf(actaWizardStep)) * 20}%` }}
                    ></div>
                    
                    {[
                      { id: 'datos', label: 'Datos', icon: FileText },
                      { id: 'asistencia', label: 'Asistencia', icon: Users },
                      { id: 'protocolo', label: 'Protocolo', icon: Building },
                      { id: 'solicitudes', label: 'Solicitudes', icon: Mail },
                      { id: 'libre', label: 'Agenda', icon: Briefcase },
                      { id: 'vista_previa', label: 'Previa', icon: CheckCircle }
                    ].map((s, idx) => {
                      const active = actaWizardStep === s.id;
                      const past = idx <= ['datos', 'asistencia', 'protocolo', 'solicitudes', 'libre', 'vista_previa'].indexOf(actaWizardStep);
                      const Icon = s.icon;
                      return (
                        <button 
                          key={s.id}
                          type="button"
                          onClick={() => setActaWizardStep(s.id as any)}
                          className={`relative z-10 flex flex-col items-center gap-2 focus:outline-none group`}
                        >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                            active 
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-orange-500/30 scale-110 ring-4 ring-orange-50' 
                              : past
                                ? 'bg-amber-100 text-amber-600'
                                : 'bg-white text-slate-300 border-2 border-slate-100 group-hover:border-amber-200 group-hover:text-amber-400'
                          }`}>
                            <Icon size={active ? 20 : 18} />
                          </div>
                          <span className={`text-xs font-bold transition-colors ${
                            active ? 'text-orange-600' : past ? 'text-amber-600' : 'text-slate-400'
                          }`}>
                            <span className="hidden md:inline">{idx + 1}. </span>{s.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Form Step Contents */}
                  <div className="py-2">
                    {actaWizardStep === 'datos' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 max-w-3xl mx-auto">
                        <div className="bg-slate-50/50 rounded-3xl p-4 sm:p-8 space-y-6 border border-slate-100/60 shadow-sm">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Título de la Sesión</label>
                            <input 
                              type="text"
                              value={actaWizardData.titulo}
                              onChange={e => setActaWizardData(prev => ({ ...prev, titulo: e.target.value }))}
                              placeholder="Ej. Sesión Ordinaria de Junta Directiva No. 05-2026"
                              className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-semibold text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Categoría de Sesión</label>
                            <select
                              value={actaWizardData.categoria}
                              onChange={e => setActaWizardData(prev => ({ ...prev, categoria: e.target.value as any }))}
                              className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-bold text-slate-700"
                            >
                              <option value="Ordinaria">Ordinaria</option>
                              <option value="Extraordinaria">Extraordinaria</option>
                              <option value="Reunión de Comisión">Reunión de Comisión</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Número de Acta</label>
                            <input 
                              type="text"
                              value={actaWizardData.numeroActa}
                              onChange={e => setActaWizardData(prev => ({ ...prev, numeroActa: e.target.value }))}
                              placeholder="Ej. 5"
                              className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-semibold text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Lugar Preestablecido (con Ciudad al inicio)</label>
                            <input 
                              type="text"
                              value={actaWizardData.lugar}
                              onChange={e => setActaWizardData(prev => ({ ...prev, lugar: e.target.value }))}
                              placeholder="Ej. Quetzaltenango..."
                              className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-semibold text-slate-800"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <label className="block text-sm font-bold text-slate-700">Fecha y Hora Automática (Numérica y Escrita)</label>
                              <button 
                                type="button"
                                onClick={() => setActaWizardData(prev => ({ ...prev, fechaHoraText: getWrittenDateTimeSpanish(new Date()) }))}
                                className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg uppercase tracking-wider hover:bg-amber-100 flex items-center space-x-1 transition-colors"
                              >
                                <Clock size={12} />
                                <span>Refrescar hora</span>
                              </button>
                            </div>
                            <input 
                              type="text"
                              disabled
                              value={actaWizardData.fechaHoraText}
                              className="w-full px-5 py-3.5 bg-slate-100/50 border border-slate-200 rounded-2xl text-slate-500 font-semibold text-sm outline-none cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {actaWizardStep === 'asistencia' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 max-w-5xl mx-auto text-left">
                        <div className="bg-slate-50/50 rounded-3xl p-4 sm:p-8 border border-slate-100/60 shadow-sm space-y-6">
                          
                          {/* Attendance stats */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                            <div className="text-center sm:border-r border-slate-100 py-2">
                              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Miembros</span>
                              <span className="text-2xl font-black text-slate-800">{socios.length}</span>
                            </div>
                            <div className="text-center sm:border-r border-slate-100 py-2">
                              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Presentes (Quórum)</span>
                              <span className="text-2xl font-black text-amber-500">{(actaWizardData.asistencia || []).length}</span>
                            </div>
                            <div className="text-center py-2">
                              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Ausentes</span>
                              <span className="text-2xl font-black text-slate-400">{socios.length - (actaWizardData.asistencia || []).length}</span>
                            </div>
                          </div>

                          {/* Search and Columns */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            
                            {/* Absent Column (Search & Add) */}
                            <div className="space-y-4">
                              <h5 className="font-extrabold text-slate-700 text-sm flex items-center justify-between">
                                <span>Buscar y Marcar Asistencia</span>
                                <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                                  {filteredAbsentSocios.length} Disponibles
                                </span>
                              </h5>
                              
                              <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                  type="text"
                                  value={asistenciaSearch}
                                  onChange={e => setAsistenciaSearch(e.target.value)}
                                  onKeyDown={handleAsistenciaSearchKeyDown}
                                  placeholder="Buscar por nombre o puesto... (Enter para marcar el 1ro)"
                                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-semibold text-slate-800 shadow-sm"
                                />
                              </div>

                              <div className="bg-white border border-slate-200/80 rounded-2xl max-h-[400px] overflow-y-auto divide-y divide-slate-100 shadow-sm">
                                {filteredAbsentSocios.length === 0 ? (
                                  <div className="p-8 text-center text-slate-400 text-xs italic font-medium">
                                    {asistenciaSearch ? 'No se encontraron miembros coincidentes.' : 'Todos los miembros han sido marcados como presentes.'}
                                  </div>
                                ) : (
                                  filteredAbsentSocios.map(member => (
                                    <div 
                                      key={member.id} 
                                      onClick={() => handleMarkPresent(member.id)}
                                      className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors group"
                                    >
                                      <div className="flex items-center space-x-3">
                                        <img 
                                          src={member.foto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&auto=format&fit=crop&q=60'} 
                                          alt={member.nombre} 
                                          className="w-9 h-9 rounded-full object-cover border border-slate-100 shadow-sm"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&auto=format&fit=crop&q=60';
                                          }}
                                        />
                                        <div>
                                          <p className="text-sm font-extrabold text-slate-700 group-hover:text-amber-600 transition-colors leading-tight">{member.nombre}</p>
                                          {member.puesto && <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mt-0.5">{member.puesto}</p>}
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        className="bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-600 p-2 rounded-xl transition-all active:scale-90"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMarkPresent(member.id);
                                        }}
                                      >
                                        <Plus size={16} />
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                            {/* Present Column (Quorum / Remove) */}
                            <div className="space-y-4">
                              <h5 className="font-extrabold text-slate-700 text-sm flex items-center justify-between">
                                <span>Miembros Presentes en Reunión</span>
                                <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                                  {presentSocios.length} Marcados
                                </span>
                              </h5>

                              <div className="bg-white border border-slate-200/80 rounded-2xl max-h-[460px] overflow-y-auto divide-y divide-slate-100 shadow-sm">
                                {presentSocios.length === 0 ? (
                                  <div className="p-12 text-center text-slate-400 text-sm italic font-medium">
                                    No se ha marcado asistencia aún. Utiliza la lista de la izquierda para agregar miembros.
                                  </div>
                                ) : (
                                  presentSocios.map((member, index) => (
                                    <div 
                                      key={member.id} 
                                      className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                                    >
                                      <div className="flex items-center space-x-3">
                                        <span className="text-[10px] font-black text-slate-400 w-5 text-right">{index + 1}.</span>
                                        <img 
                                          src={member.foto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&auto=format&fit=crop&q=60'} 
                                          alt={member.nombre} 
                                          className="w-9 h-9 rounded-full object-cover border border-slate-100 shadow-sm"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&auto=format&fit=crop&q=60';
                                          }}
                                        />
                                        <div>
                                          <p className="text-sm font-extrabold text-slate-805 leading-tight">{member.nombre}</p>
                                          {member.puesto && <p className="text-[10px] font-black text-amber-600 uppercase tracking-wide mt-0.5">{member.puesto}</p>}
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleMarkAbsent(member.id)}
                                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all active:scale-90"
                                        title="Remover de asistencia"
                                      >
                                        <X size={16} />
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>
                    )}

                    {actaWizardStep === 'protocolo' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 max-w-3xl mx-auto">
                        {/* Invocación */}
                        <div className="bg-slate-50/50 p-4 sm:p-8 rounded-3xl border border-slate-100/60 shadow-sm space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h5 className="text-lg font-extrabold text-blue-900 flex items-center">
                              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs mr-3">1</span>
                              Invocación Leonística
                            </h5>
                            
                            <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200/60 w-fit shadow-sm">
                              <button
                                type="button"
                                onClick={() => setActaWizardData(prev => ({ ...prev, invocacionResponsableType: 'socio' }))}
                                className={`px-4 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${
                                  actaWizardData.invocacionResponsableType === 'socio' 
                                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' 
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                }`}
                              >
                                Socio Activo
                              </button>
                              <button
                                type="button"
                                onClick={() => setActaWizardData(prev => ({ ...prev, invocacionResponsableType: 'invitado' }))}
                                className={`px-4 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${
                                  actaWizardData.invocacionResponsableType === 'invitado' 
                                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' 
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                }`}
                              >
                                Invitado
                              </button>
                            </div>
                          </div>

                          {actaWizardData.invocacionResponsableType === 'socio' ? (
                            <div className="animate-in fade-in duration-300">
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Seleccionar Socio Responsable</label>
                              <select 
                                value={actaWizardData.invocacionSocioId}
                                onChange={e => setActaWizardData(prev => ({ ...prev, invocacionSocioId: e.target.value }))}
                                className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none text-sm font-bold text-slate-700 bg-white shadow-sm"
                              >
                                {selectableSocios.map(s => (
                                  <option key={s.id} value={s.id}>{s.nombre} ({s.puesto || 'Socio Regular'})</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="animate-in fade-in duration-300">
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Nombre Completo del Invitado</label>
                              <input 
                                type="text"
                                value={actaWizardData.invocacionInvitadoName}
                                onChange={e => setActaWizardData(prev => ({ ...prev, invocacionInvitadoName: e.target.value }))}
                                placeholder="Ej. Ing. Juan Gómez (Gobernador de Distrito)"
                                className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none text-sm font-semibold text-slate-800 shadow-sm"
                              />
                            </div>
                          )}
                        </div>

                        {/* Saludo a la Bandera */}
                        <div className="bg-slate-50/50 p-4 sm:p-8 rounded-3xl border border-slate-100/60 shadow-sm space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h5 className="text-lg font-extrabold text-blue-900 flex items-center">
                              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs mr-3">2</span>
                              Saludo a la Bandera
                            </h5>
                            
                            <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200/60 w-fit shadow-sm">
                              <button
                                type="button"
                                onClick={() => setActaWizardData(prev => ({ ...prev, saludoResponsableType: 'socio' }))}
                                className={`px-4 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${
                                  actaWizardData.saludoResponsableType === 'socio' 
                                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' 
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                }`}
                              >
                                Socio Activo
                              </button>
                              <button
                                type="button"
                                onClick={() => setActaWizardData(prev => ({ ...prev, saludoResponsableType: 'invitado' }))}
                                className={`px-4 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${
                                  actaWizardData.saludoResponsableType === 'invitado' 
                                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' 
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                }`}
                              >
                                Invitado
                              </button>
                            </div>
                          </div>

                          {actaWizardData.saludoResponsableType === 'socio' ? (
                            <div className="animate-in fade-in duration-300">
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Seleccionar Socio Responsable</label>
                              <select 
                                value={actaWizardData.saludoSocioId}
                                onChange={e => setActaWizardData(prev => ({ ...prev, saludoSocioId: e.target.value }))}
                                className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none text-sm font-bold text-slate-700 bg-white shadow-sm"
                              >
                                {selectableSocios.map(s => (
                                  <option key={s.id} value={s.id}>{s.nombre} ({s.puesto || 'Socio Regular'})</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="animate-in fade-in duration-300">
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Nombre Completo del Invitado</label>
                              <input 
                                type="text"
                                value={actaWizardData.saludoInvitadoName}
                                onChange={e => setActaWizardData(prev => ({ ...prev, saludoInvitadoName: e.target.value }))}
                                placeholder="Ej. Sra. Ana Martínez"
                                className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none text-sm font-semibold text-slate-800 shadow-sm"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {actaWizardStep === 'solicitudes' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 max-w-3xl mx-auto">
                        <div className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2 flex items-center bg-amber-50 w-fit px-4 py-2 rounded-xl">
                          <FileText size={18} className="mr-2 text-amber-500" />
                          Lectura y Resolución de Solicitudes Pendientes
                        </div>

                        <div className="space-y-5 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                          {solicitudes.filter(s => s.estado === 'Pendiente').length === 0 ? (
                            <div className="text-center py-16 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 italic text-sm font-medium">
                              No hay solicitudes con estado "Pendiente" registradas en el sistema para evaluar en esta sesión.
                            </div>
                          ) : (
                            solicitudes.filter(s => s.estado === 'Pendiente').map(sol => {
                              const res = actaWizardData.solicitudesResoluciones[sol.id] || { decision: 'Pendiente', razon: '' };
                              return (
                                <div key={sol.id} className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
                                  <div className="flex flex-col md:flex-row md:justify-between items-start gap-5">
                                    <div className="flex-1 w-full">
                                      <h6 className="font-extrabold text-slate-800 text-base">{sol.nombre}</h6>
                                      <div className="flex items-center space-x-2 mt-2">
                                        <span className="text-[10px] font-black bg-blue-50 text-blue-900 px-2.5 py-1 rounded-full uppercase tracking-wider">{sol.tipo}</span>
                                        <span className="text-[10px] font-semibold text-slate-400">Creado: {sol.fechaCreacion ? new Date(sol.fechaCreacion).toLocaleDateString() : 'N/A'}</span>
                                      </div>
                                      {sol.descripcion && (
                                        <p className="text-sm text-slate-600 mt-4 font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed text-justify">{sol.descripcion}</p>
                                      )}
                                    </div>

                                    {/* Buttons group for decision */}
                                    <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-200/60 w-full sm:w-auto justify-between sm:justify-start flex-shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActaWizardData(prev => ({
                                            ...prev,
                                            solicitudesResoluciones: {
                                              ...prev.solicitudesResoluciones,
                                              [sol.id]: { ...res, decision: 'Aprobada' }
                                            }
                                          }));
                                        }}
                                        className={`flex-1 sm:flex-initial text-center px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                                          res.decision === 'Aprobada' 
                                            ? 'bg-green-500 text-white shadow-md shadow-green-500/20' 
                                            : 'text-slate-500 hover:text-green-600 hover:bg-white'
                                        }`}
                                      >
                                        Aprobar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActaWizardData(prev => ({
                                            ...prev,
                                            solicitudesResoluciones: {
                                              ...prev.solicitudesResoluciones,
                                              [sol.id]: { ...res, decision: 'Rechazada' }
                                            }
                                          }));
                                        }}
                                        className={`flex-1 sm:flex-initial text-center px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                                          res.decision === 'Rechazada' 
                                            ? 'bg-red-500 text-white shadow-md shadow-red-500/20' 
                                            : 'text-slate-500 hover:text-red-600 hover:bg-white'
                                        }`}
                                      >
                                        Rechazar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActaWizardData(prev => ({
                                            ...prev,
                                            solicitudesResoluciones: {
                                              ...prev.solicitudesResoluciones,
                                              [sol.id]: { ...res, decision: 'Pendiente' }
                                            }
                                          }));
                                        }}
                                        className={`flex-1 sm:flex-initial text-center px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                                          res.decision === 'Pendiente' 
                                            ? 'bg-slate-200 text-slate-700 shadow-md' 
                                            : 'text-slate-500 hover:bg-white'
                                        }`}
                                      >
                                        Pendiente
                                      </button>
                                    </div>
                                  </div>

                                  {/* Resolution reason */}
                                  {res.decision !== 'Pendiente' && (
                                    <div className="animate-in slide-in-from-top-2 duration-300 pt-2 border-t border-slate-100 mt-2">
                                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Justificación de la resolución (Opcional)</label>
                                      <textarea
                                        rows={3}
                                        value={res.razon}
                                        onChange={e => {
                                          setActaWizardData(prev => ({
                                            ...prev,
                                            solicitudesResoluciones: {
                                              ...prev.solicitudesResoluciones,
                                              [sol.id]: { ...res, razon: e.target.value }
                                            }
                                          }));
                                        }}
                                        placeholder="Escriba aquí los motivos técnicos o sociales..."
                                        className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-semibold resize-none shadow-sm"
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    {actaWizardStep === 'libre' && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 max-w-3xl mx-auto">
                        <div className="bg-slate-50/50 p-4 sm:p-8 rounded-3xl border border-slate-100/60 space-y-6 shadow-sm">
                          
                          {/* Premium Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/60 gap-4">
                            <h3 className="text-xl font-extrabold text-blue-900 tracking-tight flex items-center">
                              <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mr-3">
                                <Briefcase size={16}/>
                              </span>
                              Gestión de Puntos de Agenda
                            </h3>
                            <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase self-start sm:self-auto shadow-sm">
                              {(actaWizardData.puntosAgenda || []).length} Puntos Guardados
                            </span>
                          </div>

                          {/* Tabs Navigation */}
                          <div className="flex flex-nowrap overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-8 sm:px-8 border-b border-slate-100 scrollbar-none w-[calc(100%+2rem)] sm:w-auto gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedAgendaPointTab('new')}
                              className={`flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 border whitespace-nowrap shrink-0 ${
                                selectedAgendaPointTab === 'new'
                                  ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                                  : 'bg-white border-dashed border-amber-300 text-amber-600 hover:bg-amber-50/50'
                              }`}
                            >
                              <Plus size={14} />
                              <span>+ Nuevo Punto</span>
                            </button>

                            {(actaWizardData.puntosAgenda || []).map((point, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedAgendaPointTab(idx)}
                                className={`flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 border whitespace-nowrap shrink-0 ${
                                  selectedAgendaPointTab === idx
                                    ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${
                                  selectedAgendaPointTab === idx ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-655'
                                }`}>
                                  {idx + 1}
                                </span>
                                <div className="flex flex-col items-start text-left">
                                  <span className="max-w-[120px] truncate">
                                    {point.tema || `Punto ${idx + 1}`}
                                  </span>
                                  {point.socioSolicitante && (
                                    <span className={`text-[9px] font-bold ${
                                      selectedAgendaPointTab === idx ? 'text-amber-100' : 'text-slate-400'
                                    }`}>
                                      Socio: {point.socioSolicitante}
                                    </span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>

                          {/* Tab Contents */}
                          {selectedAgendaPointTab === 'new' ? (
                            /* Create Point Tab */
                            <div className="space-y-6 animate-in fade-in duration-300 text-left">
                              {/* Import from Agenda Proposal Dropdown */}
                              {agendaProposals.length > 0 && (
                                <div className="bg-amber-50/30 p-5 rounded-2xl border border-amber-100/50 space-y-3">
                                  <label className="block text-xs font-bold text-amber-900/80 uppercase tracking-wider">
                                    💡 ¿Desea discutir una propuesta de punto de agenda?
                                  </label>
                                  <select
                                    onChange={(e) => {
                                      const selectedId = e.target.value;
                                      if (!selectedId) return;
                                      const prop = agendaProposals.find(p => p.id === selectedId);
                                      if (prop) {
                                        setNewAgendaPoint({
                                          tema: prop.agendaNombrePunto || '',
                                          debate: '',
                                          acuerdo: '',
                                          socioSolicitante: prop.agendaSocioNombre || '',
                                          agendaContenido: prop.agendaContenido || ''
                                        });
                                      }
                                      // Reset value
                                      e.target.value = '';
                                    }}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none font-semibold text-slate-800 text-xs shadow-sm"
                                  >
                                    <option value="">Seleccione una propuesta registrada para debatirla...</option>
                                    {agendaProposals.map((prop) => (
                                      <option key={prop.id} value={prop.id}>
                                        {prop.agendaNombrePunto} (Solicitado por: {prop.agendaSocioNombre})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {newAgendaPoint.agendaContenido && (
                                <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100/60 space-y-2 animate-in fade-in duration-300">
                                  <div className="flex justify-between items-center text-[10px] font-black text-blue-900/60 uppercase tracking-widest">
                                    <span>Contenido de la Propuesta (Discusión)</span>
                                    {newAgendaPoint.socioSolicitante && (
                                      <span>Solicitado por: <span className="font-extrabold text-blue-955">{newAgendaPoint.socioSolicitante}</span></span>
                                    )}
                                  </div>
                                  <p className="text-slate-700 text-xs font-semibold leading-relaxed">
                                    {newAgendaPoint.agendaContenido}
                                  </p>
                                  <div className="flex justify-end pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setNewAgendaPoint(prev => ({ ...prev, socioSolicitante: '', agendaContenido: '' }))}
                                      className="text-xs font-bold text-red-500 hover:text-red-700 underline"
                                    >
                                      Remover propuesta importada
                                    </button>
                                  </div>
                                </div>
                              )}

                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tema del Punto</label>
                                <input 
                                  type="text"
                                  value={newAgendaPoint.tema}
                                  onChange={e => setNewAgendaPoint(prev => ({ ...prev, tema: e.target.value }))}
                                  placeholder="Ej. Aprobación del presupuesto para la jornada oftalmológica"
                                  className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-semibold shadow-sm"
                                />
                              </div>
                              
                              <div className="space-y-6">
                                <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Debate / Discusión (Opcional)</label>
                                  <textarea 
                                    ref={debateRef}
                                    rows={4}
                                    value={newAgendaPoint.debate}
                                    onChange={e => setNewAgendaPoint(prev => ({ ...prev, debate: e.target.value }))}
                                    placeholder="Describa los puntos clave discutidos..."
                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-semibold resize-none text-justify shadow-sm"
                                  />
                                  
                                  {/* Mention present quorum members */}
                                  <div className="mt-3 text-left">
                                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Etiquetar participantes presentes (insertar al cursor):</span>
                                    {presentSocios.length === 0 ? (
                                      <div className="text-[10px] font-bold text-slate-400 bg-slate-100/50 p-3 rounded-xl border border-dashed border-slate-200 italic">
                                        No hay socios marcados en el quórum aún. Registra asistencia en el paso anterior para poder etiquetar.
                                      </div>
                                    ) : (
                                      <div className="flex flex-wrap gap-2 max-h-[96px] overflow-y-auto p-1.5 bg-slate-50 rounded-2xl border border-slate-200/50 shadow-inner">
                                        {presentSocios.map(member => (
                                          <button
                                            key={member.id}
                                            type="button"
                                            onClick={() => handleInsertMemberMention(member.nombre)}
                                            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl text-xs font-bold text-slate-650 hover:text-amber-800 transition-all select-none cursor-pointer active:scale-95 shadow-sm"
                                          >
                                            <img 
                                              src={member.foto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&auto=format&fit=crop&q=60'} 
                                              alt={member.nombre} 
                                              className="w-5 h-5 rounded-full object-cover border border-slate-100 shadow-sm"
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&auto=format&fit=crop&q=60';
                                              }}
                                            />
                                            <span>
                                              {member.nombre.split(' ')[0]} {member.nombre.split(' ')[1] ? member.nombre.split(' ')[1][0] + '.' : ''}
                                            </span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Acuerdo / Resolución (Opcional)</label>
                                  <textarea 
                                    rows={4}
                                    value={newAgendaPoint.acuerdo}
                                    onChange={e => setNewAgendaPoint(prev => ({ ...prev, acuerdo: e.target.value }))}
                                    placeholder="Describa el acuerdo final tomado..."
                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-semibold resize-none text-justify shadow-sm"
                                  />
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={handleAddAgendaPoint}
                                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white font-black px-8 py-3.5 rounded-2xl text-sm transition-all shadow-md shadow-amber-500/20 flex items-center justify-center space-x-2 active:scale-95"
                              >
                                <Plus size={18} />
                                <span>Agregar a la Agenda</span>
                              </button>
                            </div>
                          ) : (
                            /* Edit Existing Point Tab */
                            <div className="space-y-6 animate-in fade-in duration-300 text-left">
                              <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 gap-4">
                                <div>
                                  <h4 className="text-sm font-black text-amber-800 uppercase tracking-wider">
                                    Editando Punto {selectedAgendaPointTab as number + 1}
                                  </h4>
                                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                                    Los cambios realizados aquí se guardan de forma instantánea.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAgendaPoint(selectedAgendaPointTab as number)}
                                  className="w-full sm:w-auto text-red-500 hover:bg-red-50 hover:text-red-650 px-4 py-2.5 rounded-xl transition-all text-xs font-black flex items-center justify-center space-x-1.5 active:scale-95 shadow-sm border border-red-200 bg-white"
                                  title="Eliminar este punto"
                                >
                                  <Trash2 size={14} />
                                  <span>Eliminar Punto</span>
                                </button>
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tema del Punto</label>
                                <input 
                                  type="text"
                                  value={(actaWizardData.puntosAgenda || [])[selectedAgendaPointTab as number]?.tema || ''}
                                  onChange={e => handleUpdateAgendaPoint(selectedAgendaPointTab as number, 'tema', e.target.value)}
                                  placeholder="Ej. Tema del punto..."
                                  className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-semibold shadow-sm"
                                />
                              </div>

                              {((actaWizardData.puntosAgenda || [])[selectedAgendaPointTab as number]?.agendaContenido || (actaWizardData.puntosAgenda || [])[selectedAgendaPointTab as number]?.socioSolicitante) && (
                                <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100/60 space-y-2 animate-in fade-in duration-300">
                                  <div className="flex justify-between items-center text-[10px] font-black text-blue-900/60 uppercase tracking-widest">
                                    <span>Contenido de la Propuesta (Discusión)</span>
                                    {(actaWizardData.puntosAgenda || [])[selectedAgendaPointTab as number]?.socioSolicitante && (
                                      <span>Solicitado por: <span className="font-extrabold text-blue-955">{(actaWizardData.puntosAgenda || [])[selectedAgendaPointTab as number]?.socioSolicitante}</span></span>
                                    )}
                                  </div>
                                  {(actaWizardData.puntosAgenda || [])[selectedAgendaPointTab as number]?.agendaContenido && (
                                    <p className="text-slate-700 text-xs font-semibold leading-relaxed">
                                      {(actaWizardData.puntosAgenda || [])[selectedAgendaPointTab as number]?.agendaContenido}
                                    </p>
                                  )}
                                  <div className="flex justify-end pt-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleUpdateAgendaPoint(selectedAgendaPointTab as number, 'agendaContenido', '');
                                        handleUpdateAgendaPoint(selectedAgendaPointTab as number, 'socioSolicitante', '');
                                      }}
                                      className="text-xs font-bold text-red-500 hover:text-red-700 underline"
                                    >
                                      Remover propuesta importada
                                    </button>
                                  </div>
                                </div>
                              )}

                              <div className="space-y-6">
                                <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Debate / Discusión</label>
                                  <textarea 
                                    ref={debateRef}
                                    rows={4}
                                    value={(actaWizardData.puntosAgenda || [])[selectedAgendaPointTab as number]?.debate || ''}
                                    onChange={e => handleUpdateAgendaPoint(selectedAgendaPointTab as number, 'debate', e.target.value)}
                                    placeholder="Describa los puntos clave discutidos..."
                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-semibold resize-none text-justify shadow-sm"
                                  />
                                  
                                  {/* Mention present quorum members */}
                                  <div className="mt-3 text-left">
                                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Etiquetar participantes presentes (insertar al cursor):</span>
                                    {presentSocios.length === 0 ? (
                                      <div className="text-[10px] font-bold text-slate-400 bg-slate-100/50 p-3 rounded-xl border border-dashed border-slate-200 italic">
                                        No hay socios marcados en el quórum aún. Registra asistencia en el paso anterior para poder etiquetar.
                                      </div>
                                    ) : (
                                      <div className="flex flex-wrap gap-2 max-h-[96px] overflow-y-auto p-1.5 bg-slate-50 rounded-2xl border border-slate-200/50 shadow-inner">
                                        {presentSocios.map(member => (
                                          <button
                                            key={member.id}
                                            type="button"
                                            onClick={() => handleInsertMemberMention(member.nombre)}
                                            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl text-xs font-bold text-slate-650 hover:text-amber-800 transition-all select-none cursor-pointer active:scale-95 shadow-sm"
                                          >
                                            <img 
                                              src={member.foto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&auto=format&fit=crop&q=60'} 
                                              alt={member.nombre} 
                                              className="w-5 h-5 rounded-full object-cover border border-slate-100 shadow-sm"
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&auto=format&fit=crop&q=60';
                                              }}
                                            />
                                            <span>
                                              {member.nombre.split(' ')[0]} {member.nombre.split(' ')[1] ? member.nombre.split(' ')[1][0] + '.' : ''}
                                            </span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Acuerdo / Resolución</label>
                                  <textarea 
                                    rows={4}
                                    value={(actaWizardData.puntosAgenda || [])[selectedAgendaPointTab as number]?.acuerdo || ''}
                                    onChange={e => handleUpdateAgendaPoint(selectedAgendaPointTab as number, 'acuerdo', e.target.value)}
                                    placeholder="Describa el acuerdo final tomado..."
                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm font-semibold resize-none text-justify shadow-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {actaWizardStep === 'vista_previa' && (
                      <div className="space-y-6 animate-in fade-in duration-350">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/50">
                          <div className="text-left">
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Modo de Previsualización</h4>
                            <p className="text-xs text-slate-500 font-medium">Visualice el acta en formato oficial impreso o en texto limpio.</p>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-2">
                            <div className="bg-slate-200/60 p-1 rounded-xl flex space-x-1">
                              <button
                                type="button"
                                onClick={() => setActaPreviewMode('documento')}
                                className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                                  actaPreviewMode === 'documento'
                                    ? 'bg-blue-900 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-350/50'
                                }`}
                              >
                                Vista Oficial
                              </button>
                              <button
                                type="button"
                                onClick={() => setActaPreviewMode('texto')}
                                className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                                  actaPreviewMode === 'texto'
                                    ? 'bg-blue-900 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-350/50'
                                }`}
                              >
                                Texto Plano
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const rawText = compileActaText(actaWizardData);
                                navigator.clipboard.writeText(rawText);
                                alert('¡Texto del acta copiado al portapapeles!');
                              }}
                              className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-blue-900 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                              title="Copiar texto plano"
                            >
                              <FileText size={18} />
                            </button>
                          </div>
                        </div>

                        {actaPreviewMode === 'documento' ? (
                          <div className="max-h-[50vh] sm:max-h-[60vh] overflow-y-auto bg-slate-100/60 p-2 sm:p-4 md:p-6 rounded-[2rem] border border-slate-200/50 shadow-inner">
                            <FormattedActa
                              titulo={actaWizardData.titulo.trim() || `Acta de Sesión - ${new Date().toLocaleDateString('es-GT')}`}
                              fecha={actaWizardData.fechaHoraText.split(',')[0] || new Date().toLocaleDateString('es-GT')}
                              categoria={actaWizardData.categoria}
                              autor={user.nombre}
                              contenido={compileActaText(actaWizardData)}
                              presidentName={presidentName}
                              secretaryName={secretaryName}
                              numeroActa={actaWizardData.numeroActa || '1'}
                              codigoRegistro={actaWizardData.codigoRegistro}
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                              <span className="text-[10px] font-black bg-yellow-50 text-yellow-750 px-2.5 py-1 rounded-lg uppercase tracking-wider border border-yellow-100 shadow-sm">Generado automáticamente</span>
                            </div>
                            <textarea 
                              readOnly
                              rows={15}
                              value={compileActaText(actaWizardData)}
                              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-semibold text-xs font-serif outline-none resize-none text-justify select-all shadow-inner leading-relaxed"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer / Navigation */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-between gap-3 sm:gap-4 flex-shrink-0 w-full">
                    <div className="flex flex-row w-full sm:w-auto gap-3">
                      <button
                        type="button"
                        onClick={() => setShowAddActa(false)}
                        className="flex-1 sm:flex-initial text-center bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 font-extrabold px-4 sm:px-6 py-2.5 rounded-xl transition-all text-xs sm:text-sm"
                      >
                        Cancelar
                      </button>
                      {actaWizardStep !== 'datos' && (
                        <button
                          type="button"
                          onClick={() => {
                            const steps: typeof actaWizardStep[] = ['datos', 'asistencia', 'protocolo', 'solicitudes', 'libre', 'vista_previa'];
                            const idx = steps.indexOf(actaWizardStep);
                            if (idx > 0) setActaWizardStep(steps[idx - 1]);
                          }}
                          className="flex-1 sm:flex-initial text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold px-4 sm:px-6 py-2.5 rounded-xl transition-all text-xs sm:text-sm"
                        >
                          Atrás
                        </button>
                      )}
                    </div>

                    <div className="w-full sm:w-auto">
                      {actaWizardStep !== 'vista_previa' ? (
                        <button
                          type="button"
                          onClick={() => {
                            const steps: typeof actaWizardStep[] = ['datos', 'asistencia', 'protocolo', 'solicitudes', 'libre', 'vista_previa'];
                            const idx = steps.indexOf(actaWizardStep);
                            if (idx < steps.length - 1) setActaWizardStep(steps[idx + 1]);
                          }}
                          className="w-full sm:w-auto text-center bg-blue-900 hover:bg-blue-800 text-white font-black px-4 sm:px-6 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg text-xs sm:text-sm"
                        >
                          Siguiente
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSaveStructuredActa}
                          className="w-full sm:w-auto text-center bg-emerald-500 hover:bg-emerald-600 text-white font-black px-4 sm:px-6 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg text-xs sm:text-sm"
                        >
                          Publicar Acta
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">Biblioteca y Redacción de Actas</h3>
                    <button 
                      onClick={handleOpenRedactarActa}
                      className="w-full md:w-auto justify-center bg-blue-900 hover:bg-blue-800 text-white font-black px-6 py-3 rounded-xl flex items-center space-x-2 shadow-lg shadow-blue-900/10 active:scale-95 transition-all"
                    >
                      <Plus size={18} />
                      <span>Redactar Acta</span>
                    </button>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-grow w-full">
                      <Search className="absolute left-4 top-3 text-slate-400" size={18} />
                      <input
                        type="text"
                        value={actaSearch}
                        onChange={e => setActaSearch(e.target.value)}
                        placeholder="Buscar por palabra clave..."
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm"
                      />
                    </div>
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <Filter size={18} className="text-slate-400 flex-shrink-0" />
                      <select 
                        value={actaFilterCategory} 
                        onChange={e => setActaFilterCategory(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-900 w-full sm:w-auto"
                      >
                        <option value="Todas">Todas las categorías</option>
                        <option value="Ordinaria">Ordinaria</option>
                        <option value="Extraordinaria">Extraordinaria</option>
                        <option value="Reunión de Comisión">Reunión de Comisión</option>
                      </select>
                    </div>
                  </div>

                  {/* List of Actas */}
                  <div className="grid gap-4">
                    {filteredActas.map(acta => (
                      <div key={acta.id} className="bg-white p-4 sm:p-6 md:p-9 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 hover:shadow-md transition-shadow w-full">
                        <div className="flex items-center space-x-4 min-w-0 w-full md:w-auto">
                          <div className="bg-yellow-50 text-yellow-605 p-3.5 rounded-2xl flex-shrink-0">
                            <FileText size={24} />
                          </div>
                          <div className="min-w-0 flex-grow w-full">
                            <h4 className="font-extrabold text-slate-800 text-base md:text-lg break-words leading-tight">{acta.titulo}</h4>
                            <p className="text-xs text-slate-450 mt-1.5">
                              Redactada por <span className="font-bold text-blue-900/60 uppercase">{acta.autor}</span> • {acta.fecha}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-row items-center justify-between md:justify-end gap-3 w-full md:w-auto pt-4 md:pt-0 border-t border-slate-100 md:border-t-0 flex-wrap">
                          <span className="text-[10px] font-black bg-slate-100 text-slate-650 px-3 py-1 rounded-full uppercase">
                            {acta.categoria || 'Ordinaria'}
                          </span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditActaClick(acta)}
                              className="p-2.5 text-slate-500 hover:text-blue-900 hover:bg-blue-50 rounded-xl transition-all border border-slate-150 bg-slate-50/50 active:scale-95"
                              title="Editar acta"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => generateActaPDF(acta)}
                              className="p-2.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all border border-slate-150 bg-slate-50/50 active:scale-95"
                              title="Descargar PDF"
                            >
                              <Download size={16} />
                            </button>
                            <button 
                              onClick={() => setDeleteActaConfirmId(acta.id)}
                              className="p-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-slate-150 bg-slate-50/50 active:scale-95"
                              title="Eliminar acta"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredActas.length === 0 && (
                      <div className="text-center py-12 text-slate-400 italic">No se encontraron actas con esos criterios de búsqueda.</div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

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
                      <button type="button" onClick={() => setShowAddDonacion(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} /></button>
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
                      <X size={20} />
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
          {activeTab === 'control_solicitudes' && (
            renderControlSolicitudesList()
          )}
        </main>
      </div>

      {/* --- UNIFIED MODAL FOR EDITING / REGISTERING SOCIO --- */}
      {editingSocio && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-6 sm:p-10 space-y-6 relative animate-in zoom-in-95 duration-300">
            <button 
              type="button"
              onClick={() => setEditingSocio(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-blue-900">
                {isNewSocio ? 'Registrar Nuevo Socio' : isSelfEdit ? 'Editar Mi Perfil' : 'Editar Ficha de Socio'}
              </h2>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                {isSelfEdit ? 'Actualizar mis datos personales de contacto' : 'Panel Administrativo de Control'}
              </p>
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
              {/* ── Photo, Código & Estatus ── */}
              <div className="flex flex-col sm:flex-row items-start gap-5 pb-6 border-b border-slate-100">
                {/* Photo */}
                <div className="relative group flex-shrink-0 mx-auto sm:mx-0">
                  <img 
                    src={editSocioForm.foto || `https://picsum.photos/seed/${editingSocio.id}/150/150`} 
                    alt="Avatar de socio" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-md"
                  />
                  <label 
                    htmlFor="socio-photo-upload"
                    className="absolute bottom-0 right-0 bg-yellow-500 text-blue-900 p-2 rounded-full border-2 border-white shadow-sm hover:bg-yellow-600 cursor-pointer flex items-center justify-center"
                    title="Cambiar foto de socio"
                  >
                    <Plus size={14} />
                    <input 
                      type="file" 
                      id="socio-photo-upload" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleEditSocioPhotoChange} 
                    />
                  </label>
                </div>

                <div className="flex-grow space-y-3 w-full">
                  {/* Código de Socio */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">
                      <Hash size={12} />
                      <span>Código de Socio</span>
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="CLQ-2026-001"
                        value={editSocioForm.codigoSocio || ''}
                        onChange={e => setEditSocioForm(prev => ({ ...prev, codigoSocio: e.target.value }))}
                        className="flex-1 px-4 py-2.5 border-2 border-blue-200 bg-blue-50 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-mono font-bold text-blue-900 text-sm tracking-widest"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Identificador único. Se muestra en la ficha del socio.</p>
                  </div>
                  {/* Estatus */}
                  <div>
                    <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      <span>Estatus Institucional *</span>
                    </label>
                    <select 
                      value={editSocioForm.estatus === 'Inactive' ? 'Inactive' : 'Active'}
                      onChange={e => setEditSocioForm(prev => ({ ...prev, estatus: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-semibold bg-white"
                    >
                      <option value="Active">Activo (Visible en Directorio)</option>
                      <option value="Inactive">Inactivo (Oculto en Directorio)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ── Sección: Datos Personales ── */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="h-px flex-1 bg-slate-100"></span>
                  <span>Datos Personales</span>
                  <span className="h-px flex-1 bg-slate-100"></span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre Completo *</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ej. Carlos Roberto Méndez"
                      value={editSocioForm.nombre || ''}
                      onChange={e => setEditSocioForm(prev => ({ ...prev, nombre: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Correo Electrónico *</label>
                    <input 
                      type="email"
                      required
                      placeholder="Ej. carlosmendez@gmail.com"
                      value={editSocioForm.correo || ''}
                      onChange={e => setEditSocioForm(prev => ({ ...prev, correo: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Teléfono</label>
                    <input 
                      type="text"
                      placeholder="Ej. +502 5555-5555"
                      value={editSocioForm.telefono || ''}
                      onChange={e => setEditSocioForm(prev => ({ ...prev, telefono: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">DPI / Identificación</label>
                    <input 
                      type="text"
                      placeholder="Ej. 2352 12345 0101"
                      value={editSocioForm.dpi || ''}
                      onChange={e => setEditSocioForm(prev => ({ ...prev, dpi: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha de Nacimiento</label>
                    <input 
                      type="date"
                      value={editSocioForm.fechaNacimiento || ''}
                      onChange={e => setEditSocioForm(prev => ({ ...prev, fechaNacimiento: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Profesión / Ocupación</label>
                    <input 
                      type="text"
                      placeholder="Ej. Ingeniero Civil"
                      value={editSocioForm.profesion || ''}
                      onChange={e => setEditSocioForm(prev => ({ ...prev, profesion: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dirección de Residencia</label>
                    <input 
                      type="text"
                      placeholder="Ej. 12 Av. 10-55, Zona 1, Quetzaltenango"
                      value={editSocioForm.direccion || ''}
                      onChange={e => setEditSocioForm(prev => ({ ...prev, direccion: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* ── Sección: Cargo Institucional ── */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="h-px flex-1 bg-slate-100"></span>
                  <span>Cargo Institucional</span>
                  <span className="h-px flex-1 bg-slate-100"></span>
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        <span>Puesto Principal *</span>
                      </label>
                      <select 
                        value={editSocioForm.puesto || 'Socio Regular'}
                        onChange={e => setEditSocioForm(prev => ({ ...prev, puesto: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none text-sm font-semibold bg-white"
                      >
                        {PUESTOS_PREDEFINIDOS.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        <span>Rol del Sistema (Permisos) *</span>
                      </label>
                      <select 
                        value={editSocioForm.rol || UserRole.SOCIO}
                        onChange={e => setEditSocioForm(prev => ({ ...prev, rol: e.target.value as UserRole }))}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none text-sm font-semibold bg-white"
                      >
                        {ROLES_LIST.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Club de Leones</label>
                      <input 
                        type="text"
                        value={editSocioForm.club || 'QUETZALTENANGO'}
                        onChange={e => setEditSocioForm(prev => ({ ...prev, club: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha de Ingreso</label>
                      <input 
                        type="date"
                        value={editSocioForm.fechaIngreso || ''}
                        onChange={e => setEditSocioForm(prev => ({ ...prev, fechaIngreso: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Puestos Adicionales */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <label className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider mb-3">
                      <Briefcase size={12} />
                      <span>Funciones / Cargos Adicionales</span>
                      <span className="ml-auto text-[10px] font-normal text-amber-600">Ejemplo: doble función</span>
                    </label>
                    <div className="space-y-2 mb-3">
                      {(editSocioForm.puestosAdicionales || []).map((pa, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-amber-200">
                          <span className="flex-1 text-sm font-semibold text-slate-700">{pa}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (editSocioForm.puestosAdicionales || []).filter((_, idx) => idx !== i);
                              setEditSocioForm(prev => ({ ...prev, puestosAdicionales: updated }));
                            }}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar cargo"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      {(editSocioForm.puestosAdicionales || []).length === 0 && (
                        <p className="text-xs text-amber-600 italic">Sin cargos adicionales asignados.</p>
                      )}
                    </div>
                    {/* Agregar nuevo puesto adicional */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        id="nuevo-puesto-adicional"
                        className="w-full sm:flex-1 min-w-0 px-3 py-2.5 border border-amber-300 rounded-xl text-sm font-semibold bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                        defaultValue=""
                      >
                        <option value="" disabled>Seleccionar cargo adicional...</option>
                        {PUESTOS_PREDEFINIDOS.map(p => (
                          <option key={p} value={p}>{p}</option>
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
                        className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
                      >
                        <Plus size={14} />
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Sección: Estado Financiero ── */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="h-px flex-1 bg-slate-100"></span>
                  <span>Estado Financiero</span>
                  <span className="h-px flex-1 bg-slate-100"></span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div>
                    <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      <span>Estado de Solvencia de Cuota *</span>
                    </label>
                    <select 
                      value={editSocioForm.estadoCuotas || 'Al día'}
                      onChange={e => setEditSocioForm(prev => ({ ...prev, estadoCuotas: e.target.value as any }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none text-sm font-semibold bg-white"
                    >
                      <option value="Al día">Al día</option>
                      <option value="Pendiente">Pendiente</option>
                      <option value="En mora">En mora</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      <span>Monto Pendiente (Q) *</span>
                    </label>
                    <input 
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={editSocioForm.montoPendiente === undefined ? 0 : editSocioForm.montoPendiente}
                      onChange={e => setEditSocioForm(prev => ({ ...prev, montoPendiente: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800"
                    />
                  </div>
                </div>
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
              <X size={20} />
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
              <X size={20} />
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
              <X size={24} />
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
