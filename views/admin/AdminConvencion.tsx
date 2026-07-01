import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, 
  Users, 
  Settings, 
  Download, 
  Search, 
  Sparkles, 
  Clock, 
  Image as ImageIcon, 
  FileText, 
  CheckCircle,
  AlertCircle,
  Loader2,
  UploadCloud,
  Plus,
  Edit2,
  Trash2,
  X,
  Music,
  Flag,
  Coffee,
  Award,
  Calendar,
  Compass,
  ChevronRight,
  Eye
} from 'lucide-react';
import { firebaseService } from '../../services/firebaseService';
import { compressImageFile, validateImageFile } from '../../utils/imageCompressor';
import { ConvencionConfig, ConvencionRegistro, ConvencionActividad, ConvencionExperiencia } from '../../types';

// Map of icons for selection
const ICON_OPTIONS = [
  { name: 'Music', label: 'Música/Marimba', Icon: Music },
  { name: 'Flag', label: 'Bandera/Desfile', Icon: Flag },
  { name: 'Coffee', label: 'Café/Gastronomía', Icon: Coffee },
  { name: 'Award', label: 'Trofeo/Logro', Icon: Award },
  { name: 'Sparkles', label: 'Destellos/Especial', Icon: Sparkles },
  { name: 'Clock', label: 'Reloj/Tiempo', Icon: Clock },
  { name: 'Users', label: 'Usuarios/Hermandad', Icon: Users }
];

export function AdminConvencion() {
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'registros'>('config');
  const [activeConfigTab, setActiveConfigTab] = useState<'general' | 'actividades' | 'experiencias'>('general');
  
  const [config, setConfig] = useState<ConvencionConfig>({
    titulo: '',
    lema: '',
    fechaEvento: '',
    horaEvento: '',
    fotoSede: '',
    fotoSedeEtiqueta: '',
    fotoSedeDescripcion: '',
    inscripcionesAbiertas: false,
    actividadesCulturales: [],
    experienciasUnicas: []
  });
  
  const [registros, setRegistros] = useState<ConvencionRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Image Upload States
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals States
  const [isActividadModalOpen, setIsActividadModalOpen] = useState(false);
  const [editingActividad, setEditingActividad] = useState<ConvencionActividad | null>(null);
  const [actividadForm, setActividadForm] = useState({
    title: '',
    description: '',
    time: '',
    iconName: 'Music'
  });

  const [isExperienciaModalOpen, setIsExperienciaModalOpen] = useState(false);
  const [editingExperiencia, setEditingExperiencia] = useState<ConvencionExperiencia | null>(null);
  const [experienciaForm, setExperienciaForm] = useState({
    title: '',
    desc: '',
    badge: 'Liderazgo'
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const dbConfig = await firebaseService.getConvencionConfig();
        setConfig({
          ...dbConfig,
          fotoSedeEtiqueta: dbConfig.fotoSedeEtiqueta || 'Sede Oficial',
          fotoSedeDescripcion: dbConfig.fotoSedeDescripcion || 'Teatro Municipal de Quetzaltenango',
          actividadesCulturales: dbConfig.actividadesCulturales || [],
          experienciasUnicas: dbConfig.experienciasUnicas || []
        });
        setImagePreview(dbConfig.fotoSede);
        
        const dbRegistros = await firebaseService.getConvencionRegistros();
        setRegistros(dbRegistros);
      } catch (error) {
        console.error("Error al cargar datos de convención:", error);
        setErrorMsg("Hubo un error al conectar con la base de datos.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setErrorMsg(validation.error || "Archivo de imagen inválido");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      let finalUrl = config.fotoSede;

      // Upload new image if selected
      if (imageFile) {
        const compressedBase64 = await compressImageFile(imageFile, 1200, 1200, 0.8);
        finalUrl = await firebaseService.uploadConvencionImage(compressedBase64);
      }

      const updatedConfig: ConvencionConfig = {
        ...config,
        fotoSede: finalUrl
      };

      await firebaseService.saveConvencionConfig(updatedConfig);
      setConfig(updatedConfig);
      setImageFile(null);

      setSuccessMsg("¡Configuración de la convención guardada exitosamente!");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error: any) {
      console.error("Error al guardar configuración:", error);
      setErrorMsg(error.message || "No se pudo guardar la configuración.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  // ================= ACTIVIDADES CULTURALES HANDLERS =================
  const openActividadModal = (act?: ConvencionActividad) => {
    if (act) {
      setEditingActividad(act);
      setActividadForm({
        title: act.title,
        description: act.description,
        time: act.time,
        iconName: act.iconName
      });
    } else {
      setEditingActividad(null);
      setActividadForm({
        title: '',
        description: '',
        time: '',
        iconName: 'Music'
      });
    }
    setIsActividadModalOpen(true);
  };

  const handleSaveActividad = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentList = config.actividadesCulturales || [];
    let updatedList: ConvencionActividad[] = [];

    if (editingActividad) {
      updatedList = currentList.map(a => 
        a.id === editingActividad.id 
          ? { ...a, ...actividadForm } 
          : a
      );
    } else {
      const newAct: ConvencionActividad = {
        id: `act_${Date.now()}`,
        ...actividadForm
      };
      updatedList = [...currentList, newAct];
    }

    const updatedConfig = { ...config, actividadesCulturales: updatedList };
    setConfig(updatedConfig);
    setIsActividadModalOpen(false);

    // Save automatically
    setSaving(true);
    try {
      await firebaseService.saveConvencionConfig(updatedConfig);
      setSuccessMsg("Actividad cultural guardada.");
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      setErrorMsg("Error al sincronizar con Firestore.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteActividad = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar esta actividad cultural?")) return;
    
    const updatedList = (config.actividadesCulturales || []).filter(a => a.id !== id);
    const updatedConfig = { ...config, actividadesCulturales: updatedList };
    setConfig(updatedConfig);

    setSaving(true);
    try {
      await firebaseService.saveConvencionConfig(updatedConfig);
      setSuccessMsg("Actividad cultural eliminada.");
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      setErrorMsg("Error al sincronizar con Firestore.");
    } finally {
      setSaving(false);
    }
  };

  // ================= EXPERIENCIAS ÚNICAS HANDLERS =================
  const openExperienciaModal = (exp?: ConvencionExperiencia) => {
    if (exp) {
      setEditingExperiencia(exp);
      setExperienciaForm({
        title: exp.title,
        desc: exp.desc,
        badge: exp.badge
      });
    } else {
      setEditingExperiencia(null);
      setExperienciaForm({
        title: '',
        desc: '',
        badge: 'Liderazgo'
      });
    }
    setIsExperienciaModalOpen(true);
  };

  const handleSaveExperiencia = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentList = config.experienciasUnicas || [];
    let updatedList: ConvencionExperiencia[] = [];

    if (editingExperiencia) {
      updatedList = currentList.map(exp => 
        exp.id === editingExperiencia.id 
          ? { ...exp, ...experienciaForm } 
          : exp
      );
    } else {
      const newExp: ConvencionExperiencia = {
        id: `exp_${Date.now()}`,
        ...experienciaForm
      };
      updatedList = [...currentList, newExp];
    }

    const updatedConfig = { ...config, experienciasUnicas: updatedList };
    setConfig(updatedConfig);
    setIsExperienciaModalOpen(false);

    // Save automatically
    setSaving(true);
    try {
      await firebaseService.saveConvencionConfig(updatedConfig);
      setSuccessMsg("Experiencia única guardada.");
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      setErrorMsg("Error al sincronizar con Firestore.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExperiencia = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar esta experiencia?")) return;
    
    const updatedList = (config.experienciasUnicas || []).filter(e => e.id !== id);
    const updatedConfig = { ...config, experienciasUnicas: updatedList };
    setConfig(updatedConfig);

    setSaving(true);
    try {
      await firebaseService.saveConvencionConfig(updatedConfig);
      setSuccessMsg("Experiencia única eliminada.");
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      setErrorMsg("Error al sincronizar con Firestore.");
    } finally {
      setSaving(false);
    }
  };

  // Filtered registrations
  const filteredRegistros = registros.filter(r => {
    const term = searchTerm.toLowerCase();
    return (
      r.nombre.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term) ||
      r.club.toLowerCase().includes(term) ||
      r.cargo.toLowerCase().includes(term) ||
      r.distrito.toLowerCase().includes(term)
    );
  });

  // Export CSV
  const handleExportCSV = () => {
    if (registros.length === 0) return;
    
    const headers = ["Nombre Completo", "Email", "Telefono", "Club", "Cargo", "Zona", "Fecha Registro"];
    const csvRows = [
      headers.join(','),
      ...filteredRegistros.map(r => [
        `"${r.nombre.replace(/"/g, '""')}"`,
        `"${r.email.replace(/"/g, '""')}"`,
        `"${r.telefono.replace(/"/g, '""')}"`,
        `"${r.club.replace(/"/g, '""')}"`,
        `"${r.cargo.replace(/"/g, '""')}"`,
        `"${r.distrito.replace(/"/g, '""')}"`,
        `"${new Date(r.fechaRegistro).toLocaleString()}"`
      ].join(','))
    ];

    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Preinscritos_Convencion_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <Loader2 className="w-10 h-10 text-blue-900 animate-spin" />
        <p className="mt-4 text-blue-900 font-bold">Cargando panel de convención...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
      {/* Sub Header */}
      <div className="bg-slate-50 border-b border-slate-100 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center space-x-2">
            <Sparkles className="text-yellow-500" size={24} />
            <span>Configuración de la Convención D3</span>
          </h2>
          <p className="text-xs text-slate-550 mt-1">Gestiona los contenidos de la landing page pública y la base de pre-inscritos.</p>
        </div>

        <div className="flex bg-slate-200/60 p-1 rounded-2xl border border-slate-250">
          <button
            onClick={() => setActiveSubTab('config')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              activeSubTab === 'config'
                ? 'bg-blue-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings size={14} />
            <span>Contenidos</span>
          </button>
          <button
            onClick={() => setActiveSubTab('registros')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              activeSubTab === 'registros'
                ? 'bg-blue-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users size={14} />
            <span>Pre-registros ({registros.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {successMsg && (
          <div className="mb-6 flex items-center space-x-3 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-sm font-bold">
            <CheckCircle className="text-emerald-500 shrink-0" size={18} />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 flex items-center space-x-3 bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-sm font-bold">
            <AlertCircle className="text-red-500 shrink-0" size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ================= CONTENIDOS TAB ================= */}
        {activeSubTab === 'config' && (
          <div className="space-y-6">
            {/* Sub navigation for contents */}
            <div className="flex border-b border-slate-100 pb-3 space-x-6 text-xs font-extrabold uppercase tracking-wider text-slate-500">
              <button 
                onClick={() => setActiveConfigTab('general')}
                className={`pb-3 relative transition-colors ${activeConfigTab === 'general' ? 'text-blue-900 font-black' : 'hover:text-slate-800'}`}
              >
                Configuración General
                {activeConfigTab === 'general' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-900 rounded-full" />}
              </button>
              <button 
                onClick={() => setActiveConfigTab('actividades')}
                className={`pb-3 relative transition-colors ${activeConfigTab === 'actividades' ? 'text-blue-900 font-black' : 'hover:text-slate-800'}`}
              >
                Actividades Culturales ({config.actividadesCulturales?.length || 0})
                {activeConfigTab === 'actividades' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-900 rounded-full" />}
              </button>
              <button 
                onClick={() => setActiveConfigTab('experiencias')}
                className={`pb-3 relative transition-colors ${activeConfigTab === 'experiencias' ? 'text-blue-900 font-black' : 'hover:text-slate-800'}`}
              >
                Experiencias Únicas ({config.experienciasUnicas?.length || 0})
                {activeConfigTab === 'experiencias' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-900 rounded-full" />}
              </button>
            </div>

            {/* General Sub-Tab */}
            {activeConfigTab === 'general' && (
              <form onSubmit={handleSaveConfig} className="space-y-8 max-w-4xl pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Título */}
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500" htmlFor="titulo">Título de la Convención</label>
                    <input 
                      type="text" 
                      id="titulo"
                      name="titulo"
                      value={config.titulo}
                      onChange={handleConfigChange}
                      required
                      placeholder="Ej. Distrito D3 Guatemala"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-semibold"
                    />
                  </div>

                  {/* Lema */}
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500" htmlFor="lema">Lema / Frase Leonística</label>
                    <input 
                      type="text" 
                      id="lema"
                      name="lema"
                      value={config.lema}
                      onChange={handleConfigChange}
                      required
                      placeholder="Ej. Rugiendo con fuerza..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-semibold"
                    />
                  </div>

                  {/* Fecha Evento */}
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500" htmlFor="fechaEvento">Fecha de Inicio del Evento</label>
                    <input 
                      type="date" 
                      id="fechaEvento"
                      name="fechaEvento"
                      value={config.fechaEvento}
                      onChange={handleConfigChange}
                      required
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-semibold"
                    />
                  </div>

                  {/* Hora Evento */}
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500" htmlFor="horaEvento">Hora de Inicio</label>
                    <input 
                      type="text" 
                      id="horaEvento"
                      name="horaEvento"
                      value={config.horaEvento}
                      onChange={handleConfigChange}
                      required
                      placeholder="HH:MM:SS (Ej: 08:00:00)"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-semibold"
                    />
                  </div>

                  {/* Foto Sede - Cargador */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Fotografía de la Sede</label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                      <div className="sm:col-span-6">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full h-36 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-blue-900 bg-slate-50/50 hover:bg-slate-50 rounded-2xl transition-all group cursor-pointer"
                        >
                          <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-blue-900 transition-colors" />
                          <span className="mt-2 text-xs font-black text-slate-700 group-hover:text-blue-900 transition-colors uppercase tracking-wider">
                            {imageFile ? 'Cambiar Imagen' : 'Subir Imagen Sede'}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1">Formatos: JPG, PNG. Máx. 10MB</span>
                        </button>
                      </div>

                      <div className="sm:col-span-6">
                        {imagePreview ? (
                          <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-slate-200 shadow-md">
                            <img src={imagePreview} alt="Sede de Convención" className="w-full h-full object-cover" />
                            {imageFile && (
                              <div className="absolute top-2 right-2 bg-yellow-500 text-blue-955 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow">
                                Por guardar
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-36 rounded-2xl bg-slate-100 flex flex-col items-center justify-center text-slate-400 border border-slate-200">
                            <ImageIcon size={28} />
                            <span className="text-[10px] font-bold mt-1">Sin fotografía seleccionada</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Etiqueta Foto Sede */}
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500" htmlFor="fotoSedeEtiqueta">Etiqueta sobre la foto de la sede</label>
                    <input 
                      type="text" 
                      id="fotoSedeEtiqueta"
                      name="fotoSedeEtiqueta"
                      value={config.fotoSedeEtiqueta || ''}
                      onChange={handleConfigChange}
                      placeholder="Ej. Sede Oficial"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-semibold"
                    />
                  </div>

                  {/* Descripción Foto Sede */}
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500" htmlFor="fotoSedeDescripcion">Descripción de la foto de la sede</label>
                    <input 
                      type="text" 
                      id="fotoSedeDescripcion"
                      name="fotoSedeDescripcion"
                      value={config.fotoSedeDescripcion || ''}
                      onChange={handleConfigChange}
                      placeholder="Ej. Teatro Municipal de Quetzaltenango"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-semibold"
                    />
                  </div>

                  {/* Checkbox Inscripciones Abiertas */}
                  <div className="md:col-span-2 flex items-center space-x-3 bg-blue-50/50 p-4 border border-blue-100 rounded-2xl">
                    <input
                      type="checkbox"
                      id="inscripcionesAbiertas"
                      name="inscripcionesAbiertas"
                      checked={config.inscripcionesAbiertas}
                      onChange={handleToggleChange}
                      className="w-5 h-5 accent-blue-900 rounded focus:ring-0 focus:outline-none cursor-pointer"
                    />
                    <div className="cursor-pointer">
                      <label htmlFor="inscripcionesAbiertas" className="font-extrabold text-slate-800 text-sm select-none cursor-pointer">
                        Habilitar botón / formulario de Pre-inscripciones
                      </label>
                      <p className="text-[10px] text-slate-500">
                        Si está marcado, los usuarios podrán pre-registrarse en la landing page. De lo contrario, se mostrará "Inscripciones Abiertas Muy Pronto".
                      </p>
                    </div>
                  </div>

                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-950 hover:to-indigo-950 text-white font-black px-6 py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Save size={16} />
                        <span>Guardar Datos Generales</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Actividades Culturales Sub-Tab */}
            {activeConfigTab === 'actividades' && (
              <div className="space-y-6 pt-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Actividades Culturales y Sociales</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Se mostrarán en la sección "Agenda de Hermandad" de la página.</p>
                  </div>
                  <button
                    onClick={() => openActividadModal()}
                    className="flex items-center space-x-1.5 bg-blue-900 hover:bg-blue-955 text-white font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm"
                  >
                    <Plus size={14} />
                    <span>Añadir Actividad</span>
                  </button>
                </div>

                {(config.actividadesCulturales || []).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(config.actividadesCulturales || []).map((act) => {
                      const opt = ICON_OPTIONS.find(o => o.name === act.iconName) || ICON_OPTIONS[0];
                      const IconComp = opt.Icon;
                      return (
                        <div key={act.id} className="bg-slate-50 border border-slate-150 p-6 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="w-10 h-10 rounded-xl bg-blue-900/10 text-blue-900 flex items-center justify-center border border-blue-900/10">
                                <IconComp size={18} />
                              </div>
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => openActividadModal(act)}
                                  className="p-1.5 hover:bg-slate-200 text-slate-650 hover:text-slate-900 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteActividad(act.id)}
                                  className="p-1.5 hover:bg-red-50 text-red-650 hover:text-red-800 rounded-lg transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-extrabold text-slate-800 text-base tracking-tight">{act.title}</h4>
                              <p className="text-xs text-slate-500 font-bold mt-1 flex items-center space-x-1">
                                <Clock size={12} className="text-slate-400" />
                                <span>{act.time}</span>
                              </p>
                            </div>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">{act.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl">
                    <Music className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="mt-3 text-slate-800 font-extrabold text-sm">Sin actividades culturales</p>
                    <p className="text-xs text-slate-500 mt-1">Crea actividades para que se visualicen en la landing page.</p>
                  </div>
                )}
              </div>
            )}

            {/* Experiencias Únicas Sub-Tab */}
            {activeConfigTab === 'experiencias' && (
              <div className="space-y-6 pt-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Experiencias Únicas de la Convención</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Se mostrarán en la sección "Mística Leonística".</p>
                  </div>
                  <button
                    onClick={() => openExperienciaModal()}
                    className="flex items-center space-x-1.5 bg-blue-900 hover:bg-blue-955 text-white font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm"
                  >
                    <Plus size={14} />
                    <span>Añadir Experiencia</span>
                  </button>
                </div>

                {(config.experienciasUnicas || []).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(config.experienciasUnicas || []).map((exp) => (
                      <div key={exp.id} className="bg-slate-50 border border-slate-150 p-6 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] font-black uppercase tracking-wider bg-blue-105 border border-blue-200 text-blue-800 px-2.5 py-0.5 rounded-md">
                              {exp.badge}
                            </span>
                            <div className="flex space-x-1">
                              <button
                                  onClick={() => openExperienciaModal(exp)}
                                  className="p-1.5 hover:bg-slate-200 text-slate-650 hover:text-slate-900 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteExperiencia(exp.id)}
                                  className="p-1.5 hover:bg-red-50 text-red-650 hover:text-red-800 rounded-lg transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 size={13} />
                                </button>
                            </div>
                          </div>
                          <h4 className="font-extrabold text-slate-800 text-base tracking-tight">{exp.title}</h4>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed">{exp.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl">
                    <Compass className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="mt-3 text-slate-800 font-extrabold text-sm">Sin experiencias configuradas</p>
                    <p className="text-xs text-slate-500 mt-1">Crea experiencias únicas sobre mística o liderazgo leonístico.</p>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* ================= PRE-REGISTROS TAB ================= */}
        {activeSubTab === 'registros' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="relative w-full sm:max-w-xs">
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar socio, email o club..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-2xl pl-10 pr-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-semibold"
                />
                <Search className="absolute left-3.5 top-3 text-slate-455" size={16} />
              </div>

              {registros.length > 0 && (
                <button
                  onClick={handleExportCSV}
                  className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md"
                >
                  <Download size={14} />
                  <span>Exportar CSV (Excel)</span>
                </button>
              )}
            </div>

            {filteredRegistros.length > 0 ? (
              <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">
                        <th className="px-6 py-4">Nombre Completo</th>
                        <th className="px-6 py-4">Contacto</th>
                        <th className="px-6 py-4">Club de procedencia</th>
                        <th className="px-6 py-4">Cargo</th>
                        <th className="px-6 py-4">Zona</th>
                        <th className="px-6 py-4">Fecha Registro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-105 font-bold">
                      {filteredRegistros.map((reg) => (
                        <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-slate-850 font-black">{reg.nombre}</span>
                          </td>
                          <td className="px-6 py-4 text-xs">
                            <div className="flex flex-col space-y-0.5">
                              <span className="text-slate-700">{reg.email}</span>
                              <span className="text-slate-500">{reg.telefono}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-700">{reg.club}</td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-md uppercase font-black tracking-wider">
                              {reg.cargo}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs">{reg.distrito}</td>
                          <td className="px-6 py-4 text-slate-500 text-xs">
                            {new Date(reg.fechaRegistro).toLocaleString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <FileText className="w-12 h-12 text-slate-355 mx-auto" />
                <p className="mt-4 text-slate-800 font-extrabold text-base">No hay pre-registros encontrados</p>
                <p className="text-xs text-slate-550 mt-1">Los socios que se registren en la landing page aparecerán listados aquí.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= MODAL: ACTIVIDAD CULTURAL ================= */}
      {isActividadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-850 uppercase tracking-wider flex items-center space-x-2">
                <Music size={18} className="text-blue-900" />
                <span>{editingActividad ? 'Editar Actividad' : 'Nueva Actividad'}</span>
              </h3>
              <button 
                onClick={() => setIsActividadModalOpen(false)}
                className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveActividad} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500" htmlFor="act_title">Título de la Actividad</label>
                <input
                  type="text"
                  id="act_title"
                  required
                  value={actividadForm.title}
                  onChange={(e) => setActividadForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej. Noche de Gala Folclórica"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-semibold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500" htmlFor="act_time">Fecha y Hora / Cronograma</label>
                <input
                  type="text"
                  id="act_time"
                  required
                  value={actividadForm.time}
                  onChange={(e) => setActividadForm(prev => ({ ...prev, time: e.target.value }))}
                  placeholder="Ej. Sábado 21 de Marzo, 19:00 hrs"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-semibold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Seleccionar Icono Representativo</label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {ICON_OPTIONS.map((opt) => {
                    const OptIcon = opt.Icon;
                    const isSelected = actividadForm.iconName === opt.name;
                    return (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => setActividadForm(prev => ({ ...prev, iconName: opt.name }))}
                        title={opt.label}
                        className={`p-3 rounded-2xl flex flex-col items-center justify-center border transition-all ${
                          isSelected 
                            ? 'bg-blue-900 text-white border-blue-900 scale-105 shadow-md shadow-blue-900/10' 
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
                        }`}
                      >
                        <OptIcon size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500" htmlFor="act_description">Descripción / Detalles</label>
                <textarea
                  id="act_description"
                  required
                  rows={3}
                  value={actividadForm.description}
                  onChange={(e) => setActividadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detalles sobre lo que se realizará en la actividad..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-semibold resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsActividadModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-900 hover:bg-blue-955 text-white font-extrabold px-6 py-2.5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-sm"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EXPERIENCIA ÚNICA ================= */}
      {isExperienciaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-850 uppercase tracking-wider flex items-center space-x-2">
                <Compass size={18} className="text-blue-900" />
                <span>{editingExperiencia ? 'Editar Experiencia' : 'Nueva Experiencia'}</span>
              </h3>
              <button 
                onClick={() => setIsExperienciaModalOpen(false)}
                className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveExperiencia} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500" htmlFor="exp_badge">Etiqueta / Badge Superior</label>
                <input
                  type="text"
                  id="exp_badge"
                  required
                  value={experienciaForm.badge}
                  onChange={(e) => setExperienciaForm(prev => ({ ...prev, badge: e.target.value }))}
                  placeholder="Ej. Liderazgo, Hermandad, Servicio, Amistad"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-semibold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500" htmlFor="exp_title">Título de la Experiencia</label>
                <input
                  type="text"
                  id="exp_title"
                  required
                  value={experienciaForm.title}
                  onChange={(e) => setExperienciaForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej. Foro de Liderazgo D3"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-semibold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500" htmlFor="exp_desc">Descripción Corta</label>
                <textarea
                  id="exp_desc"
                  required
                  rows={4}
                  value={experienciaForm.desc}
                  onChange={(e) => setExperienciaForm(prev => ({ ...prev, desc: e.target.value }))}
                  placeholder="Describe la experiencia única y su valor para el socio..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-semibold resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsExperienciaModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-900 hover:bg-blue-955 text-white font-extrabold px-6 py-2.5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-sm"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
