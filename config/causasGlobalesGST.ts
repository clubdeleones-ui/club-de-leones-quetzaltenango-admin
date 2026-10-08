export interface CausaGlobalGST {
  id: string;
  causaGlobal: 
    | 'Juventud'
    | 'Cáncer Infantil'
    | 'Ayuda Humanitaria / Paz'
    | 'Salud Mental y Bienestar'
    | 'Visión'
    | 'Diabetes'
    | 'Hambre'
    | 'Cáncer'
    | 'Medio Ambiente'
    | 'Cierre GST';
  fechaTexto: string;
  conmemoracion: string;
  tipo: 'dia' | 'semana' | 'mes';
  fechaInicio: string; // "YYYY-MM-DD"
  fechaFin?: string;   // "YYYY-MM-DD" para semanas o meses
  mesIndex: number;    // 0 para Enero, 11 para Diciembre
  ano: number;         // 2026 o 2027
  color: {
    bgLight: string;
    bgBadge: string;
    textBadge: string;
    border: string;
    accentHex: string;
    gradientHeader: string;
  };
  iconoKey: 'users' | 'ribbon-gold' | 'peace' | 'lotus' | 'eye' | 'diabetes' | 'hunger' | 'ribbon-purple' | 'environment' | 'chart' | 'handshake';
  sugerenciaActividad: string;
}

export const CAUSAS_GLOBALES_GST_2026_2027: CausaGlobalGST[] = [
  // 1. Agosto 2026
  {
    id: 'gst-2026-08-12',
    causaGlobal: 'Juventud',
    fechaTexto: '12 de agosto 2026',
    conmemoracion: 'Día Internacional de la Juventud',
    tipo: 'dia',
    fechaInicio: '2026-08-12',
    mesIndex: 7,
    ano: 2026,
    color: {
      bgLight: 'bg-purple-50',
      bgBadge: 'bg-purple-100',
      textBadge: 'text-purple-900',
      border: 'border-purple-300',
      accentHex: '#7c3aed',
      gradientHeader: 'from-purple-900 via-indigo-900 to-purple-800'
    },
    iconoKey: 'users',
    sugerenciaActividad: 'Jornada de liderazgo Leo, talleres vocacionales o voluntariado con escuelas y jóvenes de Quetzaltenango.'
  },
  // 2. Septiembre 2026 (Mes completo)
  {
    id: 'gst-2026-09-mes',
    causaGlobal: 'Cáncer Infantil',
    fechaTexto: 'Septiembre 2026',
    conmemoracion: 'Mes de concientización sobre el Cáncer Infantil',
    tipo: 'mes',
    fechaInicio: '2026-09-01',
    fechaFin: '2026-09-30',
    mesIndex: 8,
    ano: 2026,
    color: {
      bgLight: 'bg-amber-50',
      bgBadge: 'bg-amber-100',
      textBadge: 'text-amber-950',
      border: 'border-amber-300',
      accentHex: '#d97706',
      gradientHeader: 'from-amber-900 via-yellow-900 to-amber-800'
    },
    iconoKey: 'ribbon-gold',
    sugerenciaActividad: 'Campaña de recaudación para tratamientos oncológicos pediátricos, entrega de kits de apoyo y lazo dorado.'
  },
  // 3. 21 de septiembre 2026
  {
    id: 'gst-2026-09-21',
    causaGlobal: 'Ayuda Humanitaria / Paz',
    fechaTexto: '21 de septiembre 2026',
    conmemoracion: 'Día Internacional de la Paz',
    tipo: 'dia',
    fechaInicio: '2026-09-21',
    mesIndex: 8,
    ano: 2026,
    color: {
      bgLight: 'bg-sky-50',
      bgBadge: 'bg-sky-100',
      textBadge: 'text-sky-950',
      border: 'border-sky-300',
      accentHex: '#0284c7',
      gradientHeader: 'from-sky-950 via-blue-900 to-sky-800'
    },
    iconoKey: 'peace',
    sugerenciaActividad: 'Concurso del Cartel de la Paz en centros educativos, actos solemnes de hermandad y ayuda humanitaria.'
  },
  // 4. 4 – 12 de octubre 2026 (Semana de Salud Mental)
  {
    id: 'gst-2026-10-04-12',
    causaGlobal: 'Salud Mental y Bienestar',
    fechaTexto: '4 – 12 de octubre 2026',
    conmemoracion: 'Semana Mundial de Servicio',
    tipo: 'semana',
    fechaInicio: '2026-10-04',
    fechaFin: '2026-10-12',
    mesIndex: 9,
    ano: 2026,
    color: {
      bgLight: 'bg-emerald-50',
      bgBadge: 'bg-emerald-100',
      textBadge: 'text-emerald-950',
      border: 'border-emerald-300',
      accentHex: '#059669',
      gradientHeader: 'from-emerald-950 via-teal-900 to-emerald-800'
    },
    iconoKey: 'lotus',
    sugerenciaActividad: 'Charlas de apoyo emocional, jornadas de desestrés y bienestar integral para adultos mayores y familias.'
  },
  // 5. 8 de octubre 2026
  {
    id: 'gst-2026-10-08',
    causaGlobal: 'Visión',
    fechaTexto: '8 de octubre 2026',
    conmemoracion: 'Día Mundial de la Visión',
    tipo: 'dia',
    fechaInicio: '2026-10-08',
    mesIndex: 9,
    ano: 2026,
    color: {
      bgLight: 'bg-fuchsia-50',
      bgBadge: 'bg-fuchsia-100',
      textBadge: 'text-fuchsia-950',
      border: 'border-fuchsia-300',
      accentHex: '#9333ea',
      gradientHeader: 'from-purple-950 via-fuchsia-950 to-purple-900'
    },
    iconoKey: 'eye',
    sugerenciaActividad: 'Jornada oftalmológica especial, exámenes de agudeza visual gratuitos y donación de lentes graduados.'
  },
  // 6. 8 – 18 de octubre 2026 (Semana Global de Servicio Visión)
  {
    id: 'gst-2026-10-08-18',
    causaGlobal: 'Visión',
    fechaTexto: '8 – 18 de octubre 2026',
    conmemoracion: 'Semana Global de Servicio',
    tipo: 'semana',
    fechaInicio: '2026-10-08',
    fechaFin: '2026-10-18',
    mesIndex: 9,
    ano: 2026,
    color: {
      bgLight: 'bg-purple-50',
      bgBadge: 'bg-purple-100',
      textBadge: 'text-purple-950',
      border: 'border-purple-300',
      accentHex: '#7e22ce',
      gradientHeader: 'from-slate-900 via-purple-950 to-blue-950'
    },
    iconoKey: 'eye',
    sugerenciaActividad: 'Semana intensiva de tamizajes visuales en escuelas rurales y cirugías de cataratas con aliados.'
  },
  // 7. 10 de octubre 2026
  {
    id: 'gst-2026-10-10',
    causaGlobal: 'Salud Mental y Bienestar',
    fechaTexto: '10 de octubre 2026',
    conmemoracion: 'Día Mundial de la Salud Mental',
    tipo: 'dia',
    fechaInicio: '2026-10-10',
    mesIndex: 9,
    ano: 2026,
    color: {
      bgLight: 'bg-teal-50',
      bgBadge: 'bg-teal-100',
      textBadge: 'text-teal-950',
      border: 'border-teal-300',
      accentHex: '#0d9488',
      gradientHeader: 'from-teal-950 via-emerald-950 to-teal-900'
    },
    iconoKey: 'lotus',
    sugerenciaActividad: 'Foro o webinar abierto a la comunidad sobre salud mental, manejo de ansiedad y prevención del suicidio.'
  },
  // 8. 15 de octubre 2026
  {
    id: 'gst-2026-10-15',
    causaGlobal: 'Visión',
    fechaTexto: '15 de octubre 2026',
    conmemoracion: 'Día del Bastón Blanco',
    tipo: 'dia',
    fechaInicio: '2026-10-15',
    mesIndex: 9,
    ano: 2026,
    color: {
      bgLight: 'bg-violet-50',
      bgBadge: 'bg-violet-100',
      textBadge: 'text-violet-950',
      border: 'border-violet-300',
      accentHex: '#6d28d9',
      gradientHeader: 'from-indigo-950 via-violet-950 to-purple-950'
    },
    iconoKey: 'eye',
    sugerenciaActividad: 'Caminata de concientización, donación de bastones blancos y capacitación sobre accesibilidad para personas con discapacidad visual.'
  },
  // 9. 14 de noviembre 2026
  {
    id: 'gst-2026-11-14',
    causaGlobal: 'Diabetes',
    fechaTexto: '14 de noviembre 2026',
    conmemoracion: 'Día Mundial de la Diabetes',
    tipo: 'dia',
    fechaInicio: '2026-11-14',
    mesIndex: 10,
    ano: 2026,
    color: {
      bgLight: 'bg-blue-50',
      bgBadge: 'bg-blue-100',
      textBadge: 'text-blue-950',
      border: 'border-blue-300',
      accentHex: '#2563eb',
      gradientHeader: 'from-blue-950 via-indigo-950 to-blue-900'
    },
    iconoKey: 'diabetes',
    sugerenciaActividad: 'Pruebas gratuitas de glucosa capilar, charlas sobre nutrición preventiva y caminata azul con la comunidad.'
  },
  // 10. Enero 2027 (Mes de enfoque Hambre)
  {
    id: 'gst-2027-01-mes',
    causaGlobal: 'Hambre',
    fechaTexto: 'Enero 2027',
    conmemoracion: 'Período para intensificar actividades',
    tipo: 'mes',
    fechaInicio: '2027-01-01',
    fechaFin: '2027-01-31',
    mesIndex: 0,
    ano: 2027,
    color: {
      bgLight: 'bg-orange-50',
      bgBadge: 'bg-orange-100',
      textBadge: 'text-orange-950',
      border: 'border-orange-300',
      accentHex: '#ea580c',
      gradientHeader: 'from-orange-950 via-amber-950 to-orange-900'
    },
    iconoKey: 'hunger',
    sugerenciaActividad: 'Banco de alimentos, entrega de canastas básicas a familias vulnerables y abastecimiento de la Nevera Comunitaria.'
  },
  // 11. 4 de febrero 2027
  {
    id: 'gst-2027-02-04',
    causaGlobal: 'Cáncer',
    fechaTexto: '4 de febrero 2027',
    conmemoracion: 'Día Mundial contra el Cáncer',
    tipo: 'dia',
    fechaInicio: '2027-02-04',
    mesIndex: 1,
    ano: 2027,
    color: {
      bgLight: 'bg-purple-50',
      bgBadge: 'bg-purple-100',
      textBadge: 'text-purple-950',
      border: 'border-purple-300',
      accentHex: '#9333ea',
      gradientHeader: 'from-purple-950 via-slate-900 to-indigo-950'
    },
    iconoKey: 'ribbon-purple',
    sugerenciaActividad: 'Campaña informativa de detección temprana de cáncer de mama, cuello uterino y próstata con médicos aliados.'
  },
  // 12. 13 – 21 de febrero 2027 (Semana de Juventud)
  {
    id: 'gst-2027-02-13-21',
    causaGlobal: 'Juventud',
    fechaTexto: '13 – 21 de febrero 2027',
    conmemoracion: 'Semana Global de Servicio',
    tipo: 'semana',
    fechaInicio: '2027-02-13',
    fechaFin: '2027-02-21',
    mesIndex: 1,
    ano: 2027,
    color: {
      bgLight: 'bg-indigo-50',
      bgBadge: 'bg-indigo-100',
      textBadge: 'text-indigo-950',
      border: 'border-indigo-300',
      accentHex: '#4f46e5',
      gradientHeader: 'from-indigo-950 via-blue-950 to-indigo-900'
    },
    iconoKey: 'users',
    sugerenciaActividad: 'Semana de servicio juvenil con Club Leo: voluntariados, pintura de escuelas y torneos deportivos solidarios.'
  },
  // 13. 15 de febrero 2027
  {
    id: 'gst-2027-02-15',
    causaGlobal: 'Cáncer Infantil',
    fechaTexto: '15 de febrero 2027',
    conmemoracion: 'Día Internacional del Cáncer Infantil',
    tipo: 'dia',
    fechaInicio: '2027-02-15',
    mesIndex: 1,
    ano: 2027,
    color: {
      bgLight: 'bg-amber-50',
      bgBadge: 'bg-amber-100',
      textBadge: 'text-amber-950',
      border: 'border-amber-300',
      accentHex: '#d97706',
      gradientHeader: 'from-yellow-950 via-amber-950 to-amber-900'
    },
    iconoKey: 'ribbon-gold',
    sugerenciaActividad: 'Visita y entrega de juguetes didácticos y suplementos nutricionales a pabellones oncológicos infantiles.'
  },
  // 14. Marzo 2027 (Mes de enfoque Ayuda Humanitaria)
  {
    id: 'gst-2027-03-mes',
    causaGlobal: 'Ayuda Humanitaria',
    fechaTexto: 'Marzo 2027',
    conmemoracion: 'Período de enfoque en servicio humanitario',
    tipo: 'mes',
    fechaInicio: '2027-03-01',
    fechaFin: '2027-03-31',
    mesIndex: 2,
    ano: 2027,
    color: {
      bgLight: 'bg-blue-50',
      bgBadge: 'bg-blue-100',
      textBadge: 'text-blue-950',
      border: 'border-blue-300',
      accentHex: '#1d4ed8',
      gradientHeader: 'from-blue-950 via-slate-900 to-indigo-950'
    },
    iconoKey: 'handshake',
    sugerenciaActividad: 'Atención a desastres naturales, albergues temporales y donación de frazadas y ropa abrigada en el altiplano.'
  },
  // 15. 22 de marzo 2027
  {
    id: 'gst-2027-03-22',
    causaGlobal: 'Medio Ambiente',
    fechaTexto: '22 de marzo 2027',
    conmemoracion: 'Día Mundial del Agua',
    tipo: 'dia',
    fechaInicio: '2027-03-22',
    mesIndex: 2,
    ano: 2027,
    color: {
      bgLight: 'bg-cyan-50',
      bgBadge: 'bg-cyan-100',
      textBadge: 'text-cyan-950',
      border: 'border-cyan-300',
      accentHex: '#0891b2',
      gradientHeader: 'from-cyan-950 via-blue-950 to-teal-950'
    },
    iconoKey: 'environment',
    sugerenciaActividad: 'Instalación de filtros purificadores de agua en comunidades de escasos recursos y protección de cuencas hídricas.'
  },
  // 16. 22 de abril 2027
  {
    id: 'gst-2027-04-22',
    causaGlobal: 'Medio Ambiente',
    fechaTexto: '22 de abril 2027',
    conmemoracion: 'Día de la Tierra',
    tipo: 'dia',
    fechaInicio: '2027-04-22',
    mesIndex: 3,
    ano: 2027,
    color: {
      bgLight: 'bg-emerald-50',
      bgBadge: 'bg-emerald-100',
      textBadge: 'text-emerald-950',
      border: 'border-emerald-300',
      accentHex: '#16a34a',
      gradientHeader: 'from-emerald-950 via-green-950 to-teal-950'
    },
    iconoKey: 'environment',
    sugerenciaActividad: 'Jornada de reforestación en cerros y parques de Quetzaltenango, siembra de árboles nativos y reciclaje.'
  },
  // 17. 28 de mayo 2027
  {
    id: 'gst-2027-05-28',
    causaGlobal: 'Hambre',
    fechaTexto: '28 de mayo 2027',
    conmemoracion: 'Fecha de enfoque',
    tipo: 'dia',
    fechaInicio: '2027-05-28',
    mesIndex: 4,
    ano: 2027,
    color: {
      bgLight: 'bg-orange-50',
      bgBadge: 'bg-orange-100',
      textBadge: 'text-orange-950',
      border: 'border-orange-300',
      accentHex: '#ea580c',
      gradientHeader: 'from-orange-950 via-red-950 to-amber-950'
    },
    iconoKey: 'hunger',
    sugerenciaActividad: 'Almuerzo solidario comunitario para adultos mayores en situación de calle y abastecimiento de comedores benéficos.'
  },
  // 18. 29 mayo – 6 junio 2027 (Semana Global Medio Ambiente)
  {
    id: 'gst-2027-05-29-06-06',
    causaGlobal: 'Medio Ambiente',
    fechaTexto: '29 mayo – 6 junio 2027',
    conmemoracion: 'Semana Global de Servicio',
    tipo: 'semana',
    fechaInicio: '2027-05-29',
    fechaFin: '2027-06-06',
    mesIndex: 4,
    ano: 2027,
    color: {
      bgLight: 'bg-green-50',
      bgBadge: 'bg-green-100',
      textBadge: 'text-green-950',
      border: 'border-green-300',
      accentHex: '#15803d',
      gradientHeader: 'from-green-950 via-emerald-950 to-teal-950'
    },
    iconoKey: 'environment',
    sugerenciaActividad: 'Limpieza de riberas y cuencas de ríos locales, recolección masiva de plásticos y talleres de huertos familiares.'
  },
  // 19. 5 de junio 2027
  {
    id: 'gst-2027-06-05',
    causaGlobal: 'Medio Ambiente',
    fechaTexto: '5 de junio 2027',
    conmemoracion: 'Día Mundial del Medio Ambiente',
    tipo: 'dia',
    fechaInicio: '2027-06-05',
    mesIndex: 5,
    ano: 2027,
    color: {
      bgLight: 'bg-emerald-50',
      bgBadge: 'bg-emerald-100',
      textBadge: 'text-emerald-950',
      border: 'border-emerald-300',
      accentHex: '#16a34a',
      gradientHeader: 'from-teal-950 via-green-950 to-emerald-900'
    },
    iconoKey: 'environment',
    sugerenciaActividad: 'Feria ecológica con escuelas y organizaciones civiles, premiación de iniciativas de reciclaje comunitario.'
  },
  // 20. Junio 2027
  {
    id: 'gst-2027-06-mes',
    causaGlobal: 'Cierre GST',
    fechaTexto: 'Junio 2027',
    conmemoracion: 'Consolidación de resultados y proyección del próximo período',
    tipo: 'mes',
    fechaInicio: '2027-06-01',
    fechaFin: '2027-06-30',
    mesIndex: 5,
    ano: 2027,
    color: {
      bgLight: 'bg-blue-50',
      bgBadge: 'bg-blue-100',
      textBadge: 'text-blue-950',
      border: 'border-blue-300',
      accentHex: '#1e3a8a',
      gradientHeader: 'from-blue-950 via-indigo-950 to-slate-900'
    },
    iconoKey: 'chart',
    sugerenciaActividad: 'Asamblea anual de reporte de impacto Leonístico: metas de beneficiarios alcanzadas, reconocimientos y metas para 2027-2028.'
  }
];

// Helper: Obtener causas relevantes para un mes específico
export const getCausasParaMes = (year: number, monthIndex: number): CausaGlobalGST[] => {
  return CAUSAS_GLOBALES_GST_2026_2027.filter(item => {
    // Si coincide el año y mes exacto
    if (item.ano === year && item.mesIndex === monthIndex) return true;
    
    // Si es un rango que abarca este mes (ej: 29 mayo - 6 junio)
    if (item.fechaFin) {
      const inicio = new Date(item.fechaInicio + 'T00:00:00');
      const fin = new Date(item.fechaFin + 'T23:59:59');
      const fechaComparar = new Date(year, monthIndex, 15);
      return fechaComparar >= inicio && fechaComparar <= fin;
    }
    return false;
  });
};

// Helper: Obtener causa para un día exacto
export const getCausaParaDia = (year: number, monthIndex: number, day: number): CausaGlobalGST | undefined => {
  const currentStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  // Buscar primero evento de día exacto
  const exactDay = CAUSAS_GLOBALES_GST_2026_2027.find(item => item.tipo === 'dia' && item.fechaInicio === currentStr);
  if (exactDay) return exactDay;

  // Si no hay evento exacto, buscar si cae dentro de una semana especial
  const inWeek = CAUSAS_GLOBALES_GST_2026_2027.find(item => {
    if (item.tipo === 'semana' && item.fechaFin) {
      return currentStr >= item.fechaInicio && currentStr <= item.fechaFin;
    }
    return false;
  });
  if (inWeek) return inWeek;

  return undefined;
};
