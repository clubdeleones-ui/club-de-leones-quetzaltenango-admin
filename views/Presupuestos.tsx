import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Briefcase, 
  TrendingUp, 
  Tags,
  Calendar,
  Activity,
  CheckCircle,
  FileText
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { firebaseService } from '../services/firebaseService';
import { RubroPresupuesto, FondoPresupuesto, AsignacionComision, Comision } from '../types';

export const Presupuestos: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'fondos' | 'asignaciones' | 'rubros'>('fondos');
  
  const [rubros, setRubros] = useState<RubroPresupuesto[]>([]);
  const [fondos, setFondos] = useState<FondoPresupuesto[]>([]);
  const [asignaciones, setAsignaciones] = useState<AsignacionComision[]>([]);
  const [comisiones, setComisiones] = useState<Comision[]>([]);
  
  // Forms States
  const [rubroForm, setRubroForm] = useState({ codigo: '', nombre: '', descripcion: '' });
  const [fondoForm, setFondoForm] = useState({ tipo: 'Cuotas' as FondoPresupuesto['tipo'], monto: '', descripcion: '' });
  const [asignacionForm, setAsignacionForm] = useState({ comision: '', monto: '', rubroId: '', temporalidad: 'Mensual' as AsignacionComision['temporalidad'], actividad: '', descripcion: '' });

  // Load Data
  useEffect(() => {
    const qRubros = query(collection(db, 'presupuestos_rubros'), orderBy('fechaCreacion', 'desc'));
    const unsubRubros = onSnapshot(qRubros, (snapshot) => {
      setRubros(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as RubroPresupuesto));
    });

    const qFondos = query(collection(db, 'presupuestos_fondos'), orderBy('fecha', 'desc'));
    const unsubFondos = onSnapshot(qFondos, (snapshot) => {
      setFondos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FondoPresupuesto));
    });

    const qAsignaciones = query(collection(db, 'presupuestos_asignaciones'), orderBy('fechaCreacion', 'desc'));
    const unsubAsignaciones = onSnapshot(qAsignaciones, (snapshot) => {
      setAsignaciones(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AsignacionComision));
    });

    const qComisiones = query(collection(db, 'comisiones'), orderBy('fechaCreacion', 'desc'));
    const unsubComisiones = onSnapshot(qComisiones, (snapshot) => {
      setComisiones(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Comision));
    });

    return () => {
      unsubRubros();
      unsubFondos();
      unsubAsignaciones();
      unsubComisiones();
    };
  }, []);

  // Handlers
  const handleSaveRubro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rubroForm.codigo || !rubroForm.nombre) return;
    
    const newRubro: RubroPresupuesto = {
      id: `rubro-${Date.now()}`,
      ...rubroForm,
      fechaCreacion: new Date().toISOString(),
      activo: true
    };
    
    await firebaseService.saveRubroPresupuesto(newRubro);
    setRubroForm({ codigo: '', nombre: '', descripcion: '' });
  };

  const handleDeleteRubro = async (id: string) => {
    if (confirm('¿Eliminar este rubro permanentemente?')) {
      await firebaseService.deleteRubroPresupuesto(id);
    }
  };

  const handleSaveFondo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fondoForm.monto || !fondoForm.descripcion) return;
    
    const newFondo: FondoPresupuesto = {
      id: `fondo-${Date.now()}`,
      tipo: fondoForm.tipo,
      monto: parseFloat(fondoForm.monto),
      descripcion: fondoForm.descripcion,
      fecha: new Date().toISOString()
    };
    
    await firebaseService.saveFondoPresupuesto(newFondo);
    setFondoForm({ tipo: 'Cuotas', monto: '', descripcion: '' });
  };

  const handleDeleteFondo = async (id: string) => {
    if (confirm('¿Eliminar este ingreso permanentemente?')) {
      await firebaseService.deleteFondoPresupuesto(id);
    }
  };

  const handleSaveAsignacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asignacionForm.comision || !asignacionForm.monto || !asignacionForm.rubroId) return;
    
    const newAsignacion: AsignacionComision = {
      id: `asig-${Date.now()}`,
      ...asignacionForm,
      monto: parseFloat(asignacionForm.monto),
      fechaCreacion: new Date().toISOString()
    };
    
    await firebaseService.saveAsignacionComision(newAsignacion);
    setAsignacionForm({ comision: '', monto: '', rubroId: '', temporalidad: 'Mensual', actividad: '', descripcion: '' });
  };

  const handleDeleteAsignacion = async (id: string) => {
    if (confirm('¿Eliminar esta asignación permanentemente?')) {
      await firebaseService.deleteAsignacionComision(id);
    }
  };

  // Calculations
  const getTotalFondos = () => fondos.reduce((acc, curr) => acc + curr.monto, 0);
  const getTotalAsignado = () => asignaciones.reduce((acc, curr) => acc + curr.monto, 0);
  const getFondosDisponibles = () => getTotalFondos() - getTotalAsignado();

  const getFondosPorTipo = (tipo: string) => 
    fondos.filter(f => f.tipo === tipo).reduce((acc, curr) => acc + curr.monto, 0);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header and KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] p-6 text-white shadow-lg shadow-emerald-500/30">
          <p className="text-sm font-bold text-emerald-100 uppercase tracking-widest">Fondo Disponible</p>
          <h2 className="text-4xl font-black mt-2">Q{getFondosDisponibles().toLocaleString('es-GT', {minimumFractionDigits: 2})}</h2>
          <div className="mt-4 flex items-center text-xs font-medium text-emerald-100">
            <CheckCircle size={14} className="mr-1.5" />
            Balance positivo actual
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Ingresos Totales</p>
          <h2 className="text-3xl font-black text-slate-800 mt-2">Q{getTotalFondos().toLocaleString('es-GT', {minimumFractionDigits: 2})}</h2>
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-500">Cuotas:</span>
              <span className="text-slate-700">Q{getFondosPorTipo('Cuotas').toLocaleString('es-GT', {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-500">Autónomos:</span>
              <span className="text-slate-700">Q{getFondosPorTipo('Autónomo').toLocaleString('es-GT', {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-500">Actividades:</span>
              <span className="text-slate-700">Q{getFondosPorTipo('Actividad').toLocaleString('es-GT', {minimumFractionDigits: 2})}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Asignado</p>
          <h2 className="text-3xl font-black text-slate-800 mt-2">Q{getTotalAsignado().toLocaleString('es-GT', {minimumFractionDigits: 2})}</h2>
          <div className="mt-4 flex items-center text-xs font-medium text-slate-500">
            <Briefcase size={14} className="mr-1.5" />
            Presupuesto distribuido en {asignaciones.length} comisiones
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row bg-slate-100/80 backdrop-blur-md p-2 rounded-[1.5rem] shadow-inner border border-slate-200/50 gap-2 sm:gap-0">
        <button 
          onClick={() => setActiveTab('fondos')}
          className={`flex-1 py-3.5 text-sm font-black transition-all duration-300 rounded-xl flex items-center justify-center space-x-2 ${activeTab === 'fondos' ? 'bg-white shadow-md text-emerald-600 transform scale-[1.02]' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
        >
          <TrendingUp size={16} className={activeTab === 'fondos' ? 'text-emerald-500' : 'text-slate-400'} />
          <span>Ingreso de Fondos</span>
        </button>
        <button 
          onClick={() => setActiveTab('asignaciones')}
          className={`flex-1 py-3.5 text-sm font-black transition-all duration-300 rounded-xl flex items-center justify-center space-x-2 ${activeTab === 'asignaciones' ? 'bg-white shadow-md text-blue-600 transform scale-[1.02]' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
        >
          <Briefcase size={16} className={activeTab === 'asignaciones' ? 'text-blue-500' : 'text-slate-400'} />
          <span>Asignación a Comisiones</span>
        </button>
        <button 
          onClick={() => setActiveTab('rubros')}
          className={`flex-1 py-3.5 text-sm font-black transition-all duration-300 rounded-xl flex items-center justify-center space-x-2 ${activeTab === 'rubros' ? 'bg-white shadow-md text-indigo-600 transform scale-[1.02]' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
        >
          <Tags size={16} className={activeTab === 'rubros' ? 'text-indigo-500' : 'text-slate-400'} />
          <span>Configurar Rubros</span>
        </button>
      </div>

      {/* Tabs Content */}
      <div className="w-full">
        
        {/* TAB 1: INGRESOS DE FONDOS */}
        {activeTab === 'fondos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5">
              <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 sm:p-8 shadow-xl shadow-slate-200/40">
                <div className="flex items-center space-x-4 border-b border-slate-100 pb-5 mb-6">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg tracking-tight">Nuevo Ingreso</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Registrar disponibilidad</p>
                  </div>
                </div>

                <form onSubmit={handleSaveFondo} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Tipo de Ingreso</label>
                    <select
                      value={fondoForm.tipo}
                      onChange={(e) => setFondoForm({...fondoForm, tipo: e.target.value as FondoPresupuesto['tipo']})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="Cuotas">Ingresos de Cuotas</option>
                      <option value="Autónomo">Ingresos Autónomos</option>
                      <option value="Actividad">Ingresos por Actividad</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Monto (Q)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={fondoForm.monto}
                      onChange={(e) => setFondoForm({...fondoForm, monto: e.target.value})}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Descripción / Referencia</label>
                    <input
                      type="text"
                      required
                      value={fondoForm.descripcion}
                      onChange={(e) => setFondoForm({...fondoForm, descripcion: e.target.value})}
                      placeholder="Ej. Cuotas Mayo 2024"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2"
                    >
                      <Plus size={18} />
                      <span>Registrar Fondo</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 sm:p-8 shadow-sm">
                <h3 className="font-black text-slate-800 text-lg mb-6">Historial de Ingresos</h3>
                <div className="space-y-3">
                  {fondos.map(fondo => (
                    <div key={fondo.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2.5 rounded-xl ${
                          fondo.tipo === 'Cuotas' ? 'bg-blue-50 text-blue-500' :
                          fondo.tipo === 'Autónomo' ? 'bg-purple-50 text-purple-500' :
                          'bg-orange-50 text-orange-500'
                        }`}>
                          <DollarSign size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{fondo.descripcion}</p>
                          <div className="flex items-center space-x-2 mt-1 text-[10px] font-bold text-slate-400">
                            <span>{new Date(fondo.fecha).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="uppercase tracking-wider">{fondo.tipo}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="font-black text-emerald-600">Q{fondo.monto.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span>
                        <button 
                          onClick={() => handleDeleteFondo(fondo.id)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {fondos.length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-sm font-bold">
                      No hay fondos registrados.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ASIGNACIONES A COMISIONES */}
        {activeTab === 'asignaciones' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5">
              <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 sm:p-8 shadow-xl shadow-slate-200/40">
                <div className="flex items-center space-x-4 border-b border-slate-100 pb-5 mb-6">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg tracking-tight">Asignar Fondo</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Distribuir presupuesto a comisiones</p>
                  </div>
                </div>

                <form onSubmit={handleSaveAsignacion} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Comisión</label>
                    <select
                      required
                      value={asignacionForm.comision}
                      onChange={(e) => setAsignacionForm({...asignacionForm, comision: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccione una comisión...</option>
                      {comisiones.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Rubro</label>
                    <select
                      required
                      value={asignacionForm.rubroId}
                      onChange={(e) => setAsignacionForm({...asignacionForm, rubroId: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccione un rubro...</option>
                      {rubros.map(r => (
                        <option key={r.id} value={r.id}>{r.codigo} - {r.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Monto (Q)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={asignacionForm.monto}
                        onChange={(e) => setAsignacionForm({...asignacionForm, monto: e.target.value})}
                        placeholder="0.00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Temporalidad</label>
                      <select
                        value={asignacionForm.temporalidad}
                        onChange={(e) => setAsignacionForm({...asignacionForm, temporalidad: e.target.value as AsignacionComision['temporalidad']})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Mensual">Mensual</option>
                        <option value="Trimestral">Trimestral</option>
                        <option value="Semestral">Semestral</option>
                        <option value="Anual">Anual</option>
                        <option value="Unica">Actividad Única</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Actividad Asociada (Opcional)</label>
                    <input
                      type="text"
                      value={asignacionForm.actividad}
                      onChange={(e) => setAsignacionForm({...asignacionForm, actividad: e.target.value})}
                      placeholder="Ej. Torneo de Golf"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Detalle</label>
                    <input
                      type="text"
                      required
                      value={asignacionForm.descripcion}
                      onChange={(e) => setAsignacionForm({...asignacionForm, descripcion: e.target.value})}
                      placeholder="Justificación del fondo"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center space-x-2"
                    >
                      <Plus size={18} />
                      <span>Asignar Presupuesto</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 sm:p-8 shadow-sm">
                <h3 className="font-black text-slate-800 text-lg mb-6">Comisiones Asignadas</h3>
                <div className="space-y-4">
                  {asignaciones.map(asig => {
                    const rubroObj = rubros.find(r => r.id === asig.rubroId);
                    const comisionObj = comisiones.find(c => c.id === asig.comision);
                    const comisionNombre = comisionObj ? comisionObj.nombre : asig.comision;
                    return (
                      <div key={asig.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group relative">
                        <div className="absolute right-4 top-4">
                          <button 
                            onClick={() => handleDeleteAsignacion(asig.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xl shrink-0">
                              {comisionNombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-base font-black text-slate-800">{comisionNombre}</h4>
                              <p className="text-xs font-bold text-slate-500 mt-0.5">{asig.descripcion}</p>
                            </div>
                          </div>
                          <div className="text-left sm:text-right pr-8">
                            <span className="text-xl font-black text-blue-600 block">Q{asig.monto.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{asig.temporalidad}</span>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-wrap gap-2">
                          <span className="inline-flex items-center text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                            <Tags size={12} className="mr-1" />
                            Rubro: {rubroObj ? `${rubroObj.codigo} ${rubroObj.nombre}` : 'Desconocido'}
                          </span>
                          {asig.actividad && (
                            <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
                              <Activity size={12} className="mr-1" />
                              Actividad: {asig.actividad}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {asignaciones.length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-sm font-bold">
                      No hay asignaciones registradas.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CONFIGURAR RUBROS */}
        {activeTab === 'rubros' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5">
              <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 sm:p-8 shadow-xl shadow-slate-200/40">
                <div className="flex items-center space-x-4 border-b border-slate-100 pb-5 mb-6">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
                    <Tags size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg tracking-tight">Crear Rubro</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Categorías de clasificación contable</p>
                  </div>
                </div>

                <form onSubmit={handleSaveRubro} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Código de Rubro</label>
                    <input
                      type="text"
                      required
                      value={rubroForm.codigo}
                      onChange={(e) => setRubroForm({...rubroForm, codigo: e.target.value})}
                      placeholder="Ej. R-01"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Nombre</label>
                    <input
                      type="text"
                      required
                      value={rubroForm.nombre}
                      onChange={(e) => setRubroForm({...rubroForm, nombre: e.target.value})}
                      placeholder="Nombre de la categoría"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Descripción</label>
                    <input
                      type="text"
                      value={rubroForm.descripcion}
                      onChange={(e) => setRubroForm({...rubroForm, descripcion: e.target.value})}
                      placeholder="Detalles opcionales"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2"
                    >
                      <Plus size={18} />
                      <span>Agregar Rubro</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 sm:p-8 shadow-sm">
                <h3 className="font-black text-slate-800 text-lg mb-6">Catálogo de Rubros</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {rubros.map(rubro => (
                    <div key={rubro.id} className="flex items-start justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 transition-colors group">
                      <div>
                        <span className="inline-block bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider mb-2">
                          Código: {rubro.codigo}
                        </span>
                        <h4 className="text-sm font-black text-slate-800">{rubro.nombre}</h4>
                        {rubro.descripcion && (
                          <p className="text-xs text-slate-500 mt-1 font-medium">{rubro.descripcion}</p>
                        )}
                      </div>
                      <button 
                        onClick={() => handleDeleteRubro(rubro.id)}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {rubros.length === 0 && (
                    <div className="col-span-full text-center py-10 text-slate-400 text-sm font-bold">
                      No hay rubros configurados.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
