import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, DollarSign, Calendar, CreditCard, Image, Upload, X, Check, Building, AlertCircle } from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { Socio } from '../types';
import { useToast } from '../context/ToastContext';

export const PublicPagoCuota: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const [formState, setFormState] = useState({
    tipoCuota: 'ordinaria' as 'ordinaria' | 'inscripcion' | 'extraordinaria' | 'donacion',
    tipoPeriodo: 'Mensual' as 'Mensual' | 'Trimestral' | 'Semestral' | 'Anual',
    año: new Date().getFullYear(),
    mes: 'Enero',
    semestre: '1er Semestre (Ene-Jun)',
    trimester: '1er Trimestre (Ene-Mar)',
    monto: 125,
    metodo: 'Transferencia' as 'Transferencia' | 'Depósito',
    bancoReferencia: '',
    numeroReferencia: '',
    fechaPago: new Date().toISOString().split('T')[0],
    descripcion: '',
    comprobanteBase64: ''
  });

  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const currentYear = new Date().getFullYear();

  // Load active members from Firestore
  useEffect(() => {
    const fetchSocios = async () => {
      try {
        const list = await firebaseService.getSocios();
        // Filter out deleted/inactive or non-regular roles if needed, but we keep all registered for general payment
        const activeList = list.filter(s => s.activo !== false);
        setSocios(activeList);

        // Check if socioId is provided in URL params
        const socioIdParam = searchParams.get('socioId');
        if (socioIdParam) {
          const found = activeList.find(s => s.id === socioIdParam);
          if (found) {
            setSelectedSocio(found);
            setSearchQuery(found.nombre);
          }
        }
      } catch (err) {
        console.error('Error fetching members:', err);
        showToast('Error al cargar la lista de socios', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSocios();
  }, [searchParams]);

  // Adjust amount and periods according to selections
  useEffect(() => {
    if (formState.tipoCuota === 'inscripcion') {
      setFormState(prev => ({ ...prev, monto: 750 }));
    } else if (formState.tipoCuota === 'ordinaria') {
      const base = 125;
      let calculated = base;
      if (formState.tipoPeriodo === 'Trimestral') calculated = base * 3;
      else if (formState.tipoPeriodo === 'Semestral') calculated = base * 6;
      else if (formState.tipoPeriodo === 'Anual') calculated = base * 12;
      setFormState(prev => ({ ...prev, monto: calculated }));
    }
  }, [formState.tipoCuota, formState.tipoPeriodo]);

  // Search filter for dropdown
  const filteredSocios = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return socios
      .filter(s => s.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 1); // Only show 1 result to save vertical space
  }, [socios, searchQuery]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormState(prev => ({
          ...prev,
          comprobanteBase64: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSocioSelect = (socio: Socio) => {
    setSelectedSocio(socio);
    setSearchQuery(socio.nombre);
    setShowSearchDropdown(false);
  };

  // Synchronize month/year to the first unpaid month when socio is selected
  useEffect(() => {
    if (selectedSocio) {
      const nextUnpaid = getNextUnpaidMonth(selectedSocio);
      setFormState(prev => ({
        ...prev,
        mes: nextUnpaid.month,
        año: nextUnpaid.year
      }));
    }
  }, [selectedSocio]);

  const getEndMonthAndYear = (startMonthName: string, startYear: number, monthsToAdd: number) => {
    const startIndex = months.indexOf(startMonthName);
    if (startIndex === -1) return { month: startMonthName, year: startYear };
    
    let endMonthIndex = startIndex + monthsToAdd;
    let endYear = startYear;
    while (endMonthIndex > 11) {
      endMonthIndex -= 12;
      endYear += 1;
    }
    return { month: months[endMonthIndex], year: endYear };
  };

  const parseMonthYear = (str: string): { monthIndex: number; year: number } | null => {
    const parts = str.trim().split(/\s+/);
    if (parts.length < 2) return null;
    const monthStr = parts[0].toLowerCase();
    const year = parseInt(parts[1]) || 2026;
    const monthIndex = months.findIndex(m => m.toLowerCase().startsWith(monthStr.substring(0, 3)));
    if (monthIndex === -1) return null;
    return { monthIndex, year };
  };

  const parseRange = (startStr: string, endStr: string): { month: string; year: number }[] => {
    const start = parseMonthYear(startStr);
    const end = parseMonthYear(endStr);
    if (!start || !end) return [];
    const list: { month: string; year: number }[] = [];
    let currM = start.monthIndex;
    let currY = start.year;
    const endM = end.monthIndex;
    const endY = end.year;
    
    while (currY < endY || (currY === endY && currM <= endM)) {
      list.push({ month: months[currM], year: currY });
      currM++;
      if (currM > 11) {
        currM = 0;
        currY++;
      }
      if (list.length > 36) break; // Safeguard
    }
    return list;
  };

  const getMonthsCoveredByPeriod = (p: { periodo: string; tipoPeriodo: string }): { month: string; year: number }[] => {
    const period = p.periodo || '';
    const tipo = p.tipoPeriodo || '';
    
    if (tipo === 'Mensual') {
      const parts = period.split(',');
      const list: { month: string; year: number }[] = [];
      for (const part of parts) {
        const parsed = parseMonthYear(part);
        if (parsed) {
          list.push({ month: months[parsed.monthIndex], year: parsed.year });
        }
      }
      return list;
    }
    
    if (period.includes('-')) {
      const cleanPeriod = period.includes(':') ? period.split(':')[1] : period;
      const parts = cleanPeriod.split('-');
      if (parts.length === 2) {
        return parseRange(parts[0], parts[1]);
      }
    }
    
    if (tipo === 'Trimestral') {
      const yearMatch = period.match(/\d{4}/);
      const year = yearMatch ? parseInt(yearMatch[0]) : 2026;
      if (period.includes('1er')) {
        return [
          { month: 'Enero', year },
          { month: 'Febrero', year },
          { month: 'Marzo', year }
        ];
      }
      if (period.includes('2do')) {
        return [
          { month: 'Abril', year },
          { month: 'Mayo', year },
          { month: 'Junio', year }
        ];
      }
      if (period.includes('3er')) {
        return [
          { month: 'Julio', year },
          { month: 'Agosto', year },
          { month: 'Septiembre', year }
        ];
      }
      if (period.includes('4to')) {
        return [
          { month: 'Octubre', year },
          { month: 'Noviembre', year },
          { month: 'Diciembre', year }
        ];
      }
    }
    
    if (tipo === 'Semestral') {
      const yearMatch = period.match(/\d{4}/);
      const year = yearMatch ? parseInt(yearMatch[0]) : 2026;
      if (period.includes('1er')) {
        return [
          { month: 'Enero', year },
          { month: 'Febrero', year },
          { month: 'Marzo', year },
          { month: 'Abril', year },
          { month: 'Mayo', year },
          { month: 'Junio', year }
        ];
      }
      if (period.includes('2do')) {
        return [
          { month: 'Julio', year },
          { month: 'Agosto', year },
          { month: 'Septiembre', year },
          { month: 'Octubre', year },
          { month: 'Noviembre', year },
          { month: 'Diciembre', year }
        ];
      }
    }
    
    if (tipo === 'Anual') {
      const yearMatch = period.match(/\d{4}/);
      const year = yearMatch ? parseInt(yearMatch[0]) : 2026;
      return months.map(m => ({ month: m, year }));
    }
    
    return [];
  };

  const isMonthPaid = (socio: Socio, monthName: string, year: number) => {
    return socio.historialPagos?.some(p => {
      const covered = getMonthsCoveredByPeriod(p);
      return covered.some(c => c.month === monthName && c.year === year);
    }) || false;
  };

  const getSocioUnpaidMonths = (socio: Socio) => {
    const unpaidMonths: { month: string; year: number }[] = [];
    const limitY = new Date().getFullYear();
    const limitM = new Date().getMonth();
    
    let startY = 2026;
    let startM = 0;
    
    while (startY < limitY || (startY === limitY && startM <= limitM)) {
      const mName = months[startM];
      if (!isMonthPaid(socio, mName, startY)) {
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

  const getNextUnpaidMonth = (socio: Socio): { month: string; year: number } => {
    let startY = 2026;
    let startM = 0;
    const limitYear = new Date().getFullYear() + 5;
    while (startY <= limitYear) {
      const mName = months[startM];
      if (!isMonthPaid(socio, mName, startY)) {
        return { month: mName, year: startY };
      }
      startM++;
      if (startM > 11) {
        startM = 0;
        startY++;
      }
    }
    return { month: 'Enero', year: new Date().getFullYear() };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSocio) {
      showToast('Por favor, selecciona tu nombre de socio.', 'error');
      return;
    }
    if (!formState.comprobanteBase64) {
      showToast('Por favor, sube una foto o captura del comprobante bancario.', 'error');
      return;
    }

    // Check for duplicate payments if it's a regular cuota
    const { tipoCuota, fechaPago, monto, metodo, bancoReferencia, numeroReferencia, descripcion, tipoPeriodo, año, mes, semestre, trimester } = formState;
    if (tipoCuota === 'ordinaria') {
      let monthsToCheck: { month: string; year: number }[] = [];
      if (tipoPeriodo === 'Mensual') {
        monthsToCheck.push({ month: mes, year: año });
      } else {
        const startMonth = mes || 'Enero';
        const startYear = año || 2026;
        let periodStr = '';
        if (tipoPeriodo === 'Trimestral') {
          const end = getEndMonthAndYear(startMonth, startYear, 2);
          periodStr = `Trimestre: ${startMonth} ${startYear} - ${end.month} ${end.year}`;
        } else if (tipoPeriodo === 'Semestral') {
          const end = getEndMonthAndYear(startMonth, startYear, 5);
          periodStr = `Semestre: ${startMonth} ${startYear} - ${end.month} ${end.year}`;
        } else if (tipoPeriodo === 'Anual') {
          const end = getEndMonthAndYear(startMonth, startYear, 11);
          periodStr = `Anual: ${startMonth} ${startYear} - ${end.month} ${end.year}`;
        }
        monthsToCheck = getMonthsCoveredByPeriod({ periodo: periodStr, tipoPeriodo });
      }

      const alreadyPaid = monthsToCheck.filter(item => {
        return selectedSocio.historialPagos?.some(p => {
          const covered = getMonthsCoveredByPeriod(p);
          return covered.some(c => c.month === item.month && c.year === item.year);
        });
      });

      if (alreadyPaid.length > 0) {
        const paidList = alreadyPaid.map(x => `${x.month} ${x.year}`).join(', ');
        showToast(`Ya hay aportaciones registradas para el socio en: ${paidList}`, 'error');
        return;
      }
    }

    setSubmitting(true);

    try {
      // 1. Upload receipt to Firebase Storage
      const receiptUrl = await firebaseService.uploadReceiptImage(formState.comprobanteBase64, selectedSocio.id);

      // 2. Build payment transaction
      let nuevosPagos = [];

      if (tipoCuota === 'inscripcion') {
        nuevosPagos = [{
          id: `pago-${Date.now()}`,
          fechaPago,
          monto: 750,
          periodo: 'Inscripción',
          tipoPeriodo: 'Mensual' as const,
          metodo,
          bancoReferencia: bancoReferencia || undefined,
          numeroReferencia: numeroReferencia || undefined,
          tipoCuota: 'inscripcion' as const,
          descripcion: descripcion || "Registro a Lions International, chaleco protocolario, primera cuota ordinaria, cena de bienvenida y folder leonístico.",
          comprobanteUrl: receiptUrl
        }];
      } else if (tipoCuota === 'extraordinaria' || tipoCuota === 'donacion') {
        nuevosPagos = [{
          id: `pago-${Date.now()}`,
          fechaPago,
          monto: Number(monto),
          periodo: tipoCuota === 'donacion' ? 'Donación' : 'Cuota Extraordinaria',
          tipoPeriodo: 'Mensual' as const,
          metodo,
          bancoReferencia: bancoReferencia || undefined,
          numeroReferencia: numeroReferencia || undefined,
          tipoCuota,
          descripcion: descripcion,
          comprobanteUrl: receiptUrl
        }];
      } else {
        // tipoCuota === 'ordinaria'
        if (tipoPeriodo === 'Mensual') {
          nuevosPagos = [{
            id: `pago-${Date.now()}`,
            fechaPago,
            monto: Number(monto),
            periodo: `${mes} ${año}`,
            tipoPeriodo: 'Mensual' as const,
            metodo,
            bancoReferencia: bancoReferencia || undefined,
            numeroReferencia: numeroReferencia || undefined,
            tipoCuota: 'ordinaria' as const,
            descripcion: descripcion || `Cuota Ordinaria ${mes} ${año}`,
            comprobanteUrl: receiptUrl
          }];
        } else {
          // Trimestral, Semestral, Anual
          const startMonth = mes || 'Enero';
          const startYear = año || 2026;
          let periodStr = '';
          if (tipoPeriodo === 'Trimestral') {
            const end = getEndMonthAndYear(startMonth, startYear, 2);
            periodStr = `Trimestre: ${startMonth} ${startYear} - ${end.month} ${end.year}`;
          } else if (tipoPeriodo === 'Semestral') {
            const end = getEndMonthAndYear(startMonth, startYear, 5);
            periodStr = `Semestre: ${startMonth} ${startYear} - ${end.month} ${end.year}`;
          } else if (tipoPeriodo === 'Anual') {
            const end = getEndMonthAndYear(startMonth, startYear, 11);
            periodStr = `Anual: ${startMonth} ${startYear} - ${end.month} ${end.year}`;
          }
          
          nuevosPagos = [{
            id: `pago-${Date.now()}`,
            fechaPago,
            monto: Number(monto),
            periodo: periodStr,
            tipoPeriodo: tipoPeriodo as any,
            metodo,
            bancoReferencia: bancoReferencia || undefined,
            numeroReferencia: numeroReferencia || undefined,
            tipoCuota: 'ordinaria' as const,
            descripcion: descripcion || `Cuota Ordinaria ${periodStr}`,
            comprobanteUrl: receiptUrl
          }];
        }
      }

      // Merge and save to firestore
      const currentHistorial = selectedSocio.historialPagos || [];
      const updatedHistorial = [...nuevosPagos, ...currentHistorial];

      // Compute new debt states
      const tempSocio = { ...selectedSocio, historialPagos: updatedHistorial };
      const unpaid = getSocioUnpaidMonths(tempSocio);
      const unpaidCount = unpaid.length;
      const amountDue = unpaidCount * 125;
      const newStatus = unpaidCount === 0 ? 'Al día' : (unpaidCount > 3 ? 'En mora' : 'Pendiente');

      const updatedSocio: Socio = {
        ...selectedSocio,
        estadoCuotas: newStatus as any,
        montoPendiente: amountDue,
        fechaUltimoPago: fechaPago,
        historialPagos: updatedHistorial
      };

      await firebaseService.saveSocio(updatedSocio);
      setSuccess(true);
      showToast('¡Comprobante de pago registrado con éxito!', 'success');
    } catch (err) {
      console.error('Error reporting payment:', err);
      showToast('Hubo un problema al registrar tu pago. Por favor intenta de nuevo.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-blue-900 font-bold">Cargando pasarela de cobro...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-slate-50/50 py-6 px-4 flex items-start justify-center pt-2 sm:pt-4">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 text-left relative overflow-visible">
        
        {/* Banner decorative top */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-900 via-amber-500 to-blue-900 rounded-t-3xl"></div>

        {/* Logo and Header */}
        <div className="text-center mb-6 pt-2">
          <div className="w-20 h-20 bg-blue-950 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-900/10 border border-amber-400 overflow-hidden p-1">
            <img src="images/logo.png" alt="Logo Club de Leones" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mt-4 leading-none">Club de Leones Quetzaltenango</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Registro y Reporte de Aportaciones</p>
        </div>

        {success ? (
          <div className="text-center py-10 space-y-4 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 flex items-center justify-center mx-auto shadow-md">
              <Check className="stroke-[3]" size={32} />
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">¡Reporte Enviado!</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Hemos registrado el comprobante de tu aportación correctamente. El tesorero verificará la transferencia/depósito a la brevedad. ¡Muchas gracias por tu compromiso!
            </p>
            <div className="pt-6">
              <button
                onClick={() => {
                  setSuccess(false);
                  setSelectedSocio(null);
                  setSearchQuery('');
                  setFormState(prev => ({
                    ...prev,
                    comprobanteBase64: '',
                    numeroReferencia: '',
                    bancoReferencia: ''
                  }));
                }}
                className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
              >
                Reportar Otro Pago
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Bank account details card */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3">
              <div className="bg-amber-100 p-2 rounded-xl text-amber-700 mt-0.5">
                <Building size={18} />
              </div>
              <div className="text-xs space-y-1">
                <h4 className="font-extrabold text-amber-900 leading-none">Información de Cuenta Bancaria</h4>
                <p className="text-slate-655 font-medium leading-relaxed mt-1">Realiza tu depósito o transferencia bancaria a la siguiente cuenta oficial:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1.5 text-[11px]">
                  <p className="text-slate-500 font-bold">Banco:</p>
                  <p className="text-slate-800 font-extrabold">Banrural</p>
                  <p className="text-slate-500 font-bold">Tipo de Cuenta:</p>
                  <p className="text-slate-800 font-extrabold">Monetaria</p>
                  <p className="text-slate-500 font-bold">No. Cuenta:</p>
                  <p className="text-amber-950 font-black">3827008588</p>
                  <p className="text-slate-500 font-bold">A Nombre de:</p>
                  <p className="text-slate-800 font-extrabold">Club de Leones de Quetzaltenango</p>
                </div>
              </div>
            </div>

            {/* Step 1: Socio Identification */}
            <div className="space-y-1.5 relative">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">1. Selecciona tu Nombre</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Escribe tu nombre para buscar..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedSocio(null);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-xs font-semibold text-slate-850"
                />
                {selectedSocio && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSocio(null);
                      setSearchQuery('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {showSearchDropdown && filteredSocios.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100 animate-in fade-in duration-100">
                  {filteredSocios.map(socio => (
                    <button
                      key={socio.id}
                      type="button"
                      onClick={() => handleSocioSelect(socio)}
                      className="w-full px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between text-left"
                    >
                      <div>
                        <p className="text-xs font-extrabold text-slate-800">{socio.nombre}</p>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">{socio.puesto || 'Socio'}</p>
                      </div>
                      <span className="text-[9px] bg-blue-50 text-blue-900 border border-blue-150 px-2 py-0.5 rounded-full font-bold">Seleccionar</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedSocio && (
              <div className="bg-slate-50 border rounded-2xl p-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                
                {/* 2. Seleccionar Tipo de Cuota */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">2. Tipo de Aportación</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => setFormState(prev => ({ ...prev, tipoCuota: 'ordinaria' }))}
                      className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider border text-center transition-all ${
                        formState.tipoCuota === 'ordinaria'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-600/10'
                          : 'bg-white hover:bg-slate-50 text-slate-655 border-slate-200'
                      }`}
                    >
                      Ordinaria
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormState(prev => ({ ...prev, tipoCuota: 'inscripcion' }))}
                      className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider border text-center transition-all ${
                        formState.tipoCuota === 'inscripcion'
                          ? 'bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-600/10'
                          : 'bg-white hover:bg-slate-50 text-slate-655 border-slate-200'
                      }`}
                    >
                      Inscripción
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormState(prev => ({ ...prev, tipoCuota: 'extraordinaria' }))}
                      className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider border text-center transition-all ${
                        formState.tipoCuota === 'extraordinaria'
                          ? 'bg-amber-600 text-white border-amber-700 shadow-md shadow-amber-600/10'
                          : 'bg-white hover:bg-slate-50 text-slate-655 border-slate-200'
                      }`}
                    >
                      Extraordinaria
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormState(prev => ({ ...prev, tipoCuota: 'donacion' }))}
                      className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider border text-center transition-all ${
                        formState.tipoCuota === 'donacion'
                          ? 'bg-purple-600 text-white border-purple-700 shadow-md shadow-purple-600/10'
                          : 'bg-white hover:bg-slate-50 text-slate-655 border-slate-200'
                      }`}
                    >
                      Donación
                    </button>
                  </div>
                </div>

                {/* Info and configuration block based on cuota type */}
                {formState.tipoCuota === 'inscripcion' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-[10px] text-blue-900 font-bold space-y-1">
                    <p className="font-extrabold uppercase text-blue-950 tracking-wide">La cuota de inscripción (Q750) incluye:</p>
                    <p>✓ Registro oficial a Lions International</p>
                    <p>✓ Chaleco protocolario del club</p>
                    <p>✓ Primera cuota ordinaria mensual</p>
                    <p>✓ Cena formal de bienvenida</p>
                    <p>✓ Folder leonístico de membresía</p>
                  </div>
                )}

                {formState.tipoCuota === 'ordinaria' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Temporalidad de Pago</label>
                      <select
                        value={formState.tipoPeriodo}
                        onChange={e => setFormState(prev => ({ ...prev, tipoPeriodo: e.target.value as any }))}
                        className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-xs font-semibold text-slate-700"
                      >
                        <option value="Mensual">Mensual (1 mes / Q125)</option>
                        <option value="Trimestral">Trimestral (3 meses / Q375)</option>
                        <option value="Semestral">Semestral (6 meses / Q750)</option>
                        <option value="Anual">Anual (12 meses / Q1,500)</option>
                      </select>
                    </div>

                    {formState.tipoPeriodo === 'Mensual' && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mes a Cancelar</label>
                        {selectedSocio ? (
                          <div className="w-full px-2.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 select-none">
                            {formState.mes} {formState.año}
                          </div>
                        ) : (
                          <select
                            disabled
                            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-400 cursor-not-allowed"
                          >
                            <option>Seleccione un socio primero</option>
                          </select>
                        )}
                      </div>
                    )}

                    {formState.tipoPeriodo !== 'Mensual' && (
                      <div className="col-span-1 sm:col-span-2 grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mes de Inicio</label>
                          <select
                            value={formState.mes || 'Enero'}
                            onChange={e => setFormState(prev => ({ ...prev, mes: e.target.value }))}
                            className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-xs font-semibold text-slate-700"
                          >
                            {months.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Año de Inicio</label>
                          <select
                            value={formState.año}
                            onChange={e => setFormState(prev => ({ ...prev, año: Number(e.target.value) }))}
                            className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-xs font-semibold text-slate-700"
                          >
                            {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                        <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-605 font-bold select-none">
                          {(() => {
                            const startMonth = formState.mes || 'Enero';
                            const startYear = formState.año || 2026;
                            let monthsToAdd = 2; // Trimestral
                            let periodLabel = 'Trimestre';
                            if (formState.tipoPeriodo === 'Semestral') {
                              monthsToAdd = 5;
                              periodLabel = 'Semestre';
                            } else if (formState.tipoPeriodo === 'Anual') {
                              monthsToAdd = 11;
                              periodLabel = 'Año';
                            }
                            const end = getEndMonthAndYear(startMonth, startYear, monthsToAdd);
                            return (
                              <>
                                <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Periodo de Cobertura</span>
                                <span className="text-slate-800 font-extrabold uppercase">
                                  {periodLabel}: {startMonth} {startYear} &rarr; {end.month} {end.year}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Amount, Date, and Reference */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Monto a Reportar (Q)</label>
                    <input
                      type="number"
                      value={formState.monto}
                      disabled={formState.tipoCuota === 'inscripcion' || formState.tipoCuota === 'ordinaria'}
                      onChange={e => setFormState(prev => ({ ...prev, monto: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-2.5 py-2 bg-white disabled:bg-slate-100 disabled:text-slate-500 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-xs font-black text-slate-850"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha del Depósito / Transf.</label>
                    <input
                      type="date"
                      value={formState.fechaPago}
                      onChange={e => setFormState(prev => ({ ...prev, fechaPago: e.target.value }))}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Banco/Cuenta de origen</label>
                    <select
                      value={formState.bancoReferencia}
                      onChange={e => setFormState(prev => ({ ...prev, bancoReferencia: e.target.value }))}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-xs font-semibold text-slate-700"
                    >
                      <option value="">Selecciona un banco...</option>
                      <option value="Banco Industrial">Banco Industrial</option>
                      <option value="Banco de Desarrollo Rural (Banrural)">Banco de Desarrollo Rural (Banrural)</option>
                      <option value="Banco G&T Continental">Banco G&T Continental</option>
                      <option value="Banco de América Central (BAC)">Banco de América Central (BAC)</option>
                      <option value="Banco de los Trabajadores (Bantrab)">Banco de los Trabajadores (Bantrab)</option>
                      <option value="Banco Agromercantil (BAM)">Banco Agromercantil (BAM)</option>
                      <option value="Banco Azteca de Guatemala">Banco Azteca de Guatemala</option>
                      <option value="Banco Cuscatlán Guatemala">Banco Cuscatlán Guatemala</option>
                      <option value="Banco de Antigua">Banco de Antigua</option>
                      <option value="El Crédito Hipotecario Nacional (CHN)">El Crédito Hipotecario Nacional (CHN)</option>
                      <option value="Banco Credicorp">Banco Credicorp</option>
                      <option value="Banco Ficohsa Guatemala">Banco Ficohsa Guatemala</option>
                      <option value="Banco Internacional">Banco Internacional</option>
                      <option value="Banco Promerica">Banco Promerica</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Autorización/Boleta</label>
                    <input
                      type="text"
                      placeholder="Ej. 123456 / Boleta 789"
                      value={formState.numeroReferencia}
                      onChange={e => setFormState(prev => ({ ...prev, numeroReferencia: e.target.value }))}
                      className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Notas / Descripción adicional</label>
                  <textarea
                    placeholder="Escribe notas relevantes sobre este depósito aquí..."
                    value={formState.descripcion}
                    onChange={e => setFormState(prev => ({ ...prev, descripcion: e.target.value }))}
                    rows={2}
                    className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-xs font-medium text-slate-700"
                  />
                </div>

                {/* File Upload Receipt Capture */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Subir Foto o Captura del Comprobante</label>
                  <div className="flex items-center space-x-3">
                    <div className="relative flex-1 bg-white border border-dashed border-slate-300 hover:border-slate-400 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all active:scale-[0.99]">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Upload className="text-slate-400 mb-1" size={20} />
                      <span className="text-[10px] font-extrabold text-slate-655">Presiona para cargar captura</span>
                      <span className="text-[8px] text-slate-400 font-semibold mt-0.5">JPG, PNG o GIF</span>
                    </div>

                    {formState.comprobanteBase64 && (
                      <div className="relative w-16 h-16 flex-shrink-0 mr-1.5 mt-1.5 mb-1.5">
                        <div className="w-full h-full border border-slate-200 rounded-2xl overflow-hidden bg-slate-100 shadow-md">
                          <img
                            src={formState.comprobanteBase64}
                            alt="Vista previa del recibo"
                            className="block w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormState(prev => ({ ...prev, comprobanteBase64: '' }))}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center rounded-full shadow-md transition-colors border border-white p-0 m-0 cursor-pointer focus:outline-none"
                          title="Eliminar comprobante"
                        >
                          <X size={10} className="stroke-[3.5]" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-600/25 text-xs uppercase tracking-wider flex items-center justify-center space-x-2 active:scale-95"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Subiendo Comprobante...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} className="stroke-[3]" />
                        <span>Enviar Reporte de Pago</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default PublicPagoCuota;
