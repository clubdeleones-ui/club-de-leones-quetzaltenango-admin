import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { firebaseService } from '../services/firebaseService';
import { Socio } from '../types';
import { useToast } from '../context/ToastContext';
import { compressImageFile, validateImageFile } from '../utils/imageCompressor';
import { 
  User, 
  Mail, 
  Phone, 
  FileText, 
  Calendar, 
  Briefcase, 
  MapPin, 
  Plus, 
  CheckCircle, 
  Loader2,
  AlertTriangle,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export default function CompletarFichaSocio() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socio, setSocio] = useState<Socio | null>(null);
  
  // Form states
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [dpi, setDpi] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [profesion, setProfesion] = useState('');
  const [direccion, setDireccion] = useState('');
  const [foto, setFoto] = useState('');

  const [saveError, setSaveError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchSocio = async () => {
      if (!id) {
        setError('El enlace de acceso no es válido.');
        setLoading(false);
        return;
      }

      try {
        const data = await firebaseService.getSocioByIdOrEmail(id);
        if (!data) {
          setError('No se encontró la ficha de socio correspondiente. Por favor verifique el enlace.');
        } else {
          setSocio(data);
          setNombre(data.nombre || '');
          setCorreo(data.correo || '');
          setTelefono(data.telefono || '');
          setDpi(data.dpi || '');
          setFechaNacimiento(data.fechaNacimiento || '');
          setProfesion(data.profesion || '');
          setDireccion(data.direccion || '');
          setFoto(data.foto || '');
        }
      } catch (err) {
        console.error("Error fetching socio:", err);
        setError('Ocurrió un error al cargar la información. Intente de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchSocio();
  }, [id]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setSaveError(validation.error || "Imagen inválida");
      return;
    }
    try {
      const compressed = await compressImageFile(file, 400, 400, 0.7);
      setFoto(compressed);
      setSaveError(null);
    } catch (err) {
      console.error("Error compressing image:", err);
      setSaveError("No se pudo procesar la imagen.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setSaveError("El nombre es obligatorio.");
      return;
    }
    if (correo.trim() && !/\S+@\S+\.\S+/.test(correo)) {
      setSaveError("Ingrese un correo electrónico válido.");
      return;
    }

    setSubmitting(true);
    setSaveError(null);

    try {
      const updatedSocio: Socio = {
        ...socio!,
        nombre: nombre.trim(),
        correo: correo.trim(),
        telefono: telefono.trim(),
        dpi: dpi.trim(),
        fechaNacimiento: fechaNacimiento,
        profesion: profesion.trim(),
        direccion: direccion.trim(),
        foto: foto,
        fechaEdicion: new Date().toISOString(),
        editadoPor: 'Socio (Autogestión)'
      };

      await firebaseService.saveSocio(updatedSocio);
      setSuccess(true);
      showToast("¡Información actualizada con éxito!", "success");
    } catch (err: any) {
      console.error("Error saving socio autogestion:", err);
      setSaveError(err?.message || "No se pudo actualizar la información. Intente de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col items-center justify-center p-3 sm:p-6 relative overflow-hidden">
      {/* Background elegant lights */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl bg-white rounded-[1.75rem] sm:rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-500">
        {/* Top Branding Header */}
        <div className="bg-blue-900 px-6 sm:px-8 py-6 sm:py-7 text-center relative">
          <div className="absolute left-0 bottom-0 right-0 h-1.5 bg-yellow-500" />
          <h1 className="text-white text-base sm:text-lg font-black tracking-wider uppercase">
            Club de Leones de Quetzaltenango
          </h1>
          <p className="text-blue-200 text-[10px] sm:text-xs font-semibold tracking-widest uppercase mt-1">
            Actualización de Información del Socio
          </p>
        </div>

        {/* Content body */}
        <div className="p-5 sm:p-8">
          {error ? (
            <div className="text-center space-y-6 py-6">
              <div className="w-16 h-16 bg-rose-50 border border-rose-250 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <AlertCircle size={28} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800">Acceso no disponible</h3>
                <p className="text-slate-500 font-semibold text-xs leading-relaxed max-w-sm mx-auto">
                  {error}
                </p>
              </div>
              <Link
                to="/"
                className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-6 py-3.5 rounded-2xl transition-all shadow-md active:scale-95 uppercase tracking-wider"
              >
                <span>Ir al Inicio</span>
              </Link>
            </div>
          ) : success ? (
            <div className="text-center space-y-6 py-6 animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-250 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle size={28} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">¡Ficha Completada!</h3>
                <p className="text-slate-650 font-semibold text-xs leading-relaxed max-w-md mx-auto">
                  Estimado/a <span className="font-extrabold text-blue-900">{nombre}</span>, su información personal y de contacto ha sido actualizada en la base de datos del club.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 max-w-xs mx-auto">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  ¡Muchas gracias por su colaboración!
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center space-y-1.5">
                <h2 className="text-lg sm:text-xl font-black text-slate-800">
                  Completar Ficha de Socio
                </h2>
                <p className="text-slate-500 font-semibold text-xs leading-relaxed max-w-md mx-auto">
                  Complete y mantenga actualizados sus datos personales. Esta información es confidencial y de uso exclusivo del Club de Leones de Quetzaltenango.
                </p>
              </div>

              {saveError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start space-x-3 text-red-700 text-xs animate-in fade-in">
                  <AlertCircle className="flex-shrink-0 mt-0.5" size={16} />
                  <span>{saveError}</span>
                </div>
              )}

              {/* COLUMNA IZQUIERDA: DATOS PERSONALES */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100 flex items-center gap-2">
                  <User size={12} className="text-blue-900" />
                  <span>Datos Personales y de Contacto</span>
                </h3>
                
                {/* Photo row */}
                <div className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                  <div className="relative group flex-shrink-0">
                    <img 
                      src={foto || `https://picsum.photos/seed/${id}/150/150`} 
                      alt="Avatar de socio" 
                      className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 shadow-sm"
                    />
                    <label 
                      htmlFor="socio-photo-upload"
                      className="absolute bottom-0 right-0 bg-yellow-500 text-blue-900 p-1.5 rounded-full border border-white shadow-sm hover:bg-yellow-600 cursor-pointer flex items-center justify-center animate-pulse"
                      title="Cambiar foto de socio"
                    >
                      <Plus size={10} />
                      <input 
                        type="file" 
                        id="socio-photo-upload" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handlePhotoChange} 
                      />
                    </label>
                  </div>
                  <div>
                    <span className="block text-[11px] font-extrabold text-slate-800">Fotografía de Ficha</span>
                    <span className="block text-[9px] text-slate-400 font-semibold">Suba una foto clara para su carné del club</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Nombre Completo *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ej. Carlos Roberto Méndez"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Correo Electrónico</label>
                    <input 
                      type="email"
                      placeholder="carlos@gmail.com"
                      value={correo}
                      onChange={e => setCorreo(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Teléfono</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-[11px] font-semibold text-slate-400 select-none">
                        +502
                      </span>
                      <input 
                        type="text"
                        maxLength={8}
                        placeholder="55555555"
                        value={telefono.replace(/^\+502\s?/, '')}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          setTelefono(val ? `+502 ${val}` : '');
                        }}
                        className="w-full pl-11 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">DPI / Identificación</label>
                    <input 
                      type="text"
                      placeholder="2352 12345 0101"
                      value={dpi}
                      onChange={e => setDpi(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Fecha Nacimiento</label>
                    <input 
                      type="date"
                      value={fechaNacimiento}
                      onChange={e => setFechaNacimiento(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Profesión / Ocupación</label>
                  <input 
                    type="text"
                    placeholder="Ej. Ingeniero Civil"
                    value={profesion}
                    onChange={e => setProfesion(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Dirección de Residencia</label>
                  <input 
                    type="text"
                    placeholder="Ej. 12 Av. 10-55, Zona 1, Quetzaltenango"
                    value={direccion}
                    onChange={e => setDireccion(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-semibold text-slate-800 text-xs"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-black text-xs py-3.5 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-blue-900/10 active:scale-[0.98] uppercase tracking-wider"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    <span>Guardando Datos...</span>
                  </>
                ) : (
                  <>
                    <span>Guardar Mi Información</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
