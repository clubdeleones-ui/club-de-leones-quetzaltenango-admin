export type CuentaBancariaId = 'admin_3827008588' | 'cueva_3827008592' | 'bac_908326358';

export interface CuentaBancariaClub {
  id: CuentaBancariaId;
  numeroCuenta: '3827008588' | '3827008592' | '908326358';
  alias: string;
  nombreOficial: string;
  banco: string;
  tipoCuenta: string;
  proposito: string;
  conceptosPermitidos: string[];
  saldoInicialPeriodo: number;
  saldoActual: number;
  fechaCorte: string;
  colorTema: 'blue' | 'emerald' | 'rose';
}

export interface MovimientoBancarioReal {
  id: string;
  cuentaId: CuentaBancariaId;
  numeroCuenta: '3827008588' | '3827008592' | '908326358';
  orden: number;
  fecha: string; // Formato ISO YYYY-MM-DD para filtros/orden
  fechaTexto: string; // Formato original del libro banco
  descripcion: string;
  categoriaContable: string;
  debito: number; // (-) Egreso
  credito: number; // (+) Ingreso
  saldoContable: number;
  destacado?: boolean;
  notaAuditor?: string;
}

export const CUENTAS_BANCARIAS_BANRURAL: Record<CuentaBancariaId, CuentaBancariaClub> = {
  admin_3827008588: {
    id: 'admin_3827008588',
    numeroCuenta: '3827008588',
    alias: 'Cuenta Administrativa',
    nombreOficial: 'Monetaria Administrativa — Cuotas y Socios',
    banco: 'Banrural S.A.',
    tipoCuenta: 'Monetaria en Quetzales (Q)',
    proposito: 'Administrativa: Pago de cuotas ordinarias de socios e ingresos de nuevos socios.',
    conceptosPermitidos: [
      'Pago de cuotas ordinarias de socios',
      'Ingresos de nuevos socios',
      'Cuotas internacionales y distritales',
      'Actividades institucionales de socios'
    ],
    saldoInicialPeriodo: 21431.09,
    saldoActual: 27394.09,
    fechaCorte: '18/11/2026',
    colorTema: 'blue'
  },
  cueva_3827008592: {
    id: 'cueva_3827008592',
    numeroCuenta: '3827008592',
    alias: 'Cuenta Cueva / Operativa',
    nombreOficial: 'Monetaria No Administrativa — Parqueo, Alquileres y Obras ("Cueva")',
    banco: 'Banrural S.A.',
    tipoCuenta: 'Monetaria en Quetzales (Q)',
    proposito: 'Pagos no administrativos, entradas de parqueo, alquileres de salón/locales, mantenimiento de sede y obras sociales.',
    conceptosPermitidos: [
      'Entradas de Parqueo Club de Leones',
      'Alquileres de salón, local y apartamento',
      'Planilla y operación de parqueo / contabilidad',
      'Trabajos de mantenimiento en Cueva y caja chica',
      'Donaciones y obras sociales comunitarias'
    ],
    saldoInicialPeriodo: 20888.95,
    saldoActual: 21405.17,
    fechaCorte: '19/11/2026',
    colorTema: 'emerald'
  },
  bac_908326358: {
    id: 'bac_908326358',
    numeroCuenta: '908326358',
    alias: 'Cuenta BAC Convención',
    nombreOficial: 'Monetaria BAC Credomatic — Convención Nacional',
    banco: 'BAC Credomatic',
    tipoCuenta: 'Monetaria en Quetzales (Q)',
    proposito: 'Cuenta oficial destinada exclusivamente a la Convención Nacional (inscripciones, depósitos, transferencias y pasarela BAC) a nombre de Club de Leones Quetzaltenango.',
    conceptosPermitidos: [
      'Inscripciones a la LXXV Convención Nacional',
      'Liquidaciones de pasarela de pago con tarjeta BAC / CyberSource',
      'Patrocinios y aportes específicos de Convención',
      'Gastos operativos y logística de Convención'
    ],
    saldoInicialPeriodo: 0.00,
    saldoActual: 400.00,
    fechaCorte: '16/10/2026',
    colorTema: 'rose'
  }
};

export const MOVIMIENTOS_BANCARIOS_REALES: MovimientoBancarioReal[] = [
  // =========================================================================
  // CUENTA 3827008588 — ADMINISTRATIVA (Banrural S.A.)
  // =========================================================================
  {
    id: 'adm-2026-01',
    cuentaId: 'admin_3827008588',
    numeroCuenta: '3827008588',
    orden: 1,
    fecha: '2026-10-07',
    fechaTexto: '07/10/2026',
    descripcion: 'N/CREDITO TRANSFERENCIA ACH',
    categoriaContable: 'Cuotas Ordinarias de Socios',
    debito: 0.00,
    credito: 125.00,
    saldoContable: 21556.09
  },
  {
    id: 'adm-2026-02',
    cuentaId: 'admin_3827008588',
    numeroCuenta: '3827008588',
    orden: 2,
    fecha: '2026-10-08',
    fechaTexto: '08/10/2026',
    descripcion: 'CUEVA A ADMIN ARTURO WOK 2026',
    categoriaContable: 'Traslado de Cuotas entre Cuentas',
    debito: 0.00,
    credito: 1500.00,
    saldoContable: 23056.09,
    notaAuditor: 'Contrapartida del traslado desde Cuenta Cueva 3827008592 por depósito de cuotas de Arturo Wok 2026'
  },
  {
    id: 'adm-2026-03',
    cuentaId: 'admin_3827008588',
    numeroCuenta: '3827008588',
    orden: 3,
    fecha: '2026-10-09',
    fechaTexto: '09/10/2026',
    descripcion: 'N/CREDITO TRANSFERENCIA ELECTRONICA TIF',
    categoriaContable: 'Cuotas / Ingresos de Socios',
    debito: 0.00,
    credito: 4063.00,
    saldoContable: 27119.09
  },
  {
    id: 'adm-2026-04',
    cuentaId: 'admin_3827008588',
    numeroCuenta: '3827008588',
    orden: 4,
    fecha: '2026-10-12',
    fechaTexto: '12/10/2026',
    descripcion: 'cuota oct nov dic 2026',
    categoriaContable: 'Cuotas Ordinarias de Socios',
    debito: 0.00,
    credito: 375.00,
    saldoContable: 27494.09
  },
  {
    id: 'adm-2026-05',
    cuentaId: 'admin_3827008588',
    numeroCuenta: '3827008588',
    orden: 5,
    fecha: '2026-10-15',
    fechaTexto: '15/10/2026',
    descripcion: 'Pago Julio Agosto y septiembre',
    categoriaContable: 'Cuotas Ordinarias de Socios',
    debito: 0.00,
    credito: 375.00,
    saldoContable: 27869.09
  },
  {
    id: 'adm-2026-06',
    cuentaId: 'admin_3827008588',
    numeroCuenta: '3827008588',
    orden: 6,
    fecha: '2026-10-16',
    fechaTexto: '16/10/2026',
    descripcion: 'N/CREDITO TRANSFERENCIA ELECTRONICA TIF',
    categoriaContable: 'Cuotas Ordinarias de Socios',
    debito: 0.00,
    credito: 750.00,
    saldoContable: 28619.09
  },
  {
    id: 'adm-2026-07',
    cuentaId: 'admin_3827008588',
    numeroCuenta: '3827008588',
    orden: 7,
    fecha: '2026-10-16',
    fechaTexto: '16/10/2026',
    descripcion: 'N/CREDITO TRANSFERENCIA ELECTRONICA TIF',
    categoriaContable: 'Cuotas Ordinarias de Socios',
    debito: 0.00,
    credito: 500.00,
    saldoContable: 29119.09
  },
  {
    id: 'adm-2026-08',
    cuentaId: 'admin_3827008588',
    numeroCuenta: '3827008588',
    orden: 8,
    fecha: '2026-10-26',
    fechaTexto: '26/10/2026',
    descripcion: 'N/CREDITO TRANSFERENCIA ELECTRONICA TIF',
    categoriaContable: 'Cuotas Ordinarias de Socios',
    debito: 0.00,
    credito: 125.00,
    saldoContable: 29244.09
  },
  {
    id: 'adm-2026-09',
    cuentaId: 'admin_3827008588',
    numeroCuenta: '3827008588',
    orden: 9,
    fecha: '2026-10-28',
    fechaTexto: '28/10/2026',
    descripcion: 'DEPOSITO COMPLETO',
    categoriaContable: 'Cuotas Ordinarias de Socios',
    debito: 0.00,
    credito: 375.00,
    saldoContable: 29619.09,
    destacado: true
  },
  {
    id: 'adm-2026-10',
    cuentaId: 'admin_3827008588',
    numeroCuenta: '3827008588',
    orden: 10,
    fecha: '2026-10-31',
    fechaTexto: '31/10/2026',
    descripcion: 'Cuota de noviembre de 2026',
    categoriaContable: 'Cuotas Ordinarias de Socios',
    debito: 0.00,
    credito: 125.00,
    saldoContable: 29744.09
  },
  {
    id: 'adm-2026-11',
    cuentaId: 'admin_3827008588',
    numeroCuenta: '3827008588',
    orden: 11,
    fecha: '2026-11-04',
    fechaTexto: '04/11/2026',
    descripcion: 'Mensualidad julio y agosto 26',
    categoriaContable: 'Cuotas Ordinarias de Socios',
    debito: 0.00,
    credito: 250.00,
    saldoContable: 29994.09
  },
  {
    id: 'adm-2026-12',
    cuentaId: 'admin_3827008588',
    numeroCuenta: '3827008588',
    orden: 12,
    fecha: '2026-11-05',
    fechaTexto: '05/11/2026',
    descripcion: 'N/CREDITO TRANSFERENCIA ELECTRONICA TIF',
    categoriaContable: 'Ajuste / Tránsito Bancario',
    debito: 0.00,
    credito: 12709.22,
    saldoContable: 42703.31,
    notaAuditor: 'Reversado el 12/11/2026 por depósito a cuenta equivocada'
  },
  {
    id: 'adm-2026-13',
    cuentaId: 'admin_3827008588',
    numeroCuenta: '3827008588',
    orden: 13,
    fecha: '2026-11-12',
    fechaTexto: '12/11/2026',
    descripcion: 'DEPOSITO A CTA EQUIVOCADA',
    categoriaContable: 'Ajuste / Reversión Bancaria',
    debito: 12709.22,
    credito: 0.00,
    saldoContable: 29994.09
  },
  {
    id: 'adm-2026-14',
    cuentaId: 'admin_3827008588',
    numeroCuenta: '3827008588',
    orden: 14,
    fecha: '2026-11-17',
    fechaTexto: '17/11/2026',
    descripcion: 'ANTICIPO CENA CONVIVIO 2027',
    categoriaContable: 'Actividades Institucionales / Convivio',
    debito: 3900.00,
    credito: 0.00,
    saldoContable: 26094.09
  },
  {
    id: 'adm-2026-15',
    cuentaId: 'admin_3827008588',
    numeroCuenta: '3827008588',
    orden: 15,
    fecha: '2026-11-18',
    fechaTexto: '18/11/2026',
    descripcion: '2 pagos convencion Ero y Jose',
    categoriaContable: 'Ingresos Convención / Socios',
    debito: 0.00,
    credito: 1300.00,
    saldoContable: 27394.09,
    destacado: true
  },

  // =========================================================================
  // CUENTA 3827008592 — CUEVA / OPERATIVA NO ADMINISTRATIVA (Banrural S.A.)
  // =========================================================================
  {
    id: 'cva-2026-01',
    cuentaId: 'cueva_3827008592',
    numeroCuenta: '3827008592',
    orden: 1,
    fecha: '2026-10-08',
    fechaTexto: '08-oct-2026',
    descripcion: 'MOVIMIENTO A CUENTA ADMINISTRATIVA DEPOSITO DE CUOTAS DE ARTURO WOK 2026',
    categoriaContable: 'Traslado a Cuenta Administrativa',
    debito: 1500.00,
    credito: 0.00,
    saldoContable: 19388.95,
    notaAuditor: 'Traslado hacia Cuenta Administrativa 3827008588'
  },
  {
    id: 'cva-2026-02',
    cuentaId: 'cueva_3827008592',
    numeroCuenta: '3827008592',
    orden: 2,
    fecha: '2026-10-08',
    fechaTexto: '08-oct-2026',
    descripcion: 'N/DEBITO TRANSFERENCIA ELECTRONICA TIF (CONTADOR PAGO SEPTIEMBRE 2026)',
    categoriaContable: 'Honorarios Contables',
    debito: 500.00,
    credito: 0.00,
    saldoContable: 18888.95
  },
  {
    id: 'cva-2026-03',
    cuentaId: 'cueva_3827008592',
    numeroCuenta: '3827008592',
    orden: 3,
    fecha: '2026-10-13',
    fechaTexto: '13-oct-2026',
    descripcion: 'N/DEBITO TRANSFERENCIA ELECTRONICA TIF (RESERVACION ALBAMAR)',
    categoriaContable: 'Eventos y Reservaciones',
    debito: 1000.00,
    credito: 0.00,
    saldoContable: 17888.95
  },
  {
    id: 'cva-2026-04',
    cuentaId: 'cueva_3827008592',
    numeroCuenta: '3827008592',
    orden: 4,
    fecha: '2026-10-15',
    fechaTexto: '15-oct-2026',
    descripcion: 'N/DEBITO TRANSFERENCIA ELECTRONICA TIF (PASTEL CUMPLEAÑEROS)',
    categoriaContable: 'Convivencia Leonística',
    debito: 380.00,
    credito: 0.00,
    saldoContable: 17508.95
  },
  {
    id: 'cva-2026-05',
    cuentaId: 'cueva_3827008592',
    numeroCuenta: '3827008592',
    orden: 5,
    fecha: '2026-10-16',
    fechaTexto: '16-oct-2026',
    descripcion: 'N/DEBITO TRANSFERENCIA ELECTRONICA TIF (APERTURA CUENTA BAC)',
    categoriaContable: 'Gestión Bancaria',
    debito: 400.00,
    credito: 0.00,
    saldoContable: 17108.95,
    destacado: true
  },
  {
    id: 'cva-2026-06',
    cuentaId: 'cueva_3827008592',
    numeroCuenta: '3827008592',
    orden: 6,
    fecha: '2026-11-01',
    fechaTexto: '01-nov-2026',
    descripcion: 'SALARIO NORVIL GUTTIERREZ OCTUBRE 2026',
    categoriaContable: 'Operación de Parqueo (Planilla)',
    debito: 4063.00,
    credito: 0.00,
    saldoContable: 13045.95
  },
  {
    id: 'cva-2026-07',
    cuentaId: 'cueva_3827008592',
    numeroCuenta: '3827008592',
    orden: 7,
    fecha: '2026-11-06',
    fechaTexto: '06-nov-2026',
    descripcion: 'DONACION ANCIANITOS PARA ACTIVIDAD PROPUESTA POR GLADIS DE SOLORZANO',
    categoriaContable: 'Obras Sociales y Donaciones',
    debito: 3000.00,
    credito: 0.00,
    saldoContable: 10045.95
  },
  {
    id: 'cva-2026-08',
    cuentaId: 'cueva_3827008592',
    numeroCuenta: '3827008592',
    orden: 8,
    fecha: '2026-11-05',
    fechaTexto: '05-nov-2026',
    descripcion: 'INGRESO DE PARQUEO',
    categoriaContable: 'Ingresos de Parqueo',
    debito: 0.00,
    credito: 20329.00,
    saldoContable: 30374.95,
    destacado: true
  },
  {
    id: 'cva-2026-09',
    cuentaId: 'cueva_3827008592',
    numeroCuenta: '3827008592',
    orden: 9,
    fecha: '2026-11-05',
    fechaTexto: '05-nov-2026',
    descripcion: 'PAGO DE CAJA CHICA TRABAJOS CUEVA',
    categoriaContable: 'Mantenimiento de Sede (Cueva)',
    debito: 7619.78,
    credito: 0.00,
    saldoContable: 22755.17
  },
  {
    id: 'cva-2026-10',
    cuentaId: 'cueva_3827008592',
    numeroCuenta: '3827008592',
    orden: 10,
    fecha: '2026-11-12',
    fechaTexto: '12-nov-2026',
    descripcion: 'N/DEBITO TRANSFERENCIA ELECTRONICA TIF (CONTADOR PAGO OCTUBRE 2026)',
    categoriaContable: 'Honorarios Contables',
    debito: 500.00,
    credito: 0.00,
    saldoContable: 22255.17
  },
  {
    id: 'cva-2026-11',
    cuentaId: 'cueva_3827008592',
    numeroCuenta: '3827008592',
    orden: 11,
    fecha: '2026-11-17',
    fechaTexto: '17-nov-2026',
    descripcion: 'ANTICIPO BOLSAS TOULOUSE (PARA REGALO PARA SOCIOS DIA DEL CONVIVIO)',
    categoriaContable: 'Convivencia Leonística',
    debito: 650.00,
    credito: 0.00,
    saldoContable: 21605.17
  },
  {
    id: 'cva-2026-12',
    cuentaId: 'cueva_3827008592',
    numeroCuenta: '3827008592',
    orden: 12,
    fecha: '2026-11-19',
    fechaTexto: '19-nov-2026',
    descripcion: 'N/DEBITO TRANSFERENCIA ELECTRONICA TIF (PARA PROMOCIÓN EN REDES SOCIALES)',
    categoriaContable: 'Publicidad y Redes Sociales',
    debito: 200.00,
    credito: 0.00,
    saldoContable: 21405.17,
    destacado: true
  },

  // =========================================================================
  // CUENTA 908326358 — BAC CREDOMATIC MONETARIA (CONVENCIÓN NACIONAL)
  // =========================================================================
  {
    id: 'bac-2026-01',
    cuentaId: 'bac_908326358',
    numeroCuenta: '908326358',
    orden: 1,
    fecha: '2026-10-16',
    fechaTexto: '16/10/2026',
    descripcion: 'APERTURA CUENTA MONETARIA BAC CREDOMATIC (CONVENCIÓN)',
    categoriaContable: 'Apertura / Fondos de Convención',
    debito: 0.00,
    credito: 400.00,
    saldoContable: 400.00,
    destacado: true,
    notaAuditor: 'Contrapartida de transferencia TIF desde Cuenta Cueva Banrural 3827008592 del 16-oct-2026'
  }
];
