import React, { useState } from 'react';
import { 
  Cpu, 
  Sparkles, 
  Laptop, 
  GraduationCap, 
  Bot, 
  BrainCircuit, 
  Code, 
  HeartHandshake, 
  CheckCircle2, 
  ArrowRight, 
  School, 
  Users, 
  Layers, 
  Send, 
  Share2, 
  BookOpen, 
  HelpCircle,
  Award,
  ChevronRight,
  ShieldCheck,
  MessageSquare,
  Sparkle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { telegramService } from '../services/telegramService';

export const ProgramaFuturo: React.FC = () => {
  const { showToast } = useToast();
  const [activeTabModule, setActiveTabModule] = useState<'modulo1' | 'modulo2' | 'modulo3'>('modulo1');
  const [formTipo, setFormTipo] = useState<'escuela' | 'donante'>('escuela');
  const [nombreContacto, setNombreContacto] = useState('');
  const [institucion, setInstitucion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [municipio, setMunicipio] = useState('Quetzaltenango');
  const [mensaje, setMensaje] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSent, setFormSent] = useState(false);

  const acronymLetters = [
    {
      letter: 'F',
      word: 'Fortalecimiento',
      desc: 'Infraestructura robusta y dotación de hardware moderno para centros educativos con alta necesidad.',
      color: 'from-amber-400 to-yellow-500',
      textColor: 'text-amber-400',
      bgGlow: 'shadow-amber-500/20'
    },
    {
      letter: 'U',
      word: 'Unidades',
      desc: 'Espacios físicos y laboratorios inteligentes acondicionados con ergonomía y conectividad.',
      color: 'from-yellow-400 to-amber-500',
      textColor: 'text-yellow-400',
      bgGlow: 'shadow-yellow-500/20'
    },
    {
      letter: 'T',
      word: 'Tecnológicas',
      desc: 'Equipamiento con computadoras actualizadas, periféricos de calidad y plataformas de software abierto.',
      color: 'from-cyan-400 to-blue-500',
      textColor: 'text-cyan-400',
      bgGlow: 'shadow-cyan-500/20'
    },
    {
      letter: 'U',
      word: 'Uso y Aprendizaje',
      desc: 'Metodología pedagógica activa centrada en la resolución de problemas y la alfabetización digital.',
      color: 'from-blue-400 to-indigo-500',
      textColor: 'text-blue-400',
      bgGlow: 'shadow-blue-500/20'
    },
    {
      letter: 'R',
      word: 'Responsable',
      desc: 'Formación ética en ciberseguridad, ciudadanía digital y uso consciente de la Inteligencia Artificial.',
      color: 'from-emerald-400 to-teal-500',
      textColor: 'text-emerald-400',
      bgGlow: 'shadow-emerald-500/20'
    },
    {
      letter: 'O',
      word: 'Oportunidades',
      desc: 'Apertura de horizontes vocacionales, becas y empleabilidad temprana en ciencia y tecnología.',
      color: 'from-purple-400 to-pink-500',
      textColor: 'text-purple-400',
      bgGlow: 'shadow-purple-500/20'
    }
  ];

  const modules = [
    {
      id: 'modulo1',
      title: 'Módulo 1: Fundamentos Digitales & Lógica',
      level: 'Nivel Inicial (Niños 8-12 años)',
      icon: Laptop,
      color: 'border-blue-500/50 bg-blue-900/30 text-blue-400',
      description: 'Inmersión en el ecosistema informático, mecanografía ágil, herramientas de productividad, navegación segura y primeros pasos en pensamiento computacional con bloques.',
      topics: [
        'Manejo del Sistema Operativo y Archivos',
        'Ofimática en la Nube y Colaboración',
        'Lógica y Algoritmos Básicos con Scratch',
        'Ciberseguridad y Hábitos Digitales Saludables'
      ]
    },
    {
      id: 'modulo2',
      title: 'Módulo 2: Programación, Web & Robótica',
      level: 'Nivel Intermedio (Jóvenes 12-16 años)',
      icon: Code,
      color: 'border-cyan-500/50 bg-cyan-900/30 text-cyan-400',
      description: 'Transición del código visual al texto formal. Creación de páginas web, automatizaciones básicas y proyectos de robótica aplicada a retos comunitarios de Quetzaltenango.',
      topics: [
        'Introducción a Python y JavaScript',
        'Desarrollo Web Responsive (HTML5 & CSS3)',
        'Microcontroladores y Sensores Comunitarios',
        'Trabajo en Equipo y Metodologías Ágiles'
      ]
    },
    {
      id: 'modulo3',
      title: 'Módulo 3: Inteligencia Artificial & Innovación Social',
      level: 'Nivel Avanzado (Jóvenes 14-18 años)',
      icon: BrainCircuit,
      color: 'border-purple-500/50 bg-purple-900/30 text-purple-400',
      description: 'Aprender cómo funciona la IA, cómo construir prompts estructurados, entrenar modelos sencillos de visión computacional y aplicar la IA éticamente para el progreso social.',
      topics: [
        'Principios de Inteligencia Artificial & Machine Learning',
        'Ingeniería de Prompts y Creatividad con IA Generativa',
        'Ética de Datos, Sesgos y Uso Responsable de la IA',
        'Proyecto Final de Innovación para su Comunidad'
      ]
    }
  ];

  const testimonials = [
    {
      name: 'Licda. María Elena Sac',
      role: 'Directora Escuela Oficial Rural Mixta, Cantón Chichigüitán',
      text: 'El laboratorio de computación del Programa FUTURO cambió radicalmente la motivación de nuestros estudiantes. Hoy niños que nunca habían tocado una computadora están aprendiendo a programar con entusiasmo.',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80'
    },
    {
      name: 'Carlos David Hernández (14 años)',
      role: 'Estudiante y Becario del Módulo de Inteligencia Artificial',
      text: 'Nunca pensé que a mi edad podría entender cómo funciona la Inteligencia Artificial. En el club aprendí que la tecnología no es solo para jugar, sino para crear soluciones útiles para mi comunidad.',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80'
    },
    {
      name: 'Ing. Rodrigo Cifuentes',
      role: 'Socio León & Coordinador del Comité Tecnológico',
      text: 'F.U.T.U.R.O. es la respuesta del Club de Leones Quetzaltenango a la brecha digital. No solo entregamos computadoras, entregamos un currículo vivo que prepara a las nuevas generaciones para el mundo real.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreContacto.trim() || !telefono.trim() || !institucion.trim()) {
      showToast('Por favor completa los campos requeridos.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        tipo: formTipo === 'escuela' ? 'Solicitud de Laboratorio Escolar' : 'Propuesta de Donante / Padrino',
        nombre: nombreContacto.trim(),
        institucion: institucion.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        municipio,
        mensaje: mensaje.trim(),
        fecha: new Date().toISOString()
      };

      await telegramService.notifyGeneral(
        `🚀 *NUEVA SOLICITUD - PROGRAMA F.U.T.U.R.O.*\n\n` +
        `📌 *Tipo:* ${payload.tipo}\n` +
        `👤 *Contacto:* ${payload.nombre}\n` +
        `🏫 *Institución / Empresa:* ${payload.institucion}\n` +
        `📍 *Municipio:* ${payload.municipio}\n` +
        `📞 *Teléfono:* ${payload.telefono}\n` +
        `✉️ *Correo:* ${payload.email || 'No especificado'}\n` +
        `📝 *Detalle:* ${payload.mensaje || 'Sin mensaje adicional'}`
      ).catch(err => console.warn("Telegram notification error:", err));

      setFormSent(true);
      showToast('¡Solicitud enviada con éxito al Comité del Programa FUTURO!', 'success');
    } catch (err) {
      console.error("Error submitting FUTURO form:", err);
      showToast('Hubo un error al enviar la solicitud. Intenta nuevamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setNombreContacto('');
    setInstitucion('');
    setTelefono('');
    setEmail('');
    setMensaje('');
    setFormSent(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-yellow-500 selection:text-blue-955">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-20 pb-28 md:pt-28 md:pb-36 bg-gradient-to-b from-blue-955 via-blue-900/60 to-slate-950">
        {/* Futuristic Background Lights */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-yellow-500/15 via-cyan-500/20 to-blue-600/15 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-purple-600/10 blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          {/* Badge Acronym */}
          <div className="inline-flex items-center space-x-2 bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 rounded-full shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-500">
            <Sparkles size={16} className="text-yellow-400 animate-spin-slow" />
            <span className="text-xs sm:text-sm font-black tracking-widest text-yellow-300 uppercase">
              Programa Insignia de Innovación & Educación Digital
            </span>
          </div>

          {/* Main Title */}
          <div className="space-y-4 max-w-5xl mx-auto">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-none">
              Programa <span className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">F.U.T.U.R.O.</span>
            </h1>
            <p className="text-lg sm:text-2xl font-extrabold text-cyan-300 max-w-4xl mx-auto leading-snug">
              Fortalecimiento de Unidades Tecnológicas para un Aprendizaje Responsable y con Oportunidades
            </p>
            <p className="text-sm sm:text-base text-slate-300 max-w-3xl mx-auto font-medium leading-relaxed">
              Dotamos a escuelas públicas y comunidades de Quetzaltenango con laboratorios de computación de alto impacto y un programa formativo modular que incluye <strong>pensamiento computacional, robótica e Inteligencia Artificial</strong> para niños y adolescentes.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="#postular"
              className="inline-flex items-center space-x-2.5 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 hover:from-yellow-400 hover:to-amber-300 text-blue-955 font-black px-7 py-4 rounded-2xl text-sm transition-all duration-300 shadow-xl shadow-yellow-500/20 hover:scale-105 active:scale-95"
            >
              <School size={18} />
              <span>Solicitar para mi Escuela</span>
              <ArrowRight size={16} />
            </a>

            <a
              href="#modulos"
              className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-4 rounded-2xl text-sm transition-all border border-white/15 backdrop-blur-md"
            >
              <Bot size={18} className="text-cyan-400" />
              <span>Ver Currículo de IA & Módulos</span>
            </a>

            <a
              href="#donar-laboratorio"
              className="inline-flex items-center space-x-2 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 font-bold px-6 py-4 rounded-2xl text-sm transition-all border border-emerald-500/30"
            >
              <HeartHandshake size={18} className="text-emerald-400" />
              <span>Apadrinar un Laboratorio</span>
            </a>
          </div>

          {/* Quick Metrics Pills */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-10 border-t border-white/10">
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
              <span className="block text-3xl font-black text-yellow-400">15+</span>
              <span className="text-xs font-semibold text-slate-300">Escuelas Meta 2026-2027</span>
            </div>
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
              <span className="block text-3xl font-black text-cyan-400">+300</span>
              <span className="text-xs font-semibold text-slate-300">Computadoras Dotadas</span>
            </div>
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
              <span className="block text-3xl font-black text-emerald-400">+2,500</span>
              <span className="text-xs font-semibold text-slate-300">Niños & Jóvenes Beneficiados</span>
            </div>
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
              <span className="block text-3xl font-black text-purple-400">100%</span>
              <span className="text-xs font-semibold text-slate-300">Formación en Era de las IA</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SIGNIFICADO DEL ACRÓNIMO INTERACTIVO */}
      <section className="py-20 bg-slate-900 border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-yellow-400 bg-yellow-500/10 px-3.5 py-1 rounded-full border border-yellow-500/20">
              Arquitectura del Concepto
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              ¿Por qué se llama <span className="text-yellow-400">F.U.T.U.R.O.</span>?
            </h2>
            <p className="text-sm text-slate-300 font-medium">
              Cada letra de nuestro acrónimo define un compromiso técnico y social que garantiza la sostenibilidad de los laboratorios y el éxito educativo de los estudiantes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {acronymLetters.map((item, idx) => (
              <div 
                key={idx}
                className="bg-gradient-to-br from-blue-955/80 to-slate-900/90 p-6 rounded-3xl border border-white/10 hover:border-yellow-500/40 transition-all duration-300 hover:-translate-y-1 shadow-xl space-y-3 group"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} text-blue-955 font-black text-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    {item.letter}
                  </div>
                  <div>
                    <h3 className={`text-xl font-black ${item.textColor}`}>{item.word}</h3>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pilar #{idx + 1}</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium pt-1">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. LOS 3 PILARES INTEGRALES: INFRAESTRUCTURA + IA + EDUCACIÓN MODULAR */}
      <section id="modulos" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-xs font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3.5 py-1 rounded-full border border-cyan-500/20">
            Ruta Educativa Innovadora
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Educación Modular en la <span className="text-cyan-400">Era de la IA</span>
          </h2>
          <p className="text-sm text-slate-300 font-medium leading-relaxed">
            Nuestro modelo pedagógico se adapta al nivel de cada escuela mediante módulos de aprendizaje progresivos, garantizando que cada estudiante adquiera competencias reales para el presente y el futuro.
          </p>
        </div>

        {/* Modular Tabs Selector */}
        <div className="flex flex-wrap justify-center gap-3">
          {modules.map((m) => {
            const isSelected = activeTabModule === m.id;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => setActiveTabModule(m.id as any)}
                className={`flex items-center space-x-3 px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-yellow-500 text-blue-955 border-yellow-400 shadow-xl shadow-yellow-500/20 scale-105'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span>{m.title.split(':')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Active Module Showcase */}
        {(() => {
          const cur = modules.find(m => m.id === activeTabModule)!;
          const Icon = cur.icon;
          return (
            <div className="bg-gradient-to-br from-blue-955 via-slate-900 to-blue-955 p-8 md:p-12 rounded-[2.5rem] border border-yellow-500/30 shadow-2xl space-y-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 flex items-center justify-center">
                    <Icon size={32} />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-yellow-400 block">{cur.level}</span>
                    <h3 className="text-2xl sm:text-3xl font-black text-white">{cur.title}</h3>
                  </div>
                </div>
                <div className="inline-flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-xl text-xs font-bold text-slate-200">
                  <Award size={16} className="text-yellow-400" />
                  <span>Certificación Oficial Leonística</span>
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
                {cur.description}
              </p>

              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-yellow-400">Contenido Programático del Módulo:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {cur.topics.map((t, i) => (
                    <div key={i} className="flex items-center space-x-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={14} className="stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-slate-100">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* 3 Pillars Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
          <div className="bg-blue-900/30 p-8 rounded-3xl border border-blue-500/20 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black">
              <Laptop size={24} />
            </div>
            <h3 className="text-xl font-black text-white">1. Infraestructura Total</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Equipamos aulas completas con computadoras de última generación, conectividad Wi-Fi segura, cableado estructurado y mesas ergonómicas.
            </p>
          </div>

          <div className="bg-purple-900/30 p-8 rounded-3xl border border-purple-500/20 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black">
              <Bot size={24} />
            </div>
            <h3 className="text-xl font-black text-white">2. Currículo de IA & Robótica</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Capacitamos a niños y adolescentes para que no sean solo consumidores pasivos de tecnología, sino creadores e innovadores éticos en la era de las IA.
            </p>
          </div>

          <div className="bg-emerald-900/30 p-8 rounded-3xl border border-emerald-500/20 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
              <GraduationCap size={24} />
            </div>
            <h3 className="text-xl font-black text-white">3. Formación de Formadores</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Capacitamos a los maestros de las escuelas locales y a voluntarios universitarios para asegurar la sostenibilidad y continuidad pedagógica a largo plazo.
            </p>
          </div>
        </div>
      </section>

      {/* 4. GALERÍA DE IMPACTO & LABORATORIOS (Slots para fotos y memorias) */}
      <section className="py-20 bg-slate-900/80 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/20">
                Evidencia de Campo
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">Galería de Transformación Digital</h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">Momentos de entrega, talleres interactivos y laboratorios activos en Quetzaltenango.</p>
            </div>
            <Link 
              to="/galeria"
              className="inline-flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-yellow-400 hover:text-yellow-300 border border-yellow-500/30 px-4 py-2.5 rounded-xl bg-yellow-500/10"
            >
              <span>Ver Archivo Fotográfico Completo</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Foto 1 */}
            <div className="group relative rounded-3xl overflow-hidden bg-slate-800 border border-white/10 shadow-xl">
              <div className="h-56 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80" 
                  alt="Laboratorio de Computación" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-5 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-md border border-cyan-500/20">
                  Infraestructura
                </span>
                <h4 className="text-base font-bold text-white leading-snug">Dotación de Computadoras de Alto Rendimiento</h4>
                <p className="text-xs text-slate-300 font-medium">Acondicionamiento de red estructurada y estaciones de trabajo seguras para estudiantes.</p>
              </div>
            </div>

            {/* Foto 2 */}
            <div className="group relative rounded-3xl overflow-hidden bg-slate-800 border border-white/10 shadow-xl">
              <div className="h-56 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80" 
                  alt="Taller de IA y Programación" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-5 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-md border border-purple-500/20">
                  Formación Modular
                </span>
                <h4 className="text-base font-bold text-white leading-snug">Taller Práctico de IA & Creación de Contenido</h4>
                <p className="text-xs text-slate-300 font-medium">Adolescentes aprendiendo el funcionamiento de modelos generativos y pensamiento algorítmico.</p>
              </div>
            </div>

            {/* Foto 3 */}
            <div className="group relative rounded-3xl overflow-hidden bg-slate-800 border border-white/10 shadow-xl">
              <div className="h-56 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=600&q=80" 
                  alt="Inauguración de Aula Digital" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-5 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                  Comunidad Leonística
                </span>
                <h4 className="text-base font-bold text-white leading-snug">Inauguración con Directores y Padres de Familia</h4>
                <p className="text-xs text-slate-300 font-medium">Firma de compromiso comunitario para el cuidado, mantenimiento y aprovechamiento del aula.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TESTIMONIOS Y COMENTARIOS */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-black uppercase tracking-widest text-yellow-400 bg-yellow-500/10 px-3.5 py-1 rounded-full border border-yellow-500/20">
            Voces del Programa
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">Comentarios & Testimonios</h2>
          <p className="text-xs sm:text-sm text-slate-300 font-medium">El impacto directo en nuestras escuelas y en la vida de los estudiantes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div 
              key={idx}
              className="bg-blue-955/70 p-6 rounded-3xl border border-white/10 shadow-xl flex flex-col justify-between space-y-4"
            >
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium italic">
                "{t.text}"
              </p>
              <div className="flex items-center space-x-3 pt-4 border-t border-white/10">
                <img 
                  src={t.avatar} 
                  alt={t.name} 
                  className="w-11 h-11 rounded-full object-cover border-2 border-yellow-500/40"
                />
                <div>
                  <h4 className="text-sm font-black text-white leading-tight">{t.name}</h4>
                  <span className="text-[11px] text-yellow-400 font-semibold block">{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. FORMULARIO DE POSTULACIÓN / APADRINAMIENTO */}
      <section id="postular" className="py-24 bg-gradient-to-b from-slate-900 to-blue-955 border-t border-white/10">
        <div id="donar-laboratorio" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3.5 py-1 rounded-full border border-cyan-500/20">
              Participa en el Programa
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Postula tu Escuela o <span className="text-yellow-400">Apadrina un Laboratorio</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl mx-auto">
              Si eres director de una escuela pública o representas a una empresa donante interesada en transformar la educación, contáctanos hoy mismo.
            </p>
          </div>

          <div className="bg-blue-955/90 p-8 sm:p-10 rounded-[2.5rem] border border-yellow-500/40 shadow-2xl">
            {formSent ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-2xl font-black text-white">¡Solicitud Recibida con Éxito!</h3>
                <p className="text-xs sm:text-sm text-slate-200 max-w-md mx-auto leading-relaxed">
                  Gracias por tu interés en el <strong>Programa F.U.T.U.R.O.</strong> Nuestro Comité de Innovación y Educación del Club de Leones Quetzaltenango se comunicará contigo en breve para coordinar una visita técnica o reunión de apadrinamiento.
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-4 bg-yellow-500 text-blue-955 font-black text-xs uppercase px-6 py-3 rounded-xl hover:bg-yellow-400 transition-colors"
                >
                  Enviar otra consulta
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Selector de Tipo */}
                <div className="grid grid-cols-2 gap-3 p-1.5 bg-blue-900/50 rounded-2xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setFormTipo('escuela')}
                    className={`py-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                      formTipo === 'escuela' 
                        ? 'bg-yellow-500 text-blue-955 shadow-md' 
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <School size={16} />
                    <span>Soy Director / Escuela</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormTipo('donante')}
                    className={`py-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                      formTipo === 'donante' 
                        ? 'bg-yellow-500 text-blue-955 shadow-md' 
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <HeartHandshake size={16} />
                    <span>Soy Donante / Empresa</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Nombre Completo del Contacto *
                    </label>
                    <input
                      type="text"
                      required
                      value={nombreContacto}
                      onChange={(e) => setNombreContacto(e.target.value)}
                      placeholder="Ej. Prof. Juan Manuel Pérez"
                      className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      {formTipo === 'escuela' ? 'Nombre de la Escuela / Instituto *' : 'Empresa u Organización Donante *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={institucion}
                      onChange={(e) => setInstitucion(e.target.value)}
                      placeholder={formTipo === 'escuela' ? "Ej. EORM Cantón Las Majadas" : "Ej. Fundación / Empresa Tecnológica"}
                      className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="Ej. 5555-1234"
                      className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contacto@ejemplo.com"
                      className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                </div>

                <div className="text-left">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Municipio / Ubicación
                  </label>
                  <select
                    value={municipio}
                    onChange={(e) => setMunicipio(e.target.value)}
                    className="w-full bg-slate-900/90 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-400 cursor-pointer"
                  >
                    <option value="Quetzaltenango">Quetzaltenango (Cabecera)</option>
                    <option value="Salcajá">Salcajá</option>
                    <option value="San Juan Ostuncalco">San Juan Ostuncalco</option>
                    <option value="Cantel">Cantel</option>
                    <option value="Almolonga">Almolonga</option>
                    <option value="Zunil">Zunil</option>
                    <option value="La Esperanza">La Esperanza</option>
                    <option value="Olintepeque">Olintepeque</option>
                    <option value="San Carlos Sija">San Carlos Sija</option>
                    <option value="Coatepeque">Coatepeque</option>
                    <option value="Otro Municipio de Quetzaltenango">Otro Municipio / Región</option>
                  </select>
                </div>

                <div className="text-left">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    {formTipo === 'escuela' 
                      ? 'Cuéntanos sobre las necesidades de tu escuela (Nº de alumnos, si tienen aula disponible, etc.)' 
                      : 'Cuéntanos cómo te gustaría colaborar (Donación de computadoras, apadrinamiento, voluntariado de capacitación)'}
                  </label>
                  <textarea
                    rows={3}
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="Escribe aquí los detalles..."
                    className="w-full bg-slate-900/90 border border-white/15 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 hover:from-yellow-400 hover:to-amber-300 text-blue-955 font-black px-6 py-4 rounded-2xl text-base transition-all duration-300 shadow-xl shadow-yellow-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-blue-955 border-t-transparent rounded-full animate-spin"></div>
                      <span>Enviando al Comité...</span>
                    </div>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>{formTipo === 'escuela' ? 'Enviar Postulación de Escuela' : 'Enviar Propuesta de Apadrinamiento'}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProgramaFuturo;
