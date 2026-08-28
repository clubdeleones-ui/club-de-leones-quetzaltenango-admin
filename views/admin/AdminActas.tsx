import { safeSetItem } from '../../utils/storage';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  FileText, Plus, Search, Filter, Trash2, Edit, Download, X, Clock, Users, Mail, Briefcase, CheckCircle, Pencil, Building, BookOpen, ChevronUp, ChevronDown, ArrowUp, ArrowDown, GripVertical, ListOrdered, ArrowUpDown, CheckCircle2, MessageSquare, Bookmark, Sparkles, Wand2, Loader2, Key, RotateCcw, Archive, Calendar
} from 'lucide-react';



import { Acta, Socio, Solicitud, UserRole } from '../../types';
import { firebaseService } from '../../services/firebaseService';
import { geminiService, cleanAndDeduplicateCL } from '../../services/geminiService';
import { useClubData } from '../../context/ClubDataContext';
import { useToast } from '../../context/ToastContext';
import { getWrittenDateTimeSpanish, formatDisplayDate } from '../../utils/dateSpanishFormatter';
import { generateActaPDF, generateActaCode } from '../../utils/pdfGenerator';
import { FormattedActa } from '../../components/FormattedActa';

interface AdminActasProps {
  user: Socio;
}

export const AdminActas: React.FC<AdminActasProps> = ({ user }) => {
  const { 
    socios, 
    actas: dbActas, 
    solicitudes, 
    agendas 
  } = useClubData();

  const { showToast } = useToast();

  const [actas, setActas] = useState<Acta[]>(dbActas);
  useEffect(() => {
    setActas(dbActas);
  }, [dbActas]);

  const [actaSearch, setActaSearch] = useState('');
  const [actaFilterCategory, setActaFilterCategory] = useState('Todas');
  const [showAddActa, setShowAddActa] = useState(() => {
    return sessionStorage.getItem('super_admin_show_add_acta') === 'true';
  });

  const [editingActaId, setEditingActaId] = useState<string | null>(null);
  const [actasViewMode, setActasViewMode] = useState<'activas' | 'papelera'>('activas');
  const [deleteActaConfirmId, setDeleteActaConfirmId] = useState<string | null>(null);
  const [deleteActaConfirmText, setDeleteActaConfirmText] = useState('');
  const [isPermanentDelete, setIsPermanentDelete] = useState(false);
  const [publishedSuccessModal, setPublishedSuccessModal] = useState<{ isOpen: boolean; title: string; code: string; isEdit: boolean; acta: Acta } | null>(null);
  const [showInvocacionModal, setShowInvocacionModal] = useState(false);
  const [showSaludoModal, setShowSaludoModal] = useState(false);

  // Wizard state for structured minutes
  const [actaWizardStep, setActaWizardStep] = useState<'datos' | 'asistencia' | 'protocolo' | 'solicitudes' | 'libre' | 'vista_previa'>(() => {
    const saved = sessionStorage.getItem('super_admin_acta_wizard_step');
    if (saved) return saved as any;
    return 'datos';
  });

  useEffect(() => {
    sessionStorage.setItem('super_admin_show_add_acta', String(showAddActa));
    if (!showAddActa) {
      sessionStorage.removeItem('super_admin_acta_wizard_step');
      sessionStorage.removeItem('super_admin_acta_wizard_data');
    }
  }, [showAddActa]);

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
    const today = new Date();
    return {
      titulo: '',
      categoria: 'Ordinaria' as 'Ordinaria' | 'Extraordinaria' | 'Reunión de Comisión',
      lugar: 'Quetzaltenango, Sede Social denominada "La Cueva", ubicada en la Calle Rodolfo Robles, 24-53 de la zona 1.',
      fechaActa: today.toISOString().split('T')[0],
      fechaHoraText: getWrittenDateTimeSpanish(today),
      invocacionResponsableType: 'socio' as 'socio' | 'invitado',
      invocacionSocioId: '',
      invocacionInvitadoName: '',
      saludoResponsableType: 'socio' as 'socio' | 'invitado',
      saludoSocioId: '',
      saludoInvitadoName: '',
      solicitudesResoluciones: {} as Record<string, { decision: 'Aprobada' | 'Rechazada' | 'Descartada' | 'Pendiente', razon: string }>,
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
  const [showOrganizePointsModal, setShowOrganizePointsModal] = useState(false);


  const debateRef = useRef<HTMLTextAreaElement>(null);

  const sortedAllSocios = useMemo(() => {
    return [...socios].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [socios]);

  const presidentName = useMemo(() => {
    const president = socios.find((s: any) => s.puesto?.toLowerCase().includes('presidente del club') || s.puesto?.toLowerCase() === 'presidente') || socios.find((s: any) => s.puesto?.toLowerCase().includes('presidente'));
    return president ? president.nombre : 'Edwin Ernesto Pacheco López';
  }, [socios]);

  const secretaryName = useMemo(() => {
    const secretary = socios.find((s: any) => s.puesto?.toLowerCase().includes('secretario del club') || s.puesto?.toLowerCase() === 'secretario') || socios.find((s: any) => s.puesto?.toLowerCase().includes('secretario'));
    return secretary ? secretary.nombre : 'Flor Rodríguez Cifuentes';
  }, [socios]);

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
  };

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
    return solicitudes.filter(s => s.tipo === 'agenda' && !s.archivada);
  }, [solicitudes]);

  const handleInsertMemberMention = (memberName: string) => {
    const cleanMemberName = memberName.replace(/^(?:C\.L\.|\bCL\b|Compañero León)\s*/i, '').trim();
    const formattedName = `C.L. ${cleanMemberName}: `;
    const textarea = debateRef.current;
    if (!textarea) {
      if (selectedAgendaPointTab === 'new') {
        setNewAgendaPoint(prev => ({
          ...prev,
          debate: cleanAndDeduplicateCL(
            prev.debate 
              ? (prev.debate.endsWith(' ') || prev.debate.endsWith('\n') ? `${prev.debate}${formattedName}` : `${prev.debate} ${formattedName}`)
              : formattedName
          )
        }));
      } else {
        const currentDebate = (actaWizardData.puntosAgenda || [])[selectedAgendaPointTab as number]?.debate || '';
        const rawNewDebate = currentDebate 
          ? (currentDebate.endsWith(' ') || currentDebate.endsWith('\n') ? `${currentDebate}${formattedName}` : `${currentDebate} ${formattedName}`)
          : formattedName;
        handleUpdateAgendaPoint(
          selectedAgendaPointTab as number, 
          'debate', 
          cleanAndDeduplicateCL(rawNewDebate)
        );
      }
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    let before = text.substring(0, start);
    const after = text.substring(end, text.length);
    
    // Si justo antes del cursor ya está escrito "C.L." o "C.L. ", lo removemos de before para no duplicar
    if (/(?:C\.L\.|\bCL\b|Compañero León)\s*$/i.test(before)) {
      before = before.replace(/(?:C\.L\.|\bCL\b|Compañero León)\s*$/i, '');
    }

    const needsLeadingSpace = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n');
    const insertion = needsLeadingSpace ? ` ${formattedName}` : formattedName;
    const rawValue = before + insertion + after;
    const newValue = cleanAndDeduplicateCL(rawValue);

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
      const newCursorPos = Math.min(before.length + insertion.length, newValue.length);
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

    const pendingSols = solicitudes.filter(s => s.estado === 'Pendiente' && !s.archivada);
    // Exclude solicitudes marked as 'Descartada' from appearing in the Acta text
    const evaluatedSols = pendingSols.filter(sol => {
      const res = data.solicitudesResoluciones[sol.id];
      return !res || res.decision !== 'Descartada';
    });

    let solicitudesSection = '';
    if (evaluatedSols.length === 0) {
      solicitudesSection = 'No se conocieron solicitudes en esta sesión.\n';
    } else {
      solicitudesSection = 'Se procedió a dar lectura a las solicitudes ingresadas en el sistema, resolviéndose de la siguiente manera:\n\n';
      evaluatedSols.forEach((sol, idx) => {
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
        const cleanSocio = p.socioSolicitante ? cleanAndDeduplicateCL(p.socioSolicitante).replace(/^C\.L\.\s*/i, '').trim() : '';
        const propLabel = cleanSocio ? ` (Solicitado por: C.L. ${cleanSocio})` : '';
        agendaSection += `Punto ${idx + 1}: ${cleanAndDeduplicateCL(p.tema.trim()) || 'Sin tema'}${propLabel}\n`;
        agendaSection += `   - Debate: ${cleanAndDeduplicateCL(p.debate.trim()) || 'Sin debate registrado.'}\n`;
        agendaSection += `   - Acuerdo: ${cleanAndDeduplicateCL(p.acuerdo.trim()) || 'Sin acuerdo registrado.'}\n\n`;
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
    const initialResoluciones: Record<string, { decision: 'Aprobada' | 'Rechazada' | 'Descartada' | 'Pendiente', razon: string }> = {};
    const pendingSols = solicitudes.filter(s => s.estado === 'Pendiente' && !s.archivada);
    pendingSols.forEach(s => {
      initialResoluciones[s.id] = { decision: 'Pendiente', razon: '' };
    });

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const autoDateTime = getWrittenDateTimeSpanish(today);
    const defaultSocioId = socios[0]?.id || '';
    const activeActasCount = actas.filter(a => !a.enPapelera && a.estado !== 'Papelera').length;

    setEditingActaId(null);
    setActaWizardData({
      titulo: '',
      categoria: 'Ordinaria',
      lugar: defaultLugar,
      fechaActa: todayStr,
      fechaHoraText: autoDateTime,
      invocacionResponsableType: 'socio',
      invocacionSocioId: defaultSocioId,
      invocacionInvitadoName: '',
      saludoResponsableType: 'socio',
      saludoSocioId: defaultSocioId,
      saludoInvitadoName: '',
      solicitudesResoluciones: initialResoluciones,
      puntosAgenda: [],
      asistencia: [],
      numeroActa: (activeActasCount + 1).toString()
    });
    setSelectedAgendaPointTab('new');
    setActaWizardStep('datos');
    setShowAddActa(true);
  };

  const handleEditActaClick = (acta: Acta) => {
    const defaultLugar = 'Quetzaltenango, Sede Social denominada "La Cueva", ubicada en la Calle Rodolfo Robles, 24-53 de la zona 1.';
    let wData = (acta as any).wizardData ? { ...(acta as any).wizardData } : null;

    const rawFecha = acta.fecha ? (acta.fecha.includes('T') ? acta.fecha.split('T')[0] : acta.fecha) : new Date().toISOString().split('T')[0];

    if (!wData) {
      wData = {
        titulo: acta.titulo,
        categoria: acta.categoria || 'Ordinaria',
        lugar: defaultLugar,
        fechaActa: rawFecha,
        fechaHoraText: getWrittenDateTimeSpanish(new Date(rawFecha + 'T18:00:00')),
        invocacionResponsableType: 'socio',
        invocacionSocioId: socios[0]?.id || '',
        invocacionInvitadoName: '',
        saludoResponsableType: 'socio',
        saludoSocioId: socios[0]?.id || '',
        saludoInvitadoName: '',
        solicitudesResoluciones: {},
        puntosAgenda: acta.contenido ? [
          {
            tema: 'Contenido Registrado del Acta',
            debate: acta.contenido,
            acuerdo: ''
          }
        ] : [],
        asistencia: [],
        numeroActa: acta.numeroActa || '1'
      };
    }

    if (!wData.fechaActa) {
      wData.fechaActa = rawFecha;
    }
    if (!wData.fechaHoraText) {
      wData.fechaHoraText = getWrittenDateTimeSpanish(new Date(rawFecha + 'T18:00:00'));
    }
    if (!wData.asistencia) {
      wData.asistencia = [];
    }
    if (!wData.numeroActa) {
      wData.numeroActa = acta.numeroActa || '1';
    }
    if (!wData.puntosAgenda || wData.puntosAgenda.length === 0) {
      if (acta.contenido) {
        wData.puntosAgenda = [
          {
            tema: 'Contenido Registrado del Acta',
            debate: acta.contenido,
            acuerdo: ''
          }
        ];
      } else {
        wData.puntosAgenda = [];
      }
    }

    setActaWizardData(wData);
    setSelectedAgendaPointTab(wData.puntosAgenda.length > 0 ? 0 : 'new');
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

  const handleMoveAgendaPointUp = (index: number) => {
    if (index <= 0) return;
    setActaWizardData(prev => {
      const list = [...(prev.puntosAgenda || [])];
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
      return { ...prev, puntosAgenda: list };
    });
    if (selectedAgendaPointTab === index) {
      setSelectedAgendaPointTab(index - 1);
    } else if (selectedAgendaPointTab === index - 1) {
      setSelectedAgendaPointTab(index);
    }
  };

  const handleMoveAgendaPointDown = (index: number) => {
    const listLength = (actaWizardData.puntosAgenda || []).length;
    if (index >= listLength - 1) return;
    setActaWizardData(prev => {
      const list = [...(prev.puntosAgenda || [])];
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
      return { ...prev, puntosAgenda: list };
    });
    if (selectedAgendaPointTab === index) {
      setSelectedAgendaPointTab(index + 1);
    } else if (selectedAgendaPointTab === index + 1) {
      setSelectedAgendaPointTab(index);
    }
  };

  const [isPolishingWithAI, setIsPolishingWithAI] = useState(false);
  const [showGeminiApiKeyModal, setShowGeminiApiKeyModal] = useState(false);
  const [geminiApiKeyInput, setGeminiApiKeyInput] = useState(() => geminiService.getApiKey());

  const handlePolishPointsWithAI = async (customPuntos?: typeof actaWizardData.puntosAgenda) => {
    let puntosToProcess = customPuntos ? [...customPuntos] : [...(actaWizardData.puntosAgenda || [])];
    let targetTab = typeof selectedAgendaPointTab === 'number' ? selectedAgendaPointTab : 0;

    // Si el usuario tenía escrito un punto nuevo en el formulario pero no le dio "Agregar", lo incluimos
    if (!customPuntos && selectedAgendaPointTab === 'new' && (newAgendaPoint.tema.trim() || newAgendaPoint.debate.trim() || newAgendaPoint.acuerdo.trim())) {
      const temaFinal = newAgendaPoint.tema.trim() || `Punto de Agenda #${puntosToProcess.length + 1}`;
      puntosToProcess.push({ ...newAgendaPoint, tema: temaFinal });
      targetTab = puntosToProcess.length - 1;
      setNewAgendaPoint({ tema: '', debate: '', acuerdo: '', socioSolicitante: '', agendaContenido: '' });
    }

    if (puntosToProcess.length === 0) {
      return puntosToProcess;
    }

    setIsPolishingWithAI(true);
    try {
      const result = await geminiService.improveAndFormatPuntosAgenda({
        titulo: actaWizardData.titulo,
        categoria: actaWizardData.categoria,
        puntos: puntosToProcess
      });

      if (result && result.puntos && result.puntos.length > 0) {
        setActaWizardData(prev => ({
          ...prev,
          puntosAgenda: result.puntos
        }));
        setSelectedAgendaPointTab(targetTab < result.puntos.length ? targetTab : 0);

        if (result.source === 'gemini') {
          showToast('✨ Redacción profunda, ortografía y acuerdos perfeccionados con Gemini IA', 'success');
        } else {
          showToast('✨ Puntos estructurados y acuerdos formalizados', 'success');
        }
        return result.puntos;
      }
    } catch (error) {
      console.error("Error al procesar puntos:", error);
      showToast('Se aplicó el formato protocolario de respaldo.', 'info');
    } finally {
      setIsPolishingWithAI(false);
    }

    return puntosToProcess;
  };

  const handleNextStep = async () => {
    const steps: typeof actaWizardStep[] = ['datos', 'asistencia', 'protocolo', 'solicitudes', 'libre', 'vista_previa'];
    const idx = steps.indexOf(actaWizardStep);

    if (actaWizardStep === 'libre') {
      // Al avanzar desde el paso 5 (Puntos de Agenda) hacia la Vista Previa,
      // sincronizamos el borrador y ejecutamos la optimización y generación de acuerdos
      let currentPuntos = [...(actaWizardData.puntosAgenda || [])];
      let targetTab = typeof selectedAgendaPointTab === 'number' ? selectedAgendaPointTab : 0;

      if (selectedAgendaPointTab === 'new' && (newAgendaPoint.tema.trim() || newAgendaPoint.debate.trim() || newAgendaPoint.acuerdo.trim())) {
        const temaFinal = newAgendaPoint.tema.trim() || `Punto de Agenda #${currentPuntos.length + 1}`;
        const newP = { ...newAgendaPoint, tema: temaFinal };
        currentPuntos.push(newP);
        targetTab = currentPuntos.length - 1;
        setNewAgendaPoint({ tema: '', debate: '', acuerdo: '', socioSolicitante: '', agendaContenido: '' });
      }

      if (currentPuntos.length > 0) {
        const improved = await handlePolishPointsWithAI(currentPuntos);
        if (improved && improved.length > 0) {
          setActaWizardData(prev => ({ ...prev, puntosAgenda: improved }));
          setSelectedAgendaPointTab(targetTab < improved.length ? targetTab : 0);
        }
      }
      setActaWizardStep('vista_previa');
    } else if (idx < steps.length - 1) {
      setActaWizardStep(steps[idx + 1]);
    }
  };

  const handleSaveStructuredActa = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitulo = actaWizardData.titulo.trim() || `Acta de Sesión - ${new Date().toLocaleDateString('es-GT')}`;
    const fechaActa = actaWizardData.fechaActa || (editingActaId 
      ? actas.find(a => a.id === editingActaId)?.fecha || new Date().toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]);
    const numActa = actaWizardData.numeroActa || '1';

    const code = generateActaCode(
      actaWizardData.categoria,
      fechaActa,
      numActa,
      presidentName,
      secretaryName
    );

    const generatedContent = compileActaText({
      ...actaWizardData,
      titulo: finalTitulo,
      fechaActa: fechaActa
    });

    const sanitizedPuntos = (actaWizardData.puntosAgenda || []).map(p => ({
      ...p,
      tema: cleanAndDeduplicateCL(p.tema || ''),
      debate: cleanAndDeduplicateCL(p.debate || ''),
      acuerdo: cleanAndDeduplicateCL(p.acuerdo || ''),
      socioSolicitante: p.socioSolicitante ? cleanAndDeduplicateCL(p.socioSolicitante).replace(/^C\.L\.\s*/i, '').trim() : undefined
    }));

    const finalWizardData = {
      ...actaWizardData,
      titulo: finalTitulo,
      fechaActa: fechaActa,
      codigoRegistro: code,
      numeroActa: numActa,
      puntosAgenda: sanitizedPuntos
    };
    
    let savedActaItem: Acta;
    let newActas: Acta[] = [];
    if (editingActaId) {
      newActas = actas.map(a => {
        if (a.id === editingActaId) {
          return {
            ...a,
            titulo: finalTitulo,
            fecha: fechaActa,
            categoria: actaWizardData.categoria,
            contenido: generatedContent,
            codigoRegistro: code,
            numeroActa: numActa,
            wizardData: finalWizardData
          } as any;
        }
        return a;
      });

      const updatedActa = newActas.find(a => a.id === editingActaId);
      if (updatedActa) {
        savedActaItem = updatedActa;
        firebaseService.saveActa(updatedActa).catch(err => {
          console.error("Error al actualizar acta en Firestore:", err);
        });
      } else {
        savedActaItem = actas[0];
      }
    } else {
      const created: Acta = {
        id: `acta_${Date.now()}`,
        titulo: finalTitulo,
        fecha: fechaActa,
        contenido: generatedContent,
        autor: user?.nombre || 'Administración Club de Leones',
        pdfUrl: '#',
        categoria: actaWizardData.categoria,
        estado: 'Publicada',
        codigoRegistro: code,
        numeroActa: numActa,
        wizardData: finalWizardData
      } as any;

      savedActaItem = created;
      newActas = [created, ...actas];
      firebaseService.saveActa(created).catch(err => {
        console.error("Error al guardar nueva acta en Firestore:", err);
      });
    }

    setActas(newActas);
    safeSetItem('club_leones_actas', JSON.stringify(newActas));

    const pendingSols = solicitudes.filter(s => s.estado === 'Pendiente' && !s.archivada);
    
    for (const sol of pendingSols) {
      const res = actaWizardData.solicitudesResoluciones[sol.id];
      if (res && (res.decision === 'Aprobada' || res.decision === 'Rechazada' || res.decision === 'Descartada')) {
        const updatedSol: Solicitud = {
          ...sol,
          estado: res.decision as any,
          archivada: res.decision === 'Descartada' ? true : (sol.archivada || false),
          resolucionRazon: res.razon || (res.decision === 'Descartada' ? 'Descartada en sesión de acta' : ''),
          fechaResolucion: new Date().toISOString()
        };

        try {
          await firebaseService.saveSolicitud(updatedSol);
        } catch (err) {
          console.error(`Error saving resolution for request ${sol.id}:`, err);
        }
      }
    }

    showToast(editingActaId ? 'Acta actualizada con éxito' : 'Acta publicada con éxito', 'success');
    setPublishedSuccessModal({
      isOpen: true,
      title: finalTitulo,
      code: code,
      isEdit: !!editingActaId,
      acta: savedActaItem
    });

    setShowAddActa(false);
  };

  const handleMoveToTrash = async (id: string) => {
    const target = actas.find(a => a.id === id);
    if (!target) return;

    const updatedActa: Acta = {
      ...target,
      enPapelera: true,
      estado: 'Papelera',
      eliminadaFecha: new Date().toISOString(),
      eliminadaPor: user?.nombre || 'Administrador'
    };

    try {
      await firebaseService.saveActa(updatedActa);
    } catch (err) {
      console.error("Error moviendo acta a papelera en Firestore:", err);
    }

    const updatedList = actas.map(a => a.id === id ? updatedActa : a);
    setActas(updatedList);
    safeSetItem('club_leones_actas', JSON.stringify(updatedList));
    showToast('🗑️ Acta movida a la Papelera de Reciclaje. Puedes restaurarla cuando desees.', 'info');
    setDeleteActaConfirmId(null);
  };

  const handleRestoreActa = async (id: string) => {
    const target = actas.find(a => a.id === id);
    if (!target) return;

    const updatedActa: Acta = {
      ...target,
      enPapelera: false,
      estado: 'Publicada',
      eliminadaFecha: undefined,
      eliminadaPor: undefined
    };

    try {
      await firebaseService.saveActa(updatedActa);
    } catch (err) {
      console.error("Error restaurando acta en Firestore:", err);
    }

    const updatedList = actas.map(a => a.id === id ? updatedActa : a);
    setActas(updatedList);
    safeSetItem('club_leones_actas', JSON.stringify(updatedList));
    showToast('✅ Acta restaurada con éxito a las actas oficiales.', 'success');
  };

  const handlePermanentDelete = async (id: string) => {
    try {
      await firebaseService.deleteActa(id);
    } catch (err) {
      console.error("Error al eliminar acta definitivamente de Firestore:", err);
    }
    const updated = actas.filter(a => a.id !== id);
    setActas(updated);
    safeSetItem('club_leones_actas', JSON.stringify(updated));
    setDeleteActaConfirmId(null);
    setDeleteActaConfirmText('');
    setIsPermanentDelete(false);
    showToast('Acta eliminada definitivamente.', 'info');
  };

  const activeActas = useMemo(() => {
    return actas.filter(a => !a.enPapelera && a.estado !== 'Papelera');
  }, [actas]);

  const trashActas = useMemo(() => {
    return actas.filter(a => a.enPapelera || a.estado === 'Papelera');
  }, [actas]);

  const filteredActas = useMemo(() => {
    const listToFilter = actasViewMode === 'activas' ? activeActas : trashActas;
    return listToFilter.filter(a => {
      const matchesSearch = a.titulo.toLowerCase().includes(actaSearch.toLowerCase()) || 
                            a.contenido.toLowerCase().includes(actaSearch.toLowerCase());
      const matchesCategory = actaFilterCategory === 'Todas' || a.categoria === actaFilterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [actasViewMode, activeActas, trashActas, actaSearch, actaFilterCategory]);

  return (
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

          {/* Step Indicator Mobile */}
          {(() => {
            const stepsList = [
              { id: 'datos', label: 'Datos Generales', short: 'Datos', color: 'from-blue-600 to-indigo-600', textColor: 'text-blue-700', bgBadge: 'bg-blue-600', activeRing: 'ring-blue-100', pastBg: 'bg-blue-100 text-blue-700 border-blue-200', icon: FileText },
              { id: 'asistencia', label: 'Asistencia y Quórum', short: 'Asistencia', color: 'from-emerald-600 to-teal-600', textColor: 'text-emerald-700', bgBadge: 'bg-emerald-600', activeRing: 'ring-emerald-100', pastBg: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Users },
              { id: 'protocolo', label: 'Puntos de Protocolo', short: 'Protocolo', color: 'from-amber-500 to-yellow-600', textColor: 'text-amber-700', bgBadge: 'bg-amber-500', activeRing: 'ring-amber-100', pastBg: 'bg-amber-100 text-amber-700 border-amber-200', icon: Building },
              { id: 'solicitudes', label: 'Resolución de Solicitudes', short: 'Solicitudes', color: 'from-cyan-600 to-sky-600', textColor: 'text-cyan-700', bgBadge: 'bg-cyan-600', activeRing: 'ring-cyan-100', pastBg: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: Mail },
              { id: 'libre', label: 'Agenda Libre & Comisiones', short: 'Agenda Libre', color: 'from-purple-600 to-violet-600', textColor: 'text-purple-700', bgBadge: 'bg-purple-600', activeRing: 'ring-purple-100', pastBg: 'bg-purple-100 text-purple-700 border-purple-200', icon: Briefcase },
              { id: 'vista_previa', label: 'Vista Previa & Cierre', short: 'Vista Previa', color: 'from-rose-600 to-red-600', textColor: 'text-rose-700', bgBadge: 'bg-rose-600', activeRing: 'ring-rose-100', pastBg: 'bg-rose-100 text-rose-700 border-rose-200', icon: CheckCircle }
            ];
            const currentIdx = stepsList.findIndex(s => s.id === actaWizardStep);
            const currentStepObj = stepsList[currentIdx] || stepsList[0];

            return (
              <>
                {/* Mobile Stepper */}
                <div className="block md:hidden bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3 mb-6 shadow-xs">
                  <div className="flex justify-between items-center text-xs font-black text-slate-500 uppercase tracking-wider px-1">
                    <span className="flex items-center space-x-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${currentStepObj.bgBadge} animate-pulse`}></span>
                      <span>Paso {currentIdx + 1} de {stepsList.length}</span>
                    </span>
                    <span className={`font-black text-xs px-2.5 py-0.5 rounded-full text-white ${currentStepObj.bgBadge}`}>
                      {currentStepObj.short}
                    </span>
                  </div>

                  <div className="text-sm font-black text-slate-900">
                    {currentStepObj.label}
                  </div>

                  {/* Step dots */}
                  <div className="grid grid-cols-6 gap-1.5 pt-1">
                    {stepsList.map((st, i) => {
                      const isCur = i === currentIdx;
                      const isPast = i < currentIdx;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setActaWizardStep(st.id as any)}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isCur 
                              ? `bg-gradient-to-r ${st.color} shadow-sm ring-2 ring-slate-200` 
                              : isPast 
                                ? `${st.bgBadge} opacity-70` 
                                : 'bg-slate-200'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Desktop Full Executive Stepper */}
                <div className="hidden md:block bg-gradient-to-b from-slate-50/90 to-slate-100/60 rounded-[2rem] p-5 lg:p-7 border border-slate-200/80 shadow-xs mb-8">
                  <div className="flex justify-between items-center relative px-4 lg:px-8">
                    {/* Background track line */}
                    <div className="absolute left-8 right-8 top-6 -translate-y-1/2 h-1.5 bg-slate-200/80 rounded-full z-0"></div>
                    
                    {/* Active progress colored bar */}
                    <div 
                      className="absolute left-8 top-6 -translate-y-1/2 h-1.5 bg-gradient-to-r from-blue-600 via-emerald-500 via-amber-500 via-cyan-500 via-purple-500 to-rose-600 rounded-full z-0 transition-all duration-500 shadow-sm"
                      style={{ width: `${(currentIdx / 5) * (100 - 8)}%` }}
                    ></div>
                    
                    {stepsList.map((s, idx) => {
                      const active = actaWizardStep === s.id;
                      const past = idx < currentIdx;
                      const Icon = s.icon;

                      return (
                        <button 
                          key={s.id}
                          type="button"
                          onClick={() => setActaWizardStep(s.id as any)}
                          className="relative z-10 flex flex-col items-center gap-2 focus:outline-none group cursor-pointer"
                        >
                          <div className={`w-12 h-12 lg:w-13 lg:h-13 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md ${
                            active 
                              ? `bg-gradient-to-r ${s.color} text-white shadow-lg scale-110 ring-4 ${s.activeRing}` 
                              : past
                                ? `${s.pastBg} border font-bold hover:scale-105`
                                : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50'
                          }`}>
                            {past ? (
                              <div className="flex items-center justify-center">
                                <Icon size={18} className="opacity-90" />
                              </div>
                            ) : (
                              <Icon size={active ? 22 : 18} />
                            )}
                          </div>

                          <div className="text-center">
                            <span className={`block text-xs font-black transition-colors ${
                              active ? s.textColor : past ? 'text-slate-700' : 'text-slate-400'
                            }`}>
                              {idx + 1}. {s.short}
                            </span>
                            <span className="hidden xl:block text-[10px] text-slate-400 font-medium">
                              {s.label.split(' ')[1] || ''}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            );
          })()}

          {/* Form Step Contents */}
          <div className="py-2">
            {actaWizardStep === 'datos' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 w-full">
                <div className="bg-slate-50/50 rounded-3xl p-4 sm:p-8 space-y-6 border border-slate-100/60 shadow-sm text-left">
                  
                  {/* Importar Agenda de Reunión */}
                  <div className="bg-amber-50/60 border border-amber-200/80 p-5 rounded-2xl space-y-3">
                    <label className="block text-xs font-black text-amber-900 uppercase tracking-widest">
                      ¿Deseas pre-cargar una Agenda de Reunión?
                    </label>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Si el presidente finalizó la agenda de esta reunión, puedes seleccionarla a continuación para auto-completar el título, lugar de sesión y cargar todos sus puntos de debate.
                    </p>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleImportAgendaToActa(e.target.value);
                          e.target.value = ""; // reset
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      <option value="">-- Seleccionar Agenda para Importar --</option>
                      {(agendas || [])
                        .filter(a => a.estado === 'Finalizada')
                        .filter(a => {
                          const cat = a.categoria || 'ordinaria';
                          if (actaWizardData.categoria === 'Ordinaria') {
                            return cat === 'ordinaria';
                          }
                          if (actaWizardData.categoria === 'Extraordinaria') {
                            return cat === 'extraordinaria';
                          }
                          if (actaWizardData.categoria === 'Reunión de Comisión') {
                            return cat === 'comisiones';
                          }
                          return false;
                        })
                        .map(a => (
                          <option key={a.id} value={a.id}>{formatDisplayDate(a.fecha)} - {a.titulo}</option>
                        ))}
                    </select>
                  </div>

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
                  {/* Selector de Fecha y Hora Protocolaria */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-amber-50/40 p-4 sm:p-5 rounded-2xl border border-amber-200/60">
                    <div>
                      <label className="block text-xs font-black text-amber-900 uppercase tracking-wider mb-2 flex items-center">
                        <Calendar size={14} className="mr-1.5 text-amber-600" />
                        <span>Fecha de la Sesión</span>
                      </label>
                      <input 
                        type="date"
                        value={actaWizardData.fechaActa || new Date().toISOString().split('T')[0]}
                        onChange={e => {
                          const selectedDate = e.target.value;
                          setActaWizardData(prev => ({
                            ...prev,
                            fechaActa: selectedDate,
                            fechaHoraText: getWrittenDateTimeSpanish(new Date(selectedDate + 'T18:00:00'))
                          }));
                        }}
                        className="w-full px-4 py-3 bg-white border border-amber-300/80 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm font-bold text-slate-800 shadow-xs cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-black text-amber-900 uppercase tracking-wider">
                          Texto Protocolario de Fecha y Hora
                        </label>
                        <button 
                          type="button"
                          onClick={() => {
                            const baseDate = actaWizardData.fechaActa ? new Date(actaWizardData.fechaActa + 'T18:00:00') : new Date();
                            setActaWizardData(prev => ({ ...prev, fechaHoraText: getWrittenDateTimeSpanish(baseDate) }));
                          }}
                          className="text-[10px] font-black text-amber-700 bg-white border border-amber-200 px-2 py-0.5 rounded-md uppercase tracking-wider hover:bg-amber-100 flex items-center space-x-1 transition-colors cursor-pointer shadow-2xs"
                          title="Restablecer texto según la fecha seleccionada"
                        >
                          <Clock size={11} />
                          <span>Restablecer</span>
                        </button>
                      </div>
                      <textarea 
                        rows={2}
                        value={actaWizardData.fechaHoraText}
                        onChange={e => setActaWizardData(prev => ({ ...prev, fechaHoraText: e.target.value }))}
                        placeholder="Ej. veinte de agosto del año dos mil veintiséis, a las dieciocho horas con cero minutos"
                        className="w-full px-4 py-2.5 bg-white border border-amber-300/80 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-xs font-semibold text-slate-700 shadow-xs resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {actaWizardStep === 'asistencia' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 w-full text-left">
                <div className="bg-slate-50/50 rounded-3xl p-4 sm:p-8 border border-slate-100/60 shadow-sm space-y-6">
                  
                  {/* Attendance stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
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
                    
                    {/* Absent Column */}
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

                      <div className="bg-white border border-slate-200 rounded-2xl max-h-[400px] overflow-y-auto divide-y divide-slate-100 shadow-sm">
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
                                  src={member.foto || 'https://picsum.photos/seed/socio/200/200'} 
                                  alt={member.nombre} 
                                  className="w-9 h-9 rounded-full object-cover border border-slate-100 shadow-sm"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/socio/200/200';
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

                    {/* Present Column */}
                    <div className="space-y-4">
                      <h5 className="font-extrabold text-slate-700 text-sm flex items-center justify-between">
                        <span>Miembros Presentes en Reunión</span>
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                          {presentSocios.length} Marcados
                        </span>
                      </h5>

                      <div className="bg-white border border-slate-200 rounded-2xl max-h-[460px] overflow-y-auto divide-y divide-slate-100 shadow-sm">
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
                                  src={member.foto || 'https://picsum.photos/seed/socio/200/200'} 
                                  alt={member.nombre} 
                                  className="w-9 h-9 rounded-full object-cover border border-slate-100 shadow-sm"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/socio/200/200';
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
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 w-full">
                {/* Invocación */}
                <div className="bg-slate-50/50 p-4 sm:p-8 rounded-3xl border border-slate-100/60 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center justify-between sm:justify-start space-x-3.5 w-full sm:w-auto">
                      <h5 className="text-lg font-extrabold text-blue-900 flex items-center">
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs mr-3">1</span>
                        Invocación Leonística
                      </h5>
                      <button
                        type="button"
                        onClick={() => setShowInvocacionModal(true)}
                        className="inline-flex items-center px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 text-amber-700 hover:text-amber-800 rounded-xl transition-all font-bold text-[10px] uppercase tracking-wider shadow-sm hover:shadow active:scale-95 space-x-1"
                        title="Leer texto de la Invocación Leonística"
                      >
                        <BookOpen size={12} className="text-amber-600" />
                        <span>Texto</span>
                      </button>
                    </div>
                    
                    <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 w-fit shadow-sm">
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
                    <div className="flex items-center justify-between sm:justify-start space-x-3.5 w-full sm:w-auto">
                      <h5 className="text-lg font-extrabold text-blue-900 flex items-center">
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs mr-3">2</span>
                        Saludo a la Bandera
                      </h5>
                      <button
                        type="button"
                        onClick={() => setShowSaludoModal(true)}
                        className="inline-flex items-center px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 text-amber-700 hover:text-amber-800 rounded-xl transition-all font-bold text-[10px] uppercase tracking-wider shadow-sm hover:shadow active:scale-95 space-x-1"
                        title="Leer texto del Saludo a la Bandera"
                      >
                        <BookOpen size={12} className="text-amber-600" />
                        <span>Texto</span>
                      </button>
                    </div>
                    
                    <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 w-fit shadow-sm">
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
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 w-full">
                <div className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2 flex items-center bg-amber-50 w-fit px-4 py-2 rounded-xl">
                  <FileText size={18} className="mr-2 text-amber-500" />
                  Lectura y Resolución de Solicitudes Pendientes
                </div>

                <div className="space-y-5 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  {solicitudes.filter(s => s.estado === 'Pendiente' && !s.archivada).length === 0 ? (
                    <div className="text-center py-16 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 italic text-sm font-medium">
                      No hay solicitudes con estado "Pendiente" registradas en el sistema para evaluar en esta sesión.
                    </div>
                  ) : (
                    solicitudes.filter(s => s.estado === 'Pendiente' && !s.archivada).map(sol => {
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
                                <p className="text-sm text-slate-605 mt-4 font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed text-justify">{sol.descripcion}</p>
                              )}
                            </div>

                            {/* Buttons group for decision */}
                            <div className="flex flex-wrap bg-slate-50 p-1.5 rounded-2xl border border-slate-200 w-full sm:w-auto gap-1 justify-between sm:justify-start flex-shrink-0">
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
                                className={`flex-1 sm:flex-initial text-center px-3.5 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
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
                                className={`flex-1 sm:flex-initial text-center px-3.5 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
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
                                      [sol.id]: { ...res, decision: 'Descartada' }
                                    }
                                  }));
                                }}
                                className={`flex-1 sm:flex-initial text-center px-3.5 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                                  res.decision === 'Descartada' 
                                    ? 'bg-slate-700 text-white shadow-md shadow-slate-700/20' 
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-white'
                                }`}
                              >
                                Descartar
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
                                className={`flex-1 sm:flex-initial text-center px-3.5 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                                  res.decision === 'Pendiente' 
                                    ? 'bg-slate-200 text-slate-700 shadow-md' 
                                    : 'text-slate-500 hover:bg-white'
                                }`}
                              >
                                Pendiente
                              </button>
                            </div>
                          </div>

                          {/* Notice banner for Descartada */}
                          {res.decision === 'Descartada' && (
                            <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-600 flex items-center space-x-2 animate-in fade-in duration-200">
                              <span>🚫 Esta solicitud ha sido marcada como descartada y <strong>NO se incluirá</strong> en el documento final del acta.</span>
                            </div>
                          )}

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
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 max-w-4xl mx-auto">
                <div className="bg-slate-50/50 p-4 sm:p-8 rounded-3xl border border-slate-100/60 space-y-6 shadow-sm">
                  
                  {/* Header & Controls Bar */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-200 gap-4 text-left">
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
                          <Briefcase size={18}/>
                        </span>
                        <div>
                          <h3 className="text-xl font-extrabold text-blue-900 tracking-tight">
                            Gestión de Puntos de Agenda
                          </h3>
                          <p className="text-xs text-slate-500 font-semibold mt-0.5">
                            {selectedAgendaPointTab === 'new' ? (
                              <span className="text-amber-700 font-bold">Redactando Nuevo Punto de Agenda</span>
                            ) : (
                              <span className="text-blue-900 font-bold">
                                Editando Punto #{selectedAgendaPointTab as number + 1}: {(actaWizardData.puntosAgenda || [])[selectedAgendaPointTab as number]?.tema || 'Sin tema'}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Controls */}
                    <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
                      <button
                        type="button"
                        onClick={() => setShowOrganizePointsModal(true)}
                        className="px-4 py-2.5 bg-white hover:bg-amber-50 text-slate-800 border border-slate-300 hover:border-amber-300 rounded-2xl text-xs font-black flex items-center space-x-2 transition-all shadow-sm active:scale-95 cursor-pointer"
                      >
                        <ListOrdered size={16} className="text-amber-600" />
                        <span>Organizar y Seleccionar Puntos ({(actaWizardData.puntosAgenda || []).length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedAgendaPointTab('new')}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
                          selectedAgendaPointTab === 'new'
                            ? 'bg-amber-500 text-white border border-amber-600 shadow-amber-500/20'
                            : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        <Plus size={16} />
                        <span>Nuevo Punto</span>
                      </button>
                    </div>
                  </div>


                  {/* Main Full-Width Form Contents */}
                  {selectedAgendaPointTab === 'new' ? (
                    /* Create Point Form */
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
                              <span>Solicitado por: <span className="font-extrabold text-blue-950">{newAgendaPoint.socioSolicitante}</span></span>
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

                      {/* Section 1: Tema del Punto (Amber Theme) */}
                      <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center">
                            <Bookmark size={15} className="text-amber-600 mr-2" />
                            <span>1. Tema del Punto</span>
                          </label>
                          <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-200">
                            Título del Asunto
                          </span>
                        </div>
                        <input 
                          type="text"
                          value={newAgendaPoint.tema}
                          onChange={e => setNewAgendaPoint(prev => ({ ...prev, tema: e.target.value }))}
                          placeholder="Ej. Aprobación del presupuesto para la jornada oftalmológica"
                          className="w-full px-5 py-3.5 bg-white border border-amber-200 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm font-semibold text-slate-800 shadow-sm"
                        />
                      </div>
                      
                      <div className="space-y-6">
                        {/* Section 2: Debate / Discusión (Emerald Theme) */}
                        <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-200/80 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center">
                              <MessageSquare size={15} className="text-emerald-600 mr-2" />
                              <span>2. Debate / Discusión (En Vivo)</span>
                            </label>
                            <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              Notas de Discusión
                            </span>
                          </div>
                          <textarea 
                            ref={debateRef}
                            rows={4}
                            value={newAgendaPoint.debate}
                            onChange={e => setNewAgendaPoint(prev => ({ ...prev, debate: e.target.value }))}
                            placeholder="Describa las opiniones, intervenciones y puntos clave discutidos..."
                            className="w-full px-5 py-3.5 bg-white border border-emerald-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800 resize-none text-justify shadow-sm"
                          />
                          
                          {/* Etiquetar quorum */}
                          <div className="pt-1 text-left">
                            <span className="block text-[10px] font-black text-emerald-800/80 uppercase tracking-wider mb-2">Etiquetar participantes presentes (insertar al cursor):</span>
                            {presentSocios.length === 0 ? (
                              <div className="text-[10px] font-bold text-emerald-700/80 bg-white p-3 rounded-xl border border-dashed border-emerald-200 italic">
                                No hay socios marcados en el quórum aún. Registra asistencia en el paso anterior para poder etiquetar.
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2 max-h-[96px] overflow-y-auto p-1.5 bg-white rounded-2xl border border-emerald-200/70 shadow-inner">
                                {presentSocios.map(member => (
                                  <button
                                    key={member.id}
                                    type="button"
                                    onClick={() => handleInsertMemberMention(member.nombre)}
                                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50/60 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-950 transition-all select-none cursor-pointer active:scale-95 shadow-sm"
                                  >
                                    <img 
                                      src={member.foto || 'https://picsum.photos/seed/socio/200/200'} 
                                      alt={member.nombre} 
                                      className="w-5 h-5 rounded-full object-cover border border-emerald-200 shadow-sm"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/socio/200/200';
                                      }}
                                    />
                                    <span>
                                      C.L. {member.nombre.split(' ')[0]} {member.nombre.split(' ')[1] ? member.nombre.split(' ')[1][0] + '.' : ''}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Section 3: Acuerdo / Resolución (Indigo Theme) */}
                        <div className="bg-indigo-50/40 p-5 rounded-2xl border border-indigo-200/80 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center">
                              <CheckCircle2 size={15} className="text-indigo-600 mr-2" />
                              <span>3. Acuerdo / Resolución Final</span>
                            </label>
                            <span className="text-[10px] font-extrabold text-indigo-800 bg-indigo-100/90 px-2.5 py-0.5 rounded-full border border-indigo-200">
                              Decisión Oficial
                            </span>
                          </div>
                          <textarea 
                            rows={4}
                            value={newAgendaPoint.acuerdo}
                            onChange={e => setNewAgendaPoint(prev => ({ ...prev, acuerdo: e.target.value }))}
                            placeholder="Describa la resolución o acuerdo formal aprobado por la asamblea..."
                            className="w-full px-5 py-3.5 bg-white border border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-semibold text-slate-800 resize-none text-justify shadow-sm"
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
                    /* Edit Existing Point Form */
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

                      {/* Section 1: Tema del Punto (Amber Theme) */}
                      <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center">
                            <Bookmark size={15} className="text-amber-600 mr-2" />
                            <span>1. Tema del Punto</span>
                          </label>
                          <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-200">
                            Título del Asunto
                          </span>
                        </div>
                        <input 
                          type="text"
                          value={(actaWizardData.puntosAgenda || [])[selectedAgendaPointTab as number]?.tema || ''}
                          onChange={e => handleUpdateAgendaPoint(selectedAgendaPointTab as number, 'tema', e.target.value)}
                          placeholder="Ej. Tema del punto..."
                          className="w-full px-5 py-3.5 bg-white border border-amber-200 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm font-semibold text-slate-800 shadow-sm"
                        />
                      </div>

                      {((actaWizardData.puntosAgenda || [])[selectedAgendaPointTab as number]?.agendaContenido || (actaWizardData.puntosAgenda || [])[selectedAgendaPointTab as number]?.socioSolicitante) && (
                        <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100/60 space-y-2 animate-in fade-in duration-300">
                          <div className="flex justify-between items-center text-[10px] font-black text-blue-900/60 uppercase tracking-widest">
                            <span>Contenido de la Propuesta (Discusión)</span>
                            {(actaWizardData.puntosAgenda || [])[selectedAgendaPointTab as number]?.socioSolicitante && (
                              <span>Solicitado por: <span className="font-extrabold text-blue-950">{(actaWizardData.puntosAgenda || [])[selectedAgendaPointTab as number]?.socioSolicitante}</span></span>
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
                        {/* Section 2: Debate / Discusión (Emerald Theme) */}
                        <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-200/80 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center">
                              <MessageSquare size={15} className="text-emerald-600 mr-2" />
                              <span>2. Debate / Discusión (En Vivo)</span>
                            </label>
                            <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              Notas de Discusión
                            </span>
                          </div>
                          <textarea 
                            ref={debateRef}
                            rows={4}
                            value={(actaWizardData.puntosAgenda || [])[selectedAgendaPointTab as number]?.debate || ''}
                            onChange={e => handleUpdateAgendaPoint(selectedAgendaPointTab as number, 'debate', e.target.value)}
                            placeholder="Describa los puntos clave discutidos..."
                            className="w-full px-5 py-3.5 bg-white border border-emerald-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-semibold text-slate-800 resize-none text-justify shadow-sm"
                          />
                          
                          {/* Etiquetar quorum */}
                          <div className="pt-1 text-left">
                            <span className="block text-[10px] font-black text-emerald-800/80 uppercase tracking-wider mb-2">Etiquetar participantes presentes (insertar al cursor):</span>
                            {presentSocios.length === 0 ? (
                              <div className="text-[10px] font-bold text-emerald-700/80 bg-white p-3 rounded-xl border border-dashed border-emerald-200 italic">
                                No hay socios marcados en el quórum aún. Registra asistencia en el paso anterior para poder etiquetar.
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2 max-h-[96px] overflow-y-auto p-1.5 bg-white rounded-2xl border border-emerald-200/70 shadow-inner">
                                {presentSocios.map(member => (
                                  <button
                                    key={member.id}
                                    type="button"
                                    onClick={() => handleInsertMemberMention(member.nombre)}
                                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50/60 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-950 transition-all select-none cursor-pointer active:scale-95 shadow-sm"
                                  >
                                    <img 
                                      src={member.foto || 'https://picsum.photos/seed/socio/200/200'} 
                                      alt={member.nombre} 
                                      className="w-5 h-5 rounded-full object-cover border border-emerald-200 shadow-sm"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/socio/200/200';
                                      }}
                                    />
                                    <span>
                                      C.L. {member.nombre.split(' ')[0]} {member.nombre.split(' ')[1] ? member.nombre.split(' ')[1][0] + '.' : ''}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Section 3: Acuerdo / Resolución (Indigo Theme) */}
                        <div className="bg-indigo-50/40 p-5 rounded-2xl border border-indigo-200/80 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center">
                              <CheckCircle2 size={15} className="text-indigo-600 mr-2" />
                              <span>3. Acuerdo / Resolución Final</span>
                            </label>
                            <span className="text-[10px] font-extrabold text-indigo-800 bg-indigo-100/90 px-2.5 py-0.5 rounded-full border border-indigo-200">
                              Decisión Oficial
                            </span>
                          </div>
                          <textarea 
                            rows={4}
                            value={(actaWizardData.puntosAgenda || [])[selectedAgendaPointTab as number]?.acuerdo || ''}
                            onChange={e => handleUpdateAgendaPoint(selectedAgendaPointTab as number, 'acuerdo', e.target.value)}
                            placeholder="Describa la resolución o acuerdo formal aprobado por la asamblea..."
                            className="w-full px-5 py-3.5 bg-white border border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-semibold text-slate-800 resize-none text-justify shadow-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Seleccionador y Reordenador de Puntos de Agenda */}
            {showOrganizePointsModal && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-left animate-in zoom-in-95 duration-200">
                  
                  {/* Modal Header */}
                  <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                        <ListOrdered size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-850 leading-tight">Organizar y Seleccionar Puntos</h3>
                        <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                          Usa las flechas (▲ / ▼) para cambiar el orden o haz clic en uno para editarlo.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowOrganizePointsModal(false)}
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Modal Body: Points List */}
                  <div className="p-6 overflow-y-auto space-y-3 flex-1">
                    {(actaWizardData.puntosAgenda || []).length === 0 ? (
                      <div className="text-center py-10 space-y-3">
                        <Briefcase className="mx-auto text-slate-300" size={32} />
                        <p className="text-sm font-bold text-slate-500">No hay puntos redactados en esta agenda aún.</p>
                      </div>
                    ) : (
                      (actaWizardData.puntosAgenda || []).map((point, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            selectedAgendaPointTab === idx
                              ? 'bg-amber-500/10 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                              : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
                          }`}
                        >
                          <div className="flex items-start space-x-3 min-w-0 flex-1">
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                              selectedAgendaPointTab === idx ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 leading-snug break-words">
                                {point.tema || `Punto de Agenda #${idx + 1}`}
                              </h4>
                              {point.socioSolicitante && (
                                <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                                  Solicitado por: <span className="text-amber-800">{point.socioSolicitante}</span>
                                </p>
                              )}
                              <div className="flex items-center space-x-2 pt-1.5 text-[9px] font-bold">
                                {point.debate ? (
                                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                                    ✓ Debate registrado
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">Sin debate</span>
                                )}
                                {point.acuerdo && (
                                  <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                                    ✓ Acuerdo tomado
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Reorder Buttons & Select Action */}
                          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveAgendaPointUp(idx)}
                                className="p-1.5 text-slate-600 hover:text-amber-800 hover:bg-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Mover punto hacia arriba"
                              >
                                <ChevronUp size={16} />
                              </button>
                              <button
                                type="button"
                                disabled={idx === (actaWizardData.puntosAgenda || []).length - 1}
                                onClick={() => handleMoveAgendaPointDown(idx)}
                                className="p-1.5 text-slate-600 hover:text-amber-800 hover:bg-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Mover punto hacia abajo"
                              >
                                <ChevronDown size={16} />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAgendaPointTab(idx);
                                setShowOrganizePointsModal(false);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                                selectedAgendaPointTab === idx
                                  ? 'bg-amber-500 text-white shadow-sm'
                                  : 'bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200'
                              }`}
                            >
                              {selectedAgendaPointTab === idx ? 'Editando...' : 'Editar'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveAgendaPoint(idx)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-slate-200"
                              title="Eliminar este punto"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAgendaPointTab('new');
                        setShowOrganizePointsModal(false);
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-sm"
                    >
                      <Plus size={14} />
                      <span>Nuevo Punto</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowOrganizePointsModal(false)}
                      className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-black rounded-xl text-xs transition-all shadow-sm"
                    >
                      Listo
                    </button>
                  </div>
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
                        navigator.clipboard.writeText(rawText).catch(() => {});
                        showToast('¡Texto del acta copiado al portapapeles!', 'success');
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

          {/* AI Processing Overlay */}
          {isPolishingWithAI && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-purple-100 text-center space-y-4 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-gradient-to-tr from-purple-700 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-purple-500/30 text-white relative">
                  <Sparkles size={28} className="animate-spin text-amber-300" style={{ animationDuration: '3s' }} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-800">
                    Perfeccionando con Gemini IA
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">
                    Corrigiendo ortografía y gramática, formalizando la redacción del debate con solemnidad Leonística y estructurando resoluciones...
                  </p>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-400 h-full rounded-full animate-pulse w-full"></div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Configuración Clave Gemini IA */}
          {showGeminiApiKeyModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-indigo-100 text-left space-y-5 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
                      <Key size={18} />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900">
                        Clave de API Google Gemini
                      </h4>
                      <p className="text-[11px] text-slate-500 font-semibold">
                        Para corrección profunda y redacción con IA generativa
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGeminiApiKeyModal(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Para activar la revisión ortográfica y protocolaria profunda de Gemini en tiempo real, puedes pegar tu <strong>API Key gratuita de Google AI Studio</strong>:
                  </p>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider">
                      Google Gemini API Key:
                    </label>
                    <input
                      type="password"
                      value={geminiApiKeyInput}
                      onChange={e => setGeminiApiKeyInput(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none text-xs font-mono font-semibold text-slate-800 shadow-inner"
                    />
                  </div>

                  <div className="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-100 text-xs text-indigo-900 space-y-1.5">
                    <p className="font-bold flex items-center space-x-1.5">
                      <span>💡 ¿Cómo obtener tu clave 100% gratuita?</span>
                    </p>
                    <p className="text-[11px] text-indigo-800/90 leading-relaxed">
                      1. Entra a <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="font-black text-indigo-600 underline hover:text-indigo-850">aistudio.google.com/app/apikey</a> con tu cuenta de Google.
                      <br />
                      2. Haz clic en <strong>"Create API key"</strong> y pégala aquí.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowGeminiApiKeyModal(false)}
                    className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-xs transition-all"
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      geminiService.setApiKey(geminiApiKeyInput);
                      setShowGeminiApiKeyModal(false);
                      showToast('✅ Clave de Gemini IA guardada exitosamente.', 'success');
                    }}
                    className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-black rounded-xl text-xs transition-all shadow-md active:scale-95"
                  >
                    Guardar Clave
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer / Navigation */}
          <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-between gap-3 sm:gap-4 flex-shrink-0 w-full">
            <div className="flex flex-row w-full sm:w-auto gap-3">
              <button
                type="button"
                disabled={isPolishingWithAI}
                onClick={() => setShowAddActa(false)}
                className="flex-1 sm:flex-initial text-center bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 font-extrabold px-4 sm:px-6 py-2.5 rounded-xl transition-all text-xs sm:text-sm disabled:opacity-50"
              >
                Cancelar
              </button>
              {actaWizardStep !== 'datos' && (
                <button
                  type="button"
                  disabled={isPolishingWithAI}
                  onClick={() => {
                    const steps: typeof actaWizardStep[] = ['datos', 'asistencia', 'protocolo', 'solicitudes', 'libre', 'vista_previa'];
                    const idx = steps.indexOf(actaWizardStep);
                    if (idx > 0) setActaWizardStep(steps[idx - 1]);
                  }}
                  className="flex-1 sm:flex-initial text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold px-4 sm:px-6 py-2.5 rounded-xl transition-all text-xs sm:text-sm disabled:opacity-50"
                >
                  Atrás
                </button>
              )}
            </div>

            <div className="w-full sm:w-auto">
              {actaWizardStep !== 'vista_previa' ? (
                <button
                  type="button"
                  disabled={isPolishingWithAI}
                  onClick={handleNextStep}
                  className={`w-full sm:w-auto text-center font-black px-4 sm:px-6 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg text-xs sm:text-sm flex items-center justify-center space-x-2 disabled:opacity-50 ${
                    actaWizardStep === 'libre'
                      ? 'bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-900 hover:from-purple-800 hover:to-blue-950 text-white'
                      : 'bg-blue-900 hover:bg-blue-800 text-white'
                  }`}
                >
                  {isPolishingWithAI ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-amber-300" />
                      <span>Perfeccionando con IA...</span>
                    </>
                  ) : (
                    <>
                      {actaWizardStep === 'libre' && <Sparkles size={16} className="text-amber-300 animate-pulse" />}
                      <span>{actaWizardStep === 'libre' ? 'Pulir y Ver Acta Previa' : 'Siguiente'}</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isPolishingWithAI}
                  onClick={handleSaveStructuredActa}
                  className="w-full sm:w-auto text-center bg-emerald-500 hover:bg-emerald-600 text-white font-black px-4 sm:px-6 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg text-xs sm:text-sm disabled:opacity-50"
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
            <div>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">Biblioteca y Redacción de Actas</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Consulta, redacta, edita o restaura actas oficiales de sesión del Club.
              </p>
            </div>
            
            <div className="flex items-center gap-3 self-start md:self-auto">
              <button 
                onClick={handleOpenRedactarActa}
                className="justify-center bg-blue-900 hover:bg-blue-800 text-white font-black px-6 py-3 rounded-2xl flex items-center space-x-2 shadow-lg shadow-blue-900/10 active:scale-95 transition-all cursor-pointer text-sm"
              >
                <Plus size={18} />
                <span>Redactar Acta</span>
              </button>
            </div>
          </div>

          {/* Selector de Pestañas: Oficiales vs Papelera */}
          <div className="flex items-center justify-between border-b border-slate-200 gap-4 flex-wrap pb-1">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setActasViewMode('activas')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
                  actasViewMode === 'activas'
                    ? 'bg-blue-900 text-white shadow-sm shadow-blue-900/20'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileText size={15} />
                <span>Actas Oficiales</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  actasViewMode === 'activas' ? 'bg-blue-800 text-amber-300' : 'bg-slate-200 text-slate-700'
                }`}>
                  {activeActas.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActasViewMode('papelera')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
                  actasViewMode === 'papelera'
                    ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Trash2 size={15} />
                <span>Papelera de Seguridad</span>
                {trashActas.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    actasViewMode === 'papelera' ? 'bg-red-700 text-white' : 'bg-red-100 text-red-700'
                  }`}>
                    {trashActas.length}
                  </span>
                )}
              </button>
            </div>

            {actasViewMode === 'papelera' && (
              <span className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-xl">
                🛡️ Las actas en papelera no se muestran al público y pueden restaurarse en 1 clic
              </span>
            )}
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
          <div className="grid gap-4 text-left">
            {filteredActas.map(acta => {
              const isTrash = acta.enPapelera || acta.estado === 'Papelera';
              return (
                <div 
                  key={acta.id} 
                  className={`bg-white p-4 sm:p-6 md:p-8 rounded-3xl border transition-all w-full flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 ${
                    isTrash 
                      ? 'border-red-200/80 bg-red-50/10 hover:border-red-300' 
                      : 'border-slate-200/80 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center space-x-4 min-w-0 w-full md:w-auto">
                    <div className={`p-3.5 rounded-2xl flex-shrink-0 ${
                      isTrash ? 'bg-red-100 text-red-700' : 'bg-yellow-50 text-yellow-600'
                    }`}>
                      {isTrash ? <Trash2 size={24} /> : <FileText size={24} />}
                    </div>
                    <div className="min-w-0 flex-grow w-full">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-extrabold text-slate-800 text-base md:text-lg break-words leading-tight">{acta.titulo}</h4>
                        {isTrash && (
                          <span className="text-[10px] font-black bg-red-100 text-red-800 px-2 py-0.5 rounded-md uppercase">
                            En Papelera
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-450 mt-1.5">
                        Redactada por <span className="font-bold text-blue-900/60 uppercase">{acta.autor}</span> • Fecha de Sesión: <span className="font-bold text-slate-700">{formatDisplayDate(acta.fecha)}</span>
                        {acta.numeroActa && <span> • Acta No. {acta.numeroActa}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-row items-center justify-between md:justify-end gap-3 w-full md:w-auto pt-4 md:pt-0 border-t border-slate-100 md:border-t-0 flex-wrap">
                    <span className="text-[10px] font-black bg-slate-100 text-slate-650 px-3 py-1 rounded-full uppercase">
                      {acta.categoria || 'Ordinaria'}
                    </span>
                    <div className="flex items-center space-x-2">
                      {!isTrash ? (
                        <>
                          <button
                            onClick={() => handleEditActaClick(acta)}
                            className="p-2.5 text-slate-500 hover:text-blue-900 hover:bg-blue-50 rounded-xl transition-all border border-slate-150 bg-slate-50/50 active:scale-95 cursor-pointer"
                            title="Editar acta y fecha"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => generateActaPDF(acta)}
                            className="p-2.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all border border-slate-150 bg-slate-50/50 active:scale-95 cursor-pointer"
                            title="Descargar PDF"
                          >
                            <Download size={16} />
                          </button>
                          <button 
                            onClick={() => handleMoveToTrash(acta.id)}
                            className="p-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-slate-150 bg-slate-50/50 active:scale-95 cursor-pointer"
                            title="Mover a Papelera de Seguridad"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRestoreActa(acta.id)}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                            title="Restaurar a las actas oficiales"
                          >
                            <RotateCcw size={14} />
                            <span>Restaurar Acta</span>
                          </button>
                          <button
                            onClick={() => {
                              setIsPermanentDelete(true);
                              setDeleteActaConfirmId(acta.id);
                            }}
                            className="p-2 text-slate-450 hover:text-red-700 hover:bg-red-100 rounded-xl transition-all border border-red-200 active:scale-95 cursor-pointer text-xs font-bold"
                            title="Eliminar definitivamente"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredActas.length === 0 && (
              <div className="text-center py-12 text-slate-400 italic bg-white rounded-3xl border border-slate-100 p-8">
                {actasViewMode === 'papelera'
                  ? 'La papelera de reciclaje está vacía. Todas tus actas están seguras.'
                  : 'No se encontraron actas con esos criterios de búsqueda.'}
              </div>
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal (Solo para borrado permanente desde papelera) */}
      {deleteActaConfirmId && isPermanentDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-red-100 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center space-x-4 mb-6 text-red-600">
              <div className="bg-red-50 p-3 rounded-full border border-red-100">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-black">Eliminar Definitivamente</h3>
            </div>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
              Esta acción purgará el acta de Firestore <strong>de forma irreversible</strong>.
              <br/><br/>
              Para confirmar, escribe la palabra <strong className="font-bold text-slate-900">ELIMINAR</strong> abajo:
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
                  setIsPermanentDelete(false);
                }}
                className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (deleteActaConfirmText === 'ELIMINAR') {
                    handlePermanentDelete(deleteActaConfirmId);
                  }
                }}
                disabled={deleteActaConfirmText !== 'ELIMINAR'}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/20 active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Trash2 size={16} />
                <span>Purgar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invocación Leonística Modal */}
      {showInvocacionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] max-w-4xl w-full shadow-2xl border border-amber-200 animate-in zoom-in-95 duration-200 text-center relative overflow-y-auto max-h-[95vh] sm:overflow-hidden">
            
            {/* Header/Banner Decorativo */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-900 via-amber-500 to-blue-900"></div>
            
            {/* Botón de Cerrar Esquina */}
            <button
              onClick={() => setShowInvocacionModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
            >
              <X size={18} />
            </button>

            {/* Contenido */}
            <div className="p-6 sm:p-8 space-y-6">
              
              {/* Icono / Titulo */}
              <div className="flex flex-col items-center pt-2">
                <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-3 shadow-inner">
                  <BookOpen size={24} />
                </div>
                <h3 className="text-xl font-black text-blue-900 tracking-wider uppercase">
                  Invocación Leonística
                </h3>
                <div className="w-16 h-1 bg-amber-400 rounded-full mt-2"></div>
              </div>

              {/* Texto de la Invocación */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-800 text-xs sm:text-sm leading-relaxed px-1 sm:px-4">
                <div className="relative p-4 sm:p-5 bg-amber-50/45 rounded-2xl border border-amber-100/50 shadow-sm text-center flex flex-col justify-center">
                  <span className="absolute -top-3 left-6 px-2.5 py-0.5 bg-white text-[8px] uppercase tracking-widest text-amber-600 font-extrabold border border-amber-100 rounded-md">Paz y Serenidad</span>
                  <p className="italic text-slate-700 font-medium">
                    Haznos, Señor, Instrumento de tu paz<br />
                    danos serenidad para aceptar aquellas<br />
                    cosas que no podemos modificar,<br />
                    Valor para enmendar las que sí podemos<br />
                    y sabiduría para conocer la diferencia.
                  </p>
                </div>
                
                <div className="relative p-4 sm:p-5 bg-blue-50/45 rounded-2xl border border-blue-100/50 shadow-sm text-center flex flex-col justify-center">
                  <span className="absolute -top-3 left-6 px-2.5 py-0.5 bg-white text-[8px] uppercase tracking-widest text-blue-700 font-extrabold border border-blue-100 rounded-md">Entendimiento</span>
                  <p className="italic text-slate-700 font-medium">
                    Llena con tu luz nuestro entendimiento,<br />
                    para que pudiendo comprender más,<br />
                    podamos perdonar mejor.
                  </p>
                </div>
                
                <div className="relative p-4 sm:p-5 bg-amber-50/45 rounded-2xl border border-amber-100/50 shadow-sm text-center flex flex-col justify-center">
                  <span className="absolute -top-3 left-6 px-2.5 py-0.5 bg-white text-[8px] uppercase tracking-widest text-amber-600 font-extrabold border border-amber-100 rounded-md">Gracia y Generosidad</span>
                  <p className="italic text-slate-700 font-medium">
                    Concédenos la gracia de estar entre los<br />
                    bienaventurados que saben dar sin recordar<br />
                    y recibir sin olvidar.
                  </p>
                </div>
                
                <div className="relative p-4 sm:p-5 bg-blue-50/45 rounded-2xl border border-blue-100/50 shadow-sm text-center flex flex-col justify-center">
                  <span className="absolute -top-3 left-6 px-2.5 py-0.5 bg-white text-[8px] uppercase tracking-widest text-blue-700 font-extrabold border border-blue-100 rounded-md">Servicio y Amor</span>
                  <p className="italic text-slate-700 font-medium">
                    Danos Fe para ver tu rostro en el hermano,<br />
                    danos fortaleza para servir sin desánimo,<br />
                    danos alegría para sonreír en las dificultades,<br />
                    humildad para no envanecernos con el éxito,<br />
                    y un inmenso amor para que nuestra labor<br />
                    esté llena de tu espíritu.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col items-center space-y-4 pt-2">
                <p className="not-italic font-black text-blue-900 tracking-widest text-base sm:text-lg uppercase">
                  ASÍ SEA.
                </p>
                
                {/* Botón de Cerrar */}
                <button
                  onClick={() => setShowInvocacionModal(false)}
                  className="px-10 py-3 bg-blue-900 hover:bg-blue-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-900/10 active:scale-95"
                >
                  Cerrar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Saludo a la Bandera Modal */}
      {showSaludoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] max-w-2xl w-full shadow-2xl border border-amber-200 animate-in zoom-in-95 duration-200 text-center relative overflow-hidden">
            
            {/* Header/Banner Decorativo */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-900 via-amber-500 to-blue-900"></div>
            
            {/* Botón de Cerrar Esquina */}
            <button
              onClick={() => setShowSaludoModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
            >
              <X size={18} />
            </button>

            {/* Contenido */}
            <div className="p-6 sm:p-8 space-y-6">
              
              {/* Icono / Titulo */}
              <div className="flex flex-col items-center pt-2">
                <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-3 shadow-inner">
                  <BookOpen size={24} />
                </div>
                <h3 className="text-xl font-black text-blue-900 tracking-wider uppercase">
                  Saludo a la Bandera
                </h3>
                <div className="w-16 h-1 bg-amber-400 rounded-full mt-2"></div>
              </div>

              {/* Texto de la Bandera */}
              <div className="text-slate-800 space-y-5 text-sm sm:text-base leading-relaxed px-1 sm:px-4">
                <div className="relative p-4 sm:p-5 bg-blue-50/45 rounded-2xl border border-blue-100/50 shadow-sm text-center">
                  <span className="absolute -top-3 left-6 px-2.5 py-0.5 bg-white text-[8px] uppercase tracking-widest text-blue-700 font-extrabold border border-blue-100 rounded-md">Juramento</span>
                  <p className="italic text-slate-700 font-medium">
                    Bandera de mi Patria,<br />
                    sublime enseña de libertad y honor,<br />
                    los leones te juramos respeto y lealtad.
                  </p>
                </div>

                <div className="relative p-4 sm:p-5 bg-amber-50/45 rounded-2xl border border-amber-100/50 shadow-sm text-center">
                  <span className="absolute -top-3 left-6 px-2.5 py-0.5 bg-white text-[8px] uppercase tracking-widest text-amber-600 font-extrabold border border-amber-100 rounded-md">Servicio</span>
                  <p className="italic text-slate-700 font-medium">
                    Apasionados de servir a nuestra Patria<br />
                    con humildad y dignidad cada día.
                  </p>
                </div>

                <div className="relative p-4 sm:p-5 bg-blue-50/45 rounded-2xl border border-blue-100/50 shadow-sm text-center">
                  <span className="absolute -top-3 left-6 px-2.5 py-0.5 bg-white text-[8px] uppercase tracking-widest text-blue-700 font-extrabold border border-blue-100 rounded-md">Unión</span>
                  <p className="italic text-slate-700 font-medium">
                    Unidos en pensamiento y obra,<br />
                    en un solo rugir,<br />
                    velamos porque tu ondear sea libre,<br />
                    eterno y puro.
                  </p>
                </div>

                <p className="not-italic font-black text-blue-900 tracking-widest text-base sm:text-lg pt-2 text-center uppercase">
                  SALVE AMADA PATRIA, DULCE GUATEMALA.
                </p>
              </div>

              {/* Botón de Cerrar */}
              <div className="pt-2">
                <button
                  onClick={() => setShowSaludoModal(false)}
                  className="w-full sm:w-auto px-8 py-3 bg-blue-900 hover:bg-blue-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-900/10 active:scale-95"
                >
                  Cerrar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal Integrado de Éxito al Publicar o Actualizar Acta */}
      {publishedSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 text-center animate-in zoom-in-95 duration-200 relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-100 rounded-full blur-2xl opacity-60 pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-amber-100 rounded-full blur-2xl opacity-60 pointer-events-none" />

            {/* Header Badge Icon */}
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
              <CheckCircle2 size={36} className="text-emerald-500" />
            </div>

            {/* Content Header */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-200">
                {publishedSuccessModal.isEdit ? '¡Cambios Guardados!' : '¡Publicación Exitosa!'}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {publishedSuccessModal.isEdit ? 'Acta de Sesión Actualizada' : 'Acta de Sesión Publicada'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed">
                {publishedSuccessModal.isEdit 
                  ? 'Los datos de la sesión y las resoluciones de solicitudes fueron actualizados en el sistema.'
                  : 'El acta ha sido firmada digitalmente y registrada exitosamente en el Libro de Actas Oficial.'}
              </p>
            </div>

            {/* Detailed Info Card */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3 text-left">
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento:</span>
                <p className="text-sm font-extrabold text-slate-800 leading-snug">{publishedSuccessModal.title}</p>
              </div>

              {publishedSuccessModal.code && (
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Código de Firma Digital:</span>
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 font-mono text-xs font-bold text-slate-800 shadow-2xs">
                    <span className="truncate mr-2">{publishedSuccessModal.code}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(publishedSuccessModal.code).catch(() => {});
                        showToast('Código copiado al portapapeles', 'success');
                      }}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-[10px] font-black transition-all cursor-pointer flex-shrink-0"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-emerald-700">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Estado: Registro Oficial Activo</span>
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  generateActaPDF(publishedSuccessModal.acta, socios);
                }}
                className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
              >
                <Download size={16} />
                <span>Descargar PDF</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPublishedSuccessModal(null);
                  setShowAddActa(false);
                }}
                className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-slate-900/10 flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <span>Aceptar y Volver</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
