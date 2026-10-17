import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { firebaseService } from '../services/firebaseService';
import { Socio, UserRole } from '../types';
import { useToast } from '../context/ToastContext';
import { compressImageFile, validateImageFile } from '../utils/imageCompressor';
import {
  Search,
  User,
  Mail,
  Phone,
  FileText,
  Calendar,
  Briefcase,
  MapPin,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  UserPlus,
  ShieldCheck,
  Sparkles,
  Lock,
  RefreshCw,
  X
} from 'lucide-react';

export default function CensoSocio() {
  const { showToast } = useToast();

  // Loading & Configuration states
  const [loading, setLoading] = useState(true);
  const [censoActivo, setCensoActivo] = useState(true);
  const [sociosList, setSociosList] = useState<Socio[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Flow step: 'search' | 'verify' | 'form' | 'success'
  const [step, setStep] = useState<'search' | 'verify' | 'form' | 'success'>('search');
  const [isNewRegistration, setIsNewRegistration] = useState(false);
  const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Lightweight security check states
  const [verificationDigits, setVerificationDigits] = useState('');
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Form states
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [dpi, setDpi] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [profesion, setProfesion] = useState('');
  const [direccion, setDireccion] = useState('');
  const [foto, setFoto] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savedDataSummary, setSavedDataSummary] = useState<Partial<Socio> | null>(null);

  // Load configuration and socios list on mount
  useEffect(() => {
    const initCenso = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const [config, socios] = await Promise.all([
          firebaseService.getCensoConfig(),
          firebaseService.getSocios()
        ]);
        setCensoActivo(config.activo);
        setSociosList(socios || []);
      } catch (err: any) {
        console.error("Error al cargar censo de socios:", err);
        setFetchError("No fue posible cargar el padrón de socios. Por favor recarga la página o verifica tu conexión a internet.");
      } finally {
        setLoading(false);
      }
    };

    initCenso();
  }, []);

  // Filter socios based on searchTerm (normalize accents and case)
  const filteredSocios = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    return sociosList.filter(socio => {
      const nombreNorm = (socio.nombre || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const correoNorm = (socio.correo || '').toLowerCase();
      const dpiNorm = (socio.dpi || '').replace(/\D/g, '');
      const telNorm = (socio.telefono || '').replace(/\D/g, '');

      return (
        nombreNorm.includes(term) ||
        correoNorm.includes(term) ||
        (dpiNorm && dpiNorm.includes(term)) ||
        (telNorm && telNorm.includes(term))
      );
    });
  }, [searchTerm, sociosList]);

  // Handle selecting an existing socio from search
  const handleSelectSocio = (socio: Socio) => {
    setSelectedSocio(socio);
    setIsNewRegistration(false);
    setVerificationDigits('');
    setVerificationError(null);

    // Prepopulate form
    setNombre(socio.nombre || '');
    setCorreo(socio.correo || '');
    setTelefono(socio.telefono || '');
    setDpi(socio.dpi || '');
    setFechaNacimiento(socio.fechaNacimiento || '');
    setProfesion(socio.profesion || '');
    setDireccion(socio.direccion || '');
    setFoto(socio.foto || '');

    // Check if security verification is applicable
    const cleanTel = (socio.telefono || '').replace(/\D/g, '');
    const cleanDpi = (socio.dpi || '').replace(/\D/g, '');
    const hasEnoughDigits = cleanTel.length >= 4 || cleanDpi.length >= 4;

    if (hasEnoughDigits) {
      setStep('verify');
    } else {
      // If no phone or DPI on record, advance directly to form
      setStep('form');
    }
  };

  // Verify lightweight digits
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSocio) return;

    const digits = verificationDigits.trim();
    if (!digits || digits.length < 4) {
      setVerificationError("Ingresa los 4 dígitos para confirmar tu identidad.");
      return;
    }

    const cleanTel = (selectedSocio.telefono || '').replace(/\D/g, '');
    const cleanDpi = (selectedSocio.dpi || '').replace(/\D/g, '');

    const last4Tel = cleanTel.length >= 4 ? cleanTel.slice(-4) : '';
    const last4Dpi = cleanDpi.length >= 4 ? cleanDpi.slice(-4) : '';

    if ((last4Tel && digits === last4Tel) || (last4Dpi && digits === last4Dpi)) {
      setVerificationError(null);
      setStep('form');
    } else {
      setVerificationError("Los dígitos ingresados no coinciden con el teléfono o DPI registrado.");
    }
  };

  // Bypass verification if user says number changed
  const handleBypassVerify = () => {
    setVerificationError(null);
    setStep('form');
  };

  // Start new registration
  const handleStartNewRegistration = () => {
    setSelectedSocio(null);
    setIsNewRegistration(true);
    setNombre(searchTerm.trim());
    setCorreo('');
    setTelefono('');
    setDpi('');
    setFechaNacimiento('');
    setProfesion('');
    setDireccion('');
    setFoto('');
    setFormError(null);
    setStep('form');
  };

  // Handle photo upload and compression
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setFormError(validation.error || "Archivo de imagen inválido");
      return;
    }

    try {
      setFormError(null);
      const compressed = await compressImageFile(file, 400, 400, 0.7);
      setFoto(compressed);
      showToast("Foto procesada y optimizada", "info");
    } catch (err) {
      console.error("Error al comprimir foto:", err);
      setFormError("No se pudo procesar la fotografía. Intenta con otra imagen.");
    }
  };

  // Submit form (Update or Create)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!nombre.trim()) {
      setFormError("El nombre completo es obligatorio.");
      return;
    }

    if (!correo.trim()) {
      setFormError("El correo electrónico es obligatorio para el registro oficial.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(correo.trim())) {
      setFormError("Por favor ingresa un correo electrónico válido (ejemplo@gmail.com).");
      return;
    }

    setSubmitting(true);

    try {
      if (isNewRegistration) {
        // Create new socio record as "Pendiente"
        const year = new Date().getFullYear();
        const newId = `socio-${Date.now()}`;
        const newSocio: Socio = {
          id: newId,
          nombre: nombre.trim(),
          correo: correo.trim().toLowerCase(),
          telefono: telefono.trim(),
          dpi: dpi.trim(),
          fechaNacimiento: fechaNacimiento,
          profesion: profesion.trim(),
          direccion: direccion.trim(),
          foto: foto || 'https://picsum.photos/seed/' + Date.now() + '/200/200',
          rol: UserRole.SOCIO,
          puesto: 'Socio en Validación',
          estadoCuotas: 'Al día',
          montoPendiente: 0,
          fechaIngreso: new Date().toISOString().split('T')[0],
          estatus: 'Pendiente', // Marcado como pendiente para validación del admin
          activo: true,
          club: 'QUETZALTENANGO',
          editadoPor: 'Socio (Censo - Nuevo Registro)',
          fechaEdicion: new Date().toISOString()
        };

        await firebaseService.saveSocio(newSocio);
        setSavedDataSummary(newSocio);
        setStep('success');
        showToast("¡Ficha registrada con éxito!", "success");
      } else {
        // Update existing socio
        const updatedSocio: Socio = {
          ...selectedSocio!,
          nombre: nombre.trim(),
          correo: correo.trim().toLowerCase(),
          telefono: telefono.trim(),
          dpi: dpi.trim(),
          fechaNacimiento: fechaNacimiento,
          profesion: profesion.trim(),
          direccion: direccion.trim(),
          foto: foto || selectedSocio?.foto || '',
          fechaEdicion: new Date().toISOString(),
          editadoPor: 'Socio (Censo - Autogestión)'
        };

        await firebaseService.saveSocio(updatedSocio);
        setSavedDataSummary(updatedSocio);
        setStep('success');
        showToast("¡Información actualizada con éxito!", "success");
      }
    } catch (err: any) {
      console.error("Error al guardar ficha:", err);
      setFormError(err?.message || "Ocurrió un error al guardar la información. Por favor intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  // Reset to search step
  const handleReset = () => {
    setStep('search');
    setSelectedSocio(null);
    setIsNewRegistration(false);
    setSearchTerm('');
    setVerificationDigits('');
    setVerificationError(null);
    setFormError(null);
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full border-4 border-yellow-500/20 border-t-yellow-500 animate-spin mb-4" />
        <h2 className="text-xl font-black text-blue-950 uppercase tracking-wider">Cargando Portal de Censo</h2>
        <p className="text-sm text-slate-500 font-semibold mt-1">Conectando con el directorio oficial del Club...</p>
      </div>
    );
  }

  // 2. Closed Censo State
  if (!censoActivo) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 sm:p-10 text-center relative overflow-hidden">
          <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-amber-600 border border-amber-200">
            <Lock size={36} />
          </div>
          <span className="inline-block px-3.5 py-1 bg-amber-100 text-amber-800 text-[11px] font-black uppercase tracking-widest rounded-full mb-3">
            Ventana Cerrada
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-blue-950 tracking-tight mb-3">
            Portal de Censo en Pausa
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed mb-8">
            La actualización pública de fichas de socios no se encuentra activa en este momento. Si necesitas actualizar tu expediente o inscribirte, por favor contacta a la <strong>Secretaría del Club de Leones de Quetzaltenango</strong>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/"
              className="flex-1 py-3 px-5 rounded-2xl bg-blue-900 text-white font-black text-xs uppercase tracking-wider hover:bg-blue-950 transition-all text-center"
            >
              Ir al Inicio
            </Link>
            <Link
              to="/login"
              className="flex-1 py-3 px-5 rounded-2xl bg-slate-100 text-slate-700 font-black text-xs uppercase tracking-wider hover:bg-slate-200 transition-all text-center"
            >
              Acceso Administrativo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Error loading data
  if (fetchError) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-3xl border border-red-200 shadow-xl p-8 text-center">
          <AlertCircle size={44} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 mb-2">Error de Conexión</h2>
          <p className="text-sm text-slate-600 mb-6">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-5 bg-blue-900 text-white font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-blue-950 transition-all flex items-center justify-center space-x-2"
          >
            <RefreshCw size={16} />
            <span>Reintentar</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 pt-2 sm:pt-6">
      {/* Container Full Bleed en Móvil / Centrado Elegante en Desktop */}
      <div className="w-full max-w-3xl mx-auto px-3 sm:px-6">

        {/* Brand Banner Header */}
        <div className="bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 text-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 shadow-xl relative overflow-hidden mb-6 border border-blue-900/60">
          <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <span className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-[10px] sm:text-xs font-black uppercase tracking-widest border border-yellow-500/30 mb-3">
              <Sparkles size={13} />
              <span>Censo Leonístico Oficial • Asambleas</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
              Club de Leones de Quetzaltenango
            </h1>
            <p className="text-xs sm:text-sm text-blue-200 font-medium max-w-xl">
              Plataforma express de actualización de datos y registro de socios. Sin contraseñas ni demoras.
            </p>
          </div>
        </div>

        {/* STEP 1: BUSCADOR DE SOCIO (PANTALLA PRINCIPAL) */}
        {step === 'search' && (
          <div className="bg-white rounded-3xl sm:rounded-[2.5rem] border border-slate-200/90 shadow-xl p-5 sm:p-8 space-y-6 animate-in fade-in duration-300">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="p-2.5 bg-blue-50 text-blue-900 rounded-2xl">
                  <Search size={22} />
                </span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-blue-950 tracking-tight">
                    Busca tu Nombre
                  </h2>
                  <p className="text-xs font-bold text-slate-500">
                    Ingresa tu nombre o apellido para localizar tu ficha en el sistema
                  </p>
                </div>
              </div>

              {/* Input de Búsqueda Prominente */}
              <div className="relative mt-4">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Escribe tu nombre o apellido (ej. Juan López, Pérez...)"
                  className="w-full pl-11 pr-10 py-3.5 sm:py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 font-bold text-base sm:text-lg focus:outline-none focus:border-yellow-500 focus:bg-white transition-all shadow-inner placeholder:text-slate-400 placeholder:font-normal"
                  autoFocus
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* Caso A: El usuario no ha escrito nada */}
            {!searchTerm.trim() && (
              <div className="space-y-6 pt-2">
                <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start space-x-3.5">
                  <span className="text-xl">💡</span>
                  <div className="text-xs sm:text-sm text-blue-950 leading-relaxed">
                    <p className="font-bold mb-1">¿No estás seguro de si ya tienes ficha?</p>
                    <p className="text-slate-600 font-medium">
                      Escribe tu nombre en la barra superior. Si ya tienes un registro previo o de prueba, podrás seleccionarte y actualizar tus datos. Si no apareces, el sistema te permitirá crear tu ficha nueva al instante.
                    </p>
                  </div>
                </div>

                {/* Botón directo de "Registrar Ficha Nueva" */}
                <div className="pt-2 text-center border-t border-slate-100">
                  <p className="text-xs text-slate-500 font-bold mb-3 uppercase tracking-wider">
                    ¿Es tu primera vez en el Club o sabes que no estás registrado?
                  </p>
                  <button
                    type="button"
                    onClick={handleStartNewRegistration}
                    className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-yellow-500 hover:text-blue-950 text-slate-800 font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-sm flex items-center justify-center space-x-2 mx-auto cursor-pointer group"
                  >
                    <UserPlus size={16} className="text-blue-900 group-hover:text-blue-950" />
                    <span>Crear mi Ficha Nueva Directamente</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* Caso B: El usuario escribió y hay coincidencias */}
            {searchTerm.trim() && filteredSocios.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Resultados encontrados ({filteredSocios.length})
                  </span>
                  <span className="text-xs text-blue-900 font-bold">
                    Toca tu nombre para continuar
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {filteredSocios.map((socio) => {
                    const hasPhoto = socio.foto && !socio.foto.includes('picsum.photos');
                    const initials = (socio.nombre || 'S')
                      .split(' ')
                      .map(p => p[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    return (
                      <div
                        key={socio.id}
                        onClick={() => handleSelectSocio(socio)}
                        className="p-3.5 sm:p-4 rounded-2xl border-2 border-slate-200 hover:border-yellow-500 hover:bg-yellow-50/40 transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99] shadow-sm"
                      >
                        <div className="flex items-center space-x-3.5 min-w-0">
                          {hasPhoto ? (
                            <img
                              src={socio.foto}
                              alt={socio.nombre}
                              className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-blue-900 text-yellow-400 font-black flex items-center justify-center text-sm border-2 border-white shadow-sm flex-shrink-0">
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-blue-950 truncate">
                              {socio.nombre}
                            </h3>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              {socio.codigoSocio && (
                                <span className="text-[10px] font-black bg-blue-100 text-blue-900 px-2 py-0.5 rounded-md">
                                  #{socio.codigoSocio}
                                </span>
                              )}
                              <span className="text-xs text-slate-500 font-medium truncate">
                                {socio.puesto || socio.profesion || 'Socio'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 text-blue-900 group-hover:text-yellow-700 font-bold text-xs flex-shrink-0 pl-2">
                          <span className="hidden sm:inline">Seleccionar</span>
                          <ArrowRight size={16} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Opción permanente si no se encuentra en la lista */}
                <div className="pt-4 mt-2 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={handleStartNewRegistration}
                    className="text-xs font-black text-blue-900 hover:text-yellow-600 transition-colors inline-flex items-center space-x-1 cursor-pointer"
                  >
                    <span>¿No te encuentras en la lista?</span>
                    <span className="underline decoration-yellow-500 decoration-2">Crear mi Ficha Nueva</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* Caso C: El usuario escribió y NO hay coincidencias */}
            {searchTerm.trim() && filteredSocios.length === 0 && (
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-300 text-center space-y-4 animate-in fade-in duration-200">
                <div className="w-14 h-14 rounded-2xl bg-yellow-100 text-yellow-700 flex items-center justify-center mx-auto">
                  <UserPlus size={28} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1">
                    No encontramos ningún socio con "{searchTerm}"
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                    Es muy probable que aún no tengas un registro previo en la plataforma. Puedes crear tu ficha oficial en este momento en menos de 2 minutos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleStartNewRegistration}
                  className="px-6 py-3.5 bg-yellow-500 hover:bg-yellow-400 text-blue-955 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-yellow-500/20 active:scale-95 transition-all inline-flex items-center space-x-2 cursor-pointer"
                >
                  <Sparkles size={16} />
                  <span>Crear Ficha Nueva con "{searchTerm}"</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: VALIDACIÓN LIGERA DE IDENTIDAD (SOLO SI SE ENCONTRÓ UN SOCIO PREEXISTENTE) */}
        {step === 'verify' && selectedSocio && (
          <div className="bg-white rounded-3xl sm:rounded-[2.5rem] border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200 max-w-lg mx-auto">
            <button
              type="button"
              onClick={() => setStep('search')}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Volver a buscar</span>
            </button>

            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-blue-100 text-blue-900 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck size={32} />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-blue-950">
                Confirmación de Identidad
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Has seleccionado a <strong>{selectedSocio.nombre}</strong>.
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Ingresa los últimos 4 dígitos de tu Teléfono o DPI:
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={verificationDigits}
                  onChange={(e) => {
                    setVerificationDigits(e.target.value.replace(/\D/g, ''));
                    setVerificationError(null);
                  }}
                  placeholder="••••"
                  className="w-36 mx-auto text-center tracking-[0.5em] text-2xl font-black py-3 bg-white border-2 border-slate-300 rounded-2xl focus:border-yellow-500 focus:outline-none transition-all shadow-inner"
                  autoFocus
                />
                {verificationError && (
                  <p className="text-xs font-bold text-red-600 mt-2 flex items-center justify-center space-x-1">
                    <AlertCircle size={14} />
                    <span>{verificationError}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-blue-900 hover:bg-blue-950 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Confirmar y Actualizar</span>
                <ArrowRight size={16} />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleBypassVerify}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline decoration-slate-300 transition-colors"
                >
                  ¿No recuerdas tus datos previos o cambiaron? Continuar de todos modos
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: FORMULARIO DE FICHA (ACTUALIZAR O CREAR NUEVA) */}
        {step === 'form' && (
          <div className="bg-white rounded-3xl sm:rounded-[2.5rem] border border-slate-200/90 shadow-xl p-5 sm:p-8 space-y-6 animate-in fade-in duration-300">
            {/* Header del formulario */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setStep('search')}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Volver al buscador</span>
              </button>

              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isNewRegistration 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {isNewRegistration ? '✨ Nueva Ficha' : `Ficha Registrada ${selectedSocio?.codigoSocio ? `#${selectedSocio.codigoSocio}` : ''}`}
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-blue-950 tracking-tight">
                {isNewRegistration ? 'Crear Ficha de Socio' : 'Actualizar mis Datos'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                {isNewRegistration 
                  ? 'Completa tu información oficial para darte de alta en el padrón del Club.'
                  : `Verifica y actualiza tus datos leonísticos, estimado León ${nombre}.`}
              </p>
            </div>

            {formError && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center space-x-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sección Fotografía */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="relative group">
                  {foto ? (
                    <img
                      src={foto}
                      alt="Foto de perfil"
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-yellow-500 shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-blue-900 text-yellow-400 font-black text-2xl flex items-center justify-center border-2 border-slate-300 shadow-md">
                      <User size={36} />
                    </div>
                  )}

                  <label className="absolute -bottom-2 -right-2 p-2 bg-yellow-500 text-blue-955 rounded-xl shadow-lg cursor-pointer hover:bg-yellow-400 transition-transform active:scale-90">
                    <Camera size={16} />
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="text-center sm:text-left flex-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                    Fotografía de Perfil
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-2">
                    Sube una foto clara de tu rostro o tómate una foto directamente desde tu teléfono.
                  </p>
                  <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-yellow-500 rounded-xl text-xs font-bold text-slate-700 cursor-pointer shadow-sm transition-all">
                    <Camera size={13} className="text-blue-900" />
                    <span>Seleccionar o tomar foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Campos del Formulario */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nombre Completo */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                    Nombre Completo <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User size={16} />
                    </div>
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Nombre y Apellidos completos"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-yellow-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Correo Electrónico */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                    Correo Electrónico <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      required
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      placeholder="ejemplo@correo.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-yellow-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Teléfono / WhatsApp */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                    Teléfono Móvil / WhatsApp
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone size={16} />
                    </div>
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="Ej. 5555-1234"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-yellow-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* DPI / Identificación */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                    DPI / Identificación Oficial
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <FileText size={16} />
                    </div>
                    <input
                      type="text"
                      value={dpi}
                      onChange={(e) => setDpi(e.target.value)}
                      placeholder="CUI / DPI (13 dígitos)"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-yellow-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Fecha de Nacimiento */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                    Fecha de Nacimiento
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Calendar size={16} />
                    </div>
                    <input
                      type="date"
                      value={fechaNacimiento}
                      onChange={(e) => setFechaNacimiento(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-yellow-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Profesión u Ocupación */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                    Profesión u Ocupación
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Briefcase size={16} />
                    </div>
                    <input
                      type="text"
                      value={profesion}
                      onChange={(e) => setProfesion(e.target.value)}
                      placeholder="Ej. Médico, Abogado, Ingeniero..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-yellow-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Dirección de Residencia */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                    Dirección de Residencia
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <MapPin size={16} />
                    </div>
                    <input
                      type="text"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Zona, Municipio, Departamento"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-yellow-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Botón de Enviar */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-4 bg-yellow-500 hover:bg-yellow-400 text-blue-955 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-yellow-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Guardando Ficha...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      <span>{isNewRegistration ? 'Guardar y Registrar Ficha' : 'Guardar y Actualizar Datos'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('search')}
                  disabled={submitting}
                  className="py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 4: PANTALLA DE ÉXITO */}
        {step === 'success' && savedDataSummary && (
          <div className="bg-white rounded-3xl sm:rounded-[2.5rem] border border-slate-200/90 shadow-2xl p-6 sm:p-10 space-y-6 text-center animate-in zoom-in-95 duration-300 max-w-xl mx-auto">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={44} />
            </div>

            <div>
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase tracking-widest rounded-full mb-2">
                {isNewRegistration ? 'Prerregistro Recibido' : 'Actualización Exitosa'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-blue-950 tracking-tight">
                ¡Muchas Gracias, León!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-2 leading-relaxed">
                {isNewRegistration
                  ? `Tu ficha a nombre de ${savedDataSummary.nombre} ha sido registrada. La Secretaría del Club revisará la solicitud para asignarte tu código oficial CLQ.`
                  : `Los datos de tu ficha han sido actualizados satisfactoriamente en la base de datos oficial del Club de Leones de Quetzaltenango.`}
              </p>
            </div>

            {/* Resumen del Socio */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left flex items-center space-x-4">
              {savedDataSummary.foto ? (
                <img
                  src={savedDataSummary.foto}
                  alt={savedDataSummary.nombre}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-yellow-500 shadow-sm flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-blue-900 text-yellow-400 font-black flex items-center justify-center text-lg flex-shrink-0">
                  <User size={24} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-black text-slate-900 truncate">
                  {savedDataSummary.nombre}
                </h4>
                <p className="text-xs text-slate-500 truncate">{savedDataSummary.correo}</p>
                {savedDataSummary.telefono && (
                  <p className="text-xs text-slate-500 truncate">Tel: {savedDataSummary.telefono}</p>
                )}
                {savedDataSummary.profesion && (
                  <p className="text-xs text-slate-500 truncate">{savedDataSummary.profesion}</p>
                )}
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-3.5 bg-blue-900 hover:bg-blue-950 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md cursor-pointer"
              >
                Hacer otra búsqueda
              </button>
              <Link
                to="/"
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs uppercase tracking-wider rounded-2xl transition-all text-center"
              >
                Ir a la Página Principal
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
