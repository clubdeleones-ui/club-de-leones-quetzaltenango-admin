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
  Solicitud
} from '../types';
import { firebaseService } from '../services/firebaseService';
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
  AlertCircle
} from 'lucide-react';
import { generateActaPDF } from '../utils/pdfGenerator';
import { compressImageFile } from '../utils/imageCompressor';


const PUESTOS_PREDEFINIDOS = [
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

type TabType = 'resumen' | 'socios' | 'calendario' | 'cuotas' | 'actas' | 'donaciones' | 'beneficios';

const SuperAdmin: React.FC<SuperAdminProps> = ({ user, onUpdateUser }) => {
  // Dynamic Tab Access based on Role
  const allowedTabs = useMemo(() => {
    switch (user.rol) {
      case UserRole.SUPER_ADMIN:
        return ['resumen', 'socios', 'calendario', 'cuotas', 'actas', 'donaciones', 'beneficios'];
      case UserRole.TESORERO:
        return ['resumen', 'socios', 'cuotas', 'donaciones'];
      case UserRole.SECRETARIO:
        return ['resumen', 'socios', 'calendario', 'actas'];
      case UserRole.ASESOR_SERVICIOS:
        return ['socios', 'calendario', 'beneficios'];
      case UserRole.PRESIDENTE_AFILIACION:
        return ['resumen', 'socios', 'cuotas'];
      default:
        return [];
    }
  }, [user.rol]);

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (user.rol === UserRole.ASESOR_SERVICIOS) return 'calendario';
    return 'resumen';
  });

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
  
  // Dynamic States with localStorage persistence
  const [socios, setSocios] = useState<Socio[]>(() => {
    const local = localStorage.getItem('club_leones_socios_v3');
    if (local) return JSON.parse(local);
    localStorage.setItem('club_leones_socios_v3', JSON.stringify(MOCK_SOCIOS));
    return MOCK_SOCIOS;
  });

  const [propuestas, setPropuestas] = useState<PropuestaSocio[]>(() => {
    const local = localStorage.getItem('club_leones_propuestas');
    if (local) return JSON.parse(local);
    localStorage.setItem('club_leones_propuestas', JSON.stringify(MOCK_PROPUESTAS));
    return MOCK_PROPUESTAS;
  });

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(() => {
    const local = localStorage.getItem('club_leones_solicitudes');
    if (local) return JSON.parse(local);
    return [];
  });

  // Sync with Firestore and load the latest data on component mount
  useEffect(() => {
    const syncAndLoad = async () => {
      setIsLoadingSocios(true);
      // Sync mock socios if Firestore is empty
      try {
        await firebaseService.syncInitialSocios(MOCK_SOCIOS);
      } catch (err) {
        console.error("Error syncing initial socios:", err);
      }

      // Fetch latest socios
      try {
        const fetchedSocios = await firebaseService.getSocios();
        if (fetchedSocios && fetchedSocios.length > 0) {
          setSocios(fetchedSocios);
          localStorage.setItem('club_leones_socios_v3', JSON.stringify(fetchedSocios));
        }
      } catch (err) {
        console.error("Error fetching socios from Firestore:", err);
      } finally {
        setIsLoadingSocios(false);
      }

      try {
        const fetchedPropuestas = await firebaseService.getProposals();
        if (fetchedPropuestas) {
          setPropuestas(prev => {
            const fetchedIds = new Set(fetchedPropuestas.map(p => p.id));
            const fetchedNames = new Set(fetchedPropuestas.map(p => p.nombreCandidato.trim().toLowerCase()));
            const unsynced = prev.filter(p => 
              (p as any).synced === false && 
              !fetchedIds.has(p.id) &&
              !fetchedNames.has(p.nombreCandidato.trim().toLowerCase())
            );
            const syncedFetched = fetchedPropuestas.map(p => ({ ...p, synced: true }));
            const merged = [...syncedFetched, ...unsynced];
            localStorage.setItem('club_leones_propuestas', JSON.stringify(merged));
            return merged;
          });
        }
      } catch (err) {
        console.error("Error fetching proposals from Firestore:", err);
      }

      try {
        const fetchedSolicitudes = await firebaseService.getSolicitudes();
        if (fetchedSolicitudes) {
          setSolicitudes(fetchedSolicitudes);
          localStorage.setItem('club_leones_solicitudes', JSON.stringify(fetchedSolicitudes));
        }
      } catch (err) {
        console.error("Error fetching solicitudes from Firestore:", err);
      }
    };

    syncAndLoad();
  }, []);

  useEffect(() => {
    localStorage.setItem('club_leones_socios_v3', JSON.stringify(socios));
  }, [socios]);

  useEffect(() => {
    localStorage.setItem('club_leones_propuestas', JSON.stringify(propuestas));
  }, [propuestas]);

  useEffect(() => {
    localStorage.setItem('club_leones_solicitudes', JSON.stringify(solicitudes));
  }, [solicitudes]);

  const [actividades, setActividades] = useState<Actividad[]>(MOCK_ACTIVIDADES);
  const [actas, setActas] = useState<Acta[]>(() => {
    const local = localStorage.getItem('club_leones_actas');
    if (local) return JSON.parse(local);
    localStorage.setItem('club_leones_actas', JSON.stringify(MOCK_ACTAS));
    return MOCK_ACTAS;
  });

  useEffect(() => {
    localStorage.setItem('club_leones_actas', JSON.stringify(actas));
  }, [actas]);
  const [donaciones, setDonaciones] = useState<Donacion[]>(MOCK_DONACIONES);
  const [beneficios, setBeneficios] = useState<Beneficio[]>(MOCK_BENEFICIOS);

  // Search & Filter States
  const [socioSearch, setSocioSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [financialFilter, setFinancialFilter] = useState('Todos');
  const [isLoadingSocios, setIsLoadingSocios] = useState(false);

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
  const [donacionSearch, setDonacionSearch] = useState('');
  const [actaFilterCategory, setActaFilterCategory] = useState('Todas');
  
  // Modals / Form States
  const [showAddActa, setShowAddActa] = useState(false);
  const [editingActaId, setEditingActaId] = useState<string | null>(null);
  const [newActa, setNewActa] = useState({ titulo: '', autor: '', contenido: '', categoria: 'Ordinaria' });

  // Wizard state for structured minutes
  const [actaWizardStep, setActaWizardStep] = useState<'datos' | 'asistencia' | 'protocolo' | 'solicitudes' | 'libre' | 'vista_previa'>('datos');
  const [actaWizardData, setActaWizardData] = useState({
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
    puntosAgenda: [] as { tema: string; debate: string; acuerdo: string }[],
    asistencia: [] as string[]
  });

  const [newAgendaPoint, setNewAgendaPoint] = useState({ tema: '', debate: '', acuerdo: '' });
  const [asistenciaSearch, setAsistenciaSearch] = useState('');

  const [showAddActividad, setShowAddActividad] = useState(false);
  const [newActividad, setNewActividad] = useState({ titulo: '', descripcion: '', fecha: '', lugar: '', publica: true });

  const [showAddDonacion, setShowAddDonacion] = useState(false);
  const [newDonacion, setNewDonacion] = useState({ donante: '', monto: '', proyecto: '', tipo: 'Individual' as 'Individual' | 'Empresarial' });

  const [showAddBeneficio, setShowAddBeneficio] = useState(false);
  const [newBeneficio, setNewBeneficio] = useState({ titulo: '', descripcion: '', convenioCon: '', descuento: '', categoria: 'Salud' as any });

  const [showEditPropuesta, setShowEditPropuesta] = useState(false);
  const [editingPropuesta, setEditingPropuesta] = useState<PropuestaSocio | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string } | null>(null);

  const canEditPropuestas = user.rol === UserRole.SUPER_ADMIN || user.rol === UserRole.PRESIDENTE_AFILIACION || user.rol === UserRole.SECRETARIO;

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

  const handleInsertMemberMention = (memberName: string) => {
    const textarea = debateRef.current;
    if (!textarea) {
      setNewAgendaPoint(prev => ({
        ...prev,
        debate: prev.debate ? `${prev.debate}\n${memberName}: ` : `${memberName}: `
      }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    
    const insertion = before.endsWith('\n') || start === 0 ? `${memberName}: ` : `\n${memberName}: `;
    const newValue = before + insertion + after;

    setNewAgendaPoint(prev => ({
      ...prev,
      debate: newValue
    }));

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
    if (!window.confirm("¿Está seguro de eliminar esta propuesta permanentemente? Esta acción no se puede deshacer.")) return;
    
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
        agendaSection += `Punto ${idx + 1}: ${p.tema.trim() || 'Sin tema'}\n`;
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
      asistencia: []
    });
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
      asistencia: []
    };

    if (!wData.asistencia) {
      wData.asistencia = [];
    }

    setActaWizardData(wData);
    setEditingActaId(acta.id);
    setActaWizardStep('datos');
    setShowAddActa(true);
  };

  const handleAddAgendaPoint = () => {
    const temaFinal = newAgendaPoint.tema.trim() || `Punto de Agenda #${(actaWizardData.puntosAgenda || []).length + 1}`;
    setActaWizardData(prev => ({
      ...prev,
      puntosAgenda: [...(prev.puntosAgenda || []), { ...newAgendaPoint, tema: temaFinal }]
    }));
    setNewAgendaPoint({ tema: '', debate: '', acuerdo: '' });
  };

  const handleRemoveAgendaPoint = (index: number) => {
    setActaWizardData(prev => ({
      ...prev,
      puntosAgenda: (prev.puntosAgenda || []).filter((_, i) => i !== index)
    }));
  };

  const handleSaveStructuredActa = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitulo = actaWizardData.titulo.trim() || `Acta de Sesión - ${new Date().toLocaleDateString('es-GT')}`;

    const compiledText = compileActaText({
      ...actaWizardData,
      titulo: finalTitulo
    });
    
    let newActas: Acta[];

    if (editingActaId) {
      newActas = actas.map(a => {
        if (a.id === editingActaId) {
          return {
            ...a,
            titulo: finalTitulo,
            categoria: actaWizardData.categoria,
            contenido: compiledText,
            wizardData: actaWizardData
          } as any;
        }
        return a;
      });
      alert("¡Acta de sesión actualizada con éxito!");
    } else {
      const created: Acta = {
        id: `acta-${Date.now()}`,
        titulo: finalTitulo,
        fecha: new Date().toISOString().split('T')[0],
        contenido: compiledText,
        autor: user.nombre,
        pdfUrl: '#',
        categoria: actaWizardData.categoria,
        estado: 'Publicada',
        wizardData: actaWizardData
      } as any;

      newActas = [created, ...actas];
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

  const handleAddActividad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActividad.titulo || !newActividad.fecha || !newActividad.lugar) return;
    const created: Actividad = {
      id: `ev-${Date.now()}`,
      titulo: newActividad.titulo,
      descripcion: newActividad.descripcion,
      fecha: newActividad.fecha.replace('T', ' '),
      lugar: newActividad.lugar,
      imagen: 'https://picsum.photos/seed/' + Math.random() + '/600/400',
      publica: newActividad.publica
    };
    setActividades([created, ...actividades]);
    setNewActividad({ titulo: '', descripcion: '', fecha: '', lugar: '', publica: true });
    setShowAddActividad(false);
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
    setBeneficios([created, ...beneficios]);
    setNewBeneficio({ titulo: '', descripcion: '', convenioCon: '', descuento: '', categoria: 'Salud' });
    setShowAddBeneficio(false);
  };

  const handleRegistrarPago = async (socioId: string) => {
    const socio = socios.find(s => s.id === socioId);
    if (!socio) return;
    
    const updatedSocio = {
      ...socio,
      estadoCuotas: 'Al día' as const,
      montoPendiente: 0
    };

    setSocios(socios.map(s => s.id === socioId ? updatedSocio : s));

    try {
      await firebaseService.saveSocio(updatedSocio);
    } catch (err) {
      console.error("Error saving socio payment to Firebase:", err);
    }
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
      localStorage.setItem('club_leones_socios_v3', JSON.stringify(newList));
      
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

    const confirmed = window.confirm("¿Está seguro de regenerar el código QR? El código QR anterior dejará de funcionar inmediatamente para iniciar sesión.");
    if (!confirmed) return;

    setIsGeneratingQr(true);
    try {
      const token = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      const updatedSocio = { ...socio, qrToken: token };
      await firebaseService.saveSocio(updatedSocio);
      
      const newList = socios.map(s => s.id === socioId ? updatedSocio : s);
      setSocios(newList);
      localStorage.setItem('club_leones_socios_v3', JSON.stringify(newList));
      
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

  const handleEditSocioClick = (socio: Socio) => {
    setEditingSocio(socio);
    setEditSocioForm({ ...socio });
    setSocioSaveError(null);
    setSocioSaveSuccess(false);
  };

  const handleCreateSocioClick = () => {
    const blankSocio: Socio = {
      id: `socio-${Date.now()}`,
      nombre: '',
      correo: '',
      telefono: '',
      rol: UserRole.SOCIO,
      puesto: 'Socio Regular',
      estadoCuotas: 'Al día',
      montoPendiente: 0,
      foto: 'https://picsum.photos/seed/member-' + Math.floor(Math.random() * 1000) + '/200/200',
      fechaIngreso: new Date().toISOString().split('T')[0],
      estatus: 'Active',
      club: 'QUETZALTENANGO'
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
    const confirmed = window.confirm(`¿Está completamente seguro de que desea eliminar permanentemente la ficha de ${socio.nombre}? Esta acción no se puede deshacer y borrará al socio de Firestore y del Directorio público.`);
    if (!confirmed) return;

    try {
      await firebaseService.deleteSocio(socio.id);
      
      const newSociosList = socios.filter(s => s.id !== socio.id);
      setSocios(newSociosList);
      localStorage.setItem('club_leones_socios_v3', JSON.stringify(newSociosList));
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
      localStorage.setItem('club_leones_socios_v3', JSON.stringify(newSociosList));

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

  const handleDeleteActividad = (id: string) => {
    setActividades(actividades.filter(a => a.id !== id));
  };

  const handleDeleteActa = (id: string) => {
    setActas(actas.filter(a => a.id !== id));
  };

  // Filtered views
  const filteredSocios = socios.filter(s => 
    s.nombre.toLowerCase().includes(socioSearch.toLowerCase()) ||
    s.correo.toLowerCase().includes(socioSearch.toLowerCase())
  );

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
          <nav className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[2.5rem] p-7 shadow-sm space-y-3 sticky top-28">
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-4 mb-6 flex items-center">
              <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
              Navegación Módulos
            </div>
            {[
              { id: 'resumen', label: 'Resumen General', icon: TrendingUp },
              { id: 'socios', label: 'Gestión de Socios', icon: Users },
              { id: 'calendario', label: 'Programas / Calendario', icon: Calendar },
              { id: 'cuotas', label: 'Control de Cuotas', icon: CreditCard },
              { id: 'actas', label: 'Libro de Actas', icon: FileText },
              { id: 'donaciones', label: 'Donaciones Recibidas', icon: Gift },
              { id: 'beneficios', label: 'Beneficios a Socios', icon: Award },
            ].filter(tab => allowedTabs.includes(tab.id)).map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl font-bold transition-all duration-300 ${
                    getTabStyles(tab.id, active)
                  }`}
                >
                  <Icon 
                    size={22} 
                    className={`transition-colors ${
                      active 
                        ? 'text-white' 
                        : 'text-slate-400 group-hover:text-blue-600'
                    }`} 
                  />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 min-w-0">
          {/* Mobile Navigation (Horizontal Scrollable Tabs) */}
          <div className="lg:hidden w-full overflow-x-auto pb-6 mb-2 flex space-x-3 scrollbar-none pl-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {[
              { id: 'resumen', label: 'Resumen General', icon: TrendingUp },
              { id: 'socios', label: 'Gestión de Socios', icon: Users },
              { id: 'calendario', label: 'Programas / Calendario', icon: Calendar },
              { id: 'cuotas', label: 'Control de Cuotas', icon: CreditCard },
              { id: 'actas', label: 'Libro de Actas', icon: FileText },
              { id: 'donaciones', label: 'Donaciones Recibidas', icon: Gift },
              { id: 'beneficios', label: 'Beneficios a Socios', icon: Award },
            ].filter(tab => allowedTabs.includes(tab.id)).map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center space-x-2.5 px-6 py-3.5 rounded-[1.5rem] font-bold text-sm transition-all duration-300 whitespace-nowrap border shadow-sm flex-shrink-0 ${
                    active 
                      ? getMobileTabStyles(tab.id)
                      : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-blue-900'
                  }`}
                >
                  <Icon 
                    size={16} 
                    className={`transition-colors flex-shrink-0 ${
                      active ? 'text-white' : 'text-slate-400'
                    }`} 
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
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
                            <th className="py-6.5 px-6">Estado Financiero</th>
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
                                <td className="py-6.5 px-6">
                                  <div className="space-y-1">
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                      socio.estadoCuotas === 'Al día' ? 'bg-green-50 text-green-700 border border-green-100' :
                                      socio.estadoCuotas === 'Pendiente' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
                                      'bg-red-50 text-red-700 border border-red-100'
                                    }`}>
                                      ● {socio.estadoCuotas}
                                    </span>
                                    {socio.montoPendiente > 0 && (
                                      <p className="text-xs font-bold text-slate-700 mt-1">Q {socio.montoPendiente.toFixed(2)}</p>
                                    )}
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
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{socio.puesto || 'Socio Regular'}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs font-semibold pt-1">
                              <div>
                                <span className="text-slate-400 text-[10px] uppercase tracking-wider block mb-0.5">Contacto</span>
                                <div className="space-y-1 text-slate-700">
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
                              <div>
                                <span className="text-slate-400 text-[10px] uppercase tracking-wider block mb-0.5">Estatus Financiero</span>
                                <div className="space-y-1">
                                  <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                    socio.estadoCuotas === 'Al día' ? 'bg-green-50 text-green-700 border border-green-100' :
                                    socio.estadoCuotas === 'Pendiente' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
                                    'bg-red-50 text-red-700 border border-red-100'
                                  }`}>
                                    ● {socio.estadoCuotas}
                                  </span>
                                  {socio.montoPendiente > 0 && (
                                    <p className="font-extrabold text-slate-800 text-xs">Q {socio.montoPendiente.toFixed(2)}</p>
                                  )}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* KPI 1 (Total Donaciones for Admin/Tesorero, Total Actas for Secretario, Total Socios for Afiliacion) */}
                {user.rol === UserRole.SECRETARIO ? (
                  <div className="bg-gradient-to-br from-blue-900 to-indigo-950 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                      <FileText size={120} />
                    </div>
                    <h3 className="text-blue-200 text-sm font-bold uppercase tracking-widest">Biblioteca de Actas</h3>
                    <p className="text-4xl font-black mt-2">{actas.length} Actas</p>
                    <p className="text-xs text-yellow-400 mt-3 font-semibold">Documentos redactados y firmados</p>
                  </div>
                ) : user.rol === UserRole.PRESIDENTE_AFILIACION ? (
                  <div className="bg-gradient-to-br from-blue-900 to-indigo-950 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                      <Award size={120} />
                    </div>
                    <h3 className="text-blue-200 text-sm font-bold uppercase tracking-widest">Total de Socios Afiliados</h3>
                    <p className="text-4xl font-black mt-2">{socios.length} Miembros</p>
                    <p className="text-xs text-yellow-400 mt-3 font-semibold">Socios registrados en el club</p>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-blue-900 to-indigo-950 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                      <Gift size={120} />
                    </div>
                    <h3 className="text-blue-200 text-sm font-bold uppercase tracking-widest">Total Donaciones Recibidas</h3>
                    <p className="text-4xl font-black mt-2">Q {totalDonaciones.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-yellow-400 mt-3 font-semibold">Total acumulado en este año fiscal</p>
                  </div>
                )}

                {/* KPI 2 (Cuotas Pendientes for Admin/Tesorero/Afiliacion, Actividades Planificadas for Secretario) */}
                {user.rol === UserRole.SECRETARIO ? (
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-sm relative overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none text-blue-900">
                      <Calendar size={120} />
                    </div>
                    <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest">Programas Planificados</h3>
                    <p className="text-4xl font-black text-slate-800 mt-2">{actividades.length} Actividades</p>
                    <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg w-fit mt-3 font-semibold">
                      <CheckCircle size={12} className="mr-1" />
                      En agenda y calendario
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-sm relative overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none text-blue-900">
                      <CreditCard size={120} />
                    </div>
                    <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest">Saldo de Cuotas Pendiente</h3>
                    <p className="text-4xl font-black text-slate-800 mt-2">Q {totalCuotasPendientes.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
                    <div className="flex items-center text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg w-fit mt-3 font-semibold">
                      <AlertTriangle size={12} className="mr-1" />
                      {user.rol === UserRole.PRESIDENTE_AFILIACION ? 'Requiere gestión de membresía' : 'Requiere seguimiento de tesorería'}
                    </div>
                  </div>
                )}

                {/* KPI 3 (Socios Activos - visible to all) */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-sm relative overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none text-blue-900">
                    <Award size={120} />
                  </div>
                  <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest">Estado de Socios Activos</h3>
                  <p className="text-4xl font-black text-slate-800 mt-2">{sociosAlDia} / {socios.length}</p>
                  <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg w-fit mt-3 font-semibold">
                    <CheckCircle size={12} className="mr-1" />
                    Socios solventes ("Al día")
                  </div>
                </div>
              </div>

              {/* Quick Summary Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Column 1 (Pending fees for Tesorero/Afiliacion, Activities list for Secretario/Admin) */}
                {user.rol === UserRole.TESORERO || user.rol === UserRole.PRESIDENTE_AFILIACION ? (
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
                ) : (
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
                )}

                {/* Column 2 (Donations for Tesorero, Actas for Secretario/Admin, New Members for Afiliacion) */}
                {user.rol === UserRole.TESORERO ? (
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
                ) : user.rol === UserRole.PRESIDENTE_AFILIACION ? (
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight">Nuevos Afiliados</h3>
                      <button onClick={() => setActiveTab('cuotas')} className="text-sm text-blue-900 font-bold hover:underline">Ver cuotas</button>
                    </div>
                    <div className="space-y-4">
                      {socios.slice().reverse().slice(0, 3).map(s => (
                        <div key={s.id} className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                          <img 
                            src={s.foto} 
                            alt={s.nombre} 
                            className="w-10 h-10 rounded-full border border-slate-100 object-cover mr-4 cursor-zoom-in" 
                            onClick={() => setSelectedPhoto({ url: s.foto, title: s.nombre })}
                          />
                          <div className="flex-grow min-w-0">
                            <p className="font-extrabold text-slate-800 truncate">{s.nombre}</p>
                            <p className="text-xs text-slate-400 mt-1 truncate">Ingreso: {s.fechaIngreso}</p>
                          </div>
                          <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full uppercase ml-3">
                            {s.puesto || 'Socio'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
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
                )}
              </div>
            </div>
          )}

          {/* TAB: PROGRAMAS / CALENDARIO */}
          {activeTab === 'calendario' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">Gestión de Programas y Calendario</h3>
                <button 
                  onClick={() => setShowAddActividad(true)}
                  className="bg-blue-900 hover:bg-blue-800 text-white font-black px-6 py-3 rounded-xl flex items-center space-x-2 shadow-lg shadow-blue-900/10"
                >
                  <Plus size={18} />
                  <span>Programar Actividad</span>
                </button>
              </div>

              {/* Form Modal */}
              {showAddActividad && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
                  <form onSubmit={handleAddActividad} className="bg-white rounded-[2.5rem] p-10 md:p-12 max-w-lg w-full space-y-8 shadow-2xl border border-slate-100">
                    <div className="flex justify-between items-center">
                      <h4 className="text-2xl font-black text-slate-800">Nueva Actividad</h4>
                      <button type="button" onClick={() => setShowAddActividad(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} /></button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Título del Evento</label>
                        <input 
                          type="text" 
                          required 
                          value={newActividad.titulo} 
                          onChange={e => setNewActividad({...newActividad, titulo: e.target.value})}
                          placeholder="Ej. Colecta Anual del Juguete"
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Descripción</label>
                        <textarea 
                          rows={3} 
                          value={newActividad.descripcion} 
                          onChange={e => setNewActividad({...newActividad, descripcion: e.target.value})}
                          placeholder="Breve detalle de la actividad..."
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Fecha y Hora</label>
                          <input 
                            type="datetime-local" 
                            required 
                            value={newActividad.fecha} 
                            onChange={e => setNewActividad({...newActividad, fecha: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Lugar</label>
                          <input 
                            type="text" 
                            required 
                            value={newActividad.lugar} 
                            onChange={e => setNewActividad({...newActividad, lugar: e.target.value})}
                            placeholder="Ej. Sede del Club"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 pt-2">
                        <input 
                          type="checkbox" 
                          id="publica" 
                          checked={newActividad.publica} 
                          onChange={e => setNewActividad({...newActividad, publica: e.target.checked})}
                          className="w-5 h-5 rounded text-blue-900 border-slate-300 focus:ring-blue-900"
                        />
                        <label htmlFor="publica" className="text-sm font-bold text-slate-700 select-none">Hacer actividad pública en el sitio web</label>
                      </div>
                    </div>

                    <div className="flex space-x-4 pt-4">
                      <button 
                        type="button" 
                        onClick={() => setShowAddActividad(false)}
                        className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        className="w-1/2 bg-blue-900 hover:bg-blue-800 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-blue-900/10"
                      >
                        Agregar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Activities List */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-sm overflow-hidden">
                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold text-xs uppercase tracking-wider">
                        <th className="py-7 px-6">Actividad</th>
                        <th className="py-7 px-6">Fecha</th>
                        <th className="py-7 px-6">Lugar</th>
                        <th className="py-7 px-6">Alcance</th>
                        <th className="py-7 px-6 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {actividades.map(act => (
                        <tr key={act.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-7 px-6">
                            <p className="font-extrabold text-slate-800 text-base">{act.titulo}</p>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm truncate">{act.descripcion}</p>
                          </td>
                          <td className="py-7 px-6 text-sm text-slate-600 font-medium">{act.fecha}</td>
                          <td className="py-7 px-6 text-sm text-slate-600 font-medium">{act.lugar}</td>
                          <td className="py-7 px-6">
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                              act.publica ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                            }`}>
                              {act.publica ? 'Público' : 'Solo Socios'}
                            </span>
                          </td>
                          <td className="py-7 px-6 text-right">
                            <button 
                              onClick={() => handleDeleteActividad(act.id)}
                              className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              title="Eliminar actividad"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View: Cards */}
                <div className="block md:hidden divide-y divide-slate-100">
                  {actividades.map(act => (
                    <div key={act.id} className="p-6 space-y-4 hover:bg-slate-50/30 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-base">{act.titulo}</h4>
                          <span className={`inline-block text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase mt-1.5 ${
                            act.publica ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {act.publica ? 'Público' : 'Solo Socios'}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleDeleteActividad(act.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Eliminar actividad"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {act.descripcion && (
                        <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100/50 leading-relaxed text-justify">{act.descripcion}</p>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-xs font-semibold pt-1">
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase tracking-wider block mb-0.5">Fecha y Hora</span>
                          <span className="text-slate-700">{act.fecha}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase tracking-wider block mb-0.5">Lugar</span>
                          <span className="text-slate-750 truncate block">{act.lugar}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: CONTROL DE CUOTAS */}
          {activeTab === 'cuotas' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">Cobros y Control de Cuotas</h3>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-4 top-3 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={socioSearch}
                    onChange={e => setSocioSearch(e.target.value)}
                    placeholder="Buscar socio..."
                    className="w-full pl-11 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Members Cuotas Table */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-sm overflow-hidden">
                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold text-xs uppercase tracking-wider">
                        <th className="py-7 px-6">Socio</th>
                        <th className="py-7 px-6">Puesto</th>
                        <th className="py-7 px-6">Estado</th>
                        <th className="py-7 px-6">Monto Pendiente</th>
                        <th className="py-7 px-6 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSocios.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-7 px-6 flex items-center space-x-4">
                            <img 
                              src={s.foto} 
                              alt={s.nombre} 
                              className="w-10 h-10 rounded-full border border-slate-100 object-cover cursor-zoom-in" 
                              onClick={() => setSelectedPhoto({ url: s.foto, title: s.nombre })}
                            />
                            <div>
                              <p className="font-extrabold text-slate-800">{s.nombre}</p>
                              <p className="text-xs text-slate-400">{s.correo}</p>
                            </div>
                          </td>
                          <td className="py-7 px-6 text-sm text-slate-500 font-bold uppercase">{s.puesto || 'Socio Activo'}</td>
                          <td className="py-7 px-6">
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                              s.estadoCuotas === 'Al día' 
                                ? 'bg-green-50 text-green-700' 
                                : s.estadoCuotas === 'Pendiente' 
                                  ? 'bg-yellow-50 text-yellow-700' 
                                  : 'bg-red-50 text-red-700'
                            }`}>
                              {s.estadoCuotas}
                            </span>
                          </td>
                          <td className="py-7 px-6 font-extrabold text-slate-800 text-base">Q {s.montoPendiente.toFixed(2)}</td>
                          <td className="py-7 px-6 text-right flex items-center justify-end space-x-2">
                            {s.montoPendiente > 0 ? (
                              <>
                                <button
                                  onClick={() => handleRegistrarPago(s.id)}
                                  className="bg-green-50 text-green-700 hover:bg-green-100 px-4 py-2 rounded-xl font-bold text-xs transition-colors flex items-center space-x-1"
                                  title="Marcar como pagado"
                                >
                                  <Check size={14} />
                                  <span>Pagar</span>
                                </button>
                                <button
                                  onClick={() => handleEnviarRecordatorio(s)}
                                  className="bg-slate-100 text-slate-700 hover:bg-slate-200 p-2 rounded-xl font-bold text-xs transition-colors"
                                  title="Enviar recordatorio por correo"
                                >
                                  <Send size={14} />
                                </button>
                              </>
                            ) : (
                              <span className="text-green-600 font-bold text-xs flex items-center px-4 py-2 bg-green-50/50 rounded-xl">
                                <CheckCircle size={14} className="mr-1" />
                                Solvente
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View: Cards */}
                <div className="block md:hidden divide-y divide-slate-100">
                  {filteredSocios.map(s => (
                    <div key={s.id} className="p-6 space-y-4 hover:bg-slate-50/30 transition-colors">
                      <div className="flex items-center space-x-4">
                        <img 
                          src={s.foto} 
                          alt={s.nombre} 
                          className="w-12 h-12 rounded-full border border-slate-100 object-cover cursor-zoom-in" 
                          onClick={() => setSelectedPhoto({ url: s.foto, title: s.nombre })}
                        />
                        <div className="min-w-0 flex-grow">
                          <h4 className="font-extrabold text-slate-800 text-base leading-tight truncate">{s.nombre}</h4>
                          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{s.puesto || 'Socio Regular'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs font-semibold pt-1">
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase tracking-wider block mb-0.5">Correo</span>
                          <span className="text-slate-705 truncate block">{s.correo}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase tracking-wider block mb-0.5">Estado / Monto</span>
                          <div className="space-y-1">
                            <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              s.estadoCuotas === 'Al día' 
                                ? 'bg-green-50 text-green-700' 
                                : s.estadoCuotas === 'Pendiente' 
                                  ? 'bg-yellow-50 text-yellow-700' 
                                  : 'bg-red-50 text-red-700'
                            }`}>
                              {s.estadoCuotas}
                            </span>
                            <p className="font-black text-slate-850 text-sm">Q {s.montoPendiente.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end items-center pt-3 border-t border-slate-100">
                        {s.montoPendiente > 0 ? (
                          <div className="flex space-x-2 w-full justify-end">
                            <button
                              onClick={() => handleRegistrarPago(s.id)}
                              className="bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold text-xs transition-colors flex items-center justify-center space-x-1"
                            >
                              <Check size={14} />
                              <span>Pagar</span>
                            </button>
                            <button
                              onClick={() => handleEnviarRecordatorio(s)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center"
                              title="Enviar recordatorio por correo"
                            >
                              <Send size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-green-600 font-bold text-xs flex items-center px-4 py-2 bg-green-50/50 rounded-xl">
                            <CheckCircle size={14} className="mr-1" />
                            Solvente
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: LIBRO DE ACTAS */}
          {activeTab === 'actas' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {showAddActa ? (
                <div className="bg-white rounded-[2.5rem] p-10 md:p-14 border border-slate-200/80 shadow-sm space-y-10 animate-in fade-in duration-300">
                  
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                    <div>
                      <h4 className="text-3xl font-black text-blue-900 tracking-tight">Redactar Acta de Sesión</h4>
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
                  <div className="flex justify-between items-center relative my-8 px-2 sm:px-8">
                    <div className="absolute left-2 sm:left-8 right-2 sm:right-8 top-1/2 -translate-y-1/2 h-1 bg-slate-100 rounded-full z-0"></div>
                    <div 
                      className="absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 h-1 bg-amber-500 rounded-full z-0 transition-all duration-500"
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
                          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                            active 
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-orange-500/30 scale-110 ring-4 ring-orange-50' 
                              : past
                                ? 'bg-amber-100 text-amber-600'
                                : 'bg-white text-slate-300 border-2 border-slate-100 group-hover:border-amber-200 group-hover:text-amber-400'
                          }`}>
                            <Icon size={active ? 20 : 18} />
                          </div>
                          <span className={`text-[10px] sm:text-xs font-bold transition-colors ${
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
                        <div className="bg-slate-50/50 rounded-3xl p-6 md:p-8 space-y-6 border border-slate-100/60 shadow-sm">
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
                        <div className="bg-slate-50/50 rounded-3xl p-6 md:p-8 border border-slate-100/60 shadow-sm space-y-6">
                          
                          {/* Attendance stats */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
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
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            
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
                        <div className="bg-slate-50/50 p-6 md:p-8 rounded-3xl border border-slate-100/60 shadow-sm space-y-6">
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
                        <div className="bg-slate-50/50 p-6 md:p-8 rounded-3xl border border-slate-100/60 shadow-sm space-y-6">
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
                                <div key={sol.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 space-y-5">
                                  <div className="flex flex-col md:flex-row md:justify-between items-start gap-5">
                                    <div className="flex-1">
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
                                    <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-200/60 flex-shrink-0 self-start">
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
                                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
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
                                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
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
                                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
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
                        <div className="bg-slate-50/50 p-6 md:p-8 rounded-3xl border border-slate-100/60 space-y-6 shadow-sm">
                          <h3 className="text-base font-black text-blue-900 uppercase tracking-widest flex items-center">
                            <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mr-3"><Plus size={16}/></span>
                            Agregar Punto de Agenda
                          </h3>
                          <div className="grid grid-cols-1 gap-6">
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
                            
                            {/* Formato vertical en vez de columnas para mayor espacio */}
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

                        {/* List of current agenda points */}
                        <div className="space-y-5">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Puntos en esta Acta ({(actaWizardData.puntosAgenda || []).length})</h4>
                          {(actaWizardData.puntosAgenda || []).length === 0 ? (
                            <div className="text-center py-12 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 text-sm font-medium italic">
                              No se han agregado puntos de agenda aún. Utiliza el formulario superior para añadir temas.
                            </div>
                          ) : (
                            <div className="space-y-5">
                              {(actaWizardData.puntosAgenda || []).map((p, idx) => (
                                <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm relative group flex flex-col justify-between hover:shadow-md transition-all duration-300 animate-in slide-in-from-bottom-2">
                                  <div className="space-y-4">
                                    <div className="flex justify-between items-start gap-4">
                                      <div className="flex items-center space-x-3">
                                        <span className="bg-amber-100 text-amber-700 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black">
                                          {idx + 1}
                                        </span>
                                        <h5 className="font-extrabold text-slate-800 text-base leading-tight">{p.tema || 'Punto sin tema'}</h5>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveAgendaPoint(idx)}
                                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all bg-slate-50/50"
                                        title="Eliminar punto"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    </div>
                                    
                                    <div className="pl-11 space-y-4 pt-2">
                                      {p.debate && (
                                        <div>
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Debate / Discusión</span>
                                          <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed whitespace-pre-wrap text-justify">{p.debate}</p>
                                        </div>
                                      )}
                                      {p.acuerdo && (
                                        <div>
                                          <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider block mb-1.5">Acuerdo / Resolución</span>
                                          <p className="text-sm text-amber-900 bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 leading-relaxed whitespace-pre-wrap text-justify">{p.acuerdo}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {actaWizardStep === 'vista_previa' && (
                      <div className="space-y-4 animate-in fade-in duration-350">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-slate-700">Previsualización Narrativa del Acta</label>
                            <span className="text-[10px] font-black bg-yellow-50 text-yellow-750 px-2 py-0.5 rounded-md uppercase">Generado automáticamente</span>
                          </div>
                          <textarea 
                            readOnly
                            rows={10}
                            value={compileActaText(actaWizardData)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold text-xs font-serif outline-none resize-none text-justify select-all"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer / Navigation */}
                  <div className="pt-4 border-t border-slate-100 flex justify-between gap-4 flex-shrink-0">
                    <div>
                      {actaWizardStep !== 'datos' && (
                        <button
                          type="button"
                          onClick={() => {
                            const steps: typeof actaWizardStep[] = ['datos', 'asistencia', 'protocolo', 'solicitudes', 'libre', 'vista_previa'];
                            const idx = steps.indexOf(actaWizardStep);
                            if (idx > 0) setActaWizardStep(steps[idx - 1]);
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold px-6 py-2.5 rounded-xl transition-all text-sm"
                        >
                          Atrás
                        </button>
                      )}
                    </div>

                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowAddActa(false)}
                        className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 font-extrabold px-6 py-2.5 rounded-xl transition-all text-sm"
                      >
                        Cancelar
                      </button>
                      
                      {actaWizardStep !== 'vista_previa' ? (
                        <button
                          type="button"
                          onClick={() => {
                            const steps: typeof actaWizardStep[] = ['datos', 'asistencia', 'protocolo', 'solicitudes', 'libre', 'vista_previa'];
                            const idx = steps.indexOf(actaWizardStep);
                            if (idx < steps.length - 1) setActaWizardStep(steps[idx + 1]);
                          }}
                          className="bg-blue-900 hover:bg-blue-800 text-white font-black px-6 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg text-sm"
                        >
                          Siguiente
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSaveStructuredActa}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg text-sm"
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
                      className="bg-blue-900 hover:bg-blue-800 text-white font-black px-6 py-3 rounded-xl flex items-center space-x-2 shadow-lg shadow-blue-900/10"
                    >
                      <Plus size={18} />
                      <span>Redactar Acta</span>
                    </button>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-grow">
                      <Search className="absolute left-4 top-3 text-slate-400" size={18} />
                      <input
                        type="text"
                        value={actaSearch}
                        onChange={e => setActaSearch(e.target.value)}
                        placeholder="Buscar por palabra clave..."
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Filter size={18} className="text-slate-400" />
                      <select 
                        value={actaFilterCategory} 
                        onChange={e => setActaFilterCategory(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-900"
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
                      <div key={acta.id} className="bg-white p-6 md:p-9 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-4 min-w-0">
                          <div className="bg-yellow-50 text-yellow-605 p-3.5 rounded-2xl flex-shrink-0">
                            <FileText size={24} />
                          </div>
                          <div className="min-w-0 flex-grow">
                            <h4 className="font-extrabold text-slate-800 text-base md:text-lg truncate">{acta.titulo}</h4>
                            <p className="text-xs text-slate-450 mt-1">
                              Redactada por <span className="font-bold text-blue-900/60 uppercase">{acta.autor}</span> • {acta.fecha}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between md:justify-end space-x-3 w-full md:w-auto pt-4 md:pt-0 border-t border-slate-100 md:border-t-0">
                          <span className="text-[10px] font-black bg-slate-100 text-slate-650 px-3 py-1 rounded-full uppercase">
                            {acta.categoria || 'Ordinaria'}
                          </span>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleEditActaClick(acta)}
                              className="p-2 text-slate-400 hover:text-blue-900 hover:bg-blue-50 rounded-xl transition-all"
                              title="Editar acta"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => generateActaPDF(acta)}
                              className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                              title="Descargar PDF"
                            >
                              <Download size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteActa(acta.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
                  <form onSubmit={handleAddBeneficio} className="bg-white rounded-[2.5rem] p-10 md:p-12 max-w-lg w-full space-y-8 shadow-2xl border border-slate-100">
                    <div className="flex justify-between items-center">
                      <h4 className="text-2xl font-black text-slate-800">Añadir Beneficio/Convenio</h4>
                      <button type="button" onClick={() => setShowAddBeneficio(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} /></button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Nombre del Beneficio</label>
                        <input 
                          type="text" 
                          required 
                          value={newBeneficio.titulo} 
                          onChange={e => setNewBeneficio({...newBeneficio, titulo: e.target.value})}
                          placeholder="Ej. Descuento en Consultas Dentales"
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Establecimiento / Alianza</label>
                          <input 
                            type="text" 
                            required 
                            value={newBeneficio.convenioCon} 
                            onChange={e => setNewBeneficio({...newBeneficio, convenioCon: e.target.value})}
                            placeholder="Ej. Clínica Dental Xela"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Descuento Ofrecido</label>
                          <input 
                            type="text" 
                            required 
                            value={newBeneficio.descuento} 
                            onChange={e => setNewBeneficio({...newBeneficio, descuento: e.target.value})}
                            placeholder="Ej. 20% o Q50"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Categoría</label>
                        <select
                          value={newBeneficio.categoria}
                          onChange={e => setNewBeneficio({...newBeneficio, categoria: e.target.value as any})}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-slate-700 font-bold"
                        >
                          <option value="Salud">Salud</option>
                          <option value="Comercio">Comercio</option>
                          <option value="Recreación">Recreación</option>
                          <option value="Otros">Otros</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Descripción Corta</label>
                        <textarea 
                          rows={2} 
                          value={newBeneficio.descripcion} 
                          onChange={e => setNewBeneficio({...newBeneficio, descripcion: e.target.value})}
                          placeholder="Detalles sobre cómo aplicar el beneficio..."
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all resize-none text-sm"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        onClick={() => setBeneficios(beneficios.filter(b => b.id !== ben.id))}
                        className="text-slate-300 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
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
        </main>
      </div>

      {/* --- UNIFIED MODAL FOR EDITING / REGISTERING SOCIO --- */}
      {editingSocio && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-10 space-y-6 relative animate-in zoom-in-95 duration-300">
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
              {/* Photo & Estatus Row */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
                <div className="relative group flex-shrink-0">
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

                <div className="flex-grow space-y-4 w-full">
                  {/* Estatus Institucional select */}
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

              {/* Name & Contact */}
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <span>Club de Leones</span>
                  </label>
                  <input 
                    type="text"
                    value={editSocioForm.club || 'QUETZALTENANGO'}
                    onChange={e => setEditSocioForm(prev => ({ ...prev, club: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800"
                  />
                </div>
              </div>

              {/* Puesto & Rol */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <span>Puesto en Junta Directiva *</span>
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
              </div>

              {/* Financiero: Cuotas y Saldo */}
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
    </div>
  );
};

export default SuperAdmin;
