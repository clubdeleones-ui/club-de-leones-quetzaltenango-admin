import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Plus, Check, Send, ChevronDown, AlertTriangle, AlertCircle, CheckCircle, CreditCard, Download, DollarSign, X, Search, Filter, Calendar, Users, Edit, Trash2
} from 'lucide-react';
import { Socio, UserRole } from '../../types';
import { firebaseService } from '../../services/firebaseService';
import { useClubData } from '../../context/ClubDataContext';
import { generateReciboPagoPDF } from '../../utils/pdfGenerator';

export const AdminCuotas: React.FC = () => {
  const { socios: dbSocios } = useClubData();
  const [socios, setSocios] = useState<Socio[]>(dbSocios);

  React.useEffect(() => {
    setSocios(dbSocios);
  }, [dbSocios]);

  const [cuotasFilterStatus, setCuotasFilterStatus] = useState<'Todos' | 'al_dia' | 'pendiente' | 'en_mora'>('Todos');
  const [socioSearch, setSocioSearch] = useState('');
  const [selectedSocioForCuotas, setSelectedSocioForCuotas] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonthsToPay, setSelectedMonthsToPay] = useState<string[]>([]);
  const [editingPagoId, setEditingPagoId] = useState<string | null>(null);

  const [showRegistrarPagoModal, setShowRegistrarPagoModal] = useState(false);
  const [registrarPagoData, setRegistrarPagoData] = useState({
    socioId: '',
    tipoPeriodo: 'Mensual' as 'Mensual' | 'Semestral' | 'Anual',
    mes: 'Enero',
    semestre: '1er Semestre (Ene-Jun)',
    año: 2026,
    monto: 125,
    metodo: 'Efectivo' as 'Efectivo' | 'Transferencia' | 'Depósito',
    bancoReferencia: '',
    numeroReferencia: '',
    fechaPago: new Date().toISOString().split('T')[0]
  });

  const currentDate = useMemo(() => new Date(), []);
  const currentYear = useMemo(() => currentDate.getFullYear(), [currentDate]);
  const currentMonth = useMemo(() => currentDate.getMonth(), [currentDate]);

  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const isMonthPaid = (socio: Socio, monthName: string, year: number) => {
    return socio.historialPagos?.some(p => {
      const pPeriod = p.periodo.toLowerCase();
      if (pPeriod.includes(String(year))) {
        if (pPeriod.includes(monthName.toLowerCase())) return true;
        if (p.tipoPeriodo === 'Anual') return true;
        if (p.tipoPeriodo === 'Semestral') {
          const firstSem = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio'];
          const secondSem = ['julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
          if (pPeriod.includes('1er') && firstSem.includes(monthName.toLowerCase())) return true;
          if (pPeriod.includes('2do') && secondSem.includes(monthName.toLowerCase())) return true;
        }
      }
      return false;
    }) || false;
  };

  const getSocioUnpaidMonths = (socio: Socio) => {
    const unpaidMonths: { month: string; year: number }[] = [];
    
    // We start tracking from January 2026
    let startY = 2026;
    let startM = 0; // Enero
    
    const limitY = currentYear;
    const limitM = currentMonth;
    
    while (startY < limitY || (startY === limitY && startM <= limitM)) {
      const mName = months[startM];
      const paid = isMonthPaid(socio, mName, startY);
      if (!paid) {
        unpaidMonths.push({ month: mName, year: startY });
      }
      
      startM++;
      if (startM > 11) {
        startM = 0;
        startY++;
      }
    }
    return unpaidMonths;
  };

  const handleEnviarRecordatorio = (socio: Socio) => {
    const unpaid = getSocioUnpaidMonths(socio);
    const pendingBalance = unpaid.length * 125;
    alert(`Recordatorio de cobro de Q${pendingBalance} enviado por correo a: ${socio.correo}`);
  };

  const handleRegistrarPago = (socioId: string) => {
    const socio = socios.find(s => s.id === socioId);
    if (!socio) return;
    const unpaid = getSocioUnpaidMonths(socio);
    let defaultSelected: string[] = [];
    if (unpaid.length > 0) {
      defaultSelected = unpaid.map(u => `${u.month} ${u.year}`);
    }
    setSelectedMonthsToPay(defaultSelected);
    setEditingPagoId(null);
    setRegistrarPagoData(prev => ({
      ...prev,
      socioId,
      tipoPeriodo: 'Mensual',
      año: selectedYear,
      monto: defaultSelected.length * 125
    }));
    setShowRegistrarPagoModal(true);
  };

  const handleEditarPago = (socioId: string, pagoId: string) => {
    const socio = socios.find(s => s.id === socioId);
    if (!socio) return;
    const pago = socio.historialPagos?.find(p => p.id === pagoId);
    if (!pago) return;

    setEditingPagoId(pagoId);
    
    const periodParts = pago.periodo.split(' ');
    const mesVal = periodParts[0] || 'Enero';
    const añoVal = Number(periodParts.pop()) || 2026;

    setSelectedMonthsToPay(pago.tipoPeriodo === 'Mensual' ? [pago.periodo] : []);
    setRegistrarPagoData({
      socioId,
      tipoPeriodo: pago.tipoPeriodo,
      mes: mesVal,
      semestre: pago.tipoPeriodo === 'Semestral' ? pago.periodo : '1er Semestre (Ene-Jun)',
      año: añoVal,
      monto: pago.monto,
      metodo: pago.metodo as any,
      bancoReferencia: pago.bancoReferencia || '',
      numeroReferencia: pago.numeroReferencia || '',
      fechaPago: pago.fechaPago
    });
    setShowRegistrarPagoModal(true);
  };

  const handleBorrarPago = async (socioId: string, pagoId: string) => {
    if (!window.confirm("¿Está seguro de que desea eliminar este registro de pago? Esto afectará el saldo pendiente del socio.")) return;

    const socio = socios.find(s => s.id === socioId);
    if (!socio) return;

    const updatedHistorial = (socio.historialPagos || []).filter(p => p.id !== pagoId);
    
    const tempSocio = { ...socio, historialPagos: updatedHistorial };
    const newUnpaid = getSocioUnpaidMonths(tempSocio);
    const newUnpaidCount = newUnpaid.length;
    const newMontoPendiente = newUnpaidCount * 125;
    const newEstadoCuotas = newUnpaidCount === 0 
      ? 'Al día' as const
      : (newUnpaidCount > 3 ? 'En mora' as const : 'Pendiente' as const);

    const updatedSocio: Socio = {
      ...socio,
      estadoCuotas: newEstadoCuotas,
      montoPendiente: newMontoPendiente,
      fechaUltimoPago: updatedHistorial.length > 0 ? updatedHistorial[0].fechaPago : '',
      historialPagos: updatedHistorial
    };

    const newSocios = socios.map(s => s.id === socioId ? updatedSocio : s);
    setSocios(newSocios);
    localStorage.setItem('club_leones_socios', JSON.stringify(newSocios));

    try {
      await firebaseService.saveSocio(updatedSocio);
    } catch (err) {
      console.error("Error deleting payment in Firestore:", err);
    }
  };

  const unpaidMonthsForSocio = useMemo(() => {
    const socio = socios.find(s => s.id === registrarPagoData.socioId);
    if (!socio) return [];
    return getSocioUnpaidMonths(socio);
  }, [socios, registrarPagoData.socioId]);

  const handleTipoPeriodoChange = (tipo: 'Mensual' | 'Semestral' | 'Anual') => {
    let defaultMonto = 125;
    if (tipo === 'Semestral') {
      defaultMonto = 750;
    } else if (tipo === 'Anual') {
      defaultMonto = 1500;
    } else {
      defaultMonto = selectedMonthsToPay.length * 125;
    }
    setRegistrarPagoData(prev => ({
      ...prev,
      tipoPeriodo: tipo,
      monto: defaultMonto
    }));
  };

  const handleGuardarNuevoPago = async () => {
    const { socioId, tipoPeriodo, mes, año, semestre, monto, metodo, bancoReferencia, numeroReferencia, fechaPago } = registrarPagoData;
    if (!socioId) return;

    const socio = socios.find(s => s.id === socioId);
    if (!socio) return;

    let nuevosPagos = [];
    if (tipoPeriodo === 'Mensual') {
      if (selectedMonthsToPay.length === 0) return;
      const individualAmount = Number(monto) / selectedMonthsToPay.length;
      nuevosPagos = selectedMonthsToPay.map((monthYear, i) => ({
        id: editingPagoId && i === 0 ? editingPagoId : `pago-${Date.now()}-${i}`,
        fechaPago,
        monto: individualAmount,
        periodo: monthYear,
        tipoPeriodo: 'Mensual' as const,
        metodo,
        bancoReferencia: metodo !== 'Efectivo' ? bancoReferencia : undefined,
        numeroReferencia: metodo !== 'Efectivo' ? numeroReferencia : undefined
      }));
    } else {
      let periodo = '';
      if (tipoPeriodo === 'Semestral') {
        periodo = `${semestre} ${año}`;
      } else {
        periodo = `Año ${año}`;
      }
      nuevosPagos = [{
        id: editingPagoId || `pago-${Date.now()}`,
        fechaPago,
        monto: Number(monto),
        periodo,
        tipoPeriodo,
        metodo,
        bancoReferencia: metodo !== 'Efectivo' ? bancoReferencia : undefined,
        numeroReferencia: metodo !== 'Efectivo' ? numeroReferencia : undefined
      }];
    }

    let cleanHistorial = socio.historialPagos || [];
    if (editingPagoId) {
      cleanHistorial = cleanHistorial.filter(p => p.id !== editingPagoId);
    }
    const updatedHistorial = [...nuevosPagos, ...cleanHistorial];
    
    // Create a temp socio object with the new payment history to compute new status
    const tempSocio = { ...socio, historialPagos: updatedHistorial };
    const newUnpaid = getSocioUnpaidMonths(tempSocio);
    const newUnpaidCount = newUnpaid.length;
    const newMontoPendiente = newUnpaidCount * 125;
    const newEstadoCuotas = newUnpaidCount === 0 
      ? 'Al día' as const
      : (newUnpaidCount > 3 ? 'En mora' as const : 'Pendiente' as const);

    const updatedSocio: Socio = {
      ...socio,
      estadoCuotas: newEstadoCuotas,
      montoPendiente: newMontoPendiente,
      fechaUltimoPago: fechaPago,
      historialPagos: updatedHistorial
    };

    const newSocios = socios.map(s => s.id === socioId ? updatedSocio : s);
    setSocios(newSocios);
    localStorage.setItem('club_leones_socios', JSON.stringify(newSocios));

    try {
      await firebaseService.saveSocio(updatedSocio);
    } catch (err) {
      console.error("Error saving socio payment to Firebase:", err);
    }

    setShowRegistrarPagoModal(false);
    setSelectedMonthsToPay([]);
    setEditingPagoId(null);
    setRegistrarPagoData({
      socioId: '',
      tipoPeriodo: 'Mensual',
      mes: 'Enero',
      año: 2026,
      semestre: '1er Semestre (Ene-Jun)',
      monto: 125,
      metodo: 'Efectivo',
      bancoReferencia: '',
      numeroReferencia: '',
      fechaPago: new Date().toISOString().split('T')[0]
    });
  };

  const filteredSociosCuotas = useMemo(() => {
    return socios.filter(s => {
      if (s.rol === UserRole.DONANTE || s.rol === UserRole.GUEST) return false;
      
      const matchesSearch = s.nombre.toLowerCase().includes(socioSearch.toLowerCase());
      
      const unpaidCount = getSocioUnpaidMonths(s).length;
      let computedStatus: 'al_dia' | 'pendiente' | 'en_mora' = 'al_dia';
      if (unpaidCount > 0) {
        computedStatus = unpaidCount <= 3 ? 'pendiente' : 'en_mora';
      }
      
      const matchesStatus = 
        cuotasFilterStatus === 'Todos' ||
        (cuotasFilterStatus === 'al_dia' && computedStatus === 'al_dia') ||
        (cuotasFilterStatus === 'pendiente' && computedStatus === 'pendiente') ||
        (cuotasFilterStatus === 'en_mora' && computedStatus === 'en_mora');

      return matchesSearch && matchesStatus;
    });
  }, [socios, socioSearch, cuotasFilterStatus, currentYear, currentMonth]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="text-left">
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">Cobros y Control de Cuotas</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Gestión Financiera de Aportaciones de Socios</p>
        </div>
        <button 
          onClick={() => {
            setSelectedMonthsToPay([]);
            setEditingPagoId(null);
            setRegistrarPagoData(prev => ({
              ...prev,
              socioId: '',
              tipoPeriodo: 'Mensual',
              año: selectedYear,
              monto: 125
            }));
            setShowRegistrarPagoModal(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white font-black px-6 py-3 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-green-600/10 active:scale-95 transition-all w-full md:w-auto"
        >
          <Plus size={18} />
          <span>Registrar Pago</span>
        </button>
      </div>

      {/* KPI Widgets */}
      {(() => {
        const activeMembersList = socios.filter(s => s.rol !== UserRole.DONANTE && s.rol !== UserRole.GUEST);
        const totalRecaudado = activeMembersList.reduce((sum, s) => {
          const pagosSocio = s.historialPagos?.reduce((pSum, p) => pSum + p.monto, 0) || 0;
          return sum + pagosSocio;
        }, 0);
        const totalPendiente = activeMembersList.reduce((sum, s) => {
          const unpaidCount = getSocioUnpaidMonths(s).length;
          return sum + (unpaidCount * 125);
        }, 0);
        const sociosAlDia = activeMembersList.filter(s => getSocioUnpaidMonths(s).length === 0).length;
        const sociosTotal = activeMembersList.length;
        const porcentajeSolvencia = sociosTotal > 0 ? Math.round((sociosAlDia / sociosTotal) * 100) : 100;
        const sociosEnMora = activeMembersList.filter(s => getSocioUnpaidMonths(s).length > 3).length;

        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            {/* Total Recaudado */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[105px] text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs text-slate-450 font-bold uppercase tracking-wider block">Total Recaudado</span>
                <div className="p-2 bg-green-50 text-green-655 rounded-xl flex-shrink-0">
                  <TrendingUp size={16} />
                </div>
              </div>
              <span className="text-lg sm:text-xl font-black text-slate-805 leading-none mt-2 block break-words">
                Q {totalRecaudado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
              </span>
            </div>
 
            {/* Saldo Pendiente */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[105px] text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs text-slate-450 font-bold uppercase tracking-wider block">Saldo Pendiente</span>
                <div className="p-2 bg-red-50 text-red-500 rounded-xl flex-shrink-0">
                  <AlertTriangle size={16} />
                </div>
              </div>
              <span className="text-lg sm:text-xl font-black text-slate-850 leading-none mt-2 block break-words">
                Q {totalPendiente.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Solvencia Club */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[105px] text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs text-slate-455 font-bold uppercase tracking-wider block">Solvencia Club</span>
                <div className="p-2 bg-blue-50 text-blue-900 rounded-xl flex-shrink-0">
                  <CheckCircle size={16} />
                </div>
              </div>
              <span className="text-lg sm:text-xl font-black text-slate-805 leading-none mt-2 block break-words">
                {porcentajeSolvencia}% ({sociosAlDia}/{sociosTotal})
              </span>
            </div>

            {/* Socios en Mora */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[105px] text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs text-slate-450 font-bold uppercase tracking-wider block">Socios en Mora</span>
                <div className="p-2 bg-orange-50 text-orange-600 rounded-xl flex-shrink-0">
                  <AlertCircle size={16} />
                </div>
              </div>
              <span className="text-lg sm:text-xl font-black text-slate-805 leading-none mt-2 block break-words">
                {sociosEnMora} Miembros
              </span>
            </div>

          </div>
        );
      })()}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
        <div className="relative w-full sm:max-w-[280px]">
          <Search className="absolute left-4 top-3 text-slate-400" size={18} />
          <input
            type="text"
            value={socioSearch}
            onChange={e => setSocioSearch(e.target.value)}
            placeholder="Buscar socio..."
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-semibold"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center space-x-2 flex-grow sm:flex-grow-0 min-w-[150px]">
            <Filter size={16} className="text-slate-400 flex-shrink-0" />
            <select 
              value={cuotasFilterStatus} 
              onChange={e => setCuotasFilterStatus(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-900 w-full appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundPosition: 'right 8px center', backgroundSize: '16px', backgroundRepeat: 'no-repeat' }}
            >
              <option value="Todos">Todos los Estados</option>
              <option value="al_dia">Al día</option>
              <option value="pendiente">Pendientes</option>
              <option value="en_mora">En mora</option>
            </select>
          </div>
          <div className="flex items-center space-x-2 min-w-[110px]">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex-shrink-0">Año:</span>
            <select 
              value={selectedYear} 
              onChange={e => setSelectedYear(parseInt(e.target.value))}
              className="bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-900 w-full appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundPosition: 'right 8px center', backgroundSize: '16px', backgroundRepeat: 'no-repeat' }}
            >
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
              <option value={2028}>2028</option>
              <option value={2029}>2029</option>
              <option value={2030}>2030</option>
            </select>
          </div>
        </div>
      </div>

      {/* Horizontal Cards Layout */}
      <div className="space-y-4">
        {filteredSociosCuotas.map(s => {
          const isExpanded = selectedSocioForCuotas === s.id;
          const unpaidMonths = getSocioUnpaidMonths(s);
          const totalArrearsCount = unpaidMonths.length;
          const dynamicMontoPendiente = totalArrearsCount * 125;

          return (
            <div 
              key={s.id} 
              className={`bg-white border rounded-[2rem] p-6 transition-all duration-300 shadow-sm hover:shadow-md hover:border-slate-350 ${
                isExpanded ? 'border-blue-900/30 ring-1 ring-blue-900/5' : 'border-slate-200/80'
              }`}
            >
              {/* Flexbox layout dividing details, months, and stacked balance & actions */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* 1. Profile Info (and mobile-only balance side-by-side) */}
                <div className="flex items-center justify-between w-full md:w-auto md:min-w-[220px]">
                  <div className="flex items-center space-x-4 text-left">
                    <img 
                      src={s.foto || 'https://picsum.photos/seed/socio/200/200'} 
                      alt={s.nombre} 
                      className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/socio/200/200';
                      }}
                    />
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight truncate">{s.nombre}</h4>
                      <p className="text-[10px] font-black text-slate-405 uppercase tracking-widest mt-1 truncate">{s.puesto || 'Socio Regular'}</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5">{s.codigoSocio}</p>
                    </div>
                  </div>

                  {/* Mobile-only Balance */}
                  <div className="text-right md:hidden flex-shrink-0 pl-2">
                    <span className="text-[9px] font-black text-slate-400 tracking-wider block">Saldo</span>
                    <span className="text-base font-black text-slate-800 leading-none mt-0.5 block">
                      Q {dynamicMontoPendiente.toLocaleString('es-GT', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                {/* 2. Months Grid (Two rows of 6) - wrapped in background panel with fixed limits */}
                <div className="bg-slate-50/70 border border-slate-100 p-2.5 rounded-2xl w-full md:w-auto min-w-[270px] max-w-[320px] mx-auto md:mx-0 flex-shrink-0">
                  <div className="grid grid-cols-6 gap-1.5">
                    {/* First Row: Jan - Jun */}
                    {months.slice(0, 6).map((month, idx) => {
                      const paid = isMonthPaid(s, month, selectedYear);
                      const isFuture = selectedYear > currentYear || (selectedYear === currentYear && idx > currentMonth);
                      const isArrears = !paid && !isFuture;

                      let badgeColor = 'bg-slate-200 text-slate-500 border-slate-300';
                      if (paid) {
                        badgeColor = 'bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-500/10';
                      } else if (isArrears) {
                        badgeColor = totalArrearsCount <= 3 
                          ? 'bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-500/10'
                          : 'bg-red-500 text-white border-red-600 shadow-sm shadow-red-500/10 animate-pulse';
                      }

                      return (
                        <div 
                          key={month} 
                          className={`h-9 rounded-xl flex flex-col items-center justify-center text-[10px] font-black uppercase border transition-all ${badgeColor} min-w-[36px]`}
                          title={`${month} ${selectedYear}: ${paid ? 'Pagado' : (isFuture ? 'Futuro' : 'Pendiente')}`}
                        >
                          <span className="leading-none">{month.substring(0, 3)}</span>
                        </div>
                      );
                    })}
                    {/* Second Row: Jul - Dec */}
                    {months.slice(6, 12).map((month, idx) => {
                      const paid = isMonthPaid(s, month, selectedYear);
                      const actualIdx = idx + 6;
                      const isFuture = selectedYear > currentYear || (selectedYear === currentYear && actualIdx > currentMonth);
                      const isArrears = !paid && !isFuture;

                      let badgeColor = 'bg-slate-200 text-slate-500 border-slate-300';
                      if (paid) {
                        badgeColor = 'bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-500/10';
                      } else if (isArrears) {
                        badgeColor = totalArrearsCount <= 3 
                          ? 'bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-500/10'
                          : 'bg-red-500 text-white border-red-600 shadow-sm shadow-red-500/10 animate-pulse';
                      }

                      return (
                        <div 
                          key={month} 
                          className={`h-9 rounded-xl flex flex-col items-center justify-center text-[10px] font-black uppercase border transition-all ${badgeColor} min-w-[36px]`}
                          title={`${month} ${selectedYear}: ${paid ? 'Pagado' : (isFuture ? 'Futuro' : 'Pendiente')}`}
                        >
                          <span className="leading-none">{month.substring(0, 3)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Balance and Action Buttons stacked vertically to avoid horizontal overlap */}
                <div className="flex flex-col items-stretch md:items-end justify-center min-w-[160px] w-full md:w-auto">
                  {/* Desktop-only Balance */}
                  <div className="hidden md:block text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Saldo Pendiente</span>
                    <span className="text-xl font-black text-slate-800 mt-0.5 block leading-none">
                      Q {dynamicMontoPendiente.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-0 md:mt-3.5 w-full justify-stretch md:justify-end">
                    <button
                      onClick={() => handleRegistrarPago(s.id)}
                      className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-md shadow-green-600/10 active:scale-95"
                      title="Cobrar cuota"
                    >
                      <Check size={14} />
                      <span>Cobrar</span>
                    </button>
                    <button
                      onClick={() => handleEnviarRecordatorio(s)}
                      className="bg-slate-50 text-slate-655 hover:bg-slate-100 hover:text-slate-800 border border-slate-200/80 p-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm flex items-center justify-center flex-shrink-0"
                      title="Enviar aviso por correo"
                    >
                      <Send size={14} />
                    </button>
                    <button
                      onClick={() => setSelectedSocioForCuotas(isExpanded ? null : s.id)}
                      className="bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80 p-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm flex items-center justify-center flex-shrink-0"
                      title="Ver historial de pagos"
                    >
                      <ChevronDown size={14} className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-900' : ''}`} />
                    </button>
                  </div>
                </div>

              </div>

              {/* Expanded Detail Panel */}
              {isExpanded && (
                <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-6 text-left">
                    {totalArrearsCount === 0 ? (
                      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-green-800 flex items-start space-x-3 text-sm">
                        <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={18} />
                        <div>
                          <span className="font-extrabold block">Cuenta Solvente</span>
                          <p className="mt-1 leading-relaxed text-xs">
                            El socio se encuentra completamente al día con sus cuotas mensuales de Q 125.00.
                            Último pago registrado el <strong className="font-bold">{s.fechaUltimoPago || 'N/A'}</strong>.
                          </p>
                        </div>
                      </div>
                    ) : totalArrearsCount <= 3 ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 flex items-start space-x-3 text-sm">
                        <AlertCircle className="text-amber-500 mt-0.5 flex-shrink-0" size={18} />
                        <div>
                          <span className="font-extrabold block">Alerta de Atraso Aceptable ({totalArrearsCount} meses)</span>
                          <p className="mt-1 leading-relaxed text-xs">
                            El socio presenta un atraso acumulado de <strong className="font-black">Q {dynamicMontoPendiente.toFixed(2)}</strong>.
                            Se encuentra dentro de la mora máxima permitida (3 meses) para permanecer activo en el club.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-800 flex items-start space-x-3 text-sm">
                        <AlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
                        <div>
                          <span className="font-extrabold block">Alerta de Atraso Crítico ({totalArrearsCount} meses)</span>
                          <p className="mt-1 leading-relaxed text-xs font-medium">
                            El socio supera la mora máxima permitida de 3 meses, acumulando una deuda de <strong className="font-black">Q {dynamicMontoPendiente.toFixed(2)}</strong>.
                            Se recomienda el contacto inmediato para regularizar su cuenta.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Payments History Table & Mobile Cards Wrapper */}
                    <div className="space-y-3">
                      <h5 className="font-extrabold text-slate-800 text-sm flex items-center space-x-2">
                        <CreditCard size={16} className="text-blue-900" />
                        <span>Historial Detallado de Transacciones</span>
                      </h5>
                      
                      {/* Mobile-only Transaction Card List */}
                      <div className="block md:hidden space-y-3">
                        {!s.historialPagos || s.historialPagos.length === 0 ? (
                          <p className="text-xs text-slate-400 italic text-center py-6 bg-slate-50 rounded-2xl border">
                            No se han registrado pagos en esta cuenta.
                          </p>
                        ) : (
                          s.historialPagos.map(pago => (
                            <div key={pago.id} className="bg-slate-50/50 border border-slate-150 rounded-2xl p-4 space-y-3 text-xs text-left">
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-blue-900 text-sm leading-none">{pago.periodo}</span>
                                <span className="font-black text-slate-800 text-sm leading-none">Q {pago.monto.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-slate-500 font-semibold text-[11px] leading-none pt-1">
                                <span>Fecha: {pago.fechaPago}</span>
                                <span>Método: {pago.metodo}</span>
                              </div>
                              {pago.metodo !== 'Efectivo' && (
                                <p className="text-[10px] text-slate-400 font-bold bg-slate-100/50 p-1.5 rounded-lg border border-slate-200/40">
                                  Ref: {pago.numeroReferencia || '-'} ({pago.bancoReferencia || '-'})
                                </p>
                              )}
                              <div className="flex items-center justify-end space-x-2 pt-2.5 border-t border-slate-100">
                                <button 
                                  onClick={() => generateReciboPagoPDF(s, pago)}
                                  className="bg-blue-50 text-blue-900 px-3 py-1.5 rounded-lg border border-blue-200 text-[10px] font-bold flex items-center space-x-1 active:scale-95 transition-all"
                                  title="Recibo PDF"
                                >
                                  <Download size={11} />
                                  <span>PDF</span>
                                </button>
                                <button 
                                  onClick={() => handleEditarPago(s.id, pago.id)}
                                  className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-250 text-[10px] font-bold flex items-center space-x-1 active:scale-95 transition-all"
                                  title="Editar Aportación"
                                >
                                  <Edit size={11} />
                                  <span>Editar</span>
                                </button>
                                <button 
                                  onClick={() => handleBorrarPago(s.id, pago.id)}
                                  className="bg-red-50 text-red-650 px-3 py-1.5 rounded-lg border border-red-200 text-[10px] font-bold flex items-center space-x-1 active:scale-95 transition-all"
                                  title="Eliminar Aportación"
                                >
                                  <Trash2 size={11} />
                                  <span>Borrar</span>
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Desktop-only Transaction Table */}
                      <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm w-full">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                              <th className="p-3">Fecha Pago</th>
                              <th className="p-3">Período Aportación</th>
                              <th className="p-3">Monto</th>
                              <th className="p-3">Método</th>
                              <th className="p-3">Referencia / Banco</th>
                              <th className="p-3 text-right pr-6">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {!s.historialPagos || s.historialPagos.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-400 italic">No se han registrado pagos en el historial de esta cuenta.</td>
                              </tr>
                            ) : (
                              s.historialPagos.map(pago => (
                                <tr key={pago.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-3 font-semibold text-slate-800">{pago.fechaPago}</td>
                                  <td className="p-3 font-bold text-blue-900">{pago.periodo}</td>
                                  <td className="p-3 font-extrabold text-slate-850">Q {pago.monto.toFixed(2)}</td>
                                  <td className="p-3 text-slate-600 font-semibold">{pago.metodo}</td>
                                  <td className="p-3 text-slate-500 font-semibold">{pago.metodo !== 'Efectivo' ? `${pago.numeroReferencia || '-'} (${pago.bancoReferencia || '-'})` : 'Pago en Ventanilla'}</td>
                                  <td className="p-3 text-right pr-6">
                                    <div className="flex items-center justify-end space-x-1.5">
                                      <button 
                                        onClick={() => generateReciboPagoPDF(s, pago)}
                                        className="bg-blue-50 hover:bg-blue-100 text-blue-900 p-1.5 rounded-lg border border-blue-200 transition-all active:scale-90"
                                        title="Recibo PDF"
                                      >
                                        <Download size={12} />
                                      </button>
                                      <button 
                                        onClick={() => handleEditarPago(s.id, pago.id)}
                                        className="bg-slate-50 hover:bg-slate-100 text-slate-700 p-1.5 rounded-lg border border-slate-200 transition-all active:scale-90"
                                        title="Editar Aportación"
                                      >
                                        <Edit size={12} />
                                      </button>
                                      <button 
                                        onClick={() => handleBorrarPago(s.id, pago.id)}
                                        className="bg-red-50 hover:bg-red-100 text-red-650 p-1.5 rounded-lg border border-red-200 transition-all active:scale-90"
                                        title="Eliminar Aportación"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filteredSociosCuotas.length === 0 && (
          <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-[2rem] text-slate-400 italic">
            No se encontraron socios con esos criterios.
          </div>
        )}
      </div>

      {/* Registrar/Editar Pago Modal */}
      {showRegistrarPagoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-[2rem] p-6 sm:p-9 max-w-lg w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 relative text-left">
            <button 
              onClick={() => {
                setShowRegistrarPagoModal(false);
                setEditingPagoId(null);
                setSelectedMonthsToPay([]);
              }}
              className="absolute top-6 right-6 p-2 text-slate-455 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
              <div className="bg-green-50 p-2.5 rounded-full text-green-600 border border-green-100">
                <DollarSign size={22} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">
                  {editingPagoId ? 'Editar Aportación' : 'Registrar Aportación'}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Control de Cobros</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Socio Afectado</label>
                {editingPagoId ? (
                  <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 select-none">
                    {socios.find(s => s.id === registrarPagoData.socioId)?.nombre || 'Socio'}
                  </div>
                ) : (
                  <select
                    value={registrarPagoData.socioId}
                    onChange={(e) => {
                      const selectedSocio = socios.find(s => s.id === e.target.value);
                      const unpaid = selectedSocio ? getSocioUnpaidMonths(selectedSocio) : [];
                      let defaultSelected: string[] = [];
                      if (unpaid.length > 0) {
                        defaultSelected = [`${unpaid[0].month} ${unpaid[0].year}`];
                      }
                      setSelectedMonthsToPay(defaultSelected);
                      setRegistrarPagoData(prev => ({
                        ...prev,
                        socioId: e.target.value,
                        monto: defaultSelected.length * 125
                      }));
                    }}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm font-bold text-slate-700"
                  >
                    <option value="">-- Seleccionar Socio --</option>
                    {socios.filter(s => s.rol !== UserRole.DONANTE && s.rol !== UserRole.GUEST && s.estatus !== 'Inactive').map(s => {
                      const unpaid = getSocioUnpaidMonths(s);
                      const pendingBalance = unpaid.length * 125;
                      return (
                        <option key={s.id} value={s.id}>{s.nombre} (Pendiente: Q {pendingBalance})</option>
                      );
                    })}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Periodo</label>
                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200/60 w-full">
                  {(['Mensual', 'Semestral', 'Anual'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => handleTipoPeriodoChange(p)}
                      className={`flex-1 py-2 text-center text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                        registrarPagoData.tipoPeriodo === p 
                          ? 'bg-white text-green-700 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {registrarPagoData.tipoPeriodo === 'Mensual' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Seleccionar Meses a Pagar ({selectedMonthsToPay.length})
                  </label>
                  {unpaidMonthsForSocio.length === 0 && !editingPagoId ? (
                    <p className="text-xs text-slate-450 italic p-3 bg-slate-50 rounded-xl border">El socio no tiene meses pendientes de pago.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto p-1.5 bg-slate-50 rounded-xl border border-slate-200/60">
                      {editingPagoId ? (
                        selectedMonthsToPay.map(monthYear => (
                          <div 
                            key={monthYear}
                            className="flex items-center space-x-2 p-2 rounded-lg border bg-green-50 border-green-300 text-green-800 font-bold select-none"
                          >
                            <Check size={14} className="text-green-600" />
                            <span className="text-[11px] uppercase font-black">{monthYear}</span>
                          </div>
                        ))
                      ) : (
                        unpaidMonthsForSocio.map(m => {
                          const key = `${m.month} ${m.year}`;
                          const isChecked = selectedMonthsToPay.includes(key);
                          return (
                            <label 
                              key={`${m.month}-${m.year}`}
                              className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-all ${
                                isChecked 
                                  ? 'bg-green-50 border-green-300 text-green-800 font-bold' 
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-55'
                              }`}
                            >
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  let newSelected = [...selectedMonthsToPay];
                                  if (e.target.checked) {
                                    newSelected.push(key);
                                  } else {
                                    newSelected = newSelected.filter(x => x !== key);
                                  }
                                  setSelectedMonthsToPay(newSelected);
                                  setRegistrarPagoData(prev => ({
                                    ...prev,
                                    monto: newSelected.length * 125
                                  }));
                                }}
                                className="rounded text-green-600 focus:ring-green-500 w-4 h-4"
                              />
                              <span className="text-[11px] uppercase font-black">{m.month.substring(0,3)} {m.year}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}

              {registrarPagoData.tipoPeriodo === 'Semestral' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Seleccionar Semestre</label>
                  <select
                    value={registrarPagoData.semestre}
                    onChange={e => setRegistrarPagoData(prev => ({ ...prev, semestre: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm font-semibold text-slate-700"
                  >
                    <option value="1er Semestre (Ene-Jun)">1er Semestre (Ene-Jun)</option>
                    <option value="2do Semestre (Jul-Dic)">2do Semestre (Jul-Dic)</option>
                  </select>
                </div>
              )}

              {registrarPagoData.tipoPeriodo !== 'Mensual' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Año</label>
                  <input 
                    type="number"
                    value={registrarPagoData.año}
                    onChange={e => setRegistrarPagoData(prev => ({ ...prev, año: parseInt(e.target.value) || 2026 }))}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm font-semibold text-slate-850"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Monto de Aportación (Q)</label>
                <input 
                  type="number"
                  value={registrarPagoData.monto}
                  onChange={e => setRegistrarPagoData(prev => ({ ...prev, monto: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm font-black text-slate-855"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha del Pago</label>
                <input 
                  type="date"
                  value={registrarPagoData.fechaPago}
                  onChange={e => setRegistrarPagoData(prev => ({ ...prev, fechaPago: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm font-semibold text-slate-855"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Método de Pago</label>
                <select
                  value={registrarPagoData.metodo}
                  onChange={e => setRegistrarPagoData(prev => ({ ...prev, metodo: e.target.value as any }))}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm font-semibold text-slate-700"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Depósito">Depósito en Cuenta</option>
                </select>
              </div>

              {registrarPagoData.metodo !== 'Efectivo' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Banco Destino</label>
                    <input 
                      type="text"
                      value={registrarPagoData.bancoReferencia}
                      onChange={e => setRegistrarPagoData(prev => ({ ...prev, bancoReferencia: e.target.value }))}
                      placeholder="Ej. Banrural"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">No. Autorización / Transferencia</label>
                    <input 
                      type="text"
                      value={registrarPagoData.numeroReferencia}
                      onChange={e => setRegistrarPagoData(prev => ({ ...prev, numeroReferencia: e.target.value }))}
                      placeholder="Ej. 123456"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm font-semibold text-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-8">
              <button
                onClick={() => {
                  setShowRegistrarPagoModal(false);
                  setEditingPagoId(null);
                  setSelectedMonthsToPay([]);
                }}
                className="flex-1 py-3 text-slate-655 font-bold hover:bg-slate-50 border border-slate-200 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarNuevoPago}
                disabled={!registrarPagoData.socioId || (registrarPagoData.tipoPeriodo === 'Mensual' && selectedMonthsToPay.length === 0) || registrarPagoData.monto <= 0}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-600/20 active:scale-95"
              >
                {editingPagoId ? 'Guardar Cambios' : 'Confirmar Cobro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
