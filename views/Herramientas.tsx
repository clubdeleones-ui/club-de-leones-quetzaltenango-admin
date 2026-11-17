import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  HeartPulse,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CalendarCheck,
  Calculator,
  BookOpen,
  Wrench
} from 'lucide-react';

const Herramientas: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.12),transparent_45%)]" />
        <div className="max-w-[1200px] mx-auto relative z-10 text-center space-y-5">
          <div className="inline-flex items-center space-x-2 bg-white/10 border border-white/15 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-yellow-300">
            <Wrench size={14} />
            <span>Recursos Comunitarios Gratuitos</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Herramientas de Bienestar y Servicio
          </h1>
          <p className="text-slate-200 max-w-2xl mx-auto text-sm sm:text-base font-medium leading-relaxed">
            Planificadores interactivos, calculadoras de salud y guías prácticas basadas en evidencia científica reciente para apoyar a nuestra comunidad de Quetzaltenango.
          </p>
        </div>
      </section>

      {/* Grid de Herramientas */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card Principal: Diabetes Prevención y Cuidado */}
          <Link
            to="/herramientas/diabetes"
            className="group col-span-1 md:col-span-2 bg-white rounded-[2rem] border border-slate-200/80 shadow-lg hover:shadow-2xl hover:border-blue-400/50 transition-all duration-300 overflow-hidden flex flex-col justify-between p-6 sm:p-8"
          >
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform">
                    <HeartPulse size={28} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      Salud y Prevención • Estándares 2026
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 group-hover:text-blue-900 transition-colors">
                      Diabetes: Prevención y Cuidado Integral
                    </h2>
                  </div>
                </div>
              </div>

              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                Suite interactiva basada en los últimos avances científicos 2025–2026 (ADA/EASD, OMS e IDF). Diseñada tanto para quienes buscan <strong>prevenir</strong> la diabetes como para quienes ya viven con ella y desean planificar su <strong>cuidado diario</strong>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-center space-x-2.5 text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <CalendarCheck size={17} className="text-blue-600 shrink-0" />
                  <span>Planificador Diario "5S" y Crononutrición</span>
                </div>
                <div className="flex items-center space-x-2.5 text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <Calculator size={17} className="text-emerald-600 shrink-0" />
                  <span>Calculadoras de Metas, Peso y Sueño</span>
                </div>
                <div className="flex items-center space-x-2.5 text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <ShieldCheck size={17} className="text-amber-600 shrink-0" />
                  <span>Semáforo de Productos y Alertas FDA/OMS</span>
                </div>
                <div className="flex items-center space-x-2.5 text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <BookOpen size={17} className="text-indigo-600 shrink-0" />
                  <span>Avances 2025–2026 (Tipo 5, AID, Terapias)</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 flex items-center space-x-1.5">
                <Sparkles size={14} className="text-yellow-500" />
                <span>Guarda tu rutina automáticamente en tu dispositivo</span>
              </span>
              <span className="inline-flex items-center space-x-2 bg-blue-900 text-white px-5 py-2.5 rounded-xl text-xs font-black group-hover:bg-blue-800 transition-colors shadow-md">
                <span>Abrir Herramienta</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </Link>

          {/* Tarjeta informativa de próximas herramientas */}
          <div className="bg-gradient-to-br from-slate-100 to-blue-50/50 rounded-[2rem] border border-dashed border-slate-300 p-6 sm:p-8 flex flex-col justify-center items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-white text-blue-900 flex items-center justify-center shadow-sm border border-slate-200">
              <Activity size={26} />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full">
                Próximamente
              </span>
              <h3 className="text-lg font-black text-slate-800">
                Más Herramientas de Salud Visual y Comunitaria
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                El Club de Leones de Quetzaltenango continúa desarrollando guías interactivas de salud visual, nutrición familiar y servicio comunitario.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Herramientas;
