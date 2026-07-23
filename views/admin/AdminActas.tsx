import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  FileText, Plus, Search, Filter, Trash2, Edit, Download, X, Clock, Users, Mail, Briefcase, CheckCircle, Pencil, Building, BookOpen
} from 'lucide-react';
import { Acta, Socio, Solicitud, UserRole } from '../../types';
import { firebaseService } from '../../services/firebaseService';
import { useClubData } from '../../context/ClubDataContext';
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
  const [deleteActaConfirmId, setDeleteActaConfirmId] = useState<string | null>(null);
  const [deleteActaConfirmText, setDeleteActaConfirmText] = useState('');
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
    const pendingSols = solicitudes.filter(s => s.estado === 'Pendiente' && !s.archivada);
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
      firebaseService.saveActa(created).catch(err => {
        console.error("Error al guardar nueva acta en Firestore:", err);
      });
      alert("¡Acta de sesión guardada y solicitudes actualizadas con éxito!");
    }

    setActas(newActas);
    localStorage.setItem('club_leones_actas', JSON.stringify(newActas));

    const pendingSols = solicitudes.filter(s => s.estado === 'Pendiente' && !s.archivada);
    
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
      }
    }

    setShowAddActa(false);
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

  const filteredActas = useMemo(() => {
    return actas.filter(a => {
      const matchesSearch = a.titulo.toLowerCase().includes(actaSearch.toLowerCase()) || 
                            a.contenido.toLowerCase().includes(actaSearch.toLowerCase());
      const matchesCategory = actaFilterCategory === 'Todas' || a.categoria === actaFilterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [actas, actaSearch, actaFilterCategory]);

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

          {/* Step Indicator */}
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
                  className="relative z-10 flex flex-col items-center gap-2 focus:outline-none group"
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
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 max-w-3xl mx-auto">
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
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 max-w-3xl mx-auto">
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
                            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-200 w-full sm:w-auto justify-between sm:justify-start flex-shrink-0">
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4 text-left">
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
                          selectedAgendaPointTab === idx ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="flex flex-col items-start text-left">
                          <span className="max-w-[120px] truncate font-bold text-xs">
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
                          
                          {/* Etiquetar quorum */}
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
                                      src={member.foto || 'https://picsum.photos/seed/socio/200/200'} 
                                      alt={member.nombre} 
                                      className="w-5 h-5 rounded-full object-cover border border-slate-100 shadow-sm"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/socio/200/200';
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
                          
                          {/* Etiquetar quorum */}
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
                                      src={member.foto || 'https://picsum.photos/seed/socio/200/200'} 
                                      alt={member.nombre} 
                                      className="w-5 h-5 rounded-full object-cover border border-slate-100 shadow-sm"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/socio/200/200';
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
          <div className="grid gap-4 text-left">
            {filteredActas.map(acta => (
              <div key={acta.id} className="bg-white p-4 sm:p-6 md:p-9 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 hover:shadow-md transition-shadow w-full">
                <div className="flex items-center space-x-4 min-w-0 w-full md:w-auto">
                  <div className="bg-yellow-50 text-yellow-600 p-3.5 rounded-2xl flex-shrink-0">
                    <FileText size={24} />
                  </div>
                  <div className="min-w-0 flex-grow w-full">
                    <h4 className="font-extrabold text-slate-800 text-base md:text-lg break-words leading-tight">{acta.titulo}</h4>
                    <p className="text-xs text-slate-450 mt-1.5">
                      Redactada por <span className="font-bold text-blue-900/60 uppercase">{acta.autor}</span> • {formatDisplayDate(acta.fecha)}
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

      {/* Delete Confirmation Modal */}
      {deleteActaConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-red-100 animate-in zoom-in-95 duration-200 text-left">
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
    </div>
  );
};
