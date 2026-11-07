
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Briefcase, 
  ArrowRight, 
  Loader2, 
  QrCode, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Mail, 
  User, 
  MessageCircle, 
  ExternalLink, 
  CheckCircle2, 
  Smartphone, 
  Sparkles,
  Calendar,
  Send
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Socio, UserRole } from '../types';
import { firebaseService } from '../services/firebaseService';
import { gmailService } from '../services/gmailService';

// Helpers para normalización y cotejo seguro de fecha de nacimiento
const normalizeDateDigits = (val?: string) => {
  if (!val) return null;
  const clean = val.trim();
  // Formato YYYY-MM-DD (estándar HTML5/Firestore)
  const ymdMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return { y, m, d };
  }
  // Formato DD-MM-YYYY o DD/MM/YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return { y, m, d };
  }
  // Año solo (19xx o 20xx)
  const yearMatch = clean.match(/\b(19\d{2}|20\d{2})\b/);
  if (yearMatch) {
    return { y: yearMatch[1], m: '', d: '' };
  }
  return null;
};

const isBirthdateMatching = (inputBirthdate: string, storedBirthdate?: string) => {
  if (!storedBirthdate) return false;
  const normStored = normalizeDateDigits(storedBirthdate);
  const normInput = normalizeDateDigits(inputBirthdate);

  if (!normStored || !normInput) {
    const inputDigits = inputBirthdate.replace(/\D/g, '');
    const storedDigits = storedBirthdate.replace(/\D/g, '');
    if (inputDigits.length >= 4 && storedDigits.includes(inputDigits)) return true;
    return false;
  }

  // Si ambos tienen día, mes y año completos, comparar coincidencia exacta
  if (normInput.d && normInput.m && normInput.y && normStored.d && normStored.m && normStored.y) {
    return normInput.y === normStored.y && normInput.m === normStored.m && normInput.d === normStored.d;
  }

  // Si se ingresó solo el año de nacimiento o la base solo tiene año
  return normInput.y === normStored.y;
};

const PUESTOS_LOGIN = [
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
  'Socio Regular',
  'Club Leo',
  'Donante',
  'Administrador Principal'
];

interface LoginProps {
  onLogin: (user: any, accessToken?: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loginMethod, setLoginMethod] = useState<'whatsapp' | 'cargo' | 'correo'>('whatsapp');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappBirthdate, setWhatsappBirthdate] = useState('');
  const [whatsappMode, setWhatsappMode] = useState<'phone' | 'name'>('phone');
  const [selectedWhatsappSocioId, setSelectedWhatsappSocioId] = useState('');
  const [verifiedSocio, setVerifiedSocio] = useState<Socio | null>(null);
  const [phoneNotFound, setPhoneNotFound] = useState(false);
  const [birthdateError, setBirthdateError] = useState<'fecha_incorrecta' | 'socio_sin_fecha' | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [whatsappSent, setWhatsappSent] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [emailSentTo, setEmailSentTo] = useState('');
  const [puesto, setPuesto] = useState('');
  const [selectedSocioId, setSelectedSocioId] = useState('');
  const [correoOrCodigo, setCorreoOrCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isQrLoggingIn, setIsQrLoggingIn] = useState(false);
  const [qrLoginError, setQrLoginError] = useState<string | null>(null);
  const [availablePuestos, setAvailablePuestos] = useState<string[]>(PUESTOS_LOGIN);
  const [allSocios, setAllSocios] = useState<Socio[]>([]);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchPuestos = async () => {
      try {
        const list = await firebaseService.getSocios();
        setAllSocios(list);
        
        let rolesOrderMap: Record<string, number> = {};
        try {
          const storedConfig = localStorage.getItem('club_leones_roles_config');
          if (storedConfig) {
            const parsed = JSON.parse(storedConfig);
            parsed.forEach((r: any, idx: number) => {
              rolesOrderMap[r.id] = r.orden !== undefined ? r.orden : idx;
            });
          }
        } catch (e) {
          console.error("Error parsing roles config in Login.tsx:", e);
        }

        const uniquePuestosWithRole = list.reduce((acc: { puesto: string, rol: string }[], socio) => {
          if (socio.puesto && !acc.some(item => item.puesto === socio.puesto)) {
            acc.push({ puesto: socio.puesto, rol: socio.rol || 'SOCIO' });
          }
          return acc;
        }, []);

        if (uniquePuestosWithRole.length > 0) {
          uniquePuestosWithRole.sort((a, b) => {
            const orderA = rolesOrderMap[a.rol] ?? 999;
            const orderB = rolesOrderMap[b.rol] ?? 999;
            if (orderA !== orderB) {
              return orderA - orderB;
            }
            return a.puesto.localeCompare(b.puesto);
          });
          setAvailablePuestos(uniquePuestosWithRole.map(item => item.puesto));
        }
      } catch (err) {
        console.error("Error loading dynamic login positions:", err);
      }
    };
    fetchPuestos();
  }, []);

  // Socios que coinciden con el puesto seleccionado
  const matchingSociosForPuesto = React.useMemo(() => {
    if (!puesto) return [];
    const selPuesto = puesto.toLowerCase().trim();
    return allSocios.filter(s => {
      const sPuesto = (s.puesto || '').toLowerCase().trim();
      return sPuesto === selPuesto || sPuesto.startsWith(selPuesto) || selPuesto.startsWith(sPuesto);
    });
  }, [allSocios, puesto]);

  // Socios que tienen número de teléfono registrado (ordenados alfabéticamente)
  const sociosWithPhone = React.useMemo(() => {
    return allSocios
      .filter(s => {
        const clean = (s.telefono || '').replace(/\D/g, '');
        return clean.length >= 8;
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [allSocios]);

  // Validación y Cotejo Automático de Teléfono + Fecha de Nacimiento
  useEffect(() => {
    if (loginMethod !== 'whatsapp') return;
    const phoneDigits = whatsappPhone.replace(/\D/g, '').slice(-8);
    const birthDigits = whatsappBirthdate.replace(/\D/g, '');

    if (phoneDigits.length < 8) {
      setVerifiedSocio(null);
      setPhoneNotFound(false);
      setBirthdateError(null);
      return;
    }

    const candidate = allSocios.find(s => {
      if (!s.telefono) return false;
      const sDigits = s.telefono.replace(/\D/g, '');
      const sLast8 = sDigits.length >= 8 ? sDigits.slice(-8) : sDigits;
      return sLast8 === phoneDigits;
    });

    if (!candidate) {
      setPhoneNotFound(true);
      setVerifiedSocio(null);
      setBirthdateError(null);
      return;
    }

    setPhoneNotFound(false);

    // Requiere al menos 4 dígitos para fecha/año de nacimiento
    if (birthDigits.length < 4) {
      setVerifiedSocio(null);
      setBirthdateError(null);
      return;
    }

    if (!candidate.fechaNacimiento) {
      setBirthdateError('socio_sin_fecha');
      setVerifiedSocio(null);
      return;
    }

    if (isBirthdateMatching(whatsappBirthdate, candidate.fechaNacimiento)) {
      setVerifiedSocio(candidate);
      setBirthdateError(null);
    } else {
      setVerifiedSocio(null);
      if (birthDigits.length >= 8 || birthDigits.length === 4) {
        setBirthdateError('fecha_incorrecta');
      } else {
        setBirthdateError(null);
      }
    }
  }, [whatsappPhone, whatsappBirthdate, allSocios, loginMethod]);

  const handleWhatsappPhoneChange = (val: string) => {
    setWhatsappSent(false);
    setError('');
    const digits = val.replace(/\D/g, '').slice(0, 8);
    const formatted = digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
    setWhatsappPhone(formatted);
  };

  const handleBirthdateChange = (raw: string) => {
    setWhatsappSent(false);
    setError('');
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    setWhatsappBirthdate(formatted);
  };

  const handleSelectWhatsappSocio = (socioId: string) => {
    setSelectedWhatsappSocioId(socioId);
    setWhatsappSent(false);
    setError('');
    const socio = allSocios.find(s => s.id === socioId);
    if (!socio) {
      setVerifiedSocio(null);
      return;
    }
    const clean = (socio.telefono || '').replace(/\D/g, '');
    if (clean.length >= 8) {
      const phone8 = clean.slice(-8);
      setWhatsappPhone(`${phone8.slice(0, 4)}-${phone8.slice(4)}`);
      setPhoneNotFound(false);
    } else {
      setWhatsappPhone('');
      setPhoneNotFound(true);
    }
  };

  const handleOpenWhatsAppMagicLink = async () => {
    if (!verifiedSocio) return;
    setIsGeneratingLink(true);
    setError('');
    try {
      let token = verifiedSocio.qrToken;
      if (!token) {
        token = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
        const updatedSocio = { ...verifiedSocio, qrToken: token };
        await firebaseService.saveSocio(updatedSocio);
        setAllSocios(prev => prev.map(s => s.id === updatedSocio.id ? updatedSocio : s));
        setVerifiedSocio(updatedSocio);
      }

      const cleanDigits = (verifiedSocio.telefono || whatsappPhone).replace(/\D/g, '');
      const phone8 = cleanDigits.slice(-8);

      const baseUrl = window.location.origin + window.location.pathname;
      const magicUrl = `${baseUrl}#/login?qr_token=${token}`;
      const message = `🦁 *Club de Leones Quetzaltenango*\n\nEstimado(a) C.L. *${verifiedSocio.nombre}*,\n\nEste es su enlace personal para ingresar a su cuenta:\n👉 ${magicUrl}\n\n(Al presionar el enlace azul entrará directamente sin necesidad de contraseña. Guarde este mensaje en su chat para futuros ingresos).`;
      const waUrl = `https://wa.me/502${phone8}?text=${encodeURIComponent(message)}`;

      window.open(waUrl, '_blank');
      setWhatsappSent(true);
    } catch (err) {
      console.error("Error al preparar enlace de WhatsApp:", err);
      setError("Ocurrió un error al preparar el enlace de WhatsApp. Por favor intenta de nuevo.");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleSendMagicEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const q = correoOrCodigo.trim().toLowerCase();
    if (!q) {
      setError('Por favor ingresa tu correo electrónico o código de socio.');
      return;
    }

    setIsSendingEmail(true);
    try {
      let sociosList = allSocios;
      if (sociosList.length === 0) {
        sociosList = await firebaseService.getSocios();
        setAllSocios(sociosList);
      }

      const matchingSocio = sociosList.find(s => 
        (s.correo && s.correo.trim().toLowerCase() === q) || 
        (s.codigoSocio && s.codigoSocio.trim().toLowerCase() === q)
      );

      if (!matchingSocio) {
        setError('El correo o código ingresado no coincide con ningún socio registrado en el padrón.');
        return;
      }

      if (!matchingSocio.correo || !matchingSocio.correo.includes('@')) {
        setError(`El socio ${matchingSocio.nombre} no tiene un correo válido registrado. Por favor actualiza tu correo en el Censo Digital.`);
        return;
      }

      // Asegurar que el socio tenga qrToken generado y persistido
      let token = matchingSocio.qrToken;
      if (!token) {
        token = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
        const updatedSocio = { ...matchingSocio, qrToken: token };
        await firebaseService.saveSocio(updatedSocio);
        setAllSocios(prev => prev.map(s => s.id === updatedSocio.id ? updatedSocio : s));
      }

      const baseUrl = window.location.origin + window.location.pathname;
      const magicUrl = `${baseUrl}#/login?qr_token=${token}`;

      const res = await gmailService.sendMagicLinkEmail(
        matchingSocio.correo,
        matchingSocio.nombre,
        magicUrl
      );

      if (res.ok) {
        setEmailSentTo(matchingSocio.correo);
        setEmailSentSuccess(true);
      } else {
        setError(res.message || 'Error al enviar el correo. Por favor intenta de nuevo.');
      }
    } catch (err: any) {
      console.error("Error al enviar enlace mágico por correo:", err);
      setError('Ocurrió un error al procesar el envío de correo. Por favor intenta de nuevo.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  useEffect(() => {
    const hashQuery = window.location.hash.split('?')[1];
    const searchParams = new URLSearchParams(hashQuery || window.location.search);
    const qrToken = searchParams.get('qr_token');

    if (qrToken) {
      const loginWithQrToken = async () => {
        setIsQrLoggingIn(true);
        setQrLoginError(null);
        try {
          const list = await firebaseService.getSocios();
          const matchingSocio = list.find(s => s.qrToken === qrToken);

          if (matchingSocio) {
            onLogin(matchingSocio);
            const isAdministrative = 
              matchingSocio.rol === UserRole.SUPER_ADMIN || 
              matchingSocio.rol === UserRole.TESORERO || 
              matchingSocio.rol === UserRole.SECRETARIO || 
              matchingSocio.rol === UserRole.ASESOR_SERVICIOS ||
              matchingSocio.rol === UserRole.PRESIDENTE_AFILIACION;
            if (isAdministrative) {
              navigate('/admin');
            } else {
              navigate('/dashboard');
            }
          } else {
            setQrLoginError("Código QR inválido, expirado o revocado por el administrador.");
          }
        } catch (err) {
          console.error("Error logging in via QR token:", err);
          setQrLoginError("Error de conexión al procesar el inicio de sesión QR.");
        } finally {
          setIsQrLoggingIn(false);
        }
      };
      loginWithQrToken();
    }
  }, [location.search, location.hash]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Fetch latest socios list from Firestore to get updated details
    let sociosList: Socio[] = allSocios;
    try {
      sociosList = await firebaseService.getSocios();
      setAllSocios(sociosList);
    } catch (err) {
      console.error("Error fetching socios on credentials login:", err);
    }

    let user: Socio | undefined;

    if (loginMethod === 'correo') {
      const q = correoOrCodigo.trim().toLowerCase();
      if (!q) {
        setError('Por favor ingrese su correo electrónico o código de socio.');
        return;
      }
      user = sociosList.find(s => 
        (s.correo && s.correo.toLowerCase() === q) || 
        (s.codigoSocio && s.codigoSocio.toLowerCase() === q) ||
        (s.id === q)
      );
      if (!user) {
        setError('No se encontró ningún socio con el correo o código ingresado.');
        return;
      }
    } else {
      if (!puesto) {
        setError('Por favor seleccione un cargo.');
        return;
      }
      const selPuesto = puesto.toLowerCase().trim();
      const matching = sociosList.filter(s => {
        const sPuesto = (s.puesto || '').toLowerCase().trim();
        return sPuesto === selPuesto || sPuesto.startsWith(selPuesto) || selPuesto.startsWith(sPuesto);
      });

      if (matching.length === 0) {
        setError('No se encontró ningún socio con el cargo seleccionado.');
        return;
      }

      if (matching.length > 1) {
        if (!selectedSocioId) {
          setError('Hay varios socios en este cargo. Por favor seleccione su nombre específico.');
          return;
        }
        user = matching.find(s => s.id === selectedSocioId);
      } else {
        user = matching[0];
      }
    }

    const isSuperAdminPuesto = 
      user?.puesto === 'Presidente' || 
      user?.puesto === 'Administrador Principal' ||
      user?.rol === UserRole.SUPER_ADMIN;

    const expectedPassword = user?.password || (isSuperAdminPuesto ? 'Nuevadirectiva2627!' : '123456');
    const isCorrectPassword = password === expectedPassword;

    if (user && isCorrectPassword) {
      onLogin(user);
      
      let isAdministrative = false;
      try {
        const saved = localStorage.getItem('club_leones_roles_config');
        if (saved) {
          const config = JSON.parse(saved);
          const roleDetails = config.find((r: any) => r.id === user.rol);
          if (roleDetails) {
            isAdministrative = roleDetails.allowedTabs && roleDetails.allowedTabs.length > 0;
          }
        }
      } catch (e) {
        console.error("Error reading roles config on login:", e);
      }

      if (!isAdministrative) {
        isAdministrative = 
          user.rol === UserRole.SUPER_ADMIN || 
          user.rol === UserRole.TESORERO || 
          user.rol === UserRole.SECRETARIO || 
          user.rol === UserRole.ASESOR_SERVICIOS ||
          user.rol === UserRole.PRESIDENTE_AFILIACION;
      }

      if (isAdministrative) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(
        isSuperAdminPuesto 
          ? 'Contraseña incorrecta para el cargo administrativo principal.' 
          : 'Contraseña incorrecta. Por favor verifica tus credenciales.'
      );
    }
  };

  if (isQrLoggingIn) {
    return (
      <div className="max-w-md mx-auto mt-12 mb-20 bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl p-10 border border-white/20 relative overflow-hidden text-center flex flex-col items-center justify-center py-20 space-y-6">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-900 via-yellow-500 to-blue-900" />
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-20 rounded-full" />
          <QrCode className="relative text-blue-900 animate-pulse" size={64} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-blue-900">Autenticación por QR</h2>
          <p className="text-sm text-slate-550 font-medium">Validando tus credenciales con Firestore...</p>
        </div>
        <Loader2 className="animate-spin text-blue-900 mt-4" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-1 sm:my-6 bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-7 border border-slate-200/90 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-900 via-yellow-500 to-blue-900" />

      {/* Header Compacto para Evitar Scroll en Pantallas de Móviles */}
      <div className="text-center mb-3">
        <div className="flex items-center justify-center space-x-2.5 mb-1.5">
          <img
            src="images/logo.png"
            alt="Club Logo"
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow"
          />
          <div className="text-left">
            <h2 className="text-lg sm:text-xl font-black text-blue-950 tracking-tight leading-tight">
              Acceso Socios
            </h2>
            <p className="text-[11px] text-slate-500 font-semibold leading-none">
              Club de Leones Quetzaltenango
            </p>
          </div>
        </div>

        {/* Tab switch between WhatsApp, Cargo and Correo */}
        <div className="flex bg-slate-100 p-1 rounded-xl mt-2.5 border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => { setLoginMethod('whatsapp'); setError(''); setEmailSentSuccess(false); }}
            className={`flex-1 py-1.5 px-1 font-bold rounded-lg transition-all flex items-center justify-center space-x-1 cursor-pointer ${
              loginMethod === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageCircle size={13} />
            <span>Por WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={() => { setLoginMethod('cargo'); setError(''); setEmailSentSuccess(false); }}
            className={`flex-1 py-1.5 px-1 font-bold rounded-lg transition-all flex items-center justify-center space-x-1 cursor-pointer ${
              loginMethod === 'cargo'
                ? 'bg-blue-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase size={13} />
            <span>Por Cargo</span>
          </button>
          <button
            type="button"
            onClick={() => { setLoginMethod('correo'); setError(''); setEmailSentSuccess(false); }}
            className={`flex-1 py-1.5 px-1 font-bold rounded-lg transition-all flex items-center justify-center space-x-1 cursor-pointer ${
              loginMethod === 'correo'
                ? 'bg-blue-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail size={13} />
            <span>Por Correo</span>
          </button>
        </div>
      </div>

      {qrLoginError && (
        <div className="bg-red-50 text-red-700 p-2.5 rounded-xl text-xs mb-3 border border-red-100 font-semibold flex items-start space-x-2 animate-in fade-in">
          <AlertCircle className="flex-shrink-0 mt-0.5 text-red-500" size={14} />
          <span>{qrLoginError}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-2.5 rounded-xl text-xs mb-3 border border-red-100 flex items-start space-x-2">
          <AlertCircle className="flex-shrink-0 mt-0.5 text-red-500" size={14} />
          <span>{error}</span>
        </div>
      )}

      {loginMethod === 'whatsapp' ? (
        <div className="space-y-3 animate-in fade-in duration-200">
          {/* Subheader / Selector de Modo */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {whatsappMode === 'phone' ? 'Identificación por Celular' : 'Buscar por Nombre'}
            </span>
            <button
              type="button"
              onClick={() => {
                setWhatsappMode(whatsappMode === 'phone' ? 'name' : 'phone');
                setVerifiedSocio(null);
                setPhoneNotFound(false);
                setBirthdateError(null);
                setWhatsappSent(false);
                setError('');
              }}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center space-x-1 cursor-pointer"
            >
              {whatsappMode === 'phone' ? (
                <>
                  <User size={11} />
                  <span>¿Buscar mi nombre?</span>
                </>
              ) : (
                <>
                  <Smartphone size={11} />
                  <span>¿Escribir mi celular?</span>
                </>
              )}
            </button>
          </div>

          {/* Campo 1: Teléfono o Nombre */}
          {whatsappMode === 'phone' ? (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                1. Número de Celular / WhatsApp
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center space-x-1 text-slate-500 font-bold text-xs pointer-events-none">
                  <span>🇬🇹</span>
                  <span>+502</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={whatsappPhone}
                  onChange={(e) => handleWhatsappPhoneChange(e.target.value)}
                  maxLength={9}
                  placeholder="5555-1234"
                  className="w-full pl-20 pr-3 py-2 border-2 border-slate-200 focus:border-emerald-500 rounded-xl outline-none transition-all text-base font-bold text-slate-800 tracking-wider shadow-sm bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                1. Selecciona tu Nombre
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <select
                  value={selectedWhatsappSocioId}
                  onChange={(e) => handleSelectWhatsappSocio(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 border-2 border-slate-200 focus:border-emerald-500 rounded-xl outline-none transition-all bg-white text-slate-800 text-xs font-bold appearance-none cursor-pointer"
                >
                  <option value="" disabled>Selecciona tu nombre...</option>
                  {sociosWithPhone.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} ({s.puesto || 'Socio'})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  <span className="text-xs">▼</span>
                </div>
              </div>
            </div>
          )}

          {/* Campo 2: Fecha de Nacimiento (Factor de Seguridad Personal) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
                <span>2. Fecha de Nacimiento</span>
                <span className="text-[10px] text-amber-600 font-semibold">(Seguridad)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">DD/MM/AAAA</span>
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                inputMode="numeric"
                value={whatsappBirthdate}
                onChange={(e) => handleBirthdateChange(e.target.value)}
                maxLength={10}
                placeholder="Ej. 15/08/1954"
                className="w-full pl-9 pr-3 py-2 border-2 border-slate-200 focus:border-emerald-500 rounded-xl outline-none transition-all text-base font-bold text-slate-800 tracking-wider shadow-sm bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          {/* Estado de Error: Número no registrado */}
          {phoneNotFound && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center space-y-1.5 animate-in fade-in">
              <p className="text-xs text-amber-900 font-bold">
                Número no registrado en el padrón
              </p>
              <p className="text-[11px] text-slate-600 leading-tight">
                Si aún no has registrado tu número, actualiza tu ficha en el Censo:
              </p>
              <button
                type="button"
                onClick={() => navigate('/censo')}
                className="py-1.5 px-3 bg-yellow-500 hover:bg-yellow-400 text-blue-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-all inline-flex items-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <span>Ir al Censo Digital</span>
                <ArrowRight size={12} />
              </button>
            </div>
          )}

          {/* Estado de Error: Socio sin fecha registrada en base de datos */}
          {birthdateError === 'socio_sin_fecha' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center space-y-1.5 animate-in fade-in">
              <p className="text-xs text-amber-900 font-bold">
                Tu ficha aún no tiene fecha de nacimiento
              </p>
              <p className="text-[11px] text-slate-600 leading-tight">
                Para proteger tu cuenta, completa tu fecha en el Censo Digital:
              </p>
              <button
                type="button"
                onClick={() => navigate('/censo')}
                className="py-1.5 px-3 bg-yellow-500 hover:bg-yellow-400 text-blue-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-all inline-flex items-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <span>Actualizar en el Censo</span>
                <ArrowRight size={12} />
              </button>
            </div>
          )}

          {/* Estado de Error: Fecha no coincide */}
          {birthdateError === 'fecha_incorrecta' && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-2.5 text-center text-xs font-semibold animate-in fade-in flex items-center justify-center space-x-1.5">
              <AlertCircle size={14} className="shrink-0 text-red-500" />
              <span>La fecha de nacimiento no coincide con los registros.</span>
            </div>
          )}

          {/* Socio Verificado con éxito (Ambos datos coincidieron) */}
          {verifiedSocio && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center space-y-2.5 animate-in fade-in duration-200">
              {/* Tarjeta compacta del socio */}
              <div className="flex items-center space-x-2.5 text-left bg-white p-2 rounded-lg border border-emerald-100 shadow-xs">
                {verifiedSocio.foto ? (
                  <img
                    src={verifiedSocio.foto}
                    alt={verifiedSocio.nombre}
                    className="w-9 h-9 rounded-lg object-cover border border-emerald-200 shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center text-sm shrink-0">
                    {verifiedSocio.nombre.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                    ✓ Identidad Verificada
                  </span>
                  <h4 className="text-xs font-black text-slate-900 truncate leading-tight">
                    {verifiedSocio.nombre}
                  </h4>
                  <p className="text-[10px] text-slate-500 truncate">
                    {verifiedSocio.puesto || 'Socio Regular'}
                  </p>
                </div>
              </div>

              {/* Botón Principal de WhatsApp */}
              <button
                type="button"
                onClick={handleOpenWhatsAppMagicLink}
                disabled={isGeneratingLink}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingLink ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Preparando enlace...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle size={16} />
                    <span>Abrir mi WhatsApp y Enviar mi Enlace</span>
                    <ExternalLink size={14} />
                  </>
                )}
              </button>

              <p className="text-[10px] text-emerald-800 font-medium leading-tight">
                ℹ️ Al abrir WhatsApp, presiona <strong>"Enviar"</strong> y toca el <strong>enlace azul</strong> en tu chat.
              </p>

              {whatsappSent && (
                <div className="p-2 bg-emerald-100 text-emerald-900 rounded-lg text-[11px] font-bold border border-emerald-300 flex items-center justify-center space-x-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span>¡Listo! Toca el enlace azul en tu WhatsApp para entrar.</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : loginMethod === 'correo' ? (
        emailSentSuccess ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center space-y-2.5 animate-in fade-in duration-200">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                ¡Enlace de Acceso Enviado!
              </h4>
              <p className="text-xs text-emerald-850 font-medium mt-1 leading-relaxed">
                Hemos enviado tu enlace directo sin contraseña a:
                <br />
                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-emerald-200 inline-block mt-1">
                  {emailSentTo}
                </span>
              </p>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Revisa tu bandeja de entrada (o carpeta de spam) y toca el enlace para entrar de inmediato a tu cuenta.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setEmailSentSuccess(false);
                  setCorreoOrCodigo('');
                  setError('');
                }}
                className="text-xs text-blue-900 font-bold underline hover:text-blue-950 cursor-pointer"
              >
                Enviar a otro correo o código
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendMagicEmail} className="space-y-3 animate-in fade-in duration-200">
            <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-2.5 text-center">
              <div className="inline-flex items-center space-x-1 text-blue-900 font-bold text-[11px] mb-0.5">
                <Sparkles size={12} className="text-blue-600" />
                <span>Acceso por Correo Sin Contraseña</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-tight font-medium">
                Escribe tu correo o código CLQ y te enviaremos tu enlace de acceso directo.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Correo Electrónico o Código CLQ
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  value={correoOrCodigo}
                  onChange={(e) => setCorreoOrCodigo(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl outline-none transition-all text-xs font-semibold text-slate-800 bg-slate-50"
                  placeholder="ej. socio@leonesxela.com o CLQ-2026-001"
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSendingEmail}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-black py-2.5 text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-900/20 active:scale-98 flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 mt-1"
            >
              {isSendingEmail ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Enviando enlace a tu correo...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Enviar Enlace de Acceso a mi Correo</span>
                </>
              )}
            </button>
          </form>
        )
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 animate-in fade-in duration-200">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Cargo Administrativo
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <select
                value={puesto}
                onChange={(e) => {
                  setPuesto(e.target.value);
                  setSelectedSocioId('');
                }}
                className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white text-slate-800 text-xs font-semibold appearance-none cursor-pointer"
                required
              >
                <option value="" disabled>Seleccione su cargo...</option>
                {availablePuestos.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <span className="text-xs">▼</span>
              </div>
            </div>
          </div>

          {matchingSociosForPuesto.length > 1 && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Seleccione su Nombre
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <select
                  value={selectedSocioId}
                  onChange={(e) => setSelectedSocioId(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 border border-blue-200 bg-blue-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-800 text-xs font-semibold appearance-none cursor-pointer"
                  required
                >
                  <option value="" disabled>¿Quién eres?</option>
                  {matchingSociosForPuesto.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} {s.codigoSocio ? `(${s.codigoSocio})` : ''}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  <span className="text-xs">▼</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2 p-0.5 text-slate-400 hover:text-blue-900 transition-colors bg-white rounded-full focus:outline-none cursor-pointer"
                title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-black py-2.5 text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-900/20 active:scale-98 flex items-center justify-center space-x-1.5 cursor-pointer mt-1"
          >
            <span>Ingresar ahora</span>
            <ArrowRight size={14} />
          </button>
        </form>
      )}
    </div>
  );
};

export default Login;
