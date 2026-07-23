import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FileText, 
  Calendar, 
  Clock, 
  Building, 
  User, 
  Download, 
  Printer, 
  Share2, 
  Copy, 
  Check, 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  Users,
  CheckCircle2
} from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { ReunionAgenda } from '../types';
import { useToast } from '../context/ToastContext';

export const AgendaPublica: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [agenda, setAgenda] = useState<ReunionAgenda | null>(() => {
    if (!id) return null;
    try {
      // Instant cache lookup for 0ms initial render
      const cachedSingle = localStorage.getItem(`club_leones_agenda_public_${id}`);
      if (cachedSingle) return JSON.parse(cachedSingle);

      const cachedList = localStorage.getItem('club_leones_reunion_agendas');
      if (cachedList) {
        const list: ReunionAgenda[] = JSON.parse(cachedList);
        const found = list.find(a => a.id === id);
        if (found) return found;
      }
    } catch (e) {}
    return null;
  });

  const [loading, setLoading] = useState(!agenda);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchAgenda = async () => {
      try {
        const data = await firebaseService.getAgendaById(id);
        if (data && isMounted) {
          setAgenda(data);
          try {
            localStorage.setItem(`club_leones_agenda_public_${id}`, JSON.stringify(data));
          } catch (e) {}
        }
      } catch (err) {
        console.error("Error al cargar la agenda pública:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAgenda();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleCopyLink = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    showToast("Enlace de la agenda copiado al portapapeles", "success");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    if (!agenda) return;
    const shareUrl = window.location.href;
    const text = encodeURIComponent(
      `🏛️ *Club de Leones Quetzaltenango*\n` +
      `📌 *Agenda de Reunión:* ${agenda.titulo}\n` +
      `📅 *Fecha:* ${agenda.fecha} - ${agenda.hora}\n` +
      `📍 *Lugar:* ${agenda.lugar}\n\n` +
      `Consulte el orden del día digital aquí:\n${shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleDownloadPDF = async () => {
    if (!agenda) return;
    setDownloading(true);
    try {
      const { generateAgendaPDF } = await import('../utils/pdfGenerator');
      await generateAgendaPDF(agenda, 'download');
      showToast("PDF de la agenda generado exitosamente", "success");
    } catch (err) {
      console.error("Error al generar PDF de agenda:", err);
      showToast("Ocurrió un error al generar el PDF", "error");
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenPDF = async () => {
    if (!agenda) return;
    try {
      const { generateAgendaPDF } = await import('../utils/pdfGenerator');
      await generateAgendaPDF(agenda, 'open');
    } catch (err) {
      console.error("Error al abrir PDF de agenda:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-14 h-14 border-4 border-blue-900 border-t-transparent rounded-full animate-spin shadow-lg" />
        <p className="text-sm font-bold text-blue-900 animate-pulse">Cargando Agenda Digital de la Sesión...</p>
      </div>
    );
  }

  if (!agenda) {
    return (
      <div className="max-w-2xl mx-auto my-16 px-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-800">Agenda no encontrada</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            La agenda de reunión solicitada no existe o el enlace ha sido revocado. Verifique la URL o consulte la secretaría del club.
          </p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-900 text-white text-xs font-black rounded-xl hover:bg-blue-950 transition-all shadow-md"
          >
            <ArrowLeft size={16} />
            <span>Volver a la Página Principal</span>
          </Link>
        </div>
      </div>
    );
  }

  const categoryLabels: Record<string, { label: string; badgeClass: string }> = {
    ordinaria: { label: '📝 Sesión Ordinaria', badgeClass: 'bg-blue-100 text-blue-900 border-blue-200' },
    extraordinaria: { label: '⚡ Sesión Extraordinaria', badgeClass: 'bg-amber-100 text-amber-900 border-amber-200' },
    protocolaria: { label: '🍷 Acto Protocolario', badgeClass: 'bg-purple-100 text-purple-900 border-purple-200' },
    comisiones: { label: '👥 Reunión de Comisión', badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
  };

  const catCfg = categoryLabels[agenda.categoria || 'ordinaria'] || categoryLabels.ordinaria;

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Barra de Acciones y Navegación */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-slate-200 shadow-sm print:hidden">
          <Link
            to="/"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-blue-900 transition-colors self-start sm:self-center"
          >
            <ArrowLeft size={16} />
            <span>Inicio</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? '¡Copiado!' : 'Copiar Enlace'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Share2 size={14} />
              <span>Compartir</span>
            </button>

            <button
              type="button"
              onClick={handleOpenPDF}
              className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Printer size={14} />
              <span>Ver PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-black rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-md disabled:opacity-50"
            >
              {downloading ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
              <span>Descargar PDF</span>
            </button>
          </div>
        </div>

        {/* Cabecera / Banner Principal */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start justify-between gap-5 relative z-10">
            <div className="flex items-center space-x-4">
              <img
                src="images/logo.png"
                alt="Club de Leones Quetzaltenango"
                className="w-14 h-14 sm:w-18 sm:h-18 object-contain drop-shadow-md bg-white/10 p-1.5 rounded-2xl border border-white/20 flex-shrink-0"
              />
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-yellow-400">
                  Club de Leones de Quetzaltenango
                </span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5 leading-snug">
                  {agenda.titulo}
                </h1>
                <span className="text-xs text-blue-200 font-semibold block mt-1">
                  Código Oficial: {agenda.codigo || 'AG-S/C'}
                </span>
              </div>
            </div>

            <span className={`px-3.5 py-1.5 rounded-full text-[11px] font-black border uppercase tracking-wider shadow-sm self-start ${catCfg.badgeClass}`}>
              {catCfg.label}
            </span>
          </div>
        </div>

        {/* Ficha de Detalles (Fecha, Hora, Lugar) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 bg-white border border-slate-200/90 p-4 sm:p-5 rounded-2xl shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 text-blue-900 rounded-xl border border-blue-100 flex-shrink-0">
              <Calendar size={18} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Fecha</span>
              <span className="text-xs font-black text-slate-800">{agenda.fecha}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 text-blue-900 rounded-xl border border-blue-100 flex-shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Hora</span>
              <span className="text-xs font-black text-slate-800">{agenda.hora}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 text-blue-900 rounded-xl border border-blue-100 flex-shrink-0">
              <Building size={18} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Lugar</span>
              <span className="text-xs font-black text-slate-800">{agenda.lugar}</span>
            </div>
          </div>
        </div>

        {/* Presidencia */}
        {agenda.presidencia && (
          <div className="flex items-center space-x-3 bg-amber-50/90 border border-amber-200/80 p-4 rounded-2xl shadow-xs">
            <div className="p-2 bg-amber-100 text-amber-900 rounded-lg flex-shrink-0">
              <User size={16} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">
                Bajo la Presidencia de:
              </span>
              <span className="text-xs font-black text-slate-800">{agenda.presidencia}</span>
            </div>
          </div>
        )}

        {/* Orden del Día */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5 pt-2">
            <h3 className="text-base font-black text-blue-950 flex items-center space-x-2">
              <FileText size={18} className="text-blue-900" />
              <span>Puntos del Orden del Día</span>
            </h3>
            <span className="text-xs font-extrabold bg-blue-50 text-blue-900 border border-blue-200 px-3 py-1 rounded-full">
              {agenda.puntos.length} {agenda.puntos.length === 1 ? 'punto registrado' : 'puntos registrados'}
            </span>
          </div>

          {agenda.puntos.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl text-center py-10 text-slate-400 text-xs font-bold shadow-xs">
              No hay puntos registrados en esta agenda.
            </div>
          ) : (
            <div className="space-y-3.5">
              {agenda.puntos.map((punto, idx) => (
                <div
                  key={punto.id || idx}
                  className="bg-white border border-slate-200/90 hover:border-blue-300 rounded-2xl p-5 sm:p-6 shadow-sm space-y-3 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-3">
                      <span className="w-7 h-7 bg-blue-900 text-white rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 mt-0.5 shadow-xs">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 tracking-tight">
                          {punto.titulo}
                        </h4>
                        {punto.descripcion && (
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                            {punto.descripcion}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Badges de proponente / comisión / urgencia si existen */}
                  {(punto.proponenteNombre || punto.comisionNombre) && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[10px] font-bold">
                      {punto.proponenteNombre && (
                        <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-900 border border-amber-250 px-2.5 py-0.5 rounded-md">
                          <User size={11} />
                          <span>Propuesto por: <strong>{punto.proponenteNombre}</strong></span>
                        </span>
                      )}
                      {punto.comisionNombre && (
                        <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                          <Users size={12} />
                          <span>Comisión Asignada: <strong>{punto.comisionNombre}</strong></span>
                        </span>
                      )}
                      {punto.urgencia && (
                        <span className={`px-2 py-0.5 rounded-md border ${
                          punto.urgencia === 'Alta' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          Urgencia: {punto.urgencia}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Informativo */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-semibold gap-2 shadow-xs">
          <span>Club de Leones de Quetzaltenango — "Nosotros Servimos"</span>
          <span>Elaborado por: {agenda.autor || 'Secretaría'}</span>
        </div>
      </div>
    </div>
  );
};

export default AgendaPublica;
