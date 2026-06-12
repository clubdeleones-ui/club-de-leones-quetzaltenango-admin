import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { firebaseService } from '../services/firebaseService';
import { PropuestaSocio } from '../types';
import { useToast } from '../context/ToastContext';
import { 
  User, 
  Briefcase, 
  Award, 
  MessageSquare, 
  Send, 
  CheckCircle, 
  Clock, 
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users
} from 'lucide-react';

export const EvaluacionCompartida: React.FC = () => {
  const { showToast } = useToast();
  const [proposals, setProposals] = useState<PropuestaSocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [comentario, setComentario] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const currentProposal = proposals[selectedIndex];
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!currentProposal || !currentProposal.fechaLimiteOpinion) {
      setTimeLeft(null);
      setIsExpired(false);
      return;
    }

    const calculateTimeLeft = () => {
      const difference = +new Date(currentProposal.fechaLimiteOpinion!) - +new Date();
      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft("Expirado");
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      setTimeLeft(parts.join(' '));
      setIsExpired(false);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [currentProposal]);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const all = await firebaseService.getProposals();
        // Filtrar sólo las que están en proceso de evaluación (Pendiente)
        const pending = all.filter(p => p.estado === 'Pendiente');
        setProposals(pending);
      } catch (err) {
        console.error("Error fetching proposals:", err);
        showToast("Error al cargar las candidaturas", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchProposals();
  }, []);

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

  const handleSendOpinion = async (e: React.FormEvent, proposal: PropuestaSocio) => {
    e.preventDefault();
    if (!comentario.trim()) return;

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

      // Update state
      setProposals(prev => prev.map(p => p.id === proposal.id ? { ...p, opiniones: updatedOpiniones } : p));
      setComentario('');
      setSubmittedId(proposal.id);
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
        <p className="mt-4 text-blue-900 font-bold animate-pulse text-sm">Cargando candidaturas en evaluación...</p>
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-blue-50 p-4 rounded-full text-blue-900 mb-4 border border-blue-150">
          <Users size={36} />
        </div>
        <h3 className="text-xl font-bold text-slate-800">No hay candidaturas pendientes</h3>
        <p className="text-slate-500 mt-2 max-w-md text-sm font-medium">
          Actualmente no hay candidaturas en proceso de evaluación que requieran opinión.
        </p>
        <Link 
          to="/"
          className="mt-6 px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl shadow-lg transition-all text-xs"
        >
          Volver al Inicio
        </Link>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/60 pb-12">
      {/* Header Branding */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🦁</span>
            <div>
              <h1 className="text-sm sm:text-base font-black text-blue-900 tracking-tight leading-none">Club de Leones</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Quetzaltenango</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black bg-blue-50 text-blue-800 px-3 py-1 rounded-full uppercase tracking-wider">
              Evaluación Colectiva
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Desktop Split Layout (Master-Detail) */}
        <div className="hidden md:grid grid-cols-12 gap-8 items-start">
          {/* Sidebar: List of candidates */}
          <div className="col-span-4 bg-white border border-slate-200/80 rounded-3xl p-4 shadow-sm space-y-3.5 sticky top-20 max-h-[80vh] overflow-y-auto">
            <h3 className="font-black text-slate-850 text-xs uppercase tracking-wider px-2 flex items-center justify-between">
              <span>Postulados</span>
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                {proposals.length}
              </span>
            </h3>
            <div className="space-y-1.5">
              {proposals.map((prop, idx) => (
                <button
                  key={prop.id}
                  onClick={() => {
                    setSelectedIndex(idx);
                    setComentario('');
                    setSubmittedId(null);
                  }}
                  className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center space-x-3 ${
                    selectedIndex === idx 
                      ? 'bg-blue-50/70 border-blue-200 shadow-sm' 
                      : 'border-transparent hover:bg-slate-50/80'
                  }`}
                >
                  <img
                    src={prop.fotoCandidato || `https://picsum.photos/seed/${prop.id}/100/100`}
                    alt={prop.nombreCandidato}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-100"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className={`font-black text-xs truncate ${selectedIndex === idx ? 'text-blue-900' : 'text-slate-800'}`}>
                      {prop.nombreCandidato}
                    </h4>
                    <p className="text-[10px] text-slate-450 truncate font-semibold">
                      {prop.profesionCandidato}
                    </p>
                  </div>
                  {prop.habilitarOpinion && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-900 shrink-0" title="Requiere opinión" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content Area (Selected Candidate details) */}
          <div className="col-span-8 space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-[2rem] p-8 shadow-sm space-y-6">
              {/* Top Meta Info */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Clock size={16} className="text-yellow-500 animate-pulse" />
                  <span className="text-xs font-black text-slate-450 uppercase tracking-widest">
                    Candidatura en Proceso de Evaluación
                  </span>
                </div>
                <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-lg">
                  Propuesto el {currentProposal.fechaPropuesta}
                </span>
              </div>

              {/* Profile details */}
              <div className="flex items-start space-x-6">
                <img
                  src={currentProposal.fotoCandidato || `https://picsum.photos/seed/${currentProposal.id}/200/200`}
                  alt={currentProposal.nombreCandidato}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-slate-50 shadow-md shrink-0"
                />
                <div className="space-y-1.5 min-w-0 flex-1 pt-2">
                  <h2 className="text-2xl font-black text-slate-900 leading-snug">
                    {currentProposal.nombreCandidato}
                  </h2>
                  <div className="flex items-center text-slate-600 text-sm font-semibold">
                    <Briefcase size={15} className="mr-2 text-slate-450" />
                    <span>{currentProposal.profesionCandidato}</span>
                  </div>
                </div>
              </div>

              {/* Family details grid */}
              <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100/80 grid grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-450 font-bold block">💍 Estado Civil</span>
                  <span className="font-extrabold text-slate-800">{currentProposal.estadoCivil || 'No indicado'}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-450 font-bold block">👶 Hijos</span>
                  <span className="font-extrabold text-slate-800">{currentProposal.hijos || 'No indicado'}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-450 font-bold block">👤 Proponente</span>
                  <span className="font-black text-blue-900 block truncate">{currentProposal.proponente}</span>
                </div>
                {currentProposal.estadoCivil === 'Casado' && currentProposal.nombreEsposa && (
                  <div className="col-span-3 pt-2.5 border-t border-slate-200/50 space-y-1">
                    <span className="text-slate-450 font-bold block">Conyugue</span>
                    <span className="font-extrabold text-slate-800 block">{currentProposal.nombreEsposa}</span>
                  </div>
                )}
              </div>

              {/* Qualities Tags */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center">
                  <Award size={14} className="mr-1.5 text-slate-400" />
                  Cualidades Destacadas
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {currentProposal.caracteristicas.map((carac, index) => (
                    <span 
                      key={index} 
                      className="bg-blue-50/50 border border-blue-100/50 text-blue-900 font-bold px-3 py-1 rounded-xl text-xs"
                    >
                      ✨ {carac}
                    </span>
                  ))}
                </div>
              </div>

              {/* Nomination texts */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-[10px] text-slate-450 uppercase tracking-widest">Motivo de Nominación</h4>
                  <p className="text-slate-700 text-xs leading-relaxed italic bg-slate-50/40 p-3.5 rounded-xl border border-slate-100/50 font-medium">
                    "{currentProposal.motivoPropuesta}"
                  </p>
                </div>
                {currentProposal.porQueBuenLeon && (
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-[10px] text-slate-450 uppercase tracking-widest">¿Por qué sería un buen León?</h4>
                    <p className="text-slate-700 text-xs leading-relaxed italic bg-slate-50/40 p-3.5 rounded-xl border border-slate-100/50 font-medium">
                      "{currentProposal.porQueBuenLeon}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Countdown Timer */}
            {timeLeft && !isExpired && currentProposal.habilitarOpinion && (
              <div className="bg-amber-50/70 border border-amber-200/50 rounded-2xl p-3.5 flex items-center justify-between text-xs text-amber-900 shadow-sm/20">
                <span className="font-bold flex items-center">
                  <Clock size={14} className="mr-1.5 text-amber-600 animate-pulse" />
                  Tiempo restante para opinar:
                </span>
                <span className="font-black bg-amber-600 text-white px-2.5 py-1 rounded-xl text-[10.5px] tracking-wider font-mono animate-pulse shadow-sm shadow-amber-600/10">
                  {timeLeft}
                </span>
              </div>
            )}

            {/* Opinion submission box */}
            <div className="bg-white border border-slate-200/80 rounded-[2rem] p-8 shadow-sm space-y-4">
              <div className="flex items-center space-x-3 text-blue-900">
                <MessageSquare size={20} className="shrink-0" />
                <h3 className="text-base font-black">Compañero León, ¿tienes opinión sobre esta candidatura?</h3>
              </div>

              {currentProposal.habilitarOpinion ? (
                isExpired ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center text-amber-800 space-y-3 animate-in fade-in duration-300">
                    <Clock size={32} className="text-amber-500 mx-auto animate-pulse" />
                    <h4 className="font-black text-sm">Tiempo Límite Expirado</h4>
                    <p className="text-xs text-amber-700 font-semibold leading-relaxed">
                      El período de consulta establecido para enviar opiniones sobre esta candidatura ha finalizado el{' '}
                      <span className="font-bold text-amber-900 bg-amber-100/60 px-2 py-0.5 rounded-md text-[11.5px]">
                        {new Date(currentProposal.fechaLimiteOpinion!).toLocaleString('es-GT', {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </span>.
                    </p>
                  </div>
                ) : submittedId === currentProposal.id ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center text-emerald-800 space-y-3 animate-in fade-in duration-300">
                    <CheckCircle size={32} className="text-emerald-500 mx-auto" />
                    <h4 className="font-black text-sm">¡Muchas gracias por tu opinión!</h4>
                    <p className="text-xs text-emerald-700 font-medium leading-relaxed">
                      Tu retroalimentación ha sido enviada de forma completamente anónima y será evaluada por el Comité de Afiliación del club.
                    </p>
                    <button 
                      onClick={() => setSubmittedId(null)}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-800 underline block mx-auto pt-2"
                    >
                      Enviar otra opinión
                    </button>
                  </div>
                ) : (
                  <form onSubmit={(e) => handleSendOpinion(e, currentProposal)} className="space-y-4">
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
                      className="bg-blue-900 hover:bg-blue-800 text-white font-black py-3 px-6 rounded-2xl shadow-lg transition-all flex items-center space-x-2 text-xs disabled:opacity-50"
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

        {/* Mobile Swipeable Gallery (One profile per page) */}
        <div className="md:hidden space-y-5">
          {/* Progress Indicator with Navigation Arrows */}
          <div className="flex items-center justify-between bg-white border border-slate-200/80 px-4 py-3 rounded-2xl shadow-sm text-xs">
            <button
              onClick={() => {
                if (selectedIndex > 0) {
                  setSelectedIndex(selectedIndex - 1);
                  setComentario('');
                  setSubmittedId(null);
                }
              }}
              disabled={selectedIndex === 0}
              className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Anterior Candidato"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center space-x-1.5 font-bold text-slate-600">
              <span>Candidato:</span>
              <span className="font-black text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg">
                {selectedIndex + 1} de {proposals.length}
              </span>
            </div>
            <button
              onClick={() => {
                if (selectedIndex < proposals.length - 1) {
                  setSelectedIndex(selectedIndex + 1);
                  setComentario('');
                  setSubmittedId(null);
                }
              }}
              disabled={selectedIndex === proposals.length - 1}
              className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Siguiente Candidato"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Countdown Timer */}
          {timeLeft && !isExpired && currentProposal.habilitarOpinion && (
            <div className="bg-amber-50/70 border border-amber-200/50 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-amber-900 shadow-sm/20">
              <span className="font-bold flex items-center">
                <Clock size={12} className="mr-1 text-amber-600 animate-pulse" />
                Tiempo restante para opinar:
              </span>
              <span className="font-black bg-amber-600 text-white px-2 py-0.5 rounded-lg text-[9.5px] tracking-wider font-mono animate-pulse shadow-sm shadow-amber-600/10">
                {timeLeft}
              </span>
            </div>
          )}

          {/* Active Candidate Card */}
          <div className="bg-white border border-slate-200/80 rounded-[2rem] p-5 shadow-sm space-y-5 relative overflow-hidden">
            {/* Header info */}
            <div className="flex items-center space-x-4">
              <img
                src={currentProposal.fotoCandidato || `https://picsum.photos/seed/${currentProposal.id}/150/150`}
                alt={currentProposal.nombreCandidato}
                className="w-16 h-16 rounded-xl object-cover border-2 border-slate-50 shadow-sm shrink-0"
              />
              <div className="space-y-0.5 min-w-0 flex-1">
                <h3 className="font-black text-lg text-slate-900 leading-snug break-words">
                  {currentProposal.nombreCandidato}
                </h3>
                <div className="flex items-center text-slate-500 text-xs font-semibold">
                  <Briefcase size={12} className="mr-1.5 text-slate-400 shrink-0" />
                  <span className="truncate">{currentProposal.profesionCandidato}</span>
                </div>
              </div>
            </div>

            {/* General Info Grid */}
            <div className="bg-slate-50/60 rounded-xl p-3 border border-slate-100/80 space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-slate-450 font-bold block">💍 Estado Civil</span>
                <span className="font-extrabold text-slate-800">{currentProposal.estadoCivil || 'No indicado'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-450 font-bold block">👶 Hijos</span>
                <span className="font-extrabold text-slate-800">{currentProposal.hijos || 'No indicado'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-450 font-bold block">👤 Proponente</span>
                <span className="font-black text-blue-900 bg-blue-50/80 px-2 py-0.5 rounded-lg text-[10px] truncate max-w-[150px]">
                  {currentProposal.proponente}
                </span>
              </div>
              {currentProposal.estadoCivil === 'Casado' && currentProposal.nombreEsposa && (
                <div className="flex justify-between items-center pt-1.5 border-t border-slate-150">
                  <span className="text-slate-450 font-bold block">Conyugue</span>
                  <span className="font-extrabold text-slate-800 truncate max-w-[150px]">{currentProposal.nombreEsposa}</span>
                </div>
              )}
            </div>

            {/* Qualities Tags */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Cualidades</h4>
              <div className="flex flex-wrap gap-1">
                {currentProposal.caracteristicas.map((carac, index) => (
                  <span 
                    key={index} 
                    className="bg-blue-50/50 border border-blue-100/50 text-blue-900 font-semibold px-2 py-0.5 rounded-lg text-[10px]"
                  >
                    ✨ {carac}
                  </span>
                ))}
              </div>
            </div>

            {/* Nomination justification text */}
            <div className="space-y-3 pt-3.5 border-t border-slate-100">
              <div>
                <h4 className="font-bold text-[9px] text-slate-400 uppercase tracking-widest">Motivo de Nominación</h4>
                <p className="text-slate-700 text-xs leading-relaxed italic bg-slate-50/30 p-2.5 rounded-lg border border-slate-100/50 font-medium">
                  "{currentProposal.motivoPropuesta}"
                </p>
              </div>
              {currentProposal.porQueBuenLeon && (
                <div>
                  <h4 className="font-bold text-[9px] text-slate-400 uppercase tracking-widest">¿Por qué sería un buen León?</h4>
                  <p className="text-slate-700 text-xs leading-relaxed italic bg-slate-50/30 p-2.5 rounded-lg border border-slate-100/50 font-medium">
                    "{currentProposal.porQueBuenLeon}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Controls (Anterior / Siguiente) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                if (selectedIndex > 0) {
                  setSelectedIndex(selectedIndex - 1);
                  setComentario('');
                  setSubmittedId(null);
                }
              }}
              disabled={selectedIndex === 0}
              className="bg-white border border-slate-200/80 font-black text-slate-700 py-3.5 px-4 rounded-2xl flex items-center justify-center space-x-1.5 active:scale-95 transition-all text-xs disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              <span>Anterior</span>
            </button>
            <button
              onClick={() => {
                if (selectedIndex < proposals.length - 1) {
                  setSelectedIndex(selectedIndex + 1);
                  setComentario('');
                  setSubmittedId(null);
                }
              }}
              disabled={selectedIndex === proposals.length - 1}
              className="bg-blue-900 text-white font-black py-3.5 px-4 rounded-2xl flex items-center justify-center space-x-1.5 active:scale-95 transition-all text-xs disabled:opacity-40 shadow-md shadow-blue-900/10"
            >
              <span>Siguiente</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Mobile Opinion submission box */}
          <div className="bg-white border border-slate-200/80 rounded-[2rem] p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-blue-900">
              <MessageSquare size={16} className="shrink-0" />
              <h3 className="text-xs font-black">Compañero León, ¿tienes opinión sobre esta candidatura?</h3>
            </div>

            {currentProposal.habilitarOpinion ? (
              isExpired ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center text-amber-800 space-y-2">
                  <Clock size={24} className="text-amber-500 mx-auto animate-pulse" />
                  <h4 className="font-black text-xs">Tiempo Límite Expirado</h4>
                  <p className="text-[10px] text-amber-700 font-semibold leading-relaxed">
                    El período de consulta establecido para enviar opiniones sobre esta candidatura ha finalizado el{' '}
                    <span className="font-bold text-amber-900 bg-amber-100/60 px-1.5 py-0.5 rounded-md text-[10px]">
                      {new Date(currentProposal.fechaLimiteOpinion!).toLocaleString('es-GT', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })}
                    </span>.
                  </p>
                </div>
              ) : submittedId === currentProposal.id ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center text-emerald-800 space-y-2.5">
                  <CheckCircle size={24} className="text-emerald-500 mx-auto" />
                  <h4 className="font-black text-xs">¡Muchas gracias por tu opinión!</h4>
                  <p className="text-[10px] text-emerald-700 font-medium leading-relaxed">
                    Tu retroalimentación ha sido enviada de forma completamente anónima y será evaluada por el Comité de Afiliación del club.
                  </p>
                  <button 
                    onClick={() => setSubmittedId(null)}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 underline block mx-auto pt-1.5"
                  >
                    Enviar otra opinión
                  </button>
                </div>
              ) : (
                <form onSubmit={(e) => handleSendOpinion(e, currentProposal)} className="space-y-3">
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                    Tu comentario es completamente confidencial y anónimo.
                  </p>
                  <div className="relative">
                    <textarea
                      rows={3}
                      required
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      placeholder="Escribe tu opinión sincera..."
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-xs font-semibold resize-none placeholder-slate-400 leading-relaxed"
                      maxLength={1000}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || !comentario.trim()}
                    className="w-full bg-blue-900 text-white font-black py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-1.5 text-xs disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Enviando opinión...</span>
                      </>
                    ) : (
                      <>
                        <Send size={12} />
                        <span>Enviar Opinión Anónima</span>
                      </>
                    )}
                  </button>
                </form>
              )
            ) : (
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 text-center text-slate-500 text-[10px] leading-relaxed">
                Esta candidatura no requiere del proceso de consulta anónima.
              </div>
            )}
          </div>

          {/* Bottom Progress Indicator with Navigation Arrows (Duplicated) */}
          <div className="flex items-center justify-between bg-white border border-slate-200/80 px-4 py-3 rounded-2xl shadow-sm text-xs">
            <button
              onClick={() => {
                if (selectedIndex > 0) {
                  setSelectedIndex(selectedIndex - 1);
                  setComentario('');
                  setSubmittedId(null);
                }
              }}
              disabled={selectedIndex === 0}
              className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Anterior Candidato"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center space-x-1.5 font-bold text-slate-600">
              <span>Candidato:</span>
              <span className="font-black text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg">
                {selectedIndex + 1} de {proposals.length}
              </span>
            </div>
            <button
              onClick={() => {
                if (selectedIndex < proposals.length - 1) {
                  setSelectedIndex(selectedIndex + 1);
                  setComentario('');
                  setSubmittedId(null);
                }
              }}
              disabled={selectedIndex === proposals.length - 1}
              className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Siguiente Candidato"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
