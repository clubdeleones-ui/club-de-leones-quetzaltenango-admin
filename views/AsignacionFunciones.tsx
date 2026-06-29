import React, { useState, useMemo } from 'react';
import { useClubData } from '../context/ClubDataContext';
import { useModal } from '../context/ModalContext';
import { 
  Users, 
  ShieldCheck, 
  Briefcase, 
  Search, 
  Key, 
  Save, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Lock, 
  Eye, 
  EyeOff,
  UserCheck,
  Crown
} from 'lucide-react';
import { firebaseService } from '../services/firebaseService';

const AVAILABLE_TABS = [
  { id: 'resumen', label: 'Resumen General' },
  { id: 'presidencia', label: 'Gestión de Solicitudes (Presidencia)' },
  { id: 'agendas_reunion', label: 'Agendas de Reunión' },
  { id: 'ranking_lionistico', label: 'Ranking Lionístico' },
  { id: 'actas', label: 'Libro de Actas' },
  { id: 'beneficios', label: 'Beneficios a Socios' },
  { id: 'calendario', label: 'Actividades (Mercadeo)' },
  { id: 'comisiones', label: 'Gestión de Comisiones' },
  { id: 'cuotas', label: 'Control de Cuotas' },
  { id: 'parqueo', label: 'Gestión de Parqueo' },
  { id: 'donaciones', label: 'Donaciones Recibidas' },
  { id: 'presupuestos', label: 'Presupuestos' },
  { id: 'socios', label: 'Gestión de Socios' },
  { id: 'afiliacion', label: 'Comité de Afiliación' },
  { id: 'minutas', label: 'Minutas de Comisiones' },
  { id: 'inventario', label: 'Inventario' },
  { id: 'galeria_admin', label: 'Gestión de Galería' },
  { id: 'linea_tiempo_admin', label: 'Línea de Tiempo' },
  { id: 'agenda_contactos', label: 'Agenda de Contactos' },
  { id: 'asignacion_funciones', label: 'Asignación de Funciones' }
];

export const AsignacionFunciones: React.FC = () => {
  const { 
    socios, 
    rolesConfig, 
    puestosList,
    saveRoleConfig,
    deleteRoleConfig,
    savePuesto,
    deletePuesto
  } = useClubData();
  
  const { showAlert, showConfirm } = useModal();

  const [activeSubTab, setActiveSubTab] = useState<'socios' | 'roles' | 'puestos'>('socios');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  // Reset to page 1 on search
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  
  // States for passwords visible per socio
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [editingPasswords, setEditingPasswords] = useState<Record<string, string>>({});
  
  // Managing Roles states
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleId, setNewRoleId] = useState('');
  const [isAddingRole, setIsAddingRole] = useState(false);

  // Managing Puestos states
  const [isAddingPuesto, setIsAddingPuesto] = useState(false);
  const [newPuestoName, setNewPuestoName] = useState('');
  const [newPuestoRole, setNewPuestoRole] = useState('');
  const [editingPuestoId, setEditingPuestoId] = useState<string | null>(null);

  const togglePasswordVisibility = (socioId: string) => {
    setVisiblePasswords(prev => ({ ...prev, [socioId]: !prev[socioId] }));
  };

  const handlePasswordChangeLocal = (socioId: string, val: string) => {
    setEditingPasswords(prev => ({ ...prev, [socioId]: val }));
  };

  const handleSaveSocioCredentials = async (socio: any) => {
    const customPassword = editingPasswords[socio.id];
    
    const confirmed = await showConfirm(
      "Confirmar actualización",
      `¿Desea actualizar las funciones y credenciales del socio ${socio.nombre}?`
    );
    
    if (confirmed) {
      try {
        const updatedSocio = {
          ...socio,
          puesto: socio.puesto || '',
          rol: socio.rol || '',
        };
        
        if (customPassword !== undefined) {
          updatedSocio.password = customPassword;
        }
        
        await firebaseService.saveSocio(updatedSocio);
        showAlert("Éxito", "Funciones y credenciales actualizadas con éxito.");
      } catch (err) {
        console.error(err);
        showAlert("Error", "Ocurrió un error al guardar los datos del socio.");
      }
    }
  };

  const handleSocioPuestoChange = (socioId: string, puestoName: string) => {
    const matchedPuesto = puestosList.find(p => p.nombre === puestoName);
    
    // Auto-update socio's role based on selected position if role exists
    const matchedRole = matchedPuesto ? matchedPuesto.rolAsociado : '';
    
    const socio = socios.find(s => s.id === socioId);
    if (socio) {
      const updated = {
        ...socio,
        puesto: puestoName,
        rol: matchedRole || socio.rol
      };
      firebaseService.saveSocio(updated).catch(err => {
        console.error("Error updating member position/role in real-time:", err);
      });
    }
  };

  const handleSocioRoleChange = (socioId: string, roleName: string) => {
    const socio = socios.find(s => s.id === socioId);
    if (socio) {
      const updated = {
        ...socio,
        rol: roleName
      };
      firebaseService.saveSocio(updated).catch(err => {
        console.error("Error updating member role in real-time:", err);
      });
    }
  };

  // Filtered members list
  const filteredSocios = useMemo(() => {
    return socios.filter(s => 
      s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.puesto || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.rol || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [socios, searchTerm]);

  // Paginated members list
  const paginatedSocios = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSocios.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSocios, currentPage]);

  const totalPages = Math.ceil(filteredSocios.length / ITEMS_PER_PAGE);

  // Roles functions
  const handleAddNewRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleId || !newRoleName) return;
    
    const formattedId = newRoleId.toUpperCase().replace(/\s+/g, '_');
    
    try {
      await saveRoleConfig(formattedId, newRoleName, []);
      showAlert("Éxito", `El rol ${newRoleName} se creó exitosamente.`);
      setNewRoleId('');
      setNewRoleName('');
      setIsAddingRole(false);
    } catch (err) {
      showAlert("Error", "Error al crear el nuevo rol.");
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (roleId === 'SUPER_ADMIN') {
      showAlert("Acción Denegada", "No se puede eliminar el rol de Super Administrador.");
      return;
    }
    
    const confirmed = await showConfirm(
      "Eliminar Rol",
      `¿Está seguro de que desea eliminar el rol ${roleId}? Los socios asignados a este rol perderán sus accesos.`
    );
    
    if (confirmed) {
      try {
        await deleteRoleConfig(roleId);
        setSelectedRole(null);
        showAlert("Éxito", "Rol eliminado exitosamente.");
      } catch (err) {
        showAlert("Error", "Error al eliminar el rol.");
      }
    }
  };

  const handleToggleTabAccess = async (role: any, tabId: string) => {
    let updatedTabs = [...role.allowedTabs];
    if (updatedTabs.includes(tabId)) {
      // Don't allow lock out of SuperAdmin from function assignment itself
      if (role.id === 'SUPER_ADMIN' && tabId === 'asignacion_funciones') {
        showAlert("Acción no permitida", "No puedes quitar el permiso de Asignación de Funciones al Super Administrador.");
        return;
      }
      updatedTabs = updatedTabs.filter(t => t !== tabId);
    } else {
      updatedTabs.push(tabId);
    }
    
    try {
      await saveRoleConfig(role.id, role.label, updatedTabs);
      // Update selected role state in real-time
      setSelectedRole(prev => prev && prev.id === role.id ? { ...prev, allowedTabs: updatedTabs } : prev);
    } catch (err) {
      console.error(err);
    }
  };

  // Puestos functions
  const handleSavePuesto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPuestoName || !newPuestoRole) return;
    
    const id = editingPuestoId || newPuestoName.toLowerCase().trim().replace(/\s+/g, '-');
    
    try {
      await savePuesto(id, newPuestoName, newPuestoRole);
      showAlert("Éxito", editingPuestoId ? "Puesto actualizado exitosamente." : "Puesto creado exitosamente.");
      setNewPuestoName('');
      setNewPuestoRole('');
      setEditingPuestoId(null);
      setIsAddingPuesto(false);
    } catch (err) {
      showAlert("Error", "Error al guardar el puesto.");
    }
  };

  const handleDeletePuesto = async (puestoId: string) => {
    const confirmed = await showConfirm(
      "Eliminar Puesto",
      "¿Está seguro de que desea eliminar este puesto administrativo?"
    );
    
    if (confirmed) {
      try {
        await deletePuesto(puestoId);
        showAlert("Éxito", "Puesto eliminado con éxito.");
      } catch (err) {
        showAlert("Error", "Error al eliminar el puesto.");
      }
    }
  };

  const handleEditPuestoClick = (puesto: any) => {
    setEditingPuestoId(puesto.id);
    setNewPuestoName(puesto.nombre);
    setNewPuestoRole(puesto.rolAsociado);
    setIsAddingPuesto(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-900 text-white rounded-[2.5rem] p-8 sm:p-12 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(253,224,71,0.1),transparent_45%)]" />
        <div className="relative z-10 space-y-4">
          <span className="bg-yellow-400/20 text-yellow-300 text-xs font-black uppercase px-4 py-1.5 rounded-full border border-yellow-400/30 tracking-widest inline-flex items-center gap-1.5 shadow-sm">
            <ShieldCheck size={14} /> Módulo Principal
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Asignación de Funciones</h2>
          <p className="text-slate-350 max-w-2xl text-base font-medium">
            Define credenciales personalizadas, administra los puestos del club, edita roles globales y configura con precisión qué módulos de navegación son visibles para cada rol.
          </p>
        </div>
      </div>

      {/* SUB-TABS SELECTOR */}
      <div className="flex border-b border-slate-200/80 max-w-md bg-slate-100/50 p-1.5 rounded-2xl">
        <button
          onClick={() => setActiveSubTab('socios')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-black transition-all ${
            activeSubTab === 'socios'
              ? 'bg-white text-blue-900 shadow-sm'
              : 'text-slate-500 hover:text-blue-900'
          }`}
        >
          <Users size={16} /> Socios
        </button>
        <button
          onClick={() => setActiveSubTab('roles')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-black transition-all ${
            activeSubTab === 'roles'
              ? 'bg-white text-blue-900 shadow-sm'
              : 'text-slate-500 hover:text-blue-900'
          }`}
        >
          <ShieldCheck size={16} /> Roles y Módulos
        </button>
        <button
          onClick={() => setActiveSubTab('puestos')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-black transition-all ${
            activeSubTab === 'puestos'
              ? 'bg-white text-blue-900 shadow-sm'
              : 'text-slate-500 hover:text-blue-900'
          }`}
        >
          <Briefcase size={16} /> Puestos
        </button>
      </div>

      {/* TAB 1: SOCIOS CREDENTIALS */}
      {activeSubTab === 'socios' && (
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[2rem] p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <h3 className="text-xl font-extrabold text-blue-900 flex items-center gap-2">
              <UserCheck className="text-yellow-500" /> Control de Contraseñas y Funciones
            </h3>
            
            {/* SEARCH */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar socio por nombre, puesto..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm bg-slate-50/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {paginatedSocios.map(socio => {
              const currentPass = editingPasswords[socio.id] !== undefined ? editingPasswords[socio.id] : (socio.password || '');
              const showPass = visiblePasswords[socio.id];
              const isDirectiva = socio.rol && socio.rol !== 'SOCIO';
              
              return (
                <div 
                  key={socio.id} 
                  className={`border rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
                    isDirectiva 
                      ? 'bg-gradient-to-br from-amber-50/30 to-amber-100/10 border-amber-300 hover:border-amber-400' 
                      : 'bg-white border-slate-200/75 hover:border-slate-350'
                  }`}
                >
                  {/* Fila 1: Perfil y Distintivo */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={socio.foto || 'https://picsum.photos/seed/default/200/200'}
                        alt={socio.nombre}
                        className={`w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 ${
                          isDirectiva ? 'border-amber-300' : 'border-slate-100'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="font-extrabold text-blue-900 truncate" title={socio.nombre}>
                          {socio.nombre}
                        </div>
                        <div className="text-xs text-slate-400 font-medium truncate" title={socio.correo}>
                          {socio.correo}
                        </div>
                      </div>
                    </div>

                    {/* Código de Color / Badge */}
                    <div className="flex-shrink-0">
                      {isDirectiva ? (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-250 flex items-center gap-1">
                          <Crown size={11} className="text-amber-600" /> Directiva
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-650 text-[10px] font-black px-2.5 py-1 rounded-full border border-slate-200 flex items-center gap-1">
                          <Users size={11} className="text-slate-500" /> Socio Regular
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Fila 2: Selectores de Puesto y Rol */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                        Puesto del Club
                      </label>
                      <select
                        value={socio.puesto || ''}
                        onChange={(e) => handleSocioPuestoChange(socio.id, e.target.value)}
                        className="w-full py-2 px-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Sin puesto</option>
                        {puestosList.map(p => (
                          <option key={p.id} value={p.nombre}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                        Rol de Sistema
                      </label>
                      <select
                        value={socio.rol || 'SOCIO'}
                        onChange={(e) => handleSocioRoleChange(socio.id, e.target.value)}
                        className="w-full py-2 px-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {rolesConfig.map(r => (
                          <option key={r.id} value={r.id}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Fila 3: Contraseña y Guardar */}
                  <div className="flex gap-3 items-end pt-1">
                    <div className="flex-1 relative">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                        Contraseña de Acceso
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 text-slate-400" size={14} />
                        <input
                          type={showPass ? "text" : "password"}
                          value={currentPass}
                          placeholder="123456 (Defecto)"
                          onChange={(e) => handlePasswordChangeLocal(socio.id, e.target.value)}
                          className="w-full pl-8 pr-8 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50 text-slate-700"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(socio.id)}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-650"
                        >
                          {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSaveSocioCredentials(socio)}
                      className="bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white py-2 px-3.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-500/10 h-[34px] flex-shrink-0"
                    >
                      <Save size={14} /> Guardar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Controles de Paginación */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-5 mt-4">
              <span className="text-xs font-bold text-slate-400">
                Mostrando {Math.min(filteredSocios.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)}-{Math.min(filteredSocios.length, currentPage * ITEMS_PER_PAGE)} de {filteredSocios.length} socios
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-black text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Anterior
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                        currentPage === i + 1
                          ? 'bg-blue-900 text-white shadow-sm'
                          : 'border border-slate-200 text-slate-650 bg-white hover:bg-slate-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-black text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {filteredSocios.length === 0 && (
            <div className="py-12 text-center text-slate-400 font-semibold bg-slate-50/30 rounded-2xl border border-dashed border-slate-200">
              No se encontraron socios que coincidan con la búsqueda.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ROLES & MODULES */}
      {activeSubTab === 'roles' && (
        <div className="space-y-6">
          {/* SECCIÓN SUPERIOR: Selector de Rol y Creación (Horizontal) */}
          <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[2rem] p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end justify-between">
              <div className="flex-1 w-full max-w-md">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                  Seleccionar Rol del Sistema
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedRole?.id || ''}
                    onChange={e => {
                      const matched = rolesConfig.find(r => r.id === e.target.value);
                      setSelectedRole(matched || null);
                    }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-700 font-bold"
                  >
                    <option value="" disabled>Seleccione un rol de la lista...</option>
                    {rolesConfig.map(role => (
                      <option key={role.id} value={role.id}>{role.label} ({role.id})</option>
                    ))}
                  </select>

                  {selectedRole && selectedRole.id !== 'SUPER_ADMIN' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteRole(selectedRole.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 px-3.5 rounded-xl border border-red-200 flex items-center justify-center transition-all"
                      title="Eliminar este rol"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  setIsAddingRole(!isAddingRole);
                  if (!isAddingRole) {
                    setNewRoleId('');
                    setNewRoleName('');
                  }
                }}
                className="w-full md:w-auto bg-blue-900 hover:bg-blue-800 text-white text-xs font-black py-3 px-5 rounded-xl flex items-center justify-center gap-1.5 transition-all h-[42px] self-stretch md:self-auto"
              >
                {isAddingRole ? <X size={14} /> : <Plus size={14} />} 
                {isAddingRole ? 'Cancelar Nuevo Rol' : 'Crear Nuevo Rol'}
              </button>
            </div>

            {/* FORMULARIO DE NUEVO ROL (Inline Horizontal) */}
            {isAddingRole && (
              <form onSubmit={handleAddNewRole} className="p-5 bg-slate-50/50 border border-slate-200/60 rounded-2xl flex flex-col md:flex-row gap-4 items-end animate-in slide-in-from-top-3 duration-250">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-500 mb-1">ID Único (Ej: VOCALES)</label>
                  <input
                    type="text"
                    required
                    placeholder="VOCALES"
                    value={newRoleId}
                    onChange={e => setNewRoleId(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-700 font-bold"
                  />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Nombre Descriptivo</label>
                  <input
                    type="text"
                    required
                    placeholder="Vocales y Comisiones"
                    value={newRoleName}
                    onChange={e => setNewRoleName(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-700 font-bold"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black py-2.5 px-6 rounded-xl transition-all h-[38px]"
                >
                  Confirmar y Guardar
                </button>
              </form>
            )}
          </div>

          {/* SECCIÓN INFERIOR: Configuración de Módulos (Grid) */}
          <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[2rem] p-6 shadow-sm space-y-6">
            {selectedRole ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-extrabold text-blue-900">
                    Configuración de Módulos Visibles: <span className="text-yellow-600">{selectedRole.label}</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Activa o desactiva qué secciones de administración serán visibles para los usuarios asignados a este rol.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {AVAILABLE_TABS.map(tab => {
                    const hasAccess = selectedRole.allowedTabs?.includes(tab.id);
                    return (
                      <div
                        key={tab.id}
                        onClick={() => handleToggleTabAccess(selectedRole, tab.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          hasAccess
                            ? 'bg-emerald-50/40 border-emerald-200/80 shadow-sm'
                            : 'bg-slate-50/20 border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <div className="pr-2">
                          <span className={`text-sm font-extrabold ${hasAccess ? 'text-emerald-800' : 'text-slate-650'}`}>
                            {tab.label}
                          </span>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{tab.id}</div>
                        </div>

                        {/* TOGGLE SWITCH STYLE */}
                        <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ${hasAccess ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${hasAccess ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-3">
                <ShieldCheck size={48} className="text-slate-300" />
                <p className="font-semibold text-sm">Seleccione un rol de la lista superior para gestionar sus permisos y módulos visibles.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PUESTOS MANAGEMENT */}
      {activeSubTab === 'puestos' && (
        <div className="space-y-6">
          {/* SECCIÓN SUPERIOR: Formulario de Puesto (Horizontal) */}
          <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[2rem] p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-blue-900">
              {editingPuestoId ? 'Editar Puesto' : 'Crear Puesto del Club'}
            </h3>

            <form onSubmit={handleSavePuesto} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-slate-550 mb-1">Nombre del Puesto</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Vocal de Actividades"
                  value={newPuestoName}
                  onChange={e => setNewPuestoName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-700 font-bold"
                />
              </div>

              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-slate-550 mb-1">Rol del Sistema Vinculado</label>
                <select
                  required
                  value={newPuestoRole}
                  onChange={e => setNewPuestoRole(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-700 font-bold"
                >
                  <option value="" disabled>Seleccione un rol...</option>
                  {rolesConfig.map(role => (
                    <option key={role.id} value={role.id}>{role.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 w-full md:w-auto flex-shrink-0">
                <button
                  type="submit"
                  className="flex-1 md:flex-none bg-blue-900 hover:bg-blue-800 text-white text-xs font-black py-3 px-6 rounded-xl transition-all whitespace-nowrap h-[38px] flex items-center justify-center"
                >
                  {editingPuestoId ? 'Guardar Cambios' : 'Crear Puesto'}
                </button>
                {editingPuestoId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPuestoId(null);
                      setNewPuestoName('');
                      setNewPuestoRole('');
                    }}
                    className="bg-slate-200 hover:bg-slate-355 text-slate-750 text-xs font-black py-3 px-5 rounded-xl transition-all h-[38px] flex items-center justify-center border border-slate-300"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
            <p className="text-[10px] text-slate-400 font-medium">
              Cuando asignes este puesto a un socio, heredará automáticamente los permisos y accesos del rol de sistema vinculado.
            </p>
          </div>

          {/* SECCIÓN INFERIOR: Listado de Puestos (Tabla) */}
          <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[2rem] p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-blue-900">Listado de Puestos</h3>
            
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="py-4 px-6">Nombre del Puesto</th>
                    <th className="py-4 px-6">Rol Asociado</th>
                    <th className="py-4 px-6 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60 text-sm font-semibold text-slate-700">
                  {puestosList.map(puesto => {
                    const matchedRole = rolesConfig.find(r => r.id === puesto.rolAsociado);
                    return (
                      <tr key={puesto.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-4 px-6 font-extrabold text-blue-900">{puesto.nombre}</td>
                        <td className="py-4 px-6">
                          <span className="bg-blue-50 text-blue-800 text-xs font-black px-3 py-1 rounded-full border border-blue-100">
                            {matchedRole ? matchedRole.label : puesto.rolAsociado}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleEditPuestoClick(puesto)}
                            className="text-blue-500 hover:text-blue-700 p-1"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeletePuesto(puesto.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AsignacionFunciones;
