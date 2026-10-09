import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Briefcase, 
  TrendingUp, 
  Tags, 
  Activity, 
  CheckCircle, 
  FileSpreadsheet,
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
  ArrowUpRight
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
  YAxis 
} from 'recharts';
import { firebaseService } from '../services/firebaseService';
import { useClubData } from '../context/ClubDataContext';
import { RubroPresupuesto, FondoPresupuesto, AsignacionComision, Comision } from '../types';
import { useModal } from '../context/ModalContext';
import { GoogleSheetsImporterModal } from '../components/GoogleSheetsImporterModal';

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

export const Presupuestos: React.FC = () => {
  const { showAlert, showConfirm } = useModal();

  // Pestañas principales
  const [activeTab, setActiveTab] = useState<'anual' | 'asignaciones' | 'fondos' | 'rubros'>('anual');
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  
  // Datos globales desde ClubDataContext
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
  
  // Filtros del Presupuesto Anual
  const [fiscalYear, setFiscalYear] = useState('2025 - 2026');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterComision, setFilterComision] = useState('todas');
  const [filterTemporalidad, setFilterTemporalidad] = useState('todas');

  // Modal de edición rápida
  const [editingAsignacion, setEditingAsignacion] = useState<AsignacionComision | null>(null);
  const [editForm, setEditForm] = useState({
    monto: '',
    temporalidad: 'Mensual' as AsignacionComision['temporalidad'],
    descripcion: '',
    actividad: ''
  });

  // Formularios para creación manual
  const [rubroForm, setRubroForm] = useState({ codigo: '', nombre: '', descripcion: '' });
  const [fondoForm, setFondoForm] = useState({ tipo: 'Cuotas' as FondoPresupuesto['tipo'], monto: '', descripcion: '' });
  const [asignacionForm, setAsignacionForm] = useState({ 
    comision: '', 
    monto: '', 
    rubroId: '', 
    temporalidad: 'Mensual' as AsignacionComision['temporalidad'], 
    actividad: '', 
    descripcion: '' 
  });

  // Multiplicador según temporalidad para la proyección a 12 meses
  const getMultiplier = (temporalidad: AsignacionComision['temporalidad']): number => {
    switch (temporalidad) {
      case 'Mensual': return 12;
      case 'Bimensual': return 6;
      case 'Trimestral': return 4;
      case 'Semestral': return 2;
      case 'Anual': return 1;
      case 'Unica': return 1;
      default: return 1;
    }
  };

  const getAnnualTotal = (asig: AsignacionComision): number => {
    return (Number(asig.monto) || 0) * getMultiplier(asig.temporalidad);
  };

  // Cálculos consolidados
  const totalFondosIngresados = useMemo(() => {
    return fondos.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);
  }, [fondos]);

  const totalPresupuestoAnual = useMemo(() => {
    return asignaciones.reduce((acc, curr) => acc + getAnnualTotal(curr), 0);
  }, [asignaciones]);

  const balanceProyectado = totalFondosIngresados - totalPresupuestoAnual;

  // Filtrado de asignaciones para la tabla de revisión
  const filteredAsignaciones = useMemo(() => {
    return asignaciones.filter(asig => {
      const comisionObj = comisiones.find(c => c.id === asig.comision || c.nombre === asig.comision);
      const comisionNombre = comisionObj ? comisionObj.nombre : asig.comision;
      const rubroObj = rubros.find(r => r.id === asig.rubroId);
      const rubroNombre = rubroObj ? `${rubroObj.codigo} ${rubroObj.nombre}` : '';

      const matchText = !searchQuery.trim() || 
        comisionNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rubroNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asig.actividad || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asig.descripcion || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchComision = filterComision === 'todas' || 
        asig.comision === filterComision || 
        comisionNombre === filterComision;

      const matchTempo = filterTemporalidad === 'todas' || asig.temporalidad === filterTemporalidad;

      return matchText && matchComision && matchTempo;
    });
  }, [asignaciones, comisiones, rubros, searchQuery, filterComision, filterTemporalidad]);

  // Datos para gráficos de recharts
  const datosPorComision = useMemo(() => {
    const map = new Map<string, number>();
    asignaciones.forEach(asig => {
      const comisionObj = comisiones.find(c => c.id === asig.comision || c.nombre === asig.comision);
      const name = comisionObj ? comisionObj.nombre : (asig.comision || 'Comisión General');
      const val = getAnnualTotal(asig);
      map.set(name, (map.get(name) || 0) + val);
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [asignaciones, comisiones]);

  const datosPorRubro = useMemo(() => {
    const map = new Map<string, number>();
    asignaciones.forEach(asig => {
      const rubroObj = rubros.find(r => r.id === asig.rubroId);
      const name = rubroObj ? rubroObj.nombre : 'Sin Rubro';
      const val = getAnnualTotal(asig);
      map.set(name, (map.get(name) || 0) + val);
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [asignaciones, rubros]);

  // Handlers de Guardado
  const handleSaveRubro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rubroForm.codigo || !rubroForm.nombre) return;
    
    const newRubro: RubroPresupuesto = {
      id: `rubro-${Date.now()}`,
      ...rubroForm,
      fechaCreacion: new Date().toISOString(),
      activo: true
    };
    
    await firebaseService.saveRubroPresupuesto(newRubro);
    setRubroForm({ codigo: '', nombre: '', descripcion: '' });
  };

  const handleDeleteRubro = async (id: string) => {
    if (await showConfirm("Eliminar Rubro", "¿Eliminar este rubro permanentemente?", { type: 'danger', confirmText: 'Eliminar', cancelText: 'Cancelar' })) {
      await firebaseService.deleteRubroPresupuesto(id);
    }
  };

  const handleSaveFondo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fondoForm.monto || !fondoForm.descripcion) return;
    
    const newFondo: FondoPresupuesto = {
      id: `fondo-${Date.now()}`,
      tipo: fondoForm.tipo,
      monto: parseFloat(fondoForm.monto),
      descripcion: fondoForm.descripcion,
      fecha: new Date().toISOString()
    };
    
    await firebaseService.saveFondoPresupuesto(newFondo);
    setFondoForm({ tipo: 'Cuotas', monto: '', descripcion: '' });
  };

  const handleDeleteFondo = async (id: string) => {
    if (await showConfirm("Eliminar Ingreso", "¿Eliminar este ingreso permanentemente?", { type: 'danger', confirmText: 'Eliminar', cancelText: 'Cancelar' })) {
      await firebaseService.deleteFondoPresupuesto(id);
    }
  };

  const handleSaveAsignacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asignacionForm.comision || !asignacionForm.monto || !asignacionForm.rubroId) return;
    
    const newAsignacion: AsignacionComision = {
      id: `asig-${Date.now()}`,
      ...asignacionForm,
      monto: parseFloat(asignacionForm.monto),
      fechaCreacion: new Date().toISOString()
    };
    
    await firebaseService.saveAsignacionComision(newAsignacion);
    setAsignacionForm({ comision: '', monto: '', rubroId: '', temporalidad: 'Mensual', actividad: '', descripcion: '' });
  };

  const handleDeleteAsignacion = async (id: string) => {
    if (await showConfirm("Eliminar Asignación", "¿Eliminar este rubro presupuestario permanentemente?", { type: 'danger', confirmText: 'Eliminar', cancelText: 'Cancelar' })) {
      await firebaseService.deleteAsignacionComision(id);
    }
  };

  // Edición rápida inline
  const handleOpenEdit = (asig: AsignacionComision) => {
    setEditingAsignacion(asig);
    setEditForm({
      monto: String(asig.monto),
      temporalidad: asig.temporalidad,
      descripcion: asig.descripcion,
      actividad: asig.actividad || ''
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsignacion) return;

    const updated: AsignacionComision = {
      ...editingAsignacion,
      monto: parseFloat(editForm.monto) || 0,
      temporalidad: editForm.temporalidad,
      descripcion: editForm.descripcion,
      actividad: editForm.actividad
    };

    await firebaseService.saveAsignacionComision(updated);
    setEditingAsignacion(null);
  };

  // Exportar a CSV
  const handleExportCSV = () => {
    if (filteredAsignaciones.length === 0) {
      showAlert("Exportar Presupuesto", "No hay registros disponibles para exportar con los filtros actuales.");
      return;
    }

    const headers = ["Comisión", "Rubro Código", "Rubro Nombre", "Concepto / Actividad", "Detalle", "Temporalidad", "Monto Base (Q)", "Multiplicador Anual", "Total Anual Estimado (Q)"];
    const rows = filteredAsignaciones.map(asig => {
      const comisionObj = comisiones.find(c => c.id === asig.comision || c.nombre === asig.comision);
      const comisionNombre = comisionObj ? comisionObj.nombre : asig.comision;
      const rubroObj = rubros.find(r => r.id === asig.rubroId);
      const mult = getMultiplier(asig.temporalidad);
      const annual = getAnnualTotal(asig);

      return [
        `"${comisionNombre.replace(/"/g, '""')}"`,
        `"${rubroObj ? rubroObj.codigo : ''}"`,
        `"${(rubroObj ? rubroObj.nombre : 'Sin Rubro').replace(/"/g, '""')}"`,
        `"${(asig.actividad || '').replace(/"/g, '""')}"`,
        `"${(asig.descripcion || '').replace(/"/g, '""')}"`,
        `"${asig.temporalidad}"`,
        (asig.monto || 0).toFixed(2),
        mult,
        annual.toFixed(2)
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Presupuesto_Anual_Club_de_Leones_${fiscalYear.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Imprimir reporte oficial
  const handlePrint = () => {
    window.print();
  };

  // Cargar modelo base con 1 clic si está vacío
  const handleLoadTemplateModel = async () => {
    if (await showConfirm(
      "Cargar Modelo de Ejemplo", 
      "¿Deseas inicializar el presupuesto anual con los 5 ejes globales de servicio del Club de Leones (Visión, Hambre, Cáncer Infantil, Diabetes y Medio Ambiente)?",
      { confirmText: "Cargar Modelo", cancelText: "Cancelar" }
    )) {
      const rubrosModelo = [
        { codigo: 'SAL-01', nombre: 'Campaña de la Vista y Salud Visual', descripcion: 'Lentes, consultas oftalmológicas y jornadas visuales' },
        { codigo: 'HAM-02', nombre: 'Mitigación del Hambre y Alimentos', descripcion: 'Nevera solidaria, despensas comunitarias' },
        { codigo: 'CAN-03', nombre: 'Cáncer Pediátrico y Medicamentos', descripcion: 'Apoyo a familias con niños en tratamiento oncologico' },
        { codigo: 'DIA-04', nombre: 'Detección y Prevención de Diabetes', descripcion: 'Glucómetros, pruebas rápidas y charlas' },
        { codigo: 'AMB-05', nombre: 'Medio Ambiente y Reforestación', descripcion: 'Jornadas de siembra de árboles y limpieza' },
        { codigo: 'ADM-06', nombre: 'Operación y Sede Leonística', descripcion: 'Servicios de sede, insumos administrativos y mantenimiento' },
      ];

      for (const r of rubrosModelo) {
        const rId = `rubro-mod-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
        await firebaseService.saveRubroPresupuesto({
          id: rId,
          codigo: r.codigo,
          nombre: r.nombre,
          descripcion: r.descripcion,
          fechaCreacion: new Date().toISOString(),
          activo: true
        });

        // Crear asignación base anual
        await firebaseService.saveAsignacionComision({
          id: `asig-mod-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          comision: r.nombre.split(' ')[0] + ' ' + (r.nombre.split(' ')[1] || ''),
          monto: r.codigo.startsWith('ADM') ? 800 : 1200,
          rubroId: rId,
          temporalidad: r.codigo.startsWith('ADM') ? 'Mensual' : 'Trimestral',
          actividad: r.nombre,
          descripcion: `Presupuesto operativo base anual: ${r.descripcion}`,
          fechaCreacion: new Date().toISOString()
        });
      }

      showAlert("Plantilla Cargada", "Se han registrado con éxito los rubros y asignaciones del modelo león.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-12">
      
      {/* Encabezado Principal y Sincronizador */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-[2.5rem] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-blue-900/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-400/30 text-yellow-300 text-[11px] font-black uppercase tracking-wider">
              <Sparkles size={13} />
              <span>Gestión Financiera Institucional</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Presupuesto Anual y Control Presupuestario
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              Club de Leones Quetzaltenango • Formato consolidado para consulta, revisión directiva y aprobación de asamblea.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsSheetsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <FileSpreadsheet size={16} />
              <span>Importar Google Sheet / Excel</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider border border-white/20 flex items-center gap-2 transition-all"
            >
              <Download size={15} />
              <span>Exportar CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider border border-white/20 flex items-center gap-2 transition-all print:hidden"
            >
              <Printer size={15} />
              <span>Imprimir</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards: Resumen Financiero Anual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: Presupuesto Anual Proyectado */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-blue-400 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Plan Anual Proyectado</p>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <DollarSign size={20} />
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-800 mt-3 tracking-tight">
            Q{totalPresupuestoAnual.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
          </h2>
          <p className="text-[11px] font-bold text-slate-500 mt-2 flex items-center gap-1.5">
            <Layers size={13} className="text-blue-500" />
            Distribuido en {asignaciones.length} rubros y acciones
          </p>
        </div>

        {/* KPI 2: Fondos e Ingresos Disponibles */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Ingresos Registrados</p>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-800 mt-3 tracking-tight">
            Q{totalFondosIngresados.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
          </h2>
          <p className="text-[11px] font-bold text-emerald-600 mt-2 flex items-center gap-1.5">
            <CheckCircle size={13} />
            {fondos.length} depósitos registrados
          </p>
        </div>

        {/* KPI 3: Balance Proyectado */}
        <div className={`rounded-3xl p-6 border shadow-sm relative overflow-hidden transition-all ${
          balanceProyectado >= 0 
            ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-500 shadow-emerald-500/20' 
            : 'bg-gradient-to-br from-amber-600 to-rose-700 text-white border-rose-500 shadow-rose-500/20'
        }`}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-widest opacity-80">
              {balanceProyectado >= 0 ? 'Superávit Proyectado' : 'Déficit Proyectado'}
            </p>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/20 border border-white/30">
              {balanceProyectado >= 0 ? 'Sostenible' : 'Requiere Fondos'}
            </span>
          </div>
          <h2 className="text-3xl font-black mt-3 tracking-tight">
            Q{Math.abs(balanceProyectado).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
          </h2>
          <p className="text-[11px] font-medium opacity-90 mt-2">
            {balanceProyectado >= 0 
              ? 'Cobertura total garantizada con ingresos actuales' 
              : 'Diferencia a recaudar mediante actividades o cuotas'}
          </p>
        </div>

        {/* KPI 4: Cobertura Financiera */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-indigo-400 transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Tasa de Cobertura</p>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Activity size={20} />
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-800 mt-3 tracking-tight">
            {totalPresupuestoAnual > 0 
              ? `${Math.min(100, Math.round((totalFondosIngresados / totalPresupuestoAnual) * 100))}%` 
              : '100%'}
          </h2>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                totalFondosIngresados >= totalPresupuestoAnual ? 'bg-emerald-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.min(100, totalPresupuestoAnual > 0 ? (totalFondosIngresados / totalPresupuestoAnual) * 100 : 100)}%` }}
            />
          </div>
        </div>

      </div>

      {/* Selector de Pestañas */}
      <div className="flex flex-wrap bg-slate-100/90 backdrop-blur-md p-1.5 rounded-2xl shadow-inner border border-slate-200/60 gap-1 print:hidden">
        <button 
          onClick={() => setActiveTab('anual')}
          className={`flex-1 min-w-[180px] py-3 text-xs sm:text-sm font-black transition-all duration-300 rounded-xl flex items-center justify-center space-x-2 ${
            activeTab === 'anual' 
              ? 'bg-white shadow-md text-blue-900 transform scale-[1.01]' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <BarChart3 size={16} className={activeTab === 'anual' ? 'text-blue-700' : 'text-slate-400'} />
          <span>Presupuesto Anual (Revisión)</span>
        </button>

        <button 
          onClick={() => setActiveTab('asignaciones')}
          className={`flex-1 min-w-[160px] py-3 text-xs sm:text-sm font-black transition-all duration-300 rounded-xl flex items-center justify-center space-x-2 ${
            activeTab === 'asignaciones' 
              ? 'bg-white shadow-md text-emerald-700 transform scale-[1.01]' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <Briefcase size={16} className={activeTab === 'asignaciones' ? 'text-emerald-600' : 'text-slate-400'} />
          <span>Asignar Comisiones</span>
        </button>

        <button 
          onClick={() => setActiveTab('fondos')}
          className={`flex-1 min-w-[160px] py-3 text-xs sm:text-sm font-black transition-all duration-300 rounded-xl flex items-center justify-center space-x-2 ${
            activeTab === 'fondos' 
              ? 'bg-white shadow-md text-purple-700 transform scale-[1.01]' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <TrendingUp size={16} className={activeTab === 'fondos' ? 'text-purple-600' : 'text-slate-400'} />
          <span>Ingreso de Fondos</span>
        </button>

        <button 
          onClick={() => setActiveTab('rubros')}
          className={`flex-1 min-w-[160px] py-3 text-xs sm:text-sm font-black transition-all duration-300 rounded-xl flex items-center justify-center space-x-2 ${
            activeTab === 'rubros' 
              ? 'bg-white shadow-md text-indigo-700 transform scale-[1.01]' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <Tags size={16} className={activeTab === 'rubros' ? 'text-indigo-600' : 'text-slate-400'} />
          <span>Catálogo de Rubros</span>
        </button>
      </div>

      {/* CONTENIDO DE PESTAÑAS */}

      {/* 1. TAB: PRESUPUESTO ANUAL (CONSULTA Y REVISIÓN) */}
      {activeTab === 'anual' && (
        <div className="space-y-8">
          
          {/* Barra de Filtros y Búsqueda */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              
              {/* Buscador */}
              <div className="relative flex-1">
                <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por rubro, comisión, actividad o justificación..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* Filtros Dropdowns */}
              <div className="flex flex-wrap items-center gap-3">
                
                {/* Periodo Fiscal */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                  <Calendar size={14} className="text-slate-400" />
                  <span className="text-[10px] font-black uppercase text-slate-400">Año:</span>
                  <select
                    value={fiscalYear}
                    onChange={(e) => setFiscalYear(e.target.value)}
                    className="bg-transparent text-xs font-black text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="2025 - 2026">2025 - 2026</option>
                    <option value="2024 - 2025">2024 - 2025</option>
                    <option value="2026">2026</option>
                  </select>
                </div>

                {/* Filtro Comisión */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                  <Filter size={14} className="text-slate-400" />
                  <span className="text-[10px] font-black uppercase text-slate-400">Comisión:</span>
                  <select
                    value={filterComision}
                    onChange={(e) => setFilterComision(e.target.value)}
                    className="bg-transparent text-xs font-black text-slate-800 outline-none cursor-pointer max-w-[140px] truncate"
                  >
                    <option value="todas">Todas</option>
                    {comisiones.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro Temporalidad */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                  <span className="text-[10px] font-black uppercase text-slate-400">Frecuencia:</span>
                  <select
                    value={filterTemporalidad}
                    onChange={(e) => setFilterTemporalidad(e.target.value)}
                    className="bg-transparent text-xs font-black text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="todas">Todas</option>
                    <option value="Mensual">Mensual</option>
                    <option value="Trimestral">Trimestral</option>
                    <option value="Semestral">Semestral</option>
                    <option value="Anual">Anual</option>
                    <option value="Unica">Única</option>
                  </select>
                </div>

              </div>
            </div>
          </div>

          {/* Sección de Gráficos Analíticos */}
          {asignaciones.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
              
              {/* Gráfico 1: Distribución por Comisión (Pie Chart) */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">
                      Distribución por Comisión
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">Porcentaje sobre el total anual</p>
                  </div>
                  <PieChartIcon size={18} className="text-slate-400" />
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={datosPorComision}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {datosPorComision.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PALETA_COLORES[index % PALETA_COLORES.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: any) => [`Q${Number(value).toLocaleString('es-GT', {minimumFractionDigits: 2})}`, 'Total Anual']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1.5 mt-2 max-h-36 overflow-y-auto pr-1">
                  {datosPorComision.map((item, idx) => {
                    const pct = totalPresupuestoAnual > 0 ? ((item.value / totalPresupuestoAnual) * 100).toFixed(1) : '0';
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PALETA_COLORES[idx % PALETA_COLORES.length] }} />
                          <span className="font-bold text-slate-700 truncate">{item.name}</span>
                        </div>
                        <div className="text-right shrink-0 font-black text-slate-800">
                          <span>Q{item.value.toLocaleString('es-GT', { maximumFractionDigits: 0 })}</span>
                          <span className="text-[10px] text-slate-400 ml-1.5">({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gráfico 2: Mayores Asignaciones Anuales (Bar Chart) */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">
                      Top Rubros con Mayor Inversión
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">Proyección anual por categoría en Quetzales (Q)</p>
                  </div>
                  <BarChart3 size={18} className="text-slate-400" />
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={datosPorRubro} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <XAxis type="number" tickFormatter={(v) => `Q${v.toLocaleString()}`} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fontWeight: 'bold' }} />
                      <RechartsTooltip 
                        formatter={(value: any) => [`Q${Number(value).toLocaleString('es-GT', {minimumFractionDigits: 2})}`, 'Total Anual']}
                      />
                      <Bar dataKey="value" fill="#2563eb" radius={[0, 8, 8, 0]}>
                        {datosPorRubro.map((entry, index) => (
                          <Cell key={`bar-${index}`} fill={PALETA_COLORES[index % PALETA_COLORES.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

          {/* Cuadro Matriz de Revisión y Consulta del Presupuesto Anual */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            
            {/* Cabecera de la tabla */}
            <div className="p-6 border-b border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50">
              <div>
                <h3 className="font-black text-slate-800 text-base">
                  Matriz Anual de Rubros y Acciones
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {filteredAsignaciones.length} partidas presupuestarias encontradas • Periodo {fiscalYear}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Proyectado Filtro</span>
                <span className="text-xl font-black text-blue-900">
                  Q{filteredAsignaciones.reduce((acc, c) => acc + getAnnualTotal(c), 0).toLocaleString('es-GT', {minimumFractionDigits: 2})}
                </span>
              </div>
            </div>

            {/* Tabla Responsive */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="py-3.5 px-4">Comisión / Responsable</th>
                    <th className="py-3.5 px-4">Rubro Contable</th>
                    <th className="py-3.5 px-4">Actividad o Justificación</th>
                    <th className="py-3.5 px-4 text-center">Temporalidad</th>
                    <th className="py-3.5 px-4 text-right">Asignación Base</th>
                    <th className="py-3.5 px-4 text-center">Frecuencia</th>
                    <th className="py-3.5 px-4 text-right">Total Anual (Q)</th>
                    <th className="py-3.5 px-4 text-center print:hidden">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredAsignaciones.map((asig, index) => {
                    const comisionObj = comisiones.find(c => c.id === asig.comision || c.nombre === asig.comision);
                    const comisionNombre = comisionObj ? comisionObj.nombre : asig.comision;
                    const rubroObj = rubros.find(r => r.id === asig.rubroId);
                    const mult = getMultiplier(asig.temporalidad);
                    const annualTotal = getAnnualTotal(asig);

                    return (
                      <tr key={asig.id} className="hover:bg-slate-50/80 transition-colors group">
                        
                        {/* Comisión */}
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-black text-[10px] shrink-0">
                              {comisionNombre.charAt(0).toUpperCase()}
                            </span>
                            <span className="truncate max-w-[170px]" title={comisionNombre}>
                              {comisionNombre}
                            </span>
                          </div>
                        </td>

                        {/* Rubro */}
                        <td className="py-3.5 px-4">
                          {rubroObj ? (
                            <div>
                              <span className="inline-block px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[9px] font-black uppercase border border-indigo-100">
                                {rubroObj.codigo}
                              </span>
                              <p className="font-bold text-slate-800 text-[11px] mt-0.5 truncate max-w-[150px]" title={rubroObj.nombre}>
                                {rubroObj.nombre}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Sin clasificar</span>
                          )}
                        </td>

                        {/* Actividad / Detalle */}
                        <td className="py-3.5 px-4 max-w-[240px]">
                          <p className="font-bold text-slate-800 truncate" title={asig.actividad || asig.descripcion}>
                            {asig.actividad || asig.descripcion}
                          </p>
                          {asig.actividad && asig.descripcion && asig.actividad !== asig.descripcion && (
                            <p className="text-[10px] text-slate-400 truncate mt-0.5" title={asig.descripcion}>
                              {asig.descripcion}
                            </p>
                          )}
                        </td>

                        {/* Temporalidad Badge */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            asig.temporalidad === 'Mensual' ? 'bg-blue-100 text-blue-800' :
                            asig.temporalidad === 'Trimestral' ? 'bg-amber-100 text-amber-800' :
                            asig.temporalidad === 'Semestral' ? 'bg-purple-100 text-purple-800' :
                            asig.temporalidad === 'Anual' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {asig.temporalidad}
                          </span>
                        </td>

                        {/* Monto Base */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-600">
                          Q{(asig.monto || 0).toLocaleString('es-GT', {minimumFractionDigits: 2})}
                        </td>

                        {/* Multiplicador */}
                        <td className="py-3.5 px-4 text-center text-slate-400 font-bold">
                          × {mult}
                        </td>

                        {/* Total Anual */}
                        <td className="py-3.5 px-4 text-right font-mono font-black text-blue-900 text-sm">
                          Q{annualTotal.toLocaleString('es-GT', {minimumFractionDigits: 2})}
                        </td>

                        {/* Acciones */}
                        <td className="py-3.5 px-4 text-center print:hidden">
                          <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(asig)}
                              title="Editar monto o temporalidad"
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAsignacion(asig.id)}
                              title="Eliminar partida"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}

                  {filteredAsignaciones.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                          <FileSpreadsheet size={24} />
                        </div>
                        <p className="text-sm font-black text-slate-700">
                          No se encontraron partidas presupuestarias
                        </p>
                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                          {asignaciones.length === 0 
                            ? 'Aún no se han importado ni creado rubros presupuestarios para este periodo.' 
                            : 'Ningún rubro coincide con los filtros de búsqueda seleccionados.'}
                        </p>
                        {asignaciones.length === 0 && (
                          <div className="pt-2 flex items-center justify-center gap-3">
                            <button
                              type="button"
                              onClick={() => setIsSheetsModalOpen(true)}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm"
                            >
                              <FileSpreadsheet size={15} />
                              <span>Importar desde Google Sheets</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleLoadTemplateModel}
                              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2"
                            >
                              <Sparkles size={15} />
                              <span>Cargar Modelo de Ejemplo</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pie de tabla con totales */}
            {filteredAsignaciones.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 font-bold gap-2">
                <span>Total de partidas: {filteredAsignaciones.length}</span>
                <span className="text-sm font-black text-blue-950">
                  Gran Total Anual Proyectado: Q{filteredAsignaciones.reduce((acc, c) => acc + getAnnualTotal(c), 0).toLocaleString('es-GT', {minimumFractionDigits: 2})}
                </span>
              </div>
            )}

          </div>

        </div>
      )}

      {/* 2. TAB: ASIGNACIONES MANUALES A COMISIONES */}
      {activeTab === 'asignaciones' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 sm:p-8 shadow-xl shadow-slate-200/40">
              <div className="flex items-center space-x-4 border-b border-slate-100 pb-5 mb-6">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
                  <Briefcase size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg tracking-tight">Asignar Partida</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Distribuir presupuesto a comisiones</p>
                </div>
              </div>

              <form onSubmit={handleSaveAsignacion} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Comisión Responsable</label>
                  <select
                    required
                    value={asignacionForm.comision}
                    onChange={(e) => setAsignacionForm({...asignacionForm, comision: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Seleccione una comisión...</option>
                    {comisiones.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Rubro Contable</label>
                  <select
                    required
                    value={asignacionForm.rubroId}
                    onChange={(e) => setAsignacionForm({...asignacionForm, rubroId: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Seleccione un rubro...</option>
                    {rubros.map(r => (
                      <option key={r.id} value={r.id}>{r.codigo} - {r.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Monto Base (Q)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={asignacionForm.monto}
                      onChange={(e) => setAsignacionForm({...asignacionForm, monto: e.target.value})}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Temporalidad</label>
                    <select
                      value={asignacionForm.temporalidad}
                      onChange={(e) => setAsignacionForm({...asignacionForm, temporalidad: e.target.value as AsignacionComision['temporalidad']})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Mensual">Mensual (x12)</option>
                      <option value="Bimensual">Bimensual (x6)</option>
                      <option value="Trimestral">Trimestral (x4)</option>
                      <option value="Semestral">Semestral (x2)</option>
                      <option value="Anual">Anual (x1)</option>
                      <option value="Unica">Única (x1)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Actividad Asociada (Opcional)</label>
                  <input
                    type="text"
                    value={asignacionForm.actividad}
                    onChange={(e) => setAsignacionForm({...asignacionForm, actividad: e.target.value})}
                    placeholder="Ej. Jornada Oftalmológica de Primavera"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Justificación / Detalle</label>
                  <input
                    type="text"
                    required
                    value={asignacionForm.descripcion}
                    onChange={(e) => setAsignacionForm({...asignacionForm, descripcion: e.target.value})}
                    placeholder="Justificación del gasto o asignación"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2"
                  >
                    <Plus size={18} />
                    <span>Guardar Partida</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 sm:p-8 shadow-sm">
              <h3 className="font-black text-slate-800 text-lg mb-6">Partidas Asignadas</h3>
              <div className="space-y-4">
                {asignaciones.map(asig => {
                  const rubroObj = rubros.find(r => r.id === asig.rubroId);
                  const comisionObj = comisiones.find(c => c.id === asig.comision || c.nombre === asig.comision);
                  const comisionNombre = comisionObj ? comisionObj.nombre : asig.comision;
                  const mult = getMultiplier(asig.temporalidad);
                  const annualTotal = getAnnualTotal(asig);

                  return (
                    <div key={asig.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group relative">
                      <div className="absolute right-4 top-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenEdit(asig)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button 
                          onClick={() => handleDeleteAsignacion(asig.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xl shrink-0">
                            {comisionNombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-base font-black text-slate-800">{comisionNombre}</h4>
                            <p className="text-xs font-bold text-slate-500 mt-0.5">{asig.descripcion}</p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right pr-14">
                          <span className="text-lg font-black text-blue-900 block">Q{annualTotal.toLocaleString('es-GT', {minimumFractionDigits: 2})} / año</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Q{asig.monto.toLocaleString('es-GT', {minimumFractionDigits: 2})} ({asig.temporalidad})
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-wrap gap-2">
                        <span className="inline-flex items-center text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                          <Tags size={12} className="mr-1" />
                          Rubro: {rubroObj ? `${rubroObj.codigo} ${rubroObj.nombre}` : 'Sin clasificar'}
                        </span>
                        {asig.actividad && (
                          <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
                            <Activity size={12} className="mr-1" />
                            Actividad: {asig.actividad}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {asignaciones.length === 0 && (
                  <div className="text-center py-10 text-slate-400 text-sm font-bold">
                    No hay partidas asignadas. Puedes importarlas desde Google Sheets o agregar una arriba.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB: INGRESO DE FONDOS */}
      {activeTab === 'fondos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 sm:p-8 shadow-xl shadow-slate-200/40">
              <div className="flex items-center space-x-4 border-b border-slate-100 pb-5 mb-6">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl shrink-0">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg tracking-tight">Nuevo Ingreso</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Registrar disponibilidad de fondos</p>
                </div>
              </div>

              <form onSubmit={handleSaveFondo} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Tipo de Ingreso</label>
                  <select
                    value={fondoForm.tipo}
                    onChange={(e) => setFondoForm({...fondoForm, tipo: e.target.value as FondoPresupuesto['tipo']})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="Cuotas">Ingresos de Cuotas de Socios</option>
                    <option value="Autónomo">Ingresos Autónomos (Donaciones, Rentas)</option>
                    <option value="Actividad">Ingresos por Actividad o Evento</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Monto (Q)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={fondoForm.monto}
                    onChange={(e) => setFondoForm({...fondoForm, monto: e.target.value})}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Descripción / Referencia</label>
                  <input
                    type="text"
                    required
                    value={fondoForm.descripcion}
                    onChange={(e) => setFondoForm({...fondoForm, descripcion: e.target.value})}
                    placeholder="Ej. Recaudación Cuotas Periodo 2025"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-purple-600/20 transition-all flex items-center justify-center space-x-2"
                  >
                    <Plus size={18} />
                    <span>Registrar Ingreso</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 sm:p-8 shadow-sm">
              <h3 className="font-black text-slate-800 text-lg mb-6">Historial de Ingresos</h3>
              <div className="space-y-3">
                {fondos.map(fondo => (
                  <div key={fondo.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2.5 rounded-xl ${
                        fondo.tipo === 'Cuotas' ? 'bg-blue-50 text-blue-500' :
                        fondo.tipo === 'Autónomo' ? 'bg-purple-50 text-purple-500' :
                        'bg-orange-50 text-orange-500'
                      }`}>
                        <DollarSign size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{fondo.descripcion}</p>
                        <div className="flex items-center space-x-2 mt-1 text-[10px] font-bold text-slate-400">
                          <span>{new Date(fondo.fecha).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="uppercase tracking-wider">{fondo.tipo}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="font-black text-emerald-600">Q{fondo.monto.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span>
                      <button 
                        onClick={() => handleDeleteFondo(fondo.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {fondos.length === 0 && (
                  <div className="text-center py-10 text-slate-400 text-sm font-bold">
                    No hay ingresos registrados aún.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB: CONFIGURAR RUBROS */}
      {activeTab === 'rubros' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 sm:p-8 shadow-xl shadow-slate-200/40">
              <div className="flex items-center space-x-4 border-b border-slate-100 pb-5 mb-6">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
                  <Tags size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg tracking-tight">Crear Rubro</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Categorías contables del Club</p>
                </div>
              </div>

              <form onSubmit={handleSaveRubro} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Código de Rubro</label>
                  <input
                    type="text"
                    required
                    value={rubroForm.codigo}
                    onChange={(e) => setRubroForm({...rubroForm, codigo: e.target.value})}
                    placeholder="Ej. SER-01, HAM-02, ADM-03"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Nombre de la Categoría</label>
                  <input
                    type="text"
                    required
                    value={rubroForm.nombre}
                    onChange={(e) => setRubroForm({...rubroForm, nombre: e.target.value})}
                    placeholder="Ej. Salud y Prevención de la Ceguera"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Descripción</label>
                  <input
                    type="text"
                    value={rubroForm.descripcion}
                    onChange={(e) => setRubroForm({...rubroForm, descripcion: e.target.value})}
                    placeholder="Detalles sobre el uso del rubro"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2"
                  >
                    <Plus size={18} />
                    <span>Guardar Rubro</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-6 sm:p-8 shadow-sm">
              <h3 className="font-black text-slate-800 text-lg mb-6">Catálogo de Rubros</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rubros.map(rubro => (
                  <div key={rubro.id} className="flex items-start justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 transition-colors group">
                    <div>
                      <span className="inline-block bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider mb-2">
                        Código: {rubro.codigo}
                      </span>
                      <h4 className="text-sm font-black text-slate-800">{rubro.nombre}</h4>
                      {rubro.descripcion && (
                        <p className="text-xs text-slate-500 mt-1 font-medium">{rubro.descripcion}</p>
                      )}
                    </div>
                    <button 
                      onClick={() => handleDeleteRubro(rubro.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {rubros.length === 0 && (
                  <div className="col-span-full text-center py-10 text-slate-400 text-sm font-bold">
                    No hay rubros configurados.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDICIÓN RÁPIDA DE ASIGNACIÓN */}
      {editingAsignacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xl max-w-lg w-full space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Modificar Partida Presupuestaria</h3>
                <p className="text-xs text-slate-500">Ajustar valor, frecuencia o justificación</p>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingAsignacion(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Monto Base Periódico (Q)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editForm.monto}
                  onChange={(e) => setEditForm({...editForm, monto: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Temporalidad</label>
                <select
                  value={editForm.temporalidad}
                  onChange={(e) => setEditForm({...editForm, temporalidad: e.target.value as AsignacionComision['temporalidad']})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Mensual">Mensual (x12 al año)</option>
                  <option value="Bimensual">Bimensual (x6 al año)</option>
                  <option value="Trimestral">Trimestral (x4 al año)</option>
                  <option value="Semestral">Semestral (x2 al año)</option>
                  <option value="Anual">Anual (x1 al año)</option>
                  <option value="Unica">Única (x1)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Actividad o Concepto</label>
                <input
                  type="text"
                  value={editForm.actividad}
                  onChange={(e) => setEditForm({...editForm, actividad: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Justificación</label>
                <input
                  type="text"
                  required
                  value={editForm.descripcion}
                  onChange={(e) => setEditForm({...editForm, descripcion: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-900 font-bold flex items-center justify-between">
                <span>Impacto Anual Proyectado:</span>
                <span className="text-base font-black">
                  Q{((parseFloat(editForm.monto) || 0) * getMultiplier(editForm.temporalidad)).toLocaleString('es-GT', {minimumFractionDigits: 2})}
                </span>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAsignacion(null)}
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

      {/* MODAL: IMPORTADOR DESDE GOOGLE SHEETS */}
      <GoogleSheetsImporterModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
      />

    </div>
  );
};
