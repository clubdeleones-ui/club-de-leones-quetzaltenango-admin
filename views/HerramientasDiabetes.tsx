import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse,
  ShieldCheck,
  CalendarCheck,
  Calculator,
  AlertTriangle,
  Moon,
  Sun,
  Dumbbell,
  Footprints,
  Clock,
  CheckCircle2,
  Circle,
  RotateCcw,
  Printer,
  Share2,
  FileDown,
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Activity,
  Scale,
  Droplets,
  Pill,
  Info,
  ArrowLeft,
  Flame,
  Coffee,
  Utensils,
  Stethoscope
} from 'lucide-react';
import { safeSetItem } from '../utils/storage';

type ProfileMode = 'prevencion' | 'cuidado';
type MainTab = 'planificador' | 'calculadoras' | 'semaforo' | 'avances';

interface RoutineTask {
  id: string;
  pillar: '5S' | 'Crononutricion' | 'Cuidado' | 'Prevencion';
  title: string;
  detail: string;
  mode: 'both' | 'prevencion' | 'cuidado';
}

const ROUTINE_TASKS: RoutineTask[] = [
  {
    id: 'standing',
    pillar: '5S',
    title: 'Standing: Pausas activas cada 30–60 min',
    detail: 'Levántate o camina 2–3 minutos para cortar el sedentarismo continuo (marco 5S ADA/EASD 2026).',
    mode: 'both'
  },
  {
    id: 'stepping',
    pillar: '5S',
    title: 'Stepping: Sumar pasos diarios',
    detail: 'Camina al menos 15–20 min después de tu comida principal para suavizar el pico de glucosa.',
    mode: 'both'
  },
  {
    id: 'sweating',
    pillar: '5S',
    title: 'Sweating: Actividad aeróbica (meta 150 min/sem)',
    detail: 'Caminata rápida, bicicleta o natación moderada a vigorosa.',
    mode: 'both'
  },
  {
    id: 'strengthening',
    pillar: '5S',
    title: 'Strengthening: Ejercicio de fuerza / resistencia',
    detail: '2–3 sesiones/semana para proteger masa muscular y mejorar sensibilidad a la insulina.',
    mode: 'both'
  },
  {
    id: 'sleeping',
    pillar: '5S',
    title: 'Sleeping: Sueño como signo vital (7–8 h)',
    detail: 'Horario fijo, habitación fresca/oscura, sin pantallas 45 min antes y sin cafeína 12 h antes.',
    mode: 'both'
  },
  {
    id: 'chrono_breakfast',
    pillar: 'Crononutricion',
    title: 'Concentrar energía en desayuno y almuerzo',
    detail: 'Prioriza proteína, grasas saludables y fibra vegetal (patrón mediterráneo o bajo en carbohidratos).',
    mode: 'both'
  },
  {
    id: 'chrono_dinner',
    pillar: 'Crononutricion',
    title: 'Cena temprana y ligera (sin comer de noche)',
    detail: 'Evita desfasar más de 1 hora tus horarios entre semana y fin de semana.',
    mode: 'both'
  },
  {
    id: 'fiber_microbiome',
    pillar: 'Prevencion',
    title: 'Fibra prebiótica para tu microbioma intestinal',
    detail: 'Verduras, legumbres y semillas alimentan bacterias productoras de butirato que protegen la barrera intestinal.',
    mode: 'prevencion'
  },
  {
    id: 'hydrate_clean',
    pillar: 'Prevencion',
    title: 'Agua pura en lugar de bebidas azucaradas o edulcorantes',
    detail: 'La OMS recomienda evitar edulcorantes no calóricos para prevenir diabetes y cuidar el peso.',
    mode: 'prevencion'
  },
  {
    id: 'glucose_check',
    pillar: 'Cuidado',
    title: 'Monitoreo glucémico o revisión de sensor (MCG)',
    detail: 'Vigila mantener Tiempo en Rango (70–180 mg/dL) >70% y bajo rango (<70 mg/dL) en <1%.',
    mode: 'cuidado'
  },
  {
    id: 'meds_adherence',
    pillar: 'Cuidado',
    title: 'Medicación en horario y revisión de pies/presión',
    detail: 'Si tomas metformina >4 años recuerda control anual de vitamina B12. Nunca suspendas estatinas por cuenta propia.',
    mode: 'cuidado'
  }
];

interface ProductItem {
  name: string;
  category: 'peligro' | 'evitar' | 'vigilar';
  badge: string;
  summary: string;
  action: string;
}

const PRODUCTS_LIST: ProductItem[] = [
  {
    name: 'Plumas falsificadas de GLP-1 (ej. Ozempic fraudulento)',
    category: 'peligro',
    badge: 'Alerta OMS / FDA / EMA',
    summary: 'El 89.3% de reportes europeos por semaglutida falsificada fueron reacciones graves, incluyendo hipoglucemias por insulina oculta.',
    action: 'Adquiere medicamentos únicamente en farmacias autorizadas con receta y cadena de frío verificada.'
  },
  {
    name: 'Suplementos "milagro" con Adelfa Amarilla (Yellow Oleander)',
    category: 'peligro',
    badge: 'Toxina Mortal (FDA 2026)',
    summary: 'Productos de fibra o control de peso por internet (ej. Niwali Tejocote, Easy Forte, D Magic Plus, B. Magi) contaminados con toxina cardíaca o diclofenaco/dexametasona ocultos.',
    action: 'Rechaza cualquier suplemento que prometa "curar" la diabetes. La ADA/EASD 2026 no recomienda suplementos para control glucémico.'
  },
  {
    name: 'Formulaciones magistrales GLP-1 no aprobadas (Compounded / gotas)',
    category: 'peligro',
    badge: 'Alerta FDA 2025–2026',
    summary: 'Más de 1,700 eventos adversos reportados por sales no evaluadas, falta de esterilidad, errores de dosificación o venta ilegal de moléculas en investigación (retatrutida).',
    action: 'Evita preparados magistrales, viales sin registro sanitario o gotas sublinguales sin respaldo clínico.'
  },
  {
    name: 'Bebidas azucaradas y ultraprocesados',
    category: 'evitar',
    badge: 'Riesgo Cardiometabólico (+7%)',
    summary: 'Principal vehículo de azúcares libres y exceso de sodio; impulsan la diabetes tipo 2 y la cardiopatía isquémica.',
    action: 'Evita refrescos, jugos industriales y snacks procesados. Limita el sodio a <2,000 mg/día (OMS) o <2,300 mg/día (ADA).'
  },
  {
    name: 'Grasas trans industriales (aceites parcialmente hidrogenados)',
    category: 'evitar',
    badge: 'Tope OMS < 2.2 g/día',
    summary: 'Asociadas a ~500,000 muertes cardiovasculares anuales y mayor resistencia a la insulina.',
    action: 'Evita por completo bollería industrial, margarinas hidrogenadas y frituras comerciales reutilizadas.'
  },
  {
    name: 'Polioles: Eritritol y Xilitol en dosis frecuentes',
    category: 'evitar',
    badge: 'Riesgo Trombótico (Cleveland Clinic)',
    summary: 'Ingestas altas (30 g en postres "keto", chicles o productos sin azúcar) activan inmediatamente la agregación plaquetaria y elevan riesgo de infarto/ictus.',
    action: 'Limita o evita postres "sin azúcar" ricos en eritritol/xilitol, especialmente si tienes diabetes o riesgo cardiovascular. (La pasta dental escupida no preocupa).'
  },
  {
    name: 'Edulcorantes no calóricos (aspartamo, sucralosa, estevia)',
    category: 'evitar',
    badge: 'Directriz OMS',
    summary: 'La OMS recomienda no usarlos para controlar el peso ni prevenir enfermedades crónicas en población sin diabetes.',
    action: 'En prevención, elige agua pura o infusiones sin dulzor. Si ya tienes diabetes, úsalos solo como transición temporal para dejar el azúcar.'
  },
  {
    name: 'Glucocorticoides (prednisona, dexametasona)',
    category: 'vigilar',
    badge: '40–65% causa hiperglucemia',
    summary: 'Pueden precipitar diabetes secundaria o descompensar el azúcar rápidamente.',
    action: 'NUNCA suspender por cuenta propia. Las guías ADA 2026 sugieren valorar metformina profiláctica bajo control médico.'
  },
  {
    name: 'Antipsicóticos atípicos, inhibidores PI3Kα/mTOR y diuréticos tiazídicos',
    category: 'vigilar',
    badge: 'Vigilancia Médica',
    summary: 'Fármacos como olanzapina, clozapina o terapias oncológicas (alpelisib, inhibidores de puntos de control) elevan la glucosa.',
    action: 'Mantén monitoreo frecuente de glucosa al iniciar estos tratamientos y consulta al médico ante cambios.'
  },
  {
    name: 'Estatinas (colesterol) y Metformina (>4 años)',
    category: 'vigilar',
    badge: 'NO Suspender Estatinas',
    summary: 'Aunque las estatinas suben muy levemente el riesgo de DT2, su protección cardiovascular es muy superior. La metformina prolongada puede bajar la vitamina B12.',
    action: 'Nunca abandones las estatinas sin orden médica. Si llevas >4 años con metformina, pide examen anual de vitamina B12.'
  }
];

const STORAGE_KEY = 'club_leones_diabetes_planner_v1';

const HerramientasDiabetes: React.FC = () => {
  const [profileMode, setProfileMode] = useState<ProfileMode>('prevencion');
  const [activeTab, setActiveTab] = useState<MainTab>('planificador');

  // Planificador State
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [aerobicMinutes, setAerobicMinutes] = useState<number>(0);
  const [strengthSessions, setStrengthSessions] = useState<number>(0);
  const [breakfastTime, setBreakfastTime] = useState<string>('07:30');
  const [lunchTime, setLunchTime] = useState<string>('13:00');
  const [dinnerTime, setDinnerTime] = useState<string>('18:30');
  const [sleepTime, setSleepTime] = useState<string>('22:00');
  const [usesInsulinOrSulfonylurea, setUsesInsulinOrSulfonylurea] = useState<boolean>(false);

  // Calculadoras State
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('lb');
  const [weightVal, setWeightVal] = useState<string>('165');
  const [heightCm, setHeightCm] = useState<string>('168');
  const [isOlderAdult, setIsOlderAdult] = useState<boolean>(false);
  const [rapidWeightLoss, setRapidWeightLoss] = useState<boolean>(false);

  // Metas Glucémicas State
  const [hba1c, setHba1c] = useState<string>('6.8');
  const [tir, setTir] = useState<string>('74');
  const [tbr, setTbr] = useState<string>('0.5');
  const [systolicBp, setSystolicBp] = useState<string>('124');
  const [diastolicBp, setDiastolicBp] = useState<string>('78');

  // STOP-BANG simplificado (Sueño 2026)
  const [sleepChecks, setSleepChecks] = useState<Record<string, boolean>>({
    snore: false,
    tired: false,
    observed: false,
    pressure: false,
    age50: false
  });

  // Semáforo State
  const [productQuery, setProductQuery] = useState<string>('');
  const [productFilter, setProductFilter] = useState<'all' | 'peligro' | 'evitar' | 'vigilar'>('all');

  // Avances Acordeón
  const [openAdvanceId, setOpenAdvanceId] = useState<string>('tipo5');

  // Cargar datos guardados
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.profileMode) setProfileMode(parsed.profileMode);
        if (Array.isArray(parsed.completedIds)) setCompletedIds(parsed.completedIds);
        if (typeof parsed.aerobicMinutes === 'number') setAerobicMinutes(parsed.aerobicMinutes);
        if (typeof parsed.strengthSessions === 'number') setStrengthSessions(parsed.strengthSessions);
        if (parsed.breakfastTime) setBreakfastTime(parsed.breakfastTime);
        if (parsed.lunchTime) setLunchTime(parsed.lunchTime);
        if (parsed.dinnerTime) setDinnerTime(parsed.dinnerTime);
        if (parsed.sleepTime) setSleepTime(parsed.sleepTime);
      }
    } catch (_) {}
  }, []);

  // Guardar datos automáticamente
  useEffect(() => {
    safeSetItem(
      STORAGE_KEY,
      JSON.stringify({
        profileMode,
        completedIds,
        aerobicMinutes,
        strengthSessions,
        breakfastTime,
        lunchTime,
        dinnerTime,
        sleepTime
      })
    );
  }, [profileMode, completedIds, aerobicMinutes, strengthSessions, breakfastTime, lunchTime, dinnerTime, sleepTime]);

  const visibleTasks = useMemo(
    () => ROUTINE_TASKS.filter(t => t.mode === 'both' || t.mode === profileMode),
    [profileMode]
  );

  const toggleTask = (id: string) => {
    setCompletedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const progressPct = useMemo(() => {
    if (visibleTasks.length === 0) return 0;
    const done = visibleTasks.filter(t => completedIds.includes(t.id)).length;
    return Math.round((done / visibleTasks.length) * 100);
  }, [visibleTasks, completedIds]);

  // Calcular hora límite de cafeína (12 horas antes de dormir según ADA 2026)
  const caffeineCutoff = useMemo(() => {
    const [h, m] = sleepTime.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return '10:00';
    const cutoffH = (h - 12 + 24) % 24;
    return `${String(cutoffH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }, [sleepTime]);

  // Cálculos Antropométricos
  const weightKg = useMemo(() => {
    const num = parseFloat(weightVal);
    if (isNaN(num) || num <= 0) return 0;
    return weightUnit === 'lb' ? num * 0.453592 : num;
  }, [weightVal, weightUnit]);

  const heightM = useMemo(() => {
    const cm = parseFloat(heightCm);
    if (isNaN(cm) || cm <= 0) return 0;
    return cm / 100;
  }, [heightCm]);

  const bmi = useMemo(() => {
    if (weightKg <= 0 || heightM <= 0) return 0;
    return weightKg / (heightM * heightM);
  }, [weightKg, heightM]);

  const weightLoss5 = weightKg * 0.05;
  const weightLoss7 = weightKg * 0.07;

  const proteinMinG = useMemo(() => {
    if (weightKg <= 0) return 0;
    if (rapidWeightLoss) return Math.round(weightKg * 1.1);
    if (isOlderAdult) return Math.round(weightKg * 0.8);
    return Math.round(weightKg * 0.8);
  }, [weightKg, isOlderAdult, rapidWeightLoss]);

  const proteinMaxG = useMemo(() => {
    if (weightKg <= 0) return 0;
    if (rapidWeightLoss) return Math.round(weightKg * 1.5);
    return Math.round(weightKg * 1.1);
  }, [weightKg, rapidWeightLoss]);

  // Evaluación metas clínicas
  const hba1cNum = parseFloat(hba1c) || 0;
  const tirNum = parseFloat(tir) || 0;
  const tbrNum = parseFloat(tbr) || 0;
  const sysNum = parseFloat(systolicBp) || 0;
  const diaNum = parseFloat(diastolicBp) || 0;

  const stopBangScore = useMemo(() => {
    const base = Object.values(sleepChecks).filter(Boolean).length;
    return base + (bmi > 35 ? 1 : 0);
  }, [sleepChecks, bmi]);

  const filteredProducts = useMemo(() => {
    return PRODUCTS_LIST.filter(p => {
      const matchesFilter = productFilter === 'all' || p.category === productFilter;
      const q = productQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.action.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [productFilter, productQuery]);

  const handleShareWhatsApp = () => {
    const modeLabel = profileMode === 'prevencion' ? 'Prevención' : 'Cuidado Activo';
    const text = `Mi Plan Diario de Salud (${modeLabel} - Guía ADA 2026 Club de Leones Xela):\n` +
      `• Cumplimiento de hoy: ${progressPct}%\n` +
      `• Actividad aeróbica semanal: ${aerobicMinutes}/150 min\n` +
      `• Sesiones de fuerza: ${strengthSessions}/3\n` +
      `• Horario comidas: Desayuno ${breakfastTime} | Almuerzo ${lunchTime} | Cena ligera ${dinnerTime}\n` +
      `• Hora de dormir: ${sleepTime} (Cero cafeína desde las ${caffeineCutoff})\n\n` +
      `Crea tu plan gratuito en: https://clubdeleonesquetzaltenango.org/#/herramientas/diabetes`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16 print:bg-white">
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 text-white pt-8 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden print:hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_45%)]" />
        <div className="max-w-[1240px] mx-auto relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/herramientas"
              className="inline-flex items-center space-x-2 text-xs font-bold text-blue-200 hover:text-yellow-300 transition-colors"
            >
              <ArrowLeft size={15} />
              <span>Volver a Herramientas</span>
            </Link>

            <a
              href="/docs/Avances%20Recientes%20Sobre%20la%20Diabetes.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
            >
              <FileDown size={15} className="text-yellow-300" />
              <span>Descargar Guía Científica PDF (2025–2026)</span>
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-3">
              <div className="inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider">
                <HeartPulse size={14} />
                <span>Estándares ADA/EASD, OMS & IDF 2026</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Diabetes: Prevención y Cuidado Interactivo
              </h1>
              <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-2xl">
                Planifica tus rutinas diarias de alimentación, ejercicio y sueño, evalúa tus metas clínicas y consulta alertas sanitarias actualizadas en un solo lugar.
              </p>
            </div>

            {/* Selector de Modo de Usuario */}
            <div className="lg:col-span-5 bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-4 sm:p-5 space-y-3">
              <p className="text-xs font-black uppercase tracking-wider text-yellow-300 flex items-center space-x-1.5">
                <Sparkles size={14} />
                <span>Personaliza tu experiencia</span>
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setProfileMode('prevencion')}
                  className={`p-3 rounded-2xl text-left transition-all border ${
                    profileMode === 'prevencion'
                      ? 'bg-emerald-500 text-white border-emerald-300 shadow-lg shadow-emerald-950/30'
                      : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <ShieldCheck size={20} className="mb-1.5" />
                  <div className="font-black text-xs sm:text-sm">Prevención</div>
                  <div className="text-[10px] opacity-90 leading-tight mt-0.5">
                    Reducir riesgo y cuidar hábitos
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setProfileMode('cuidado')}
                  className={`p-3 rounded-2xl text-left transition-all border ${
                    profileMode === 'cuidado'
                      ? 'bg-yellow-400 text-blue-950 border-yellow-200 shadow-lg shadow-blue-950/30'
                      : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Activity size={20} className="mb-1.5" />
                  <div className="font-black text-xs sm:text-sm">Cuidado Activo</div>
                  <div className="text-[10px] opacity-90 leading-tight mt-0.5">
                    Control diario y metas clínicas
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navegación de Herramientas */}
      <div className="sticky top-20 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs print:hidden">
        <div className="max-w-[1240px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto no-scrollbar py-2.5 gap-2">
            {[
              { id: 'planificador', label: 'Planificador 5S & Rutina', icon: CalendarCheck },
              { id: 'calculadoras', label: 'Calculadoras & Metas', icon: Calculator },
              { id: 'semaforo', label: 'Productos a Evitar', icon: AlertTriangle },
              { id: 'avances', label: 'Avances 2025–2026', icon: Sparkles }
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as MainTab)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all shrink-0 ${
                    active
                      ? 'bg-blue-900 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <Icon size={16} className={active ? 'text-yellow-400' : ''} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-[1240px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        {/* Aviso Médico */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start space-x-3 text-xs text-blue-950">
          <Stethoscope size={20} className="text-blue-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-medium">
            <strong>Aviso de Salud Comunitaria:</strong> Esta herramienta interactiva resume evidencia médica 2025–2026 (ADA/EASD, OMS, IDF) para ayudarte a organizar tus hábitos. <strong>No sustituye el criterio de tu médico</strong>; nunca cambies dosis ni suspendas medicamentos sin supervisión profesional.
          </p>
        </div>

        {/* TAB 1: PLANIFICADOR 5S Y CRONONUTRICIÓN */}
        {activeTab === 'planificador' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Progreso del día + Botones de acción */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-900">
                    Tu Rutina de Hoy ({profileMode === 'prevencion' ? 'Modo Prevención' : 'Modo Cuidado'})
                  </span>
                  <span className="text-lg font-black text-emerald-600">{progressPct}%</span>
                </div>
                <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-500 rounded-full"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Marca tus hábitos completados. Tu progreso se guarda automáticamente en este dispositivo.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 print:hidden">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition-colors"
                >
                  <Share2 size={15} />
                  <span>Enviar a mi WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black shadow-sm transition-colors"
                >
                  <Printer size={15} />
                  <span>Imprimir / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCompletedIds([])}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                  title="Reiniciar checks de hoy"
                >
                  <RotateCcw size={15} />
                  <span>Reiniciar Día</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Columna Izquierda: Checklist 5S */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900">
                      Lista Diaria Basada en el Marco "5S" (ADA 2026)
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Standing • Stepping • Sweating • Strengthening • Sleeping
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {visibleTasks.map(task => {
                    const checked = completedIds.includes(task.id);
                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => toggleTask(task.id)}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start space-x-3 ${
                          checked
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                            : 'bg-slate-50/70 border-slate-200/80 hover:border-blue-300 text-slate-800'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {checked ? (
                            <CheckCircle2 size={22} className="text-emerald-600" />
                          ) : (
                            <Circle size={22} className="text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`font-black text-xs sm:text-sm ${checked ? 'line-through opacity-75' : ''}`}>
                              {task.title}
                            </span>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                              {task.pillar}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{task.detail}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Columna Derecha: Contadores Semanales + Crononutrición */}
              <div className="lg:col-span-5 space-y-6">
                {/* Rastreador Semanal 150 min + Fuerza */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-5">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center space-x-2">
                    <Flame size={20} className="text-orange-500" />
                    <span>Metas Físicas Semanales</span>
                  </h3>

                  {/* Aeróbico */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700 flex items-center space-x-1.5">
                        <Footprints size={15} className="text-blue-600" />
                        <span>Actividad Aeróbica (Meta: 150 min)</span>
                      </span>
                      <span className="font-black text-blue-900">{aerobicMinutes} / 150 min</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.round((aerobicMinutes / 150) * 100))}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[15, 30, 45].map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setAerobicMinutes(prev => prev + m)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-black transition-colors"
                        >
                          +{m} min
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setAerobicMinutes(0)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold ml-auto"
                      >
                        Reiniciar
                      </button>
                    </div>
                  </div>

                  {/* Fuerza */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700 flex items-center space-x-1.5">
                        <Dumbbell size={15} className="text-indigo-600" />
                        <span>Entrenamiento de Fuerza (Meta: 2–3 días)</span>
                      </span>
                      <span className="font-black text-indigo-900">{strengthSessions} sesiones</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStrengthSessions(s === strengthSessions ? s - 1 : s)}
                          className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all ${
                            strengthSessions >= s
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          Sesión {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Crononutrición y Sueño */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center space-x-2">
                    <Clock size={20} className="text-teal-600" />
                    <span>Reloj de Crononutrición y Sueño</span>
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Concentrar calorías en el desayuno y adelantar una cena ligera protege el perfil glucémico (Ensayo ChronoFast & ADA 2026).
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200/70">
                      <label className="text-[10px] font-black uppercase text-amber-900 flex items-center space-x-1">
                        <Sun size={12} />
                        <span>Desayuno Principal</span>
                      </label>
                      <input
                        type="time"
                        value={breakfastTime}
                        onChange={e => setBreakfastTime(e.target.value)}
                        className="mt-1 w-full bg-white border border-amber-200 rounded-lg px-2 py-1.5 text-sm font-black text-slate-800"
                      />
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <label className="text-[10px] font-black uppercase text-slate-700 flex items-center space-x-1">
                        <Utensils size={12} />
                        <span>Almuerzo</span>
                      </label>
                      <input
                        type="time"
                        value={lunchTime}
                        onChange={e => setLunchTime(e.target.value)}
                        className="mt-1 w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-black text-slate-800"
                      />
                    </div>

                    <div className="bg-indigo-50/70 p-3 rounded-2xl border border-indigo-200/70">
                      <label className="text-[10px] font-black uppercase text-indigo-900 flex items-center space-x-1">
                        <Clock size={12} />
                        <span>Cena Temprana</span>
                      </label>
                      <input
                        type="time"
                        value={dinnerTime}
                        onChange={e => setDinnerTime(e.target.value)}
                        className="mt-1 w-full bg-white border border-indigo-200 rounded-lg px-2 py-1.5 text-sm font-black text-slate-800"
                      />
                    </div>

                    <div className="bg-blue-950 text-white p-3 rounded-2xl">
                      <label className="text-[10px] font-black uppercase text-yellow-300 flex items-center space-x-1">
                        <Moon size={12} />
                        <span>Hora de Dormir</span>
                      </label>
                      <input
                        type="time"
                        value={sleepTime}
                        onChange={e => setSleepTime(e.target.value)}
                        className="mt-1 w-full bg-blue-900 border border-blue-700 rounded-lg px-2 py-1.5 text-sm font-black text-white"
                      />
                    </div>
                  </div>

                  {/* Regla de cafeína 12h */}
                  <div className="p-3 bg-slate-100 rounded-2xl flex items-center space-x-3 text-xs text-slate-700">
                    <Coffee size={18} className="text-amber-700 shrink-0" />
                    <span>
                      <strong>Regla de Cafeína (12h):</strong> Si duermes a las <strong>{sleepTime}</strong>, evita café, té negro o bebidas energéticas después de las <strong>{caffeineCutoff}</strong>.
                    </span>
                  </div>

                  {/* Alerta de seguridad insulina / sulfonilureas */}
                  <label className="flex items-start space-x-2.5 p-3 bg-rose-50 border border-rose-200 rounded-2xl cursor-pointer text-xs text-rose-900">
                    <input
                      type="checkbox"
                      checked={usesInsulinOrSulfonylurea}
                      onChange={e => setUsesInsulinOrSulfonylurea(e.target.checked)}
                      className="mt-0.5 rounded text-rose-600"
                    />
                    <span>
                      <strong>¿Usas insulina o sulfonilureas?</strong>
                      {usesInsulinOrSulfonylurea
                        ? ' Precaución: cualquier cambio de horario de comidas o ayuno debe coordinarse con tu médico para evitar hipoglucemias.'
                        : ' Marca esta casilla si usas estos fármacos para recordar las precauciones de horario.'}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CALCULADORAS Y EVALUADORES CLÍNICOS */}
        {activeTab === 'calculadoras' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
            {/* Calculadora 1: IMC, Meta Preventiva 5-7% y Proteína Protectora */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-5">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Scale size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Meta de Peso (5–7%) y Proteína Diaria</h2>
                  <p className="text-xs text-slate-500">Estándares ADA 2026 de prevención y protección muscular</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Peso Actual</label>
                  <div className="flex">
                    <input
                      type="number"
                      value={weightVal}
                      onChange={e => setWeightVal(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-l-xl text-sm font-black text-slate-900"
                    />
                    <select
                      value={weightUnit}
                      onChange={e => setWeightUnit(e.target.value as 'kg' | 'lb')}
                      className="px-2.5 py-2 bg-slate-200 border border-l-0 border-slate-200 rounded-r-xl text-xs font-black text-slate-800"
                    >
                      <option value="lb">lb</option>
                      <option value="kg">kg</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Estatura (cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={e => setHeightCm(e.target.value)}
                    placeholder="168"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 text-xs font-semibold text-slate-700">
                <label className="flex items-center space-x-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={isOlderAdult}
                    onChange={e => setIsOlderAdult(e.target.checked)}
                  />
                  <span>Adulto mayor (≥65 años)</span>
                </label>
                <label className="flex items-center space-x-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={rapidWeightLoss}
                    onChange={e => setRapidWeightLoss(e.target.checked)}
                  />
                  <span>Dieta hipocalórica / GLP-1</span>
                </label>
              </div>

              {bmi > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-black uppercase text-slate-500">Índice de Masa Corporal</span>
                      <div className="text-2xl font-black text-slate-900 mt-0.5">{bmi.toFixed(1)} kg/m²</div>
                      <span className="text-xs font-bold text-blue-700">
                        {bmi < 19
                          ? 'Bajo peso (Evaluar T5DM si hay hiperglucemia)'
                          : bmi < 25
                          ? 'Rango saludable'
                          : bmi < 30
                          ? 'Sobrepeso'
                          : 'Obesidad'}
                      </span>
                    </div>

                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                      <span className="text-[10px] font-black uppercase text-emerald-800">Meta Preventiva ADA 5–7%</span>
                      <div className="text-lg font-black text-emerald-950 mt-0.5">
                        -{(weightUnit === 'lb' ? weightLoss5 * 2.20462 : weightLoss5).toFixed(1)} a -{(weightUnit === 'lb' ? weightLoss7 * 2.20462 : weightLoss7).toFixed(1)} {weightUnit}
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-800 block">
                        Meta junto a 150 min/sem de actividad
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 text-xs text-blue-950 space-y-1">
                    <div className="font-black text-sm">
                      Proteína Diaria Protectora: {proteinMinG} – {proteinMaxG} gramos/día
                    </div>
                    <p className="leading-relaxed">
                      {rapidWeightLoss
                        ? 'En pérdida de peso rápida o terapia con incretinas, asegurar 1.1–1.5 g/kg (o mínimo 60–80 g/día) y entrenamiento de fuerza evita perder masa muscular.'
                        : 'Asegurar al menos 0.8 g/kg al día protege el músculo esquelético y la sensibilidad a la insulina.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Calculadora 2: Evaluador de Metas Clínicas ADA 2026 */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-5">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Droplets size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Evaluador de Metas Clínicas (ADA 2026)</h2>
                  <p className="text-xs text-slate-500">Compara tus últimos resultados frente a las metas oficiales</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">HbA1c (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={hba1c}
                    onChange={e => setHba1c(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Tiempo en Rango (%)</label>
                  <input
                    type="number"
                    value={tir}
                    onChange={e => setTir(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Bajo Rango &lt;70 (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tbr}
                    onChange={e => setTbr(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Presión Sistólica</label>
                  <input
                    type="number"
                    value={systolicBp}
                    onChange={e => setSystolicBp(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Presión Diastólica</label>
                  <input
                    type="number"
                    value={diastolicBp}
                    onChange={e => setDiastolicBp(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className={`p-3 rounded-2xl border flex items-center justify-between ${hba1cNum < 7 ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-amber-50 border-amber-200 text-amber-950'}`}>
                  <span><strong>HbA1c ({hba1cNum}%):</strong> Meta general adultos &lt; 7.0%</span>
                  <span className="font-black">{hba1cNum < 6.5 ? 'Óptimo / Rango Remisión*' : hba1cNum < 7 ? 'En Meta' : 'Revisar con médico'}</span>
                </div>

                <div className={`p-3 rounded-2xl border flex items-center justify-between ${tirNum >= 70 ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-amber-50 border-amber-200 text-amber-950'}`}>
                  <span><strong>Tiempo en Rango ({tirNum}%):</strong> Meta 70–180 mg/dL &gt; 70%</span>
                  <span className="font-black">{tirNum >= 70 ? 'En Meta' : 'Por mejorar'}</span>
                </div>

                <div className={`p-3 rounded-2xl border flex items-center justify-between ${tbrNum < 1 ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'}`}>
                  <span><strong>Hipoglucemia &lt;70 ({tbrNum}%):</strong> Seguridad crítica 2026 &lt; 1%</span>
                  <span className="font-black">{tbrNum < 1 ? 'Seguro (<1%)' : 'Alerta Hipoglucemia'}</span>
                </div>

                <div className={`p-3 rounded-2xl border flex items-center justify-between ${sysNum < 130 && diaNum < 80 ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-amber-50 border-amber-200 text-amber-950'}`}>
                  <span><strong>Presión ({sysNum}/{diaNum}):</strong> Meta &lt; 130/80 mmHg</span>
                  <span className="font-black">{sysNum < 130 && diaNum < 80 ? 'En Meta' : 'Vigilar'}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                *La remisión de DT2 se define como HbA1c &lt; 6.5% durante ≥3 meses sin medicación hipoglucemiante. Antes de cirugías electivas, la meta recomendada es HbA1c &lt; 8% y glucemia 100–180 mg/dL.
              </p>
            </div>

            {/* Calculadora 3: Tamizaje Rápido de Sueño / Apnea (STOP-BANG ADA 2026) */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <Moon size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Chequeo Rápido de Apnea del Sueño (Escala STOP-BANG)</h2>
                    <p className="text-xs text-slate-500">Novedad ADA 2026: El sueño se eleva a signo vital en cada evaluación médica</p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-2xl text-xs font-black border ${
                  stopBangScore >= 3
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  Riesgo: {stopBangScore >= 3 ? `Moderado / Alto (${stopBangScore} factores)` : `Bajo (${stopBangScore} factores)`}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs font-semibold">
                {[
                  { key: 'snore', label: '¿Roncas fuerte?' },
                  { key: 'tired', label: '¿Cansancio o somnolencia diurna?' },
                  { key: 'observed', label: '¿Alguien vio pausas al respirar?' },
                  { key: 'pressure', label: '¿Tienes presión arterial alta?' },
                  { key: 'age50', label: '¿Tienes más de 50 años?' }
                ].map(q => (
                  <label
                    key={q.key}
                    className={`p-3 rounded-2xl border cursor-pointer flex items-center space-x-2 transition-all ${
                      sleepChecks[q.key]
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-950'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!sleepChecks[q.key]}
                      onChange={e => setSleepChecks(prev => ({ ...prev, [q.key]: e.target.checked }))}
                    />
                    <span>{q.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SEMÁFORO DE PRODUCTOS A EVITAR Y ALERTAS */}
        {activeTab === 'semaforo' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={productQuery}
                  onChange={e => setProductQuery(e.target.value)}
                  placeholder="Buscar producto, edulcorante, suplemento o fármaco (ej. eritritol, ozempic, prednisona)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'peligro', label: '🚫 Peligro Crítico' },
                  { id: 'evitar', label: '⚠️ Limitar / Evitar' },
                  { id: 'vigilar', label: '💊 Vigilar con Médico' }
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setProductFilter(f.id as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                      productFilter === f.id
                        ? 'bg-blue-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map((item, idx) => {
                const styles =
                  item.category === 'peligro'
                    ? 'bg-rose-50/70 border-rose-200'
                    : item.category === 'evitar'
                    ? 'bg-amber-50/70 border-amber-200'
                    : 'bg-blue-50/70 border-blue-200';
                const badgeStyles =
                  item.category === 'peligro'
                    ? 'bg-rose-600 text-white'
                    : item.category === 'evitar'
                    ? 'bg-amber-500 text-blue-950'
                    : 'bg-blue-700 text-white';

                return (
                  <div key={idx} className={`rounded-3xl border p-5 sm:p-6 space-y-3 ${styles}`}>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-black text-slate-900 text-base leading-snug">{item.name}</h3>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full shrink-0 uppercase ${badgeStyles}`}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">{item.summary}</p>
                    <div className="bg-white/80 rounded-2xl p-3 border border-white text-xs text-slate-800">
                      <strong className="text-slate-900">Criterio práctico:</strong> {item.action}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: AVANCES CIENTÍFICOS 2025-2026 */}
        {activeTab === 'avances' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {[
              {
                id: 'tipo5',
                badge: 'Nuevo Subtipo IDF 2025–2026',
                title: 'Reconocimiento Oficial de la Diabetes Tipo 5 (T5DM)',
                content:
                  'Afecta a personas jóvenes y delgadas (IMC < 19 kg/m², inicio <30 años) con antecedente de desnutrición gestacional o infantil crónica. Conservan sensibilidad a la insulina y no suelen hacer cetoacidosis pese a hiperglucemias >200 mg/dL. Dosis estándar altas de insulina pueden causar hipoglucemia grave: el manejo requiere rehabilitación nutricional proteica y dosis bajas prudentes.'
              },
              {
                id: 'deteccion',
                badge: 'Diagnóstico Temprano',
                title: 'Glucemia a la 1 Hora y Microbioma Intestinal',
                content:
                  'La IDF respalda la glucemia 1 hora tras carga oral como marcador precoz antes de que suba la glucosa en ayunas o HbA1c. Además, estudios de 2026 muestran que alteraciones en bacterias intestinales productoras de butirato anticipan el riesgo de diabetes tipo 2, reforzando el valor de la fibra vegetal diaria.'
              },
              {
                id: 'tecnologia',
                badge: 'Tecnología ADA 2026',
                title: 'Sensores Continuos (MCG), Sistemas AID y Sensor Dual de Cetonas',
                content:
                  'Los sistemas automatizados de insulina (AID) pasan a ser recomendación preferente en DT1 y obtienen recomendación de primer nivel en DT2 con insulina. Destacan el sensor implantable anual Eversense 365 (integrado con twiist) y el primer sensor dual de glucosa y cetonas (Abbott Libre Duo), además de biosensores sin receta (Stelo, Lingo) para observar hábitos cotidianos en DT2 sin insulina o prediabetes.'
              },
              {
                id: 'farmacos',
                badge: 'Farmacoterapia 2025–2026',
                title: 'Insulinas Semanales (Awiqli), Incretinas Orales/Triples y Protección Renal',
                content:
                  'Awiqli (insulina icodec) reduce las inyecciones basales de 365 a 52 al año. En fase 3 destacan orforglipron (GLP-1 oral sin ayuno), CagriSema y retatrutida (agonista triple). En protección renal y cardíaca, el ensayo CONFIDENCE respalda combinar finerenona + empagliflozina desde el inicio en pacientes indicados.'
              },
              {
                id: 'cura',
                badge: 'Cura Funcional y Remisión',
                title: 'Terapia Celular (Zimislecel / UP421) y Realidad del Ensayo DiRECT',
                content:
                  'En DT1, zimislecel (islotes derivados de células madre) logró 83% de independencia de insulina al año (con inmunosupresión), mientras UP421 mostró supervivencia celular sin inmunosupresores mediante edición hipoinmune. En DT2, el estudio DiRECT a 5 años confirma que la remisión (HbA1c <6.5% sin fármacos ≥3 meses) es posible con pérdida de peso temprana, pero depende de no recuperar el peso y preservar masa muscular.'
              }
            ].map(item => {
              const isOpen = openAdvanceId === item.id;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenAdvanceId(isOpen ? '' : item.id)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                        {item.badge}
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1.5">{item.title}</h3>
                    </div>
                    {isOpen ? (
                      <ChevronUp size={20} className="text-blue-900 shrink-0" />
                    ) : (
                      <ChevronDown size={20} className="text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                      {item.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HerramientasDiabetes;
