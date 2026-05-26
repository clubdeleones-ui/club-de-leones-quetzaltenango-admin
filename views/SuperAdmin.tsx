import React, { useState, useMemo, useEffect } from 'react';
import { 
  MOCK_SOCIOS, 
  MOCK_ACTIVIDADES, 
  MOCK_ACTAS, 
  MOCK_DONACIONES, 
  MOCK_BENEFICIOS 
} from '../constants';
import { 
  Socio, 
  Actividad, 
  Acta, 
  Donacion, 
  Beneficio, 
  UserRole,
  PropuestaSocio
} from '../types';
import { 
  TrendingUp, 
  Calendar, 
  CreditCard, 
  FileText, 
  Gift, 
  Award, 
  Plus, 
  Search, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle, 
  UserPlus,
  Trash2,
  Filter,
  Check,
  Send,
  X,
  Download
} from 'lucide-react';
import { generateActaPDF } from '../utils/pdfGenerator';


interface SuperAdminProps {
  user: Socio;
}

type TabType = 'resumen' | 'calendario' | 'cuotas' | 'actas' | 'donaciones' | 'beneficios' | 'propuestas';

const SuperAdmin: React.FC<SuperAdminProps> = ({ user }) => {
  // Dynamic Tab Access based on Role
  const allowedTabs = useMemo(() => {
    switch (user.rol) {
      case UserRole.SUPER_ADMIN:
        return ['resumen', 'calendario', 'cuotas', 'actas', 'donaciones', 'beneficios', 'propuestas'];
      case UserRole.TESORERO:
        return ['resumen', 'cuotas', 'donaciones'];
      case UserRole.SECRETARIO:
        return ['resumen', 'calendario', 'actas', 'propuestas'];
      case UserRole.ASESOR_SERVICIOS:
        return ['calendario', 'beneficios'];
      case UserRole.PRESIDENTE_AFILIACION:
        return ['resumen', 'cuotas'];
      default:
        return [];
    }
  }, [user.rol]);

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (user.rol === UserRole.ASESOR_SERVICIOS) return 'calendario';
    return 'resumen';
  });

  useEffect(() => {
    if (!allowedTabs.includes(activeTab)) {
      setActiveTab(allowedTabs[0] as TabType);
    }
  }, [allowedTabs, activeTab]);
  
  // Dynamic States with localStorage persistence
  const [socios, setSocios] = useState<Socio[]>(() => {
    const local = localStorage.getItem('club_leones_socios');
    if (local) return JSON.parse(local);
    localStorage.setItem('club_leones_socios', JSON.stringify(MOCK_SOCIOS));
    return MOCK_SOCIOS;
  });

  const [propuestas, setPropuestas] = useState<PropuestaSocio[]>(() => {
    const local = localStorage.getItem('club_leones_propuestas');
    return local ? JSON.parse(local) : [];
  });

  useEffect(() => {
    localStorage.setItem('club_leones_socios', JSON.stringify(socios));
  }, [socios]);

  useEffect(() => {
    localStorage.setItem('club_leones_propuestas', JSON.stringify(propuestas));
  }, [propuestas]);

  const [actividades, setActividades] = useState<Actividad[]>(MOCK_ACTIVIDADES);
  const [actas, setActas] = useState<Acta[]>(MOCK_ACTAS);
  const [donaciones, setDonaciones] = useState<Donacion[]>(MOCK_DONACIONES);
  const [beneficios, setBeneficios] = useState<Beneficio[]>(MOCK_BENEFICIOS);

  // Search & Filter States
  const [socioSearch, setSocioSearch] = useState('');
  const [actaSearch, setActaSearch] = useState('');
  const [donacionSearch, setDonacionSearch] = useState('');
  const [actaFilterCategory, setActaFilterCategory] = useState('Todas');
  
  // Modals / Form States
  const [showAddActa, setShowAddActa] = useState(false);
  const [newActa, setNewActa] = useState({ titulo: '', autor: '', contenido: '', categoria: 'Asamblea' });

  const [showAddActividad, setShowAddActividad] = useState(false);
  const [newActividad, setNewActividad] = useState({ titulo: '', descripcion: '', fecha: '', lugar: '', publica: true });

  const [showAddDonacion, setShowAddDonacion] = useState(false);
  const [newDonacion, setNewDonacion] = useState({ donante: '', monto: '', proyecto: '', tipo: 'Individual' as 'Individual' | 'Empresarial' });

  const [showAddBeneficio, setShowAddBeneficio] = useState(false);
  const [newBeneficio, setNewBeneficio] = useState({ titulo: '', descripcion: '', convenioCon: '', descuento: '', categoria: 'Salud' as any });

  // Global KPIs calculation
  const totalDonaciones = useMemo(() => donaciones.reduce((sum, d) => sum + d.monto, 0), [donaciones]);
  const totalCuotasPendientes = useMemo(() => socios.reduce((sum, s) => sum + s.montoPendiente, 0), [socios]);
  const sociosAlDia = useMemo(() => socios.filter(s => s.estadoCuotas === 'Al día').length, [socios]);
  
  // Handle proposals approval and rejection
  const handleAprobarPropuesta = (propuestaId: string) => {
    const propuesta = propuestas.find(p => p.id === propuestaId);
    if (!propuesta) return;

    // 1. Update proposal status
    const nuevasPropuestas = propuestas.map(p => {
      if (p.id === propuestaId) return { ...p, estado: 'Aprobado' as const };
      return p;
    });
    setPropuestas(nuevasPropuestas);

    // 2. Add new member to list
    const nuevoSocio: Socio = {
      id: `socio-${Date.now()}`,
      nombre: propuesta.nombreCandidato,
      correo: propuesta.nombreCandidato.toLowerCase().replace(/[^a-z0-9]+/g, '') + '@leonesxela.com',
      rol: UserRole.SOCIO,
      puesto: 'Socio Ingresado',
      estadoCuotas: 'Al día',
      montoPendiente: 0,
      foto: propuesta.fotoCandidato || 'https://picsum.photos/seed/socio/200/200',
      fechaIngreso: new Date().toISOString().split('T')[0]
    };
    setSocios([nuevoSocio, ...socios]);

    alert(`La propuesta para ${propuesta.nombreCandidato} ha sido aprobada. ¡Ahora es miembro activo del club!`);
  };

  const handleRechazarPropuesta = (propuestaId: string) => {
    const nuevasPropuestas = propuestas.map(p => {
      if (p.id === propuestaId) return { ...p, estado: 'Rechazado' as const };
      return p;
    });
    setPropuestas(nuevasPropuestas);
    alert('La propuesta ha sido rechazada.');
  };

  // Handle action handlers
  const handleAddActa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActa.titulo || !newActa.contenido || !newActa.autor) return;
    const created: Acta = {
      id: `acta-${Date.now()}`,
      titulo: newActa.titulo,
      fecha: new Date().toISOString().split('T')[0],
      contenido: newActa.contenido,
      autor: newActa.autor,
      pdfUrl: '#',
      categoria: newActa.categoria,
      estado: 'Publicada'
    };
    setActas([created, ...actas]);
    setNewActa({ titulo: '', autor: '', contenido: '', categoria: 'Asamblea' });
    setShowAddActa(false);
  };

  const handleAddActividad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActividad.titulo || !newActividad.fecha || !newActividad.lugar) return;
    const created: Actividad = {
      id: `ev-${Date.now()}`,
      titulo: newActividad.titulo,
      descripcion: newActividad.descripcion,
      fecha: newActividad.fecha.replace('T', ' '),
      lugar: newActividad.lugar,
      imagen: 'https://picsum.photos/seed/' + Math.random() + '/600/400',
      publica: newActividad.publica
    };
    setActividades([created, ...actividades]);
    setNewActividad({ titulo: '', descripcion: '', fecha: '', lugar: '', publica: true });
    setShowAddActividad(false);
  };

  const handleAddDonacion = (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseFloat(newDonacion.monto);
    if (!newDonacion.donante || isNaN(montoNum) || !newDonacion.proyecto) return;
    const created: Donacion = {
      id: `don-${Date.now()}`,
      donante: newDonacion.donante,
      monto: montoNum,
      fecha: new Date().toISOString().split('T')[0],
      proyecto: newDonacion.proyecto,
      tipo: newDonacion.tipo
    };
    setDonaciones([created, ...donaciones]);
    setNewDonacion({ donante: '', monto: '', proyecto: '', tipo: 'Individual' });
    setShowAddDonacion(false);
  };

  const handleAddBeneficio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBeneficio.titulo || !newBeneficio.convenioCon || !newBeneficio.descuento) return;
    const created: Beneficio = {
      id: `ben-${Date.now()}`,
      titulo: newBeneficio.titulo,
      descripcion: newBeneficio.descripcion,
      convenioCon: newBeneficio.convenioCon,
      descuento: newBeneficio.descuento,
      categoria: newBeneficio.categoria
    };
    setBeneficios([created, ...beneficios]);
    setNewBeneficio({ titulo: '', descripcion: '', convenioCon: '', descuento: '', categoria: 'Salud' });
    setShowAddBeneficio(false);
  };

  const handleRegistrarPago = (socioId: string) => {
    setSocios(socios.map(s => {
      if (s.id === socioId) {
        return {
          ...s,
          estadoCuotas: 'Al día',
          montoPendiente: 0
        };
      }
      return s;
    }));
  };

  const handleEnviarRecordatorio = (socio: Socio) => {
    alert(`Recordatorio de cobro de Q${socio.montoPendiente} enviado por correo a: ${socio.correo}`);
  };

  const handleDeleteActividad = (id: string) => {
    setActividades(actividades.filter(a => a.id !== id));
  };

  const handleDeleteActa = (id: string) => {
    setActas(actas.filter(a => a.id !== id));
  };

  // Filtered views
  const filteredSocios = socios.filter(s => 
    s.nombre.toLowerCase().includes(socioSearch.toLowerCase()) ||
    s.correo.toLowerCase().includes(socioSearch.toLowerCase())
  );

  const filteredActas = actas.filter(a => {
    const matchesSearch = a.titulo.toLowerCase().includes(actaSearch.toLowerCase()) || 
                          a.contenido.toLowerCase().includes(actaSearch.toLowerCase());
    const matchesCategory = actaFilterCategory === 'Todas' || a.categoria === actaFilterCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredDonaciones = donaciones.filter(d => 
    d.donante.toLowerCase().includes(donacionSearch.toLowerCase()) ||
    d.proyecto.toLowerCase().includes(donacionSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 animate-in fade-in duration-700">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="bg-yellow-500 text-blue-900 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest animate-pulse">
            Acceso {
              user.rol === UserRole.SUPER_ADMIN ? 'Super Administrador' :
              user.rol === UserRole.TESORERO ? 'Tesorero' :
              user.rol === UserRole.SECRETARIO ? 'Secretario' : 
              user.rol === UserRole.PRESIDENTE_AFILIACION ? 'Presidente de Afiliación' : 'Asesor de Servicios'
            }
          </span>
          <h1 className="text-5xl font-black text-blue-900 tracking-tight mt-3">Panel de Control Ejecutivo</h1>
          <p className="text-lg text-slate-500 mt-2">Gestiona las actividades, finanzas, actas y beneficios del club en un solo lugar.</p>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-72 flex-shrink-0">
          <nav className="bg-white border border-slate-200/80 rounded-[2rem] p-6 shadow-sm space-y-2 sticky top-28">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4 mb-4">Navegación Módulos</div>
            {[
              { id: 'resumen', label: 'Resumen General', icon: TrendingUp },
              { id: 'calendario', label: 'Programas / Calendario', icon: Calendar },
              { id: 'cuotas', label: 'Control de Cuotas', icon: CreditCard },
              { id: 'actas', label: 'Libro de Actas', icon: FileText },
              { id: 'donaciones', label: 'Donaciones Recibidas', icon: Gift },
              { id: 'beneficios', label: 'Beneficios a Socios', icon: Award },
              { id: 'propuestas', label: 'Propuestas Socios', icon: UserPlus },
            ].filter(tab => allowedTabs.includes(tab.id)).map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl font-bold transition-all ${
                    active 
                      ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/10' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={20} className={active ? 'text-yellow-400' : 'text-slate-400'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 min-w-0">
          {/* TAB: RESUMEN GENERAL */}
          {activeTab === 'resumen' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* KPI 1 (Total Donaciones for Admin/Tesorero, Total Actas for Secretario, Total Socios for Afiliacion) */}
                {user.rol === UserRole.SECRETARIO ? (
                  <div className="bg-gradient-to-br from-blue-900 to-indigo-950 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                      <FileText size={120} />
                    </div>
                    <h3 className="text-blue-200 text-sm font-bold uppercase tracking-widest">Biblioteca de Actas</h3>
                    <p className="text-4xl font-black mt-2">{actas.length} Actas</p>
                    <p className="text-xs text-yellow-400 mt-3 font-semibold">Documentos redactados y firmados</p>
                  </div>
                ) : user.rol === UserRole.PRESIDENTE_AFILIACION ? (
                  <div className="bg-gradient-to-br from-blue-900 to-indigo-950 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                      <Award size={120} />
                    </div>
                    <h3 className="text-blue-200 text-sm font-bold uppercase tracking-widest">Total de Socios Afiliados</h3>
                    <p className="text-4xl font-black mt-2">{socios.length} Miembros</p>
                    <p className="text-xs text-yellow-400 mt-3 font-semibold">Socios registrados en el club</p>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-blue-900 to-indigo-950 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                      <Gift size={120} />
                    </div>
                    <h3 className="text-blue-200 text-sm font-bold uppercase tracking-widest">Total Donaciones Recibidas</h3>
                    <p className="text-4xl font-black mt-2">Q {totalDonaciones.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-yellow-400 mt-3 font-semibold">Total acumulado en este año fiscal</p>
                  </div>
                )}

                {/* KPI 2 (Cuotas Pendientes for Admin/Tesorero/Afiliacion, Actividades Planificadas for Secretario) */}
                {user.rol === UserRole.SECRETARIO ? (
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-sm relative overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none text-blue-900">
                      <Calendar size={120} />
                    </div>
                    <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest">Programas Planificados</h3>
                    <p className="text-4xl font-black text-slate-800 mt-2">{actividades.length} Actividades</p>
                    <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg w-fit mt-3 font-semibold">
                      <CheckCircle size={12} className="mr-1" />
                      En agenda y calendario
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-sm relative overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none text-blue-900">
                      <CreditCard size={120} />
                    </div>
                    <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest">Saldo de Cuotas Pendiente</h3>
                    <p className="text-4xl font-black text-slate-800 mt-2">Q {totalCuotasPendientes.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
                    <div className="flex items-center text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg w-fit mt-3 font-semibold">
                      <AlertTriangle size={12} className="mr-1" />
                      {user.rol === UserRole.PRESIDENTE_AFILIACION ? 'Requiere gestión de membresía' : 'Requiere seguimiento de tesorería'}
                    </div>
                  </div>
                )}

                {/* KPI 3 (Socios Activos - visible to all) */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-sm relative overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none text-blue-900">
                    <Award size={120} />
                  </div>
                  <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest">Estado de Socios Activos</h3>
                  <p className="text-4xl font-black text-slate-800 mt-2">{sociosAlDia} / {socios.length}</p>
                  <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg w-fit mt-3 font-semibold">
                    <CheckCircle size={12} className="mr-1" />
                    Socios solventes ("Al día")
                  </div>
                </div>
              </div>

              {/* Quick Summary Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Column 1 (Pending fees for Tesorero/Afiliacion, Activities list for Secretario/Admin) */}
                {user.rol === UserRole.TESORERO || user.rol === UserRole.PRESIDENTE_AFILIACION ? (
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight">Cobros Pendientes</h3>
                      <button onClick={() => setActiveTab('cuotas')} className="text-sm text-blue-900 font-bold hover:underline">Gestionar cuotas</button>
                    </div>
                    <div className="space-y-4">
                      {socios.filter(s => s.montoPendiente > 0).slice(0, 3).map(s => (
                        <div key={s.id} className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                          <img src={s.foto} alt={s.nombre} className="w-10 h-10 rounded-full border border-slate-100 object-cover mr-4" />
                          <div className="flex-grow min-w-0">
                            <p className="font-extrabold text-slate-800 truncate">{s.nombre}</p>
                            <p className="text-xs text-slate-400 mt-1 truncate">{s.puesto || 'Socio Regular'}</p>
                          </div>
                          <span className="text-sm font-black text-red-600 bg-red-50 px-3 py-1 rounded-xl ml-3">
                            Q {s.montoPendiente.toFixed(2)}
                          </span>
                        </div>
                      ))}
                      {socios.filter(s => s.montoPendiente > 0).length === 0 && (
                        <div className="text-center text-slate-400 text-sm py-4 italic">No hay cobros pendientes. ¡Todo al día!</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight">Próximos Programas</h3>
                      <button onClick={() => setActiveTab('calendario')} className="text-sm text-blue-900 font-bold hover:underline">Ver todos</button>
                    </div>
                    <div className="space-y-4">
                      {actividades.slice(0, 3).map(act => (
                        <div key={act.id} className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                          <div className="bg-blue-50 text-blue-900 p-3 rounded-xl mr-4">
                            <Calendar size={20} />
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="font-extrabold text-slate-800 truncate">{act.titulo}</p>
                            <p className="text-xs text-slate-400 mt-1 truncate">{act.fecha} • {act.lugar}</p>
                          </div>
                          <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ml-3 ${
                            act.publica ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {act.publica ? 'Público' : 'Socio'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Column 2 (Donations for Tesorero, Actas for Secretario/Admin, New Members for Afiliacion) */}
                {user.rol === UserRole.TESORERO ? (
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight">Donaciones Recientes</h3>
                      <button onClick={() => setActiveTab('donaciones')} className="text-sm text-blue-900 font-bold hover:underline">Ver todas</button>
                    </div>
                    <div className="space-y-4">
                      {donaciones.slice(0, 3).map(don => (
                        <div key={don.id} className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                          <div className="bg-green-50 text-green-600 p-3 rounded-xl mr-4">
                            <Gift size={20} />
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="font-extrabold text-slate-800 truncate">{don.donante}</p>
                            <p className="text-xs text-slate-400 mt-1 truncate">{don.proyecto} • {don.fecha}</p>
                          </div>
                          <span className="text-sm font-black text-green-600 bg-green-50 px-3 py-1 rounded-xl ml-3">
                            + Q {don.monto.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : user.rol === UserRole.PRESIDENTE_AFILIACION ? (
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight">Nuevos Afiliados</h3>
                      <button onClick={() => setActiveTab('cuotas')} className="text-sm text-blue-900 font-bold hover:underline">Ver cuotas</button>
                    </div>
                    <div className="space-y-4">
                      {socios.slice().reverse().slice(0, 3).map(s => (
                        <div key={s.id} className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                          <img src={s.foto} alt={s.nombre} className="w-10 h-10 rounded-full border border-slate-100 object-cover mr-4" />
                          <div className="flex-grow min-w-0">
                            <p className="font-extrabold text-slate-800 truncate">{s.nombre}</p>
                            <p className="text-xs text-slate-400 mt-1 truncate">Ingreso: {s.fechaIngreso}</p>
                          </div>
                          <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full uppercase ml-3">
                            {s.puesto || 'Socio'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight">Actas Recientes</h3>
                      <button onClick={() => setActiveTab('actas')} className="text-sm text-blue-900 font-bold hover:underline">Ver biblioteca</button>
                    </div>
                    <div className="space-y-4">
                      {actas.slice(0, 3).map(acta => (
                        <div key={acta.id} className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                          <div className="bg-yellow-50 text-yellow-600 p-3 rounded-xl mr-4">
                            <FileText size={20} />
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="font-extrabold text-slate-800 truncate">{acta.titulo}</p>
                            <p className="text-xs text-slate-400 mt-1">Por {acta.autor} • {acta.fecha}</p>
                          </div>
                          <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full uppercase ml-3">
                            {acta.categoria || 'Reunión'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: PROGRAMAS / CALENDARIO */}
          {activeTab === 'calendario' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">Gestión de Programas y Calendario</h3>
                <button 
                  onClick={() => setShowAddActividad(true)}
                  className="bg-blue-900 hover:bg-blue-800 text-white font-black px-6 py-3 rounded-xl flex items-center space-x-2 shadow-lg shadow-blue-900/10"
                >
                  <Plus size={18} />
                  <span>Programar Actividad</span>
                </button>
              </div>

              {/* Form Modal */}
              {showAddActividad && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
                  <form onSubmit={handleAddActividad} className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full space-y-6 shadow-2xl border border-slate-100">
                    <div className="flex justify-between items-center">
                      <h4 className="text-2xl font-black text-slate-800">Nueva Actividad</h4>
                      <button type="button" onClick={() => setShowAddActividad(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} /></button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Título del Evento</label>
                        <input 
                          type="text" 
                          required 
                          value={newActividad.titulo} 
                          onChange={e => setNewActividad({...newActividad, titulo: e.target.value})}
                          placeholder="Ej. Colecta Anual del Juguete"
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Descripción</label>
                        <textarea 
                          rows={3} 
                          value={newActividad.descripcion} 
                          onChange={e => setNewActividad({...newActividad, descripcion: e.target.value})}
                          placeholder="Breve detalle de la actividad..."
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Fecha y Hora</label>
                          <input 
                            type="datetime-local" 
                            required 
                            value={newActividad.fecha} 
                            onChange={e => setNewActividad({...newActividad, fecha: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Lugar</label>
                          <input 
                            type="text" 
                            required 
                            value={newActividad.lugar} 
                            onChange={e => setNewActividad({...newActividad, lugar: e.target.value})}
                            placeholder="Ej. Sede del Club"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 pt-2">
                        <input 
                          type="checkbox" 
                          id="publica" 
                          checked={newActividad.publica} 
                          onChange={e => setNewActividad({...newActividad, publica: e.target.checked})}
                          className="w-5 h-5 rounded text-blue-900 border-slate-300 focus:ring-blue-900"
                        />
                        <label htmlFor="publica" className="text-sm font-bold text-slate-700 select-none">Hacer actividad pública en el sitio web</label>
                      </div>
                    </div>

                    <div className="flex space-x-4 pt-4">
                      <button 
                        type="button" 
                        onClick={() => setShowAddActividad(false)}
                        className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        className="w-1/2 bg-blue-900 hover:bg-blue-800 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-blue-900/10"
                      >
                        Agregar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Activities List */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-sm overflow-hidden">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold text-xs uppercase tracking-wider">
                      <th className="p-6">Actividad</th>
                      <th className="p-6">Fecha</th>
                      <th className="p-6">Lugar</th>
                      <th className="p-6">Alcance</th>
                      <th className="p-6 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {actividades.map(act => (
                      <tr key={act.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-6">
                          <p className="font-extrabold text-slate-800 text-base">{act.titulo}</p>
                          <p className="text-xs text-slate-500 mt-1 max-w-sm truncate">{act.descripcion}</p>
                        </td>
                        <td className="p-6 text-sm text-slate-600 font-medium">{act.fecha}</td>
                        <td className="p-6 text-sm text-slate-600 font-medium">{act.lugar}</td>
                        <td className="p-6">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                            act.publica ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {act.publica ? 'Público' : 'Solo Socios'}
                          </span>
                        </td>
                        <td className="p-6 text-right">
                          <button 
                            onClick={() => handleDeleteActividad(act.id)}
                            className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Eliminar actividad"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: CONTROL DE CUOTAS */}
          {activeTab === 'cuotas' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">Cobros y Control de Cuotas</h3>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-4 top-3 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={socioSearch}
                    onChange={e => setSocioSearch(e.target.value)}
                    placeholder="Buscar socio..."
                    className="w-full pl-11 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Members Cuotas Table */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-sm overflow-hidden">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold text-xs uppercase tracking-wider">
                      <th className="p-6">Socio</th>
                      <th className="p-6">Puesto</th>
                      <th className="p-6">Estado</th>
                      <th className="p-6">Monto Pendiente</th>
                      <th className="p-6 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSocios.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-6 flex items-center space-x-4">
                          <img src={s.foto} alt={s.nombre} className="w-10 h-10 rounded-full border border-slate-100 object-cover" />
                          <div>
                            <p className="font-extrabold text-slate-800">{s.nombre}</p>
                            <p className="text-xs text-slate-400">{s.correo}</p>
                          </div>
                        </td>
                        <td className="p-6 text-sm text-slate-500 font-bold uppercase">{s.puesto || 'Socio Activo'}</td>
                        <td className="p-6">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                            s.estadoCuotas === 'Al día' 
                              ? 'bg-green-50 text-green-700' 
                              : s.estadoCuotas === 'Pendiente' 
                                ? 'bg-yellow-50 text-yellow-700' 
                                : 'bg-red-50 text-red-700'
                          }`}>
                            {s.estadoCuotas}
                          </span>
                        </td>
                        <td className="p-6 font-extrabold text-slate-800 text-base">Q {s.montoPendiente.toFixed(2)}</td>
                        <td className="p-6 text-right flex items-center justify-end space-x-2">
                          {s.montoPendiente > 0 ? (
                            <>
                              <button
                                onClick={() => handleRegistrarPago(s.id)}
                                className="bg-green-50 text-green-700 hover:bg-green-100 px-4 py-2 rounded-xl font-bold text-xs transition-colors flex items-center space-x-1"
                                title="Marcar como pagado"
                              >
                                <Check size={14} />
                                <span>Pagar</span>
                              </button>
                              <button
                                onClick={() => handleEnviarRecordatorio(s)}
                                className="bg-slate-100 text-slate-700 hover:bg-slate-200 p-2 rounded-xl font-bold text-xs transition-colors"
                                title="Enviar recordatorio por correo"
                              >
                                <Send size={14} />
                              </button>
                            </>
                          ) : (
                            <span className="text-green-600 font-bold text-xs flex items-center px-4 py-2 bg-green-50/50 rounded-xl">
                              <CheckCircle size={14} className="mr-1" />
                              Solvente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: LIBRO DE ACTAS */}
          {activeTab === 'actas' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">Biblioteca y Redacción de Actas</h3>
                <button 
                  onClick={() => setShowAddActa(true)}
                  className="bg-blue-900 hover:bg-blue-800 text-white font-black px-6 py-3 rounded-xl flex items-center space-x-2 shadow-lg shadow-blue-900/10"
                >
                  <Plus size={18} />
                  <span>Redactar Acta</span>
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-4 top-3 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={actaSearch}
                    onChange={e => setActaSearch(e.target.value)}
                    placeholder="Buscar por palabra clave..."
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter size={18} className="text-slate-400" />
                  <select 
                    value={actaFilterCategory} 
                    onChange={e => setActaFilterCategory(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-900"
                  >
                    <option value="Todas">Todas las categorías</option>
                    <option value="Asamblea">Asamblea</option>
                    <option value="Directiva">Junta Directiva</option>
                    <option value="Comité">Comités</option>
                  </select>
                </div>
              </div>

              {/* Add Acta Modal */}
              {showAddActa && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
                  <form onSubmit={handleAddActa} className="bg-white rounded-[2.5rem] p-8 max-w-2xl w-full space-y-6 shadow-2xl border border-slate-100">
                    <div className="flex justify-between items-center">
                      <h4 className="text-2xl font-black text-slate-800">Redactar Nueva Acta de Sesión</h4>
                      <button type="button" onClick={() => setShowAddActa(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} /></button>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Título de Sesión</label>
                          <input 
                            type="text" 
                            required 
                            value={newActa.titulo} 
                            onChange={e => setNewActa({...newActa, titulo: e.target.value})}
                            placeholder="Ej. Sesión Ordinaria de Abril"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Categoría</label>
                          <select
                            value={newActa.categoria}
                            onChange={e => setNewActa({...newActa, categoria: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-slate-700 font-bold"
                          >
                            <option value="Asamblea">Asamblea</option>
                            <option value="Directiva">Junta Directiva</option>
                            <option value="Comité">Comités</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Redactor / Autor</label>
                          <input 
                            type="text" 
                            required 
                            value={newActa.autor} 
                            onChange={e => setNewActa({...newActa, autor: e.target.value})}
                            placeholder="Ej. Elena Castillo (Secretaria)"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Fecha (Automática)</label>
                          <input 
                            type="text" 
                            disabled 
                            value={new Date().toLocaleDateString()}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Contenido del Acta (Transmisión / Acuerdos)</label>
                        <textarea 
                          rows={6} 
                          required
                          value={newActa.contenido} 
                          onChange={e => setNewActa({...newActa, contenido: e.target.value})}
                          placeholder="Redacte aquí todos los puntos discutidos y acuerdos tomados en la reunión..."
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all resize-none text-justify font-serif"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-4 pt-4">
                      <button 
                        type="button" 
                        onClick={() => setShowAddActa(false)}
                        className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all"
                      >
                        Descartar Borrador
                      </button>
                      <button 
                        type="submit" 
                        className="w-1/2 bg-blue-900 hover:bg-blue-800 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-blue-900/10"
                      >
                        Publicar Acta
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* List of Actas */}
              <div className="grid gap-4">
                {filteredActas.map(acta => (
                  <div key={acta.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-4 min-w-0">
                      <div className="bg-yellow-50 text-yellow-600 p-3.5 rounded-2xl flex-shrink-0">
                        <FileText size={24} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-slate-800 text-lg truncate">{acta.titulo}</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Redactada por <span className="font-bold text-blue-900/60 uppercase">{acta.autor}</span> • {acta.fecha}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-xs font-black bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full uppercase">
                        {acta.categoria || 'Asamblea'}
                      </span>
                      <button
                        onClick={() => generateActaPDF(acta)}
                        className="p-2.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                        title="Descargar PDF"
                      >
                        <Download size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteActa(acta.id)}
                        className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Eliminar acta"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                {filteredActas.length === 0 && (
                  <div className="text-center py-12 text-slate-400 italic">No se encontraron actas con esos criterios de búsqueda.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB: DONACIONES RECIBIDAS */}
          {activeTab === 'donaciones' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">Registro de Donaciones</h3>
                <button 
                  onClick={() => setShowAddDonacion(true)}
                  className="bg-blue-900 hover:bg-blue-800 text-white font-black px-6 py-3 rounded-xl flex items-center space-x-2 shadow-lg shadow-blue-900/10"
                >
                  <Plus size={18} />
                  <span>Registrar Donación</span>
                </button>
              </div>

              {/* Add Donacion Modal */}
              {showAddDonacion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
                  <form onSubmit={handleAddDonacion} className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full space-y-6 shadow-2xl border border-slate-100">
                    <div className="flex justify-between items-center">
                      <h4 className="text-2xl font-black text-slate-800">Registrar Donación Entrante</h4>
                      <button type="button" onClick={() => setShowAddDonacion(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} /></button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Nombre del Donante</label>
                        <input 
                          type="text" 
                          required 
                          value={newDonacion.donante} 
                          onChange={e => setNewDonacion({...newDonacion, donante: e.target.value})}
                          placeholder="Ej. Fundación Tigo o Nombre de Socio"
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Monto de Donación (Q)</label>
                          <div className="relative">
                            <span className="absolute left-4 top-3.5 text-slate-400 font-bold">Q</span>
                            <input 
                              type="number" 
                              required 
                              min="0"
                              step="0.01"
                              value={newDonacion.monto} 
                              onChange={e => setNewDonacion({...newDonacion, monto: e.target.value})}
                              placeholder="0.00"
                              className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all font-bold"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Donante</label>
                          <select
                            value={newDonacion.tipo}
                            onChange={e => setNewDonacion({...newDonacion, tipo: e.target.value as any})}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-slate-700 font-bold"
                          >
                            <option value="Individual">Individual</option>
                            <option value="Empresarial">Empresarial</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Proyecto o Causa Destinada</label>
                        <input 
                          type="text" 
                          required 
                          value={newDonacion.proyecto} 
                          onChange={e => setNewDonacion({...newDonacion, proyecto: e.target.value})}
                          placeholder="Ej. Jornada Médica 2024"
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-4 pt-4">
                      <button 
                        type="button" 
                        onClick={() => setShowAddDonacion(false)}
                        className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        className="w-1/2 bg-blue-900 hover:bg-blue-800 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-blue-900/10"
                      >
                        Registrar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Table of Donations */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-sm overflow-hidden">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold text-xs uppercase tracking-wider">
                      <th className="p-6">Donante</th>
                      <th className="p-6">Fecha</th>
                      <th className="p-6">Proyecto</th>
                      <th className="p-6">Tipo</th>
                      <th className="p-6 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDonaciones.map(don => (
                      <tr key={don.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-6 font-extrabold text-slate-800 text-base">{don.donante}</td>
                        <td className="p-6 text-sm text-slate-500 font-medium">{don.fecha}</td>
                        <td className="p-6 text-sm text-slate-600 font-bold">{don.proyecto}</td>
                        <td className="p-6">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                            don.tipo === 'Empresarial' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {don.tipo}
                          </span>
                        </td>
                        <td className="p-6 text-right font-black text-blue-900 text-lg">Q {don.monto.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: BENEFICIOS DE SOCIOS */}
          {activeTab === 'beneficios' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">Beneficios y Convenios del Socio</h3>
                <button 
                  onClick={() => setShowAddBeneficio(true)}
                  className="bg-blue-900 hover:bg-blue-800 text-white font-black px-6 py-3 rounded-xl flex items-center space-x-2 shadow-lg shadow-blue-900/10"
                >
                  <Plus size={18} />
                  <span>Añadir Convenio</span>
                </button>
              </div>

              {/* Add Beneficio Modal */}
              {showAddBeneficio && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
                  <form onSubmit={handleAddBeneficio} className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full space-y-6 shadow-2xl border border-slate-100">
                    <div className="flex justify-between items-center">
                      <h4 className="text-2xl font-black text-slate-800">Añadir Beneficio/Convenio</h4>
                      <button type="button" onClick={() => setShowAddBeneficio(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} /></button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Nombre del Beneficio</label>
                        <input 
                          type="text" 
                          required 
                          value={newBeneficio.titulo} 
                          onChange={e => setNewBeneficio({...newBeneficio, titulo: e.target.value})}
                          placeholder="Ej. Descuento en Consultas Dentales"
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Establecimiento / Alianza</label>
                          <input 
                            type="text" 
                            required 
                            value={newBeneficio.convenioCon} 
                            onChange={e => setNewBeneficio({...newBeneficio, convenioCon: e.target.value})}
                            placeholder="Ej. Clínica Dental Xela"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Descuento Ofrecido</label>
                          <input 
                            type="text" 
                            required 
                            value={newBeneficio.descuento} 
                            onChange={e => setNewBeneficio({...newBeneficio, descuento: e.target.value})}
                            placeholder="Ej. 20% o Q50"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Categoría</label>
                        <select
                          value={newBeneficio.categoria}
                          onChange={e => setNewBeneficio({...newBeneficio, categoria: e.target.value as any})}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-slate-700 font-bold"
                        >
                          <option value="Salud">Salud</option>
                          <option value="Comercio">Comercio</option>
                          <option value="Recreación">Recreación</option>
                          <option value="Otros">Otros</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Descripción Corta</label>
                        <textarea 
                          rows={2} 
                          value={newBeneficio.descripcion} 
                          onChange={e => setNewBeneficio({...newBeneficio, descripcion: e.target.value})}
                          placeholder="Detalles sobre cómo aplicar el beneficio..."
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all resize-none text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-4 pt-4">
                      <button 
                        type="button" 
                        onClick={() => setShowAddBeneficio(false)}
                        className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        className="w-1/2 bg-blue-900 hover:bg-blue-800 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-blue-900/10"
                      >
                        Añadir
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Beneficios List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {beneficios.map(ben => (
                  <div key={ben.id} className="bg-white p-6 rounded-[2rem] border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                          ben.categoria === 'Salud' 
                            ? 'bg-blue-50 text-blue-700' 
                            : ben.categoria === 'Comercio' 
                              ? 'bg-red-50 text-red-700' 
                              : ben.categoria === 'Recreación'
                                ? 'bg-yellow-50 text-yellow-700'
                                : 'bg-green-50 text-green-700'
                        }`}>
                          {ben.categoria}
                        </span>
                        <span className="text-xl font-black text-blue-900 pr-4">{ben.descuento} Desc.</span>
                      </div>
                      
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-lg leading-snug group-hover:text-blue-900 transition-colors">{ben.titulo}</h4>
                        <p className="text-xs text-slate-400 mt-1 font-semibold uppercase">{ben.convenioCon}</p>
                      </div>

                      <p className="text-slate-500 text-sm leading-relaxed">{ben.descripcion}</p>
                    </div>

                    <div className="border-t border-slate-100 mt-6 pt-4 flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activo</span>
                      <button 
                        onClick={() => setBeneficios(beneficios.filter(b => b.id !== ben.id))}
                        className="text-slate-300 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="Eliminar convenio"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: PROPUESTAS DE SOCIOS */}
          {activeTab === 'propuestas' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">Propuestas de Nuevos Socios</h3>
                <p className="text-slate-500 text-sm mt-1">Revisa y gestiona las solicitudes de membresía ingresadas por los socios del club.</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {propuestas.map(prop => {
                  const isPendiente = prop.estado === 'Pendiente';
                  return (
                    <div 
                      key={prop.id} 
                      className={`bg-white p-6 md:p-8 rounded-[2.5rem] border shadow-sm flex flex-col md:flex-row gap-8 items-start hover:shadow-md transition-shadow relative overflow-hidden ${
                        prop.estado === 'Aprobado' 
                          ? 'border-green-200' 
                          : prop.estado === 'Rechazado' 
                            ? 'border-red-200' 
                            : 'border-slate-200/80'
                      }`}
                    >
                      {/* Estado Badge */}
                      <div className="absolute top-6 right-6">
                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider ${
                          prop.estado === 'Aprobado' 
                            ? 'bg-green-50 text-green-700' 
                            : prop.estado === 'Rechazado' 
                              ? 'bg-red-50 text-red-700' 
                              : 'bg-yellow-50 text-yellow-700 animate-pulse'
                        }`}>
                          {prop.estado}
                        </span>
                      </div>

                      {/* Foto Candidato */}
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
                        <img src={prop.fotoCandidato} alt={prop.nombreCandidato} className="w-full h-full object-cover" />
                      </div>

                      {/* Ficha Informativa */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <h4 className="text-2xl font-black text-slate-800">{prop.nombreCandidato}</h4>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">{prop.profesionCandidato}</p>
                          <p className="text-xs text-slate-500 mt-2">
                            Propuesto por: <strong className="text-blue-900">{prop.proponente}</strong> • {prop.fechaPropuesta}
                          </p>
                        </div>

                        {/* Cualidades Badges */}
                        <div className="flex flex-wrap gap-1.5">
                          {prop.caracteristicas.map((carac, idx) => (
                            <span 
                              key={idx} 
                              className="text-[9px] font-black bg-blue-50 text-blue-800 px-2.5 py-1 rounded-full uppercase"
                            >
                              ★ {carac}
                            </span>
                          ))}
                        </div>

                        {/* Justificaciones */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">¿Por qué lo propone?</p>
                            <p className="text-xs text-slate-600 leading-relaxed text-justify italic">"{prop.motivoPropuesta}"</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">¿Por qué sería un buen León?</p>
                            <p className="text-xs text-slate-600 leading-relaxed text-justify italic">"{prop.porQueBuenLeon}"</p>
                          </div>
                        </div>

                        {/* Acciones */}
                        {isPendiente && (
                          <div className="flex items-center space-x-3 pt-4 border-t border-slate-100">
                            <button
                              onClick={() => handleAprobarPropuesta(prop.id)}
                              className="bg-green-600 hover:bg-green-700 text-white font-black text-xs px-5 py-3 rounded-xl flex items-center space-x-1.5 transition-all shadow-md shadow-green-600/10"
                            >
                              <CheckCircle size={14} />
                              <span>Aprobar Miembro</span>
                            </button>
                            <button
                              onClick={() => handleRechazarPropuesta(prop.id)}
                              className="bg-white hover:bg-red-50 text-red-600 border border-red-200 font-bold text-xs px-5 py-3 rounded-xl flex items-center space-x-1.5 transition-all"
                            >
                              <X size={14} />
                              <span>Rechazar</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {propuestas.length === 0 && (
                  <div className="text-center py-16 text-slate-400 italic bg-white border border-slate-200/80 rounded-[2.5rem] shadow-sm">
                    No se han registrado propuestas de nuevos socios en el sistema.
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SuperAdmin;
