
import React from 'react';
import { MOCK_ACTIVIDADES } from '../constants';
import { Calendar, MapPin, ArrowRight, ShieldCheck, Heart, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

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
      <section className="grid md:grid-cols-3 gap-8">
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
            <p className="text-sm text-slate-600">{v.desc}</p>
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
      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-blue-900 tracking-tight">Próximas Actividades</h2>
            <p className="text-sm text-slate-650 mt-1 font-medium">Participa y sé parte del cambio en Xela.</p>
          </div>
          <button
            onClick={() => navigate('/actividades')}
            className="hidden sm:flex items-center space-x-2 text-blue-900 text-sm font-semibold hover:underline"
          >
            <span>Ver todas</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {MOCK_ACTIVIDADES.filter(a => a.publica).slice(0, 2).map((act) => (
            <div key={act.id} className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col md:flex-row hover:shadow-xl transition-shadow border border-slate-100">
              <img src={act.imagen} className="w-full md:w-40 h-40 object-cover" alt={act.titulo} />
              <div className="p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-1.5">{act.titulo}</h3>
                  <div className="flex items-center text-xs text-slate-600 mb-1.5 font-medium">
                    <Calendar size={12} className="mr-1.5 text-slate-400" />
                    <span>{act.fecha}</span>
                  </div>
                  <div className="flex items-center text-xs text-slate-600 mb-3 font-medium">
                    <MapPin size={12} className="mr-1.5 text-slate-400" />
                    <span>{act.lugar}</span>
                  </div>
                  <p className="text-slate-700 text-xs line-clamp-2 leading-relaxed font-medium">{act.descripcion}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
