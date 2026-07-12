import React, { useState, useMemo } from 'react';
import { Socio, UserRole, RequerimientoActividad, ComisionRequerimiento, TareaVoluntario, MaterialNecesidad } from '../types';
import { useClubData } from '../context/ClubDataContext';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import { firebaseService } from '../services/firebaseService';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  MapPin, 
  Clock, 
  ArrowLeft, 
  ClipboardCheck, 
  ClipboardList, 
  Package, 
  ListTodo, 
  Check, 
  X,
  Layers,
  Sparkles,
  Share2,
  Link
} from 'lucide-react';
import { formatDisplayDate } from '../utils/dateSpanishFormatter';

interface RequerimientosActividadesProps {
  user: Socio;
}

export const RequerimientosActividades: React.FC<RequerimientosActividadesProps> = ({ user }) => {
  const { requerimientosActividades, comisiones } = useClubData();
  const { showAlert, showConfirm } = useModal();
  const { showToast } = useToast();

  const getShareUrl = (reqId: string) => {
    return `${window.location.origin}${window.location.pathname}#/convocatoria/${reqId}`;
  };

  const handleCopyLink = (reqId: string) => {
    const url = getShareUrl(reqId);
    navigator.clipboard.writeText(url);
    showToast('Enlace copiado al portapapeles', 'success');
  };

  const handleShareWhatsApp = (req: RequerimientoActividad) => {
    const url = getShareUrl(req.id);
    const text = `¡Hola! Te invito a apoyarnos como voluntario en la actividad "${req.tituloActividad}" del Club de Leones Quetzaltenango. Puedes ver las tareas y materiales necesarios y apuntarte aquí: ${url}`;
    const encodedText = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
  };

  const [activeSubTab, setActiveSubTab] = useState<'lista' | 'nuevo' | 'detalle'>('lista');
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [filterEstado, setFilterEstado] = useState<'Todas' | 'Activa' | 'Borrador' | 'Cerrada'>('Todas');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formId, setFormId] = useState<string | null>(null);
  const [tituloActividad, setTituloActividad] = useState('');
  const [comisionCreadoraId, setComisionCreadoraId] = useState('');
  const [fechaActividad, setFechaActividad] = useState('');
  const [lugarActividad, setLugarActividad] = useState('');
  const [descripcionActividad, setDescripcionActividad] = useState('');
  const [fechaLimiteConvocatoria, setFechaLimiteConvocatoria] = useState('');
  const [estadoActividad, setEstadoActividad] = useState<'Borrador' | 'Activa' | 'Cerrada'>('Activa');
  const [comisionesRequeridas, setComisionesRequeridas] = useState<ComisionRequerimiento[]>([]);

  // Helpers to add/remove dynamic fields in Form
  const [tempComisionNombre, setTempComisionNombre] = useState('');
  const [tempComisionObjetivo, setTempComisionObjetivo] = useState('');

  // Check if user is admin
  const isAdministrative = useMemo(() => {
    return (
      user.rol === UserRole.SUPER_ADMIN ||
      user.rol === UserRole.SECRETARIO ||
      user.rol === UserRole.ASESOR_SERVICIOS ||
      user.rol === UserRole.PRESIDENTE_AFILIACION
    );
  }, [user.rol]);

  // Filtered requirements list
  const filteredReqs = useMemo(() => {
    return (requerimientosActividades || []).filter(req => {
      const matchEstado = filterEstado === 'Todas' || req.estado === filterEstado;
      const matchSearch = req.tituloActividad.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          req.comisionCreadoraNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          req.descripcionActividad.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Regular members only see active convocations
      if (!isAdministrative) {
        return req.estado === 'Activa' && matchSearch;
      }
      return matchEstado && matchSearch;
    }).sort((a, b) => new Date(a.fechaActividad).getTime() - new Date(b.fechaActividad).getTime());
  }, [requerimientosActividades, filterEstado, searchQuery, isAdministrative]);

  const selectedReq = useMemo(() => {
    return (requerimientosActividades || []).find(r => r.id === selectedReqId) || null;
  }, [requerimientosActividades, selectedReqId]);

  // Open creation form
  const handleOpenNuevo = () => {
    setFormId(null);
    setTituloActividad('');
    setComisionCreadoraId('');
    setFechaActividad('');
    setLugarActividad('');
    setDescripcionActividad('');
    setFechaLimiteConvocatoria('');
    setEstadoActividad('Activa');
    setComisionesRequeridas([]);
    setTempComisionNombre('');
    setTempComisionObjetivo('');
    setActiveSubTab('nuevo');
  };

  // Open edit form
  const handleOpenEditar = (req: RequerimientoActividad) => {
    setFormId(req.id);
    setTituloActividad(req.tituloActividad);
    setComisionCreadoraId(req.comisionCreadoraId);
    setFechaActividad(req.fechaActividad);
    setLugarActividad(req.lugarActividad);
    setDescripcionActividad(req.descripcionActividad);
    setFechaLimiteConvocatoria(req.fechaLimiteConvocatoria);
    setEstadoActividad(req.estado);
    setComisionesRequeridas(JSON.parse(JSON.stringify(req.comisionesRequeridas || []))); // Deep copy
    setActiveSubTab('nuevo');
  };

  // Add sub-commission to the sheet
  const handleAddComisionRequerida = () => {
    if (!tempComisionNombre.trim()) {
      showAlert('Atención', 'Ingresa el nombre de la comisión requerida.');
      return;
    }
    const newCom: ComisionRequerimiento = {
      id: `com-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      nombreComision: tempComisionNombre,
      objetivo: tempComisionObjetivo,
      acciones: [],
      necesidades: []
    };
    setComisionesRequeridas(prev => [...prev, newCom]);
    setTempComisionNombre('');
    setTempComisionObjetivo('');
    showToast('Comisión agregada a la lista', 'info');
  };

  // Remove sub-commission from form
  const handleRemoveComisionRequerida = (id: string) => {
    setComisionesRequeridas(prev => prev.filter(c => c.id !== id));
  };

  // Add action/task to a sub-commission in form
  const handleAddAccion = (comId: string, desc: string) => {
    if (!desc.trim()) return;
    setComisionesRequeridas(prev => prev.map(c => {
      if (c.id === comId) {
        return {
          ...c,
          acciones: [...(c.acciones || []), {
            id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            descripcion: desc,
            socioId: null,
            socioNombre: null
          }]
        };
      }
      return c;
    }));
  };

  // Remove action/task from form
  const handleRemoveAccion = (comId: string, accId: string) => {
    setComisionesRequeridas(prev => prev.map(c => {
      if (c.id === comId) {
        return {
          ...c,
          acciones: (c.acciones || []).filter(a => a.id !== accId)
        };
      }
      return c;
    }));
  };

  // Add material/need to a sub-commission in form
  const handleAddNecesidad = (comId: string, desc: string, cant: number) => {
    if (!desc.trim() || cant <= 0) return;
    setComisionesRequeridas(prev => prev.map(c => {
      if (c.id === comId) {
        return {
          ...c,
          necesidades: [...(c.necesidades || []), {
            id: `nec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            descripcion: desc,
            cantidad: cant,
            socioId: null,
            socioNombre: null,
            completado: false
          }]
        };
      }
      return c;
    }));
  };

  // Remove material/need from form
  const handleRemoveNecesidad = (comId: string, necId: string) => {
    setComisionesRequeridas(prev => prev.map(c => {
      if (c.id === comId) {
        return {
          ...c,
          necesidades: (c.necesidades || []).filter(n => n.id !== necId)
        };
      }
      return c;
    }));
  };

  // Save the Ficha to Firebase
  const handleSaveReq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloActividad.trim() || !comisionCreadoraId || !fechaActividad || !lugarActividad || !fechaLimiteConvocatoria) {
      showAlert('Error', 'Por favor completa todos los campos obligatorios (*).');
      return;
    }

    const comisionObj = comisiones.find(c => c.id === comisionCreadoraId);
    const comisionNombre = comisionObj ? comisionObj.nombre : 'Comisión General';

    const reqData: RequerimientoActividad = {
      id: formId || '',
      tituloActividad,
      comisionCreadoraId,
      comisionCreadoraNombre: comisionNombre,
      fechaActividad,
      lugarActividad,
      descripcionActividad,
      fechaLimiteConvocatoria,
      estado: estadoActividad,
      comisionesRequeridas,
      fechaCreacion: formId ? (requerimientosActividades.find(r => r.id === formId)?.fechaCreacion || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
      creadoPorNombre: formId ? (requerimientosActividades.find(r => r.id === formId)?.creadoPorNombre || user.nombre) : user.nombre
    };

    try {
      await firebaseService.saveRequerimientoActividad(reqData);
      showToast(formId ? 'Ficha de requerimientos actualizada' : 'Ficha de requerimientos creada', 'success');
      setActiveSubTab('lista');
    } catch (err) {
      console.error(err);
      showAlert('Error', 'No se pudo guardar la ficha de requerimientos.');
    }
  };

  // Delete Ficha
  const handleDeleteReq = async (id: string) => {
    if (await showConfirm('Eliminar Requerimiento', '¿Estás seguro de eliminar esta ficha de requerimientos permanentemente?', { type: 'danger', confirmText: 'Eliminar', cancelText: 'Cancelar' })) {
      try {
        await firebaseService.deleteRequerimientoActividad(id);
        showToast('Ficha de requerimientos eliminada', 'success');
        if (selectedReqId === id) setSelectedReqId(null);
        setActiveSubTab('lista');
      } catch (err) {
        console.error(err);
        showAlert('Error', 'No se pudo eliminar el requerimiento.');
      }
    }
  };

  // Volunteer or unvolunteer for a task/need
  const handleVolunteerTask = async (req: RequerimientoActividad, comId: string, itemId: string, type: 'accion' | 'necesidad', join: boolean) => {
    const updatedComisiones = req.comisionesRequeridas.map(c => {
      if (c.id === comId) {
        if (type === 'accion') {
          return {
            ...c,
            acciones: (c.acciones || []).map(a => {
              if (a.id === itemId) {
                return {
                  ...a,
                  socioId: join ? user.id : null,
                  socioNombre: join ? user.nombre : null
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
                  socioId: join ? user.id : null,
                  socioNombre: join ? user.nombre : null,
                  completado: join
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
      showToast(join ? 'Te has apuntado con éxito. ¡Gracias por servir!' : 'Has cancelado tu apoyo para esta tarea.', join ? 'success' : 'info');
    } catch (err) {
      console.error(err);
      showAlert('Error', 'No se pudo actualizar tu postulación.');
    }
  };

  // Helper to calculate statistics of coverage
  const getCoverageStats = (req: RequerimientoActividad) => {
    let totalAcciones = 0;
    let cubiertasAcciones = 0;
    let totalNecesidades = 0;
    let cubiertasNecesidades = 0;

    (req.comisionesRequeridas || []).forEach(c => {
      totalAcciones += (c.acciones || []).length;
      cubiertasAcciones += (c.acciones || []).filter(a => a.socioId !== null).length;
      totalNecesidades += (c.necesidades || []).length;
      cubiertasNecesidades += (c.necesidades || []).filter(n => n.socioId !== null).length;
    });

    const totalItems = totalAcciones + totalNecesidades;
    const cubiertosItems = cubiertasAcciones + cubiertasNecesidades;
    const porcentaje = totalItems > 0 ? Math.round((cubiertosItems / totalItems) * 100) : 0;

    return {
      totalAcciones,
      cubiertasAcciones,
      totalNecesidades,
      cubiertasNecesidades,
      porcentaje
    };
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 p-6 md:p-8">
      
      {/* HEADER CONTROLS */}
      {activeSubTab === 'lista' && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2.5 bg-blue-50 text-blue-900 rounded-2xl">
                <ClipboardList size={22} className="stroke-[2.5]" />
              </span>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Fichas de Requerimientos de Actividades</h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  {isAdministrative 
                    ? 'Convoca y gestiona el apoyo de los socios leones en comisiones y tareas.' 
                    : 'Apóyanos sumándote a las necesidades y tareas de las próximas actividades.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-4 top-3 text-slate-400" size={16} />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar convocatoria..."
                className="w-full pl-10 pr-4 py-2 text-xs font-semibold bg-slate-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-900 transition-all outline-none"
              />
            </div>

            {/* Filter by Estado for Admins */}
            {isAdministrative && (
              <select 
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value as any)}
                className="px-4 py-2 text-xs font-bold bg-slate-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-900 transition-all outline-none cursor-pointer"
              >
                <option value="Todas">Todos los Estados</option>
                <option value="Activa">Activas</option>
                <option value="Borrador">Borradores</option>
                <option value="Cerrada">Cerradas</option>
              </select>
            )}

            {/* Create Button */}
            {isAdministrative && (
              <button
                type="button"
                onClick={handleOpenNuevo}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-850 hover:to-indigo-850 text-white text-xs font-black px-4 py-2.5 rounded-2xl transition-all shadow-md shadow-blue-900/10 scale-100 active:scale-95"
              >
                <Plus size={15} className="stroke-[3]" />
                <span>Nueva Ficha</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 1. LIST VIEW */}
      {activeSubTab === 'lista' && (
        <div className="mt-6">
          {filteredReqs.length === 0 ? (
            <div className="p-16 text-center border-2 border-dashed border-slate-100 rounded-3xl">
              <div className="w-16 h-16 bg-blue-50 text-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardCheck size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-800">No hay convocatorias disponibles</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-2 font-medium">
                {isAdministrative 
                  ? 'Crea una nueva ficha de requerimiento para convocar a los socios en las comisiones de trabajo.' 
                  : 'Pronto publicaremos requerimientos de actividades de servicio. ¡Vuelve más tarde!'}
              </p>
              {isAdministrative && (
                <button
                  type="button"
                  onClick={handleOpenNuevo}
                  className="mt-6 inline-flex items-center space-x-2 bg-blue-900 hover:bg-blue-850 text-white text-xs font-black px-5 py-3 rounded-2xl transition-all shadow-lg"
                >
                  <Plus size={16} />
                  <span>Crear primera Ficha</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredReqs.map(req => {
                const stats = getCoverageStats(req);
                return (
                  <div 
                    key={req.id} 
                    className="group border border-slate-100 bg-slate-50/20 hover:bg-white hover:shadow-xl hover:shadow-slate-100/70 p-6 rounded-3xl transition-all duration-300 relative overflow-hidden"
                  >
                    {/* Status Badge */}
                    <div className="absolute right-6 top-6">
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                        req.estado === 'Activa' ? 'bg-emerald-100 text-emerald-800' :
                        req.estado === 'Borrador' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {req.estado}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* Commission and Title */}
                      <div>
                        <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest block mb-1">
                          Coordinado por {req.comisionCreadoraNombre}
                        </span>
                        <h3 className="text-base md:text-lg font-black text-slate-800 group-hover:text-blue-900 transition-colors pr-16 line-clamp-1">
                          {req.tituloActividad}
                        </h3>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                        {req.descripcionActividad || 'Sin descripción detallada.'}
                      </p>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 gap-4 text-slate-600 border-t border-b border-slate-100 py-3">
                        <div className="flex items-center space-x-2">
                          <Calendar size={14} className="text-slate-400" />
                          <span className="text-xs font-semibold truncate">{formatDisplayDate(req.fechaActividad)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin size={14} className="text-slate-400" />
                          <span className="text-xs font-semibold truncate">{req.lugarActividad}</span>
                        </div>
                      </div>

                      {/* Progress Bar of Coverage */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Cobertura de Apoyo</span>
                          <span className="text-xs font-black text-blue-900">{stats.porcentaje}% ({stats.cubiertasAcciones + stats.cubiertasNecesidades}/{stats.totalAcciones + stats.totalNecesidades})</span>
                        </div>
                        <div className="w-full bg-slate-150 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-blue-900 to-indigo-900 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${stats.porcentaje}%` }}
                          />
                        </div>
                      </div>

                      {/* Bottom actions */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center justify-center p-1.5 bg-blue-50 text-blue-900 rounded-lg">
                            <Layers size={12} />
                          </span>
                          <span className="text-xs font-bold text-slate-500">{(req.comisionesRequeridas || []).length} áreas requeridas</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          {isAdministrative && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditar(req)}
                                className="p-2 text-slate-500 hover:text-blue-900 hover:bg-slate-50 rounded-xl transition-all"
                                title="Editar"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteReq(req.id)}
                                className="p-2 text-slate-500 hover:text-red-650 hover:bg-slate-50 rounded-xl transition-all"
                                title="Eliminar"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReqId(req.id);
                              setActiveSubTab('detalle');
                            }}
                            className="bg-blue-900 text-white hover:bg-blue-800 text-xs font-black px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-900/10"
                          >
                            {isAdministrative ? 'Ver y Gestionar' : '🙋‍♂️ Ver y Apuntarme'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. FORM VIEW (CREACIÓN / EDICIÓN) */}
      {activeSubTab === 'nuevo' && isAdministrative && (
        <form onSubmit={handleSaveReq} className="space-y-8">
          {/* Header Form */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <button 
                type="button"
                onClick={() => setActiveSubTab('lista')}
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h3 className="text-lg md:text-xl font-black text-slate-800">
                  {formId ? 'Editar Ficha de Requerimientos' : 'Crear Ficha de Requerimientos'}
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Establece los requerimientos de la actividad y publica la convocatoria.
                </p>
              </div>
            </div>
          </div>

          {/* Basic Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/20 p-6 rounded-3xl border border-slate-100">
            <div className="md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Título de la Actividad *</label>
              <input 
                type="text"
                required
                value={tituloActividad}
                onChange={(e) => setTituloActividad(e.target.value)}
                placeholder="Ej. Fiesta de Protocolo Cambio de Junta Directiva"
                className="w-full px-4 py-3 text-xs font-semibold bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-900 transition-all outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Comisión Principal Organizadora *</label>
              <select 
                required
                value={comisionCreadoraId}
                onChange={(e) => setComisionCreadoraId(e.target.value)}
                className="w-full px-4 py-3 text-xs font-semibold bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-900 transition-all outline-none cursor-pointer"
              >
                <option value="">-- Selecciona la Comisión --</option>
                {comisiones.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Estado de la Convocatoria *</label>
              <select 
                required
                value={estadoActividad}
                onChange={(e) => setEstadoActividad(e.target.value as any)}
                className="w-full px-4 py-3 text-xs font-semibold bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-900 transition-all outline-none cursor-pointer"
              >
                <option value="Borrador">Borrador (No visible para socios)</option>
                <option value="Activa">Activa (Visible para socios)</option>
                <option value="Cerrada">Cerrada (Convocatoria terminada)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Fecha de la Actividad *</label>
              <input 
                type="date"
                required
                value={fechaActividad}
                onChange={(e) => setFechaActividad(e.target.value)}
                className="w-full px-4 py-3 text-xs font-semibold bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-900 transition-all outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Fecha Límite para Apuntarse *</label>
              <input 
                type="date"
                required
                value={fechaLimiteConvocatoria}
                onChange={(e) => setFechaLimiteConvocatoria(e.target.value)}
                className="w-full px-4 py-3 text-xs font-semibold bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-900 transition-all outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Lugar de la Actividad *</label>
              <input 
                type="text"
                required
                value={lugarActividad}
                onChange={(e) => setLugarActividad(e.target.value)}
                placeholder="Ej. Sede La Cueva, Quetzaltenango"
                className="w-full px-4 py-3 text-xs font-semibold bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-900 transition-all outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Descripción del Evento</label>
              <textarea 
                rows={3}
                value={descripcionActividad}
                onChange={(e) => setDescripcionActividad(e.target.value)}
                placeholder="Escribe detalles del evento para motivar el apoyo de los Leones..."
                className="w-full px-4 py-3 text-xs font-semibold bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-900 transition-all outline-none resize-none"
              />
            </div>
          </div>

          {/* DYNAMIC COMISIONES REQUERIDAS SECTION */}
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-black text-slate-800 flex items-center space-x-2">
                <Layers size={16} className="text-blue-900" />
                <span>Estructura de Áreas o Comisiones Internas Requeridas</span>
              </h4>
              <p className="text-xs text-slate-400 mt-1 font-medium">Agrega las diferentes comisiones internas que tendrán tareas o requerirán materiales.</p>
            </div>

            {/* Add Comision box */}
            <div className="bg-slate-50/40 border border-slate-100 p-6 rounded-3xl space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Nombre del Área / Comisión Requerida</label>
                  <input 
                    type="text"
                    value={tempComisionNombre}
                    onChange={(e) => setTempComisionNombre(e.target.value)}
                    placeholder="Ej. Comisión de Protocolo y Agenda"
                    className="w-full px-4 py-2.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Objetivo o Propósito del Área</label>
                  <input 
                    type="text"
                    value={tempComisionObjetivo}
                    onChange={(e) => setTempComisionObjetivo(e.target.value)}
                    placeholder="Ej. Garantizar la solemnidad y orden..."
                    className="w-full px-4 py-2.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 transition-all outline-none"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddComisionRequerida}
                className="inline-flex items-center space-x-1.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-900/10"
              >
                <Plus size={14} />
                <span>Agregar Área Requerida</span>
              </button>
            </div>

            {/* List of currently added sub-commissions */}
            {comisionesRequeridas.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/10 border border-slate-100 rounded-3xl text-slate-400 text-xs italic font-medium">
                No has agregado áreas de comisiones todavía. Añade al menos una arriba.
              </div>
            ) : (
              <div className="space-y-6">
                {comisionesRequeridas.map((c, cIdx) => (
                  <div key={c.id} className="border border-slate-200 p-6 rounded-3xl space-y-6 bg-white shadow-sm relative">
                    <button
                      type="button"
                      onClick={() => handleRemoveComisionRequerida(c.id)}
                      className="absolute right-6 top-6 p-2 text-slate-405 hover:text-red-600 hover:bg-slate-50 rounded-xl transition-all"
                      title="Quitar Comisión"
                    >
                      <X size={16} />
                    </button>

                    {/* Subcomision Header */}
                    <div>
                      <span className="text-[9px] font-black bg-blue-50 text-blue-900 px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                        Área #{cIdx + 1}
                      </span>
                      <h5 className="text-base font-black text-slate-800">{c.nombreComision}</h5>
                      {c.objetivo && (
                        <p className="text-xs text-slate-500 font-semibold mt-1">Objetivo: {c.objetivo}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                      
                      {/* Left: Tareas (Actions) */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <h6 className="text-xs font-black text-slate-800 flex items-center space-x-1.5">
                            <ListTodo size={14} className="text-blue-900" />
                            <span>Tareas a Realizar (Apoyo)</span>
                          </h6>
                        </div>

                        {/* Add Tarea mini-form */}
                        <div className="flex space-x-2">
                          <input 
                            type="text"
                            placeholder="Añadir una tarea a realizar..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddAccion(c.id, e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                            className="flex-1 px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-900"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                              handleAddAccion(c.id, input.value);
                              input.value = '';
                            }}
                            className="bg-blue-900 hover:bg-blue-800 text-white px-3 py-2 rounded-xl text-xs font-bold"
                          >
                            Agregar
                          </button>
                        </div>

                        {/* Tareas List */}
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                          {(c.acciones || []).length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic font-semibold py-2">No hay tareas agregadas en esta comisión.</p>
                          ) : (
                            (c.acciones || []).map(acc => (
                              <div key={acc.id} className="flex items-center justify-between p-2.5 bg-slate-50/60 border border-slate-100 rounded-xl">
                                <span className="text-xs font-semibold text-slate-700 pr-4">{acc.descripcion}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAccion(c.id, acc.id)}
                                  className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Right: Necesidades (Materials) */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <h6 className="text-xs font-black text-slate-800 flex items-center space-x-1.5">
                            <Package size={14} className="text-blue-900" />
                            <span>Materiales o Recursos Necesarios</span>
                          </h6>
                        </div>

                        {/* Add Necesidad mini-form */}
                        <div className="flex space-x-2">
                          <input 
                            type="text"
                            placeholder="Descripción del material..."
                            id={`desc-nec-${c.id}`}
                            className="flex-1 px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-900"
                          />
                          <input 
                            type="number"
                            placeholder="Cant."
                            defaultValue={1}
                            min={1}
                            id={`cant-nec-${c.id}`}
                            className="w-16 px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-900"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const descInput = document.getElementById(`desc-nec-${c.id}`) as HTMLInputElement;
                              const cantInput = document.getElementById(`cant-nec-${c.id}`) as HTMLInputElement;
                              handleAddNecesidad(c.id, descInput.value, parseInt(cantInput.value) || 1);
                              descInput.value = '';
                              cantInput.value = '1';
                            }}
                            className="bg-blue-900 hover:bg-blue-800 text-white px-3 py-2 rounded-xl text-xs font-bold"
                          >
                            Agregar
                          </button>
                        </div>

                        {/* Necesidades List */}
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                          {(c.necesidades || []).length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic font-semibold py-2">No hay materiales agregados en esta comisión.</p>
                          ) : (
                            (c.necesidades || []).map(nec => (
                              <div key={nec.id} className="flex items-center justify-between p-2.5 bg-slate-50/60 border border-slate-100 rounded-xl">
                                <div className="flex items-center space-x-2">
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-900 rounded-md text-[10px] font-black">
                                    Cant. {nec.cantidad}
                                  </span>
                                  <span className="text-xs font-semibold text-slate-700">{nec.descripcion}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveNecesidad(c.id, nec.id)}
                                  className="text-slate-400 hover:text-red-650 p-1 transition-colors"
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
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveSubTab('lista')}
              className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3.5 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-850 hover:to-indigo-850 text-white font-black text-xs rounded-xl transition-all shadow-lg"
            >
              {formId ? 'Guardar Cambios' : 'Publicar Convocatoria'}
            </button>
          </div>
        </form>
      )}

      {/* 3. DETAILS / VOLUNTEER VIEW */}
      {activeSubTab === 'detalle' && selectedReq && (
        <div className="space-y-8">
          {/* Header Detalle */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-start space-x-3">
              <button 
                type="button"
                onClick={() => setActiveSubTab('lista')}
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all mt-1"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <span className="text-[10px] font-black bg-blue-50 text-blue-900 px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                  Convocada por {selectedReq.comisionCreadoraNombre}
                </span>
                <h3 className="text-xl md:text-2xl font-black text-slate-800">{selectedReq.tituloActividad}</h3>
                
                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-4 text-slate-500 text-xs font-semibold mt-2.5">
                  <div className="flex items-center space-x-1.5">
                    <Calendar size={14} className="text-slate-400" />
                    <span>{formatDisplayDate(selectedReq.fechaActividad)}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <MapPin size={14} className="text-slate-400" />
                    <span>{selectedReq.lugarActividad}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Clock size={14} className="text-slate-400" />
                    <span>Límite convocatoria: {formatDisplayDate(selectedReq.fechaLimiteConvocatoria)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side stats or actions */}
            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Estado de cobertura</span>
                <span className="text-lg font-black text-blue-900">
                  {getCoverageStats(selectedReq).porcentaje}% Completado
                </span>
              </div>

              {/* Share actions */}
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleCopyLink(selectedReq.id)}
                  className="inline-flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold px-3 py-2 rounded-xl border border-blue-200 transition-all"
                  title="Copiar enlace público de la convocatoria"
                >
                  <Link size={12} />
                  <span>Compartir Enlace</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(selectedReq)}
                  className="inline-flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-2 rounded-xl border border-emerald-200 transition-all"
                  title="Compartir por WhatsApp"
                >
                  <Share2 size={12} />
                  <span>WhatsApp</span>
                </button>
              </div>
              
              {isAdministrative && (
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditar(selectedReq)}
                    className="inline-flex items-center space-x-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 transition-all"
                  >
                    <Edit size={12} />
                    <span>Editar Ficha</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteReq(selectedReq.id)}
                    className="inline-flex items-center space-x-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold px-3 py-2 rounded-xl border border-red-200 transition-all"
                  >
                    <Trash2 size={12} />
                    <span>Eliminar</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {selectedReq.descripcionActividad && (
            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Descripción de la Actividad</h4>
              <p className="text-sm font-semibold text-slate-700 leading-relaxed">{selectedReq.descripcionActividad}</p>
            </div>
          )}

          {/* Dynamic Commissions and volunteering cards */}
          <div className="space-y-8">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-blue-50 text-blue-900 rounded-lg">
                <Sparkles size={14} className="text-blue-900" />
              </span>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                Apúntate a las Comisiones Requeridas
              </h4>
            </div>

            {(selectedReq.comisionesRequeridas || []).length === 0 ? (
              <p className="text-xs text-slate-400 italic font-medium p-8 text-center border border-slate-100 rounded-3xl">
                No hay áreas o subcomisiones declaradas en este requerimiento.
              </p>
            ) : (
              <div className="space-y-6">
                {(selectedReq.comisionesRequeridas || []).map((com) => {
                  const numAccionesCubiertas = (com.acciones || []).filter(a => a.socioId !== null).length;
                  const numNecesidadesCubiertas = (com.necesidades || []).filter(n => n.socioId !== null).length;

                  return (
                    <div 
                      key={com.id} 
                      className="border border-slate-200 bg-white hover:border-slate-350 rounded-3xl overflow-hidden shadow-sm transition-all"
                    >
                      {/* Subcomision Title Header */}
                      <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-4 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <h5 className="text-base font-black text-slate-800 flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 bg-blue-900 rounded-full inline-block" />
                            <span>{com.nombreComision}</span>
                          </h5>
                          {com.objetivo && (
                            <p className="text-xs text-slate-500 font-semibold mt-1 pr-4">{com.objetivo}</p>
                          )}
                        </div>
                        <div className="flex shrink-0">
                          <span className="text-[10px] font-black bg-blue-50 text-blue-900 px-3 py-1.5 rounded-full uppercase tracking-wider">
                            {numAccionesCubiertas + numNecesidadesCubiertas} / {(com.acciones || []).length + (com.necesidades || []).length} cubiertos
                          </span>
                        </div>
                      </div>

                      {/* Content split in Actions and Needs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                        
                        {/* Tasks Column */}
                        <div className="p-6 space-y-4">
                          <div className="flex items-center space-x-2 pb-2 border-b border-slate-50">
                            <ListTodo size={14} className="text-blue-900 stroke-[2.5]" />
                            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Tareas de Trabajo ({(com.acciones || []).length})</span>
                          </div>

                          {(com.acciones || []).length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-4">No hay tareas listadas para esta área.</p>
                          ) : (
                            <div className="space-y-3">
                              {(com.acciones || []).map(acc => {
                                const isVolunteered = acc.socioId !== null;
                                const isMe = acc.socioId === user.id;

                                return (
                                  <div 
                                    key={acc.id} 
                                    className={`p-3.5 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                                      isMe ? 'bg-blue-50/40 border-blue-200' :
                                      isVolunteered ? 'bg-slate-50/50 border-slate-100 opacity-80' :
                                      'bg-white border-slate-200 hover:border-slate-300'
                                    }`}
                                  >
                                    <div className="flex-1">
                                      <p className="text-xs font-semibold text-slate-700 leading-normal">{acc.descripcion}</p>
                                      {isVolunteered && (
                                        <div className="flex items-center space-x-1.5 mt-2">
                                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
                                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                            Asignado a: <span className="text-blue-900">{acc.socioNombre} {isMe && '(Tú)'} {acc.socioTelefono && `(Tel: ${acc.socioTelefono})`}</span>
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Action button */}
                                    <div className="shrink-0 flex items-center">
                                      {isMe ? (
                                        <button
                                          type="button"
                                          onClick={() => handleVolunteerTask(selectedReq, com.id, acc.id, 'accion', false)}
                                          className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-black px-3.5 py-2 rounded-xl border border-red-200 transition-all"
                                        >
                                          <X size={12} />
                                          <span>Cancelar mi apoyo</span>
                                        </button>
                                      ) : isVolunteered ? (
                                        <div className="inline-flex items-center space-x-1 text-slate-500 bg-slate-105 text-[10px] font-black px-3 py-1.5 rounded-xl border border-slate-200">
                                          <Check size={12} className="text-emerald-500" />
                                          <span>Cubierto</span>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleVolunteerTask(selectedReq, com.id, acc.id, 'accion', true)}
                                          className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 bg-blue-900 hover:bg-blue-800 text-white text-[10px] font-black px-3.5 py-2 rounded-xl transition-all shadow-md shadow-blue-900/10 scale-100 active:scale-95"
                                        >
                                          <span>🙋‍♂️ Apuntarme</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Needs Column */}
                        <div className="p-6 space-y-4">
                          <div className="flex items-center space-x-2 pb-2 border-b border-slate-50">
                            <Package size={14} className="text-blue-900 stroke-[2.5]" />
                            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Materiales y Recursos ({(com.necesidades || []).length})</span>
                          </div>

                          {(com.necesidades || []).length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-4">No hay materiales listados para esta área.</p>
                          ) : (
                            <div className="space-y-3">
                              {(com.necesidades || []).map(nec => {
                                const isVolunteered = nec.socioId !== null;
                                const isMe = nec.socioId === user.id;

                                return (
                                  <div 
                                    key={nec.id} 
                                    className={`p-3.5 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                                      isMe ? 'bg-blue-50/40 border-blue-200' :
                                      isVolunteered ? 'bg-slate-50/50 border-slate-100 opacity-80' :
                                      'bg-white border-slate-200 hover:border-slate-300'
                                    }`}
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2">
                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-900 rounded-md text-[9px] font-black">
                                          Cant. {nec.cantidad}
                                        </span>
                                        <p className="text-xs font-semibold text-slate-700 leading-normal">{nec.descripcion}</p>
                                      </div>
                                      {isVolunteered && (
                                        <div className="flex items-center space-x-1.5 mt-2">
                                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
                                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                            Aportará: <span className="text-blue-900">{nec.socioNombre} {isMe && '(Tú)'} {nec.socioTelefono && `(Tel: ${nec.socioTelefono})`}</span>
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Action button */}
                                    <div className="shrink-0 flex items-center">
                                      {isMe ? (
                                        <button
                                          type="button"
                                          onClick={() => handleVolunteerTask(selectedReq, com.id, nec.id, 'necesidad', false)}
                                          className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-black px-3.5 py-2 rounded-xl border border-red-200 transition-all"
                                        >
                                          <X size={12} />
                                          <span>Cancelar mi apoyo</span>
                                        </button>
                                      ) : isVolunteered ? (
                                        <div className="inline-flex items-center space-x-1 text-slate-500 bg-slate-105 text-[10px] font-black px-3 py-1.5 rounded-xl border border-slate-200">
                                          <Check size={12} className="text-emerald-500" />
                                          <span>Cubierto</span>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleVolunteerTask(selectedReq, com.id, nec.id, 'necesidad', true)}
                                          className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 bg-blue-900 hover:bg-blue-800 text-white text-[10px] font-black px-3.5 py-2 rounded-xl transition-all shadow-md shadow-blue-900/10 scale-100 active:scale-95"
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
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default RequerimientosActividades;
