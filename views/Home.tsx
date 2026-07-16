import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  ArrowRight, 
  ShieldCheck, 
  Heart, 
  Users, 
  Clock, 
  Share2, 
  Check, 
  Copy, 
  Loader2, 
  UserPlus,
  Leaf,
  Eye,
  Activity,
  CloudRain,
  Utensils,
  Handshake,
  Smile,
  Award,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { useClubData } from '../context/ClubDataContext';
import { Actividad, GaleriaItem } from '../types';
import { MOCK_ACTIVIDADES } from '../constants';
import { InscripcionVoluntarioModal } from '../components/InscripcionVoluntarioModal';
import { formatDisplayDate } from '../utils/dateSpanishFormatter';

const CAUSAS_GLOBALES = [
  {
    id: 'cancer',
    title: 'Cáncer infantil',
    desc: 'Brindamos apoyo a las necesidades de los niños y las familias afectadas por el cáncer infantil.',
    color: 'from-amber-400 to-yellow-600',
    textColor: 'text-yellow-650',
    bgColor: 'bg-amber-50/30',
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-100',
    icon: Award,
  },
  {
    id: 'diabetes',
    title: 'Diabetes',
    desc: 'Trabajamos para reducir la prevalencia de la diabetes y mejorar la calidad de vida de los diabéticos.',
    color: 'from-sky-400 to-blue-600',
    textColor: 'text-blue-650',
    bgColor: 'bg-sky-50/30',
    iconColor: 'text-sky-500',
    iconBg: 'bg-sky-100',
    icon: Activity,
  },
  {
    id: 'desastre',
    title: 'Auxilio en casos de desastre',
    desc: 'Actuamos para satisfacer las necesidades inmediatas y brindar apoyo a largo plazo a las comunidades devastadas por los desastres naturales.',
    color: 'from-blue-600 to-indigo-900',
    textColor: 'text-indigo-650',
    bgColor: 'bg-indigo-50/30',
    iconColor: 'text-indigo-500',
    iconBg: 'bg-indigo-100',
    icon: CloudRain,
  },
  {
    id: 'ambiente',
    title: 'Medio ambiente',
    desc: 'Encontramos formas de proteger el medio ambiente con el fin de crear comunidades más saludables y un mundo más sostenible.',
    color: 'from-emerald-400 to-green-700',
    textColor: 'text-emerald-650',
    bgColor: 'bg-emerald-50/30',
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-100',
    icon: Leaf,
  },
  {
    id: 'humanitario',
    title: 'Esfuerzos humanitarios',
    desc: 'Identificamos las necesidades más cruciales del mundo y proporcionamos ayuda humanitaria donde más se necesite.',
    color: 'from-rose-400 to-red-700',
    textColor: 'text-rose-650',
    bgColor: 'bg-rose-50/30',
    iconColor: 'text-rose-500',
    iconBg: 'bg-rose-100',
    icon: Handshake,
  },
  {
    id: 'hambre',
    title: 'Hambre',
    desc: 'Nos esforzamos por mejorar la seguridad alimentaria y el acceso a alimentos nutritivos para ayudar a mitigar el hambre.',
    color: 'from-orange-400 to-red-650',
    textColor: 'text-orange-650',
    bgColor: 'bg-orange-50/30',
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-100',
    icon: Utensils,
  },
  {
    id: 'vision',
    title: 'Visión',
    desc: 'Ayudamos a prevenir la ceguera evitable y mejorar la calidad de vida de las personas invidentes o con discapacidad visual.',
    color: 'from-purple-400 to-fuchsia-700',
    textColor: 'text-purple-650',
    bgColor: 'bg-purple-50/30',
    iconColor: 'text-purple-500',
    iconBg: 'bg-purple-100',
    icon: Eye,
  },
  {
    id: 'juventud',
    title: 'Juventud',
    desc: 'Apoyamos a los jóvenes para que tomen decisiones positivas, lleven una vida sana y productiva y se conviertan en líderes del servicio.',
    color: 'from-teal-400 to-cyan-700',
    textColor: 'text-teal-650',
    bgColor: 'bg-teal-50/30',
    iconColor: 'text-teal-500',
    iconBg: 'bg-teal-100',
    icon: Smile,
  }
];

let popupHasBeenShown = false;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { actividades: dbActividades, loading: dbLoading } = useClubData();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedActForVol, setSelectedActForVol] = useState<Actividad | null>(null);
  const [isVolModalOpen, setIsVolModalOpen] = useState(false);
  const [selectedCausaIndex, setSelectedCausaIndex] = useState<number>(0);
  const [activeFondo, setActiveFondo] = useState<GaleriaItem | null>(null);
  const [showFondoModal, setShowFondoModal] = useState(false);

  useEffect(() => {
    const checkFondoPantalla = async () => {
      try {
        const items = await firebaseService.getGaleriaItems();
        const fondo = items.find(item => item.esFondoPantalla);
        if (fondo) {
          setActiveFondo(fondo);
          if (!popupHasBeenShown) {
            setShowFondoModal(true);
            popupHasBeenShown = true;
          }
        }
      } catch (err) {
        console.error("Error loading gallery items for wallpaper check:", err);
      }
    };
    checkFondoPantalla();
  }, []);

  const actividades = React.useMemo(() => {
    const publicSorted = dbActividades
      .filter(a => a.publica)
      .sort((a, b) => new Date(b.fecha.replace(' ', 'T')).getTime() - new Date(a.fecha.replace(' ', 'T')).getTime());
    return publicSorted.length > 0 ? publicSorted : MOCK_ACTIVIDADES.filter(a => a.publica);
  }, [dbActividades]);

  const loading = dbLoading.actividades && dbActividades.length === 0;

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
            {/* Interactive 8 Causes Card (Carousel) */}
            {(() => {
              const activeCausa = CAUSAS_GLOBALES[selectedCausaIndex];
              const prevIndex = selectedCausaIndex === 0 ? CAUSAS_GLOBALES.length - 1 : selectedCausaIndex - 1;
              const prevCausa = CAUSAS_GLOBALES[prevIndex];
              const nextIndex = selectedCausaIndex === CAUSAS_GLOBALES.length - 1 ? 0 : selectedCausaIndex + 1;
              const nextCausa = CAUSAS_GLOBALES[nextIndex];
              
              const ActiveIcon = activeCausa.icon;
              const PrevIcon = prevCausa.icon;
              const NextIcon = nextCausa.icon;

              const handlePrev = (e: React.MouseEvent) => {
                e.stopPropagation();
                setSelectedCausaIndex(prev => (prev === 0 ? CAUSAS_GLOBALES.length - 1 : prev - 1));
              };

              const handleNext = (e: React.MouseEvent) => {
                e.stopPropagation();
                setSelectedCausaIndex(prev => (prev === CAUSAS_GLOBALES.length - 1 ? 0 : prev + 1));
              };

              const handleSelectCausa = (idx: number, e: React.MouseEvent) => {
                e.stopPropagation();
                setSelectedCausaIndex(idx);
              };

              return (
                <article className={`rounded-[2.5rem] border border-slate-200/70 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full bg-white`}>
                  {/* Aspect-Video Header displaying the Carousel */}
                  <div className="relative aspect-video w-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-blue-950 to-slate-950 p-5 flex flex-col justify-between items-center overflow-hidden shrink-0 select-none">
                    {/* Background glow indicating active cause color */}
                    <div className={`absolute inset-0 opacity-30 bg-gradient-to-br ${activeCausa.color} blur-3xl scale-125 transition-all duration-700 pointer-events-none`} />
                    
                    {/* Header text overlay */}
                    <div className="w-full flex items-center justify-between text-white/40 text-[9px] font-black uppercase tracking-widest relative z-10">
                      <span>Áreas de Servicio</span>
                      <span>Lions International</span>
                    </div>

                    {/* Main Row: Prev Preview, Prev Arrow, Main Large Icon, Next Arrow, Next Preview */}
                    <div className="flex items-center justify-between w-full relative z-10 flex-grow max-w-[290px] sm:max-w-[340px]">
                      {/* Left side preview and arrow */}
                      <div className="flex items-center space-x-1.5 md:space-x-2">
                        <div 
                          onClick={(e) => handleSelectCausa(prevIndex, e)}
                          className={`w-9 h-9 rounded-full bg-gradient-to-br ${prevCausa.color} text-white/30 flex items-center justify-center scale-90 cursor-pointer hover:scale-95 transition-all duration-300 opacity-20 hover:opacity-40 shrink-0`}
                          title={prevCausa.title}
                        >
                          <PrevIcon size={16} />
                        </div>
                        <button
                          type="button"
                          onClick={handlePrev}
                          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white/80 flex items-center justify-center transition-all active:scale-90"
                          title="Anterior"
                        >
                          <ChevronLeft size={20} className="stroke-[2.5]" />
                        </button>
                      </div>

                      {/* Main Active Icon */}
                      <div className="flex flex-col items-center">
                        <div className={`w-18 h-18 sm:w-22 sm:h-22 rounded-full flex items-center justify-center transition-all duration-500 bg-gradient-to-br ${activeCausa.color} text-white shadow-[0_0_35px_rgba(255,255,255,0.2)] ring-8 ring-white/10 relative`}>
                          <ActiveIcon size={34} className="stroke-[2.2] animate-pulse duration-1000" />
                        </div>
                        <span className="mt-2.5 text-[10px] font-black text-white uppercase tracking-widest text-center max-w-[130px] truncate">
                          {activeCausa.title}
                        </span>
                      </div>

                      {/* Right side arrow and preview */}
                      <div className="flex items-center space-x-1.5 md:space-x-2">
                        <button
                          type="button"
                          onClick={handleNext}
                          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white/80 flex items-center justify-center transition-all active:scale-90"
                          title="Siguiente"
                        >
                          <ChevronRight size={20} className="stroke-[2.5]" />
                        </button>
                        <div 
                          onClick={(e) => handleSelectCausa(nextIndex, e)}
                          className={`w-9 h-9 rounded-full bg-gradient-to-br ${nextCausa.color} text-white/30 flex items-center justify-center scale-90 cursor-pointer hover:scale-95 transition-all duration-300 opacity-20 hover:opacity-40 shrink-0`}
                          title={nextCausa.title}
                        >
                          <NextIcon size={16} />
                        </div>
                      </div>
                    </div>

                    {/* Dots Indicator */}
                    <div className="flex space-x-1.5 relative z-10">
                      {CAUSAS_GLOBALES.map((_, idx) => {
                        const isSelected = selectedCausaIndex === idx;
                        return (
                          <button
                            key={idx}
                            onClick={(e) => handleSelectCausa(idx, e)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              isSelected ? 'w-5 bg-white' : 'w-1.5 bg-white/35 hover:bg-white/55'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Body details of the selected cause */}
                  <div className={`p-6 md:p-8 flex flex-col flex-grow justify-between space-y-5 transition-colors duration-500 ${activeCausa.bgColor}`}>
                    <div className="space-y-4 flex-grow">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm border bg-white text-slate-800 border-white/50`}>
                          Causas Globales
                        </span>
                        <span className="text-[10px] font-extrabold text-slate-400">Lions International</span>
                      </div>

                      {/* Brief description explaining the 8 causes */}
                      <p className="text-slate-500 text-xs md:text-sm font-semibold leading-relaxed border-l-2 border-slate-300 pl-3 italic">
                        Lions International cuenta con 8 causas globales prioritarias de las cuales derivan la mayoría de nuestras actividades y proyectos de servicio comunitario.
                      </p>

                      <h3 className={`font-extrabold text-xl md:text-2xl leading-tight transition-colors duration-500 ${activeCausa.textColor}`}>
                        {activeCausa.title}
                      </h3>
                      
                      <p className="text-slate-600 text-xs md:text-sm leading-relaxed text-justify transition-all duration-500 font-medium whitespace-pre-line">
                        {activeCausa.desc}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-150 mt-auto">
                      <button
                        onClick={() => navigate('/actividades')}
                        className="w-full bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-705 font-extrabold py-3 px-4 rounded-2xl transition-all shadow-sm flex items-center justify-center space-x-1.5 text-xs"
                      >
                        <span>Conoce Nuestras Actividades</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })()}

            {/* The single most recent activity card */}
            {(() => {
              const act = actividades[0];
              return (
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
                        Actividad Más Reciente
                      </span>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-6 md:p-8 flex flex-col flex-grow justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <Clock size={13} className="mr-2 text-yellow-600 shrink-0" />
                          <span>{formatDisplayDate(act.fecha)}</span>
                        </div>
                        <div className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <MapPin size={13} className="mr-2 text-blue-900 shrink-0" />
                          <span className="truncate">{act.lugar}</span>
                        </div>
                      </div>

                      <h3 className="font-extrabold text-xl md:text-2xl text-slate-800 leading-tight group-hover:text-blue-900 transition-colors">
                        {act.titulo}
                      </h3>
                      <p className="text-slate-655 text-xs md:text-sm leading-relaxed text-justify line-clamp-3 whitespace-pre-line font-medium">
                        {act.descripcion}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      {act.conBotonDonacion && (
                        <button
                          onClick={() => handleDonateClick(act)}
                          className="w-full bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-extrabold py-3.5 px-6 rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center space-x-1.5 text-xs"
                        >
                          <Heart size={14} className="fill-current" />
                          <span>Apoyar con Donación</span>
                        </button>
                      )}

                      {/* Volunteer CTA */}
                      <button
                        onClick={() => {
                          setSelectedActForVol(act);
                          setIsVolModalOpen(true);
                        }}
                        className="w-full bg-blue-900 hover:bg-blue-800 text-white font-extrabold py-3.5 px-6 rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center space-x-1.5 text-xs"
                      >
                        <UserPlus size={14} />
                        <span>Me apunto como voluntario</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })()}
          </div>
        ) : (
          <div className="p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-medium italic">No hay próximas actividades programadas en este momento.</p>
          </div>
        )}
      </section>

      {/* Volunteer Modal */}
      {isVolModalOpen && selectedActForVol && (
        <InscripcionVoluntarioModal
          isOpen={isVolModalOpen}
          onClose={() => {
            setIsVolModalOpen(false);
            setSelectedActForVol(null);
          }}
          actividadId={selectedActForVol.id}
          actividadTitulo={selectedActForVol.titulo}
        />
      )}

      {/* Wallpaper/Seasonal Message Modal */}
      {showFondoModal && activeFondo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative max-w-7xl w-full bg-transparent rounded-3xl overflow-hidden flex flex-col justify-center items-center max-h-[98vh] p-2">
            {/* Close Button */}
            <button
              onClick={() => setShowFondoModal(false)}
              className="absolute top-4 right-4 z-50 bg-white/95 text-slate-800 p-3 rounded-full hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/25"
              title="Cerrar Anuncio"
            >
              <X size={20} />
            </button>

            {/* Content Container */}
            <div className="w-full flex flex-col items-center">
              <div className="relative w-full max-h-[82vh] flex justify-center items-center">
                <img 
                  src={activeFondo.url} 
                  alt={activeFondo.titulo} 
                  className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border-4 border-white/10"
                />
              </div>
              
              {/* Details footer */}
              {activeFondo.titulo && 
               !activeFondo.titulo.toLowerCase().includes('fondo') && 
               !activeFondo.titulo.toLowerCase().includes('pantalla') && (
                <div className="mt-4 text-center text-white max-w-3xl px-4 shrink-0">
                  <h3 className="text-xl md:text-2xl font-black tracking-tight text-yellow-400 drop-shadow-md">{activeFondo.titulo}</h3>
                  {activeFondo.descripcion && 
                   !activeFondo.descripcion.toLowerCase().includes('fondo') && 
                   !activeFondo.descripcion.toLowerCase().includes('pantalla') && (
                    <p className="text-xs md:text-sm mt-1.5 text-slate-200 font-medium leading-relaxed drop-shadow-sm line-clamp-2">{activeFondo.descripcion}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
