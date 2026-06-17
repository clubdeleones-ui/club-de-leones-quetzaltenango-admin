import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { firebaseService } from '../services/firebaseService';
import { PropuestaSocio } from '../types';
import { 
  CheckCircle2, 
  Phone, 
  User, 
  Clock, 
  ArrowRight, 
  AlertCircle, 
  Info,
  Calendar,
  MapPin
} from 'lucide-react';

export default function ConfirmarInvitacion() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [propuesta, setPropuesta] = useState<PropuestaSocio | null>(null);
  const [telefono, setTelefono] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchPropuesta = async () => {
      if (!id) {
        setError('El enlace de confirmación no es válido.');
        setLoading(false);
        return;
      }

      try {
        const data = await firebaseService.getProposalById(id);
        if (!data) {
          setError('No se encontró la invitación solicitada. Por favor verifique el enlace.');
        } else if (data.estado !== 'Aprobado') {
          setError('Esta candidatura aún está en proceso de revisión por el comité.');
        } else {
          setPropuesta(data);
          if (data.invitacionConfirmada) {
            setSuccess(true);
            setTelefono(data.telefonoConfirmacionCandidato || '');
          }
        }
      } catch (err) {
        console.error("Error fetching proposal:", err);
        setError('Ocurrió un error al cargar la información. Intente de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchPropuesta();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telefono.trim()) {
      alert('Por favor ingrese un número de teléfono válido.');
      return;
    }

    setSubmitting(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await firebaseService.updateProposal(id!, {
        invitacionConfirmada: true,
        telefonoConfirmacionCandidato: telefono.trim(),
        fechaConfirmacionInvitacion: todayStr
      });
      setSuccess(true);
    } catch (err) {
      console.error("Error confirming RSVP:", err);
      alert('No se pudo guardar la confirmación en este momento.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/50 p-4">
        <div className="w-16 h-16 border-4 border-blue-900 border-t-transparent rounded-full animate-spin shadow-lg mb-4"></div>
        <p className="text-blue-900 font-extrabold text-sm uppercase tracking-wider animate-pulse">
          Validando Invitación...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col items-center justify-center p-3 sm:p-6 relative overflow-hidden">
      {/* Background elegant lights */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg bg-white rounded-[1.75rem] sm:rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-500">
        {/* Top Branding Header */}
        <div className="bg-blue-900 px-6 sm:px-8 py-6 sm:py-7 text-center relative">
          <div className="absolute left-0 bottom-0 right-0 h-1.5 bg-yellow-500" />
          <img 
            src="images/logo.png" 
            alt="Logo Club de Leones" 
            className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 bg-white p-2 rounded-full shadow-lg border border-slate-150"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <h1 className="text-white text-base sm:text-lg font-black tracking-wider uppercase">
            Club de Leones de Quetzaltenango
          </h1>
          <p className="text-blue-200 text-[10px] sm:text-xs font-semibold tracking-widest uppercase mt-1">
            Nosotros Servimos
          </p>
        </div>

        {/* Content body */}
        <div className="p-5 sm:p-10">
          {error ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-rose-50 border border-rose-250 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <AlertCircle size={28} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800">Invitación no disponible</h3>
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
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-250 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm animate-bounce">
                <CheckCircle2 size={28} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">¡Asistencia Confirmada!</h3>
                <p className="text-slate-600 font-semibold text-xs leading-relaxed max-w-md mx-auto">
                  Estimado/a <span className="font-extrabold text-blue-900">{propuesta?.nombreCandidato}</span>, su participación en la charla informativa ha sido registrada con éxito.
                </p>
              </div>

              {/* Confirmation Details Card */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-left space-y-3.5 shadow-inner">
                <div className="flex items-center space-x-3 text-slate-700">
                  <div className="p-2 bg-white rounded-xl text-blue-900 shadow-sm border border-slate-150">
                    <Phone size={15} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teléfono de Contacto</div>
                    <div className="text-xs font-extrabold text-slate-800">{telefono}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-slate-700">
                  <div className="p-2 bg-white rounded-xl text-blue-900 shadow-sm border border-slate-150">
                    <Calendar size={15} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evento de Voluntariado</div>
                    <div className="text-xs font-extrabold text-slate-800">Charla informativa sobre el Club de Leones</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-slate-700">
                  <div className="p-2 bg-white rounded-xl text-blue-900 shadow-sm border border-slate-150">
                    <MapPin size={15} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lugar</div>
                    <div className="text-xs font-extrabold text-slate-800">Sede del Club de Leones de Quetzaltenango</div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  ¡Le esperamos cordialmente!
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-block px-3 py-1 bg-blue-50 text-blue-900 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                  Confirmación de Asistencia
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 leading-snug">
                  Invitación de Ingreso
                </h2>
                <p className="text-slate-500 font-semibold text-xs leading-relaxed max-w-sm mx-auto">
                  Es un honor extenderle una cordial invitación para formar parte de nuestro prestigioso Club de Leones.
                </p>
              </div>

              {/* Welcoming info box */}
              <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-5 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-blue-150 flex items-center justify-center text-blue-900 shadow-sm">
                    <User size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Candidato(a) Nominado(a)</div>
                    <div className="text-sm font-black text-blue-900">{propuesta?.nombreCandidato}</div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                  Agradecemos confirmar su asistencia a la próxima charla de inducción de nuevos socios completando este formulario.
                </div>
              </div>

              {/* Phone Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Número Telefónico o WhatsApp *
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone size={16} />
                  </div>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej. +502 5691 1935"
                    className="w-full pl-10 pr-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700 bg-white"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Utilizaremos este número exclusivamente para ponernos en contacto y coordinar el evento.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs py-4.5 rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-600/10 active:scale-[0.98] uppercase tracking-wider"
              >
                <span>{submitting ? 'Confirmando...' : 'Confirmar Mi Asistencia'}</span>
                <ArrowRight size={14} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
