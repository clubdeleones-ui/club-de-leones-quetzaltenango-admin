import React from 'react';
import { 
  HeartHandshake, 
  Target, 
  Users, 
  Brain, 
  GraduationCap, 
  Award, 
  Puzzle, 
  Megaphone, 
  Settings, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  TrendingUp, 
  XOctagon,
  Quote
} from 'lucide-react';

const RetencionSocios: React.FC = () => {
  const estrategias = [
    {
      num: 1,
      icon: Target,
      color: 'from-blue-500 to-indigo-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50/50',
      borderColor: 'border-blue-100',
      title: 'Propósito Claro y Visible',
      subtitle: 'El socio no abandona el servicio… abandona la confusión.',
      fact: 'Los voluntarios permanecen cuando sienten impacto real y conexión con la misión.',
      actions: [
        'Mostrar resultados concretos de cada actividad.',
        'Contar historias de impacto (no solo informes fríos).',
        'Vincular cada proyecto con "We Serve" (Nosotros Servimos).'
      ],
      key: 'Si el socio no ve impacto → se desconecta.'
    },
    {
      num: 2,
      icon: HeartHandshake,
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50/50',
      borderColor: 'border-emerald-100',
      title: 'Experiencia del Socio',
      subtitle: 'El mayor problema del crecimiento hoy en día.',
      fact: 'Retener es 5 veces más apropiado para acompañar el esfuerzo de crecer. La mayoría de bajas se deben a fricciones internas, no a falta de interés.',
      actions: [
        'Simplificar reuniones (hacerlas menos largas, más dinámicas).',
        'Eliminar burocracia y papeleo innecesario.',
        'Hacer el club un ambiente "amigable y ágil".'
      ],
      key: 'Si pertenecer es pesado → la gente se va.'
    },
    {
      num: 3,
      icon: Brain,
      color: 'from-purple-500 to-pink-600',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50/50',
      borderColor: 'border-purple-100',
      title: 'Involucrar, No Solo Invitar',
      subtitle: 'Los socios no quieren ser espectadores pasivos.',
      fact: 'La participación en la toma de decisiones aumenta radicalmente el compromiso y la permanencia.',
      actions: [
        'Incluir a los socios en las decisiones importantes del club.',
        'Crear equipos de trabajo (evitar que todo recaiga en la junta directiva).',
        'Delegar responsabilidades y liderazgo en proyectos.'
      ],
      key: 'El socio que decide → se queda.'
    },
    {
      num: 4,
      icon: GraduationCap,
      color: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50/50',
      borderColor: 'border-amber-100',
      title: 'Crecimiento Personal y Liderazgo',
      subtitle: 'El leonismo compite hoy con el tiempo, no con otras ONG.',
      fact: 'Ofrecer desarrollo de habilidades y oportunidades de crecimiento aumenta el valor percibido.',
      actions: [
        'Formación constante (liderazgo, comunicación, oratoria, gestión de proyectos).',
        'Ofrecer roles y retos progresivos dentro del club.',
        'Integrar activamente a jóvenes de programas Leo a Lions.'
      ],
      key: 'Si el club no aporta crecimiento → pierde valor.'
    },
    {
      num: 5,
      icon: Award,
      color: 'from-yellow-500 to-amber-600',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50/50',
      borderColor: 'border-yellow-100',
      title: 'Reconocimiento Real',
      subtitle: 'Agradecimiento honesto y oportuno, no solo formal.',
      fact: 'El reconocimiento sincero es uno de los factores psicológicos más potentes para la retención.',
      actions: [
        'Brindar reconocimiento público de manera frecuente.',
        'Celebrar incluso los logros más pequeños en equipo.',
        'Expresar agradecimiento personalizado por esfuerzos específicos.'
      ],
      key: 'El socio que se siente invisible → se va.'
    },
    {
      num: 6,
      icon: Puzzle,
      color: 'from-cyan-500 to-blue-600',
      textColor: 'text-cyan-600',
      bgColor: 'bg-cyan-50/50',
      borderColor: 'border-cyan-100',
      title: 'Sentido de Comunidad',
      subtitle: 'El factor oculto pero fundamental en la cohesión.',
      fact: 'Crear lazos de verdadera hermandad aumenta el sentido de pertenencia y permanencia a largo plazo.',
      actions: [
        'Organizar actividades sociales y de convivencia (no todo debe ser trabajo).',
        'Propiciar la integración familiar en eventos clave.',
        'Fomentar una cultura interna de amistad real y apoyo mutuo.'
      ],
      key: 'La gente no deja clubes… deja ambientes.'
    },
    {
      num: 7,
      icon: Megaphone,
      color: 'from-rose-500 to-red-600',
      textColor: 'text-rose-600',
      bgColor: 'bg-rose-50/50',
      borderColor: 'border-rose-100',
      title: 'Comunicación Permanente',
      subtitle: 'La conexión constante mantiene el vínculo activo.',
      fact: 'El distanciamiento informativo es el primer paso hacia el abandono definitivo.',
      actions: [
        'Mantener un grupo de WhatsApp activo y enfocado del club.',
        'Compartir boletines o resúmenes simples, visuales y claros.',
        'Hacer llamadas de seguimiento amigables a socios ausentes.'
      ],
      key: 'El silencio es abandono.'
    },
    {
      num: 8,
      icon: Settings,
      color: 'from-slate-500 to-slate-700',
      textColor: 'text-slate-600',
      bgColor: 'bg-slate-50/50',
      borderColor: 'border-slate-200',
      title: 'Modelo Moderno de Club',
      subtitle: 'Muchos clubes pierden socios por insistir en esquemas obsoletos.',
      fact: 'Adaptar los formatos de participación a la realidad actual es indispensable para sobrevivir.',
      actions: [
        'Adoptar clubes más flexibles en horarios y formatos de participación.',
        'Priorizar proyectos de alto impacto y amplia visibilidad.',
        'Usar tecnología activamente (reuniones híbridas, redes sociales, gestión digital).'
      ],
      key: 'El mundo cambió… el club también debe hacerlo.'
    }
  ];

  const errores = [
    'Reuniones excesivamente largas, burocráticas y aburridas.',
    'Falta de proyectos visibles y de impacto que motiven al socio.',
    'Liderazgos cerrados que no delegan ni aceptan nuevas ideas.',
    'Falta de un proceso de integración cálido y estructurado para nuevos socios.',
    'Cultura interna débil, con fricciones, chismes o divisiones.'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left">
      {/* Banner Principal */}
      <header className="relative bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white overflow-hidden border-b-4 border-yellow-500 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-700/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-800/10 rounded-full blur-3xl -z-10" />
        
        <div className="flex flex-col md:flex-row items-center md:justify-between gap-6 relative z-10">
          <div className="space-y-4 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 bg-yellow-500/10 border border-yellow-500/30 px-4 py-1.5 rounded-full text-yellow-400 text-xs font-black tracking-widest uppercase">
              <Sparkles size={14} className="animate-pulse" />
              <span>Estrategia del Socio (AC III)</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Estrategia Real de Retención
            </h1>
            <p className="text-blue-100/80 text-sm sm:text-base md:text-lg max-w-2xl font-medium">
              Lineamientos estratégicos orientados a optimizar la permanencia y el compromiso voluntario en los Clubes de Leones de Latinoamérica, México y el Caribe.
            </p>
          </div>
          <div className="flex-shrink-0 bg-yellow-400 text-blue-950 p-6 rounded-[2rem] shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-300">
            <HeartHandshake size={56} className="stroke-[1.5]" />
          </div>
        </div>
      </header>

      {/* Filosofía Central - Hero Card */}
      <section className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-blue-900" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
          <div className="lg:col-span-3 space-y-4">
            <h2 className="text-slate-500 font-black tracking-widest uppercase text-xs">La Filosofía de la Retención</h2>
            <p className="text-xl md:text-2xl font-black text-slate-800 leading-snug">
              "Los clubes que pierden socios históricamente no tienen un problema de reclutamiento… tienen un problema de experiencia del socio."
            </p>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
              Lo que funciona en el voluntariado como el nuestro está bastante claro: la gente no se va por falta de buena voluntad, se va por falta de valor, conexión y propósito.
            </p>
          </div>
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-50 to-blue-50/50 border border-slate-100 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 text-blue-900 font-extrabold text-sm">
              <TrendingUp size={18} />
              <span>Crecimiento Sostenible</span>
            </div>
            <div className="space-y-2 text-xs md:text-sm text-slate-600 font-medium leading-relaxed">
              <p>👉 <strong>Reclutar</strong> es traer gente a la puerta.</p>
              <p>👉 <strong>Retener</strong> es crear una experiencia tan significativa dentro del club que nadie quiera salir.</p>
              <p className="text-blue-900 font-black mt-2">¡Enfocar esfuerzos en la experiencia es 5 veces más rentable y sostenible!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Las 8 Estrategias Grid */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800">Pilares de la Estrategia Real</h2>
          <p className="text-slate-500 text-sm sm:text-base">Haz clic o pasa el cursor sobre cada estrategia para conocer sus acciones clave.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {estrategias.map((est) => {
            const IconComponent = est.icon;
            return (
              <div 
                key={est.num} 
                className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-5">
                  {/* Encabezado de la Tarjeta */}
                  <div className="flex items-center justify-between">
                    <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${est.color} text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent size={24} className="stroke-[2]" />
                    </div>
                    <span className="text-3xl font-black text-slate-150 group-hover:text-blue-900/10 transition-colors">
                      {String(est.num).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Textos */}
                  <div className="space-y-2">
                    <h3 className="text-lg md:text-xl font-black text-slate-800 group-hover:text-blue-900 transition-colors">
                      {est.title}
                    </h3>
                    <p className="text-blue-900/60 text-xs md:text-sm font-bold italic leading-tight">
                      "{est.subtitle}"
                    </p>
                    <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
                      {est.fact}
                    </p>
                  </div>

                  {/* Acciones (Qué hacer) */}
                  <div className={`${est.bgColor} border ${est.borderColor} rounded-2xl p-4 md:p-5 space-y-3`}>
                    <span className={`text-[10px] font-black uppercase tracking-wider block ${est.textColor}`}>
                      ¿Qué hacer? (Plan de Acción)
                    </span>
                    <ul className="space-y-2 text-xs text-slate-700 font-medium">
                      {est.actions.map((act, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className={`text-sm mt-0.5 ${est.textColor}`}>•</span>
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Llave / Conclusión de tarjeta */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center space-x-2 text-xs font-bold text-slate-700">
                  <span className="bg-yellow-400 text-blue-950 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                    Llave
                  </span>
                  <span className="italic">{est.key}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Los 5 errores que generan bajas */}
      <section className="bg-red-50/30 border border-red-100 rounded-3xl p-6 md:p-10 shadow-sm space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-red-500" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-red-600 font-black tracking-widest uppercase text-xs flex items-center space-x-1.5">
              <AlertTriangle size={14} />
              <span>Alerta de Gestión</span>
            </h2>
            <h3 className="text-2xl font-black text-slate-800">
              🚨 Los 5 Errores que Generan Bajas
            </h3>
            <p className="text-slate-500 text-sm">Directo y sin rodeos. Evitar estas conductas reduce sustancialmente el abandono de socios.</p>
          </div>
          <div className="bg-red-100 text-red-700 p-4 rounded-2xl flex-shrink-0 flex items-center justify-center">
            <XOctagon size={36} className="stroke-[1.5]" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {errores.map((err, idx) => (
            <div key={idx} className="bg-white border border-red-100 rounded-2xl p-5 space-y-3 shadow-sm hover:border-red-300 transition-all flex flex-col justify-between">
              <span className="bg-red-50 text-red-600 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm">
                {idx + 1}
              </span>
              <p className="text-slate-700 text-xs md:text-sm font-bold leading-snug">
                {err}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Conclusión Estratégica & Frase Clave */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Checklist */}
        <div className="lg:col-span-5 bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h2 className="text-slate-500 font-black tracking-widest uppercase text-xs">Conclusión Estratégica</h2>
            <h3 className="text-xl md:text-2xl font-black text-slate-800">Un club de Leones fuerte hoy es:</h3>
            <div className="space-y-3">
              {[
                { label: 'Dinámico', desc: 'Reuniones rápidas y orientadas a la acción.' },
                { label: 'Participativo', desc: 'Todos los socios tienen voz, voto y un rol activo.' },
                { label: 'Visible', desc: 'Obras y servicios comunicados con impacto local.' },
                { label: 'Humano', desc: 'Centrado en las personas, la amistad y la empatía.' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start space-x-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <span className="font-black text-slate-800 text-sm block">{item.label}</span>
                    <span className="text-slate-500 text-xs">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-blue-900 text-white p-4 rounded-2xl text-center text-xs font-black uppercase tracking-wider">
            Retener mejor para crecer de forma sostenible
          </div>
        </div>

        {/* Frase de Cierre */}
        <div className="lg:col-span-7 bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-3xl p-8 md:p-10 flex flex-col justify-between relative overflow-hidden shadow-md">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -z-10" />
          <div className="absolute top-4 left-4 text-blue-800">
            <Quote size={80} className="stroke-[1.5] opacity-20" />
          </div>

          <div className="space-y-4 relative z-10">
            <span className="text-yellow-400 font-black tracking-widest uppercase text-xs block">
              Frase Clave para tu Gestión
            </span>
            <p className="text-2xl md:text-3xl font-black leading-tight italic tracking-tight text-yellow-100">
              "No perdemos socios por falta de servicio, los perdemos por falta de experiencia significativa dentro del club."
            </p>
          </div>

          <div className="pt-6 border-t border-white/10 flex items-center space-x-3 text-xs text-blue-200">
            <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping" />
            <span className="font-bold uppercase tracking-wider">Enfoque y abordaje institucional</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RetencionSocios;
