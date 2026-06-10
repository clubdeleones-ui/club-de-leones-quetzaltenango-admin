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
  Sparkles
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface VehiculoParqueo {
  id: string;
  tipoPlaca: string; // P, C, M, O, CD, Extranjera
  numeroPlaca: string;
  isExtranjera: boolean;
  color: string; // Hex color
  colorLabel: string; // Name in Spanish
  horaEntrada: string; // ISO string
  horaSalida?: string; // ISO string
  estado: 'Activo' | 'Completado';
  costo?: number;
}

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
  // Persistence with localStorage
  const [vehiculos, setVehiculos] = useState<VehiculoParqueo[]>(() => {
    const saved = localStorage.getItem('club_leones_parqueo');
    return saved ? JSON.parse(saved) : [];
  });

  const [tipoPlaca, setTipoPlaca] = useState('P');
  const [numeroPlaca, setNumeroPlaca] = useState('');
  const [isExtranjera, setIsExtranjera] = useState(false);
  const [colorSeleccionado, setColorSeleccionado] = useState(PALETA_COLORES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // States for ticket and active vehicle interactions
  const [ticketVehiculo, setTicketVehiculo] = useState<VehiculoParqueo | null>(null);
  const [showExitModal, setShowExitModal] = useState<VehiculoParqueo | null>(null);
  
  // Real-time elapsed time trigger
  const [timeTrigger, setTimeTrigger] = useState(0);

  useEffect(() => {
    localStorage.setItem('club_leones_parqueo', JSON.stringify(vehiculos));
  }, [vehiculos]);

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
    
    let placaLimpia = numeroPlaca.trim().toUpperCase().replace(/[\s-]/g, '');
    
    if (!isExtranjera && !validatePlacaGuatemala(placaLimpia)) {
      alert('Error: La placa estándar de Guatemala debe tener 3 números seguidos de 3 letras (Ej: 123ABC). Si es otro formato, selecciona "Placa Extranjera / Especial".');
      return;
    }

    if (placaLimpia === '') {
      alert('Error: El número de placa es obligatorio.');
      return;
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

    setVehiculos(prev => [nuevoVehiculo, ...prev]);
    setTicketVehiculo(nuevoVehiculo);
    
    // Reset form
    setNumeroPlaca('');
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

  // Pricing Rule: Q10.00 first hour, then Q5.00 for every additional hour (or fraction)
  const calcularCosto = (entradaStr: string, salidaStr: string) => {
    const entrada = new Date(entradaStr).getTime();
    const salida = new Date(salidaStr).getTime();
    const diffMs = salida - entrada;
    const diffMins = Math.max(0, diffMs / 60000);

    if (diffMins <= 10) return 0; // 10 minutes grace period (free)

    const horasFacturables = Math.ceil(diffMins / 60);
    
    if (horasFacturables <= 1) return 10.00;
    return 10.00 + (horasFacturables - 1) * 5.00;
  };

  const handleProcessExit = (vehiculo: VehiculoParqueo) => {
    const horaSalida = new Date().toISOString();
    const costo = calcularCosto(vehiculo.horaEntrada, horaSalida);
    
    const vehiculoSalida = {
      ...vehiculo,
      horaSalida,
      estado: 'Completado' as const,
      costo
    };
    
    setShowExitModal(vehiculoSalida);
  };

  const confirmExit = () => {
    if (!showExitModal) return;

    setVehiculos(prev => prev.map(v => v.id === showExitModal.id ? showExitModal : v));
    setShowExitModal(null);
  };

  const handlePrintTicket = (vehiculo: VehiculoParqueo) => {
    // Generate 80mm thermal receipt PDF using jsPDF
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 150] // Typical ticket size
    });

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${vehiculo.id}`;

    // Load QR code image asynchronously then print
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = qrUrl;

    img.onload = () => {
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
      doc.addImage(img, 'PNG', 20, 56, 40, 40);

      doc.setFontSize(8);
      doc.text('Escanee para salida de parqueo', 40, 103, { align: 'center' });
      doc.text('--------------------------------------------', 40, 108, { align: 'center' });
      
      doc.setFontSize(7);
      doc.text('Tarifa: Q10.00 primera hora', 40, 113, { align: 'center' });
      doc.text('Q5.00 hora adicional o fracción', 40, 117, { align: 'center' });
      doc.text('No nos hacemos responsables por objetos', 40, 122, { align: 'center' });
      doc.text('dejados dentro del vehículo.', 40, 125, { align: 'center' });
      
      doc.setFont('Helvetica', 'bold');
      doc.text('¡GRACIAS POR SU VISITA!', 40, 133, { align: 'center' });

      // Trigger standard print dialog
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    };
  };

  const handleDeleteHistory = (id: string) => {
    if (confirm('¿Desea eliminar este registro del historial permanentemente?')) {
      setVehiculos(prev => prev.filter(v => v.id !== id));
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
      
      {/* Header and KPI summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-3xl p-6 shadow-lg border border-blue-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-yellow-400">Estacionados</span>
            <h3 className="text-3xl font-black mt-1">{vehiculosActivos.length}</h3>
            <p className="text-[10px] text-slate-300 mt-2">Vehículos dentro del predio</p>
          </div>
          <div className="p-4 bg-white/10 rounded-2xl">
            <Car size={32} className="text-yellow-400" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Total Histórico</span>
            <h3 className="text-3xl font-black text-slate-800 mt-1">{vehiculosHistorial.length}</h3>
            <p className="text-[10px] text-slate-500 mt-2">Servicios prestados</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <History size={32} className="text-slate-400" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-500">Ingresos Totales</span>
            <h3 className="text-3xl font-black text-emerald-600 mt-1">
              Q. {vehiculosHistorial.reduce((sum, v) => sum + (v.costo || 0), 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-slate-500 mt-2">Caja acumulada parqueo</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <DollarSign size={32} className="text-emerald-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Registration Form */}
        <div className="lg:col-span-1 bg-white border border-slate-200/80 rounded-[2.5rem] p-7 shadow-sm flex flex-col space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-yellow-500/10 rounded-xl text-yellow-600">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-black text-slate-850 text-base">Ingreso de Vehículo</h3>
              <p className="text-[10px] text-slate-450 font-bold">Registrar nueva entrada al estacionamiento</p>
            </div>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-5">
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
              <input
                type="text"
                required
                value={numeroPlaca}
                onChange={(e) => {
                  let val = e.target.value;
                  if (!isExtranjera) {
                    // Automatically filter to match 3 digits and 3 letters (max 6 characters)
                    val = val.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
                  }
                  setNumeroPlaca(val);
                }}
                placeholder={isExtranjera ? "Ej. MEX-789-Z" : "Ej. 582GDF"}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all outline-none"
              />
              {!isExtranjera && (
                <p className="text-[9px] font-semibold text-slate-450">
                  Formato de Guatemala: 3 números seguidos de 3 letras. ({numeroPlaca.length}/6)
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
            <button
              type="submit"
              className="w-full bg-blue-900 hover:bg-blue-800 text-white py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-blue-900/10 transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              <Plus size={18} />
              <span>Registrar e Imprimir Ticket</span>
            </button>
          </form>
        </div>

        {/* Active Vehicles List */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-[2.5rem] p-7 shadow-sm flex flex-col">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-5">
            <div>
              <h3 className="font-black text-slate-850 text-base">Vehículos Activos</h3>
              <p className="text-[10px] text-slate-450 font-bold">Vehículos en el predio y cronómetro en vivo</p>
            </div>
            <span className="bg-yellow-500 text-blue-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              En Curso: {vehiculosActivos.length}
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
                  className="bg-slate-55 border border-slate-200/80 rounded-2xl p-4.5 flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden"
                >
                  {/* Left accent color bar */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-2.5" 
                    style={{ backgroundColor: v.color }} 
                  />

                  <div className="pl-3.5 space-y-3.5">
                    {/* Header: Plate and actions */}
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded">
                            {v.tipoPlaca}
                          </span>
                          <span className="text-sm font-black text-slate-800">
                            {v.tipoPlaca === 'Extranjera' ? '' : v.tipoPlaca + '-'}{v.numeroPlaca}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-450 font-bold mt-1">
                          Color: <span className="font-black text-slate-650">{v.colorLabel}</span>
                        </p>
                      </div>
                      
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => handlePrintTicket(v)}
                          title="Reimprimir Ticket"
                          className="p-1.5 text-slate-400 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Printer size={15} />
                        </button>
                        <button 
                          onClick={() => setTicketVehiculo(v)}
                          title="Mostrar QR"
                          className="p-1.5 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all"
                        >
                          <QrCode size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Timer and Exit Button */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200/40 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Clock size={14} className="text-slate-450 animate-pulse" />
                        <span className="text-xs font-black text-slate-700 font-mono">
                          {getTiempoTranscurrido(v.horaEntrada)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleProcessExit(v)}
                        className="bg-red-50 hover:bg-red-100 text-red-650 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center space-x-1.5 active:scale-95 border border-red-200/40"
                      >
                        <LogOut size={12} />
                        <span>Dar Salida</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* History and Logs panel */}
      <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-7 shadow-sm space-y-6">
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
    </div>
  );
};
