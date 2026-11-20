import React, { useState, useEffect, useMemo } from 'react';
import {
  Landmark,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Search,
  Download,
  Printer,
  Edit3,
  X,
  BarChart3,
  ShieldCheck,
  RotateCcw,
  Users,
  Building2,
  Car,
  ArrowLeftRight,
  Copy,
  Check,
  Wallet,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Tag
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid
} from 'recharts';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { firebaseService } from '../services/firebaseService';
import { useModal } from '../context/ModalContext';
import {
  CUENTAS_BANCARIAS_BANRURAL,
  MOVIMIENTOS_BANCARIOS_REALES,
  MovimientoBancarioReal
} from '../data/cuentasBancariasReales';

const CATEGORIAS_ADMIN = [
  'Cuotas Ordinarias de Socios',
  'Ingresos de Nuevos Socios',
  'Ingresos Convención / Socios',
  'Traslado de Cuotas entre Cuentas',
  'Actividades Institucionales / Convivio',
  'Cuotas Internacionales / Distritales',
  'Ajuste / Reversión Bancaria',
  'Otros Movimientos Administrativos'
];

const CATEGORIAS_CUEVA = [
  'Ingresos de Parqueo',
  'Alquiler de Salón / Local / Apartamento',
  'Operación de Parqueo (Planilla)',
  'Mantenimiento de Sede (Cueva)',
  'Honorarios Contables',
  'Obras Sociales y Donaciones',
  'Convivencia Leonística',
  'Eventos y Reservaciones',
  'Publicidad y Redes Sociales',
  'Gestión Bancaria',
  'Traslado a Cuenta Administrativa',
  'Otros Movimientos No Administrativos'
];

const formatGTQ = (val: number) =>
  `Q${Number(val || 0).toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

export const Presupuestos: React.FC = () => {
  const { showAlert, showConfirm } = useModal();

  const [activeTab, setActiveTab] = useState<'consolidado' | 'admin_3827008588' | 'cueva_3827008592'>('consolidado');
  const [movimientos, setMovimientos] = useState<MovimientoBancarioReal[]>(MOVIMIENTOS_BANCARIOS_REALES);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'todos' | 'creditos' | 'debitos'>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');

  // Modal de Nuevo / Editar Movimiento
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    cuentaId: 'admin_3827008588' as 'admin_3827008588' | 'cueva_3827008592',
    fecha: new Date().toISOString().slice(0, 10),
    fechaTexto: '',
    descripcion: '',
    categoriaContable: CATEGORIAS_ADMIN[0],
    tipoMovimiento: 'credito' as 'credito' | 'debito',
    monto: '',
    notaAuditor: '',
    destacado: false
  });

  // Suscripción en tiempo real a Firestore; si está vacía, se siembran los movimientos reales de las 2 cuentas Banrural
  useEffect(() => {
    const colRef = collection(db, 'tesoreria_cuentas_movimientos');
    const unsub = onSnapshot(
      colRef,
      async (snapshot) => {
        if (snapshot.empty) {
          try {
            await firebaseService.resetMovimientosBancariosOficiales(MOVIMIENTOS_BANCARIOS_REALES);
          } catch (e) {
            console.warn('Usando datos reales locales de respaldo:', e);
            setMovimientos(MOVIMIENTOS_BANCARIOS_REALES);
          }
          return;
        }
        const loaded: MovimientoBancarioReal[] = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() } as MovimientoBancarioReal)
        );
        setMovimientos(loaded);
      },
      (err) => {
        console.warn('Error suscribiendo a tesoreria_cuentas_movimientos, usando datos reales locales:', err);
        setMovimientos(MOVIMIENTOS_BANCARIOS_REALES);
      }
    );
    return () => unsub();
  }, []);

  // Recalcular libro auxiliar ordenado y con saldo contable acumulado por cuenta
  const analizarCuenta = (
    cuentaId: 'admin_3827008588' | 'cueva_3827008592',
    listaRaw: MovimientoBancarioReal[]
  ) => {
    const infoCuenta = CUENTAS_BANCARIAS_BANRURAL[cuentaId];
    const items = listaRaw
      .filter((m) => m.cuentaId === cuentaId || m.numeroCuenta === infoCuenta.numeroCuenta)
      .sort((a, b) => {
        if (a.orden !== undefined && b.orden !== undefined && a.orden !== b.orden) {
          return a.orden - b.orden;
        }
        return (a.fecha || '').localeCompare(b.fecha || '');
      });

    let runningBalance = infoCuenta.saldoInicialPeriodo;
    const recalc = items.map((item, idx) => {
      const deb = Number(item.debito) || 0;
      const cred = Number(item.credito) || 0;
      runningBalance = Number((runningBalance - deb + cred).toFixed(2));
      return {
        ...item,
        orden: item.orden ?? idx + 1,
        debito: deb,
        credito: cred,
        saldoContable: runningBalance
      };
    });

    const totalCreditos = recalc.reduce((acc, m) => acc + m.credito, 0);
    const totalDebitos = recalc.reduce((acc, m) => acc + m.debito, 0);
    const saldoFinal = recalc.length > 0 ? recalc[recalc.length - 1].saldoContable : infoCuenta.saldoActual;
    const ultimaFecha = recalc.length > 0 ? recalc[recalc.length - 1].fechaTexto : infoCuenta.fechaCorte;

    // Excluir la reversión por depósito a cuenta equivocada (Q12,709.22) para mostrar también el ingreso operativo real limpio
    const ajusteEquivocado = recalc
      .filter((m) => m.descripcion.toUpperCase().includes('CTA EQUIVOCADA') || m.notaAuditor?.includes('Reversado'))
      .reduce((acc, m) => acc + m.debito, 0);

    return {
      info: infoCuenta,
      movimientos: recalc,
      totalCreditos,
      totalDebitos,
      totalCreditosOperativos: Math.max(0, totalCreditos - ajusteEquivocado),
      totalDebitosOperativos: Math.max(0, totalDebitos - ajusteEquivocado),
      ajusteEquivocado,
      saldoInicial: infoCuenta.saldoInicialPeriodo,
      saldoFinal,
      ultimaFecha
    };
  };

  const estadoAdmin = useMemo(() => analizarCuenta('admin_3827008588', movimientos), [movimientos]);
  const estadoCueva = useMemo(() => analizarCuenta('cueva_3827008592', movimientos), [movimientos]);

  const saldoTotalClub = estadoAdmin.saldoFinal + estadoCueva.saldoFinal;
  const totalIngresosOperativosClub = estadoAdmin.totalCreditosOperativos + estadoCueva.totalCreditosOperativos;
  const totalEgresosOperativosClub = estadoAdmin.totalDebitosOperativos + estadoCueva.totalDebitosOperativos;

  const handleCopyAccount = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedAccount(num);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const handleOpenNewModal = (defaultCuenta?: 'admin_3827008588' | 'cueva_3827008592') => {
    const targetCuenta =
      defaultCuenta || (activeTab === 'cueva_3827008592' ? 'cueva_3827008592' : 'admin_3827008588');
    const todayIso = new Date().toISOString().slice(0, 10);
    const [y, m, d] = todayIso.split('-');
    setEditingId(null);
    setFormData({
      cuentaId: targetCuenta,
      fecha: todayIso,
      fechaTexto: `${d}/${m}/${y}`,
      descripcion: '',
      categoriaContable: targetCuenta === 'admin_3827008588' ? CATEGORIAS_ADMIN[0] : CATEGORIAS_CUEVA[0],
      tipoMovimiento: targetCuenta === 'admin_3827008588' ? 'credito' : 'debito',
      monto: '',
      notaAuditor: '',
      destacado: false
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (item: MovimientoBancarioReal) => {
    setEditingId(item.id);
    const isCredito = (Number(item.credito) || 0) > 0;
    setFormData({
      cuentaId: item.cuentaId,
      fecha: item.fecha,
      fechaTexto: item.fechaTexto,
      descripcion: item.descripcion,
      categoriaContable: item.categoriaContable,
      tipoMovimiento: isCredito ? 'credito' : 'debito',
      monto: String(isCredito ? item.credito : item.debito),
      notaAuditor: item.notaAuditor || '',
      destacado: Boolean(item.destacado)
    });
    setShowModal(true);
  };

  const handleSaveMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseFloat(formData.monto);
    if (!formData.descripcion.trim() || isNaN(montoNum) || montoNum < 0) {
      showAlert('Datos incompletos', 'Ingresa una descripción válida y un monto mayor o igual a Q0.00.');
      return;
    }

    const cuentaMovs =
      formData.cuentaId === 'admin_3827008588' ? estadoAdmin.movimientos : estadoCueva.movimientos;
    const maxOrden = cuentaMovs.reduce((max, m) => Math.max(max, m.orden || 0), 0);
    const existingItem = movimientos.find((m) => m.id === editingId);

    const [y, m, d] = (formData.fecha || '').split('-');
    const formattedFechaTexto =
      formData.fechaTexto.trim() || (d && m && y ? `${d}/${m}/${y}` : formData.fecha);

    const nuevo: MovimientoBancarioReal = {
      id:
        editingId ||
        `${formData.cuentaId === 'admin_3827008588' ? 'adm' : 'cva'}-${Date.now()}`,
      cuentaId: formData.cuentaId,
      numeroCuenta: formData.cuentaId === 'admin_3827008588' ? '3827008588' : '3827008592',
      orden: existingItem ? existingItem.orden : maxOrden + 1,
      fecha: formData.fecha,
      fechaTexto: formattedFechaTexto,
      descripcion: formData.descripcion.trim(),
      categoriaContable: formData.categoriaContable,
      debito: formData.tipoMovimiento === 'debito' ? montoNum : 0,
      credito: formData.tipoMovimiento === 'credito' ? montoNum : 0,
      saldoContable: 0, // Se recalcula automáticamente en la vista por orden cronológico
      destacado: formData.destacado,
      ...(formData.notaAuditor.trim() ? { notaAuditor: formData.notaAuditor.trim() } : {})
    };

    try {
      setIsSyncing(true);
      await firebaseService.saveMovimientoBancario(nuevo);
      setShowModal(false);
    } catch (err) {
      console.error('Error guardando movimiento:', err);
      showAlert('Error', 'No se pudo guardar la transacción en la base de datos.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteMovimiento = async (item: MovimientoBancarioReal) => {
    const ok = await showConfirm(
      'Eliminar Transacción',
      `¿Deseas eliminar el movimiento "${item.descripcion}" (${formatGTQ(
        item.credito > 0 ? item.credito : item.debito
      )}) de la cuenta ${item.numeroCuenta}? El saldo contable se recalculará automáticamente.`,
      { confirmText: 'Eliminar', cancelText: 'Cancelar', type: 'warning' }
    );
    if (!ok) return;

    try {
      setIsSyncing(true);
      await firebaseService.deleteMovimientoBancario(item.id);
    } catch (err) {
      console.error('Error eliminando movimiento:', err);
      showAlert('Error', 'No se pudo eliminar la transacción.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestaurarLibrosOficiales = async () => {
    const ok = await showConfirm(
      'Restaurar Libros Reales Banrural S.A.',
      '¿Deseas restaurar exactamente los 15 movimientos oficiales de la Cuenta Administrativa (3827008588 — Saldo Q27,394.09) y los 12 movimientos oficiales de la Cuenta Cueva (3827008592 — Saldo Q21,405.17)?',
      { confirmText: 'Restaurar Saldos Oficiales', cancelText: 'Cancelar' }
    );
    if (!ok) return;

    try {
      setIsSyncing(true);
      await firebaseService.resetMovimientosBancariosOficiales(MOVIMIENTOS_BANCARIOS_REALES);
      showAlert(
        'Libros Bancarios Sincronizados',
        'Se han restaurado las dos cuentas monetarias de Banrural S.A. con sus saldos y transacciones reales.'
      );
    } catch (err) {
      console.error('Error restaurando libros:', err);
      showAlert('Error', 'No se pudieron restaurar los movimientos oficiales.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Banco',
      'Numero_Cuenta',
      'Nombre_Cuenta',
      'Orden',
      'Fecha',
      'Descripcion',
      'Categoria',
      'Debito_Q',
      'Credito_Q',
      'Saldo_Contable_Q'
    ];

    const todosOrdenados = [...estadoAdmin.movimientos, ...estadoCueva.movimientos];
    const rows = todosOrdenados.map((m) =>
      [
        '"Banrural S.A."',
        `"${m.numeroCuenta}"`,
        `"${m.cuentaId === 'admin_3827008588' ? 'Administrativa' : 'Cueva / No Administrativa'}"`,
        m.orden,
        `"${m.fechaTexto}"`,
        `"${m.descripcion.replace(/"/g, '""')}"`,
        `"${(m.categoriaContable || '').replace(/"/g, '""')}"`,
        m.debito.toFixed(2),
        m.credito.toFixed(2),
        m.saldoContable.toFixed(2)
      ].join(',')
    );

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Estados_De_Cuenta_Banrural_Club_Leones_Quetzaltenango.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtrar movimientos para la pestaña activa
  const cuentaActivaEstado =
    activeTab === 'cueva_3827008592' ? estadoCueva : estadoAdmin;

  const categoriasDisponiblesCuenta = useMemo(() => {
    const set = new Set<string>();
    cuentaActivaEstado.movimientos.forEach((m) => {
      if (m.categoriaContable) set.add(m.categoriaContable);
    });
    return Array.from(set);
  }, [cuentaActivaEstado.movimientos]);

  const filteredMovimientosCuenta = useMemo(() => {
    return cuentaActivaEstado.movimientos.filter((m) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        m.descripcion.toLowerCase().includes(q) ||
        m.fechaTexto.toLowerCase().includes(q) ||
        (m.categoriaContable || '').toLowerCase().includes(q);
      const matchType =
        typeFilter === 'todos' ||
        (typeFilter === 'creditos' && m.credito > 0) ||
        (typeFilter === 'debitos' && m.debito > 0);
      const matchCat = categoryFilter === 'todas' || m.categoriaContable === categoryFilter;
      return matchSearch && matchType && matchCat;
    });
  }, [cuentaActivaEstado.movimientos, searchQuery, typeFilter, categoryFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-16">
      {/* CABECERA PRINCIPAL: TESORERÍA Y CUENTAS MONETARIAS BANRURAL S.A. */}
      <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-emerald-950 rounded-3xl sm:rounded-[2rem] p-5 sm:p-7 text-white shadow-xl relative overflow-hidden border border-blue-900/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-5">
          {/* Fila superior: Identidad, título a ancho completo y resumen rápido */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-black uppercase tracking-wider whitespace-nowrap">
                  <Landmark size={13} className="shrink-0" />
                  <span>Tesorería Real • Banrural S.A.</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-slate-200 text-[11px] font-bold whitespace-nowrap">
                  <Calendar size={12} className="text-yellow-300 shrink-0" />
                  <span>Corte al {estadoCueva.ultimaFecha}</span>
                </span>
              </div>

              <h1 className="font-sans text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                Control de Saldos Bancarios y Libros de Cuentas
              </h1>

              <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-slate-300 font-medium">
                <span>Cuentas monetarias oficiales del Club:</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('admin_3827008588');
                    setCategoryFilter('todas');
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-900/70 hover:bg-blue-800/80 border border-blue-700/60 text-white transition-colors cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                  <span className="font-bold">Administrativa:</span>
                  <span className="font-mono font-black text-yellow-300">3827008588</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('cueva_3827008592');
                    setCategoryFilter('todas');
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-900/70 hover:bg-emerald-800/80 border border-emerald-700/60 text-white transition-colors cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="font-bold">Cueva (No Admin):</span>
                  <span className="font-mono font-black text-emerald-300">3827008592</span>
                </button>
              </div>
            </div>

            {/* Indicador compacto de liquidez consolidada */}
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 md:text-right shrink-0 self-start">
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-300 block">
                Liquidez Total en Banco
              </span>
              <span className="text-xl sm:text-2xl font-mono font-black text-white tracking-tight">
                {formatGTQ(saldoTotalClub)}
              </span>
            </div>
          </div>

          {/* Barra inferior de acciones: limpia, alineada y sin desbordes */}
          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <button
              type="button"
              onClick={() => handleOpenNewModal()}
              className="px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-black text-xs uppercase tracking-wider inline-flex items-center gap-2 transition-all shadow-lg shadow-yellow-500/15 cursor-pointer"
            >
              <Plus size={16} />
              <span>Registrar Movimiento</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleRestaurarLibrosOficiales}
                disabled={isSyncing}
                title="Restaurar los movimientos y saldos oficiales de los libros de Banrural"
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 inline-flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw size={14} className={isSyncing ? 'animate-spin' : ''} />
                <span>Sincronizar Libros</span>
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 inline-flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download size={14} />
                <span>Exportar CSV</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 inline-flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Printer size={14} />
                <span>Imprimir</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TARJETAS PRINCIPALES DE SALDO EN BANRURAL S.A. */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Cuenta 1: Administrativa 3827008588 */}
        <div
          onClick={() => {
            setActiveTab('admin_3827008588');
            setCategoryFilter('todas');
          }}
          className={`lg:col-span-4 rounded-3xl p-6 border transition-all cursor-pointer relative overflow-hidden ${
            activeTab === 'admin_3827008588'
              ? 'bg-blue-950 text-white border-blue-700 shadow-xl ring-4 ring-blue-500/20'
              : 'bg-white text-slate-900 border-slate-200 hover:border-blue-400 shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span
                className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                  activeTab === 'admin_3827008588'
                    ? 'bg-blue-800 text-yellow-300 border border-blue-700'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}
              >
                <Users size={12} />
                <span>Banrural Monetaria • Administrativa</span>
              </span>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-mono text-sm font-black tracking-wider">
                  No. 3827008588
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyAccount('3827008588');
                  }}
                  title="Copiar número de cuenta"
                  className={`p-1 rounded-lg transition-colors ${
                    activeTab === 'admin_3827008588'
                      ? 'hover:bg-blue-800 text-blue-200'
                      : 'hover:bg-slate-100 text-slate-500'
                  }`}
                >
                  {copiedAccount === '3827008588' ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
            </div>
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                activeTab === 'admin_3827008588'
                  ? 'bg-blue-800 text-yellow-400'
                  : 'bg-blue-50 text-blue-700 border border-blue-100'
              }`}
            >
              <Landmark size={22} />
            </div>
          </div>

          <div className="mt-4">
            <p
              className={`text-[10px] font-black uppercase tracking-widest ${
                activeTab === 'admin_3827008588' ? 'text-blue-200' : 'text-slate-400'
              }`}
            >
              Saldo Contable Actual (Corte {estadoAdmin.ultimaFecha})
            </p>
            <h2 className="text-3xl font-black tracking-tight mt-0.5">
              {formatGTQ(estadoAdmin.saldoFinal)}
            </h2>
          </div>

          <p
            className={`text-xs font-medium mt-2 leading-snug ${
              activeTab === 'admin_3827008588' ? 'text-blue-100' : 'text-slate-600'
            }`}
          >
            Pago de cuotas ordinarias de socios, ingresos de nuevos socios y pagos de convención.
          </p>

          <div
            className={`grid grid-cols-2 gap-2 mt-4 pt-3 border-t text-xs ${
              activeTab === 'admin_3827008588' ? 'border-blue-800/80' : 'border-slate-100'
            }`}
          >
            <div>
              <span
                className={`text-[10px] font-bold block ${
                  activeTab === 'admin_3827008588' ? 'text-blue-200' : 'text-slate-400'
                }`}
              >
                Créditos (+) Operativos
              </span>
              <span className="font-mono font-black text-emerald-500">
                +{formatGTQ(estadoAdmin.totalCreditosOperativos)}
              </span>
            </div>
            <div>
              <span
                className={`text-[10px] font-bold block ${
                  activeTab === 'admin_3827008588' ? 'text-blue-200' : 'text-slate-400'
                }`}
              >
                Débitos (-) Operativos
              </span>
              <span
                className={`font-mono font-black ${
                  activeTab === 'admin_3827008588' ? 'text-rose-300' : 'text-rose-600'
                }`}
              >
                -{formatGTQ(estadoAdmin.totalDebitosOperativos)}
              </span>
            </div>
          </div>
        </div>

        {/* Cuenta 2: Cueva / No Administrativa 3827008592 */}
        <div
          onClick={() => {
            setActiveTab('cueva_3827008592');
            setCategoryFilter('todas');
          }}
          className={`lg:col-span-4 rounded-3xl p-6 border transition-all cursor-pointer relative overflow-hidden ${
            activeTab === 'cueva_3827008592'
              ? 'bg-emerald-950 text-white border-emerald-700 shadow-xl ring-4 ring-emerald-500/20'
              : 'bg-white text-slate-900 border-slate-200 hover:border-emerald-400 shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span
                className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                  activeTab === 'cueva_3827008592'
                    ? 'bg-emerald-800 text-emerald-200 border border-emerald-700'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                <Car size={12} />
                <span>Banrural Monetaria • Cueva (No Admin)</span>
              </span>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-mono text-sm font-black tracking-wider">
                  No. 3827008592
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyAccount('3827008592');
                  }}
                  title="Copiar número de cuenta"
                  className={`p-1 rounded-lg transition-colors ${
                    activeTab === 'cueva_3827008592'
                      ? 'hover:bg-emerald-800 text-emerald-200'
                      : 'hover:bg-slate-100 text-slate-500'
                  }`}
                >
                  {copiedAccount === '3827008592' ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
            </div>
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                activeTab === 'cueva_3827008592'
                  ? 'bg-emerald-800 text-yellow-300'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}
            >
              <Building2 size={22} />
            </div>
          </div>

          <div className="mt-4">
            <p
              className={`text-[10px] font-black uppercase tracking-widest ${
                activeTab === 'cueva_3827008592' ? 'text-emerald-200' : 'text-slate-400'
              }`}
            >
              Saldo Contable Actual (Corte {estadoCueva.ultimaFecha})
            </p>
            <h2 className="text-3xl font-black tracking-tight mt-0.5">
              {formatGTQ(estadoCueva.saldoFinal)}
            </h2>
          </div>

          <p
            className={`text-xs font-medium mt-2 leading-snug ${
              activeTab === 'cueva_3827008592' ? 'text-emerald-100' : 'text-slate-600'
            }`}
          >
            Pagos no administrativos, entradas de parqueo, alquileres, mantenimiento de Cueva y obras sociales.
          </p>

          <div
            className={`grid grid-cols-2 gap-2 mt-4 pt-3 border-t text-xs ${
              activeTab === 'cueva_3827008592' ? 'border-emerald-800/80' : 'border-slate-100'
            }`}
          >
            <div>
              <span
                className={`text-[10px] font-bold block ${
                  activeTab === 'cueva_3827008592' ? 'text-emerald-200' : 'text-slate-400'
                }`}
              >
                Créditos (+) Período
              </span>
              <span className="font-mono font-black text-emerald-500">
                +{formatGTQ(estadoCueva.totalCreditos)}
              </span>
            </div>
            <div>
              <span
                className={`text-[10px] font-bold block ${
                  activeTab === 'cueva_3827008592' ? 'text-emerald-200' : 'text-slate-400'
                }`}
              >
                Débitos (-) Período
              </span>
              <span
                className={`font-mono font-black ${
                  activeTab === 'cueva_3827008592' ? 'text-rose-300' : 'text-rose-600'
                }`}
              >
                -{formatGTQ(estadoCueva.totalDebitos)}
              </span>
            </div>
          </div>
        </div>

        {/* Liquidez Total Consolidada (Ambas Cuentas) */}
        <div
          onClick={() => setActiveTab('consolidado')}
          className={`lg:col-span-4 rounded-3xl p-6 border transition-all cursor-pointer relative overflow-hidden ${
            activeTab === 'consolidado'
              ? 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white border-yellow-500/40 shadow-xl ring-4 ring-yellow-500/20'
              : 'bg-white text-slate-900 border-slate-200 hover:border-yellow-500 shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span
                className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                  activeTab === 'consolidado'
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                <ShieldCheck size={12} />
                <span>Liquidez Total en Banrural S.A.</span>
              </span>
              <p
                className={`text-xs font-bold mt-2 ${
                  activeTab === 'consolidado' ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                Suma de Cuentas 3827008588 + 3827008592
              </p>
            </div>
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                activeTab === 'consolidado'
                  ? 'bg-yellow-400 text-blue-950'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              <Wallet size={22} />
            </div>
          </div>

          <div className="mt-4">
            <p
              className={`text-[10px] font-black uppercase tracking-widest ${
                activeTab === 'consolidado' ? 'text-yellow-300/90' : 'text-slate-400'
              }`}
            >
              Disponibilidad Consolidada Real
            </p>
            <h2 className="text-3xl font-black tracking-tight mt-0.5">
              {formatGTQ(saldoTotalClub)}
            </h2>
          </div>

          {/* Barra de proporción entre cuentas */}
          <div className="mt-3 space-y-1.5">
            <div className="w-full h-2.5 bg-slate-200/30 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-500 h-full"
                style={{
                  width: `${saldoTotalClub > 0 ? (estadoAdmin.saldoFinal / saldoTotalClub) * 100 : 50}%`
                }}
              />
              <div
                className="bg-emerald-500 h-full"
                style={{
                  width: `${saldoTotalClub > 0 ? (estadoCueva.saldoFinal / saldoTotalClub) * 100 : 50}%`
                }}
              />
            </div>
            <div
              className={`flex justify-between text-[10px] font-black ${
                activeTab === 'consolidado' ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              <span>
                Admin ({((estadoAdmin.saldoFinal / (saldoTotalClub || 1)) * 100).toFixed(1)}%)
              </span>
              <span>
                Cueva ({((estadoCueva.saldoFinal / (saldoTotalClub || 1)) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>

          <div
            className={`grid grid-cols-2 gap-2 mt-3 pt-3 border-t text-xs ${
              activeTab === 'consolidado' ? 'border-slate-800' : 'border-slate-100'
            }`}
          >
            <div>
              <span
                className={`text-[10px] font-bold block ${
                  activeTab === 'consolidado' ? 'text-slate-400' : 'text-slate-400'
                }`}
              >
                Total Movimientos
              </span>
              <span className="font-black">
                {estadoAdmin.movimientos.length + estadoCueva.movimientos.length} transacciones
              </span>
            </div>
            <div>
              <span
                className={`text-[10px] font-bold block ${
                  activeTab === 'consolidado' ? 'text-slate-400' : 'text-slate-400'
                }`}
              >
                Traslado Conciliado
              </span>
              <span className="font-mono font-black text-yellow-400">
                Q1,500.00 (08/10)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SELECTOR DE PESTAÑAS */}
      <div className="flex flex-wrap bg-slate-100/90 backdrop-blur-md p-1.5 rounded-2xl shadow-inner border border-slate-200/60 gap-1.5 print:hidden">
        <button
          type="button"
          onClick={() => setActiveTab('consolidado')}
          className={`flex-1 min-w-[220px] py-3 px-4 text-xs sm:text-sm font-black transition-all duration-300 rounded-xl flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'consolidado'
              ? 'bg-white shadow-md text-slate-900'
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <BarChart3 size={16} className={activeTab === 'consolidado' ? 'text-blue-700' : 'text-slate-400'} />
          <span>1. Vista Consolidada (Ambas Cuentas)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('admin_3827008588');
            setCategoryFilter('todas');
          }}
          className={`flex-1 min-w-[240px] py-3 px-4 text-xs sm:text-sm font-black transition-all duration-300 rounded-xl flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'admin_3827008588'
              ? 'bg-blue-900 shadow-md text-white'
              : 'text-slate-600 hover:text-blue-900 hover:bg-white/50'
          }`}
        >
          <Users size={16} className={activeTab === 'admin_3827008588' ? 'text-yellow-300' : 'text-blue-600'} />
          <span>2. Cuenta Administrativa • 3827008588 ({estadoAdmin.movimientos.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('cueva_3827008592');
            setCategoryFilter('todas');
          }}
          className={`flex-1 min-w-[240px] py-3 px-4 text-xs sm:text-sm font-black transition-all duration-300 rounded-xl flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === 'cueva_3827008592'
              ? 'bg-emerald-900 shadow-md text-white'
              : 'text-slate-600 hover:text-emerald-900 hover:bg-white/50'
          }`}
        >
          <Car size={16} className={activeTab === 'cueva_3827008592' ? 'text-yellow-300' : 'text-emerald-600'} />
          <span>3. Cuenta Cueva (No Admin) • 3827008592 ({estadoCueva.movimientos.length})</span>
        </button>
      </div>

      {/* =====================================================================
          PESTAÑA 1: VISTA CONSOLIDADA Y COMPARATIVA DE AMBAS CUENTAS
      ===================================================================== */}
      {activeTab === 'consolidado' && (
        <div className="space-y-8">
          {/* Conciliación y Reglas de Uso de Cuentas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tarjeta de Reglas Cuenta 3827008588 */}
            <div className="bg-white rounded-3xl p-6 border border-blue-200/80 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                    Banrural Monetaria • No. 3827008588
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-2">
                    Cuenta Administrativa (Cuotas y Socios)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {estadoAdmin.info.proposito}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Saldo Actual</span>
                  <span className="text-xl font-black text-blue-900">{formatGTQ(estadoAdmin.saldoFinal)}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] font-black text-slate-400 uppercase block">Saldo Base (07/10)</span>
                  <span className="text-xs sm:text-sm font-mono font-black text-slate-800">
                    {formatGTQ(estadoAdmin.saldoInicial)}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/60">
                  <span className="text-[10px] font-black text-emerald-800 uppercase block">Ingresos Cuotas/Conv.</span>
                  <span className="text-xs sm:text-sm font-mono font-black text-emerald-700">
                    +{formatGTQ(estadoAdmin.totalCreditosOperativos)}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200/60">
                  <span className="text-[10px] font-black text-rose-800 uppercase block">Egresos Operativos</span>
                  <span className="text-xs sm:text-sm font-mono font-black text-rose-700">
                    -{formatGTQ(estadoAdmin.totalDebitosOperativos)}
                  </span>
                </div>
              </div>

              {estadoAdmin.ajusteEquivocado > 0 && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-950">
                  <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black">Partida compensada de tránsito:</span> El 05/11/2026 ingresó una transferencia TIF de{' '}
                    <strong className="font-mono">{formatGTQ(estadoAdmin.ajusteEquivocado)}</strong> que fue reversada íntegramente el 12/11/2026 bajo concepto <em>"DEPOSITO A CTA EQUIVOCADA"</em> (efecto neto Q0.00).
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] font-bold text-slate-500">
                  Último movimiento: <strong>18/11/2026 — 2 pagos convención Ero y Jose (+Q1,300.00)</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('admin_3827008588')}
                  className="text-xs font-black text-blue-800 hover:text-blue-600 underline cursor-pointer shrink-0 ml-2"
                >
                  Ver libro completo →
                </button>
              </div>
            </div>

            {/* Tarjeta de Reglas Cuenta 3827008592 */}
            <div className="bg-white rounded-3xl p-6 border border-emerald-200/80 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    Banrural Monetaria • No. 3827008592
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-2">
                    Cuenta Cueva / No Administrativa (Parqueo y Alquileres)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {estadoCueva.info.proposito}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Saldo Actual</span>
                  <span className="text-xl font-black text-emerald-800">{formatGTQ(estadoCueva.saldoFinal)}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] font-black text-slate-400 uppercase block">Saldo Base (08/10)</span>
                  <span className="text-xs sm:text-sm font-mono font-black text-slate-800">
                    {formatGTQ(estadoCueva.saldoInicial)}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/60">
                  <span className="text-[10px] font-black text-emerald-800 uppercase block">Ingreso Parqueo (+)</span>
                  <span className="text-xs sm:text-sm font-mono font-black text-emerald-700">
                    +{formatGTQ(estadoCueva.totalCreditos)}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200/60">
                  <span className="text-[10px] font-black text-rose-800 uppercase block">Débitos Operativos (-)</span>
                  <span className="text-xs sm:text-sm font-mono font-black text-rose-700">
                    -{formatGTQ(estadoCueva.totalDebitos)}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-2.5 text-xs text-emerald-950">
                <ArrowLeftRight size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black">Conciliación entre cuentas verificada:</span> El 08/10/2026 se trasladaron{' '}
                  <strong className="font-mono">Q1,500.00</strong> de Cueva (<span className="font-mono">3827008592</span>) hacia Administrativa (<span className="font-mono">3827008588</span>) por <em>"DEPOSITO DE CUOTAS DE ARTURO WOK 2026"</em>.
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] font-bold text-slate-500">
                  Último movimiento: <strong>19-nov-2026 — Promoción en redes sociales (-Q200.00)</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('cueva_3827008592')}
                  className="text-xs font-black text-emerald-800 hover:text-emerald-600 underline cursor-pointer shrink-0 ml-2"
                >
                  Ver libro completo →
                </button>
              </div>
            </div>
          </div>

          {/* Gráficas de Evolución de Saldos Contables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Evolución Cuenta Administrativa */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-black text-slate-800 text-sm uppercase tracking-wide">
                    Evolución de Saldo • Cuenta Administrativa (3827008588)
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Comportamiento del saldo contable en Quetzales (Octubre – Noviembre 2026)
                  </p>
                </div>
                <span className="font-mono text-xs font-black bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg border border-blue-200">
                  {formatGTQ(estadoAdmin.saldoFinal)}
                </span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={estadoAdmin.movimientos}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="gradAdmin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1e40af" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#1e40af" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="fechaTexto" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                    <YAxis tickFormatter={(v) => `Q${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                    <RechartsTooltip
                      formatter={(v: any) => [formatGTQ(Number(v)), 'Saldo Contable']}
                      labelFormatter={(label) => `Fecha: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="saldoContable"
                      stroke="#1e40af"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#gradAdmin)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Evolución Cuenta Cueva */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-black text-slate-800 text-sm uppercase tracking-wide">
                    Evolución de Saldo • Cuenta Cueva (3827008592)
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Comportamiento del saldo contable en Quetzales (Octubre – Noviembre 2026)
                  </p>
                </div>
                <span className="font-mono text-xs font-black bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {formatGTQ(estadoCueva.saldoFinal)}
                </span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={estadoCueva.movimientos}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="gradCueva" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#047857" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#047857" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="fechaTexto" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                    <YAxis tickFormatter={(v) => `Q${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                    <RechartsTooltip
                      formatter={(v: any) => [formatGTQ(Number(v)), 'Saldo Contable']}
                      labelFormatter={(label) => `Fecha: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="saldoContable"
                      stroke="#047857"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#gradCueva)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PESTAÑAS 2 Y 3: DETALLE Y GESTIÓN POR CUENTA BANCARIA INDIVIDUAL
      ===================================================================== */}
      {(activeTab === 'admin_3827008588' || activeTab === 'cueva_3827008592') && (
        <div className="space-y-6">
          {/* Ficha Técnica de la Cuenta Seleccionada */}
          <div
            className={`rounded-3xl p-6 border shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
              activeTab === 'admin_3827008588'
                ? 'bg-blue-50/70 border-blue-200'
                : 'bg-emerald-50/70 border-emerald-200'
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${
                    activeTab === 'admin_3827008588'
                      ? 'bg-blue-900 text-yellow-300'
                      : 'bg-emerald-900 text-yellow-300'
                  }`}
                >
                  {cuentaActivaEstado.info.banco} • {cuentaActivaEstado.info.tipoCuenta}
                </span>
                <span className="font-mono text-xs font-black text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                  Cuenta No. {cuentaActivaEstado.info.numeroCuenta}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900">
                {cuentaActivaEstado.info.nombreOficial}
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                {cuentaActivaEstado.info.proposito}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200 text-right">
                <span className="text-[10px] font-black uppercase text-slate-400 block">
                  Saldo Anterior (Inicio)
                </span>
                <span className="text-sm font-mono font-black text-slate-700">
                  {formatGTQ(cuentaActivaEstado.saldoInicial)}
                </span>
              </div>
              <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200 text-right">
                <span className="text-[10px] font-black uppercase text-slate-400 block">
                  Saldo Contable Actual
                </span>
                <span
                  className={`text-xl font-mono font-black ${
                    activeTab === 'admin_3827008588' ? 'text-blue-900' : 'text-emerald-800'
                  }`}
                >
                  {formatGTQ(cuentaActivaEstado.saldoFinal)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleOpenNewModal(activeTab)}
                className={`px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-wider text-white flex items-center gap-2 shadow-md cursor-pointer ${
                  activeTab === 'admin_3827008588'
                    ? 'bg-blue-900 hover:bg-blue-800'
                    : 'bg-emerald-800 hover:bg-emerald-700'
                }`}
              >
                <Plus size={16} />
                <span>Nueva Transacción</span>
              </button>
            </div>
          </div>

          {/* Barra de Búsqueda y Filtros */}
          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 print:hidden">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Buscar en cuenta ${cuentaActivaEstado.info.numeroCuenta} por descripción, socio, fecha o categoría...`}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-black">
                <button
                  type="button"
                  onClick={() => setTypeFilter('todos')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    typeFilter === 'todos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Todos ({cuentaActivaEstado.movimientos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('creditos')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    typeFilter === 'creditos' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Créditos (+)
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('debitos')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    typeFilter === 'debitos' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Débitos (-)
                </button>
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-700 outline-none cursor-pointer"
              >
                <option value="todas">Todas las categorías</option>
                {categoriasDisponiblesCuenta.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabla Oficial de Movimientos de la Cuenta */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-blue-800 text-white text-[10px] font-black uppercase tracking-wider">
                    <th className="py-3.5 px-4 text-center">#</th>
                    <th className="py-3.5 px-4">Fecha</th>
                    <th className="py-3.5 px-4">Descripción Bancaria / Concepto</th>
                    <th className="py-3.5 px-4">Categoría Contable</th>
                    <th className="py-3.5 px-4 text-right">Débito (-)</th>
                    <th className="py-3.5 px-4 text-right">Crédito (+)</th>
                    <th className="py-3.5 px-4 text-right">Saldo Contable</th>
                    <th className="py-3.5 px-4 text-center print:hidden">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {/* Fila de Saldo Inicial */}
                  <tr className="bg-slate-100/90 text-slate-600 font-bold">
                    <td className="py-2.5 px-4 text-center font-mono text-[10px]">0</td>
                    <td className="py-2.5 px-4 font-mono text-[11px]">Inicio oct-2026</td>
                    <td className="py-2.5 px-4 italic" colSpan={2}>
                      SALDO ANTERIOR EN LIBROS ({cuentaActivaEstado.info.alias} • {cuentaActivaEstado.info.numeroCuenta})
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">Q0.00</td>
                    <td className="py-2.5 px-4 text-right font-mono">Q0.00</td>
                    <td className="py-2.5 px-4 text-right font-mono font-black text-slate-800">
                      {formatGTQ(cuentaActivaEstado.saldoInicial)}
                    </td>
                    <td className="py-2.5 px-4 text-center print:hidden">—</td>
                  </tr>

                  {filteredMovimientosCuenta.map((m, idx) => (
                    <tr
                      key={m.id}
                      className={`${
                        idx % 2 === 1 ? 'bg-sky-50/50' : 'bg-white'
                      } hover:bg-blue-50/60 transition-colors`}
                    >
                      <td className="py-3 px-4 text-center font-mono text-[11px] font-bold text-slate-400">
                        {m.orden}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-bold text-slate-800 whitespace-nowrap">
                        {m.fechaTexto}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-black text-slate-900">{m.descripcion}</p>
                        {m.notaAuditor && (
                          <p className="text-[11px] text-amber-800 font-semibold mt-0.5">
                            Nota: {m.notaAuditor}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                          <Tag size={10} />
                          <span>{m.categoriaContable || 'General'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                        {m.debito > 0 ? (
                          <span className="font-black text-rose-700 text-sm">
                            {formatGTQ(m.debito)}
                          </span>
                        ) : (
                          <span className="text-slate-400">Q0.00</span>
                        )}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono whitespace-nowrap ${
                          m.destacado && m.credito > 0 ? 'bg-yellow-200/80' : ''
                        }`}
                      >
                        {m.credito > 0 ? (
                          <span className="font-black text-emerald-700 text-sm">
                            {formatGTQ(m.credito)}
                          </span>
                        ) : (
                          <span className="text-slate-400">Q0.00</span>
                        )}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-black text-sm whitespace-nowrap ${
                          m.destacado ? 'bg-yellow-300/80 text-slate-950' : 'text-slate-900'
                        }`}
                      >
                        {formatGTQ(m.saldoContable)}
                      </td>
                      <td className="py-3 px-4 text-center print:hidden">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(m)}
                            title="Editar movimiento"
                            className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMovimiento(m)}
                            title="Eliminar movimiento"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-black text-xs">
                    <td colSpan={4} className="py-3.5 px-4 text-right uppercase tracking-wider">
                      Totales del Período ({filteredMovimientosCuenta.length} movimientos mostrados):
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-rose-300">
                      {formatGTQ(
                        filteredMovimientosCuenta.reduce((acc, m) => acc + m.debito, 0)
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-300">
                      {formatGTQ(
                        filteredMovimientosCuenta.reduce((acc, m) => acc + m.credito, 0)
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-yellow-300 text-sm">
                      {formatGTQ(cuentaActivaEstado.saldoFinal)}
                    </td>
                    <td className="print:hidden"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL PARA REGISTRAR O EDITAR TRANSACCIÓN BANCARIA
      ===================================================================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xl max-w-lg w-full space-y-5 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-slate-900 text-lg">
                  {editingId ? 'Editar Transacción Bancaria' : 'Registrar Transacción Banrural S.A.'}
                </h3>
                <p className="text-xs text-slate-500">
                  El saldo contable de la cuenta se recalcula automáticamente en cascada.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMovimiento} className="space-y-4">
              {/* Selección de Cuenta */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">
                  Cuenta Monetaria Banrural S.A.
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        cuentaId: 'admin_3827008588',
                        categoriaContable: CATEGORIAS_ADMIN[0]
                      })
                    }
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      formData.cuentaId === 'admin_3827008588'
                        ? 'bg-blue-950 text-white border-blue-800 shadow-md'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-mono text-xs font-black block">3827008588</span>
                    <span className="text-[11px] font-bold opacity-90">Administrativa (Cuotas)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        cuentaId: 'cueva_3827008592',
                        categoriaContable: CATEGORIAS_CUEVA[0]
                      })
                    }
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      formData.cuentaId === 'cueva_3827008592'
                        ? 'bg-emerald-950 text-white border-emerald-800 shadow-md'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-mono text-xs font-black block">3827008592</span>
                    <span className="text-[11px] font-bold opacity-90">Cueva (Parqueo/Rentas)</span>
                  </button>
                </div>
              </div>

              {/* Tipo de Movimiento y Fecha */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">
                    Tipo de Operación
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, tipoMovimiento: 'credito' })}
                      className={`py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        formData.tipoMovimiento === 'credito'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600'
                      }`}
                    >
                      Crédito (+)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, tipoMovimiento: 'debito' })}
                      className={`py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        formData.tipoMovimiento === 'debito'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'text-slate-600'
                      }`}
                    >
                      Débito (-)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">
                    Fecha del Movimiento
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fecha}
                    onChange={(e) => {
                      const val = e.target.value;
                      const [y, m, d] = val.split('-');
                      setFormData({
                        ...formData,
                        fecha: val,
                        fechaTexto: d && m && y ? `${d}/${m}/${y}` : val
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">
                  Descripción en Estado de Cuenta / Concepto
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. N/CREDITO TRANSFERENCIA ELECTRONICA TIF / Pago cuota socio..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Categoría y Monto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">
                    Categoría Contable
                  </label>
                  <select
                    value={formData.categoriaContable}
                    onChange={(e) => setFormData({ ...formData, categoriaContable: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {(formData.cuentaId === 'admin_3827008588'
                      ? CATEGORIAS_ADMIN
                      : CATEGORIAS_CUEVA
                    ).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">
                    Monto en Quetzales (Q)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm font-mono font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Nota de Auditoría opcional */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">
                  Nota de Tesorería / Observación (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Boleta #12345 o referencia de socio..."
                  value={formData.notaAuditor}
                  onChange={(e) => setFormData({ ...formData, notaAuditor: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSyncing}
                  className="flex-1 py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
                >
                  {editingId ? 'Guardar Cambios' : 'Registrar en Libro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
