import React, { useState, useEffect, useMemo } from 'react';
import { Socio, UserRole } from '../types';
import { 
  CreditCard, 
  Calendar, 
  FileText, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Gift, 
  Heart, 
  Download, 
  Award, 
  DollarSign,
  Briefcase,
  User,
  Users,
  Phone,
  Mail,
  Search,
  Filter,
  X,
  ChevronDown,
  Upload,
  Loader2,
  Lock,
  Pencil,
  AlertTriangle,
  Building,
  Plus,
  Trash2,
  QrCode,
  MapPin,
  ClipboardList
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { MOCK_DONACIONES, MOCK_SOCIOS } from '../constants';
import { generateDiplomaDonacionPDF } from '../utils/pdfGenerator';
import { compressImageFile, validateImageFile } from '../utils/imageCompressor';
import { firebaseService } from '../services/firebaseService';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';
import { RequerimientosActividades } from './RequerimientosActividades';

const PUESTOS_PREDEFINIDOS = [
  'Presidente',
  'Primer Vicepresidente',
  'Segundo Vicepresidente',
  'Secretario',
  'Tesorero',
  'Asesor de Servicio',
  'Asesor de Mercadotecnia',
  'Presidente de Afiliación',
  'Vocal 1',
  'Vocal 2',
  'Socio Regular'
];

const ROLES_LIST = [
  { value: UserRole.SOCIO, label: 'Socio Regular' },
  { value: UserRole.SUPER_ADMIN, label: 'Super Administrador' },
  { value: UserRole.SECRETARIO, label: 'Secretario' },
  { value: UserRole.TESORERO, label: 'Tesorero' },
  { value: UserRole.ASESOR_SERVICIOS, label: 'Asesor de Servicios' },
  { value: UserRole.PRESIDENTE_AFILIACION, label: 'Presidente de Afiliación' },
  { value: UserRole.DONANTE, label: 'Donante' }
];

interface DashboardProps {
  user: Socio;
  onUpdateUser: (updatedUser: Socio) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onUpdateUser }) => {
  const { showAlert } = useModal();
  const { showToast } = useToast();
  const alert = (msg: string) => {
    showAlert("Notificación", msg);
  };

  const [showQrModal, setShowQrModal] = useState(false);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  const handleQrClick = async () => {
    if (user.qrToken) {
      setShowQrModal(true);
      return;
    }

    setIsGeneratingQr(true);
    try {
      const token = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      const updatedUser = { ...user, qrToken: token };
      await firebaseService.saveSocio(updatedUser);
      onUpdateUser(updatedUser);
      setShowQrModal(true);
    } catch (err) {
      console.error("Error generating QR token:", err);
      alert("Error al generar el token del código QR.");
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const handleDownloadQr = () => {
    if (!user.qrToken) return;
    
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      window.location.origin + window.location.pathname + '#/login?qr_token=' + user.qrToken
    )}`;
    
    fetch(qrUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `QR_Acceso_${user.nombre.replace(/\s+/g, '_')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      })
      .catch(err => {
        console.error("Error downloading QR:", err);
        alert("No se pudo descargar el código QR.");
      });
  };

  const [activeTab, setActiveTab] = useState<'resumen' | 'requerimientos' | 'perfil'>(() => {
    const saved = sessionStorage.getItem('dashboard_active_tab');
    if (saved && ['resumen', 'requerimientos', 'perfil'].includes(saved)) return saved as 'resumen' | 'requerimientos' | 'perfil';
    return 'resumen';
  });

  useEffect(() => {
    sessionStorage.setItem('dashboard_active_tab', activeTab);
  }, [activeTab]);

  const [isMobileTabMenuOpen, setIsMobileTabMenuOpen] = useState(false);

  // Check if the user has administrative privileges
  const isAdministrative = useMemo(() => {
    return (
      user.rol === UserRole.SUPER_ADMIN ||
      user.rol === UserRole.TESORERO ||
      user.rol === UserRole.SECRETARIO ||
      user.rol === UserRole.ASESOR_SERVICIOS ||
      user.rol === UserRole.PRESIDENTE_AFILIACION
    );
  }, [user.rol]);

  const isDonante = user.rol === UserRole.DONANTE;

  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string } | null>(null);
  
  // States for Editing Profile
  const [isEditing, setIsEditing] = useState(false);
  const [editTelefono, setEditTelefono] = useState(user.telefono || '');
  const [editFoto, setEditFoto] = useState(user.foto || '');
  const [editDpi, setEditDpi] = useState(user.dpi || '');
  const [editFechaNacimiento, setEditFechaNacimiento] = useState(user.fechaNacimiento || '');
  const [editProfesion, setEditProfesion] = useState(user.profesion || '');
  const [editDireccion, setEditDireccion] = useState(user.direccion || '');
  const [isSavingSocio, setIsSavingSocio] = useState(false);
  const [socioSaveError, setSocioSaveError] = useState<string | null>(null);
  const [socioSaveSuccess, setSocioSaveSuccess] = useState(false);

  // Synchronize edits when user details change
  useEffect(() => {
    setEditTelefono(user.telefono || '');
    setEditFoto(user.foto || '');
    setEditDpi(user.dpi || '');
    setEditFechaNacimiento(user.fechaNacimiento || '');
    setEditProfesion(user.profesion || '');
    setEditDireccion(user.direccion || '');
  }, [user]);

  const handleEditSocioClick = () => {
    setIsEditing(true);
    setSocioSaveError(null);
    setSocioSaveSuccess(false);
  };

  const handleEditSocioPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setSocioSaveError(validation.error || "Imagen inválida");
      return;
    }
    try {
      const compressed = await compressImageFile(file, 400, 400, 0.7);
      setEditFoto(compressed);
    } catch (err) {
      console.error("Error compressing image:", err);
      setSocioSaveError("No se pudo procesar la imagen.");
    }
  };

  const handleSaveSocioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSocio(true);
    setSocioSaveError(null);
    setSocioSaveSuccess(false);

    try {
      const updated: Socio = {
        ...user,
        telefono: editTelefono,
        foto: editFoto,
        dpi: editDpi,
        fechaNacimiento: editFechaNacimiento,
        profesion: editProfesion,
        direccion: editDireccion,
        fechaEdicion: new Date().toISOString(),
        editadoPor: 'Socio (Mi Perfil)'
      };

      await firebaseService.saveSocio(updated);

      onUpdateUser(updated);
      setSocioSaveSuccess(true);
      showToast('¡Perfil actualizado con éxito!', 'success');
      setTimeout(() => {
        setSocioSaveSuccess(false);
        setIsEditing(false);
      }, 1500);
    } catch (err: any) {
      console.error("Error updating profile in Firebase:", err);
      setSocioSaveError(err?.message || "No se pudo actualizar el perfil.");
      showToast('Error al actualizar el perfil.', 'error');
    } finally {
      setIsSavingSocio(false);
    }
  };

  // --- Donor calculations ---
  const misDonaciones = useMemo(() => {
    return MOCK_DONACIONES.filter(
      (d) => d.donante.toLowerCase() === user.nombre.toLowerCase()
    );
  }, [user.nombre]);

  const montoTotalDonado = useMemo(() => {
    return misDonaciones.reduce((sum, d) => sum + d.monto, 0);
  }, [misDonaciones]);

  const handleDescargarDiploma = () => {
    generateDiplomaDonacionPDF(user.nombre, montoTotalDonado);
  };

  // --- Standard statistics ---
  const data = [
    { name: 'Pagado', value: 850 },
    { name: 'Pendiente', value: user.montoPendiente || 0 },
  ];
  const COLORS = ['#1e3a8a', '#eab308'];

  // Styling properties for visual categories
  const userIsInactive = user.estatus === 'Inactive';
  const userIsDirectiva = !userIsInactive && (
    user.rol === UserRole.SUPER_ADMIN ||
    user.rol === UserRole.SECRETARIO ||
    user.rol === UserRole.TESORERO ||
    user.rol === UserRole.ASESOR_SERVICIOS ||
    user.rol === UserRole.PRESIDENTE_AFILIACION
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section (Changes Dynamically) */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {activeTab === 'resumen' && (
          isDonante ? (
            <div>
              <span className="bg-yellow-500 text-blue-900 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                Panel del Donante
              </span>
              <h1 className="text-4xl font-black text-blue-900 tracking-tight mt-3">¡Gracias por tu apoyo, {user.nombre}!</h1>
              <p className="text-slate-500 mt-1">Aquí puedes ver el impacto de tu generosidad y descargar tu reconocimiento.</p>
            </div>
          ) : (
            <div>
              <h1 className="text-4xl font-black text-blue-900 tracking-tight">Hola, {user.nombre}</h1>
              <p className="text-slate-500 mt-1">Bienvenido a tu panel de socio.</p>
            </div>
          )
        )}
        {activeTab === 'perfil' && (
          <div>
            <h1 className="text-4xl font-black text-blue-900 tracking-tight">Mi Perfil</h1>
            <p className="text-slate-500 mt-1">Visualiza tu ficha oficial y actualiza tus datos de contacto.</p>
          </div>
        )}
        {activeTab === 'socios' && (
          <div>
            <h1 className="text-4xl font-black text-blue-900 tracking-tight">Gestión de Socios Activos</h1>
            <p className="text-slate-500 mt-1">Administra los roles, puestos, solvencias y estados de las fichas del club.</p>
          </div>
        )}
        <div className="flex items-center space-x-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex-shrink-0">
          <img 
            src={user.foto || `https://picsum.photos/seed/${user.id}/100/100`} 
            className="w-12 h-12 rounded-full border-2 border-yellow-500 object-cover cursor-zoom-in" 
            alt="Avatar"
            onClick={() => setSelectedPhoto({ url: user.foto, title: user.nombre })}
          />
          <div>
            <p className="font-bold text-sm leading-tight text-slate-800">{user.nombre}</p>
            <p className="text-xs text-slate-500 italic font-medium">{user.puesto || 'Socio Regular'}</p>
          </div>
        </div>
      </header>

      {/* Tabs Navigation (Responsive Dropdown on Mobile, Tabs on Desktop) */}
      <div className="flex flex-col md:flex-row gap-4 border-b border-slate-200 pb-2">
        <div className="md:hidden w-full max-w-sm relative z-30">
          <button
            type="button"
            onClick={() => setIsMobileTabMenuOpen(!isMobileTabMenuOpen)}
            className="w-full flex items-center justify-between px-5 py-3.5 bg-blue-900 text-white font-extrabold rounded-2xl shadow-lg border border-blue-800/60 transition-all hover:bg-blue-850 active:scale-[0.99] text-sm"
          >
            <div className="flex items-center space-x-2.5">
              {activeTab === 'resumen' ? (
                <TrendingUp size={18} className="text-yellow-400" />
              ) : activeTab === 'requerimientos' ? (
                <ClipboardList size={18} className="text-yellow-400" />
              ) : (
                <User size={18} className="text-yellow-400" />
              )}
              <span>
                {activeTab === 'resumen' ? 'Resumen General' : activeTab === 'requerimientos' ? 'Convocatorias de Servicio' : 'Mi Perfil'}
              </span>
            </div>
            <ChevronDown size={18} className={`text-slate-300 transition-transform duration-300 ${isMobileTabMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isMobileTabMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2.5 z-45 animate-in fade-in slide-in-from-top-1 duration-200">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('resumen');
                  setIsMobileTabMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-5 py-3 text-sm font-extrabold transition-colors text-left ${
                  activeTab === 'resumen' ? 'bg-blue-50 text-blue-900' : 'text-slate-655 hover:bg-slate-50'
                }`}
              >
                <TrendingUp size={18} className={activeTab === 'resumen' ? 'text-blue-900' : 'text-slate-400'} />
                <span>Resumen General</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('requerimientos');
                  setIsMobileTabMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-5 py-3 text-sm font-extrabold transition-colors text-left ${
                  activeTab === 'requerimientos' ? 'bg-blue-50 text-blue-900' : 'text-slate-655 hover:bg-slate-50'
                }`}
              >
                <ClipboardList size={18} className={activeTab === 'requerimientos' ? 'text-blue-900' : 'text-slate-400'} />
                <span>Convocatorias de Servicio</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('perfil');
                  setIsMobileTabMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-5 py-3 text-sm font-extrabold transition-colors text-left ${
                  activeTab === 'perfil' ? 'bg-blue-50 text-blue-900' : 'text-slate-655 hover:bg-slate-50'
                }`}
              >
                <User size={18} className={activeTab === 'perfil' ? 'text-blue-900' : 'text-slate-400'} />
                <span>Mi Perfil</span>
              </button>

            </div>
          )}
        </div>

        {/* Desktop Tabs Navigation */}
        <div className="hidden md:flex space-x-2">
          <button
            onClick={() => setActiveTab('resumen')}
            className={`flex items-center space-x-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'resumen'
                ? 'bg-blue-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <TrendingUp size={16} />
            <span>Resumen General</span>
          </button>
          <button
            onClick={() => setActiveTab('requerimientos')}
            className={`flex items-center space-x-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'requerimientos'
                ? 'bg-blue-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <ClipboardList size={16} />
            <span>Convocatorias de Servicio</span>
          </button>
          <button
            onClick={() => setActiveTab('perfil')}
            className={`flex items-center space-x-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'perfil'
                ? 'bg-blue-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <User size={16} />
            <span>Mi Perfil</span>
          </button>
        </div>
      </div>

      {/* --- TAB CONTENT: RESUMEN GENERAL --- */}
      {activeTab === 'resumen' && (
        <div className="animate-in fade-in duration-500">
          {isDonante ? (
            /* Donor View */
            <div className="space-y-8">
              {/* KPIs Donante */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-900 to-indigo-950 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                    <Heart size={100} className="fill-white" />
                  </div>
                  <h3 className="text-blue-200 text-xs font-bold uppercase tracking-widest">Total Donado Acumulado</h3>
                  <p className="text-4xl font-black mt-2">Q {montoTotalDonado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs text-yellow-400 mt-3 font-semibold">Sembrando bienestar en Quetzaltenango</p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-200/80 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none text-blue-900">
                    <Gift size={100} />
                  </div>
                  <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Aportes Realizados</h3>
                  <p className="text-4xl font-black text-slate-800 mt-2">{misDonaciones.length} Contribuciones</p>
                  <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg w-fit mt-3 font-semibold">
                    <CheckCircle size={12} className="mr-1" />
                    Fondos recibidos exitosamente
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Diploma de Reconocimiento</h3>
                    <p className="text-sm text-slate-500 mt-2">Descarga tu diploma oficial firmado por la Junta Directiva del Club.</p>
                  </div>
                  <button
                    onClick={handleDescargarDiploma}
                    disabled={montoTotalDonado === 0}
                    className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-black px-5 py-3.5 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Award size={18} />
                    <span>Descargar Diploma</span>
                    <Download size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Historial de donaciones */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-6 lg:col-span-2">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center">
                    <TrendingUp className="mr-2 text-blue-900" />
                    Historial de Contribuciones
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs uppercase tracking-wider">
                          <th className="pb-4">Fecha</th>
                          <th className="pb-4">Causa / Proyecto Patrocinado</th>
                          <th className="pb-4">Tipo</th>
                          <th className="pb-4 text-right">Monto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {misDonaciones.map((don) => (
                          <tr key={don.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 text-sm text-slate-600 font-medium">{don.fecha}</td>
                            <td className="py-4 text-sm font-bold text-slate-800">{don.proyecto}</td>
                            <td className="py-4 text-xs font-semibold text-slate-500">{don.tipo}</td>
                            <td className="py-4 text-sm font-black text-blue-900 text-right">Q {don.monto.toFixed(2)}</td>
                          </tr>
                        ))}
                        {misDonaciones.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-400 italic">No se han registrado donaciones bajo este nombre aún.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Proyectos de Impacto Activos */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-6">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Causas Activas</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">Conoce las campañas activas que buscan financiamiento para seguir sirviendo en Quetzaltenango.</p>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full uppercase">Salud</span>
                        <span className="text-xs font-bold text-yellow-600">Activo</span>
                      </div>
                      <h4 className="font-extrabold text-slate-800 mt-2">Jornada Oftalmológica 2026</h4>
                      <p className="text-xs text-slate-500 mt-1">Meta: Proveer exámenes y lentes correctores gratis a 500 personas de escasos recursos.</p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full uppercase">Educación</span>
                        <span className="text-xs font-bold text-yellow-600">Activo</span>
                      </div>
                      <h4 className="font-extrabold text-slate-800 mt-2">Remodelación Escuela Palajunoj</h4>
                      <p className="text-xs text-slate-500 mt-1">Meta: Reconstruir techos, sanitarios e instalar pizarras en la escuela local del cantón.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Standard Member View */
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-50 text-blue-900 rounded-2xl">
                      <CreditCard size={24} />
                    </div>
                    {user.estadoCuotas === 'Al día' ? (
                      <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                        <CheckCircle size={12} className="mr-1" /> AL DÍA
                      </span>
                    ) : (
                      <span className="flex items-center text-xs font-bold text-yellow-600 bg-yellow-50 px-2.5 py-1 rounded-full">
                        <AlertCircle size={12} className="mr-1" /> PENDIENTE
                      </span>
                    )}
                  </div>
                  <h3 className="text-slate-500 text-sm font-medium">Estado de Cuotas</h3>
                  <p className="text-3xl font-bold mt-1">Q {(user.montoPendiente || 0).toFixed(2)}</p>
                  <p className="text-xs text-slate-400 mt-2">Saldo pendiente al corte actual.</p>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <div className="p-3 bg-yellow-50 text-yellow-600 rounded-2xl w-fit mb-4">
                    <Calendar size={24} />
                  </div>
                  <h3 className="text-slate-500 text-sm font-medium">Asistencia</h3>
                  <p className="text-3xl font-bold mt-1">92%</p>
                  <p className="text-xs text-slate-400 mt-2">Últimos 12 meses.</p>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <div className="p-3 bg-green-50 text-green-600 rounded-2xl w-fit mb-4">
                    <FileText size={24} />
                  </div>
                  <h3 className="text-slate-500 text-sm font-medium">Actas Revisadas</h3>
                  <p className="text-3xl font-bold mt-1">12</p>
                  <p className="text-xs text-slate-400 mt-2">Este año fiscal.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chart Section */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                  <h3 className="text-xl font-bold mb-6 flex items-center">
                    <TrendingUp className="mr-2 text-blue-900" />
                    Resumen Financiero Anual
                  </h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center space-x-8 mt-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-900 rounded-full" />
                      <span className="text-sm text-slate-600">Al día (Q850)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                      <span className="text-sm text-slate-600">Pendiente (Q{user.montoPendiente || 0})</span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                  <h3 className="text-xl font-bold mb-6">Próximos Pasos</h3>
                  <div className="space-y-6">
                    <div className="flex items-center p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer">
                      <div className="bg-blue-900 text-white p-3 rounded-xl mr-4">
                        <FileText size={20} />
                      </div>
                      <div className="flex-grow">
                        <p className="font-bold">Firmar Acta 2026-05</p>
                        <p className="text-xs text-slate-500">Pendiente de revisión</p>
                      </div>
                    </div>
                    <div className="flex items-center p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer">
                      <div className="bg-yellow-500 text-blue-900 p-3 rounded-xl mr-4">
                        <CreditCard size={20} />
                      </div>
                      <div className="flex-grow">
                        <p className="font-bold">Pago Cuota Mensual</p>
                        <p className="text-xs text-slate-500">Próximo vencimiento</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB CONTENT: MI PERFIL (UNIFICADO CON LA TARJETA DEL DIRECTORIO) --- */}
      {activeTab === 'perfil' && (
        <div className="py-6 animate-in fade-in duration-500">
          <div 
            className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl border border-slate-100 hover:border-blue-900/10 transition-all duration-500 flex flex-col relative max-w-md mx-auto w-full group"
          >
            {/* Cabecera decorativa idéntica */}
            <div className="h-28 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 relative">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-300 via-transparent to-transparent"></div>
              
              {/* Badge de Estatus flotante premium */}
              <div className="absolute top-4 right-4">
                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center space-x-1.5 border backdrop-blur-md ${
                  userIsInactive 
                    ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' 
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${userIsInactive ? 'bg-yellow-500 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
                  <span>{userIsInactive ? 'Inactivo' : 'Activo'}</span>
                </span>
              </div>
            </div>

            {/* Avatar y Contenido */}
            <div className="px-6 pb-8 pt-14 flex flex-col items-center text-center relative">
              {/* Contenedor del Avatar flotando sobre la cabecera */}
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                <div className="relative">
                  <img 
                    src={user.foto || `https://picsum.photos/seed/${user.id}/100/100`} 
                    className={`w-24 h-24 rounded-full object-cover border-4 border-white shadow-xl group-hover:scale-105 transition-all duration-500 cursor-zoom-in ring-4 ring-offset-2 ${
                      userIsInactive ? 'ring-slate-400' : userIsDirectiva ? 'ring-amber-400' : 'ring-blue-900'
                    }`} 
                    alt={user.nombre}
                    onClick={() => setSelectedPhoto({ url: user.foto, title: user.nombre })}
                  />
                  <div className="absolute bottom-0 right-0 bg-blue-950 text-amber-400 p-1.5 rounded-full border-2 border-white shadow-md">
                    <Award size={14} />
                  </div>
                </div>
              </div>

              {/* Nombre y Cargo */}
              <div className="space-y-2.5 w-full">
                <h3 className="font-bold text-lg text-slate-900 tracking-tight leading-snug">
                  {user.nombre}
                </h3>
                
                {/* Badge de Puesto */}
                <div className="flex justify-center">
                  <span className={`text-xs font-semibold uppercase tracking-wider px-3.5 py-1 rounded-full border ${
                    userIsDirectiva ? 'bg-amber-50 text-amber-800 border-amber-200/70' : 'bg-slate-50 text-slate-700 border-slate-200/70'
                  }`}>
                    {user.puesto || 'Socio Regular'}
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
                    <span className="font-bold text-slate-800 text-left sm:text-right break-words w-full sm:w-auto">{user.club || 'QUETZALTENANGO'}</span>
                  </div>

                  {/* Correo */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100/60 gap-1">
                    <span className="text-slate-450 flex items-center space-x-1.5 flex-shrink-0">
                      <Mail size={16} className="text-slate-400 flex-shrink-0" />
                      <span>Correo</span>
                    </span>
                    <span className="font-bold text-slate-800 text-left sm:text-right break-all w-full sm:w-auto">{user.correo}</span>
                  </div>

                  {/* Teléfono */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100/60 gap-1">
                    <span className="text-slate-450 flex items-center space-x-1.5 flex-shrink-0">
                      <Phone size={16} className="text-slate-400 flex-shrink-0" />
                      <span>Teléfono</span>
                    </span>
                    <span className="font-bold text-slate-800 text-left sm:text-right break-words w-full sm:w-auto">{user.telefono || 'Sin teléfono'}</span>
                  </div>

                  {/* DPI */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100/60 gap-1">
                    <span className="text-slate-450 flex items-center space-x-1.5 flex-shrink-0">
                      <FileText size={16} className="text-slate-400 flex-shrink-0" />
                      <span>DPI / Identificación</span>
                    </span>
                    <span className="font-bold text-slate-800 text-left sm:text-right break-words w-full sm:w-auto">{user.dpi || 'No indicado'}</span>
                  </div>

                  {/* Fecha Nacimiento */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100/60 gap-1">
                    <span className="text-slate-450 flex items-center space-x-1.5 flex-shrink-0">
                      <Calendar size={16} className="text-slate-400 flex-shrink-0" />
                      <span>Fecha Nacimiento</span>
                    </span>
                    <span className="font-bold text-slate-800 text-left sm:text-right break-words w-full sm:w-auto">{user.fechaNacimiento || 'No indicado'}</span>
                  </div>

                  {/* Profesión */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100/60 gap-1">
                    <span className="text-slate-450 flex items-center space-x-1.5 flex-shrink-0">
                      <Briefcase size={16} className="text-slate-400 flex-shrink-0" />
                      <span>Profesión</span>
                    </span>
                    <span className="font-bold text-slate-800 text-left sm:text-right break-words w-full sm:w-auto">{user.profesion || 'No indicada'}</span>
                  </div>

                  {/* Dirección */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100/60 gap-1">
                    <span className="text-slate-450 flex items-center space-x-1.5 flex-shrink-0">
                      <MapPin size={16} className="text-slate-400 flex-shrink-0" />
                      <span>Dirección</span>
                    </span>
                    <span className="font-bold text-slate-800 text-left sm:text-right break-words w-full sm:w-auto text-xs">{user.direccion || 'No indicada'}</span>
                  </div>

                  {/* Gestión / Período */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-slate-450 flex items-center space-x-1.5 flex-shrink-0">
                      <Calendar size={16} className="text-slate-400 flex-shrink-0" />
                      <span>Gestión</span>
                    </span>
                    <span className="font-bold text-slate-800 text-left sm:text-right break-words w-full sm:w-auto">
                      Miembro desde: {user.fechaIngreso}
                    </span>
                  </div>
                </div>

                {/* Botón Editar Ficha de Perfil */}
                <button
                  type="button"
                  onClick={() => handleEditSocioClick()}
                  className="w-full mt-6 bg-blue-900 hover:bg-blue-800 text-white font-black py-3.5 rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  <Pencil size={16} />
                  <span>Editar Perfil</span>
                </button>

                {/* Botón QR de Acceso */}
                <button
                  type="button"
                  onClick={handleQrClick}
                  disabled={isGeneratingQr}
                  className="w-full mt-3 bg-white hover:bg-yellow-50 text-amber-600 hover:text-amber-700 border border-amber-250 font-black py-3.5 rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <QrCode size={16} />
                  <span>{isGeneratingQr ? 'Generando QR...' : 'Ver Mi Código QR'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Editar Perfil */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-10 space-y-6 relative animate-in zoom-in-95 duration-300 text-left">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-blue-900">Editar Mi Perfil</h2>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Actualiza tus datos de contacto y foto</p>
            </div>

            {socioSaveError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start space-x-3 text-red-700 text-sm animate-in fade-in">
                <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
                <span>{socioSaveError}</span>
              </div>
            )}

            {socioSaveSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start space-x-3 text-green-700 text-sm animate-in fade-in">
                <CheckCircle className="flex-shrink-0 mt-0.5" size={18} />
                <span>¡Perfil actualizado con éxito!</span>
              </div>
            )}

            <form onSubmit={handleSaveSocioSubmit} className="space-y-6">
              {/* Profile Photo Preview / Upload */}
              <div className="flex flex-col items-center space-y-3">
                <div className="relative group">
                  <img
                    src={editFoto || 'https://picsum.photos/seed/placeholder/200/200'}
                    alt="Vista previa"
                    className="w-28 h-28 rounded-full object-cover border-4 border-slate-100 shadow-md"
                  />
                  <label className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-xs font-bold">
                    <Upload size={18} className="mr-1" />
                    <span>Cambiar</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditSocioPhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                  Foto de Perfil (PNG, JPG)
                </span>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-450 uppercase tracking-wide mb-1.5">Nombre Completo</label>
                  <input
                    type="text"
                    value={user.nombre}
                    disabled
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-semibold cursor-not-allowed text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-450 uppercase tracking-wide mb-1.5">Correo Electrónico</label>
                  <input
                    type="email"
                    value={user.correo}
                    disabled
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-semibold cursor-not-allowed text-sm"
                  />
                </div>

                {/* Editable Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-450 uppercase tracking-wide mb-1.5">Teléfono / WhatsApp *</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-sm font-semibold text-slate-400 select-none">
                      +502
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={8}
                      value={editTelefono.replace(/^\+502\s?/, '')}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setEditTelefono(val ? `+502 ${val}` : '');
                      }}
                      placeholder="55555555"
                      className="w-full pl-16 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-sm text-slate-800"
                    />
                  </div>
                </div>

                {/* Editable DPI */}
                <div>
                  <label className="block text-xs font-bold text-slate-450 uppercase tracking-wide mb-1.5">DPI / Identificación</label>
                  <input
                    type="text"
                    placeholder="2352 12345 0101"
                    value={editDpi}
                    onChange={e => setEditDpi(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-sm text-slate-800"
                  />
                </div>

                {/* Editable Fecha Nacimiento */}
                <div>
                  <label className="block text-xs font-bold text-slate-450 uppercase tracking-wide mb-1.5">Fecha Nacimiento</label>
                  <input
                    type="date"
                    value={editFechaNacimiento}
                    onChange={e => setEditFechaNacimiento(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-sm text-slate-800"
                  />
                </div>

                {/* Editable Profesión */}
                <div>
                  <label className="block text-xs font-bold text-slate-450 uppercase tracking-wide mb-1.5">Profesión / Ocupación</label>
                  <input
                    type="text"
                    placeholder="Ej. Ingeniero Civil"
                    value={editProfesion}
                    onChange={e => setEditProfesion(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-sm text-slate-800"
                  />
                </div>

                {/* Editable Dirección */}
                <div>
                  <label className="block text-xs font-bold text-slate-450 uppercase tracking-wide mb-1.5">Dirección de Residencia</label>
                  <input
                    type="text"
                    placeholder="Ej. 12 Av. 10-55, Zona 1, Quetzaltenango"
                    value={editDireccion}
                    onChange={e => setEditDireccion(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-sm text-slate-800"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingSocio}
                  className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-black py-3 rounded-xl text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2 active:scale-95"
                >
                  {isSavingSocio ? (
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
        </div>
      )}

      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-md p-6 sm:p-10 text-center space-y-6 relative animate-in zoom-in-95 duration-300">
            <button 
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-blue-900">Mi Código QR de Acceso</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                {user.nombre}
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                {user.puesto || 'Socio Regular'}
              </p>
            </div>

            {/* QR Image Display */}
            {user.qrToken ? (
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col items-center justify-center space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-inner">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                      window.location.origin + window.location.pathname + '#/login?qr_token=' + user.qrToken
                    )}`}
                    alt="Acceso QR"
                    className="w-56 h-56 object-contain"
                  />
                </div>
                
                <p className="text-[10px] text-slate-450 leading-relaxed font-semibold max-w-xs">
                  Escanea este código con la cámara de tu móvil para iniciar sesión automáticamente en tu cuenta.
                </p>
              </div>
            ) : (
              <div className="py-10 text-slate-450">
                <Loader2 className="animate-spin mx-auto text-blue-900 mb-2" size={32} />
                <p className="text-sm font-semibold">Generando credenciales QR...</p>
              </div>
            )}

            {/* Download Button */}
            {user.qrToken && (
              <button
                type="button"
                onClick={handleDownloadQr}
                className="w-full bg-blue-900 hover:bg-blue-800 text-white py-3.5 rounded-2xl transition-all flex items-center justify-center space-x-2 text-xs font-black shadow-md hover:shadow-lg"
              >
                <Download size={16} />
                <span>Descargar Código QR (PNG)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'requerimientos' && (
        <div className="py-6 animate-in fade-in duration-500">
          <RequerimientosActividades user={user} />
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
  );
};

export default Dashboard;
