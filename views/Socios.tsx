import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MOCK_SOCIOS, MOCK_PROPUESTAS } from '../constants';
import { Socio, PropuestaSocio, UserRole } from '../types';
import { firebaseService } from '../services/firebaseService';
import { compressImageFile } from '../utils/imageCompressor';
import { 
  Mail, 
  Calendar, 
  Award, 
  UserCheck, 
  Heart, 
  ShieldCheck, 
  Users,
  Briefcase,
  ThumbsUp,
  Clock,
  Phone,
  Building,
  CheckCircle,
  X,
  Trash2,
  Pencil,
  ChevronDown,
  Image as ImageIcon
} from 'lucide-react';

interface SociosProps {
  user?: Socio | null;
}

const Socios: React.FC<SociosProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'activos' | 'propuestos'>('activos');
  const [isMobileTabMenuOpen, setIsMobileTabMenuOpen] = useState(false);
  
  // Load members from localStorage or fallback to mock
  const [socios, setSocios] = useState<Socio[]>(() => {
    const local = localStorage.getItem('club_leones_socios_v3');
    if (local) return JSON.parse(local);
    return MOCK_SOCIOS;
  });

  const sociosActivos = React.useMemo(() => {
    return socios.filter(s => s.estatus !== 'Inactive');
  }, [socios]);

  // Load proposals from localStorage or fallback to mock
  const [propuestas, setPropuestas] = useState<PropuestaSocio[]>(() => {
    const local = localStorage.getItem('club_leones_propuestas');
    if (local) return JSON.parse(local);
    // Initialize with mock proposal
    localStorage.setItem('club_leones_propuestas', JSON.stringify(MOCK_PROPUESTAS));
    return MOCK_PROPUESTAS;
  });

  const [editingPropuesta, setEditingPropuesta] = useState<PropuestaSocio | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string } | null>(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [isSavingPropuesta, setIsSavingPropuesta] = useState(false);

  const handleProposalImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingPropuesta) {
      setIsCompressingPhoto(true);
      try {
        const compressedBase64 = await compressImageFile(file, 800, 800, 0.7);
        setEditingPropuesta({ ...editingPropuesta, fotoCandidato: compressedBase64 });
      } catch (error) {
        console.error("Error compressing image, falling back to original:", error);
        const reader = new FileReader();
        reader.onloadend = () => {
          setEditingPropuesta({ ...editingPropuesta, fotoCandidato: reader.result as string });
        };
        reader.readAsDataURL(file);
      } finally {
        setIsCompressingPhoto(false);
      }
    }
  };

  // Fetch from Firebase on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedSocios = await firebaseService.getSocios();
        if (fetchedSocios && fetchedSocios.length > 0) {
          setSocios(fetchedSocios);
          localStorage.setItem('club_leones_socios_v3', JSON.stringify(fetchedSocios));
        }
      } catch (err) {
        console.error("Error fetching socios from Firebase:", err);
      }

      try {
        const fetchedPropuestas = await firebaseService.getProposals();
        if (fetchedPropuestas) {
          setPropuestas(prev => {
            const fetchedIds = new Set(fetchedPropuestas.map(p => p.id));
            const fetchedNames = new Set(fetchedPropuestas.map(p => p.nombreCandidato.trim().toLowerCase()));
            const unsynced = prev.filter(p => 
              (p as any).synced === false && 
              !fetchedIds.has(p.id) &&
              !fetchedNames.has(p.nombreCandidato.trim().toLowerCase())
            );
            const syncedFetched = fetchedPropuestas.map(p => ({ ...p, synced: true }));
            const merged = [...syncedFetched, ...unsynced];
            localStorage.setItem('club_leones_propuestas', JSON.stringify(merged));
            return merged;
          });
        }
      } catch (err) {
        console.error("Error fetching proposals from Firebase:", err);
      }
    };

    fetchData();
  }, []);

  // Save proposals to localStorage when state changes to avoid stale local cache
  useEffect(() => {
    localStorage.setItem('club_leones_propuestas', JSON.stringify(propuestas));
  }, [propuestas]);

  const canEditPropuestas = user?.rol === UserRole.SUPER_ADMIN || user?.rol === UserRole.PRESIDENTE_AFILIACION || user?.rol === UserRole.SECRETARIO;
  
  // Filter proposals: public sees only pending, admins see all
  const propuestasAMostrar = canEditPropuestas 
    ? propuestas 
    : propuestas.filter(p => p.estado === 'Pendiente');

  // Action Handlers
  const handleAprobarPropuesta = async (propuesta: PropuestaSocio) => {
    const nuevoSocio: Socio = {
      id: `socio-${Date.now()}`,
      nombre: propuesta.nombreCandidato,
      correo: propuesta.nombreCandidato.toLowerCase().replace(/[^a-z0-9]+/g, '') + '@leonesxela.com',
      rol: UserRole.SOCIO,
      puesto: 'Socio Ingresado',
      estadoCuotas: 'Al día',
      montoPendiente: 0,
      foto: propuesta.fotoCandidato || `https://picsum.photos/seed/${propuesta.nombreCandidato}/200/200`,
      fechaIngreso: new Date().toISOString().split('T')[0]
    };
    setSocios([nuevoSocio, ...socios]);
    setPropuestas(propuestas.map(p => p.id === propuesta.id ? { ...p, estado: 'Aprobado' } : p));

    try {
      await firebaseService.updateProposalStatus(propuesta.id, 'Aprobado');
      await firebaseService.saveSocio(nuevoSocio);
      alert(`La propuesta para ${propuesta.nombreCandidato} ha sido aprobada. ¡Ahora es miembro activo!`);
    } catch (err) {
      console.error("Error approving proposal:", err);
      alert(`Se aprobó localmente pero falló en Firebase: ${err}`);
    }
  };

  const handlePendientePropuesta = async (propuestaId: string) => {
    setPropuestas(propuestas.map(p => p.id === propuestaId ? { ...p, estado: 'Pendiente' } : p));
    try {
      await firebaseService.updateProposalStatus(propuestaId, 'Pendiente');
    } catch (err) {
      console.error("Error setting proposal to pending:", err);
    }
  };

  const handleRechazarPropuesta = async (propuestaId: string) => {
    setPropuestas(propuestas.map(p => p.id === propuestaId ? { ...p, estado: 'Rechazado' } : p));
    try {
      await firebaseService.updateProposalStatus(propuestaId, 'Rechazado');
    } catch (err) {
      console.error("Error rejecting proposal:", err);
    }
  };

  const handleDeletePropuesta = async (propuestaId: string) => {
    if (!window.confirm("¿Está seguro de eliminar esta propuesta permanentemente? Esta acción no se puede deshacer.")) return;
    setPropuestas(propuestas.filter(p => p.id !== propuestaId));
    try {
      await firebaseService.deleteProposal(propuestaId);
    } catch (err) {
      console.error("Error deleting proposal:", err);
      alert("No se pudo eliminar en Firebase.");
    }
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 md:px-8 py-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">Directorio de Socios</h1>
          <p className="text-base text-slate-750 mt-1 font-medium">
            Conoce a los miembros activos que hacen posible nuestro servicio y a los nuevos candidatos en evaluación.
          </p>
        </div>
      </header>

      {/* Tabs Navigation (Responsive Dropdown on Mobile, Tabs on Desktop) */}
      <div className="md:hidden w-full max-w-sm relative z-30">
        <button
          type="button"
          onClick={() => setIsMobileTabMenuOpen(!isMobileTabMenuOpen)}
          className="w-full flex items-center justify-between px-5 py-3.5 bg-blue-900 text-white font-extrabold rounded-2xl shadow-lg border border-blue-800/60 transition-all hover:bg-blue-850 active:scale-[0.99] text-sm"
        >
          <div className="flex items-center space-x-2.5">
            {activeTab === 'activos' ? <Users size={18} className="text-yellow-400" /> : <UserCheck size={18} className="text-yellow-400" />}
            <span>
              {activeTab === 'activos' ? `Socios Activos (${sociosActivos.length})` : 'Candidatos Propuestos'}
            </span>
            {activeTab === 'propuestos' && propuestasAMostrar.length > 0 && (
              <span className="bg-yellow-500 text-blue-900 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {propuestasAMostrar.length}
              </span>
            )}
          </div>
          <ChevronDown size={18} className={`text-slate-300 transition-transform duration-300 ${isMobileTabMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {isMobileTabMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2.5 z-40 animate-in fade-in slide-in-from-top-1 duration-200">
            <button
              type="button"
              onClick={() => {
                setActiveTab('activos');
                setIsMobileTabMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-5 py-3 text-sm font-extrabold transition-colors text-left ${
                activeTab === 'activos' ? 'bg-blue-50 text-blue-900' : 'text-slate-655 hover:bg-slate-50'
              }`}
            >
              <Users size={18} className={activeTab === 'activos' ? 'text-blue-900' : 'text-slate-400'} />
              <span>Socios Activos ({sociosActivos.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('propuestos');
                setIsMobileTabMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-5 py-3 text-sm font-extrabold transition-colors text-left ${
                activeTab === 'propuestos' ? 'bg-blue-50 text-blue-900' : 'text-slate-655 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <UserCheck size={18} className={activeTab === 'propuestos' ? 'text-blue-900' : 'text-slate-400'} />
                <span>Candidatos Propuestos</span>
              </div>
              {propuestasAMostrar.length > 0 && (
                <span className="bg-yellow-500 text-blue-900 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {propuestasAMostrar.length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Desktop Tabs Navigation */}
      <div className="hidden md:flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('activos')}
          className={`flex items-center space-x-3 px-6 py-3 font-semibold text-base border-b-4 transition-all ${
            activeTab === 'activos'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          <Users size={18} />
          <span>Socios Activos ({sociosActivos.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('propuestos')}
          className={`flex items-center space-x-3 px-6 py-3 font-semibold text-base border-b-4 transition-all relative ${
            activeTab === 'propuestos'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          <UserCheck size={18} />
          <span>Candidatos Propuestos</span>
          {propuestasAMostrar.length > 0 && (
            <span className="absolute top-2 right-0 bg-yellow-500 text-blue-900 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
              {propuestasAMostrar.length}
            </span>
          )}
        </button>
      </div>

      {/* Content Section */}
      <div className="animate-in fade-in-50 duration-300">
        {activeTab === 'activos' ? (
          /* ACTIVE MEMBERS LIST */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pt-10">
            {sociosActivos.map((socio) => (
              <div 
                key={socio.id} 
                className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl border border-slate-100 hover:border-blue-900/10 transition-all duration-500 flex flex-col relative group hover:-translate-y-2"
              >
                {/* Cabecera decorativa */}
                <div className="h-28 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 relative">
                  {/* Patrón de líneas decorativas o círculos difusos en el fondo */}
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-300 via-transparent to-transparent"></div>
                  
                  {/* Badge de Estatus flotante premium */}
                  <div className="absolute top-4 right-4">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center space-x-1.5 border backdrop-blur-md ${
                      socio.estatus === 'Pending' 
                        ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' 
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        socio.estatus === 'Pending' ? 'bg-yellow-500 animate-pulse' : 'bg-emerald-400 animate-pulse'
                      }`} />
                      <span>{socio.estatus === 'Pending' ? 'Pendiente' : 'Activo'}</span>
                    </span>
                  </div>
                </div>

                {/* Avatar y Contenido */}
                <div className="px-6 pb-8 pt-14 flex flex-col flex-grow items-center text-center relative">
                  {/* Contenedor del Avatar flotando sobre la cabecera */}
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                    <div className="relative">
                      {/* Anillo de color según jerarquía */}
                      <img 
                        src={socio.foto || `https://picsum.photos/seed/${socio.nombre}/200/200`} 
                        className={`w-24 h-24 rounded-full object-cover border-4 border-white shadow-xl group-hover:scale-105 transition-all duration-500 cursor-zoom-in ${
                          socio.rol === 'SUPER_ADMIN' || socio.rol === 'TESORERO' || socio.rol === 'SECRETARIO'
                            ? 'ring-4 ring-amber-400/80 ring-offset-2'
                            : 'ring-4 ring-blue-900/60 ring-offset-2'
                        }`} 
                        alt={socio.nombre}
                        onClick={() => setSelectedPhoto({
                          url: socio.foto || `https://picsum.photos/seed/${socio.nombre}/200/200`,
                          title: socio.nombre
                        })}
                      />
                      <div className="absolute bottom-0 right-0 bg-blue-950 text-amber-400 p-1.5 rounded-full border-2 border-white shadow-md">
                        <Award size={14} />
                      </div>
                    </div>
                  </div>

                  {/* Nombre y Cargo */}
                  <div className="space-y-2.5 w-full">
                    <h3 className="font-bold text-lg text-slate-900 tracking-tight leading-snug group-hover:text-blue-950 transition-colors">
                      {socio.nombre}
                    </h3>
                    
                    {/* Badge de Puesto */}
                    <div className="flex justify-center">
                      <span className={`text-xs font-semibold uppercase tracking-wider px-3.5 py-1 rounded-full border ${
                        socio.rol === 'SUPER_ADMIN' || socio.rol === 'TESORERO' || socio.rol === 'SECRETARIO'
                          ? 'bg-amber-50 text-amber-800 border-amber-200/70'
                          : socio.rol === 'ASESOR_SERVICIOS' || socio.rol === 'PRESIDENTE_AFILIACION'
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-200/70'
                          : 'bg-slate-50 text-slate-700 border-slate-200/70'
                      }`}>
                        {socio.puesto || 'Socio Regular'}
                      </span>
                    </div>
                    
                    {/* Caja de Datos Premium */}
                    <div className="w-full bg-slate-50/50 rounded-2xl p-4 border border-slate-100/90 text-left text-sm font-medium text-slate-700 space-y-3 mt-5">
                      {/* Club */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100/60 gap-1">
                        <span className="text-slate-450 flex items-center space-x-1.5 flex-shrink-0">
                          <Building size={16} className="text-slate-400 flex-shrink-0" />
                          <span>Club</span>
                        </span>
                        <span className="font-bold text-slate-800 text-left sm:text-right break-words w-full sm:w-auto">{socio.club || 'QUETZALTENANGO'}</span>
                      </div>

                      {/* Correo */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100/60 gap-1">
                        <span className="text-slate-450 flex items-center space-x-1.5 flex-shrink-0">
                          <Mail size={16} className="text-slate-400 flex-shrink-0" />
                          <span>Correo</span>
                        </span>
                        {socio.correo ? (
                          <a 
                            href={`mailto:${socio.correo}`}
                            className="font-bold text-blue-900 hover:text-blue-700 break-all text-left sm:text-right transition-colors w-full sm:w-auto"
                            title={socio.correo}
                          >
                            {socio.correo}
                          </a>
                        ) : (
                          <span className="text-slate-450 font-normal italic text-left sm:text-right w-full sm:w-auto">Sin correo registrado</span>
                        )}
                      </div>

                      {/* Teléfono */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100/60 gap-1">
                        <span className="text-slate-450 flex items-center space-x-1.5 flex-shrink-0">
                          <Phone size={16} className="text-slate-400 flex-shrink-0" />
                          <span>Teléfono</span>
                        </span>
                        {socio.telefono && socio.telefono !== 'Sin teléfono' && socio.telefono !== '' ? (
                          <a 
                            href={`tel:${socio.telefono}`}
                            className="font-bold text-slate-800 hover:text-blue-900 transition-colors break-words text-left sm:text-right w-full sm:w-auto"
                          >
                            {socio.telefono}
                          </a>
                        ) : (
                          <span className="text-slate-450 font-normal italic text-left sm:text-right w-full sm:w-auto">Sin teléfono registrado</span>
                        )}
                      </div>

                      {/* Gestión / Período */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-slate-450 flex items-center space-x-1.5 flex-shrink-0">
                          <Calendar size={16} className="text-slate-400 flex-shrink-0" />
                          <span>Gestión</span>
                        </span>
                        <span className="font-bold text-slate-800 text-left sm:text-right break-words w-full sm:w-auto">
                          {socio.fechaIngreso} al {socio.fechaFin && socio.fechaFin !== 'Sin fecha fin' ? socio.fechaFin : 'Indefinido'}
                        </span>
                      </div>
                    </div>

                    {/* Membresía / Solvencia */}
                    <div className="flex items-center justify-between px-2 pt-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
                      <span>Membresía Financiera</span>
                      <span className={`flex items-center space-x-1 ${
                        socio.estadoCuotas === 'Al día' 
                          ? 'text-emerald-600' 
                          : socio.estadoCuotas === 'Pendiente'
                          ? 'text-yellow-600'
                          : 'text-rose-600'
                      }`}>
                        <span>●</span>
                        <span>{socio.estadoCuotas}</span>
                      </span>
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* PROPOSED MEMBERS LIST */
          <div className="space-y-8">
            {/* Note banner */}
            <div className="bg-yellow-50 border border-yellow-200/60 rounded-3xl p-6 flex items-start space-x-4 max-w-4xl">
              <Clock className="text-yellow-750 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <h4 className="font-bold text-yellow-950 text-base">Candidaturas en Proceso de Evaluación</h4>
                <p className="text-yellow-900 text-sm mt-1 leading-relaxed font-medium">
                  Las personas listadas a continuación han sido propuestas por socios activos del club debido a su vocación de servicio y calidades humanas. Sus propuestas se encuentran actualmente bajo revisión por parte de la Junta Directiva para su formalización y aprobación.
                </p>
                {/* Enlace para proponer candidato (solo socios) */}
                {user && user.rol !== UserRole.DONANTE && user.rol !== UserRole.GUEST && (
                  <div className="mt-5 pt-5 border-t border-yellow-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <span className="text-yellow-900 text-sm font-semibold">¿Conoces a alguien idóneo para ser parte del club?</span>
                    <Link to="/proponer-socio" className="bg-blue-900 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center space-x-2">
                      <UserCheck size={18} />
                      <span>Proponer Candidato</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {propuestasAMostrar.length === 0 ? (
              <div className="bg-white rounded-[2rem] border border-slate-100 p-16 text-center max-w-3xl">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-500">
                  <UserCheck size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">No hay propuestas pendientes</h3>
                <p className="text-slate-600 mt-2 max-w-md mx-auto text-sm font-medium">
                  Actualmente no existen candidaturas propuestas en evaluación. Si conoces a alguien idóneo para ser parte del club, puedes postularlo usando el formulario correspondiente.
                </p>
                {user && user.rol !== UserRole.DONANTE && user.rol !== UserRole.GUEST && (
                  <Link to="/proponer-socio" className="mt-6 inline-flex bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-xl text-sm font-black transition-all shadow-lg shadow-blue-900/20 items-center justify-center space-x-2">
                    <UserCheck size={18} />
                    <span>Ir al Formulario de Propuesta</span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {propuestasAMostrar.map((propuesta) => (
                  <div 
                    key={propuesta.id} 
                    className={`bg-white rounded-3xl overflow-hidden shadow-md border hover:shadow-xl transition-all duration-300 flex flex-col relative ${
                      propuesta.estado === 'Aprobado' ? 'border-green-300' : 
                      propuesta.estado === 'Rechazado' ? 'border-red-300' : 'border-yellow-300'
                    }`}
                  >
                    {/* Banner Llamativo de Estado */}
                    <div className={`w-full py-2.5 px-6 flex items-center justify-center font-black text-[10px] sm:text-xs tracking-[0.2em] uppercase text-white shadow-sm ${
                      propuesta.estado === 'Aprobado' ? 'bg-gradient-to-r from-emerald-500 to-green-600' :
                      propuesta.estado === 'Rechazado' ? 'bg-gradient-to-r from-red-500 to-rose-600' :
                      'bg-gradient-to-r from-yellow-400 to-yellow-600'
                    }`}>
                      {propuesta.estado === 'Pendiente' ? 'En Evaluación' : propuesta.estado}
                    </div>

                    <div className="p-4 sm:p-6 flex flex-col space-y-5">
                      {/* Header info */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-center sm:items-start space-x-4 sm:space-x-5 min-w-0">
                          <img 
                            src={propuesta.fotoCandidato || 'https://picsum.photos/seed/' + propuesta.id + '/200/200'} 
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-4 border-slate-50 shadow-sm flex-shrink-0 cursor-zoom-in" 
                            alt={propuesta.nombreCandidato} 
                            onClick={() => setSelectedPhoto({
                              url: propuesta.fotoCandidato || 'https://picsum.photos/seed/' + propuesta.id + '/200/200',
                              title: propuesta.nombreCandidato
                            })}
                          />
                          <div className="space-y-1.5 min-w-0 pt-1 flex-1">
                            <h3 className="font-black text-lg sm:text-xl text-slate-900 leading-snug break-words">{propuesta.nombreCandidato}</h3>
                            <div className="flex items-center text-slate-650 text-xs font-medium w-full">
                              <Briefcase size={12} className="mr-1.5 text-slate-400 flex-shrink-0" />
                              <span className="break-words w-full">{propuesta.profesionCandidato}</span>
                            </div>
                          </div>
                        </div>
                        
                        {canEditPropuestas && (
                          <div className="flex items-center space-x-2 sm:self-start self-end flex-shrink-0">
                            <button 
                              onClick={() => setEditingPropuesta(propuesta)}
                              className="p-2.5 sm:p-2 bg-slate-50 hover:bg-blue-50 text-slate-450 hover:text-blue-900 rounded-full transition-all border border-slate-100 shadow-sm flex items-center justify-center animate-in fade-in"
                              title="Editar propuesta"
                            >
                              <Pencil size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeletePropuesta(propuesta.id)}
                              className="p-2.5 sm:p-2 bg-slate-50 hover:bg-red-50 text-slate-450 hover:text-red-600 rounded-full transition-all border border-slate-100 shadow-sm flex items-center justify-center animate-in fade-in"
                              title="Eliminar permanentemente"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>

                    {/* Proponent info */}
                    <div className="bg-slate-50/85 rounded-xl p-3.5 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between border border-slate-100/80">
                      <div className="flex items-center space-x-1.5 text-xs text-slate-650 flex-shrink-0">
                        <ShieldCheck size={14} className="text-blue-900 flex-shrink-0" />
                        <span>Propuesto por:</span>
                      </div>
                      <span className="font-bold text-xs text-blue-900 bg-blue-50/80 px-2.5 py-1 rounded-lg break-words text-left sm:text-right w-full sm:w-auto" title={propuesta.proponente}>
                        {propuesta.proponente}
                      </span>
                    </div>

                    {/* Family Status Info (Datos Complementarios) */}
                    {(propuesta.estadoCivil || propuesta.hijos) && (
                      <div className="bg-slate-50/50 rounded-2xl p-3.5 border border-slate-100/80 space-y-2.5 text-xs text-slate-700">
                        <div className="flex flex-col sm:flex-row gap-1 sm:items-center sm:justify-between">
                          <span className="font-bold text-slate-500 flex items-center flex-shrink-0">
                            <span className="mr-1.5">👪</span> Estado Civil y Familia
                          </span>
                          <span className="font-black text-slate-800 text-left sm:text-right w-full sm:w-auto">
                            {propuesta.estadoCivil || 'No indicado'} • {propuesta.hijos || 'No indicado'}
                          </span>
                        </div>
                        {propuesta.estadoCivil === 'Casado' && propuesta.nombreEsposa && (
                          <div className="flex flex-col sm:flex-row gap-1 sm:items-center sm:justify-between pt-2 border-t border-slate-100">
                            <span className="text-slate-500 font-bold flex items-center flex-shrink-0">
                               <span className="mr-1.5">💍</span> Cónyuge
                            </span>
                            <span className="font-black text-slate-900 break-words text-left sm:text-right w-full sm:w-auto">{propuesta.nombreEsposa}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Qualities / characteristics tags */}
                    <div className="space-y-2">
                      <h4 className="font-bold text-xs text-slate-555 uppercase tracking-wider flex items-center">
                        <ThumbsUp size={12} className="mr-1.5 text-slate-400" />
                        Cualidades Destacadas
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {propuesta.caracteristicas.map((carac, index) => (
                          <span 
                            key={index} 
                            className="bg-blue-50/50 hover:bg-blue-50 border border-blue-100/70 text-blue-955 font-medium px-2.5 py-0.5 rounded-lg text-xs transition-colors"
                          >
                            ✨ {carac}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Justification details */}
                    <div className="space-y-3 pt-2 border-t border-slate-100 flex-grow">
                      <div>
                        <h4 className="font-bold text-[10px] text-slate-500 uppercase tracking-wider">Motivo de Nominación</h4>
                        <p className="text-slate-800 text-xs mt-1 leading-relaxed italic bg-slate-50/30 p-2.5 rounded-xl border border-slate-100/50 font-medium break-words">
                          "{propuesta.motivoPropuesta}"
                        </p>
                      </div>
                      {propuesta.porQueBuenLeon && (
                        <div>
                          <h4 className="font-bold text-[10px] text-slate-500 uppercase tracking-wider mt-2">¿Por qué sería un buen León?</h4>
                          <p className="text-slate-800 text-xs mt-1 leading-relaxed italic bg-slate-50/30 p-2.5 rounded-xl border border-slate-100/50 font-medium break-words">
                            "{propuesta.porQueBuenLeon}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Admin Actions */}
                    {canEditPropuestas && (
                      <div className="flex flex-col sm:flex-row items-center gap-2 pt-4 border-t border-slate-100/80">
                        <button
                          onClick={() => propuesta.estado !== 'Aprobado' && handleAprobarPropuesta(propuesta)}
                          disabled={propuesta.estado === 'Aprobado'}
                          className={`flex-1 font-black text-xs px-3 py-2.5 rounded-xl flex justify-center items-center space-x-1.5 transition-all shadow-sm ${
                            propuesta.estado === 'Aprobado'
                              ? 'bg-green-100 text-green-700 cursor-not-allowed opacity-70'
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-95 shadow-green-600/20'
                          }`}
                        >
                          <CheckCircle size={14} />
                          <span>Promover</span>
                        </button>
                        <button
                          onClick={() => propuesta.estado !== 'Pendiente' && handlePendientePropuesta(propuesta.id)}
                          disabled={propuesta.estado === 'Pendiente'}
                          className={`flex-1 font-black text-xs px-3 py-2.5 rounded-xl flex justify-center items-center space-x-1.5 transition-all shadow-sm ${
                            propuesta.estado === 'Pendiente'
                              ? 'bg-yellow-100 text-yellow-700 cursor-not-allowed opacity-70'
                              : 'bg-yellow-500 hover:bg-yellow-600 text-white active:scale-95 shadow-yellow-600/20'
                          }`}
                        >
                          <Clock size={14} />
                          <span>Evaluando</span>
                        </button>
                        <button
                          onClick={() => propuesta.estado !== 'Rechazado' && handleRechazarPropuesta(propuesta.id)}
                          disabled={propuesta.estado === 'Rechazado'}
                          className={`flex-1 font-black text-xs px-3 py-2.5 rounded-xl flex justify-center items-center space-x-1.5 transition-all shadow-sm ${
                            propuesta.estado === 'Rechazado'
                              ? 'bg-red-100 text-red-700 cursor-not-allowed opacity-70'
                              : 'bg-rose-500 hover:bg-rose-600 text-white active:scale-95 shadow-red-600/20'
                          }`}
                        >
                          <X size={14} />
                          <span>Eliminado</span>
                        </button>
                      </div>
                    )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {editingPropuesta && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-10 space-y-6 relative animate-in zoom-in-95 duration-300">
              <button 
                type="button"
                onClick={() => setEditingPropuesta(null)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-blue-900">Editar Propuesta de Candidato</h2>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Modificar información del postulado</p>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!editingPropuesta.proponente || !editingPropuesta.nombreCandidato || !editingPropuesta.profesionCandidato || !editingPropuesta.motivoPropuesta || !editingPropuesta.porQueBuenLeon || !editingPropuesta.estadoCivil || !editingPropuesta.hijos) {
                  alert('Por favor complete todos los campos obligatorios.');
                  return;
                }

                setIsSavingPropuesta(true);
                try {
                  let finalPhotoUrl = editingPropuesta.fotoCandidato || '';
                  if (finalPhotoUrl && finalPhotoUrl.startsWith('data:')) {
                    try {
                      finalPhotoUrl = await firebaseService.uploadCandidatePhoto(finalPhotoUrl, editingPropuesta.id);
                    } catch (uploadErr) {
                      console.error("Error uploading candidate photo, using original base64:", uploadErr);
                    }
                  }

                  const updatedPropuesta = {
                    ...editingPropuesta,
                    fotoCandidato: finalPhotoUrl,
                    nombreEsposa: editingPropuesta.estadoCivil === 'Casado' ? editingPropuesta.nombreEsposa : ''
                  };

                  // Update local state
                  setPropuestas(propuestas.map(p => p.id === updatedPropuesta.id ? updatedPropuesta : p));

                  // Save to Firebase
                  await firebaseService.updateProposal(updatedPropuesta.id, updatedPropuesta);
                  
                  // Also update localStorage
                  const localPropuestas = localStorage.getItem('club_leones_propuestas');
                  const propuestasActuales: PropuestaSocio[] = localPropuestas ? JSON.parse(localPropuestas) : [];
                  localStorage.setItem('club_leones_propuestas', JSON.stringify(
                    propuestasActuales.map(p => p.id === updatedPropuesta.id ? { ...updatedPropuesta, synced: true } : p)
                  ));
                  
                  alert('Propuesta actualizada exitosamente.');
                  setEditingPropuesta(null);
                } catch (err: any) {
                  console.error("Error updating proposal in Firestore:", err);
                  
                  const updatedPropuestaFallback = {
                    ...editingPropuesta,
                    nombreEsposa: editingPropuesta.estadoCivil === 'Casado' ? editingPropuesta.nombreEsposa : ''
                  };

                  // fallback localStorage update
                  const localPropuestas = localStorage.getItem('club_leones_propuestas');
                  const propuestasActuales: PropuestaSocio[] = localPropuestas ? JSON.parse(localPropuestas) : [];
                  localStorage.setItem('club_leones_propuestas', JSON.stringify(
                    propuestasActuales.map(p => p.id === updatedPropuestaFallback.id ? { ...updatedPropuestaFallback, synced: false } : p)
                  ));
                  
                  alert(`Se guardó localmente pero no se pudo sincronizar: ${err?.message || err}`);
                  setEditingPropuesta(null);
                } finally {
                  setIsSavingPropuesta(false);
                }
              }} className="space-y-6">
                
                {/* Proponente */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Socio Proponente *</label>
                  <input 
                    type="text"
                    required
                    value={editingPropuesta.proponente}
                    onChange={e => setEditingPropuesta({ ...editingPropuesta, proponente: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all font-semibold"
                  />
                </div>

                {/* Fotografía del Candidato */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Fotografía del Candidato</label>
                  <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center sm:text-left">
                    <div className="w-20 h-20 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-350 shadow-inner">
                      {editingPropuesta.fotoCandidato ? (
                        <img src={editingPropuesta.fotoCandidato} alt="Previsualización" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="text-slate-400" size={24} />
                      )}
                    </div>
                    <div className="flex flex-col items-center sm:items-start flex-1 w-full">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleProposalImageChange}
                        id="edit-foto-upload"
                        className="hidden" 
                      />
                      <label 
                        htmlFor="edit-foto-upload"
                        className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-extrabold px-4 py-2.5 rounded-xl cursor-pointer text-xs transition-colors inline-block active:scale-95 shadow-sm"
                      >
                        Subir Nueva Fotografía
                      </label>
                      {isCompressingPhoto ? (
                        <p className="text-[11px] text-blue-900 mt-2 font-bold animate-pulse">Comprimiendo imagen...</p>
                      ) : (
                        <p className="text-[11px] text-slate-500 mt-2 font-medium">Formatos recomendados: JPG, PNG. Tamaño máximo 2MB.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nombre y Profesión */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Nombre del Candidato *</label>
                    <input 
                      type="text"
                      required
                      value={editingPropuesta.nombreCandidato}
                      onChange={e => setEditingPropuesta({ ...editingPropuesta, nombreCandidato: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Campo Profesional / Ocupación *</label>
                    <input 
                      type="text"
                      required
                      value={editingPropuesta.profesionCandidato}
                      onChange={e => setEditingPropuesta({ ...editingPropuesta, profesionCandidato: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all font-semibold"
                    />
                  </div>
                </div>

                {/* Motivo Nominación */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">¿Por qué propone a esta persona? *</label>
                  <textarea 
                    rows={3}
                    required
                    value={editingPropuesta.motivoPropuesta}
                    onChange={e => setEditingPropuesta({ ...editingPropuesta, motivoPropuesta: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all resize-none text-sm font-semibold"
                    spellCheck={true}
                    autoCorrect="on"
                  />
                </div>

                {/* Buen Leon */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">¿Por qué considera que sería un buen León? *</label>
                  <textarea 
                    rows={3}
                    required
                    value={editingPropuesta.porQueBuenLeon}
                    onChange={e => setEditingPropuesta({ ...editingPropuesta, porQueBuenLeon: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all resize-none text-sm font-semibold"
                    spellCheck={true}
                    autoCorrect="on"
                  />
                </div>

                {/* Datos Complementarios */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Estado Civil *</label>
                    <select 
                      required
                      value={editingPropuesta.estadoCivil || ''}
                      onChange={e => setEditingPropuesta({ ...editingPropuesta, estadoCivil: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all font-semibold bg-white"
                    >
                      <option value="">Seleccione...</option>
                      <option value="Soltero">Soltero(a)</option>
                      <option value="Casado">Casado(a)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Hijos *</label>
                    <select 
                      required
                      value={editingPropuesta.hijos || ''}
                      onChange={e => setEditingPropuesta({ ...editingPropuesta, hijos: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all font-semibold bg-white"
                    >
                      <option value="">Seleccione...</option>
                      <option value="Sin hijos">Sin hijos</option>
                      <option value="Con hijos">Con hijos</option>
                    </select>
                  </div>
                </div>

                {editingPropuesta.estadoCivil === 'Casado' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Nombre del Cónyuge (Opcional)</label>
                    <input 
                      type="text"
                      value={editingPropuesta.nombreEsposa || ''}
                      onChange={e => setEditingPropuesta({ ...editingPropuesta, nombreEsposa: e.target.value })}
                      placeholder="Ej. María Fernanda López"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all font-semibold"
                    />
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingPropuesta(null)}
                    className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingPropuesta || isCompressingPhoto}
                    className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-xl shadow-lg shadow-blue-900/10 transition-all text-sm disabled:opacity-50"
                  >
                    {isSavingPropuesta ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}
        {selectedPhoto && (
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center animate-in zoom-in-95 duration-300">
              <button 
                type="button"
                className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-slate-900/60 hover:bg-slate-900/90 rounded-full transition-colors"
                onClick={() => setSelectedPhoto(null)}
              >
                <X size={24} />
              </button>
              <img 
                src={selectedPhoto.url} 
                alt={selectedPhoto.title} 
                className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-white/10"
                onClick={(e) => e.stopPropagation()}
              />
              <p className="text-white text-base font-bold mt-4 bg-slate-900/80 px-4 py-2 rounded-xl shadow-lg border border-white/5">
                {selectedPhoto.title}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Socios;
