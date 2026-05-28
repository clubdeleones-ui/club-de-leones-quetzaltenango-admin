import React, { useState, useEffect, useMemo } from 'react';
import { Socio, UserRole, Solicitud, Responsable } from '../types';
import { firebaseService } from '../services/firebaseService';
import { 
  Plus, 
  Trash2, 
  CheckCircle, 
  X, 
  Lock, 
  Phone, 
  Calendar, 
  User, 
  FileText, 
  AlertCircle, 
  ChevronDown, 
  UserPlus, 
  Tag, 
  Check, 
  Clock, 
  XOctagon,
  Users
} from 'lucide-react';

interface SolicitudesProps {
  user: Socio | null;
}

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

const TEMA_COLORS: { [key: string]: string } = {
  'Diabetes': 'bg-blue-50 text-blue-700 border-blue-200',
  'Visión': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Mitigación del Hambre': 'bg-amber-50 text-amber-700 border-amber-200',
  'Cáncer Infantil': 'bg-rose-50 text-rose-700 border-rose-200',
  'Medio Ambiente': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Alivio del Desastre': 'bg-red-50 text-red-700 border-red-200',
  'Apoyo a la Juventud': 'bg-purple-50 text-purple-700 border-purple-200',
  'Causas Humanitarias': 'bg-teal-50 text-teal-700 border-teal-200',
  'Otra': 'bg-slate-100 text-slate-700 border-slate-300'
};

const Solicitudes: React.FC<SolicitudesProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'abiertas' | 'internas'>('abiertas');
  const [isMobileTabMenuOpen, setIsMobileTabMenuOpen] = useState(false);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tema, setTema] = useState(TEMAS_SOLICITUD[0]);
  const [otroTemaDescripcion, setOtroTemaDescripcion] = useState('');
  const [responsables, setResponsables] = useState<Responsable[]>([{ nombre: '', telefono: '' }]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Check if logged in user is admin
  const isAdministrative = useMemo(() => {
    if (!user) return false;
    return (
      user.rol === UserRole.SUPER_ADMIN ||
      user.rol === UserRole.TESORERO ||
      user.rol === UserRole.SECRETARIO ||
      user.rol === UserRole.ASESOR_SERVICIOS ||
      user.rol === UserRole.PRESIDENTE_AFILIACION
    );
  }, [user]);

  // Check if user is allowed to access internal requests (any logged-in user EXCEPT Donor)
  const hasInternalAccess = useMemo(() => {
    if (!user) return false;
    return user.rol !== UserRole.DONANTE;
  }, [user]);

  // Fetch Solicitudes
  const fetchSolicitudes = async () => {
    setIsLoading(true);
    try {
      const data = await firebaseService.getSolicitudes();
      setSolicitudes(data);
    } catch (error) {
      console.error("Error fetching solicitudes:", error);
      // Fallback from localStorage
      const local = localStorage.getItem('club_leones_solicitudes');
      if (local) {
        setSolicitudes(JSON.parse(local));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  // Save solicitudes to localStorage whenever they change as a backup
  useEffect(() => {
    if (solicitudes.length > 0) {
      localStorage.setItem('club_leones_solicitudes', JSON.stringify(solicitudes));
    }
  }, [solicitudes]);

  // Add Responsible person
  const handleAddResponsable = () => {
    if (responsables.length < 3) {
      setResponsables([...responsables, { nombre: '', telefono: '' }]);
    }
  };

  // Remove Responsible person
  const handleRemoveResponsable = (index: number) => {
    if (responsables.length > 1) {
      setResponsables(responsables.filter((_, i) => i !== index));
    }
  };

  // Update Responsible details
  const handleUpdateResponsable = (index: number, field: keyof Responsable, value: string) => {
    const updated = responsables.map((resp, i) => {
      if (i === index) {
        return { ...resp, [field]: value };
      }
      return resp;
    });
    setResponsables(updated);
  };

  // Submit Request Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    // Validations
    if (!nombre.trim() || !fecha || !descripcion.trim()) {
      setSaveError("Por favor, complete todos los campos obligatorios.");
      return;
    }

    if (tema === 'Otra' && !otroTemaDescripcion.trim()) {
      setSaveError("Por favor, describa la categoría en el campo 'Otro Tema'.");
      return;
    }

    // Validate responsible inputs
    for (let i = 0; i < responsables.length; i++) {
      if (!responsables[i].nombre.trim() || !responsables[i].telefono.trim()) {
        setSaveError(`Por favor, complete los datos del Responsable ${i + 1}.`);
        return;
      }
    }

    setIsSaving(true);

    const nuevaSolicitud: Solicitud = {
      id: `sol-${Date.now()}`,
      nombre: nombre.trim(),
      fecha,
      descripcion: descripcion.trim(),
      responsables,
      tema,
      otroTemaDescripcion: tema === 'Otra' ? otroTemaDescripcion.trim() : undefined,
      tipo: activeTab, // Save to current open tab (Abiertas or Internas)
      estado: 'Pendiente',
      usuarioCreador: user ? `${user.nombre} (${user.correo})` : 'Público',
      fechaCreacion: new Date().toISOString().split('T')[0]
    };

    try {
      await firebaseService.saveSolicitud(nuevaSolicitud);
      const updatedList = [nuevaSolicitud, ...solicitudes];
      setSolicitudes(updatedList);
      localStorage.setItem('club_leones_solicitudes', JSON.stringify(updatedList));

      setSaveSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        // Reset form
        setNombre('');
        setFecha('');
        setDescripcion('');
        setTema(TEMAS_SOLICITUD[0]);
        setOtroTemaDescripcion('');
        setResponsables([{ nombre: '', telefono: '' }]);
        setSaveSuccess(false);
      }, 1500);
    } catch (err: any) {
      console.error("Error creating solicitud:", err);
      setSaveError("No se pudo enviar la solicitud a Firestore. Verifique su conexión.");
    } finally {
      setIsSaving(false);
    }
  };

  // Change request status (Admin only)
  const handleUpdateStatus = async (solicitudId: string, nuevoEstado: 'Aprobada' | 'Rechazada') => {
    const solicitud = solicitudes.find(s => s.id === solicitudId);
    if (!solicitud) return;

    const updated: Solicitud = {
      ...solicitud,
      estado: nuevoEstado
    };

    try {
      await firebaseService.saveSolicitud(updated);
      const newList = solicitudes.map(s => s.id === solicitudId ? updated : s);
      setSolicitudes(newList);
      localStorage.setItem('club_leones_solicitudes', JSON.stringify(newList));
      alert(`La solicitud ha sido ${nuevoEstado.toLowerCase()} exitosamente.`);
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Error al actualizar el estado de la solicitud.");
    }
  };

  // Delete request
  const handleDeleteSolicitud = async (solicitudId: string) => {
    if (!window.confirm("¿Está seguro de eliminar esta solicitud permanentemente? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      await firebaseService.deleteSolicitud(solicitudId);
      const newList = solicitudes.filter(s => s.id !== solicitudId);
      setSolicitudes(newList);
      localStorage.setItem('club_leones_solicitudes', JSON.stringify(newList));
      alert("Solicitud eliminada correctamente.");
    } catch (err) {
      console.error("Error deleting solicitud:", err);
      alert("Error al eliminar la solicitud en Firebase.");
    }
  };

  // Filter requests by tab type
  const filteredSolicitudes = useMemo(() => {
    return solicitudes.filter(s => s.tipo === activeTab);
  }, [solicitudes, activeTab]);

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 md:px-8 py-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">Gestión de Solicitudes</h1>
          <p className="text-base text-slate-750 mt-1 font-medium">
            Administra y crea solicitudes de servicios, proyectos y donaciones alineadas a nuestras causas globales.
          </p>
        </div>
        {(activeTab === 'abiertas' || hasInternalAccess) && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-900 hover:bg-blue-800 text-white font-black px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center space-x-2 w-full md:w-auto active:scale-95"
          >
            <Plus size={18} />
            <span>Crear Solicitud</span>
          </button>
        )}
      </header>

      {/* Tabs Navigation (Responsive Dropdown on Mobile, Tabs on Desktop) */}
      <div className="md:hidden w-full max-w-sm relative z-30">
        <button
          type="button"
          onClick={() => setIsMobileTabMenuOpen(!isMobileTabMenuOpen)}
          className="w-full flex items-center justify-between px-5 py-3.5 bg-blue-900 text-white font-extrabold rounded-2xl shadow-lg border border-blue-800/60 transition-all hover:bg-blue-850 active:scale-[0.99] text-sm"
        >
          <div className="flex items-center space-x-2.5">
            <Users size={18} className="text-yellow-400" />
            <span>
              {activeTab === 'abiertas' ? 'Solicitudes Abiertas' : 'Solicitudes Internas'}
            </span>
          </div>
          <ChevronDown size={18} className={`text-slate-300 transition-transform duration-300 ${isMobileTabMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {isMobileTabMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2.5 z-40 animate-in fade-in slide-in-from-top-1 duration-200">
            <button
              type="button"
              onClick={() => {
                setActiveTab('abiertas');
                setIsMobileTabMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-5 py-3 text-sm font-extrabold transition-colors text-left ${
                activeTab === 'abiertas' ? 'bg-blue-50 text-blue-900' : 'text-slate-655 hover:bg-slate-50'
              }`}
            >
              <span>Solicitudes Abiertas</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('internas');
                setIsMobileTabMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-5 py-3 text-sm font-extrabold transition-colors text-left ${
                activeTab === 'internas' ? 'bg-blue-50 text-blue-900' : 'text-slate-655 hover:bg-slate-50'
              }`}
            >
              <span>Solicitudes Internas</span>
            </button>
          </div>
        )}
      </div>

      {/* Desktop Tabs Navigation */}
      <div className="hidden md:flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('abiertas')}
          className={`px-6 py-3 font-semibold text-base border-b-4 transition-all ${
            activeTab === 'abiertas'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          Solicitudes Abiertas
        </button>
        <button
          onClick={() => setActiveTab('internas')}
          className={`px-6 py-3 font-semibold text-base border-b-4 transition-all ${
            activeTab === 'internas'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          Solicitudes Internas
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'internas' && !hasInternalAccess ? (
          /* RESTRICTED ACCESS SCREEN */
          <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-md p-10 sm:p-16 text-center max-w-2xl mx-auto space-y-6">
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-red-600 border border-red-100 animate-pulse">
              <Lock size={28} />
            </div>
            <h3 className="text-2xl font-black text-slate-900">Acceso Restringido</h3>
            <p className="text-slate-600 text-sm leading-relaxed max-w-md mx-auto font-medium">
              Las solicitudes internas son de carácter privado y están reservadas exclusivamente para socios activos y la junta directiva del club.
            </p>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-500 font-semibold max-w-xs mx-auto">
              🔑 Requiere rol administrativo o socio regular.
            </div>
          </div>
        ) : (
          /* REGULAR LIST DISPLAY */
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="animate-spin text-blue-900"><Users size={36} /></div>
                <p className="text-slate-500 font-bold text-sm">Cargando solicitudes...</p>
              </div>
            ) : filteredSolicitudes.length === 0 ? (
              <div className="bg-white rounded-[2rem] border border-slate-100 p-16 text-center max-w-2xl mx-auto">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                  <FileText size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">No hay solicitudes</h3>
                <p className="text-slate-600 mt-2 text-sm font-medium">
                  Aún no se han registrado solicitudes en esta categoría. ¡Sé el primero en crear una!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredSolicitudes.map((sol) => {
                  const statusBorderColor = 
                    sol.estado === 'Aprobada' ? 'border-l-4 border-l-emerald-500' :
                    sol.estado === 'Rechazada' ? 'border-l-4 border-l-rose-500' :
                    'border-l-4 border-l-yellow-500';

                  return (
                    <div 
                      key={sol.id}
                      className={`bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl border border-slate-100 transition-all duration-300 flex flex-col justify-between ${statusBorderColor}`}
                    >
                      <div className="p-6 space-y-4 flex-grow">
                        {/* Tags and Status */}
                        <div className="flex justify-between items-start gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                            TEMA_COLORS[sol.tema] || TEMA_COLORS['Otra']
                          }`}>
                            {sol.tema === 'Otra' ? (sol.otroTemaDescripcion || 'Otra') : sol.tema}
                          </span>
                          
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center space-x-1 ${
                            sol.estado === 'Aprobada' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            sol.estado === 'Rechazada' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                            'bg-yellow-50 text-yellow-700 border border-yellow-100'
                          }`}>
                            {sol.estado === 'Aprobada' && <CheckCircle size={10} className="mr-1" />}
                            {sol.estado === 'Rechazada' && <XOctagon size={10} className="mr-1" />}
                            {sol.estado === 'Pendiente' && <Clock size={10} className="mr-1" />}
                            <span>{sol.estado}</span>
                          </span>
                        </div>

                        {/* Info details */}
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-lg text-slate-900 leading-snug break-words">
                            {sol.nombre}
                          </h3>
                          <div className="flex items-center text-xs font-semibold text-slate-400">
                            <Calendar size={12} className="mr-1 text-slate-400 flex-shrink-0" />
                            <span>Fecha: {sol.fecha}</span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-slate-650 text-xs leading-relaxed font-medium break-words bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                          {sol.descripcion}
                        </p>

                        {/* Responsibles Section */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                            <Users size={10} className="mr-1 text-slate-400" />
                            Responsables ({sol.responsables.length})
                          </h4>
                          <div className="space-y-1.5">
                            {sol.responsables.map((resp, i) => (
                              <div key={i} className="flex flex-col sm:flex-row justify-between sm:items-center text-xs bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 gap-1">
                                <span className="font-bold text-slate-700 truncate max-w-[150px]">{resp.nombre}</span>
                                <a 
                                  href={`tel:${resp.telefono}`} 
                                  className="text-blue-900 hover:text-blue-700 font-bold flex items-center space-x-1"
                                >
                                  <Phone size={10} className="flex-shrink-0" />
                                  <span>{resp.telefono}</span>
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Footer actions for Admin */}
                      <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2 justify-between items-center text-[10px] font-bold text-slate-400">
                        <span className="truncate max-w-[130px]" title={sol.usuarioCreador}>Por: {sol.usuarioCreador || 'Público'}</span>
                        
                        {(isAdministrative || (user && sol.usuarioCreador?.includes(user.correo))) && (
                          <div className="flex items-center space-x-1 flex-shrink-0 mt-2 sm:mt-0">
                            {isAdministrative && sol.estado === 'Pendiente' && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(sol.id, 'Aprobada')}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded-lg shadow-sm"
                                  title="Aprobar Solicitud"
                                >
                                  <Check size={12} />
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(sol.id, 'Rechazada')}
                                  className="bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded-lg shadow-sm"
                                  title="Rechazar Solicitud"
                                >
                                  <X size={12} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteSolicitud(sol.id)}
                              className="bg-slate-200 hover:bg-red-50 text-slate-500 hover:text-red-600 p-1.5 rounded-lg border border-slate-300/30 transition-colors"
                              title="Eliminar Solicitud"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-10 space-y-6 relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-blue-900">
                Crear Nueva Solicitud {activeTab === 'abiertas' ? 'Abierta' : 'Interna'}
              </h2>
              <p className="text-xs text-slate-550 font-bold uppercase tracking-wider">
                {activeTab === 'abiertas' ? 'Formulario Público de Proyectos' : 'Formulario de Coordinación Interna'}
              </p>
            </div>

            {saveError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start space-x-3 text-red-700 text-sm animate-in fade-in">
                <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
                <span>{saveError}</span>
              </div>
            )}

            {saveSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start space-x-3 text-green-700 text-sm animate-in fade-in">
                <CheckCircle className="flex-shrink-0 mt-0.5" size={18} />
                <span>¡Solicitud enviada y registrada con éxito!</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 text-left">
              {/* Request Name and Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Nombre de la Solicitud *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Compra de Glucómetros para Campaña"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Fecha Sugerida / Límite *
                  </label>
                  <input
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-850 bg-white"
                  />
                </div>
              </div>

              {/* Theme Dropdown Cause */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Tema / Causa Global *
                  </label>
                  <select
                    value={tema}
                    onChange={(e) => setTema(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none text-sm font-semibold bg-white cursor-pointer"
                  >
                    {TEMAS_SOLICITUD.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {tema === 'Otra' && (
                  <div className="animate-in fade-in duration-300">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Describa la Categoría / Tema *
                    </label>
                    <input
                      type="text"
                      required
                      value={otroTemaDescripcion}
                      onChange={(e) => setOtroTemaDescripcion(e.target.value)}
                      placeholder="Ej. Suministros Escolares"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800"
                    />
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Descripción Detallada *
                </label>
                <textarea
                  rows={3}
                  required
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalla los objetivos, recursos necesarios e impacto comunitario..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none text-sm font-semibold resize-none"
                />
              </div>

              {/* Responsibles Dynamic Header */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">
                    Responsables de la Solicitud (Máx. 3) *
                  </label>
                  {responsables.length < 3 && (
                    <button
                      type="button"
                      onClick={handleAddResponsable}
                      className="text-xs font-black text-blue-900 hover:text-blue-700 flex items-center space-x-1 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 shadow-sm"
                    >
                      <UserPlus size={12} />
                      <span>Añadir Responsable</span>
                    </button>
                  )}
                </div>

                {/* Responsibles List */}
                <div className="space-y-3">
                  {responsables.map((resp, index) => (
                    <div 
                      key={index}
                      className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex flex-col sm:flex-row gap-3 items-end sm:items-center relative"
                    >
                      <span className="absolute top-3 left-4 bg-slate-200/80 text-slate-600 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full">
                        {index + 1}
                      </span>

                      <div className="flex-1 w-full pl-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Nombre Completo *
                          </label>
                          <input
                            type="text"
                            required
                            value={resp.nombre}
                            onChange={(e) => handleUpdateResponsable(index, 'nombre', e.target.value)}
                            placeholder="Nombre del responsable"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none text-xs font-semibold text-slate-800 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Número de Teléfono *
                          </label>
                          <input
                            type="text"
                            required
                            value={resp.telefono}
                            onChange={(e) => handleUpdateResponsable(index, 'telefono', e.target.value)}
                            placeholder="+502 Xxxx-xxxx"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none text-xs font-semibold text-slate-800 bg-white"
                          />
                        </div>
                      </div>

                      {responsables.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveResponsable(index)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg border border-red-200 flex items-center justify-center flex-shrink-0"
                          title="Eliminar responsable"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-900/50 text-white font-black rounded-xl shadow-lg transition-all text-sm flex items-center justify-center space-x-2"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin text-white flex-shrink-0"><Users size={14} /></div>
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <span>Enviar Solicitud</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Solicitudes;
