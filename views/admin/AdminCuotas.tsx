import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  TrendingUp, Plus, Check, Send, ChevronDown, AlertTriangle, AlertCircle, CheckCircle, CreditCard, Download, DollarSign, X as XIcon, Search, Filter, Calendar, Users, Edit, Trash2, Image, Link2, Upload
} from 'lucide-react';
import { Socio, UserRole } from '../../types';
import { firebaseService } from '../../services/firebaseService';
import { useClubData } from '../../context/ClubDataContext';
import { generateReciboPagoPDF } from '../../utils/pdfGenerator';
import { useToast } from '../../context/ToastContext';

export const AdminCuotas: React.FC = () => {
  const { socios: dbSocios } = useClubData();
  const [socios, setSocios] = useState<Socio[]>(dbSocios);
  const { showToast } = useToast();

  React.useEffect(() => {
    setSocios(dbSocios);
  }, [dbSocios]);

  const [cuotasFilterStatus, setCuotasFilterStatus] = useState<'Todos' | 'al_dia' | 'pendiente' | 'en_mora'>('Todos');
  const [socioSearch, setSocioSearch] = useState('');
  const [selectedSocioForCuotas, setSelectedSocioForCuotas] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [temporalidadFilter, setTemporalidadFilter] = useState<'Todos' | '24h' | 'semana' | 'mes'>('Todos');
  const [tipoCuotaFilter, setTipoCuotaFilter] = useState<'Todos' | 'ordinaria' | 'inscripcion' | 'extraordinaria' | 'donacion'>('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const getPaymentRegistrationTime = (pago: any): number => {
    const parts = pago.id.split('-');
    if (parts[0] === 'pago' && parts[1]) {
      const ts = Number(parts[1]);
      if (!isNaN(ts) && ts > 0) {
        return ts;
      }
    }
    if (pago.fechaPago) {
      const date = new Date(pago.fechaPago + 'T12:00:00');
      return date.getTime();
    }
    return 0;
  };
  const [selectedMonthsToPay, setSelectedMonthsToPay] = useState<string[]>([]);
  const [editingPagoId, setEditingPagoId] = useState<string | null>(null);
  const [modalSocioSearch, setModalSocioSearch] = useState('');
  const [paymentSuccessData, setPaymentSuccessData] = useState<{ socioName: string; amount: number; period: string; method: string } | null>(null);
  const modalScrollRef = useRef<HTMLDivElement>(null);

  const [showRegistrarPagoModal, setShowRegistrarPagoModal] = useState(false);
  const [registrarPagoData, setRegistrarPagoData] = useState({
    socioId: '',
    tipoPeriodo: 'Mensual' as 'Mensual' | 'Semestral' | 'Anual' | 'Trimestral',
    mes: 'Enero',
    semestre: '1er Semestre (Ene-Jun)',
    año: 2026,
    monto: 125,
    metodo: 'Efectivo' as 'Efectivo' | 'Transferencia' | 'Depósito',
    bancoReferencia: '',
    numeroReferencia: '',
    fechaPago: new Date().toISOString().split('T')[0],
    tipoCuota: 'ordinaria' as 'ordinaria' | 'inscripcion' | 'extraordinaria' | 'donacion',
    descripcion: '',
    trimester: '1er Trimestre (Ene-Mar)' as '1er Trimestre (Ene-Mar)' | '2do Trimestre (Abr-Jun)' | '3er Trimestre (Jul-Sep)' | '4to Trimestre (Oct-Dic)',
    comprobanteBase64: '',
    comprobanteUrl: ''
  });

  useEffect(() => {
    if (registrarPagoData.metodo !== 'Efectivo' && modalScrollRef.current) {
      setTimeout(() => {
        modalScrollRef.current?.scrollTo({
          top: modalScrollRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 150);
    }
  }, [registrarPagoData.metodo]);

  const currentDate = useMemo(() => new Date(), []);
  const currentYear = useMemo(() => currentDate.getFullYear(), [currentDate]);
  const currentMonth = useMemo(() => currentDate.getMonth(), [currentDate]);

  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

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
    let startY = 2026;
    let startM = 0;
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

  const getNextUnpaidMonth = (socio: Socio): { month: string; year: number } => {
    let startY = 2026;
    let startM = 0;
    const limitYear = currentYear + 5;
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
    return { month: 'Enero', year: currentYear };
  };

  const handleEnviarRecordatorio = (socio: Socio) => {
    const unpaid = getSocioUnpaidMonths(socio);
    const pendingBalance = unpaid.length * 125;
    alert(`Recordatorio de cobro de Q${pendingBalance} enviado por correo a: ${socio.correo}`);
  };

  const handleRegistrarPago = (socioId: string) => {
    const socio = socios.find(s => s.id === socioId);
    if (!socio) return;
    const nextUnpaid = getNextUnpaidMonth(socio);
    const defaultSelected = [`${nextUnpaid.month} ${nextUnpaid.year}`];
    setSelectedMonthsToPay(defaultSelected);
    setEditingPagoId(null);
    setRegistrarPagoData(prev => ({
      ...prev,
      socioId,
      tipoPeriodo: 'Mensual',
      mes: nextUnpaid.month,
      año: nextUnpaid.year,
      monto: 125,
      tipoCuota: 'ordinaria',
      descripcion: '',
      trimester: '1er Trimestre (Ene-Mar)',
      comprobanteBase64: '',
      comprobanteUrl: ''
    }));
    setModalSocioSearch('');
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
      tipoPeriodo: pago.tipoPeriodo || 'Mensual',
      mes: mesVal,
      semestre: pago.tipoPeriodo === 'Semestral' ? pago.periodo : '1er Semestre (Ene-Jun)',
      año: añoVal,
      monto: pago.monto,
      metodo: pago.metodo as any,
      bancoReferencia: pago.bancoReferencia || '',
      numeroReferencia: pago.numeroReferencia || '',
      fechaPago: pago.fechaPago,
      tipoCuota: (pago.tipoCuota || 'ordinaria') as any,
      descripcion: pago.descripcion || '',
      trimester: '1er Trimestre (Ene-Mar)',
      comprobanteBase64: '',
      comprobanteUrl: pago.comprobanteUrl || ''
    });
    setModalSocioSearch('');
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
    try {
      const { 
        socioId, 
        tipoPeriodo, 
        mes, 
        año, 
        semestre, 
        monto, 
        metodo, 
        bancoReferencia, 
        numeroReferencia, 
        fechaPago,
        tipoCuota,
        descripcion,
        trimester,
        comprobanteBase64,
        comprobanteUrl
      } = registrarPagoData;
      if (!socioId) return;

      const socio = socios.find(s => s.id === socioId);
      if (!socio) return;

      // Check for duplicate payments if it's a regular cuota
      if (tipoCuota === 'ordinaria') {
        let monthsToCheck: { month: string; year: number }[] = [];
        if (tipoPeriodo === 'Mensual') {
          selectedMonthsToPay.forEach(monthYear => {
            const parts = monthYear.split(' ');
            const mName = parts[0];
            const yVal = Number(parts[1]) || año;
            monthsToCheck.push({ month: mName, year: yVal });
          });
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
          return socio.historialPagos?.some(p => {
            if (editingPagoId && p.id === editingPagoId) return false;
            const covered = getMonthsCoveredByPeriod(p);
            return covered.some(c => c.month === item.month && c.year === item.year);
          });
        });

        if (alreadyPaid.length > 0) {
          const paidList = alreadyPaid.map(x => `${x.month} ${x.year}`).join(', ');
          showToast(`El socio ya tiene aportaciones registradas para: ${paidList}`, 'error');
          return;
        }
      }

      // Upload receipt to storage if it's new (is a base64 string)
      let finalComprobanteUrl = comprobanteUrl;
      if (metodo !== 'Efectivo' && comprobanteBase64) {
        try {
          finalComprobanteUrl = await firebaseService.uploadReceiptImage(comprobanteBase64, socioId);
        } catch (err) {
          console.error("Error uploading receipt to Firebase Storage:", err);
        }
      }

      let nuevosPagos = [];
      if (tipoCuota === 'inscripcion') {
        nuevosPagos = [{
          id: editingPagoId || `pago-${Date.now()}`,
          fechaPago,
          monto: 750,
          periodo: 'Inscripción',
          tipoPeriodo: 'Mensual' as const,
          metodo,
          bancoReferencia: metodo !== 'Efectivo' ? bancoReferencia : undefined,
          numeroReferencia: metodo !== 'Efectivo' ? numeroReferencia : undefined,
          tipoCuota: 'inscripcion' as const,
          descripcion: descripcion || "Registro a Lions International, chaleco protocolario, primera cuota ordinaria, cena de bienvenida y folder leonístico.",
          comprobanteUrl: metodo !== 'Efectivo' ? finalComprobanteUrl : undefined
        }];
      } else if (tipoCuota === 'extraordinaria' || tipoCuota === 'donacion') {
        nuevosPagos = [{
          id: editingPagoId || `pago-${Date.now()}`,
          fechaPago,
          monto: Number(monto),
          periodo: tipoCuota === 'donacion' ? 'Donación' : 'Cuota Extraordinaria',
          tipoPeriodo: 'Mensual' as const,
          metodo,
          bancoReferencia: metodo !== 'Efectivo' ? bancoReferencia : undefined,
          numeroReferencia: metodo !== 'Efectivo' ? numeroReferencia : undefined,
          tipoCuota,
          descripcion,
          comprobanteUrl: metodo !== 'Efectivo' ? finalComprobanteUrl : undefined
        }];
      } else {
        // tipoCuota === 'ordinaria'
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
            numeroReferencia: metodo !== 'Efectivo' ? numeroReferencia : undefined,
            tipoCuota: 'ordinaria' as const,
            descripcion: descripcion || `Cuota Ordinaria ${monthYear}`,
            comprobanteUrl: metodo !== 'Efectivo' ? finalComprobanteUrl : undefined
          }));
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
            id: editingPagoId || `pago-${Date.now()}`,
            fechaPago,
            monto: Number(monto),
            periodo: periodStr,
            tipoPeriodo: tipoPeriodo as any,
            metodo,
            bancoReferencia: metodo !== 'Efectivo' ? bancoReferencia : undefined,
            numeroReferencia: metodo !== 'Efectivo' ? numeroReferencia : undefined,
            tipoCuota: 'ordinaria' as const,
            descripcion: descripcion || `Cuota Ordinaria ${periodStr}`,
            comprobanteUrl: metodo !== 'Efectivo' ? finalComprobanteUrl : undefined
          }];
        }
      }

      let cleanHistorial = socio.historialPagos || [];
      if (editingPagoId) {
        cleanHistorial = cleanHistorial.filter(p => p.id !== editingPagoId);
      }
      const updatedHistorial = [...nuevosPagos, ...cleanHistorial];
      
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

      await firebaseService.saveSocio(updatedSocio);
      showToast(editingPagoId ? '¡Aportación modificada con éxito!' : '¡Aportación registrada con éxito!', 'success');

      let displayPeriod = '';
      if (tipoCuota === 'inscripcion') displayPeriod = 'Inscripción';
      else if (tipoCuota === 'extraordinaria') displayPeriod = 'Cuota Extraordinaria';
      else if (tipoCuota === 'donacion') displayPeriod = 'Donación';
      else {
        if (tipoPeriodo === 'Mensual') displayPeriod = selectedMonthsToPay.join(', ');
        else if (tipoPeriodo === 'Trimestral') {
          const startMonth = mes || 'Enero';
          const startYear = año || 2026;
          const end = getEndMonthAndYear(startMonth, startYear, 2);
          displayPeriod = `Trimestre: ${startMonth} ${startYear} - ${end.month} ${end.year}`;
        }
        else if (tipoPeriodo === 'Semestral') {
          const startMonth = mes || 'Enero';
          const startYear = año || 2026;
          const end = getEndMonthAndYear(startMonth, startYear, 5);
          displayPeriod = `Semestre: ${startMonth} ${startYear} - ${end.month} ${end.year}`;
        }
        else {
          const startMonth = mes || 'Enero';
          const startYear = año || 2026;
          const end = getEndMonthAndYear(startMonth, startYear, 11);
          displayPeriod = `Anual: ${startMonth} ${startYear} - ${end.month} ${end.year}`;
        }
      }

      setPaymentSuccessData({
        socioName: socio.nombre,
        amount: Number(monto),
        period: displayPeriod,
        method: metodo
      });

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
        fechaPago: new Date().toISOString().split('T')[0],
        tipoCuota: 'ordinaria',
        descripcion: '',
        trimester: '1er Trimestre (Ene-Mar)',
        comprobanteBase64: '',
        comprobanteUrl: ''
      });
    } catch (err: any) {
      console.error("Error saving socio payment to Firebase:", err);
      showToast('Error al registrar la aportación.', 'error');
    }
  };

  const filteredSociosCuotas = useMemo(() => {
    const filtered = socios.filter(s => {
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

      const matchesTemporalidad = () => {
        if (temporalidadFilter === 'Todos') return true;
        if (!s.historialPagos || s.historialPagos.length === 0) return false;
        
        const now = Date.now();
        const limitMap = {
          '24h': 24 * 60 * 60 * 1000,
          'semana': 7 * 24 * 60 * 60 * 1000,
          'mes': 30 * 24 * 60 * 60 * 1000,
        };
        const limitTime = limitMap[temporalidadFilter];
        
        return s.historialPagos.some(pago => {
          const paymentTime = getPaymentRegistrationTime(pago);
          return (now - paymentTime) <= limitTime && (now - paymentTime) >= 0;
        });
      };

      const matchesTipoCuota = () => {
        if (tipoCuotaFilter === 'Todos') return true;
        if (!s.historialPagos || s.historialPagos.length === 0) return false;
        return s.historialPagos.some(pago => {
          let tipo = pago.tipoCuota;
          if (!tipo) {
            if (pago.periodo.toLowerCase().includes('inscrip')) tipo = 'inscripcion';
            else if (pago.periodo.toLowerCase().includes('donac')) tipo = 'donacion';
            else if (pago.periodo.toLowerCase().includes('extraord')) tipo = 'extraordinaria';
            else tipo = 'ordinaria';
          }
          return tipo === tipoCuotaFilter;
        });
      };

      return matchesSearch && matchesStatus && matchesTemporalidad() && matchesTipoCuota();
    });

    return filtered.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [socios, socioSearch, cuotasFilterStatus, temporalidadFilter, tipoCuotaFilter, currentYear, currentMonth]);

  useEffect(() => {
    setCurrentPage(1);
  }, [socioSearch, cuotasFilterStatus, temporalidadFilter, tipoCuotaFilter]);

  const paginatedSocios = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSociosCuotas.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSociosCuotas, currentPage]);

  const totalPages = Math.ceil(filteredSociosCuotas.length / ITEMS_PER_PAGE);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="text-left">
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">Cobros y Control de Cuotas</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Gestión Financiera de Aportaciones de Socios</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => {
              const publicUrl = `${window.location.origin}${window.location.pathname}#/pago-cuota`;
              navigator.clipboard.writeText(publicUrl);
              showToast('¡Enlace del formulario público copiado!', 'success');
            }}
            className="bg-amber-500 hover:bg-amber-600 text-white font-black px-5 py-3 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/10 active:scale-95 transition-all w-full sm:flex-1 md:w-auto text-xs"
            title="Copiar enlace del formulario de cobro para enviar a los socios"
          >
            <Link2 size={18} />
            <span>Compartir Enlace Público</span>
          </button>
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
            className="bg-green-600 hover:bg-green-700 text-white font-black px-6 py-3 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-green-600/10 active:scale-95 transition-all w-full sm:flex-1 md:w-auto text-xs"
          >
            <Plus size={18} />
            <span>Registrar Pago</span>
          </button>
        </div>
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
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
        <div className="relative w-full lg:max-w-[280px]">
          <Search className="absolute left-4 top-3 text-slate-400" size={18} />
          <input
            type="text"
            value={socioSearch}
            onChange={e => setSocioSearch(e.target.value)}
            placeholder="Buscar socio..."
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm font-semibold"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Filter Status */}
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

          {/* Temporalidad Filter */}
          <div className="flex items-center space-x-2 flex-grow sm:flex-grow-0 min-w-[170px]">
            <Calendar size={16} className="text-slate-400 flex-shrink-0" />
            <select 
              value={temporalidadFilter} 
              onChange={e => setTemporalidadFilter(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-900 w-full appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundPosition: 'right 8px center', backgroundSize: '16px', backgroundRepeat: 'no-repeat' }}
            >
              <option value="Todos">Cualquier Registro</option>
              <option value="24h">Registro: Últimas 24 Horas</option>
              <option value="semana">Registro: Última Semana</option>
              <option value="mes">Registro: Último Mes</option>
            </select>
          </div>

          {/* Tipo Cuota Filter */}
          <div className="flex items-center space-x-2 flex-grow sm:flex-grow-0 min-w-[170px]">
            <CreditCard size={16} className="text-slate-400 flex-shrink-0" />
            <select 
              value={tipoCuotaFilter} 
              onChange={e => setTipoCuotaFilter(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-900 w-full appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundPosition: 'right 8px center', backgroundSize: '16px', backgroundRepeat: 'no-repeat' }}
            >
              <option value="Todos">Todas las Aportaciones</option>
              <option value="ordinaria">Cuota Ordinaria</option>
              <option value="inscripcion">Inscripción</option>
              <option value="extraordinaria">Cuota Extraordinaria</option>
              <option value="donacion">Donación</option>
            </select>
          </div>

          {/* Selected Year */}
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
        {paginatedSocios.map(s => {
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
              {/* Grid layout dividing details, months, and stacked balance & actions to prevent overlap */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                
                {/* 1. Profile Info (and mobile-only balance side-by-side) */}
                <div className="lg:col-span-4 min-w-0">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-4 text-left min-w-0">
                      <img 
                        src={s.foto || 'https://picsum.photos/seed/socio/200/200'} 
                        alt={s.nombre} 
                        className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/socio/200/200';
                        }}
                      />
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight break-words">{s.nombre}</h4>
                        <p className="text-[10px] font-black text-slate-405 uppercase tracking-widest mt-1 truncate">{s.puesto || 'Socio Regular'}</p>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">{s.codigoSocio}</p>
                        
                        {/* Info of last payment and owed months */}
                        <div className="mt-2 space-y-1 text-[10px] font-bold">
                          <p className="text-slate-500 flex items-center gap-1.5 flex-wrap">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[8px] font-black tracking-wide uppercase">Último Pago:</span>
                            <span className="font-extrabold text-slate-700">{s.historialPagos?.[0]?.periodo || 'Ninguno'}</span>
                          </p>
                          {totalArrearsCount > 0 ? (
                            <p className="text-red-650 flex items-center gap-1.5">
                              <span className="bg-red-50 border border-red-200/50 px-1.5 py-0.5 rounded text-[8px] font-black tracking-wide uppercase">Debe:</span>
                              <span className="font-black">{totalArrearsCount} {totalArrearsCount === 1 ? 'mes' : 'meses'}</span>
                            </p>
                          ) : (
                            <p className="text-emerald-650 flex items-center gap-1.5">
                              <span className="bg-emerald-50 border border-emerald-250/50 px-1.5 py-0.5 rounded text-[8px] font-black tracking-wide uppercase">Solvente</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Mobile-only Balance */}
                    <div className="text-right lg:hidden flex-shrink-0 pl-2">
                      <span className="text-[9px] font-black text-slate-400 tracking-wider block">Saldo</span>
                      <span className="text-base font-black text-slate-800 leading-none mt-0.5 block">
                        Q {dynamicMontoPendiente.toLocaleString('es-GT', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Months Grid (Two rows of 6) - wrapped in background panel with fixed limits */}
                <div className="lg:col-span-4 flex justify-center lg:justify-start w-full">
                  <div className="bg-slate-50/70 border border-slate-100 p-2.5 rounded-2xl w-full max-w-[320px] flex-shrink-0">
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
                </div>

                {/* 3. Balance and Action Buttons stacked vertically to avoid horizontal overlap */}
                <div className="lg:col-span-4 flex flex-col items-stretch lg:items-end justify-center min-w-[160px] w-full">
                  {/* Desktop-only Balance */}
                  <div className="hidden lg:block text-right">
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
                      onClick={() => {
                        const shareUrl = `${window.location.origin}${window.location.pathname}#/pago-cuota?socioId=${s.id}`;
                        navigator.clipboard.writeText(shareUrl);
                        showToast('¡Enlace de cobro copiado al portapapeles!', 'success');
                      }}
                      className="bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 border border-amber-200/80 p-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm flex items-center justify-center flex-shrink-0"
                      title="Copiar enlace de cobro"
                    >
                      <Link2 size={14} />
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
                                {pago.comprobanteUrl && (
                                  <a 
                                    href={pago.comprobanteUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="bg-amber-50 text-amber-800 px-3 py-1.5 rounded-lg border border-amber-200 text-[10px] font-bold flex items-center space-x-1 active:scale-95 transition-all"
                                    title="Ver Comprobante"
                                  >
                                    <Image size={11} />
                                    <span>Recibo</span>
                                  </a>
                                )}
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
                                      {pago.comprobanteUrl && (
                                        <a 
                                          href={pago.comprobanteUrl} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="bg-amber-50 hover:bg-amber-100 text-amber-700 p-1.5 rounded-lg border border-amber-200 transition-all active:scale-90 inline-flex items-center justify-center"
                                          title="Ver Comprobante de Pago (Imagen)"
                                        >
                                          <Image size={12} />
                                        </a>
                                      )}
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-3xl shadow-sm mt-6">
          <span className="text-xs text-slate-500 font-bold">
            Mostrando socios {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredSociosCuotas.length)} al {Math.min(currentPage * ITEMS_PER_PAGE, filteredSociosCuotas.length)} de {filteredSociosCuotas.length}
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1"
            >
              &larr; Anterior
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-9 h-9 rounded-xl text-xs font-extrabold border transition-all active:scale-95 flex items-center justify-center ${
                  currentPage === page
                    ? 'bg-blue-900 text-white border-blue-900 shadow-md shadow-blue-900/10'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1"
            >
              Siguiente &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Registrar/Editar Pago Modal */}
      {showRegistrarPagoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 relative text-left max-h-[90vh] flex flex-col">
            <button 
              onClick={() => {
                setShowRegistrarPagoModal(false);
                setEditingPagoId(null);
                setSelectedMonthsToPay([]);
                setPaymentSuccessData(null);
              }}
              className="absolute top-5 right-5 p-2 text-slate-455 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors z-10"
            >
              <XIcon size={18} />
            </button>
            {paymentSuccessData ? (
              <div className="text-center py-6 space-y-5 animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 flex items-center justify-center mx-auto shadow-md">
                  <Check className="stroke-[3] text-emerald-600" size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">¡Cobro Registrado!</h3>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Aportación Procesada con Éxito</p>
                </div>
                
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5 text-xs text-slate-650 text-left">
                  <div className="flex justify-between items-start space-x-2">
                    <span className="font-bold text-slate-450 uppercase tracking-wider text-[10px]">Socio</span>
                    <span className="font-extrabold text-slate-805 text-right">{paymentSuccessData.socioName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Monto</span>
                    <span className="font-extrabold text-slate-850">Q {paymentSuccessData.amount.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-start space-x-2">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Periodo</span>
                    <span className="font-extrabold text-slate-805 text-right max-w-[200px] truncate" title={paymentSuccessData.period}>{paymentSuccessData.period}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Método</span>
                    <span className="font-extrabold text-slate-805">{paymentSuccessData.method}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setPaymentSuccessData(null);
                      setShowRegistrarPagoModal(false);
                    }}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl transition-all shadow-lg shadow-green-600/20 active:scale-95 text-xs text-center"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-slate-100 flex-shrink-0">
                  <div className="bg-green-50 p-2 rounded-full text-green-600 border border-green-100">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none">
                      {editingPagoId ? 'Editar Aportación' : 'Registrar Aportación'}
                    </h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Control de Cobros</p>
                  </div>
                </div>

            <div ref={modalScrollRef} className="space-y-3.5 overflow-y-auto pr-1 flex-1 min-h-0 text-slate-700">
              {/* 1. Seleccionar Socio */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Seleccionar Socio</label>
                {editingPagoId ? (
                  <div className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 select-none">
                    {socios.find(s => s.id === registrarPagoData.socioId)?.nombre || 'Socio'}
                  </div>
                ) : (
                  <div>
                    {registrarPagoData.socioId ? (
                      <div className="flex items-center justify-between p-2.5 bg-green-50/50 border border-green-200 rounded-xl animate-in fade-in duration-200">
                        <div className="flex items-center space-x-2.5">
                          <img 
                            src={socios.find(s => s.id === registrarPagoData.socioId)?.foto || 'https://picsum.photos/seed/socio/100/100'} 
                            alt="Socio" 
                            className="w-8 h-8 rounded-full object-cover border border-green-200 flex-shrink-0"
                          />
                          <div className="text-left">
                            <p className="font-extrabold text-slate-800 text-xs leading-tight">
                              {socios.find(s => s.id === registrarPagoData.socioId)?.nombre}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setRegistrarPagoData(prev => ({ ...prev, socioId: '' }));
                            setSelectedMonthsToPay([]);
                          }}
                          className="px-2 py-0.5 hover:bg-green-100 text-green-700 hover:text-green-800 rounded-lg transition-colors font-bold text-[10px] flex items-center space-x-1"
                        >
                          <span>Cambiar</span>
                          <XIcon size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5 relative">
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                          <input
                            type="text"
                            placeholder="Buscar socio por nombre..."
                            value={modalSocioSearch}
                            onChange={(e) => setModalSocioSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-xs font-semibold text-slate-800"
                          />
                          {modalSocioSearch && (
                            <button 
                              type="button"
                              onClick={() => setModalSocioSearch('')}
                              className="absolute right-3 top-2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                            >
                              <XIcon size={12} />
                            </button>
                          )}
                        </div>
                        
                        {(() => {
                          const query = modalSocioSearch.trim().toLowerCase();
                          const activeSocios = socios.filter(s => s.rol !== UserRole.DONANTE && s.rol !== UserRole.GUEST && s.estatus !== 'Inactive');
                          
                          const filtered = query 
                            ? activeSocios.filter(s => s.nombre.toLowerCase().includes(query))
                            : [];

                          if (query && filtered.length === 0) {
                            return <p className="text-[11px] text-slate-400 italic text-center p-2 bg-slate-50 rounded-lg border">No se encontraron socios.</p>;
                          }

                          if (filtered.length === 0) return null;

                          return (
                            <div className="border border-slate-200 rounded-xl divide-y bg-white shadow-inner p-1">
                              {filtered.slice(0, 1).map(s => {
                                return (
                                  <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => {
                                      const nextUnpaid = getNextUnpaidMonth(s);
                                      const defaultSelected = [`${nextUnpaid.month} ${nextUnpaid.year}`];
                                      setSelectedMonthsToPay(defaultSelected);
                                      setRegistrarPagoData(prev => ({
                                        ...prev,
                                        socioId: s.id,
                                        mes: nextUnpaid.month,
                                        año: nextUnpaid.year,
                                        monto: 125
                                      }));
                                      setModalSocioSearch('');
                                    }}
                                    className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors text-left"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <img 
                                        src={s.foto || 'https://picsum.photos/seed/socio/50/50'} 
                                        alt={s.nombre} 
                                        className="w-7 h-7 rounded-full object-cover border flex-shrink-0"
                                      />
                                      <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{s.nombre}</span>
                                    </div>
                                    <span className="text-[10px] text-green-705 font-bold bg-green-50 border border-green-150 px-2 py-0.5 rounded-md flex-shrink-0">
                                      Seleccionar
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Seleccionador de Tipo de Cuota */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tipo de Cuota</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200/60 w-full">
                  {(['ordinaria', 'inscripcion', 'extraordinaria', 'donacion'] as const).map(type => {
                    const labels: Record<string, string> = {
                      ordinaria: 'Ordinaria',
                      inscripcion: 'Inscripción',
                      extraordinaria: 'Extraordinaria',
                      donacion: 'Donación'
                    };
                    const colorClasses: Record<string, string> = {
                      ordinaria: 'bg-emerald-600 hover:bg-emerald-700',
                      inscripcion: 'bg-blue-600 hover:bg-blue-700',
                      extraordinaria: 'bg-amber-600 hover:bg-amber-700',
                      donacion: 'bg-purple-600 hover:bg-purple-700'
                    };
                    const isActive = registrarPagoData.tipoCuota === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          let defaultMonto = 125;
                          let defaultPeriodo = 'Mensual' as any;
                          let defaultDesc = '';
                          
                          if (type === 'inscripcion') {
                            defaultMonto = 750;
                            defaultDesc = "Registro a Lions International, chaleco protocolario, primera cuota ordinaria, cena de bienvenida y folder leonístico.";
                          } else if (type === 'extraordinaria') {
                            defaultMonto = 100;
                            defaultDesc = '';
                          } else if (type === 'donacion') {
                            defaultMonto = 500;
                            defaultDesc = '';
                          } else {
                            defaultMonto = selectedMonthsToPay.length * 125 || 125;
                            defaultPeriodo = 'Mensual';
                          }

                          setRegistrarPagoData(prev => ({
                            ...prev,
                            tipoCuota: type,
                            monto: defaultMonto,
                            tipoPeriodo: defaultPeriodo,
                            descripcion: defaultDesc
                          }));
                        }}
                        className={`py-1.5 text-center text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                          isActive 
                            ? `${colorClasses[type]} text-white shadow-sm` 
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {labels[type]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Fields based on selection */}
              {registrarPagoData.tipoCuota === 'inscripcion' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-[11px] text-blue-800 leading-relaxed font-semibold">
                  <span className="font-extrabold block text-blue-900 mb-0.5">Beneficios incluidos (Monto Fijo: Q 750.00)</span>
                  <p>Registro a Lions International, chaleco protocolario, primera cuota ordinaria, cena de bienvenida y folder leonístico.</p>
                </div>
              )}

              {registrarPagoData.tipoCuota === 'ordinaria' && (
                <div className="space-y-3">
                  {/* Temporality selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Temporalidad</label>
                    <div className="grid grid-cols-4 gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/60 w-full">
                      {(['Mensual', 'Trimestral', 'Semestral', 'Anual'] as const).map(p => {
                        const labels: Record<string, string> = {
                          Mensual: 'Mes',
                          Trimestral: 'Trimestre',
                          Semestral: 'Semestre',
                          Anual: 'Anual'
                        };
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => {
                              let defaultMonto = 125;
                              if (p === 'Trimestral') {
                                defaultMonto = 375;
                              } else if (p === 'Semestral') {
                                defaultMonto = 750;
                              } else if (p === 'Anual') {
                                defaultMonto = 1500;
                              } else {
                                defaultMonto = selectedMonthsToPay.length * 125 || 125;
                              }
                              setRegistrarPagoData(prev => ({
                                ...prev,
                                tipoPeriodo: p,
                                monto: defaultMonto
                              }));
                            }}
                            className={`py-1.5 text-center text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                              registrarPagoData.tipoPeriodo === p 
                                ? 'bg-emerald-600 text-white shadow-sm' 
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            {labels[p]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mensual Specific Selection */}
                  {registrarPagoData.tipoPeriodo === 'Mensual' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Mes a Cancelar
                      </label>
                      {registrarPagoData.socioId ? (
                        <div className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 select-none">
                          {selectedMonthsToPay.length > 0 ? (
                            selectedMonthsToPay[0]
                          ) : (
                            (() => {
                              const s = socios.find(x => x.id === registrarPagoData.socioId);
                              if (s) {
                                const nextU = getNextUnpaidMonth(s);
                                return `${nextU.month} ${nextU.year}`;
                              }
                              return 'Cargando...';
                            })()
                          )}
                        </div>
                      ) : (
                        <select
                          disabled
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-400 cursor-not-allowed"
                        >
                          <option>Seleccione un socio primero</option>
                        </select>
                      )}
                    </div>
                  )}

                  {/* Trimestral, Semestral, Anual Selection */}
                  {registrarPagoData.tipoPeriodo !== 'Mensual' && (
                    <div className="space-y-3.5">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mes de Inicio</label>
                          <select
                            value={registrarPagoData.mes || 'Enero'}
                            onChange={e => setRegistrarPagoData(prev => ({ ...prev, mes: e.target.value }))}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-xs font-semibold text-slate-800"
                          >
                            {months.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Año de Inicio</label>
                          <input 
                            type="number"
                            value={registrarPagoData.año || 2026}
                            onChange={e => setRegistrarPagoData(prev => ({ ...prev, año: parseInt(e.target.value) || 2026 }))}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-xs font-semibold text-slate-800"
                          />
                        </div>
                      </div>

                      {/* Preview of coverage */}
                      {(() => {
                        const startMonth = registrarPagoData.mes || 'Enero';
                        const startYear = registrarPagoData.año || 2026;
                        let monthsToAdd = 2; // Trimestral
                        let periodLabel = 'Trimestre';
                        if (registrarPagoData.tipoPeriodo === 'Semestral') {
                          monthsToAdd = 5;
                          periodLabel = 'Semestre';
                        } else if (registrarPagoData.tipoPeriodo === 'Anual') {
                          monthsToAdd = 11;
                          periodLabel = 'Año';
                        }
                        const end = getEndMonthAndYear(startMonth, startYear, monthsToAdd);
                        return (
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-650 font-bold select-none">
                            <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Periodo de Cobertura</span>
                            <span className="text-slate-800 font-extrabold uppercase">
                              {periodLabel}: {startMonth} {startYear} &rarr; {end.month} {end.year}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {(registrarPagoData.tipoCuota === 'extraordinaria' || registrarPagoData.tipoCuota === 'donacion') && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Descripción / Concepto</label>
                    <input 
                      type="text"
                      placeholder={registrarPagoData.tipoCuota === 'donacion' ? 'Ej. Donación para Teleton' : 'Ej. Cuota extraordinaria aniversario'}
                      value={registrarPagoData.descripcion}
                      onChange={e => setRegistrarPagoData(prev => ({ ...prev, descripcion: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Monto de Aportación (Q)</label>
                <input 
                  type="number"
                  value={registrarPagoData.monto}
                  onChange={e => setRegistrarPagoData(prev => ({ ...prev, monto: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-xs font-black text-slate-850"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Fecha del Pago</label>
                <input 
                  type="date"
                  value={registrarPagoData.fechaPago}
                  onChange={e => setRegistrarPagoData(prev => ({ ...prev, fechaPago: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Método de Pago</label>
                <select
                  value={registrarPagoData.metodo}
                  onChange={e => setRegistrarPagoData(prev => ({ ...prev, metodo: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-xs font-semibold text-slate-700"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Depósito">Depósito en Cuenta</option>
                </select>
              </div>

              {registrarPagoData.metodo !== 'Efectivo' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 animate-in slide-in-from-top-2 duration-300">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Banco/Cuenta de origen</label>
                    <select
                      value={registrarPagoData.bancoReferencia}
                      onChange={e => setRegistrarPagoData(prev => ({ ...prev, bancoReferencia: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-xs font-semibold text-slate-700"
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
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Autorización/Boleta</label>
                    <input 
                      type="text"
                      value={registrarPagoData.numeroReferencia}
                      onChange={e => setRegistrarPagoData(prev => ({ ...prev, numeroReferencia: e.target.value }))}
                      placeholder="Ej. 123456 / Boleta 789"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Comprobante de Pago (Imagen)</label>
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-2 px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-250 rounded-xl cursor-pointer text-xs font-bold transition-all active:scale-95 flex-shrink-0 select-none">
                        <Upload size={14} />
                        <span>Seleccionar archivo</span>
                        <input 
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setRegistrarPagoData(prev => ({
                                  ...prev,
                                  comprobanteBase64: reader.result as string
                                }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[11px] text-slate-400 font-semibold truncate flex-1 min-w-0 pr-2">
                        {registrarPagoData.comprobanteBase64 ? "Imagen cargada" : (registrarPagoData.comprobanteUrl ? "Comprobante guardado" : "Sin archivo seleccionado")}
                      </span>
                      {(registrarPagoData.comprobanteBase64 || registrarPagoData.comprobanteUrl) && (
                        <div className="relative w-12 h-12 flex-shrink-0 mr-1.5 mt-1.5 mb-1.5">
                          <div className="w-full h-full border border-slate-200 rounded-xl overflow-hidden bg-slate-100 shadow-sm">
                            <img 
                              src={registrarPagoData.comprobanteBase64 || registrarPagoData.comprobanteUrl} 
                              alt="Vista previa" 
                              className="block w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setRegistrarPagoData(prev => ({ ...prev, comprobanteBase64: '', comprobanteUrl: '' }))}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center rounded-full shadow-md transition-colors border border-white p-0 m-0 cursor-pointer focus:outline-none"
                            title="Eliminar comprobante"
                          >
                            <XIcon size={10} className="stroke-[3.5]" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-4 pt-3 border-t border-slate-100 flex-shrink-0">
              <button
                onClick={() => {
                  setShowRegistrarPagoModal(false);
                  setEditingPagoId(null);
                  setSelectedMonthsToPay([]);
                }}
                className="flex-1 py-2 text-slate-655 font-bold hover:bg-slate-50 border border-slate-200 rounded-xl transition-all text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarNuevoPago}
                disabled={
                  !registrarPagoData.socioId || 
                  (registrarPagoData.tipoCuota === 'ordinaria' && registrarPagoData.tipoPeriodo === 'Mensual' && selectedMonthsToPay.length === 0) || 
                  registrarPagoData.monto <= 0
                }
                className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-600/20 active:scale-95 text-xs"
              >
                {editingPagoId ? 'Guardar Cambios' : 'Confirmar Cobro'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
      )}
    </div>
  );
};
