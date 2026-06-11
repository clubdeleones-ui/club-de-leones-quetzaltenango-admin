import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { firebaseService } from '../services/firebaseService';
import { Comision, Socio, AsignacionComision } from '../types';
import { Briefcase, Plus, Search, Trash2, Users, CheckCircle, Save, DollarSign } from 'lucide-react';

export const Comisiones: React.FC = () => {
  const [comisiones, setComisiones] = useState<Comision[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [asignaciones, setAsignaciones] = useState<AsignacionComision[]>([]);
  
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [form, setForm] = useState<Partial<Comision>>({
    nombre: '',
    proposito: '',
    miembros: [],
    estado: 'Activa'
  });

  const [miembrosSearch, setMiembrosSearch] = useState('');

  useEffect(() => {
    // Suscripción a socios
    const qSocios = query(collection(db, 'socios_activos'));
    const unsubSocios = onSnapshot(qSocios, (snapshot) => {
      setSocios(snapshot.docs.map(d => d.data() as Socio));
    });

    // Suscripción a comisiones
    const qComisiones = query(collection(db, 'comisiones'), orderBy('fechaCreacion', 'desc'));
    const unsubComisiones = onSnapshot(qComisiones, (snapshot) => {
      setComisiones(snapshot.docs.map(d => ({id: d.id, ...d.data()}) as Comision));
    });

    // Suscripción a asignaciones
    const qAsignaciones = query(collection(db, 'presupuestos_asignaciones'));
    const unsubAsignaciones = onSnapshot(qAsignaciones, (snapshot) => {
      setAsignaciones(snapshot.docs.map(d => d.data() as AsignacionComision));
    });

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.proposito) return;

    const newComision: Comision = {
      id: form.id || `com-${Date.now()}`,
      nombre: form.nombre,
      proposito: form.proposito,
      miembros: form.miembros || [],
      fechaCreacion: form.fechaCreacion || new Date().toISOString(),
      estado: form.estado || 'Activa'
    };

    await firebaseService.saveComision(newComision);
    setShowForm(false);
    setForm({ nombre: '', proposito: '', miembros: [], estado: 'Activa' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta comisión permanentemente?')) {
      await firebaseService.deleteComision(id);
    }
  };

  const filteredSocios = useMemo(() => {
    if (!miembrosSearch) return socios;
    return socios.filter(s => s.nombre.toLowerCase().includes(miembrosSearch.toLowerCase()) || (s.apodo && s.apodo.toLowerCase().includes(miembrosSearch.toLowerCase())));
  }, [socios, miembrosSearch]);

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
              setForm({ nombre: '', proposito: '', miembros: [], estado: 'Activa' });
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
          
          <form onSubmit={handleSave} className="space-y-6">
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

            {/* Asignación de Miembros */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <h4 className="font-black text-slate-800 text-sm">Asignar Miembros</h4>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">
                    {form.miembros?.length || 0} SELECCIONADOS
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar socio..."
                    value={miembrosSearch}
                    onChange={(e) => setMiembrosSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="p-2 h-64 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {filteredSocios.map(socio => {
                  const isSelected = form.miembros?.includes(socio.id);
                  return (
                    <button
                      key={socio.id}
                      type="button"
                      onClick={() => handleToggleMember(socio.id)}
                      className={`flex items-center space-x-3 p-3 rounded-xl border text-left transition-all ${
                        isSelected 
                          ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-sm' 
                          : 'bg-white border-slate-100 hover:border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {isSelected ? <CheckCircle size={16} /> : <Users size={14} />}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                          {socio.nombre}
                        </p>
                        <p className="text-[9px] uppercase tracking-wider font-bold text-slate-400 truncate">
                          {socio.puesto || 'Socio Activo'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex space-x-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-sm shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center space-x-2"
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

              return (
                <div key={comision.id} className="bg-white rounded-[2rem] border border-slate-200/80 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative">
                  <div className="absolute right-4 top-4 flex space-x-2">
                    <button 
                      onClick={() => {
                        setForm(comision);
                        setShowForm(true);
                      }}
                      className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-xl transition-colors"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDelete(comision.id)}
                      className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex items-center space-x-3 mb-4 pr-20">
                    <div className={`p-3 rounded-xl shrink-0 ${comision.estado === 'Activa' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-lg leading-tight">{comision.nombre}</h3>
                      <span className={`inline-block px-2 py-0.5 mt-1 rounded text-[9px] font-black uppercase tracking-wider ${
                        comision.estado === 'Activa' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {comision.estado}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 font-medium mb-6 line-clamp-3 leading-relaxed">
                    {comision.proposito}
                  </p>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    {/* Presupuesto */}
                    <div className="flex justify-between items-center bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                      <div className="flex items-center space-x-2 text-blue-900">
                        <DollarSign size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Presupuesto</span>
                      </div>
                      <span className="font-black text-blue-700 text-sm">
                        Q{assignedBudget.toLocaleString('es-GT', {minimumFractionDigits: 2})}
                      </span>
                    </div>

                    {/* Miembros */}
                    <div>
                      <div className="flex items-center space-x-1.5 mb-2">
                        <Users size={14} className="text-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          {comision.miembros.length} Miembros
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {assignedMembers.slice(0, 5).map(m => (
                          <div key={m.id} className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600" title={m.nombre}>
                            {m.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                        ))}
                        {assignedMembers.length > 5 && (
                          <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[9px] font-black text-slate-400">
                            +{assignedMembers.length - 5}
                          </div>
                        )}
                        {assignedMembers.length === 0 && (
                          <span className="text-xs text-slate-400 italic">Sin miembros asignados</span>
                        )}
                      </div>
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
