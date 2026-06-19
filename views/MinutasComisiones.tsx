import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { firebaseService } from '../services/firebaseService';
import { Comision, Socio, MinutaComision, MinutaPunto, Solicitud, Responsable } from '../types';
import { generateMinutaPDF } from '../utils/pdfGenerator';
import { 
  Plus, 
  Search, 
  Trash2, 
  Users, 
  CheckCircle, 
  Save, 
  FileText, 
  X, 
  Pencil, 
  Calendar, 
  Clock, 
  Award, 
  PlusCircle, 
  ChevronRight,
  MessageSquare,
  HelpCircle,
  AlertCircle,
  Download
} from 'lucide-react';

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

export const MinutasComisiones: React.FC = () => {
  const [minutas, setMinutas] = useState<MinutaComision[]>([]);
  const [comisiones, setComisiones] = useState<Comision[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);

  const [selectedMinutaId, setSelectedMinutaId] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterComisionId, setFilterComisionId] = useState('');
  const [filterYear, setFilterYear] = useState('Todos');
  const [filterMonth, setFilterMonth] = useState('Todos');
  const [filterSolicitud, setFilterSolicitud] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterComisionId, filterYear, filterMonth, filterSolicitud]);

  // Dynamic years and months for filters
  const years = useMemo(() => {
    const yearsSet = new Set<string>();
    minutas.forEach(m => {
      if (m.fechaHora) {
        const year = new Date(m.fechaHora).getFullYear().toString();
        yearsSet.add(year);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [minutas]);

  const months = [
    { value: '0', label: 'Enero' },
    { value: '1', label: 'Febrero' },
    { value: '2', label: 'Marzo' },
    { value: '3', label: 'Abril' },
    { value: '4', label: 'Mayo' },
    { value: '5', label: 'Junio' },
    { value: '6', label: 'Julio' },
    { value: '7', label: 'Agosto' },
    { value: '8', label: 'Septiembre' },
    { value: '9', label: 'Octubre' },
    { value: '10', label: 'Noviembre' },
    { value: '11', label: 'Diciembre' }
  ];

  // Modales
  const [selectedSocioForModal, setSelectedSocioForModal] = useState<Socio | null>(null);

  // Form State
  const [form, setForm] = useState<{
    id?: string;
    tema: string;
    comisionId: string;
    miembrosAsistencia: string[]; // IDs de socios
    otrosParticipantes: string[]; // IDs de socios
    puntos: Omit<MinutaPunto, 'id'>[];
    crearSolicitud: boolean;
    solicitudTema: string;
    solicitudTitulo: string;
    solicitudDescripcion: string;
    solicitudResponsables: string[]; // IDs de socios
  }>({
    tema: '',
    comisionId: '',
    miembrosAsistencia: [],
    otrosParticipantes: [],
    puntos: [{ punto: '', discusion: '' }],
    crearSolicitud: false,
    solicitudTema: TEMAS_SOLICITUD[0],
    solicitudTitulo: '',
    solicitudDescripcion: '',
    solicitudResponsables: []
  });

  const [socioSearchQuery, setSocioSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Subscriptions
  useEffect(() => {
    const qSocios = query(collection(db, 'socios'), orderBy('nombre', 'asc'));
    const unsubSocios = onSnapshot(qSocios, (snapshot) => {
      setSocios(snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as Socio));
    });

    const qComisiones = query(collection(db, 'comisiones'), orderBy('nombre', 'asc'));
    const unsubComisiones = onSnapshot(qComisiones, (snapshot) => {
      setComisiones(snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as Comision));
    });

    const qMinutas = query(collection(db, 'minutas'), orderBy('fechaHora', 'desc'));
    const unsubMinutas = onSnapshot(qMinutas, (snapshot) => {
      setMinutas(snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as MinutaComision));
    });

    const qSolicitudes = query(collection(db, 'solicitudes'), orderBy('fechaCreacion', 'desc'));
    const unsubSolicitudes = onSnapshot(qSolicitudes, (snapshot) => {
      setSolicitudes(snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as Solicitud));
    });

    return () => {
      unsubSocios();
      unsubComisiones();
      unsubMinutas();
      unsubSolicitudes();
    };
  }, []);



  // Selected Minuta Details
  const selectedMinuta = useMemo(() => {
    return minutas.find(m => m.id === selectedMinutaId);
  }, [minutas, selectedMinutaId]);

  // Selected Commission in Form
  const selectedComisionInForm = useMemo(() => {
    return comisiones.find(c => c.id === form.comisionId);
  }, [comisiones, form.comisionId]);

  // Handle comision selection in form
  const handleFormComisionChange = (comisionId: string) => {
    const selected = comisiones.find(c => c.id === comisionId);
    setForm(prev => ({
      ...prev,
      comisionId,
      // Default members attendance is all members selected
      miembrosAsistencia: selected ? selected.miembros : [],
      solicitudResponsables: []
    }));
  };

  // Toggle member attendance
  const handleToggleAsistencia = (socioId: string) => {
    const current = form.miembrosAsistencia;
    if (current.includes(socioId)) {
      setForm({ ...form, miembrosAsistencia: current.filter(id => id !== socioId) });
    } else {
      setForm({ ...form, miembrosAsistencia: [...current, socioId] });
    }
  };

  // Add other participant
  const handleAddOtroParticipante = (socioId: string) => {
    if (!form.otrosParticipantes.includes(socioId)) {
      setForm({
        ...form,
        otrosParticipantes: [...form.otrosParticipantes, socioId]
      });
    }
    setSocioSearchQuery('');
  };

  // Remove other participant
  const handleRemoveOtroParticipante = (socioId: string) => {
    setForm({
      ...form,
      otrosParticipantes: form.otrosParticipantes.filter(id => id !== socioId),
      solicitudResponsables: form.solicitudResponsables.filter(id => id !== socioId)
    });
  };

  // Add new punto input field
  const handleAddPuntoField = () => {
    setForm({
      ...form,
      puntos: [...form.puntos, { punto: '', discusion: '' }]
    });
  };

  // Remove punto input field
  const handleRemovePuntoField = (index: number) => {
    const updated = form.puntos.filter((_, i) => i !== index);
    setForm({
      ...form,
      puntos: updated.length > 0 ? updated : [{ punto: '', discusion: '' }]
    });
  };

  // Update punto input field
  const handleUpdatePuntoField = (index: number, key: 'punto' | 'discusion', val: string) => {
    const updated = form.puntos.map((p, i) => {
      if (i === index) {
        return { ...p, [key]: val };
      }
      return p;
    });
    setForm({ ...form, puntos: updated });
  };

  // Filter unselected socios to show as additional participants
  const filteredUnselectedSocios = useMemo(() => {
    return socios.filter(s => {
      const isComisionMember = selectedComisionInForm?.miembros.includes(s.id) || false;
      const isAlreadyParticipant = form.otrosParticipantes.includes(s.id);
      const matchesSearch = s.nombre.toLowerCase().includes(socioSearchQuery.toLowerCase());
      return !isComisionMember && !isAlreadyParticipant && matchesSearch;
    });
  }, [socios, selectedComisionInForm, form.otrosParticipantes, socioSearchQuery]);

  // Combined list of all attendees in form (members + others)
  const formAttendeesList = useMemo(() => {
    const list: Socio[] = [];
    // Active members of commission
    if (selectedComisionInForm) {
      selectedComisionInForm.miembros.forEach(id => {
        const s = socios.find(socio => socio.id === id);
        if (s) list.push(s);
      });
    }
    // Other participants
    form.otrosParticipantes.forEach(id => {
      const s = socios.find(socio => socio.id === id);
      if (s && !list.some(item => item.id === s.id)) list.push(s);
    });
    return list;
  }, [selectedComisionInForm, form.otrosParticipantes, socios]);

  // Toggle responsible in request form
  const handleToggleSolicitudResponsable = (socioId: string) => {
    const current = form.solicitudResponsables;
    if (current.includes(socioId)) {
      setForm({ ...form, solicitudResponsables: current.filter(id => id !== socioId) });
    } else {
      if (current.length >= 3) {
        alert('Solo puedes seleccionar un máximo de 3 responsables.');
        return;
      }
      setForm({ ...form, solicitudResponsables: [...current, socioId] });
    }
  };

  // Save Minuta and potentially create Request
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.tema.trim()) {
      setErrorMsg('Por favor, ingresa el tema de la reunión.');
      return;
    }
    if (!form.comisionId) {
      setErrorMsg('Por favor, selecciona una comisión.');
      return;
    }
    if (form.puntos.some(p => !p.punto.trim() || !p.discusion.trim())) {
      setErrorMsg('Por favor, completa el título y discusión de todos los puntos.');
      return;
    }

    setIsSaving(true);

    try {
      let linkedRequestId = '';

      // Create internal request if checked
      if (form.crearSolicitud) {
        if (!form.solicitudTitulo.trim() || !form.solicitudDescripcion.trim()) {
          throw new Error('Por favor, ingresa el título y la descripción para la solicitud interna.');
        }

        const responsiblesData: Responsable[] = form.solicitudResponsables.map(id => {
          const s = socios.find(soc => soc.id === id);
          return {
            nombre: s?.nombre || 'Socio Desconocido',
            telefono: s?.telefono || '00000000'
          };
        });

        const newRequest: Solicitud = {
          id: `sol-${Date.now()}`,
          nombre: form.solicitudTitulo.trim(),
          fecha: new Date().toISOString().split('T')[0],
          descripcion: form.solicitudDescripcion.trim(),
          responsables: responsiblesData,
          tema: form.solicitudTema,
          tipo: 'internas',
          estado: 'Pendiente',
          usuarioCreador: 'Minuta de Comisión',
          fechaCreacion: new Date().toISOString().split('T')[0]
        };

        await firebaseService.saveSolicitud(newRequest);
        linkedRequestId = newRequest.id;
      }

      // Create minuta
      const newMinuta: MinutaComision = {
        id: form.id || `min-${Date.now()}`,
        tema: form.tema.trim(),
        comisionId: form.comisionId,
        miembrosComision: form.miembrosAsistencia,
        otrosParticipantes: form.otrosParticipantes,
        fechaHora: form.id ? (minutas.find(m => m.id === form.id)?.fechaHora || new Date().toISOString()) : new Date().toISOString(),
        puntos: form.puntos.map((p, idx) => ({ id: `p-${idx}-${Date.now()}`, ...p })),
        solicitudVinculadaId: linkedRequestId || undefined
      };

      await firebaseService.saveMinuta(newMinuta);
      setSelectedMinutaId(newMinuta.id);
      setShowForm(false);

      // Reset
      setForm({
        tema: '',
        comisionId: '',
        miembrosAsistencia: [],
        otrosParticipantes: [],
        puntos: [{ punto: '', discusion: '' }],
        crearSolicitud: false,
        solicitudTema: TEMAS_SOLICITUD[0],
        solicitudTitulo: '',
        solicitudDescripcion: '',
        solicitudResponsables: []
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al guardar la minuta. Por favor intente de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  // Open form for editing
  const handleEdit = (minuta: MinutaComision) => {
    const com = comisiones.find(c => c.id === minuta.comisionId);
    
    // Find linked request if any
    const req = solicitudes.find(s => s.id === minuta.solicitudVinculadaId);

    setForm({
      id: minuta.id,
      tema: minuta.tema,
      comisionId: minuta.comisionId,
      miembrosAsistencia: minuta.miembrosComision,
      otrosParticipantes: minuta.otrosParticipantes,
      puntos: minuta.puntos.map(p => ({ punto: p.punto, discusion: p.discusion })),
      crearSolicitud: !!minuta.solicitudVinculadaId,
      solicitudTema: req?.tema || TEMAS_SOLICITUD[0],
      solicitudTitulo: req?.nombre || '',
      solicitudDescripcion: req?.descripcion || '',
      solicitudResponsables: [] // Can re-assign
    });
    setShowForm(true);
  };

  // Permanent Delete
  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta minuta permanentemente?')) {
      try {
        await firebaseService.deleteMinuta(id);
        if (selectedMinutaId === id) {
          const remaining = minutas.filter(m => m.id !== id);
          setSelectedMinutaId(remaining.length > 0 ? remaining[0].id : '');
        }
      } catch (err) {
        console.error(err);
        alert('Error al eliminar la minuta.');
      }
    }
  };

  // Filter minutas for the list
  const filteredMinutas = useMemo(() => {
    return minutas.filter(m => {
      const commission = comisiones.find(c => c.id === m.comisionId);
      const req = solicitudes.find(s => s.id === m.solicitudVinculadaId);
      const date = new Date(m.fechaHora);

      const attendeeNames = [
        ...m.miembrosComision,
        ...m.otrosParticipantes
      ].map(id => socios.find(s => s.id === id)?.nombre || '').join(' ').toLowerCase();

      const pointsText = m.puntos.map(p => p.punto + ' ' + p.discusion).join(' ').toLowerCase();

      const matchesSearch = 
        m.tema.toLowerCase().includes(searchTerm.toLowerCase()) || 
        commission?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attendeeNames.includes(searchTerm.toLowerCase()) ||
        pointsText.includes(searchTerm.toLowerCase());

      const matchesComision = filterComisionId ? m.comisionId === filterComisionId : true;
      const matchesYear = filterYear === 'Todos' ? true : date.getFullYear().toString() === filterYear;
      const matchesMonth = filterMonth === 'Todos' ? true : date.getMonth().toString() === filterMonth;

      let matchesSolicitud = true;
      if (filterSolicitud === 'con_solicitud') {
        matchesSolicitud = !!m.solicitudVinculadaId;
      } else if (filterSolicitud === 'sin_solicitud') {
        matchesSolicitud = !m.solicitudVinculadaId;
      } else if (filterSolicitud === 'solicitud_aprobada') {
        matchesSolicitud = !!m.solicitudVinculadaId && req?.estado === 'Aprobada';
      } else if (filterSolicitud === 'solicitud_pendiente') {
        matchesSolicitud = !!m.solicitudVinculadaId && req?.estado === 'Pendiente';
      }

      return matchesSearch && matchesComision && matchesYear && matchesMonth && matchesSolicitud;
    });
  }, [minutas, comisiones, solicitudes, socios, searchTerm, filterComisionId, filterYear, filterMonth, filterSolicitud]);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredMinutas.length / ITEMS_PER_PAGE);
  const paginatedMinutas = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMinutas.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMinutas, currentPage]);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto py-4 sm:py-6 animate-in fade-in duration-500">
      {/* Header Panel */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.06),transparent)] pointer-events-none"></div>
        <div className="relative z-10 space-y-1">
          <span className="bg-yellow-400 text-blue-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">Comité de Servicio</span>
          <h1 className="text-3xl font-black tracking-tight">Minutas de Comisiones</h1>
          <p className="text-sm text-slate-200/90 font-medium max-w-xl">
            Genera, consulta y administra las minutas de reuniones de las comisiones del club. Vincula resoluciones con solicitudes internas de forma automatizada.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setForm({
                tema: '',
                comisionId: '',
                miembrosAsistencia: [],
                otrosParticipantes: [],
                puntos: [{ punto: '', discusion: '' }],
                crearSolicitud: false,
                solicitudTema: TEMAS_SOLICITUD[0],
                solicitudTitulo: '',
                solicitudDescripcion: '',
                solicitudResponsables: []
              });
              setShowForm(true);
            }}
            className="bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-black px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-yellow-500/25 flex items-center justify-center space-x-2 shrink-0 self-start md:self-center cursor-pointer active:scale-95"
          >
            <Plus size={18} />
            <span>Nueva Minuta</span>
          </button>
        )}
      </header>

      {showForm ? (
        /* CREATE / EDIT FORM VIEW */
        <div className="bg-white rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-8 border border-slate-200 shadow-sm relative animate-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
            <h3 className="text-xl font-black text-slate-800">{form.id ? 'Editar Minuta de Comisión' : 'Nueva Minuta de Comisión'}</h3>
            <button 
              onClick={() => setShowForm(false)} 
              className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-150 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {errorMsg && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start space-x-3 text-red-700 text-sm animate-in fade-in">
              <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-10">
            {/* 1. Encabezado de la Reunión */}
            <div className="space-y-6">
              <h4 className="font-extrabold text-blue-900 border-b border-slate-100 pb-2 flex items-center space-x-2">
                <span className="bg-blue-100 text-blue-800 text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">1</span>
                <span>Datos Generales de la Reunión</span>
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Tema Principal / Título</label>
                  <input
                    type="text"
                    required
                    value={form.tema}
                    onChange={(e) => setForm({ ...form, tema: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej. Planificación de Campaña Médica"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Comisión Encargada</label>
                  <select
                    required
                    value={form.comisionId}
                    onChange={(e) => handleFormComisionChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Seleccione una Comisión --</option>
                    {comisiones.filter(c => c.estado === 'Activa').map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Control de Asistencia y Participantes */}
            {form.comisionId && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h4 className="font-extrabold text-blue-900 border-b border-slate-100 pb-2 flex items-center space-x-2">
                  <span className="bg-blue-100 text-blue-800 text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">2</span>
                  <span>Control de Asistencia e Invitados</span>
                </h4>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Columna Izquierda: Miembros de la Comisión */}
                  <div className="space-y-4">
                    <h5 className="font-extrabold text-slate-700 text-sm flex items-center justify-between">
                      <span>Miembros de Comisión (Marcar Asistencia)</span>
                      <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                        {form.miembrosAsistencia.length} Asistentes
                      </span>
                    </h5>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 max-h-[300px] overflow-y-auto space-y-2.5">
                      {selectedComisionInForm?.miembros.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Esta comisión no tiene miembros registrados.</p>
                      ) : (
                        selectedComisionInForm?.miembros.map(id => {
                          const s = socios.find(soc => soc.id === id);
                          if (!s) return null;
                          const isPresent = form.miembrosAsistencia.includes(id);
                          return (
                            <button
                              type="button"
                              key={id}
                              onClick={() => handleToggleAsistencia(id)}
                              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border text-left cursor-pointer ${
                                isPresent
                                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800 font-extrabold shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <img
                                  src={s.foto || `https://picsum.photos/seed/${s.nombre}/100/100`}
                                  className="w-8 h-8 rounded-full object-cover border"
                                  alt={s.nombre}
                                />
                                <div>
                                  <p className="text-xs font-black leading-none">{s.nombre}</p>
                                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">{s.puesto || 'Socio'}</p>
                                </div>
                              </div>
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                isPresent ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white'
                              }`}>
                                {isPresent && <CheckCircle size={12} />}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Columna Derecha: Agregar Otros Socios */}
                  <div className="space-y-4">
                    <h5 className="font-extrabold text-slate-700 text-sm flex items-center justify-between">
                      <span>Agregar Otros Socios Participantes</span>
                      <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                        {form.otrosParticipantes.length} Agregados
                      </span>
                    </h5>
                    
                    {/* Buscador de Socios */}
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        value={socioSearchQuery}
                        onChange={e => setSocioSearchQuery(e.target.value)}
                        placeholder="Buscar socio por nombre..."
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-semibold text-slate-700"
                      />
                      {socioSearchQuery && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-[180px] overflow-y-auto divide-y divide-slate-100">
                          {filteredUnselectedSocios.length === 0 ? (
                            <div className="p-3 text-xs text-slate-400 italic">No se encontraron socios.</div>
                          ) : (
                            filteredUnselectedSocios.map(s => (
                              <button
                                type="button"
                                key={s.id}
                                onClick={() => handleAddOtroParticipante(s.id)}
                                className="w-full text-left p-2.5 hover:bg-slate-50 transition-colors flex items-center space-x-3 cursor-pointer"
                              >
                                <img src={s.foto || `https://picsum.photos/seed/${s.nombre}/100/100`} className="w-7 h-7 rounded-full object-cover" alt="" />
                                <div>
                                  <p className="text-xs font-bold text-slate-700">{s.nombre}</p>
                                  {s.puesto && <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider">{s.puesto}</p>}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Lista de Participantes Adicionales */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 max-h-[200px] overflow-y-auto space-y-2">
                      {form.otrosParticipantes.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-4">Ningún participante externo agregado.</p>
                      ) : (
                        form.otrosParticipantes.map(id => {
                          const s = socios.find(soc => soc.id === id);
                          if (!s) return null;
                          return (
                            <div key={id} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/50 shadow-sm">
                              <div className="flex items-center space-x-2.5">
                                <img src={s.foto || `https://picsum.photos/seed/${s.nombre}/100/100`} className="w-7 h-7 rounded-full object-cover" alt="" />
                                <div>
                                  <p className="text-xs font-black text-slate-750 leading-tight">{s.nombre}</p>
                                  {s.puesto && <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">{s.puesto}</p>}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveOtroParticipante(id)}
                                className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Puntos del Orden del Día y Debate */}
            <div className="space-y-6">
              <h4 className="font-extrabold text-blue-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="bg-blue-100 text-blue-800 text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">3</span>
                  <span>Temas Tratados, Debates y Discusión</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddPuntoField}
                  className="text-xs font-black text-blue-600 hover:text-blue-800 flex items-center space-x-1 hover:underline cursor-pointer"
                >
                  <PlusCircle size={14} />
                  <span>Agregar Punto</span>
                </button>
              </h4>

              <div className="space-y-6">
                {form.puntos.map((punto, index) => (
                  <div key={index} className="bg-slate-50/50 border border-slate-200/70 p-5 rounded-2xl shadow-sm relative space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                      <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Punto #{index + 1}</span>
                      {form.puntos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePuntoField(index)}
                          className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1 mb-1 block">Punto Tratado / Propuesta</label>
                        <input
                          type="text"
                          required
                          value={punto.punto}
                          onChange={(e) => handleUpdatePuntoField(index, 'punto', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Ej. Propuesta de compra de insumos médicos"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1 mb-1 block">Debate, Discusión y Acuerdos</label>
                        <textarea
                          required
                          rows={3}
                          value={punto.discusion}
                          onChange={(e) => handleUpdatePuntoField(index, 'discusion', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          placeholder="Detalles sobre el debate, los comentarios de los asistentes y las decisiones tomadas..."
                        ></textarea>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Vinculación Automatizada con Solicitudes Internas */}
            <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 border border-amber-200/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-amber-900 text-sm">Generar Solicitud Interna Automatizada</h4>
                    <p className="text-[11px] text-amber-700 font-semibold leading-none mt-0.5">Genera una solicitud en la sección de Solicitudes Internas basada en esta minuta.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={form.crearSolicitud}
                  onChange={(e) => setForm({ ...form, crearSolicitud: e.target.checked })}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {form.crearSolicitud && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-amber-200/50 animate-in fade-in duration-300">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[9px] font-black text-amber-800 uppercase tracking-wider ml-1 mb-1 block">Título de la Solicitud</label>
                      <input
                        type="text"
                        required
                        value={form.solicitudTitulo}
                        onChange={(e) => setForm({ ...form, solicitudTitulo: e.target.value })}
                        className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/50"
                        placeholder="Ej. Solicitud de aprobación de fondos para vacunas"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-amber-800 uppercase tracking-wider ml-1 mb-1 block">Causa Global / Tema</label>
                      <select
                        value={form.solicitudTema}
                        onChange={(e) => setForm({ ...form, solicitudTema: e.target.value })}
                        className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/50"
                      >
                        {TEMAS_SOLICITUD.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-amber-800 uppercase tracking-wider ml-1 mb-1 block">Descripción y Justificación</label>
                      <textarea
                        required
                        rows={3}
                        value={form.solicitudDescripcion}
                        onChange={(e) => setForm({ ...form, solicitudDescripcion: e.target.value })}
                        className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                        placeholder="Detalla lo que se está solicitando y por qué fue aprobado en la comisión..."
                      ></textarea>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-amber-800 uppercase tracking-wider ml-1 mb-1 block">
                      Seleccionar Responsable(s) de Ejecución (Máximo 3)
                    </label>
                    <p className="text-[10px] text-amber-700 font-semibold italic">Se seleccionan de la lista de asistentes a esta reunión:</p>
                    
                    <div className="bg-white rounded-xl p-3 border border-amber-200 max-h-[220px] overflow-y-auto space-y-2">
                      {formAttendeesList.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-6">Por favor, agrega asistentes o selecciona una comisión primero.</p>
                      ) : (
                        formAttendeesList.map(s => {
                          const isResp = form.solicitudResponsables.includes(s.id);
                          return (
                            <button
                              type="button"
                              key={s.id}
                              onClick={() => handleToggleSolicitudResponsable(s.id)}
                              className={`w-full flex items-center justify-between p-2 rounded-lg transition-all border text-left cursor-pointer ${
                                isResp
                                  ? 'bg-amber-100/50 border-amber-300 text-amber-800 font-bold'
                                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5">
                                <img src={s.foto || `https://picsum.photos/seed/${s.nombre}/100/100`} className="w-6 h-6 rounded-full object-cover" alt="" />
                                <span className="text-xs">{s.nombre}</span>
                              </div>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isResp ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-300 bg-white'
                              }`}>
                                {isResp && <CheckCircle size={10} />}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="flex justify-end space-x-4 border-t border-slate-100 pt-6">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold transition-colors cursor-pointer text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-black transition-all flex items-center space-x-2 shadow-lg shadow-blue-900/20 cursor-pointer text-sm active:scale-95 disabled:opacity-50"
              >
                <Save size={16} />
                <span>{isSaving ? 'Guardando...' : 'Guardar Minuta'}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* MAIN DASHBOARD VIEW (Full-width Horizontal Ficha & Grid list) */
        <div className="space-y-6 sm:space-y-8">
          {/* TOP ADVANCED FILTERS CARD */}
          <div className="bg-white rounded-2xl sm:rounded-[2rem] p-3 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                <Search size={16} className="text-blue-900" />
                <span>Filtros de Búsqueda Avanzados</span>
              </h3>
              {(searchTerm || filterComisionId || filterYear !== 'Todos' || filterMonth !== 'Todos' || filterSolicitud !== 'Todos') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterComisionId('');
                    setFilterYear('Todos');
                    setFilterMonth('Todos');
                    setFilterSolicitud('Todos');
                  }}
                  className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors self-start sm:self-auto"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {/* 1. Buscador */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Buscador</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Tema, acuerdo o asistente..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              {/* 2. Comisión */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Comisión</label>
                <select
                  value={filterComisionId}
                  onChange={e => setFilterComisionId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Todas las Comisiones</option>
                  {comisiones.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              {/* 3. Año */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Año</label>
                <select
                  value={filterYear}
                  onChange={e => setFilterYear(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Todos">Todos los años</option>
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* 4. Mes */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Mes</label>
                <select
                  value={filterMonth}
                  onChange={e => setFilterMonth(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Todos">Todos los meses</option>
                  {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* 5. Solicitud */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Solicitud Interna</label>
                <select
                  value={filterSolicitud}
                  onChange={e => setFilterSolicitud(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="Todos">Todas las minutas</option>
                  <option value="con_solicitud">Con Solicitud Interna</option>
                  <option value="sin_solicitud">Sin Solicitud Interna</option>
                  <option value="solicitud_aprobada">Con Solicitud Aprobada</option>
                  <option value="solicitud_pendiente">Con Solicitud Pendiente</option>
                </select>
              </div>
            </div>
          </div>

          {selectedMinuta ? (
            /* FULL WIDTH HORIZONTAL FICHA SHEET */
            <div className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500 p-3 sm:p-6 md:p-8 space-y-5 sm:space-y-8">
              {/* Header row */}
              <div className="space-y-3 sm:space-y-4 border-b border-slate-100 pb-5 sm:pb-6 w-full">
                <button
                  onClick={() => setSelectedMinutaId('')}
                  className="flex items-center space-x-1.5 px-3 py-1.5 sm:px-4 sm:py-2 border border-slate-200 rounded-xl text-slate-600 hover:text-blue-900 hover:bg-slate-50 transition-all font-black text-xs cursor-pointer shadow-sm w-fit"
                >
                  <ChevronRight size={14} className="rotate-180" />
                  <span>Regresar al Listado</span>
                </button>
                
                <div className="text-left space-y-2">
                  <span className="bg-blue-900 text-yellow-400 text-[9px] sm:text-[10px] font-black px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full uppercase tracking-wider">
                    {comisiones.find(c => c.id === selectedMinuta.comisionId)?.nombre || 'Comisión'}
                  </span>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 leading-tight w-full break-words">
                    "{selectedMinuta.tema}"
                  </h2>
                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-[11px] sm:text-xs font-semibold text-slate-400">
                    <div className="flex items-center space-x-1">
                      <Calendar size={13} />
                      <span>{new Date(selectedMinuta.fechaHora).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock size={13} />
                      <span>{new Date(selectedMinuta.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText size={13} />
                      <span className="truncate max-w-[120px] sm:max-w-none">ID: {selectedMinuta.id}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Registro de Asistencia */}
              <div className="bg-slate-50/40 border border-slate-200/60 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-6 w-full">
                <h3 className="font-extrabold text-blue-900 text-sm border-b border-slate-100 pb-2 flex items-center space-x-2">
                  <Users size={16} className="text-blue-900" />
                  <span>Registro de Asistencia</span>
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  {/* Miembros */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      Miembros Comisión ({selectedMinuta.miembrosComision.length})
                    </span>
                    <div className="grid grid-cols-1 min-[480px]:grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3 max-h-[280px] overflow-y-auto pr-1">
                      {selectedMinuta.miembrosComision.length === 0 ? (
                        <p className="text-xs text-slate-400 italic min-[480px]:col-span-2">Sin miembros registrados.</p>
                      ) : (
                        selectedMinuta.miembrosComision.map(id => {
                          const s = socios.find(soc => soc.id === id);
                          if (!s) return null;
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setSelectedSocioForModal(s)}
                              className="w-full flex items-center space-x-2.5 p-1.5 sm:p-2 bg-white rounded-xl border border-slate-200/50 hover:border-slate-300 hover:shadow-sm transition-all text-left cursor-pointer group"
                            >
                              <img src={s.foto || `https://picsum.photos/seed/${s.nombre}/100/100`} className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border" alt="" />
                              <div className="overflow-hidden">
                                <p className="text-xs font-black text-slate-750 group-hover:text-blue-600 transition-colors truncate">{s.nombre}</p>
                                {s.puesto && <p className="text-[8px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">{s.puesto}</p>}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Invitados */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      Invitados / Otros ({selectedMinuta.otrosParticipantes.length})
                    </span>
                    <div className="grid grid-cols-1 min-[480px]:grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3 max-h-[280px] overflow-y-auto pr-1">
                      {selectedMinuta.otrosParticipantes.length === 0 ? (
                        <p className="text-xs text-slate-400 italic min-[480px]:col-span-2">Sin invitados adicionales.</p>
                      ) : (
                        selectedMinuta.otrosParticipantes.map(id => {
                          const s = socios.find(soc => soc.id === id);
                          if (!s) return null;
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setSelectedSocioForModal(s)}
                              className="w-full flex items-center space-x-2.5 p-1.5 sm:p-2 bg-white rounded-xl border border-slate-200/50 hover:border-slate-300 hover:shadow-sm transition-all text-left cursor-pointer group"
                            >
                              <img src={s.foto || `https://picsum.photos/seed/${s.nombre}/100/100`} className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border" alt="" />
                              <div className="overflow-hidden">
                                <p className="text-xs font-black text-slate-750 group-hover:text-blue-600 transition-colors truncate">{s.nombre}</p>
                                {s.puesto && <p className="text-[8px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">{s.puesto}</p>}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Temas Discutidos y Acuerdos (Puntos) */}
              <div className="space-y-4 w-full">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                  <MessageSquare size={12} className="text-slate-400" />
                  <span>Temas Discutidos y Acuerdos ({selectedMinuta.puntos.length})</span>
                </h4>

                <div className="space-y-4">
                  {selectedMinuta.puntos.map((punto, idx) => (
                    <div key={punto.id || idx} className="flex space-x-3 sm:space-x-4">
                      <div className="flex flex-col items-center">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-900 text-yellow-400 border border-blue-950 flex items-center justify-center text-xs sm:text-sm font-black shrink-0">
                          {idx + 1}
                        </div>
                        {idx < selectedMinuta.puntos.length - 1 && (
                          <div className="w-0.5 bg-slate-200 grow my-1"></div>
                        )}
                      </div>
                      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 grow space-y-2 shadow-sm hover:shadow-md transition-all duration-300">
                        <h5 className="font-black text-sm sm:text-base text-slate-800 leading-snug break-words">
                          {punto.punto}
                        </h5>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold italic break-words border-l-2 border-slate-200 pl-3 sm:pl-3.5">
                          "{punto.discusion}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Solicitud Interna Vinculada (abajo de los puntos) */}
              {selectedMinuta.solicitudVinculadaId && (() => {
                const req = solicitudes.find(s => s.id === selectedMinuta.solicitudVinculadaId);
                if (!req) return null;
                return (
                  <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/20 border border-amber-200/60 p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-4 shadow-sm w-full">
                    <div className="flex justify-between items-center border-b border-amber-200/30 pb-2 gap-2">
                      <div className="flex items-center space-x-2 text-amber-900">
                        <FileText size={16} className="text-amber-500 animate-pulse shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest truncate">Solicitud Interna Vinculada</span>
                      </div>
                      <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shrink-0 ${
                        req.estado === 'Aprobada' ? 'bg-emerald-100 text-emerald-800' :
                        req.estado === 'Rechazada' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {req.estado}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <h5 className="text-xs sm:text-sm font-black text-slate-800 leading-tight">{req.nombre}</h5>
                      <p className="text-xs text-slate-600 font-semibold leading-relaxed italic">"{req.descripcion}"</p>
                    </div>
                    
                    {req.responsables && req.responsables.length > 0 && (
                      <div className="pt-2 border-t border-amber-200/30 space-y-1.5">
                        <span className="text-[9px] font-black text-amber-800 uppercase tracking-wider">Responsables designados:</span>
                        <div className="flex flex-wrap gap-2">
                          {req.responsables.map((r, idx) => (
                            <span key={idx} className="bg-amber-100/60 text-amber-900 border border-amber-200 text-[9px] font-bold px-2 py-0.5 rounded-md">
                              {r.nombre}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Acciones (Descargar PDF, Editar, Eliminar al final de la ficha) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-slate-100 pt-5 sm:pt-6 w-full">
                <button
                  onClick={() => {
                    const comisionNombre = comisiones.find(c => c.id === selectedMinuta.comisionId)?.nombre || 'Comisión';
                    generateMinutaPDF(selectedMinuta, comisionNombre, socios, 'download');
                  }}
                  className="w-full sm:w-auto px-5 py-3.5 sm:py-3 bg-yellow-400 hover:bg-yellow-350 text-blue-900 rounded-2xl transition-all hover:scale-[1.02] font-black text-xs flex items-center justify-center space-x-2 shadow-lg shadow-yellow-500/10 cursor-pointer active:scale-95"
                  title="Descargar PDF de Minuta"
                >
                  <Download size={14} />
                  <span>Descargar PDF</span>
                </button>
                <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => handleEdit(selectedMinuta)}
                    className="px-5 py-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 text-slate-600 hover:text-blue-900 rounded-2xl transition-all hover:scale-[1.02] font-black text-xs flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                    title="Editar Minuta"
                  >
                    <Pencil size={14} />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDelete(selectedMinuta.id)}
                    className="px-5 py-3 bg-red-500/90 hover:bg-red-600 text-white rounded-2xl transition-all hover:scale-[1.02] font-black text-xs flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                    title="Eliminar Minuta"
                  >
                    <Trash2 size={14} />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (

            /* LIST OF MINUTAS (GRID OF HORIZONTAL CARDS) */
            <div className="space-y-4 sm:space-y-6">
              <div className="flex justify-between items-center px-2">
                <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">
                  {filteredMinutas.length === 0 
                    ? 'Mostrando 0 minutas' 
                    : `Mostrando ${((currentPage - 1) * ITEMS_PER_PAGE) + 1} - ${Math.min(currentPage * ITEMS_PER_PAGE, filteredMinutas.length)} de ${filteredMinutas.length} minutas`}
                </span>
              </div>

              {filteredMinutas.length === 0 ? (
                <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-slate-200 p-12 sm:p-16 text-center text-slate-400 text-sm font-bold italic shadow-sm">
                  No se encontraron minutas con los filtros seleccionados.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {paginatedMinutas.map(m => {
                    const comm = comisiones.find(c => c.id === m.comisionId);
                    const dateStr = new Date(m.fechaHora).toLocaleDateString('es-GT', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    });
                    const timeStr = new Date(m.fechaHora).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    const req = solicitudes.find(s => s.id === m.solicitudVinculadaId);
                    const totalAttendees = m.miembrosComision.length + m.otrosParticipantes.length;

                    return (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMinutaId(m.id)}
                        className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-[2.5rem] p-3 sm:p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between text-left gap-4 group w-full cursor-pointer"
                      >
                        <div className="flex items-start space-x-3 sm:space-x-4 overflow-hidden w-full">
                          {/* Simulated Document / Commission emblem */}
                          <div className="w-10 h-14 sm:w-12 sm:h-16 bg-yellow-400 rounded-xl relative shrink-0 flex flex-col justify-between p-1.5 overflow-hidden group-hover:scale-105 transition-transform border border-yellow-500 select-none shadow-sm">
                            <div className="absolute top-0 left-0 w-full h-1 bg-blue-900" />
                            <div className="text-[5px] text-blue-900 font-black tracking-widest text-center mt-0.5 uppercase">
                              LEONES
                            </div>
                            {/* Seal background logo */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-900/5 text-2xl sm:text-3xl font-black select-none pointer-events-none">
                              L
                            </div>
                            <div className="text-center z-10">
                              <span className="block text-[5px] sm:text-[6px] font-black text-blue-900 leading-none">MINUTA</span>
                            </div>
                            <div className="flex justify-between items-center z-10 text-blue-900">
                              <span className="text-[5px] font-black">L</span>
                              <span className="text-[5px] text-blue-900/80 font-extrabold">{new Date(m.fechaHora).getFullYear()}</span>
                            </div>
                          </div>

                          <div className="space-y-1.5 overflow-hidden grow">
                            <div className="flex flex-wrap gap-1.5 items-center">
                              <span className="bg-blue-50 text-blue-800 text-[8px] sm:text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-blue-100">
                                {comm?.nombre || 'Comisión'}
                              </span>
                              {req && (
                                <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  req.estado === 'Aprobada' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  req.estado === 'Rechazada' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                                  'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                  Solicitud {req.estado}
                                </span>
                              )}
                            </div>
                            <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm leading-snug group-hover:text-blue-900 transition-colors break-words">
                              {m.tema}
                            </h4>
                            <div className="flex items-center space-x-2.5 sm:space-x-3 text-[9px] sm:text-[10px] font-bold text-slate-400">
                              <span className="flex items-center space-x-1">
                                <Calendar size={11} className="shrink-0" />
                                <span>{dateStr}</span>
                              </span>
                              <span>•</span>
                              <span className="flex items-center space-x-1">
                                <Clock size={11} className="shrink-0" />
                                <span>{timeStr}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between shrink-0 pt-2.5 sm:pt-3 border-t border-slate-100 w-full">
                          <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 flex items-center space-x-2.5 sm:space-x-3">
                            <span>Puntos: <strong className="text-slate-700 font-extrabold">{m.puntos.length}</strong></span>
                            <span className="text-slate-200">|</span>
                            <span>Asistencia: <strong className="text-slate-700 font-extrabold">{totalAttendees}</strong></span>
                          </div>
                          <span className="text-blue-600 font-black text-xs group-hover:translate-x-1 transition-transform flex items-center space-x-0.5">
                            <span>Ver Ficha</span>
                            <ChevronRight size={14} />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* PAGINATION CONTROLS */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100 w-full">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="w-full sm:w-auto px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:text-blue-900 hover:bg-slate-50 transition-all font-black text-xs cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
                  >
                    <ChevronRight size={14} className="rotate-180" />
                    <span>Anterior</span>
                  </button>

                  <div className="flex items-center space-x-1.5">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                          currentPage === page
                            ? 'bg-blue-900 text-yellow-400 border border-blue-950 shadow-md'
                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="w-full sm:w-auto px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:text-blue-900 hover:bg-slate-50 transition-all font-black text-xs cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
                  >
                    <span>Siguiente</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )/* MODAL FICHA DE SOCIO (Lectura) */}
      {selectedSocioForModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-300">
            {/* Header decorativo del modal */}
            <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white p-6 relative flex flex-col items-center text-center">
              <button
                onClick={() => setSelectedSocioForModal(null)}
                className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
              
              {/* Foto de Perfil */}
              <div className="relative mt-2 mb-3">
                <img
                  src={selectedSocioForModal.foto || `https://picsum.photos/seed/${selectedSocioForModal.nombre}/150/150`}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-xl"
                  alt={selectedSocioForModal.nombre}
                />
              </div>

              <h3 className="text-lg font-black tracking-wide leading-tight">{selectedSocioForModal.nombre}</h3>
              <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mt-1 block">
                {selectedSocioForModal.puesto || 'Socio Regular'}
              </span>
            </div>

            {/* Datos detallados */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-3.5 text-xs">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Correo Electrónico</span>
                  <span className="font-bold text-slate-700">{selectedSocioForModal.correo}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Teléfono / WhatsApp</span>
                  <span className="font-bold text-slate-700">{selectedSocioForModal.telefono || 'No especificado'}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Estado de Afiliación</span>
                  <span className={`inline-block font-black uppercase tracking-wider text-[9px] px-2 py-0.5 rounded mt-1 ${
                    selectedSocioForModal.activo 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                      : 'bg-rose-50 text-rose-700 border border-rose-100'
                  }`}>
                    {selectedSocioForModal.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
