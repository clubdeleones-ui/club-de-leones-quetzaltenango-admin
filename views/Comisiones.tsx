import React, { useState, useEffect, useMemo } from 'react';
import { firebaseService } from '../services/firebaseService';
import { useClubData } from '../context/ClubDataContext';
import { Comision, Socio, AsignacionComision, Acta, TipoComision, EstadoComision } from '../types';
import { 
  Briefcase, Plus, Search, Trash2, Users, CheckCircle, Save, DollarSign, FileText, 
  X as XIcon, Pencil, Calendar, Award, LayoutGrid, CheckCircle2, Clock, Sparkles, 
  Target, ChevronRight, ArrowLeft, Filter, Layers, Flag, TrendingUp, AlertCircle
} from 'lucide-react';
import { MOCK_ACTAS } from '../constants';
import { FormattedActa } from '../components/FormattedActa';
import { generateActaPDF } from '../utils/pdfGenerator';
import { Phone, Mail } from 'lucide-react';
import { useModal } from '../context/ModalContext';

const cleanString = (str: string) => 
  str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";

const isMatch = (val1: string, val2: string) => 
  cleanString(val1) === cleanString(val2);

export const Comisiones: React.FC = () => {
  const { showAlert, showConfirm } = useModal();
  const alert = (msg: string) => {
    showAlert("Notificación", msg);
  };

  // Load data from global ClubDataContext
  const { 
    comisiones: dbComisiones, 
    socios: dbSocios, 
    asignaciones: dbAsignaciones, 
    actas: dbActas 
  } = useClubData();

  const [comisiones, setComisiones] = useState<Comision[]>(dbComisiones);
  const [socios, setSocios] = useState<Socio[]>(dbSocios);
  const [asignaciones, setAsignaciones] = useState<AsignacionComision[]>(dbAsignaciones);
  const [actas, setActas] = useState<Acta[]>(dbActas);

  useEffect(() => { setComisiones(dbComisiones); }, [dbComisiones]);
  useEffect(() => { setSocios(dbSocios); }, [dbSocios]);
  useEffect(() => { setAsignaciones(dbAsignaciones); }, [dbAsignaciones]);
  useEffect(() => { setActas(dbActas); }, [dbActas]);
  
  // Modos de visualización: Galería (por defecto) o Ficha Técnica Detallada
  const [viewMode, setViewMode] = useState<'galeria' | 'detalle'>('galeria');
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'todos' | EstadoComision>('todos');
  const [filterTipo, setFilterTipo] = useState<'todos' | TipoComision>('todos');
  const [selectedComisionId, setSelectedComisionId] = useState<string>('');
  const [selectedSocioForModal, setSelectedSocioForModal] = useState<Socio | null>(null);
  const [selectedActaForModal, setSelectedActaForModal] = useState<Acta | null>(null);

  const { presidentName, secretaryName } = useMemo(() => {
    let pName = 'Edwin Ernesto Pacheco López';
    let sName = 'Flor Rodríguez Cifuentes';
    try {
      const local = localStorage.getItem('club_leones_socios_v3');
      if (local) {
        const sociosList = JSON.parse(local);
        const president = sociosList.find((s: any) => s.puesto?.toLowerCase().includes('presidente del club') || s.puesto?.toLowerCase() === 'presidente') || sociosList.find((s: any) => s.puesto?.toLowerCase().includes('presidente'));
        const secretary = sociosList.find((s: any) => s.puesto?.toLowerCase().includes('secretario del club') || s.puesto?.toLowerCase() === 'secretario') || sociosList.find((s: any) => s.puesto?.toLowerCase().includes('secretario'));
        if (president) pName = president.nombre;
        if (secretary) sName = secretary.nombre;
      }
    } catch (e) {}
    return { presidentName: pName, secretaryName: sName };
  }, []);
  
  const [form, setForm] = useState<Partial<Comision>>({
    nombre: '',
    proposito: '',
    miembros: [],
    coordinador: '',
    actasVinculadas: [],
    estado: 'Activa',
    tipo: 'permanente',
    progresoObjetivo: 0,
    fechaFin: ''
  });

  const [miembrosSearch, setMiembrosSearch] = useState('');
  const [actasSearch, setActasSearch] = useState('');

  // Auto-seleccionar primera comisión si no hay seleccionada
  useEffect(() => {
    if (comisiones.length > 0 && !selectedComisionId) {
      setSelectedComisionId(comisiones[0].id);
    }
  }, [comisiones, selectedComisionId]);

  const handleToggleMember = (id: string) => {
    const current = form.miembros || [];
    if (current.includes(id)) {
      setForm({ ...form, miembros: current.filter(m => m !== id) });
    } else {
      setForm({ ...form, miembros: [...current, id] });
    }
  };

  const handleToggleActa = (id: string) => {
    const current = form.actasVinculadas || [];
    if (current.includes(id)) {
      setForm({ ...form, actasVinculadas: current.filter(a => a !== id) });
    } else {
      setForm({ ...form, actasVinculadas: [...current, id] });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.proposito) return;

    const commissionId = form.id || `com-${Date.now()}`;
    const newComision: Comision = {
      id: commissionId,
      nombre: form.nombre,
      proposito: form.proposito,
      miembros: form.miembros || [],
      coordinador: form.coordinador || '',
      actasVinculadas: form.actasVinculadas || [],
      fechaCreacion: form.fechaCreacion || new Date().toISOString(),
      estado: (form.estado as EstadoComision) || 'Activa',
      tipo: (form.tipo as TipoComision) || 'permanente',
      progresoObjetivo: Number(form.progresoObjetivo ?? (form.estado === 'Concluida' ? 100 : 0)),
      fechaFin: form.fechaFin || ''
    };

    await firebaseService.saveComision(newComision);
    setSelectedComisionId(commissionId);
    setShowForm(false);
    setViewMode('detalle');
    setForm({ 
      nombre: '', 
      proposito: '', 
      miembros: [], 
      coordinador: '', 
      actasVinculadas: [], 
      estado: 'Activa',
      tipo: 'permanente',
      progresoObjetivo: 0,
      fechaFin: ''
    });
  };

  const handleDelete = async (id: string) => {
    if (await showConfirm("Eliminar Comisión", "¿Estás seguro de eliminar esta comisión permanentemente?", { type: 'danger', confirmText: 'Eliminar', cancelText: 'Cancelar' })) {
      await firebaseService.deleteComision(id);
      if (selectedComisionId === id) {
        const remaining = comisiones.filter(c => c.id !== id);
        setSelectedComisionId(remaining.length > 0 ? remaining[0].id : '');
      }
    }
  };

  // Filtros para Miembros
  const formMiembrosList = form.miembros || [];
  const selectedSocios = socios.filter(s => formMiembrosList.includes(s.id));
  const unselectedSocios = socios.filter(s => !formMiembrosList.includes(s.id));
  
  const filteredUnselectedSocios = useMemo(() => {
    if (!miembrosSearch) return unselectedSocios;
    return unselectedSocios.filter(s => s.nombre.toLowerCase().includes(miembrosSearch.toLowerCase()) || (s.apodo && s.apodo.toLowerCase().includes(miembrosSearch.toLowerCase())));
  }, [unselectedSocios, miembrosSearch]);

  // Filtros para Actas
  const formActasList = form.actasVinculadas || [];
  const selectedActas = actas.filter(a => formActasList.includes(a.id));
  const unselectedActas = actas.filter(a => !formActasList.includes(a.id));
  
  const filteredUnselectedActas = useMemo(() => {
    if (!actasSearch) return unselectedActas;
    return unselectedActas.filter(a => a.titulo.toLowerCase().includes(actasSearch.toLowerCase()) || a.codigoRegistro?.toLowerCase().includes(actasSearch.toLowerCase()));
  }, [unselectedActas, actasSearch]);

  const selectedComision = useMemo(() => {
    return comisiones.find(c => c.id === selectedComisionId);
  }, [comisiones, selectedComisionId]);

  const assignedBudget = useMemo(() => {
    if (!selectedComision) return 0;
    return asignaciones
      .filter(a => a.comision === selectedComision.id || isMatch(a.comision, selectedComision.nombre))
      .reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);
  }, [asignaciones, selectedComision]);

  const assignedMembers = useMemo(() => {
    if (!selectedComision) return [];
    return socios.filter(s => selectedComision.miembros.includes(s.id));
  }, [socios, selectedComision]);

  const linkedActas = useMemo(() => {
    if (!selectedComision) return [];
    return actas.filter(a => (selectedComision.actasVinculadas || []).includes(a.id));
  }, [actas, selectedComision]);

  // Helper para presupuesto de cualquier comisión
  const getComisionBudget = (c: Comision) => {
    return asignaciones
      .filter(a => a.comision === c.id || isMatch(a.comision, c.nombre))
      .reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);
  };

  // Métricas globales
  const metrics = useMemo(() => {
    const total = comisiones.length;
    const activas = comisiones.filter(c => c.estado === 'Activa').length;
    const concluidas = comisiones.filter(c => c.estado === 'Concluida').length;
    const inactivas = comisiones.filter(c => c.estado === 'Inactiva').length;
    const permanentes = comisiones.filter(c => (c.tipo || 'permanente') === 'permanente').length;
    const temporales = comisiones.filter(c => (c.tipo || 'permanente') === 'temporal').length;
    const proyectos = comisiones.filter(c => (c.tipo || 'permanente') === 'proyecto').length;
    return { total, activas, concluidas, inactivas, permanentes, temporales, proyectos };
  }, [comisiones]);

  // Filtrado de comisiones para la galería
  const filteredComisiones = useMemo(() => {
    return comisiones.filter(c => {
      // Filtro por Estado
      if (filterEstado !== 'todos' && c.estado !== filterEstado) {
        return false;
      }
      // Filtro por Tipo
      const cTipo = c.tipo || 'permanente';
      if (filterTipo !== 'todos' && cTipo !== filterTipo) {
        return false;
      }
      // Búsqueda por texto
      if (searchTerm.trim()) {
        const term = cleanString(searchTerm);
        const coordSocio = socios.find(s => s.id === c.coordinador);
        const coordName = coordSocio ? cleanString(coordSocio.nombre) : '';
        const inNombre = cleanString(c.nombre).includes(term);
        const inProposito = cleanString(c.proposito).includes(term);
        const inCoord = coordName.includes(term);
        if (!inNombre && !inProposito && !inCoord) {
          return false;
        }
      }
      return true;
    });
  }, [comisiones, filterEstado, filterTipo, searchTerm, socios]);

  const openEditForm = (c: Comision) => {
    setForm({
      ...c,
      tipo: c.tipo || 'permanente',
      estado: c.estado || 'Activa',
      progresoObjetivo: c.progresoObjetivo !== undefined ? c.progresoObjetivo : (c.estado === 'Concluida' ? 100 : 0),
      fechaFin: c.fechaFin || ''
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-12">
      {/* Header Superior con Switcher de Vistas y Botón de Creación */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white/80 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <span className="p-2.5 bg-blue-50 text-blue-700 rounded-2xl">
              <Briefcase size={24} />
            </span>
            <h2 className="text-3xl font-black text-blue-950 tracking-tight">Gestión de Comisiones</h2>
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
            Secretaría • Equipos de Trabajo, Proyectos y Comisiones Permanentes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {!showForm && (
            <>
              {/* Toggle de Modo: Galería vs Ficha Detalle */}
              <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setViewMode('galeria')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    viewMode === 'galeria'
                      ? 'bg-white text-blue-900 shadow-sm shadow-blue-900/10'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid size={16} />
                  <span>Galería ({filteredComisiones.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedComisionId && comisiones.length > 0) {
                      setSelectedComisionId(comisiones[0].id);
                    }
                    setViewMode('detalle');
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    viewMode === 'detalle'
                      ? 'bg-white text-blue-900 shadow-sm shadow-blue-900/10'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <FileText size={16} />
                  <span>Ficha Detallada</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setForm({
                    nombre: '',
                    proposito: '',
                    miembros: [],
                    coordinador: '',
                    actasVinculadas: [],
                    estado: 'Activa',
                    tipo: 'permanente',
                    progresoObjetivo: 0,
                    fechaFin: ''
                  });
                  setShowForm(true);
                }}
                className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white px-5 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-blue-600/25 transition-all flex items-center space-x-2 cursor-pointer ml-auto md:ml-0"
              >
                <Plus size={16} />
                <span>Nueva Comisión</span>
              </button>
            </>
          )}
        </div>
      </div>

      {showForm ? (
        <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 border border-slate-200 shadow-xl relative animate-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-8">
            <div className="flex items-center space-x-3">
              <span className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                {form.id ? <Pencil size={22} /> : <Plus size={22} />}
              </span>
              <div>
                <h3 className="text-2xl font-black text-slate-900">{form.id ? 'Editar Comisión' : 'Crear Nueva Comisión'}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completa los datos técnicos y objetivos del equipo</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-colors cursor-pointer"
            >
              <XIcon size={18} />
            </button>
          </div>
          
          <form onSubmit={handleSave} className="space-y-10">
            {/* Datos Generales */}
            <div className="space-y-6">
              <h4 className="font-extrabold text-blue-900 border-b border-slate-100 pb-2 text-base flex items-center space-x-2">
                <span>1. Clasificación y Datos Generales</span>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Nombre de la Comisión</label>
                  <input
                    type="text"
                    required
                    value={form.nombre}
                    onChange={(e) => setForm({...form, nombre: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                    placeholder="Ej. Comisión de Salud y Visión / Comité de Convención 2026"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Tipo de Comisión</label>
                  <select
                    value={form.tipo || 'permanente'}
                    onChange={(e) => setForm({...form, tipo: e.target.value as TipoComision})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="permanente">🏛️ Comisión Permanente</option>
                    <option value="temporal">⏳ Comisión Temporal</option>
                    <option value="proyecto">🚀 Por Proyecto Específico</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Estado de la Comisión</label>
                  <select
                    value={form.estado || 'Activa'}
                    onChange={(e) => {
                      const newEstado = e.target.value as EstadoComision;
                      setForm({
                        ...form, 
                        estado: newEstado,
                        progresoObjetivo: newEstado === 'Concluida' ? 100 : (form.progresoObjetivo || 0)
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="Activa">🟢 Activa / En Marcha</option>
                    <option value="Concluida">🏁 Concluida (Cumplió Objetivos)</option>
                    <option value="Inactiva">⏸️ Inactiva / En Pausa</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center ml-1 mb-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Cumplimiento de Objetivos</label>
                    <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">{form.progresoObjetivo || 0}%</span>
                  </div>
                  <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={form.progresoObjetivo || 0}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setForm({
                          ...form, 
                          progresoObjetivo: val,
                          estado: val === 100 ? 'Concluida' : (form.estado === 'Concluida' ? 'Activa' : form.estado)
                        });
                      }}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Fecha Límite / Cierre Previsto (Opcional)</label>
                  <input
                    type="date"
                    value={form.fechaFin || ''}
                    onChange={(e) => setForm({...form, fechaFin: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Propósito / Objetivos y Metas</label>
                <textarea
                  required
                  rows={3}
                  value={form.proposito}
                  onChange={(e) => setForm({...form, proposito: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none"
                  placeholder="Describe claramente los objetivos y propósitos de esta comisión..."
                ></textarea>
              </div>
            </div>

            {/* Asignación de Miembros */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-blue-900 border-b border-slate-100 pb-2">2. Asignación de Miembros</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Columna Izquierda: Buscar */}
                <div className="space-y-4">
                  <h5 className="font-extrabold text-slate-700 text-sm flex items-center justify-between">
                    <span>Buscar y Agregar Miembros</span>
                    <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                      {filteredUnselectedSocios.length} Disponibles
                    </span>
                  </h5>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={miembrosSearch}
                      onChange={e => setMiembrosSearch(e.target.value)}
                      placeholder="Buscar por nombre..."
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-800 shadow-sm"
                    />
                  </div>
                  <div className="bg-white border border-slate-200/80 rounded-2xl max-h-[300px] overflow-y-auto divide-y divide-slate-100 shadow-sm">
                    {filteredUnselectedSocios.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs italic font-medium">No se encontraron miembros coincidentes.</div>
                    ) : (
                      filteredUnselectedSocios.map(member => (
                        <div 
                          key={member.id} 
                          onClick={() => handleToggleMember(member.id)}
                          className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                              <Users size={14} />
                            </div>
                            <div>
                              <p className="text-sm font-extrabold text-slate-700 group-hover:text-blue-600 transition-colors leading-tight">{member.nombre}</p>
                              {member.puesto && <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mt-0.5">{member.puesto}</p>}
                            </div>
                          </div>
                          <button type="button" className="bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 p-2 rounded-xl transition-all">
                            <Plus size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Columna Derecha: Seleccionados */}
                <div className="space-y-4">
                  <h5 className="font-extrabold text-slate-700 text-sm flex items-center justify-between">
                    <span>Miembros en la Comisión</span>
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                      {selectedSocios.length} Marcados
                    </span>
                  </h5>
                  <div className="bg-white border border-slate-200/80 rounded-2xl max-h-[360px] overflow-y-auto divide-y divide-slate-100 shadow-sm">
                    {selectedSocios.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 text-sm italic font-medium">Aún no has agregado miembros a esta comisión.</div>
                    ) : (
                      selectedSocios.map((member, index) => {
                        const isFormCoord = form.coordinador === member.id;
                        return (
                          <div key={member.id} className={`p-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors ${isFormCoord ? 'bg-amber-50/40 border-l-4 border-amber-400' : ''}`}>
                            <div className="flex items-center space-x-3 overflow-hidden">
                              <span className="text-[10px] font-black text-slate-400 w-5 text-right shrink-0">{index + 1}.</span>
                              <div className="overflow-hidden">
                                <div className="flex items-center space-x-2">
                                  <p className="text-sm font-extrabold text-slate-800 leading-tight truncate">{member.nombre}</p>
                                  {isFormCoord && (
                                    <span className="inline-flex items-center space-x-0.5 text-[8px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                                      <Award size={8} className="mr-0.5" />
                                      Coord.
                                    </span>
                                  )}
                                </div>
                                {member.puesto && <p className="text-[10px] font-black text-blue-600 uppercase tracking-wide mt-0.5 truncate">{member.puesto}</p>}
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setForm({ ...form, coordinador: isFormCoord ? '' : member.id })}
                                className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all border cursor-pointer ${
                                  isFormCoord 
                                    ? 'bg-amber-100 border-amber-200 text-amber-800 hover:bg-amber-200/60' 
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'
                                }`}
                              >
                                {isFormCoord ? 'Quitar Cargo' : 'Nombrar Coordinador'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleToggleMember(member.id);
                                  if (isFormCoord) {
                                    setForm({ ...form, coordinador: '' });
                                  }
                                }}
                                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all cursor-pointer"
                                title="Remover miembro"
                              >
                                <XIcon size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Vinculación de Actas */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-blue-900 border-b border-slate-100 pb-2">3. Vincular Actas de Sesión (Opcional)</h4>
              <p className="text-xs text-slate-500 font-medium">Vincula actas donde se haya discutido la creación o presupuesto de esta comisión.</p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Columna Izquierda: Buscar Actas */}
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={actasSearch}
                      onChange={e => setActasSearch(e.target.value)}
                      placeholder="Buscar acta por título..."
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-800 shadow-sm"
                    />
                  </div>
                  <div className="bg-white border border-slate-200/80 rounded-2xl max-h-[250px] overflow-y-auto divide-y divide-slate-100 shadow-sm">
                    {filteredUnselectedActas.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs italic font-medium">No se encontraron actas coincidentes.</div>
                    ) : (
                      filteredUnselectedActas.map(acta => (
                        <div 
                          key={acta.id} 
                          onClick={() => handleToggleActa(acta.id)}
                          className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                              <FileText size={14} />
                            </div>
                            <div>
                              <p className="text-sm font-extrabold text-slate-700 group-hover:text-blue-600 transition-colors leading-tight line-clamp-1">{acta.titulo}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mt-0.5">{acta.fecha}</p>
                            </div>
                          </div>
                          <button type="button" className="bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 p-2 rounded-xl transition-all shrink-0">
                            <Plus size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Columna Derecha: Actas Seleccionadas */}
                <div className="space-y-4">
                  <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 h-full min-h-[150px]">
                    <h5 className="font-extrabold text-slate-700 text-sm mb-4">Actas Vinculadas ({selectedActas.length})</h5>
                    <div className="flex flex-col gap-2">
                      {selectedActas.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">No hay actas vinculadas a esta comisión.</span>
                      ) : (
                        selectedActas.map(acta => (
                          <div key={acta.id} className="flex items-center justify-between bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm">
                            <div className="flex items-center space-x-2 overflow-hidden">
                              <FileText size={14} className="text-blue-600 shrink-0" />
                              <span className="text-xs font-bold text-slate-700 truncate">{acta.titulo}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleActa(acta.id)}
                              className="text-slate-400 hover:text-red-500 p-1 ml-2 transition-colors shrink-0"
                            >
                              <XIcon size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex space-x-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl text-sm shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center space-x-2"
              >
                <Save size={18} />
                <span>Guardar Comisión</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Métricas y Estadísticas Globales */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Total Comisiones */}
            <div 
              onClick={() => { setFilterEstado('todos'); setFilterTipo('todos'); }}
              className={`p-5 sm:p-6 rounded-[2rem] border transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-lg ${
                filterEstado === 'todos' && filterTipo === 'todos'
                  ? 'bg-gradient-to-br from-blue-900 to-slate-900 text-white border-blue-950 shadow-md shadow-blue-950/20' 
                  : 'bg-white border-slate-200/80 text-slate-800 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-black uppercase tracking-widest ${filterEstado === 'todos' && filterTipo === 'todos' ? 'text-blue-200' : 'text-slate-400'}`}>
                  Total Equipos
                </span>
                <span className={`p-2 rounded-xl ${filterEstado === 'todos' && filterTipo === 'todos' ? 'bg-white/10 text-white' : 'bg-blue-50 text-blue-600'}`}>
                  <Briefcase size={18} />
                </span>
              </div>
              <div className="text-3xl font-black tracking-tight">{metrics.total}</div>
              <p className={`text-[11px] font-bold mt-1 ${filterEstado === 'todos' && filterTipo === 'todos' ? 'text-blue-200' : 'text-slate-400'}`}>
                {metrics.permanentes} permanentes • {metrics.proyectos + metrics.temporales} temp/proy
              </p>
            </div>

            {/* Activas */}
            <div 
              onClick={() => { setFilterEstado('Activa'); }}
              className={`p-5 sm:p-6 rounded-[2rem] border transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-lg ${
                filterEstado === 'Activa'
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-800 shadow-md shadow-emerald-700/20' 
                  : 'bg-white border-slate-200/80 text-slate-800 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-black uppercase tracking-widest ${filterEstado === 'Activa' ? 'text-emerald-100' : 'text-slate-400'}`}>
                  En Marcha
                </span>
                <span className={`p-2 rounded-xl ${filterEstado === 'Activa' ? 'bg-white/10 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                  <TrendingUp size={18} />
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black tracking-tight text-emerald-600 group-hover:text-emerald-700 [div.bg-gradient-to-br_&]:text-white">
                  {metrics.activas}
                </span>
                <span className={`text-xs font-black uppercase ${filterEstado === 'Activa' ? 'text-emerald-100' : 'text-slate-400'}`}>
                  Activas
                </span>
              </div>
              <p className={`text-[11px] font-bold mt-1 ${filterEstado === 'Activa' ? 'text-emerald-100' : 'text-slate-400'}`}>
                Con proyectos y tareas activas
              </p>
            </div>

            {/* Concluidas / Objetivos Cumplidos */}
            <div 
              onClick={() => { setFilterEstado('Concluida'); }}
              className={`p-5 sm:p-6 rounded-[2rem] border transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-lg ${
                filterEstado === 'Concluida'
                  ? 'bg-gradient-to-br from-blue-700 to-indigo-800 text-white border-indigo-900 shadow-md shadow-indigo-700/20' 
                  : 'bg-white border-slate-200/80 text-slate-800 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-black uppercase tracking-widest ${filterEstado === 'Concluida' ? 'text-indigo-100' : 'text-slate-400'}`}>
                  Cumplieron Meta
                </span>
                <span className={`p-2 rounded-xl ${filterEstado === 'Concluida' ? 'bg-white/10 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                  <CheckCircle2 size={18} />
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black tracking-tight text-indigo-600 group-hover:text-indigo-700 [div.bg-gradient-to-br_&]:text-white">
                  {metrics.concluidas}
                </span>
                <span className={`text-xs font-black uppercase ${filterEstado === 'Concluida' ? 'text-indigo-100' : 'text-slate-400'}`}>
                  Concluidas
                </span>
              </div>
              <p className={`text-[11px] font-bold mt-1 ${filterEstado === 'Concluida' ? 'text-indigo-100' : 'text-slate-400'}`}>
                Objetivos 100% finalizados
              </p>
            </div>

            {/* Por Proyecto / Temporales */}
            <div 
              onClick={() => { setFilterTipo(filterTipo === 'proyecto' ? 'todos' : 'proyecto'); }}
              className={`p-5 sm:p-6 rounded-[2rem] border transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-lg ${
                filterTipo === 'proyecto'
                  ? 'bg-gradient-to-br from-purple-700 to-violet-900 text-white border-purple-900 shadow-md shadow-purple-700/20' 
                  : 'bg-white border-slate-200/80 text-slate-800 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-black uppercase tracking-widest ${filterTipo === 'proyecto' ? 'text-purple-100' : 'text-slate-400'}`}>
                  Por Proyecto
                </span>
                <span className={`p-2 rounded-xl ${filterTipo === 'proyecto' ? 'bg-white/10 text-white' : 'bg-purple-50 text-purple-600'}`}>
                  <Target size={18} />
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black tracking-tight text-purple-700 group-hover:text-purple-800 [div.bg-gradient-to-br_&]:text-white">
                  {metrics.proyectos}
                </span>
                <span className={`text-xs font-black uppercase ${filterTipo === 'proyecto' ? 'text-purple-100' : 'text-slate-400'}`}>
                  Proyectos
                </span>
              </div>
              <p className={`text-[11px] font-bold mt-1 ${filterTipo === 'proyecto' ? 'text-purple-100' : 'text-slate-400'}`}>
                + {metrics.temporales} temporales asignadas
              </p>
            </div>
          </div>

          {/* VISTA 1: MODO GALERÍA */}
          {viewMode === 'galeria' ? (
            <div className="space-y-6">
              {/* Barra de Búsqueda y Filtros Rápidos */}
              <div className="bg-white border border-slate-200/80 rounded-[2.2rem] p-5 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                  {/* Buscador */}
                  <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por nombre, coordinador o propósito..."
                      className="w-full pl-12 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold text-slate-800 placeholder-slate-400"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        <XIcon size={14} />
                      </button>
                    )}
                  </div>

                  {/* Filtro por Estado */}
                  <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
                      Estado:
                    </span>
                    {(['todos', 'Activa', 'Concluida', 'Inactiva'] as const).map((st) => {
                      const isActive = filterEstado === st;
                      const label = st === 'todos' ? 'Todas' : st === 'Activa' ? '🟢 Activas' : st === 'Concluida' ? '🏁 Concluidas' : '⏸️ Inactivas';
                      return (
                        <button
                          key={st}
                          onClick={() => setFilterEstado(st)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                            isActive
                              ? 'bg-blue-900 text-white shadow-sm'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filtro por Tipo */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">
                    Tipo de Comisión:
                  </span>
                  {(['todos', 'permanente', 'temporal', 'proyecto'] as const).map((tp) => {
                    const isActive = filterTipo === tp;
                    const label = tp === 'todos' ? 'Todos los tipos' : tp === 'permanente' ? '🏛️ Permanentes' : tp === 'temporal' ? '⏳ Temporales' : '🚀 Por Proyecto';
                    return (
                      <button
                        key={tp}
                        onClick={() => setFilterTipo(tp)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer whitespace-nowrap ${
                          isActive
                            ? 'bg-slate-800 text-white shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-600'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}

                  {(filterEstado !== 'todos' || filterTipo !== 'todos' || searchTerm) && (
                    <button
                      onClick={() => {
                        setFilterEstado('todos');
                        setFilterTipo('todos');
                        setSearchTerm('');
                      }}
                      className="ml-auto text-[11px] font-black text-blue-600 hover:text-blue-800 underline cursor-pointer whitespace-nowrap"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              </div>

              {/* Grid de Comisiones */}
              {filteredComisiones.length === 0 ? (
                <div className="py-20 bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center p-8">
                  <Briefcase className="mx-auto text-slate-300 mb-4" size={54} />
                  <h3 className="text-xl font-black text-slate-700">No se encontraron comisiones</h3>
                  <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                    No hay comisiones que coincidan con los filtros aplicados o con el término de búsqueda.
                  </p>
                  <div className="mt-6 flex justify-center gap-3">
                    <button
                      onClick={() => {
                        setFilterEstado('todos');
                        setFilterTipo('todos');
                        setSearchTerm('');
                      }}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all cursor-pointer"
                    >
                      Restablecer filtros
                    </button>
                    <button
                      onClick={() => {
                        setForm({
                          nombre: '',
                          proposito: '',
                          miembros: [],
                          coordinador: '',
                          actasVinculadas: [],
                          estado: 'Activa',
                          tipo: 'permanente',
                          progresoObjetivo: 0,
                          fechaFin: ''
                        });
                        setShowForm(true);
                      }}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
                    >
                      Crear Nueva Comisión
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredComisiones.map((com) => {
                    const comBudget = getComisionBudget(com);
                    const coordSocio = socios.find(s => s.id === com.coordinador);
                    const memberSocios = socios.filter(s => com.miembros.includes(s.id));
                    const isConcluida = com.estado === 'Concluida';
                    const isActiva = com.estado === 'Activa';
                    const comTipo = com.tipo || 'permanente';
                    const progreso = isConcluida ? 100 : (com.progresoObjetivo || 0);

                    return (
                      <div
                        key={com.id}
                        className="bg-white rounded-[2.2rem] border border-slate-200/90 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden group relative"
                      >
                        {/* Barra decorativa de color superior según estado */}
                        <div 
                          className={`h-2.5 w-full ${
                            isConcluida
                              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600'
                              : isActiva
                              ? 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500'
                              : 'bg-slate-300'
                          }`} 
                        />

                        {/* Contenido Principal de la Tarjeta */}
                        <div className="p-6 sm:p-7 space-y-5">
                          {/* Badges de Tipo y Estado */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            {/* Badge de Tipo */}
                            <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              comTipo === 'permanente'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200/70'
                                : comTipo === 'proyecto'
                                ? 'bg-purple-50 text-purple-800 border border-purple-200/70'
                                : 'bg-amber-50 text-amber-800 border border-amber-200/70'
                            }`}>
                              {comTipo === 'permanente' && <Layers size={11} />}
                              {comTipo === 'proyecto' && <Target size={11} />}
                              {comTipo === 'temporal' && <Clock size={11} />}
                              <span>
                                {comTipo === 'permanente' ? 'Permanente' : comTipo === 'proyecto' ? 'Por Proyecto' : 'Temporal'}
                              </span>
                            </span>

                            {/* Badge de Estado */}
                            <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isConcluida
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80'
                                : isActiva
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {isConcluida ? (
                                <CheckCircle2 size={12} className="text-indigo-600" />
                              ) : isActiva ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              )}
                              <span>
                                {isConcluida ? 'Cumplió Objetivos' : isActiva ? 'En Marcha' : 'En Pausa'}
                              </span>
                            </span>
                          </div>

                          {/* Nombre de la Comisión */}
                          <div>
                            <h4 
                              onClick={() => {
                                setSelectedComisionId(com.id);
                                setViewMode('detalle');
                              }}
                              className="text-xl font-black text-slate-900 group-hover:text-blue-900 transition-colors leading-snug cursor-pointer line-clamp-2"
                              title={com.nombre}
                            >
                              {com.nombre}
                            </h4>
                            {com.fechaFin && (
                              <p className="text-[10px] font-bold text-slate-400 flex items-center space-x-1 mt-1">
                                <Calendar size={11} />
                                <span>Cierre previsto: {new Date(com.fechaFin).toLocaleDateString()}</span>
                              </p>
                            )}
                          </div>

                          {/* Propósito / Objetivos (Clamp) */}
                          <p className="text-xs font-medium text-slate-600 line-clamp-3 leading-relaxed italic bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                            "{com.proposito}"
                          </p>

                          {/* Barra de Progreso del Objetivo */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                              <span className={isConcluida ? 'text-indigo-700' : 'text-slate-500'}>
                                {isConcluida ? 'Objetivo Cumplido 🎉' : 'Cumplimiento de Metas'}
                              </span>
                              <span className={isConcluida ? 'text-indigo-700 font-extrabold' : 'text-blue-700'}>
                                {progreso}%
                              </span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                              <div 
                                className={`h-full rounded-full transition-all duration-700 ${
                                  isConcluida
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                                    : progreso >= 70
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                    : progreso >= 30
                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                                    : 'bg-gradient-to-r from-amber-400 to-orange-400'
                                }`}
                                style={{ width: `${Math.min(Math.max(progreso, 4), 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Coordinador Asignado */}
                          <div className="pt-1">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                              Liderazgo / Coordinador
                            </span>
                            {coordSocio ? (
                              <button
                                type="button"
                                onClick={() => setSelectedSocioForModal(coordSocio)}
                                className="w-full flex items-center space-x-2.5 p-2 bg-amber-50/50 hover:bg-amber-100/60 border border-amber-200/70 rounded-xl transition-all text-left cursor-pointer group/coord"
                              >
                                <img
                                  src={coordSocio.foto || `https://picsum.photos/seed/${coordSocio.nombre}/100/100`}
                                  alt={coordSocio.nombre}
                                  className="w-8 h-8 rounded-full object-cover border-2 border-white ring-1 ring-amber-300 shrink-0"
                                />
                                <div className="overflow-hidden">
                                  <p className="text-xs font-black text-slate-800 group-hover/coord:text-amber-900 transition-colors truncate">
                                    {coordSocio.nombre}
                                  </p>
                                  <p className="text-[9px] font-black text-amber-700 uppercase tracking-wider">
                                    Coordinador Oficial
                                  </p>
                                </div>
                              </button>
                            ) : (
                              <div className="p-2 text-center text-xs font-medium text-slate-400 bg-slate-50 rounded-xl border border-slate-100 italic">
                                Sin coordinador designado
                              </div>
                            )}
                          </div>

                          {/* Miembros Stack */}
                          <div>
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                Integrantes ({memberSocios.length})
                              </span>
                            </div>
                            {memberSocios.length > 0 ? (
                              <div className="flex items-center space-x-1.5">
                                <div className="flex -space-x-2 overflow-hidden py-1">
                                  {memberSocios.slice(0, 5).map((m) => (
                                    <img
                                      key={m.id}
                                      src={m.foto || `https://picsum.photos/seed/${m.nombre}/100/100`}
                                      alt={m.nombre}
                                      title={m.nombre}
                                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover cursor-pointer hover:scale-110 transition-transform"
                                      onClick={() => setSelectedSocioForModal(m)}
                                    />
                                  ))}
                                </div>
                                {memberSocios.length > 5 && (
                                  <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">
                                    +{memberSocios.length - 5}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Sin miembros registrados</span>
                            )}
                          </div>

                          {/* Presupuesto y Actas en Pills */}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                            <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-100/60">
                              <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 block">
                                Presupuesto
                              </span>
                              <span className="text-sm font-black text-blue-900 block mt-0.5">
                                Q{comBudget.toLocaleString('es-GT', { maximumFractionDigits: 0 })}
                              </span>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">
                                Actas de Sesión
                              </span>
                              <span className="text-sm font-black text-slate-800 block mt-0.5">
                                {(com.actasVinculadas || []).length} vinculadas
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Botones de Acción al pie de la tarjeta */}
                        <div className="p-4 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedComisionId(com.id);
                              setViewMode('detalle');
                            }}
                            className="flex-1 py-2.5 px-4 bg-white hover:bg-blue-600 hover:text-white border border-slate-200 hover:border-blue-600 text-blue-900 font-black rounded-xl text-xs transition-all shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer group/btn"
                          >
                            <span>Ver Ficha Completa</span>
                            <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditForm(com)}
                            className="p-2.5 bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 rounded-xl transition-all cursor-pointer"
                            title="Editar comisión"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(com.id)}
                            className="p-2.5 bg-white hover:bg-red-50 text-slate-500 hover:text-red-500 border border-slate-200 rounded-xl transition-all cursor-pointer"
                            title="Eliminar comisión"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* VISTA 2: MODO FICHA TÉCNICA DETALLADA */
            <div className="space-y-6">
              {/* Barra superior de navegación en modo detalle */}
              <div className="bg-white border border-slate-200/80 rounded-[2rem] p-5 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <button
                  type="button"
                  onClick={() => setViewMode('galeria')}
                  className="flex items-center space-x-2 text-xs font-black text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100/70 px-4 py-2.5 rounded-xl transition-all cursor-pointer w-full md:w-auto"
                >
                  <ArrowLeft size={16} />
                  <span>Volver a la Galería</span>
                </button>

                <div className="flex-1 w-full max-w-xl">
                  <select
                    value={selectedComisionId}
                    onChange={(e) => setSelectedComisionId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-black text-slate-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="">-- Elige una comisión para ver detalles --</option>
                    {comisiones.map(c => {
                      const cTipo = c.tipo || 'permanente';
                      const tipoIcon = cTipo === 'permanente' ? '🏛️' : cTipo === 'proyecto' ? '🚀' : '⏳';
                      return (
                        <option key={c.id} value={c.id}>
                          {tipoIcon} {c.nombre} ({c.estado})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Full Width Ficha details */}
              {selectedComision ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  {/* Left Column: Info & Actions (5 columns) */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 shadow-sm relative overflow-hidden">
                      <div 
                        className={`absolute top-0 left-0 right-0 h-2.5 ${
                          selectedComision.estado === 'Concluida'
                            ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600'
                            : selectedComision.estado === 'Activa'
                            ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                            : 'bg-slate-300'
                        }`} 
                      />

                      <div className="flex flex-col items-center text-center mb-6 pt-2">
                        <div 
                          className={`p-4 rounded-2xl shrink-0 mb-4 ${
                            selectedComision.estado === 'Concluida'
                              ? 'bg-indigo-50 text-indigo-600'
                              : selectedComision.estado === 'Activa'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Briefcase size={28} />
                        </div>
                        <div className="w-full">
                          <h3 className="font-black text-slate-900 text-2xl leading-tight px-4">{selectedComision.nombre}</h3>
                          
                          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                            {/* Tipo */}
                            <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              (selectedComision.tipo || 'permanente') === 'permanente'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                                : (selectedComision.tipo || 'permanente') === 'proyecto'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                                : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            }`}>
                              {(selectedComision.tipo || 'permanente') === 'permanente' && <Layers size={10} />}
                              {(selectedComision.tipo || 'permanente') === 'proyecto' && <Target size={10} />}
                              {(selectedComision.tipo || 'permanente') === 'temporal' && <Clock size={10} />}
                              <span>
                                {(selectedComision.tipo || 'permanente') === 'permanente' 
                                  ? 'Comisión Permanente' 
                                  : (selectedComision.tipo || 'permanente') === 'proyecto' 
                                  ? 'Por Proyecto' 
                                  : 'Temporal'}
                              </span>
                            </span>

                            {/* Estado */}
                            <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              selectedComision.estado === 'Concluida'
                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                : selectedComision.estado === 'Activa'
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-200 text-slate-650'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                selectedComision.estado === 'Concluida'
                                  ? 'bg-indigo-600'
                                  : selectedComision.estado === 'Activa'
                                  ? 'bg-emerald-500'
                                  : 'bg-slate-400'
                              }`} />
                              <span>{selectedComision.estado === 'Concluida' ? 'Cumplió Objetivos' : selectedComision.estado}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {/* Cumplimiento de Objetivos */}
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                          <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider">
                            <span className="text-slate-500">Progreso del Objetivo</span>
                            <span className="text-blue-700 font-extrabold">
                              {selectedComision.estado === 'Concluida' ? 100 : (selectedComision.progresoObjetivo || 0)}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-700 ${
                                selectedComision.estado === 'Concluida'
                                  ? 'bg-indigo-600'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(Math.max(selectedComision.estado === 'Concluida' ? 100 : (selectedComision.progresoObjetivo || 0), 4), 100)}%` }}
                            />
                          </div>
                          {selectedComision.fechaFin && (
                            <p className="text-[10px] font-bold text-slate-400 pt-1">
                              Fecha límite / Cierre previsto: {new Date(selectedComision.fechaFin).toLocaleDateString()}
                            </p>
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Propósito y Objetivos</span>
                          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-semibold text-slate-650 leading-relaxed italic">
                            "{selectedComision.proposito}"
                          </div>
                        </div>

                        {/* Coordinador de la Comisión */}
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Coordinador de la Comisión</span>
                          {selectedComision.coordinador ? (() => {
                            const coord = socios.find(s => s.id === selectedComision.coordinador);
                            if (!coord) return <span className="text-xs text-slate-450 italic bg-slate-50 p-3 rounded-2xl border border-slate-200/60 block">Coordinador no encontrado</span>;
                            return (
                              <button
                                onClick={() => setSelectedSocioForModal(coord)}
                                className="w-full flex items-center space-x-3 p-3 bg-amber-50/50 hover:bg-amber-50 border border-amber-200/60 rounded-2xl hover:shadow-sm transition-all text-left cursor-pointer group"
                              >
                                <img
                                  src={coord.foto || `https://picsum.photos/seed/${coord.nombre}/100/100`}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-white ring-1 ring-amber-300 shrink-0"
                                  alt={coord.nombre}
                                />
                                <div className="overflow-hidden">
                                  <span className="text-xs font-black text-slate-800 group-hover:text-blue-600 transition-colors block truncate">{coord.nombre}</span>
                                  <span className="text-[9px] font-black text-amber-700 uppercase tracking-wider block mt-0.5">Coordinador Oficial</span>
                                </div>
                              </button>
                            );
                          })() : (
                            <div className="p-3 text-center text-xs text-slate-450 bg-slate-50 rounded-2xl border border-slate-200/60 italic">
                              Sin coordinador asignado.
                            </div>
                          )}
                        </div>

                        {/* Presupuesto Detallado */}
                        <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/30 border border-blue-100 p-5 rounded-2xl shadow-sm">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center space-x-2 text-blue-900">
                              <DollarSign size={18} className="text-blue-500" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Presupuesto Asignado</span>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total</span>
                          </div>
                          <div className="text-3xl font-black text-blue-800">
                            Q{assignedBudget.toLocaleString('es-GT', {minimumFractionDigits: 2})}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs font-bold text-slate-450 border-t border-slate-100 pt-4">
                          <span>Creación: {new Date(selectedComision.fechaCreacion).toLocaleDateString()}</span>
                          <span>ID: {selectedComision.id}</span>
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <button
                            onClick={() => openEditForm(selectedComision)}
                            className="py-3 px-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 text-slate-600 hover:text-blue-600 font-extrabold rounded-xl text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
                          >
                            <Pencil size={15} />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleDelete(selectedComision.id)}
                            className="py-3 px-4 bg-slate-50 hover:bg-red-50 border border-slate-200 text-slate-600 hover:text-red-500 font-extrabold rounded-xl text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
                          >
                            <Trash2 size={15} />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Members & Actas (7 columns) */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Members list */}
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                            <Users size={20} />
                          </div>
                          <div>
                            <h4 className="font-black text-slate-800 text-lg">Miembros de la Comisión</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{assignedMembers.length} integrantes activos</p>
                          </div>
                        </div>
                      </div>

                      {assignedMembers.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200/60 font-medium">
                          No hay miembros asignados a esta comisión todavía. Puedes agregarlos haciendo clic en Editar.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {assignedMembers.map(m => {
                            const isCoord = m.id === selectedComision.coordinador;
                            return (
                              <button
                                key={m.id}
                                onClick={() => setSelectedSocioForModal(m)}
                                className={`flex items-center text-left space-x-4 p-4 rounded-2xl hover:bg-white hover:shadow-md transition-all w-full cursor-pointer group ${
                                  isCoord ? 'bg-amber-50/30 border-amber-200/60' : 'bg-slate-50/70 border-slate-200/60'
                                }`}
                              >
                                <div className="relative shrink-0">
                                  <img
                                    src={m.foto || `https://picsum.photos/seed/${m.nombre}/100/100`}
                                    className={`w-12 h-12 rounded-full object-cover border-2 border-white shrink-0 ${
                                      isCoord ? 'ring-2 ring-amber-400' : 'ring-1 ring-slate-200'
                                    }`}
                                    alt={m.nombre}
                                  />
                                  {isCoord && (
                                    <div className="absolute -bottom-1.5 -right-1 bg-amber-400 text-amber-950 p-0.5 rounded-full border border-white shadow-sm flex items-center justify-center">
                                      <Award size={10} />
                                    </div>
                                  )}
                                </div>
                                <div className="overflow-hidden">
                                  <p className="text-sm font-black text-slate-850 group-hover:text-blue-600 transition-colors truncate">{m.nombre}</p>
                                  <p className="text-[10px] font-black text-blue-650 uppercase tracking-wide truncate mt-0.5">
                                    {isCoord ? 'Coordinador • ' : ''}{m.puesto || 'Socio'}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Linked Actas list */}
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 shadow-sm">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                          <FileText size={20} />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800 text-lg">Actas Relacionadas</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{linkedActas.length} actas vinculadas</p>
                        </div>
                      </div>

                      {linkedActas.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200/60 font-medium">
                          No hay actas vinculadas a esta comisión.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {linkedActas.map(acta => (
                            <button
                              key={acta.id}
                              onClick={() => setSelectedActaForModal(acta)}
                              className="flex items-center justify-between p-4 bg-slate-50/70 hover:bg-white border border-slate-200/80 rounded-2xl hover:shadow-sm transition-all group w-full text-left cursor-pointer"
                            >
                              <div className="flex items-center space-x-3 overflow-hidden">
                                <FileText size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                                <div className="overflow-hidden">
                                  <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors truncate block">{acta.titulo}</span>
                                  <span className="text-[10px] font-bold text-slate-400 block mt-0.5">Fecha de Sesión: {acta.fecha}</span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center">
                  <Briefcase className="mx-auto text-slate-300 mb-4" size={56} />
                  <h3 className="text-xl font-black text-slate-500">Ninguna Comisión Seleccionada</h3>
                  <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">Selecciona una comisión del menú desplegable o regresa a la galería para explorar.</p>
                  <button
                    onClick={() => setViewMode('galeria')}
                    className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black"
                  >
                    Ir a la Galería
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL: Detalle Socio (Ficha de Socio en modo Lectura) */}
      {selectedSocioForModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-blue-900/30 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] max-w-lg w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 shadow-2xl border border-slate-100">
            {/* Header decoration */}
            <div className="h-28 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 relative">
              <button 
                onClick={() => setSelectedSocioForModal(null)} 
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer flex items-center justify-center"
                title="Cerrar"
              >
                <XIcon size={16} />
              </button>
              {/* Avatar floating inside header decoration (not overflow hidden) */}
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 z-10">
                <img 
                  src={selectedSocioForModal.foto || `https://picsum.photos/seed/${selectedSocioForModal.nombre}/200/200`} 
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-xl ring-4 ring-blue-900/40 ring-offset-2" 
                  alt={selectedSocioForModal.nombre}
                />
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-8 pt-12 flex flex-col items-center text-center overflow-y-auto max-h-[60vh]">

              {/* Name & Role */}
              <div className="space-y-2.5 w-full">
                <h3 className="font-extrabold text-xl text-slate-900 tracking-tight leading-snug">
                  {selectedSocioForModal.nombre}
                </h3>
                
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full border bg-blue-50 text-blue-800 border-blue-200/70">
                    {selectedSocioForModal.puesto || 'Socio Regular'}
                  </span>
                  {(selectedSocioForModal.puestosAdicionales || []).map((pa: string, pi: number) => (
                    <span key={pi} className="text-[10px] font-black text-amber-800 bg-amber-50 px-3 py-0.5 rounded-full border border-amber-200 uppercase tracking-wide">
                      {pa}
                    </span>
                  ))}
                  {selectedSocioForModal.codigoSocio && (
                    <span className="text-[10px] font-mono font-black text-blue-700 bg-blue-50/50 px-2.5 py-0.5 rounded-full border border-blue-100">
                      # {selectedSocioForModal.codigoSocio}
                    </span>
                  )}
                </div>
                
                {/* Details list */}
                <div className="w-full bg-slate-50/70 rounded-2xl p-5 border border-slate-100 text-left text-xs font-bold text-slate-650 space-y-3 mt-6">
                  {/* Email */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <span className="text-slate-400 flex items-center space-x-2">
                      <Mail size={15} />
                      <span>Correo</span>
                    </span>
                    {selectedSocioForModal.correo ? (
                      <a href={`mailto:${selectedSocioForModal.correo}`} className="font-black text-blue-700 hover:text-blue-900 transition-colors">
                        {selectedSocioForModal.correo}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic font-medium">Sin correo registrado</span>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <span className="text-slate-400 flex items-center space-x-2">
                      <Phone size={15} />
                      <span>Teléfono</span>
                    </span>
                    {selectedSocioForModal.telefono && selectedSocioForModal.telefono !== 'Sin teléfono' ? (
                      <a href={`tel:${selectedSocioForModal.telefono}`} className="font-black text-slate-800 hover:text-blue-700 transition-colors">
                        {selectedSocioForModal.telefono}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic font-medium">Sin teléfono</span>
                    )}
                  </div>

                  {/* Date of Entry */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center space-x-2">
                      <Calendar size={15} />
                      <span>Ingreso</span>
                    </span>
                    <span className="font-black text-slate-800">
                      {selectedSocioForModal.fechaIngreso || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Status bar */}
                <div className="flex items-center justify-between mt-5 px-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Membresía Financiera</span>
                  <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    selectedSocioForModal.estadoCuotas === 'Al día' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' 
                      : 'bg-yellow-50 text-yellow-700 border border-yellow-200/50'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedSocioForModal.estadoCuotas === 'Al día' ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                    <span>{selectedSocioForModal.estadoCuotas || 'Al día'}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="py-4 px-6 border-t border-slate-100 bg-slate-50 text-center">
              <button
                onClick={() => setSelectedSocioForModal(null)}
                className="w-full py-3 bg-white hover:bg-slate-100 text-slate-700 font-extrabold rounded-xl border border-slate-200 text-sm transition-all cursor-pointer"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Detalle de Acta (Visualización formateada y PDF) */}
      {selectedActaForModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-blue-900/20 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] max-w-5xl w-full h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 shadow-2xl border border-slate-100">
            <div className="py-4 px-6 sm:py-5 sm:px-8 border-b border-slate-100 flex justify-between items-center bg-blue-900 text-white relative shrink-0">
              <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500" />
              <div className="text-left pr-12 sm:pr-16">
                <h3 className="text-lg sm:text-xl md:text-2xl font-black truncate max-w-[280px] sm:max-w-lg md:max-w-2xl">{selectedActaForModal.titulo}</h3>
                <p className="text-[10px] sm:text-xs text-blue-200 mt-0.5 uppercase tracking-widest font-bold">{selectedActaForModal.fecha} • SECRETARÍA</p>
              </div>
              <button 
                onClick={() => setSelectedActaForModal(null)} 
                className="absolute top-3.5 right-4 sm:top-4.5 sm:right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer flex items-center justify-center"
                title="Cerrar"
              >
                <XIcon size={18} />
              </button>
            </div>
            
            <div className="p-3 sm:p-5 md:p-8 overflow-y-auto bg-slate-50/50 flex-grow shadow-inner">
              <FormattedActa
                titulo={selectedActaForModal.titulo}
                fecha={selectedActaForModal.fecha}
                categoria={selectedActaForModal.categoria || 'Ordinaria'}
                autor={selectedActaForModal.autor}
                contenido={selectedActaForModal.contenido}
                presidentName={presidentName}
                secretaryName={secretaryName}
                numeroActa={selectedActaForModal.numeroActa || '1'}
                codigoRegistro={selectedActaForModal.codigoRegistro}
              />
            </div>

            <div className="py-4 px-6 sm:py-5 sm:px-8 border-t border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 text-left shrink-0">
              <p className="text-[10px] sm:text-xs text-slate-400 uppercase font-black tracking-tighter italic">Propiedad Privada • Club de Leones Quetzaltenango</p>
              <div className="flex space-x-3 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedActaForModal(null)}
                  className="flex-grow sm:flex-none px-6 py-2.5 text-slate-500 font-bold hover:text-slate-850 text-xs transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => generateActaPDF(selectedActaForModal, 'open')}
                  className="flex-grow sm:flex-none bg-blue-900 text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-xl shadow-blue-900/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <span>Ver PDF Completo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
