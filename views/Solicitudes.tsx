import React, { useState, useEffect, useMemo } from 'react';
import { Socio, UserRole, Solicitud, Responsable } from '../types';
import { firebaseService } from '../services/firebaseService';
import { useModal } from '../context/ModalContext';
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
  Archive
} from 'lucide-react';
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

  // Form State para Alquiler de Salón y Parqueo
  const [salonNombreSolicitante, setSalonNombreSolicitante] = useState('');
  const [salonTelefonoDigitos, setSalonTelefonoDigitos] = useState('');
  const [salonEmail, setSalonEmail] = useState('');
  const [salonDia, setSalonDia] = useState('');
  const [salonHoraInicio, setSalonHoraInicio] = useState('');
  const [salonHoraFin, setSalonHoraFin] = useState('');
  const [salonTipoAlquiler, setSalonTipoAlquiler] = useState<'salon' | 'parqueo' | 'ambos'>('salon');
  const [salonAsistentes, setSalonAsistentes] = useState('');
  const [salonCompromisoLimpieza, setSalonCompromisoLimpieza] = useState<'dejar_limpio' | 'pagar_limpieza'>('dejar_limpio');
  const [salonRequisitosAceptados, setSalonRequisitosAceptados] = useState(false);



  // Auto-fill salon form details if user is logged in
  useEffect(() => {
    if (user) {
      setSalonNombreSolicitante(user.nombre);
      setSalonEmail(user.correo);
      if (user.telefono) {
        const clean = user.telefono.replace(/^\+?502/, '').replace(/\D/g, '');
        setSalonTelefonoDigitos(clean.substring(0, 8));
      }
    } else {
      setSalonNombreSolicitante('');
      setSalonEmail('');
      setSalonTelefonoDigitos('');
    }
  }, [user]);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  useEffect(() => {
    if (isModalOpen) {
      setCreatedSolicitudId('');
      setSaveSuccess(false);
      setSaveError(null);
      setDocDataUrl('');
      setDocFileName('');
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
      localStorage.setItem('club_leones_solicitudes', JSON.stringify(updatedList));
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
    localStorage.setItem('club_leones_carta_drafts', JSON.stringify(updated));
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

  const deleteDraft = (id: string) => {
    if (!window.confirm("¿Está seguro de eliminar este borrador?")) return;
    const updated = drafts.filter(d => d.id !== id);
    setDrafts(updated);
    localStorage.setItem('club_leones_carta_drafts', JSON.stringify(updated));
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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
    let base = 0;
    if (salonTipoAlquiler === 'salon') {
      base = isSocio ? 0 : 1500;
    } else if (salonTipoAlquiler === 'parqueo') {
      base = isSocio ? 1500 : 3500;
    } else if (salonTipoAlquiler === 'ambos') {
      base = isSocio ? 1500 : 5000;
    }
    const cleaning = salonCompromisoLimpieza === 'pagar_limpieza' ? 300 : 0;
    return base + cleaning;
  }, [salonTipoAlquiler, salonCompromisoLimpieza, isSocio]);

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
        !salonTelefonoDigitos.trim() || 
        !salonEmail.trim() || 
        !salonDia || 
        !salonHoraInicio || 
        !salonHoraFin || 
        !salonAsistentes
      ) {
        setSaveError("Por favor, complete todos los campos obligatorios.");
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

      nuevaSolicitud = {
        id: trackingCodeId,
        nombre: `Alquiler - ${
          salonTipoAlquiler === 'salon' ? 'Salón' : 
          salonTipoAlquiler === 'parqueo' ? 'Parqueo' : 
          'Salón y Parqueo'
        }`,
        tipo: 'salon',
        estado: 'Pendiente',
        faseTracking: 'recibido',
        usuarioCreador: user ? `${user.nombre} (${user.correo})` : 'Público',
        fechaCreacion: new Date().toISOString().split('T')[0],
        salonDia,
        salonHoraInicio,
        salonHoraFin,
        salonTipoAlquiler,
        salonAsistentes: asistentesNum,
        salonCompromisoLimpieza,
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
      localStorage.setItem('club_leones_solicitudes', JSON.stringify(updatedList));

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
      localStorage.setItem('club_leones_solicitudes', JSON.stringify(newList));
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
      localStorage.setItem('club_leones_solicitudes', JSON.stringify(newList));
      alert("Solicitud eliminada correctamente.");
    } catch (err) {
      console.error("Error deleting solicitud:", err);
      alert("Error al eliminar la solicitud en Firebase.");
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
      visible: isSocio,
      allowed: isSocio,
      audience: 'Socios',
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
                      <Building size={12} className="mr-0.5" />
                      <span>
                        {sol.salonTipoAlquiler === 'salon' ? 'Solo Salón' : 
                         sol.salonTipoAlquiler === 'parqueo' ? 'Solo Parqueo' : 
                         'Salón y Parqueo'}
                      </span>
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
                    <div className="flex justify-between pt-1.5 border-t border-slate-200/50">
                      <span className="text-slate-400 font-bold">Asistentes:</span>
                      <span className="font-extrabold text-slate-800">{sol.salonAsistentes} personas</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Limpieza:</span>
                      <span className="font-bold text-slate-700">
                        {sol.salonCompromisoLimpieza === 'dejar_limpio' ? 'Dejará limpio' : 'Pago de servicio'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Tarifa:</span>
                      <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                        sol.salonEsSocio ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-slate-100 text-slate-750'
                      }`}>
                        {sol.salonEsSocio ? 'Socio' : 'Público General'}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-slate-200/50">
                      <span className="text-slate-400 font-bold text-sm">Costo Total:</span>
                      <span className="font-black text-sm text-blue-900">Q{sol.salonCostoTotal}</span>
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

  const renderSalonForm = () => {
    const isCapacityWarning = parseInt(salonAsistentes) > 60 && parseInt(salonAsistentes) <= 80;
    const isCapacityError = parseInt(salonAsistentes) > 80;

    return (
      <form onSubmit={handleSubmit} className="space-y-6 text-left animate-in fade-in duration-300">
        {/* Info y Precios Banner */}
        <div className="bg-amber-50/60 border border-amber-250/70 rounded-2xl p-5 space-y-3.5 text-slate-800 text-xs md:text-sm shadow-sm">
          <div className="flex items-start space-x-3 text-amber-900">
            <Building className="flex-shrink-0 mt-0.5 text-amber-700" size={18} />
            <div className="space-y-1.5 w-full">
              <p className="font-extrabold text-amber-955 text-sm">🏛️ Información y Tarifas Oficiales del Salón</p>
              <ul className="list-disc pl-4 space-y-1 font-semibold text-slate-700 text-[11px] md:text-xs">
                <li><strong className="text-amber-900">Capacidad Máxima:</strong> Hasta 60 personas sentadas u 80 personas de pie.</li>
                <li><strong className="text-amber-900">Costo del Salón:</strong> Q0 para socios activos | Q1,500 para público general.</li>
                <li><strong className="text-amber-955">Costo del Parqueo Completo (jornada):</strong> Q1,500 para socios activos | Q3,500 para público general.</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-blue-900 text-xs">
            <span className="font-bold">Tarifa detectada para ti:</span>
            <span className={`font-black px-2.5 py-1 rounded-lg uppercase tracking-wider text-[10px] ${
              isSocio ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700'
            }`}>
              {isSocio ? 'Socio Activo (Descuento aplicado)' : 'No Socio / Invitado'}
            </span>
          </div>
        </div>

        {/* Datos de Contacto */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center">
            <User size={14} className="mr-1.5 text-slate-450" />
            Información de Contacto
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Nombre del Solicitante *
              </label>
              <input
                type="text"
                required
                value={salonNombreSolicitante}
                onChange={(e) => setSalonNombreSolicitante(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Correo Electrónico *
              </label>
              <input
                type="email"
                required
                value={salonEmail}
                onChange={(e) => setSalonEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
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
                value={salonTelefonoDigitos}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 8) setSalonTelefonoDigitos(val);
                }}
                placeholder="5555 5555"
                className="w-full px-4 py-2.5 outline-none text-sm text-slate-800 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Detalles del Alquiler */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center">
            <Calendar size={14} className="mr-1.5 text-slate-450" />
            Detalles de la Reserva
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Tipo de Alquiler *
              </label>
              <select
                value={salonTipoAlquiler}
                onChange={(e) => setSalonTipoAlquiler(e.target.value as any)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none text-sm font-semibold bg-white cursor-pointer"
              >
                <option value="salon">Solo Salón de Eventos</option>
                <option value="parqueo">Solo Parqueo Completo</option>
                <option value="ambos">Ambos (Salón y Parqueo)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Día del Evento *
              </label>
              <input
                type="date"
                required
                value={salonDia}
                onChange={(e) => setSalonDia(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Hora de Inicio *
              </label>
              <input
                type="time"
                required
                value={salonHoraInicio}
                onChange={(e) => setSalonHoraInicio(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Hora de Fin *
              </label>
              <input
                type="time"
                required
                value={salonHoraFin}
                onChange={(e) => setSalonHoraFin(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Asistentes Estimados *
              </label>
              <input
                type="number"
                required
                min="1"
                value={salonAsistentes}
                onChange={(e) => setSalonAsistentes(e.target.value)}
                placeholder="Ej. 50"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 bg-white"
              />
            </div>
          </div>

          {/* Warnings de Asistentes */}
          {isCapacityWarning && (
            <div className="bg-amber-50 border border-amber-250 rounded-xl p-3 flex items-start space-x-2 text-[11px] text-amber-800 font-bold leading-relaxed">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5 text-amber-700" />
              <span>Aviso: Capacidad superior a 60 personas. Los asistentes deberán estar de pie para el evento (capacidad máx. sentados: 60).</span>
            </div>
          )}

          {isCapacityError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start space-x-2 text-[11px] text-red-800 font-bold leading-relaxed">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5 text-red-600 animate-pulse" />
              <span>Error: La cantidad de asistentes supera el límite permitido de 80 personas de pie. Por favor, reduzca la cantidad.</span>
            </div>
          )}

          {/* Compromiso de Limpieza */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Compromiso de Limpieza *
            </label>
            <select
              value={salonCompromisoLimpieza}
              onChange={(e) => setSalonCompromisoLimpieza(e.target.value as any)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none text-sm font-semibold bg-white cursor-pointer"
            >
              <option value="dejar_limpio">Me comprometo a dejar limpio el salón (Q0)</option>
              <option value="pagar_limpieza">Pagar por el servicio de limpieza (Q300 adicional)</option>
            </select>
          </div>
        </div>

        {/* Resumen de Costo */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-250/70 space-y-2 text-xs">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1.5">
            Desglose de Pago Estimado
          </div>
          <div className="flex justify-between font-semibold text-slate-600">
            <span>Costo Alquiler Base:</span>
            <span>Q{
              salonTipoAlquiler === 'salon' ? (isSocio ? 0 : 1500) :
              salonTipoAlquiler === 'parqueo' ? (isSocio ? 1500 : 3500) :
              (isSocio ? 1500 : 5000)
            }</span>
          </div>
          <div className="flex justify-between font-semibold text-slate-600">
            <span>Tasa de Servicio Limpieza:</span>
            <span>Q{salonCompromisoLimpieza === 'pagar_limpieza' ? 300 : 0}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-200 font-extrabold text-sm text-blue-900">
            <span>Costo Total Estimado:</span>
            <span>Q{salonCostoTotal}</span>
          </div>
        </div>

        {/* Requisitos y Checkbox */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">
            Requisitos de Uso y Condiciones
          </h4>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[10px] md:text-xs text-slate-600 font-medium space-y-2 leading-relaxed max-h-40 overflow-y-auto">
            <p>1. **Límites de Capacidad:** Respetar de forma rigurosa la cantidad de asistentes (máximo 60 personas sentadas y 80 de pie).</p>
            <p>2. **Limpieza:** En caso de no pagar la tasa de limpieza, el salón debe ser devuelto barrido, trapeado y sin basura.</p>
            <p>3. **Horario:** El evento debe finalizar a la hora solicitada, incluyendo el tiempo de desmontaje.</p>
            <p>4. **Música y Ruido:** Mantener un volumen moderado para no perturbar las zonas vecinas.</p>
            <p>5. **Responsabilidad:** El solicitante se hace responsable directo de daños físicos causados a la propiedad.</p>
            <p>6. **Confirmación:** La reserva solo tendrá validez una vez aprobada por la Secretaría y habiendo solventado los pagos si los hubiera.</p>
          </div>

          <label className="flex items-center space-x-2.5 cursor-pointer pt-1 text-slate-700">
            <input
              type="checkbox"
              checked={salonRequisitosAceptados}
              onChange={(e) => setSalonRequisitosAceptados(e.target.checked)}
              className="w-4.5 h-4.5 text-blue-900 border-slate-300 rounded focus:ring-blue-900 cursor-pointer"
            />
            <span className="text-xs font-bold leading-normal select-none">
              Acepto los requisitos y el compromiso de limpieza/pago correspondientes. *
            </span>
          </label>
        </div>

        {/* Botones de Envío */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving || !salonRequisitosAceptados || isCapacityError}
            className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black rounded-xl shadow-lg transition-all text-sm flex items-center justify-center space-x-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin text-white flex-shrink-0"><Users size={14} /></div>
                <span>Enviando...</span>
              </>
            ) : (
              <span>Enviar Reservación</span>
            )}
          </button>
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
                  placeholder="Ej. Solicitud de colaboración para jornada oftalmológica"
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
                    placeholder="Ej. Lic. Carlos Mérida"
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
                    placeholder="Ej. Director Ejecutivo"
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
                    placeholder="Ej. Municipalidad de Quetzaltenango"
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
                navigator.clipboard.writeText(textToCopy);
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

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">Gestión de Solicitudes</h1>
          <p className="text-base text-slate-750 mt-1 font-medium">
            En esta sección puedes subir y hacer tus solicitudes al club como beneficiario, institución o socio.
          </p>
        </div>
      </header>

      {/* SISTEMA DE ACORDEONES UNIFICADO Y RESPONSIVO */}
      <div className="space-y-4">
        {tabConfigs.map((cfg) => {
          const isExpanded = activeTab === cfg.id;
          
          if (!cfg.visible) return null;

          return (
            <div 
              key={cfg.id}
              className={`border rounded-3xl bg-white overflow-hidden shadow-sm transition-all duration-300 ${
                isExpanded ? BORDER_CLASSES[cfg.colorTheme] : 'border-slate-200'
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
                className={`w-full px-6 py-5 flex items-center justify-between text-left transition-all ${
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

              {/* Contenido Expandido del Acordeón */}
              {isExpanded && (
                <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/20 animate-in slide-in-from-top duration-300">
                  {(() => {
                    const themeAccent = THEME_ACCENTS[cfg.colorTheme] || THEME_ACCENTS.blue;
                    return (
                      <div className="space-y-8 w-full text-left">
                        {/* Guía de Pasos Unificada */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                          {/* Paso 1: Entiende el Trámite */}
                          <div className={`bg-white rounded-2xl border ${themeAccent.border} ${themeAccent.borderHover} p-6 shadow-sm transition-all duration-300 space-y-3 flex flex-col justify-between`}>
                            <div className="space-y-3">
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${themeAccent.bg} ${themeAccent.text}`}>
                                  1
                                </div>
                                <h4 className="font-extrabold text-sm text-slate-800 tracking-tight">¿Qué hacemos aquí?</h4>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                                {cfg.description}
                              </p>
                            </div>
                            <div className="pt-2 flex items-center space-x-2 border-t border-slate-100">
                              <span className="text-[10px] text-slate-400 font-bold">Dirigido a:</span>
                              <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-md border ${themeAccent.badge}`}>
                                {cfg.audience}
                              </span>
                            </div>
                          </div>

                          {/* Paso 2: Completa tu Solicitud */}
                          <div className={`bg-white rounded-2xl border ${themeAccent.border} ${themeAccent.borderHover} p-6 shadow-sm transition-all duration-300 space-y-4 flex flex-col justify-between`}>
                            <div className="space-y-3">
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${themeAccent.bg} ${themeAccent.text}`}>
                                  2
                                </div>
                                <h4 className="font-extrabold text-sm text-slate-800 tracking-tight">Ingresa tus Datos</h4>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                                {cfg.id === 'cartas' 
                                  ? 'Genera documentos formales firmados digitalmente para entregar a otras instituciones de inmediato.'
                                  : 'Llena el formulario digital con tus datos. No te tomará más de 5 minutos y es totalmente guiado.'
                                }
                              </p>
                            </div>
                            {cfg.showAction && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveTab(cfg.id);
                                  setIsModalOpen(true);
                                }}
                                className={`w-full py-3 font-extrabold rounded-xl flex items-center justify-center space-x-2 text-xs shadow-md transition-all duration-200 active:scale-95 hover:shadow-lg ${
                                  BUTTON_CLASSES[cfg.colorTheme]
                                }`}
                              >
                                <Plus size={14} />
                                <span>{cfg.actionText}</span>
                              </button>
                            )}
                          </div>

                          {/* Paso 3: Seguimiento */}
                          <div className={`bg-white rounded-2xl border ${themeAccent.border} ${themeAccent.borderHover} p-6 shadow-sm transition-all duration-300 space-y-4 flex flex-col justify-between`}>
                            <div className="space-y-3">
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${themeAccent.bg} ${themeAccent.text}`}>
                                  3
                                </div>
                                <h4 className="font-extrabold text-sm text-slate-800 tracking-tight">Monitorea en Línea</h4>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                                ¿Ya hiciste tu solicitud? Consulta el avance de tu trámite en tiempo real usando tu código.
                              </p>
                            </div>
                            
                            {/* Formulario de tracking integrado */}
                            <form onSubmit={(e) => handleSearchTracking(e, cfg.id as any)} className="flex items-center gap-2 w-full mt-auto">
                              <input
                                type="text"
                                value={trackingCode}
                                onChange={(e) => setTrackingCode(e.target.value)}
                                placeholder="Ej. LQX-358"
                                className="w-28 flex-shrink-0 px-3 py-2.5 border border-slate-250 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none font-bold text-xs text-slate-800 bg-white placeholder-slate-350 text-center"
                                maxLength={8}
                              />
                              <button
                                type="submit"
                                className={`flex-grow py-2.5 font-extrabold rounded-xl text-xs transition-all shadow-md active:scale-95 flex items-center justify-center ${
                                  BUTTON_CLASSES[cfg.colorTheme]
                                }`}
                              >
                                Buscar
                              </button>
                            </form>
                          </div>
                        </div>

                        {/* Mensaje de error de búsqueda */}
                        {trackingError && (
                          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs font-semibold flex items-start space-x-2 animate-in fade-in max-w-2xl mx-auto">
                            <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-red-500" />
                            <span>{trackingError}</span>
                          </div>
                        )}

                        {/* Resultado de Seguimiento */}
                        {searchedSolicitud && (
                          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-md max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                              <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Solicitante / Detalle</span>
                                <span className="text-xs font-bold text-slate-750 block mt-0.5">
                                  {searchedSolicitud.nombreBeneficiario || searchedSolicitud.salonNombreSolicitante || searchedSolicitud.agendaSocioNombre || searchedSolicitud.nombre}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Código Único</span>
                                <span className="text-xs font-mono font-bold text-slate-750 block mt-0.5">{searchedSolicitud.id}</span>
                              </div>
                              <div className="text-left sm:text-right">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Fecha de Envío</span>
                                <span className="text-xs font-bold text-slate-755 block mt-0.5">{formatDisplayDate(searchedSolicitud.fechaCreacion)}</span>
                              </div>
                            </div>

                            {/* Stepper del Tracking */}
                            <div className="space-y-6">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center sm:text-left">Línea del Proceso</span>
                              {/* Stepper Grid */}
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
                                          <div className="hidden sm:block absolute top-5 left-[60%] w-[80%] h-0.5 bg-slate-105 z-0">
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
                                searchedSolicitud.estado === 'Aprobada' ? 'bg-green-50/60 border-green-200 text-green-700' : 'bg-red-50/60 border-red-200 text-red-700'
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
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className={`bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full ${activeTab === 'cartas' ? 'max-w-4xl' : 'max-w-2xl'} max-h-[90vh] overflow-y-auto p-6 sm:p-10 space-y-6 relative animate-in zoom-in-95 duration-300`}>
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
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
                  : `Crear Nueva Solicitud ${activeTab === 'abiertas' ? 'Abierta' : 'Interna'}`}
              </h2>
              <p className="text-xs text-slate-550 font-bold uppercase tracking-wider">
                {activeTab === 'sillas' 
                  ? 'Formulario de Préstamo Temporal' 
                  : activeTab === 'agenda' 
                  ? 'Formulario de Puntos de Agenda' 
                  : activeTab === 'cartas'
                  ? 'Formulario de Correspondencia Oficial'
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
              <div className="text-center py-8 space-y-6 animate-in zoom-in-95 duration-300">
                <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-green-600 border-4 border-green-100 shadow-sm">
                  <CheckCircle size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-800">¡Registro Exitoso!</h3>
                  <p className="text-slate-600 text-sm font-semibold max-w-sm mx-auto leading-relaxed">
                    Tu solicitud ha sido enviada directamente a la Presidencia del club. Utiliza el siguiente código único para consultar su estado en la sección de seguimiento:
                  </p>
                </div>
                
                {createdSolicitudId && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-w-md mx-auto flex items-center justify-between shadow-inner">
                    <div className="text-left">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Código de Seguimiento</span>
                      <span className="text-sm font-mono font-bold text-blue-900 select-all block mt-0.5">{createdSolicitudId}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(createdSolicitudId);
                        alert("Código copiado al portapapeles.");
                      }}
                      className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center space-x-1.5"
                    >
                      <Copy size={14} />
                      <span>Copiar código</span>
                    </button>
                  </div>
                )}

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSaveSuccess(false);
                      setCreatedSolicitudId('');
                    }}
                    className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl text-sm shadow-md transition-all active:scale-[0.98]"
                  >
                    Entendido, cerrar
                  </button>
                </div>
              </div>
            ) : (
              <>

            {activeTab === 'cartas' ? (
              renderCartasForm()
            ) : activeTab === 'salon' ? (
              renderSalonForm()
            ) : activeTab === 'sillas' ? (
              <form onSubmit={handleSubmit} className="space-y-5 text-left animate-in fade-in duration-300">
                {/* Solidarity Note */}
                <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-5 flex items-start space-x-3 text-blue-900 text-xs md:text-sm shadow-sm">
                  <Heart className="flex-shrink-0 text-yellow-500 fill-yellow-500 mt-0.5 animate-pulse" size={18} />
                  <div className="space-y-1">
                    <p className="font-extrabold text-blue-955 text-sm">💡 Nota de Solidaridad y Compromiso</p>
                    <p className="leading-relaxed font-medium text-slate-750">
                      Las sillas de ruedas se entregan en calidad de **préstamo temporal**. Para que este beneficio siga activo y ayude a más personas, **te solicitamos amablemente que devuelvas la silla al Club** una vez que el beneficiario ya no la requiera. ¡De esta manera, más personas de nuestra comunidad en Quetzaltenango podrán beneficiarse!
                    </p>
                  </div>
                </div>

                {/* Section: Applicant Details */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center">
                    <User size={14} className="mr-1.5 text-slate-450" />
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
                        placeholder="Ej. Juan Carlos Pérez Pérez"
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
                          const val = e.target.value.replace(/\D/g, ''); // numbers only
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
                        placeholder="5555 5555"
                        className="w-full px-4 py-2.5 outline-none text-sm text-slate-800 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Beneficiary Details */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center">
                    <Accessibility size={14} className="mr-1.5 text-slate-455" />
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
                        placeholder="Ej. María Elena Pérez"
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
                        placeholder="Ej. 75"
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
                      placeholder="Ej. 3 meses (recuperación de cirugía), permanente, etc."
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 bg-white"
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-900/50 text-white font-black rounded-xl shadow-lg transition-all text-sm flex items-center justify-center space-x-2"
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
            ) : activeTab === 'agenda' ? (
              <form onSubmit={handleSubmit} className="space-y-5 text-left animate-in fade-in duration-300">
                {/* Agenda Info Alert */}
                <div className="bg-yellow-50/60 border border-yellow-200/80 rounded-2xl p-5 flex items-start space-x-3 text-yellow-900 text-xs md:text-sm shadow-sm">
                  <Calendar className="flex-shrink-0 text-yellow-600 mt-0.5 animate-pulse" size={18} />
                  <div className="space-y-1">
                    <p className="font-extrabold text-yellow-950 text-sm">💡 Propuesta de Punto de Agenda</p>
                    <p className="leading-relaxed font-medium text-slate-750">
                      Como socio activo, puedes proponer temas, puntos a discutir o solicitudes para que sean incluidos en el orden del día de las reuniones generales.
                    </p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Socio Solicitante *
                    </label>
                    <select
                      required
                      value={agendaSocioNombre}
                      onChange={(e) => setAgendaSocioNombre(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 bg-white"
                    >
                      <option value="" disabled>Seleccione un socio...</option>
                      {[...socios]
                        .sort((a, b) => a.nombre.localeCompare(b.nombre))
                        .map((socio) => (
                          <option key={socio.id} value={socio.nombre}>
                            {socio.nombre} {socio.puesto ? `(${socio.puesto})` : ''}
                          </option>
                        ))
                      }
                      {agendaSocioNombre && !socios.some(s => s.nombre === agendaSocioNombre) && (
                        <option value={agendaSocioNombre}>{agendaSocioNombre}</option>
                      )}
                    </select>
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
                      placeholder="Ej. Campaña Médica Quetzaltenango / Ajuste de cuota de socios"
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
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-900/50 text-white font-black rounded-xl shadow-lg transition-all text-sm flex items-center justify-center space-x-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin text-white flex-shrink-0"><Users size={14} /></div>
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <span>Enviar Propuesta</span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 text-left">
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
                      placeholder="Ej. Compra de Glucómetros para Campaña"
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
                    <div className="animate-in fade-in duration-300">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Describa la Categoría / Tema *
                      </label>
                      <input
                        type="text"
                        required
                        value={otroTemaDescripcion}
                        onChange={(e) => setOtroTemaDescripcion(e.target.value)}
                        placeholder="Ej. Suministros Escolares"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800"
                      />
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Descripción Detallada *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Detalla los objetivos, recursos necesarios e impacto comunitario..."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none text-sm font-semibold resize-none"
                  />
                </div>

                {/* Document / Letter Attachment Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Carta o Documento Adjunto (Imagen o PDF, Máx. 10MB) - Opcional
                  </label>
                  <div className="border-2 border-dashed border-slate-200 hover:border-blue-300 rounded-2xl p-4 text-center transition-all bg-slate-50/50">
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
                        <Upload size={22} className="text-slate-400" />
                        <span className="text-xs font-bold text-blue-900">Adjuntar Carta de Solicitud (PDF o Foto)</span>
                        <span className="text-[10px] text-slate-400">Archivos PDF, PNG o JPG hasta 10MB</span>
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

                {/* Responsibles Dynamic Header */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">
                      Responsables de la Solicitud (Máx. 3) *
                    </label>
                    {responsables.length < 3 && (
                      <button
                        type="button"
                        onClick={handleAddResponsable}
                        className="text-xs font-black text-blue-900 hover:text-blue-750 flex items-center space-x-1 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 shadow-sm"
                      >
                        <UserPlus size={12} />
                        <span>Añadir Responsable</span>
                      </button>
                    )}
                  </div>

                  {/* Responsibles List */}
                  <div className="space-y-3">
                    {responsables.map((resp, index) => (
                      <div 
                        key={index}
                        className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex flex-col sm:flex-row gap-3 items-end sm:items-center relative"
                      >
                        <span className="absolute top-3 left-4 bg-slate-200/80 text-slate-600 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full">
                          {index + 1}
                        </span>

                        <div className="flex-1 w-full pl-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Nombre Completo *
                            </label>
                            <input
                              type="text"
                              required
                              value={resp.nombre}
                              onChange={(e) => handleUpdateResponsable(index, 'nombre', e.target.value)}
                              placeholder="Nombre del responsable"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none text-xs font-semibold text-slate-800 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Número de Teléfono *
                            </label>
                            <div className="flex rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-blue-900 focus-within:border-transparent overflow-hidden bg-white">
                              <span className="bg-slate-100 text-slate-500 px-3 py-2 flex items-center justify-center border-r border-slate-200 text-xs font-extrabold select-none">
                                +502
                              </span>
                              <input
                                type="tel"
                                required
                                value={resp.telefono}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '');
                                  if (val.length <= 8) {
                                    handleUpdateResponsable(index, 'telefono', val);
                                  }
                                }}
                                placeholder="55555555"
                                className="w-full px-3 py-2 outline-none text-xs text-slate-800 font-semibold"
                              />
                            </div>
                          </div>
                        </div>

                        {responsables.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveResponsable(index)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg border border-red-200 flex items-center justify-center flex-shrink-0"
                            title="Eliminar responsable"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-900/50 text-white font-black rounded-xl shadow-lg transition-all text-sm flex items-center justify-center space-x-2"
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
            )}
          </>
        )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Solicitudes;