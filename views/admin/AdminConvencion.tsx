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
  Check
} from 'lucide-react';
import QRCode from 'qrcode';
import { firebaseService } from '../../services/firebaseService';
import { telegramService } from '../../services/telegramService';
import { gmailService, TipoCorreoConvencion, DEFAULT_GMAIL_SENDER, DEFAULT_GOOGLE_SCRIPT_URL } from '../../services/gmailService';
import { compressImageFile, validateImageFile, removeDarkBackgroundFromDataUrl } from '../../utils/imageCompressor';
import { ConvencionConfig, ConvencionRegistro, ConvencionActividad, ConvencionExperiencia, ConvencionAlianza } from '../../types';
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
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'registros'>('config');
  const [activeConfigTab, setActiveConfigTab] = useState<'general' | 'actividades' | 'experiencias' | 'alianzas' | 'difusion'>('general');
  
  // Mass Broadcast State
  const [broadcastSubject, setBroadcastSubject] = useState('Avances y Boletín Oficial - LXXIV Convención Lionística');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastTelegramMsg, setBroadcastTelegramMsg] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

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

  // Filtered registrations
  const filteredRegistros = registros.filter(r => {
    const term = searchTerm.toLowerCase();
    return (
      (r.nombre || '').toLowerCase().includes(term) ||
      (r.email || '').toLowerCase().includes(term) ||
      (r.dpi && r.dpi.toLowerCase().includes(term)) ||
      (r.club || '').toLowerCase().includes(term) ||
      (r.cargo || '').toLowerCase().includes(term) ||
      (r.distrito || '').toLowerCase().includes(term) ||
      (r.paquete && r.paquete.toLowerCase().includes(term)) ||
      (r.estadoPago && r.estadoPago.toLowerCase().includes(term))
    );
  });

  // Export CSV
  const handleExportCSV = () => {
    if (registros.length === 0) return;
    
    const headers = ["Nombre Completo", "DPI", "Email", "Telefono", "Club", "Cargo", "Zona", "Paquete", "Monto a Pagar (Q)", "Estado de Pago", "Fecha Registro"];
    const csvRows = [
      headers.join(','),
      ...filteredRegistros.map(r => [
        `"${(r.nombre || '').replace(/"/g, '""')}"`,
        `"${(r.dpi || '').replace(/"/g, '""')}"`,
        `"${(r.email || '').replace(/"/g, '""')}"`,
        `"${(r.telefono || '').replace(/"/g, '""')}"`,
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
      const enviados = await gmailService.sendMassBroadcast(
        registros,
        broadcastSubject,
        broadcastBody,
        config.googleScriptUrl
      );
      setSuccessMsg(`¡Boletín enviado exitosamente a los ${enviados} participantes con correo válido!`);
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
        config.telegramBotToken || undefined,
        config.telegramChatId || '',
        `📢 <b>BOLETÍN OFICIAL DE LA CONVENCIÓN</b>\n\n${broadcastTelegramMsg}`
      );
      if (ok) {
        setSuccessMsg("¡Anuncio enviado exitosamente al canal/grupo de Telegram!");
        setBroadcastTelegramMsg('');
      } else {
        setErrorMsg("No se pudo enviar por Telegram. Verifica que el Chat ID del canal o grupo esté configurado.");
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
                    <h4 className="text-sm font-black text-blue-900 uppercase tracking-wider flex items-center space-x-2">
                      <Send size={16} className="text-blue-900" />
                      <span>2. Publicar Anuncio en Canal / Grupo de Telegram</span>
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-3 py-1 rounded-full flex items-center space-x-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Bot Activo: @ConvencionLeonesbot</span>
                      </span>
                      <a
                        href="https://t.me/ConvencionLeonesbot"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-2.5 py-1 rounded-full transition-colors inline-flex items-center space-x-1"
                      >
                        <ExternalLink size={10} />
                        <span>Abrir</span>
                      </a>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800">Canal / Chat ID Destino: </span>
                        <span className="font-mono text-blue-900 font-bold">{config.telegramChatId || 'No fijado (se enviará al grupo general si está configurado)'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Token ID: 8649525379</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Mensaje para Telegram</label>
                      <textarea
                        required
                        rows={4}
                        value={broadcastTelegramMsg}
                        onChange={e => setBroadcastTelegramMsg(e.target.value)}
                        placeholder="Escribe el mensaje o aviso que se publicará en el canal o grupo de Telegram de la Convención..."
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
                            <span>Publicar Anuncio por Telegram (@ConvencionLeonesbot)</span>
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
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Pre-inscritos</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{registros.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 text-blue-900 rounded-xl flex items-center justify-center font-bold">
                  <Users size={22} />
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Total Recaudado / Confirmado</p>
                  <p className="text-2xl font-black text-emerald-700 mt-1">
                    Q{registros.filter(r => r.estadoPago === 'Pagado').reduce((acc, r) => acc + (r.montoPagar || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                  <CheckCircle size={22} />
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">Pendientes de Pago</p>
                  <p className="text-2xl font-black text-amber-700 mt-1">
                    {registros.filter(r => r.estadoPago !== 'Pagado').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
                  <Clock size={22} />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative w-full sm:max-w-md">
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por socio, DPI, email, club o estado..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-900 rounded-xl pl-10 pr-4 py-2 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 transition-all font-medium"
                />
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              </div>

              {registros.length > 0 && (
                <button
                  onClick={handleExportCSV}
                  className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <Download size={14} />
                  <span>Exportar CSV (Excel)</span>
                </button>
              )}
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
                      <div className="flex-1 min-w-0 space-y-1.5">
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

                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                            {reg.id}
                          </span>
                        </div>

                        {/* Metadatos en línea sin forzar scroll horizontal */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-medium">
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

                          {reg.telegramVerificado && (
                            <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-black">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>Bot Telegram Conectado</span>
                            </span>
                          )}

                          <span className="text-slate-400 text-[11px]">
                            📅 {new Date(reg.fechaRegistro).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Botones de Acción Rápida (Llamada, WhatsApp, Reenviar QR) */}
                      <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                        {/* Botón WhatsApp */}
                        {cleanPhone ? (
                          <a
                            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMsg)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                            title="Mandar mensaje de WhatsApp"
                          >
                            <MessageCircle size={15} className="text-emerald-600 fill-emerald-100" />
                            <span>WhatsApp</span>
                          </a>
                        ) : null}

                        {/* Botón Llamar */}
                        {reg.telefono ? (
                          <a
                            href={`tel:${reg.telefono}`}
                            className="inline-flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
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
                            className="inline-flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                            title="Enviar correo informativo vía Gmail"
                          >
                            <Mail size={14} className="text-rose-600" />
                            <span>Gmail</span>
                          </button>
                        )}

                        {/* Botón Reenviar Entrada QR */}
                        <button
                          type="button"
                          onClick={() => handleOpenQrModal(reg)}
                          className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm shadow-yellow-500/20 active:scale-95 cursor-pointer"
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

    </div>
  );
}
