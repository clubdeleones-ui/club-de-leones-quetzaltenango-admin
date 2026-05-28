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
  Building
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { MOCK_DONACIONES, MOCK_SOCIOS } from '../constants';
import { generateDiplomaDonacionPDF } from '../utils/pdfGenerator';
import { compressImageFile } from '../utils/imageCompressor';
import { firebaseService } from '../services/firebaseService';

const PUESTOS_PREDEFINIDOS = [
  'Presidente',
  'Vicepresidente',
  'Secretario',
  'Tesorero',
  'Asesor de Servicios',
  'Presidente de Afiliación',
  'Vocal 1',
  'Vocal 2',
  'Socio Regular',
  'Socio Distinguido',
  'Donante Distinguido'
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
  const [activeTab, setActiveTab] = useState<'resumen' | 'perfil' | 'socios'>('resumen');
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

  // --- Profile (Autoservicio) States ---
  const [profileForm, setProfileForm] = useState({
    nombre: user.nombre,
    correo: user.correo,
    telefono: user.telefono || '',
    foto: user.foto || ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Sync profile form state if user changes
  useEffect(() => {
    setProfileForm({
      nombre: user.nombre,
      correo: user.correo,
      telefono: user.telefono || '',
      foto: user.foto || ''
    });
  }, [user]);

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 400, 400, 0.7);
      setProfileForm(prev => ({ ...prev, foto: compressed }));
    } catch (err) {
      console.error("Error compressing image:", err);
      setProfileError("No se pudo procesar la imagen.");
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.nombre.trim() || !profileForm.correo.trim()) {
      setProfileError("El nombre y el correo son obligatorios.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(profileForm.correo)) {
      setProfileError("Ingrese un correo electrónico válido.");
      return;
    }

    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      const updatedSocio: Socio = {
        ...user,
        nombre: profileForm.nombre,
        correo: profileForm.correo,
        telefono: profileForm.telefono,
        foto: profileForm.foto,
        editadoPor: user.nombre,
        fechaEdicion: new Date().toISOString()
      };

      await firebaseService.saveSocio(updatedSocio);
      onUpdateUser(updatedSocio);
      
      // Keep socios cache updated
      const local = localStorage.getItem('club_leones_socios_v3');
      if (local) {
        const parsed: Socio[] = JSON.parse(local);
        const updatedList = parsed.map(s => s.id === updatedSocio.id ? updatedSocio : s);
        localStorage.setItem('club_leones_socios_v3', JSON.stringify(updatedList));
      }

      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setProfileError(err?.message || "Ocurrió un error al guardar tu perfil.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // --- Administrative: Partner Management States ---
  const [socios, setSocios] = useState<Socio[]>(() => {
    const local = localStorage.getItem('club_leones_socios_v3');
    if (local) return JSON.parse(local);
    return [];
  });
  const [isLoadingSocios, setIsLoadingSocios] = useState(false);
  const [socioSearch, setSocioSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [financialFilter, setFinancialFilter] = useState('Todos');

  // Modal edit state
  const [editingSocio, setEditingSocio] = useState<Socio | null>(null);
  const [editSocioForm, setEditSocioForm] = useState<Partial<Socio>>({});
  const [isSavingSocio, setIsSavingSocio] = useState(false);
  const [socioSaveSuccess, setSocioSaveSuccess] = useState(false);
  const [socioSaveError, setSocioSaveError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string } | null>(null);

  const fetchSociosList = async () => {
    if (!isAdministrative) return;
    setIsLoadingSocios(true);
    try {
      const list = await firebaseService.getSocios();
      if (list && list.length > 0) {
        setSocios(list);
        localStorage.setItem('club_leones_socios_v3', JSON.stringify(list));
      }
    } catch (err) {
      console.error("Error fetching socios for admin:", err);
    } finally {
      setIsLoadingSocios(false);
    }
  };

  useEffect(() => {
    fetchSociosList();
  }, [isAdministrative]);

  const handleEditSocioClick = (socio: Socio) => {
    setEditingSocio(socio);
    setEditSocioForm({ ...socio });
    setSocioSaveError(null);
    setSocioSaveSuccess(false);
  };

  const handleEditSocioPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 400, 400, 0.7);
      setEditSocioForm(prev => ({ ...prev, foto: compressed }));
    } catch (err) {
      console.error("Error compressing image:", err);
      setSocioSaveError("No se pudo procesar la imagen.");
    }
  };

  const handleSaveSocioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSocio || !editSocioForm.nombre?.trim() || !editSocioForm.correo?.trim()) {
      setSocioSaveError("El nombre y el correo son obligatorios.");
      return;
    }

    setIsSavingSocio(true);
    setSocioSaveError(null);

    try {
      const updated: Socio = {
        ...editingSocio,
        ...editSocioForm,
        editadoPor: user.nombre,
        fechaEdicion: new Date().toISOString()
      } as Socio;

      await firebaseService.saveSocio(updated);
      
      const newSociosList = socios.map(s => s.id === updated.id ? updated : s);
      setSocios(newSociosList);
      localStorage.setItem('club_leones_socios_v3', JSON.stringify(newSociosList));

      // If editing self, notify parent
      if (updated.id === user.id) {
        onUpdateUser(updated);
      }

      setSocioSaveSuccess(true);
      setTimeout(() => {
        setSocioSaveSuccess(false);
        setEditingSocio(null);
      }, 1500);
    } catch (err: any) {
      console.error("Error updating socio:", err);
      setSocioSaveError(err?.message || "No se pudo actualizar la ficha.");
    } finally {
      setIsSavingSocio(false);
    }
  };

  // Filter partners
  const filteredSocios = useMemo(() => {
    return socios.filter(s => {
      const matchesSearch = 
        s.nombre.toLowerCase().includes(socioSearch.toLowerCase()) ||
        s.correo.toLowerCase().includes(socioSearch.toLowerCase());
      
      const matchesRole = roleFilter === 'Todos' || s.rol === roleFilter;
      
      const matchesStatus = 
        statusFilter === 'Todos' ||
        (statusFilter === 'Activos' && s.estatus !== 'Inactive') ||
        (statusFilter === 'Inactivos' && s.estatus === 'Inactive');
      
      const matchesFinancial = 
        financialFilter === 'Todos' ||
        (financialFilter === 'al_dia' && s.estadoCuotas === 'Al día') ||
        (financialFilter === 'pendiente' && s.estadoCuotas === 'Pendiente') ||
        (financialFilter === 'en_mora' && s.estadoCuotas === 'En mora');

      return matchesSearch && matchesRole && matchesStatus && matchesFinancial;
    });
  }, [socios, socioSearch, roleFilter, statusFilter, financialFilter]);

  // --- Donor calculations ---
  const misDonaciones = useMemo(() => {
    return MOCK_DONACIONES.filter(
      (d) => d.donante.toLowerCase() === user.nombre.toLowerCase()
    );
  }, [user.nombre]);

  const montoTotalDonado = useMemo(() => {
    return misDonaciones.reduce((sum, d) => sum + d.monto, 0);
  }, [misDonaciones]);

  // --- Standard statistics ---
  const data = [
    { name: 'Pagado', value: 850 },
    { name: 'Pendiente', value: user.montoPendiente || 0 },
  ];
  const COLORS = ['#1e3a8a', '#eab308'];

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
            <p className="text-slate-500 mt-1">Modifica tus datos de contacto y sube tu foto de perfil.</p>
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
              ) : activeTab === 'perfil' ? (
                <User size={18} className="text-yellow-400" />
              ) : (
                <Users size={18} className="text-yellow-400" />
              )}
              <span>
                {activeTab === 'resumen' ? 'Resumen General' : activeTab === 'perfil' ? 'Mi Perfil' : 'Gestionar Socios'}
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
                  activeTab === 'resumen' ? 'bg-blue-50 text-blue-900' : 'text-slate-650 hover:bg-slate-50'
                }`}
              >
                <TrendingUp size={18} className={activeTab === 'resumen' ? 'text-blue-900' : 'text-slate-400'} />
                <span>Resumen General</span>
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
              {isAdministrative && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('socios');
                    setIsMobileTabMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-5 py-3 text-sm font-extrabold transition-colors text-left ${
                    activeTab === 'socios' ? 'bg-blue-50 text-blue-900' : 'text-slate-655 hover:bg-slate-50'
                  }`}
                >
                  <Users size={18} className={activeTab === 'socios' ? 'text-blue-900' : 'text-slate-400'} />
                  <span>Gestionar Socios</span>
                </button>
              )}
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
          {isAdministrative && (
            <button
              onClick={() => setActiveTab('socios')}
              className={`flex items-center space-x-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'socios'
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <Users size={16} />
              <span>Gestionar Socios</span>
            </button>
          )}
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

      {/* --- TAB CONTENT: MI PERFIL (AUTOSERVICIO) --- */}
      {activeTab === 'perfil' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
          {/* Card: Foto & Institutional Info */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm flex flex-col items-center text-center space-y-6">
            <div className="relative group">
              <img 
                src={profileForm.foto || `https://picsum.photos/seed/${user.id}/200/200`} 
                alt="Foto de perfil" 
                className="w-32 h-32 rounded-full object-cover border-4 border-slate-100 shadow-lg group-hover:opacity-90 transition-opacity" 
              />
              <label 
                htmlFor="profile-upload" 
                className="absolute bottom-1 right-1 bg-yellow-500 text-blue-900 p-2.5 rounded-full border-2 border-white shadow-md hover:bg-yellow-600 transition-all cursor-pointer transform hover:scale-105 active:scale-95 flex items-center justify-center"
                title="Cambiar foto de perfil"
              >
                <Upload size={16} />
                <input 
                  type="file" 
                  id="profile-upload" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleProfilePhotoChange} 
                />
              </label>
            </div>

            <div>
              <h3 className="font-extrabold text-xl text-slate-800 leading-tight">{profileForm.nombre || user.nombre}</h3>
              <p className="text-xs font-black uppercase text-yellow-600 tracking-wider mt-1.5">{user.puesto || 'Socio Regular'}</p>
            </div>

            {/* Read-only Institutional Fields */}
            <div className="w-full bg-slate-50 rounded-2xl p-5 text-left text-xs font-bold text-slate-550 space-y-4 border border-slate-100">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center">
                <Lock size={12} className="mr-1.5 text-slate-400" />
                Información de Membresía
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-450 flex items-center"><Building size={14} className="mr-1.5 text-slate-400" /> Club</span>
                <span className="text-slate-800 font-extrabold">{user.club || 'QUETZALTENANGO'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-450 flex items-center"><User size={14} className="mr-1.5 text-slate-400" /> Rol</span>
                <span className="text-slate-800 font-extrabold">
                  {user.rol === UserRole.SUPER_ADMIN ? 'Super Administrador' :
                   user.rol === UserRole.SECRETARIO ? 'Secretario' :
                   user.rol === UserRole.TESORERO ? 'Tesorero' :
                   user.rol === UserRole.ASESOR_SERVICIOS ? 'Asesor de Servicios' :
                   user.rol === UserRole.PRESIDENTE_AFILIACION ? 'Presidente de Afiliación' :
                   user.rol === UserRole.DONANTE ? 'Donante' : 'Socio Activo'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-450 flex items-center"><Calendar size={14} className="mr-1.5 text-slate-400" /> Miembro desde</span>
                <span className="text-slate-800 font-extrabold">{user.fechaIngreso}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100/80">
                <span className="text-slate-450 flex items-center"><CreditCard size={14} className="mr-1.5 text-slate-400" /> Solvencia</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] ${
                  user.estadoCuotas === 'Al día' ? 'bg-green-50 text-green-700' :
                  user.estadoCuotas === 'Pendiente' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                }`}>
                  ● {user.estadoCuotas}
                </span>
              </div>
            </div>
          </div>

          {/* Form: Editable Fields */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm lg:col-span-2 space-y-6">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Editar Datos Personales</h3>
            <p className="text-sm text-slate-450 leading-relaxed font-medium">
              Por favor, mantén tu nombre, dirección de correo electrónico y teléfono móvil de contacto actualizados para que la directiva y otros socios puedan comunicarse contigo.
            </p>

            {profileError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start space-x-3 text-red-700 text-sm animate-in fade-in">
                <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start space-x-3 text-green-700 text-sm animate-in fade-in">
                <CheckCircle className="flex-shrink-0 mt-0.5" size={18} />
                <span>¡Tu perfil se ha actualizado y guardado correctamente!</span>
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre Completo *</label>
                <input 
                  type="text"
                  required
                  value={profileForm.nombre}
                  onChange={e => setProfileForm(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Correo Electrónico *</label>
                  <input 
                    type="email"
                    required
                    value={profileForm.correo}
                    onChange={e => setProfileForm(prev => ({ ...prev, correo: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Teléfono de Contacto</label>
                  <input 
                    type="tel"
                    placeholder="Ej. +502 5555-5555"
                    value={profileForm.telefono}
                    onChange={e => setProfileForm(prev => ({ ...prev, telefono: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="bg-blue-900 hover:bg-blue-800 disabled:bg-blue-900/50 text-white font-black px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-900/10 flex items-center justify-center space-x-2"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      <span>Guardar Perfil</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: GESTIONAR SOCIOS (ADMINISTRATIVO) --- */}
      {activeTab === 'socios' && isAdministrative && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Filters card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="text-xs font-bold text-slate-450 uppercase tracking-widest flex items-center">
              <Filter size={14} className="mr-1.5 text-slate-400" />
              Búsqueda y Filtros de Directorio
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Text Search */}
              <div className="relative">
                <Search size={18} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Buscar por nombre o correo..."
                  value={socioSearch}
                  onChange={e => setSocioSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-semibold"
                />
              </div>

              {/* Role filter */}
              <div>
                <select 
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-semibold bg-white"
                >
                  <option value="Todos">Rol: Todos</option>
                  {ROLES_LIST.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Status filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-semibold bg-white"
                >
                  <option value="Todos">Estatus: Todos</option>
                  <option value="Activos">Estatus: Activos</option>
                  <option value="Inactivos">Estatus: Inactivos</option>
                </select>
              </div>

              {/* Financial filter */}
              <div>
                <select
                  value={financialFilter}
                  onChange={e => setFinancialFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-semibold bg-white"
                >
                  <option value="Todos">Cuotas: Todos</option>
                  <option value="al_dia">Cuotas: Al día</option>
                  <option value="pendiente">Cuotas: Pendiente</option>
                  <option value="en_mora">Cuotas: En mora</option>
                </select>
              </div>
            </div>
          </div>

          {/* List display */}
          <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-sm overflow-hidden">
            {isLoadingSocios ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="animate-spin text-blue-900" size={36} />
                <p className="text-slate-500 font-bold text-sm">Cargando directorio de socios...</p>
              </div>
            ) : filteredSocios.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <Users className="mx-auto text-slate-300" size={48} />
                <h4 className="text-lg font-bold text-slate-700">No se encontraron socios</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">Prueba cambiando los filtros o el texto del buscador.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-250 text-slate-400 font-bold text-xs uppercase tracking-wider">
                      <th className="p-5">Miembro</th>
                      <th className="p-5">Contacto</th>
                      <th className="p-5">Puesto y Rol</th>
                      <th className="p-5">Estado Financiero</th>
                      <th className="p-5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSocios.map(socio => (
                      <tr key={socio.id} className={`hover:bg-slate-50/50 transition-colors ${socio.estatus === 'Inactive' ? 'opacity-60 bg-slate-50/30' : ''}`}>
                        <td className="p-5">
                          <div className="flex items-center space-x-3.5">
                            <img 
                              src={socio.foto || `https://picsum.photos/seed/${socio.id}/100/100`} 
                              alt={socio.nombre} 
                              className="w-11 h-11 rounded-full object-cover border border-slate-100 shadow-sm cursor-zoom-in"
                              onClick={() => setSelectedPhoto({ url: socio.foto, title: socio.nombre })}
                            />
                            <div className="min-w-0">
                              <p className="font-extrabold text-slate-800 text-sm leading-tight flex items-center">
                                {socio.nombre}
                                {socio.estatus === 'Inactive' && (
                                  <span className="ml-2 bg-slate-200 text-slate-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Inactivo</span>
                                )}
                              </p>
                              <p className="text-xs text-slate-400 mt-1 font-semibold">Ingresó: {socio.fechaIngreso}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-5">
                          <div className="text-xs space-y-1 font-semibold">
                            <div className="flex items-center text-slate-700">
                              <Mail size={12} className="mr-1.5 text-slate-400" />
                              <span>{socio.correo}</span>
                            </div>
                            <div className="flex items-center text-slate-600">
                              <Phone size={12} className="mr-1.5 text-slate-400" />
                              <span>{socio.telefono || 'Sin teléfono'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-5">
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200/50 block w-fit">
                              {socio.puesto || 'Socio Regular'}
                            </span>
                            <span className="text-[10px] text-blue-900 font-bold uppercase tracking-wider block pl-1">
                              {socio.rol}
                            </span>
                          </div>
                        </td>
                        <td className="p-5">
                          <div className="space-y-1">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              socio.estadoCuotas === 'Al día' ? 'bg-green-50 text-green-700 border border-green-100' :
                              socio.estadoCuotas === 'Pendiente' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
                              'bg-red-50 text-red-700 border border-red-100'
                            }`}>
                              ● {socio.estadoCuotas}
                            </span>
                            {socio.montoPendiente > 0 && (
                              <p className="text-xs font-bold text-slate-700 mt-1">Q {socio.montoPendiente.toFixed(2)}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-5 text-right">
                          <button
                            onClick={() => handleEditSocioClick(socio)}
                            className="bg-slate-55/60 hover:bg-blue-50 text-slate-600 hover:text-blue-900 border border-slate-200/60 p-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center ml-auto shadow-sm"
                            title="Editar Ficha"
                          >
                            <Pencil size={14} className="mr-1.5" />
                            <span>Editar</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal "Editar Ficha de Socio" */}
          {editingSocio && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-10 space-y-6 relative animate-in zoom-in-95 duration-300">
                <button 
                  type="button"
                  onClick={() => setEditingSocio(null)}
                  className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-blue-900">Editar Ficha de Socio</h2>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Panel Administrativo de Control</p>
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
                    <span>¡Ficha de socio actualizada exitosamente!</span>
                  </div>
                )}

                <form onSubmit={handleSaveSocioSubmit} className="space-y-6">
                  {/* Photo & Estatus Row */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
                    <div className="relative group flex-shrink-0">
                      <img 
                        src={editSocioForm.foto || `https://picsum.photos/seed/${editingSocio.id}/150/150`} 
                        alt="Avatar de socio" 
                        className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-md"
                      />
                      <label 
                        htmlFor="socio-photo-upload"
                        className="absolute bottom-0 right-0 bg-yellow-500 text-blue-900 p-2 rounded-full border-2 border-white shadow-sm hover:bg-yellow-600 cursor-pointer flex items-center justify-center"
                        title="Cambiar foto de socio"
                      >
                        <Upload size={14} />
                        <input 
                          type="file" 
                          id="socio-photo-upload" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleEditSocioPhotoChange} 
                        />
                      </label>
                    </div>

                    <div className="flex-grow space-y-4 w-full">
                      {/* Estatus Institucional select */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Estatus Institucional *</label>
                        <select 
                          value={editSocioForm.estatus === 'Inactive' ? 'Inactive' : 'Active'}
                          onChange={e => setEditSocioForm(prev => ({ ...prev, estatus: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-semibold bg-white"
                        >
                          <option value="Active">Activo (Visible en Directorio)</option>
                          <option value="Inactive">Inactivo (Oculto en Directorio)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Name & Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre Completo *</label>
                      <input 
                        type="text"
                        required
                        value={editSocioForm.nombre || ''}
                        onChange={e => setEditSocioForm(prev => ({ ...prev, nombre: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Correo Electrónico *</label>
                      <input 
                        type="email"
                        required
                        value={editSocioForm.correo || ''}
                        onChange={e => setEditSocioForm(prev => ({ ...prev, correo: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Teléfono</label>
                      <input 
                        type="text"
                        placeholder="Ej. +502 5555-5555"
                        value={editSocioForm.telefono || ''}
                        onChange={e => setEditSocioForm(prev => ({ ...prev, telefono: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Club de Leones</label>
                      <input 
                        type="text"
                        value={editSocioForm.club || 'QUETZALTENANGO'}
                        onChange={e => setEditSocioForm(prev => ({ ...prev, club: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Puesto & Rol */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Puesto en Junta Directiva *</label>
                      <select 
                        value={editSocioForm.puesto || 'Socio Regular'}
                        onChange={e => setEditSocioForm(prev => ({ ...prev, puesto: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none text-sm font-semibold bg-white"
                      >
                        {PUESTOS_PREDEFINIDOS.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rol del Sistema (Permisos) *</label>
                      <select 
                        value={editSocioForm.rol || UserRole.SOCIO}
                        onChange={e => setEditSocioForm(prev => ({ ...prev, rol: e.target.value as UserRole }))}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none text-sm font-semibold bg-white"
                      >
                        {ROLES_LIST.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Financiero: Cuotas y Saldo */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Estado de Solvencia de Cuota *</label>
                      <select 
                        value={editSocioForm.estadoCuotas || 'Al día'}
                        onChange={e => setEditSocioForm(prev => ({ ...prev, estadoCuotas: e.target.value as any }))}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none text-sm font-semibold bg-white"
                      >
                        <option value="Al día">Al día</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="En mora">En mora</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Monto Pendiente (Q) *</label>
                      <input 
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={editSocioForm.montoPendiente === undefined ? 0 : editSocioForm.montoPendiente}
                        onChange={e => setEditSocioForm(prev => ({ ...prev, montoPendiente: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Audit details at the bottom */}
                  {editingSocio.fechaEdicion && (
                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 flex flex-col sm:flex-row gap-2 justify-between text-[11px] font-bold text-slate-400">
                      <span>Última modificación: {new Date(editingSocio.fechaEdicion).toLocaleString('es-GT')}</span>
                      {editingSocio.editadoPor && <span>Por: {editingSocio.editadoPor}</span>}
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingSocio(null)}
                      className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingSocio}
                      className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-900/50 text-white font-black rounded-xl shadow-lg transition-all text-sm flex items-center justify-center space-x-2"
                    >
                      {isSavingSocio ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
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
        </div>
      )}

      {/* Shared Lightbox Photo Preview Modal */}
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
