import React, { useState, useEffect, useMemo } from 'react';
import { Socio, UserRole, Solicitud, Responsable } from '../types';
import { firebaseService } from '../services/firebaseService';
import { useModal } from '../context/ModalContext';
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
  Users,
  Accessibility,
  Heart,
  RefreshCw,
  Mail,
  Copy
} from 'lucide-react';
import { generateCartaOficialPDF, formatFechaCarta } from '../utils/pdfGenerator';


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
  const { showAlert, showConfirm } = useModal();
  const alert = (msg: string) => {
    showAlert("Notificación", msg);
  };

  const [activeTab, setActiveTab] = useState<'abiertas' | 'sillas' | 'internas' | 'agenda' | 'cartas' | null>(null);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Count calculations
  const counts = useMemo(() => {
    return {
      abiertas: solicitudes.filter(s => s.tipo === 'abiertas').length,
      abiertasPendientes: solicitudes.filter(s => s.tipo === 'abiertas' && s.estado === 'Pendiente').length,
      internas: solicitudes.filter(s => s.tipo === 'internas').length,
      internasPendientes: solicitudes.filter(s => s.tipo === 'internas' && s.estado === 'Pendiente').length,
      sillas: solicitudes.filter(s => s.tipo === 'sillas').length,
      sillasPendientes: solicitudes.filter(s => s.tipo === 'sillas' && s.estado === 'Pendiente').length,
      agenda: solicitudes.filter(s => s.tipo === 'agenda').length,
      agendaPendientes: solicitudes.filter(s => s.tipo === 'agenda' && s.estado === 'Pendiente').length,
    };
  }, [solicitudes]);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tema, setTema] = useState(TEMAS_SOLICITUD[0]);
  const [otroTemaDescripcion, setOtroTemaDescripcion] = useState('');
  const [responsables, setResponsables] = useState<Responsable[]>([{ nombre: '', telefono: '' }]);

  // Form State específicos de Sillas de Ruedas
  const [nombreSolicitante, setNombreSolicitante] = useState('');
  const [dpiSolicitante, setDpiSolicitante] = useState('');
  const [telefonoSolicitante, setTelefonoSolicitante] = useState('');
  const [nombreBeneficiario, setNombreBeneficiario] = useState('');
  const [edadBeneficiario, setEdadBeneficiario] = useState('');
  const [tiempoUso, setTiempoUso] = useState('');
  
  // Cartas Oficiales Form States
  const [cartaFecha, setCartaFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [cartaInstitucion, setCartaInstitucion] = useState('');
  const [cartaDestinatario, setCartaDestinatario] = useState('');
  const [cartaCargo, setCartaCargo] = useState('');
  const [cartaSaludo, setCartaSaludo] = useState('Estimados señores:');
  const [cartaAsunto, setCartaAsunto] = useState('');
  const [cartaCuerpo, setCartaCuerpo] = useState('');
  const [firmanteSelector, setFirmanteSelector] = useState<'presidente' | 'secretario' | 'personalizado'>('presidente');
  const [cartaFirmaNombre, setCartaFirmaNombre] = useState('Edwin Ernesto Pacheco López');
  const [cartaFirmaPuesto, setCartaFirmaPuesto] = useState('Presidente del Club');
  const [cartaFirmaImg, setCartaFirmaImg] = useState<string | null>(null);

  // Form State para Puntos de Agenda
  const [agendaSocioNombre, setAgendaSocioNombre] = useState('');
  const [agendaNombrePunto, setAgendaNombrePunto] = useState('');
  const [agendaContenido, setAgendaContenido] = useState('');
  const [agendaRazon, setAgendaRazon] = useState('');

  // Set default socio name for agenda when user changes
  useEffect(() => {
    if (user) {
      setAgendaSocioNombre(user.nombre);
    }
  }, [user]);

  const handleFirmaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("La imagen de la firma no debe superar los 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setCartaFirmaImg(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearFirma = () => {
    setCartaFirmaImg(null);
  };


  // Dynamic names lookup for signatures
  useEffect(() => {
    try {
      const local = localStorage.getItem('club_leones_socios');
      if (local) {
        const sociosList = JSON.parse(local);
        const president = sociosList.find((s: any) => s.puesto?.toLowerCase().includes('presidente del club') || s.puesto?.toLowerCase() === 'presidente') || sociosList.find((s: any) => s.puesto?.toLowerCase().includes('presidente'));
        const secretary = sociosList.find((s: any) => s.puesto?.toLowerCase().includes('secretario del club') || s.puesto?.toLowerCase() === 'secretario') || sociosList.find((s: any) => s.puesto?.toLowerCase().includes('secretario'));
        
        if (firmanteSelector === 'presidente' && president) {
          setCartaFirmaNombre(president.nombre);
          setCartaFirmaPuesto(president.puesto || 'Presidente del Club');
        } else if (firmanteSelector === 'secretario' && secretary) {
          setCartaFirmaNombre(secretary.nombre);
          setCartaFirmaPuesto(secretary.puesto || 'Secretario del Club');
        }
      }
    } catch (e) {
      console.error("Error loading signature names:", e);
    }
  }, [firmanteSelector]);
  
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

  // Check if user is a logged-in socio (not guest, not donor, and user exists)
  const isSocio = useMemo(() => {
    if (!user) return false;
    return user.rol !== UserRole.DONANTE && user.rol !== UserRole.GUEST;
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
    if (!activeTab || activeTab === 'cartas') {
      setSaveError("Categoría de solicitud no válida.");
      return;
    }
    setSaveError(null);
    setSaveSuccess(false);

    let nuevaSolicitud: Solicitud;

    if (activeTab === 'agenda') {
      if (
        !agendaSocioNombre.trim() || 
        !agendaNombrePunto.trim() || 
        !agendaContenido.trim() || 
        !agendaRazon.trim()
      ) {
        setSaveError("Por favor, complete todos los campos obligatorios.");
        return;
      }

      nuevaSolicitud = {
        id: `sol-${Date.now()}`,
        nombre: `Punto de Agenda - ${agendaNombrePunto.trim()}`,
        tipo: 'agenda',
        estado: 'Pendiente',
        usuarioCreador: user ? `${user.nombre} (${user.correo})` : 'Socio',
        fechaCreacion: new Date().toISOString().split('T')[0],
        agendaSocioNombre: agendaSocioNombre.trim(),
        agendaNombrePunto: agendaNombrePunto.trim(),
        agendaContenido: agendaContenido.trim(),
        agendaRazon: agendaRazon.trim()
      };
    } else if (activeTab === 'sillas') {
      // Wheelchair request validations
      if (
        !nombreSolicitante.trim() || 
        !dpiSolicitante.trim() || 
        !telefonoSolicitante.trim() || 
        !nombreBeneficiario.trim() || 
        !edadBeneficiario || 
        !tiempoUso.trim()
      ) {
        setSaveError("Por favor, complete todos los campos obligatorios.");
        return;
      }

      if (dpiSolicitante.trim().length !== 13) {
        setSaveError("El número de DPI debe tener exactamente 13 dígitos.");
        return;
      }

      nuevaSolicitud = {
        id: `sol-${Date.now()}`,
        nombre: `Silla de Ruedas - ${nombreBeneficiario.trim()}`,
        tipo: 'sillas',
        estado: 'Pendiente',
        usuarioCreador: user ? `${user.nombre} (${user.correo})` : 'Público',
        fechaCreacion: new Date().toISOString().split('T')[0],
        nombreSolicitante: nombreSolicitante.trim(),
        dpiSolicitante: dpiSolicitante.trim(),
        telefonoSolicitante: telefonoSolicitante.trim(),
        nombreBeneficiario: nombreBeneficiario.trim(),
        edadBeneficiario: parseInt(edadBeneficiario),
        tiempoUso: tiempoUso.trim()
      };
    } else {
      // Standard validations
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

      nuevaSolicitud = {
        id: `sol-${Date.now()}`,
        nombre: nombre.trim(),
        fecha,
        descripcion: descripcion.trim(),
        responsables,
        tema,
        otroTemaDescripcion: tema === 'Otra' ? otroTemaDescripcion.trim() : undefined,
        tipo: activeTab, // Save to current open tab ('abiertas' or 'internas')
        estado: 'Pendiente',
        usuarioCreador: user ? `${user.nombre} (${user.correo})` : 'Público',
        fechaCreacion: new Date().toISOString().split('T')[0]
      };
    }

    setIsSaving(true);

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
        
        // Reset wheelchair form
        setNombreSolicitante('');
        setDpiSolicitante('');
        setTelefonoSolicitante('');
        setNombreBeneficiario('');
        setEdadBeneficiario('');
        setTiempoUso('');

        // Reset agenda form
        setAgendaNombrePunto('');
        setAgendaContenido('');
        setAgendaRazon('');
        
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

  const handleDeleteSolicitud = async (solicitudId: string) => {
    if (!(await showConfirm("Eliminar Solicitud", "¿Está seguro de eliminar esta solicitud permanentemente? Esta acción no se puede deshacer.", { type: 'danger', confirmText: 'Eliminar', cancelText: 'Cancelar' }))) {
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

  interface TabConfig {
    id: 'abiertas' | 'sillas' | 'internas' | 'cartas' | 'agenda';
    title: string;
    subtitle: string;
    description: string;
    icon: React.ReactNode;
    audience: string;
    registeredCount: number;
    pendingCount: number;
    actionText?: string;
    showAction: boolean;
    visible: boolean;
    allowed: boolean;
  }

  const tabConfigs: TabConfig[] = [
    {
      id: 'abiertas',
      title: 'Solicitudes Abiertas',
      subtitle: 'Público y Socios',
      description: 'Cualquier persona puede generar una solicitud al club llenando el formulario que aparece en crear solicitud.',
      icon: <FileText size={20} />,
      visible: true,
      allowed: true,
      audience: 'Público General',
      pendingCount: counts.abiertasPendientes,
      registeredCount: counts.abiertas,
      showAction: true,
      actionText: 'Crear Solicitud'
    },
    {
      id: 'sillas',
      title: 'Sillas de Ruedas',
      subtitle: 'Préstamo Temporal',
      description: 'Formulario de préstamo temporal gratuito de equipo de movilidad para personas con necesidades especiales en Quetzaltenango.',
      icon: <Accessibility size={20} />,
      visible: true,
      allowed: true,
      audience: 'Público General',
      pendingCount: counts.sillasPendientes,
      registeredCount: counts.sillas,
      showAction: true,
      actionText: 'Solicitar Silla'
    },
    {
      id: 'internas',
      title: 'Solicitudes Internas',
      subtitle: 'Administración Club',
      description: 'Coordinación interna del club, minutas de comisiones, propuestas presupuestarias y peticiones privadas de los socios activos.',
      icon: <Lock size={20} />,
      visible: true,
      allowed: hasInternalAccess,
      audience: 'Socios Activos',
      pendingCount: counts.internasPendientes,
      registeredCount: counts.internas,
      showAction: true,
      actionText: 'Crear Solicitud'
    },
    {
      id: 'cartas',
      title: 'Cartas Oficiales',
      subtitle: 'Correspondencia',
      description: 'Redacción, firma digital y generación en PDF de correspondencia membretada dirigida a terceras instituciones.',
      icon: <Mail size={20} />,
      visible: isAdministrative,
      allowed: isAdministrative,
      audience: 'Directiva',
      pendingCount: 0,
      registeredCount: 0,
      showAction: true,
      actionText: 'Redactar Carta'
    },
    {
      id: 'agenda',
      title: 'Puntos de Agenda',
      subtitle: 'Reuniones de Socios',
      description: 'Propuesta de temas, puntos a discutir y solicitudes para el orden del día de las reuniones generales de socios.',
      icon: <Calendar size={20} />,
      visible: isSocio,
      allowed: isSocio,
      audience: 'Socios',
      pendingCount: counts.agendaPendientes,
      registeredCount: counts.agenda,
      showAction: true,
      actionText: 'Proponer Punto'
    }
  ];
  const renderRestrictedAccess = () => {
    return (
      <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-md p-10 sm:p-16 text-center max-w-2xl mx-auto space-y-6 w-full">
        <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-red-600 border border-red-100 animate-pulse">
          <Lock size={28} />
        </div>
        <h3 className="text-2xl font-black text-slate-900">Acceso Restringido</h3>
        <p className="text-slate-655 text-sm leading-relaxed max-w-md mx-auto font-medium">
          Las solicitudes internas son de carácter privado y están reservadas exclusivamente para socios activos y la junta directiva del club.
        </p>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-500 font-semibold max-w-xs mx-auto">
          🔑 Requiere rol administrativo o socio regular.
        </div>
      </div>
    );
  };

  const renderSolicitudesList = (tipo: 'abiertas' | 'sillas' | 'internas' | 'agenda') => {
    const list = solicitudes.filter(s => s.tipo === tipo);
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 w-full">
          <div className="animate-spin text-blue-900"><Users size={36} /></div>
          <p className="text-slate-500 font-bold text-sm">Cargando solicitudes...</p>
        </div>
      );
    }
    if (list.length === 0) {
      return (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-16 text-center max-w-2xl mx-auto w-full">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
            <FileText size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No hay solicitudes</h3>
          <p className="text-slate-600 mt-2 text-sm font-medium">
            Aún no se han registrado solicitudes en esta categoría. ¡Sé el primero en crear una!
          </p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8 w-full">
        {list.map((sol) => {
          const statusBorderColor = 
            sol.estado === 'Aprobada' ? 'border-l-4 border-l-emerald-500' :
            sol.estado === 'Rechazada' ? 'border-l-4 border-l-rose-500' :
            'border-l-4 border-l-yellow-500';

          if (sol.tipo === 'sillas') {
            return (
              <div 
                key={sol.id}
                className={`bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl border border-slate-100 transition-all duration-300 flex flex-col justify-between ${statusBorderColor}`}
              >
                <div className="p-6 space-y-4 flex-grow">
                  {/* Tags and Status */}
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border bg-blue-50 text-blue-700 border-blue-200 flex items-center space-x-1">
                      <Accessibility size={12} className="mr-0.5" />
                      <span>Silla de Ruedas</span>
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
                      Para: {sol.nombreBeneficiario}
                    </h3>
                    <div className="flex items-center text-xs font-semibold text-slate-400">
                      <Calendar size={12} className="mr-1 text-slate-400 flex-shrink-0" />
                      <span>Edad: {sol.edadBeneficiario} años • Registro: {sol.fechaCreacion}</span>
                    </div>
                  </div>

                  {/* Wheelchair specific details */}
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Solicitante:</span>
                      <span className="font-extrabold text-slate-800">{sol.nombreSolicitante}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">DPI:</span>
                      <span className="font-mono text-slate-700">{sol.dpiSolicitante}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Teléfono:</span>
                      <a href={`tel:${sol.telefonoSolicitante}`} className="text-blue-900 hover:underline font-extrabold flex items-center space-x-1">
                        <Phone size={10} className="mr-0.5" />
                        <span>{sol.telefonoSolicitante}</span>
                      </a>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-slate-200/50">
                      <span className="text-slate-400 font-bold">Tiempo de Uso:</span>
                      <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">{sol.tiempoUso}</span>
                    </div>
                  </div>

                  {/* Return Note/Indicator */}
                  <div className="bg-blue-50/50 border border-blue-100/70 p-3 rounded-xl flex items-start space-x-2 text-[10px] text-blue-800 font-medium leading-relaxed">
                    <RefreshCw size={12} className="flex-shrink-0 mt-0.5 text-blue-600 animate-pulse" />
                    <span>Compromiso de devolver la silla al finalizar su uso para beneficiar a otros.</span>
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
          }

          if (sol.tipo === 'agenda') {
            return (
              <div 
                key={sol.id}
                className={`bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl border border-slate-100 transition-all duration-300 flex flex-col justify-between ${statusBorderColor}`}
              >
                <div className="p-6 space-y-4 flex-grow">
                  {/* Tags and Status */}
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border bg-yellow-50 text-yellow-750 border-yellow-200 flex items-center space-x-1">
                      <Calendar size={12} className="mr-0.5 text-yellow-600" />
                      <span>Punto de Agenda</span>
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
                      {sol.agendaNombrePunto}
                    </h3>
                    <div className="flex items-center text-xs font-semibold text-slate-400">
                      <User size={12} className="mr-1 text-slate-400 flex-shrink-0" />
                      <span>Solicitado por: <strong className="text-slate-655 font-extrabold">{sol.agendaSocioNombre}</strong> • {sol.fechaCreacion}</span>
                    </div>
                  </div>

                  {/* Contenido / Detalle */}
                  <div className="space-y-1 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                      Contenido / Detalle:
                    </div>
                    <p className="text-slate-705 text-xs leading-relaxed font-medium break-words">
                      {sol.agendaContenido}
                    </p>
                  </div>

                  {/* Razón */}
                  <div className="space-y-1 bg-blue-50/20 p-4 rounded-2xl border border-blue-50/50">
                    <div className="text-xs font-black text-blue-900/60 uppercase tracking-widest mb-1">
                      Razón / Justificación:
                    </div>
                    <p className="text-slate-705 text-xs leading-relaxed font-medium break-words">
                      {sol.agendaRazon}
                    </p>
                  </div>
                </div>

                {/* Footer actions for Admin/Creator */}
                <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2 justify-between items-center text-[10px] font-bold text-slate-400">
                  <span className="truncate max-w-[130px]" title={sol.usuarioCreador}>Por: {sol.usuarioCreador || 'Socio'}</span>
                  
                  {(isAdministrative || (user && sol.usuarioCreador?.includes(user.correo))) && (
                    <div className="flex items-center space-x-1 flex-shrink-0 mt-2 sm:mt-0">
                      {isAdministrative && sol.estado === 'Pendiente' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(sol.id, 'Aprobada')}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded-lg shadow-sm transition-colors"
                            title="Aprobar Punto"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(sol.id, 'Rechazada')}
                            className="bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded-lg shadow-sm transition-colors"
                            title="Rechazar Punto"
                          >
                            <X size={12} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteSolicitud(sol.id)}
                        className="bg-slate-200 hover:bg-red-50 text-slate-500 hover:text-red-600 p-1.5 rounded-lg border border-slate-300/30 transition-colors"
                        title="Eliminar Punto"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div 
              key={sol.id}
              className={`bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl border border-slate-100 transition-all duration-300 flex flex-col justify-between ${statusBorderColor}`}
            >
              <div className="p-6 space-y-4 flex-grow">
                {/* Tags and Status */}
                <div className="flex justify-between items-start gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                    (sol.tema && TEMA_COLORS[sol.tema]) || TEMA_COLORS['Otra']
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
                  <div className="flex items-center text-xs font-semibold text-slate-405">
                    <Calendar size={12} className="mr-1 text-slate-400 flex-shrink-0" />
                    <span>Fecha: {sol.fecha}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-slate-655 text-xs leading-relaxed font-medium break-words bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                  {sol.descripcion}
                </p>

                {/* Responsibles Section */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <Users size={10} className="mr-1 text-slate-400" />
                    Responsables ({sol.responsables?.length || 0})
                  </h4>
                  <div className="space-y-1.5">
                    {sol.responsables?.map((resp, i) => (
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
    );
  };

  const renderCartasForm = () => {
    return (
      <div className="space-y-8 w-full text-left">
        {/* Formulario */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6 w-full">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
              <Mail size={20} className="text-blue-900" />
              Redactar Carta Oficial
            </h2>
            <p className="text-xs text-slate-550 font-medium mt-1">
              Complete los campos para generar la correspondencia membretada en formato PDF.
            </p>
          </div>

          <div className="space-y-4">
            {/* Fecha */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Fecha de la Carta
              </label>
              <input
                type="date"
                value={cartaFecha}
                onChange={(e) => setCartaFecha(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-all"
              />
            </div>

            {/* Destinatario Details */}
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Información del Destinatario
              </h3>
              
              <div>
                <label className="block text-[10px] font-black text-slate-655 uppercase tracking-wider mb-1">
                  Nombre de la Persona
                </label>
                <input
                  type="text"
                  placeholder="Ej. Lic. Carlos Mérida"
                  value={cartaDestinatario}
                  onChange={(e) => setCartaDestinatario(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-655 uppercase tracking-wider mb-1">
                  Cargo / Puesto
                </label>
                <input
                  type="text"
                  placeholder="Ej. Director Ejecutivo"
                  value={cartaCargo}
                  onChange={(e) => setCartaCargo(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-655 uppercase tracking-wider mb-1">
                  Institución / Organización
                </label>
                <input
                  type="text"
                  placeholder="Ej. Municipalidad de Quetzaltenango"
                  value={cartaInstitucion}
                  onChange={(e) => setCartaInstitucion(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-all"
                />
              </div>
            </div>

            {/* Asunto */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Asunto de la Carta
              </label>
              <input
                type="text"
                placeholder="Ej. Solicitud de colaboración para jornada oftalmológica"
                value={cartaAsunto}
                onChange={(e) => setCartaAsunto(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-all"
              />
            </div>

            {/* Saludo */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Saludo Inicial
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={cartaSaludo.startsWith('Estimado') || cartaSaludo.startsWith('Respetable') ? cartaSaludo : 'personalizado'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val !== 'personalizado') {
                      setCartaSaludo(val);
                    } else {
                      setCartaSaludo('');
                    }
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none w-full sm:w-auto"
                >
                  <option value="Estimados señores:">Estimados señores:</option>
                  <option value="Estimado señor director:">Estimado señor director:</option>
                  <option value="Estimado/a señor/a:">Estimado/a señor/a:</option>
                  <option value="Respetables miembros de la Junta Directiva:">Respetables miembros:</option>
                  <option value="personalizado">Personalizado...</option>
                </select>
                <input
                  type="text"
                  placeholder="Redacte saludo personalizado..."
                  value={cartaSaludo}
                  onChange={(e) => setCartaSaludo(e.target.value)}
                  className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-all w-full"
                />
              </div>
            </div>

            {/* Cuerpo de la Carta */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex justify-between">
                <span>Cuerpo de la Carta</span>
                <span className="text-[10px] text-slate-400 font-normal">Use Enter para separar párrafos</span>
              </label>
              <textarea
                rows={8}
                placeholder="Redacte aquí el contenido principal de la carta..."
                value={cartaCuerpo}
                onChange={(e) => setCartaCuerpo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-all resize-y"
              />
            </div>

            {/* Firmas, Sellos y Firma Digital PNG */}
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Bloque de Firma y Autoría
              </h3>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFirmanteSelector('presidente')}
                  className={`text-[10px] font-black uppercase tracking-wider py-2 rounded-xl border transition-all truncate px-1 ${
                    firmanteSelector === 'presidente'
                      ? 'bg-blue-900 border-blue-900 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Presidente
                </button>
                <button
                  type="button"
                  onClick={() => setFirmanteSelector('secretario')}
                  className={`text-[10px] font-black uppercase tracking-wider py-2 rounded-xl border transition-all truncate px-1 ${
                    firmanteSelector === 'secretario'
                      ? 'bg-blue-900 border-blue-900 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Secretario
                </button>
                <button
                  type="button"
                  onClick={() => setFirmanteSelector('personalizado')}
                  className={`text-[10px] font-black uppercase tracking-wider py-2 rounded-xl border transition-all truncate px-1 ${
                    firmanteSelector === 'personalizado'
                      ? 'bg-blue-900 border-blue-900 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Personalizado
                </button>
              </div>

              {firmanteSelector === 'personalizado' && (
                <div className="space-y-3 pt-2 animate-in slide-in-from-top-1 duration-200">
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      Nombre del Firmante
                    </label>
                    <input
                      type="text"
                      value={cartaFirmaNombre}
                      onChange={(e) => setCartaFirmaNombre(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                      Puesto del Firmante
                    </label>
                    <input
                      type="text"
                      value={cartaFirmaPuesto}
                      onChange={(e) => setCartaFirmaPuesto(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Firma Digital PNG */}
              <div className="pt-3 border-t border-slate-200">
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1.5 flex justify-between items-center">
                  <span>Firma Digital (.png transparente)</span>
                  {cartaFirmaImg && (
                    <button
                      type="button"
                      onClick={handleClearFirma}
                      className="text-red-500 hover:text-red-700 font-extrabold text-[9px]"
                    >
                      Eliminar firma
                    </button>
                  )}
                </label>
                
                {cartaFirmaImg ? (
                  <div className="flex items-center space-x-3 bg-white p-2.5 rounded-xl border border-slate-200">
                    <img src={cartaFirmaImg} alt="Firma cargada" className="h-10 w-24 object-contain bg-slate-50 rounded p-1 border border-slate-100" />
                    <span className="text-xs text-slate-500 font-semibold truncate flex-grow">Firma cargada</span>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/png"
                    onChange={handleFirmaUpload}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-900 hover:file:bg-blue-100 transition-all cursor-pointer"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Botones de Acción del Formulario */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                generateCartaOficialPDF({
                  fecha: cartaFecha,
                  institucion: cartaInstitucion,
                  destinatario: cartaDestinatario,
                  cargo: cartaCargo,
                  saludo: cartaSaludo,
                  asunto: cartaAsunto,
                  cuerpo: cartaCuerpo,
                  firmaNombre: cartaFirmaNombre,
                  firmaPuesto: cartaFirmaPuesto,
                  firmaImg: cartaFirmaImg
                }, 'download');
              }}
              disabled={!cartaDestinatario.trim() || !cartaCuerpo.trim()}
              className="sm:col-span-6 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-extrabold px-4 py-3 rounded-xl transition-all shadow-md shadow-blue-900/10 flex items-center justify-center space-x-2 text-sm active:scale-[0.98]"
            >
              <FileText size={16} />
              <span>Descargar PDF</span>
            </button>
            
            <button
              type="button"
              onClick={() => {
                generateCartaOficialPDF({
                  fecha: cartaFecha,
                  institucion: cartaInstitucion,
                  destinatario: cartaDestinatario,
                  cargo: cartaCargo,
                  saludo: cartaSaludo,
                  asunto: cartaAsunto,
                  cuerpo: cartaCuerpo,
                  firmaNombre: cartaFirmaNombre,
                  firmaPuesto: cartaFirmaPuesto,
                  firmaImg: cartaFirmaImg
                }, 'open');
              }}
              disabled={!cartaDestinatario.trim() || !cartaCuerpo.trim()}
              className="sm:col-span-4 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:bg-slate-50 disabled:text-slate-350 disabled:cursor-not-allowed font-extrabold px-4 py-3 rounded-xl transition-all border border-slate-200 flex items-center justify-center space-x-2 text-sm active:scale-[0.98]"
              title="Abrir Vista de Impresión"
            >
              <span>Previsualizar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const formattedDate = formatFechaCarta(cartaFecha);
                const textToCopy = `${formattedDate}

${cartaDestinatario}
${cartaCargo}
${cartaInstitucion}
Presente.

ASUNTO: ${cartaAsunto.toUpperCase()}

${cartaSaludo}

${cartaCuerpo}

Atentamente,

${cartaFirmaNombre}
${cartaFirmaPuesto}
Club de Leones de Quetzaltenango`;
                navigator.clipboard.writeText(textToCopy);
                alert("Texto copiado al portapapeles. Listo para pegar en Google Docs.");
              }}
              disabled={!cartaCuerpo.trim()}
              className="sm:col-span-2 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:bg-slate-50 disabled:text-slate-350 disabled:cursor-not-allowed font-extrabold px-3 py-3 rounded-xl transition-all border border-slate-200 flex items-center justify-center active:scale-[0.98]"
              title="Copiar texto para pegar en Google Docs"
            >
              <Copy size={16} />
            </button>
          </div>
        </div>

        {/* Vista Previa En Vivo (Live Preview) */}
        <div className="bg-slate-100/50 rounded-3xl border border-slate-200/60 p-4 sm:p-6 space-y-4 w-full overflow-hidden">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">
            Vista Previa en Tiempo Real
          </h3>
          
          {/* Hoja de Papel Membretado simulada */}
          <div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-5 sm:p-12 min-h-[700px] flex flex-col justify-between font-serif text-slate-800 relative overflow-hidden text-[11px] sm:text-sm">
            
            {/* Cabecera oficial decorativa */}
            <div className="absolute top-0 left-0 right-0">
              <div className="bg-blue-900 h-3 w-full"></div>
              <div className="bg-yellow-500 h-0.5 w-full"></div>
            </div>

            <div className="space-y-6">
              {/* Membrete del Club */}
              <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 mt-2">
                <img 
                  src="/images/logo.png"
                  alt="Logo Club de Leones"
                  className="w-10 h-10 object-contain flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%231b365d"/><circle cx="50" cy="50" r="41" fill="none" stroke="%23eab308" stroke-width="3"/><text x="50" y="65" font-family="Helvetica" font-weight="bold" font-size="45" fill="%23eab308" text-anchor="middle">L</text></svg>';
                  }}
                />
                <div>
                  <h4 className="text-blue-900 font-sans font-black text-xs sm:text-sm tracking-tight leading-none">
                    CLUB DE LEONES DE QUETZALTENANGO
                  </h4>
                  <p className="text-amber-600 font-sans font-black text-[9px] tracking-wider mt-0.5">
                    NOSOTROS SERVIMOS
                  </p>
                </div>
              </div>

              {/* Fecha */}
              <div className="text-right text-slate-500 text-xs italic font-sans">
                {cartaFecha ? formatFechaCarta(cartaFecha) : '...'}
              </div>

              {/* Destinatario */}
              <div className="space-y-0.5 leading-snug">
                <p className="font-bold text-blue-900">{cartaDestinatario || '[Nombre del Destinatario]'}</p>
                <p className="text-slate-500 italic font-sans text-xs">{cartaCargo || '[Cargo/Puesto]'}</p>
                <p className="font-bold text-slate-700">{cartaInstitucion || '[Institución/Empresa]'}</p>
                <p className="text-slate-400">Presente.</p>
              </div>

              {/* Asunto */}
              {cartaAsunto && (
                <div className="font-sans font-black text-xs text-blue-950 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100/50">
                  ASUNTO: {cartaAsunto.toUpperCase()}
                </div>
              )}

              {/* Saludo */}
              <div className="text-slate-655 font-medium">
                {cartaSaludo || '[Saludo Inicial]'}
              </div>

              {/* Cuerpo */}
              <div className="text-slate-700 leading-relaxed space-y-3 font-normal whitespace-pre-line text-xs sm:text-[13px] text-justify">
                {cartaCuerpo || (
                  <span className="text-slate-350 italic">
                    El cuerpo de la carta redactado en el formulario se previsualizará en esta área respetando los párrafos y alineaciones del formato oficial...
                  </span>
                )}
              </div>
            </div>

            {/* Firma y Cierre */}
            <div className="pt-8 space-y-8">
              <div className="space-y-1">
                <p className="text-slate-500 text-xs italic">Atentamente,</p>
                {cartaFirmaImg && (
                  <div className="my-2 relative group w-32 h-14">
                    <img src={cartaFirmaImg} alt="Firma Digital" className="h-full object-contain" />
                    <button
                      type="button"
                      onClick={handleClearFirma}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Quitar firma"
                    >
                      <X size={8} />
                    </button>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-100 max-w-[220px]">
                  <p className="font-sans font-bold text-xs text-blue-900">{cartaFirmaNombre}</p>
                  <p className="font-sans text-[10px] text-slate-400 font-semibold">{cartaFirmaPuesto}</p>
                </div>
              </div>

              {/* Sello simulado */}
              <div className="flex justify-center pt-2">
                <div className="border border-dashed border-amber-600/60 rounded px-4 py-1 text-[8px] font-sans font-bold text-amber-600 tracking-wider bg-amber-50/10">
                  SELLO OFICIAL - CLUB DE LEONES QX
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">Gestión de Solicitudes</h1>
          <p className="text-base text-slate-750 mt-1 font-medium">
            En esta sección puedes subir y hacer tus solicitudes al club como beneficiario, institución o socio.
          </p>
        </div>
      </header>

      {/* SISTEMA DE ACORDEONES UNIFICADO Y RESPONSIVO */}
      <div className="space-y-4">
        {tabConfigs.map((cfg) => {
          const isExpanded = activeTab === cfg.id;
          
          if (!cfg.visible) return null;

          return (
            <div 
              key={cfg.id}
              className={`border rounded-3xl bg-white overflow-hidden shadow-sm transition-all duration-300 ${
                isExpanded ? 'border-blue-900/40 ring-1 ring-blue-900/10' : 'border-slate-200'
              }`}
            >
              {/* Encabezado del Acordeón */}
              <button
                type="button"
                onClick={() => {
                  if (!cfg.allowed) {
                    alert(`Esta opción está reservada para: ${cfg.audience}`);
                    return;
                  }
                  setActiveTab(activeTab === cfg.id ? null : cfg.id);
                }}
                className={`w-full px-6 py-5 flex items-center justify-between text-left transition-all ${
                  !cfg.allowed ? 'bg-slate-50/50 text-slate-400 cursor-not-allowed' :
                  isExpanded ? 'bg-blue-900 text-white' : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-2xl transition-colors ${
                    !cfg.allowed ? 'bg-slate-100 text-slate-400' :
                    isExpanded ? 'bg-white/10 text-yellow-400' : 'bg-blue-50 text-blue-900'
                  }`}>
                    {cfg.icon}
                  </div>
                  <div>
                    <span className="font-extrabold text-base tracking-tight block">{cfg.title}</span>
                    <span className={`text-xs ${isExpanded ? 'text-blue-200' : 'text-slate-500'} font-semibold mt-0.5 block`}>
                      {cfg.subtitle}
                    </span>
                  </div>
                  {cfg.allowed && cfg.pendingCount > 0 && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse ml-2 ${
                      isExpanded ? 'bg-yellow-500 text-blue-955' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {cfg.pendingCount} Pendiente{cfg.pendingCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {!cfg.allowed ? (
                    <Lock size={18} className="text-slate-350" />
                  ) : (
                    <ChevronDown 
                      size={20} 
                      className={`transform transition-transform duration-300 ${
                        isExpanded ? 'rotate-180 text-white' : 'text-slate-400'
                      }`} 
                    />
                  )}
                </div>
              </button>

              {/* Contenido Expandido del Acordeón */}
              {isExpanded && (
                <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/30 animate-in slide-in-from-top duration-300">
                  {/* DISEÑO EN DOS COLUMNAS EN ESCRITORIO (md en adelante) */}
                  <div className="hidden md:flex gap-8 items-start w-full">
                    {/* Columna Izquierda (30%): Información y Acción */}
                    <div className="w-1/3 max-w-[320px] bg-white rounded-2xl border border-slate-200/80 p-6 shadow-md space-y-6 flex-shrink-0">
                      <div className="space-y-2">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                          Información
                        </h4>
                        <p className="text-slate-655 text-sm leading-relaxed font-medium">
                          {cfg.description}
                        </p>
                      </div>

                      {/* Estadísticas de la pestaña activa */}
                      {cfg.id !== 'cartas' && (
                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-2.5 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-bold">Total Registros:</span>
                            <span className="font-extrabold text-slate-800">{cfg.registeredCount}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-bold">Pendientes:</span>
                            <span className="font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                              {cfg.pendingCount}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-slate-200/50">
                            <span className="text-slate-400 font-bold">Acceso:</span>
                            <span className="font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                              {cfg.audience}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Botón de acción destacado */}
                      {cfg.showAction && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab(cfg.id);
                            setIsModalOpen(true);
                          }}
                          className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl flex items-center justify-center space-x-2 text-sm shadow-md transition-all duration-200 active:scale-95 hover:shadow-lg"
                        >
                          <Plus size={16} />
                          <span>{cfg.actionText}</span>
                        </button>
                      )}
                    </div>

                    {/* Columna Derecha (70%): Listado o Formulario */}
                    <div className="flex-grow w-2/3 overflow-hidden">
                      {cfg.id === 'cartas' ? (
                        <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-md p-10 sm:p-16 text-center max-w-2xl mx-auto space-y-6 w-full">
                          <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-blue-900 border border-blue-100">
                            <Mail size={28} />
                          </div>
                          <h3 className="text-2xl font-black text-slate-900">Redactor de Cartas Oficiales</h3>
                          <p className="text-slate-655 text-sm leading-relaxed max-w-md mx-auto font-medium">
                            Utilice el editor oficial para generar correspondencia membretada en PDF para terceras instituciones con firma digital y sello.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('cartas');
                              setIsModalOpen(true);
                            }}
                            className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl text-sm shadow-md transition-all inline-flex items-center space-x-2"
                          >
                            <Plus size={16} />
                            <span>Redactar Nueva Carta</span>
                          </button>
                        </div>
                      ) : (
                        renderSolicitudesList(cfg.id as 'abiertas' | 'sillas' | 'internas' | 'agenda')
                      )}
                    </div>
                  </div>

                  {/* DISEÑO EN UNA COLUMNA EN MÓVIL (de md hacia abajo) */}
                  <div className="block md:hidden space-y-6 w-full animate-in fade-in duration-200">
                    <p className="text-xs text-slate-550 font-semibold leading-relaxed">
                      {cfg.description}
                    </p>
                    
                    {cfg.showAction && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab(cfg.id);
                          setIsModalOpen(true);
                        }}
                        className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-2xl flex items-center justify-center space-x-2 text-xs shadow-md transition-all duration-200 active:scale-95"
                      >
                        <Plus size={16} />
                        <span>{cfg.actionText}</span>
                      </button>
                    )}

                    <div className="pt-2 w-full overflow-hidden">
                      {cfg.id === 'cartas' ? (
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center shadow-sm">
                          <p className="text-xs text-slate-500 font-semibold">
                            Redacte la correspondencia oficial usando el botón emergente superior.
                          </p>
                        </div>
                      ) : (
                        renderSolicitudesList(cfg.id as 'abiertas' | 'sillas' | 'internas' | 'agenda')
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className={`bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full ${activeTab === 'cartas' ? 'max-w-4xl' : 'max-w-2xl'} max-h-[90vh] overflow-y-auto p-6 sm:p-10 space-y-6 relative animate-in zoom-in-95 duration-300`}>
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-blue-900">
                {activeTab === 'sillas' 
                  ? 'Solicitud de Silla de Ruedas' 
                  : activeTab === 'agenda' 
                  ? 'Propuesta de Punto de Agenda' 
                  : `Crear Nueva Solicitud ${activeTab === 'abiertas' ? 'Abierta' : 'Interna'}`}
              </h2>
              <p className="text-xs text-slate-550 font-bold uppercase tracking-wider">
                {activeTab === 'sillas' 
                  ? 'Formulario de Préstamo Temporal' 
                  : activeTab === 'agenda' 
                  ? 'Formulario de Puntos de Agenda' 
                  : activeTab === 'abiertas' 
                  ? 'Formulario Público de Proyectos' 
                  : 'Formulario de Coordinación Interna'}
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

            {activeTab === 'cartas' ? (
              renderCartasForm()
            ) : activeTab === 'sillas' ? (
              <form onSubmit={handleSubmit} className="space-y-5 text-left animate-in fade-in duration-300">
                {/* Solidarity Note */}
                <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-5 flex items-start space-x-3 text-blue-900 text-xs md:text-sm shadow-sm">
                  <Heart className="flex-shrink-0 text-yellow-500 fill-yellow-500 mt-0.5 animate-pulse" size={18} />
                  <div className="space-y-1">
                    <p className="font-extrabold text-blue-955 text-sm">💡 Nota de Solidaridad y Compromiso</p>
                    <p className="leading-relaxed font-medium text-slate-750">
                      Las sillas de ruedas se entregan en calidad de **préstamo temporal**. Para que este beneficio siga activo y ayude a más personas, **te solicitamos amablemente que devuelvas la silla al Club** una vez que el beneficiario ya no la requiera. ¡De esta manera, más personas de nuestra comunidad en Quetzaltenango podrán beneficiarse!
                    </p>
                  </div>
                </div>

                {/* Section: Applicant Details */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center">
                    <User size={14} className="mr-1.5 text-slate-450" />
                    Datos del Solicitante (Responsable del compromiso)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={nombreSolicitante}
                        onChange={(e) => setNombreSolicitante(e.target.value)}
                        placeholder="Ej. Juan Carlos Pérez Pérez"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Número de DPI *
                      </label>
                      <input
                        type="text"
                        required
                        value={dpiSolicitante}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, ''); // numbers only
                          if (val.length <= 13) setDpiSolicitante(val);
                        }}
                        placeholder="CUI / DPI (13 dígitos)"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Número de Teléfono *
                    </label>
                    <input
                      type="text"
                      required
                      value={telefonoSolicitante}
                      onChange={(e) => setTelefonoSolicitante(e.target.value)}
                      placeholder="Ej. +502 5555-5555"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 bg-white"
                    />
                  </div>
                </div>

                {/* Section: Beneficiary Details */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center">
                    <Accessibility size={14} className="mr-1.5 text-slate-455" />
                    Datos del Beneficiario (Persona que usará la silla)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        ¿Para quién es la silla? (Nombre Completo) *
                      </label>
                      <input
                        type="text"
                        required
                        value={nombreBeneficiario}
                        onChange={(e) => setNombreBeneficiario(e.target.value)}
                        placeholder="Ej. María Elena Pérez"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Edad del Beneficiario (Años) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        max="120"
                        value={edadBeneficiario}
                        onChange={(e) => setEdadBeneficiario(e.target.value)}
                        placeholder="Ej. 75"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      ¿Cuánto tiempo pretende usarla? *
                    </label>
                    <input
                      type="text"
                      required
                      value={tiempoUso}
                      onChange={(e) => setTiempoUso(e.target.value)}
                      placeholder="Ej. 3 meses (recuperación de cirugía), permanente, etc."
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 bg-white"
                    />
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
            ) : activeTab === 'agenda' ? (
              <form onSubmit={handleSubmit} className="space-y-5 text-left animate-in fade-in duration-300">
                {/* Agenda Info Alert */}
                <div className="bg-yellow-50/60 border border-yellow-200/80 rounded-2xl p-5 flex items-start space-x-3 text-yellow-900 text-xs md:text-sm shadow-sm">
                  <Calendar className="flex-shrink-0 text-yellow-600 mt-0.5 animate-pulse" size={18} />
                  <div className="space-y-1">
                    <p className="font-extrabold text-yellow-950 text-sm">💡 Propuesta de Punto de Agenda</p>
                    <p className="leading-relaxed font-medium text-slate-750">
                      Como socio activo, puedes proponer temas, puntos a discutir o solicitudes para que sean incluidos en el orden del día de las reuniones generales.
                    </p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Socio Solicitante *
                    </label>
                    <input
                      type="text"
                      required
                      value={agendaSocioNombre}
                      onChange={(e) => setAgendaSocioNombre(e.target.value)}
                      placeholder="Nombre del socio"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Nombre del Punto *
                    </label>
                    <input
                      type="text"
                      required
                      value={agendaNombrePunto}
                      onChange={(e) => setAgendaNombrePunto(e.target.value)}
                      placeholder="Ej. Campaña Médica Quetzaltenango / Ajuste de cuota de socios"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Contenido del Punto *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={agendaContenido}
                      onChange={(e) => setAgendaContenido(e.target.value)}
                      placeholder="Describe el contenido o propuesta a detallar en la reunión..."
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none text-sm font-semibold resize-none text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Razón del Mismo *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={agendaRazon}
                      onChange={(e) => setAgendaRazon(e.target.value)}
                      placeholder="Indica el motivo o justificación de por qué se solicita tratar este punto..."
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none text-sm font-semibold resize-none text-slate-800"
                    />
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
                      <span>Enviar Propuesta</span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
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
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-855 bg-white"
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
                        className="text-xs font-black text-blue-900 hover:text-blue-750 flex items-center space-x-1 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 shadow-sm"
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Solicitudes;