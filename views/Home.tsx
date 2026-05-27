
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
            <span className="bg-yellow-500 text-blue-900 text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest">Desde 1917 sirviendo</span>
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
