import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Plus, 
  Search, 
  Clock, 
  Printer, 
  QrCode, 
  LogOut, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  History, 
  Calendar, 
  DollarSign, 
  Tag,
  Sparkles,
  X
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { firebaseService } from '../services/firebaseService';
import { VehiculoParqueo } from '../types';


const PALETA_COLORES = [
  { hex: '#FFFFFF', name: 'Blanco', border: 'border-slate-300' },
  { hex: '#000000', name: 'Negro', border: 'border-black' },
  { hex: '#64748B', name: 'Gris / Plata', border: 'border-slate-500' },
  { hex: '#EF4444', name: 'Rojo', border: 'border-red-650' },
  { hex: '#3B82F6', name: 'Azul', border: 'border-blue-600' },
  { hex: '#F59E0B', name: 'Amarillo', border: 'border-yellow-600' },
  { hex: '#10B981', name: 'Verde', border: 'border-emerald-600' },
  { hex: '#B45309', name: 'Café', border: 'border-amber-900' },
  { hex: '#F5F5DC', name: 'Beige', border: 'border-slate-300' },
  { hex: '#F97316', name: 'Naranja', border: 'border-orange-600' },
  { hex: '#7F1D1D', name: 'Corinto', border: 'border-red-950' },
  { hex: '#1E3A8A', name: 'Azul Marino', border: 'border-blue-950' },
];

const TIPOS_PLACA = [
  { value: 'P', label: 'Particular (P)' },
  { value: 'C', label: 'Comercial (C)' },
  { value: 'M', label: 'Motocicleta (M)' },
  { value: 'O', label: 'Oficial (O)' },
  { value: 'CD', label: 'Cuerpo Diplomático (CD)' }
];

export const ParqueoManager: React.FC = () => {
  // Persistence with Firestore real-time
  const [vehiculos, setVehiculos] = useState<VehiculoParqueo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'parqueo'), orderBy('horaEntrada', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: VehiculoParqueo[] = [];
      snapshot.forEach(doc => {
        list.push(doc.data() as VehiculoParqueo);
      });
      setVehiculos(list);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching vehiculos in real-time:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const [activeTab, setActiveTab] = useState<'ingreso' | 'salida' | 'historial'>('ingreso');
  const [showCierreModal, setShowCierreModal] = useState(false);
  const [tipoPlaca, setTipoPlaca] = useState('P');
  const [numeroPlaca, setNumeroPlaca] = useState('');
  const [placaNumeros, setPlacaNumeros] = useState('');
  const [placaLetras, setPlacaLetras] = useState('');
  const [isExtranjera, setIsExtranjera] = useState(false);
  const [colorSeleccionado, setColorSeleccionado] = useState(PALETA_COLORES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // States for ticket and active vehicle interactions
  const [ticketVehiculo, setTicketVehiculo] = useState<VehiculoParqueo | null>(null);
  const [showExitModal, setShowExitModal] = useState<VehiculoParqueo | null>(null);
  
  // Real-time elapsed time trigger
  const [timeTrigger, setTimeTrigger] = useState(0);



  // Live timer tick
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeTrigger(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Guatemala license plate validation (3 numbers, 3 letters)
  const validatePlacaGuatemala = (val: string) => {
    const regex = /^\d{3}[A-Z]{3}$/;
    return regex.test(val.toUpperCase().replace(/[\s-]/g, ''));
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    
    let placaLimpia = '';
    
    if (isExtranjera) {
      placaLimpia = numeroPlaca.trim().toUpperCase().replace(/[\s-]/g, '');
      if (placaLimpia === '') {
        alert('Error: El número de placa es obligatorio.');
        return;
      }
    } else {
      placaLimpia = `${placaNumeros}${placaLetras}`.toUpperCase();
      if (!validatePlacaGuatemala(placaLimpia)) {
        alert('Error: La placa estándar de Guatemala debe tener 3 números seguidos de 3 letras (Ej: 123ABC).');
        return;
      }
    }

    const nuevoVehiculo: VehiculoParqueo = {
      id: `parq-${Date.now()}`,
      tipoPlaca: isExtranjera ? 'Extranjera' : tipoPlaca,
      numeroPlaca: placaLimpia,
      isExtranjera,
      color: colorSeleccionado.hex,
      colorLabel: colorSeleccionado.name,
      horaEntrada: new Date().toISOString(),
      estado: 'Activo'
    };

    firebaseService.saveVehiculoParqueo(nuevoVehiculo).catch(e => {
      console.error(e);
      alert("Error al registrar vehículo en la base de datos.");
    });
    setTicketVehiculo(nuevoVehiculo);
    
    // Reset form
    setNumeroPlaca('');
    setPlacaNumeros('');
    setPlacaLetras('');
    setIsExtranjera(false);
    setColorSeleccionado(PALETA_COLORES[0]);
  };

  // Calculate elapsed time formatted (HH:MM:SS)
  const getTiempoTranscurrido = (entradaStr: string, salidaStr?: string) => {
    const entrada = new Date(entradaStr).getTime();
    const salida = salidaStr ? new Date(salidaStr).getTime() : Date.now();
    const diffMs = salida - entrada;
    
    if (diffMs < 0) return '00:00:00';

    const diffHrs = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(diffHrs)}:${pad(diffMins)}:${pad(diffSecs)}`;
  };

  // Pricing Rule: Q5.00 for every 30 minutes (or fraction). 0 to 29 mins = Q5, 30 to 59 mins = Q10...
  const calcularCosto = (entradaStr: string, salidaStr: string) => {
    const entrada = new Date(entradaStr).getTime();
    const salida = new Date(salidaStr).getTime();
    const diffMs = salida - entrada;
    const diffMins = Math.max(0, diffMs / 60000);

    return Math.floor(diffMins / 30) * 5.00 + 5.00;
  };

  const handleProcessExit = (vehiculo: VehiculoParqueo) => {
    const horaSalida = new Date().toISOString();
    const costo = calcularCosto(vehiculo.horaEntrada, horaSalida);
    
    const vehiculoSalida = {
      ...vehiculo,
      horaSalida,
      estado: 'Completado' as const,
      costo,
      metodoPago: 'Efectivo' as const
    };
    
    setShowExitModal(vehiculoSalida);
  };

  const confirmExit = () => {
    if (!showExitModal) return;

    firebaseService.saveVehiculoParqueo(showExitModal).catch(e => {
      console.error(e);
      alert("Error al guardar la salida.");
    });
    setShowExitModal(null);
  };

  const handlePrintTicket = async (vehiculo: VehiculoParqueo) => {
    // Generate 80mm thermal receipt PDF using jsPDF
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 150] // Typical ticket size
    });

    try {
      // Generate QR Code locally instantly (no network request = fast)
      const qrDataUrl = await QRCode.toDataURL(vehiculo.id, {
        width: 150,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('CLUB DE LEONES', 40, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.text('QUETZALTENANGO', 40, 20, { align: 'center' });
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('TICKET DE ESTACIONAMIENTO', 40, 25, { align: 'center' });
      doc.text('--------------------------------------------', 40, 28, { align: 'center' });

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`PLACA: ${vehiculo.tipoPlaca === 'Extranjera' ? '' : vehiculo.tipoPlaca + '-'}${vehiculo.numeroPlaca}`, 40, 35, { align: 'center' });
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Color: ${vehiculo.colorLabel}`, 40, 40, { align: 'center' });
      
      const fechaEntrada = new Date(vehiculo.horaEntrada);
      doc.text(`Fecha: ${fechaEntrada.toLocaleDateString()}`, 40, 45, { align: 'center' });
      doc.text(`Entrada: ${fechaEntrada.toLocaleTimeString()}`, 40, 50, { align: 'center' });
      
      // QR Code
      doc.addImage(qrDataUrl, 'PNG', 20, 56, 40, 40);

      doc.setFontSize(8);
      doc.text('Escanee para salida de parqueo', 40, 103, { align: 'center' });
      doc.text('--------------------------------------------', 40, 108, { align: 'center' });
      
      doc.setFontSize(7);
      doc.text('Tarifa: Q5.00 cada 30 minutos', 40, 113, { align: 'center' });
      doc.text('o fracción de tiempo', 40, 117, { align: 'center' });
      doc.text('No nos hacemos responsables por objetos', 40, 122, { align: 'center' });
      doc.text('dejados dentro del vehículo.', 40, 125, { align: 'center' });
      
      doc.setFont('Helvetica', 'bold');
      doc.text('¡GRACIAS POR SU VISITA!', 40, 133, { align: 'center' });

      const pdfBlob = doc.output('blob');
      const filename = `Ticket-${vehiculo.numeroPlaca}.pdf`;
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Usar Web Share API para móviles (Permite WhatsApp, Impresión WiFi/Bluetooth nativa)
      const isMobile = /Mobi|Android/i.test(navigator.userAgent);
      
      // Intentar compartir nativamente en móviles
      if (isMobile && navigator.share) {
        const file = new File([pdfBlob], filename, { type: 'application/pdf' });
        navigator.share({
          title: 'Ticket de Parqueo',
          text: `Ticket de estacionamiento para placa: ${vehiculo.numeroPlaca}`,
          files: [file]
        }).catch(err => {
          console.log('Share cancelado o no soportado para archivos', err);
          // Fallback a descarga
          const a = document.createElement('a');
          a.href = pdfUrl;
          a.download = filename;
          a.click();
        });
      } else {
        // En computadora (Web): Usar Iframe invisible para impresión directa profesional
        doc.autoPrint();
        const iframeUrl = doc.output('bloburl');
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = iframeUrl.toString();
        document.body.appendChild(iframe);
        
        iframe.onload = () => {
          setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          }, 300);
        };
      }
    } catch (error) {
      console.error('Error generando QR o Ticket local:', error);
      alert('Error al procesar el ticket de impresión.');
    }
  };

  const handleDeleteHistory = (id: string) => {
    if (confirm('¿Desea eliminar este registro del historial permanentemente?')) {
      firebaseService.deleteVehiculoParqueo(id).catch(e => {
        console.error(e);
        alert("Error al eliminar el vehículo.");
      });
    }
  };

  // Filter lists
  const vehiculosActivos = vehiculos.filter(v => v.estado === 'Activo');
  const vehiculosHistorial = vehiculos.filter(v => v.estado === 'Completado');

  const filteredHistorial = vehiculosHistorial.filter(v => 
    v.numeroPlaca.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.colorLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.tipoPlaca.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      
      {/* Tab Navigation Segmented Control */}
      <div className="flex flex-col sm:flex-row bg-slate-100/80 backdrop-blur-md p-2 rounded-[1.5rem] w-full max-w-2xl mx-auto shadow-inner border border-slate-200/50 mb-8 gap-2 sm:gap-0">
        <button 
          onClick={() => setActiveTab('ingreso')}
          className={`flex-1 py-3.5 text-sm font-black transition-all duration-300 rounded-xl flex items-center justify-center space-x-2 ${activeTab === 'ingreso' ? 'bg-white shadow-md text-blue-900 transform scale-[1.02]' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
        >
          <Plus size={16} className={activeTab === 'ingreso' ? 'text-blue-600' : 'text-slate-400'} />
          <span>Ingreso de Vehículo</span>
        </button>
        <button 
          onClick={() => setActiveTab('salida')}
          className={`flex-1 py-3.5 text-sm font-black transition-all duration-300 rounded-xl flex items-center justify-center space-x-2 ${activeTab === 'salida' ? 'bg-white shadow-md text-blue-900 transform scale-[1.02]' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
        >
          <LogOut size={16} className={activeTab === 'salida' ? 'text-red-500' : 'text-slate-400'} />
          <span>Dar Salida</span>
          {vehiculosActivos.length > 0 && (
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-blue-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm">{vehiculosActivos.length}</span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('historial')}
          className={`flex-1 py-3.5 text-sm font-black transition-all duration-300 rounded-xl flex items-center justify-center space-x-2 ${activeTab === 'historial' ? 'bg-white shadow-md text-blue-900 transform scale-[1.02]' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
        >
          <History size={16} className={activeTab === 'historial' ? 'text-blue-600' : 'text-slate-400'} />
          <span>Historial</span>
        </button>
      </div>

      <div className="w-full">
        
        {/* Registration Form */}
        {activeTab === 'ingreso' && (
        <div className="w-full max-w-2xl mx-auto bg-white border border-slate-200/80 rounded-[2.5rem] p-6 sm:p-8 shadow-xl shadow-slate-200/40 flex flex-col space-y-8 animate-in slide-in-from-bottom-8 duration-500">
          <div className="flex items-center space-x-4 border-b border-slate-100 pb-5">
            <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl text-white shadow-lg shadow-yellow-500/30">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-xl tracking-tight">Ingreso de Vehículo</h3>
              <p className="text-xs text-slate-500 font-medium">Registrar nueva entrada al estacionamiento de forma rápida</p>
            </div>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-7">
            {/* Foreign check */}
            <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold text-slate-600">¿Placa extranjera o especial?</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isExtranjera} 
                  onChange={(e) => {
                    setIsExtranjera(e.target.checked);
                    setNumeroPlaca('');
                  }}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-900"></div>
              </label>
            </div>

            {/* Type selector (Only if not foreign) */}
            {!isExtranjera && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Placa</label>
                <div className="grid grid-cols-5 gap-2">
                  {TIPOS_PLACA.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTipoPlaca(t.value)}
                      className={`py-2 rounded-xl text-xs font-black transition-all border ${
                        tipoPlaca === t.value 
                          ? 'bg-blue-900 border-blue-950 text-white shadow-sm' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {t.value}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Plate Number */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Número de Placa</label>
              {isExtranjera ? (
                <input
                  type="text"
                  required
                  value={numeroPlaca}
                  onChange={(e) => setNumeroPlaca(e.target.value)}
                  placeholder="Ej. MEX-789-Z"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all outline-none"
                />
              ) : (
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      value={placaNumeros}
                      onChange={(e) => setPlacaNumeros(e.target.value.replace(/[^0-9]/g, '').substring(0, 3))}
                      placeholder="123"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center text-lg tracking-widest font-black text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all outline-none uppercase"
                    />
                    <span className="absolute -top-2 left-3 bg-white px-1 text-[9px] font-bold text-slate-400">Números</span>
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      required
                      value={placaLetras}
                      onChange={(e) => setPlacaLetras(e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase().substring(0, 3))}
                      placeholder="ABC"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center text-lg tracking-widest font-black text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all outline-none uppercase"
                    />
                    <span className="absolute -top-2 left-3 bg-white px-1 text-[9px] font-bold text-slate-400">Letras</span>
                  </div>
                </div>
              )}
              {!isExtranjera && (
                <p className="text-[9px] font-semibold text-slate-450 mt-1">
                  Formato de Guatemala: 3 números seguidos de 3 letras.
                </p>
              )}
            </div>

            {/* Color Palette Selector */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Color del Vehículo</label>
                <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                  {colorSeleccionado.name}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-2.5">
                {PALETA_COLORES.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setColorSeleccionado(color)}
                    style={{ backgroundColor: color.hex }}
                    className={`h-9 w-full rounded-xl transition-all border-2 relative flex items-center justify-center hover:scale-105 active:scale-95 ${
                      colorSeleccionado.name === color.name 
                        ? 'border-yellow-500 scale-105 ring-2 ring-yellow-400/20' 
                        : color.border
                    }`}
                    title={color.name}
                  >
                    {colorSeleccionado.name === color.name && (
                      <span className={`w-2 h-2 rounded-full ${color.name === 'Blanco' || color.name === 'Beige' ? 'bg-black' : 'bg-white'}`} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 mt-2 border-t border-slate-100">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-900 to-indigo-800 hover:from-blue-800 hover:to-indigo-700 text-white py-4 sm:py-5 rounded-[1.5rem] font-black text-sm sm:text-base shadow-xl shadow-blue-900/30 transition-all hover:shadow-2xl hover:-translate-y-1 active:scale-95 flex items-center justify-center space-x-3 overflow-hidden relative group border border-blue-800/50"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                <Plus size={20} className="relative z-10" />
                <span className="relative z-10 tracking-wide">Registrar e Imprimir Ticket</span>
              </button>
            </div>
          </form>
        </div>
        )}

        {/* Active Vehicles List */}
        {activeTab === 'salida' && (
        <div className="w-full bg-white border border-slate-200/80 rounded-[2.5rem] p-6 sm:p-8 shadow-xl shadow-slate-200/40 flex flex-col animate-in slide-in-from-bottom-8 duration-500">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 border-b border-slate-100 pb-5 mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
                <Car size={24} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg sm:text-xl tracking-tight">Vehículos Activos</h3>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Cronómetro en vivo y gestión de salidas</p>
              </div>
            </div>
            <span className="bg-yellow-100 border border-yellow-200 text-yellow-800 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center space-x-1.5 shadow-sm self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
              <span>En Curso: {vehiculosActivos.length}</span>
            </span>
          </div>

          {vehiculosActivos.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-450 border border-slate-100">
                <Car size={26} />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800">No hay vehículos estacionados</h4>
                <p className="text-xs text-slate-450 mt-1">Registra un nuevo vehículo usando el formulario de la izquierda.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow content-start">
              {vehiculosActivos.map((v) => (
                <div 
                  key={v.id} 
                  className="bg-white border border-slate-200/80 rounded-3xl p-5 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
                >
                  {/* Left accent color bar */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-3" 
                    style={{ backgroundColor: v.color }} 
                  />

                  <div className="pl-4 space-y-4">
                    {/* Header: Plate and actions */}
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {v.tipoPlaca}
                          </span>
                          <span className="text-lg font-black text-slate-800 tracking-tight">
                            {v.tipoPlaca === 'Extranjera' ? '' : v.tipoPlaca + '-'}{v.numeroPlaca}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1.5">
                          <span className="w-3 h-3 rounded-full border border-slate-300 shadow-sm" style={{ backgroundColor: v.color }}></span>
                          <p className="text-[11px] text-slate-500 font-bold">
                            {v.colorLabel}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handlePrintTicket(v)}
                          title="Reimprimir Ticket"
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        >
                          <Printer size={16} />
                        </button>
                        <button 
                          onClick={() => setTicketVehiculo(v)}
                          title="Mostrar QR"
                          className="p-2 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all"
                        >
                          <QrCode size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Timer and Exit Button */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 group-hover:bg-slate-100/50 transition-colors">
                      <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-center sm:justify-start">
                        <Clock size={16} className="text-blue-500 animate-pulse" />
                        <span className="text-sm font-black text-slate-800 font-mono tracking-wider">
                          {getTiempoTranscurrido(v.horaEntrada)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleProcessExit(v)}
                        className="w-full sm:w-auto bg-red-100 hover:bg-red-500 hover:text-white text-red-600 px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 active:scale-95 shadow-sm"
                      >
                        <LogOut size={14} />
                        <span>Dar Salida</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>

      {/* History and Logs panel */}
      {activeTab === 'historial' && (
      <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-7 shadow-sm space-y-6 animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
          <div>
            <h3 className="font-black text-slate-850 text-base">Historial de Parqueo</h3>
            <p className="text-[10px] text-slate-450 font-bold">Listado completo de vehículos que han salido del estacionamiento</p>
          </div>
          
          {/* Search input */}
          <div className="relative w-full md:w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar placa, color o tipo..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none transition-all"
            />
          </div>
        </div>

        {filteredHistorial.length === 0 ? (
          <div className="text-center py-12 text-slate-450">
            <Calendar size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="font-extrabold text-sm text-slate-700">No se encontraron registros en el historial</p>
            <p className="text-xs mt-1">Los registros completados aparecerán aquí después de procesar la salida.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-450 uppercase border-b border-slate-200">
                  <th className="py-4 px-5">Vehículo / Placa</th>
                  <th className="py-4 px-5">Color</th>
                  <th className="py-4 px-5">Hora Entrada</th>
                  <th className="py-4 px-5">Hora Salida</th>
                  <th className="py-4 px-5">Tiempo Total</th>
                  <th className="py-4 px-5">Costo Cobrado</th>
                  <th className="py-4 px-5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-750">
                {filteredHistorial.map((v) => {
                  const fEntrada = new Date(v.horaEntrada);
                  const fSalida = v.horaSalida ? new Date(v.horaSalida) : null;
                  return (
                    <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center space-x-2">
                          <span className="text-[9px] font-black bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                            {v.tipoPlaca}
                          </span>
                          <span className="font-black text-slate-900">
                            {v.tipoPlaca === 'Extranjera' ? '' : v.tipoPlaca + '-'}{v.numeroPlaca}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded-md border border-slate-300 flex-shrink-0" 
                            style={{ backgroundColor: v.color }} 
                          />
                          <span>{v.colorLabel}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div>{fEntrada.toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-450 font-bold">{fEntrada.toLocaleTimeString()}</div>
                      </td>
                      <td className="py-4 px-5">
                        {fSalida ? (
                          <>
                            <div>{fSalida.toLocaleDateString()}</div>
                            <div className="text-[10px] text-slate-450 font-bold">{fSalida.toLocaleTimeString()}</div>
                          </>
                        ) : 'N/A'}
                      </td>
                      <td className="py-4 px-5 font-mono text-slate-600">
                        {getTiempoTranscurrido(v.horaEntrada, v.horaSalida)}
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-emerald-650 font-black">
                          Q. {(v.costo || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <button
                          onClick={() => handleDeleteHistory(v.id)}
                          className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-all"
                          title="Eliminar registro"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* Bottom Action Footer: KPIs & Cierre */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 mt-8 border-t border-slate-200/50 animate-in slide-in-from-bottom-8 duration-700">
        <div className="bg-gradient-to-br from-blue-950 to-slate-900 text-white rounded-[2rem] p-6 shadow-xl shadow-blue-900/10 border border-blue-800/50 flex items-center justify-between group hover:shadow-2xl hover:shadow-blue-900/20 transition-all">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">Estacionados</span>
            <h3 className="text-4xl font-black mt-1 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">{vehiculosActivos.length}</h3>
            <p className="text-[10px] text-slate-400 mt-2 font-semibold">Vehículos dentro del predio</p>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 group-hover:scale-110 transition-transform">
            <Car size={32} className="text-blue-400" />
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-lg shadow-slate-200/50 border border-slate-200 flex items-center justify-between group hover:shadow-xl transition-all">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Histórico</span>
            <h3 className="text-4xl font-black text-slate-800 mt-1">{vehiculosHistorial.length}</h3>
            <p className="text-[10px] text-slate-500 mt-2 font-semibold">Servicios prestados globalmente</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:scale-110 transition-transform">
            <History size={32} className="text-slate-400" />
          </div>
        </div>

        <button 
          onClick={() => setShowCierreModal(true)}
          className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-[2rem] p-6 shadow-xl shadow-emerald-600/20 border border-emerald-500/50 flex items-center justify-between transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-600/30 active:scale-95 text-left group overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
          <div className="relative z-10">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Control Financiero</span>
            <h3 className="text-2xl font-black text-white mt-1 leading-tight group-hover:text-yellow-300 transition-colors">Realizar Cierre<br/>de Caja</h3>
          </div>
          <div className="p-4 bg-black/10 rounded-2xl border border-white/10 group-hover:rotate-12 transition-transform relative z-10">
            <DollarSign size={32} className="text-emerald-100" />
          </div>
        </button>
      </div>

      {/* QR Ticket Popup Modal */}
      {ticketVehiculo && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl p-6 border border-slate-100 text-center animate-in zoom-in-95 duration-200">
            <h4 className="text-lg font-black text-slate-900">Ticket Generado</h4>
            <p className="text-xs text-slate-500 mt-1">Detalles del ticket de entrada de parqueo</p>

            <div className="my-6 bg-slate-50 border border-slate-200/80 rounded-2xl p-5 inline-block space-y-4">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 inline-block shadow-sm">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticketVehiculo.id}`} 
                  alt="QR Ticket" 
                  className="w-36 h-36 mx-auto object-contain"
                />
              </div>
              <div className="text-left space-y-2 border-t border-dashed border-slate-200 pt-3">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-450">Placa:</span>
                  <span className="font-black text-slate-800">
                    {ticketVehiculo.tipoPlaca === 'Extranjera' ? '' : ticketVehiculo.tipoPlaca + '-'}{ticketVehiculo.numeroPlaca}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-450">Color:</span>
                  <span className="font-black text-slate-800">{ticketVehiculo.colorLabel}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-450">Entrada:</span>
                  <span className="font-black text-slate-800">
                    {new Date(ticketVehiculo.horaEntrada).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setTicketVehiculo(null)} 
                className="flex-1 px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold transition-all text-xs active:scale-95"
              >
                Cerrar Ventana
              </button>
              <button 
                onClick={() => {
                  handlePrintTicket(ticketVehiculo);
                  setTicketVehiculo(null);
                }} 
                className="flex-1 px-5 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold transition-all text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-blue-900/10 active:scale-95"
              >
                <Printer size={14} />
                <span>Imprimir Ticket</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit & Billing Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl p-6 border border-slate-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 border border-emerald-100">
              <CheckCircle size={32} />
            </div>
            
            <h4 className="text-lg font-black text-slate-900">Salida y Cobro</h4>
            <p className="text-xs text-slate-500 mt-1">Registrar la salida del vehículo</p>

            <div className="my-5 bg-slate-50 border border-slate-200/85 rounded-2xl p-4 text-left space-y-3.5">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
                <span className="text-xs font-black uppercase text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">
                  {showExitModal.tipoPlaca}
                </span>
                <span className="text-sm font-black text-slate-900">
                  {showExitModal.tipoPlaca === 'Extranjera' ? '' : showExitModal.tipoPlaca + '-'}{showExitModal.numeroPlaca}
                </span>
              </div>
              
              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-450">Hora de Entrada:</span>
                  <span className="font-bold text-slate-800">
                    {new Date(showExitModal.horaEntrada).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-450">Hora de Salida:</span>
                  <span className="font-bold text-slate-800">
                    {showExitModal.horaSalida ? new Date(showExitModal.horaSalida).toLocaleTimeString() : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-450">Tiempo Estacionado:</span>
                  <span className="font-black text-slate-800 font-mono">
                    {getTiempoTranscurrido(showExitModal.horaEntrada, showExitModal.horaSalida)}
                  </span>
                </div>
              </div>

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex justify-between items-center mt-2">
                <span className="text-xs font-black uppercase text-emerald-800">Total a Cobrar</span>
                <span className="text-lg font-black text-emerald-600">
                  Q. {(showExitModal.costo || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="pt-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Método de Pago</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Efectivo', 'Tarjeta', 'Transferencia'].map((metodo) => (
                    <button
                      key={metodo}
                      onClick={() => setShowExitModal({ ...showExitModal, metodoPago: metodo as any })}
                      className={`py-2 rounded-xl text-[10px] font-black transition-all border ${
                        showExitModal.metodoPago === metodo 
                          ? 'bg-emerald-600 border-emerald-700 text-white shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {metodo}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowExitModal(null)} 
                className="flex-1 px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold transition-all text-xs active:scale-95"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmExit}
                className="flex-1 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-600/10 active:scale-95"
              >
                <span>Confirmar Salida</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cierre de Caja Modal */}
      {showCierreModal && (() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const stats = {
          hoy: { total: 0, efectivo: 0, tarjeta: 0, transferencia: 0, count: 0 },
          semana: { total: 0, efectivo: 0, tarjeta: 0, transferencia: 0, count: 0 },
          mes: { total: 0, efectivo: 0, tarjeta: 0, transferencia: 0, count: 0 },
        };

        vehiculosHistorial.forEach(v => {
          if (!v.horaSalida) return;
          const date = new Date(v.horaSalida);
          const costo = v.costo || 0;
          const metodo = v.metodoPago || 'Efectivo';

          if (date >= monthStart) {
            stats.mes.total += costo;
            stats.mes.count++;
            if (metodo === 'Efectivo') stats.mes.efectivo += costo;
            else if (metodo === 'Tarjeta') stats.mes.tarjeta += costo;
            else stats.mes.transferencia += costo;
          }
          if (date >= weekStart) {
            stats.semana.total += costo;
            stats.semana.count++;
            if (metodo === 'Efectivo') stats.semana.efectivo += costo;
            else if (metodo === 'Tarjeta') stats.semana.tarjeta += costo;
            else stats.semana.transferencia += costo;
          }
          if (date >= today) {
            stats.hoy.total += costo;
            stats.hoy.count++;
            if (metodo === 'Efectivo') stats.hoy.efectivo += costo;
            else if (metodo === 'Tarjeta') stats.hoy.tarjeta += costo;
            else stats.hoy.transferencia += costo;
          }
        });

        const chartData = [
          { name: 'Efectivo', valor: stats.hoy.efectivo, color: '#10B981' },
          { name: 'Tarjeta', valor: stats.hoy.tarjeta, color: '#3B82F6' },
          { name: 'Transferencia', valor: stats.hoy.transferencia, color: '#F59E0B' },
        ];

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-50 rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
              {/* Header */}
              <div className="bg-white px-8 py-6 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                    <DollarSign size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Cierre de Caja</h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">Estadísticas y resumen de ingresos por método de pago</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCierreModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="p-8 space-y-8">
                
                {/* Hoy Summary */}
                <div>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Ingresos de Hoy</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-emerald-600 text-white rounded-3xl p-5 shadow-lg shadow-emerald-600/20">
                      <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Total Hoy</p>
                      <p className="text-3xl font-black mt-1">Q{stats.hoy.total.toLocaleString('es-GT', {minimumFractionDigits:2})}</p>
                      <p className="text-xs text-emerald-200 mt-2">{stats.hoy.count} tickets cobrados</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Efectivo</p>
                      <p className="text-2xl font-black text-slate-800 mt-1">Q{stats.hoy.efectivo.toLocaleString('es-GT', {minimumFractionDigits:2})}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tarjeta</p>
                      <p className="text-2xl font-black text-slate-800 mt-1">Q{stats.hoy.tarjeta.toLocaleString('es-GT', {minimumFractionDigits:2})}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transferencia</p>
                      <p className="text-2xl font-black text-slate-800 mt-1">Q{stats.hoy.transferencia.toLocaleString('es-GT', {minimumFractionDigits:2})}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Chart */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Distribución Hoy</h3>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} tickFormatter={(val) => `Q${val}`} />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }} 
                            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [`Q${value.toLocaleString('es-GT', {minimumFractionDigits:2})}`, 'Total']}
                          />
                          <Bar dataKey="valor" radius={[6, 6, 0, 0]} maxBarSize={50}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Semana / Mes Totals */}
                  <div className="space-y-4">
                    <div className="bg-blue-900 text-white rounded-3xl p-6 shadow-lg shadow-blue-900/20">
                      <p className="text-xs font-bold text-blue-200 uppercase tracking-wider">Acumulado Semana</p>
                      <p className="text-3xl font-black mt-1">Q{stats.semana.total.toLocaleString('es-GT', {minimumFractionDigits:2})}</p>
                      <p className="text-xs text-blue-300 mt-2">{stats.semana.count} tickets en total</p>
                    </div>
                    <div className="bg-indigo-950 text-white rounded-3xl p-6 shadow-lg shadow-indigo-950/20">
                      <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Acumulado Mes</p>
                      <p className="text-3xl font-black mt-1">Q{stats.mes.total.toLocaleString('es-GT', {minimumFractionDigits:2})}</p>
                      <p className="text-xs text-indigo-300 mt-2">{stats.mes.count} tickets en total</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="bg-slate-100 px-8 py-5 border-t border-slate-200 flex justify-end">
                <button 
                  onClick={() => setShowCierreModal(false)}
                  className="px-6 py-3 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold rounded-xl transition-all shadow-sm active:scale-95"
                >
                  Cerrar Panel
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
