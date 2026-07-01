import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Calendar, 
  Award, 
  Sparkles, 
  Clock, 
  Users, 
  CheckCircle2, 
  Compass, 
  Music, 
  Coffee, 
  Send,
  Flag,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function Convencion() {
  // Target date: March 19, 2026 at 08:00 AM
  const targetDate = new Date('2026-03-19T08:00:00').getTime();
  
  const [countdown, setCountdown] = useState<CountdownState>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    club: '',
    cargo: 'Socio',
    distrito: 'D3 Guatemala'
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API registration call
    setTimeout(() => {
      setLoading(false);
      setIsSubmitted(true);
      // Optional: Store in local storage for demo purposes
      const registrations = JSON.parse(localStorage.getItem('convencion_preregistros') || '[]');
      registrations.push({ ...form, fechaRegistro: new Date().toISOString() });
      localStorage.setItem('convencion_preregistros', JSON.stringify(registrations));
    }, 1200);
  };

  const culturalActivities = [
    {
      title: "Gala Folclórica y Marimba",
      description: "Una noche inolvidable celebrando la herencia musical de Guatemala con la tradicional marimba de conciertos y danzas representativas.",
      icon: Music,
      time: "Viernes 20 de Marzo, 19:00 hrs"
    },
    {
      title: "Desfile Leonístico de Delegaciones",
      description: "El orgullo de lucir nuestros chalecos y estandartes en un recorrido lleno de alegría por las principales avenidas de la ciudad sede.",
      icon: Flag,
      time: "Sábado 21 de Marzo, 09:00 hrs"
    },
    {
      title: "Festival del Café y Antojitos Altenses",
      description: "Degustación del auténtico café de las zonas cafetaleras y la exquisita repostería local tradicional que distingue al altiplano.",
      icon: Coffee,
      time: "Sábado 21 de Marzo, 16:30 hrs"
    }
  ];

  const uniqueExperiences = [
    {
      title: "Foro de Liderazgo D3",
      desc: "Conferencias magistrales impartidas por líderes de LCI sobre el futuro del servicio humanitario y el desarrollo de nuevas habilidades de impacto comunitario.",
      badge: "Liderazgo"
    },
    {
      title: "Intercambio Tradicional de Pines",
      desc: "La emblemática tradición leonística donde estrechamos lazos de amistad coleccionando e intercambiando pines representativos de clubes de todo el distrito.",
      badge: "Hermandad"
    },
    {
      title: "Proyecto de Servicio en Vivo",
      desc: "Dejaremos una huella duradera en la comunidad anfitriona realizando una obra de servicio colectivo durante el fin de semana de la convención.",
      badge: "Servicio"
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 -mt-10 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Hero / Header Section */}
      <header className="relative bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 text-white overflow-hidden py-24 sm:py-32 border-b border-yellow-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(253,224,71,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.1),transparent_50%)]" />
        
        {/* Decorative lion watermark pattern or circles */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute -left-20 -top-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 px-4 py-2 rounded-full text-sm font-black uppercase tracking-wider mb-6 animate-pulse">
            <Sparkles size={16} />
            <span>Convención Nacional 2026</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-slate-100 to-yellow-300 bg-clip-text text-transparent">
            Distrito D3 Guatemala
          </h1>
          <p className="mt-6 text-lg sm:text-2xl text-slate-200 font-serif max-w-3xl mx-auto italic">
            "Rugiendo con fuerza, sirviendo con amor y uniendo voluntades por nuestra nación"
          </p>

          {/* Location & Date Badge */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm sm:text-base font-bold text-slate-350">
            <div className="flex items-center space-x-2 bg-white/5 px-5 py-2.5 rounded-2xl border border-white/10 shadow-sm">
              <Calendar className="text-yellow-400" size={18} />
              <span>19 al 22 de Marzo, 2026</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/5 px-5 py-2.5 rounded-2xl border border-white/10 shadow-sm">
              <MapPin className="text-yellow-400" size={18} />
              <span>Quetzaltenango, Guatemala</span>
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="mt-12 sm:mt-16">
            <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-yellow-400 mb-4">El gran rugido inicia en:</p>
            <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-lg mx-auto">
              {[
                { label: 'Días', value: countdown.days },
                { label: 'Horas', value: countdown.hours },
                { label: 'Minutos', value: countdown.minutes },
                { label: 'Segundos', value: countdown.seconds }
              ].map((item, idx) => (
                <div key={idx} className="bg-blue-950/75 backdrop-blur-md border border-white/10 rounded-2xl p-3 sm:p-5 flex flex-col items-center justify-center shadow-2xl">
                  <span className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">{String(item.value).padStart(2, '0')}</span>
                  <span className="text-[10px] sm:text-xs font-black uppercase text-slate-400 mt-1 sm:mt-2 tracking-wider">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTA */}
          <div className="mt-12">
            <a 
              href="#pre-inscripcion" 
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-blue-955 font-black px-8 py-4 rounded-2xl text-base sm:text-lg transition-all shadow-xl shadow-yellow-500/20 hover:scale-105 active:scale-95"
            >
              <span>Pre-regístrate Aquí</span>
              <ChevronRight size={20} />
            </a>
          </div>
        </div>
      </header>

      {/* Sede Section */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-blue-900/10 border border-blue-900/20 text-blue-900 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
              <MapPin size={14} />
              <span>Ciudad Sede</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Quetzaltenango: La Cuna de la Cultura y el Fraternismo
            </h2>
            
            <p className="text-slate-650 text-base sm:text-lg leading-relaxed">
              Este año, abrimos las puertas de la majestuosa y emblemática **Quetzaltenango (Xela)**. Rodeada de imponentes volcanes, arquitectura neoclásica señorial y un clima templado idóneo para estrechar lazos leonísticos de servicio.
            </p>
            <p className="text-slate-650 text-base sm:text-lg leading-relaxed">
              La sede oficial contará con amplios salones equipados con la más alta tecnología para albergar las sesiones plenarias, foros de capacitación y celebraciones solemnes de nuestro querido Distrito D3.
            </p>
            
            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="font-extrabold text-slate-900 text-lg">Teatro Municipal</h4>
                <p className="text-xs text-slate-550 mt-1">Escenario de eventos especiales y conmemorativos.</p>
              </div>
              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="font-extrabold text-slate-900 text-lg">Hospitalidad Altense</h4>
                <p className="text-xs text-slate-550 mt-1">La calidez de nuestra gente dispuesta a servirte.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/10 to-blue-500/10 rounded-[2rem] transform rotate-3" />
            <div className="relative bg-white p-4 rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden transform -rotate-1 transition-transform hover:rotate-0 duration-500">
              <img 
                src="https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?auto=format&fit=crop&w=800&q=80" 
                alt="Teatro Municipal Quetzaltenango" 
                className="w-full h-80 object-cover rounded-[1.5rem]"
              />
              <div className="absolute bottom-6 left-6 right-6 bg-slate-955/80 backdrop-blur-md p-4 rounded-xl text-white">
                <p className="text-xs font-black uppercase text-yellow-400 tracking-wider">Histórico y Cultural</p>
                <p className="font-bold text-sm mt-1">Centro Histórico de Quetzaltenango</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Actividades Culturales Section */}
      <section className="bg-slate-900 text-white py-20 relative overflow-hidden border-y border-yellow-500/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(253,224,71,0.03),transparent_40%)]" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
              <Award size={14} />
              <span>Agenda de Hermandad</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-none bg-gradient-to-r from-white to-yellow-300 bg-clip-text text-transparent">
              Actividades Culturales y Sociales
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
              La convención no es solo trabajo de planificación; también es el espacio ideal para disfrutar del arte, la hermandad y compartir tradiciones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 sm:mt-16">
            {culturalActivities.map((act, index) => {
              const Icon = act.icon;
              return (
                <div 
                  key={index} 
                  className="group relative bg-white/5 border border-white/10 hover:border-yellow-500/30 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-2 hover:bg-white/10 flex flex-col justify-between shadow-lg"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon size={22} />
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight">{act.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{act.description}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-yellow-400 font-bold">
                    <div className="flex items-center space-x-1.5">
                      <Clock size={13} />
                      <span>{act.time}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Experiencias Únicas Section */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center space-x-2 bg-blue-900/10 border border-blue-900/20 text-blue-900 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
            <Compass size={14} />
            <span>Mística Leonística</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Experiencias Únicas de la Convención
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">
            Vive de cerca los pilares fundamentales que nos guían como Club de Leones a nivel mundial y nacional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {uniqueExperiences.map((exp, index) => (
            <div 
              key={index}
              className="bg-white border border-slate-100 hover:border-slate-200 rounded-[2rem] p-8 shadow-xl shadow-slate-100/50 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-900 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full inline-block">
                  {exp.badge}
                </span>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight pt-2">{exp.title}</h3>
                <p className="text-slate-650 text-sm leading-relaxed">{exp.desc}</p>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center text-blue-900 font-extrabold text-xs group cursor-pointer">
                <span>Conocer más detalles</span>
                <ChevronRight size={14} className="ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pre-registro Form Section */}
      <section id="pre-inscripcion" className="py-20 bg-gradient-to-br from-blue-900 to-indigo-950 text-white relative overflow-hidden border-t border-yellow-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(253,224,71,0.05),transparent_40%)]" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="bg-blue-950/70 backdrop-blur-lg border border-white/10 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl">
            
            {!isSubmitted ? (
              <div>
                <div className="text-center max-w-2xl mx-auto space-y-4 mb-10">
                  <div className="inline-flex items-center space-x-2 bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
                    <ShieldCheck size={14} />
                    <span>Inscripciones</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-none bg-gradient-to-r from-white to-yellow-300 bg-clip-text text-transparent">
                    Inscripciones Abiertas Muy Pronto
                  </h2>
                  <p className="text-slate-300 text-sm sm:text-base">
                    Pre-regístrate hoy mismo para asegurar tu cupo prioritario y recibir las tarifas especiales de hospedaje y credenciales en cuanto se abran las inscripciones formales.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Nombre */}
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold uppercase tracking-wider text-slate-350" htmlFor="nombre">Nombre Completo</label>
                      <input 
                        type="text" 
                        id="nombre"
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        required
                        placeholder="Ej. Juan Pérez"
                        className="w-full bg-blue-900/50 border border-white/15 focus:border-yellow-500 rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder:text-slate-500"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold uppercase tracking-wider text-slate-350" htmlFor="email">Correo Electrónico</label>
                      <input 
                        type="email" 
                        id="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="ejemplo@correo.com"
                        className="w-full bg-blue-900/50 border border-white/15 focus:border-yellow-500 rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Teléfono */}
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold uppercase tracking-wider text-slate-350" htmlFor="telefono">Teléfono / WhatsApp</label>
                      <input 
                        type="tel" 
                        id="telefono"
                        name="telefono"
                        value={form.telefono}
                        onChange={handleChange}
                        required
                        placeholder="Ej. +502 5555 1234"
                        className="w-full bg-blue-900/50 border border-white/15 focus:border-yellow-500 rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder:text-slate-500"
                      />
                    </div>

                    {/* Club */}
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold uppercase tracking-wider text-slate-350" htmlFor="club">Club de Leones de Pertenencia</label>
                      <input 
                        type="text" 
                        id="club"
                        name="club"
                        value={form.club}
                        onChange={handleChange}
                        required
                        placeholder="Ej. Club de Leones Quetzaltenango"
                        className="w-full bg-blue-900/50 border border-white/15 focus:border-yellow-500 rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Cargo */}
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold uppercase tracking-wider text-slate-350" htmlFor="cargo">Cargo Leonístico Actual</label>
                      <select 
                        id="cargo"
                        name="cargo"
                        value={form.cargo}
                        onChange={handleChange}
                        className="w-full bg-blue-950 border border-white/15 focus:border-yellow-500 rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all"
                      >
                        <option value="Socio">Socio Regular</option>
                        <option value="Presidente">Presidente de Club</option>
                        <option value="Secretario">Secretario</option>
                        <option value="Tesorero">Tesorero</option>
                        <option value="Gobernador">Gobernador / Vicegobernador</option>
                        <option value="Leo">Socio Leo</option>
                        <option value="Otro">Otro Cargo</option>
                      </select>
                    </div>

                    {/* Distrito */}
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold uppercase tracking-wider text-slate-350" htmlFor="distrito">Distrito</label>
                      <select 
                        id="distrito"
                        name="distrito"
                        value={form.distrito}
                        onChange={handleChange}
                        className="w-full bg-blue-950 border border-white/15 focus:border-yellow-500 rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all"
                      >
                        <option value="D3 Guatemala">D3 (Guatemala)</option>
                        <option value="D1">D1</option>
                        <option value="D2">D2</option>
                        <option value="D4">D4</option>
                        <option value="Otro Distrito">Otro Distrito / Internacional</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-blue-955 font-black px-6 py-4 rounded-2xl text-base transition-all shadow-xl shadow-yellow-500/10 hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-blue-955 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Send size={18} />
                          <span>Enviar Pre-registro</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center py-12 space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-yellow-500 text-blue-955 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-yellow-500/10">
                  <CheckCircle2 size={44} />
                </div>
                <h3 className="text-3xl font-black text-white tracking-tight">¡Pre-registro Exitoso!</h3>
                <p className="text-slate-300 text-base max-w-md mx-auto leading-relaxed">
                  Gracias, León **{form.nombre}**. Hemos guardado tus datos de forma prioritaria en la lista de espera oficial de la convención. Te mantendremos informado tan pronto abramos el portal de inscripciones.
                </p>
                <div className="pt-6">
                  <button 
                    onClick={() => setIsSubmitted(false)}
                    className="text-xs font-extrabold uppercase tracking-wider text-yellow-400 hover:text-yellow-500 border border-yellow-500/25 px-5 py-2.5 rounded-xl bg-yellow-500/5 transition-colors"
                  >
                    Registrar a otro socio
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>
    </div>
  );
}
