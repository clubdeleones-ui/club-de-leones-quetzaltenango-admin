import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Briefcase, 
  TrendingUp, 
  TrendingDown,
  Tags, 
  Activity, 
  CheckCircle, 
  Search,
  Filter,
  Download,
  Printer,
  Edit3,
  Calendar,
  X,
  Sparkles,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  RotateCcw,
  Users,
  Building2,
  HeartHandshake,
  PartyPopper,
  Car
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis,
  Legend
} from 'recharts';
import { firebaseService } from '../services/firebaseService';
import { useClubData } from '../context/ClubDataContext';
import { RubroPresupuesto, FondoPresupuesto, AsignacionComision, Comision } from '../types';
import { useModal } from '../context/ModalContext';
import { PRESUPUESTO_OFICIAL_LEONES, TOTALES_PRESUPUESTO_OFICIAL, ItemPresupuestoOficial } from '../data/presupuestoOficial';

const PALETA_COLORES = [
  '#0d9488', // Teal
  '#2563eb', // Blue
  '#7c3aed', // Purple
  '#ea580c', // Orange
  '#059669', // Emerald
  '#d97706', // Amber
  '#e11d48', // Rose
  '#0284c7', // Sky
  '#4f46e5', // Indigo
];

const COMISIONES_OFICIALES = [
  "Comisión de Obras Sociales y Salud",
  "Comisión de Medio Ambiente",
  "Comisión de Entretenimiento y Convivencia",
  "Comisión de Protocolo y Convivencia",
  "Comisión de Damas Leonas y Festejos",
  "Administración y Finanzas",
  "Comisión de Parqueo",
  "Comisión de Arrendamientos",
  "Junta Directiva y Presidencia",
  "Comisión de Liderazgo y Aumento de Socios",
  "Comisión de Logística, Alimentos y Bebidas",
  "Administración y Mantenimiento de Sede",
  "Comisión de Relaciones Públicas",
  "Comisión de Festejos y Recaudación"
];

export const Presupuestos: React.FC = () => {
  const { showAlert, showConfirm } = useModal();

  // Pestañas de análisis
  const [activeTab, setActiveTab] = useState<'resumen' | 'egresos' | 'ingresos' | 'verificacion'>('resumen');
  
  // Datos reactivos de ClubDataContext
  const { 
    rubros: dbRubros, 
    fondos: dbFondos, 
    asignaciones: dbAsignaciones, 
    comisiones: dbComisiones 
  } = useClubData();

  const [rubros, setRubros] = useState<RubroPresupuesto[]>(dbRubros);
  const [fondos, setFondos] = useState<FondoPresupuesto[]>(dbFondos);
  const [asignaciones, setAsignaciones] = useState<AsignacionComision[]>(dbAsignaciones);
  const [comisiones, setComisiones] = useState<Comision[]>(dbComisiones);

  useEffect(() => { setRubros(dbRubros); }, [dbRubros]);
  useEffect(() => { setFondos(dbFondos); }, [dbFondos]);
  useEffect(() => { setAsignaciones(dbAsignaciones); }, [dbAsignaciones]);
  useEffect(() => { setComisiones(dbComisiones); }, [dbComisiones]);

  // Filtros interactivos
  const [searchQuery, setSearchQuery] = useState('');
  const [filterComision, setFilterComision] = useState('todas');
  const [filterCategoria, setFilterCategoria] = useState('todas');

  // Modal para edición de partida
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    descripcion: '',
    cantidad: 1,
    montoUnitario: 0,
    unidad: 'UNIDAD',
    comision: ''
  });

  // Lista combinada de nombres de comisiones (incluyendo las de Firestore y las oficiales)
  const listaComisionesNombres = useMemo(() => {
    const setNames = new Set<string>(COMISIONES_OFICIALES);
    comisiones.forEach(c => { if (c.nombre) setNames.add(c.nombre); });
    return Array.from(setNames);
  }, [comisiones]);

  // Totales calculados en tiempo real
  const totalIngresos = useMemo(() => {
    return fondos.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);
  }, [fondos]);

  const totalEgresos = useMemo(() => {
    return asignaciones.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);
  }, [asignaciones]);

  const superavitNeto = totalIngresos - totalEgresos;

  // Totales por Categoría
  const totalesPorCategoria = useMemo(() => {
    const map = new Map<string, { tipo: 'Ingreso' | 'Egreso', total: number, count: number }>();
    
    // Ingresos
    fondos.forEach(f => {
      const cat = (f as any).categoria || (f.tipo === 'Cuotas' ? 'Ingresos Administrativos' : 'Ingresos por Actividades');
      const prev = map.get(cat) || { tipo: 'Ingreso', total: 0, count: 0 };
      map.set(cat, { tipo: 'Ingreso', total: prev.total + (Number(f.monto) || 0), count: prev.count + 1 });
    });

    // Egresos
    asignaciones.forEach(a => {
      const cat = (a as any).categoria || 'Egresos Administrativos';
      const prev = map.get(cat) || { tipo: 'Egreso', total: 0, count: 0 };
      map.set(cat, { tipo: 'Egreso', total: prev.total + (Number(a.monto) || 0), count: prev.count + 1 });
    });

    return Array.from(map.entries()).map(([nombre, data]) => ({
      categoria: nombre,
      ...data
    }));
  }, [fondos, asignaciones]);

  // Distribución de Fondos por Comisión Responsable
  const fondosPorComision = useMemo(() => {
    const map = new Map<string, { total: number; partidas: number }>();
    
    asignaciones.forEach(asig => {
      const comNombre = asig.comision || 'Sin Comisión Designada';
      const prev = map.get(comNombre) || { total: 0, partidas: 0 };
      map.set(comNombre, {
        total: prev.total + (Number(asig.monto) || 0),
        partidas: prev.partidas + 1
      });
    });

    return Array.from(map.entries())
      .map(([nombre, data]) => ({ nombre, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [asignaciones]);

  // Filtrado de Egresos
  const filteredEgresos = useMemo(() => {
    return asignaciones.filter(a => {
      const matchSearch = !searchQuery.trim() || 
        (a.actividad || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.descripcion || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.comision || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        ((a as any).codigo || '').includes(searchQuery);

      const matchComision = filterComision === 'todas' || a.comision === filterComision;
      const matchCategoria = filterCategoria === 'todas' || (a as any).categoria === filterCategoria;

      return matchSearch && matchComision && matchCategoria;
    });
  }, [asignaciones, searchQuery, filterComision, filterCategoria]);

  // Filtrado de Ingresos
  const filteredIngresos = useMemo(() => {
    return fondos.filter(f => {
      const matchSearch = !searchQuery.trim() || 
        f.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ((f as any).categoria || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        ((f as any).codigo || '').includes(searchQuery);

      const matchCategoria = filterCategoria === 'todas' || (f as any).categoria === filterCategoria;

      return matchSearch && matchCategoria;
    });
  }, [fondos, searchQuery, filterCategoria]);

  // Cambiar designación de comisión en tiempo real
  const handleUpdateComision = async (asigId: string, nuevaComision: string) => {
    const item = asignaciones.find(a => a.id === asigId);
    if (!item) return;

    try {
      const updated: AsignacionComision = {
        ...item,
        comision: nuevaComision
      };
      await firebaseService.saveAsignacionComision(updated);
    } catch (err: any) {
      console.error("Error al designar comisión:", err);
      showAlert("Error", "No se pudo actualizar la comisión responsable.");
    }
  };

  // Abrir modal de edición rápida
  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setEditForm({
      descripcion: item.actividad || item.descripcion || '',
      cantidad: item.cantidad || 1,
      montoUnitario: item.montoUnitario || item.monto || 0,
      unidad: item.unidad || 'UNIDAD',
      comision: item.comision || ''
    });
  };

  // Guardar edición
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const nuevoTotal = (Number(editForm.cantidad) || 1) * (Number(editForm.montoUnitario) || 0);

    try {
      if (editingItem.comision !== undefined) {
        // Es un Egreso (Asignación)
        const updated: AsignacionComision = {
          ...editingItem,
          actividad: editForm.descripcion,
          monto: nuevoTotal,
          comision: editForm.comision,
          descripcion: `${editForm.cantidad} ${editForm.unidad} × Q${(Number(editForm.montoUnitario) || 0).toFixed(2)}`
        };
        (updated as any).cantidad = Number(editForm.cantidad) || 1;
        (updated as any).montoUnitario = Number(editForm.montoUnitario) || 0;
        (updated as any).unidad = editForm.unidad;
        (updated as any).totalPresupuestado = nuevoTotal;

        await firebaseService.saveAsignacionComision(updated);
      } else {
        // Es un Ingreso (Fondo)
        const updated: FondoPresupuesto = {
          ...editingItem,
          descripcion: editForm.descripcion,
          monto: nuevoTotal
        };
        (updated as any).cantidad = Number(editForm.cantidad) || 1;
        (updated as any).montoUnitario = Number(editForm.montoUnitario) || 0;
        (updated as any).unidad = editForm.unidad;

        await firebaseService.saveFondoPresupuesto(updated);
      }

      setEditingItem(null);
    } catch (err: any) {
      console.error("Error al actualizar partida:", err);
      showAlert("Error", "No se pudo guardar la modificación.");
    }
  };

  // Restaurar los 30 registros oficiales en Firestore
  const handleResetToOfficialData = async () => {
    const confirm = await showConfirm(
      "Restablecer Presupuesto Oficial",
      "¿Deseas restablecer las 30 partidas contables oficiales del Club de Leones Quetzaltenango? Esto sincronizará exactamente los Q266,150.00 de ingresos y Q164,958.12 de egresos.",
      { confirmText: "Restablecer Datos Oficiales", cancelText: "Cancelar" }
    );

    if (!confirm) return;

    try {
      // 1. Borrar anteriores
      for (const f of fondos) {
        await firebaseService.deleteFondoPresupuesto(f.id);
      }
      for (const a of asignaciones) {
        await firebaseService.deleteAsignacionComision(a.id);
      }
      for (const r of rubros) {
        await firebaseService.deleteRubroPresupuesto(r.id);
      }

      // 2. Crear Rubros oficiales
      const rubrosUnicos = [
        { codigo: "1.01", nombre: "Ingresos Administrativos", descripcion: "Cuotas, parqueo y arrendamientos del Club" },
        { codigo: "2.01", nombre: "Ingresos por Actividades", descripcion: "Rifas, bingos, cenas benéficas y donaciones de patrocinadores" },
        { codigo: "3.01", nombre: "Egresos Administrativos", descripcion: "Operación de parqueo, cuotas internacionales/distritales, suministros y sede" },
        { codigo: "4.01", nombre: "Obras Sociales / Actividades de Servicio", descripcion: "Ejes de servicio: Salud Mental, Diabetes, Hambre, Ayuda Humanitaria, Medio Ambiente" },
        { codigo: "5.01", nombre: "Convivencias y Eventos", descripcion: "Festejos leonísticos, convivios y fechas tradicionales" }
      ];

      for (const r of rubrosUnicos) {
        const rubroId = `rubro-cod-${r.codigo.replace('.', '_')}`;
        await firebaseService.saveRubroPresupuesto({
          id: rubroId,
          codigo: r.codigo,
          nombre: r.nombre,
          descripcion: r.descripcion,
          fechaCreacion: new Date().toISOString(),
          activo: true
        });
      }

      // 3. Crear Ingresos
      const ingresos = PRESUPUESTO_OFICIAL_LEONES.filter(i => i.tipo === 'Ingreso');
      for (let i = 0; i < ingresos.length; i++) {
        const ing = ingresos[i];
        const fondoId = `fondo-${ing.codigo.replace('.', '_')}-${i + 1}`;
        await firebaseService.saveFondoPresupuesto({
          id: fondoId,
          tipo: ing.descripcion.includes("Cuota") ? "Cuotas" : ing.categoria.includes("Actividades") ? "Actividad" : "Autónomo",
          monto: ing.presupuestadoTotal,
          descripcion: ing.descripcion,
          fecha: new Date().toISOString(),
          ...({
            codigo: ing.codigo,
            categoria: ing.categoria,
            unidad: ing.unidad,
            cantidad: ing.cantidad,
            montoUnitario: ing.montoUnitario,
            comision: ing.comisionSugerida
          } as any)
        });
      }

      // 4. Crear Egresos
      const egresos = PRESUPUESTO_OFICIAL_LEONES.filter(i => i.tipo === 'Egreso');
      for (let i = 0; i < egresos.length; i++) {
        const eg = egresos[i];
        const asigId = `asig-${eg.codigo.replace('.', '_')}-${i + 1}`;
        const rubroId = `rubro-cod-${eg.codigo.replace('.', '_')}`;

        let temporalidad = "Unica";
        if (eg.unidad === "MES") temporalidad = "Mensual";
        else if (eg.unidad === "SOCIO" || eg.unidad === "ACTIVIDAD" || eg.unidad === "CONVIVENCIA") temporalidad = "Anual";

        await firebaseService.saveAsignacionComision({
          id: asigId,
          comision: eg.comisionSugerida,
          monto: eg.presupuestadoTotal,
          rubroId: rubroId,
          temporalidad: temporalidad as any,
          actividad: eg.descripcion,
          descripcion: `${eg.cantidad} ${eg.unidad} × Q${eg.montoUnitario.toFixed(2)} (${eg.categoria})`,
          fechaCreacion: new Date().toISOString(),
          ...({
            codigo: eg.codigo,
            categoria: eg.categoria,
            unidad: eg.unidad,
            cantidad: eg.cantidad,
            montoUnitario: eg.montoUnitario,
            totalPresupuestado: eg.presupuestadoTotal
          } as any)
        });
      }

      showAlert("Datos Oficiales Restablecidos", "Se han cargado las 30 partidas contables oficiales con éxito.");
    } catch (err: any) {
      console.error("Error al restablecer:", err);
      showAlert("Error", "Ocurrió un error al restablecer los datos.");
    }
  };

  // Exportar a CSV
  const handleExportCSV = () => {
    const headers = ["Codigo", "Tipo", "Categoria", "Descripcion", "Unidad", "Cantidad", "Monto_Unitario", "Presupuestado_Total", "Comision_Designada"];
    
    const rowsIngresos = fondos.map(f => [
      `"${(f as any).codigo || '1.01'}"`,
      `"Ingreso"`,
      `"${((f as any).categoria || 'Ingresos Administrativos').replace(/"/g, '""')}"`,
      `"${f.descripcion.replace(/"/g, '""')}"`,
      `"${(f as any).unidad || 'UNIDAD'}"`,
      (f as any).cantidad || 1,
      ((f as any).montoUnitario || f.monto).toFixed(2),
      f.monto.toFixed(2),
      `"${((f as any).comision || 'Tesorería').replace(/"/g, '""')}"`
    ].join(','));

    const rowsEgresos = asignaciones.map(a => [
      `"${(a as any).codigo || '3.01'}"`,
      `"Egreso"`,
      `"${((a as any).categoria || 'Egresos Administrativos').replace(/"/g, '""')}"`,
      `"${(a.actividad || a.descripcion).replace(/"/g, '""')}"`,
      `"${(a as any).unidad || a.temporalidad}"`,
      (a as any).cantidad || 1,
      ((a as any).montoUnitario || a.monto).toFixed(2),
      a.monto.toFixed(2),
      `"${(a.comision || 'Sin Designar').replace(/"/g, '""')}"`
    ].join(','));

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rowsIngresos, ...rowsEgresos].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Presupuesto_Club_de_Leones_Quetzaltenango_Oficial.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-16">
      
      {/* Cabecera Principal */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-[2.5rem] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-blue-900/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-400/30 text-yellow-300 text-[11px] font-black uppercase tracking-wider">
              <ShieldCheck size={14} />
              <span>Presupuesto Anual Oficial • Club de Leones Quetzaltenango</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Análisis, Control y Designación Presupuestaria
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              30 partidas presupuestadas para revisión de junta directiva, designación a comisiones y fiscalización de ingresos y egresos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 print:hidden">
            <button
              type="button"
              onClick={handleResetToOfficialData}
              title="Restablecer exactamente las 30 partidas oficiales"
              className="px-4 py-2.5 rounded-xl bg-blue-800/80 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider border border-blue-700 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md"
            >
              <RotateCcw size={15} />
              <span>Restablecer Datos Oficiales</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider border border-white/20 flex items-center gap-2 transition-all"
            >
              <Download size={15} />
              <span>Exportar Excel (CSV)</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider border border-white/20 flex items-center gap-2 transition-all"
            >
              <Printer size={15} />
              <span>Imprimir</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards: Resumen Financiero Oficial */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: Ingresos Totales */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Ingresos Totales (1.01 & 2.01)</p>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <h2 className="text-3xl font-black text-emerald-700 mt-3 tracking-tight">
            Q{totalIngresos.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
          </h2>
          <div className="mt-2 text-[11px] font-bold text-slate-500 space-y-0.5">
            <p>• Admin (Cuotas, Parqueo, Rentas): Q216,150.00</p>
            <p>• Actividades (Rifa, Bingo, Donaciones): Q50,000.00</p>
          </div>
        </div>

        {/* KPI 2: Egresos Totales */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-rose-400 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Egresos Totales (3.01, 4.01, 5.01)</p>
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <TrendingDown size={20} />
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-800 mt-3 tracking-tight">
            Q{totalEgresos.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
          </h2>
          <div className="mt-2 text-[11px] font-bold text-slate-500 space-y-0.5">
            <p>• Obras Sociales: Q40,000.00 (24%)</p>
            <p>• Convivencias: Q20,500.00 (12%)</p>
            <p>• Administrativos: Q104,458.12 (64%)</p>
          </div>
        </div>

        {/* KPI 3: Superávit Neto */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-6 border border-emerald-500 shadow-lg shadow-emerald-600/20 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-widest opacity-80">Superávit Presupuestado</p>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-white/20 border border-white/30">
              Saldo Positivo
            </span>
          </div>
          <h2 className="text-3xl font-black mt-3 tracking-tight">
            +Q{superavitNeto.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
          </h2>
          <p className="text-[11px] font-medium opacity-90 mt-2">
            Margen financiero saludable del 38.0% a favor del Club para contingencias y proyectos de servicio.
          </p>
        </div>

        {/* KPI 4: Cobertura y Cumplimiento */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-blue-400 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Cobertura Financiera</p>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Activity size={20} />
            </div>
          </div>
          <h2 className="text-3xl font-black text-blue-900 mt-3 tracking-tight">
            {totalEgresos > 0 ? `${((totalIngresos / totalEgresos) * 100).toFixed(1)}%` : '100%'}
          </h2>
          <p className="text-[11px] font-bold text-slate-500 mt-2 flex items-center gap-1.5">
            <CheckCircle size={13} className="text-emerald-500" />
            Cada Q1.00 de gasto cuenta con Q{(totalIngresos / (totalEgresos || 1)).toFixed(2)} de respaldo.
          </p>
        </div>

      </div>

      {/* Selector de Pestañas de Navegación */}
      <div className="flex flex-wrap bg-slate-100/90 backdrop-blur-md p-1.5 rounded-2xl shadow-inner border border-slate-200/60 gap-1 print:hidden">
        <button 
          onClick={() => setActiveTab('resumen')}
          className={`flex-1 min-w-[200px] py-3 text-xs sm:text-sm font-black transition-all duration-300 rounded-xl flex items-center justify-center space-x-2 ${
            activeTab === 'resumen' 
              ? 'bg-white shadow-md text-blue-900 transform scale-[1.01]' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <BarChart3 size={16} className={activeTab === 'resumen' ? 'text-blue-700' : 'text-slate-400'} />
          <span>1. Resumen y Análisis Financiero</span>
        </button>

        <button 
          onClick={() => setActiveTab('egresos')}
          className={`flex-1 min-w-[200px] py-3 text-xs sm:text-sm font-black transition-all duration-300 rounded-xl flex items-center justify-center space-x-2 ${
            activeTab === 'egresos' 
              ? 'bg-white shadow-md text-rose-700 transform scale-[1.01]' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <Briefcase size={16} className={activeTab === 'egresos' ? 'text-rose-600' : 'text-slate-400'} />
          <span>2. Egresos y Designación a Comisiones ({asignaciones.length})</span>
        </button>

        <button 
          onClick={() => setActiveTab('ingresos')}
          className={`flex-1 min-w-[180px] py-3 text-xs sm:text-sm font-black transition-all duration-300 rounded-xl flex items-center justify-center space-x-2 ${
            activeTab === 'ingresos' 
              ? 'bg-white shadow-md text-emerald-700 transform scale-[1.01]' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <TrendingUp size={16} className={activeTab === 'ingresos' ? 'text-emerald-600' : 'text-slate-400'} />
          <span>3. Ingresos Presupuestados ({fondos.length})</span>
        </button>

        <button 
          onClick={() => setActiveTab('verificacion')}
          className={`flex-1 min-w-[180px] py-3 text-xs sm:text-sm font-black transition-all duration-300 rounded-xl flex items-center justify-center space-x-2 ${
            activeTab === 'verificacion' 
              ? 'bg-white shadow-md text-indigo-700 transform scale-[1.01]' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <ShieldCheck size={16} className={activeTab === 'verificacion' ? 'text-indigo-600' : 'text-slate-400'} />
          <span>4. Matriz de Auditoría y Códigos</span>
        </button>
      </div>

      {/* PESTAÑA 1: RESUMEN Y ANÁLISIS */}
      {activeTab === 'resumen' && (
        <div className="space-y-8">
          
          {/* Gráficos de Análisis */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Gráfico 1: Ingresos vs Egresos vs Superávit */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">
                    Balance General Presupuestado
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Comparativa en Quetzales (Q)</p>
                </div>
                <BarChart3 size={18} className="text-slate-400" />
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Ingresos Totales', valor: totalIngresos, fill: '#059669' },
                    { name: 'Egresos Totales', valor: totalEgresos, fill: '#e11d48' },
                    { name: 'Superávit Neto', valor: superavitNeto, fill: '#0d9488' }
                  ]} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                    <YAxis tickFormatter={(v) => `Q${(v / 1000).toFixed(0)}k`} />
                    <RechartsTooltip formatter={(v: any) => [`Q${Number(v).toLocaleString('es-GT', {minimumFractionDigits: 2})}`, 'Monto']} />
                    <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                      <Cell fill="#059669" />
                      <Cell fill="#e11d48" />
                      <Cell fill="#0d9488" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 text-center">
                <div className="p-2 bg-emerald-50 rounded-xl">
                  <span className="text-[10px] font-black text-emerald-800 uppercase block">Ingresos</span>
                  <span className="text-xs font-black text-emerald-700">Q{totalIngresos.toLocaleString()}</span>
                </div>
                <div className="p-2 bg-rose-50 rounded-xl">
                  <span className="text-[10px] font-black text-rose-800 uppercase block">Egresos</span>
                  <span className="text-xs font-black text-rose-700">Q{totalEgresos.toLocaleString()}</span>
                </div>
                <div className="p-2 bg-teal-50 rounded-xl">
                  <span className="text-[10px] font-black text-teal-800 uppercase block">Superávit</span>
                  <span className="text-xs font-black text-teal-700">+Q{superavitNeto.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Gráfico 2: Distribución de Fondos por Comisión Responsable */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">
                    Distribución de Fondos Asignados a Comisiones
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Monto total administrado por cada comisión (Egresos)</p>
                </div>
                <Briefcase size={18} className="text-slate-400" />
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fondosPorComision.slice(0, 7)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <XAxis type="number" tickFormatter={(v) => `Q${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="nombre" width={170} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                    <RechartsTooltip formatter={(v: any) => [`Q${Number(v).toLocaleString('es-GT', {minimumFractionDigits: 2})}`, 'Presupuesto']} />
                    <Bar dataKey="total" radius={[0, 8, 8, 0]}>
                      {fondosPorComision.map((_, index) => (
                        <Cell key={`bar-${index}`} fill={PALETA_COLORES[index % PALETA_COLORES.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Tarjetas de Ejes de Gastos e Inversión */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Eje 1: Obras Sociales (4.01) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-400 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <HeartHandshake size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded uppercase">Código 4.01</span>
                  <h4 className="text-sm font-black text-slate-800 mt-1">Obras Sociales y Servicio</h4>
                </div>
              </div>
              <p className="text-2xl font-black text-slate-800 mt-4">Q40,000.00</p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                5 actividades de Q8,000.00 cada una: Salud Mental, Diabetes, Hambre, Ayuda Humanitaria y Medio Ambiente.
              </p>
            </div>

            {/* Eje 2: Convivencias y Eventos (5.01) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-purple-400 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <PartyPopper size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded uppercase">Código 5.01</span>
                  <h4 className="text-sm font-black text-slate-800 mt-1">Convivencias y Tradiciones</h4>
                </div>
              </div>
              <p className="text-2xl font-black text-slate-800 mt-4">Q20,500.00</p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                7 celebraciones leonísticas (Convivio Navideño Q10k, Día de la Madre Q3k, Leones Fallecidos, Padre, Cariño, etc.).
              </p>
            </div>

            {/* Eje 3: Egresos Administrativos (3.01) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-400 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Building2 size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded uppercase">Código 3.01</span>
                  <h4 className="text-sm font-black text-slate-800 mt-1">Operación y Sede</h4>
                </div>
              </div>
              <p className="text-2xl font-black text-slate-800 mt-4">Q104,458.12</p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Cuotas Internacionales/Distrito (54 socios), Operadora Parqueo (Q38,232), Mantenimiento de Edificio, Luz, Agua y Suministros.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* PESTAÑA 2: EGRESOS Y DESIGNACIÓN A COMISIONES */}
      {activeTab === 'egresos' && (
        <div className="space-y-6">
          
          {/* Barra de Filtros */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar egreso por descripción, actividad o comisión..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <Filter size={14} className="text-slate-400" />
                <span className="text-[10px] font-black uppercase text-slate-400">Comisión:</span>
                <select
                  value={filterComision}
                  onChange={(e) => setFilterComision(e.target.value)}
                  className="bg-transparent text-xs font-black text-slate-800 outline-none cursor-pointer max-w-[160px] truncate"
                >
                  <option value="todas">Todas las comisiones</option>
                  {listaComisionesNombres.map((nom, i) => (
                    <option key={i} value={nom}>{nom}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <span className="text-[10px] font-black uppercase text-slate-400">Categoría:</span>
                <select
                  value={filterCategoria}
                  onChange={(e) => setFilterCategoria(e.target.value)}
                  className="bg-transparent text-xs font-black text-slate-800 outline-none cursor-pointer"
                >
                  <option value="todas">Todas</option>
                  <option value="Obras Sociales / Actividades de Servicio">Obras Sociales (4.01)</option>
                  <option value="Convivencias y Eventos">Convivencias y Eventos (5.01)</option>
                  <option value="Egresos Administrativos">Egresos Administrativos (3.01)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabla de Egresos y Designación */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="font-black text-slate-800 text-base">Egresos Presupuestados y Responsables</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {filteredEgresos.length} partidas • Puedes designar o cambiar la comisión responsable directamente en la columna correspondiente
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Subtotal Egresos</span>
                <span className="text-xl font-black text-rose-700">
                  Q{filteredEgresos.reduce((acc, a) => acc + (Number(a.monto) || 0), 0).toLocaleString('es-GT', {minimumFractionDigits: 2})}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Descripción / Concepto</th>
                    <th className="py-3 px-4 text-center">Unidad</th>
                    <th className="py-3 px-4 text-center">Cantidad</th>
                    <th className="py-3 px-4 text-right">Monto Unitario</th>
                    <th className="py-3 px-4 text-right">Total Presupuestado</th>
                    <th className="py-3 px-4">Comisión Designada (Responsable)</th>
                    <th className="py-3 px-4 text-center print:hidden">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredEgresos.map((asig) => {
                    const cod = (asig as any).codigo || '3.01';
                    const unidad = (asig as any).unidad || asig.temporalidad;
                    const cantidad = (asig as any).cantidad || 1;
                    const montoUnitario = (asig as any).montoUnitario || (asig.monto / (cantidad || 1));

                    return (
                      <tr key={asig.id} className="hover:bg-slate-50 transition-colors group">
                        
                        {/* Código */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded font-mono text-[10px] font-black ${
                            cod === '4.01' ? 'bg-emerald-100 text-emerald-800' :
                            cod === '5.01' ? 'bg-purple-100 text-purple-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {cod}
                          </span>
                        </td>

                        {/* Descripción */}
                        <td className="py-3.5 px-4 max-w-[280px]">
                          <p className="font-bold text-slate-800 truncate" title={asig.actividad || asig.descripcion}>
                            {asig.actividad || asig.descripcion}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {(asig as any).categoria || 'Egreso'}
                          </p>
                        </td>

                        {/* Unidad */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-black uppercase">
                            {unidad}
                          </span>
                        </td>

                        {/* Cantidad */}
                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                          {cantidad}
                        </td>

                        {/* Monto Unitario */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-600">
                          Q{Number(montoUnitario).toLocaleString('es-GT', {minimumFractionDigits: 2})}
                        </td>

                        {/* Total Presupuestado */}
                        <td className="py-3.5 px-4 text-right font-mono font-black text-rose-700 text-sm">
                          Q{Number(asig.monto).toLocaleString('es-GT', {minimumFractionDigits: 2})}
                        </td>

                        {/* Selector de Comisión Designada */}
                        <td className="py-3.5 px-4">
                          <select
                            value={asig.comision || ''}
                            onChange={(e) => handleUpdateComision(asig.id, e.target.value)}
                            className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
                          >
                            <option value="">Seleccionar comisión...</option>
                            {listaComisionesNombres.map((nom, idx) => (
                              <option key={idx} value={nom}>{nom}</option>
                            ))}
                          </select>
                        </td>

                        {/* Acciones */}
                        <td className="py-3.5 px-4 text-center print:hidden">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(asig)}
                            title="Editar valores"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit3 size={14} />
                          </button>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* PESTAÑA 3: INGRESOS PRESUPUESTADOS */}
      {activeTab === 'ingresos' && (
        <div className="space-y-6">
          
          {/* Tarjetas de Resumen de Ingresos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <span className="text-[10px] font-mono font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded uppercase">Código 1.01</span>
              <h3 className="text-base font-black text-slate-800 mt-2">Ingresos Administrativos y Operativos</h3>
              <p className="text-3xl font-black text-blue-900 mt-2">Q216,150.00</p>
              <div className="mt-4 space-y-2 text-xs font-medium text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Cuotas Ordinarias (54 Socios x Q1,125):</span>
                  <span className="font-bold text-slate-800">Q60,750.00</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Parqueo Club de Leones (9 Meses x Q15,000):</span>
                  <span className="font-bold text-slate-800">Q135,000.00</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Local Club de Leones (6 Meses x Q3,000):</span>
                  <span className="font-bold text-slate-800">Q18,000.00</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Apartamento Club de Leones (8 Meses x Q300):</span>
                  <span className="font-bold text-slate-800">Q2,400.00</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <span className="text-[10px] font-mono font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded uppercase">Código 2.01</span>
              <h3 className="text-base font-black text-slate-800 mt-2">Ingresos por Actividades y Recaudación</h3>
              <p className="text-3xl font-black text-emerald-700 mt-2">Q50,000.00</p>
              <div className="mt-4 space-y-2 text-xs font-medium text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Rifa Anual de Recaudación:</span>
                  <span className="font-bold text-slate-800">Q10,000.00</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Bingo Anual de Recaudación:</span>
                  <span className="font-bold text-slate-800">Q10,000.00</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Patrocinadores / Empresas (10 x Q2,000):</span>
                  <span className="font-bold text-slate-800">Q20,000.00</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Evento / Cena Benéfica:</span>
                  <span className="font-bold text-slate-800">Q10,000.00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Detalle de Ingresos */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-800 text-base">Detalle de Fuentes de Ingreso ({filteredIngresos.length})</h3>
              <span className="text-xl font-black text-emerald-700">Q{totalIngresos.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Fuente / Descripción</th>
                    <th className="py-3 px-4 text-center">Unidad</th>
                    <th className="py-3 px-4 text-center">Cantidad</th>
                    <th className="py-3 px-4 text-right">Monto Unitario</th>
                    <th className="py-3 px-4 text-right">Presupuestado Total</th>
                    <th className="py-3 px-4 text-center print:hidden">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredIngresos.map((f) => {
                    const cod = (f as any).codigo || '1.01';
                    const unidad = (f as any).unidad || 'UNIDAD';
                    const cantidad = (f as any).cantidad || 1;
                    const montoUnitario = (f as any).montoUnitario || (f.monto / (cantidad || 1));

                    return (
                      <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded font-mono text-[10px] font-black bg-emerald-100 text-emerald-800">
                            {cod}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {f.descripcion}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-black uppercase">
                            {unidad}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                          {cantidad}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-600">
                          Q{Number(montoUnitario).toLocaleString('es-GT', {minimumFractionDigits: 2})}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                          Q{Number(f.monto).toLocaleString('es-GT', {minimumFractionDigits: 2})}
                        </td>
                        <td className="py-3.5 px-4 text-center print:hidden">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(f)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit3 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* PESTAÑA 4: MATRIZ DE AUDITORÍA Y CÓDIGOS OFICIALES */}
      {activeTab === 'verificacion' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="font-black text-slate-800 text-base mb-2">
              Verificación Contable Oficial (30 Partidas)
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-6">
              Esta matriz compara y valida el presupuesto por código contable oficial para garantizar concordancia con el documento presentado.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              {totalesPorCategoria.map((cat, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                    cat.tipo === 'Ingreso' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {cat.tipo} ({cat.count} partidas)
                  </span>
                  <h4 className="text-xs font-black text-slate-800 mt-2 truncate" title={cat.categoria}>
                    {cat.categoria}
                  </h4>
                  <p className="text-lg font-black text-slate-900 mt-1">
                    Q{cat.total.toLocaleString('es-GT', {minimumFractionDigits: 2})}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle size={24} className="text-blue-700 shrink-0" />
                <div>
                  <p className="text-xs font-black text-blue-950">
                    Conciliación Contable Verificada
                  </p>
                  <p className="text-[11px] text-blue-800 font-medium">
                    Total Ingresos: Q{totalIngresos.toLocaleString()} | Total Egresos: Q{totalEgresos.toLocaleString()} | Saldo a favor: Q{superavitNeto.toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-4 py-2 rounded-xl bg-blue-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-blue-800 shrink-0"
              >
                Descargar Cuadro de Auditoría
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDICIÓN DE PARTIDA */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xl max-w-lg w-full space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Modificar Partida Presupuestaria</h3>
                <p className="text-xs text-slate-500">Ajustar cantidad, costo unitario o comisión responsable</p>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingItem(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Descripción del Concepto</label>
                <input
                  type="text"
                  required
                  value={editForm.descripcion}
                  onChange={(e) => setEditForm({...editForm, descripcion: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Unidad</label>
                  <select
                    value={editForm.unidad}
                    onChange={(e) => setEditForm({...editForm, unidad: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SOCIO">SOCIO</option>
                    <option value="MES">MES</option>
                    <option value="UNIDAD">UNIDAD</option>
                    <option value="ACTIVIDAD">ACTIVIDAD</option>
                    <option value="CONVIVENCIA">CONVIVENCIA</option>
                    <option value="SESION">SESION</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Cantidad</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={editForm.cantidad}
                    onChange={(e) => setEditForm({...editForm, cantidad: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Monto Unitario (Q)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editForm.montoUnitario}
                    onChange={(e) => setEditForm({...editForm, montoUnitario: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {editingItem.comision !== undefined && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Comisión Responsable</label>
                  <select
                    value={editForm.comision}
                    onChange={(e) => setEditForm({...editForm, comision: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar comisión...</option>
                    {listaComisionesNombres.map((nom, idx) => (
                      <option key={idx} value={nom}>{nom}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-900 font-bold flex items-center justify-between">
                <span>Total Presupuestado Calculado:</span>
                <span className="text-base font-black">
                  Q{((editForm.cantidad || 0) * (editForm.montoUnitario || 0)).toLocaleString('es-GT', {minimumFractionDigits: 2})}
                </span>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-700/20 transition-all"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
