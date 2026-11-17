import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ArrowLeft,
  Flame,
  Coffee,
  Utensils,
  Stethoscope,
  Camera,
  Loader2,
  Plus,
  Trash2,
  Calendar,
  PhoneCall,
  Type,
  UtensilsCrossed,
  TrendingUp,
  Eye
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { safeSetItem } from '../utils/storage';
import { compressImageFile } from '../utils/imageCompressor';
import { geminiService, NutritionLabelAnalysisResult } from '../services/geminiService';

type ProfileMode = 'prevencion' | 'cuidado';
type MainTab = 'planificador' | 'mi_plato' | 'bitacora' | 'calculadoras' | 'semaforo' | 'avances';

interface RoutineTask {
  id: string;
  pillar: '5S' | 'Crononutricion' | 'Cuidado' | 'Prevencion';
  title: string;
  detail: string;
  mode: 'both' | 'prevencion' | 'cuidado';
}

interface GlucoseLogEntry {
  id: string;
  dateTime: string;
  moment: 'Ayunas' | '1h Post-comida' | '2h Post-comida' | 'Antes de dormir';
  glucose: number;
  systolic?: number;
  diastolic?: number;
  note?: string;
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
    title: 'Stepping: Caminata digestiva post-comida',
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
    name: 'Suplementos "milagro" con Adelfa Amarilla (Yellow Oleander / Tejocote)',
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
    name: 'Bebidas azucaradas, refrescos y ultraprocesados',
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
    name: 'Polioles: Eritritol y Xilitol en dosis frecuentes (productos keto)',
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

interface PlateOption {
  label: string;
  benefit: string;
}

const LOCAL_PLATE_OPTIONS: Record<'fibra' | 'proteina' | 'carbohidrato' | 'bebida', PlateOption[]> = {
  fibra: [
    { label: 'Ensalada fresca de berro, pepino y tomate', benefit: 'Fibra soluble + antioxidantes' },
    { label: 'Hierbas cocidas (macuy/quilete, acelga o espinaca)', benefit: 'Hierro, fibra y bajo índice glucémico' },
    { label: 'Ejotes, güicoy y brócoli al vapor', benefit: 'Alimenta bacterias de butirato' },
    { label: 'Chirmol asado con cebolla, cilantro y rábano', benefit: 'Sabor natural sin azúcares ni sodio alto' }
  ],
  proteina: [
    { label: 'Pechuga de pollo o pavo a la plancha', benefit: 'Proteína magra para preservar músculo' },
    { label: '2 huevos revueltos o duros con queso fresco', benefit: 'Alta saciedad matutina' },
    { label: 'Filete de pescado con ajo y limón', benefit: 'Omega-3 cardioprotector (patrón mediterráneo)' },
    { label: '½ taza de frijol negro parado', benefit: 'Proteína vegetal + fibra prebiótica' }
  ],
  carbohidrato: [
    { label: '¼ de aguacate + 1 tortilla de maíz', benefit: 'Grasa monoinsaturada que amortigua picos' },
    { label: '1 o 2 tortillas de maíz nixtamalizado', benefit: 'Porción controlada sin ultraprocesados' },
    { label: '½ taza de arroz integral o camote cocido', benefit: 'Carbohidrato complejo de absorción lenta' },
    { label: '1 cda de pepitoria molida + 1 tortilla', benefit: 'Magnesio y grasas saludables locales' }
  ],
  bebida: [
    { label: 'Agua pura fresca', benefit: 'Cero calorías, cero edulcorantes (OMS)' },
    { label: 'Té de jamaica o manzanilla sin azúcar', benefit: 'Sin dulzor artificial' },
    { label: 'Agua con limón y hojas de hierbabuena', benefit: 'Hidratación limpia y refrescante' }
  ]
};

const QUICK_SEARCH_CHIPS = ['Ozempic', 'Eritritol', 'Tejocote', 'Estatinas', 'Refrescos', 'Prednisona'];

const STORAGE_KEY = 'club_leones_diabetes_planner_v1';
const LOGS_STORAGE_KEY = 'club_leones_diabetes_logs_v1';

const timeToMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return 0;
  return h * 60 + m;
};

const HerramientasDiabetes: React.FC = () => {
  const [profileMode, setProfileMode] = useState<ProfileMode>('prevencion');
  const [activeTab, setActiveTab] = useState<MainTab>('planificador');
  const [largeText, setLargeText] = useState<boolean>(false);
  const [showEmergencyCard, setShowEmergencyCard] = useState<boolean>(false);

  // Planificador State
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [aerobicMinutes, setAerobicMinutes] = useState<number>(0);
  const [strengthSessions, setStrengthSessions] = useState<number>(0);
  const [breakfastTime, setBreakfastTime] = useState<string>('07:30');
  const [lunchTime, setLunchTime] = useState<string>('13:00');
  const [dinnerTime, setDinnerTime] = useState<string>('18:30');
  const [sleepTime, setSleepTime] = useState<string>('22:00');
  const [usesInsulinOrSulfonylurea, setUsesInsulinOrSulfonylurea] = useState<boolean>(false);

  // Mi Plato Guatemalteco State
  const [selectedFibra, setSelectedFibra] = useState<string>(LOCAL_PLATE_OPTIONS.fibra[0].label);
  const [selectedProteina, setSelectedProteina] = useState<string>(LOCAL_PLATE_OPTIONS.proteina[0].label);
  const [selectedCarb, setSelectedCarb] = useState<string>(LOCAL_PLATE_OPTIONS.carbohidrato[0].label);
  const [selectedBebida, setSelectedBebida] = useState<string>(LOCAL_PLATE_OPTIONS.bebida[0].label);

  // Bitácora Histórica State
  const [logs, setLogs] = useState<GlucoseLogEntry[]>([]);
  const [newLogMoment, setNewLogMoment] = useState<GlucoseLogEntry['moment']>('Ayunas');
  const [newLogGlucose, setNewLogGlucose] = useState<string>('');
  const [newLogSys, setNewLogSys] = useState<string>('');
  const [newLogDia, setNewLogDia] = useState<string>('');
  const [newLogNote, setNewLogNote] = useState<string>('');

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

  // Semáforo + Escáner IA Etiquetas
  const [productQuery, setProductQuery] = useState<string>('');
  const [productFilter, setProductFilter] = useState<'all' | 'peligro' | 'evitar' | 'vigilar'>('all');
  const labelInputRef = useRef<HTMLInputElement>(null);
  const [analyzingLabel, setAnalyzingLabel] = useState<boolean>(false);
  const [labelPreview, setLabelPreview] = useState<string | null>(null);
  const [labelResult, setLabelResult] = useState<NutritionLabelAnalysisResult | null>(null);
  const [labelError, setLabelError] = useState<string | null>(null);

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

      const savedLogs = localStorage.getItem(LOGS_STORAGE_KEY);
      if (savedLogs) {
        const parsedLogs = JSON.parse(savedLogs);
        if (Array.isArray(parsedLogs)) setLogs(parsedLogs);
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

  useEffect(() => {
    safeSetItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

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

  const caffeineCutoff = useMemo(() => {
    const [h, m] = sleepTime.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return '10:00';
    const cutoffH = (h - 12 + 24) % 24;
    return `${String(cutoffH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }, [sleepTime]);

  const circadianStats = useMemo(() => {
    const bMin = timeToMinutes(breakfastTime);
    const dMin = timeToMinutes(dinnerTime);
    const lMin = timeToMinutes(lunchTime);
    const sMin = timeToMinutes(sleepTime);
    const cMin = timeToMinutes(caffeineCutoff);
    const eatingWindowHours = Math.max(0, Number(((dMin - bMin) / 60).toFixed(1)));
    const overnightFastHours = Number((24 - eatingWindowHours).toFixed(1));
    const isLateDinner = dMin > 20 * 60 + 30;
    return {
      bPct: (bMin / 1440) * 100,
      lPct: (lMin / 1440) * 100,
      dPct: (dMin / 1440) * 100,
      sPct: (sMin / 1440) * 100,
      cPct: (cMin / 1440) * 100,
      eatingWindowHours,
      overnightFastHours,
      isLateDinner
    };
  }, [breakfastTime, lunchTime, dinnerTime, sleepTime, caffeineCutoff]);

  // Presets Mi Plato
  const applyPlatePreset = (preset: 'desayuno' | 'almuerzo' | 'cena') => {
    if (preset === 'desayuno') {
      setSelectedFibra(LOCAL_PLATE_OPTIONS.fibra[3]);
      setSelectedProteina(LOCAL_PLATE_OPTIONS.proteina[1]);
      setSelectedCarb(LOCAL_PLATE_OPTIONS.carbohidrato[0]);
      setSelectedBebida(LOCAL_PLATE_OPTIONS.bebida[1]);
    } else if (preset === 'almuerzo') {
      setSelectedFibra(LOCAL_PLATE_OPTIONS.fibra[2]);
      setSelectedProteina(LOCAL_PLATE_OPTIONS.proteina[0]);
      setSelectedCarb(LOCAL_PLATE_OPTIONS.carbohidrato[1]);
      setSelectedBebida(LOCAL_PLATE_OPTIONS.bebida[2]);
    } else {
      setSelectedFibra(LOCAL_PLATE_OPTIONS.fibra[0]);
      setSelectedProteina(LOCAL_PLATE_OPTIONS.proteina[2]);
      setSelectedCarb(LOCAL_PLATE_OPTIONS.carbohidrato[3]);
      setSelectedBebida(LOCAL_PLATE_OPTIONS.bebida[1]);
    }
  };

  // Bitácora handlers
  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    const g = parseFloat(newLogGlucose);
    if (isNaN(g) || g < 20 || g > 650) return;

    const entry: GlucoseLogEntry = {
      id: `log-${Date.now()}`,
      dateTime: new Date().toISOString(),
      moment: newLogMoment,
      glucose: Math.round(g),
      systolic: newLogSys ? parseInt(newLogSys, 10) : undefined,
      diastolic: newLogDia ? parseInt(newLogDia, 10) : undefined,
      note: newLogNote.trim() || undefined
    };

    setLogs(prev => [entry, ...prev].slice(0, 90));
    if (entry.glucose < 70) {
      setShowEmergencyCard(true);
    }
    setNewLogGlucose('');
    setNewLogSys('');
    setNewLogDia('');
    setNewLogNote('');
  };

  const handleLoadDemoLogs = () => {
    const now = Date.now();
    const hour = 3600 * 1000;
    const demo: GlucoseLogEntry[] = [
      { id: 'demo-1', dateTime: new Date(now - 2 * hour).toISOString(), moment: 'Ayunas', glucose: 104, systolic: 122, diastolic: 78, note: 'Buen descanso 7.5 h' },
      { id: 'demo-2', dateTime: new Date(now - 14 * hour).toISOString(), moment: 'Antes de dormir', glucose: 128, note: 'Cena ligera a las 18:30' },
      { id: 'demo-3', dateTime: new Date(now - 20 * hour).toISOString(), moment: '2h Post-comida', glucose: 146, note: 'Caminata de 20 min' },
      { id: 'demo-4', dateTime: new Date(now - 26 * hour).toISOString(), moment: 'Ayunas', glucose: 109, systolic: 125, diastolic: 80 },
      { id: 'demo-5', dateTime: new Date(now - 42 * hour).toISOString(), moment: '1h Post-comida', glucose: 168, note: 'Almuerzo con 2 tortillas' },
      { id: 'demo-6', dateTime: new Date(now - 50 * hour).toISOString(), moment: 'Ayunas', glucose: 112 }
    ];
    setLogs(demo);
  };

  const handleDeleteLog = (id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id));
  };

  const logStats = useMemo(() => {
    if (logs.length === 0) return null;
    const avgGlucose = Math.round(logs.reduce((acc, l) => acc + l.glucose, 0) / logs.length);
    const inRange = logs.filter(l => l.glucose >= 70 && l.glucose <= 180).length;
    const belowRange = logs.filter(l => l.glucose < 70).length;
    return {
      count: logs.length,
      avgGlucose,
      tirPct: Math.round((inRange / logs.length) * 100),
      tbrPct: Number(((belowRange / logs.length) * 100).toFixed(1))
    };
  }, [logs]);

  const chartData = useMemo(() => {
    return [...logs]
      .slice(0, 20)
      .reverse()
      .map(l => {
        const d = new Date(l.dateTime);
        return {
          label: `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
          glucose: l.glucose,
          moment: l.moment
        };
      });
  }, [logs]);

  // Escáner IA de Etiquetas con compresión
  const handleLabelImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalyzingLabel(true);
    setLabelResult(null);
    setLabelError(null);

    try {
      const compressedDataUrl = await compressImageFile(file, 1200, 1200, 0.82);
      setLabelPreview(compressedDataUrl);
      const res = await geminiService.analyzeNutritionLabel(compressedDataUrl, 'image/jpeg');
      if (!res.success) {
        setLabelError(
          res.error === 'ETIQUETA_NO_LEGIBLE'
            ? 'No logramos leer una tabla nutricional o lista de ingredientes clara. Acerca la cámara con buena luz.'
            : 'No se pudo completar el análisis en este momento. Verifica tu conexión e intenta de nuevo.'
        );
      } else {
        setLabelResult(res);
      }
    } catch (err: any) {
      setLabelError(
        err?.message === 'NO_API_KEY'
          ? 'El servicio de análisis IA no está configurado en este entorno.'
          : 'Ocurrió un error al procesar o analizar la imagen.'
      );
    } finally {
      setAnalyzingLabel(false);
      e.target.value = '';
    }
  };

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

  const bmiMarkerPct = useMemo(() => {
    if (bmi <= 0) return 0;
    return Math.min(98, Math.max(2, ((bmi - 15) / (40 - 15)) * 100));
  }, [bmi]);

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

  const hba1cNum = parseFloat(hba1c) || 0;
  const tirNum = parseFloat(tir) || 0;
  const tbrNum = parseFloat(tbr) || 0;
  const sysNum = parseFloat(systolicBp) || 0;
  const diaNum = parseFloat(diastolicBp) || 0;

  const hba1cMarkerPct = useMemo(() => {
    return Math.min(98, Math.max(2, ((hba1cNum - 4.5) / (11 - 4.5)) * 100));
  }, [hba1cNum]);

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
    const text =
      `Mi Plan Diario de Salud (${modeLabel} - Guía ADA 2026 Club de Leones Xela):\n` +
      `• Cumplimiento de hoy: ${progressPct}%\n` +
      `• Actividad aeróbica semanal: ${aerobicMinutes}/150 min\n` +
      `• Sesiones de fuerza: ${strengthSessions}/3\n` +
      `• Horario comidas: Desayuno ${breakfastTime} | Almuerzo ${lunchTime} | Cena ligera ${dinnerTime}\n` +
      `• Ventana alimentación: ${circadianStats.eatingWindowHours} h / Ayuno nocturno: ${circadianStats.overnightFastHours} h\n` +
      `• Hora de dormir: ${sleepTime} (Cero cafeína desde las ${caffeineCutoff})\n\n` +
      `Crea tu plan gratuito en: https://clubdeleonesquetzaltenango.org/#/herramientas/diabetes`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Ring math for progress
  const ringRadius = 32;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (progressPct / 100) * ringCircumference;

  return (
    <div className={`min-h-screen bg-slate-50 pb-16 print:bg-white print:pb-0 ${largeText ? 'diabetes-large-text' : ''}`}>
      {/* Reglas reales de escalado accesible para Letra Grande */}
      <style>{`
        .diabetes-large-text .text-xs { font-size: 0.95rem !important; line-height: 1.45rem !important; }
        .diabetes-large-text .text-\\[11px\\] { font-size: 0.88rem !important; line-height: 1.3rem !important; }
        .diabetes-large-text .text-\\[10px\\] { font-size: 0.8rem !important; line-height: 1.2rem !important; }
        .diabetes-large-text .text-sm { font-size: 1.06rem !important; line-height: 1.55rem !important; }
        .diabetes-large-text .text-base { font-size: 1.18rem !important; line-height: 1.7rem !important; }
      `}</style>

      {/* HOJA CLÍNICA DE IMPRESIÓN EXCLUSIVA (Solo visible al imprimir / guardar PDF) */}
      <div className="hidden print:block p-6 text-slate-900 space-y-5">
        <div className="border-b-2 border-blue-900 pb-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-blue-950">Hoja Clínica Personal — Prevención y Cuidado de Diabetes</h1>
            <p className="text-xs text-slate-600">Club de Leones de Quetzaltenango • Referencia Estándares ADA/EASD 2026</p>
          </div>
          <div className="text-right text-xs">
            <div><strong>Enfoque:</strong> {profileMode === 'prevencion' ? 'Prevención' : 'Cuidado Activo'}</div>
            <div><strong>Fecha:</strong> {new Date().toLocaleDateString('es-GT')}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="border border-slate-300 rounded-xl p-3 space-y-1">
            <h2 className="font-black text-sm text-blue-900 border-b border-slate-200 pb-1">Rutina 5S & Crononutrición</h2>
            <p><strong>Cumplimiento de hoy:</strong> {progressPct}%</p>
            <p><strong>Actividad aeróbica semanal:</strong> {aerobicMinutes} / 150 min</p>
            <p><strong>Sesiones de fuerza:</strong> {strengthSessions} / 3 por semana</p>
            <p><strong>Horarios:</strong> Desayuno {breakfastTime} | Almuerzo {lunchTime} | Cena {dinnerTime}</p>
            <p><strong>Dormir:</strong> {sleepTime} (Sin cafeína desde {caffeineCutoff})</p>
          </div>
          <div className="border border-slate-300 rounded-xl p-3 space-y-1">
            <h2 className="font-black text-sm text-blue-900 border-b border-slate-200 pb-1">Metas Antropométricas y Clínicas</h2>
            <p><strong>Peso / Estatura / IMC:</strong> {weightVal} {weightUnit} / {heightCm} cm / {bmi.toFixed(1)} kg/m²</p>
            <p><strong>Proteína diaria sugerida:</strong> {proteinMinG}–{proteinMaxG} g/día</p>
            <p><strong>HbA1c:</strong> {hba1c}% | <strong>Tiempo en Rango:</strong> {tir}% | <strong>Bajo &lt;70:</strong> {tbr}%</p>
            <p><strong>Presión arterial:</strong> {systolicBp}/{diastolicBp} mmHg</p>
            <p><strong>Riesgo Apnea (STOP-BANG):</strong> {stopBangScore} factores</p>
          </div>
        </div>

        <div className="border border-slate-300 rounded-xl p-3 text-xs space-y-1">
          <h2 className="font-black text-sm text-blue-900">Mi Plato Saludable Planificado</h2>
          <p><strong>50% Fibra:</strong> {selectedFibra} | <strong>25% Proteína:</strong> {selectedProteina} | <strong>25% Medido:</strong> {selectedCarb} | <strong>Bebida:</strong> {selectedBebida}</p>
        </div>

        {logs.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-black text-sm text-blue-900">
              Bitácora Reciente ({logs.length} lecturas • Promedio: {logStats?.avgGlucose} mg/dL • En rango 70–180: {logStats?.tirPct}%)
            </h2>
            <table className="w-full text-xs border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-1.5 text-left">Fecha/Hora</th>
                  <th className="border border-slate-300 p-1.5 text-left">Momento</th>
                  <th className="border border-slate-300 p-1.5 text-left">Glucosa</th>
                  <th className="border border-slate-300 p-1.5 text-left">Presión</th>
                  <th className="border border-slate-300 p-1.5 text-left">Nota</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 15).map(l => (
                  <tr key={l.id}>
                    <td className="border border-slate-300 p-1.5">{new Date(l.dateTime).toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="border border-slate-300 p-1.5">{l.moment}</td>
                    <td className="border border-slate-300 p-1.5 font-bold">{l.glucose} mg/dL</td>
                    <td className="border border-slate-300 p-1.5">{l.systolic && l.diastolic ? `${l.systolic}/${l.diastolic}` : '—'}</td>
                    <td className="border border-slate-300 p-1.5">{l.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Hero Header */}
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 text-white pt-8 pb-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden print:hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_45%)]" />
        <div className="max-w-[1240px] mx-auto relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <Link
              to="/herramientas"
              className="inline-flex items-center space-x-2 text-xs font-bold text-blue-200 hover:text-yellow-300 transition-colors"
            >
              <ArrowLeft size={15} />
              <span>Volver a Herramientas</span>
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setLargeText(v => !v)}
                className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-black border transition-all ${
                  largeText
                    ? 'bg-yellow-400 text-blue-950 border-yellow-300 shadow-md'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
              >
                <Type size={14} />
                <span>{largeText ? 'Letra Normal' : 'Letra Grande'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowEmergencyCard(v => !v)}
                className="inline-flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-500 border border-rose-400/50 text-white px-3 py-2 rounded-xl text-xs font-black transition-all shadow-sm"
              >
                <PhoneCall size={14} />
                <span>Emergencia (&lt;70 mg/dL)</span>
              </button>

              <a
                href="/docs/Guia-Uso-Herramientas-Diabetes.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
              >
                <FileDown size={15} className="text-yellow-300" />
                <span>Guía de Uso (PDF)</span>
              </a>
            </div>
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
                Organiza tu rutina diaria de 24 horas, arma tu plato guatemalteco, registra tu bitácora para el médico y escanea etiquetas con IA.
              </p>
            </div>

            {/* Selector de Modo de Usuario */}
            <div className="lg:col-span-5 bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-4 sm:p-5 space-y-3">
              <p className="text-xs font-black uppercase tracking-wider text-yellow-300 flex items-center space-x-1.5">
                <Sparkles size={14} />
                <span>Elige tu objetivo principal</span>
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setProfileMode('prevencion')}
                  className={`p-3.5 rounded-2xl text-left transition-all border ${
                    profileMode === 'prevencion'
                      ? 'bg-emerald-500 text-white border-emerald-300 shadow-lg shadow-emerald-950/30 scale-[1.02]'
                      : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <ShieldCheck size={22} className="mb-1.5" />
                  <div className="font-black text-xs sm:text-sm">Prevención</div>
                  <div className="text-[10px] opacity-90 leading-tight mt-0.5">
                    Reducir riesgo y cuidar hábitos
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setProfileMode('cuidado')}
                  className={`p-3.5 rounded-2xl text-left transition-all border ${
                    profileMode === 'cuidado'
                      ? 'bg-yellow-400 text-blue-950 border-yellow-200 shadow-lg shadow-blue-950/30 scale-[1.02]'
                      : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Activity size={22} className="mb-1.5" />
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

      {/* Tarjeta de Emergencia Desplegable */}
      {showEmergencyCard && (
        <div className="max-w-[1240px] mx-auto px-3 sm:px-6 lg:px-8 pt-6 print:hidden">
          <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-black text-rose-900 flex items-center space-x-2">
                <AlertTriangle size={22} className="text-rose-600" />
                <span>Tarjeta de Emergencia: ¿Qué hacer ante Hipoglucemia (&lt;70 mg/dL)?</span>
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-rose-700 text-white rounded-xl text-xs font-black inline-flex items-center space-x-1"
                >
                  <Printer size={14} />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmergencyCard(false)}
                  className="px-3 py-1.5 bg-white text-rose-900 border border-rose-200 rounded-xl text-xs font-bold"
                >
                  Cerrar
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-rose-950">
              <div className="bg-white p-4 rounded-2xl border border-rose-200 space-y-1.5">
                <div className="font-black text-sm text-rose-700">1. Señales de Alerta</div>
                <p>Temblor, sudor frío, mareo, palpitaciones, confusión repentina o visión borrosa. Mide tu glucosa si es posible.</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-rose-200 space-y-1.5">
                <div className="font-black text-sm text-rose-700">2. Regla de los 15 (Si está consciente)</div>
                <p>Consume 15 g de azúcar rápida (½ vaso de jugo o agua con 1 cda de azúcar/miel). Espera 15 min y vuelve a medir.</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-rose-200 space-y-1.5">
                <div className="font-black text-sm text-rose-700">3. Emergencias Quetzaltenango</div>
                <p>Si hay pérdida de conciencia NO des líquidos. Llama de inmediato: <strong>Bomberos Voluntarios: 122</strong> | <strong>Municipales: 123</strong> | <strong>Cruz Roja: 125</strong>.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navegación de Herramientas */}
      <div className="sticky top-20 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs print:hidden">
        <div className="max-w-[1240px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto no-scrollbar py-2.5 gap-2">
            {[
              { id: 'planificador', label: 'Planificador 5S', icon: CalendarCheck },
              { id: 'mi_plato', label: 'Mi Plato Saludable', icon: UtensilsCrossed },
              { id: 'bitacora', label: 'Bitácora & Gráfica', icon: TrendingUp },
              { id: 'calculadoras', label: 'Calculadoras 2026', icon: Calculator },
              { id: 'semaforo', label: 'Etiquetas IA & Alertas', icon: AlertTriangle },
              { id: 'avances', label: 'Avances 2025–2026', icon: Sparkles }
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as MainTab)}
                  className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all shrink-0 ${
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
      <div className="max-w-[1240px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 print:hidden">
        {/* Aviso Médico */}
        <div className="bg-blue-50/90 border border-blue-200 rounded-2xl p-4 flex items-start space-x-3 text-xs text-blue-950">
          <Stethoscope size={20} className="text-blue-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-medium">
            <strong>Aviso de Salud Comunitaria:</strong> Esta herramienta resume evidencia médica 2025–2026 (ADA/EASD, OMS, IDF) para ayudarte a organizar tus hábitos. <strong>No sustituye el criterio de tu médico</strong>; nunca cambies dosis ni suspendas medicamentos sin supervisión profesional.
          </p>
        </div>

        {/* TAB 1: PLANIFICADOR 5S + ANILLO PROGRESO + LÍNEA CIRCADIANA 24H */}
        {activeTab === 'planificador' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Barra de Progreso con Anillo SVG */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r={ringRadius} stroke="#e2e8f0" strokeWidth="8" fill="none" />
                    <circle
                      cx="40"
                      cy="40"
                      r={ringRadius}
                      stroke={progressPct === 100 ? '#10b981' : '#2563eb'}
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <span className="absolute text-base font-black text-slate-900">{progressPct}%</span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-900">
                    Tu Rutina de Hoy • {profileMode === 'prevencion' ? 'Prevención' : 'Cuidado Activo'}
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    {progressPct === 100
                      ? '¡Excelente! Completaste todos tus hábitos de hoy.'
                      : progressPct >= 50
                      ? '¡Vas por muy buen camino! Sigue sumando pilares.'
                      : 'Marca cada hábito conforme avances en tu día.'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Se guarda automáticamente en tu dispositivo.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition-colors"
                >
                  <Share2 size={15} />
                  <span>Enviar a WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black shadow-sm transition-colors"
                >
                  <Printer size={15} />
                  <span>Hoja Clínica PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCompletedIds([])}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  <RotateCcw size={15} />
                  <span>Reiniciar</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Checklist 5S */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    Lista Diaria Basada en el Marco "5S" (ADA 2026)
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Standing • Stepping • Sweating • Strengthening • Sleeping
                  </p>
                </div>

                <div className="space-y-2.5">
                  {visibleTasks.map(task => {
                    const checked = completedIds.includes(task.id);
                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => toggleTask(task.id)}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start space-x-3 active:scale-[0.99] ${
                          checked
                            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                            : 'bg-slate-50/70 border-slate-200/80 hover:border-blue-300 text-slate-800'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {checked ? (
                            <CheckCircle2 size={24} className="text-emerald-600" />
                          ) : (
                            <Circle size={24} className="text-slate-300" />
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

              {/* Metas Físicas + Línea de Tiempo Circadiana 24h */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-5">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center space-x-2">
                    <Flame size={20} className="text-orange-500" />
                    <span>Metas Físicas Semanales</span>
                  </h3>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700 flex items-center space-x-1.5">
                        <Footprints size={15} className="text-blue-600" />
                        <span>Actividad Aeróbica (Meta: 150 min)</span>
                      </span>
                      <span className="font-black text-blue-900">{aerobicMinutes} / 150 min</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.round((aerobicMinutes / 150) * 100))}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[15, 30, 45].map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setAerobicMinutes(prev => prev + m)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-black transition-colors"
                        >
                          +{m} min
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setAerobicMinutes(0)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold ml-auto"
                      >
                        Reiniciar
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700 flex items-center space-x-1.5">
                        <Dumbbell size={15} className="text-indigo-600" />
                        <span>Entrenamiento de Fuerza (2–3 días/sem)</span>
                      </span>
                      <span className="font-black text-indigo-900">{strengthSessions} sesiones</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStrengthSessions(s === strengthSessions ? s - 1 : s)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-black border transition-all ${
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

                {/* Mapa Visual de 24h & Crononutrición */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center space-x-2">
                      <Clock size={20} className="text-teal-600" />
                      <span>Reloj Circadiano 24h</span>
                    </h3>
                    <span className="text-[11px] font-black bg-teal-50 text-teal-800 px-2.5 py-1 rounded-full border border-teal-200">
                      Ayuno nocturno: {circadianStats.overnightFastHours} h
                    </span>
                  </div>

                  {/* Barra Timeline 24h */}
                  <div className="space-y-1.5">
                    <div className="relative h-7 bg-slate-900 rounded-full overflow-hidden border border-slate-300">
                      {/* Ventana de alimentación */}
                      <div
                        className="absolute top-0 bottom-0 bg-gradient-to-r from-amber-300 via-emerald-300 to-teal-300 opacity-85 transition-all duration-300"
                        style={{
                          left: `${circadianStats.bPct}%`,
                          width: `${Math.max(4, circadianStats.dPct - circadianStats.bPct)}%`
                        }}
                      />
                      {/* Marcadores */}
                      <div title={`Desayuno ${breakfastTime}`} className="absolute top-1 bottom-1 w-2 bg-amber-600 rounded-full border border-white" style={{ left: `${circadianStats.bPct}%` }} />
                      <div title={`Sin cafeína ${caffeineCutoff}`} className="absolute top-1 bottom-1 w-2 bg-rose-500 rounded-full border border-white" style={{ left: `${circadianStats.cPct}%` }} />
                      <div title={`Cena ${dinnerTime}`} className="absolute top-1 bottom-1 w-2 bg-teal-700 rounded-full border border-white" style={{ left: `${circadianStats.dPct}%` }} />
                      <div title={`Dormir ${sleepTime}`} className="absolute top-1 bottom-1 w-2 bg-yellow-300 rounded-full border border-slate-900" style={{ left: `${circadianStats.sPct}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1">
                      <span>00:00</span>
                      <span>06:00</span>
                      <span>12:00</span>
                      <span>18:00</span>
                      <span>24:00</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-600 pt-1">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Ventana comida ({circadianStats.eatingWindowHours} h)</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Corte cafeína ({caffeineCutoff})</span>
                    </div>
                  </div>

                  {circadianStats.isLateDinner && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-semibold">
                      ⚠️ Tu cena está programada tarde ({dinnerTime}). Adelantarla mejora el perfil glucémico nocturno.
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200/70">
                      <label className="text-[10px] font-black uppercase text-amber-900 flex items-center space-x-1">
                        <Sun size={12} />
                        <span>Desayuno</span>
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
                        <span>Dormir</span>
                      </label>
                      <input
                        type="time"
                        value={sleepTime}
                        onChange={e => setSleepTime(e.target.value)}
                        className="mt-1 w-full bg-blue-900 border border-blue-700 rounded-lg px-2 py-1.5 text-sm font-black text-white"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-100 rounded-2xl flex items-center space-x-3 text-xs text-slate-700">
                    <Coffee size={18} className="text-amber-700 shrink-0" />
                    <span>
                      <strong>Regla de Cafeína (12h):</strong> Si duermes a las <strong>{sleepTime}</strong>, evita café después de las <strong>{caffeineCutoff}</strong>.
                    </span>
                  </div>

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
                        ? ' Precaución: cualquier cambio de horario de comidas debe coordinarse con tu médico para evitar hipoglucemias.'
                        : ' Marca aquí para ver precauciones sobre horarios de comida.'}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONSTRUCTOR MI PLATO SALUDABLE GUATEMALTECO (TÁCTIL + PRESETS) */}
        {activeTab === 'mi_plato' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Presets de 1 Clic */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                ⚡ Menús Chapines en 1 Clic:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyPlatePreset('desayuno')}
                  className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 rounded-xl text-xs font-black transition-colors"
                >
                  🌅 Desayuno Chapín
                </button>
                <button
                  type="button"
                  onClick={() => applyPlatePreset('almuerzo')}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-xl text-xs font-black transition-colors"
                >
                  🍽️ Almuerzo Balanceado
                </button>
                <button
                  type="button"
                  onClick={() => applyPlatePreset('cena')}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-200 rounded-xl text-xs font-black transition-colors"
                >
                  🌙 Cena Ligera Nocturna
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Tarjetas Táctiles */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    Toca los ingredientes para armar tu plato
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Basado en el patrón Mediterráneo y Bajo en Carbohidratos (ADA 2026) con alimentos locales de Quetzaltenango.
                  </p>
                </div>

                {/* 50% Fibra */}
                <div className="space-y-2">
                  <div className="text-xs font-black uppercase text-emerald-800">1. Medio Plato (50%): Fibra y Microbioma (Comer primero)</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {LOCAL_PLATE_OPTIONS.fibra.map(opt => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setSelectedFibra(opt.label)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          selectedFibra === opt.label
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                            : 'bg-emerald-50/50 text-slate-800 border-emerald-200/80 hover:border-emerald-400'
                        }`}
                      >
                        <div className="text-xs font-black leading-snug">{opt.label}</div>
                        <div className={`text-[10px] mt-0.5 ${selectedFibra === opt.label ? 'text-emerald-100' : 'text-emerald-700'}`}>
                          {opt.benefit}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 25% Proteína */}
                <div className="space-y-2">
                  <div className="text-xs font-black uppercase text-blue-900">2. Un Cuarto (25%): Proteína Protectora Muscular</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {LOCAL_PLATE_OPTIONS.proteina.map(opt => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setSelectedProteina(opt.label)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          selectedProteina === opt.label
                            ? 'bg-blue-700 text-white border-blue-700 shadow-md'
                            : 'bg-blue-50/50 text-slate-800 border-blue-200/80 hover:border-blue-400'
                        }`}
                      >
                        <div className="text-xs font-black leading-snug">{opt.label}</div>
                        <div className={`text-[10px] mt-0.5 ${selectedProteina === opt.label ? 'text-blue-100' : 'text-blue-700'}`}>
                          {opt.benefit}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 25% Carbohidrato Medido */}
                <div className="space-y-2">
                  <div className="text-xs font-black uppercase text-amber-900">3. Un Cuarto (25%): Carbohidrato Medido + Grasa Saludable</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {LOCAL_PLATE_OPTIONS.carbohidrato.map(opt => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setSelectedCarb(opt.label)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          selectedCarb === opt.label
                            ? 'bg-amber-500 text-blue-950 border-amber-500 shadow-md'
                            : 'bg-amber-50/50 text-slate-800 border-amber-200/80 hover:border-amber-400'
                        }`}
                      >
                        <div className="text-xs font-black leading-snug">{opt.label}</div>
                        <div className={`text-[10px] mt-0.5 ${selectedCarb === opt.label ? 'text-blue-900 font-bold' : 'text-amber-800'}`}>
                          {opt.benefit}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bebida */}
                <div className="space-y-2">
                  <div className="text-xs font-black uppercase text-cyan-900">4. Bebida Sin Azúcar ni Edulcorantes</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {LOCAL_PLATE_OPTIONS.bebida.map(opt => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setSelectedBebida(opt.label)}
                        className={`p-2.5 rounded-2xl border text-left transition-all ${
                          selectedBebida === opt.label
                            ? 'bg-cyan-700 text-white border-cyan-700 shadow-md'
                            : 'bg-cyan-50/50 text-slate-800 border-cyan-200/80 hover:border-cyan-400'
                        }`}
                      >
                        <div className="text-xs font-black leading-snug">{opt.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Vista Previa Visual del Plato + Orden Alimentario */}
              <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <h3 className="text-base font-black text-slate-900 text-center">Tu Plato Listo</h3>
                  <div className="w-60 h-60 mx-auto rounded-full border-8 border-slate-200 shadow-inner overflow-hidden flex flex-col">
                    <div className="h-1/2 bg-emerald-500 text-white p-3 flex flex-col items-center justify-center text-center border-b-4 border-white">
                      <span className="text-[10px] font-black uppercase">50% Fibra (1º)</span>
                      <span className="text-[11px] font-bold leading-tight line-clamp-2 mt-0.5">{selectedFibra}</span>
                    </div>
                    <div className="h-1/2 flex">
                      <div className="w-1/2 bg-blue-600 text-white p-2.5 flex flex-col items-center justify-center text-center border-r-2 border-white">
                        <span className="text-[9px] font-black uppercase">25% Proteína (2º)</span>
                        <span className="text-[10px] font-bold leading-tight line-clamp-3 mt-0.5">{selectedProteina}</span>
                      </div>
                      <div className="w-1/2 bg-amber-400 text-blue-950 p-2.5 flex flex-col items-center justify-center text-center border-l-2 border-white">
                        <span className="text-[9px] font-black uppercase">25% Medido (3º)</span>
                        <span className="text-[10px] font-bold leading-tight line-clamp-3 mt-0.5">{selectedCarb}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-xs font-bold text-cyan-900 bg-cyan-50 py-2.5 px-3 rounded-xl border border-cyan-200">
                    🥤 Bebida: {selectedBebida}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2">
                  <div className="font-black text-slate-900">📉 Secuencia Inteligente para Evitar Picos:</div>
                  <div className="flex items-center justify-between gap-1 text-[11px] font-bold">
                    <span className="bg-emerald-100 text-emerald-900 px-2 py-1 rounded-lg">1º Verduras</span>
                    <span>→</span>
                    <span className="bg-blue-100 text-blue-900 px-2 py-1 rounded-lg">2º Proteína</span>
                    <span>→</span>
                    <span className="bg-amber-100 text-amber-900 px-2 py-1 rounded-lg">3º Tortilla/Carb</span>
                  </div>
                  <p className="leading-relaxed">
                    Comer la fibra primero crea una "red natural" en el intestino que frena la absorción rápida de glucosa y alimenta bacterias productoras de butirato.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BITÁCORA HISTÓRICA + DEMO 1 CLIC + GRÁFICA */}
        {activeTab === 'bitacora' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleAddLog}
                className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4"
              >
                <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                  <Plus size={20} className="text-blue-700" />
                  <span>Registrar Medición</span>
                </h2>

                {/* Chips táctiles para momento del día */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Momento del día</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['Ayunas', '1h Post-comida', '2h Post-comida', 'Antes de dormir'] as const).map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setNewLogMoment(m)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-black border transition-all ${
                          newLogMoment === m
                            ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Glucosa (mg/dL)*</label>
                    <input
                      type="number"
                      required
                      min={20}
                      max={650}
                      value={newLogGlucose}
                      onChange={e => setNewLogGlucose(e.target.value)}
                      placeholder="112"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Presión (Opcional)</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={newLogSys}
                        onChange={e => setNewLogSys(e.target.value)}
                        placeholder="120"
                        className="w-1/2 px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-center"
                      />
                      <input
                        type="number"
                        value={newLogDia}
                        onChange={e => setNewLogDia(e.target.value)}
                        placeholder="80"
                        className="w-1/2 px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-center"
                      />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">Nota breve (opcional)</label>
                    <input
                      type="text"
                      value={newLogNote}
                      onChange={e => setNewLogNote(e.target.value)}
                      placeholder="Ej. Caminé 20 min después de almorzar"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-colors"
                >
                  Guardar en Mi Bitácora
                </button>
              </form>

              {/* Gráfica y Estadísticas */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Tendencia Glucémica (Meta 70–180 mg/dL)</h2>
                    <p className="text-xs text-slate-500">Resumen automático para llevar a tu consulta médica</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {logs.length === 0 ? (
                      <button
                        type="button"
                        onClick={handleLoadDemoLogs}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-black"
                      >
                        <Eye size={14} />
                        <span>Cargar Ejemplo Demo</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black"
                        >
                          <Printer size={14} />
                          <span>Imprimir Reporte</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogs([])}
                          className="inline-flex items-center space-x-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                        >
                          <RotateCcw size={13} />
                          <span>Limpiar</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {logStats ? (
                  <>
                    <div className="grid grid-cols-3 gap-2.5 text-center">
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-[10px] font-black uppercase text-slate-500">Promedio</span>
                        <div className="text-xl font-black text-slate-900">{logStats.avgGlucose} mg/dL</div>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                        <span className="text-[10px] font-black uppercase text-emerald-800">En Rango (70–180)</span>
                        <div className="text-xl font-black text-emerald-700">{logStats.tirPct}%</div>
                      </div>
                      <div className={`p-3 rounded-2xl border ${logStats.tbrPct < 1 ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                        <span className="text-[10px] font-black uppercase">Bajo &lt;70 mg/dL</span>
                        <div className="text-xl font-black">{logStats.tbrPct}%</div>
                      </div>
                    </div>

                    <div className="h-56 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                          <YAxis domain={[50, 'auto']} tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <ReferenceLine y={180} stroke="#f59e0b" strokeDasharray="4 4" />
                          <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" />
                          <Line type="monotone" dataKey="glucose" stroke="#1e3a8a" strokeWidth={3} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs font-medium space-y-2">
                    <TrendingUp size={32} className="mx-auto opacity-50" />
                    <p>Agrega tu primera medición o presiona <strong>"Cargar Ejemplo Demo"</strong> para visualizar la gráfica de tendencia.</p>
                  </div>
                )}
              </div>
            </div>

            {logs.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-600">
                  Últimos Registros Guardados ({logs.length})
                </h3>
                <div className="divide-y divide-slate-100">
                  {logs.slice(0, 15).map(l => (
                    <div key={l.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`font-black px-2.5 py-1 rounded-lg ${
                          l.glucose < 70
                            ? 'bg-rose-100 text-rose-800'
                            : l.glucose <= 180
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          {l.glucose} mg/dL
                        </span>
                        <span className="font-bold text-slate-800">{l.moment}</span>
                        {l.systolic && l.diastolic && (
                          <span className="text-slate-500 font-semibold">• PA: {l.systolic}/{l.diastolic}</span>
                        )}
                        <span className="text-slate-400">
                          {new Date(l.dateTime).toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                        {l.note && <span className="text-slate-600 italic">— "{l.note}"</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteLog(l.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Eliminar registro"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CALCULADORAS CON DESLIZADORES TÁCTILES Y TERMÓMETROS */}
        {activeTab === 'calculadoras' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-5">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Scale size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Meta de Peso (5–7%) y Proteína Diaria</h2>
                  <p className="text-xs text-slate-500">Desliza para calcular al instante según ADA 2026</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">Peso Actual</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={weightVal}
                        onChange={e => setWeightVal(e.target.value)}
                        className="w-20 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black text-center"
                      />
                      <select
                        value={weightUnit}
                        onChange={e => setWeightUnit(e.target.value as 'kg' | 'lb')}
                        className="px-2 py-1 bg-slate-200 rounded-lg text-xs font-black text-slate-800"
                      >
                        <option value="lb">lb</option>
                        <option value="kg">kg</option>
                      </select>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={weightUnit === 'lb' ? 80 : 35}
                    max={weightUnit === 'lb' ? 350 : 160}
                    value={parseFloat(weightVal) || (weightUnit === 'lb' ? 165 : 75)}
                    onChange={e => setWeightVal(e.target.value)}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">Estatura (cm)</label>
                    <input
                      type="number"
                      value={heightCm}
                      onChange={e => setHeightCm(e.target.value)}
                      className="w-20 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black text-center"
                    />
                  </div>
                  <input
                    type="range"
                    min={130}
                    max={210}
                    value={parseFloat(heightCm) || 168}
                    onChange={e => setHeightCm(e.target.value)}
                    className="w-full accent-blue-700 cursor-pointer"
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
                <div className="space-y-4 pt-1">
                  {/* Termómetro visual de IMC */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span>IMC: <strong className="text-base text-slate-900">{bmi.toFixed(1)} kg/m²</strong></span>
                      <span className="text-blue-700">
                        {bmi < 19
                          ? 'Bajo peso (Evaluar T5DM si hay hiperglucemia)'
                          : bmi < 25
                          ? 'Rango saludable'
                          : bmi < 30
                          ? 'Sobrepeso'
                          : 'Obesidad'}
                      </span>
                    </div>
                    <div className="relative h-3 rounded-full overflow-hidden flex">
                      <div className="w-[16%] bg-sky-400" title="Bajo peso <19" />
                      <div className="w-[24%] bg-emerald-500" title="Saludable 19-24.9" />
                      <div className="w-[20%] bg-amber-400" title="Sobrepeso 25-29.9" />
                      <div className="w-[40%] bg-rose-500" title="Obesidad ≥30" />
                      <div
                        className="absolute top-0 bottom-0 w-2.5 bg-slate-900 border-2 border-white rounded-full -ml-1 transition-all duration-200"
                        style={{ left: `${bmiMarkerPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                      <span className="text-[10px] font-black uppercase text-emerald-800">Meta Preventiva ADA 5–7%</span>
                      <div className="text-lg font-black text-emerald-950 mt-0.5">
                        -{(weightUnit === 'lb' ? weightLoss5 * 2.20462 : weightLoss5).toFixed(1)} a -{(weightUnit === 'lb' ? weightLoss7 * 2.20462 : weightLoss7).toFixed(1)} {weightUnit}
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-800 block">
                        Junto a 150 min/sem de actividad
                      </span>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 text-xs text-blue-950">
                      <span className="text-[10px] font-black uppercase text-blue-800">Proteína Protectora</span>
                      <div className="font-black text-lg mt-0.5">
                        {proteinMinG} – {proteinMaxG} g/día
                      </div>
                      <span className="text-[11px] font-medium block">
                        Para conservar masa muscular
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-7 space-y-5">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Droplets size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Evaluador de Metas Clínicas (ADA 2026)</h2>
                  <p className="text-xs text-slate-500">Ajusta tus valores para comparar contra metas oficiales</p>
                </div>
              </div>

              {/* Slider HbA1c + Termómetro */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <label>HbA1c (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={hba1c}
                    onChange={e => setHba1c(e.target.value)}
                    className="w-20 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black text-center"
                  />
                </div>
                <input
                  type="range"
                  min={4.5}
                  max={11}
                  step={0.1}
                  value={hba1cNum}
                  onChange={e => setHba1c(e.target.value)}
                  className="w-full accent-blue-900 cursor-pointer"
                />
                <div className="relative h-2.5 rounded-full overflow-hidden flex">
                  <div className="w-[31%] bg-emerald-500" title="<6.5% Óptimo / Remisión" />
                  <div className="w-[8%] bg-teal-400" title="6.5-6.9% En Meta" />
                  <div className="w-[15%] bg-amber-400" title="7.0-7.9% Precirugía" />
                  <div className="w-[46%] bg-rose-500" title="≥8.0% Fuera de meta" />
                  <div
                    className="absolute top-0 bottom-0 w-2.5 bg-slate-900 border-2 border-white rounded-full -ml-1 transition-all duration-200"
                    style={{ left: `${hba1cMarkerPct}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">En Rango (%)</label>
                  <input
                    type="number"
                    value={tir}
                    onChange={e => setTir(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Bajo &lt;70 (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tbr}
                    onChange={e => setTbr(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Sistólica</label>
                  <input
                    type="number"
                    value={systolicBp}
                    onChange={e => setSystolicBp(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Diastólica</label>
                  <input
                    type="number"
                    value={diastolicBp}
                    onChange={e => setDiastolicBp(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className={`p-3 rounded-2xl border flex items-center justify-between ${hba1cNum < 7 ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-amber-50 border-amber-200 text-amber-950'}`}>
                  <span><strong>HbA1c ({hba1cNum}%):</strong> Meta general adultos &lt; 7.0%</span>
                  <span className="font-black">{hba1cNum < 6.5 ? 'Óptimo / Remisión*' : hba1cNum < 7 ? 'En Meta' : 'Revisar con médico'}</span>
                </div>

                <div className={`p-3 rounded-2xl border flex items-center justify-between ${tirNum >= 70 ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-amber-50 border-amber-200 text-amber-950'}`}>
                  <span><strong>Tiempo en Rango ({tirNum}%):</strong> Meta 70–180 &gt; 70%</span>
                  <span className="font-black">{tirNum >= 70 ? 'En Meta' : 'Por mejorar'}</span>
                </div>

                <div className={`p-3 rounded-2xl border flex items-center justify-between ${tbrNum < 1 ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'}`}>
                  <span><strong>Hipoglucemia &lt;70 ({tbrNum}%):</strong> Seguridad 2026 &lt; 1%</span>
                  <span className="font-black">{tbrNum < 1 ? 'Seguro (<1%)' : 'Alerta Hipoglucemia'}</span>
                </div>

                <div className={`p-3 rounded-2xl border flex items-center justify-between ${sysNum < 130 && diaNum < 80 ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-amber-50 border-amber-200 text-amber-950'}`}>
                  <span><strong>Presión ({sysNum}/{diaNum}):</strong> Meta &lt; 130/80 mmHg</span>
                  <span className="font-black">{sysNum < 130 && diaNum < 80 ? 'En Meta' : 'Vigilar'}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                *La remisión de DT2 se define como HbA1c &lt; 6.5% durante ≥3 meses sin medicación hipoglucemiante. Antes de cirugías electivas: HbA1c &lt; 8%.
              </p>
            </div>

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

        {/* TAB 5: ESCÁNER DE ETIQUETAS IA & SEMÁFORO DE PRODUCTOS */}
        {activeTab === 'semaforo' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-gradient-to-br from-indigo-950 via-blue-900 to-blue-950 text-white rounded-3xl p-5 sm:p-7 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-yellow-300 bg-yellow-400/15 px-2.5 py-0.5 rounded-full border border-yellow-400/30">
                    Asistente IA de Etiquetas
                  </span>
                  <h2 className="text-lg sm:text-xl font-black">
                    Escanea la Etiqueta o Ingredientes de cualquier Producto
                  </h2>
                  <p className="text-xs text-slate-200 max-w-2xl">
                    Toma una foto a la tabla nutricional o ingredientes. Comprimimos la imagen para respuesta rápida y revisamos grasas trans, eritritol/xilitol, azúcares, edulcorantes y sodio.
                  </p>
                </div>

                <div className="shrink-0">
                  <input
                    ref={labelInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleLabelImageChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={analyzingLabel}
                    onClick={() => labelInputRef.current?.click()}
                    className="inline-flex items-center space-x-2 px-5 py-3 bg-yellow-400 hover:bg-yellow-300 text-blue-950 rounded-2xl text-xs sm:text-sm font-black shadow-lg transition-all disabled:opacity-60"
                  >
                    {analyzingLabel ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Analizando etiqueta...</span>
                      </>
                    ) : (
                      <>
                        <Camera size={18} />
                        <span>Tomar / Subir Foto</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {labelError && (
                <div className="p-3.5 bg-rose-500/20 border border-rose-300/40 rounded-2xl text-xs text-rose-100 font-semibold">
                  {labelError}
                </div>
              )}

              {labelResult && (
                <div className="bg-white text-slate-900 rounded-2xl p-5 shadow-xl animate-in zoom-in-95 duration-200 flex flex-col sm:flex-row gap-4">
                  {labelPreview && (
                    <img
                      src={labelPreview}
                      alt="Etiqueta analizada"
                      className="w-full sm:w-32 h-32 object-cover rounded-xl border border-slate-200 shrink-0"
                    />
                  )}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-black text-base">{labelResult.productoDetectado}</h3>
                      <span
                        className={`text-xs font-black uppercase px-3 py-1 rounded-full ${
                          labelResult.veredicto === 'recomendado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : labelResult.veredicto === 'precaucion'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {labelResult.veredicto === 'recomendado'
                          ? '✅ Apto / Recomendado'
                          : labelResult.veredicto === 'precaucion'
                          ? '⚠️ Consumir con Precaución'
                          : '🚫 Mejor Evitar'}
                      </span>
                    </div>

                    {labelResult.alertasDetectadas && labelResult.alertasDetectadas.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {labelResult.alertasDetectadas.map((a, i) => (
                          <span key={i} className="text-[11px] font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200">
                            • {a}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {labelResult.analisisDetallado}
                    </p>
                    {labelResult.alternativaSaludable && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950">
                        <strong>Alternativa sugerida:</strong> {labelResult.alternativaSaludable}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Buscador + Chips Rápidos */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={productQuery}
                    onChange={e => setProductQuery(e.target.value)}
                    placeholder="Buscar producto, edulcorante, suplemento o fármaco..."
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

              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-bold mr-1">Búsquedas rápidas:</span>
                {QUICK_SEARCH_CHIPS.map(chip => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setProductQuery(productQuery === chip ? '' : chip)}
                    className={`px-2.5 py-1 rounded-lg font-bold border transition-colors ${
                      productQuery === chip
                        ? 'bg-blue-100 text-blue-900 border-blue-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {chip}
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

        {/* TAB 6: AVANCES CIENTÍFICOS 2025-2026 */}
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

            <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-700 font-medium">
                <strong>Documento Científico Base:</strong> Consulta la investigación completa con referencias médicas (2025–2026).
              </div>
              <a
                href="/docs/Avances%20Recientes%20Sobre%20la%20Diabetes.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-blue-950 rounded-xl text-xs font-black shadow-2xs transition-colors"
              >
                <FileDown size={14} />
                <span>Descargar Investigación Completa (PDF)</span>
              </a>
            </div>
          </div>
        )}

        {/* Enlace con Jornadas Médicas del Club de Leones */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-blue-950 px-3 py-1 rounded-full">
              Servicio Comunitario en Quetzaltenango
            </span>
            <h2 className="text-xl sm:text-2xl font-black">
              ¿Buscas Jornadas de Glucosa, Presión o Salud Visual?
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl">
              Consulta el calendario de jornadas médicas gratuitas del Club de Leones de Quetzaltenango o envía una solicitud de apoyo comunitario.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 shrink-0">
            <Link
              to="/actividades"
              className="inline-flex items-center space-x-2 px-5 py-3 bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition-colors"
            >
              <Calendar size={16} />
              <span>Ver Jornadas y Actividades</span>
            </Link>
            <Link
              to="/solicitudes"
              className="inline-flex items-center space-x-2 px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-xs sm:text-sm rounded-xl transition-colors"
            >
              <span>Solicitar Apoyo</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HerramientasDiabetes;
