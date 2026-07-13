import React, { useState, useMemo } from 'react';
import { 
  Plus, Calendar, Search, Filter, Edit, Trash2, Gift, Building, X, Loader2, Users, Check, Upload, ChevronLeft, ChevronRight, Phone
} from 'lucide-react';
import { Actividad, SolicitudVoluntario, RegistroParticipacion } from '../../types';
import { firebaseService } from '../../services/firebaseService';
import { useClubData } from '../../context/ClubDataContext';
import { useModal } from '../../context/ModalContext';
import { compressImageFile, validateImageFile } from '../../utils/imageCompressor';
import { formatDisplayDate } from '../../utils/dateSpanishFormatter';

export const AdminCalendario: React.FC = () => {
  const { 
    actividades: dbActividades, 
    voluntarios: dbVoluntarios 
  } = useClubData();

  const { showAlert, showConfirm } = useModal();

  const [actividades, setActividades] = useState<Actividad[]>(dbActividades);
  const [voluntarios, setVoluntarios] = useState<SolicitudVoluntario[]>(dbVoluntarios);
  const [participaciones, setParticipaciones] = useState<RegistroParticipacion[]>([]);
  const [loadingParticipaciones, setLoadingParticipaciones] = useState(false);

  React.useEffect(() => {
    setActividades(dbActividades);
  }, [dbActividades]);

  React.useEffect(() => {
    setVoluntarios(dbVoluntarios);
  }, [dbVoluntarios]);

  const fetchParticipaciones = async () => {
    setLoadingParticipaciones(true);
    try {
      const list = await firebaseService.getRegistroParticipaciones();
      setParticipaciones(list);
    } catch (error) {
      console.error("Error loading participations:", error);
    } finally {
      setLoadingParticipaciones(false);
    }
  };

  React.useEffect(() => {
    fetchParticipaciones();
  }, []);

  const [calendarioSubTab, setCalendarioSubTab] = useState<'lista' | 'voluntarios' | 'asistentes'>('lista');

  const [showAddActividad, setShowAddActividad] = useState(false);
  const [showEditActividad, setShowEditActividad] = useState(false);
  const [editingActividad, setEditingActividad] = useState<Actividad | null>(null);
  const [newActividad, setNewActividad] = useState({ 
    titulo: '', 
    descripcion: '', 
    fecha: '', 
    lugar: '', 
    publica: true,
    conBotonDonacion: false,
    donacionUrl: '',
    conBotonVoluntariado: true,
    conBotonAsistencia: false,
    costoSocio: '',
    costoInvitado: '',
    vestimenta: 'libre',
    imagen: ''
  });

  const [newActividadImageFile, setNewActividadImageFile] = useState<File | null>(null);
  const [editActividadImageFile, setEditActividadImageFile] = useState<File | null>(null);
  const [newActividadImagePreview, setNewActividadImagePreview] = useState<string | null>(null);
  const [editActividadImagePreview, setEditActividadImagePreview] = useState<string | null>(null);
  const [isSavingActividad, setIsSavingActividad] = useState(false);

  // Search & Filter
  const [actividadSearch, setActividadSearch] = useState('');
  const [actividadSort, setActividadSort] = useState<'recientes' | 'antiguas' | 'az' | 'za'>('recientes');
  const [actividadFilter, setActividadFilter] = useState<'Todas' | 'Publicas' | 'Privadas'>('Todas');

  const [voluntarioSearch, setVoluntarioSearch] = useState('');
  const [voluntarioFilterActividad, setVoluntarioFilterActividad] = useState('Todas');
  const [voluntarioFilterEstado, setVoluntarioFilterEstado] = useState('Todos');

  const [participacionSearch, setParticipacionSearch] = useState('');
  const [participacionFilterActividad, setParticipacionFilterActividad] = useState('Todas');

  // Pagination
  const [actividadesPage, setActividadesPage] = useState(1);
  const actividadesPerPage = 6;

  React.useEffect(() => {
    setActividadesPage(1);
  }, [actividadSearch, actividadSort, actividadFilter]);

  const filteredAndSortedActividades = useMemo(() => {
    let result = [...actividades];

    // Search filter
    if (actividadSearch.trim()) {
      const q = actividadSearch.toLowerCase();
      result = result.filter(act => 
        act.titulo.toLowerCase().includes(q) || 
        (act.descripcion && act.descripcion.toLowerCase().includes(q)) || 
        act.lugar.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (actividadFilter === 'Publicas') {
      result = result.filter(act => act.publica);
    } else if (actividadFilter === 'Privadas') {
      result = result.filter(act => !act.publica);
    }

    // Sort
    if (actividadSort === 'recientes') {
      result.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    } else if (actividadSort === 'antiguas') {
      result.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    } else if (actividadSort === 'az') {
      result.sort((a, b) => a.titulo.localeCompare(b.titulo));
    } else if (actividadSort === 'za') {
      result.sort((a, b) => b.titulo.localeCompare(a.titulo));
    }

    return result;
  }, [actividades, actividadSearch, actividadSort, actividadFilter]);

  const paginatedActividades = useMemo(() => {
    const startIndex = (actividadesPage - 1) * actividadesPerPage;
    return filteredAndSortedActividades.slice(startIndex, startIndex + actividadesPerPage);
  }, [filteredAndSortedActividades, actividadesPage]);

  const totalActividadesPages = useMemo(() => {
    return Math.ceil(filteredAndSortedActividades.length / actividadesPerPage);
  }, [filteredAndSortedActividades]);

  const filteredVoluntarios = useMemo(() => {
    let result = [...voluntarios];

    // Search filter
    if (voluntarioSearch.trim()) {
      const q = voluntarioSearch.toLowerCase();
      result = result.filter(v => 
        v.nombre.toLowerCase().includes(q) || 
        v.correo.toLowerCase().includes(q)
      );
    }

    // Activity filter
    if (voluntarioFilterActividad !== 'Todas') {
      result = result.filter(v => v.actividadId === voluntarioFilterActividad);
    }

    // Status filter
    if (voluntarioFilterEstado !== 'Todos') {
      result = result.filter(v => v.estado === voluntarioFilterEstado);
    }

    // Sort by registration date descending
    result.sort((a, b) => new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime());

    return result;
  }, [voluntarios, voluntarioSearch, voluntarioFilterActividad, voluntarioFilterEstado]);

  const filteredParticipaciones = useMemo(() => {
    let result = [...participaciones];
    if (participacionSearch.trim()) {
      const q = participacionSearch.toLowerCase();
      result = result.filter(p => 
        p.nombre.toLowerCase().includes(q) || 
        p.telefono.includes(q) ||
        p.actividadTitulo.toLowerCase().includes(q)
      );
    }
    if (participacionFilterActividad !== 'Todas') {
      result = result.filter(p => p.actividadId === participacionFilterActividad);
    }
    return result;
  }, [participaciones, participacionSearch, participacionFilterActividad]);

  const handleDeleteParticipacion = async (id: string) => {
    if (!(await showConfirm("Eliminar Confirmación", "¿Está seguro de eliminar esta confirmación de participación?", { type: 'danger', confirmText: 'Eliminar', cancelText: 'Cancelar' }))) return;
    try {
      await firebaseService.deleteRegistroParticipacion(id);
      setParticipaciones(participaciones.filter(p => p.id !== id));
      showAlert("Confirmación eliminada exitosamente", "success");
    } catch (error) {
      console.error("Error deleting RSVP:", error);
      showAlert("No se pudo eliminar la confirmación", "error");
    }
  };

  const handleAddActividad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActividad.titulo || !newActividad.fecha || !newActividad.lugar) return;
    setIsSavingActividad(true);
    try {
      let finalImageUrl = newActividad.imagen;
      if (newActividadImageFile) {
        const compressedBase64 = await compressImageFile(newActividadImageFile, 1200, 1200, 0.8);
        finalImageUrl = await firebaseService.uploadGaleriaImage(compressedBase64, 'actividad');
      }

      const created: Actividad = {
        id: `ev-${Date.now()}`,
        titulo: newActividad.titulo,
        descripcion: newActividad.descripcion,
        fecha: newActividad.fecha.replace('T', ' '),
        lugar: newActividad.lugar,
        imagen: finalImageUrl || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=800',
        publica: newActividad.publica,
        conBotonDonacion: newActividad.conBotonDonacion,
        donacionUrl: newActividad.conBotonDonacion ? (newActividad.donacionUrl || '#/donar') : '',
        conBotonVoluntariado: newActividad.conBotonVoluntariado,
        conBotonAsistencia: newActividad.conBotonAsistencia,
        costoSocio: newActividad.costoSocio ? parseFloat(newActividad.costoSocio) : 0,
        costoInvitado: newActividad.costoInvitado ? parseFloat(newActividad.costoInvitado) : 0,
        vestimenta: newActividad.vestimenta || 'libre'
      };

      await firebaseService.saveActividad(created);
      setActividades([created, ...actividades]);
      setNewActividad({ titulo: '', descripcion: '', fecha: '', lugar: '', publica: true, conBotonDonacion: false, donacionUrl: '', conBotonVoluntariado: true, conBotonAsistencia: false, costoSocio: '', costoInvitado: '', vestimenta: 'libre', imagen: '' });
      setNewActividadImageFile(null);
      setNewActividadImagePreview(null);
      setShowAddActividad(false);
      showAlert("Actividad programada exitosamente", "success");
    } catch (err: any) {
      console.error("Error saving new activity in Firestore:", err);
      showAlert(err.message || "Error al guardar la actividad", "error");
    } finally {
      setIsSavingActividad(false);
    }
  };

  const handleSaveEditedActividad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActividad || !editingActividad.titulo || !editingActividad.fecha || !editingActividad.lugar) return;
    setIsSavingActividad(true);
    try {
      let finalImageUrl = editingActividad.imagen;
      if (editActividadImageFile) {
        const compressedBase64 = await compressImageFile(editActividadImageFile, 1200, 1200, 0.8);
        finalImageUrl = await firebaseService.uploadGaleriaImage(compressedBase64, 'actividad');
      }

      const updated: Actividad = {
        ...editingActividad,
        fecha: editingActividad.fecha.replace('T', ' '),
        imagen: finalImageUrl,
        donacionUrl: editingActividad.conBotonDonacion ? (editingActividad.donacionUrl || '#/donar') : ''
      };

      await firebaseService.saveActividad(updated);
      setActividades(actividades.map(a => a.id === updated.id ? updated : a));
      setEditingActividad(null);
      setEditActividadImageFile(null);
      setEditActividadImagePreview(null);
      setShowEditActividad(false);
      showAlert("Actividad actualizada exitosamente", "success");
    } catch (err: any) {
      console.error("Error saving updated activity in Firestore:", err);
      showAlert(err.message || "Error al actualizar la actividad", "error");
    } finally {
      setIsSavingActividad(false);
    }
  };

  const handleDeleteActividad = async (id: string) => {
    if (!(await showConfirm("Eliminar Actividad", "¿Está seguro de que desea eliminar esta actividad de forma permanente?", { type: 'danger', confirmText: 'Eliminar', cancelText: 'Cancelar' }))) return;
    try {
      await firebaseService.deleteActividad(id);
      setActividades(actividades.filter(a => a.id !== id));
      showAlert("Actividad eliminada exitosamente", "success");
    } catch (err: any) {
      console.error("Error deleting activity from Firestore:", err);
      showAlert("No se pudo eliminar la actividad", "error");
    }
  };

  const handleUpdateVoluntarioEstado = async (id: string, nuevoEstado: 'Aprobado' | 'Rechazado') => {
    const vol = voluntarios.find(v => v.id === id);
    if (!vol) return;
    const updated: SolicitudVoluntario = {
      ...vol,
      estado: nuevoEstado
    };
    try {
      await firebaseService.saveSolicitudVoluntario(updated);
      setVoluntarios(voluntarios.map(v => v.id === id ? updated : v));
      showAlert(`Solicitud de voluntariado ${nuevoEstado === 'Aprobado' ? 'aprobada' : 'rechazada'} con éxito.`, "success");
    } catch (err) {
      console.error("Error updating volunteer status:", err);
      showAlert("No se pudo actualizar el estado de la solicitud.", "error");
    }
  };

  const handleDeleteVoluntario = async (id: string) => {
    if (!(await showConfirm("Eliminar Solicitud", "¿Está seguro de que desea eliminar esta solicitud de voluntariado?", { type: 'danger', confirmText: 'Eliminar', cancelText: 'Cancelar' }))) return;
    try {
      await firebaseService.deleteSolicitudVoluntario(id);
      setVoluntarios(voluntarios.filter(v => v.id !== id));
      showAlert("Solicitud de voluntariado eliminada exitosamente.", "success");
    } catch (err) {
      console.error("Error deleting volunteer request:", err);
      showAlert("No se pudo eliminar la solicitud.", "error");
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">Gestión de Actividades</h3>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Crea, edita y publica los próximos eventos del club</p>
        </div>
        <button 
          onClick={() => setShowAddActividad(true)}
          className="bg-blue-900 hover:bg-blue-800 text-white font-black px-6 py-3.5 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-blue-900/10 active:scale-95 transition-all text-sm"
        >
          <Plus size={18} />
          <span>Programar Actividad</span>
        </button>
      </div>

      {/* Add Activity Form Modal */}
      {showAddActividad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
          <form onSubmit={handleAddActividad} className="bg-white rounded-[2.5rem] p-6 sm:p-10 max-w-lg w-full space-y-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300 my-8 text-left">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-2xl font-black text-blue-900">Nueva Actividad</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Programación y Difusión</p>
              </div>
              <button type="button" onClick={() => setShowAddActividad(false)} className="p-2 text-slate-400 hover:text-slate-655 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} /></button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Título de la Actividad</label>
                <input 
                  type="text" 
                  required 
                  value={newActividad.titulo} 
                  onChange={e => setNewActividad({...newActividad, titulo: e.target.value})}
                  placeholder="Ej. Jornada Médica Visual"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Descripción Detallada</label>
                <textarea 
                  rows={4} 
                  required
                  value={newActividad.descripcion} 
                  onChange={e => setNewActividad({...newActividad, descripcion: e.target.value})}
                  placeholder="Describe el propósito del evento, quiénes pueden asistir y cómo participar..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all resize-none text-sm leading-relaxed"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha y Hora</label>
                  <input 
                    type="datetime-local" 
                    required 
                    value={newActividad.fecha} 
                    onChange={e => setNewActividad({...newActividad, fecha: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ubicación / Lugar</label>
                  <input 
                    type="text" 
                    required 
                    value={newActividad.lugar} 
                    onChange={e => setNewActividad({...newActividad, lugar: e.target.value})}
                    placeholder="Ej. Parque Central Xela"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Imagen / Afiche de la Actividad</label>
                <div className="space-y-3">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100/50 hover:border-blue-900/30 transition-all overflow-hidden relative group">
                      {newActividadImagePreview ? (
                        <>
                          <img src={newActividadImagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                            Cambiar Imagen
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                          <Upload className="w-8 h-8 text-slate-400 mb-2 group-hover:text-blue-900 transition-colors" />
                          <p className="mb-1 text-xs font-bold text-slate-500 uppercase tracking-wider">Subir archivo de imagen</p>
                          <p className="text-[10px] text-slate-400">PNG, JPG o WEBP (se comprimirá automáticamente)</p>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const validation = validateImageFile(file);
                            if (!validation.valid) {
                              showAlert(validation.error || "Imagen inválida", "error");
                              return;
                            }
                            setNewActividadImageFile(file);
                            try {
                              const compressed = await compressImageFile(file, 800, 800, 0.7);
                              setNewActividadImagePreview(compressed);
                            } catch (err) {
                              console.error("Error compressing preview image:", err);
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setNewActividadImagePreview(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                  
                  <div className="relative flex items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">O ingresar URL</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  <input 
                    type="text" 
                    value={newActividad.imagen} 
                    onChange={e => {
                      setNewActividad({...newActividad, imagen: e.target.value});
                      setNewActividadImageFile(null);
                      setNewActividadImagePreview(null);
                    }}
                    placeholder="https://images.unsplash.com/... (Opcional)"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-mono"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    id="publica" 
                    checked={newActividad.publica} 
                    onChange={e => setNewActividad({...newActividad, publica: e.target.checked})}
                    className="w-5 h-5 rounded text-blue-900 border-slate-300 focus:ring-blue-900"
                  />
                  <label htmlFor="publica" className="text-sm font-bold text-slate-700 select-none cursor-pointer">Hacer actividad pública en el sitio web</label>
                </div>
                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    id="conBotonDonacion" 
                    checked={newActividad.conBotonDonacion} 
                    onChange={e => setNewActividad({...newActividad, conBotonDonacion: e.target.checked})}
                    className="w-5 h-5 rounded text-blue-900 border-slate-300 focus:ring-blue-900"
                  />
                  <label htmlFor="conBotonDonacion" className="text-sm font-bold text-slate-700 select-none cursor-pointer">Habilitar Botón de Donaciones</label>
                </div>
                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    id="conBotonVoluntariado" 
                    checked={newActividad.conBotonVoluntariado} 
                    onChange={e => setNewActividad({...newActividad, conBotonVoluntariado: e.target.checked})}
                    className="w-5 h-5 rounded text-blue-900 border-slate-300 focus:ring-blue-900"
                  />
                  <label htmlFor="conBotonVoluntariado" className="text-sm font-bold text-slate-700 select-none cursor-pointer">Habilitar Botón de Voluntariado</label>
                </div>
                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    id="conBotonAsistencia" 
                    checked={newActividad.conBotonAsistencia} 
                    onChange={e => setNewActividad({...newActividad, conBotonAsistencia: e.target.checked})}
                    className="w-5 h-5 rounded text-blue-900 border-slate-300 focus:ring-blue-900"
                  />
                  <label htmlFor="conBotonAsistencia" className="text-sm font-bold text-slate-700 select-none cursor-pointer">Habilitar Botón de Confirmar Asistencia</label>
                </div>
              </div>

              {/* Costo Socios e Invitados */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Costo para Socios (Q)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={newActividad.costoSocio} 
                    onChange={e => setNewActividad({...newActividad, costoSocio: e.target.value})}
                    placeholder="Ej. 50 (0 para gratis)"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-semibold text-slate-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Costo para Invitados (Q)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={newActividad.costoInvitado} 
                    onChange={e => setNewActividad({...newActividad, costoInvitado: e.target.value})}
                    placeholder="Ej. 100 (0 para gratis)"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-semibold text-slate-800"
                  />
                </div>
              </div>

              {/* Vestimenta select */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Vestimenta Requerida</label>
                <select
                  value={newActividad.vestimenta}
                  onChange={e => setNewActividad({...newActividad, vestimenta: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-semibold text-slate-800 bg-white"
                >
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                  <option value="ropa de trabajo">Ropa de trabajo</option>
                  <option value="chaleco leonistico">Chaleco leonístico</option>
                  <option value="libre">Libre</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 pt-4 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setShowAddActividad(false)}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl transition-colors text-sm"
                disabled={isSavingActividad}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={isSavingActividad}
                className="w-1/2 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-900/50 text-white font-black py-3.5 rounded-2xl transition-all shadow-md hover:shadow-lg text-sm flex items-center justify-center space-x-2"
              >
                {isSavingActividad ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Agregar</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Activity Form Modal */}
      {showEditActividad && editingActividad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
          <form onSubmit={handleSaveEditedActividad} className="bg-white rounded-[2.5rem] p-6 sm:p-10 max-w-lg w-full space-y-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300 my-8 text-left">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-2xl font-black text-blue-900">Editar Actividad</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Modificación de Contenido</p>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setShowEditActividad(false);
                  setEditingActividad(null);
                }} 
                className="p-2 text-slate-400 hover:text-slate-655 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Título de la Actividad</label>
                <input 
                  type="text" 
                  required 
                  value={editingActividad.titulo} 
                  onChange={e => setEditingActividad({...editingActividad, titulo: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Descripción Detallada</label>
                <textarea 
                  rows={4} 
                  required
                  value={editingActividad.descripcion} 
                  onChange={e => setEditingActividad({...editingActividad, descripcion: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all resize-none text-sm leading-relaxed"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha y Hora</label>
                  <input 
                    type="datetime-local" 
                    required 
                    value={editingActividad.fecha.includes(' ') ? editingActividad.fecha.replace(' ', 'T') : editingActividad.fecha} 
                    onChange={e => setEditingActividad({...editingActividad, fecha: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ubicación / Lugar</label>
                  <input 
                    type="text" 
                    required 
                    value={editingActividad.lugar} 
                    onChange={e => setEditingActividad({...editingActividad, lugar: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Imagen / Afiche de la Actividad</label>
                <div className="space-y-3">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100/50 hover:border-blue-900/30 transition-all overflow-hidden relative group">
                      {(editActividadImagePreview || editingActividad.imagen) ? (
                        <>
                          <img src={editActividadImagePreview || editingActividad.imagen} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                            Cambiar Imagen
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                          <Upload className="w-8 h-8 text-slate-400 mb-2 group-hover:text-blue-900 transition-colors" />
                          <p className="mb-1 text-xs font-bold text-slate-500 uppercase tracking-wider">Subir archivo de imagen</p>
                          <p className="text-[10px] text-slate-400">PNG, JPG o WEBP (se comprimirá automáticamente)</p>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const validation = validateImageFile(file);
                            if (!validation.valid) {
                              showAlert(validation.error || "Imagen inválida", "error");
                              return;
                            }
                            setEditActividadImageFile(file);
                            try {
                              const compressed = await compressImageFile(file, 800, 800, 0.7);
                              setEditActividadImagePreview(compressed);
                            } catch (err) {
                              console.error("Error compressing preview image:", err);
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setEditActividadImagePreview(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                  
                  <div className="relative flex items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">O ingresar URL</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  <input 
                    type="text" 
                    value={editingActividad.imagen} 
                    onChange={e => {
                      setEditingActividad({...editingActividad, imagen: e.target.value});
                      setEditActividadImageFile(null);
                      setEditActividadImagePreview(null);
                    }}
                    placeholder="https://images.unsplash.com/... (Opcional)"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-mono"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    id="edit-publica" 
                    checked={editingActividad.publica} 
                    onChange={e => setEditingActividad({...editingActividad, publica: e.target.checked})}
                    className="w-5 h-5 rounded text-blue-900 border-slate-300 focus:ring-blue-900"
                  />
                  <label htmlFor="edit-publica" className="text-sm font-bold text-slate-700 select-none cursor-pointer">Hacer actividad pública en el sitio web</label>
                </div>
                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    id="edit-conBotonDonacion" 
                    checked={editingActividad.conBotonDonacion || false} 
                    onChange={e => setEditingActividad({...editingActividad, conBotonDonacion: e.target.checked})}
                    className="w-5 h-5 rounded text-blue-900 border-slate-300 focus:ring-blue-900"
                  />
                  <label htmlFor="edit-conBotonDonacion" className="text-sm font-bold text-slate-700 select-none cursor-pointer">Habilitar Botón de Donaciones</label>
                </div>
                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    id="edit-conBotonVoluntariado" 
                    checked={editingActividad.conBotonVoluntariado !== false} 
                    onChange={e => setEditingActividad({...editingActividad, conBotonVoluntariado: e.target.checked})}
                    className="w-5 h-5 rounded text-blue-900 border-slate-300 focus:ring-blue-900"
                  />
                  <label htmlFor="edit-conBotonVoluntariado" className="text-sm font-bold text-slate-700 select-none cursor-pointer">Habilitar Botón de Voluntariado</label>
                </div>
                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    id="edit-conBotonAsistencia" 
                    checked={editingActividad.conBotonAsistencia || false} 
                    onChange={e => setEditingActividad({...editingActividad, conBotonAsistencia: e.target.checked})}
                    className="w-5 h-5 rounded text-blue-900 border-slate-300 focus:ring-blue-900"
                  />
                  <label htmlFor="edit-conBotonAsistencia" className="text-sm font-bold text-slate-700 select-none cursor-pointer">Habilitar Botón de Confirmar Asistencia</label>
                </div>
              </div>

              {(editingActividad.conBotonDonacion) && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Enlace de Donación Personalizado (Opcional)</label>
                  <input 
                    type="text" 
                    value={editingActividad.donacionUrl || ''} 
                    onChange={e => setEditingActividad({...editingActividad, donacionUrl: e.target.value})}
                    placeholder="Ej. #/donar o link de pago externo"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-mono"
                  />
                </div>
              )}

              {/* Costo Socios e Invitados */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Costo para Socios (Q)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={editingActividad.costoSocio !== undefined ? editingActividad.costoSocio : ''} 
                    onChange={e => setEditingActividad({...editingActividad, costoSocio: e.target.value ? parseFloat(e.target.value) : 0})}
                    placeholder="Ej. 50 (0 para gratis)"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-semibold text-slate-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Costo para Invitados (Q)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={editingActividad.costoInvitado !== undefined ? editingActividad.costoInvitado : ''} 
                    onChange={e => setEditingActividad({...editingActividad, costoInvitado: e.target.value ? parseFloat(e.target.value) : 0})}
                    placeholder="Ej. 100 (0 para gratis)"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-semibold text-slate-800"
                  />
                </div>
              </div>

              {/* Vestimenta select */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Vestimenta Requerida</label>
                <select
                  value={editingActividad.vestimenta || 'libre'}
                  onChange={e => setEditingActividad({...editingActividad, vestimenta: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-semibold text-slate-800 bg-white"
                >
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                  <option value="ropa de trabajo">Ropa de trabajo</option>
                  <option value="chaleco leonistico">Chaleco leonístico</option>
                  <option value="libre">Libre</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 pt-4 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => {
                  setShowEditActividad(false);
                  setEditingActividad(null);
                  setEditActividadImageFile(null);
                  setEditActividadImagePreview(null);
                }}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl transition-colors text-sm"
                disabled={isSavingActividad}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={isSavingActividad}
                className="w-1/2 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-900/50 text-white font-black py-3.5 rounded-2xl transition-all shadow-md hover:shadow-lg text-sm flex items-center justify-center space-x-2"
              >
                {isSavingActividad ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar Cambios</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sub tabs for Calendario: Actividades vs Voluntarios vs Asistentes */}
      <div className="flex border-b border-slate-200 gap-6 mb-2">
        <button
          onClick={() => setCalendarioSubTab('lista')}
          className={`pb-4 text-sm font-extrabold transition-all relative ${
            calendarioSubTab === 'lista'
              ? 'text-blue-900 border-b-2 border-blue-900'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Actividades Programadas ({actividades.length})
        </button>
        <button
          onClick={() => setCalendarioSubTab('voluntarios')}
          className={`pb-4 text-sm font-extrabold transition-all relative ${
            calendarioSubTab === 'voluntarios'
              ? 'text-blue-900 border-b-2 border-blue-900'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Solicitudes de Voluntarios ({voluntarios.length})
        </button>
        <button
          onClick={() => setCalendarioSubTab('asistentes')}
          className={`pb-4 text-sm font-extrabold transition-all relative ${
            calendarioSubTab === 'asistentes'
              ? 'text-blue-900 border-b-2 border-blue-900'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Asistentes Confirmados ({participaciones.length})
        </button>
      </div>

      {calendarioSubTab === 'lista' ? (
        /* Activities Filters & List */
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar actividad..."
                value={actividadSearch}
                onChange={e => setActividadSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all text-sm outline-none font-semibold text-slate-800"
              />
            </div>
            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Filter size={16} className="text-slate-400 hidden sm:block" />
                <select 
                  value={actividadFilter}
                  onChange={e => setActividadFilter(e.target.value as any)}
                  className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-900 appearance-none cursor-pointer font-bold"
                >
                  <option value="Todas">Todas las Actividades</option>
                  <option value="Publicas">Solo Públicas</option>
                  <option value="Privadas">Solo Privadas</option>
                </select>
              </div>
              <select 
                value={actividadSort}
                onChange={e => setActividadSort(e.target.value as any)}
                className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-900 appearance-none cursor-pointer font-bold"
              >
                <option value="recientes">Más recientes</option>
                <option value="antiguas">Más antiguas</option>
                <option value="az">Alfabético (A-Z)</option>
                <option value="za">Alfabético (Z-A)</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredAndSortedActividades.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No se encontraron actividades que coincidan con la búsqueda.</p>
            </div>
          ) : (
            <div className="space-y-6 text-left">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {paginatedActividades.map(act => (
                  <div key={act.id} className="bg-white rounded-[2rem] overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group">
                    <div className="relative h-48 overflow-hidden bg-slate-100 shrink-0">
                      <img 
                        src={act.imagen || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=800'} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        alt={act.titulo}
                      />
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-sm backdrop-blur-md ${
                          act.publica ? 'bg-green-500/90 text-white' : 'bg-slate-800/90 text-white'
                        }`}>
                          {act.publica ? 'Público' : 'Solo Socios'}
                        </span>
                        {act.conBotonDonacion && (
                          <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase bg-rose-500/90 text-white shadow-sm backdrop-blur-md flex items-center space-x-1">
                            <Gift size={10} />
                            <span>Donaciones</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <h4 className="font-extrabold text-slate-800 text-lg leading-tight mb-3 line-clamp-2">{act.titulo}</h4>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-start space-x-2 text-slate-500">
                          <Calendar size={14} className="mt-0.5 shrink-0 text-blue-900/60" />
                          <span className="text-xs font-semibold">{formatDisplayDate(act.fecha)}</span>
                        </div>
                        <div className="flex items-start space-x-2 text-slate-500">
                          <Building size={14} className="mt-0.5 shrink-0 text-blue-900/60" />
                          <span className="text-xs font-medium line-clamp-2">{act.lugar}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-655 line-clamp-3 mb-6 flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {act.descripcion || "Sin descripción proporcionada."}
                      </p>

                      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 mt-auto">
                        <button 
                          onClick={() => {
                            setEditingActividad(act);
                            setShowEditActividad(true);
                          }}
                          className="flex items-center justify-center space-x-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-900 py-2.5 rounded-xl transition-colors text-sm font-bold shadow-sm"
                        >
                          <Edit size={16} />
                          <span>Editar</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteActividad(act.id)}
                          className="flex items-center justify-center space-x-2 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 py-2.5 rounded-xl transition-colors text-sm font-bold shadow-sm"
                        >
                          <Trash2 size={16} />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalActividadesPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-4 sm:px-6 rounded-2xl shadow-sm mt-6">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      onClick={() => setActividadesPage(prev => Math.max(prev - 1, 1))}
                      disabled={actividadesPage === 1}
                      className="relative inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setActividadesPage(prev => Math.min(prev + 1, totalActividadesPages))}
                      disabled={actividadesPage === totalActividadesPages}
                      className="relative ml-3 inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">
                        Mostrando <span className="font-extrabold text-slate-800">{(actividadesPage - 1) * actividadesPerPage + 1}</span> a <span className="font-extrabold text-slate-800">{Math.min(actividadesPage * actividadesPerPage, filteredAndSortedActividades.length)}</span> de{' '}
                        <span className="font-extrabold text-slate-800">{filteredAndSortedActividades.length}</span> actividades
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-xl shadow-sm bg-slate-50 p-1 border border-slate-200" aria-label="Pagination">
                        <button
                          type="button"
                          onClick={() => setActividadesPage(prev => Math.max(prev - 1, 1))}
                          disabled={actividadesPage === 1}
                          className="relative inline-flex items-center rounded-lg px-2 py-2 text-slate-400 hover:bg-white hover:text-blue-900 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                        >
                          <span className="sr-only">Anterior</span>
                          <ChevronLeft size={16} />
                        </button>
                        {Array.from({ length: totalActividadesPages }).map((_, idx) => {
                          const pageNum = idx + 1;
                          const isCurrent = pageNum === actividadesPage;
                          return (
                            <button
                              type="button"
                              key={pageNum}
                              onClick={() => setActividadesPage(pageNum)}
                              className={`relative inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black transition-all ${
                                isCurrent
                                  ? 'bg-blue-900 text-white shadow-md'
                                  : 'text-slate-605 hover:bg-white hover:text-blue-900'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => setActividadesPage(prev => Math.min(prev + 1, totalActividadesPages))}
                          disabled={actividadesPage === totalActividadesPages}
                          className="relative inline-flex items-center rounded-lg px-2 py-2 text-slate-400 hover:bg-white hover:text-blue-900 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                        >
                          <span className="sr-only">Siguiente</span>
                          <ChevronRight size={16} />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : calendarioSubTab === 'voluntarios' ? (
        /* Volunteer Requests Section */
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Filters & Search */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nombre o correo..."
                value={voluntarioSearch}
                onChange={e => setVoluntarioSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all text-sm outline-none font-semibold text-slate-800"
              />
            </div>
            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
              {/* Activity Filter */}
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Filter size={16} className="text-slate-400 hidden sm:block" />
                <select 
                  value={voluntarioFilterActividad}
                  onChange={e => setVoluntarioFilterActividad(e.target.value)}
                  className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-900 appearance-none cursor-pointer font-bold"
                >
                  <option value="Todas">Todas las Actividades</option>
                  {actividades.map(act => (
                    <option key={act.id} value={act.id}>{act.titulo}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <select 
                value={voluntarioFilterEstado}
                onChange={e => setVoluntarioFilterEstado(e.target.value)}
                className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-900 appearance-none cursor-pointer font-bold"
              >
                <option value="Todos">Todos los Estados</option>
                <option value="Pendiente">Pendientes</option>
                <option value="Aprobado">Aprobados</option>
                <option value="Rechazado">Rechazados</option>
              </select>
            </div>
          </div>

          {/* List / Table */}
          {filteredVoluntarios.length === 0 ? (
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200/80 shadow-sm text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-semibold text-base">No se encontraron solicitudes de voluntariado.</p>
              <p className="text-slate-400 text-xs mt-1">Las personas que se apunten en la web pública aparecerán aquí.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block bg-white rounded-[2.5rem] border border-slate-200/80 shadow-sm overflow-hidden text-left">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold text-xs uppercase tracking-wider">
                        <th className="py-6 px-6">Voluntario</th>
                        <th className="py-6 px-6">Teléfono</th>
                        <th className="py-6 px-6">Actividad</th>
                        <th className="py-6 px-6">Fecha Registro</th>
                        <th className="py-6 px-6">Mensaje / Motivación</th>
                        <th className="py-6 px-6">Estado</th>
                        <th className="py-6 px-6 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredVoluntarios.map(v => (
                        <tr key={v.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="py-5 px-6">
                            <p className="font-extrabold text-slate-800 text-sm">{v.nombre}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{v.correo}</p>
                          </td>
                          <td className="py-5 px-6">
                            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                              {v.telefono}
                            </span>
                          </td>
                          <td className="py-5 px-6 text-xs font-bold text-slate-700 max-w-[150px] truncate">
                            {v.actividadTitulo}
                          </td>
                          <td className="py-5 px-6 text-xs text-slate-500 font-semibold">
                            {new Date(v.fechaRegistro).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-5 px-6 text-xs text-slate-650 max-w-xs truncate" title={v.mensaje}>
                            {v.mensaje || <span className="text-slate-350 italic">Sin mensaje</span>}
                          </td>
                          <td className="py-5 px-6">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                              v.estado === 'Aprobado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              v.estado === 'Rechazado' ? 'bg-red-50 text-red-750 border border-red-200' :
                              'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {v.estado}
                            </span>
                          </td>
                          <td className="py-5 px-6 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {v.estado === 'Pendiente' && (
                                <>
                                  <button
                                    onClick={() => handleUpdateVoluntarioEstado(v.id, 'Aprobado')}
                                    className="w-8 h-8 rounded-xl bg-green-50 hover:bg-green-550 text-green-600 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
                                    title="Aprobar Solicitud"
                                  >
                                    <Check size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleUpdateVoluntarioEstado(v.id, 'Rechazado')}
                                    className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-500 text-red-600 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
                                    title="Rechazar Solicitud"
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDeleteVoluntario(v.id)}
                                className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-650 flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
                                title="Eliminar Registro"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards View */}
              <div className="lg:hidden space-y-4 text-left">
                {filteredVoluntarios.map(v => (
                  <div key={v.id} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-extrabold text-slate-800 text-base">{v.nombre}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{v.correo}</p>
                      </div>
                      <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        v.estado === 'Aprobado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        v.estado === 'Rechazado' ? 'bg-red-50 text-red-750 border border-red-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {v.estado}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
                      <div>
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Actividad:</span>
                        <p className="text-slate-750 font-extrabold mt-0.5">{v.actividadTitulo}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Teléfono:</span>
                        <p className="text-slate-750 font-extrabold mt-0.5">{v.telefono}</p>
                      </div>
                    </div>
                    {v.mensaje && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px] block mb-1">Mensaje:</span>
                        <p className="text-slate-655 font-medium italic">{v.mensaje}</p>
                      </div>
                    )}
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      {v.estado === 'Pendiente' && (
                        <>
                          <button
                            onClick={() => handleUpdateVoluntarioEstado(v.id, 'Aprobado')}
                            className="px-3 py-1.5 rounded-xl bg-green-50 hover:bg-green-500 text-green-700 hover:text-white text-xs font-black transition-all shadow-sm active:scale-95 flex items-center gap-1 cursor-pointer"
                          >
                            <Check size={14} />
                            <span>Aprobar</span>
                          </button>
                          <button
                            onClick={() => handleUpdateVoluntarioEstado(v.id, 'Rechazado')}
                            className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-500 text-red-700 hover:text-white text-xs font-black transition-all shadow-sm active:scale-95 flex items-center gap-1 cursor-pointer"
                          >
                            <X size={14} />
                            <span>Rechazar</span>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteVoluntario(v.id)}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-550 hover:text-red-600 transition-all active:scale-95 cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        /* Asistentes / RSVP Section */
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Filters & Search */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-1/3 text-left">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nombre, teléfono o actividad..."
                value={participacionSearch}
                onChange={e => setParticipacionSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all text-sm outline-none font-semibold text-slate-800"
              />
            </div>
            
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Actividad:</span>
              <select
                value={participacionFilterActividad}
                onChange={e => setParticipacionFilterActividad(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:bg-white text-xs font-bold text-slate-700 outline-none w-full md:w-auto"
              >
                <option value="Todas">Todas las actividades</option>
                {actividades.filter(a => a.conBotonAsistencia).map(act => (
                  <option key={act.id} value={act.id}>{act.titulo}</option>
                ))}
              </select>
            </div>
          </div>

          {loadingParticipaciones ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin text-blue-900" size={32} />
            </div>
          ) : filteredParticipaciones.length === 0 ? (
            <div className="bg-white border rounded-3xl p-12 text-center text-slate-450 font-bold italic shadow-sm">
              No se encontraron registros de asistencia confirmada.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 text-left">
              {filteredParticipaciones.map(p => (
                <div 
                  key={p.id} 
                  className="bg-white rounded-[2rem] p-6 border border-slate-200/80 shadow-md shadow-slate-100/50 hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
                >
                  {/* Accent color bar based on membership */}
                  <div className={`absolute top-0 left-0 w-full h-1.5 ${
                    p.esSocio ? 'bg-blue-900' :
                    p.esSocioLeo ? 'bg-indigo-600' :
                    'bg-slate-355'
                  }`} />

                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-1.5 pr-6 text-left">
                        <h4 className="text-base font-black text-slate-805 tracking-tight leading-tight">{p.nombre}</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {p.esSocio && (
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-150">
                              🦁 Socio León
                            </span>
                          )}
                          {p.esSocioLeo && (
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-900 border border-indigo-150">
                              🐾 Socio Leo
                            </span>
                          )}
                          {!p.esSocio && !p.esSocioLeo && (
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-50 text-slate-550 border border-slate-200">
                              👤 Externo / Invitado
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteParticipacion(p.id)}
                        className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-650 flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
                        title="Eliminar Registro"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {/* RSVP Info */}
                    <div className="space-y-2.5 pt-3 border-t border-slate-100/80 text-xs font-bold text-slate-700">
                      <div className="flex items-center space-x-2.5">
                        <Calendar size={14} className="text-slate-400 shrink-0" />
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider mr-1">Actividad:</span>
                        <span className="text-blue-900 font-extrabold line-clamp-1">{p.actividadTitulo}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2.5">
                        <Phone size={14} className="text-slate-400 shrink-0" />
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider mr-1">Contacto:</span>
                        <a href={`tel:${p.telefono}`} className="text-slate-600 hover:text-blue-950 font-mono">{p.telefono}</a>
                      </div>

                      <div className="flex items-center space-x-2.5">
                        <Users size={14} className="text-slate-400 shrink-0" />
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider mr-1">Acompañantes:</span>
                        <span>
                          {p.llevaInvitados ? (
                            <span className="text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100 text-[10px] font-black">
                              {p.cantidadInvitados} invitados
                            </span>
                          ) : (
                            <span className="text-slate-450 font-semibold">Ninguno</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Date Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-55 flex items-center justify-between text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <span>Registro</span>
                    <span>{formatDisplayDate(p.fechaRegistro)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
