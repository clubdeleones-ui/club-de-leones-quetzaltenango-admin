import React, { useState } from 'react';
import { 
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
  Award, 
  ChevronRight, 
  Send
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
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
      iconBg: 'bg-amber-500 text-white'
    },
    {
      letter: 'U',
      word: 'Unidades',
      desc: 'Espacios físicos y laboratorios inteligentes acondicionados con ergonomía y conectividad.',
      color: 'from-yellow-400 to-amber-500',
      badgeBg: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      iconBg: 'bg-yellow-500 text-blue-955'
    },
    {
      letter: 'T',
      word: 'Tecnológicas',
      desc: 'Equipamiento con computadoras actualizadas, periféricos de calidad y plataformas de software abierto.',
      color: 'from-cyan-500 to-blue-600',
      badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      iconBg: 'bg-cyan-600 text-white'
    },
    {
      letter: 'U',
      word: 'Uso y Aprendizaje',
      desc: 'Metodología pedagógica activa centrada en la resolución de problemas y la alfabetización digital.',
      color: 'from-blue-600 to-indigo-600',
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
      iconBg: 'bg-blue-700 text-white'
    },
    {
      letter: 'R',
      word: 'Responsable',
      desc: 'Formación ética en ciberseguridad, ciudadanía digital y uso consciente de la Inteligencia Artificial.',
      color: 'from-emerald-500 to-teal-600',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      iconBg: 'bg-emerald-600 text-white'
    },
    {
      letter: 'O',
      word: 'Oportunidades',
      desc: 'Apertura de horizontes vocacionales, becas y empleabilidad temprana en ciencia y tecnología.',
      color: 'from-purple-500 to-pink-600',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
      iconBg: 'bg-purple-600 text-white'
    }
  ];

  const modules = [
    {
      id: 'modulo1',
      title: 'Módulo 1: Fundamentos Digitales & Lógica',
      level: 'Nivel Inicial (Niños 8-12 años)',
      icon: Laptop,
      color: 'border-blue-200 bg-blue-50/60',
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
      color: 'border-cyan-200 bg-cyan-50/60',
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
      color: 'border-purple-200 bg-purple-50/60',
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 font-sans">
      {/* 1. CUADRO FLOTANTE HEADER (HERO EN AZULES LEONÍSTICOS) */}
      <div className="bg-gradient-to-br from-blue-955 via-blue-900 to-indigo-950 rounded-[2.5rem] p-8 sm:p-14 shadow-2xl text-white relative overflow-hidden border border-blue-800/50">
        {/* Glows */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cyan-500/15 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 bg-yellow-500/15 border border-yellow-500/30 px-4 py-1.5 rounded-full shadow-md">
            <Sparkles size={16} className="text-yellow-400" />
            <span className="text-xs font-black tracking-widest text-yellow-300 uppercase">
              Programa Insignia de Innovación & Educación Digital
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
              Programa <span className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">F.U.T.U.R.O.</span>
            </h1>
            <p className="text-base sm:text-xl font-bold text-cyan-300 leading-snug">
              Fortalecimiento de Unidades Tecnológicas para un Aprendizaje Responsable y con Oportunidades
            </p>
            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl mx-auto font-medium leading-relaxed opacity-95">
              Dotamos laboratorios de computación de alto rendimiento a escuelas públicas de Quetzaltenango y formamos a niños y jóvenes en <strong>pensamiento computacional, robótica e Inteligencia Artificial modular</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <a
              href="#postular-seccion"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-blue-955 font-black px-6 py-3.5 rounded-2xl text-xs sm:text-sm transition-all shadow-lg shadow-yellow-500/20 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <School size={16} />
              <span>Solicitar para mi Escuela</span>
              <ArrowRight size={14} />
            </a>

            <a
              href="#modulos-seccion"
              className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-3.5 rounded-2xl text-xs sm:text-sm transition-all border border-white/15 backdrop-blur-md cursor-pointer"
            >
              <Bot size={16} className="text-cyan-400" />
              <span>Ver Currículo de IA</span>
            </a>

            <a
              href="#postular-seccion"
              onClick={() => setFormTipo('donante')}
              className="inline-flex items-center space-x-2 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 font-bold px-5 py-3.5 rounded-2xl text-xs sm:text-sm transition-all border border-emerald-500/30 cursor-pointer"
            >
              <HeartHandshake size={16} />
              <span>Apadrinar Laboratorio</span>
            </a>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-white/10">
            <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/5">
              <span className="block text-2xl font-black text-yellow-400">15+</span>
              <span className="text-[11px] font-bold text-slate-200">Escuelas Meta</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/5">
              <span className="block text-2xl font-black text-cyan-400">+300</span>
              <span className="text-[11px] font-bold text-slate-200">Computadoras</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/5">
              <span className="block text-2xl font-black text-emerald-400">+2,500</span>
              <span className="text-[11px] font-bold text-slate-200">Estudiantes</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/5">
              <span className="block text-2xl font-black text-purple-300">100%</span>
              <span className="text-[11px] font-bold text-slate-200">Era de las IA</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CUADRO FLOTANTE DEL ACRÓNIMO */}
      <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-sm border border-slate-200/80 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-[11px] font-black uppercase tracking-widest text-blue-900 bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200">
            Arquitectura del Concepto
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            ¿Por qué se llama <span className="text-blue-900">F.U.T.U.R.O.</span>?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Cada inicial de nuestro nombre representa un pilar técnico y pedagógico que garantiza el impacto integral en la comunidad.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {acronymLetters.map((item, idx) => (
            <div 
              key={idx}
              className="bg-slate-50/80 hover:bg-white p-6 rounded-3xl border border-slate-200/70 hover:border-blue-400 hover:shadow-md transition-all duration-300 space-y-3 group"
            >
              <div className="flex items-center space-x-3.5">
                <div className={`w-12 h-12 rounded-2xl ${item.iconBg} font-black text-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                  {item.letter}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 group-hover:text-blue-900 transition-colors">{item.word}</h3>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${item.badgeBg}`}>
                    Pilar #{idx + 1}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-650 leading-relaxed font-medium pt-1">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. CUADRO FLOTANTE DE EDUCACIÓN MODULAR & IA */}
      <div id="modulos-seccion" className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-sm border border-slate-200/80 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-[11px] font-black uppercase tracking-widest text-cyan-800 bg-cyan-50 px-3.5 py-1 rounded-full border border-cyan-200">
            Formación Progresiva
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Educación Modular en la <span className="text-cyan-700">Era de la IA</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Ruta de aprendizaje estructurada que acompaña a niños y adolescentes desde la alfabetización básica hasta la aplicación práctica de Inteligencia Artificial.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap justify-center gap-2.5">
          {modules.map((m) => {
            const isSelected = activeTabModule === m.id;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => setActiveTabModule(m.id as any)}
                className={`flex items-center space-x-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-900 text-yellow-400 border-blue-900 shadow-md scale-102'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <Icon size={16} />
                <span>{m.title.split(':')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Active Module Card */}
        {(() => {
          const cur = modules.find(m => m.id === activeTabModule)!;
          const Icon = cur.icon;
          return (
            <div className={`p-6 sm:p-8 rounded-3xl border ${cur.color} space-y-6 transition-all`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-900 text-yellow-400 flex items-center justify-center font-black shrink-0 shadow-sm">
                    <Icon size={26} />
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase text-blue-850 tracking-wider block">{cur.level}</span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900">{cur.title}</h3>
                  </div>
                </div>
                <div className="inline-flex items-center space-x-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 shadow-xs self-start sm:self-auto">
                  <Award size={16} className="text-yellow-600" />
                  <span>Certificación Leonística</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {cur.description}
              </p>

              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Temas y Proyectos del Módulo:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cur.topics.map((t, i) => (
                    <div key={i} className="flex items-center space-x-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={13} className="stroke-[3]" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* 3 Pilares Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-2.5 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-black mx-auto sm:mx-0">
              <Laptop size={20} />
            </div>
            <h4 className="text-base font-black text-slate-900">1. Infraestructura Fisiológica</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Equipamiento completo con computadoras, red cableada/Wi-Fi segura y mobiliario adaptado.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-2.5 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center font-black mx-auto sm:mx-0">
              <Bot size={20} />
            </div>
            <h4 className="text-base font-black text-slate-900">2. Módulos de IA & Código</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pensamiento crítico, modelos generativos responsables y resolución de retos locales.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-2.5 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-black mx-auto sm:mx-0">
              <GraduationCap size={20} />
            </div>
            <h4 className="text-base font-black text-slate-900">3. Formación de Docentes</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Acompañamiento a maestros locales para garantizar sostenibilidad pedagógica continua.
            </p>
          </div>
        </div>
      </div>

      {/* 4. CUADRO FLOTANTE DE GALERÍA DE EVIDENCIAS */}
      <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-sm border border-slate-200/80 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
              Evidencia en Acción
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Galería de Transformación Digital</h2>
            <p className="text-xs text-slate-600 font-medium">Laboratorios activos, entregas y talleres en escuelas de Quetzaltenango.</p>
          </div>
          <Link 
            to="/galeria"
            className="inline-flex items-center space-x-1.5 text-xs font-black uppercase tracking-wider text-blue-900 hover:text-blue-700 bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl transition-all"
          >
            <span>Ver Galería Completa</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="rounded-3xl overflow-hidden bg-slate-50 border border-slate-200 shadow-2xs group">
            <div className="h-48 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80" 
                alt="Laboratorio" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-5 space-y-1.5">
              <span className="text-[10px] font-black uppercase text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                Infraestructura
              </span>
              <h4 className="text-sm font-bold text-slate-900">Dotación de Computadoras</h4>
              <p className="text-xs text-slate-600">Acondicionamiento de aulas con estaciones de cómputo seguras.</p>
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden bg-slate-50 border border-slate-200 shadow-2xs group">
            <div className="h-48 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80" 
                alt="Talleres" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-5 space-y-1.5">
              <span className="text-[10px] font-black uppercase text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Formación Modular
              </span>
              <h4 className="text-sm font-bold text-slate-900">Talleres de Inteligencia Artificial</h4>
              <p className="text-xs text-slate-600">Estudiantes aprendiendo modelos generativos y lógica.</p>
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden bg-slate-50 border border-slate-200 shadow-2xs group">
            <div className="h-48 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=600&q=80" 
                alt="Inauguración" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-5 space-y-1.5">
              <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Comunidad
              </span>
              <h4 className="text-sm font-bold text-slate-900">Inauguración con Docentes</h4>
              <p className="text-xs text-slate-600">Compromiso conjunto para el mantenimiento del laboratorio.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. CUADRO FLOTANTE DE TESTIMONIOS */}
      <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-sm border border-slate-200/80 space-y-8">
        <div className="text-center space-y-1 max-w-xl mx-auto">
          <span className="text-[11px] font-black uppercase tracking-widest text-amber-800 bg-amber-50 px-3.5 py-1 rounded-full border border-amber-200">
            Voces de la Comunidad
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Testimonios & Comentarios</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div 
              key={idx}
              className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col justify-between space-y-4"
            >
              <p className="text-xs text-slate-700 leading-relaxed font-medium italic">
                "{t.text}"
              </p>
              <div className="flex items-center space-x-3 pt-3 border-t border-slate-200">
                <img 
                  src={t.avatar} 
                  alt={t.name} 
                  className="w-10 h-10 rounded-full object-cover border-2 border-yellow-500/50"
                />
                <div>
                  <h4 className="text-xs font-black text-slate-900 leading-tight">{t.name}</h4>
                  <span className="text-[10px] text-blue-900 font-bold block">{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. CUADRO FLOTANTE DE POSTULACIÓN / APADRINAMIENTO */}
      <div id="postular-seccion" className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-sm border border-slate-200/80 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-[11px] font-black uppercase tracking-widest text-blue-900 bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200">
            Formulario de Contacto
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Postula tu Escuela o <span className="text-blue-900">Apadrina un Laboratorio</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Completa tus datos y nuestro Comité de Educación del Club de Leones se pondrá en contacto contigo.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {formSent ? (
            <div className="text-center py-8 space-y-3 bg-emerald-50 rounded-3xl border border-emerald-200 p-6">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900">¡Solicitud Enviada con Éxito!</h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                Gracias por tu interés en el <strong>Programa F.U.T.U.R.O.</strong> Nos comunicaremos contigo en breve para coordinar los siguientes pasos.
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="mt-2 bg-blue-900 text-yellow-400 font-black text-xs uppercase px-5 py-2.5 rounded-xl hover:bg-blue-800 transition-colors cursor-pointer"
              >
                Enviar otra consulta
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setFormTipo('escuela')}
                  className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                    formTipo === 'escuela' 
                      ? 'bg-blue-900 text-yellow-400 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <School size={15} />
                  <span>Soy Director / Escuela</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormTipo('donante')}
                  className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                    formTipo === 'donante' 
                      ? 'bg-blue-900 text-yellow-400 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <HeartHandshake size={15} />
                  <span>Soy Donante / Padrino</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nombre del Contacto *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombreContacto}
                    onChange={(e) => setNombreContacto(e.target.value)}
                    placeholder="Ej. Prof. Juan Manuel Pérez"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {formTipo === 'escuela' ? 'Nombre de la Escuela *' : 'Empresa u Organización *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={institucion}
                    onChange={(e) => setInstitucion(e.target.value)}
                    placeholder={formTipo === 'escuela' ? "Ej. EORM Cantón Chichigüitán" : "Ej. Empresa / Fundación"}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej. 5555-1234"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contacto@ejemplo.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="text-left">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Municipio de Ubicación
                </label>
                <select
                  value={municipio}
                  onChange={(e) => setMunicipio(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-900 focus:bg-white cursor-pointer"
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
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {formTipo === 'escuela' 
                    ? 'Cuéntanos sobre tu escuela (Nº de alumnos, espacio disponible)' 
                    : 'Cuéntanos cómo te gustaría colaborar (Equipos, voluntariado, apadrinamiento)'}
                </label>
                <textarea
                  rows={3}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Detalles adicionales..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900 focus:bg-white resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-blue-955 font-black px-6 py-3.5 rounded-xl text-sm transition-all shadow-md shadow-yellow-500/10 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-955 border-t-transparent rounded-full animate-spin"></div>
                    <span>Enviando...</span>
                  </div>
                ) : (
                  <>
                    <Send size={16} />
                    <span>{formTipo === 'escuela' ? 'Enviar Postulación de Escuela' : 'Enviar Propuesta de Apadrinamiento'}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgramaFuturo;
