import { safeSetItem } from '../utils/storage';
import React, { useState, useEffect, useMemo } from 'react';
import { Socio, UserRole, Solicitud, Responsable } from '../types';
import { firebaseService } from '../services/firebaseService';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../components/ConfirmProvider';
import { useClubData } from '../context/ClubDataContext';
import { validateImageFile, compressPngSignature } from '../utils/imageCompressor';
import { 
  Plus, 
  Trash2, 
  CheckCircle, 
  X, 
  Lock, 
  Phone, 
  Calendar, 
  User, 
  FileText, 
  AlertCircle, 
  ChevronDown, 
  UserPlus, 
  Tag, 
  Check, 
  Clock, 
  XOctagon,
  Users,
  Accessibility,
  Heart,
  RefreshCw,
  Mail,
  Copy,
  Home,
  Shield,
  Building,
  DollarSign,
  AlertTriangle,
  Layers,
  Save,
  Upload,
  Archive,
  Share2,
  Car,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Info,
  ShieldCheck,
  CheckSquare,
  Square,
  CreditCard,
  ExternalLink
} from 'lucide-react';
import { recurrenteService, RecurrenteItem } from '../services/recurrenteService';
import { generateCartaOficialPDF, formatFechaCarta } from '../utils/pdfGenerator';
import { formatDisplayDate } from '../utils/dateSpanishFormatter';


interface SolicitudesProps {
  user: Socio | null;
}

const TEMAS_SOLICITUD = [
  'Diabetes',
  'Visión',
  'Mitigación del Hambre',
  'Cáncer Infantil',
  'Medio Ambiente',
  'Alivio del Desastre',
  'Apoyo a la Juventud',
  'Causas Humanitarias',
  'Otra'
];

const TEMA_COLORS: { [key: string]: string } = {
  'Diabetes': 'bg-blue-50 text-blue-700 border-blue-200',
  'Visión': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Mitigación del Hambre': 'bg-amber-50 text-amber-700 border-amber-200',
  'Cáncer Infantil': 'bg-rose-50 text-rose-700 border-rose-200',
  'Medio Ambiente': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Alivio del Desastre': 'bg-red-50 text-red-700 border-red-200',
  'Apoyo a la Juventud': 'bg-purple-50 text-purple-700 border-purple-200',
  'Causas Humanitarias': 'bg-teal-50 text-teal-700 border-teal-200',
  'Otra': 'bg-slate-100 text-slate-700 border-slate-300'
};

const TEMA_COLOR_MAP: { [key: string]: 'blue' | 'emerald' | 'purple' | 'amber' | 'indigo' | 'orange' } = {
  abiertas: 'emerald',
  sillas: 'blue',
  salon: 'amber',
  internas: 'purple',
  cartas: 'orange',
  agenda: 'indigo'
};

const BORDER_CLASSES = {
  blue: 'border-blue-500/40 ring-1 ring-blue-500/10',
  emerald: 'border-emerald-500/40 ring-1 ring-emerald-500/10',
  purple: 'border-purple-500/40 ring-1 ring-purple-500/10',
  amber: 'border-amber-500/40 ring-1 ring-amber-500/10',
  indigo: 'border-indigo-500/40 ring-1 ring-indigo-500/10',
  orange: 'border-orange-500/40 ring-1 ring-orange-500/10'
};

const HEADER_EXPANDED_CLASSES = {
  blue: 'bg-blue-600 text-white',
  emerald: 'bg-emerald-600 text-white',
  purple: 'bg-purple-600 text-white',
  amber: 'bg-amber-500 text-white',
  indigo: 'bg-indigo-600 text-white',
  orange: 'bg-orange-500 text-white'
};

const ICON_EXPANDED_CLASSES = {
  blue: 'bg-white/20 text-white',
  emerald: 'bg-white/20 text-white',
  purple: 'bg-white/20 text-white',
  amber: 'bg-white/20 text-white',
  indigo: 'bg-white/20 text-white',
  orange: 'bg-white/20 text-white'
};

const ICON_COLLAPSED_CLASSES = {
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  purple: 'bg-purple-50 text-purple-600',
  amber: 'bg-amber-50 text-amber-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  orange: 'bg-orange-50 text-orange-600'
};

const BUTTON_CLASSES = {
  blue: 'bg-blue-600 hover:bg-blue-700 text-white',
  emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  purple: 'bg-purple-600 hover:bg-purple-700 text-white',
  amber: 'bg-amber-500 hover:bg-amber-600 text-white',
  indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  orange: 'bg-orange-500 hover:bg-orange-600 text-white'
};

const STEPPER_LINE_CLASSES = {
  blue: 'bg-blue-600',
  emerald: 'bg-emerald-600',
  purple: 'bg-purple-600',
  amber: 'bg-amber-500',
  indigo: 'bg-indigo-600',
  orange: 'bg-orange-500'
};

const STEPPER_CIRCLE_ACTIVE = {
  blue: 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-600/10',
  emerald: 'bg-emerald-600 border-emerald-600 text-white ring-4 ring-emerald-600/10',
  purple: 'bg-purple-600 border-purple-600 text-white ring-4 ring-purple-600/10',
  amber: 'bg-amber-50 border-amber-500 text-white ring-4 ring-amber-500/10',
  indigo: 'bg-indigo-600 border-indigo-600 text-white ring-4 ring-indigo-600/10',
  orange: 'bg-orange-50 border-orange-500 text-white ring-4 ring-orange-500/10'
};

const STEPPER_CIRCLE_COMPLETED = {
  blue: 'bg-blue-50 border-blue-600 text-blue-600',
  emerald: 'bg-emerald-50 border-emerald-600 text-emerald-600',
  purple: 'bg-purple-50 border-purple-600 text-purple-600',
  amber: 'bg-amber-50 border-amber-500 text-amber-550',
  indigo: 'bg-indigo-50 border-indigo-600 text-indigo-600',
  orange: 'bg-orange-50 border-orange-500 text-orange-500'
};

const STEPPER_TEXT_ACTIVE = {
  blue: 'text-blue-600',
  emerald: 'text-emerald-600',
  purple: 'text-purple-600',
  amber: 'text-amber-500',
  indigo: 'text-indigo-600',
  orange: 'text-orange-500'
};

const THEME_ACCENTS: {
  [key: string]: {
    border: string;
    borderHover: string;
    bg: string;
    text: string;
    textDark: string;
    badge: string;
  }
} = {
  blue: {
    border: 'border-blue-200',
    borderHover: 'hover:border-blue-300',
    bg: 'bg-blue-50/50',
    text: 'text-blue-600',
    textDark: 'text-blue-900',
    badge: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  emerald: {
    border: 'border-emerald-200',
    borderHover: 'hover:border-emerald-300',
    bg: 'bg-emerald-50/50',
    text: 'text-emerald-600',
    textDark: 'text-emerald-900',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  purple: {
    border: 'border-purple-200',
    borderHover: 'hover:border-purple-300',
    bg: 'bg-purple-50/50',
    text: 'text-purple-600',
    textDark: 'text-purple-900',
    badge: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  amber: {
    border: 'border-amber-200',
    borderHover: 'hover:border-amber-300',
    bg: 'bg-amber-50/50',
    text: 'text-amber-600',
    textDark: 'text-amber-900',
    badge: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  indigo: {
    border: 'border-indigo-200',
    borderHover: 'hover:border-indigo-300',
    bg: 'bg-indigo-50/50',
    text: 'text-indigo-600',
    textDark: 'text-indigo-900',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  orange: {
    border: 'border-orange-200',
    borderHover: 'hover:border-orange-300',
    bg: 'bg-orange-50/50',
    text: 'text-orange-600',
    textDark: 'text-orange-950',
    badge: 'bg-orange-50 text-orange-700 border-orange-200'
  }
};

const generateShortTrackingCode = (existingIds: string[]): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const existingLower = existingIds.map(id => id.toLowerCase().trim());
  
  let code = '';
  let attempts = 0;
  
  do {
    let randomLetters = '';
    for (let i = 0; i < 3; i++) {
      randomLetters += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    let randomDigits = '';
    const usedIndices = new Set<number>();
    while (randomDigits.length < 3) {
      const idx = Math.floor(Math.random() * 10);
      if (!usedIndices.has(idx)) {
        usedIndices.add(idx);
        randomDigits += idx.toString();
      }
    }
    
    code = `${randomLetters}-${randomDigits}`;
    attempts++;
  } while (existingLower.includes(code.toLowerCase().trim()) && attempts < 1000);
  
  return code;
};

const Solicitudes: React.FC<SolicitudesProps> = ({ user }) => {
  const { showAlert, showConfirm } = useModal();
  const alert = (msg: string) => {
    showAlert("Notificación", msg);
  };
  const { confirm, prompt } = useConfirm();
  const { showToast } = useToast();

  const { solicitudes: dbSolicitudes, socios, loading, rolesConfig } = useClubData();
  const [activeTab, setActiveTab] = useState<'abiertas' | 'sillas' | 'internas' | 'agenda' | 'cartas' | 'salon' | 'archivo' | null>(null);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(dbSolicitudes);
  const [isLoading, setIsLoading] = useState(true);

  const [createdSolicitudId, setCreatedSolicitudId] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [searchedSolicitud, setSearchedSolicitud] = useState<Solicitud | null>(null);
  const [trackingError, setTrackingError] = useState('');

  // Document Attachment State (PDF or Image)
  const [docDataUrl, setDocDataUrl] = useState('');
  const [docFileName, setDocFileName] = useState('');

  useEffect(() => {
    setTrackingCode('');
    setSearchedSolicitud(null);
    setTrackingError('');
    setCreatedSolicitudId('');
  }, [activeTab]);

  useEffect(() => {
    setSolicitudes(dbSolicitudes);
  }, [dbSolicitudes]);

  useEffect(() => {
    setIsLoading(loading.solicitudes);
  }, [loading.solicitudes]);

  // Auto-open agenda or salon tab/modal if accessed via URL parameters
  useEffect(() => {
    try {
      const fullUrl = window.location.href;
      if (fullUrl.includes('tab=agenda')) {
        setActiveTab('agenda');
        if (fullUrl.includes('proponer=true') || fullUrl.includes('openModal=true') || fullUrl.includes('modal=open')) {
          setIsModalOpen(true);
        }
      } else if (fullUrl.includes('tab=salon')) {
        setActiveTab('salon');
        setIsModalOpen(true);
        const matchDia = fullUrl.match(/dia=([0-9]{4}-[0-9]{2}-[0-9]{2})/);
        if (matchDia && matchDia[1]) {
          setSalonDia(matchDia[1]);
        }
      }
    } catch (e) {
      console.error("Error checking URL parameters for tab:", e);
    }
  }, []);

  const handleCopyPublicAgendaLink = async () => {
    const baseUrl = `${window.location.origin}${window.location.pathname}#/solicitudes?tab=agenda&proponer=true`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(baseUrl).catch(() => {}).then(() => {
        showToast("Enlace público copiado al portapapeles. ¡Compártelo para proponer puntos de agenda!", "success");
      }).catch(async () => {
        await prompt({ title: "Enlace público de agenda", message: "No se pudo copiar al portapapeles. Copia el enlace manualmente:", defaultValue: baseUrl, okLabel: "Listo" });
      });
    } else {
      await prompt({ title: "Enlace público de agenda", message: "Copia el enlace para proponer un punto de agenda:", defaultValue: baseUrl, okLabel: "Listo" });
    }
  };

  const handleCopyPublicSalonLink = async () => {
    const baseUrl = `${window.location.origin}${window.location.pathname}#/solicitudes?tab=salon`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(baseUrl).catch(() => {}).then(() => {
        showToast("Enlace directo copiado al portapapeles. ¡Compártelo para reservaciones de salón y parqueo!", "success");
      }).catch(async () => {
        await prompt({ title: "Enlace de reservación de salón", message: "No se pudo copiar al portapapeles. Copia el enlace manualmente:", defaultValue: baseUrl, okLabel: "Listo" });
      });
    } else {
      await prompt({ title: "Enlace de reservación de salón", message: "Copia el enlace para compartir el formulario de alquiler:", defaultValue: baseUrl, okLabel: "Listo" });
    }
  };

  // Count calculations
  const counts = useMemo(() => {
    return {
      abiertas: solicitudes.filter(s => s.tipo === 'abiertas' && !s.archivada).length,
      abiertasPendientes: solicitudes.filter(s => s.tipo === 'abiertas' && s.estado === 'Pendiente' && !s.archivada).length,
      internas: solicitudes.filter(s => s.tipo === 'internas' && !s.archivada).length,
      internasPendientes: solicitudes.filter(s => s.tipo === 'internas' && s.estado === 'Pendiente' && !s.archivada).length,
      sillas: solicitudes.filter(s => s.tipo === 'sillas' && !s.archivada).length,
      sillasPendientes: solicitudes.filter(s => s.tipo === 'sillas' && s.estado === 'Pendiente' && !s.archivada).length,
      agenda: solicitudes.filter(s => s.tipo === 'agenda' && !s.archivada).length,
      agendaPendientes: solicitudes.filter(s => s.tipo === 'agenda' && s.estado === 'Pendiente' && !s.archivada).length,
      salon: solicitudes.filter(s => s.tipo === 'salon' && !s.archivada).length,
      salonPendientes: solicitudes.filter(s => s.tipo === 'salon' && s.estado === 'Pendiente' && !s.archivada).length,
      archivadas: solicitudes.filter(s => s.archivada === true).length
    };
  }, [solicitudes]);

  // Form State para Alquiler de Salón y Parqueo (Wizard)
  const [salonWizardStep, setSalonWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [salonNombreSolicitante, setSalonNombreSolicitante] = useState('');
  const [salonNombreActividad, setSalonNombreActividad] = useState('');
  const [salonInstitucion, setSalonInstitucion] = useState('');
  const [salonTelefonoDigitos, setSalonTelefonoDigitos] = useState('');
  const [salonEmail, setSalonEmail] = useState('');
  const [salonDia, setSalonDia] = useState('');
  const [salonHoraInicio, setSalonHoraInicio] = useState('');
  const [salonHoraFin, setSalonHoraFin] = useState('');
  const [salonTipoAlquiler, setSalonTipoAlquiler] = useState<'salon' | 'parqueo' | 'parqueo_plazas' | 'salon_plazas' | 'ambos'>('salon');
  const [salonPlazasParqueo, setSalonPlazasParqueo] = useState<number>(10);
  const [salonDuracion, setSalonDuracion] = useState<'4_horas' | '8_horas'>('4_horas');
  const [salonAsistentes, setSalonAsistentes] = useState('');
  const [salonCompromisoLimpieza, setSalonCompromisoLimpieza] = useState<'dejar_limpio' | 'pagar_limpieza'>('dejar_limpio');
  const [salonExoneracion, setSalonExoneracion] = useState(false);
  const [salonMotivoExoneracion, setSalonMotivoExoneracion] = useState('');
  const [salonRequisitosAceptados, setSalonRequisitosAceptados] = useState(false);

  // Edit Salon Request States
  const [editingSalonSolicitud, setEditingSalonSolicitud] = useState<Solicitud | null>(null);
  const [editSalonDia, setEditSalonDia] = useState('');
  const [editSalonNombreActividad, setEditSalonNombreActividad] = useState('');
  const [editSalonHoraInicio, setEditSalonHoraInicio] = useState('09:00');
  const [editSalonHoraFin, setEditSalonHoraFin] = useState('13:00');
  const [editSalonCompromisoLimpieza, setEditSalonCompromisoLimpieza] = useState<'dejar_limpio' | 'pagar_limpieza'>('dejar_limpio');
  const [editSalonAsistentes, setEditSalonAsistentes] = useState('30');
  const [isEditSalonModalOpen, setIsEditSalonModalOpen] = useState(false);
  const [isUpdatingSalon, setIsUpdatingSalon] = useState(false);

  // Tab View Mode (embedded in accordion: 'form' | 'list' | 'tracking')
  const [tabViewMode, setTabViewMode] = useState<{ [key: string]: 'form' | 'list' | 'tracking' }>({});

  const getTabMode = (tabId: string): 'form' | 'list' | 'tracking' => {
    return tabViewMode[tabId] || 'form';
  };

  const setTabMode = (tabId: string, mode: 'form' | 'list' | 'tracking') => {
    setTabViewMode(prev => ({ ...prev, [tabId]: mode }));
  };

  // Form fields start empty by default

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  useEffect(() => {
    if (isModalOpen) {
      setCreatedSolicitudId('');
      setSaveSuccess(false);
      setSaveError(null);
      setDocDataUrl('');
      setDocFileName('');
      setSalonWizardStep(1);
    }
  }, [isModalOpen]);

  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("El archivo excede el tamaño máximo permitido de 10MB.");
      return;
    }

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    if (!isImage && !isPdf) {
      alert("Únicamente se permiten archivos de imagen (PNG, JPG) o PDF.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setDocDataUrl(result);
      setDocFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleToggleArchive = async (id: string, newArchivedState: boolean) => {
    try {
      const sol = solicitudes.find(s => s.id === id);
      if (!sol) return;
      const updated: Solicitud = { ...sol, archivada: newArchivedState };
      await firebaseService.saveSolicitud(updated);
      const updatedList = solicitudes.map(s => s.id === id ? updated : s);
      setSolicitudes(updatedList);
      safeSetItem('club_leones_solicitudes', JSON.stringify(updatedList));
      alert(newArchivedState ? "Solicitud movida al Archivo con éxito." : "Solicitud restaurada a la lista activa.");
    } catch (err) {
      console.error("Error toggling archive status:", err);
      alert("Ocurrió un error al actualizar el estado de la solicitud.");
    }
  };
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tema, setTema] = useState(TEMAS_SOLICITUD[0]);
  const [otroTemaDescripcion, setOtroTemaDescripcion] = useState('');
  const [responsables, setResponsables] = useState<Responsable[]>([{ nombre: '', telefono: '' }]);

  // Form State específicos de Sillas de Ruedas
  const [nombreSolicitante, setNombreSolicitante] = useState('');
  const [dpiSolicitante, setDpiSolicitante] = useState('');
  const [telefonoSolicitante, setTelefonoSolicitante] = useState('');
  const [nombreBeneficiario, setNombreBeneficiario] = useState('');
  const [edadBeneficiario, setEdadBeneficiario] = useState('');
  const [tiempoUso, setTiempoUso] = useState('');
  
  // Cartas Oficiales Form States
  const [cartaFecha, setCartaFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [cartaInstitucion, setCartaInstitucion] = useState('');
  const [cartaDestinatario, setCartaDestinatario] = useState('');
  const [cartaCargo, setCartaCargo] = useState('');
  const [cartaSaludo, setCartaSaludo] = useState('Estimados señores:');
  const [cartaAsunto, setCartaAsunto] = useState('');
  const [cartaCuerpo, setCartaCuerpo] = useState('');
  const [firmanteSelector, setFirmanteSelector] = useState<'presidente' | 'secretario' | 'personalizado'>('presidente');
  const [cartaFirmaNombre, setCartaFirmaNombre] = useState('Edwin Ernesto Pacheco López');
  const [cartaFirmaPuesto, setCartaFirmaPuesto] = useState('Presidente del Club');
  const [cartaFirmaImg, setCartaFirmaImg] = useState<string | null>(null);

  // Drafts states and handlers
  const [drafts, setDrafts] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('club_leones_carta_drafts');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const handleSaveDraft = () => {
    if (!cartaDestinatario.trim() && !cartaAsunto.trim()) {
      alert("Por favor, ingrese al menos un destinatario o asunto para identificar el borrador.");
      return;
    }
    const newDraft = {
      id: `draft-${Date.now()}`,
      fecha: cartaFecha,
      institucion: cartaInstitucion,
      destinatario: cartaDestinatario,
      cargo: cartaCargo,
      saludo: cartaSaludo,
      asunto: cartaAsunto,
      cuerpo: cartaCuerpo,
      firmanteSelector,
      firmaNombre: cartaFirmaNombre,
      firmaPuesto: cartaFirmaPuesto,
      firmaImg: cartaFirmaImg
    };
    const updated = [newDraft, ...drafts];
    setDrafts(updated);
    safeSetItem('club_leones_carta_drafts', JSON.stringify(updated));
    alert("Borrador guardado exitosamente.");
  };

  const loadDraft = (d: any) => {
    setCartaFecha(d.fecha);
    setCartaInstitucion(d.institucion);
    setCartaDestinatario(d.destinatario);
    setCartaCargo(d.cargo);
    setCartaSaludo(d.saludo);
    setCartaAsunto(d.asunto);
    setCartaCuerpo(d.cuerpo);
    setFirmanteSelector(d.firmanteSelector);
    setCartaFirmaNombre(d.firmaNombre);
    setCartaFirmaPuesto(d.firmaPuesto);
    setCartaFirmaImg(d.firmaImg);
    alert("Borrador cargado.");
  };

  const deleteDraft = async (id: string) => {
    const ok = await confirm({ title: "Eliminar borrador", message: "¿Está seguro de eliminar este borrador?", confirmLabel: "Eliminar", danger: true });
    if (!ok) return;
    const updated = drafts.filter(d => d.id !== id);
    setDrafts(updated);
    safeSetItem('club_leones_carta_drafts', JSON.stringify(updated));
  };

  // Helper to split document text into letter-sized pages
  const getSimulatedPages = () => {
    // US Letter limit is 254 mm
    let page1Remaining = 254 - 42 - 10 - 20 - 8;
    if (cartaCargo) page1Remaining -= 5.5;
    if (cartaInstitucion) page1Remaining -= 5.5;
    if (cartaAsunto) {
      const lines = Math.ceil((cartaAsunto.length + 8) / 75);
      page1Remaining -= (4 + (lines * 5.5));
    }
    
    const page2Limit = 228;
    const page1Elements: any[] = [];
    const page2Elements: any[] = [];
    let currentY = 0;
    let isPage2 = false;

    const rawLines = cartaCuerpo.split('\n');
    rawLines.forEach((line) => {
      const trimmed = line.trim();
      let elemH = 0;
      if (trimmed === '') {
        elemH = 4;
      } else {
        const charsPerLine = 85;
        const linesCount = Math.max(1, Math.ceil(trimmed.length / charsPerLine));
        elemH = (linesCount * 5.8) + 2;
      }

      if (!isPage2) {
        if (currentY + elemH > page1Remaining) {
          isPage2 = true;
          currentY = 0;
          page2Elements.push({ type: 'paragraph', text: trimmed });
          currentY += elemH;
        } else {
          page1Elements.push({ type: 'paragraph', text: trimmed });
          currentY += elemH;
        }
      } else {
        page2Elements.push({ type: 'paragraph', text: trimmed });
        currentY += elemH;
      }
    });

    const sigH = 40;
    if (!isPage2) {
      if (currentY + sigH > page1Remaining) {
        isPage2 = true;
        page2Elements.push({ type: 'signature' });
      } else {
        page1Elements.push({ type: 'signature' });
      }
    } else {
      page2Elements.push({ type: 'signature' });
    }

    return { page1Elements, page2Elements, hasPage2: isPage2 };
  };

  // Form State para Puntos de Agenda
  const [agendaSocioNombre, setAgendaSocioNombre] = useState('');
  const [agendaNombrePunto, setAgendaNombrePunto] = useState('');
  const [agendaContenido, setAgendaContenido] = useState('');

  // Set default socio name for agenda when user changes
  useEffect(() => {
    if (user) {
      setAgendaSocioNombre(user.nombre);
    }
  }, [user]);

  const handleFirmaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateImageFile(file, 5 * 1024 * 1024); // Support uploading files up to 5MB, then compress
      if (!validation.valid) {
        alert(validation.error || "Firma inválida");
        return;
      }
      try {
        const compressedBase64 = await compressPngSignature(file);
        setCartaFirmaImg(compressedBase64);
      } catch (err) {
        console.error("Error compressing signature image:", err);
        alert("Ocurrió un error al procesar la firma.");
      }
    }
  };

  const handleClearFirma = () => {
    setCartaFirmaImg(null);
  };


  // Dynamic names lookup for signatures using context data
  useEffect(() => {
    try {
      const president = socios.find((s: any) => s.puesto?.toLowerCase().includes('presidente del club') || s.puesto?.toLowerCase() === 'presidente') || socios.find((s: any) => s.puesto?.toLowerCase().includes('presidente'));
      const secretary = socios.find((s: any) => s.puesto?.toLowerCase().includes('secretario del club') || s.puesto?.toLowerCase() === 'secretario') || socios.find((s: any) => s.puesto?.toLowerCase().includes('secretario'));
      
      if (firmanteSelector === 'presidente' && president) {
        setCartaFirmaNombre(president.nombre);
        setCartaFirmaPuesto(president.puesto || 'Presidente del Club');
      } else if (firmanteSelector === 'secretario' && secretary) {
        setCartaFirmaNombre(secretary.nombre);
        setCartaFirmaPuesto(secretary.puesto || 'Secretario del Club');
      }
    } catch (e) {
      console.error("Error loading signature names:", e);
    }
  }, [firmanteSelector, socios]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isRedirectingPayment, setIsRedirectingPayment] = useState(false);
  const [createdSolicitudCheckoutUrl, setCreatedSolicitudCheckoutUrl] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Escuchar retornos de pasarela de pago Recurrente GT
  useEffect(() => {
    try {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      const params = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : search);
      const pagoSalon = params.get('pago_salon');
      const solId = params.get('id');

      if (pagoSalon === 'exitoso') {
        alert(`🎉 ¡Pago en línea recibido exitosamente! Tu reservación ${solId ? '#' + solId : ''} ha sido registrada.`);
        if (window.history.replaceState) {
          const cleanUrl = window.location.pathname + window.location.hash.split('?')[0];
          window.history.replaceState({}, document.title, cleanUrl);
        }
      } else if (pagoSalon === 'cancelado') {
        alert('ℹ️ La pasarela de pago Recurrente GT fue cancelada. Tu solicitud de reservación quedó registrada como pendiente de pago.');
        if (window.history.replaceState) {
          const cleanUrl = window.location.pathname + window.location.hash.split('?')[0];
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }
    } catch (e) {
      console.error("Error analizando parámetros de retorno:", e);
    }
  }, []);

  // Check if logged in user is admin
  const isAdministrative = useMemo(() => {
    if (!user) return false;
    const config = rolesConfig.find(r => r.id === user.rol);
    if (config) {
      return config.allowedTabs && config.allowedTabs.length > 0;
    }
    return (
      user.rol === UserRole.SUPER_ADMIN ||
      user.rol === UserRole.TESORERO ||
      user.rol === UserRole.SECRETARIO ||
      user.rol === UserRole.ASESOR_SERVICIOS ||
      user.rol === UserRole.PRESIDENTE_AFILIACION
    );
  }, [user, rolesConfig]);

  // Check if user is allowed to access internal requests (any logged-in user EXCEPT Donor)
  const hasInternalAccess = useMemo(() => {
    if (!user) return false;
    return user.rol !== UserRole.DONANTE;
  }, [user]);

  // Check if user is a logged-in socio (not guest, not donor, and user exists)
  const isSocio = useMemo(() => {
    if (!user) return false;
    return user.rol !== UserRole.DONANTE && user.rol !== UserRole.GUEST;
  }, [user]);

  const salonCostoTotal = useMemo(() => {
    const cleaning = salonCompromisoLimpieza === 'pagar_limpieza' ? 300 : 0;
    let base = 0;
    const salonPrecioBase = salonDuracion === '4_horas' ? 700 : 1200;

    if (salonTipoAlquiler === 'salon') {
      // Exoneración aplica al 100% en salón de eventos y capacitaciones
      base = (salonExoneracion || isSocio) ? 0 : salonPrecioBase;
    } else if (salonTipoAlquiler === 'salon_plazas') {
      // Salón + Parqueo por plazas: salón exonerable/socio, plazas a Q50 sin exoneración
      const salonPart = (salonExoneracion || isSocio) ? 0 : salonPrecioBase;
      const plazasPart = (salonPlazasParqueo || 1) * 50;
      base = salonPart + plazasPart;
    } else if (salonTipoAlquiler === 'parqueo') {
      // Parqueo completo: Q1,500 todo el día (no cuenta con exoneración)
      base = 1500;
    } else if (salonTipoAlquiler === 'parqueo_plazas') {
      // Parqueo por plazas: Q50 por plaza por día (no cuenta con exoneración)
      base = (salonPlazasParqueo || 1) * 50;
    } else if (salonTipoAlquiler === 'ambos') {
      // Salón y Parqueo Completo: 4h Q2000 / 8h Q2500. Si aplica exoneración de salón, el parqueo queda en Q1500
      if (salonExoneracion || isSocio) {
        base = 1500; // Se exonera el salón pero se cobra el parqueo completo
      } else {
        base = salonDuracion === '4_horas' ? 2000 : 2500;
      }
    }

    return base + cleaning;
  }, [salonTipoAlquiler, salonDuracion, salonPlazasParqueo, salonCompromisoLimpieza, salonExoneracion, isSocio]);

  // Fetch Solicitudes is handled by global ClubDataContext
  const fetchSolicitudes = async () => {};

  // Add Responsible person
  const handleAddResponsable = () => {
    if (responsables.length < 3) {
      setResponsables([...responsables, { nombre: '', telefono: '' }]);
    }
  };

  // Remove Responsible person
  const handleRemoveResponsable = (index: number) => {
    if (responsables.length > 1) {
      setResponsables(responsables.filter((_, i) => i !== index));
    }
  };

  // Update Responsible details
  const handleUpdateResponsable = (index: number, field: keyof Responsable, value: string) => {
    const updated = responsables.map((resp, i) => {
      if (i === index) {
        return { ...resp, [field]: value };
      }
      return resp;
    });
    setResponsables(updated);
  };

  // Submit Request Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTab || activeTab === 'cartas') {
      setSaveError("Categoría de solicitud no válida.");
      return;
    }
    setSaveError(null);
    setSaveSuccess(false);

    const existingIds = solicitudes.map(s => s.id);
    const trackingCodeId = generateShortTrackingCode(existingIds);
    let nuevaSolicitud: Solicitud;

    if (activeTab === 'salon') {
      if (
        !salonNombreSolicitante.trim() || 
        !salonNombreActividad.trim() ||
        !salonTelefonoDigitos.trim() || 
        !salonEmail.trim() || 
        !salonDia || 
        !salonHoraInicio || 
        !salonHoraFin || 
        !salonAsistentes
      ) {
        setSaveError("Por favor, complete todos los campos obligatorios, incluyendo el nombre de la actividad.");
        return;
      }
      if (salonTelefonoDigitos.trim().length !== 8) {
        setSaveError("El número de teléfono debe tener exactamente 8 dígitos.");
        return;
      }
      const asistentesNum = parseInt(salonAsistentes);
      if (isNaN(asistentesNum) || asistentesNum <= 0) {
        setSaveError("Por favor, ingrese un número de asistentes válido.");
        return;
      }
      if (asistentesNum > 80) {
        setSaveError("La capacidad máxima del salón es de 80 personas (60 sentadas / 80 de pie).");
        return;
      }
      if (!salonRequisitosAceptados) {
        setSaveError("Debe aceptar los requisitos y condiciones de uso.");
        return;
      }

      let solNombre = `Alquiler Salón - ${salonNombreActividad.trim()}`;
      if (salonTipoAlquiler === 'parqueo') solNombre = `Alquiler Parqueo - ${salonNombreActividad.trim()}`;
      else if (salonTipoAlquiler === 'parqueo_plazas') solNombre = `Alquiler Parqueo (${salonPlazasParqueo || 1} Plazas) - ${salonNombreActividad.trim()}`;
      else if (salonTipoAlquiler === 'ambos') solNombre = `Alquiler Salón y Parqueo - ${salonNombreActividad.trim()}`;

      nuevaSolicitud = {
        id: trackingCodeId,
        nombre: solNombre,
        nombreSolicitante: salonNombreSolicitante.trim(),
        salonNombreSolicitante: salonNombreSolicitante.trim(),
        salonNombreActividad: salonNombreActividad.trim(),
        salonMotivoEvento: salonNombreActividad.trim(),
        tipo: 'salon',
        estado: 'Pendiente',
        faseTracking: 'recibido',
        usuarioCreador: user ? `${user.nombre} (${user.correo})` : 'Público',
        fechaCreacion: new Date().toISOString().split('T')[0],
        salonDia,
        salonHoraInicio,
        salonHoraFin,
        salonTipoAlquiler,
        salonPlazasParqueo: salonTipoAlquiler === 'parqueo_plazas' ? salonPlazasParqueo : undefined,
        salonDuracion: (salonTipoAlquiler === 'salon' || salonTipoAlquiler === 'ambos') ? salonDuracion : undefined,
        salonAsistentes: asistentesNum,
        salonCompromisoLimpieza,
        salonExoneracion,
        salonMotivoExoneracion: salonExoneracion ? salonMotivoExoneracion.trim() : undefined,
        salonCostoTotal,
        salonRequisitosAceptados,
        salonEsSocio: isSocio,
        salonTelefono: `+502${salonTelefonoDigitos}`,
        salonEmail: salonEmail.trim()
      };
    } else if (activeTab === 'agenda') {
      if (
        !agendaSocioNombre.trim() || 
        !agendaNombrePunto.trim() || 
        !agendaContenido.trim()
      ) {
        setSaveError("Por favor, complete todos los campos obligatorios.");
        return;
      }

      nuevaSolicitud = {
        id: trackingCodeId,
        nombre: `Punto de Agenda - ${agendaNombrePunto.trim()}`,
        nombreSolicitante: agendaSocioNombre.trim(),
        tipo: 'agenda',
        estado: 'Pendiente',
        faseTracking: 'recibido',
        usuarioCreador: user ? `${user.nombre} (${user.correo})` : 'Socio',
        fechaCreacion: new Date().toISOString().split('T')[0],
        agendaSocioNombre: agendaSocioNombre.trim(),
        agendaNombrePunto: agendaNombrePunto.trim(),
        agendaContenido: agendaContenido.trim()
      };
    } else if (activeTab === 'sillas') {
      // Wheelchair request validations
      if (
        !nombreSolicitante.trim() || 
        !dpiSolicitante.trim() || 
        !telefonoSolicitante.trim() || 
        !nombreBeneficiario.trim() || 
        !edadBeneficiario || 
        !tiempoUso.trim()
      ) {
        setSaveError("Por favor, complete todos los campos obligatorios.");
        return;
      }

      if (dpiSolicitante.trim().length !== 13) {
        setSaveError("El número de DPI debe tener exactamente 13 dígitos.");
        return;
      }

      if (telefonoSolicitante.trim().length !== 8) {
        setSaveError("El número de teléfono debe tener exactamente 8 dígitos.");
        return;
      }

      nuevaSolicitud = {
        id: trackingCodeId,
        nombre: `Silla de Ruedas - ${nombreBeneficiario.trim()}`,
        tipo: 'sillas',
        estado: 'Pendiente',
        faseTracking: 'recibido',
        usuarioCreador: user ? `${user.nombre} (${user.correo})` : 'Público',
        fechaCreacion: new Date().toISOString().split('T')[0],
        nombreSolicitante: nombreSolicitante.trim(),
        dpiSolicitante: dpiSolicitante.trim(),
        telefonoSolicitante: `+502${telefonoSolicitante.trim()}`,
        nombreBeneficiario: nombreBeneficiario.trim(),
        edadBeneficiario: parseInt(edadBeneficiario),
        tiempoUso: tiempoUso.trim()
      };
    } else {
      // Standard validations
      if (!nombre.trim() || !fecha || !descripcion.trim()) {
        setSaveError("Por favor, complete todos los campos obligatorios.");
        return;
      }

      if (tema === 'Otra' && !otroTemaDescripcion.trim()) {
        setSaveError("Por favor, describa la categoría en el campo 'Otro Tema'.");
        return;
      }

      // Validate responsible inputs
      for (let i = 0; i < responsables.length; i++) {
        if (!responsables[i].nombre.trim() || !responsables[i].telefono.trim()) {
          setSaveError(`Por favor, complete los datos del Responsable ${i + 1}.`);
          return;
        }
        if (responsables[i].telefono.trim().length !== 8) {
          setSaveError(`El teléfono del Responsable ${i + 1} debe tener exactamente 8 dígitos.`);
          return;
        }
      }

      nuevaSolicitud = {
        id: trackingCodeId,
        nombre: nombre.trim(),
        nombreSolicitante: responsables[0]?.nombre ? responsables[0].nombre.trim() : (user?.nombre || 'Solicitante'),
        fecha,
        descripcion: descripcion.trim(),
        responsables: responsables.map(r => ({
          nombre: r.nombre.trim(),
          telefono: `+502${r.telefono.trim()}`
        })),
        tema,
        otroTemaDescripcion: tema === 'Otra' ? otroTemaDescripcion.trim() : undefined,
        tipo: activeTab, // Save to current open tab ('abiertas' or 'internas')
        estado: 'Pendiente',
        faseTracking: 'recibido',
        usuarioCreador: user ? `${user.nombre} (${user.correo})` : 'Público',
        fechaCreacion: new Date().toISOString().split('T')[0]
      };
    }

    setIsSaving(true);

    try {
      if (docDataUrl) {
        let uploadedDocUrl = docDataUrl;
        if (docDataUrl.startsWith('data:')) {
          uploadedDocUrl = await firebaseService.uploadSolicitudDocumento(docDataUrl, docFileName || 'carta.pdf');
        }
        nuevaSolicitud.documentoUrl = uploadedDocUrl;
        nuevaSolicitud.documentoNombre = docFileName || 'Documento adjunto';
      }

      await firebaseService.saveSolicitud(nuevaSolicitud);
      const updatedList = [nuevaSolicitud, ...solicitudes];
      setSolicitudes(updatedList);
      safeSetItem('club_leones_solicitudes', JSON.stringify(updatedList));

      setCreatedSolicitudId(nuevaSolicitud.id);
      setSaveSuccess(true);

      // Reset document states
      setDocDataUrl('');
      setDocFileName('');

      // Reset form
      setNombre('');
      setFecha('');
      setDescripcion('');
      setTema(TEMAS_SOLICITUD[0]);
      setOtroTemaDescripcion('');
      setResponsables([{ nombre: '', telefono: '' }]);
      
      // Reset wheelchair form
      setNombreSolicitante('');
      setDpiSolicitante('');
      setTelefonoSolicitante('');
      setNombreBeneficiario('');
      setEdadBeneficiario('');
      setTiempoUso('');

      // Reset agenda form
      setAgendaNombrePunto('');
      setAgendaContenido('');

      // Reset salon form
      setSalonDia('');
      setSalonHoraInicio('');
      setSalonHoraFin('');
      setSalonNombreActividad('');
      setSalonTipoAlquiler('salon');
      setSalonAsistentes('');
      setSalonCompromisoLimpieza('dejar_limpio');
      setSalonRequisitosAceptados(false);
      if (!user) {
        setSalonNombreSolicitante('');
        setSalonEmail('');
        setSalonTelefonoDigitos('');
      }
    } catch (err: any) {
      console.error("Error creating solicitud:", err);
      setSaveError("No se pudo enviar la solicitud a Firestore. Verifique su conexión.");
    } finally {
      setIsSaving(false);
    }
  };

  // Change request status (Admin only)
  const handleUpdateStatus = async (solicitudId: string, nuevoEstado: 'Aprobada' | 'Rechazada') => {
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
      safeSetItem('club_leones_solicitudes', JSON.stringify(newList));
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
      safeSetItem('club_leones_solicitudes', JSON.stringify(newList));
      alert("Solicitud eliminada correctamente.");
    } catch (err) {
      console.error("Error deleting solicitud:", err);
      alert("Error al eliminar la solicitud en Firebase.");
    }
  };

  const handleOpenEditSalonSolicitud = (sol: Solicitud) => {
    setEditingSalonSolicitud(sol);
    const extractedName = sol.salonNombreActividad || sol.nombre.replace(/^Reserva Socio - /i, '').replace(/^Alquiler Salón - /i, '').replace(/^Alquiler - /i, '');
    setEditSalonNombreActividad(extractedName);
    setEditSalonDia(sol.salonDia || '');
    setEditSalonHoraInicio(sol.salonHoraInicio || '09:00');
    setEditSalonHoraFin(sol.salonHoraFin || '13:00');
    setEditSalonCompromisoLimpieza(sol.salonCompromisoLimpieza || 'dejar_limpio');
    setEditSalonAsistentes(String(sol.salonAsistentes || '30'));
    setIsEditSalonModalOpen(true);
  };

  const handleSaveEditSalonSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSalonSolicitud || !editSalonDia || !editSalonNombreActividad.trim()) {
      alert("Por favor complete la fecha y el nombre de la actividad.");
      return;
    }
    setIsUpdatingSalon(true);
    try {
      const isSocioRes = editingSalonSolicitud.salonEsSocio;
      const baseNombrePrefix = isSocioRes ? 'Reserva Socio - ' : 'Alquiler Salón - ';
      const updated: Solicitud = {
        ...editingSalonSolicitud,
        nombre: `${baseNombrePrefix}${editSalonNombreActividad.trim()}`,
        salonNombreActividad: editSalonNombreActividad.trim(),
        salonMotivoEvento: editSalonNombreActividad.trim(),
        salonDia: editSalonDia,
        salonHoraInicio: editSalonHoraInicio,
        salonHoraFin: editSalonHoraFin,
        salonAsistentes: parseInt(editSalonAsistentes) || editingSalonSolicitud.salonAsistentes,
        salonCompromisoLimpieza: editSalonCompromisoLimpieza,
        salonCostoTotal: editSalonCompromisoLimpieza === 'pagar_limpieza'
          ? (isSocioRes ? 300 : (editingSalonSolicitud.salonCostoTotal || 300))
          : (isSocioRes ? 0 : (editingSalonSolicitud.salonCostoTotal || 0))
      };

      await firebaseService.saveSolicitud(updated);
      const newList = solicitudes.map(s => s.id === updated.id ? updated : s);
      setSolicitudes(newList);
      safeSetItem('club_leones_solicitudes', JSON.stringify(newList));
      setIsEditSalonModalOpen(false);
      setEditingSalonSolicitud(null);
      alert("La fecha y datos del apartado han sido modificados exitosamente.");
    } catch (err) {
      console.error("Error updating salon request:", err);
      alert("Error al actualizar la solicitud de salón.");
    } finally {
      setIsUpdatingSalon(false);
    }
  };

  interface TabConfig {
    id: 'abiertas' | 'sillas' | 'internas' | 'cartas' | 'agenda' | 'salon';
    title: string;
    subtitle: string;
    description: string;
    icon: React.ReactNode;
    audience: string;
    registeredCount: number;
    pendingCount: number;
    actionText?: string;
    showAction: boolean;
    visible: boolean;
    allowed: boolean;
    colorTheme: 'blue' | 'emerald' | 'purple' | 'amber' | 'indigo' | 'orange';
  }

  const tabConfigs: TabConfig[] = [
    {
      id: 'abiertas',
      title: 'Solicitudes Abiertas',
      subtitle: 'Público y Socios',
      description: 'Cualquier persona puede generar una solicitud al club llenando el formulario que aparece en crear solicitud.',
      icon: <FileText size={20} />,
      visible: true,
      allowed: true,
      audience: 'Público General',
      pendingCount: counts.abiertasPendientes,
      registeredCount: counts.abiertas,
      showAction: true,
      actionText: 'Crear Solicitud',
      colorTheme: 'emerald'
    },
    {
      id: 'sillas',
      title: 'Sillas de Ruedas',
      subtitle: 'Préstamo Temporal',
      description: 'Formulario de préstamo temporal gratuito de equipo de movilidad para personas con necesidades especiales en Quetzaltenango.',
      icon: <Accessibility size={20} />,
      visible: true,
      allowed: true,
      audience: 'Público General',
      pendingCount: counts.sillasPendientes,
      registeredCount: counts.sillas,
      showAction: true,
      actionText: 'Solicitar Silla',
      colorTheme: 'blue'
    },
    {
      id: 'salon',
      title: 'Alquiler Salón y Parqueo',
      subtitle: 'Eventos y Reservaciones',
      description: 'Solicitudes para el alquiler del salón de eventos del club (capacidad de 60 personas sentadas y 80 de pie) y uso del parqueo completo.',
      icon: <Home size={20} />,
      visible: true,
      allowed: true,
      audience: 'Público General',
      pendingCount: counts.salonPendientes,
      registeredCount: counts.salon,
      showAction: true,
      actionText: 'Reservar Salón',
      colorTheme: 'amber'
    },
    {
      id: 'internas',
      title: 'Solicitudes Internas',
      subtitle: 'Administración Club',
      description: 'Coordinación interna del club, minutas de comisiones, propuestas presupuestarias y peticiones privadas de los socios activos.',
      icon: <Lock size={20} />,
      visible: true,
      allowed: hasInternalAccess,
      audience: 'Socios Activos',
      pendingCount: counts.internasPendientes,
      registeredCount: counts.internas,
      showAction: true,
      actionText: 'Crear Solicitud',
      colorTheme: 'purple'
    },
    {
      id: 'cartas',
      title: 'Cartas Oficiales',
      subtitle: 'Correspondencia',
      description: 'Redacción, firma digital y generación en PDF de correspondencia membretada dirigida a terceras instituciones.',
      icon: <Mail size={20} />,
      visible: isAdministrative,
      allowed: isAdministrative,
      audience: 'Directiva',
      pendingCount: 0,
      registeredCount: 0,
      showAction: true,
      actionText: 'Redactar Carta',
      colorTheme: 'orange'
    },
    {
      id: 'agenda',
      title: 'Puntos de Agenda',
      subtitle: 'Reuniones de Socios',
      description: 'Propuesta de temas, puntos a discutir y solicitudes para el orden del día de las reuniones generales de socios.',
      icon: <Calendar size={20} />,
      visible: true,
      allowed: true,
      audience: 'Socios y Público',
      pendingCount: counts.agendaPendientes,
      registeredCount: counts.agenda,
      showAction: true,
      actionText: 'Proponer Punto',
      colorTheme: 'indigo'
    },
    {
      id: 'archivo',
      title: 'Archivo de Solicitudes',
      subtitle: 'Histórico General',
      description: 'Consultatorio histórico de solicitudes archivadas, cartas de petición comunitarias y documentos adjuntos procesados.',
      icon: <Archive size={20} />,
      visible: true,
      allowed: true,
      audience: 'General',
      pendingCount: 0,
      registeredCount: counts.archivadas,
      showAction: false,
      colorTheme: 'blue'
    }
  ];
  const renderRestrictedAccess = () => {
    return (
      <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-md p-10 sm:p-16 text-center max-w-2xl mx-auto space-y-6 w-full">
        <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-red-600 border border-red-100 animate-pulse">
          <Lock size={28} />
        </div>
        <h3 className="text-2xl font-black text-slate-900">Acceso Restringido</h3>
        <p className="text-slate-655 text-sm leading-relaxed max-w-md mx-auto font-medium">
          Las solicitudes internas son de carácter privado y están reservadas exclusivamente para socios activos y la junta directiva del club.
        </p>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-500 font-semibold max-w-xs mx-auto">
          🔑 Requiere rol administrativo o socio regular.
        </div>
      </div>
    );
  };

  const handleSearchTracking = (e: React.FormEvent, tipo: 'abiertas' | 'sillas' | 'internas' | 'agenda' | 'salon') => {
    e.preventDefault();
    setTrackingError('');
    setSearchedSolicitud(null);

    if (!trackingCode.trim()) {
      setTrackingError("Por favor, ingrese un código de seguimiento.");
      return;
    }

    const found = solicitudes.find(
      s => s.id.toLowerCase().trim() === trackingCode.toLowerCase().trim() && s.tipo === tipo
    );

    if (found) {
      setSearchedSolicitud(found);
    } else {
      setTrackingError("No se encontró ninguna solicitud con ese código en esta categoría.");
    }
  };

  const renderSolicitudesList = (tipo: 'abiertas' | 'sillas' | 'internas' | 'agenda' | 'salon' | 'archivo') => {
    const list = tipo === 'archivo'
      ? solicitudes.filter(s => s.archivada === true)
      : solicitudes.filter(s => s.tipo === tipo && !s.archivada);
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 w-full">
          <div className="animate-spin text-blue-900"><Users size={36} /></div>
          <p className="text-slate-500 font-bold text-sm">Cargando solicitudes...</p>
        </div>
      );
    }
    if (list.length === 0) {
      return (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-16 text-center max-w-2xl mx-auto w-full">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
            <FileText size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No hay solicitudes</h3>
          <p className="text-slate-600 mt-2 text-sm font-medium">
            Aún no se han registrado solicitudes en esta categoría. ¡Sé el primero en crear una!
          </p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 w-full">
        {list.map((sol) => {
          const statusBorderColor = 
            sol.estado === 'Aprobada' ? 'border-l-4 border-l-emerald-500' :
            sol.estado === 'Rechazada' ? 'border-l-4 border-l-rose-500' :
            'border-l-4 border-l-yellow-500';

          if (sol.tipo === 'sillas') {
            return (
              <div 
                key={sol.id}
                className={`bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl border border-slate-100 transition-all duration-300 flex flex-col justify-between ${statusBorderColor}`}
              >
                <div className="p-6 space-y-4 flex-grow">
                  {/* Tags and Status */}
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border bg-blue-50 text-blue-700 border-blue-200 flex items-center space-x-1">
                      <Accessibility size={12} className="mr-0.5" />
                      <span>Silla de Ruedas</span>
                    </span>
                    
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

                  {/* Info details */}
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-lg text-slate-900 leading-snug break-words">
                      Para: {sol.nombreBeneficiario}
                    </h3>
                    <div className="flex items-center text-xs font-semibold text-slate-400">
                      <Calendar size={12} className="mr-1 text-slate-400 flex-shrink-0" />
                      <span>Edad: {sol.edadBeneficiario} años • Registro: {formatDisplayDate(sol.fechaCreacion)}</span>
                    </div>
                  </div>

                  {/* Wheelchair specific details */}
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 space-y-2.5 text-xs">
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
                      <a href={`tel:${sol.telefonoSolicitante}`} className="text-blue-900 hover:underline font-extrabold flex items-center space-x-1">
                        <Phone size={10} className="mr-0.5" />
                        <span>{sol.telefonoSolicitante}</span>
                      </a>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-slate-200/50">
                      <span className="text-slate-400 font-bold">Tiempo de Uso:</span>
                      <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">{sol.tiempoUso}</span>
                    </div>
                  </div>

                  {/* Return Note/Indicator */}
                  <div className="bg-blue-50/50 border border-blue-100/70 p-3 rounded-xl flex items-start space-x-2 text-[10px] text-blue-800 font-medium leading-relaxed">
                    <RefreshCw size={12} className="flex-shrink-0 mt-0.5 text-blue-600 animate-pulse" />
                    <span>Compromiso de devolver la silla al finalizar su uso para beneficiar a otros.</span>
                  </div>
                </div>

                {/* Footer actions for Admin */}
                <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2 justify-between items-center text-[10px] font-bold text-slate-400">
                  <span className="truncate max-w-[130px]" title={sol.usuarioCreador}>Por: {sol.usuarioCreador || 'Público'}</span>
                  
                  {(isAdministrative || (user && sol.usuarioCreador?.includes(user.correo))) && (
                    <div className="flex items-center space-x-1 flex-shrink-0 mt-2 sm:mt-0">
                      {isAdministrative && sol.estado === 'Pendiente' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(sol.id, 'Aprobada')}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded-lg shadow-sm"
                            title="Aprobar Solicitud"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(sol.id, 'Rechazada')}
                            className="bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded-lg shadow-sm"
                            title="Rechazar Solicitud"
                          >
                            <X size={12} />
                          </button>
                        </>
                      )}
                      {isAdministrative && (
                        <button
                          type="button"
                          onClick={() => handleToggleArchive(sol.id, !sol.archivada)}
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
                      )}
                      <button
                        onClick={() => handleDeleteSolicitud(sol.id)}
                        className="bg-slate-200 hover:bg-red-50 text-slate-500 hover:text-red-600 p-1.5 rounded-lg border border-slate-300/30 transition-colors"
                        title="Eliminar Solicitud"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          if (sol.tipo === 'agenda') {
            return (
              <div 
                key={sol.id}
                className={`bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl border border-slate-100 transition-all duration-300 flex flex-col justify-between ${statusBorderColor}`}
              >
                <div className="p-6 space-y-4 flex-grow">
                  {/* Tags and Status */}
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border bg-yellow-50 text-yellow-750 border-yellow-200 flex items-center space-x-1">
                      <Calendar size={12} className="mr-0.5 text-yellow-600" />
                      <span>Punto de Agenda</span>
                    </span>
                    
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

                  {/* Info details */}
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-lg text-slate-900 leading-snug break-words">
                      {sol.agendaNombrePunto}
                    </h3>
                    <div className="flex items-center text-xs font-semibold text-slate-400">
                      <User size={12} className="mr-1 text-slate-400 flex-shrink-0" />
                      <span>Solicitado por: <strong className="text-slate-655 font-extrabold">{sol.agendaSocioNombre}</strong> • {formatDisplayDate(sol.fechaCreacion)}</span>
                    </div>
                  </div>

                  {/* Contenido / Detalle */}
                  <div className="space-y-1 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                      Contenido / Detalle:
                    </div>
                    <p className="text-slate-705 text-xs leading-relaxed font-medium break-words">
                      {sol.agendaContenido}
                    </p>
                  </div>

                  {/* Documento o Carta Adjunta si existe */}
                  {sol.documentoUrl && (
                    <div className="pt-1">
                      <a
                        href={sol.documentoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs"
                        title={sol.documentoNombre || 'Ver carta o archivo adjunto'}
                      >
                        <FileText size={14} className="text-indigo-600" />
                        <span>📄 Ver Documento / Carta Adjunta ({sol.documentoNombre || 'PDF/Imagen'})</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Footer actions for Admin/Creator */}
                <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2 justify-between items-center text-[10px] font-bold text-slate-400">
                  <span className="truncate max-w-[130px]" title={sol.usuarioCreador}>Por: {sol.usuarioCreador || 'Socio'}</span>
                  
                  {(isAdministrative || (user && sol.usuarioCreador?.includes(user.correo))) && (
                    <div className="flex items-center space-x-1 flex-shrink-0 mt-2 sm:mt-0">
                      {isAdministrative && sol.estado === 'Pendiente' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(sol.id, 'Aprobada')}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded-lg shadow-sm transition-colors"
                            title="Aprobar Punto"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(sol.id, 'Rechazada')}
                            className="bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded-lg shadow-sm transition-colors"
                            title="Rechazar Punto"
                          >
                            <X size={12} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteSolicitud(sol.id)}
                        className="bg-slate-200 hover:bg-red-50 text-slate-500 hover:text-red-600 p-1.5 rounded-lg border border-slate-300/30 transition-colors"
                        title="Eliminar Punto"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          if (sol.tipo === 'salon') {
            return (
              <div 
                key={sol.id}
                className={`bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl border border-slate-100 transition-all duration-300 flex flex-col justify-between ${statusBorderColor}`}
              >
                <div className="p-6 space-y-4 flex-grow text-left">
                  {/* Tags and Status */}
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border bg-amber-50 text-amber-700 border-amber-200 flex items-center space-x-1">
                      {sol.salonTipoAlquiler === 'parqueo' ? <Car size={12} className="mr-0.5" /> : <Building size={12} className="mr-0.5" />}
                      <span>
                        {sol.salonTipoAlquiler === 'salon' ? `Salón (${sol.salonDuracion === '8_horas' ? '8h' : '4h'})` : 
                         sol.salonTipoAlquiler === 'parqueo' ? 'Parqueo Completo' : 
                         sol.salonTipoAlquiler === 'parqueo_plazas' ? `Parqueo (${sol.salonPlazasParqueo || 1} Plazas)` : 
                         `Salón (${sol.salonDuracion === '8_horas' ? '8h' : '4h'}) + Parqueo`}
                      </span>
                    </span>
                    
                    <div className="flex items-center space-x-1.5">
                      {sol.salonExoneracion && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                          Exonerado
                        </span>
                      )}
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
                  </div>

                  {/* Info details */}
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-base text-slate-900 leading-snug break-words">
                      Reservación: {sol.salonDia}
                    </h3>
                    <div className="flex items-center text-xs font-semibold text-slate-400">
                      <Clock size={12} className="mr-1 text-slate-400 flex-shrink-0" />
                      <span>{sol.salonHoraInicio} - {sol.salonHoraFin}</span>
                    </div>
                  </div>

                  {/* Rental details */}
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 space-y-2.5 text-xs font-medium">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Solicitante:</span>
                      <span className="font-extrabold text-slate-800">{sol.salonNombreSolicitante || sol.nombre}</span>
                    </div>
                    {sol.salonInstitucion && (
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">Institución:</span>
                        <span className="font-extrabold text-amber-950 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">{sol.salonInstitucion}</span>
                      </div>
                    )}
                    {sol.salonTelefono && (
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">Teléfono:</span>
                        <a href={`tel:${sol.salonTelefono}`} className="text-blue-900 hover:underline font-extrabold flex items-center space-x-1">
                          <Phone size={10} className="mr-0.5" />
                          <span>{sol.salonTelefono}</span>
                        </a>
                      </div>
                    )}
                    {sol.salonEmail && (
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">Correo:</span>
                        <span className="font-semibold text-slate-700">{sol.salonEmail}</span>
                      </div>
                    )}
                    {(sol.salonTipoAlquiler === 'parqueo_plazas' || sol.salonTipoAlquiler === 'salon_plazas') && (
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">Plazas reservadas:</span>
                        <span className="font-extrabold text-blue-900">{sol.salonPlazasParqueo || 1} Plazas</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1.5 border-t border-slate-200/50">
                      <span className="text-slate-400 font-bold">Asistentes:</span>
                      <span className="font-extrabold text-slate-800">{sol.salonAsistentes} personas</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Limpieza:</span>
                      <span className="font-bold text-slate-700">
                        {sol.salonCompromisoLimpieza === 'dejar_limpio' ? 'Dejará limpio' : 'Pago de servicio (+Q300)'}
                      </span>
                    </div>
                    {sol.salonExoneracion && sol.salonMotivoExoneracion && (
                      <div className="flex justify-between text-purple-700 font-bold text-[11px] bg-purple-50 p-1.5 rounded-lg border border-purple-100">
                        <span>Motivo Exon.:</span>
                        <span className="truncate max-w-[140px]" title={sol.salonMotivoExoneracion}>{sol.salonMotivoExoneracion}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Tarifa:</span>
                      <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                        sol.salonEsSocio ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-slate-100 text-slate-750'
                      }`}>
                        {sol.salonEsSocio ? 'Socio' : 'Público General'}
                      </span>
                    </div>
                    {sol.metodoPago && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 font-bold">Método Pago:</span>
                        <span className="font-bold text-slate-700 flex items-center space-x-1">
                          {sol.metodoPago === 'recurrente' ? (
                            <>
                              <CreditCard size={12} className="text-amber-500" />
                              <span>Tarjeta (Recurrente GT)</span>
                            </>
                          ) : sol.metodoPago === 'transferencia' ? (
                            <span>Transferencia / Sede</span>
                          ) : (
                            <span>Exonerado</span>
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1.5 border-t border-slate-200/50">
                      <span className="text-slate-400 font-bold text-sm">Costo Total:</span>
                      <span className="font-black text-sm text-blue-900">Q{sol.salonCostoTotal}</span>
                    </div>
                    {sol.recurrenteCheckoutUrl && sol.estado === 'Pendiente' && (
                      <a
                        href={sol.recurrenteCheckoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 w-full py-1.5 px-3 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-850 text-white rounded-xl font-bold text-[11px] flex items-center justify-center space-x-1.5 shadow-xs transition-colors"
                      >
                        <CreditCard size={12} className="text-amber-400" />
                        <span>Abrir Pasarela Recurrente GT</span>
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Footer actions for Admin */}
                <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2 justify-between items-center text-[10px] font-bold text-slate-400">
                  <span className="truncate max-w-[130px]" title={sol.usuarioCreador}>Por: {sol.usuarioCreador || 'Público'}</span>
                  
                  {(isAdministrative || (user && sol.usuarioCreador?.includes(user.correo))) && (
                    <div className="flex items-center space-x-1.5 flex-shrink-0 mt-2 sm:mt-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditSalonSolicitud(sol)}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-2 py-1 rounded-lg border border-amber-300 transition-colors flex items-center space-x-1 text-[11px] font-extrabold cursor-pointer"
                        title="Modificar Fecha y Horario del Apartado"
                      >
                        <Edit3 size={12} />
                        <span>Editar Fecha</span>
                      </button>

                      {isAdministrative && sol.estado === 'Pendiente' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(sol.id, 'Aprobada')}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded-lg shadow-sm"
                            title="Aprobar Reservación"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(sol.id, 'Rechazada')}
                            className="bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded-lg shadow-sm"
                            title="Rechazar Reservación"
                          >
                            <X size={12} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteSolicitud(sol.id)}
                        className="bg-slate-200 hover:bg-red-50 text-slate-500 hover:text-red-600 p-1.5 rounded-lg border border-slate-300/30 transition-colors"
                        title="Eliminar Reservación"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div 
              key={sol.id}
              className={`bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl border border-slate-100 transition-all duration-300 flex flex-col justify-between ${statusBorderColor}`}
            >
              <div className="p-6 space-y-4 flex-grow">
                {/* Tags and Status */}
                <div className="flex justify-between items-start gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                    (sol.tema && TEMA_COLORS[sol.tema]) || TEMA_COLORS['Otra']
                  }`}>
                    {sol.tema === 'Otra' ? (sol.otroTemaDescripcion || 'Otra') : sol.tema}
                  </span>
                  
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

                {/* Info details */}
                <div className="space-y-1">
                  <h3 className="font-extrabold text-lg text-slate-900 leading-snug break-words">
                    {sol.nombre}
                  </h3>
                  <div className="flex items-center text-xs font-semibold text-slate-405">
                    <Calendar size={12} className="mr-1 text-slate-400 flex-shrink-0" />
                    <span>Fecha: {formatDisplayDate(sol.fecha)}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-slate-655 text-xs leading-relaxed font-medium break-words bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                  {sol.descripcion}
                </p>

                {/* Document Attached Link */}
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

                {/* Responsibles Section */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <Users size={10} className="mr-1 text-slate-400" />
                    Responsables ({sol.responsables?.length || 0})
                  </h4>
                  <div className="space-y-1.5">
                    {sol.responsables?.map((resp, i) => (
                      <div key={i} className="flex flex-col sm:flex-row justify-between sm:items-center text-xs bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 gap-1">
                        <span className="font-bold text-slate-700 truncate max-w-[150px]">{resp.nombre}</span>
                        <a 
                          href={`tel:${resp.telefono}`} 
                          className="text-blue-900 hover:text-blue-700 font-bold flex items-center space-x-1"
                        >
                          <Phone size={10} className="flex-shrink-0" />
                          <span>{resp.telefono}</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer actions for Admin */}
              <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2 justify-between items-center text-[10px] font-bold text-slate-400">
                <span className="truncate max-w-[130px]" title={sol.usuarioCreador}>Por: {sol.usuarioCreador || 'Público'}</span>
                
                {(isAdministrative || (user && sol.usuarioCreador?.includes(user.correo))) && (
                  <div className="flex items-center space-x-1 flex-shrink-0 mt-2 sm:mt-0">
                    {isAdministrative && sol.estado === 'Pendiente' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(sol.id, 'Aprobada')}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded-lg shadow-sm"
                          title="Aprobar Solicitud"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(sol.id, 'Rechazada')}
                          className="bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded-lg shadow-sm"
                          title="Rechazar Solicitud"
                        >
                          <X size={12} />
                        </button>
                      </>
                    )}
                    {isAdministrative && (
                      <button
                        type="button"
                        onClick={() => handleToggleArchive(sol.id, !sol.archivada)}
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
                    )}
                    <button
                      onClick={() => handleDeleteSolicitud(sol.id)}
                      className="bg-slate-200 hover:bg-red-50 text-slate-500 hover:text-red-600 p-1.5 rounded-lg border border-slate-300/30 transition-colors"
                      title="Eliminar Solicitud"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Procesar reservación de salón/parqueo (Con pasarela Recurrente GT o manual)
  const handleSalonFinalSubmit = async (metodo: 'recurrente' | 'transferencia' | 'exonerado') => {
    setSaveError(null);
    setSaveSuccess(false);

    if (!user) {
      if (!salonNombreSolicitante.trim() || !salonTelefonoDigitos.trim() || !salonEmail.trim()) {
        setSaveError("Por favor, complete todos los datos de contacto obligatorios.");
        return;
      }
      if (salonTelefonoDigitos.trim().length !== 8) {
        setSaveError("El número de teléfono debe tener exactamente 8 dígitos.");
        return;
      }
      if (!salonEmail.includes('@')) {
        setSaveError("Por favor, ingrese un correo electrónico válido.");
        return;
      }
    }

    if (!salonDia || !salonHoraInicio || !salonHoraFin) {
      setSaveError("Por favor, indique la fecha y horarios del evento.");
      return;
    }

    const asistentesNum = parseInt(salonAsistentes);
    if (isNaN(asistentesNum) || asistentesNum <= 0) {
      setSaveError("Por favor, ingrese un número de asistentes válido.");
      return;
    }
    if (asistentesNum > 80) {
      setSaveError("La capacidad máxima del salón es de 80 personas (60 sentadas / 80 de pie).");
      return;
    }
    if (!salonRequisitosAceptados) {
      setSaveError("Debe aceptar los requisitos y condiciones de uso.");
      return;
    }
    if (salonExoneracion && !salonMotivoExoneracion.trim()) {
      setSaveError("Por favor, especifique el motivo o referencia de la exoneración especial.");
      return;
    }

    let solNombre = 'Alquiler - Salón de Eventos';
    if (salonTipoAlquiler === 'salon_plazas') solNombre = `Alquiler - Salón y Parqueo (${salonPlazasParqueo || 1} Plazas)`;
    else if (salonTipoAlquiler === 'parqueo') solNombre = 'Alquiler - Parqueo Completo';
    else if (salonTipoAlquiler === 'parqueo_plazas') solNombre = `Alquiler - Parqueo (${salonPlazasParqueo || 1} Plazas)`;
    else if (salonTipoAlquiler === 'ambos') solNombre = 'Alquiler - Salón y Parqueo Completo';

    const existingIds = solicitudes.map(s => s.id);
    const trackingCodeId = generateShortTrackingCode(existingIds);

    const nuevaSolicitud: Solicitud = {
      id: trackingCodeId,
      nombre: solNombre,
      nombreSolicitante: (user ? user.nombre : salonNombreSolicitante).trim(),
      salonNombreSolicitante: (user ? user.nombre : salonNombreSolicitante).trim(),
      salonInstitucion: salonInstitucion.trim() || undefined,
      tipo: 'salon',
      estado: 'Pendiente',
      faseTracking: 'recibido',
      usuarioCreador: user ? `${user.nombre} (${user.correo})` : 'Público',
      fechaCreacion: new Date().toISOString().split('T')[0],
      salonDia,
      salonHoraInicio,
      salonHoraFin,
      salonTipoAlquiler,
      salonPlazasParqueo: (salonTipoAlquiler === 'parqueo_plazas' || salonTipoAlquiler === 'salon_plazas') ? salonPlazasParqueo : undefined,
      salonDuracion: (salonTipoAlquiler === 'salon' || salonTipoAlquiler === 'salon_plazas' || salonTipoAlquiler === 'ambos') ? salonDuracion : undefined,
      salonAsistentes: asistentesNum,
      salonCompromisoLimpieza,
      salonExoneracion,
      salonMotivoExoneracion: salonExoneracion ? salonMotivoExoneracion.trim() : undefined,
      salonCostoTotal,
      salonRequisitosAceptados,
      salonEsSocio: isSocio,
      salonTelefono: user ? (user.telefono || '') : `+502${salonTelefonoDigitos}`,
      salonEmail: user ? user.correo : salonEmail.trim(),
      metodoPago: metodo,
      estadoPago: salonCostoTotal === 0 ? 'Exonerado' : 'Pendiente'
    };

    setIsSaving(true);

    try {
      if (docDataUrl) {
        let uploadedDocUrl = docDataUrl;
        if (docDataUrl.startsWith('data:')) {
          uploadedDocUrl = await firebaseService.uploadSolicitudDocumento(docDataUrl, docFileName || 'solicitud.pdf');
        }
        nuevaSolicitud.documentoUrl = uploadedDocUrl;
        nuevaSolicitud.documentoNombre = docFileName || 'Documento adjunto';
      }

      // Si seleccionó pago con Recurrente GT y hay un costo mayor a 0
      if (metodo === 'recurrente' && salonCostoTotal > 0) {
        setIsRedirectingPayment(true);
        const checkoutItems: RecurrenteItem[] = [];

        // 1. Producto principal según la instalación seleccionada
        if (salonTipoAlquiler === 'salon') {
          const baseAmount = (salonExoneracion || isSocio) ? 0 : (salonDuracion === '4_horas' ? 700 : 1200);
          if (baseAmount > 0) {
            checkoutItems.push({
              name: `Alquiler Salón de Eventos y Capacitaciones (${salonDuracion === '8_horas' ? '8 Horas' : '4 Horas'})`,
              amount_in_cents: baseAmount * 100,
              currency: 'GTQ',
              quantity: 1
            });
          }
        } else if (salonTipoAlquiler === 'salon_plazas') {
          const salonBaseAmount = (salonExoneracion || isSocio) ? 0 : (salonDuracion === '4_horas' ? 700 : 1200);
          if (salonBaseAmount > 0) {
            checkoutItems.push({
              name: `Alquiler Salón de Eventos y Capacitaciones (${salonDuracion === '8_horas' ? '8 Horas' : '4 Horas'})`,
              amount_in_cents: salonBaseAmount * 100,
              currency: 'GTQ',
              quantity: 1
            });
          }
          const qty = salonPlazasParqueo || 1;
          checkoutItems.push({
            name: `Reserva de Plazas de Parqueo (${qty} Plazas / Día)`,
            amount_in_cents: qty * 50 * 100,
            currency: 'GTQ',
            quantity: 1
          });
        } else if (salonTipoAlquiler === 'parqueo') {
          // Parqueo completo no tiene exoneración
          checkoutItems.push({
            name: 'Alquiler de Parqueo Privado Completo (Todo el Día)',
            amount_in_cents: 1500 * 100,
            currency: 'GTQ',
            quantity: 1
          });
        } else if (salonTipoAlquiler === 'parqueo_plazas') {
          // Parqueo por plazas: Q50 por plaza por día
          const qty = salonPlazasParqueo || 1;
          checkoutItems.push({
            name: `Reserva de Plazas de Parqueo (${qty} Plazas / Día)`,
            amount_in_cents: qty * 50 * 100,
            currency: 'GTQ',
            quantity: 1
          });
        } else if (salonTipoAlquiler === 'ambos') {
          // Combo: si hay exoneración se exonera el salón pero se cobra el parqueo (Q1,500)
          if (salonExoneracion) {
            checkoutItems.push({
              name: `Combo: Salón Exonerado + Parqueo Completo (Día)`,
              amount_in_cents: 1500 * 100,
              currency: 'GTQ',
              quantity: 1
            });
          } else {
            const baseAmount = isSocio ? 1500 : (salonDuracion === '4_horas' ? 2000 : 2500);
            checkoutItems.push({
              name: `Combo Salón (${salonDuracion === '8_horas' ? '8h' : '4h'}) y Parqueo Completo`,
              amount_in_cents: baseAmount * 100,
              currency: 'GTQ',
              quantity: 1
            });
          }
        }

        // 2. Producto de Servicio de Limpieza Post-Evento
        if (salonCompromisoLimpieza === 'pagar_limpieza') {
          checkoutItems.push({
            name: 'Servicio Integral de Limpieza Post-Evento',
            amount_in_cents: 300 * 100,
            currency: 'GTQ',
            quantity: 1
          });
        }

        const validItems = checkoutItems.filter(item => item.amount_in_cents > 0);
        if (validItems.length > 0) {
          try {
            const currentBaseUrl = window.location.href.split('#')[0].split('?')[0];
            const checkoutResponse = await recurrenteService.createCheckout({
              items: validItems,
              userEmail: (nuevaSolicitud.salonEmail || user?.correo || '').trim(),
              successUrl: `${currentBaseUrl}#solicitudes?pago_salon=exitoso&id=${nuevaSolicitud.id}`,
              cancelUrl: `${currentBaseUrl}#solicitudes?pago_salon=cancelado&id=${nuevaSolicitud.id}`,
              metadata: {
                solicitudId: nuevaSolicitud.id,
                tipo: 'alquiler_salon',
                nombreSolicitante: nuevaSolicitud.nombreSolicitante,
                dia: salonDia,
                horario: `${salonHoraInicio} - ${salonHoraFin}`,
                total: salonCostoTotal
              }
            });

            if (checkoutResponse && checkoutResponse.checkout_url) {
              nuevaSolicitud.recurrenteCheckoutUrl = checkoutResponse.checkout_url;
              nuevaSolicitud.recurrenteCheckoutId = checkoutResponse.id;
              nuevaSolicitud.estadoPago = 'Checkout_Creado';
              setCreatedSolicitudCheckoutUrl(checkoutResponse.checkout_url);

              await firebaseService.saveSolicitud(nuevaSolicitud);
              const updatedList = [nuevaSolicitud, ...solicitudes];
              setSolicitudes(updatedList);
              safeSetItem('club_leones_solicitudes', JSON.stringify(updatedList));

              setCreatedSolicitudId(nuevaSolicitud.id);
              setSaveSuccess(true);

              // Redireccionar inmediatamente a la pasarela de Recurrente GT
              window.location.href = checkoutResponse.checkout_url;
              return;
            }
          } catch (payErr: any) {
            console.error("Error al conectar con la pasarela Recurrente GT:", payErr);
            alert(`ℹ️ Tu solicitud fue guardada con éxito (Código: ${nuevaSolicitud.id}).\n\nNotificación de Recurrente GT:\n${payErr?.message || 'No se pudo abrir automáticamente la pasarela.'}\n\nPuedes realizar tu pago por transferencia bancaria o en sede.`);
          }
        }
      }

      // Registro estándar (Transferencia / Exonerado / En Sede)
      await firebaseService.saveSolicitud(nuevaSolicitud);
      const updatedList = [nuevaSolicitud, ...solicitudes];
      setSolicitudes(updatedList);
      safeSetItem('club_leones_solicitudes', JSON.stringify(updatedList));

      setCreatedSolicitudId(nuevaSolicitud.id);
      setCreatedSolicitudCheckoutUrl(nuevaSolicitud.recurrenteCheckoutUrl || '');
      setSaveSuccess(true);

      // Limpiar estados
      setDocDataUrl('');
      setDocFileName('');
      setSalonDia('');
      setSalonHoraInicio('');
      setSalonHoraFin('');
      setSalonTipoAlquiler('salon');
      setSalonAsistentes('');
      setSalonCompromisoLimpieza('dejar_limpio');
      setSalonExoneracion(false);
      setSalonMotivoExoneracion('');
      setSalonRequisitosAceptados(false);
      if (!user) {
        setSalonNombreSolicitante('');
        setSalonInstitucion('');
        setSalonEmail('');
        setSalonTelefonoDigitos('');
      }
    } catch (err: any) {
      console.error("Error saving salon solicitud:", err);
      setSaveError("No se pudo enviar la solicitud. Verifique su conexión.");
    } finally {
      setIsSaving(false);
      setIsRedirectingPayment(false);
    }
  };

  const renderSalonForm = () => {
    const isCapacityWarning = parseInt(salonAsistentes || '0') > 60 && parseInt(salonAsistentes || '0') <= 80;
    const isCapacityError = parseInt(salonAsistentes || '0') > 80;
    const salonBasePrice = salonDuracion === '4_horas' ? 700 : 1200;

    // Step 1 Validation
    const validateStep1 = () => {
      if (!salonNombreSolicitante.trim()) {
        setSaveError("Ingresa el nombre completo del solicitante.");
        return false;
      }
      if (!salonEmail.trim() || !salonEmail.includes('@')) {
        setSaveError("Ingresa un correo electrónico válido.");
        return false;
      }
      if (salonTelefonoDigitos.trim().length !== 8) {
        setSaveError("El número de teléfono debe tener 8 dígitos.");
        return false;
      }
      setSaveError(null);
      return true;
    };

    // Step 2 Validation
    const validateStep2 = () => {
      if ((salonTipoAlquiler === 'parqueo_plazas' || salonTipoAlquiler === 'salon_plazas') && (!salonPlazasParqueo || salonPlazasParqueo < 1)) {
        setSaveError("Selecciona al menos 1 plaza de parqueo.");
        return false;
      }
      setSaveError(null);
      return true;
    };

    // Step 3 Validation
    const validateStep3 = () => {
      if (!salonNombreActividad.trim()) {
        setSaveError("Ingresa el nombre o motivo de la actividad / evento.");
        return false;
      }
      if (!salonDia) {
        setSaveError("Selecciona la fecha del evento.");
        return false;
      }
      if (!salonHoraInicio || !salonHoraFin) {
        setSaveError("Selecciona el horario de inicio y fin.");
        return false;
      }
      const numAsistentes = parseInt(salonAsistentes || '0');
      if (isNaN(numAsistentes) || numAsistentes <= 0) {
        setSaveError("Ingresa un número estimado de asistentes válido.");
        return false;
      }
      if (numAsistentes > 80) {
        setSaveError("La capacidad máxima del salón es de 80 personas.");
        return false;
      }
      setSaveError(null);
      return true;
    };

    const handleNext = () => {
      if (salonWizardStep === 1 && validateStep1()) setSalonWizardStep(2);
      else if (salonWizardStep === 2 && validateStep2()) setSalonWizardStep(3);
      else if (salonWizardStep === 3 && validateStep3()) setSalonWizardStep(4);
    };

    const handleBack = () => {
      setSaveError(null);
      if (salonWizardStep > 1) {
        setSalonWizardStep((prev) => (prev - 1) as any);
      }
    };

    const stepColorThemes = [
      {
        num: 1,
        title: 'Solicitante',
        icon: <User size={15} />,
        activeBg: 'bg-blue-600 ring-4 ring-blue-600/20 text-white shadow-lg shadow-blue-500/20',
        doneBg: 'bg-blue-600 text-white',
        activeText: 'text-blue-900',
        badge: 'bg-blue-50 text-blue-700 border-blue-200'
      },
      {
        num: 2,
        title: 'Instalación',
        icon: <Building size={15} />,
        activeBg: 'bg-amber-500 ring-4 ring-amber-500/20 text-white shadow-lg shadow-amber-500/20',
        doneBg: 'bg-amber-500 text-white',
        activeText: 'text-amber-900',
        badge: 'bg-amber-50 text-amber-700 border-amber-200'
      },
      {
        num: 3,
        title: 'Horarios',
        icon: <Clock size={15} />,
        activeBg: 'bg-purple-600 ring-4 ring-purple-600/20 text-white shadow-lg shadow-purple-500/20',
        doneBg: 'bg-purple-600 text-white',
        activeText: 'text-purple-900',
        badge: 'bg-purple-50 text-purple-700 border-purple-200'
      },
      {
        num: 4,
        title: 'Cotización',
        icon: <DollarSign size={15} />,
        activeBg: 'bg-emerald-600 ring-4 ring-emerald-600/20 text-white shadow-lg shadow-emerald-500/20',
        doneBg: 'bg-emerald-600 text-white',
        activeText: 'text-emerald-900',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      }
    ];

    return (
      <form onSubmit={handleSubmit} className="space-y-6 text-left animate-in fade-in duration-300">
        {/* STEPPER PROGRESS BAR WITH COLOR CODES */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between relative">
            {/* Base line */}
            <div className="absolute top-4 sm:top-5 left-6 right-6 h-1 bg-slate-100 rounded-full -z-0" />
            {/* Dynamic Multi-color active gradient line */}
            <div 
              className="absolute top-4 sm:top-5 left-6 h-1 bg-gradient-to-r from-blue-600 via-amber-500 via-purple-600 to-emerald-600 rounded-full transition-all duration-500 -z-0"
              style={{ width: `${((salonWizardStep - 1) / (stepColorThemes.length - 1)) * 100}%` }}
            />

            {stepColorThemes.map((s) => {
              const isDone = salonWizardStep > s.num;
              const isCurrent = salonWizardStep === s.num;
              return (
                <div key={s.num} className="relative z-10 flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (s.num < salonWizardStep) {
                        setSalonWizardStep(s.num as any);
                        setSaveError(null);
                      }
                    }}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl font-black text-xs flex items-center justify-center transition-all duration-300 ${
                      isDone
                        ? `${s.doneBg} shadow-sm hover:scale-105 cursor-pointer`
                        : isCurrent
                        ? `${s.activeBg} scale-110`
                        : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isDone ? <Check size={16} /> : s.icon}
                  </button>
                  <span className={`text-[11px] sm:text-xs mt-2 hidden xs:block tracking-tight ${
                    isCurrent ? `${s.activeText} font-black` : isDone ? 'text-slate-700 font-bold' : 'text-slate-400 font-medium'
                  }`}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* PASO 1: DATOS DEL SOLICITANTE */}
        {salonWizardStep === 1 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Tarjeta: ¿Qué hacemos aquí? */}
            <div className="bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-slate-50 border border-blue-200/80 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/60 pb-2.5">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                    <Info size={16} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-blue-950">¿Qué hacemos aquí?</h4>
                    <p className="text-[11px] text-blue-750 font-bold">Alquiler de Salón y Parqueo del Club de Leones</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleCopyPublicSalonLink}
                    className="px-3 py-1.5 bg-blue-100/80 hover:bg-blue-200/80 text-blue-900 font-extrabold rounded-xl text-[11px] flex items-center space-x-1.5 border border-blue-300/80 active:scale-95 transition-all shadow-xs cursor-pointer"
                    title="Copiar y compartir enlace directo a este formulario"
                  >
                    <Share2 size={12} className="text-blue-700" />
                    <span>Compartir Enlace</span>
                  </button>
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 border border-blue-200 hidden sm:inline-block">
                    Público General y Socios
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                En esta sección puedes solicitar el alquiler del <strong>salón de eventos y capacitaciones</strong> (con capacidad de hasta 80 personas, mesas, sillería y sanitarios) o el <strong>uso del parqueo privado</strong> (completo o por plazas asignadas). Completa los 4 pasos guiados para generar tu cotización y registrar tu reservación oficial.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-semibold text-slate-600 pt-1">
                <div className="flex items-center space-x-1.5 bg-white/80 p-2 rounded-xl border border-blue-100">
                  <CheckCircle size={13} className="text-emerald-600 flex-shrink-0" />
                  <span>Aforo: 60 sentados / 80 pie</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-white/80 p-2 rounded-xl border border-blue-100">
                  <CheckCircle size={13} className="text-blue-600 flex-shrink-0" />
                  <span>Tarifas preferenciales socios</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-white/80 p-2 rounded-xl border border-blue-100">
                  <CheckCircle size={13} className="text-amber-600 flex-shrink-0" />
                  <span>Depósito garantía reembolsable</span>
                </div>
              </div>
            </div>

            {/* Socio Badge Indicator */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
              isSocio 
                ? 'bg-blue-50 border-blue-200 text-blue-950' 
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center space-x-2">
                <ShieldCheck size={16} className={isSocio ? 'text-blue-600' : 'text-slate-400'} />
                <span>Tipo de Solicitante:</span>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                isSocio ? 'bg-blue-900 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {isSocio ? '⭐ Socio Activo (Tarifas con Descuento)' : '👤 Público General / Institución'}
              </span>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center">
                    <User size={13} className="mr-1 text-slate-400" />
                    Nombre Completo del Solicitante *
                  </label>
                  <input
                    type="text"
                    required
                    value={salonNombreSolicitante}
                    onChange={(e) => setSalonNombreSolicitante(e.target.value)}
                    placeholder="Ej: Lic. Juan Carlos Pérez"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-xs sm:text-sm font-semibold text-slate-800 bg-white shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center">
                    <Building size={13} className="mr-1 text-slate-400" />
                    Institución / Empresa / Organización
                  </label>
                  <input
                    type="text"
                    value={salonInstitucion}
                    onChange={(e) => setSalonInstitucion(e.target.value)}
                    placeholder="Ej: Colegio de Médicos / Empresa S.A."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-xs sm:text-sm font-semibold text-slate-800 bg-white shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center">
                    <Mail size={13} className="mr-1 text-slate-400" />
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={salonEmail}
                    onChange={(e) => setSalonEmail(e.target.value)}
                    placeholder="correo@leones.com"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-xs sm:text-sm font-semibold text-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center">
                    <Phone size={13} className="mr-1 text-slate-400" />
                    Número de Teléfono *
                  </label>
                  <div className="flex rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-amber-500 overflow-hidden bg-white">
                    <span className="bg-slate-100 text-slate-600 px-3.5 py-2.5 flex items-center justify-center border-r border-slate-200 text-xs font-extrabold select-none">
                      +502
                    </span>
                    <input
                      type="tel"
                      required
                      value={salonTelefonoDigitos}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 8) setSalonTelefonoDigitos(val);
                      }}
                      placeholder="54821943"
                      className="w-full px-3.5 py-2.5 outline-none text-xs sm:text-sm text-slate-800 font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASO 2: INSTALACIÓN A SOLICITAR */}
        {salonWizardStep === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start space-x-3 text-amber-900">
              <Building className="flex-shrink-0 mt-0.5 text-amber-600" size={18} />
              <div className="space-y-1">
                <p className="font-extrabold text-xs sm:text-sm text-amber-950">Paso 2: Selecciona la Instalación Requerida</p>
                <p className="text-xs text-slate-650 font-medium leading-relaxed">
                  Elige la opción que mejor se adapte a tu evento, conferencia o actividad.
                </p>
              </div>
            </div>

            {/* Interactive Option Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Option 1: Solo Salón de Eventos */}
              <div 
                onClick={() => setSalonTipoAlquiler('salon')}
                className={`p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 ${
                  salonTipoAlquiler === 'salon'
                    ? 'border-amber-500 bg-amber-50/40 shadow-md ring-2 ring-amber-500/10'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className={`p-2.5 rounded-xl ${salonTipoAlquiler === 'salon' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Building size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      Capacidad 80
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-sm">Salón de Eventos y Capacitaciones</h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Ideal para conferencias, talleres, capacitaciones y celebraciones. Incluye mesas, sillas y sanitarios.
                  </p>
                </div>

                {/* Duration toggle inside option 1 if selected */}
                {salonTipoAlquiler === 'salon' && (
                  <div className="pt-2 border-t border-amber-200/60 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider block">Duración:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSalonDuracion('4_horas')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-black transition-all ${
                          salonDuracion === '4_horas'
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-amber-50'
                        }`}
                      >
                        4 Horas ({isSocio ? 'Q0' : 'Q700'})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSalonDuracion('8_horas')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-black transition-all ${
                          salonDuracion === '8_horas'
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-amber-50'
                        }`}
                      >
                        8 Horas ({isSocio ? 'Q0' : 'Q1,200'})
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Option 2: Salón + Parqueo por Plazas (NUEVO) */}
              <div 
                onClick={() => setSalonTipoAlquiler('salon_plazas')}
                className={`p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 ${
                  salonTipoAlquiler === 'salon_plazas'
                    ? 'border-amber-500 bg-amber-50/40 shadow-md ring-2 ring-amber-500/10'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className={`p-2 rounded-xl flex items-center space-x-1 ${salonTipoAlquiler === 'salon_plazas' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Building size={16} />
                      <Car size={16} />
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Salón + Plazas
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-sm">Salón y Parqueo por Plazas</h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Salón de eventos más la cantidad exacta de plazas de parqueo que requieras para tus invitados.
                  </p>
                </div>

                {/* Duration & Plazas inside option 2 if selected */}
                {salonTipoAlquiler === 'salon_plazas' && (
                  <div className="pt-2 border-t border-amber-200/60 space-y-2.5" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider block">1. Duración Salón:</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSalonDuracion('4_horas')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-black transition-all ${
                            salonDuracion === '4_horas'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-amber-50'
                          }`}
                        >
                          4 Horas ({isSocio ? 'Q0' : 'Q700'})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSalonDuracion('8_horas')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-black transition-all ${
                            salonDuracion === '8_horas'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-amber-50'
                          }`}
                        >
                          8 Horas ({isSocio ? 'Q0' : 'Q1,200'})
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-amber-200/40">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span>2. Plazas de Parqueo:</span>
                        <span className="text-amber-900 font-black text-sm">{salonPlazasParqueo} Plazas</span>
                      </div>

                      {/* Quick Selection Buttons */}
                      <div className="flex flex-wrap gap-1">
                        {[5, 10, 15, 20].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setSalonPlazasParqueo(n)}
                            className={`px-2 py-0.5 rounded text-[10px] font-black transition-all ${
                              salonPlazasParqueo === n
                                ? 'bg-amber-500 text-white'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-amber-50'
                            }`}
                          >
                            {n} pl.
                          </button>
                        ))}
                      </div>

                      {/* Increment / Decrement & input */}
                      <div className="flex items-center space-x-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setSalonPlazasParqueo(Math.max(1, (salonPlazasParqueo || 1) - 1))}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-black text-sm flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="40"
                          value={salonPlazasParqueo}
                          onChange={(e) => setSalonPlazasParqueo(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-14 text-center py-1 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => setSalonPlazasParqueo(Math.min(40, (salonPlazasParqueo || 1) + 1))}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-black text-sm flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                        >
                          +
                        </button>
                        <span className="text-[10px] text-amber-900 font-black">× Q50.00 / plaza</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Option 3: Parqueo Completo */}
              <div 
                onClick={() => setSalonTipoAlquiler('parqueo')}
                className={`p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 ${
                  salonTipoAlquiler === 'parqueo'
                    ? 'border-amber-500 bg-amber-50/40 shadow-md ring-2 ring-amber-500/10'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className={`p-2.5 rounded-xl ${salonTipoAlquiler === 'parqueo' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Car size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      Exclusivo
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-sm">Parqueo Completo</h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Uso total del parqueo privado del club para caravanas, exposiciones o resguardo masivo.
                  </p>
                </div>
                <div className="pt-2 border-t border-amber-200/70 space-y-1 bg-amber-50/80 p-2.5 rounded-xl">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span>Tarifa Todo el Día:</span>
                    <span className="font-black text-amber-950 text-sm">Q. 1,500.00</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[11px] text-amber-900 font-medium leading-tight">
                    <Clock size={13} className="text-amber-600 flex-shrink-0" />
                    <span>Uso exclusivo del área de parqueo.</span>
                  </div>
                </div>
              </div>

              {/* Option 4: Parqueo por Plazas */}
              <div 
                onClick={() => setSalonTipoAlquiler('parqueo_plazas')}
                className={`p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 ${
                  salonTipoAlquiler === 'parqueo_plazas'
                    ? 'border-amber-500 bg-amber-50/40 shadow-md ring-2 ring-amber-500/10'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className={`p-2.5 rounded-xl ${salonTipoAlquiler === 'parqueo_plazas' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Car size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Por Espacio
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-sm">Parqueo por Plazas</h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Reserva únicamente la cantidad de plazas que necesitas para tus invitados o vehículos.
                  </p>
                </div>

                {/* Plazas Selector if selected */}
                {salonTipoAlquiler === 'parqueo_plazas' && (
                  <div className="pt-2 border-t border-amber-200/60 space-y-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Plazas a reservar:</span>
                      <span className="text-amber-900 font-black text-sm">{salonPlazasParqueo} Plazas</span>
                    </div>

                    {/* Quick Selection Buttons */}
                    <div className="flex flex-wrap gap-1.5">
                      {[5, 10, 15, 20, 25].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setSalonPlazasParqueo(n)}
                          className={`px-2 py-1 rounded-md text-[10px] font-black transition-all ${
                            salonPlazasParqueo === n
                              ? 'bg-amber-500 text-white'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-amber-50'
                          }`}
                        >
                          {n} pl.
                        </button>
                      ))}
                    </div>

                    {/* Increment / Decrement & input */}
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setSalonPlazasParqueo(Math.max(1, (salonPlazasParqueo || 1) - 1))}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-black text-base flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="40"
                        value={salonPlazasParqueo}
                        onChange={(e) => setSalonPlazasParqueo(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 text-center py-1 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => setSalonPlazasParqueo(Math.min(40, (salonPlazasParqueo || 1) + 1))}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-black text-base flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                      >
                        +
                      </button>
                      <span className="text-[11px] text-amber-900 font-black">× Q50.00 / plaza por día</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Option 5: Combo Salón y Parqueo Completo */}
              <div 
                onClick={() => setSalonTipoAlquiler('ambos')}
                className={`p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 sm:col-span-2 ${
                  salonTipoAlquiler === 'ambos'
                    ? 'border-amber-500 bg-amber-50/40 shadow-md ring-2 ring-amber-500/10'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className={`p-2.5 rounded-xl ${salonTipoAlquiler === 'ambos' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Layers size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                      Combo Total
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-sm">Salón y Parqueo Completo</h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Paquete completo con acceso exclusivo al salón y a todas las instalaciones de estacionamiento.
                  </p>
                </div>

                {/* Duration toggle inside combo if selected */}
                {salonTipoAlquiler === 'ambos' && (
                  <div className="pt-2 border-t border-amber-200/60 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider block">Duración Salón:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSalonDuracion('4_horas')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-black transition-all ${
                          salonDuracion === '4_horas'
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-amber-50'
                        }`}
                      >
                        4 Horas ({isSocio ? 'Q1,500' : 'Q2,000'})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSalonDuracion('8_horas')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-black transition-all ${
                          salonDuracion === '8_horas'
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-amber-50'
                        }`}
                      >
                        8 Horas ({isSocio ? 'Q1,500' : 'Q2,500'})
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PASO 3: HORARIOS, FECHA Y ASISTENTES */}
        {salonWizardStep === 3 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start space-x-3 text-amber-900">
              <Clock className="flex-shrink-0 mt-0.5 text-amber-600" size={18} />
              <div className="space-y-1">
                <p className="font-extrabold text-xs sm:text-sm text-amber-950">Paso 3: Actividad, Horarios y Fecha</p>
                <p className="text-xs text-slate-650 font-medium leading-relaxed">
                  Indica el nombre de la actividad, la fecha requerida, el rango de horas y los asistentes estimados.
                </p>
              </div>
            </div>

            {/* Nombre de la Actividad / Evento */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center">
                <Sparkles size={13} className="mr-1 text-amber-600" />
                Nombre de la Actividad / Evento *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Seminario de Capacitación / Conferencia Médica / Evento Familiar"
                value={salonNombreActividad}
                onChange={(e) => setSalonNombreActividad(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-xs sm:text-sm font-semibold text-slate-800 bg-white shadow-2xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center">
                  <Calendar size={13} className="mr-1 text-slate-400" />
                  Día del Evento *
                </label>
                <input
                  type="date"
                  required
                  value={salonDia}
                  onChange={(e) => setSalonDia(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-xs sm:text-sm font-semibold text-slate-800 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center">
                  <Clock size={13} className="mr-1 text-slate-400" />
                  Hora de Inicio *
                </label>
                <input
                  type="time"
                  required
                  value={salonHoraInicio}
                  onChange={(e) => setSalonHoraInicio(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-xs sm:text-sm font-semibold text-slate-800 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center">
                  <Clock size={13} className="mr-1 text-slate-400" />
                  Hora de Finalización *
                </label>
                <input
                  type="time"
                  required
                  value={salonHoraFin}
                  onChange={(e) => setSalonHoraFin(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-xs sm:text-sm font-semibold text-slate-800 bg-white"
                />
              </div>
            </div>

            {/* Asistentes Estimados con Visualizador */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center">
                <Users size={13} className="mr-1 text-slate-400" />
                Asistentes Estimados *
              </label>
              <input
                type="number"
                required
                placeholder="Cantidad estimada de asistentes"
                value={salonAsistentes}
                onChange={(e) => setSalonAsistentes(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-xs sm:text-sm font-semibold text-slate-800 bg-white"
              />

              {/* Live Capacity Feedback */}
              {salonAsistentes && parseInt(salonAsistentes) > 0 && (
                <div>
                  {parseInt(salonAsistentes) <= 60 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-800 font-bold flex items-center space-x-2">
                      <CheckCircle size={14} className="text-emerald-600 flex-shrink-0" />
                      <span>Capacidad óptima: Todos los asistentes sentados con mobiliario (máx. 60).</span>
                    </div>
                  )}

                  {isCapacityWarning && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-800 font-bold flex items-center space-x-2">
                      <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
                      <span>Aforo extendido (61-80): Se requiere acomodación tipo auditorio o de pie.</span>
                    </div>
                  )}

                  {isCapacityError && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-xs text-rose-800 font-bold flex items-center space-x-2">
                      <XOctagon size={14} className="text-rose-600 flex-shrink-0" />
                      <span>Capacidad máxima superada: El aforo máximo de seguridad del salón es de 80 personas.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Condición y Depósito de Garantía Recordatorio */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-650 space-y-1.5 font-medium">
              <p className="font-bold text-slate-800 flex items-center">
                <ShieldCheck size={14} className="mr-1 text-amber-600" />
                Normativa de Horarios y Permanencia
              </p>
              <p>
                Los horarios reservados deben incluir el tiempo de montaje y desmontaje. El Club requiere un <strong>depósito de garantía reembolsable de Q. 500.00</strong> contra daños al momento de la firma física.
              </p>
            </div>
          </div>
        )}

        {/* PASO 4: PRECIOS TOTALES, EXONERACIONES Y LIMPIEZA */}
        {salonWizardStep === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start space-x-3 text-amber-900">
              <DollarSign className="flex-shrink-0 mt-0.5 text-amber-600" size={18} />
              <div className="space-y-1">
                <p className="font-extrabold text-xs sm:text-sm text-amber-950">Paso 4: Cotización, Exoneraciones y Limpieza</p>
                <p className="text-xs text-slate-650 font-medium leading-relaxed">
                  Revisa el desglose estimado de costos, selecciona el servicio de limpieza y confirma tu reservación.
                </p>
              </div>
            </div>

            {/* Opciones de Limpieza */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Compromiso de Limpieza Posterior al Evento *
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div
                  onClick={() => setSalonCompromisoLimpieza('dejar_limpio')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                    salonCompromisoLimpieza === 'dejar_limpio'
                      ? 'border-emerald-500 bg-emerald-50/40 shadow-sm ring-2 ring-emerald-500/10'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-2 rounded-xl ${salonCompromisoLimpieza === 'dejar_limpio' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <CheckCircle size={16} />
                    </div>
                    <div>
                      <h5 className="text-xs font-extrabold text-slate-800">Limpieza Voluntaria</h5>
                      <span className="text-[10px] font-black text-emerald-700 uppercase">Q. 0.00 Adicional</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-snug">
                    El solicitante se compromete a entregar las instalaciones totalmente limpias y ordenadas al finalizar.
                  </p>
                </div>

                <div
                  onClick={() => setSalonCompromisoLimpieza('pagar_limpieza')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                    salonCompromisoLimpieza === 'pagar_limpieza'
                      ? 'border-amber-500 bg-amber-50/40 shadow-sm ring-2 ring-amber-500/10'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-2 rounded-xl ${salonCompromisoLimpieza === 'pagar_limpieza' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h5 className="text-xs font-extrabold text-slate-800">Servicio de Limpieza</h5>
                      <span className="text-[10px] font-black text-amber-800 uppercase">+ Q. 300.00</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-snug">
                    El personal del Club se encargará de la limpieza integral del salón y áreas utilizadas tras tu evento.
                  </p>
                </div>
              </div>
            </div>

            {/* Exoneración Especial Card - Máxima Visibilidad y Claridad */}
            <div className={`p-5 sm:p-6 rounded-3xl border-2 transition-all duration-300 ${
              salonExoneracion 
                ? 'bg-gradient-to-br from-amber-500/15 via-amber-50 to-orange-50/60 border-amber-500 shadow-lg ring-2 ring-amber-400/20' 
                : 'bg-slate-50 border-slate-200 hover:border-amber-300'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-2 rounded-xl transition-colors ${salonExoneracion ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-200 text-slate-700'}`}>
                      <ShieldCheck size={22} />
                    </div>
                    <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      ¿Aplica Exoneración Especial de Alquiler?
                    </span>
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 hidden sm:inline-block">
                      Solo Salón
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed max-w-xl sm:pl-10">
                    Aplica únicamente para convenios interinstitucionales, alianzas de servicio, causas benéficas o acuerdos aprobados por la Junta Directiva.
                  </p>
                  <p className="text-[11px] sm:text-xs text-amber-900 font-bold sm:pl-10">
                    ℹ️ <strong>Importante:</strong> La exoneración especial aplica únicamente al valor del Salón de Eventos y Capacitaciones. Los rubros de parqueo y limpieza mantienen su tarifa reglamentaria.
                  </p>
                </div>

                <label className="flex items-center space-x-3 cursor-pointer select-none self-start sm:self-center bg-white px-5 py-3 rounded-2xl border-2 border-amber-300 shadow-md hover:bg-amber-50 transition-all ring-2 ring-amber-400/10">
                  <input
                    type="checkbox"
                    checked={salonExoneracion}
                    onChange={(e) => setSalonExoneracion(e.target.checked)}
                    className="w-6 h-6 text-amber-600 rounded-lg border-2 border-amber-400 focus:ring-amber-500 cursor-pointer"
                  />
                  <span className={`text-xs sm:text-sm font-black tracking-wide ${salonExoneracion ? 'text-amber-900' : 'text-slate-700'}`}>
                    {salonExoneracion ? '✓ EXONERACIÓN APLICADA' : 'APLICAR EXONERACIÓN'}
                  </span>
                </label>
              </div>

              {salonExoneracion && (
                <div className="mt-4 pt-4 border-t border-amber-200/80 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-xs font-black text-amber-950 uppercase tracking-wider">
                    Motivo o Referencia Oficial de Exoneración *
                  </label>
                  <input
                    type="text"
                    required={salonExoneracion}
                    value={salonMotivoExoneracion}
                    onChange={(e) => setSalonMotivoExoneracion(e.target.value)}
                    placeholder="Ej: Convenio Educativo, Actividad Benéfica Comunal, Autorización Acta de Junta Directiva..."
                    className="w-full px-4 py-2.5 border-2 border-amber-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none placeholder:text-slate-400 shadow-xs"
                  />
                  <p className="text-[11px] text-amber-900 font-semibold flex items-center space-x-1">
                    <Info size={13} className="text-amber-600 flex-shrink-0" />
                    <span>La exoneración será validada y aprobada internamente por Presidencia y Secretaría.</span>
                  </p>
                </div>
              )}
            </div>

            {/* Desglose de Cotización Final */}
            <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-5 rounded-2xl shadow-xl space-y-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 border-b border-white/10 pb-2">
                Resumen de Cotización Oficial
              </div>
              
              <div className="space-y-1.5 text-xs text-white/80">
                {salonNombreActividad && (
                  <div className="flex justify-between pb-1 mb-1 border-b border-white/10">
                    <span className="text-amber-200 font-bold">Actividad / Evento:</span>
                    <span className="font-extrabold text-white text-right max-w-[220px] truncate">{salonNombreActividad}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Instalación ({
                    salonTipoAlquiler === 'salon' ? `Salón ${salonDuracion === '8_horas' ? '8 Horas' : '4 Horas'}` :
                    salonTipoAlquiler === 'salon_plazas' ? `Salón (${salonDuracion === '8_horas' ? '8h' : '4h'}) + ${salonPlazasParqueo || 1} Plazas` :
                    salonTipoAlquiler === 'parqueo' ? 'Parqueo Completo (Todo el Día)' :
                    salonTipoAlquiler === 'parqueo_plazas' ? `${salonPlazasParqueo || 1} Plazas de Parqueo` :
                    `Salón (${salonDuracion === '8_horas' ? '8h' : '4h'}) + Parqueo Completo`
                  }):</span>
                  <span className="font-bold text-white">
                    {salonTipoAlquiler === 'salon' && (salonExoneracion || isSocio) ? 'Exonerado (Q0.00)' :
                     salonTipoAlquiler === 'salon_plazas' && (salonExoneracion || isSocio) ? `Salón Exonerado + Plazas (Q.${(salonPlazasParqueo || 1) * 50}.00)` :
                     salonTipoAlquiler === 'ambos' && (salonExoneracion || isSocio) ? 'Salón Exonerado + Parqueo (Q1,500.00)' :
                     `Q.${
                      salonTipoAlquiler === 'salon' ? (salonDuracion === '4_horas' ? 700 : 1200) :
                      salonTipoAlquiler === 'salon_plazas' ? ((salonDuracion === '4_horas' ? 700 : 1200) + (salonPlazasParqueo || 1) * 50) :
                      salonTipoAlquiler === 'parqueo' ? 1500 :
                      salonTipoAlquiler === 'parqueo_plazas' ? ((salonPlazasParqueo || 1) * 50) :
                      (salonDuracion === '4_horas' ? 2000 : 2500)
                    }.00`}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Servicio de Limpieza:</span>
                  <span className="font-bold text-white">Q.{salonCompromisoLimpieza === 'pagar_limpieza' ? 300 : 0}.00</span>
                </div>

                <div className="flex justify-between text-[11px] text-white/60">
                  <span>Depósito de Garantía (Reembolsable):</span>
                  <span>Q. 500.00</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-between items-baseline">
                <span className="font-extrabold text-sm text-amber-300">Total Estimado:</span>
                <span className="font-black text-2xl text-amber-400 tracking-tight">Q.{salonCostoTotal}.00</span>
              </div>
            </div>

            {/* Checkbox Requisitos */}
            <label className="flex items-start space-x-2.5 cursor-pointer pt-1 select-none">
              <input
                type="checkbox"
                required
                checked={salonRequisitosAceptados}
                onChange={(e) => setSalonRequisitosAceptados(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-xs text-slate-700 font-semibold leading-tight">
                He leído y acepto el reglamento de uso de las instalaciones, políticas de horario y depósito de garantía del Club de Leones de Quetzaltenango.
              </span>
            </label>
          </div>
        )}

        {/* NAVIGATION BUTTONS */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
          <div>
            {salonWizardStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors text-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <ChevronLeft size={16} />
                <span>Atrás</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-500 font-bold hover:bg-slate-50 transition-colors text-xs cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>

          <div>
            {salonWizardStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl shadow-md transition-all text-xs flex items-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <span>Siguiente</span>
                <ChevronRight size={16} />
              </button>
            ) : salonCostoTotal > 0 ? (
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                <button
                  type="button"
                  disabled={isSaving || isRedirectingPayment || !salonRequisitosAceptados || isCapacityError || (salonExoneracion && !salonMotivoExoneracion.trim())}
                  onClick={() => handleSalonFinalSubmit('transferencia')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold rounded-xl transition-all text-xs flex items-center justify-center space-x-1.5 cursor-pointer border border-slate-200 shadow-xs active:scale-95"
                >
                  <Clock size={14} className="text-slate-500" />
                  <span>Pagar más tarde (Solo apartar)</span>
                </button>

                <button
                  type="button"
                  disabled={isSaving || isRedirectingPayment || !salonRequisitosAceptados || isCapacityError || (salonExoneracion && !salonMotivoExoneracion.trim())}
                  onClick={() => handleSalonFinalSubmit('recurrente')}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 hover:from-blue-800 hover:to-indigo-850 disabled:opacity-50 text-white font-black rounded-xl shadow-lg transition-all text-xs sm:text-sm flex items-center justify-center space-x-2 cursor-pointer active:scale-95 border border-amber-400/30"
                >
                  {isRedirectingPayment ? (
                    <>
                      <RefreshCw size={15} className="animate-spin text-amber-400" />
                      <span>Conectando con Recurrente GT...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard size={16} className="text-amber-400" />
                      <span>Realizar Pago en Línea Q{salonCostoTotal}.00 (Recurrente GT)</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={isSaving || !salonRequisitosAceptados || isCapacityError || (salonExoneracion && !salonMotivoExoneracion.trim())}
                onClick={() => handleSalonFinalSubmit('exonerado')}
                className="px-7 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black rounded-xl shadow-lg transition-all text-xs sm:text-sm flex items-center space-x-2 cursor-pointer active:scale-95"
              >
                {isSaving ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Confirmar Reservación (Q0.00)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    );
  };

  const renderCartasForm = () => {
    return (
      <div className="space-y-8 w-full text-left">
        {/* Formulario */}
        <div className="space-y-6 w-full">
          <div className="space-y-5">
            {/* Fecha y Asunto */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Fecha de la Carta
                </label>
                <input
                  type="date"
                  value={cartaFecha}
                  onChange={(e) => setCartaFecha(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 bg-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Asunto de la Carta
                </label>
                <input
                  type="text"
                  placeholder="Asunto principal del documento"
                  value={cartaAsunto}
                  onChange={(e) => setCartaAsunto(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 bg-white"
                />
              </div>
            </div>

            {/* Destinatario Details */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center">
                <User size={14} className="mr-1.5 text-slate-450" />
                Información del Destinatario
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Nombre de la Persona
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre y título"
                    value={cartaDestinatario}
                    onChange={(e) => setCartaDestinatario(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Cargo / Puesto
                  </label>
                  <input
                    type="text"
                    placeholder="Cargo o puesto"
                    value={cartaCargo}
                    onChange={(e) => setCartaCargo(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Institución / Organización
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre de la institución"
                    value={cartaInstitucion}
                    onChange={(e) => setCartaInstitucion(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Saludo */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Saludo Inicial
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={cartaSaludo.startsWith('Estimado') || cartaSaludo.startsWith('Respetable') ? cartaSaludo : 'personalizado'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val !== 'personalizado') {
                      setCartaSaludo(val);
                    } else {
                      setCartaSaludo('');
                    }
                  }}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none w-full sm:w-auto focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                >
                  <option value="Estimados señores:">Estimados señores:</option>
                  <option value="Estimado señor director:">Estimado señor director:</option>
                  <option value="Estimado/a señor/a:">Estimado/a señor/a:</option>
                  <option value="Respetables miembros de la Junta Directiva:">Respetables miembros:</option>
                  <option value="personalizado">Personalizado...</option>
                </select>
                <input
                  type="text"
                  placeholder="Redacte saludo personalizado..."
                  value={cartaSaludo}
                  onChange={(e) => setCartaSaludo(e.target.value)}
                  className="flex-grow px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 bg-white transition-all w-full"
                />
              </div>
            </div>

            {/* Cuerpo de la Carta */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex justify-between">
                <span>Cuerpo de la Carta</span>
                <span className="text-[10px] text-slate-400 font-normal">Use Enter para separar párrafos</span>
              </label>
              <textarea
                rows={8}
                placeholder="Redacte aquí el contenido principal de la carta..."
                value={cartaCuerpo}
                onChange={(e) => setCartaCuerpo(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 bg-white transition-all resize-y"
              />
            </div>

            {/* Bloque de Firma y Autoría */}
            <div className="space-y-4 pt-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center">
                <Mail size={14} className="mr-1.5 text-slate-450" />
                Bloque de Firma y Autoría
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Selector de Rol */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Rol del Firmante
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFirmanteSelector('presidente')}
                      className={`text-[10px] font-black uppercase tracking-wider py-2.5 rounded-xl border transition-all truncate px-1 ${
                        firmanteSelector === 'presidente'
                          ? 'bg-blue-900 border-blue-900 text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Presidente
                    </button>
                    <button
                      type="button"
                      onClick={() => setFirmanteSelector('secretario')}
                      className={`text-[10px] font-black uppercase tracking-wider py-2.5 rounded-xl border transition-all truncate px-1 ${
                        firmanteSelector === 'secretario'
                          ? 'bg-blue-900 border-blue-900 text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Secretario
                    </button>
                    <button
                      type="button"
                      onClick={() => setFirmanteSelector('personalizado')}
                      className={`text-[10px] font-black uppercase tracking-wider py-2.5 rounded-xl border transition-all truncate px-1 ${
                        firmanteSelector === 'personalizado'
                          ? 'bg-blue-900 border-blue-900 text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Personalizado
                    </button>
                  </div>
                </div>

                {/* Firma Digital PNG */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex justify-between items-center">
                    <span>Firma Digital (.png transparente)</span>
                    {cartaFirmaImg && (
                      <button
                        type="button"
                        onClick={handleClearFirma}
                        className="text-red-500 hover:text-red-700 font-extrabold text-[9px]"
                      >
                        Eliminar firma
                      </button>
                    )}
                  </label>
                  
                  {cartaFirmaImg ? (
                    <div className="flex items-center space-x-3 bg-white p-2 rounded-xl border border-slate-200 h-[42px]">
                      <img src={cartaFirmaImg} alt="Firma cargada" className="h-8 w-20 object-contain bg-slate-50 rounded p-1 border border-slate-100" />
                      <span className="text-xs text-slate-500 font-semibold truncate flex-grow">Firma cargada</span>
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept="image/png"
                      onChange={handleFirmaUpload}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-900 hover:file:bg-blue-100 transition-all cursor-pointer h-[42px] flex items-center"
                    />
                  )}
                </div>
              </div>

              {/* Campos personalizados */}
              {firmanteSelector === 'personalizado' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 animate-in slide-in-from-top-1 duration-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">
                      Nombre del Firmante
                    </label>
                    <input
                      type="text"
                      value={cartaFirmaNombre}
                      onChange={(e) => setCartaFirmaNombre(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">
                      Puesto del Firmante
                    </label>
                    <input
                      type="text"
                      value={cartaFirmaPuesto}
                      onChange={(e) => setCartaFirmaPuesto(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botones de Acción del Formulario */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                generateCartaOficialPDF({
                  fecha: cartaFecha,
                  institucion: cartaInstitucion,
                  destinatario: cartaDestinatario,
                  cargo: cartaCargo,
                  saludo: cartaSaludo,
                  asunto: cartaAsunto,
                  cuerpo: cartaCuerpo,
                  firmaNombre: cartaFirmaNombre,
                  firmaPuesto: cartaFirmaPuesto,
                  firmaImg: cartaFirmaImg
                }, 'download');
              }}
              disabled={!cartaDestinatario.trim() || !cartaCuerpo.trim()}
              className="sm:col-span-4 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-extrabold px-4 py-3 rounded-xl transition-all shadow-md shadow-blue-900/10 flex items-center justify-center space-x-2 text-sm active:scale-[0.98]"
            >
              <FileText size={16} />
              <span>Descargar PDF</span>
            </button>
            
            <button
              type="button"
              onClick={() => {
                generateCartaOficialPDF({
                  fecha: cartaFecha,
                  institucion: cartaInstitucion,
                  destinatario: cartaDestinatario,
                  cargo: cartaCargo,
                  saludo: cartaSaludo,
                  asunto: cartaAsunto,
                  cuerpo: cartaCuerpo,
                  firmaNombre: cartaFirmaNombre,
                  firmaPuesto: cartaFirmaPuesto,
                  firmaImg: cartaFirmaImg
                }, 'open');
              }}
              disabled={!cartaDestinatario.trim() || !cartaCuerpo.trim()}
              className="sm:col-span-3 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:bg-slate-50 disabled:text-slate-350 disabled:cursor-not-allowed font-extrabold px-4 py-3 rounded-xl transition-all border border-slate-200 flex items-center justify-center space-x-2 text-sm active:scale-[0.98]"
              title="Abrir Vista de Impresión"
            >
              <span>Previsualizar</span>
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              className="sm:col-span-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold px-4 py-3 rounded-xl transition-all border border-slate-200 flex items-center justify-center space-x-2 text-sm active:scale-[0.98]"
              title="Guardar Borrador en este navegador"
            >
              <Save size={16} className="text-slate-655" />
              <span>Guardar Borrador</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const formattedDate = formatFechaCarta(cartaFecha);
                const textToCopy = `${formattedDate}

${cartaDestinatario}
${cartaCargo}
${cartaInstitucion}
Presente.

ASUNTO: ${cartaAsunto.toUpperCase()}

${cartaSaludo}

${cartaCuerpo}

Atentamente,

${cartaFirmaNombre}
${cartaFirmaPuesto}
Club de Leones de Quetzaltenango`;
                navigator.clipboard.writeText(textToCopy).catch(() => {});
                alert("Texto copiado al portapapeles. Listo para pegar en Google Docs.");
              }}
              disabled={!cartaCuerpo.trim()}
              className="sm:col-span-2 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:bg-slate-50 disabled:text-slate-350 disabled:cursor-not-allowed font-extrabold px-3 py-3 rounded-xl transition-all border border-slate-200 flex items-center justify-center active:scale-[0.98]"
              title="Copiar texto para pegar en Google Docs"
            >
              <Copy size={16} />
            </button>
          </div>

          {/* Listado de Borradores Guardados */}
          {drafts.length > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <h4 className="text-xs font-black text-slate-450 uppercase tracking-widest flex items-center">
                <Save size={12} className="mr-1.5 text-slate-400" />
                Borradores Guardados ({drafts.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {drafts.map(d => (
                  <div key={d.id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs hover:border-slate-300 transition-all">
                    <div className="min-w-0 flex-1 mr-2 cursor-pointer text-left" onClick={() => loadDraft(d)}>
                      <p className="font-extrabold text-slate-700 truncate">{d.destinatario || '(Sin destinatario)'}</p>
                      <p className="text-[10px] text-slate-450 font-semibold truncate mt-0.5">{d.asunto || '(Sin asunto)'} - {formatDisplayDate(d.fecha)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteDraft(d.id)}
                      className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                      title="Eliminar borrador"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Vista Previa En Vivo (Live Preview) */}
        <div className="bg-slate-100/50 rounded-3xl border border-slate-200/60 p-4 sm:p-6 space-y-6 w-full overflow-hidden">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">
            Vista Previa en Tiempo Real (US Letter)
          </h3>
          
          {(() => {
            const { page1Elements, page2Elements, hasPage2 } = getSimulatedPages();
            
            const renderParagraph = (text: string) => {
              const isBullet = text.startsWith('•') || text.startsWith('-') || text.startsWith('*');
              const isNumbered = /^\d+\./.test(text);

              if (isBullet) {
                const bulletText = text.replace(/^[•\-\*]\s*/, '');
                return (
                  <div className="flex items-start space-x-2 pl-4 text-justify my-1">
                    <span className="font-bold text-blue-900">•</span>
                    <span className="flex-1 text-xs sm:text-[13px] leading-relaxed">{bulletText}</span>
                  </div>
                );
              } else if (isNumbered) {
                const match = text.match(/^(\d+\.)\s*(.*)/);
                const numberPrefix = match ? match[1] : '1.';
                const numberText = match ? match[2] : text;
                return (
                  <div className="flex items-start space-x-2 pl-4 text-justify my-1">
                    <span className="font-bold text-blue-900">{numberPrefix}</span>
                    <span className="flex-1 text-xs sm:text-[13px] leading-relaxed">{numberText}</span>
                  </div>
                );
              } else if (text === '') {
                return <div className="h-2"></div>;
              } else {
                return <p className="text-justify my-1.5 leading-relaxed text-xs sm:text-[13px]">{text}</p>;
              }
            };

            const renderSignatureBlock = () => {
              return (
                <div className="pt-6 space-y-4 text-left">
                  <div className="space-y-1">
                    <p className="text-slate-500 text-[10px] sm:text-xs italic">Atentamente,</p>
                    {cartaFirmaImg && (
                      <div className="my-2 relative group w-28 h-12">
                        <img src={cartaFirmaImg} alt="Firma Digital" className="h-full object-contain" />
                        <button
                          type="button"
                          onClick={handleClearFirma}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Quitar firma"
                        >
                          <X size={8} />
                        </button>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-100 max-w-[220px]">
                      <p className="font-sans font-bold text-[10px] sm:text-xs text-blue-900 leading-tight">{cartaFirmaNombre}</p>
                      <p className="font-sans text-[8px] sm:text-[9px] text-slate-400 font-semibold leading-tight">{cartaFirmaPuesto}</p>
                    </div>
                  </div>

                  {/* Sello Oficial */}
                  <div className="flex justify-center pt-2">
                    <div className="border border-dashed border-amber-600/60 rounded px-4 py-1 text-[8px] font-sans font-bold text-amber-600 tracking-wider bg-amber-50/50">
                      SELLO OFICIAL - CLUB DE LEONES QX
                    </div>
                  </div>
                </div>
              );
            };

            return (
              <div className="space-y-6 w-full">
                
                {/* Página 1 */}
                <div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-6 sm:p-12 aspect-[8.5/11] w-full max-w-[680px] mx-auto flex flex-col justify-between font-serif text-slate-800 relative overflow-hidden text-[11px] sm:text-xs text-left">
                  <div className="absolute top-0 left-0 right-0">
                    <div className="bg-blue-900 h-3 w-full"></div>
                    <div className="bg-yellow-500 h-0.5 w-full"></div>
                  </div>

                  <div className="space-y-4">
                    {/* Membrete del Club */}
                    <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 mt-2">
                      <img 
                        src="/images/logo.png"
                        alt="Logo Club de Leones"
                        className="w-10 h-10 object-contain flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%231b365d"/><circle cx="50" cy="50" r="41" fill="none" stroke="%23eab308" stroke-width="3"/><text x="50" y="65" font-family="Helvetica" font-weight="bold" font-size="45" fill="%23eab308" text-anchor="middle">L</text></svg>';
                        }}
                      />
                      <div>
                        <h4 className="text-blue-900 font-sans font-black text-[9px] sm:text-[10px] tracking-tight leading-none">
                          CLUB DE LEONES DE QUETZALTENANGO
                        </h4>
                        <p className="text-amber-600 font-sans font-black text-[7px] sm:text-[8px] tracking-wider mt-0.5">
                          NOSOTROS SERVIMOS
                        </p>
                      </div>
                    </div>

                    {/* Fecha */}
                    <div className="text-right text-slate-500 text-[10px] italic font-sans">
                      {cartaFecha ? formatFechaCarta(cartaFecha) : '...'}
                    </div>

                    {/* Destinatario */}
                    <div className="space-y-0.5 leading-snug">
                      <p className="font-bold text-blue-900">{cartaDestinatario || '[Nombre del Destinatario]'}</p>
                      <p className="text-slate-550 italic font-sans text-[10px]">{cartaCargo || '[Cargo/Puesto]'}</p>
                      <p className="font-bold text-slate-700">{cartaInstitucion || '[Institución/Empresa]'}</p>
                      <p className="text-slate-400">Presente.</p>
                    </div>

                    {/* Asunto */}
                    {cartaAsunto && (
                      <div className="font-sans font-black text-[10px] text-blue-950 bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                        ASUNTO: {cartaAsunto.toUpperCase()}
                      </div>
                    )}

                    {/* Saludo */}
                    <div className="text-slate-655 font-semibold">
                      {cartaSaludo || '[Saludo Inicial]'}
                    </div>

                    {/* Cuerpo */}
                    <div className="text-slate-700 space-y-1.5">
                      {page1Elements.map((elem, idx) => {
                        if (elem.type === 'paragraph') {
                          return renderParagraph(elem.text);
                        } else if (elem.type === 'signature') {
                          return renderSignatureBlock();
                        }
                        return null;
                      })}
                    </div>
                  </div>

                  {/* Pie de Página */}
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[8px] sm:text-[9px] text-slate-400 font-sans font-semibold mt-4">
                    <span>Nosotros Servimos - Lions Clubs International</span>
                    <span>Página 1 de {hasPage2 ? '2' : '1'}</span>
                  </div>
                </div>

                {/* Página 2 (Opcional) */}
                {hasPage2 && (
                  <div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-6 sm:p-12 aspect-[8.5/11] w-full max-w-[680px] mx-auto flex flex-col justify-between font-serif text-slate-800 relative overflow-hidden text-[11px] sm:text-xs text-left animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="absolute top-0 left-0 right-0">
                      <div className="bg-blue-900 h-2.5 w-full"></div>
                      <div className="bg-yellow-500 h-0.5 w-full"></div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-[9px] text-slate-400 font-sans font-bold pb-2 border-b border-slate-100 mt-2">
                        <span>Carta Oficial - Página 2</span>
                      </div>

                      {/* Cuerpo Página 2 */}
                      <div className="text-slate-700 space-y-1.5">
                        {page2Elements.map((elem, idx) => {
                          if (elem.type === 'paragraph') {
                            return renderParagraph(elem.text);
                          } else if (elem.type === 'signature') {
                            return renderSignatureBlock();
                          }
                          return null;
                        })}
                      </div>
                    </div>

                    {/* Pie de Página */}
                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[8px] sm:text-[9px] text-slate-400 font-sans font-semibold mt-4">
                      <span>Nosotros Servimos - Lions Clubs International</span>
                      <span>Página 2 de 2</span>
                    </div>
                  </div>
                )}

              </div>
            );
          })()}
        </div>
      </div>
    );
  };

  const renderSuccessBlock = () => (
    <div className="text-center py-8 space-y-6 animate-in zoom-in-95 duration-300">
      <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-emerald-600 border-4 border-emerald-100 shadow-sm">
        <CheckCircle size={40} />
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-slate-800">¡Registro Exitoso!</h3>
        <p className="text-slate-600 text-sm font-semibold max-w-md mx-auto leading-relaxed">
          Tu solicitud ha sido enviada directamente a la Presidencia del Club. Guarda el siguiente código único para consultar su estado en tiempo real:
        </p>
      </div>
      
      {createdSolicitudId && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-w-md mx-auto flex items-center justify-between shadow-inner">
          <div className="text-left">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Código de Seguimiento</span>
            <span className="text-base font-mono font-bold text-blue-900 select-all block mt-0.5">{createdSolicitudId}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(createdSolicitudId).catch(() => {});
              alert("Código copiado al portapapeles.");
            }}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center space-x-1.5 cursor-pointer"
          >
            <Copy size={14} />
            <span>Copiar código</span>
          </button>
        </div>
      )}

      {createdSolicitudCheckoutUrl && (
        <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white p-5 rounded-2xl max-w-md mx-auto space-y-3 shadow-xl text-left border border-amber-400/30">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-black">
              <CreditCard size={18} />
            </div>
            <div>
              <h4 className="text-sm font-black tracking-tight text-white">Pasarela de Pago Recurrente GT</h4>
              <p className="text-[11px] text-amber-300 font-semibold">Pago 100% seguro con tarjeta de crédito/débito</p>
            </div>
          </div>
          <p className="text-xs text-blue-100/90 font-medium leading-relaxed">
            Haz clic en el siguiente enlace para abrir la pasarela y formalizar tu pago de reservación:
          </p>
          <a
            href={createdSolicitudCheckoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Ir a Pasarela Recurrente GT</span>
            <ExternalLink size={15} />
          </a>
        </div>
      )}

      <div className="pt-4 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            setSaveSuccess(false);
            setCreatedSolicitudId('');
            setSalonWizardStep(1);
          }}
          className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer"
        >
          Crear otra solicitud
        </button>
        {activeTab && (
          <button
            type="button"
            onClick={() => {
              setSaveSuccess(false);
              setTabMode(activeTab, 'list');
            }}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs transition-all cursor-pointer"
          >
            Ver solicitudes registradas
          </button>
        )}
      </div>
    </div>
  );

  const renderSillasForm = () => (
    <form onSubmit={handleSubmit} className="space-y-5 text-left animate-in fade-in duration-300">
      {/* Solidarity Note */}
      <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-5 flex items-start space-x-3 text-blue-900 text-xs md:text-sm shadow-xs">
        <Heart className="flex-shrink-0 text-amber-500 fill-amber-500 mt-0.5 animate-pulse" size={18} />
        <div className="space-y-1">
          <p className="font-extrabold text-blue-950 text-sm">💡 Nota de Solidaridad y Compromiso</p>
          <p className="leading-relaxed font-medium text-slate-700">
            Las sillas de ruedas se entregan en calidad de <strong>préstamo temporal</strong>. Para que este beneficio siga activo y ayude a más personas, <strong>te solicitamos amablemente que devuelvas la silla al Club</strong> una vez que el beneficiario ya no la requiera.
          </p>
        </div>
      </div>

      {/* Section: Applicant Details */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center">
          <User size={14} className="mr-1.5 text-slate-400" />
          Datos del Solicitante (Responsable del compromiso)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Nombre Completo *
            </label>
            <input
              type="text"
              required
              value={nombreSolicitante}
              onChange={(e) => setNombreSolicitante(e.target.value)}
              placeholder="Nombre completo"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Número de DPI *
            </label>
            <input
              type="text"
              required
              value={dpiSolicitante}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                if (val.length <= 13) setDpiSolicitante(val);
              }}
              placeholder="CUI / DPI (13 dígitos)"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 bg-white"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Número de Teléfono *
          </label>
          <div className="flex rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-900 focus-within:border-transparent overflow-hidden bg-white">
            <span className="bg-slate-100 text-slate-500 px-4 py-3 flex items-center justify-center border-r border-slate-200 text-sm font-extrabold select-none">
              +502
            </span>
            <input
              type="tel"
              required
              value={telefonoSolicitante}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                if (val.length <= 8) setTelefonoSolicitante(val);
              }}
              placeholder="Teléfono de 8 dígitos"
              className="w-full px-4 py-2.5 outline-none text-sm text-slate-800 font-semibold"
            />
          </div>
        </div>
      </div>

      {/* Section: Beneficiary Details */}
      <div className="space-y-4 pt-2">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center">
          <Accessibility size={14} className="mr-1.5 text-slate-400" />
          Datos del Beneficiario (Persona que usará la silla)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              ¿Para quién es la silla? (Nombre Completo) *
            </label>
            <input
              type="text"
              required
              value={nombreBeneficiario}
              onChange={(e) => setNombreBeneficiario(e.target.value)}
              placeholder="Nombre completo del beneficiario"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Edad del Beneficiario (Años) *
            </label>
            <input
              type="number"
              required
              min="0"
              max="120"
              value={edadBeneficiario}
              onChange={(e) => setEdadBeneficiario(e.target.value)}
              placeholder="Edad en años"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 bg-white"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            ¿Cuánto tiempo pretende usarla? *
          </label>
          <input
            type="text"
            required
            value={tiempoUso}
            onChange={(e) => setTiempoUso(e.target.value)}
            placeholder="Tiempo aproximado de uso (temporal o permanente)"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 bg-white"
          />
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-900/50 text-white font-black rounded-xl shadow-lg transition-all text-sm flex items-center justify-center space-x-2 cursor-pointer"
        >
          {isSaving ? (
            <>
              <div className="animate-spin text-white flex-shrink-0"><Users size={14} /></div>
              <span>Enviando...</span>
            </>
          ) : (
            <span>Enviar Solicitud de Silla</span>
          )}
        </button>
      </div>
    </form>
  );

  const renderAgendaForm = () => (
    <form onSubmit={handleSubmit} className="space-y-5 text-left animate-in fade-in duration-300">
      {/* Agenda Info Alert */}
      <div className="bg-yellow-50/60 border border-yellow-200/80 rounded-2xl p-5 flex items-start justify-between text-yellow-900 text-xs md:text-sm shadow-xs gap-3">
        <div className="flex items-start space-x-3">
          <Calendar className="flex-shrink-0 text-yellow-600 mt-0.5 animate-pulse" size={18} />
          <div className="space-y-1">
            <p className="font-extrabold text-yellow-950 text-sm">💡 Propuesta de Punto de Agenda</p>
            <p className="leading-relaxed font-medium text-slate-750">
              Puedes proponer temas, puntos a discutir o solicitudes para ser incluidos en el orden del día de las reuniones generales del club.
            </p>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Socio Solicitante *
          </label>
          <input
            type="text"
            required
            value={agendaSocioNombre}
            onChange={(e) => setAgendaSocioNombre(e.target.value)}
            placeholder="Nombre completo del socio solicitante"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Nombre del Punto *
          </label>
          <input
            type="text"
            required
            value={agendaNombrePunto}
            onChange={(e) => setAgendaNombrePunto(e.target.value)}
            placeholder="Título del tema o punto a discutir"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Contenido del Punto *
          </label>
          <textarea
            rows={3}
            required
            value={agendaContenido}
            onChange={(e) => setAgendaContenido(e.target.value)}
            placeholder="Describe el contenido o propuesta a detallar en la reunión..."
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none text-sm font-semibold resize-none text-slate-800"
          />
        </div>

        {/* Document / Image / PDF Attachment Field */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Carta, Foto o Documento Adjunto (Imagen o PDF, Máx. 10MB) - Opcional
          </label>
          <div className="border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-2xl p-4 text-center transition-all bg-slate-50/50">
            {docFileName ? (
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="p-2 bg-indigo-50 text-indigo-900 rounded-lg flex-shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-bold text-slate-800 truncate">{docFileName}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">Documento listo para enviar</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setDocDataUrl(''); setDocFileName(''); }}
                  className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                  title="Quitar archivo"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center space-y-1.5 py-2">
                <Upload size={22} className="text-indigo-400" />
                <span className="text-xs font-bold text-indigo-900">Adjuntar Carta, Contexto o Foto</span>
                <span className="text-[10px] text-slate-400">Archivos PDF, PNG, JPG o WEBP hasta 10MB</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleDocFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-900/50 text-white font-black rounded-xl shadow-lg transition-all text-sm flex items-center justify-center space-x-2 cursor-pointer"
        >
          {isSaving ? (
            <>
              <div className="animate-spin text-white flex-shrink-0"><Users size={14} /></div>
              <span>Enviando...</span>
            </>
          ) : (
            <span>Enviar Propuesta de Punto</span>
          )}
        </button>
      </div>
    </form>
  );

  const renderGeneralForm = () => (
    <form onSubmit={handleSubmit} className="space-y-5 text-left animate-in fade-in duration-300">
      {/* Request Name and Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Nombre de la Solicitud *
          </label>
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Título de la solicitud"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Fecha Sugerida / Límite *
          </label>
          <input
            type="date"
            required
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-855 bg-white"
          />
        </div>
      </div>

      {/* Theme Dropdown Cause */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Tema / Causa Global *
          </label>
          <select
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none text-sm font-semibold bg-white cursor-pointer"
          >
            {TEMAS_SOLICITUD.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {tema === 'Otra' && (
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Especificar Tema Personalizado *
            </label>
            <input
              type="text"
              required
              value={otroTemaDescripcion}
              onChange={(e) => setOtroTemaDescripcion(e.target.value)}
              placeholder="Tema personalizado"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800"
            />
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Descripción de la Solicitud *
        </label>
        <textarea
          rows={3}
          required
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Detalle los objetivos, beneficiarios esperados y justificación del proyecto..."
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none text-sm font-semibold resize-none text-slate-800"
        />
      </div>

      {/* Document / Image Attachment */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Documento o Imagen Adjunta (Opcional, Máx 10MB)
        </label>
        <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-4 text-center transition-all bg-slate-50/50">
          {docFileName ? (
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="p-2 bg-blue-50 text-blue-900 rounded-lg flex-shrink-0">
                  <FileText size={18} />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-slate-800 truncate">{docFileName}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">Documento listo para enviar</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setDocDataUrl(''); setDocFileName(''); }}
                className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                title="Quitar archivo"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center justify-center space-y-1.5 py-2">
              <Upload size={22} className="text-blue-400" />
              <span className="text-xs font-bold text-blue-900">Adjuntar Carta, Proyecto o Foto</span>
              <span className="text-[10px] text-slate-400">Archivos PDF, PNG, JPG o WEBP hasta 10MB</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleDocFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* Responsables */}
      <div className="pt-2 border-t border-slate-100 space-y-3">
        <div className="flex justify-between items-center">
          <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">
            Responsables de la Solicitud (Máx. 3) *
          </label>
          {responsables.length < 3 && (
            <button
              type="button"
              onClick={handleAddResponsable}
              className="text-xs font-black text-blue-900 hover:text-blue-750 flex items-center space-x-1 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 shadow-xs cursor-pointer"
            >
              <UserPlus size={12} />
              <span>Añadir Responsable</span>
            </button>
          )}
        </div>

        <div className="space-y-3">
          {responsables.map((resp, index) => (
            <div 
              key={index} 
              className="p-4 bg-slate-50/60 rounded-2xl border border-slate-200/80 space-y-3 relative group animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Responsable #{index + 1}
                </span>
                {responsables.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveResponsable(index)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-white cursor-pointer"
                    title="Eliminar Responsable"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Nombre Completo *"
                    value={resp.nombre}
                    onChange={(e) => handleResponsableChange(index, 'nombre', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none text-xs font-semibold"
                  />
                </div>
                <div className="flex rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-900 focus-within:border-transparent overflow-hidden bg-white">
                  <span className="bg-slate-100 text-slate-500 px-3 py-2 flex items-center justify-center border-r border-slate-200 text-xs font-extrabold select-none">
                    +502
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="Teléfono (8 dígitos) *"
                    value={resp.telefono}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 8) {
                        handleResponsableChange(index, 'telefono', val);
                      }
                    }}
                    className="w-full px-3 py-2 outline-none text-xs text-slate-800 font-semibold"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-900/50 text-white font-black rounded-xl shadow-lg transition-all text-sm flex items-center justify-center space-x-2 cursor-pointer"
        >
          {isSaving ? (
            <>
              <div className="animate-spin text-white flex-shrink-0"><Users size={14} /></div>
              <span>Enviando...</span>
            </>
          ) : (
            <span>Enviar Solicitud</span>
          )}
        </button>
      </div>
    </form>
  );

  const renderTrackingSection = (cfg: TabConfig) => (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-8 animate-in fade-in duration-300">
      <div className="max-w-xl mx-auto text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto shadow-xs">
          <Shield size={24} />
        </div>
        <h4 className="font-extrabold text-lg text-slate-900">Consulta el Estado de tu Solicitud</h4>
        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          Ingresa el código único de seguimiento generado al registrar tu solicitud para consultar su fase y resolución en tiempo real.
        </p>

        {/* Formulario de tracking */}
        <form onSubmit={(e) => handleSearchTracking(e, cfg.id as any)} className="flex items-center gap-2 max-w-md mx-auto pt-2">
          <input
            type="text"
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            placeholder="CÓDIGO (EJ. LQX-123)"
            className="flex-1 px-4 py-3 border border-slate-250 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none font-bold text-xs text-slate-800 bg-white placeholder-slate-350 text-center uppercase tracking-widest"
            maxLength={8}
          />
          <button
            type="submit"
            className={`px-6 py-3 font-extrabold rounded-xl text-xs transition-all shadow-md active:scale-95 flex items-center justify-center cursor-pointer ${
              BUTTON_CLASSES[cfg.colorTheme]
            }`}
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Mensaje de error de búsqueda */}
      {trackingError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs font-semibold flex items-start space-x-2 animate-in fade-in max-w-xl mx-auto">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-500" />
          <span>{trackingError}</span>
        </div>
      )}

      {/* Resultado de Seguimiento */}
      {searchedSolicitud && (
        <div className="bg-slate-50/70 rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Solicitante / Detalle</span>
              <span className="text-xs font-bold text-slate-750 block mt-0.5">
                {searchedSolicitud.salonInstitucion
                  ? `${searchedSolicitud.salonNombreSolicitante || searchedSolicitud.nombre} (${searchedSolicitud.salonInstitucion})`
                  : (searchedSolicitud.nombreBeneficiario || searchedSolicitud.salonNombreSolicitante || searchedSolicitud.agendaSocioNombre || searchedSolicitud.nombre)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Código Único</span>
              <span className="text-xs font-mono font-bold text-blue-900 block mt-0.5">{searchedSolicitud.id}</span>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Fecha de Envío</span>
              <span className="text-xs font-bold text-slate-755 block mt-0.5">{formatDisplayDate(searchedSolicitud.fechaCreacion)}</span>
            </div>
          </div>

          {/* Stepper del Tracking */}
          <div className="space-y-6">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center sm:text-left">Línea del Proceso</span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-2 relative pt-2">
              {(() => {
                const phases: { id: string; label: string; desc: string; icon: any }[] = [
                  { id: 'recibido', label: 'Recibido', desc: 'Ingresada con éxito', icon: CheckCircle },
                  { id: 'en_proceso', label: 'En Proceso', desc: 'Asignada a revisión', icon: Clock },
                  { id: 'en_analisis', label: 'En Análisis', desc: 'Evaluando viabilidad', icon: FileText },
                  { id: 'resolucion', label: 'Resolución', desc: 'Trámite finalizado', icon: Shield }
                ];

                const currentPhase = searchedSolicitud.faseTracking || (
                  (searchedSolicitud.estado === 'Aprobada' || searchedSolicitud.estado === 'Rechazada') 
                    ? 'resolucion' 
                    : 'recibido'
                );

                const phaseIndex = phases.findIndex(p => p.id === currentPhase);

                return phases.map((phase, idx) => {
                  const isCompleted = idx <= phaseIndex;
                  const isActive = phase.id === currentPhase;
                  const StepIcon = phase.icon;

                  return (
                    <div key={phase.id} className="flex sm:flex-col items-center text-left sm:text-center space-x-4 sm:space-x-0 space-y-0 sm:space-y-2 relative group">
                      {/* Línea conectora */}
                      {idx < phases.length - 1 && (
                        <div className="hidden sm:block absolute top-5 left-[60%] w-[80%] h-0.5 bg-slate-200 z-0">
                          <div className={`h-full transition-all duration-550 ${STEPPER_LINE_CLASSES[cfg.colorTheme]} ${
                            idx < phaseIndex ? 'w-full' : 'w-0'
                          }`} />
                        </div>
                      )}

                      {/* Círculo indicador */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 border-2 transition-all duration-300 shadow-sm ${
                        isActive ? STEPPER_CIRCLE_ACTIVE[cfg.colorTheme] + ' scale-110' :
                        isCompleted ? STEPPER_CIRCLE_COMPLETED[cfg.colorTheme] :
                        'bg-white border-slate-200 text-slate-400'
                      }`}>
                        <StepIcon size={18} />
                      </div>

                      {/* Textos del paso */}
                      <div>
                        <span className={`text-xs font-extrabold tracking-tight block ${
                          isActive ? STEPPER_TEXT_ACTIVE[cfg.colorTheme] :
                          isCompleted ? 'text-slate-800' : 'text-slate-400'
                        }`}>{phase.label}</span>
                        <span className="text-[10px] text-slate-500 font-bold block mt-0.5">{phase.desc}</span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Estado final si es fase resolución */}
          {searchedSolicitud.estado !== 'Pendiente' && (
            <div className={`p-5 rounded-2xl border text-xs font-semibold animate-in zoom-in-95 duration-300 ${
              searchedSolicitud.estado === 'Aprobada' ? 'bg-emerald-50/60 border-emerald-200 text-emerald-700' : 'bg-red-50/60 border-red-200 text-red-700'
            }`}>
              <div className="flex items-start space-x-2.5">
                <CheckCircle className="flex-shrink-0 mt-0.5" size={16} />
                <div className="space-y-1">
                  <span className="font-extrabold block text-sm">Solicitud {searchedSolicitud.estado}</span>
                  {searchedSolicitud.resolucionRazon && (
                    <p className="leading-relaxed text-slate-655 font-semibold">{searchedSolicitud.resolucionRazon}</p>
                  )}
                  {searchedSolicitud.fechaResolucion && (
                    <span className="text-[10px] text-slate-400 block font-normal mt-1.5">Fecha: {formatDisplayDate(searchedSolicitud.fechaResolucion)}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">Gestión de Solicitudes</h1>
          <p className="text-base text-slate-750 mt-1 font-medium">
            En esta sección puedes realizar solicitudes al club de forma guiada, o consultar tus trámites registrados.
          </p>
        </div>
      </header>

      {/* SISTEMA DE ACORDEONES UNIFICADO Y RESPONSIVO EN 2 COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {tabConfigs.map((cfg) => {
          const isExpanded = activeTab === cfg.id;
          
          if (!cfg.visible) return null;

          return (
            <div 
              key={cfg.id}
              className={`border rounded-3xl bg-white overflow-hidden shadow-sm transition-all duration-300 ${
                isExpanded ? `${BORDER_CLASSES[cfg.colorTheme]} lg:col-span-2 shadow-xl ring-2` : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {/* Encabezado del Acordeón */}
              <button
                type="button"
                onClick={() => {
                  if (!cfg.allowed) {
                    alert(`Esta opción está reservada para: ${cfg.audience}`);
                    return;
                  }
                  setActiveTab(activeTab === cfg.id ? null : cfg.id);
                }}
                className={`w-full px-6 py-5 flex items-center justify-between text-left transition-all cursor-pointer ${
                  !cfg.allowed ? 'bg-slate-50/50 text-slate-400 cursor-not-allowed' :
                  isExpanded ? HEADER_EXPANDED_CLASSES[cfg.colorTheme] : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-2xl transition-colors ${
                    !cfg.allowed ? 'bg-slate-100 text-slate-400' :
                    isExpanded ? ICON_EXPANDED_CLASSES[cfg.colorTheme] : ICON_COLLAPSED_CLASSES[cfg.colorTheme]
                  }`}>
                    {cfg.icon}
                  </div>
                  <div>
                    <span className="font-extrabold text-base tracking-tight block">{cfg.title}</span>
                    <span className={`text-xs ${isExpanded ? 'text-white/80' : 'text-slate-500'} font-semibold mt-0.5 block`}>
                      {cfg.subtitle}
                    </span>
                  </div>
                  {cfg.allowed && cfg.pendingCount > 0 && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse ml-2 ${
                      isExpanded ? 'bg-white/20 text-white' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {cfg.pendingCount} Pendiente{cfg.pendingCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {!cfg.allowed ? (
                    <Lock size={18} className="text-slate-350" />
                  ) : (
                    <ChevronDown 
                      size={20} 
                      className={`transform transition-transform duration-300 ${
                        isExpanded ? 'rotate-180 text-white' : 'text-slate-400'
                      }`} 
                    />
                  )}
                </div>
              </button>

              {/* Contenido Expandido del Acordeón con Formulario Integrado Directo */}
              {isExpanded && (
                <div className="p-2 sm:p-6 md:p-8 border-t border-slate-100 bg-slate-50/30 animate-in slide-in-from-top duration-300">
                  {(() => {
                    const currentMode = getTabMode(cfg.id);

                    if (cfg.id === 'cartas') {
                      return renderCartasForm();
                    }

                    if (cfg.id === 'archivo') {
                      return renderSolicitudesList('archivo');
                    }

                    return (
                      <div className="space-y-4 sm:space-y-6 w-full text-left">
                        {/* Barra de Navegación Segmentada Integrada */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
                          <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => setTabMode(cfg.id, 'form')}
                              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 sm:space-x-2 transition-all cursor-pointer flex-shrink-0 ${
                                currentMode === 'form'
                                  ? BUTTON_CLASSES[cfg.colorTheme] + ' shadow-sm'
                                  : 'text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <Plus size={14} />
                              <span>{cfg.id === 'salon' ? 'Asistente de Reservación' : cfg.actionText || 'Llenar Solicitud'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setTabMode(cfg.id, 'list')}
                              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 sm:space-x-2 transition-all cursor-pointer flex-shrink-0 ${
                                currentMode === 'list'
                                  ? BUTTON_CLASSES[cfg.colorTheme] + ' shadow-sm'
                                  : 'text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <FileText size={14} />
                              <span>Solicitudes ({counts[cfg.id as keyof typeof counts] || 0})</span>
                            </button>

                            {cfg.id !== 'agenda' && (
                              <button
                                type="button"
                                onClick={() => setTabMode(cfg.id, 'tracking')}
                                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 sm:space-x-2 transition-all cursor-pointer flex-shrink-0 ${
                                  currentMode === 'tracking'
                                    ? BUTTON_CLASSES[cfg.colorTheme] + ' shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                <Shield size={14} />
                                <span>Tracking</span>
                              </button>
                            )}
                          </div>

                          {cfg.id === 'agenda' && (
                            <button
                              type="button"
                              onClick={handleCopyPublicAgendaLink}
                              className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold rounded-xl text-xs flex items-center space-x-1.5 border border-indigo-200 active:scale-95 cursor-pointer shadow-xs"
                            >
                              <Share2 size={13} />
                              <span>Compartir Enlace</span>
                            </button>
                          )}

                          {cfg.id === 'salon' && (
                            <button
                              type="button"
                              onClick={handleCopyPublicSalonLink}
                              className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-extrabold rounded-xl text-xs flex items-center space-x-1.5 border border-amber-200 active:scale-95 cursor-pointer shadow-xs"
                            >
                              <Share2 size={13} className="text-amber-600" />
                              <span>Compartir Enlace</span>
                            </button>
                          )}
                        </div>

                        {/* Vista 1: Formulario Integrado Directo (Sin doble contenedor en móviles) */}
                        {currentMode === 'form' && (
                          <div className="bg-transparent sm:bg-white rounded-2xl sm:rounded-3xl border-0 sm:border sm:border-slate-200 p-0 sm:p-6 md:p-8 sm:shadow-xs">
                            {saveSuccess ? (
                              renderSuccessBlock()
                            ) : (
                              <>
                                {saveError && (
                                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs font-semibold flex items-start space-x-2 animate-in fade-in mb-6">
                                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-500" />
                                    <span>{saveError}</span>
                                  </div>
                                )}
                                {cfg.id === 'salon' && renderSalonForm()}
                                {cfg.id === 'sillas' && renderSillasForm()}
                                {cfg.id === 'agenda' && renderAgendaForm()}
                                {(cfg.id === 'abiertas' || cfg.id === 'internas') && renderGeneralForm()}
                              </>
                            )}
                          </div>
                        )}

                        {/* Vista 2: Listado de Solicitudes Registradas */}
                        {currentMode === 'list' && (
                          <div className="space-y-6 animate-in fade-in duration-300">
                            {renderSolicitudesList(cfg.id as any)}
                          </div>
                        )}

                        {/* Vista 3: Tracking de Solicitud */}
                        {currentMode === 'tracking' && (
                          renderTrackingSection(cfg)
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* FORM MODAL (Fallback / Alternative popup if triggered) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className={`bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full ${activeTab === 'cartas' || activeTab === 'salon' ? 'max-w-4xl' : 'max-w-2xl'} max-h-[90vh] overflow-y-auto p-6 sm:p-10 space-y-6 relative animate-in zoom-in-95 duration-300`}>
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-blue-900">
                {activeTab === 'sillas' 
                  ? 'Solicitud de Silla de Ruedas' 
                  : activeTab === 'agenda' 
                  ? 'Propuesta de Punto de Agenda' 
                  : activeTab === 'cartas'
                  ? 'Redactar Nueva Carta Oficial'
                  : activeTab === 'salon'
                  ? 'Solicitud de Alquiler de Salón y Parqueo'
                  : `Crear Nueva Solicitud ${activeTab === 'abiertas' ? 'Abierta' : 'Interna'}`}
              </h2>
              <p className="text-xs text-slate-550 font-bold uppercase tracking-wider">
                {activeTab === 'sillas' 
                  ? 'Formulario de Préstamo Temporal' 
                  : activeTab === 'agenda' 
                  ? 'Formulario de Puntos de Agenda' 
                  : activeTab === 'cartas'
                  ? 'Formulario de Correspondencia Oficial'
                  : activeTab === 'salon'
                  ? 'Formulario de Reservación de Instalaciones'
                  : activeTab === 'abiertas' 
                  ? 'Formulario Público de Proyectos' 
                  : 'Formulario de Coordinación Interna'}
              </p>
            </div>

            {saveError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start space-x-3 text-red-700 text-sm animate-in fade-in">
                <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
                <span>{saveError}</span>
              </div>
            )}

            {saveSuccess ? (
              renderSuccessBlock()
            ) : (
              <>
                {activeTab === 'cartas' && renderCartasForm()}
                {activeTab === 'salon' && renderSalonForm()}
                {activeTab === 'sillas' && renderSillasForm()}
                {activeTab === 'agenda' && renderAgendaForm()}
                {(activeTab === 'abiertas' || activeTab === 'internas') && renderGeneralForm()}
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN DE APARTADO DE SALÓN */}
      {isEditSalonModalOpen && editingSalonSolicitud && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl border border-slate-100 relative text-left">
            <button
              type="button"
              onClick={() => {
                setIsEditSalonModalOpen(false);
                setEditingSalonSolicitud(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-xl"
            >
              <X size={20} />
            </button>

            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-900 text-xs font-extrabold">
                <Edit3 size={14} className="text-amber-600" />
                <span>Modificar Apartado de Salón</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">Editar Fecha y Horario del Salón</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Reprograma la fecha del evento, actualiza el rango de horario o modifica los datos de la actividad.
              </p>
            </div>

            <form onSubmit={handleSaveEditSalonSolicitud} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center">
                  <Calendar size={13} className="mr-1 text-slate-400" />
                  Nueva Fecha del Evento *
                </label>
                <input
                  type="date"
                  required
                  value={editSalonDia}
                  onChange={(e) => setEditSalonDia(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center">
                  <Sparkles size={13} className="mr-1 text-amber-600" />
                  Nombre de la Actividad / Evento *
                </label>
                <input
                  type="text"
                  required
                  value={editSalonNombreActividad}
                  onChange={(e) => setEditSalonNombreActividad(e.target.value)}
                  placeholder="Ej. Sesión Ordinaria / Capacitación / Evento Familiar"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-semibold text-slate-800 bg-white shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center">
                    <Clock size={13} className="mr-1 text-slate-400" />
                    Hora Inicio *
                  </label>
                  <input
                    type="time"
                    required
                    value={editSalonHoraInicio}
                    onChange={(e) => setEditSalonHoraInicio(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center">
                    <Clock size={13} className="mr-1 text-slate-400" />
                    Hora Fin *
                  </label>
                  <input
                    type="time"
                    required
                    value={editSalonHoraFin}
                    onChange={(e) => setEditSalonHoraFin(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Asistentes Estimados
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="80"
                    value={editSalonAsistentes}
                    onChange={(e) => setEditSalonAsistentes(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Compromiso de Limpieza
                  </label>
                  <select
                    value={editSalonCompromisoLimpieza}
                    onChange={(e) => setEditSalonCompromisoLimpieza(e.target.value as any)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 bg-white cursor-pointer"
                  >
                    <option value="dejar_limpio">Dejar limpio (Q0.00)</option>
                    <option value="pagar_limpieza">Servicio (+Q300.00)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditSalonModalOpen(false);
                    setEditingSalonSolicitud(null);
                  }}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingSalon}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black rounded-xl shadow-md text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isUpdatingSalon ? (
                    <span>Guardando...</span>
                  ) : (
                    <span>Guardar Modificaciones</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Solicitudes;