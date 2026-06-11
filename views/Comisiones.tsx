import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { firebaseService } from '../services/firebaseService';
import { Comision, Socio, AsignacionComision, Acta } from '../types';
import { Briefcase, Plus, Search, Trash2, Users, CheckCircle, Save, DollarSign, FileText, X, Pencil, Calendar } from 'lucide-react';
import { MOCK_ACTAS } from '../constants';
import { FormattedActa } from '../components/FormattedActa';
import { generateActaPDF } from '../utils/pdfGenerator';
import { Phone, Mail } from 'lucide-react';

const cleanString = (str: string) => 
  str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";

const isMatch = (val1: string, val2: string) => 
  cleanString(val1) === cleanString(val2);

export const Comisiones: React.FC = () => {
  const [comisiones, setComisiones] = useState<Comision[]>([]);
  const [socios, setSocios] = useState<Socio[]>(() => {
    const local = localStorage.getItem('club_leones_socios_v3');
    if (local) return JSON.parse(local);
    return [];
  });
  const [asignaciones, setAsignaciones] = useState<AsignacionComision[]>([]);
  const [actas, setActas] = useState<Acta[]>([]);
  
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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
    actasVinculadas: [],
    estado: 'Activa'
  });

  const [miembrosSearch, setMiembrosSearch] = useState('');
  const [actasSearch, setActasSearch] = useState('');

  useEffect(() => {
    // Suscripción a socios
    const qSocios = query(collection(db, 'socios'));
    const unsubSocios = onSnapshot(qSocios, (snapshot) => {
      setSocios(snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as Socio));
    });

    // Suscripción a comisiones
    const qComisiones = query(collection(db, 'comisiones'), orderBy('fechaCreacion', 'desc'));
    const unsubComisiones = onSnapshot(qComisiones, (snapshot) => {
      setComisiones(snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as Comision));
    });

    // Suscripción a asignaciones
    const qAsignaciones = query(collection(db, 'presupuestos_asignaciones'));
    const unsubAsignaciones = onSnapshot(qAsignaciones, (snapshot) => {
      setAsignaciones(snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as AsignacionComision));
    });

    // Cargar Actas de localStorage para permitir vinculación
    const local = localStorage.getItem('club_leones_actas');
    let loadedActas = MOCK_ACTAS;
    if (local) {
      try {
        loadedActas = JSON.parse(local);
      } catch (e) {
        loadedActas = MOCK_ACTAS;
      }
    }
    setActas(loadedActas);

    return () => {
      unsubSocios();
      unsubComisiones();
      unsubAsignaciones();
    };
  }, []);

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
      actasVinculadas: form.actasVinculadas || [],
      fechaCreacion: form.fechaCreacion || new Date().toISOString(),
      estado: form.estado || 'Activa'
    };

    await firebaseService.saveComision(newComision);
    setSelectedComisionId(commissionId);
    setShowForm(false);
    setForm({ nombre: '', proposito: '', miembros: [], actasVinculadas: [], estado: 'Activa' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta comisión permanentemente?')) {
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-blue-900">Gestión de Comisiones</h2>
          <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Secretaría • Equipos de Trabajo</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setForm({ nombre: '', proposito: '', miembros: [], actasVinculadas: [], estado: 'Activa' });
              setShowForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-blue-600/20 transition-all flex items-center space-x-2"
          >
            <Plus size={18} />
            <span>Nueva Comisión</span>
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative animate-in zoom-in-95 duration-300">
          <h3 className="text-xl font-black text-slate-800 mb-6">{form.id ? 'Editar Comisión' : 'Crear Comisión'}</h3>
          
          <form onSubmit={handleSave} className="space-y-10">
            {/* Datos Generales */}
            <div className="space-y-6">
              <h4 className="font-extrabold text-blue-900 border-b border-slate-100 pb-2">1. Datos Generales</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Nombre de la Comisión</label>
                  <input
                    type="text"
                    required
                    value={form.nombre}
                    onChange={(e) => setForm({...form, nombre: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej. Comisión de Salud"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Estado</label>
                  <select
                    value={form.estado}
                    onChange={(e) => setForm({...form, estado: e.target.value as 'Activa' | 'Inactiva'})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Activa">Activa</option>
                    <option value="Inactiva">Inactiva</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Propósito / Objetivos</label>
                <textarea
                  required
                  rows={3}
                  value={form.proposito}
                  onChange={(e) => setForm({...form, proposito: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Describe el objetivo de esta comisión..."
                ></textarea>
              </div>
            </div>

            {/* Asignación de Miembros */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-blue-900 border-b border-slate-100 pb-2">2. Asignación de Miembros</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                      selectedSocios.map((member, index) => (
                        <div key={member.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <span className="text-[10px] font-black text-slate-400 w-5 text-right">{index + 1}.</span>
                            <div>
                              <p className="text-sm font-extrabold text-slate-800 leading-tight">{member.nombre}</p>
                              {member.puesto && <p className="text-[10px] font-black text-blue-600 uppercase tracking-wide mt-0.5">{member.puesto}</p>}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleMember(member.id)}
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all"
                            title="Remover miembro"
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

            {/* Vinculación de Actas */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-blue-900 border-b border-slate-100 pb-2">3. Vincular Actas de Sesión (Opcional)</h4>
              <p className="text-xs text-slate-500 font-medium">Vincula actas donde se haya discutido la creación o presupuesto de esta comisión.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                              <X size={14} />
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
        <div className="space-y-8">
          {/* Comisión Selector */}
          <div className="bg-white border border-slate-200/80 rounded-[2rem] p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex-1 w-full relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Seleccionar Comisión</label>
              <select
                value={selectedComisionId}
                onChange={(e) => setSelectedComisionId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-base font-black text-slate-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="">-- Elige una comisión para ver detalles --</option>
                {comisiones.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} ({c.estado})</option>
                ))}
              </select>
            </div>
            
            {/* Quick stats / summary in selector */}
            <div className="flex items-center space-x-6 text-sm font-bold text-slate-500 shrink-0">
              <div className="text-center">
                <span className="block text-slate-400 text-[9px] font-black uppercase tracking-wider">Total Comisiones</span>
                <span className="text-xl font-black text-slate-850">{comisiones.length}</span>
              </div>
              <div className="text-center">
                <span className="block text-slate-400 text-[9px] font-black uppercase tracking-wider">Activas</span>
                <span className="text-xl font-black text-emerald-600">{comisiones.filter(c => c.estado === 'Activa').length}</span>
              </div>
            </div>
          </div>

          {/* Full Width Ficha details */}
          {selectedComision ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Left Column: Info & Actions (5 columns) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 shadow-sm relative overflow-hidden">
                  <div className={`absolute top-0 left-0 right-0 h-2.5 ${selectedComision.estado === 'Activa' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-slate-300'}`} />

                  <div className="flex items-start space-x-4 mb-6 pt-2 pr-6">
                    <div className={`p-4 rounded-2xl shrink-0 ${selectedComision.estado === 'Activa' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-450'}`}>
                      <Briefcase size={28} />
                    </div>
                    <div className="pr-4 flex-1">
                      <h3 className="font-black text-slate-900 text-2xl leading-tight">{selectedComision.nombre}</h3>
                      <span className={`inline-flex items-center space-x-1.5 px-3 py-1 mt-2.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        selectedComision.estado === 'Activa' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-650'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${selectedComision.estado === 'Activa' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span>{selectedComision.estado}</span>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Propósito y Objetivos</span>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-semibold text-slate-650 leading-relaxed italic">
                        "{selectedComision.proposito}"
                      </div>
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
                        onClick={() => {
                          setForm(selectedComision);
                          setShowForm(true);
                        }}
                        className="py-3 px-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 text-slate-600 hover:text-blue-600 font-extrabold rounded-xl text-sm transition-all flex items-center justify-center space-x-2"
                      >
                        <Pencil size={15} />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleDelete(selectedComision.id)}
                        className="py-3 px-4 bg-slate-50 hover:bg-red-50 border border-slate-200 text-slate-600 hover:text-red-500 font-extrabold rounded-xl text-sm transition-all flex items-center justify-center space-x-2"
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
                      {assignedMembers.map(m => (
                        <button
                          key={m.id}
                          onClick={() => setSelectedSocioForModal(m)}
                          className="flex items-center text-left space-x-4 p-4 bg-slate-50/70 border border-slate-200/60 rounded-2xl hover:bg-white hover:shadow-md transition-all w-full cursor-pointer group"
                        >
                          <img
                            src={m.foto || `https://picsum.photos/seed/${m.nombre}/100/100`}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white ring-1 ring-slate-200 shrink-0"
                            alt={m.nombre}
                          />
                          <div className="overflow-hidden">
                            <p className="text-sm font-black text-slate-850 group-hover:text-blue-600 transition-colors truncate">{m.nombre}</p>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-wide truncate mt-0.5">{m.puesto || 'Socio'}</p>
                          </div>
                        </button>
                      ))}
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
              <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">Selecciona una comisión del menú desplegable de arriba para ver su ficha técnica completa, integrantes y presupuesto.</p>
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
                <X size={16} />
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
                  {/* Club */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <span className="text-slate-400 flex items-center space-x-2">
                      <Briefcase size={15} />
                      <span>Club</span>
                    </span>
                    <span className="font-black text-slate-800">{selectedSocioForModal.club || 'QUETZALTENANGO'}</span>
                  </div>

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
                <X size={18} />
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
