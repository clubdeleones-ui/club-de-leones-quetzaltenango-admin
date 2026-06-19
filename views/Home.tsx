import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, MapPin, ArrowRight, ShieldCheck, Heart, Users, Clock, Share2, Check, Copy, Loader2 } from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { Actividad } from '../types';
import { MOCK_ACTIVIDADES } from '../constants';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchActividades = async () => {
      setLoading(true);
      try {
        const data = await firebaseService.getActividades();
        // Filter only public activities and sort by date ascending (upcoming first)
        const publicSorted = (data || [])
          .filter(a => a.publica)
          .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
        
        if (publicSorted.length > 0) {
          setActividades(publicSorted);
        } else {
          setActividades(MOCK_ACTIVIDADES.filter(a => a.publica));
        }
      } catch (err) {
        console.error("Error loading activities for homepage:", err);
        setActividades(MOCK_ACTIVIDADES.filter(a => a.publica));
      } finally {
        setLoading(false);
      }
    };
    fetchActividades();
  }, []);

  const handleDonateClick = (act: Actividad) => {
    if (act.donacionUrl && act.donacionUrl.startsWith('http')) {
      window.open(act.donacionUrl, '_blank', 'noopener,noreferrer');
    } else {
      navigate('/donar');
    }
  };

  const handleShare = (act: Actividad, network: 'whatsapp' | 'facebook' | 'twitter' | 'copy') => {
    const shareUrl = window.location.origin + '/#/actividades';
    const shareText = `¡Te invito a participar en la actividad de Club de Leones Quetzaltenango: "${act.titulo}"! 📅 Fecha: ${act.fecha}. 📍 Lugar: ${act.lugar}.`;

    if (network === 'whatsapp') {
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (network === 'facebook') {
      const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (network === 'twitter') {
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (network === 'copy') {
      const fullText = `${shareText}\n\nEnlace del evento: ${shareUrl}`;
      navigator.clipboard.writeText(fullText).then(() => {
        setCopiedId(act.id);
        setTimeout(() => setCopiedId(null), 2500);
      });
    }
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden rounded-[3rem] shadow-2xl">
        <div className="absolute inset-0 bg-blue-900/60 z-10" />
        <img
          src="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=1600"
          className="absolute inset-0 w-full h-full object-cover"
          alt="Hero"
        />
        <div className="relative z-20 text-center text-white px-6 max-w-4xl">
          <div className="mb-6 inline-block">
            <img src="images/logo.png" className="w-20 h-20 mx-auto mb-4 bg-white p-2 rounded-full shadow-lg" alt="Lions Logo" />
            <span className="bg-yellow-500 text-blue-900 text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest">Desde 1947 sirviendo</span>
          </div>
          <h1 className="text-4xl md:text-6xl mb-4 font-extrabold leading-tight">Nosotros <span className="text-yellow-400">Servimos</span></h1>
          <p className="text-lg md:text-xl mb-8 font-light max-w-2xl mx-auto leading-relaxed opacity-90">
            Transformando vidas en Quetzaltenango a través de la solidaridad y el <span className="italic font-normal">compromiso leonístico</span>.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <button
              onClick={() => navigate('/actividades')}
              className="bg-yellow-500 hover:bg-yellow-400 text-blue-900 px-8 py-3.5 rounded-2xl font-semibold text-base transition-all transform hover:scale-105 shadow-xl shadow-yellow-500/20 flex items-center justify-center space-x-2"
            >
              <span>Ver Actividades</span>
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate('/galeria')}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 px-8 py-3.5 rounded-2xl font-semibold text-base transition-all"
            >
              Nuestra Historia
            </button>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {[
          { icon: Heart, title: 'Servicio', desc: 'Dedicamos nuestro tiempo y recursos a mejorar la comunidad.' },
          { icon: ShieldCheck, title: 'Integridad', desc: 'Actuamos con ética y transparencia en cada proyecto.' },
          { icon: Users, title: 'Unión', desc: 'Fortalecemos los lazos entre socios para un impacto mayor.' }
        ].map((v, i) => (
          <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center group hover:border-yellow-500 transition-all">
            <div className="bg-blue-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 group-hover:bg-yellow-100 transition-colors">
              <v.icon className="text-blue-900 w-6 h-6 group-hover:text-yellow-600" />
            </div>
            <h3 className="text-lg font-bold mb-2.5 text-slate-900">{v.title}</h3>
            <p className="text-sm text-slate-650">{v.desc}</p>
          </div>
        ))}
      </section>

      {/* Misión e Impacto Global y Local */}
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 rounded-[2.5rem] p-8 md:p-14 shadow-2xl relative overflow-hidden">
        {/* Glow effects in background */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[250px] h-[250px] bg-blue-500/20 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 space-y-12">
          {/* Header of Section */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-[11px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
              Misión y Propósito
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Una Red Global, un Compromiso Local
            </h2>
            <p className="text-slate-300/80 text-sm md:text-base leading-relaxed">
              Formamos parte del movimiento de servicio voluntario más grande del planeta, con acciones adaptadas a las realidades específicas de cada región.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            {/* Tarjeta Internacional */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 md:p-10 rounded-3xl flex flex-col justify-between hover:bg-white/10 transition-all duration-500 group relative">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-yellow-400 text-xs font-black uppercase tracking-widest bg-yellow-500/10 border border-yellow-500/20 px-3.5 py-1 rounded-lg">
                    Alcance Internacional
                  </span>
                  <span className="text-slate-400 text-[10px] font-bold">Lions International</span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-white leading-tight">
                  Manos y corazones en casi todos los países de la Tierra
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed font-medium">
                  Nuestra asociación está integrada por <strong>1.4 millones de socios</strong> en <strong>50,000 clubes</strong> que aportan manos y corazones a las comunidades que servimos en casi todos los países del mundo. Nuestros Leones y Leos ayudan a cientos de millones de personas cada año. Conoce las formas en que servimos.
                </p>
              </div>

              {/* Stats widget for Global */}
              <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/10">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
                  <p className="text-2xl md:text-3xl font-black text-yellow-400">1.4M</p>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mt-1">Socios Activos</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
                  <p className="text-2xl md:text-3xl font-black text-yellow-400">50K</p>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mt-1">Clubes de Servicio</p>
                </div>
              </div>
            </div>

            {/* Tarjeta Local (Quetzaltenango) */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 md:p-10 rounded-3xl flex flex-col justify-between hover:bg-white/10 transition-all duration-500 group relative overflow-hidden">
              {/* Highlight background glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-blue-500/10 rounded-full blur-[60px] pointer-events-none group-hover:scale-125 transition-transform duration-700" />
              
              <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-yellow-400 text-xs font-black uppercase tracking-widest bg-yellow-500/10 border border-yellow-500/20 px-3.5 py-1 rounded-lg">
                    Acción Local
                  </span>
                  <span className="text-slate-400 text-[10px] font-bold">Xela, Guatemala</span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-white leading-tight">
                  Sirviendo a nuestra querida Xela desde 1947
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed font-medium">
                  En Quetzaltenango, nuestro club ha sido un pilar fundamental de solidaridad. Atendemos de manera directa las necesidades más urgentes a través de jornadas médicas gratuitas, programas de salud visual, asistencia alimentaria a sectores marginados y soporte educativo a escuelas de escasos recursos.
                </p>
              </div>

              {/* Institutional reinforcement logo block */}
              <div className="flex flex-col sm:flex-row items-center gap-6 mt-8 pt-8 border-t border-white/10 relative z-10">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-yellow-400/25 rounded-full blur-md group-hover:blur-lg transition-all" />
                  <img 
                    src="images/logo.png" 
                    className="w-16 h-16 bg-white p-1.5 rounded-full relative z-10 border border-yellow-400/40 shadow-inner group-hover:scale-105 transition-transform duration-500" 
                    alt="Logo Club de Leones Quetzaltenango" 
                  />
                </div>
                <div className="text-center sm:text-left space-y-1">
                  <p className="text-sm font-black text-white">Club de Leones de Quetzaltenango</p>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                    Afiliado número 015705 a Lions Clubs International.
                  </p>
                  <p className="text-[10px] text-yellow-400/90 font-black uppercase tracking-wider">
                    ★ Desde el 20 de Febrero de 1947 ★
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Activities Preview */}
      <section className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-black text-blue-900 tracking-tight">Próximas Actividades</h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">Participa y sé parte del cambio positivo en Quetzaltenango.</p>
          </div>
          <button
            onClick={() => navigate('/actividades')}
            className="flex items-center space-x-2 text-blue-900 text-sm font-black hover:underline"
          >
            <span>Ver todas</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-[2.5rem]">
            <Loader2 className="animate-spin text-blue-900 mb-3" size={32} />
            <p className="text-slate-400 text-sm font-bold">Cargando próximas actividades...</p>
          </div>
        ) : actividades.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {actividades.slice(0, 2).map((act) => (
              <article 
                key={act.id} 
                className="bg-white rounded-[2.5rem] border border-slate-200/70 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full"
              >
                {/* Poster Image */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100 border-b border-slate-150">
                  <img 
                    src={act.imagen || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=800'} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    alt={act.titulo}
                  />
                  <div className="absolute top-4 left-4 z-10">
                    <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm bg-emerald-500/90 backdrop-blur-sm text-white border border-emerald-400/30">
                      Público
                    </span>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-6 md:p-8 flex flex-col flex-grow justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <Clock size={13} className="mr-2 text-yellow-600 shrink-0" />
                        <span>{act.fecha}</span>
                      </div>
                      <div className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <MapPin size={13} className="mr-2 text-blue-900 shrink-0" />
                        <span className="truncate">{act.lugar}</span>
                      </div>
                    </div>

                    <h3 className="font-extrabold text-xl md:text-2xl text-slate-800 leading-tight group-hover:text-blue-900 transition-colors">
                      {act.titulo}
                    </h3>
                    <p className="text-slate-655 text-xs md:text-sm leading-relaxed text-justify line-clamp-3 whitespace-pre-line">
                      {act.descripcion}
                    </p>
                  </div>

                  {/* Share & Donate buttons */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center">
                        <Share2 size={11} className="mr-1.5" />
                        Compartir
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleShare(act, 'whatsapp')}
                          className="w-8 h-8 rounded-full bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-600 flex items-center justify-center transition-all shadow-sm"
                          title="Compartir por WhatsApp"
                        >
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.062 5.248 5.309 0 11.77 0c3.13 0 6.073 1.22 8.283 3.43 2.21 2.21 3.427 5.153 3.427 8.284 0 6.462-5.247 11.71-11.71 11.71-2.007 0-3.978-.517-5.719-1.498L0 24zm6.59-2.031c1.6.953 3.56 1.458 5.56 1.46 5.375 0 9.75-4.373 9.75-9.75 0-2.595-1.01-5.035-2.83-6.858-1.821-1.82-4.26-2.83-6.86-2.83-5.378 0-9.75 4.372-9.75 9.75 0 2.012.524 3.986 1.524 5.589l-.999 3.65 3.755-.985zM17.43 15.65c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.71.16-.21.32-.82 1.04-1 1.25-.18.21-.36.24-.68.08-.32-.16-1.34-.49-2.55-1.57-.94-.84-1.58-1.87-1.76-2.18-.18-.32-.02-.49.14-.65.15-.14.32-.32.48-.48.16-.16.21-.27.32-.48.11-.21.05-.4-.03-.56-.08-.16-.71-1.7-.97-2.34-.26-.62-.52-.53-.71-.54-.18-.01-.39-.01-.6-.01s-.55.08-.84.4c-.29.32-1.1 1.08-1.1 2.63s1.12 3.05 1.28 3.25c.16.2 2.2 3.35 5.33 4.7 1.86.8 2.94.86 4 .7.6-.09 1.89-.77 2.15-1.52.26-.75.26-1.4.18-1.52-.09-.12-.3-.24-.62-.4z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleShare(act, 'facebook')}
                          className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 flex items-center justify-center transition-all shadow-sm"
                          title="Compartir en Facebook"
                        >
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleShare(act, 'twitter')}
                          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 flex items-center justify-center transition-all shadow-sm"
                          title="Compartir en Twitter/X"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleShare(act, 'copy')}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm ${
                            copiedId === act.id 
                              ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                          title="Copiar datos y enlace"
                        >
                          {copiedId === act.id ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>

                    {act.conBotonDonacion && (
                      <button
                        onClick={() => handleDonateClick(act)}
                        className="w-full bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-extrabold py-3 px-4 rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center space-x-1.5 text-xs"
                      >
                        <Heart size={14} className="fill-current" />
                        <span>Apoyar con Donación</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-medium italic">No hay próximas actividades programadas en este momento.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
