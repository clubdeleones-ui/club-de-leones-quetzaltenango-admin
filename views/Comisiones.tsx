import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { firebaseService } from '../services/firebaseService';
import { Comision, Socio, AsignacionComision, Acta } from '../types';
import { Briefcase, Plus, Search, Trash2, Users, CheckCircle, Save, DollarSign, FileText, X, Pencil, Calendar } from 'lucide-react';
import { MOCK_ACTAS } from '../constants';

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

    const newComision: Comision = {
      id: form.id || `com-${Date.now()}`,
      nombre: form.nombre,
      proposito: form.proposito,
      miembros: form.miembros || [],
      actasVinculadas: form.actasVinculadas || [],
      fechaCreacion: form.fechaCreacion || new Date().toISOString(),
      estado: form.estado || 'Activa'
    };

    await firebaseService.saveComision(newComision);
    setShowForm(false);
    setForm({ nombre: '', proposito: '', miembros: [], actasVinculadas: [], estado: 'Activa' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta comisión permanentemente?')) {
      await firebaseService.deleteComision(id);
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


  const filteredComisiones = useMemo(() => {
    return comisiones.filter(c => c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || c.proposito.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [comisiones, searchTerm]);

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
        <>
          <div className="relative">
            <Search className="absolute left-6 top-5 text-slate-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar comisiones por nombre o propósito..."
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm text-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredComisiones.map(comision => {
              const assignedBudget = asignaciones
                .filter(a => a.comision === comision.id)
                .reduce((acc, curr) => acc + curr.monto, 0);

              const assignedMembers = socios.filter(s => comision.miembros.includes(s.id));
              const linkedActas = actas.filter(a => (comision.actasVinculadas || []).includes(a.id));

              return (
                <div 
                  key={comision.id} 
                  className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 group relative flex flex-col justify-between overflow-hidden"
                >
                  {/* Decorative Top Border */}
                  <div className={`h-2.5 w-full ${comision.estado === 'Activa' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-slate-300'}`} />

                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      {/* Action buttons (Visible on hover) */}
                      <div className="absolute right-4 top-5 flex items-center space-x-1.5 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button 
                          onClick={() => {
                            setForm(comision);
                            setShowForm(true);
                          }}
                          className="p-2 bg-slate-50 hover:bg-blue-50 text-slate-450 hover:text-blue-600 rounded-xl transition-all border border-slate-100"
                          title="Editar comisión"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(comision.id)}
                          className="p-2 bg-slate-50 hover:bg-red-50 text-slate-450 hover:text-red-500 rounded-xl transition-all border border-slate-100"
                          title="Eliminar comisión"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="flex items-start space-x-3 mb-4 pr-16">
                        <div className={`p-3 rounded-2xl shrink-0 ${comision.estado === 'Activa' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                          <Briefcase size={20} />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-800 text-base leading-tight group-hover:text-blue-900 transition-colors">{comision.nombre}</h3>
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 mt-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            comision.estado === 'Activa' ? 'bg-emerald-100/60 text-emerald-700' : 'bg-slate-200 text-slate-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${comision.estado === 'Activa' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            <span>{comision.estado}</span>
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 font-medium mb-6 line-clamp-3 leading-relaxed">
                        {comision.proposito}
                      </p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      {/* Presupuesto */}
                      <div className="flex justify-between items-center bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100/50">
                        <div className="flex items-center space-x-2 text-blue-900">
                          <DollarSign size={16} className="text-blue-500 shrink-0" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Presupuesto</span>
                        </div>
                        <span className="font-black text-blue-700 text-sm">
                          Q{assignedBudget.toLocaleString('es-GT', {minimumFractionDigits: 2})}
                        </span>
                      </div>

                      {/* Miembros */}
                      <div>
                        <div className="flex items-center space-x-1.5 mb-2.5">
                          <Users size={14} className="text-slate-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-550">
                            {comision.miembros.length} Miembros Asignados
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex -space-x-2.5 overflow-hidden">
                            {assignedMembers.slice(0, 5).map(m => (
                              <img
                                key={m.id}
                                src={m.foto || `https://picsum.photos/seed/${m.nombre}/100/100`}
                                className="w-8 h-8 rounded-full object-cover border-2 border-white ring-1 ring-slate-100 shrink-0"
                                alt={m.nombre}
                                title={`${m.nombre} - ${m.puesto || 'Socio'}`}
                              />
                            ))}
                            {assignedMembers.length > 5 && (
                              <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white ring-1 ring-slate-200 flex items-center justify-center text-[10px] font-black text-slate-555 shrink-0">
                                +{assignedMembers.length - 5}
                              </div>
                            )}
                          </div>
                          {assignedMembers.length === 0 ? (
                            <span className="text-xs text-slate-400 italic">Sin miembros asignados</span>
                          ) : (
                            <span className="text-[11px] font-bold text-slate-600 truncate max-w-[140px]" title={assignedMembers.map(m => m.nombre).join(', ')}>
                              {assignedMembers.slice(0, 2).map(m => m.nombre.split(' ')[0]).join(', ')}
                              {assignedMembers.length > 2 && '...'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actas Vinculadas */}
                      {linkedActas.length > 0 && (
                        <div className="pt-3.5 border-t border-slate-100">
                          <div className="flex items-center space-x-1.5 mb-2">
                            <FileText size={14} className="text-slate-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-550">
                              Actas Relacionadas ({linkedActas.length})
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {linkedActas.map(acta => (
                              <span 
                                key={acta.id} 
                                className="inline-flex items-center text-[9px] font-bold text-slate-655 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg max-w-[140px] truncate" 
                                title={acta.titulo}
                              >
                                {acta.titulo}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredComisiones.length === 0 && (
              <div className="col-span-full py-20 bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center">
                <Briefcase className="mx-auto text-slate-300 mb-4" size={48} />
                <h3 className="text-lg font-black text-slate-500">No hay comisiones</h3>
                <p className="text-sm text-slate-400 mt-1">No se encontraron comisiones registradas o que coincidan con la búsqueda.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
