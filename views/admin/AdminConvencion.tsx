import React, { useState, useEffect, useRef } from 'react';
import { useConfirm } from '../../components/ConfirmProvider';
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
  Wand2,
  CreditCard,
  Phone,
  MessageCircle,
  QrCode,
  Share2,
  Copy,
  ExternalLink,
  Check,
  History,
  CheckSquare,
  Square,
  Filter,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Info
} from 'lucide-react';
import QRCode from 'qrcode';
import { firebaseService } from '../../services/firebaseService';
import { telegramService } from '../../services/telegramService';
import { gmailService, TipoCorreoConvencion, DEFAULT_GMAIL_SENDER, DEFAULT_GOOGLE_SCRIPT_URL } from '../../services/gmailService';
import { compressImageFile, validateImageFile, removeDarkBackgroundFromDataUrl } from '../../utils/imageCompressor';
import { ConvencionConfig, ConvencionRegistro, ConvencionActividad, ConvencionExperiencia, ConvencionAlianza, MensajeEnviadoLog } from '../../types';
import { ALIANZAS_CONVENCION } from '../Convencion';

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

const DEFAULT_ALIANZAS: ConvencionAlianza[] = ALIANZAS_CONVENCION;

export function AdminConvencion() {
  const { confirm } = useConfirm();
  const [activeSubTab, setActiveSubTab] = useState<'difusion' | 'registros' | 'config'>('difusion');
  const [activeConfigTab, setActiveConfigTab] = useState<'general' | 'actividades' | 'experiencias' | 'alianzas'>('general');
  
  // Mass Broadcast State
  const [broadcastChannelTab, setBroadcastChannelTab] = useState<'email' | 'telegram'>('email');
  const [broadcastTemplateTipo, setBroadcastTemplateTipo] = useState<TipoCorreoConvencion>('recordatorio_pago');
  const [broadcastSubject, setBroadcastSubject] = useState('⏳ Recordatorio: Completa tu Pago para la LXXV Convención Nacional');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastTelegramMsg, setBroadcastTelegramMsg] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [channelFilter, setChannelFilter] = useState<'todos' | 'telegram_activo' | 'telegram_pendiente' | 'email' | 'pagados' | 'pendientes'>('todos');
  const [broadcastRecipientFilter, setBroadcastRecipientFilter] = useState<'todos' | 'pagados' | 'pendientes' | 'sin_notificar' | 'notificados' | 'telegram_activo' | 'email'>('pendientes');
  const [broadcastSelectedIds, setBroadcastSelectedIds] = useState<string[]>([]);
  const [broadcastRecipientSearch, setBroadcastRecipientSearch] = useState<string>('');
  const [customTelegramDestination, setCustomTelegramDestination] = useState<string>('');
  const [showBroadcastTemplatePreview, setShowBroadcastTemplatePreview] = useState<boolean>(false);
  const [historialModalRegistro, setHistorialModalRegistro] = useState<ConvencionRegistro | null>(null);
  
  // Opciones avanzadas de Difusión Masiva (Progreso en tiempo real, deduplicación y vista previa de destinatario)
  const [broadcastProgress, setBroadcastProgress] = useState<{
    current: number;
    total: number;
    email: string;
    nombre: string;
    porcentaje: number;
  } | null>(null);
  const [deduplicateEmails, setDeduplicateEmails] = useState<boolean>(true);
  const [previewSampleRegistro, setPreviewSampleRegistro] = useState<ConvencionRegistro | null>(null);

  const [config, setConfig] = useState<ConvencionConfig>({
    titulo: '',
    lema: '',
    fechaEvento: '',
    fechaEventoTexto: '',
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

  // Modal de Entrada QR Oficial
  const [qrModalRegistro, setQrModalRegistro] = useState<ConvencionRegistro | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isCopiedQr, setIsCopiedQr] = useState(false);

  // Modal de Envío por Gmail
  const [emailModalRegistro, setEmailModalRegistro] = useState<ConvencionRegistro | null>(null);
  const [emailTipo, setEmailTipo] = useState<TipoCorreoConvencion>('pago_confirmado');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [isTestingGmail, setIsTestingGmail] = useState<boolean>(false);
  const [showScriptGuideModal, setShowScriptGuideModal] = useState<boolean>(false);
  const [isCopiedScriptCode, setIsCopiedScriptCode] = useState<boolean>(false);

  const handleOpenEmailModal = (reg: ConvencionRegistro, tipo: TipoCorreoConvencion = 'pago_confirmado') => {
    setEmailModalRegistro(reg);
    setEmailTipo(tipo);
    const tmpl = gmailService.generateTemplate(tipo, reg);
    setEmailSubject(tmpl.asunto);
    setEmailBody(tmpl.cuerpoTexto);
  };

  const handleEmailTipoChange = (nuevoTipo: TipoCorreoConvencion) => {
    setEmailTipo(nuevoTipo);
    if (emailModalRegistro) {
      const tmpl = gmailService.generateTemplate(nuevoTipo, emailModalRegistro);
      setEmailSubject(tmpl.asunto);
      setEmailBody(tmpl.cuerpoTexto);
    }
  };

  const handleSendSingleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailModalRegistro) return;
    setIsSendingEmail(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const ok = await gmailService.sendRegistrationEmail(
        emailModalRegistro,
        emailTipo,
        { customSubject: emailSubject, customBody: emailBody },
        config.googleScriptUrl
      );
      if (ok) {
        // Registrar log en Firestore para el participante
        await firebaseService.registrarMensajeEnviado(emailModalRegistro.id, {
          canal: 'gmail',
          tipo: emailTipo,
          asunto: emailSubject,
          mensajeResumen: emailBody.substring(0, 150)
        });

        setSuccessMsg(`¡Correo enviado con éxito a ${emailModalRegistro.email}!`);
        setEmailModalRegistro(null);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(`No se pudo enviar el correo a ${emailModalRegistro.email}.`);
      }
    } catch (err) {
      setErrorMsg("Ocurrió un error al enviar el correo.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleTestGmailConnection = async () => {
    setIsTestingGmail(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const health = await gmailService.checkScriptHealth(config.googleScriptUrl);
      if (!health.ok) {
        setErrorMsg(health.message);
        setShowScriptGuideModal(true);
        setIsTestingGmail(false);
        return;
      }
      const res = await gmailService.sendTestEmail('clubdeleonesquetzaltenango@gmail.com', config.googleScriptUrl);
      if (res.ok) {
        setSuccessMsg('¡Correo de prueba enviado con éxito a clubdeleonesquetzaltenango@gmail.com!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(res.message || 'No se pudo enviar el correo de prueba.');
      }
    } catch (e: any) {
      setErrorMsg('Error al conectar con el Webhook de Google Apps Script: ' + (e.message || ''));
    } finally {
      setIsTestingGmail(false);
    }
  };

  const getCleanPhone = (phone?: string) => {
    const digits = (phone || '').replace(/\D/g, '');
    if (digits.length === 8) return `502${digits}`;
    if (digits.startsWith('502') && digits.length === 11) return digits;
    return digits;
  };

  const getWhatsAppMessage = (reg: ConvencionRegistro) => {
    const isPagado = reg.estadoPago === 'Pagado';
    if (isPagado) {
      return `¡Hola Compañero(a) León ${reg.nombre}! 🦁 Le saluda el Comité Organizador de la LXXIV Convención Nacional Club de Leones Quetzaltenango 2026-2027.

Le confirmamos que su inscripción oficial está VALIDADA Y CONFIRMADA (Pagado) ✅.

📌 Folio Oficial: ${reg.id}
🏛️ Club: ${reg.club}
🏷️ Paquete: ${reg.paquete || 'General'}
💰 Monto: Q.${(reg.montoPagar || 0).toLocaleString()}.00

Su entrada y código QR de acceso oficial han sido generados exitosamente. ¡Nos vemos en Xela para rugir juntos con fuerza y hermandad!`;
    } else {
      return `¡Hola Compañero(a) León ${reg.nombre}! 🦁 Le saluda el Comité Organizador de la LXXIV Convención Nacional Club de Leones Quetzaltenango 2026-2027.

Hemos recibido su pre-registro oficial con los siguientes datos:
📌 Folio Oficial: ${reg.id}
🏛️ Club: ${reg.club}
🏷️ Paquete: ${reg.paquete || 'General'}
💰 Total a Pagar: Q.${(reg.montoPagar || 0).toLocaleString()}.00
⏳ Estado actual: ${reg.estadoPago || 'Pendiente de Pago'}

Quedamos a su entera disposición para apoyarle con su depósito o transferencia bancaria (Banrural) o pasarela de tarjeta para emitir su entrada QR oficial. ¿En qué podemos servirle?`;
    }
  };

  const handleOpenQrModal = async (reg: ConvencionRegistro) => {
    setQrModalRegistro(reg);
    setIsCopiedQr(false);
    try {
      const qrPayload = JSON.stringify({
        evento: "LXXIV Convención Nacional Club de Leones",
        sede: "Quetzaltenango 2026-2027",
        folio: reg.id,
        participante: reg.nombre,
        club: reg.club,
        paquete: reg.paquete || 'General',
        monto: reg.montoPagar || 0,
        estado: reg.estadoPago || 'Pendiente',
        fecha: reg.fechaRegistro
      });
      const dataUrl = await QRCode.toDataURL(qrPayload, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0c1a38',
          light: '#ffffff'
        }
      });
      setQrCodeDataUrl(dataUrl);
    } catch (err) {
      console.error("Error al generar código QR:", err);
    }
  };

  const handleCopyTicketDetails = () => {
    if (!qrModalRegistro) return;
    const text = `🎟️ ENTRADA OFICIAL • LXXIV CONVENCIÓN NACIONAL CLUB DE LEONES
Folio: ${qrModalRegistro.id}
Participante: ${qrModalRegistro.nombre}
Club: ${qrModalRegistro.club} (${qrModalRegistro.cargo} • ${qrModalRegistro.distrito})
Paquete: ${qrModalRegistro.paquete || 'General'}
Total: Q.${(qrModalRegistro.montoPagar || 0).toLocaleString()}.00
Estado: ${qrModalRegistro.estadoPago || 'Pendiente'}
Fecha de Registro: ${new Date(qrModalRegistro.fechaRegistro).toLocaleDateString('es-GT')}`;
    navigator.clipboard.writeText(text);
    setIsCopiedQr(true);
    setTimeout(() => setIsCopiedQr(false), 2500);
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const dbConfig = await firebaseService.getConvencionConfig();
        if (!isMounted) return;
        const isLegacyAlianzas = !dbConfig.alianzas || 
          dbConfig.alianzas.length < 10 || 
          dbConfig.alianzas.some(a => a.name === 'Lluvia de Ideas Editorial' || a.id === 'alianza-1');
        const finalAlianzas = isLegacyAlianzas ? DEFAULT_ALIANZAS : dbConfig.alianzas;

        setConfig({
          ...dbConfig,
          alianzas: finalAlianzas,
          inscripcionesAbiertas: dbConfig.inscripcionesAbiertas !== undefined ? dbConfig.inscripcionesAbiertas : true,
          fotoSedeEtiqueta: dbConfig.fotoSedeEtiqueta || 'Sede Oficial',
          fotoSedeDescripcion: dbConfig.fotoSedeDescripcion || 'Teatro Municipal de Quetzaltenango',
          headerBgOverlayOpacity: dbConfig.headerBgOverlayOpacity !== undefined ? dbConfig.headerBgOverlayOpacity : 75,
          actividadesCulturales: dbConfig.actividadesCulturales || [],
          experienciasUnicas: dbConfig.experienciasUnicas || []
        });
        setImagePreview(dbConfig.fotoSede);
        setHeaderBgPreview(dbConfig.headerBgUrl || '');
      } catch (error) {
        if (!isMounted) return;
        console.error("Error al cargar datos de convención:", error);
        setErrorMsg("Hubo un error al conectar con la base de datos.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();

    // Suscripción en tiempo real (onSnapshot): cualquier nuevo registro o cambio
    // se refleja inmediatamente en el navegador sin recargar la página
    const unsubscribeRegistros = firebaseService.subscribeConvencionRegistros((liveRegistros) => {
      if (!isMounted) return;
      setRegistros(liveRegistros);
    });

    return () => { 
      isMounted = false;
      unsubscribeRegistros();
    };
  }, []);

  // Prevenir cierre accidental de pestaña durante una difusión en curso
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isBroadcasting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isBroadcasting]);

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
        const compressedBase64 = await compressImageFile(imageFile, 800, 800, 0.7);
        finalUrl = await firebaseService.uploadConvencionImage(compressedBase64);
      }

      // Upload new header background image if selected
      if (headerBgFile) {
        const compressedHeaderBase64 = await compressImageFile(headerBgFile, 1000, 600, 0.7);
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
    const ok = await confirm({ title: "Eliminar actividad", message: "¿Estás seguro de eliminar esta actividad cultural?", confirmLabel: "Eliminar", danger: true });
    if (!ok) return;
    
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
    const ok = await confirm({ title: "Eliminar experiencia", message: "¿Estás seguro de eliminar esta experiencia?", confirmLabel: "Eliminar", danger: true });
    if (!ok) return;
    
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
    if (!alianzaForm.name.trim()) {
      setErrorMsg('Por favor, ingresa el nombre de la institución o alianza.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    try {
      let finalLogoUrl = (alianzaForm.logoUrl || '').trim();
      if (finalLogoUrl && finalLogoUrl.startsWith('www.')) {
        finalLogoUrl = `https://${finalLogoUrl}`;
      }

      if (alianzaLogoFile) {
        let compressedBase64 = await compressImageFile(alianzaLogoFile, 500, 500, 0.7, removeBlackBg);
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
    const ok = await confirm({ title: "Eliminar alianza", message: "¿Estás seguro de eliminar este logo de las alianzas?", confirmLabel: "Eliminar", danger: true });
    if (!ok) return;

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

  // Toggle estado de Telegram directamente desde la lista de pre-registros
  const handleToggleTelegramStatus = async (id: string, currentStatus: boolean | undefined) => {
    const newStatus = !currentStatus;
    try {
      const reg = registros.find(r => r.id === id);
      if (!reg) return;
      const updatedReg = { ...reg, telegramVerificado: newStatus };
      await firebaseService.saveConvencionRegistro(updatedReg);
      setRegistros(prev => prev.map(r => r.id === id ? updatedReg : r));
      setSuccessMsg(newStatus 
        ? `✅ ${reg.nombre} marcado como ACTIVO en Telegram (recibirá difusión).` 
        : `ℹ️ ${reg.nombre} marcado como PENDIENTE en Telegram.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      console.error("Error al actualizar estado de Telegram:", error);
      setErrorMsg("No se pudo actualizar el estado de Telegram del participante.");
    }
  };

  // Filtered registrations
  const filteredRegistros = registros.filter(r => {
    // Filtro por canal o estado
    if (channelFilter === 'telegram_activo' && !r.telegramVerificado) return false;
    if (channelFilter === 'telegram_pendiente' && !(r.preferenciaNotificacion === 'telegram' && !r.telegramVerificado)) return false;
    if (channelFilter === 'email' && r.preferenciaNotificacion !== 'email') return false;
    if (channelFilter === 'pagados' && r.estadoPago !== 'Pagado') return false;
    if (channelFilter === 'pendientes' && r.estadoPago === 'Pagado') return false;

    const term = searchTerm.toLowerCase();
    return (
      (r.nombre || '').toLowerCase().includes(term) ||
      (r.email || '').toLowerCase().includes(term) ||
      (r.telefono || '').toLowerCase().includes(term) ||
      (r.dpi && r.dpi.toLowerCase().includes(term)) ||
      (r.club || '').toLowerCase().includes(term) ||
      (r.cargo || '').toLowerCase().includes(term) ||
      (r.distrito || '').toLowerCase().includes(term) ||
      (r.paquete && r.paquete.toLowerCase().includes(term)) ||
      (r.estadoPago && r.estadoPago.toLowerCase().includes(term))
    );
  });

  // Participantes filtrados para el módulo de Difusión Masiva y control de envíos
  const broadcastFilteredRegistros = registros.filter(r => {
    if (broadcastRecipientFilter === 'pagados' && r.estadoPago !== 'Pagado') return false;
    if (broadcastRecipientFilter === 'pendientes' && r.estadoPago === 'Pagado') return false;
    if (broadcastRecipientFilter === 'sin_notificar' && r.ultimoMensajeEnviado) return false;
    if (broadcastRecipientFilter === 'notificados' && !r.ultimoMensajeEnviado) return false;
    if (broadcastRecipientFilter === 'telegram_activo' && !r.telegramVerificado) return false;
    if (broadcastRecipientFilter === 'email' && r.preferenciaNotificacion !== 'email') return false;

    if (broadcastRecipientSearch.trim()) {
      const q = broadcastRecipientSearch.toLowerCase();
      const matchName = (r.nombre || '').toLowerCase().includes(q);
      const matchClub = (r.club || '').toLowerCase().includes(q);
      const matchId = (r.id || '').toLowerCase().includes(q);
      const matchEmail = (r.email || '').toLowerCase().includes(q);
      const matchTel = (r.telefono || '').includes(q);
      if (!matchName && !matchClub && !matchId && !matchEmail && !matchTel) return false;
    }

    return true;
  });

  // Export CSV
  const handleExportCSV = () => {
    if (registros.length === 0) return;
    
    const headers = ["Nombre Completo", "DPI", "Email", "Telefono", "Canal Preferido", "Telegram Activo (Bot)", "Club", "Cargo", "Zona", "Paquete", "Monto a Pagar (Q)", "Estado de Pago", "Fecha Registro"];
    const csvRows = [
      headers.join(','),
      ...filteredRegistros.map(r => [
        `"${(r.nombre || '').replace(/"/g, '""')}"`,
        `"${(r.dpi || '').replace(/"/g, '""')}"`,
        `"${(r.email || '').replace(/"/g, '""')}"`,
        `"${(r.telefono || '').replace(/"/g, '""')}"`,
        `"${r.preferenciaNotificacion === 'telegram' ? 'Telegram' : 'Correo'}"`,
        `"${r.telegramVerificado ? 'SÍ (Activo en Bot)' : 'NO'}"`,
        `"${(r.club || '').replace(/"/g, '""')}"`,
        `"${(r.cargo || '').replace(/"/g, '""')}"`,
        `"${(r.distrito || '').replace(/"/g, '""')}"`,
        `"${(r.paquete || '').replace(/"/g, '""')}"`,
        `"${r.montoPagar || 0}"`,
        `"${r.estadoPago || 'Pendiente'}"`,
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

  const handleUpdateEstadoPago = async (id: string, nuevoEstado: 'Pendiente' | 'Pagado' | 'Checkout_Creado') => {
    try {
      await firebaseService.updateConvencionRegistroStatus(id, nuevoEstado);
      const targetReg = registros.find(r => r.id === id);
      setRegistros(prev => prev.map(r => r.id === id ? { ...r, estadoPago: nuevoEstado } : r));

      if (nuevoEstado === 'Pagado' && targetReg && targetReg.email) {
        // Enviar automáticamente correo de confirmación de pago con entrada QR oficial
        const updatedReg = { ...targetReg, estadoPago: nuevoEstado };
        gmailService.sendRegistrationEmail(updatedReg, 'pago_confirmado', undefined, config.googleScriptUrl).catch(e => {
          console.warn("No se pudo enviar correo automático de pago:", e);
        });
        setSuccessMsg(`Estado actualizado a "Pagado" y confirmación con Entrada QR enviada a ${targetReg.email}.`);
      } else {
        setSuccessMsg(`Estado de pago actualizado a "${nuevoEstado}".`);
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      console.error("Error al actualizar estado de pago:", error);
      setErrorMsg("No se pudo actualizar el estado de pago.");
    }
  };

  const handleDeleteRegistro = async (id: string, nombre: string) => {
    const ok = await confirm({
      title: "Eliminar Pre-registro",
      message: `¿Estás seguro de eliminar el registro de ${nombre}? Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar",
      danger: true
    });
    if (!ok) return;

    try {
      await firebaseService.deleteConvencionRegistro(id);
      setRegistros(prev => prev.filter(r => r.id !== id));
      setSuccessMsg(`Registro de ${nombre} eliminado.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error("Error al eliminar registro:", error);
      setErrorMsg("No se pudo eliminar el registro en Firestore.");
    }
  };

  const handleSelectBroadcastTemplate = (tipo: TipoCorreoConvencion) => {
    setBroadcastTemplateTipo(tipo);
    const sampleReg: ConvencionRegistro = {
      id: 'FOLIO-OFICIAL',
      nombre: 'Estimado(a) Compañero(a) León',
      email: 'socio@clubdeleones.org',
      telefono: '55555555',
      club: 'Club de Leones',
      cargo: 'Socio Activo',
      distrito: 'Distrito D-3',
      montoPagar: 650,
      estadoPago: tipo === 'pago_confirmado' ? 'Pagado' : 'Pendiente',
      fechaRegistro: new Date().toISOString()
    };
    const tmpl = gmailService.generateTemplate(tipo, sampleReg);
    setBroadcastSubject(tmpl.asunto.replace(' (Folio: FOLIO-OFICIAL)', ''));
    setBroadcastBody(tmpl.cuerpoTexto);

    // Ajustar filtro sugerido según la plantilla
    if (tipo === 'pago_confirmado') {
      setBroadcastRecipientFilter('pagados');
    } else if (tipo === 'recordatorio_pago') {
      setBroadcastRecipientFilter('pendientes');
    } else if (tipo === 'pre_registro') {
      setBroadcastRecipientFilter('sin_notificar');
    } else {
      setBroadcastRecipientFilter('todos');
    }
  };

  // Alterna selección de todos los participantes visibles en el filtro actual
  const handleToggleSelectAllRecipients = (validList: ConvencionRegistro[]) => {
    const validIds = validList.filter(r => r.email && r.email.includes('@')).map(r => r.id);
    const allSelected = validIds.length > 0 && validIds.every(id => broadcastSelectedIds.includes(id));
    if (allSelected) {
      setBroadcastSelectedIds(prev => prev.filter(id => !validIds.includes(id)));
    } else {
      setBroadcastSelectedIds(prev => Array.from(new Set([...prev, ...validIds])));
    }
  };

  // Selecciona a TODOS los participantes con email válido de la convención (padrón completo)
  const handleSelectAllGlobal = () => {
    const allValidIds = registros.filter(r => r.email && r.email.includes('@')).map(r => r.id);
    setBroadcastSelectedIds(allValidIds);
  };

  // Invierte la selección dentro de la lista filtrada
  const handleInvertFilteredSelection = (validList: ConvencionRegistro[]) => {
    const validIds = validList.filter(r => r.email && r.email.includes('@')).map(r => r.id);
    setBroadcastSelectedIds(prev => {
      const remaining = prev.filter(id => !validIds.includes(id));
      const newlySelected = validIds.filter(id => !prev.includes(id));
      return [...remaining, ...newlySelected];
    });
  };

  // Selecciona directamente por criterio específico
  const handleSelectByCriterion = (criterion: 'pendientes' | 'pagados' | 'sin_notificar' | 'telegram') => {
    let ids: string[] = [];
    if (criterion === 'pendientes') {
      ids = registros.filter(r => r.estadoPago !== 'Pagado' && r.email && r.email.includes('@')).map(r => r.id);
    } else if (criterion === 'pagados') {
      ids = registros.filter(r => r.estadoPago === 'Pagado' && r.email && r.email.includes('@')).map(r => r.id);
    } else if (criterion === 'sin_notificar') {
      ids = registros.filter(r => !r.ultimoMensajeEnviado && r.email && r.email.includes('@')).map(r => r.id);
    } else if (criterion === 'telegram') {
      ids = registros.filter(r => r.telegramVerificado && r.email && r.email.includes('@')).map(r => r.id);
    }
    setBroadcastSelectedIds(ids);
  };

  const handleToggleSelectOneRecipient = (id: string) => {
    setBroadcastSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSendMassEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject.trim() || !broadcastBody.trim()) {
      setErrorMsg("Por favor completa el asunto y el mensaje del correo.");
      return;
    }
    
    // Lista base de participantes (manual o del filtro activo)
    const baseList = broadcastSelectedIds.length > 0
      ? registros.filter(r => broadcastSelectedIds.includes(r.id) && r.email && r.email.includes('@'))
      : broadcastFilteredRegistros.filter(r => r.email && r.email.includes('@'));

    if (baseList.length === 0) {
      setErrorMsg("No hay participantes con correo electrónico válido seleccionados para recibir el comunicado.");
      return;
    }

    // Deduplicación preventiva por email
    let targetRegistros: ConvencionRegistro[] = [];
    if (deduplicateEmails) {
      const seenEmails = new Set<string>();
      targetRegistros = baseList.filter(r => {
        const norm = (r.email || '').trim().toLowerCase();
        if (seenEmails.has(norm)) return false;
        seenEmails.add(norm);
        return true;
      });
    } else {
      targetRegistros = baseList;
    }

    const isSelectionExplicit = broadcastSelectedIds.length > 0;
    const confirmTitle = isSelectionExplicit ? "Confirmar Difusión Masiva" : "⚠️ Enviar Difusión Masiva al Filtro Completo";
    const confirmMessage = isSelectionExplicit
      ? `¿Estás seguro de enviar "${broadcastSubject}" a los ${targetRegistros.length} participantes seleccionados desde ${DEFAULT_GMAIL_SENDER}?`
      : `No has marcado casillas individuales. ¿Deseas enviar "${broadcastSubject}" a TODOS los ${targetRegistros.length} participantes del filtro actual desde ${DEFAULT_GMAIL_SENDER}?`;

    const okConfirm = await confirm({
      title: confirmTitle,
      message: confirmMessage,
      confirmLabel: `Enviar a ${targetRegistros.length} socios`,
      danger: !isSelectionExplicit
    });
    if (!okConfirm) return;

    setIsBroadcasting(true);
    setErrorMsg('');
    setSuccessMsg('');
    setBroadcastProgress({
      current: 0,
      total: targetRegistros.length,
      email: '',
      nombre: '',
      porcentaje: 0
    });

    try {
      const result = await gmailService.sendMassBroadcast(
        targetRegistros,
        broadcastSubject,
        broadcastBody,
        config.googleScriptUrl,
        broadcastTemplateTipo,
        (progress) => {
          setBroadcastProgress(progress);
        }
      );

      // Registrar historial de envíos en Firestore de forma atómica
      if (result.idsEnviados.length > 0) {
        await firebaseService.registrarMensajeMasivoEnviado(
          result.idsEnviados,
          {
            canal: 'gmail',
            tipo: broadcastTemplateTipo,
            asunto: broadcastSubject,
            mensajeResumen: broadcastBody.substring(0, 150)
          }
        );
      }

      const dupText = baseList.length !== targetRegistros.length 
        ? ` (${baseList.length - targetRegistros.length} duplicados omitidos preventivamente)` 
        : '';

      setSuccessMsg(`🎉 ¡Difusión completada con éxito! Se enviaron ${result.enviados} correos (${result.fallidos} fallos, ${result.omitidos} omitidos por email inválido)${dupText}. El historial se actualizó en tiempo real.`);
      setBroadcastSelectedIds([]);
    } catch (err: any) {
      setErrorMsg("Ocurrió un error al procesar la difusión masiva.");
    } finally {
      setIsBroadcasting(false);
      setBroadcastProgress(null);
    }
  };

  const handleSendTelegramBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTelegramMsg.trim()) {
      setErrorMsg("Por favor escribe el mensaje para Telegram.");
      return;
    }
    const destinationChat = customTelegramDestination.trim() || config.telegramChatId || '';
    const okConfirm = await confirm({
      title: "Publicar en Telegram",
      message: `¿Estás seguro de publicar este anuncio en el canal/chat de Telegram (${destinationChat || 'Chat Oficial'})?`,
      confirmLabel: "Publicar en Telegram",
      danger: false
    });
    if (!okConfirm) return;

    setIsBroadcasting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const ok = await telegramService.sendMessage(
        config.telegramBotToken || undefined,
        destinationChat,
        `📢 <b>BOLETÍN OFICIAL DE LA CONVENCIÓN</b>\n\n${broadcastTelegramMsg}\n\n<i>LXXV Convención Nacional • Quetzaltenango 2027</i>`
      );
      if (ok) {
        // Registrar en los registros de Telegram verificados
        const telegramVerificados = registros.filter(r => r.telegramVerificado);
        if (telegramVerificados.length > 0) {
          await firebaseService.registrarMensajeMasivoEnviado(
            telegramVerificados.map(r => r.id),
            {
              canal: 'telegram',
              tipo: 'boletin_telegram',
              asunto: 'Boletín Oficial en Telegram',
              mensajeResumen: broadcastTelegramMsg.substring(0, 150)
            }
          );
        }
        setSuccessMsg(`¡Anuncio publicado exitosamente en Telegram (${destinationChat || 'Chat Oficial'})!`);
        setBroadcastTelegramMsg('');
      } else {
        setErrorMsg("No se pudo enviar por Telegram. Verifica que el bot tenga acceso al canal/grupo o el Chat ID.");
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

        <div className="flex bg-slate-200/60 p-1.5 rounded-2xl border border-slate-250 gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('difusion')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              activeSubTab === 'difusion'
                ? 'bg-blue-900 text-white shadow-md'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Mail size={15} className="text-amber-400" />
            <span>📢 Difusión Masiva</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeSubTab === 'difusion' ? 'bg-amber-400 text-blue-950' : 'bg-slate-300/80 text-slate-800'
            }`}>
              {registros.length}
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab('registros')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              activeSubTab === 'registros'
                ? 'bg-blue-900 text-white shadow-md'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Users size={15} />
            <span>Pre-registros ({registros.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('config')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              activeSubTab === 'config'
                ? 'bg-blue-900 text-white shadow-md'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Settings size={15} />
            <span>Contenidos Web</span>
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

                  {/* Texto Descriptivo de Fecha (Hero) */}
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500" htmlFor="fechaEventoTexto">
                      Fechas del Evento (Texto Descriptivo)
                    </label>
                    <input 
                      type="text" 
                      id="fechaEventoTexto"
                      name="fechaEventoTexto"
                      value={config.fechaEventoTexto || ''}
                      onChange={handleConfigChange}
                      placeholder="Ej. Del 19 al 22 de Marzo, 2026"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-semibold"
                    />
                    <span className="text-[11px] text-slate-400 font-medium">Visible en la tarjeta principal y hero</span>
                  </div>

                  {/* Fecha ISO Cuenta Regresiva */}
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500" htmlFor="fechaEvento">
                      Fecha Inicio (Para Reloj de Cuenta Regresiva)
                    </label>
                    <input 
                      type="date" 
                      id="fechaEvento"
                      name="fechaEvento"
                      value={config.fechaEvento}
                      onChange={handleConfigChange}
                      required
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-semibold"
                    />
                    <span className="text-[11px] text-slate-400 font-medium">Formato YYYY-MM-DD para calcular días restantes</span>
                  </div>

                  {/* Sede Principal */}
                  <div className="space-y-2 md:col-span-2">
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

                  {/* Configuración de Gmail & Webhook de Google Apps Script */}
                  <div className="md:col-span-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center space-x-2">
                          <Mail size={16} className="text-rose-600" />
                          <span>Automatización de Correos con Gmail</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Envíos automáticos desde <strong>clubdeleonesquetzaltenango@gmail.com</strong> al pre-inscribirse o confirmar pago.
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={handleTestGmailConnection}
                          disabled={isTestingGmail}
                          className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                        >
                          {isTestingGmail ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} className="text-rose-600" />}
                          <span>Probar Envío</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowScriptGuideModal(true)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          <span>Guía Apps Script</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1" htmlFor="googleScriptUrl">
                          URL del Webhook de Google Apps Script (GmailApp)
                        </label>
                        <input
                          id="googleScriptUrl"
                          name="googleScriptUrl"
                          type="url"
                          value={config.googleScriptUrl || ''}
                          onChange={handleConfigChange}
                          placeholder={DEFAULT_GOOGLE_SCRIPT_URL}
                          className="w-full bg-white border border-slate-200 focus:border-blue-900 rounded-xl px-4 py-2.5 text-slate-800 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-semibold"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Deja en blanco para usar la URL oficial por defecto desplegada en el proyecto.
                        </p>
                      </div>

                      {/* Plantilla de Correo de Pre-Inscripción */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1" htmlFor="mensajeBienvenidaEmail">
                          Texto del Correo de Pre-Inscripción (Bienvenida)
                        </label>
                        <textarea
                          id="mensajeBienvenidaEmail"
                          name="mensajeBienvenidaEmail"
                          rows={2}
                          value={config.mensajeBienvenidaEmail || '¡Bienvenido, Compañero León! Tu pre-inscripción a la Convención ha sido confirmada con éxito. A partir de este momento recibirás información oportuna de primera mano sobre los avances, actividades y beneficios tempranos por tu confirmación.'}
                          onChange={handleConfigChange}
                          placeholder="Escribe el cuerpo del correo que se enviará automáticamente..."
                          className="w-full bg-white border border-slate-200 focus:border-blue-900 rounded-xl p-3.5 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-semibold"
                        />
                      </div>
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

          </>
        )}

        {/* ================= DIFUSIÓN MASIVA TAB ================= */}
        {activeSubTab === 'difusion' && (
          <div className="space-y-8">
            {/* Header Hero del Centro de Difusión */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                      Canal Oficial de Difusión
                    </span>
                    <span className="text-xs text-blue-200 font-bold">LXXV Convención Nacional</span>
                  </div>
                  <h3 className="text-2xl font-black flex items-center space-x-2.5 mt-2">
                    <Mail size={24} className="text-yellow-400" />
                    <span>Centro de Difusión Masiva & Control de Participantes</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed mt-1 max-w-3xl">
                    Comunícate oportunamente con los <strong>{registros.length} participantes pre-inscritos</strong>. Monitorea a quién se le envió qué mensaje y su estatus de pago para un control integral de la convención.
                  </p>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('registros')}
                    className="flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    <Users size={14} />
                    <span>Ver Pre-registros</span>
                  </button>
                </div>
              </div>

              {/* KPI Cards del Centro de Difusión */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                  <span className="text-[10px] font-black uppercase text-blue-200 block">Total Inscritos</span>
                  <span className="text-xl font-black text-white">{registros.length}</span>
                  <p className="text-[10px] text-blue-200/70 mt-0.5">En base de datos</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                  <span className="text-[10px] font-black uppercase text-emerald-300 block">✅ Pagados</span>
                  <span className="text-xl font-black text-emerald-300">{registros.filter(r => r.estadoPago === 'Pagado').length}</span>
                  <p className="text-[10px] text-emerald-200/70 mt-0.5">Acreditados</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                  <span className="text-[10px] font-black uppercase text-amber-300 block">⏳ Pendientes</span>
                  <span className="text-xl font-black text-amber-300">{registros.filter(r => r.estadoPago !== 'Pagado').length}</span>
                  <p className="text-[10px] text-amber-200/70 mt-0.5">Por completar pago</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                  <span className="text-[10px] font-black uppercase text-blue-200 block">✉️ Con Correo</span>
                  <span className="text-xl font-black text-white">{registros.filter(r => r.email && r.email.includes('@')).length}</span>
                  <p className="text-[10px] text-blue-200/70 mt-0.5">Vía Webhook Gmail</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                  <span className="text-[10px] font-black uppercase text-emerald-300 block flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Bot Telegram</span>
                  </span>
                  <span className="text-xl font-black text-white">{registros.filter(r => r.telegramVerificado).length}</span>
                  <p className="text-[10px] text-emerald-200/70 mt-0.5">Activos en bot</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                  <span className="text-[10px] font-black uppercase text-purple-300 block">📨 Con Envíos</span>
                  <span className="text-xl font-black text-white">{registros.filter(r => !!r.ultimoMensajeEnviado).length}</span>
                  <p className="text-[10px] text-purple-200/70 mt-0.5">Ya notificados</p>
                </div>
              </div>
            </div>

            {/* Selector de Canal: Correo Electrónico vs Telegram */}
            <div className="flex border-b border-slate-200 pb-2 space-x-4">
              <button
                type="button"
                onClick={() => setBroadcastChannelTab('email')}
                className={`pb-2.5 px-4 font-black text-sm flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
                  broadcastChannelTab === 'email'
                    ? 'border-blue-900 text-blue-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Mail size={16} />
                <span>1. Boletín / Correo Masivo (Gmail Webhook)</span>
              </button>
              <button
                type="button"
                onClick={() => setBroadcastChannelTab('telegram')}
                className={`pb-2.5 px-4 font-black text-sm flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
                  broadcastChannelTab === 'telegram'
                    ? 'border-indigo-900 text-indigo-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Send size={16} />
                <span>2. Canal Oficial de Telegram</span>
              </button>
            </div>

            {/* Canal 1: Correo Electrónico con Plantillas Prediseñadas */}
            {broadcastChannelTab === 'email' && (
              <form onSubmit={handleSendMassEmail} className="space-y-6">
                {/* Paso 1: Selector de Plantillas Prediseñadas */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                        <Sparkles size={16} className="text-amber-500" />
                        <span>Paso 1: Mensajes Prediseñados (Plantillas Oficiales)</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Elige una plantilla prediseñada para adaptar el comunicado automáticamente con los datos y enlace QR de cada socio.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBroadcastTemplatePreview(!showBroadcastTemplatePreview)}
                      className="text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
                    >
                      <Eye size={14} />
                      <span>{showBroadcastTemplatePreview ? 'Ocultar Vista Previa' : 'Ver Diseño Oficial'}</span>
                    </button>
                  </div>

                  {/* Botones de Plantillas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <button
                      type="button"
                      onClick={() => handleSelectBroadcastTemplate('recordatorio_pago')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        broadcastTemplateTipo === 'recordatorio_pago'
                          ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/40 text-amber-950 shadow-sm'
                          : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-base">⏳</span>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            Cobro
                          </span>
                        </div>
                        <h5 className="text-xs font-extrabold text-slate-900">Recordatorio de Pago</h5>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                          Cuentas de Banrural, Industrial, G&T y pago en línea.
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-amber-800 mt-3 block">
                        Filtra a Pendientes
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectBroadcastTemplate('pago_confirmado')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        broadcastTemplateTipo === 'pago_confirmado'
                          ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-400/40 text-emerald-950 shadow-sm'
                          : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-base">🎟️</span>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Acreditados
                          </span>
                        </div>
                        <h5 className="text-xs font-extrabold text-slate-900">Entrada QR Oficial</h5>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                          Confirmación de acreditación con enlace directo a la entrada QR.
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 mt-3 block">
                        Filtra a Pagados
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectBroadcastTemplate('pre_registro')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        broadcastTemplateTipo === 'pre_registro'
                          ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-400/40 text-blue-950 shadow-sm'
                          : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-base">🦁</span>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            Bienvenida
                          </span>
                        </div>
                        <h5 className="text-xs font-extrabold text-slate-900">Pre-Inscripción</h5>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                          Recepción oficial de pre-registro con resumen de la ficha.
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-blue-800 mt-3 block">
                        Filtra a No Notificados
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectBroadcastTemplate('info_sedes_hospedaje')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        broadcastTemplateTipo === 'info_sedes_hospedaje'
                          ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-400/40 text-indigo-950 shadow-sm'
                          : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-base">🏨</span>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                            Logística
                          </span>
                        </div>
                        <h5 className="text-xs font-extrabold text-slate-900">Sedes y Hospedaje</h5>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                          Hoteles aliados, tarifas de descuento y sede de plenarias.
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-800 mt-3 block">
                        Para todos
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectBroadcastTemplate('personalizado')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        broadcastTemplateTipo === 'personalizado'
                          ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-400/40 text-purple-950 shadow-sm'
                          : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-base">✍️</span>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                            Libre
                          </span>
                        </div>
                        <h5 className="text-xs font-extrabold text-slate-900">Boletín Personalizado</h5>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                          Redacta comunicados y anuncios libres con membrete oficial.
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-purple-800 mt-3 block">
                        Redacción libre
                      </span>
                    </button>
                  </div>

                  {/* Vista Previa Expandible */}
                  {showBroadcastTemplatePreview && (
                    <div className="mt-4 p-5 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-yellow-400">
                          Diseño HTML Oficial Lions (Vista Previa Maqueta)
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Se reemplazará con los datos de cada socio al enviar
                        </span>
                      </div>
                      <div className="bg-white text-slate-900 p-4 rounded-xl text-xs space-y-2 border border-slate-200 max-h-72 overflow-y-auto font-sans leading-relaxed">
                        <div className="bg-blue-900 text-white p-3 rounded-lg text-center font-bold">
                          LXXV CONVENCIÓN NACIONAL • QUETZALTENANGO 2027
                        </div>
                        <div className="font-semibold text-slate-800">
                          Asunto: {broadcastSubject}
                        </div>
                        <div className="p-3 bg-slate-50 rounded border border-slate-100 whitespace-pre-wrap text-slate-700 font-mono text-[11px]">
                          {broadcastBody}
                        </div>
                        <div className="text-[10px] text-slate-400 text-center pt-2 border-t border-slate-100">
                          Club de Leones Quetzaltenango • Donde la Amistad se Vuelve Servicio
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Edición de Asunto y Mensaje */}
                  <div className="pt-2 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">Asunto del Correo</label>
                        <span className="text-[10px] text-slate-400">Llegará a la bandeja de entrada del socio</span>
                      </div>
                      <input 
                        type="text" 
                        required
                        value={broadcastSubject}
                        onChange={e => setBroadcastSubject(e.target.value)}
                        placeholder="Asunto oficial del comunicado..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-900/10 text-slate-900"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">Cuerpo del Mensaje</label>
                        <button
                          type="button"
                          onClick={() => handleSelectBroadcastTemplate(broadcastTemplateTipo)}
                          className="text-[10px] text-blue-900 font-bold hover:underline cursor-pointer flex items-center space-x-1"
                        >
                          <RefreshCw size={10} />
                          <span>Restaurar texto de la plantilla</span>
                        </button>
                      </div>
                      <textarea
                        required
                        rows={5}
                        value={broadcastBody}
                        onChange={e => setBroadcastBody(e.target.value)}
                        placeholder="Contenido del mensaje..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-900/10 text-slate-800 leading-relaxed font-sans"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        * Cada correo se enviará personalizado con el nombre, club y folio del participante mediante el Webhook de Google Apps Script ({DEFAULT_GMAIL_SENDER}).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Paso 2: Destinatarios & Control de Participantes */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                        <Users size={16} className="text-blue-900" />
                        <span>Paso 2: Control de Destinatarios, Estatus de Pago e Historial</span>
                      </h4>
                      <p className="text-xs text-slate-550 mt-0.5">
                        Verifica el estatus de pago de cada socio y qué mensaje se le ha enviado antes de emitir la difusión.
                      </p>
                    </div>
                    {/* Botones de Selección Múltiple Avanzada */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllGlobal}
                        className="text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5"
                        title="Seleccionar a todos los socios con correo en toda la base de datos (padrón completo)"
                      >
                        <CheckSquare size={13} />
                        <span>Todo el Padrón ({registros.filter(r => r.email && r.email.includes('@')).length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleSelectAllRecipients(broadcastFilteredRegistros)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                          broadcastFilteredRegistros.filter(r => r.email && r.email.includes('@')).length > 0 &&
                          broadcastFilteredRegistros.filter(r => r.email && r.email.includes('@')).every(r => broadcastSelectedIds.includes(r.id))
                            ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        title="Seleccionar o deseleccionar solo los socios visibles en este filtro"
                      >
                        {broadcastFilteredRegistros.filter(r => r.email && r.email.includes('@')).length > 0 &&
                        broadcastFilteredRegistros.filter(r => r.email && r.email.includes('@')).every(r => broadcastSelectedIds.includes(r.id)) ? (
                          <>
                            <Square size={13} />
                            <span>Deseleccionar Visibles</span>
                          </>
                        ) : (
                          <>
                            <CheckSquare size={13} />
                            <span>Seleccionar Visibles ({broadcastFilteredRegistros.filter(r => r.email && r.email.includes('@')).length})</span>
                          </>
                        )}
                      </button>

                      {broadcastFilteredRegistros.filter(r => r.email && r.email.includes('@')).length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleInvertFilteredSelection(broadcastFilteredRegistros)}
                          className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                          title="Invertir la selección actual de socios visibles"
                        >
                          Invertir
                        </button>
                      )}

                      {broadcastSelectedIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setBroadcastSelectedIds([])}
                          className="text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                          title="Quitar toda la selección manual"
                        >
                          Limpiar ({broadcastSelectedIds.length})
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Atajos de Selección Rápida por Estatus y Opciones de Protocolo */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/90 p-3 rounded-2xl border border-slate-200/70 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1">
                        Marcar rápido:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSelectByCriterion('pendientes')}
                        className="px-2.5 py-1 rounded-lg bg-amber-100/80 hover:bg-amber-100 text-amber-900 font-bold text-[11px] transition-colors cursor-pointer"
                        title="Selecciona a todos los socios pendientes de pago"
                      >
                        ⏳ Solo Pendientes ({registros.filter(r => r.estadoPago !== 'Pagado' && r.email).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectByCriterion('pagados')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-100/80 hover:bg-emerald-100 text-emerald-900 font-bold text-[11px] transition-colors cursor-pointer"
                        title="Selecciona a todos los socios con pago confirmado"
                      >
                        ✅ Solo Pagados ({registros.filter(r => r.estadoPago === 'Pagado' && r.email).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectByCriterion('sin_notificar')}
                        className="px-2.5 py-1 rounded-lg bg-indigo-100/80 hover:bg-indigo-100 text-indigo-900 font-bold text-[11px] transition-colors cursor-pointer"
                        title="Selecciona a socios que nunca han recibido comunicados"
                      >
                        ⚪ Sin Comunicados ({registros.filter(r => !r.ultimoMensajeEnviado && r.email).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectByCriterion('telegram')}
                        className="px-2.5 py-1 rounded-lg bg-teal-100/80 hover:bg-teal-100 text-teal-900 font-bold text-[11px] transition-colors cursor-pointer"
                        title="Selecciona a socios conectados con Telegram"
                      >
                        🟢 Con Telegram ({registros.filter(r => r.telegramVerificado && r.email).length})
                      </button>
                    </div>

                    {/* Toggle de Protocolo Anti-Spam / Deduplicación */}
                    <label className="flex items-center space-x-1.5 text-xs text-slate-700 font-bold cursor-pointer select-none bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-900/30">
                      <input 
                        type="checkbox"
                        checked={deduplicateEmails}
                        onChange={(e) => setDeduplicateEmails(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-blue-900 border-slate-300 focus:ring-blue-900/20 cursor-pointer"
                      />
                      <span title="Si varios registros comparten el mismo correo electrónico (ej. acompañantes o cónyuges con un mismo email), se enviará un único correo para evitar repeticiones innecesarias.">
                        🛡️ Deduplicar correos repetidos
                      </span>
                    </label>
                  </div>

                  {/* Píldoras de Filtro Rápido de Destinatarios */}
                  <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setBroadcastRecipientFilter('todos')}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                        broadcastRecipientFilter === 'todos'
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Todos ({registros.filter(r => r.email).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setBroadcastRecipientFilter('pendientes')}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                        broadcastRecipientFilter === 'pendientes'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
                      }`}
                    >
                      ⏳ Pendientes de Pago ({registros.filter(r => r.estadoPago !== 'Pagado' && r.email).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setBroadcastRecipientFilter('pagados')}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                        broadcastRecipientFilter === 'pagados'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
                      }`}
                    >
                      ✅ Pagados Confirmados ({registros.filter(r => r.estadoPago === 'Pagado' && r.email).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setBroadcastRecipientFilter('sin_notificar')}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                        broadcastRecipientFilter === 'sin_notificar'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200/60'
                      }`}
                    >
                      ⚪ Sin Envíos Previos ({registros.filter(r => !r.ultimoMensajeEnviado && r.email).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setBroadcastRecipientFilter('notificados')}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                        broadcastRecipientFilter === 'notificados'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200/60'
                      }`}
                    >
                      📨 Ya Notificados ({registros.filter(r => !!r.ultimoMensajeEnviado && r.email).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setBroadcastRecipientFilter('telegram_activo')}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                        broadcastRecipientFilter === 'telegram_activo'
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200/60'
                      }`}
                    >
                      🟢 Con Telegram ({registros.filter(r => r.telegramVerificado && r.email).length})
                    </button>
                  </div>

                  {/* Buscador de Destinatarios */}
                  <div className="relative">
                    <input 
                      type="text"
                      value={broadcastRecipientSearch}
                      onChange={(e) => setBroadcastRecipientSearch(e.target.value)}
                      placeholder="Buscar por socio, DPI, email, teléfono o club..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900/10 font-medium"
                    />
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                  </div>

                  {/* Barra de Progreso en Vivo durante la difusión masiva */}
                  {broadcastProgress && (
                    <div className="bg-gradient-to-r from-blue-955 via-blue-900 to-indigo-955 text-white p-5 rounded-2xl border border-blue-800 shadow-xl space-y-3 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="animate-spin text-amber-400" size={18} />
                          <span className="text-sm font-black uppercase tracking-wide">
                            Enviando Difusión Masiva ({broadcastProgress.current} de {broadcastProgress.total})
                          </span>
                        </div>
                        <span className="text-base font-black text-amber-400 font-mono">
                          {broadcastProgress.porcentaje}%
                        </span>
                      </div>

                      {/* Barra animada */}
                      <div className="w-full bg-blue-955/80 rounded-full h-3 p-0.5 border border-white/20 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 h-full rounded-full transition-all duration-300 shadow-sm"
                          style={{ width: `${broadcastProgress.porcentaje}%` }}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-300 font-mono gap-1">
                        <span className="truncate max-w-md">
                          Destinatario: <strong className="text-white">{broadcastProgress.nombre}</strong> ({broadcastProgress.email})
                        </span>
                        <span className="text-amber-300/90 text-[11px] shrink-0">
                          * Tasa anti-spam controlada (200ms entre envíos)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Estado de selección actual */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <Info size={16} className="text-blue-900 shrink-0" />
                      <span className="text-slate-700 font-medium">
                        {broadcastSelectedIds.length > 0 ? (
                          <>
                            <strong className="text-blue-900 font-black">{broadcastSelectedIds.length}</strong> participantes seleccionados manualmente.
                          </>
                        ) : (
                          <>
                            Sin selección manual: se enviará a los <strong className="text-blue-900 font-black">{broadcastFilteredRegistros.filter(r => r.email && r.email.includes('@')).length}</strong> participantes del filtro actual.
                          </>
                        )}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Total en vista: {broadcastFilteredRegistros.length}
                    </span>
                  </div>

                  {/* Tabla / Lista de Destinatarios */}
                  {broadcastFilteredRegistros.length > 0 ? (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-100 max-h-96 overflow-y-auto bg-white">
                      {/* Cabecera con Checkbox Maestro */}
                      <div className="bg-slate-100/90 px-3 sm:px-4 py-2 flex items-center justify-between text-xs font-bold text-slate-700 sticky top-0 z-10 backdrop-blur-xs border-b border-slate-200">
                        <div className="flex items-center space-x-3">
                          <input 
                            type="checkbox"
                            checked={
                              broadcastFilteredRegistros.filter(r => r.email && r.email.includes('@')).length > 0 &&
                              broadcastFilteredRegistros.filter(r => r.email && r.email.includes('@')).every(r => broadcastSelectedIds.includes(r.id))
                            }
                            onChange={() => handleToggleSelectAllRecipients(broadcastFilteredRegistros)}
                            className="w-4 h-4 rounded text-blue-900 border-slate-300 focus:ring-blue-900/20 cursor-pointer"
                            title="Seleccionar o deseleccionar todos los visibles"
                          />
                          <span className="text-[11px] uppercase tracking-wider font-black text-slate-600">
                            Participante & Club
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {broadcastSelectedIds.length > 0 
                            ? `${broadcastSelectedIds.length} seleccionados` 
                            : `${broadcastFilteredRegistros.filter(r => r.email).length} con correo`}
                        </span>
                      </div>

                      {broadcastFilteredRegistros.map((reg) => {
                        const isSelected = broadcastSelectedIds.includes(reg.id);
                        const hasEmail = !!(reg.email && reg.email.includes('@'));
                        const isPagado = reg.estadoPago === 'Pagado';

                        return (
                          <div 
                            key={reg.id}
                            className={`p-3 sm:p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50/70'
                            }`}
                          >
                            <div className="flex items-start sm:items-center space-x-3 min-w-0 flex-1">
                              <input 
                                type="checkbox"
                                disabled={!hasEmail}
                                checked={isSelected}
                                onChange={() => handleToggleSelectOneRecipient(reg.id)}
                                className="w-4 h-4 rounded text-blue-900 border-slate-300 focus:ring-blue-900/20 cursor-pointer mt-1 sm:mt-0 shrink-0"
                              />

                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-extrabold text-xs text-slate-900">
                                    {reg.nombre}
                                  </span>
                                  <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                    {reg.id}
                                  </span>

                                  {/* Estatus de Pago Interactivo */}
                                  <select
                                    value={reg.estadoPago || 'Pendiente'}
                                    onChange={(e) => handleUpdateEstadoPago(reg.id, e.target.value as any)}
                                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border cursor-pointer ${
                                      isPagado 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                        : 'bg-amber-50 text-amber-700 border-amber-300'
                                    }`}
                                    title="Modificar estatus de pago"
                                  >
                                    <option value="Pendiente">⏳ Pendiente</option>
                                    <option value="Checkout_Creado">💳 Link Creado</option>
                                    <option value="Pagado">✅ Pagado</option>
                                  </select>

                                  {/* Badge del Último Mensaje Enviado */}
                                  {reg.ultimoMensajeEnviado ? (
                                    <button
                                      type="button"
                                      onClick={() => setHistorialModalRegistro(reg)}
                                      className="inline-flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 px-2 py-0.5 rounded-full text-[9px] font-bold cursor-pointer transition-colors"
                                      title={`Último: ${reg.ultimoMensajeEnviado}. Clic para ver historial completo.`}
                                    >
                                      <CheckCircle size={10} className="text-blue-600" />
                                      <span className="max-w-[140px] truncate">{reg.ultimoMensajeEnviado}</span>
                                      {reg.fechaUltimoMensaje && (
                                        <span className="text-blue-600 font-normal">
                                          ({new Date(reg.fechaUltimoMensaje).toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit' })})
                                        </span>
                                      )}
                                    </button>
                                  ) : (
                                    <span className="text-[9px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                                      ⚪ Sin envíos
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-550">
                                  <span>🦁 {reg.club} ({reg.cargo})</span>
                                  <span className={hasEmail ? "text-slate-600" : "text-red-500 font-bold"}>
                                    ✉️ {reg.email || 'Sin correo'}
                                  </span>
                                  {reg.telefono && <span>📞 {reg.telefono}</span>}
                                  {reg.telegramVerificado && (
                                    <span className="text-emerald-700 font-bold">🟢 Bot Telegram</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Acciones individuales */}
                            <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-center">
                              {/* Vista previa personalizada para este socio */}
                              <button
                                type="button"
                                onClick={() => setPreviewSampleRegistro(reg)}
                                className="text-[10px] font-bold text-slate-600 hover:text-blue-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                                title="Ver vista previa personalizada de cómo recibirá el correo este socio"
                              >
                                <Eye size={12} />
                                <span className="hidden sm:inline">Previa</span>
                              </button>

                              {reg.mensajesEnviados && reg.mensajesEnviados.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setHistorialModalRegistro(reg)}
                                  className="text-[10px] font-bold text-slate-600 hover:text-blue-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                                  title="Ver historial de mensajes enviados"
                                >
                                  <History size={12} />
                                  <span>({reg.mensajesEnviados.length})</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenEmailModal(reg, reg.estadoPago === 'Pagado' ? 'pago_confirmado' : 'recordatorio_pago')}
                                className="text-[10px] font-bold text-blue-900 hover:text-white bg-blue-50 hover:bg-blue-900 border border-blue-200 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1"
                                title="Redactar correo individual solo a este socio"
                              >
                                <Mail size={12} />
                                <span>Individual</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <Users className="mx-auto text-slate-300 mb-2" size={24} />
                      <p className="text-xs font-bold text-slate-600">No hay participantes que coincidan con este filtro.</p>
                      <button
                        type="button"
                        onClick={() => { setBroadcastRecipientFilter('todos'); setBroadcastRecipientSearch(''); }}
                        className="text-xs text-blue-900 font-black underline mt-1 cursor-pointer"
                      >
                        Ver todos los inscritos
                      </button>
                    </div>
                  )}

                  {/* Paso 3: Botón de Envío */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                      Plantilla activa: <strong className="text-slate-800">{broadcastTemplateTipo}</strong>
                      {deduplicateEmails && <span className="ml-2 text-emerald-600 font-bold">• Deduplicación activa</span>}
                    </div>

                    <button
                      type="submit"
                      disabled={isBroadcasting || (broadcastSelectedIds.length === 0 && broadcastFilteredRegistros.filter(r => r.email).length === 0)}
                      className="bg-blue-900 hover:bg-blue-850 text-white font-black px-6 py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isBroadcasting ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          <span>Enviando difusión masiva ({broadcastProgress ? `${broadcastProgress.current}/${broadcastProgress.total}` : 'Iniciando'})...</span>
                        </>
                      ) : (
                        <>
                          <Send size={16} className="text-amber-400" />
                          <span>
                            {broadcastSelectedIds.length > 0 
                              ? `Enviar Difusión a los ${broadcastSelectedIds.length} Socios Seleccionados`
                              : `Enviar Difusión a ${broadcastFilteredRegistros.filter(r => r.email).length} Socios Filtrados`
                            }
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Canal 2: Telegram Broadcast */}
            {broadcastChannelTab === 'telegram' && (
              <form onSubmit={handleSendTelegramBroadcast} className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 space-y-4 max-w-4xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
                  <h4 className="text-sm font-black text-blue-900 uppercase tracking-wider flex items-center space-x-2">
                    <Send size={16} className="text-blue-900" />
                    <span>Publicar Anuncio en Canal / Grupo de Telegram</span>
                  </h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-3 py-1 rounded-full flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Bot Oficial: @ConvencionLeonesbot</span>
                    </span>
                    <a
                      href="https://t.me/ConvencionLeonesbot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-2.5 py-1 rounded-full transition-colors inline-flex items-center space-x-1"
                    >
                      <ExternalLink size={10} />
                      <span>Abrir Bot</span>
                    </a>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Chat ID o Canal Destino en Telegram
                      </label>
                      <button
                        type="button"
                        onClick={() => setCustomTelegramDestination('1507920109')}
                        className="text-[10px] text-blue-900 font-bold hover:underline cursor-pointer"
                      >
                        Usar Chat Oficial (1507920109)
                      </button>
                    </div>
                    <input 
                      type="text"
                      value={customTelegramDestination}
                      onChange={(e) => setCustomTelegramDestination(e.target.value)}
                      placeholder={config.telegramChatId || '1507920109 (Chat o @canal público)'}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-900/10"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Ingresa el Chat ID numérico o el alias del canal público (ej. @convencionleones). Deja en blanco para usar el chat oficial configurado.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-600">Mensaje para Telegram (Soporta HTML)</label>
                      <button
                        type="button"
                        onClick={() => setBroadcastTelegramMsg("🦁 <b>AVISO IMPORTANTE DE LA CONVENCIÓN</b>\n\nEstimados Compañeros Leones, les recordamos que pueden consultar y descargar su <b>Entrada QR Oficial</b> directamente desde nuestra plataforma:\n\n👉 https://clubdeleonesquetzaltenango.org/#/convencion\n\n¡Nos vemos muy pronto en Quetzaltenango!")}
                        className="text-[10px] text-blue-900 font-bold hover:underline cursor-pointer"
                      >
                        + Plantilla con Enlace QR
                      </button>
                    </div>
                    <textarea
                      required
                      rows={4}
                      value={broadcastTelegramMsg}
                      onChange={e => setBroadcastTelegramMsg(e.target.value)}
                      placeholder="Escribe el mensaje que se publicará en Telegram... Puedes usar <b>negrita</b> e <i>itálica</i>."
                      className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-900/10 text-slate-800"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isBroadcasting}
                      className="bg-indigo-900 hover:bg-indigo-850 text-white font-black px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider shadow transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isBroadcasting ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          <span>Publicando en Telegram...</span>
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          <span>Publicar Anuncio en Telegram</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ================= PRE-REGISTROS TAB ================= */}
        {activeSubTab === 'registros' && (
          <div className="space-y-6">
            {/* KPI Cards: Resumen de Pre-inscritos y Canales */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Pre-inscritos</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{registros.length}</p>
                  <span className="text-[10px] text-slate-500 font-medium">Registrados en web</span>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 text-blue-900 rounded-xl flex items-center justify-center font-bold shrink-0">
                  <Users size={20} />
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Telegram Activos</span>
                  </p>
                  <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
                    {registros.filter(r => r.telegramVerificado).length}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-medium">Reciben difusión en bot</span>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold shrink-0">
                  <Send size={18} />
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Recaudado / Confirmado</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                    Q{registros.filter(r => r.estadoPago === 'Pagado').reduce((acc, r) => acc + (r.montoPagar || 0), 0).toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {registros.filter(r => r.estadoPago === 'Pagado').length} Acreditados
                  </span>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center font-bold shrink-0">
                  <CheckCircle size={20} />
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-600">Pendientes de Pago</p>
                  <p className="text-xl sm:text-2xl font-black text-amber-700 mt-1">
                    {registros.filter(r => r.estadoPago !== 'Pagado').length}
                  </p>
                  <span className="text-[10px] text-amber-600 font-medium">En seguimiento</span>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold shrink-0">
                  <Clock size={20} />
                </div>
              </div>
            </div>

            {/* Barra de Búsqueda y Píldoras de Filtro Rápido */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3.5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:max-w-md">
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por socio, DPI, email, teléfono o club..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-xl pl-10 pr-4 py-2 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-medium"
                  />
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                </div>

                <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex items-center space-x-2 text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-full shadow-xs">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>En vivo (Tiempo real)</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveSubTab('difusion')}
                    className="flex items-center space-x-1.5 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-850 hover:to-indigo-850 text-white font-black px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <Mail size={14} className="text-amber-400" />
                    <span>Difusión Masiva</span>
                  </button>

                  {registros.length > 0 && (
                    <button
                      onClick={handleExportCSV}
                      className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer whitespace-nowrap"
                    >
                      <Download size={14} />
                      <span>Exportar CSV</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Píldoras de Filtro por Canal y Estado */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setChannelFilter('todos')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    channelFilter === 'todos'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({registros.length})
                </button>
                <button
                  type="button"
                  onClick={() => setChannelFilter('telegram_activo')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                    channelFilter === 'telegram_activo'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>🟢 Telegram Activo ({registros.filter(r => r.telegramVerificado).length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChannelFilter('telegram_pendiente')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    channelFilter === 'telegram_pendiente'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
                  }`}
                >
                  🟡 Telegram Pendiente ({registros.filter(r => r.preferenciaNotificacion === 'telegram' && !r.telegramVerificado).length})
                </button>
                <button
                  type="button"
                  onClick={() => setChannelFilter('email')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    channelFilter === 'email'
                      ? 'bg-blue-900 text-white shadow-sm'
                      : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200/60'
                  }`}
                >
                  ✉️ Solo Correo ({registros.filter(r => r.preferenciaNotificacion === 'email').length})
                </button>
                <button
                  type="button"
                  onClick={() => setChannelFilter('pagados')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    channelFilter === 'pagados'
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ✅ Pagados ({registros.filter(r => r.estadoPago === 'Pagado').length})
                </button>
                <button
                  type="button"
                  onClick={() => setChannelFilter('pendientes')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    channelFilter === 'pendientes'
                      ? 'bg-rose-700 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ⏳ Pendientes ({registros.filter(r => r.estadoPago !== 'Pagado').length})
                </button>
              </div>
            </div>

            {filteredRegistros.length > 0 ? (
              <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-white divide-y divide-slate-100">
                {filteredRegistros.map((reg) => {
                  const isPagado = reg.estadoPago === 'Pagado';
                  const isCheckout = reg.estadoPago === 'Checkout_Creado';
                  const cleanPhone = getCleanPhone(reg.telefono);
                  const whatsappMsg = getWhatsAppMessage(reg);

                  return (
                    <div 
                      key={reg.id} 
                      className="p-4 sm:p-5 hover:bg-slate-50/70 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      {/* Información Principal del Participante */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                            {reg.nombre}
                          </h4>

                          {/* Selector de Estado de Pago Interactivo */}
                          <select
                            value={reg.estadoPago || 'Pendiente'}
                            onChange={(e) => handleUpdateEstadoPago(reg.id, e.target.value as any)}
                            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-900/20 transition-all ${
                              isPagado 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                : isCheckout 
                                  ? 'bg-blue-50 text-blue-700 border-blue-300' 
                                  : 'bg-amber-50 text-amber-700 border-amber-300'
                            }`}
                            title="Cambiar estado del registro"
                          >
                            <option value="Pendiente">⏳ Pendiente</option>
                            <option value="Checkout_Creado">💳 Link Creado</option>
                            <option value="Pagado">✅ Pagado Confirmado</option>
                          </select>

                          {/* BADGE INTERACTIVO DE ESTADO TELEGRAM / DIFUSIÓN */}
                          {reg.telegramVerificado ? (
                            <button
                              type="button"
                              onClick={() => handleToggleTelegramStatus(reg.id, true)}
                              className="inline-flex items-center space-x-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full text-[10px] font-black transition-all cursor-pointer shadow-xs"
                              title="Está activo en el Bot de Telegram y recibirá mensajes masivos. Clic para cambiar."
                            >
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              <span>🟢 Bot Telegram Activo</span>
                            </button>
                          ) : reg.preferenciaNotificacion === 'telegram' ? (
                            <button
                              type="button"
                              onClick={() => handleToggleTelegramStatus(reg.id, false)}
                              className="inline-flex items-center space-x-1 text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full text-[10px] font-black transition-all cursor-pointer"
                              title="Eligió Telegram pero aún no confirmó el número en el bot. Clic para marcarlo como Activo."
                            >
                              <span>🟡 Telegram (Pendiente en Bot)</span>
                              <span className="text-[9px] underline ml-1 text-blue-800 font-extrabold">Verificar</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleTelegramStatus(reg.id, false)}
                              className="inline-flex items-center space-x-1 text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer"
                              title="Prefiere recibir difusión por Correo. Clic para activar recepción en Telegram."
                            >
                              <Mail size={11} className="text-slate-500" />
                              <span>✉️ Difusión Correo</span>
                              <span className="text-[9px] text-blue-700 font-extrabold underline ml-1">+Telegram</span>
                            </button>
                          )}

                          {/* Folio */}
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                            {reg.id}
                          </span>
                        </div>

                        {/* Metadatos en línea sin forzar scroll horizontal */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 font-medium">
                          <span className="flex items-center text-slate-800 font-bold">
                            🦁 {reg.club} <span className="text-slate-400 font-normal ml-1">({reg.cargo} • {reg.distrito})</span>
                          </span>

                          <span className="text-amber-700 font-bold">
                            💰 Q{(reg.montoPagar || 0).toLocaleString()} <span className="text-slate-500 font-normal">({reg.paquete || 'General'})</span>
                          </span>

                          {reg.dpi && (
                            <span className="text-slate-500 font-mono text-[11px]">
                              DPI: {reg.dpi}
                            </span>
                          )}

                          {reg.email && (
                            <span className="text-slate-500 text-[11px]">
                              ✉️ {reg.email}
                            </span>
                          )}

                          {reg.telefono && (
                            <span className="text-slate-500 text-[11px] font-mono">
                              📞 {reg.telefono}
                            </span>
                          )}

                          {/* Badge de Historial / Último Comunicado Enviado */}
                          {reg.ultimoMensajeEnviado ? (
                            <button
                              type="button"
                              onClick={() => setHistorialModalRegistro(reg)}
                              className="inline-flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200/80 px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors shadow-xs"
                              title={`Último: ${reg.ultimoMensajeEnviado}. Clic para ver historial completo.`}
                            >
                              <CheckCircle size={10} className="text-blue-600" />
                              <span className="font-extrabold text-blue-950">Enviado:</span>
                              <span className="max-w-[130px] truncate">{reg.ultimoMensajeEnviado}</span>
                              {reg.fechaUltimoMensaje && (
                                <span className="text-[9px] text-blue-600 font-normal">
                                  ({new Date(reg.fechaUltimoMensaje).toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit' })})
                                </span>
                              )}
                            </button>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full text-[10px] font-medium">
                              ⚪ Sin comunicados
                            </span>
                          )}

                          <span className="text-slate-400 text-[11px]">
                            📅 {new Date(reg.fechaRegistro).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Botones de Acción Rápida (WhatsApp, Llamar, Telegram, Gmail, Historial, QR) */}
                      <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                        {/* Botón WhatsApp */}
                        {cleanPhone ? (
                          <a
                            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMsg)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                            title="Mandar mensaje de WhatsApp"
                          >
                            <MessageCircle size={15} className="text-emerald-600 fill-emerald-100" />
                            <span>WhatsApp</span>
                          </a>
                        ) : null}

                        {/* Botón Telegram Directo */}
                        {cleanPhone ? (
                          <a
                            href={`https://t.me/+502${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                            title="Abrir chat en Telegram"
                          >
                            <Send size={13} className="text-sky-600" />
                            <span>Telegram</span>
                          </a>
                        ) : (
                          <a
                            href="https://t.me/ConvencionLeonesbot"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                            title="Abrir bot oficial"
                          >
                            <Send size={13} className="text-sky-600" />
                            <span>Bot</span>
                          </a>
                        )}

                        {/* Botón Llamar */}
                        {reg.telefono ? (
                          <a
                            href={`tel:${reg.telefono}`}
                            className="inline-flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                            title="Hacer llamada telefónica"
                          >
                            <Phone size={14} className="text-blue-600" />
                            <span>Llamar</span>
                          </a>
                        ) : null}

                        {/* Botón Gmail */}
                        {reg.email && (
                          <button
                            type="button"
                            onClick={() => handleOpenEmailModal(reg, reg.estadoPago === 'Pagado' ? 'pago_confirmado' : 'recordatorio_pago')}
                            className="inline-flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                            title="Enviar correo informativo vía Gmail"
                          >
                            <Mail size={14} className="text-rose-600" />
                            <span>Gmail</span>
                          </button>
                        )}

                        {/* Botón Historial de Comunicados */}
                        <button
                          type="button"
                          onClick={() => setHistorialModalRegistro(reg)}
                          className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-2.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                          title="Ver historial de mensajes enviados a este socio"
                        >
                          <History size={14} className="text-slate-600" />
                          <span>Historial</span>
                        </button>

                        {/* Botón Reenviar Entrada QR */}
                        <button
                          type="button"
                          onClick={() => handleOpenQrModal(reg)}
                          className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm shadow-yellow-500/20 active:scale-95 cursor-pointer"
                          title="Ver y reenviar entrada QR oficial"
                        >
                          <QrCode size={15} />
                          <span>Entrada QR</span>
                        </button>

                        {/* Botón Eliminar */}
                        <button
                          type="button"
                          onClick={() => handleDeleteRegistro(reg.id, reg.nombre)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer ml-1"
                          title="Eliminar pre-registro"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="mt-4 text-slate-800 font-extrabold text-base">No hay pre-registros encontrados</p>
                <p className="text-xs text-slate-400 mt-1">Los socios que se registren en la landing page aparecerán listados aquí.</p>
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

            <form noValidate onSubmit={handleSaveAlianza} className="p-6 space-y-5">
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
                    type="text"
                    id="ali_url"
                    value={alianzaForm.logoUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAlianzaForm(prev => ({ ...prev, logoUrl: val }));
                      if (!alianzaLogoFile) setAlianzaLogoPreview(val);
                    }}
                    placeholder="https://... o enlace de imagen"
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

      {/* ================= MODAL: ENTRADA / CREDENCIAL QR OFICIAL ================= */}
      {qrModalRegistro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-blue-955 via-blue-900 to-indigo-900 text-white p-5 sm:p-6 flex justify-between items-center relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none" />
              <div className="space-y-1 relative z-10">
                <span className="text-[10px] font-black uppercase tracking-widest text-yellow-300 bg-yellow-500/20 border border-yellow-400/30 px-3 py-0.5 rounded-full inline-block">
                  LXXIV Convención Lions 2026-2027
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center space-x-2">
                  <QrCode size={20} className="text-yellow-400" />
                  <span>Entrada Oficial & Credencial QR</span>
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setQrModalRegistro(null)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors relative z-10 cursor-pointer"
                title="Cerrar ventana"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Tarjeta de Pase Digital */}
              <div className="bg-gradient-to-b from-slate-900 to-[#09152e] text-white rounded-2xl p-5 border border-yellow-400/40 shadow-xl relative overflow-hidden text-center space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Pase de Acceso al Congreso
                  </span>
                  <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {qrModalRegistro.nombre}
                  </h4>
                  <p className="text-xs text-yellow-300 font-bold">
                    🦁 {qrModalRegistro.club} <span className="text-slate-300 font-medium">({qrModalRegistro.cargo})</span>
                  </p>
                </div>

                {/* Código QR Generado */}
                <div className="bg-white p-3.5 rounded-2xl inline-block mx-auto shadow-2xl ring-4 ring-yellow-400/30">
                  {qrCodeDataUrl ? (
                    <img 
                      src={qrCodeDataUrl} 
                      alt={`Código QR de ${qrModalRegistro.nombre}`}
                      className="w-48 h-48 sm:w-56 sm:h-56 mx-auto object-contain"
                    />
                  ) : (
                    <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  )}
                </div>

                {/* Badge de Estado y Folio */}
                <div className="flex items-center justify-center gap-3 pt-1">
                  <span className={`inline-flex items-center space-x-1.5 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border shadow-sm ${
                    qrModalRegistro.estadoPago === 'Pagado'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      : qrModalRegistro.estadoPago === 'Checkout_Creado'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-400/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                  }`}>
                    <span>{qrModalRegistro.estadoPago === 'Pagado' ? '✅ Pago Confirmado' : '⏳ Pendiente de Pago'}</span>
                  </span>

                  <span className="text-xs font-mono font-bold text-slate-300 bg-white/10 px-3 py-1.5 rounded-full border border-white/15">
                    ID: {qrModalRegistro.id}
                  </span>
                </div>

                {/* Resumen del Paquete */}
                <div className="text-xs bg-white/5 border border-white/10 rounded-xl p-3 text-left space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Paquete:</span>
                    <span className="font-bold text-white text-right">{qrModalRegistro.paquete || 'General'}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-1">
                    <span className="text-slate-400">Monto Registrado:</span>
                    <span className="font-black text-yellow-300">Q.{(qrModalRegistro.montoPagar || 0).toLocaleString()}.00</span>
                  </div>
                </div>
              </div>

              {/* Botones de Envío y Acción */}
              <div className="space-y-2.5">
                <p className="text-xs font-black uppercase tracking-wider text-slate-500 text-center">
                  Opciones para Compartir y Reenviar
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Reenviar por WhatsApp */}
                  {getCleanPhone(qrModalRegistro.telefono) && (
                    <a
                      href={`https://wa.me/${getCleanPhone(qrModalRegistro.telefono)}?text=${encodeURIComponent(getWhatsAppMessage(qrModalRegistro))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 text-center cursor-pointer"
                    >
                      <MessageCircle size={16} />
                      <span>Enviar por WhatsApp</span>
                    </a>
                  )}

                  {/* Descargar Imagen QR */}
                  {qrCodeDataUrl && (
                    <a
                      href={qrCodeDataUrl}
                      download={`Entrada_QR_${qrModalRegistro.nombre.replace(/\s+/g, '_')}.png`}
                      className="flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-4 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 text-center cursor-pointer"
                    >
                      <Download size={16} />
                      <span>Descargar QR (PNG)</span>
                    </a>
                  )}

                  {/* Copiar Datos */}
                  <button
                    type="button"
                    onClick={handleCopyTicketDetails}
                    className="flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold px-4 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all border border-slate-200 cursor-pointer"
                  >
                    {isCopiedQr ? (
                      <>
                        <Check size={16} className="text-emerald-600" />
                        <span className="text-emerald-700 font-bold">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span>Copiar Resumen</span>
                      </>
                    )}
                  </button>

                  {/* Enviar por Gmail */}
                  {qrModalRegistro.email && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = qrModalRegistro;
                        setQrModalRegistro(null);
                        handleOpenEmailModal(target, target.estadoPago === 'Pagado' ? 'pago_confirmado' : 'pre_registro');
                      }}
                      className="flex items-center justify-center space-x-2 bg-rose-50 hover:bg-rose-100 text-rose-900 font-extrabold px-4 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all border border-rose-200 cursor-pointer shadow-sm active:scale-95"
                    >
                      <Mail size={16} className="text-rose-600" />
                      <span>Enviar Entrada por Gmail</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Botón Cerrar */}
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setQrModalRegistro(null)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Envío de Correo por Gmail */}
      {emailModalRegistro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-blue-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600/30 border border-rose-400/40 flex items-center justify-center text-white">
                  <Mail size={20} className="text-rose-300" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white leading-tight">
                    Enviar Correo vía Gmail
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    Desde: <strong className="text-yellow-300">{DEFAULT_GMAIL_SENDER}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEmailModalRegistro(null)}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSendSingleEmail} className="p-6 space-y-4">
              {/* Info Destinatario */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold">Destinatario: </span>
                  <span className="font-extrabold text-slate-800">{emailModalRegistro.nombre}</span>
                  <div className="text-slate-500 font-mono text-[11px]">{emailModalRegistro.email}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    emailModalRegistro.estadoPago === 'Pagado'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {emailModalRegistro.estadoPago || 'Pendiente'}
                  </span>
                  <span className="font-mono text-slate-400 text-[10px]">Folio: {emailModalRegistro.id}</span>
                </div>
              </div>

              {/* Selector de Tipo de Correo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Plantilla del Correo Informativo
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleEmailTipoChange('pago_confirmado')}
                    className={`p-2.5 rounded-xl border text-left text-[11px] font-bold transition-all cursor-pointer ${
                      emailTipo === 'pago_confirmado'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-300'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    🎟️ Entrada QR & Pago
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEmailTipoChange('pre_registro')}
                    className={`p-2.5 rounded-xl border text-left text-[11px] font-bold transition-all cursor-pointer ${
                      emailTipo === 'pre_registro'
                        ? 'bg-blue-50 border-blue-400 text-blue-900 ring-2 ring-blue-300'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    🦁 Pre-Inscripción
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEmailTipoChange('recordatorio_pago')}
                    className={`p-2.5 rounded-xl border text-left text-[11px] font-bold transition-all cursor-pointer ${
                      emailTipo === 'recordatorio_pago'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-300'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    ⏳ Recordar Pago
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEmailTipoChange('info_sedes_hospedaje')}
                    className={`p-2.5 rounded-xl border text-left text-[11px] font-bold transition-all cursor-pointer ${
                      emailTipo === 'info_sedes_hospedaje'
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-900 ring-2 ring-indigo-300'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    🏨 Sedes y Hoteles
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEmailTipoChange('personalizado')}
                    className={`col-span-2 sm:col-span-1 p-2.5 rounded-xl border text-left text-[11px] font-bold transition-all cursor-pointer ${
                      emailTipo === 'personalizado'
                        ? 'bg-purple-50 border-purple-400 text-purple-900 ring-2 ring-purple-300'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    ✍️ Personalizado
                  </button>
                </div>
              </div>

              {/* Asunto */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Asunto del Correo
                </label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900/10"
                />
              </div>

              {/* Mensaje */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cuerpo del Mensaje (Texto)
                </label>
                <textarea
                  rows={6}
                  required
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900/10 leading-relaxed font-sans"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  * El correo se enviará con formato HTML enriquecido institucional con los logos y colores de Lions International.
                </p>
              </div>

              {/* Botones de Envío */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <a
                  href={gmailService.getGmailComposeUrl({
                    to: emailModalRegistro.email,
                    subject: emailSubject,
                    body: emailBody
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-3 rounded-xl text-xs transition-colors cursor-pointer"
                  title="Abrir en pestaña de Gmail Web"
                >
                  <ExternalLink size={14} />
                  <span>Abrir en Gmail Web</span>
                </a>

                <div className="w-full sm:w-auto flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setEmailModalRegistro(null)}
                    className="w-1/2 sm:w-auto px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingEmail}
                    className="w-1/2 sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSendingEmail ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Enviar desde Gmail</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Guía de Google Apps Script */}
      {showScriptGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
                  GS
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Instalación de Webhook Gmail en Google Apps Script
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cuenta: <strong>{DEFAULT_GMAIL_SENDER}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowScriptGuideModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>
                Para habilitar o actualizar los envíos directos desde Gmail sin límites y con alta entregabilidad:
              </p>
              <ol className="list-decimal pl-5 space-y-1.5 font-medium text-slate-700">
                <li>Ingresa a <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold">script.google.com</a> con <strong>{DEFAULT_GMAIL_SENDER}</strong>.</li>
                <li>Crea un <strong>Nuevo proyecto</strong>.</li>
                <li>Pega el código de abajo en <code>Código.gs</code>.</li>
                <li>Haz clic en <strong>Implementar &gt; Nueva implementación</strong>.</li>
                <li>Tipo: <strong>Aplicación web</strong>, Ejecutar como: <strong>Yo ({DEFAULT_GMAIL_SENDER})</strong>, Quién tiene acceso: <strong>Cualquiera</strong>.</li>
                <li>Copia la URL obtenida y pégala en el campo de configuración.</li>
              </ol>

              <div className="pt-2">
                <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-2 rounded-t-xl text-[11px] font-mono">
                  <span>Código.gs (Google Apps Script)</span>
                  <button
                    type="button"
                    onClick={() => {
                      const code = `function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : null;
    if (!rawData) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "No data received" })).setMimeType(ContentService.MimeType.JSON);
    }
    var data = JSON.parse(rawData);
    var destinatario = data.email;
    var asunto = data.asunto || "LXXV Convención Nacional - Club de Leones Quetzaltenango";
    var mensajeTexto = data.mensajeBienvenida || "Gracias por comunicarte con el Club de Leones de Quetzaltenango.";
    var htmlBody = data.htmlBody || null;
    if (!destinatario) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Falta email destinatario" })).setMimeType(ContentService.MimeType.JSON);
    }
    var options = { name: "Club de Leones Quetzaltenango", replyTo: "${DEFAULT_GMAIL_SENDER}" };
    if (htmlBody) { options.htmlBody = htmlBody; }
    GmailApp.sendEmail(destinatario, asunto, mensajeTexto, options);
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Correo enviado a " + destinatario })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}`;
                      navigator.clipboard.writeText(code);
                      setIsCopiedScriptCode(true);
                      setTimeout(() => setIsCopiedScriptCode(false), 3000);
                    }}
                    className="text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    {isCopiedScriptCode ? <Check size={12} /> : <Copy size={12} />}
                    <span>{isCopiedScriptCode ? '¡Copiado!' : 'Copiar Código'}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 text-slate-300 p-3.5 rounded-b-xl text-[10px] font-mono overflow-x-auto max-h-48">
{`function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var options = { name: "Club de Leones Quetzaltenango", replyTo: "${DEFAULT_GMAIL_SENDER}" };
    if (data.htmlBody) options.htmlBody = data.htmlBody;
    GmailApp.sendEmail(data.email, data.asunto, data.mensajeBienvenida, options);
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}`}
                </pre>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowScriptGuideModal(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Historial de Comunicados del Participante */}
      {historialModalRegistro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
                  <History size={20} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-black text-slate-900">
                      Historial de Comunicados
                    </h3>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                      historialModalRegistro.estadoPago === 'Pagado'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {historialModalRegistro.estadoPago === 'Pagado' ? '✓ Pago Confirmado' : '⏳ Pago Pendiente'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-semibold mt-0.5">
                    {historialModalRegistro.nombre} · <span className="text-slate-400 font-normal">{historialModalRegistro.email}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistorialModalRegistro(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Ficha Resumen del Participante */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Club</span>
                <span className="font-bold text-slate-800 truncate block">{historialModalRegistro.club || 'No especificado'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Cargo</span>
                <span className="font-bold text-slate-800 truncate block">{historialModalRegistro.cargo || 'Socio'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Telegram</span>
                <span className="font-bold text-slate-800 truncate block">
                  {historialModalRegistro.telegramChatId ? '🟢 Conectado' : (historialModalRegistro.tieneTelegram ? '🟡 Registrado' : '⚪ No')}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Mensajes</span>
                <span className="font-bold text-indigo-700 block">
                  {historialModalRegistro.mensajesEnviados?.length || (historialModalRegistro.ultimoMensajeEnviado ? 1 : 0)} registrados
                </span>
              </div>
            </div>

            {/* Línea de tiempo o listado de mensajes enviados */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Línea de Tiempo de Envíos
              </h4>

              {(!historialModalRegistro.mensajesEnviados || historialModalRegistro.mensajesEnviados.length === 0) && !historialModalRegistro.ultimoMensajeEnviado ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                    <Send size={18} />
                  </div>
                  <p className="text-xs font-bold text-slate-600">Aún no se han enviado comunicados a este socio</p>
                  <p className="text-[11px] text-slate-400">Puedes redactar y enviarle un correo institucional con un solo clic.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {historialModalRegistro.mensajesEnviados && historialModalRegistro.mensajesEnviados.length > 0 ? (
                    historialModalRegistro.mensajesEnviados.slice().reverse().map((msg, idx) => (
                      <div key={msg.id || idx} className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 transition-colors space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-black text-slate-900">{msg.asunto}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              msg.canal === 'telegram'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {msg.canal === 'telegram' ? '✈️ Telegram' : '✉️ Gmail'}
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {new Date(msg.fecha).toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                        {msg.mensajeResumen && (
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {msg.mensajeResumen}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black text-slate-900">{historialModalRegistro.ultimoMensajeEnviado}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            historialModalRegistro.canalUltimoMensaje === 'telegram'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {historialModalRegistro.canalUltimoMensaje === 'telegram' ? '✈️ Telegram' : '✉️ Gmail'}
                          </span>
                        </div>
                        {historialModalRegistro.fechaUltimoMensaje && (
                          <span className="text-[10px] font-semibold text-slate-400">
                            {new Date(historialModalRegistro.fechaUltimoMensaje).toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setHistorialModalRegistro(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = historialModalRegistro;
                  setHistorialModalRegistro(null);
                  handleOpenEmailModal(target, target.estadoPago === 'Pagado' ? 'pago_confirmado' : 'recordatorio_pago');
                }}
                className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white font-black px-4 py-2 rounded-xl text-xs shadow cursor-pointer transition-all active:scale-95"
              >
                <Send size={13} />
                <span>Enviar Correo a este Socio</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vista Previa Personalizada de Correo para un Socio Específico */}
      {previewSampleRegistro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center font-black">
                  <Eye size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Vista Previa de Correo Personalizado
                  </h3>
                  <p className="text-xs text-slate-550 font-medium">
                    Destinatario: <strong>{previewSampleRegistro.nombre}</strong> ({previewSampleRegistro.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewSampleRegistro(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Asunto que recibirá el socio */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Asunto oficial que se enviará</span>
              <p className="font-extrabold text-slate-900">
                {gmailService.generateTemplate(broadcastTemplateTipo, previewSampleRegistro, { customSubject: broadcastSubject, customBody: broadcastBody }).asunto}
              </p>
            </div>

            {/* Render HTML real enriquecido */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-inner max-h-96 overflow-y-auto bg-slate-100 p-4">
              <div 
                dangerouslySetInnerHTML={{
                  __html: gmailService.generateTemplate(broadcastTemplateTipo, previewSampleRegistro, { customSubject: broadcastSubject, customBody: broadcastBody }).cuerpoHtml
                }}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPreviewSampleRegistro(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cerrar Vista Previa
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = previewSampleRegistro;
                  setPreviewSampleRegistro(null);
                  handleOpenEmailModal(target, broadcastTemplateTipo);
                }}
                className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white font-black px-4 py-2 rounded-xl text-xs shadow cursor-pointer transition-all active:scale-95"
              >
                <Mail size={13} />
                <span>Enviar Correo Individual a este Socio</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
