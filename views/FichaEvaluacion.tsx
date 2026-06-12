import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { firebaseService } from '../services/firebaseService';
import { PropuestaSocio } from '../types';
import { useToast } from '../context/ToastContext';
import { 
  User, 
  Briefcase, 
  Calendar, 
  Award, 
  MessageSquare, 
  Send, 
  CheckCircle, 
  Users, 
  Clock, 
  Heart,
  ChevronLeft
} from 'lucide-react';

export const FichaEvaluacion: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [proposal, setProposal] = useState<PropuestaSocio | null>(null);
  const [loading, setLoading] = useState(true);
  const [comentario, setComentario] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchProposal = async () => {
      if (!id) return;
      try {
        const data = await firebaseService.getProposalById(id);
        if (data) {
          setProposal(data);
        }
      } catch (err) {
        console.error("Error fetching proposal:", err);
        showToast("Error al cargar la ficha del candidato", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchProposal();
  }, [id]);

  const obtenerMetadatosTecnicos = () => {
    const ua = navigator.userAgent;
    
    let os = "Desconocido";
    if (ua.indexOf("Win") !== -1) os = "Windows";
    else if (ua.indexOf("Mac") !== -1) os = "macOS";
    else if (ua.indexOf("Linux") !== -1) os = "Linux";
    else if (ua.indexOf("Android") !== -1) os = "Android";
    else if (ua.indexOf("like Mac") !== -1) os = "iOS";

    let browser = "Desconocido";
    if (ua.indexOf("Chrome") !== -1) browser = "Chrome";
    else if (ua.indexOf("Safari") !== -1) browser = "Safari";
    else if (ua.indexOf("Firefox") !== -1) browser = "Firefox";
    else if (ua.indexOf("MSIE") !== -1 || !!(document as any).documentMode) browser = "IE";
    else if (ua.indexOf("Edge") !== -1) browser = "Edge";

    let device = "Escritorio";
    if (/Mobi|Android|iPhone/i.test(ua)) {
      device = "Móvil";
    } else if (/Tablet|iPad/i.test(ua)) {
      device = "Tablet";
    }

    return {
      navegador: browser,
      sistemaOperativo: os,
      dispositivo: device,
      idioma: navigator.language || "es",
      resolucion: `${window.screen.width}x${window.screen.height}`,
      zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Guatemala"
    };
  };

  const handleSubmitOpinion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposal || !comentario.trim()) return;

    setSubmitting(true);
    try {
      const newOpinion = {
        id: `op-${Date.now()}`,
        fecha: new Date().toLocaleDateString('es-GT', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        comentario: comentario.trim(),
        metadatos: obtenerMetadatosTecnicos()
      };

      const updatedOpiniones = [...(proposal.opiniones || []), newOpinion];

      await firebaseService.updateProposal(proposal.id, {
        opiniones: updatedOpiniones
      });

      // Update local state
      setProposal({
        ...proposal,
        opiniones: updatedOpiniones
      });

      setComentario('');
      setSubmitted(true);
      showToast("Su opinión ha sido enviada de forma anónima", "success");
    } catch (err) {
      console.error("Error submitting opinion:", err);
      showToast("No se pudo enviar la opinión. Intente de nuevo.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin shadow-lg"></div>
        <p className="mt-4 text-blue-900 font-bold animate-pulse text-sm">Cargando ficha de evaluación...</p>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-50 p-4 rounded-full text-red-500 mb-4 border border-red-150">
          <User size={36} />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Candidatura no encontrada</h3>
        <p className="text-slate-500 mt-2 max-w-md text-sm font-medium">
          El enlace al que intenta acceder no es válido, o la candidatura ha sido retirada del sistema.
        </p>
        <Link 
          to="/"
          className="mt-6 px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl shadow-lg transition-all text-xs flex items-center space-x-1.5"
        >
          <ChevronLeft size={16} />
          <span>Volver al Inicio</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/60 pb-16">
      {/* Top branding bar */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-sm">
        <div className="max-w-xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xl">🦁</span>
            <div>
              <h1 className="text-sm font-black text-blue-900 tracking-tight leading-none">Club de Leones</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Quetzaltenango</p>
            </div>
          </div>
          <span className="text-[9px] font-black bg-blue-50 text-blue-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Evaluación
          </span>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-6 space-y-6">
        {/* Candidate Profile Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden relative">
          {/* Top Status Header */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Clock size={15} className="text-yellow-400 animate-pulse" />
              <span className="text-[10px] font-black tracking-widest uppercase text-slate-200">
                Ficha en Evaluación
              </span>
            </div>
            <span className="text-[9px] font-black bg-white/20 text-white px-2.5 py-0.5 rounded-full uppercase">
              {proposal.fechaPropuesta}
            </span>
          </div>

          <div className="p-5 sm:p-6 space-y-6">
            {/* Candidate Header */}
            <div className="flex items-start space-x-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-150 border-4 border-slate-50 shadow-md shrink-0">
                <img 
                  src={proposal.fotoCandidato || `https://picsum.photos/seed/${proposal.id}/200/200`} 
                  alt={proposal.nombreCandidato} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="space-y-1 pt-1 min-w-0 flex-1">
                <h2 className="text-xl font-black text-slate-900 leading-snug break-words">
                  {proposal.nombreCandidato}
                </h2>
                <div className="flex items-center text-slate-600 text-xs font-semibold">
                  <Briefcase size={13} className="mr-1.5 text-slate-450 shrink-0" />
                  <span className="break-words">{proposal.profesionCandidato}</span>
                </div>
              </div>
            </div>

            {/* General Info Grid */}
            <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100/80 space-y-3">
              <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-200/50">
                <span className="text-slate-450 font-bold flex items-center">
                  <span className="mr-1.5">💍</span> Estado Civil
                </span>
                <span className="font-extrabold text-slate-800">{proposal.estadoCivil || 'No indicado'}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-200/50">
                <span className="text-slate-450 font-bold flex items-center">
                  <span className="mr-1.5">👶</span> Hijos
                </span>
                <span className="font-extrabold text-slate-800">{proposal.hijos || 'No indicado'}</span>
              </div>
              {proposal.estadoCivil === 'Casado' && proposal.nombreEsposa && (
                <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-200/50">
                  <span className="text-slate-450 font-bold flex items-center">
                    <span className="mr-1.5">💑</span> Cónyuge
                  </span>
                  <span className="font-extrabold text-slate-800 break-words max-w-[200px] text-right">{proposal.nombreEsposa}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-slate-450 font-bold flex items-center">
                  <span className="mr-1.5">👤</span> Proponente
                </span>
                <span className="font-black text-blue-900 bg-blue-50/80 px-2.5 py-0.5 rounded-lg text-[11px] truncate max-w-[200px]">
                  {proposal.proponente}
                </span>
              </div>
            </div>

            {/* Qualities Tags */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center">
                <Award size={13} className="mr-1.5 text-slate-400" />
                Cualidades Destacadas
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {proposal.caracteristicas.map((carac, index) => (
                  <span 
                    key={index} 
                    className="bg-blue-50/50 border border-blue-100/50 text-blue-900 font-bold px-2.5 py-1 rounded-lg text-xs"
                  >
                    ✨ {carac}
                  </span>
                ))}
              </div>
            </div>

            {/* Nominations justifications */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="space-y-1">
                <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest">Motivo de Nominación</h4>
                <p className="text-slate-700 text-xs leading-relaxed italic bg-slate-50/40 p-3 rounded-xl border border-slate-100/50 font-medium text-justify">
                  "{proposal.motivoPropuesta}"
                </p>
              </div>
              {proposal.porQueBuenLeon && (
                <div className="space-y-1">
                  <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest">¿Por qué sería un buen León?</h4>
                  <p className="text-slate-700 text-xs leading-relaxed italic bg-slate-50/40 p-3 rounded-xl border border-slate-100/50 font-medium text-justify">
                    "{proposal.porQueBuenLeon}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Opinions Submission Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-5 sm:p-6 space-y-4">
          <div className="flex items-center space-x-3 text-blue-900">
            <MessageSquare size={20} className="shrink-0" />
            <h3 className="text-base font-black">Compañero León, ¿tienes opinión sobre esta candidatura?</h3>
          </div>

          {proposal.habilitarOpinion ? (
            submitted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center text-emerald-800 space-y-3 animate-in fade-in duration-300">
                <CheckCircle size={32} className="text-emerald-500 mx-auto" />
                <h4 className="font-black text-sm">¡Muchas gracias por tu opinión!</h4>
                <p className="text-xs text-emerald-700 font-medium leading-relaxed">
                  Tu retroalimentación ha sido enviada de forma completamente anónima y será evaluada por el Comité de Afiliación del club.
                </p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-800 underline block mx-auto pt-2"
                >
                  Enviar otra opinión
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitOpinion} className="space-y-4">
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Tus comentarios o referencias sobre la idoneidad, valores, o trayectoria del candidato ayudarán a robustecer la decisión del Comité de Ingreso. Esta opinión es confidencial y anónima.
                </p>
                <div className="relative">
                  <textarea
                    rows={4}
                    required
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder="Escribe aquí tu opinión sincera..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-xs font-semibold resize-none placeholder-slate-400 leading-relaxed"
                    maxLength={1000}
                  />
                  <div className="absolute bottom-3 right-3 text-[10px] text-slate-400 font-bold">
                    {comentario.length}/1000
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting || !comentario.trim()}
                  className="w-full bg-blue-900 hover:bg-blue-800 text-white font-black py-3 px-4 rounded-2xl shadow-lg shadow-blue-900/10 transition-all flex items-center justify-center space-x-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Enviando opinión...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Enviar Opinión Anónima</span>
                    </>
                  )}
                </button>
              </form>
            )
          ) : (
            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 text-center text-slate-500 space-y-2">
              <Clock size={24} className="text-slate-400 mx-auto" />
              <h4 className="font-bold text-xs">Opiniones no habilitadas</h4>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                Esta candidatura no requiere del proceso de consulta anónima (por ser familiar directo de socios activos u otro motivo protocolario).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
