export interface ItemPresupuestoOficial {
  codigo: string;
  tipo: 'Ingreso' | 'Egreso';
  categoria: string;
  descripcion: string;
  unidad: 'SOCIO' | 'MES' | 'UNIDAD' | 'ACTIVIDAD' | 'CONVIVENCIA' | 'SESION';
  cantidad: number;
  montoUnitario: number;
  presupuestadoTotal: number;
  comisionSugerida: string;
}

export const PRESUPUESTO_OFICIAL_LEONES: ItemPresupuestoOficial[] = [
  // 1.01 INGRESOS ADMINISTRATIVOS
  {
    codigo: "1.01",
    tipo: "Ingreso",
    categoria: "Ingresos Administrativos",
    descripcion: "Cuotas Ordinarias 54 Socios x 9 Meses",
    unidad: "SOCIO",
    cantidad: 54,
    montoUnitario: 1125.00,
    presupuestadoTotal: 60750.00,
    comisionSugerida: "Administración y Finanzas"
  },
  {
    codigo: "1.01",
    tipo: "Ingreso",
    categoria: "Ingresos Administrativos",
    descripcion: "Parqueo Club de Leones",
    unidad: "MES",
    cantidad: 9,
    montoUnitario: 15000.00,
    presupuestadoTotal: 135000.00,
    comisionSugerida: "Comisión de Parqueo"
  },
  {
    codigo: "1.01",
    tipo: "Ingreso",
    categoria: "Ingresos Administrativos",
    descripcion: "Local Club de Leones",
    unidad: "MES",
    cantidad: 6,
    montoUnitario: 3000.00,
    presupuestadoTotal: 18000.00,
    comisionSugerida: "Comisión de Arrendamientos"
  },
  {
    codigo: "1.01",
    tipo: "Ingreso",
    categoria: "Ingresos Administrativos",
    descripcion: "Apartamento Club de Leones",
    unidad: "MES",
    cantidad: 8,
    montoUnitario: 300.00,
    presupuestadoTotal: 2400.00,
    comisionSugerida: "Comisión de Arrendamientos"
  },

  // 2.01 INGRESOS POR ACTIVIDADES
  {
    codigo: "2.01",
    tipo: "Ingreso",
    categoria: "Ingresos por Actividades",
    descripcion: "Rifa Anual / Actividad de Recaudacion",
    unidad: "UNIDAD",
    cantidad: 1,
    montoUnitario: 10000.00,
    presupuestadoTotal: 10000.00,
    comisionSugerida: "Comisión de Festejos y Recaudación"
  },
  {
    codigo: "2.01",
    tipo: "Ingreso",
    categoria: "Ingresos por Actividades",
    descripcion: "Bingo Anual / Actividad de Recaudacion",
    unidad: "UNIDAD",
    cantidad: 1,
    montoUnitario: 10000.00,
    presupuestadoTotal: 10000.00,
    comisionSugerida: "Comisión de Festejos y Recaudación"
  },
  {
    codigo: "2.01",
    tipo: "Ingreso",
    categoria: "Ingresos por Actividades",
    descripcion: "Donaciones de Patrocinadores / Empresas",
    unidad: "UNIDAD",
    cantidad: 10,
    montoUnitario: 2000.00,
    presupuestadoTotal: 20000.00,
    comisionSugerida: "Comisión de Relaciones Públicas"
  },
  {
    codigo: "2.01",
    tipo: "Ingreso",
    categoria: "Ingresos por Actividades",
    descripcion: "Evento / Cena Benefica",
    unidad: "UNIDAD",
    cantidad: 1,
    montoUnitario: 10000.00,
    presupuestadoTotal: 10000.00,
    comisionSugerida: "Comisión de Festejos y Recaudación"
  },

  // 4.01 OBRAS SOCIALES / ACTIVIDADES DE SERVICIO
  {
    codigo: "4.01",
    tipo: "Egreso",
    categoria: "Obras Sociales / Actividades de Servicio",
    descripcion: "Salud Mental y Bienestar (4-12 Oct - Semana Mundial de Servicio)",
    unidad: "ACTIVIDAD",
    cantidad: 1,
    montoUnitario: 8000.00,
    presupuestadoTotal: 8000.00,
    comisionSugerida: "Comisión de Obras Sociales y Salud"
  },
  {
    codigo: "4.01",
    tipo: "Egreso",
    categoria: "Obras Sociales / Actividades de Servicio",
    descripcion: "Diabetes (14 Nov - Dia Mundial de la Diabetes)",
    unidad: "ACTIVIDAD",
    cantidad: 1,
    montoUnitario: 8000.00,
    presupuestadoTotal: 8000.00,
    comisionSugerida: "Comisión de Obras Sociales y Salud"
  },
  {
    codigo: "4.01",
    tipo: "Egreso",
    categoria: "Obras Sociales / Actividades de Servicio",
    descripcion: "Hambre (Enero - Periodo Intensivo)",
    unidad: "ACTIVIDAD",
    cantidad: 1,
    montoUnitario: 8000.00,
    presupuestadoTotal: 8000.00,
    comisionSugerida: "Comisión de Obras Sociales y Salud"
  },
  {
    codigo: "4.01",
    tipo: "Egreso",
    categoria: "Obras Sociales / Actividades de Servicio",
    descripcion: "Ayuda Humanitaria (Marzo - Enfoque Servicio Humanitario)",
    unidad: "ACTIVIDAD",
    cantidad: 1,
    montoUnitario: 8000.00,
    presupuestadoTotal: 8000.00,
    comisionSugerida: "Comisión de Obras Sociales y Salud"
  },
  {
    codigo: "4.01",
    tipo: "Egreso",
    categoria: "Obras Sociales / Actividades de Servicio",
    descripcion: "Medio Ambiente (5 Jun - Dia Mundial del Medio Ambiente)",
    unidad: "ACTIVIDAD",
    cantidad: 1,
    montoUnitario: 8000.00,
    presupuestadoTotal: 8000.00,
    comisionSugerida: "Comisión de Medio Ambiente"
  },

  // 5.01 CONVIVENCIAS Y EVENTOS
  {
    codigo: "5.01",
    tipo: "Egreso",
    categoria: "Convivencias y Eventos",
    descripcion: "1 de Noviembre - Homenaje a Leones Fallecidos",
    unidad: "CONVIVENCIA",
    cantidad: 1,
    montoUnitario: 1500.00,
    presupuestadoTotal: 1500.00,
    comisionSugerida: "Comisión de Protocolo y Convivencia"
  },
  {
    codigo: "5.01",
    tipo: "Egreso",
    categoria: "Convivencias y Eventos",
    descripcion: "Dia del Diablo (7 de Diciembre)",
    unidad: "CONVIVENCIA",
    cantidad: 1,
    montoUnitario: 1500.00,
    presupuestadoTotal: 1500.00,
    comisionSugerida: "Comisión de Entretenimiento y Convivencia"
  },
  {
    codigo: "5.01",
    tipo: "Egreso",
    categoria: "Convivencias y Eventos",
    descripcion: "Convivio Navideno",
    unidad: "CONVIVENCIA",
    cantidad: 1,
    montoUnitario: 10000.00,
    presupuestadoTotal: 10000.00,
    comisionSugerida: "Comisión de Entretenimiento y Convivencia"
  },
  {
    codigo: "5.01",
    tipo: "Egreso",
    categoria: "Convivencias y Eventos",
    descripcion: "Dia del Carino",
    unidad: "CONVIVENCIA",
    cantidad: 1,
    montoUnitario: 1500.00,
    presupuestadoTotal: 1500.00,
    comisionSugerida: "Comisión de Entretenimiento y Convivencia"
  },
  {
    codigo: "5.01",
    tipo: "Egreso",
    categoria: "Convivencias y Eventos",
    descripcion: "Viernes de Dolores (19 de Marzo)",
    unidad: "CONVIVENCIA",
    cantidad: 1,
    montoUnitario: 1500.00,
    presupuestadoTotal: 1500.00,
    comisionSugerida: "Comisión de Entretenimiento y Convivencia"
  },
  {
    codigo: "5.01",
    tipo: "Egreso",
    categoria: "Convivencias y Eventos",
    descripcion: "Dia de la Madre",
    unidad: "CONVIVENCIA",
    cantidad: 1,
    montoUnitario: 3000.00,
    presupuestadoTotal: 3000.00,
    comisionSugerida: "Comisión de Damas Leonas y Festejos"
  },
  {
    codigo: "5.01",
    tipo: "Egreso",
    categoria: "Convivencias y Eventos",
    descripcion: "Dia del Padre",
    unidad: "CONVIVENCIA",
    cantidad: 1,
    montoUnitario: 1500.00,
    presupuestadoTotal: 1500.00,
    comisionSugerida: "Comisión de Entretenimiento y Convivencia"
  },

  // 3.01 EGRESOS ADMINISTRATIVOS
  {
    codigo: "3.01",
    tipo: "Egreso",
    categoria: "Egresos Administrativos",
    descripcion: "Cuotas Internacionales por Ano",
    unidad: "SOCIO",
    cantidad: 54,
    montoUnitario: 396.78,
    presupuestadoTotal: 21426.12,
    comisionSugerida: "Administración y Finanzas"
  },
  {
    codigo: "3.01",
    tipo: "Egreso",
    categoria: "Egresos Administrativos",
    descripcion: "Cuotas de Distrito por Ano",
    unidad: "SOCIO",
    cantidad: 54,
    montoUnitario: 100.00,
    presupuestadoTotal: 5400.00,
    comisionSugerida: "Administración y Finanzas"
  },
  {
    codigo: "3.01",
    tipo: "Egreso",
    categoria: "Egresos Administrativos",
    descripcion: "Pago Operadora Parqueo (Norvil Gutierrez)",
    unidad: "MES",
    cantidad: 9,
    montoUnitario: 4248.00,
    presupuestadoTotal: 38232.00,
    comisionSugerida: "Comisión de Parqueo"
  },
  {
    codigo: "3.01",
    tipo: "Egreso",
    categoria: "Egresos Administrativos",
    descripcion: "Comite Consultivo de Jefe de Zona",
    unidad: "UNIDAD",
    cantidad: 1,
    montoUnitario: 1000.00,
    presupuestadoTotal: 1000.00,
    comisionSugerida: "Junta Directiva y Presidencia"
  },
  {
    codigo: "3.01",
    tipo: "Egreso",
    categoria: "Egresos Administrativos",
    descripcion: "Actividad Conjunta con Clubes de Zona",
    unidad: "UNIDAD",
    cantidad: 1,
    montoUnitario: 5000.00,
    presupuestadoTotal: 5000.00,
    comisionSugerida: "Junta Directiva y Presidencia"
  },
  {
    codigo: "3.01",
    tipo: "Egreso",
    categoria: "Egresos Administrativos",
    descripcion: "Capacitaciones",
    unidad: "UNIDAD",
    cantidad: 3,
    montoUnitario: 1000.00,
    presupuestadoTotal: 3000.00,
    comisionSugerida: "Comisión de Liderazgo y Aumento de Socios"
  },
  {
    codigo: "3.01",
    tipo: "Egreso",
    categoria: "Egresos Administrativos",
    descripcion: "Pines y Reconocimientos",
    unidad: "UNIDAD",
    cantidad: 50,
    montoUnitario: 50.00,
    presupuestadoTotal: 2500.00,
    comisionSugerida: "Comisión de Protocolo y Agenda Leonística"
  },
  {
    codigo: "3.01",
    tipo: "Egreso",
    categoria: "Egresos Administrativos",
    descripcion: "Suministros de Cafeteria",
    unidad: "SESION",
    cantidad: 36,
    montoUnitario: 50.00,
    presupuestadoTotal: 1800.00,
    comisionSugerida: "Comisión de Logística, Alimentos y Bebidas"
  },
  {
    codigo: "3.01",
    tipo: "Egreso",
    categoria: "Egresos Administrativos",
    descripcion: "Suministros de Limpieza",
    unidad: "MES",
    cantidad: 9,
    montoUnitario: 400.00,
    presupuestadoTotal: 3600.00,
    comisionSugerida: "Administración y Mantenimiento de Sede"
  },
  {
    codigo: "3.01",
    tipo: "Egreso",
    categoria: "Egresos Administrativos",
    descripcion: "Mantenimiento de Edificios + Luz y Agua",
    unidad: "MES",
    cantidad: 9,
    montoUnitario: 2500.00,
    presupuestadoTotal: 22500.00,
    comisionSugerida: "Administración y Mantenimiento de Sede"
  }
];

export const TOTALES_PRESUPUESTO_OFICIAL = {
  ingresosAdministrativos: 216150.00,
  ingresosActividades: 50000.00,
  totalIngresos: 266150.00,

  obrasSociales: 40000.00,
  convivencias: 20500.00,
  egresosAdministrativos: 104458.12,
  totalEgresos: 164958.12,

  superavitNeto: 101191.88
};
