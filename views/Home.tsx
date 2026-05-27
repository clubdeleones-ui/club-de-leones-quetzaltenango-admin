
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
          <div className="mb-8 inline-block">
            <img src="images/logo.png" className="w-24 h-24 mx-auto mb-4 bg-white p-2 rounded-full shadow-lg" alt="Lions Logo" />
            <span className="bg-yellow-500 text-blue-900 text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest">Desde 1917 sirviendo</span>
          </div>
          <h1 className="text-6xl md:text-8xl mb-6 font-extrabold leading-tight">Nosotros <span className="text-yellow-400">Servimos</span></h1>
          <p className="text-xl md:text-3xl mb-10 font-light max-w-2xl mx-auto leading-relaxed opacity-90">
            Transformando vidas en Quetzaltenango a través de la solidaridad y el <span className="italic font-normal">compromiso leonístico</span>.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <button
              onClick={() => navigate('/actividades')}
              className="bg-yellow-500 hover:bg-yellow-400 text-blue-900 px-10 py-4 rounded-2xl font-black text-lg transition-all transform hover:scale-105 shadow-xl shadow-yellow-500/20 flex items-center justify-center space-x-2"
            >
              <span>Ver Actividades</span>
              <ArrowRight size={20} />
            </button>
            <button
              onClick={() => navigate('/galeria')}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 px-10 py-4 rounded-2xl font-bold text-lg transition-all"
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
            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-yellow-100 transition-colors">
              <v.icon className="text-blue-900 w-8 h-8 group-hover:text-yellow-600" />
            </div>
            <h3 className="text-2xl mb-4">{v.title}</h3>
            <p className="text-slate-600">{v.desc}</p>
          </div>
        ))}
      </section>

      {/* Activities Preview */}
      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-4xl">Próximas Actividades</h2>
            <p className="text-slate-700 mt-2 font-medium">Participa y sé parte del cambio en Xela.</p>
          </div>
          <button
            onClick={() => navigate('/actividades')}
            className="hidden sm:flex items-center space-x-2 text-blue-900 font-bold hover:underline"
          >
            <span>Ver todas</span>
            <ArrowRight size={18} />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {MOCK_ACTIVIDADES.filter(a => a.publica).slice(0, 2).map((act) => (
            <div key={act.id} className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col md:flex-row hover:shadow-xl transition-shadow border border-slate-100">
              <img src={act.imagen} className="w-full md:w-48 h-48 object-cover" alt={act.titulo} />
              <div className="p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl mb-2">{act.titulo}</h3>
                  <div className="flex items-center text-sm text-slate-700 mb-2 font-medium">
                    <Calendar size={14} className="mr-2 text-slate-500" />
                    <span>{act.fecha}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-700 mb-4 font-medium">
                    <MapPin size={14} className="mr-2 text-slate-500" />
                    <span>{act.lugar}</span>
                  </div>
                  <p className="text-slate-750 text-sm line-clamp-2 leading-relaxed font-medium">{act.descripcion}</p>
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
