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
  UserCheck
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
    
    showConfirm(
      "Confirmar actualización",
      `¿Desea actualizar las funciones y credenciales del socio ${socio.nombre}?`,
      async () => {
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
    );
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
    
    showConfirm(
      "Eliminar Rol",
      `¿Está seguro de que desea eliminar el rol ${roleId}? Los socios asignados a este rol perderán sus accesos.`,
      async () => {
        try {
          await deleteRoleConfig(roleId);
          showAlert("Éxito", "Rol eliminado exitosamente.");
        } catch (err) {
          showAlert("Error", "Error al eliminar el rol.");
        }
      }
    );
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
    showConfirm(
      "Eliminar Puesto",
      "¿Está seguro de que desea eliminar este puesto administrativo?",
      async () => {
        try {
          await deletePuesto(puestoId);
          showAlert("Éxito", "Puesto eliminado con éxito.");
        } catch (err) {
          showAlert("Error", "Error al eliminar el puesto.");
        }
      }
    );
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

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/80 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="py-4 px-6">Socio</th>
                  <th className="py-4 px-6">Puesto del Club</th>
                  <th className="py-4 px-6">Rol de Sistema</th>
                  <th className="py-4 px-6">Contraseña de Acceso</th>
                  <th className="py-4 px-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60 text-sm font-semibold text-slate-700">
                {filteredSocios.map(socio => {
                  const currentPass = editingPasswords[socio.id] !== undefined ? editingPasswords[socio.id] : (socio.password || '');
                  const showPass = visiblePasswords[socio.id];
                  
                  return (
                    <tr key={socio.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-4 px-6 flex items-center gap-3">
                        <img
                          src={socio.foto || 'https://picsum.photos/seed/default/200/200'}
                          alt={socio.nombre}
                          className="w-10 h-10 rounded-full object-cover border border-slate-100"
                        />
                        <div>
                          <div className="font-extrabold text-blue-900">{socio.nombre}</div>
                          <div className="text-xs text-slate-400 font-medium">{socio.correo}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <select
                          value={socio.puesto || ''}
                          onChange={(e) => handleSocioPuestoChange(socio.id, e.target.value)}
                          className="py-1.5 px-3 border border-slate-200 rounded-lg text-xs font-extrabold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        >
                          <option value="">Sin puesto</option>
                          {puestosList.map(p => (
                            <option key={p.id} value={p.nombre}>{p.nombre}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-4 px-6">
                        <select
                          value={socio.rol || 'SOCIO'}
                          onChange={(e) => handleSocioRoleChange(socio.id, e.target.value)}
                          className="py-1.5 px-3 border border-slate-200 rounded-lg text-xs font-extrabold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        >
                          {rolesConfig.map(r => (
                            <option key={r.id} value={r.id}>{r.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-4 px-6">
                        <div className="relative max-w-[150px]">
                          <Lock className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
                          <input
                            type={showPass ? "text" : "password"}
                            value={currentPass}
                            placeholder="123456 (Defecto)"
                            onChange={(e) => handlePasswordChangeLocal(socio.id, e.target.value)}
                            className="w-full pl-7 pr-7 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(socio.id)}
                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                          >
                            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleSaveSocioCredentials(socio)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white py-1.5 px-3 rounded-lg text-xs font-black inline-flex items-center gap-1 transition-all"
                        >
                          <Save size={13} /> Guardar
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredSocios.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400 font-medium">
                      No se encontraron socios que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ROLES & MODULES */}
      {activeSubTab === 'roles' && (
        <div className="grid grid-col-1 lg:grid-cols-3 gap-8">
          {/* List of Roles */}
          <div className="lg:col-span-1 bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[2rem] p-6 shadow-sm space-y-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-blue-900">Roles del Sistema</h3>
              <button
                onClick={() => setIsAddingRole(!isAddingRole)}
                className="bg-blue-900 text-white text-xs font-black p-2 rounded-xl flex items-center gap-1 hover:bg-blue-800 transition-all"
              >
                {isAddingRole ? <X size={14} /> : <Plus size={14} />} Nuevo
              </button>
            </div>

            {/* ADD ROLE FORM */}
            {isAddingRole && (
              <form onSubmit={handleAddNewRole} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 animate-in slide-in-from-top-3 duration-250">
                <div>
                  <label className="block text-xs font-bold text-slate-550 mb-1">ID Único (Ej: VOCALES)</label>
                  <input
                    type="text"
                    required
                    placeholder="VOCALES"
                    value={newRoleId}
                    onChange={e => setNewRoleId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-550 mb-1">Nombre Descriptivo</label>
                  <input
                    type="text"
                    required
                    placeholder="Vocales y Comisiones"
                    value={newRoleName}
                    onChange={e => setNewRoleName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black py-2 rounded-lg transition-all"
                >
                  Confirmar y Guardar
                </button>
              </form>
            )}

            <div className="space-y-2">
              {rolesConfig.map(role => (
                <div
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                    selectedRole && selectedRole.id === role.id
                      ? 'bg-blue-50/70 border-blue-200 shadow-sm'
                      : 'bg-white hover:bg-slate-50/50 border-slate-200/60'
                  }`}
                >
                  <div>
                    <h4 className="font-extrabold text-blue-900 text-sm">{role.label}</h4>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{role.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {role.allowedTabs?.length || 0} tabs
                    </span>
                    {role.id !== 'SUPER_ADMIN' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRole(role.id);
                        }}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Configuration Grid */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[2rem] p-6 shadow-sm space-y-6">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <p className="font-semibold">Seleccione un rol de la lista para gestionar sus permisos y módulos visibles.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PUESTOS MANAGEMENT */}
      {activeSubTab === 'puestos' && (
        <div className="grid grid-col-1 lg:grid-cols-3 gap-8">
          {/* Create or Edit Position Form */}
          <div className="lg:col-span-1 bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[2rem] p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-blue-900">
              {editingPuestoId ? 'Editar Puesto' : 'Crear Puesto del Club'}
            </h3>

            <form onSubmit={handleSavePuesto} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">Nombre del Puesto</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Vocal de Actividades"
                  value={newPuestoName}
                  onChange={e => setNewPuestoName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-550 mb-1">Rol del Sistema Vinculado</label>
                <select
                  required
                  value={newPuestoRole}
                  onChange={e => setNewPuestoRole(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-700"
                >
                  <option value="" disabled>Seleccione un rol...</option>
                  {rolesConfig.map(role => (
                    <option key={role.id} value={role.id}>{role.label}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 font-medium mt-1">
                  Cuando asignes este puesto a un socio, heredará automáticamente los permisos de este rol.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-900 hover:bg-blue-800 text-white text-xs font-black py-2.5 rounded-xl transition-all"
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
                    className="bg-slate-200 hover:bg-slate-350 text-slate-700 text-xs font-black py-2.5 rounded-xl transition-all px-4"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List of Puestos */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[2rem] p-6 shadow-sm space-y-6">
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
