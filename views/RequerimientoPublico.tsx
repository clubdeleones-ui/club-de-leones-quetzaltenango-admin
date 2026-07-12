import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RequerimientoActividad, ComisionRequerimiento, TareaVoluntario, MaterialNecesidad } from '../types';
import { firebaseService } from '../services/firebaseService';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  Check, 
  CheckCircle, 
  Package, 
  ListTodo, 
  X, 
  ShieldAlert, 
  Info,
  Sparkles
} from 'lucide-react';
import { formatDisplayDate } from '../utils/dateSpanishFormatter';

export const RequerimientoPublico: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showAlert } = useModal();
  const { showToast } = useToast();

  const [req, setReq] = useState<RequerimientoActividad | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeComisionId, setActiveComisionId] = useState<string | null>(null);

  // Volunteer Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    comId: string;
    itemId: string;
    type: 'accion' | 'necesidad';
    descripcion: string;
    cantidad?: number;
  } | null>(null);

  // Form inputs
  const [volNombre, setVolNombre] = useState('');
  const [volTelefono, setVolTelefono] = useState('');

  // Keep track of user's signed-up items in localStorage so they can undo them
  const [mySignedUpItems, setMySignedUpItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('club_leones_public_signups');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Fetch requirement sheet on load and set up real-time listener if possible,
  // or simple polling/refetch. Let's load it from Firebase.
  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await firebaseService.getRequerimientoActividadById(id);
      if (data) {
        setReq(data);
        if (data.comisionesRequeridas && data.comisionesRequeridas.length > 0) {
          setActiveComisionId(data.comisionesRequeridas[0].id);
        }
      } else {
        showAlert('Error', 'La convocatoria solicitada no existe o fue eliminada.');
      }
    } catch (err) {
      console.error(err);
      showAlert('Error', 'No se pudo cargar la información de la convocatoria.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Save signed up items to localStorage
  useEffect(() => {
    localStorage.setItem('club_leones_public_signups', JSON.stringify(mySignedUpItems));
  }, [mySignedUpItems]);

  const activeComision = useMemo(() => {
    if (!req) return null;
    return (req.comisionesRequeridas || []).find(c => c.id === activeComisionId) || null;
  }, [req, activeComisionId]);

  // Open modal to sign up
  const handleOpenSignUp = (
    comId: string, 
    itemId: string, 
    type: 'accion' | 'necesidad', 
    descripcion: string,
    cantidad?: number
  ) => {
    // Check if the convocatoria is closed
    if (req?.estado === 'Cerrada') {
      showAlert('Convocatoria Cerrada', 'Esta convocatoria ha finalizado y ya no acepta voluntarios.');
      return;
    }

    // Attempt to pre-fill from previous localStorage profile
    const savedProfile = localStorage.getItem('club_leones_vol_profile');
    if (savedProfile) {
      try {
        const { nombre, telefono } = JSON.parse(savedProfile);
        setVolNombre(nombre || '');
        setVolTelefono(telefono || '');
      } catch {}
    }

    setSelectedItem({ comId, itemId, type, descripcion, cantidad });
    setModalOpen(true);
  };

  // Submit volunteer sign-up
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!req || !selectedItem) return;

    if (!volNombre.trim() || !volTelefono.trim()) {
      showAlert('Campos obligatorios', 'Por favor ingresa tu nombre y número de teléfono.');
      return;
    }

    // Format check (at least 8 digits)
    const phoneDigits = volTelefono.replace(/\D/g, '');
    if (phoneDigits.length < 8) {
      showAlert('Teléfono inválido', 'Por favor ingresa un número de teléfono válido (mínimo 8 dígitos).');
      return;
    }

    // Save profile to localStorage for future pre-fills
    localStorage.setItem('club_leones_vol_profile', JSON.stringify({ nombre: volNombre, telefono: volTelefono }));

    const updatedComisiones = req.comisionesRequeridas.map(c => {
      if (c.id === selectedItem.comId) {
        if (selectedItem.type === 'accion') {
          return {
            ...c,
            acciones: (c.acciones || []).map(a => {
              if (a.id === selectedItem.itemId) {
                return {
                  ...a,
                  socioId: 'externo',
                  socioNombre: volNombre,
                  socioTelefono: volTelefono
                };
              }
              return a;
            })
          };
        } else {
          return {
            ...c,
            necesidades: (c.necesidades || []).map(n => {
              if (n.id === selectedItem.itemId) {
                return {
                  ...n,
                  socioId: 'externo',
                  socioNombre: volNombre,
                  socioTelefono: volTelefono,
                  completado: true
                };
              }
              return n;
            })
          };
        }
      }
      return c;
    });

    const updatedReq: RequerimientoActividad = {
      ...req,
      comisionesRequeridas: updatedComisiones
    };

    try {
      await firebaseService.saveRequerimientoActividad(updatedReq);
      setReq(updatedReq);
      setMySignedUpItems(prev => [...prev, selectedItem.itemId]);
      setModalOpen(false);
      showToast('¡Gracias por tu apoyo! Te has registrado con éxito.', 'success');
    } catch (err) {
      console.error(err);
      showAlert('Error', 'No se pudo guardar tu registro. Intenta de nuevo.');
    }
  };

  // Cancel my support (only allowed if item was signed up on this device/localStorage)
  const handleCancelSupport = async (comId: string, itemId: string, type: 'accion' | 'necesidad') => {
    if (!req) return;

    const updatedComisiones = req.comisionesRequeridas.map(c => {
      if (c.id === comId) {
        if (type === 'accion') {
          return {
            ...c,
            acciones: (c.acciones || []).map(a => {
              if (a.id === itemId) {
                return {
                  ...a,
                  socioId: null,
                  socioNombre: null,
                  socioTelefono: null
                };
              }
              return a;
            })
          };
        } else {
          return {
            ...c,
            necesidades: (c.necesidades || []).map(n => {
              if (n.id === itemId) {
                return {
                  ...n,
                  socioId: null,
                  socioNombre: null,
                  socioTelefono: null,
                  completado: false
                };
              }
              return n;
            })
          };
        }
      }
      return c;
    });

    const updatedReq: RequerimientoActividad = {
      ...req,
      comisionesRequeridas: updatedComisiones
    };

    try {
      await firebaseService.saveRequerimientoActividad(updatedReq);
      setReq(updatedReq);
      setMySignedUpItems(prev => prev.filter(id => id !== itemId));
      showToast('Tu apoyo ha sido cancelado y la tarea vuelve a estar disponible.', 'info');
    } catch (err) {
      console.error(err);
      showAlert('Error', 'No se pudo retirar la postulación.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-655">Cargando convocatoria...</p>
      </div>
    );
  }

  if (!req) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={28} />
        </div>
        <h3 className="text-lg font-black text-slate-800">Convocatoria no encontrada</h3>
        <p className="text-xs text-slate-500 max-w-xs mx-auto mt-2 font-medium">
          El enlace al que intentas acceder no es válido o la ficha de requerimientos ha sido retirada por los administradores.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 font-sans">
      
      {/* HEADER HERO SECTION */}
      <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 text-white relative overflow-hidden shadow-lg">
        {/* Abstract background blobs */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-yellow-300 via-transparent to-transparent" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="max-w-2xl mx-auto px-5 py-8 md:py-12 relative space-y-4">
          {/* Logo badge / Club Name */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase bg-white/10 px-3 py-1 rounded-full tracking-widest border border-white/5">
              Club de Leones Quetzaltenango
            </span>
            {req.estado === 'Cerrada' && (
              <span className="text-[10px] font-black uppercase bg-red-500 text-white px-3 py-1 rounded-full tracking-widest">
                Cerrada
              </span>
            )}
          </div>

          {/* Activity Title */}
          <h1 className="text-xl md:text-3xl font-black tracking-tight leading-tight pr-6">
            {req.tituloActividad}
          </h1>

          {/* Organizer Commission */}
          <p className="text-xs font-bold text-slate-300">
            Convocatoria organizada por: <span className="text-white underline">{req.comisionCreadoraNombre}</span>
          </p>

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 border-t border-white/10 text-xs font-semibold text-slate-200">
            <div className="flex items-center space-x-2">
              <Calendar size={15} className="text-slate-400 shrink-0" />
              <span className="truncate">{formatDisplayDate(req.fechaActividad)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin size={15} className="text-slate-400 shrink-0" />
              <span className="truncate">{req.lugarActividad}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock size={15} className="text-slate-400 shrink-0" />
              <span className="truncate text-yellow-300">Límite: {formatDisplayDate(req.fechaLimiteConvocatoria)}</span>
            </div>
          </div>

          {/* Short description */}
          {req.descripcionActividad && (
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-xs text-slate-250 leading-relaxed font-semibold">
              {req.descripcionActividad}
            </div>
          )}
        </div>
      </div>

      {/* BODY CONTENT - HORIZONTAL TABS FOR AREAS */}
      <div className="max-w-2xl mx-auto px-4 mt-6">
        
        {/* Area tabs title */}
        <div className="flex items-center space-x-2 mb-4 px-1">
          <Sparkles size={16} className="text-blue-900" />
          <h2 className="text-xs font-black uppercase text-slate-500 tracking-wider">Selecciona un Área de Trabajo</h2>
        </div>

        {/* Scrollable Tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-3 scrollbar-none snap-x">
          {(req.comisionesRequeridas || []).map((com) => {
            const isActive = com.id === activeComisionId;
            const total = (com.acciones || []).length + (com.necesidades || []).length;
            const filled = (com.acciones || []).filter(a => a.socioId !== null).length + 
                           (com.necesidades || []).filter(n => n.socioId !== null).length;

            return (
              <button
                key={com.id}
                type="button"
                onClick={() => setActiveComisionId(com.id)}
                className={`snap-center shrink-0 flex flex-col items-start p-3.5 rounded-2xl border transition-all text-left min-w-[150px] ${
                  isActive 
                    ? 'bg-blue-900 text-white border-blue-900 shadow-md shadow-blue-900/10' 
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="text-xs font-extrabold line-clamp-1">{com.nombreComision}</span>
                <span className={`text-[10px] font-bold mt-1.5 ${isActive ? 'text-slate-200' : 'text-slate-400'}`}>
                  {filled}/{total} Cubiertos
                </span>
              </button>
            );
          })}
        </div>

        {/* ACTIVE AREA CONTENT */}
        {activeComision ? (
          <div className="mt-4 space-y-6 animate-fade-in">
            {/* Folder tab layout for active comision */}
            <div className="border border-slate-200 bg-white rounded-3xl overflow-hidden shadow-md shadow-slate-100/50 flex flex-col">
              
              {/* Tab Header for folder simulation */}
              <div className="bg-gradient-to-r from-blue-900 to-indigo-900 px-6 py-4.5 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h5 className="text-base font-black flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full inline-block animate-pulse" />
                    <span>{activeComision.nombreComision}</span>
                  </h5>
                  {activeComision.objetivo && (
                    <p className="text-xs text-blue-200 font-semibold mt-1 pr-4">{activeComision.objetivo}</p>
                  )}
                </div>
              </div>

              {/* Folder Body Content */}
              <div className="p-6 md:p-8 space-y-8">
                {/* 1. Tareas de Trabajo */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                    <ListTodo size={16} className="text-blue-900 stroke-[2.5]" />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Tareas de Trabajo ({(activeComision.acciones || []).length})</span>
                  </div>

                  {(activeComision.acciones || []).length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">No hay tareas de trabajo en esta comisión.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(activeComision.acciones || []).map(acc => {
                        const isTaken = acc.socioId !== null;
                        const isMySignUp = mySignedUpItems.includes(acc.id);

                        return (
                          <div 
                            key={acc.id}
                            className={`p-4.5 border rounded-2xl flex flex-col justify-between gap-4 transition-all hover:shadow-sm ${
                              isMySignUp ? 'bg-emerald-50/20 border-emerald-350' :
                              isTaken ? 'bg-slate-50/60 border-slate-100 opacity-90' :
                              'bg-white border-slate-200 hover:border-slate-350'
                            }`}
                          >
                            <div className="space-y-2">
                              <p className="text-xs font-bold text-slate-700 leading-normal">
                                {acc.descripcion}
                              </p>
                              {isTaken && (
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  <span className="flex items-center space-x-1.5">
                                    <User size={12} className="text-slate-400" />
                                    <span>Voluntario: <span className="text-blue-900 font-extrabold">{acc.socioNombre}</span></span>
                                  </span>
                                  {acc.socioTelefono && (
                                    <span className="flex items-center space-x-1.5">
                                      <Phone size={12} className="text-slate-400" />
                                      <a href={`tel:${acc.socioTelefono}`} className="text-slate-500 hover:underline">{acc.socioTelefono}</a>
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Action Button */}
                            <div className="flex items-center pt-2.5 border-t border-slate-50">
                              {isMySignUp ? (
                                <button
                                  type="button"
                                  onClick={() => handleCancelSupport(activeComision.id, acc.id, 'accion')}
                                  className="w-full inline-flex items-center justify-center space-x-1.5 bg-red-50 hover:bg-red-105 text-red-750 text-[10px] font-black px-3.5 py-2.5 rounded-xl border border-red-200 transition-all uppercase tracking-wider"
                                >
                                  <X size={12} />
                                  <span>Cancelar mi apoyo</span>
                                </button>
                              ) : isTaken ? (
                                <div className="w-full inline-flex items-center justify-center space-x-1 text-slate-500 bg-slate-100 text-[10px] font-black px-3 py-2.5 rounded-xl border border-slate-200">
                                  <Check size={12} className="text-emerald-500 stroke-[2.5]" />
                                  <span>Cubierto</span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenSignUp(activeComision.id, acc.id, 'accion', acc.descripcion)}
                                  className="w-full inline-flex items-center justify-center space-x-1.5 bg-blue-900 hover:bg-blue-800 text-white text-[10px] font-black px-3.5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-900/10 active:scale-[0.98] uppercase tracking-wider"
                                >
                                  <span>🙋‍♂️ Ofrecerme</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Materiales e Insumos */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                    <Package size={16} className="text-blue-900 stroke-[2.5]" />
                    <span className="text-xs font-black text-slate-805 uppercase tracking-widest">Materiales e Insumos Requeridos ({(activeComision.necesidades || []).length})</span>
                  </div>

                  {(activeComision.necesidades || []).length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">No hay materiales requeridos en esta comisión.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(activeComision.necesidades || []).map(nec => {
                        const isTaken = nec.socioId !== null;
                        const isMySignUp = mySignedUpItems.includes(nec.id);

                        return (
                          <div 
                            key={nec.id}
                            className={`p-4.5 border rounded-2xl flex flex-col justify-between gap-4 transition-all hover:shadow-sm ${
                              isMySignUp ? 'bg-emerald-50/20 border-emerald-350' :
                              isTaken ? 'bg-slate-50/60 border-slate-100 opacity-90' :
                              'bg-white border-slate-200 hover:border-slate-350'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-900 rounded-md text-[9px] font-black shrink-0">
                                  Cant. {nec.cantidad}
                                </span>
                                <p className="text-xs font-bold text-slate-700 leading-normal">{nec.descripcion}</p>
                              </div>
                              
                              {isTaken && (
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  <span className="flex items-center space-x-1.5">
                                    <User size={12} className="text-slate-400" />
                                    <span>Voluntario: <span className="text-blue-900 font-extrabold">{nec.socioNombre}</span></span>
                                  </span>
                                  {nec.socioTelefono && (
                                    <span className="flex items-center space-x-1.5">
                                      <Phone size={12} className="text-slate-400" />
                                      <a href={`tel:${nec.socioTelefono}`} className="text-slate-500 hover:underline">{nec.socioTelefono}</a>
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Action Button */}
                            <div className="flex items-center pt-2.5 border-t border-slate-55">
                              {isMySignUp ? (
                                <button
                                  type="button"
                                  onClick={() => handleCancelSupport(activeComision.id, nec.id, 'necesidad')}
                                  className="w-full inline-flex items-center justify-center space-x-1.5 bg-red-50 hover:bg-red-105 text-red-755 text-[10px] font-black px-3.5 py-2.5 rounded-xl border border-red-200 transition-all uppercase tracking-wider"
                                >
                                  <X size={12} />
                                  <span>Cancelar apoyo</span>
                                </button>
                              ) : isTaken ? (
                                <div className="w-full inline-flex items-center justify-center space-x-1 text-slate-500 bg-slate-105 text-[10px] font-black px-3 py-2.5 rounded-xl border border-slate-200">
                                  <Check size={12} className="text-emerald-500 stroke-[2.5]" />
                                  <span>Cubierto</span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenSignUp(activeComision.id, nec.id, 'necesidad', nec.descripcion, nec.cantidad)}
                                  className="w-full inline-flex items-center justify-center space-x-1.5 bg-blue-900 hover:bg-blue-800 text-white text-[10px] font-black px-3.5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-900/10 active:scale-[0.98] uppercase tracking-wider"
                                >
                                  <span>📦 Aportar</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

            </div>
          </div>
        </div>
      ) : null}
    </div>

      {/* SIGN UP DIALOG / BOTTOM MODAL */}
      {modalOpen && selectedItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          {/* Modal box */}
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-6 shadow-2xl border border-slate-100 animate-in slide-in-from-bottom duration-300">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">🙋‍♂️ Registrar mi Apoyo</h4>
              <button 
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Selected item description */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                {selectedItem.type === 'accion' ? 'Tarea a realizar' : 'Recurso a aportar'}
              </span>
              <div className="text-xs font-semibold text-slate-700 leading-normal flex items-start space-x-2">
                {selectedItem.type === 'necesidad' && (
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-900 text-[10px] font-black rounded-md shrink-0">
                    Cant. {selectedItem.cantidad}
                  </span>
                )}
                <span>{selectedItem.descripcion}</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Tu Nombre y Apellido *</label>
                <input 
                  type="text"
                  required
                  value={volNombre}
                  onChange={(e) => setVolNombre(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full px-4 py-3 text-xs font-semibold bg-slate-50/50 border border-slate-205 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-900 transition-all outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Tu Número de Teléfono *</label>
                <input 
                  type="tel"
                  required
                  value={volTelefono}
                  onChange={(e) => setVolTelefono(e.target.value)}
                  placeholder="Ej. 55554433"
                  className="w-full px-4 py-3 text-xs font-semibold bg-slate-50/50 border border-slate-205 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-900 transition-all outline-none"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-blue-900 hover:bg-blue-800 text-white font-black text-xs rounded-xl uppercase tracking-wider transition-all shadow-lg shadow-blue-900/10 active:scale-[0.98]"
                >
                  Confirmar mi Apoyo
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl uppercase tracking-wider transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default RequerimientoPublico;
