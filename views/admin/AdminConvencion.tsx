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
  Eye,
  Mail,
  Send,
  Handshake,
  Wand2
} from 'lucide-react';
import { firebaseService } from '../../services/firebaseService';
import { telegramService } from '../../services/telegramService';
import { compressImageFile, validateImageFile, removeDarkBackgroundFromDataUrl } from '../../utils/imageCompressor';
import { ConvencionConfig, ConvencionRegistro, ConvencionActividad, ConvencionExperiencia, ConvencionAlianza } from '../../types';

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

const DEFAULT_ALIANZAS: ConvencionAlianza[] = [
  { id: 'alianza-1', name: 'Lions Clubs International', category: 'Organización Mundial', icon: '🦁', badge: 'Oficial' },
  { id: 'alianza-2', name: 'Distrito D3 Guatemala', category: 'Gobernación Distrital', icon: '🏛️', badge: 'Anfitrión' },
  { id: 'alianza-3', name: 'Colina Country Club', category: 'Sede Oficial', icon: '🏰', badge: 'Complejo' },
  { id: 'alianza-4', name: 'Municipalidad de Quetzaltenango', category: 'Cultura Altense', icon: '🇬🇹', badge: 'Gobierno' },
  { id: 'alianza-5', name: 'INGUAT', category: 'Turismo Guatemala', icon: '🌄', badge: 'Institucional' },
  { id: 'alianza-6', name: 'Club de Leones Quetzaltenango', category: 'Comité Organizador', icon: '👑', badge: 'Anfitriones' },
  { id: 'alianza-7', name: 'Leo Club International', category: 'Liderazgo Juvenil', icon: '⭐', badge: 'Juventud' },
  { id: 'alianza-8', name: 'Cámara de Comercio Xela', category: 'Desarrollo Regional', icon: '🤝', badge: 'Aliado' }
];

export function AdminConvencion() {
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'registros'>('config');
  const [activeConfigTab, setActiveConfigTab] = useState<'general' | 'actividades' | 'experiencias' | 'alianzas' | 'difusion'>('general');
  
  // Mass Broadcast State
  const [broadcastSubject, setBroadcastSubject] = useState('Avances y Boletín Oficial - LXIV Convención Lionística');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastTelegramMsg, setBroadcastTelegramMsg] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const [config, setConfig] = useState<ConvencionConfig>({
    titulo: '',
    lema: '',
    fechaEvento: '',
    horaEvento: '',
    fotoSede: '',
    fotoSedeEtiqueta: '',
    fotoSedeDescripcion: '',
    inscripcionesAbiertas: true,
    actividadesCulturales: [],
    experienciasUnicas: [],
    alianzas: []
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

  // Header Background Image Upload States
  const [headerBgFile, setHeaderBgFile] = useState<File | null>(null);
  const [headerBgPreview, setHeaderBgPreview] = useState<string>('');
  const headerBgFileInputRef = useRef<HTMLInputElement>(null);

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

  // Alianzas / Patrocinadores Modal States
  const [isAlianzaModalOpen, setIsAlianzaModalOpen] = useState(false);
  const [editingAlianza, setEditingAlianza] = useState<ConvencionAlianza | null>(null);
  const [alianzaForm, setAlianzaForm] = useState({
    name: '',
    category: '',
    badge: 'Oficial',
    icon: '🦁',
    logoUrl: ''
  });
  const [alianzaLogoFile, setAlianzaLogoFile] = useState<File | null>(null);
  const [alianzaLogoPreview, setAlianzaLogoPreview] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const dbConfig = await firebaseService.getConvencionConfig();
        if (!isMounted) return;
        setConfig({
          ...dbConfig,
          inscripcionesAbiertas: dbConfig.inscripcionesAbiertas !== undefined ? dbConfig.inscripcionesAbiertas : true,
          fotoSedeEtiqueta: dbConfig.fotoSedeEtiqueta || 'Sede Oficial',
          fotoSedeDescripcion: dbConfig.fotoSedeDescripcion || 'Teatro Municipal de Quetzaltenango',
          headerBgOverlayOpacity: dbConfig.headerBgOverlayOpacity !== undefined ? dbConfig.headerBgOverlayOpacity : 75,
          actividadesCulturales: dbConfig.actividadesCulturales || [],
          experienciasUnicas: dbConfig.experienciasUnicas || []
        });
        setImagePreview(dbConfig.fotoSede);
        setHeaderBgPreview(dbConfig.headerBgUrl || '');
        
        const dbRegistros = await firebaseService.getConvencionRegistros();
        if (!isMounted) return;
        setRegistros(dbRegistros);
      } catch (error) {
        if (!isMounted) return;
        console.error("Error al cargar datos de convención:", error);
        setErrorMsg("Hubo un error al conectar con la base de datos.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
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

  const handleHeaderBgChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setErrorMsg(validation.error || "Archivo de imagen de encabezado inválido");
        return;
      }
      setHeaderBgFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setHeaderBgPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveHeaderBg = () => {
    setHeaderBgFile(null);
    setHeaderBgPreview('');
    setConfig(prev => ({
      ...prev,
      headerBgUrl: ''
    }));
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      let finalUrl = config.fotoSede;
      let finalHeaderBgUrl = config.headerBgUrl || '';

      // Upload new sede image if selected
      if (imageFile) {
        const compressedBase64 = await compressImageFile(imageFile, 1200, 1200, 0.8);
        finalUrl = await firebaseService.uploadConvencionImage(compressedBase64);
      }

      // Upload new header background image if selected
      if (headerBgFile) {
        const compressedHeaderBase64 = await compressImageFile(headerBgFile, 1920, 1080, 0.85);
        finalHeaderBgUrl = await firebaseService.uploadConvencionImage(compressedHeaderBase64);
      }

      const updatedConfig: ConvencionConfig = {
        ...config,
        fotoSede: finalUrl,
        headerBgUrl: finalHeaderBgUrl,
        headerBgOverlayOpacity: config.headerBgOverlayOpacity !== undefined ? Number(config.headerBgOverlayOpacity) : 75
      };

      await firebaseService.saveConvencionConfig(updatedConfig);
      setConfig(updatedConfig);
      setImageFile(null);
      setHeaderBgFile(null);

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

  const [removeBlackBg, setRemoveBlackBg] = useState(false);
  const [isCleaningBg, setIsCleaningBg] = useState(false);

  const handleCleanBlackBackground = async () => {
    if (!alianzaLogoPreview) return;
    setIsCleaningBg(true);
    try {
      const transparentDataUrl = await removeDarkBackgroundFromDataUrl(alianzaLogoPreview, 35);
      setAlianzaLogoPreview(transparentDataUrl);
      setAlianzaForm(prev => ({ ...prev, logoUrl: transparentDataUrl }));
      setSuccessMsg("¡Fondo negro removido exitosamente! La imagen ahora es transparente.");
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch {
      setErrorMsg("No se pudo remover el fondo negro de la imagen.");
    } finally {
      setIsCleaningBg(false);
    }
  };

  const handleCleanCardBackground = async (aliado: ConvencionAlianza) => {
    if (!aliado.logoUrl) return;
    setSaving(true);
    try {
      const transparentDataUrl = await removeDarkBackgroundFromDataUrl(aliado.logoUrl, 35);
      const finalUrl = await firebaseService.uploadConvencionImage(transparentDataUrl);

      const currentList = (config.alianzas && config.alianzas.length > 0) ? config.alianzas : DEFAULT_ALIANZAS;
      const updatedList = currentList.map(item =>
        item.id === aliado.id ? { ...item, logoUrl: finalUrl } : item
      );
      const updatedConfig = { ...config, alianzas: updatedList };
      setConfig(updatedConfig);
      await firebaseService.saveConvencionConfig(updatedConfig);

      setSuccessMsg(`¡Fondo negro removido exitosamente para "${aliado.name}"!`);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (error) {
      setErrorMsg("Error al procesar la imagen.");
    } finally {
      setSaving(false);
    }
  };

  // ================= ALIANZAS & PATROCINADORES HANDLERS =================
  const openAlianzaModal = (aliado?: ConvencionAlianza) => {
    setRemoveBlackBg(false);
    if (aliado) {
      setEditingAlianza(aliado);
      setAlianzaForm({
        name: aliado.name,
        category: aliado.category,
        badge: aliado.badge || 'Oficial',
        icon: aliado.icon || '🦁',
        logoUrl: aliado.logoUrl || ''
      });
      setAlianzaLogoPreview(aliado.logoUrl || '');
    } else {
      setEditingAlianza(null);
      setAlianzaForm({
        name: '',
        category: '',
        badge: 'Oficial',
        icon: '🦁',
        logoUrl: ''
      });
      setAlianzaLogoPreview('');
    }
    setAlianzaLogoFile(null);
    setIsAlianzaModalOpen(true);
  };

  const handleAlianzaLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setErrorMsg(validation.error || "Archivo de imagen inválido");
        return;
      }
      setAlianzaLogoFile(file);
      
      try {
        const compressedBase64 = await compressImageFile(file, 600, 600, 0.85, removeBlackBg);
        setAlianzaLogoPreview(compressedBase64);
      } catch {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setAlianzaLogoPreview(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSaveAlianza = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      let finalLogoUrl = alianzaForm.logoUrl;

      if (alianzaLogoFile) {
        let compressedBase64 = await compressImageFile(alianzaLogoFile, 600, 600, 0.85, removeBlackBg);
        if (removeBlackBg) {
          compressedBase64 = await removeDarkBackgroundFromDataUrl(compressedBase64, 35);
        }
        finalLogoUrl = await firebaseService.uploadConvencionImage(compressedBase64);
      } else if (removeBlackBg && finalLogoUrl) {
        let cleanedUrl = await removeDarkBackgroundFromDataUrl(finalLogoUrl, 35);
        finalLogoUrl = await firebaseService.uploadConvencionImage(cleanedUrl);
      }

      const currentList = (config.alianzas && config.alianzas.length > 0) ? config.alianzas : DEFAULT_ALIANZAS;
      let updatedList: ConvencionAlianza[] = [];

      if (editingAlianza) {
        updatedList = currentList.map(item =>
          item.id === editingAlianza.id
            ? { ...item, ...alianzaForm, logoUrl: finalLogoUrl }
            : item
        );
      } else {
        const newAlianza: ConvencionAlianza = {
          id: `alianza_${Date.now()}`,
          ...alianzaForm,
          logoUrl: finalLogoUrl
        };
        updatedList = [...currentList, newAlianza];
      }

      const updatedConfig = { ...config, alianzas: updatedList };
      setConfig(updatedConfig);
      setIsAlianzaModalOpen(false);

      await firebaseService.saveConvencionConfig(updatedConfig);
      setSuccessMsg("¡Diapositiva de logo/alianza guardada exitosamente!");
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error: any) {
      console.error("Error al guardar alianza:", error);
      setErrorMsg(error.message || "No se pudo guardar la alianza.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAlianza = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar este logo de las alianzas?")) return;

    const currentList = (config.alianzas && config.alianzas.length > 0) ? config.alianzas : DEFAULT_ALIANZAS;
    const updatedList = currentList.filter(item => item.id !== id);
    const updatedConfig = { ...config, alianzas: updatedList };
    setConfig(updatedConfig);

    setSaving(true);
    try {
      await firebaseService.saveConvencionConfig(updatedConfig);
      setSuccessMsg("Diapositiva de alianza eliminada.");
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

  const handleSendMassEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject.trim() || !broadcastBody.trim()) {
      setErrorMsg("Por favor completa el asunto y el mensaje del correo.");
      return;
    }
    if (registros.length === 0) {
      setErrorMsg("No hay participantes pre-inscritos a quiénes enviar el correo.");
      return;
    }

    setIsBroadcasting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const enviados = await telegramService.sendBroadcastEmail(
        registros,
        broadcastSubject,
        broadcastBody,
        config.googleScriptUrl
      );
      setSuccessMsg(`¡Boletín enviado exitosamente a los ${registros.length} participantes pre-inscritos!`);
      setBroadcastBody('');
    } catch (err: any) {
      setErrorMsg("Ocurrió un error al enviar la difusión masiva.");
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleSendTelegramBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTelegramMsg.trim()) {
      setErrorMsg("Por favor escribe el mensaje para Telegram.");
      return;
    }
    setIsBroadcasting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const ok = await telegramService.sendMessage(
        config.telegramBotToken || '',
        config.telegramChatId || '',
        `📢 <b>BOLETÍN OFICIAL DE LA CONVENCIÓN</b>\n\n${broadcastTelegramMsg}`
      );
      if (ok) {
        setSuccessMsg("¡Anuncio enviado exitosamente al canal/grupo de Telegram!");
        setBroadcastTelegramMsg('');
      } else {
        setErrorMsg("No se pudo enviar por Telegram. Verifica las credenciales configuradas.");
      }
    } catch (err: any) {
      setErrorMsg("Error al enviar por Telegram.");
    } finally {
      setIsBroadcasting(false);
    }
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
          <>
            {/* Sub navigation for contents */}
            <div className="flex border-b border-slate-100 pb-3 space-x-6 text-xs font-extrabold uppercase tracking-wider text-slate-500 overflow-x-auto">
              <button 
                onClick={() => setActiveConfigTab('general')}
                className={`pb-3 relative transition-colors whitespace-nowrap ${activeConfigTab === 'general' ? 'text-blue-900 font-black' : 'hover:text-slate-800'}`}
              >
                Configuración General
                {activeConfigTab === 'general' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-900 rounded-full" />}
              </button>
              <button 
                onClick={() => setActiveConfigTab('actividades')}
                className={`pb-3 relative transition-colors whitespace-nowrap ${activeConfigTab === 'actividades' ? 'text-blue-900 font-black' : 'hover:text-slate-800'}`}
              >
                Actividades Culturales ({config.actividadesCulturales?.length || 0})
                {activeConfigTab === 'actividades' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-900 rounded-full" />}
              </button>
              <button 
                onClick={() => setActiveConfigTab('experiencias')}
                className={`pb-3 relative transition-colors whitespace-nowrap ${activeConfigTab === 'experiencias' ? 'text-blue-900 font-black' : 'hover:text-slate-800'}`}
              >
                Experiencias Únicas ({config.experienciasUnicas?.length || 0})
                {activeConfigTab === 'experiencias' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-900 rounded-full" />}
              </button>
              <button 
                onClick={() => setActiveConfigTab('alianzas')}
                className={`pb-3 relative transition-colors whitespace-nowrap flex items-center space-x-1.5 ${activeConfigTab === 'alianzas' ? 'text-blue-900 font-black' : 'hover:text-slate-800'}`}
              >
                <Handshake size={14} className="text-yellow-600" />
                <span>Alianzas & Logos ({config.alianzas?.length || DEFAULT_ALIANZAS.length})</span>
                {activeConfigTab === 'alianzas' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-900 rounded-full" />}
              </button>
              <button 
                onClick={() => setActiveConfigTab('difusion')}
                className={`pb-3 relative transition-colors whitespace-nowrap flex items-center space-x-1.5 ${activeConfigTab === 'difusion' ? 'text-blue-900 font-black' : 'hover:text-slate-800'}`}
              >
                <Mail size={14} className="text-yellow-600" />
                <span>Difusión Masiva ({registros.length} Inscritos)</span>
                {activeConfigTab === 'difusion' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-900 rounded-full" />}
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
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500" htmlFor="lema">Lema / Frase Lionística</label>
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
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500" htmlFor="fechaEvento">Fecha del Evento</label>
                    <input 
                      type="text" 
                      id="fechaEvento"
                      name="fechaEvento"
                      value={config.fechaEvento}
                      onChange={handleConfigChange}
                      required
                      placeholder="Ej. 24 al 26 de Mayo, 2026"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-semibold"
                    />
                  </div>

                  {/* Hora Evento */}
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500" htmlFor="horaEvento">Lugar / Sede Principal</label>
                    <input 
                      type="text" 
                      id="horaEvento"
                      name="horaEvento"
                      value={config.horaEvento}
                      onChange={handleConfigChange}
                      required
                      placeholder="Ej. Quetzaltenango, Guatemala"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-semibold"
                    />
                  </div>

                  {/* Fotografía Sede */}
                  <div className="md:col-span-2 space-y-3 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">Fotografía de la Sede</label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                      <div className="sm:col-span-6">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-blue-900 rounded-2xl bg-white transition-all cursor-pointer group"
                        >
                          <input 
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            className="hidden"
                          />
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

                  {/* Fotografía de Fondo del Encabezado (Header Background Image & Transparency) */}
                  <div className="md:col-span-2 space-y-4 bg-gradient-to-br from-slate-900 to-blue-955 p-6 rounded-2xl border-2 border-yellow-500/30 text-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 block">Encabezado de Convención</span>
                        <h4 className="text-base font-extrabold text-white">Imagen de Fondo & Transparencia del Header</h4>
                      </div>
                      {headerBgPreview && (
                        <button
                          type="button"
                          onClick={handleRemoveHeaderBg}
                          className="text-xs text-red-400 hover:text-red-300 font-bold underline cursor-pointer"
                        >
                          Quitar Imagen
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                      <div className="sm:col-span-6 space-y-2">
                        <button
                          type="button"
                          onClick={() => headerBgFileInputRef.current?.click()}
                          className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/20 hover:border-yellow-500 rounded-2xl bg-blue-900/50 hover:bg-blue-900/80 transition-all cursor-pointer group"
                        >
                          <input 
                            type="file"
                            ref={headerBgFileInputRef}
                            onChange={handleHeaderBgChange}
                            accept="image/*"
                            className="hidden"
                          />
                          <UploadCloud className="w-10 h-10 text-yellow-400 group-hover:scale-110 transition-transform" />
                          <span className="mt-2 text-xs font-black text-white group-hover:text-yellow-300 transition-colors uppercase tracking-wider">
                            {headerBgFile || headerBgPreview ? 'Cambiar Imagen de Fondo' : 'Subir Imagen para Header'}
                          </span>
                          <span className="text-[10px] text-slate-350 mt-1">Recomendado: 1920x1080px (JPG/PNG). Máx. 10MB</span>
                        </button>
                      </div>

                      <div className="sm:col-span-6 space-y-3">
                        {headerBgPreview ? (
                          <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-white/20 shadow-xl group">
                            {/* Background Image Preview */}
                            <img src={headerBgPreview} alt="Fondo del Encabezado" className="w-full h-full object-cover" />
                            {/* Simulated Overlay Preview */}
                            <div 
                              className="absolute inset-0 bg-gradient-to-br from-blue-955 via-blue-900 to-indigo-955 flex flex-col items-center justify-center p-3 text-center transition-opacity"
                              style={{ opacity: (config.headerBgOverlayOpacity !== undefined ? config.headerBgOverlayOpacity : 75) / 100 }}
                            >
                              <span className="text-xs font-black text-yellow-300 uppercase tracking-widest">Vista Previa Overlay</span>
                              <span className="text-[10px] text-white font-serif italic mt-1">"Rugiendo con fuerza..."</span>
                            </div>
                            {headerBgFile && (
                              <div className="absolute top-2 right-2 bg-yellow-500 text-blue-955 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow z-10">
                                Por guardar
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-36 rounded-2xl bg-blue-955/70 flex flex-col items-center justify-center text-slate-350 border border-white/10 text-center p-4">
                            <ImageIcon size={28} className="text-yellow-400/60" />
                            <span className="text-[11px] font-bold mt-1 text-slate-200">Sin imagen personalizada</span>
                            <span className="text-[9px] text-slate-400">Se usará el degradado Azul Regio por defecto</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Transparencia / Opacidad Slider */}
                    <div className="pt-2 border-t border-white/10 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <label htmlFor="headerBgOverlayOpacity" className="text-slate-200">
                          Intensidad del Filtro Azul / Cobertura: <span className="text-yellow-400 font-extrabold">{config.headerBgOverlayOpacity !== undefined ? config.headerBgOverlayOpacity : 75}% Opaco</span>
                        </label>
                        <span className="text-[10px] text-slate-400">
                          (Valores bajos = foto más visible | Valores altos = texto más legible)
                        </span>
                      </div>
                      <input 
                        type="range"
                        id="headerBgOverlayOpacity"
                        name="headerBgOverlayOpacity"
                        min="10"
                        max="95"
                        step="5"
                        value={config.headerBgOverlayOpacity !== undefined ? config.headerBgOverlayOpacity : 75}
                        onChange={handleConfigChange}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                      />
                    </div>
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

                  {/* Plantilla de Correo de Confirmación */}
                  <div className="md:col-span-2 space-y-2 pt-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-blue-900 block" htmlFor="mensajeBienvenidaEmail">
                      Texto del Correo Electrónico de Confirmación
                    </label>
                    <textarea
                      id="mensajeBienvenidaEmail"
                      name="mensajeBienvenidaEmail"
                      rows={3}
                      value={config.mensajeBienvenidaEmail || '¡Bienvenido, Compañero León! Tu pre-inscripción a la Convención ha sido confirmada con éxito. A partir de este momento recibirás información oportuna de primera mano sobre los avances, actividades y beneficios tempranos por tu confirmación.'}
                      onChange={handleConfigChange}
                      placeholder="Escribe el cuerpo del correo que se enviará automáticamente..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-2xl p-4 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-semibold"
                    />
                    <p className="text-[10px] text-slate-400">
                      Este texto será enviado automáticamente desde clubdeleonesquetzaltenango@gmail.com al correo del socio al pre-inscribirse.
                    </p>
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

            {/* Alianzas & Patrocinadores Sub-Tab */}
            {activeConfigTab === 'alianzas' && (
              <div className="space-y-6 pt-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 border border-slate-200 p-5 rounded-3xl">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center space-x-2">
                      <Handshake size={18} className="text-yellow-600" />
                      <span>Alianzas, Logos & Patrocinadores Oficiales</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configura las diapositivas cuadradas que se desplazan en el carrusel de la página de inicio de la Convención.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAlianzaModal()}
                    className="flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-blue-955 font-black px-5 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 shrink-0"
                  >
                    <Plus size={16} />
                    <span>Añadir Logo / Alianza</span>
                  </button>
                </div>

                {/* Grid of Alianzas Square Slides */}
                {((config.alianzas && config.alianzas.length > 0) ? config.alianzas : DEFAULT_ALIANZAS).length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                    {((config.alianzas && config.alianzas.length > 0) ? config.alianzas : DEFAULT_ALIANZAS).map((aliado) => (
                      <div 
                        key={aliado.id} 
                        className="bg-white border-2 border-slate-150 rounded-3xl p-4 flex flex-col items-center text-center justify-between hover:border-yellow-500/50 hover:shadow-xl transition-all group relative"
                      >
                        {/* Action buttons */}
                        <div className="absolute top-2 right-2 flex space-x-1 z-10">
                          {aliado.logoUrl && (
                            <button
                              type="button"
                              onClick={() => handleCleanCardBackground(aliado)}
                              className="p-1.5 bg-amber-100 hover:bg-amber-500 hover:text-white text-amber-900 rounded-lg transition-colors shadow-sm"
                              title="Remover fondo negro/oscuro automáticamente"
                            >
                              <Wand2 size={12} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openAlianzaModal(aliado)}
                            className="p-1.5 bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-650 rounded-lg transition-colors shadow-sm"
                            title="Editar Logo"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAlianza(aliado.id)}
                            className="p-1.5 bg-slate-100 hover:bg-red-600 hover:text-white text-slate-650 rounded-lg transition-colors shadow-sm"
                            title="Eliminar Logo"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        {/* Square Box Display — Fondo Blanco */}
                        <div className="w-28 h-28 aspect-square rounded-2xl bg-white border-2 border-slate-200 flex items-center justify-center p-3 relative overflow-hidden my-2 shadow-sm">
                          {aliado.badge && (
                            <span className="absolute top-1.5 left-1.5 text-[8px] font-black uppercase text-blue-955 bg-yellow-400 border border-yellow-500/50 px-2 py-0.5 rounded-full shadow-sm">
                              {aliado.badge}
                            </span>
                          )}
                          {aliado.logoUrl ? (
                            <img 
                              src={aliado.logoUrl} 
                              alt={aliado.name}
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <span className="text-3xl">{aliado.icon || '🦁'}</span>
                          )}
                        </div>

                        {/* Text below slide */}
                        <div className="mt-2 space-y-0.5 w-full">
                          <h4 className="font-extrabold text-slate-900 text-xs truncate" title={aliado.name}>
                            {aliado.name}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-semibold truncate" title={aliado.category}>
                            {aliado.category}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 bg-slate-50 rounded-3xl">
                    <Handshake className="w-12 h-12 text-slate-400 mx-auto" />
                    <p className="mt-3 text-slate-800 font-extrabold text-sm">Sin alianzas registradas</p>
                    <p className="text-xs text-slate-500 mt-1">Haz clic en "Añadir Logo / Alianza" para crear tu primera diapositiva.</p>
                  </div>
                )}
              </div>
            )}

            {/* Difusión Masiva Sub-Tab */}
            {activeConfigTab === 'difusion' && (
              <div className="space-y-8 max-w-4xl pt-2">
                <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-3xl shadow-lg space-y-2">
                  <h3 className="text-xl font-black flex items-center space-x-2">
                    <Mail size={22} className="text-yellow-400" />
                    <span>Módulo de Comunicación Masiva a Pre-Inscritos</span>
                  </h3>
                  <p className="text-xs text-blue-100 leading-relaxed">
                    Envía boletines informativos, actualizaciones del programa y anuncios por correo electrónico y Telegram a la lista oficial de <strong>{registros.length} participantes pre-inscritos</strong>.
                  </p>
                </div>

                {/* Seccion 1: Difusión por Correo */}
                <form onSubmit={handleSendMassEmail} className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h4 className="text-sm font-black text-blue-900 uppercase tracking-wider flex items-center space-x-2">
                      <Mail size={16} className="text-blue-900" />
                      <span>1. Enviar Boletín por Correo Electrónico ({registros.length} Destinatarios)</span>
                    </h4>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-3 py-1 rounded-full">
                      Desde clubdeleonesquetzaltenango@gmail.com
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Asunto del Correo</label>
                      <input 
                        type="text" 
                        required
                        value={broadcastSubject}
                        onChange={e => setBroadcastSubject(e.target.value)}
                        placeholder="Ej. Boletín #1: Novedades de Hospedaje y Programa Oficial"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-900/10 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Mensaje / Contenido del Comunicado</label>
                      <textarea
                        required
                        rows={5}
                        value={broadcastBody}
                        onChange={e => setBroadcastBody(e.target.value)}
                        placeholder="Escribe aquí el contenido del boletín para los inscritos..."
                        className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-900/10 text-slate-800"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isBroadcasting || registros.length === 0}
                        className="bg-blue-900 hover:bg-blue-850 text-white font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                      >
                        {isBroadcasting ? (
                          <>
                            <Loader2 className="animate-spin" size={16} />
                            <span>Enviando correos...</span>
                          </>
                        ) : (
                          <>
                            <Send size={16} />
                            <span>Enviar Correo Masivo a {registros.length} Inscritos</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Seccion 2: Difusión por Telegram */}
                <form onSubmit={handleSendTelegramBroadcast} className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h4 className="text-sm font-black text-blue-900 uppercase tracking-wider flex items-center space-x-2">
                      <Send size={16} className="text-blue-900" />
                      <span>2. Publicar Anuncio en Canal / Grupo de Telegram</span>
                    </h4>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Mensaje para Telegram</label>
                      <textarea
                        required
                        rows={4}
                        value={broadcastTelegramMsg}
                        onChange={e => setBroadcastTelegramMsg(e.target.value)}
                        placeholder="Escribe el mensaje o aviso que se publicará en el grupo de Telegram..."
                        className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-900/10 text-slate-800"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isBroadcasting}
                        className="bg-indigo-900 hover:bg-indigo-800 text-white font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                      >
                        {isBroadcasting ? (
                          <>
                            <Loader2 className="animate-spin" size={16} />
                            <span>Publicando en Telegram...</span>
                          </>
                        ) : (
                          <>
                            <Send size={16} />
                            <span>Publicar Anuncio por Telegram</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

          </>
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
                <span>{editingActividad ? 'Editar Actividad' : 'Nueva Actividad Cultural'}</span>
              </h3>
              <button 
                type="button"
                onClick={() => setIsActividadModalOpen(false)}
                className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full transition-colors"
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
                    return (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => setActividadForm(prev => ({ ...prev, iconName: opt.name }))}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center space-y-1 transition-all ${actividadForm.iconName === opt.name ? 'border-blue-900 bg-blue-900/10 text-blue-900 font-extrabold' : 'border-slate-200 hover:border-slate-300 text-slate-500'}`}
                      >
                        <OptIcon size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500" htmlFor="act_desc">Descripción Informativa</label>
                <textarea
                  id="act_desc"
                  required
                  rows={3}
                  value={actividadForm.description}
                  onChange={(e) => setActividadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detalles sobre el evento, vestimenta o sorpresas..."
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
                <span>{editingExperiencia ? 'Editar Experiencia' : 'Nueva Experiencia Única'}</span>
              </h3>
              <button 
                type="button"
                onClick={() => setIsExperienciaModalOpen(false)}
                className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveExperiencia} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500" htmlFor="exp_badge">Etiqueta / Distintivo (Badge)</label>
                <input
                  type="text"
                  id="exp_badge"
                  required
                  value={experienciaForm.badge}
                  onChange={(e) => setExperienciaForm(prev => ({ ...prev, badge: e.target.value }))}
                  placeholder="Ej. Liderazgo, Mística, Cultura"
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

      {/* Alianza Modal */}
      {isAlianzaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-blue-900 uppercase tracking-tight flex items-center space-x-2">
                  <Handshake size={18} className="text-yellow-600" />
                  <span>{editingAlianza ? 'Editar Diapositiva de Logo / Alianza' : 'Añadir Nueva Diapositiva de Logo'}</span>
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Sube el logo de la institución o patrocinador oficial</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsAlianzaModalOpen(false)}
                className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveAlianza} className="p-6 space-y-5">
              {/* Nombre */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600" htmlFor="ali_name">Nombre de la Institución / Alianza</label>
                <input
                  type="text"
                  id="ali_name"
                  required
                  value={alianzaForm.name}
                  onChange={(e) => setAlianzaForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej. Lions Clubs International"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-semibold"
                />
              </div>

              {/* Categoría & Badge */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600" htmlFor="ali_cat">Categoría / Rol</label>
                  <input
                    type="text"
                    id="ali_cat"
                    required
                    value={alianzaForm.category}
                    onChange={(e) => setAlianzaForm(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Ej. Organización Mundial"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600" htmlFor="ali_badge">Etiqueta / Distintivo</label>
                  <input
                    type="text"
                    id="ali_badge"
                    required
                    value={alianzaForm.badge}
                    onChange={(e) => setAlianzaForm(prev => ({ ...prev, badge: e.target.value }))}
                    placeholder="Ej. Oficial, Anfitrión, Oro"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Upload Logo Image */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block">Subir Imagen del Logo (Diapositiva Cuadrada)</label>
                
                <div className="flex flex-col space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 aspect-square rounded-xl bg-white flex items-center justify-center p-2 overflow-hidden shrink-0 border-2 border-slate-200 shadow-sm relative">
                      {alianzaLogoPreview ? (
                        <img src={alianzaLogoPreview} alt="Preview" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <span className="text-2xl">{alianzaForm.icon || '🦁'}</span>
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <label 
                          htmlFor="alianza-logo-file" 
                          className="inline-flex items-center space-x-2 bg-blue-900 hover:bg-blue-955 text-white font-extrabold px-3.5 py-1.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-sm transition-all"
                        >
                          <UploadCloud size={14} />
                          <span>{alianzaLogoFile ? 'Cambiar Imagen' : 'Subir Archivo de Logo'}</span>
                          <input 
                            type="file" 
                            id="alianza-logo-file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleAlianzaLogoChange} 
                          />
                        </label>

                        {alianzaLogoPreview && (
                          <button
                            type="button"
                            onClick={handleCleanBlackBackground}
                            disabled={isCleaningBg}
                            className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-blue-955 font-black px-3 py-1.5 rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                          >
                            <Wand2 size={13} className={isCleaningBg ? 'animate-spin' : ''} />
                            <span>{isCleaningBg ? 'Limpiando...' : 'Remover Fondo Negro'}</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">PNG transparente o usa el botón de varita mágica para borrar rectángulos negros.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* URL o Emoji Alternativo */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600" htmlFor="ali_url">O pega URL de la Imagen</label>
                  <input
                    type="url"
                    id="ali_url"
                    value={alianzaForm.logoUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAlianzaForm(prev => ({ ...prev, logoUrl: val }));
                      if (!alianzaLogoFile) setAlianzaLogoPreview(val);
                    }}
                    placeholder="https://..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-2xl px-4 py-2.5 text-slate-800 text-xs focus:outline-none font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600" htmlFor="ali_icon">Emoji Icono</label>
                  <input
                    type="text"
                    id="ali_icon"
                    value={alianzaForm.icon}
                    onChange={(e) => setAlianzaForm(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="🦁"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-2xl px-4 py-2.5 text-slate-800 text-xs text-center focus:outline-none font-extrabold"
                  />
                </div>
              </div>

              {/* Submit / Cancel buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAlianzaModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-955 hover:to-indigo-955 text-white font-extrabold px-6 py-2.5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center space-x-2 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save size={14} />
                      <span>Guardar Diapositiva</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
