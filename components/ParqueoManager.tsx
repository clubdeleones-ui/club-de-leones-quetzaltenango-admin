import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  X,
  Users,
  User,
  FileText,
  Undo2,
  AlertTriangle,
  Camera,
  Zap,
  ZapOff,
  FlipHorizontal,
  Filter,
  Wifi,
  WifiOff,
  CloudUpload
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import { collection, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, addDoc, limit, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { firebaseService } from '../services/firebaseService';
import { parqueoOfflineService } from '../services/parqueoOfflineService';
import { PlateAiModal } from './PlateAiModal';
import { VehiculoParqueo, RegistroBano, TipoRentaParqueo } from '../types';
import { useModal } from '../context/ModalContext';


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

// Cálculo de tiempo transcurrido (soporta horas, minutos, segundos y días)
export const getTiempoTranscurrido = (entradaStr: string, salidaStr?: string): string => {
  const entrada = new Date(entradaStr).getTime();
  const salida = salidaStr ? new Date(salidaStr).getTime() : Date.now();
  const diffMs = salida - entrada;
  
  if (diffMs < 0 || isNaN(diffMs)) return '00:00:00';

  const totalSecs = Math.floor(diffMs / 1000);
  const diffHrs = Math.floor(totalSecs / 3600);
  const diffMins = Math.floor((totalSecs % 3600) / 60);
  const diffSecs = totalSecs % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (diffHrs >= 24) {
    const days = Math.floor(diffHrs / 24);
    const remHrs = diffHrs % 24;
    return `${days}d ${pad(remHrs)}:${pad(diffMins)}:${pad(diffSecs)}`;
  }

  return `${pad(diffHrs)}:${pad(diffMins)}:${pad(diffSecs)}`;
};

// Componente memoizado para el reloj en vivo: sólo este sub-nodo se actualiza cada segundo,
// evitando re-renderizar todo el ParqueoManager y sus listas completas.
export const LiveTimer: React.FC<{ horaEntrada: string; horaSalida?: string; className?: string }> = React.memo(({
  horaEntrada,
  horaSalida,
  className = "text-sm font-black text-slate-800 font-mono tracking-wider"
}) => {
  const [elapsed, setElapsed] = useState(() => getTiempoTranscurrido(horaEntrada, horaSalida));

  useEffect(() => {
    if (horaSalida) {
      setElapsed(getTiempoTranscurrido(horaEntrada, horaSalida));
      return;
    }
    const timer = setInterval(() => {
      setElapsed(getTiempoTranscurrido(horaEntrada));
    }, 1000);
    return () => clearInterval(timer);
  }, [horaEntrada, horaSalida]);

  return <span className={className}>{elapsed}</span>;
});

// Reproductor de pitido auditivo de confirmación (Web Audio API nativa sin dependencias externas)
export const playBeepSuccess = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
    if (navigator.vibrate) navigator.vibrate([40, 30, 60]);
  } catch (e) {
    // Silently ignore if audio permissions are blocked
  }
};

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  toast: { tipo: 'warning' | 'error' | 'info'; mensaje: string } | null;
  onClearToast: () => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({ isOpen, onClose, onScan, toast, onClearToast }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScannedRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      return;
    }

    let active = true;
    let animId: number;

    const startCamera = async () => {
      setErrorMsg(null);
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('La cámara no está disponible o requiere navegación segura HTTPS.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        // Detect torch support
        const track = stream.getVideoTracks()[0];
        if (track && (track.getCapabilities as any)?.().torch) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }

        // Scanning loop with throttling to avoid UI freeze
        const scan = () => {
          if (!active) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const qr = jsQR(imgData.data, imgData.width, imgData.height, {
                inversionAttempts: 'dontInvert'
              });
              if (qr && qr.data && qr.data.trim()) {
                const now = Date.now();
                // Prevent duplicate scanning in rapid succession (1.5s debounce)
                if (qr.data.trim() !== lastScannedRef.current || now - lastScanTimeRef.current > 1500) {
                  lastScannedRef.current = qr.data.trim();
                  lastScanTimeRef.current = now;
                  onScan(qr.data.trim());
                }
              }
            }
          }
          animId = requestAnimationFrame(scan);
        };
        animId = requestAnimationFrame(scan);
      } catch (err: any) {
        console.error("Camera error:", err);
        setErrorMsg(err.message || 'No se pudo acceder a la cámara del dispositivo.');
      }
    };

    startCamera();

    return () => {
      active = false;
      if (animId) cancelAnimationFrame(animId);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, facingMode]);

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && (track.applyConstraints as any)) {
      try {
        const nextState = !torchOn;
        await (track as any).applyConstraints({ advanced: [{ torch: nextState }] });
        setTorchOn(nextState);
      } catch (e) {
        console.error("Torch error:", e);
      }
    }
  };

  const toggleFacing = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-between items-center p-4 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="w-full max-w-md flex justify-between items-center text-white pt-2 z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
            <Camera size={20} className="text-yellow-400" />
          </div>
          <div>
            <h3 className="font-black text-sm tracking-tight">Escanear Ticket QR</h3>
            <p className="text-[10px] text-slate-300 font-medium">Alinee el código del boleto</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasTorch && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                torchOn ? 'bg-yellow-400 text-slate-900 border-yellow-300 shadow-lg' : 'bg-white/10 text-white border-white/20'
              }`}
              title="Linterna"
            >
              {torchOn ? <Zap size={18} /> : <ZapOff size={18} />}
            </button>
          )}

          <button
            type="button"
            onClick={toggleFacing}
            className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl transition-all cursor-pointer"
            title="Cambiar Cámara"
          >
            <FlipHorizontal size={18} />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 bg-white/10 hover:bg-red-600 border border-white/20 text-white rounded-xl transition-all cursor-pointer"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Camera Viewport */}
      <div className="relative w-full max-w-sm aspect-square my-auto rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl flex items-center justify-center bg-slate-950">
        {errorMsg ? (
          <div className="p-6 text-center text-white space-y-3">
            <AlertCircle size={36} className="text-red-400 mx-auto" />
            <p className="text-xs font-bold text-red-200">{errorMsg}</p>
            <p className="text-[11px] text-slate-400">Verifique los permisos de cámara en el navegador o use la búsqueda por placa.</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Target Viewfinder Overlay */}
            <div className="absolute inset-8 border-2 border-yellow-400/80 rounded-2xl pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
              {/* Corner Accents */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-yellow-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-yellow-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-yellow-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-yellow-400 rounded-br-lg" />

              {/* Laser line animated */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent shadow-[0_0_12px_#facc15] animate-pulse absolute top-1/2 -translate-y-1/2" />
            </div>
          </>
        )}
      </div>

      {/* Feedback Toast / Instructions */}
      <div className="w-full max-w-md pb-4 z-10 space-y-2">
        {toast && (
          <div className={`p-3 rounded-2xl text-xs font-black text-center flex items-center justify-between shadow-xl animate-in slide-in-from-bottom duration-200 ${
            toast.tipo === 'error' ? 'bg-red-600 text-white border border-red-400' :
            toast.tipo === 'warning' ? 'bg-amber-500 text-slate-950 border border-amber-300' :
            'bg-blue-600 text-white border border-blue-400'
          }`}>
            <span className="flex-1 text-center">{toast.mensaje}</span>
            <button type="button" onClick={onClearToast} className="p-1 hover:opacity-75 cursor-pointer">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-center">
          <p className="text-[11px] font-bold text-slate-200">
            Escanea el código QR impreso en el ticket para dar salida inmediata
          </p>
        </div>
      </div>
    </div>
  );
};

export const ParqueoManager: React.FC = () => {
  const { showAlert, showConfirm } = useModal();
  const alert = (msg: string) => {
    showAlert("Notificación", msg);
  };

  // Persistence with Firestore real-time for Parqueo & Baños
  const [vehiculos, setVehiculos] = useState<VehiculoParqueo[]>([]);
  const [registrosBanos, setRegistrosBanos] = useState<RegistroBano[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Bathroom Toast notification state & modal state
  const [banoToast, setBanoToast] = useState<string | null>(null);
  const [showBanosReportModal, setShowBanosReportModal] = useState(false);

  useEffect(() => {
    // 1. Consulta en tiempo real de TODOS los vehículos activos en el predio (garantiza que ninguno se pierda)
    const qActivos = query(
      collection(db, 'parqueo'),
      where('estado', '==', 'Activo')
    );

    // 2. Consulta de historial reciente
    const qRecientes = query(
      collection(db, 'parqueo'),
      limit(300)
    );

    // 3. Consulta de registros de baños
    const qBanos = query(
      collection(db, 'banos'),
      limit(300)
    );

    let activosMap = new Map<string, VehiculoParqueo>();
    let recientesMap = new Map<string, VehiculoParqueo>();
    let banoParqueoList: RegistroBano[] = [];
    let banosDirectList: RegistroBano[] = [];

    const mergeAndSet = () => {
      // Unir vehículos activos y recientes sin duplicados (los activos tienen prioridad)
      const allVehsMap = new Map<string, VehiculoParqueo>();
      recientesMap.forEach((v, id) => allVehsMap.set(id, v));
      activosMap.forEach((v, id) => allVehsMap.set(id, v));

      // Recuperar e incorporar registros pendientes en memoria local (persisten aunque recarguen sin red)
      const pendingLocal = parqueoOfflineService.getPendingQueue();
      pendingLocal.forEach(p => {
        if (p.tipo === 'ingreso' && p.data) {
          if (!allVehsMap.has(p.id)) {
            allVehsMap.set(p.id, p.data);
          }
        } else if (p.tipo === 'salida' && p.data) {
          allVehsMap.set(p.id, p.data);
        }
      });

      const vehList = Array.from(allVehsMap.values());
      vehList.sort((a, b) => new Date(b.horaEntrada || 0).getTime() - new Date(a.horaEntrada || 0).getTime());

      // Unir registros de baños
      const allBanos = [...banosDirectList, ...banoParqueoList];
      const uniqueBanos = Array.from(new Map(allBanos.map(b => [b.id, b])).values());
      uniqueBanos.sort((a, b) => new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime());

      setVehiculos(vehList);
      setRegistrosBanos(uniqueBanos);
      setIsLoading(false);
    };

    const unsubActivos = onSnapshot(qActivos, (snapshot) => {
      activosMap = new Map();
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.tipoEntrada !== 'bano' && (!data.numeroPlaca || !String(data.numeroPlaca).startsWith('BAÑO-'))) {
          activosMap.set(docSnap.id, data as VehiculoParqueo);
        }
      });
      mergeAndSet();
    }, (err) => {
      console.warn("Aviso al consultar vehículos activos:", err);
    });

    const unsubRecientes = onSnapshot(qRecientes, (snapshot) => {
      recientesMap = new Map();
      banoParqueoList = [];

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.tipoEntrada === 'bano' || (data.numeroPlaca && String(data.numeroPlaca).startsWith('BAÑO-'))) {
          banoParqueoList.push({
            id: docSnap.id,
            genero: data.genero || (String(data.numeroPlaca).includes('MUJER') ? 'mujer' : 'hombre'),
            monto: data.monto || data.costo || 3.0,
            fecha: data.fecha || data.horaEntrada || new Date().toISOString(),
            fechaCorta: data.fechaCorta || (data.fecha ? String(data.fecha).split('T')[0] : '')
          } as RegistroBano);
        } else {
          recientesMap.set(docSnap.id, data as VehiculoParqueo);
        }
      });

      mergeAndSet();
    }, (error) => {
      console.error("Error fetching parqueo recientes in real-time:", error);
      setIsLoading(false);
    });

    const unsubBanos = onSnapshot(qBanos, (snapshot) => {
      banosDirectList = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        banosDirectList.push({
          id: docSnap.id,
          genero: data.genero || 'hombre',
          monto: data.monto || 3.0,
          fecha: data.fecha || data.horaEntrada || new Date().toISOString(),
          fechaCorta: data.fechaCorta || (data.fecha ? String(data.fecha).split('T')[0] : '')
        } as RegistroBano);
      });

      mergeAndSet();
    }, (error) => {
      console.warn("Aviso al consultar colección banos:", error);
    });

    return () => {
      unsubActivos();
      unsubRecientes();
      unsubBanos();
    };
  }, []);

  const handleRecordBano = async (genero: 'hombre' | 'mujer') => {
    const now = new Date();
    const docId = `BNO-${Date.now()}`;
    const fechaCortaStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const newRecord: RegistroBano = {
      id: docId,
      genero,
      monto: 3.0,
      fecha: now.toISOString(),
      fechaCorta: fechaCortaStr
    };

    // Optimistic UI state update
    setRegistrosBanos(prev => [newRecord, ...prev]);
    setBanoToast(`+Q.3.00 (${genero === 'hombre' ? 'Hombre' : 'Mujer'}) Anotado`);
    setTimeout(() => setBanoToast(null), 2500);

    const banoDocPayload = {
      id: docId,
      numeroPlaca: `BAÑO-${genero.toUpperCase()}`,
      isExtranjera: false,
      estado: 'Completado',
      tipoEntrada: 'bano',
      genero: genero,
      monto: 3.0,
      costo: 3.0,
      fecha: now.toISOString(),
      fechaCorta: fechaCortaStr,
      horaEntrada: now.toISOString(),
      horaSalida: now.toISOString()
    };

    if (!navigator.onLine) {
      parqueoOfflineService.addToQueue(docId, 'bano', banoDocPayload);
      setPendingOfflineCount(parqueoOfflineService.getPendingQueue().length);
    } else {
      try {
        // Guardar directamente en la colección banos
        await setDoc(doc(db, 'banos', docId), banoDocPayload);
      } catch (err) {
        console.error("Error al registrar uso de baño en banos Firestore, archivando en cola offline:", err);
        parqueoOfflineService.addToQueue(docId, 'bano', banoDocPayload);
        setPendingOfflineCount(parqueoOfflineService.getPendingQueue().length);
      }
    }
  };

  const handleDeleteLastBano = async (id: string) => {
    // Optimistic local delete
    setRegistrosBanos(prev => prev.filter(b => b.id !== id));
    try {
      await deleteDoc(doc(db, 'banos', id));
    } catch (_) {}
    try {
      await deleteDoc(doc(db, 'parqueo', id));
    } catch (err) {
      console.error("Error al eliminar registro de baño:", err);
    }
  };

  const banosStats = React.useMemo(() => {
    const now = new Date();
    const isSameDay = (d1: Date, d2: Date) => 
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    const todayRecords = registrosBanos.filter(b => {
      if (b.fecha) {
        const d = new Date(b.fecha);
        if (!isNaN(d.getTime())) return isSameDay(d, now);
      }
      if (b.fechaCorta) {
        const parts = b.fechaCorta.split('-');
        if (parts.length === 3) {
          const yr = parseInt(parts[0], 10);
          const mo = parseInt(parts[1], 10) - 1;
          const dy = parseInt(parts[2], 10);
          return yr === now.getFullYear() && mo === now.getMonth() && dy === now.getDate();
        }
      }
      return false;
    });

    const hombresHoy = todayRecords.filter(b => b.genero === 'hombre').length;
    const mujeresHoy = todayRecords.filter(b => b.genero === 'mujer').length;
    const totalUsosHoy = todayRecords.length;
    const totalMontoHoy = totalUsosHoy * 3;

    return {
      hombresHoy,
      mujeresHoy,
      totalUsosHoy,
      totalMontoHoy,
      todayRecords
    };
  }, [registrosBanos]);

  const [activeTab, setActiveTab] = useState<'ingreso' | 'salida' | 'historial'>('ingreso');
  const [showCierreModal, setShowCierreModal] = useState(false);
  const [tipoPlaca, setTipoPlaca] = useState('P');
  const [numeroPlaca, setNumeroPlaca] = useState('');
  const [isExtranjera, setIsExtranjera] = useState(false);
  const [colorSeleccionado, setColorSeleccionado] = useState(PALETA_COLORES[0]);
  
  // States for Long-term & Special Rental Modes
  const [tipoRenta, setTipoRenta] = useState<TipoRentaParqueo>('horario');
  const [montoRentaInput, setMontoRentaInput] = useState<number>(25);

  // States for QR Camera Scanner
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [scannerToast, setScannerToast] = useState<{ tipo: 'warning' | 'error' | 'info'; mensaje: string } | null>(null);

  // States for AI Plate Scanner & Offline Synchronization
  const [showPlateAiModal, setShowPlateAiModal] = useState(false);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [pendingOfflineCount, setPendingOfflineCount] = useState(() => parqueoOfflineService.getPendingQueue().length);
  const [isSyncingOffline, setIsSyncingOffline] = useState(false);
  const [offlineToast, setOfflineToast] = useState<{ tipo: 'info' | 'success' | 'warning'; mensaje: string } | null>(null);

  // States for History date filters
  type FiltroFecha = 'hoy' | 'ayer' | 'semana' | 'mes' | 'todos' | 'personalizado';
  const [filtroFechaHistorial, setFiltroFechaHistorial] = useState<FiltroFecha>('hoy');
  const [fechaInicioHistorial, setFechaInicioHistorial] = useState<string>('');
  const [fechaFinHistorial, setFechaFinHistorial] = useState<string>('');

  // Disparador de sincronización de registros pendientes con Firestore
  const handleTriggerSync = async () => {
    if (isSyncingOffline) return;
    setIsSyncingOffline(true);
    try {
      const res = await parqueoOfflineService.syncQueue();
      const remaining = parqueoOfflineService.getPendingQueue().length;
      setPendingOfflineCount(remaining);

      if (res.syncedCount > 0) {
        setOfflineToast({
          tipo: 'success',
          mensaje: `✅ Sincronizados ${res.syncedCount} registro(s) pendientes con la nube.`
        });
        setTimeout(() => setOfflineToast(null), 4000);
      } else if (res.failedCount > 0) {
        setOfflineToast({
          tipo: 'warning',
          mensaje: `⚠️ No se pudieron sincronizar ${res.failedCount} registros. Verifique su señal.`
        });
        setTimeout(() => setOfflineToast(null), 4000);
      }
    } catch (e) {
      console.error("Error en sincronización manual:", e);
    } finally {
      setIsSyncingOffline(false);
    }
  };

  // Listener para estado de red online/offline y sincronización automática
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setOfflineToast({
        tipo: 'info',
        mensaje: '📶 Conexión restablecida. Sincronizando registros locales...'
      });
      setTimeout(() => setOfflineToast(null), 3500);
      handleTriggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setOfflineToast({
        tipo: 'warning',
        mensaje: '📡 Modo sin conexión. Sus registros se guardarán en este dispositivo.'
      });
      setTimeout(() => setOfflineToast(null), 4000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine && parqueoOfflineService.getPendingQueue().length > 0) {
        handleTriggerSync();
      }
    }, 20000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Manejador cuando la IA reconoce exitosamente una placa
  const handlePlateRecognized = (result: {
    tipoPlaca: string;
    numeroPlaca: string;
    colorLabel: string;
    isExtranjera: boolean;
  }) => {
    playBeepSuccess();
    setTipoPlaca(result.tipoPlaca);
    setNumeroPlaca(result.numeroPlaca);
    setIsExtranjera(result.isExtranjera);

    const matchColor = PALETA_COLORES.find(
      c => c.name.toLowerCase() === result.colorLabel.toLowerCase()
    );
    if (matchColor) {
      setColorSeleccionado(matchColor);
    }

    setOfflineToast({
      tipo: 'success',
      mensaje: `✨ Placa [${result.tipoPlaca}-${result.numeroPlaca}] y color ${result.colorLabel} detectados con IA.`
    });
    setTimeout(() => setOfflineToast(null), 4000);
  };

  const DEFAULT_PRECIOS_RENTA: Record<TipoRentaParqueo, number> = {
    horario: 0,
    noche: 25,
    dia: 40,
    semana: 200,
    quincena: 350,
    mes: 600
  };

  const handleSelectTipoRenta = (tipo: TipoRentaParqueo) => {
    setTipoRenta(tipo);
    if (tipo !== 'horario') {
      setMontoRentaInput(DEFAULT_PRECIOS_RENTA[tipo] || 25);
    }
  };

  const getFechaVencimientoDate = (tipo: TipoRentaParqueo, baseDate: Date = new Date()): Date | null => {
    if (tipo === 'horario') return null;
    const d = new Date(baseDate);
    if (tipo === 'noche') {
      d.setDate(d.getDate() + 1);
      d.setHours(8, 0, 0, 0);
      return d;
    }
    if (tipo === 'dia') {
      d.setDate(d.getDate() + 1);
      return d;
    }
    if (tipo === 'semana') {
      d.setDate(d.getDate() + 7);
      return d;
    }
    if (tipo === 'quincena') {
      d.setDate(d.getDate() + 15);
      return d;
    }
    if (tipo === 'mes') {
      d.setDate(d.getDate() + 30);
      return d;
    }
    return null;
  };

  const calcularFechaVencimientoPreview = (tipo: TipoRentaParqueo) => {
    const targetDate = getFechaVencimientoDate(tipo);
    if (!targetDate) return '';
    return targetDate.toLocaleString('es-GT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [salidaSearchQuery, setSalidaSearchQuery] = useState('');
  
  // States for ticket and active vehicle interactions
  const [ticketVehiculo, setTicketVehiculo] = useState<VehiculoParqueo | null>(null);
  const [ticketQrDataUrl, setTicketQrDataUrl] = useState<string>('');
  const [showExitModal, setShowExitModal] = useState<VehiculoParqueo | null>(null);
  const [duplicateVehiculoModal, setDuplicateVehiculoModal] = useState<VehiculoParqueo | null>(null);

  // Generar QR de manera local y offline cuando se selecciona o crea un ticket
  useEffect(() => {
    let isMounted = true;
    if (ticketVehiculo) {
      QRCode.toDataURL(ticketVehiculo.id, {
        width: 180,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      }).then(url => {
        if (isMounted) setTicketQrDataUrl(url);
      }).catch(err => {
        console.error("Error generando QR local del ticket:", err);
      });
    } else {
      setTicketQrDataUrl('');
    }
    return () => { isMounted = false; };
  }, [ticketVehiculo]);
  
  // State for parking spots
  const [espacioSeleccionado, setEspacioSeleccionado] = useState<number | null>(null);
  const [showEspaciosModal, setShowEspaciosModal] = useState(false);

  // Manejador del campo unificado de placa con detección inteligente de prefijo
  const handleNumeroPlacaChange = (val: string) => {
    let clean = val.toUpperCase().trimStart();
    if (isExtranjera) {
      setNumeroPlaca(clean);
      return;
    }

    // Si el usuario escribe o pega prefijos como "P-123ABC", "M 456XYZ", "C-999ZZZ", "O12345"
    const matchPrefix = clean.match(/^([PMCOpmco]|CD|cd)[\s-]?([0-9A-Z]*)$/i);
    if (matchPrefix && matchPrefix[2]) {
      const detected = matchPrefix[1].toUpperCase();
      if (TIPOS_PLACA.some(t => t.value === detected)) {
        setTipoPlaca(detected);
        clean = matchPrefix[2].toUpperCase();
      }
    }

    // Permitir alfanumérico y un guion separador opcional
    clean = clean.replace(/[^0-9A-Z-]/g, '').slice(0, 10);
    setNumeroPlaca(clean);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    
    let placaLimpia = numeroPlaca.trim().toUpperCase().replace(/[\s-]/g, '');
    
    if (placaLimpia === '') {
      alert('Error: El número de placa es obligatorio.');
      return;
    }

    if (!isExtranjera) {
      // Si el usuario incluyó el prefijo al inicio, normalizarlo
      if (placaLimpia.startsWith(tipoPlaca) && placaLimpia.length > tipoPlaca.length) {
        placaLimpia = placaLimpia.substring(tipoPlaca.length);
      }

      if (placaLimpia.length < 3) {
        alert('Error: La placa ingresada debe tener al menos 3 caracteres (ej. 123ABC para automóvil o 123XYZ para moto).');
        return;
      }
    }

    // Duplicate plate check: verify if plate is currently parked and active
    const vehiculosActivos = vehiculos.filter(v => v.estado === 'Activo');
    const vehiculoExistente = vehiculosActivos.find(v => {
      const dbPlaca = (v.numeroPlaca || '').toUpperCase().replace(/[\s-]/g, '');
      const inputPlaca = placaLimpia.toUpperCase().replace(/[\s-]/g, '');

      if (isExtranjera || v.isExtranjera) {
        return dbPlaca === inputPlaca;
      }
      return v.tipoPlaca === tipoPlaca && dbPlaca === inputPlaca;
    });

    if (vehiculoExistente) {
      setDuplicateVehiculoModal(vehiculoExistente);
      return;
    }

    const fechaVencDate = getFechaVencimientoDate(tipoRenta);
    const esRentaEspecial = tipoRenta !== 'horario';
    const montoRentaNum = esRentaEspecial ? Number(montoRentaInput) : 0;
    const nowIso = new Date().toISOString();

    const nuevoVehiculo: VehiculoParqueo = {
      id: `parq-${Date.now()}`,
      tipoPlaca: isExtranjera ? 'Extranjera' : tipoPlaca,
      numeroPlaca: placaLimpia,
      isExtranjera,
      color: colorSeleccionado.hex,
      colorLabel: colorSeleccionado.name,
      horaEntrada: nowIso,
      estado: 'Activo',
      numeroEspacio: espacioSeleccionado || undefined,
      tipoRenta,
      montoRenta: montoRentaNum,
      costo: esRentaEspecial ? montoRentaNum : undefined,
      pagadoAlIngreso: esRentaEspecial,
      fechaCobro: esRentaEspecial ? nowIso : undefined,
      metodoPago: esRentaEspecial ? 'Efectivo' : undefined,
      fechaVencimiento: fechaVencDate ? fechaVencDate.toISOString() : undefined
    };

    // Optimistic UI state update so vehicle appears immediately in list
    setVehiculos(prev => [nuevoVehiculo, ...prev]);

    if (!navigator.onLine) {
      parqueoOfflineService.addToQueue(nuevoVehiculo.id, 'ingreso', nuevoVehiculo);
      setPendingOfflineCount(parqueoOfflineService.getPendingQueue().length);
      setOfflineToast({
        tipo: 'warning',
        mensaje: `💾 Ticket [${nuevoVehiculo.tipoPlaca === 'Extranjera' ? '' : nuevoVehiculo.tipoPlaca + '-'}${nuevoVehiculo.numeroPlaca}] guardado sin conexión. Se subirá al volver la red.`
      });
      setTimeout(() => setOfflineToast(null), 4000);
    } else {
      firebaseService.saveVehiculoParqueo(nuevoVehiculo).catch(e => {
        console.warn("Fallo guardado en Firestore, archivando en cola offline:", e);
        parqueoOfflineService.addToQueue(nuevoVehiculo.id, 'ingreso', nuevoVehiculo);
        setPendingOfflineCount(parqueoOfflineService.getPendingQueue().length);
        setOfflineToast({
          tipo: 'warning',
          mensaje: `💾 Guardado en memoria local por intermitencia de red.`
        });
        setTimeout(() => setOfflineToast(null), 4000);
      });
    }

    setTicketVehiculo(nuevoVehiculo);
    
    // Reset form
    setNumeroPlaca('');
    setIsExtranjera(false);
    setColorSeleccionado(PALETA_COLORES[0]);
    setEspacioSeleccionado(null);
    setTipoRenta('horario');
    setMontoRentaInput(25);
  };

  // Manejador de escaneo de QR para dar salida instantánea
  const handleScanQrResult = (scannedCode: string) => {
    const raw = scannedCode.trim();
    const clean = raw.toUpperCase().replace(/[\s-]/g, '');

    // 1. Buscar en vehículos activos por ID directo o por coincidencia de placa
    const vehiculoEncontrado = vehiculosActivos.find(v => {
      const idMatch = v.id === raw;
      const placaClean = (v.numeroPlaca || '').toUpperCase().replace(/[\s-]/g, '');
      const fullPlacaClean = ((v.tipoPlaca || '') + (v.numeroPlaca || '')).toUpperCase().replace(/[\s-]/g, '');
      return idMatch || placaClean === clean || fullPlacaClean === clean;
    });

    if (vehiculoEncontrado) {
      playBeepSuccess();
      setShowQrScanner(false);
      setScannerToast(null);
      setShowExitModal(vehiculoEncontrado);
      return;
    }

    // 2. Buscar en historial de vehículos ya retirados
    const yaRetirado = vehiculosHistorial.find(v => {
      const idMatch = v.id === raw;
      const placaClean = (v.numeroPlaca || '').toUpperCase().replace(/[\s-]/g, '');
      const fullPlacaClean = ((v.tipoPlaca || '') + (v.numeroPlaca || '')).toUpperCase().replace(/[\s-]/g, '');
      return idMatch || placaClean === clean || fullPlacaClean === clean;
    });

    if (yaRetirado) {
      const hora = yaRetirado.horaSalida ? new Date(yaRetirado.horaSalida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      setScannerToast({
        tipo: 'warning',
        mensaje: `El vehículo (${yaRetirado.tipoPlaca === 'Extranjera' ? '' : yaRetirado.tipoPlaca + '-'}${yaRetirado.numeroPlaca}) ya fue retirado${hora ? ` a las ${hora}` : ''}.`
      });
      return;
    }

    setScannerToast({
      tipo: 'error',
      mensaje: `Código "${raw.length > 20 ? raw.slice(0, 20) + '...' : raw}" no encontrado entre los vehículos activos.`
    });
  };

  // Regla de Precios:
  // - Horario estándar: Q5.00 cada 30 minutos (o fracción).
  // - Rentas especiales ('noche', 'dia', 'semana', 'quincena', 'mes'):
  //   Monto acordado (montoRenta). Si excede la fecha/hora de vencimiento,
  //   se calcula recargo por tiempo extra a razón de Q5.00 cada 30 min.
  const calcularCostoVehiculo = (
    vehiculo: VehiculoParqueo,
    horaSalidaStr: string = new Date().toISOString(),
    toleranciaMinutos: number = 0
  ) => {
    const isSpecialRent = vehiculo.tipoRenta && vehiculo.tipoRenta !== 'horario';

    if (!isSpecialRent) {
      const entrada = new Date(vehiculo.horaEntrada).getTime();
      const salida = new Date(horaSalidaStr).getTime();
      const diffMs = Math.max(0, salida - entrada);
      const totalMins = diffMs / 60000;
      const minsAjustados = Math.max(0, totalMins - toleranciaMinutos);
      const costo = Math.floor(minsAjustados / 30) * 5.00 + 5.00;
      return {
        total: costo,
        baseRenta: 0,
        extraOvertime: 0,
        porCobrar: costo,
        isVencido: false
      };
    }

    const baseRenta = vehiculo.montoRenta || DEFAULT_PRECIOS_RENTA[vehiculo.tipoRenta!] || 0;
    const salidaTime = new Date(horaSalidaStr).getTime();
    const vencimientoTime = vehiculo.fechaVencimiento ? new Date(vehiculo.fechaVencimiento).getTime() : null;

    let extraOvertime = 0;
    let isVencido = false;

    if (vencimientoTime && salidaTime > vencimientoTime) {
      isVencido = true;
      const extraMs = salidaTime - vencimientoTime;
      const extraMins = Math.max(0, extraMs / 60000);
      const extraMinsAjustados = Math.max(0, extraMins - toleranciaMinutos);
      if (extraMinsAjustados > 0) {
        extraOvertime = Math.floor(extraMinsAjustados / 30) * 5.00 + 5.00;
      }
    }

    const yaPagado = !!vehiculo.pagadoAlIngreso;
    const totalServicio = baseRenta + extraOvertime;
    // Si ya pagó la renta al ingresar, a la salida solo se cobra el recargo extra (si existe)
    const porCobrar = yaPagado ? extraOvertime : totalServicio;

    return {
      total: totalServicio,
      baseRenta,
      extraOvertime,
      porCobrar,
      isVencido
    };
  };

  const handleProcessExit = (vehiculo: VehiculoParqueo) => {
    const horaSalida = new Date().toISOString();
    const { total, extraOvertime } = calcularCostoVehiculo(vehiculo, horaSalida, 0);
    
    const vehiculoSalida: VehiculoParqueo = {
      ...vehiculo,
      horaSalida,
      estado: 'Completado' as const,
      costo: total,
      costoExtraVencido: extraOvertime,
      toleranciaMinutos: 0,
      metodoPago: vehiculo.metodoPago || 'Efectivo'
    };
    
    setShowExitModal(vehiculoSalida);
  };

  const handleApplyTolerancia = (tol: number) => {
    if (!showExitModal) return;
    const horaSalida = showExitModal.horaSalida || new Date().toISOString();
    const { total, extraOvertime } = calcularCostoVehiculo(showExitModal, horaSalida, tol);
    setShowExitModal({
      ...showExitModal,
      toleranciaMinutos: tol,
      costo: total,
      costoExtraVencido: extraOvertime
    });
  };

  const confirmExit = () => {
    if (!showExitModal) return;

    // Optimistic local state update
    setVehiculos(prev => prev.map(v => v.id === showExitModal.id ? showExitModal : v));

    if (!navigator.onLine) {
      parqueoOfflineService.addToQueue(showExitModal.id, 'salida', showExitModal);
      setPendingOfflineCount(parqueoOfflineService.getPendingQueue().length);
      setOfflineToast({
        tipo: 'warning',
        mensaje: `💾 Salida [${showExitModal.tipoPlaca === 'Extranjera' ? '' : showExitModal.tipoPlaca + '-'}${showExitModal.numeroPlaca}] guardada sin internet. Se subirá al reconectar.`
      });
      setTimeout(() => setOfflineToast(null), 4000);
    } else {
      firebaseService.saveVehiculoParqueo(showExitModal).catch(e => {
        console.warn("Fallo guardado de salida en Firestore, agregando a cola offline:", e);
        parqueoOfflineService.addToQueue(showExitModal.id, 'salida', showExitModal);
        setPendingOfflineCount(parqueoOfflineService.getPendingQueue().length);
      });
    }

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
      
      if (vehiculo.numeroEspacio) {
        doc.setFont('Helvetica', 'bold');
        doc.text(`ESPACIO: #${vehiculo.numeroEspacio}`, 40, 55, { align: 'center' });
      }

      // QR Code
      doc.addImage(qrDataUrl, 'PNG', 20, 58, 40, 40);

      doc.setFont('Helvetica', 'normal');
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
            try {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();
            } catch (printErr) {
              console.warn("Impresión directa por iframe no disponible en el navegador:", printErr);
            }
            // Limpieza del iframe y revocación de memoria blob para evitar fugas
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
              try { URL.revokeObjectURL(iframeUrl.toString()); } catch (_) {}
            }, 30000);
          }, 300);
        };
      }

      // Revocar blob móvil tras 30 segundos
      setTimeout(() => {
        try { URL.revokeObjectURL(pdfUrl); } catch (_) {}
      }, 30000);
    } catch (error) {
      console.error('Error generando QR o Ticket local:', error);
      alert('Error al procesar el ticket de impresión.');
    }
  };

  const handleDeleteHistory = async (id: string) => {
    const confirmed = await showConfirm(
      'Confirmar Eliminación',
      '¿Desea eliminar este registro del historial permanentemente?',
      { type: 'danger', confirmText: 'Eliminar', cancelText: 'Cancelar' }
    );
    if (confirmed) {
      try {
        await firebaseService.deleteVehiculoParqueo(id);
      } catch (e) {
        console.error(e);
        alert("Error al eliminar el vehículo.");
      }
    }
  };

  // Filter lists
  const vehiculosActivos = vehiculos.filter(v => v.estado === 'Activo');
  const vehiculosHistorial = vehiculos.filter(v => v.estado === 'Completado');

  const filteredActivos = vehiculosActivos.filter(v => {
    if (!salidaSearchQuery.trim()) return true;
    const q = salidaSearchQuery.toLowerCase().trim();
    return (
      v.numeroPlaca.toLowerCase().includes(q) ||
      v.colorLabel.toLowerCase().includes(q) ||
      v.tipoPlaca.toLowerCase().includes(q) ||
      (v.numeroEspacio && String(v.numeroEspacio).includes(q))
    );
  });

  const filteredHistorial = useMemo(() => {
    return vehiculosHistorial.filter(v => {
      const dateToEvaluate = v.horaSalida ? new Date(v.horaSalida) : new Date(v.horaEntrada);
      const now = new Date();

      if (filtroFechaHistorial === 'hoy') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        if (dateToEvaluate < start || dateToEvaluate > end) return false;
      } else if (filtroFechaHistorial === 'ayer') {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0);
        const end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
        if (dateToEvaluate < start || dateToEvaluate > end) return false;
      } else if (filtroFechaHistorial === 'semana') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);
        if (dateToEvaluate < weekAgo) return false;
      } else if (filtroFechaHistorial === 'mes') {
        if (dateToEvaluate.getMonth() !== now.getMonth() || dateToEvaluate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      } else if (filtroFechaHistorial === 'personalizado') {
        if (fechaInicioHistorial) {
          const start = new Date(fechaInicioHistorial + 'T00:00:00');
          if (dateToEvaluate < start) return false;
        }
        if (fechaFinHistorial) {
          const end = new Date(fechaFinHistorial + 'T23:59:59.999');
          if (dateToEvaluate > end) return false;
        }
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        v.numeroPlaca.toLowerCase().includes(q) ||
        v.colorLabel.toLowerCase().includes(q) ||
        v.tipoPlaca.toLowerCase().includes(q) ||
        (v.metodoPago && v.metodoPago.toLowerCase().includes(q)) ||
        (v.costo && String(v.costo).includes(q))
      );
    });
  }, [vehiculosHistorial, filtroFechaHistorial, fechaInicioHistorial, fechaFinHistorial, searchQuery]);

  const totalHistorialFiltrado = useMemo(() => {
    return filteredHistorial.reduce((acc, curr) => acc + (curr.costo || 0), 0);
  }, [filteredHistorial]);

  const renderEspaciosModal = () => {
    if (!showEspaciosModal) return null;

    const occupiedSpots = new Set(
      vehiculosActivos.map(v => v.numeroEspacio).filter(e => e !== undefined)
    );

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-black text-slate-800 text-lg">Seleccionar Parqueo</h3>
              <p className="text-xs text-slate-500 font-medium">Asigna un espacio al vehículo</p>
            </div>
            <button 
              type="button"
              onClick={() => setShowEspaciosModal(false)}
              className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shadow-sm"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-6">
            <div className="flex justify-between items-end mb-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span className="flex items-center space-x-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></div>
                <span>Disponible</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
                <span>Ocupado</span>
              </span>
            </div>

            <div className="flex justify-between gap-6">
              {/* Left Side (1-12) */}
              <div className="flex-1 grid grid-cols-2 gap-3">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(num => {
                  const isOccupied = occupiedSpots.has(num);
                  const isSelected = espacioSeleccionado === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      disabled={isOccupied}
                      onClick={() => {
                        setEspacioSeleccionado(num);
                        setShowEspaciosModal(false);
                      }}
                      className={`h-11 rounded-xl text-sm font-black border-2 transition-all flex items-center justify-center ${
                        isOccupied 
                          ? 'bg-red-50 border-red-100 text-red-400 cursor-not-allowed opacity-70' 
                          : isSelected
                            ? 'bg-emerald-500 border-emerald-600 text-white shadow-md transform scale-105'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>

              {/* Right Side (13-24) */}
              <div className="flex-1 grid grid-cols-2 gap-3">
                {Array.from({ length: 12 }, (_, i) => i + 13).map(num => {
                  const isOccupied = occupiedSpots.has(num);
                  const isSelected = espacioSeleccionado === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      disabled={isOccupied}
                      onClick={() => {
                        setEspacioSeleccionado(num);
                        setShowEspaciosModal(false);
                      }}
                      className={`h-11 rounded-xl text-sm font-black border-2 transition-all flex items-center justify-center ${
                        isOccupied 
                          ? 'bg-red-50 border-red-100 text-red-400 cursor-not-allowed opacity-70' 
                          : isSelected
                            ? 'bg-emerald-500 border-emerald-600 text-white shadow-md transform scale-105'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
            {espacioSeleccionado && (
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-center">
                <button 
                  type="button"
                  onClick={() => setEspacioSeleccionado(null)}
                  className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                >
                  Quitar espacio seleccionado
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Control de Uso de Sanitarios (Q. 3.00 / entrada) */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-[2rem] p-5 md:p-6 text-white shadow-xl border border-blue-800/40 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-400/30">
              <Users size={22} />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-black tracking-tight flex items-center gap-2">
                <span>Control de Uso de Sanitarios</span>
                <span className="text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-md">Q. 3.00 / entrada</span>
              </h3>
              <p className="text-xs text-slate-400 font-semibold">Anotación instantánea de ingresos y reporte para el corte del día.</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Recaudado Baños Hoy</span>
              <p className="text-xl md:text-2xl font-black text-amber-400">Q.{banosStats.totalMontoHoy}.00</p>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setShowBanosReportModal(true)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/15 transition-all flex items-center space-x-1"
                title="Ver reporte detallado de baños"
              >
                <FileText size={14} />
                <span className="hidden md:inline">Reporte</span>
              </button>
              {banosStats.todayRecords.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleDeleteLastBano(banosStats.todayRecords[0].id)}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded-xl transition-all"
                  title="Anular último ingreso de baño registrado"
                >
                  <Undo2 size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Toast Notification Banner */}
        {banoToast && (
          <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-2 rounded-xl text-xs font-black flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
            <span className="flex items-center gap-2">
              <CheckCircle size={14} className="text-emerald-400" />
              <span>{banoToast}</span>
            </span>
            <span className="text-[10px] text-emerald-200 uppercase font-extrabold bg-emerald-500/30 px-2 py-0.5 rounded-md">Registrado</span>
          </div>
        )}

        {/* Buttons and Live Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Button Hombre */}
          <button
            type="button"
            onClick={() => handleRecordBano('hombre')}
            className="p-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-2xl shadow-md hover:shadow-xl hover:shadow-blue-500/25 transition-all active:scale-95 flex items-center justify-between cursor-pointer border border-blue-400/40 group shrink-0"
          >
            <div className="flex items-center space-x-3.5">
              <span className="text-3xl group-hover:scale-110 transition-transform duration-300">👨</span>
              <div className="text-left">
                <span className="text-sm font-black tracking-tight block">Anotar Hombre</span>
                <span className="inline-block text-[11px] font-extrabold bg-white/20 group-hover:bg-white/30 px-2.5 py-0.5 rounded-full border border-white/20 text-white mt-1 transition-colors">
                  +Q.3.00
                </span>
              </div>
            </div>
          </button>

          {/* Button Mujer */}
          <button
            type="button"
            onClick={() => handleRecordBano('mujer')}
            className="p-4 bg-gradient-to-br from-rose-600 via-pink-600 to-rose-800 hover:from-rose-500 hover:to-pink-500 text-white font-black rounded-2xl shadow-md hover:shadow-xl hover:shadow-rose-500/25 transition-all active:scale-95 flex items-center justify-between cursor-pointer border border-pink-400/40 group shrink-0"
          >
            <div className="flex items-center space-x-3.5">
              <span className="text-3xl group-hover:scale-110 transition-transform duration-300">👩</span>
              <div className="text-left">
                <span className="text-sm font-black tracking-tight block">Anotar Mujer</span>
                <span className="inline-block text-[11px] font-extrabold bg-white/20 group-hover:bg-white/30 px-2.5 py-0.5 rounded-full border border-white/20 text-white mt-1 transition-colors">
                  +Q.3.00
                </span>
              </div>
            </div>
          </button>

          {/* Hombres Counter Card */}
          <div className="bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div className="text-xs text-left">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Hombres Hoy</span>
              <p className="text-lg font-black text-blue-300 mt-0.5">{banosStats.hombresHoy} <span className="text-xs font-semibold text-slate-300">personas</span></p>
            </div>
            <span className="text-xs font-black text-slate-200 bg-blue-500/20 px-2.5 py-1 rounded-xl border border-blue-400/20 shrink-0">
              Q.{banosStats.hombresHoy * 3}.00
            </span>
          </div>

          {/* Mujeres Counter Card */}
          <div className="bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div className="text-xs text-left">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Mujeres Hoy</span>
              <p className="text-lg font-black text-pink-300 mt-0.5">{banosStats.mujeresHoy} <span className="text-xs font-semibold text-slate-300">personas</span></p>
            </div>
            <span className="text-xs font-black text-slate-200 bg-pink-500/20 px-2.5 py-1 rounded-xl border border-pink-400/20 shrink-0">
              Q.{banosStats.mujeresHoy * 3}.00
            </span>
          </div>
        </div>
      </div>

      {/* Toast flotante de estado de red / IA / guardado local */}
      {offlineToast && (
        <div className="w-full max-w-2xl mx-auto mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className={`p-3 rounded-2xl text-xs font-black text-center flex items-center justify-between shadow-lg ${
            offlineToast.tipo === 'success' ? 'bg-emerald-600 text-white border border-emerald-400' :
            offlineToast.tipo === 'warning' ? 'bg-amber-500 text-slate-950 border border-amber-300' :
            'bg-blue-600 text-white border border-blue-400'
          }`}>
            <span className="flex-1 text-center">{offlineToast.mensaje}</span>
            <button type="button" onClick={() => setOfflineToast(null)} className="p-1 hover:opacity-75 cursor-pointer">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Banner de Estado Offline o Pendientes de Sincronización */}
      {(!isOnline || pendingOfflineCount > 0) && (
        <div className="w-full max-w-2xl mx-auto mb-5 p-3.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-sm bg-amber-50 border-amber-200 text-amber-950">
          <div className="flex items-center gap-2.5">
            {!isOnline ? (
              <WifiOff size={18} className="text-amber-600 animate-pulse shrink-0" />
            ) : (
              <CloudUpload size={18} className="text-blue-600 shrink-0" />
            )}
            <div>
              <p className="font-black">
                {!isOnline ? 'Modo sin conexión activo' : `${pendingOfflineCount} registro(s) pendientes de subir a la nube`}
              </p>
              <p className="text-[11px] text-amber-800 font-medium">
                {!isOnline
                  ? 'Puede registrar e imprimir tickets normalmente. Todo se guarda temporalmente en este teléfono.'
                  : 'Se sincronizarán automáticamente al confirmar conexión o puede forzar la subida ahora.'}
              </p>
            </div>
          </div>

          {isOnline && pendingOfflineCount > 0 && (
            <button
              type="button"
              onClick={handleTriggerSync}
              disabled={isSyncingOffline}
              className="w-full sm:w-auto px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 shrink-0"
            >
              <RefreshCw size={12} className={isSyncingOffline ? 'animate-spin' : ''} />
              <span>{isSyncingOffline ? 'Subiendo...' : 'Subir Ahora'}</span>
            </button>
          )}
        </div>
      )}

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

            {/* Plate Number (Campo Unificado e Inteligente) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Número de Placa
                </label>
                <div className="flex items-center gap-2">
                  {!isExtranjera && (
                    <span className="text-[10px] font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      Tipo: {tipoPlaca}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPlateAiModal(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 text-[10px] font-black rounded-lg shadow-xs cursor-pointer transition-all active:scale-95"
                    title="Tomar foto a la placa del vehículo y auto-llenar los datos con Inteligencia Artificial"
                  >
                    <Sparkles size={12} className="text-blue-950" />
                    <span>Foto con IA</span>
                  </button>
                </div>
              </div>

              <div className="relative flex items-center">
                {!isExtranjera && (
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none select-none">
                    <span className="bg-blue-900 text-white text-xs font-black px-2 py-0.5 rounded-md shadow-xs">
                      {tipoPlaca}
                    </span>
                    <span className="text-slate-300 font-black">-</span>
                  </div>
                )}
                <input
                  type="text"
                  required
                  value={numeroPlaca}
                  onChange={(e) => handleNumeroPlacaChange(e.target.value)}
                  placeholder={
                    isExtranjera
                      ? "Ej. MEX-789-Z"
                      : tipoPlaca === 'M'
                      ? "123ABC ó 1234XYZ"
                      : tipoPlaca === 'O'
                      ? "12345 ó 123ABC"
                      : "123ABC ó 123-ABC"
                  }
                  className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 text-lg font-black tracking-widest text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all outline-none uppercase ${
                    !isExtranjera ? 'pl-16 pr-4' : 'px-4'
                  }`}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </div>

              {/* Vista previa en tiempo real estilo placa metálica */}
              {numeroPlaca.trim() && (
                <div className="mt-2 flex items-center justify-between p-2.5 bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-xl border border-slate-200/90 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Vista previa:</span>
                    <div className="inline-flex items-center bg-white px-2.5 py-1 rounded-lg border-2 border-slate-800 shadow-xs">
                      <span className="text-[9px] font-black text-blue-900 mr-1.5 border-r border-slate-300 pr-1.5">
                        {isExtranjera ? 'EXT' : tipoPlaca}
                      </span>
                      <span className="font-mono font-black text-slate-900 tracking-wider">
                        {numeroPlaca.toUpperCase().replace(/[\s]/g, '')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full border border-slate-300" style={{ backgroundColor: colorSeleccionado.hex }} />
                    <span>{colorSeleccionado.name}</span>
                  </div>
                </div>
              )}

              <p className="text-[10px] font-medium text-slate-450 mt-1">
                {isExtranjera
                  ? 'Placa internacional: escriba el código completo con estado/país.'
                  : 'Escriba números y letras de corrido. El prefijo de tipo se detecta automáticamente.'}
              </p>
            </div>

            {/* Modalidad de Servicio / Renta */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Modalidad de Servicio / Renta
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { value: 'horario', label: 'Por Hora', sub: 'Q5/30m' },
                  { value: 'noche', label: 'Noche', sub: 'Q25' },
                  { value: 'dia', label: 'Por Día', sub: 'Q40' },
                  { value: 'semana', label: 'Semana', sub: '7 días' },
                  { value: 'quincena', label: 'Quincena', sub: '15 días' },
                  { value: 'mes', label: 'Mes', sub: '30 días' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleSelectTipoRenta(item.value as TipoRentaParqueo)}
                    className={`py-2 px-1 rounded-xl text-center transition-all border cursor-pointer ${
                      tipoRenta === item.value
                        ? 'bg-gradient-to-r from-blue-900 to-indigo-900 border-blue-950 text-white shadow-md scale-[1.02]'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xs font-black block">{item.label}</span>
                    <span className={`text-[9px] font-semibold block ${tipoRenta === item.value ? 'text-blue-200' : 'text-slate-400'}`}>
                      {item.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Rent Price & Duration Preview if not 'horario' */}
            {tipoRenta !== 'horario' && (
              <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 border-b border-amber-200/60 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider block">
                      Precio Acordado de Renta ({tipoRenta.toUpperCase()})
                    </span>
                    <p className="text-[11px] text-amber-800 font-medium">
                      Puedes modificar el monto a cobrar por la renta.
                    </p>
                  </div>
                  <div className="relative w-full sm:w-36">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-black text-amber-700">Q</span>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={montoRentaInput}
                      onChange={(e) => setMontoRentaInput(Number(e.target.value))}
                      className="w-full bg-white border border-amber-300 rounded-xl pl-8 pr-3 py-1.5 text-sm font-black text-amber-950 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-amber-900">
                  <span className="font-bold">Fecha / Hora de Vencimiento:</span>
                  <span className="font-black bg-amber-200/80 px-2.5 py-1 rounded-lg border border-amber-300 text-amber-950 font-mono">
                    {calcularFechaVencimientoPreview(tipoRenta)}
                  </span>
                </div>
              </div>
            )}

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

            {/* Espacio Selector */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lugar de Parqueo</label>
              </div>
              <button
                type="button"
                onClick={() => setShowEspaciosModal(true)}
                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${
                  espacioSeleccionado 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${espacioSeleccionado ? 'bg-emerald-500 text-white shadow-md' : 'bg-white shadow-sm text-slate-400 group-hover:text-blue-500'}`}>
                    <Car size={18} />
                  </div>
                  <span className="font-bold text-sm">
                    {espacioSeleccionado ? `Espacio asignado: #${espacioSeleccionado}` : 'Seleccionar espacio (Opcional)'}
                  </span>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-wider ${espacioSeleccionado ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700'}`}>
                  {espacioSeleccionado ? '✓ Asignado' : 'Abrir Mapa'}
                </span>
              </button>
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5 mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
                <Car size={24} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg sm:text-xl tracking-tight">Vehículos Activos</h3>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Cronómetro en vivo y gestión de salidas</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
              {/* Botón de Escaneo de Ticket con Cámara */}
              <button
                type="button"
                onClick={() => {
                  setScannerToast(null);
                  setShowQrScanner(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-black rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer shrink-0"
                title="Escanear código QR del ticket con la cámara del teléfono"
              >
                <Camera size={16} className="text-yellow-400" />
                <span>Escanear QR</span>
              </button>

              {/* Buscador de Placa en Dar Salida */}
              <div className="relative w-full sm:w-60">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search size={15} />
                </span>
                <input
                  type="text"
                  value={salidaSearchQuery}
                  onChange={(e) => setSalidaSearchQuery(e.target.value)}
                  placeholder="Buscar por placa, color o lugar..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none transition-all"
                />
                {salidaSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSalidaSearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <span className="bg-yellow-100 border border-yellow-200 text-yellow-800 text-[10px] font-black px-3 py-2 rounded-xl uppercase tracking-widest flex items-center justify-center space-x-1.5 shadow-sm shrink-0">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                <span>En Cueva: {vehiculosActivos.length}</span>
              </span>
            </div>
          </div>

          {/* Expiration Notification Banner */}
          {(() => {
            const vehiculosVencidos = vehiculosActivos.filter(v => {
              if (v.tipoRenta && v.tipoRenta !== 'horario' && v.fechaVencimiento) {
                return new Date().getTime() >= new Date(v.fechaVencimiento).getTime();
              }
              return false;
            });

            if (vehiculosVencidos.length === 0) return null;

            return (
              <div className="mb-6 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-4 rounded-2xl shadow-lg border border-red-500/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-xl shrink-0">
                    <AlertTriangle size={22} className="text-amber-300 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm tracking-tight">
                      ¡Alerta: {vehiculosVencidos.length} Vehículo(s) con Renta Vencida!
                    </h4>
                    <p className="text-xs text-red-100 font-medium mt-0.5">
                      Placas: {vehiculosVencidos.map(v => `${v.tipoPlaca === 'Extranjera' ? '' : v.tipoPlaca + '-'}${v.numeroPlaca}`).join(', ')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSalidaSearchQuery(vehiculosVencidos[0].numeroPlaca)}
                  className="w-full sm:w-auto px-4 py-2 bg-white text-red-700 hover:bg-red-50 text-xs font-black rounded-xl transition-all shadow-md shrink-0 cursor-pointer text-center"
                >
                  Localizar Vehículo Vencido
                </button>
              </div>
            );
          })()}

          {vehiculosActivos.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-450 border border-slate-100">
                <Car size={26} />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800">No hay vehículos estacionados</h4>
                <p className="text-xs text-slate-450 mt-1">Registra un nuevo vehículo usando el formulario de ingreso.</p>
              </div>
            </div>
          ) : filteredActivos.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center py-12 text-center space-y-2">
              <Search size={28} className="text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-700 text-sm">No se encontró la placa "{salidaSearchQuery}"</h4>
              <p className="text-xs text-slate-400">Verifica la búsqueda por número de placa, color o espacio asignado.</p>
              <button
                type="button"
                onClick={() => setSalidaSearchQuery('')}
                className="mt-2 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow content-start">
              {filteredActivos.map((v) => {
                const isVencido = v.tipoRenta && v.tipoRenta !== 'horario' && v.fechaVencimiento 
                  ? new Date().getTime() >= new Date(v.fechaVencimiento).getTime() 
                  : false;

                return (
                  <div 
                    key={v.id} 
                    className={`bg-white border rounded-3xl p-5 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group ${
                      isVencido ? 'border-red-400 ring-2 ring-red-400/30' : 'border-slate-200/80'
                    }`}
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
                            {v.numeroEspacio && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                                  Espacio #{v.numeroEspacio}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handlePrintTicket(v)}
                            title="Reimprimir Ticket"
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                          >
                            <Printer size={16} />
                          </button>
                          <button 
                            onClick={() => setTicketVehiculo(v)}
                            title="Mostrar QR"
                            className="p-2 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all cursor-pointer"
                          >
                            <QrCode size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Rental Mode & Expiration details */}
                      {v.tipoRenta && v.tipoRenta !== 'horario' && (
                        <div className={`p-3 rounded-2xl border text-xs space-y-1.5 transition-all ${
                          isVencido 
                            ? 'bg-red-50 border-red-300 text-red-950 shadow-sm' 
                            : 'bg-amber-50/80 border-amber-200/90 text-amber-950'
                        }`}>
                          <div className="flex justify-between items-center font-black">
                            <span className="capitalize flex items-center gap-1.5 text-xs">
                              <Tag size={13} className={isVencido ? 'text-red-600' : 'text-amber-600'} />
                              Renta Por {v.tipoRenta}
                            </span>
                            <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                              Q.{v.montoRenta || 0}.00
                            </span>
                          </div>

                          {v.fechaVencimiento && (
                            <div className="flex justify-between items-center text-[11px] pt-1 border-t border-amber-200/50">
                              <span className="font-semibold text-slate-500">Vencimiento:</span>
                              {isVencido ? (
                                <span className="font-black text-white bg-red-600 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs animate-pulse">
                                  <AlertTriangle size={11} /> ¡RENTA VENCIDA!
                                </span>
                              ) : (
                                <span className="font-bold text-slate-800 font-mono">
                                  {new Date(v.fechaVencimiento).toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })} {new Date(v.fechaVencimiento).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Timer and Exit Button */}
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 group-hover:bg-slate-100/50 transition-colors">
                        <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-center sm:justify-start">
                          <Clock size={16} className="text-blue-500 animate-pulse" />
                          <LiveTimer horaEntrada={v.horaEntrada} />
                        </div>
                        <button
                          onClick={() => handleProcessExit(v)}
                          className="w-full sm:w-auto bg-red-100 hover:bg-red-500 hover:text-white text-red-600 px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 active:scale-95 shadow-sm cursor-pointer"
                        >
                          <LogOut size={14} />
                          <span>Dar Salida</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}

      {/* History and Logs panel */}
      {activeTab === 'historial' && (
      <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-7 shadow-sm space-y-6 animate-in slide-in-from-bottom-4 duration-300">
        <div className="space-y-4 border-b border-slate-100 pb-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-black text-slate-850 text-base">Historial de Parqueo</h3>
                <span className="bg-blue-50 text-blue-900 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-blue-200">
                  {filteredHistorial.length} registros
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                Total cobrado en este período: <span className="text-emerald-700 font-black">Q. {totalHistorialFiltrado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
              </p>
            </div>
            
            {/* Search input with clear button */}
            <div className="relative w-full md:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por placa, color o tipo..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Date Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Filter size={12} /> Período:
            </span>
            {(
              [
                { id: 'hoy', label: 'Hoy' },
                { id: 'ayer', label: 'Ayer' },
                { id: 'semana', label: 'Esta Semana' },
                { id: 'mes', label: 'Este Mes' },
                { id: 'todos', label: 'Todos' },
                { id: 'personalizado', label: 'Personalizado' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltroFechaHistorial(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                  filtroFechaHistorial === f.id
                    ? 'bg-blue-900 border-blue-950 text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}

            {filtroFechaHistorial === 'personalizado' && (
              <div className="flex items-center gap-2 ml-auto w-full sm:w-auto mt-2 sm:mt-0 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                  <span>Desde:</span>
                  <input
                    type="date"
                    value={fechaInicioHistorial}
                    onChange={(e) => setFechaInicioHistorial(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none"
                  />
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                  <span>Hasta:</span>
                  <input
                    type="date"
                    value={fechaFinHistorial}
                    onChange={(e) => setFechaFinHistorial(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none"
                  />
                </div>
              </div>
            )}
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
    </div>

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
                {ticketQrDataUrl ? (
                  <img 
                    src={ticketQrDataUrl} 
                    alt="QR Ticket" 
                    className="w-36 h-36 mx-auto object-contain"
                  />
                ) : (
                  <div className="w-36 h-36 mx-auto flex items-center justify-center bg-slate-100 rounded-xl text-slate-400 text-xs font-bold animate-pulse">
                    Generando QR...
                  </div>
                )}
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

              {showExitModal.tipoRenta && showExitModal.tipoRenta !== 'horario' && (
                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-xs space-y-2 text-amber-950">
                  <div className="flex justify-between items-center font-black">
                    <span className="flex items-center gap-1.5 uppercase tracking-wide">
                      <Tag size={13} className="text-amber-700" />
                      Renta Por {showExitModal.tipoRenta}
                    </span>
                    <span className="bg-amber-200/90 text-amber-950 px-2.5 py-0.5 rounded-lg border border-amber-300 font-mono font-bold">
                      Tarifa: Q.{(showExitModal.montoRenta || 0).toFixed(2)}
                    </span>
                  </div>

                  {showExitModal.fechaVencimiento && (
                    <div className="flex justify-between items-center text-[11px] pt-1 border-t border-amber-200/60">
                      <span className="text-slate-500 font-semibold">Vencimiento Acordado:</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {new Date(showExitModal.fechaVencimiento).toLocaleString('es-GT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                  {showExitModal.pagadoAlIngreso && (
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-amber-200/60 text-emerald-800 font-bold">
                      <span>Estado Pago Renta:</span>
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                        ✓ Pagado al ingreso (Q.{(showExitModal.montoRenta || 0).toFixed(2)})
                      </span>
                    </div>
                  )}

                  {(showExitModal.costoExtraVencido || 0) > 0 && (
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-amber-200/60 text-red-700 font-black">
                      <span>Recargo por Retraso:</span>
                      <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-md border border-red-200">
                        +Q.{(showExitModal.costoExtraVencido || 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Tolerancia / Redondeo por poco tiempo */}
              <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Criterio de Tolerancia / Redondeo
                  </label>
                  {(showExitModal.toleranciaMinutos || 0) > 0 && (
                    <span className="text-[9px] font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                      -{showExitModal.toleranciaMinutos} min aplicados
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyTolerancia(0)}
                    className={`py-2 px-1 rounded-xl text-[10px] font-black transition-all border flex flex-col items-center justify-center cursor-pointer ${
                      (showExitModal.toleranciaMinutos || 0) === 0
                        ? 'bg-slate-800 border-slate-900 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Sin Tolerancia</span>
                    <span className="text-[9px] opacity-75 font-normal">Normal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyTolerancia(5)}
                    className={`py-2 px-1 rounded-xl text-[10px] font-black transition-all border flex flex-col items-center justify-center cursor-pointer ${
                      showExitModal.toleranciaMinutos === 5
                        ? 'bg-amber-500 border-amber-600 text-white shadow-sm'
                        : 'bg-amber-50 border-amber-200/80 text-amber-900 hover:bg-amber-100'
                    }`}
                  >
                    <span>&lt; 5 Minutos</span>
                    <span className="text-[9px] font-bold font-mono opacity-90">-5 min desc.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyTolerancia(10)}
                    className={`py-2 px-1 rounded-xl text-[10px] font-black transition-all border flex flex-col items-center justify-center cursor-pointer ${
                      showExitModal.toleranciaMinutos === 10
                        ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm'
                        : 'bg-indigo-50 border-indigo-200/80 text-indigo-900 hover:bg-indigo-100'
                    }`}
                  >
                    <span>&lt; 10 Minutos</span>
                    <span className="text-[9px] font-bold font-mono opacity-90">-10 min desc.</span>
                  </button>
                </div>
              </div>

              {/* Box de Monto a Cobrar al Salir */}
              {(() => {
                const yaPagado = !!showExitModal.pagadoAlIngreso;
                const recargo = showExitModal.costoExtraVencido || 0;
                const montoACobrar = yaPagado ? recargo : (showExitModal.costo || 0);

                return (
                  <div className={`p-3.5 rounded-2xl border flex justify-between items-center mt-2 ${
                    montoACobrar === 0 
                      ? 'bg-blue-50/90 border-blue-200 text-blue-950'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  }`}>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider block">
                        {montoACobrar === 0 ? 'Total Pendiente' : 'Total a Cobrar al Salir'}
                      </span>
                      {yaPagado && montoACobrar === 0 && (
                        <span className="text-[10px] text-blue-700 font-bold block mt-0.5">
                          ✓ Renta cancelada al ingresar
                        </span>
                      )}
                      {yaPagado && montoACobrar > 0 && (
                        <span className="text-[10px] text-red-600 font-bold block mt-0.5">
                          Renta pagada al ingreso. Solo recargo extra.
                        </span>
                      )}
                    </div>
                    <span className="text-xl font-black font-mono">
                      Q. {montoACobrar.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })()}

              <div className="pt-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Método de Pago</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Efectivo', 'Tarjeta', 'Transferencia'].map((metodo) => (
                    <button
                      key={metodo}
                      onClick={() => setShowExitModal({ ...showExitModal, metodoPago: metodo as any })}
                      className={`py-2 rounded-xl text-[10px] font-black transition-all border cursor-pointer ${
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

        const addPago = (amount: number, dateStr?: string, metodo: string = 'Efectivo') => {
          if (!dateStr || amount <= 0) return;
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return;

          if (date >= monthStart) {
            stats.mes.total += amount;
            stats.mes.count++;
            if (metodo === 'Efectivo') stats.mes.efectivo += amount;
            else if (metodo === 'Tarjeta') stats.mes.tarjeta += amount;
            else stats.mes.transferencia += amount;
          }
          if (date >= weekStart) {
            stats.semana.total += amount;
            stats.semana.count++;
            if (metodo === 'Efectivo') stats.semana.efectivo += amount;
            else if (metodo === 'Tarjeta') stats.semana.tarjeta += amount;
            else stats.semana.transferencia += amount;
          }
          if (date >= today) {
            stats.hoy.total += amount;
            stats.hoy.count++;
            if (metodo === 'Efectivo') stats.hoy.efectivo += amount;
            else if (metodo === 'Tarjeta') stats.hoy.tarjeta += amount;
            else stats.hoy.transferencia += amount;
          }
        };

        // 1. Vehículos en historial (salidas completadas)
        vehiculosHistorial.forEach(v => {
          const metodo = v.metodoPago || 'Efectivo';
          if (v.pagadoAlIngreso) {
            // La renta base se cobró al ingreso
            addPago(v.montoRenta || 0, v.fechaCobro || v.horaEntrada, metodo);
            // El recargo extra por retraso (si existió) se cobró en la hora de salida
            if ((v.costoExtraVencido || 0) > 0) {
              addPago(v.costoExtraVencido || 0, v.horaSalida, metodo);
            }
          } else {
            // Se cobró el total al registrar la salida
            addPago(v.costo || 0, v.horaSalida, metodo);
          }
        });

        // 2. Vehículos actualmente activos que pagaron renta al ingresar (Noche, Día, Mes, etc.)
        vehiculosActivos.forEach(v => {
          if (v.pagadoAlIngreso || (v.tipoRenta && v.tipoRenta !== 'horario')) {
            const monto = v.montoRenta || v.costo || 0;
            const metodo = v.metodoPago || 'Efectivo';
            addPago(monto, v.fechaCobro || v.horaEntrada, metodo);
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
                
                {/* Gran Total Consolidado */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-800 text-white rounded-3xl p-6 shadow-xl shadow-emerald-600/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-200 tracking-widest">Corte Consolidado de Hoy (Parqueo + Baños)</span>
                    <h3 className="text-4xl font-black mt-1">Q{(stats.hoy.total + banosStats.totalMontoHoy).toLocaleString('es-GT', {minimumFractionDigits:2})}</h3>
                    <p className="text-xs text-emerald-100 mt-1 font-semibold">
                      Parqueo: Q{stats.hoy.total.toLocaleString('es-GT', {minimumFractionDigits:2})} ({stats.hoy.count} tickets) | Baños: Q{banosStats.totalMontoHoy.toLocaleString('es-GT', {minimumFractionDigits:2})} ({banosStats.totalUsosHoy} personas)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const docPdf = new jsPDF();
                      docPdf.setFontSize(16);
                      docPdf.text('CLUB DE LEONES DE QUETZALTENANGO', 105, 15, { align: 'center' });
                      docPdf.setFontSize(12);
                      docPdf.text('CORTE DE CAJA - PARQUEO Y BAÑOS', 105, 22, { align: 'center' });
                      docPdf.setFontSize(10);
                      docPdf.text(`Fecha: ${new Date().toLocaleDateString('es-GT')}`, 105, 28, { align: 'center' });

                      docPdf.text('----------------------------------------------------------------------------------', 105, 34, { align: 'center' });
                      docPdf.text(`Parqueo (Tickets cobrados: ${stats.hoy.count}): Q. ${stats.hoy.total.toFixed(2)}`, 15, 44);
                      docPdf.text(`  - Efectivo: Q. ${stats.hoy.efectivo.toFixed(2)}`, 15, 51);
                      docPdf.text(`  - Tarjeta: Q. ${stats.hoy.tarjeta.toFixed(2)}`, 15, 57);
                      docPdf.text(`  - Transferencia: Q. ${stats.hoy.transferencia.toFixed(2)}`, 15, 63);

                      docPdf.text(`Baños (Total accesos: ${banosStats.totalUsosHoy}): Q. ${banosStats.totalMontoHoy.toFixed(2)}`, 15, 73);
                      docPdf.text(`  - Hombres (${banosStats.hombresHoy} personas x Q3.00): Q. ${(banosStats.hombresHoy * 3).toFixed(2)}`, 15, 80);
                      docPdf.text(`  - Mujeres (${banosStats.mujeresHoy} personas x Q3.00): Q. ${(banosStats.mujeresHoy * 3).toFixed(2)}`, 15, 86);

                      docPdf.text('----------------------------------------------------------------------------------', 105, 94, { align: 'center' });
                      docPdf.setFontSize(12);
                      docPdf.text(`GRAN TOTAL DEL CORTE DEL DÍA: Q. ${(stats.hoy.total + banosStats.totalMontoHoy).toFixed(2)}`, 15, 104);

                      docPdf.autoPrint();
                      const blobUrl = docPdf.output('bloburl');
                      const printWin = window.open(blobUrl, '_blank');
                      if (!printWin) {
                        docPdf.save(`corte-caja-${new Date().toISOString().split('T')[0]}.pdf`);
                      }
                      setTimeout(() => {
                        try { URL.revokeObjectURL(blobUrl.toString()); } catch (_) {}
                      }, 45000);
                    }}
                    className="px-5 py-3 bg-white text-emerald-900 hover:bg-emerald-50 font-black text-xs rounded-2xl shadow-md transition-all flex items-center space-x-2 shrink-0 cursor-pointer active:scale-95"
                  >
                    <Printer size={16} />
                    <span>Imprimir Comprobante de Corte</span>
                  </button>
                </div>

                {/* Hoy Summary Breakdown */}
                <div>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Desglose de Ingresos de Hoy</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recaudado Parqueo</p>
                      <p className="text-2xl font-black text-slate-800 mt-1">Q{stats.hoy.total.toLocaleString('es-GT', {minimumFractionDigits:2})}</p>
                      <p className="text-xs text-slate-500 mt-1">{stats.hoy.count} tickets cobrados</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 shadow-sm">
                      <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Recaudado Baños</p>
                      <p className="text-2xl font-black text-amber-950 mt-1">Q{banosStats.totalMontoHoy.toLocaleString('es-GT', {minimumFractionDigits:2})}</p>
                      <p className="text-xs text-amber-800 mt-1">{banosStats.hombresHoy} 👨 / {banosStats.mujeresHoy} 👩</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Efectivo (Parqueo)</p>
                      <p className="text-2xl font-black text-slate-800 mt-1">Q{stats.hoy.efectivo.toLocaleString('es-GT', {minimumFractionDigits:2})}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tarjeta / Transferencia</p>
                      <p className="text-2xl font-black text-slate-800 mt-1">Q{(stats.hoy.tarjeta + stats.hoy.transferencia).toLocaleString('es-GT', {minimumFractionDigits:2})}</p>
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

      {/* Reporte de Uso de Baños Modal */}
      {showBanosReportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl sm:rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300 max-h-[88vh] flex flex-col text-left">
            {/* Header */}
            <div className="bg-slate-900 text-white px-5 sm:px-7 py-4 sm:py-5 flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 sm:p-2.5 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-400/30">
                  <Users size={20} className="sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight leading-snug">Reporte de Sanitarios</h2>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Control de accesos y recaudación a Q. 3.00</p>
                </div>
              </div>
              <button 
                onClick={() => setShowBanosReportModal(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 sm:p-6 space-y-4 text-left overflow-y-auto flex-1">
              {/* Summary Dashboard - Compact 3 column grid */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-3 sm:p-4 rounded-2xl shadow-sm">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider opacity-90 block">Total Hoy</span>
                  <p className="text-lg sm:text-2xl font-black mt-0.5">Q.{banosStats.totalMontoHoy}.00</p>
                  <p className="text-[9px] sm:text-xs font-bold opacity-90">{banosStats.totalUsosHoy} usos</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-3 sm:p-4 rounded-2xl">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase text-blue-900 tracking-wider block">Hombres</span>
                  <p className="text-base sm:text-xl font-black text-blue-900 mt-0.5">{banosStats.hombresHoy}</p>
                  <p className="text-[9px] sm:text-xs font-bold text-blue-700">Q.{banosStats.hombresHoy * 3}.00</p>
                </div>

                <div className="bg-pink-50 border border-pink-200 p-3 sm:p-4 rounded-2xl">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase text-pink-900 tracking-wider block">Mujeres</span>
                  <p className="text-base sm:text-xl font-black text-pink-900 mt-0.5">{banosStats.mujeresHoy}</p>
                  <p className="text-[9px] sm:text-xs font-bold text-pink-700">Q.{banosStats.mujeresHoy * 3}.00</p>
                </div>
              </div>

              {/* Detail List */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">
                  Registros de Hoy ({banosStats.todayRecords.length})
                </h4>

                {banosStats.todayRecords.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 font-bold italic text-xs">
                    No se han registrado usos de sanitarios el día de hoy.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-48 sm:max-h-60 overflow-y-auto pr-1">
                    {banosStats.todayRecords.map((reg) => (
                      <div key={reg.id} className="py-2 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2.5">
                          <span className="text-sm">{reg.genero === 'hombre' ? '👨' : '👩'}</span>
                          <div>
                            <span className="font-extrabold text-slate-800 capitalize text-xs">Acceso {reg.genero}</span>
                            <p className="text-[9px] text-slate-400 font-semibold">{new Date(reg.fecha).toLocaleTimeString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2.5">
                          <span className="font-black text-emerald-700 text-xs">+Q. 3.00</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteLastBano(reg.id)}
                            className="p-1 text-slate-300 hover:text-red-600 rounded transition-colors cursor-pointer"
                            title="Eliminar registro"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer - Fixed */}
            <div className="bg-slate-100 px-5 sm:px-7 py-3.5 border-t border-slate-200 flex justify-between items-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  const docPdf = new jsPDF();
                  docPdf.setFontSize(16);
                  docPdf.text('CLUB DE LEONES DE QUETZALTENANGO', 105, 15, { align: 'center' });
                  docPdf.setFontSize(12);
                  docPdf.text('REPORTE DE USO DE SANITARIOS', 105, 22, { align: 'center' });
                  docPdf.setFontSize(10);
                  docPdf.text(`Fecha: ${new Date().toLocaleDateString('es-GT')}`, 105, 28, { align: 'center' });
                  docPdf.text('----------------------------------------------------------------------------------', 105, 34, { align: 'center' });
                  docPdf.text(`Hombres: ${banosStats.hombresHoy} personas (Q. ${(banosStats.hombresHoy * 3).toFixed(2)})`, 15, 45);
                  docPdf.text(`Mujeres: ${banosStats.mujeresHoy} personas (Q. ${(banosStats.mujeresHoy * 3).toFixed(2)})`, 15, 52);
                  docPdf.text(`Total Ingresos Baños: Q. ${banosStats.totalMontoHoy.toFixed(2)}`, 15, 62);
                  docPdf.autoPrint();
                  const blobUrl = docPdf.output('bloburl');
                  const printWin = window.open(blobUrl, '_blank');
                  if (!printWin) {
                    docPdf.save(`reporte-sanitarios-${new Date().toISOString().split('T')[0]}.pdf`);
                  }
                  setTimeout(() => {
                    try { URL.revokeObjectURL(blobUrl.toString()); } catch (_) {}
                  }, 45000);
                }}
                className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-md"
              >
                <Printer size={14} />
                <span>Imprimir Reporte</span>
              </button>

              <button 
                onClick={() => setShowBanosReportModal(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Advertencia: Placa Ya Registrada y Activa */}
      {duplicateVehiculoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-amber-200 animate-in zoom-in-95 duration-200 text-left">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white/20 rounded-2xl">
                  <AlertTriangle size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-tight leading-tight">Placa Ya Registrada</h3>
                  <p className="text-xs text-amber-100 font-medium">Vehículo actualmente dentro del parqueo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDuplicateVehiculoModal(null)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-amber-900 space-y-2">
                <p className="text-xs font-bold leading-relaxed">
                  La placa <span className="font-black text-amber-950 underline px-1 bg-amber-200/60 rounded">{duplicateVehiculoModal.tipoPlaca === 'Extranjera' ? '' : duplicateVehiculoModal.tipoPlaca + '-'}{duplicateVehiculoModal.numeroPlaca}</span> ya se encuentra ingresada y activa en el parqueo.
                </p>
                <p className="text-[11px] text-amber-800 font-medium">
                  No es posible emitir un nuevo ticket para un vehículo que no ha registrado su salida.
                </p>
              </div>

              {/* Vehicle info card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                  <span className="text-[10px] font-black uppercase text-slate-400">Estado</span>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    ● En Cueva (Activo)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-bold">Tiempo Transcurrido:</span>
                  <span className="font-black font-mono text-slate-900">{getTiempoTranscurrido(duplicateVehiculoModal.horaEntrada)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-bold">Color del Vehículo:</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full border border-slate-300 shadow-xs" style={{ backgroundColor: duplicateVehiculoModal.color }}></span>
                    <span className="font-bold text-slate-800">{duplicateVehiculoModal.colorLabel}</span>
                  </div>
                </div>
                {duplicateVehiculoModal.numeroEspacio && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-bold">Espacio de Parqueo:</span>
                    <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Espacio #{duplicateVehiculoModal.numeroEspacio}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row justify-end items-center gap-2">
              <button
                type="button"
                onClick={() => setDuplicateVehiculoModal(null)}
                className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Entendido
              </button>
              <button
                type="button"
                onClick={() => {
                  setSalidaSearchQuery(duplicateVehiculoModal.numeroPlaca);
                  setActiveTab('salida');
                  setDuplicateVehiculoModal(null);
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <LogOut size={14} />
                <span>Ver y Dar Salida</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {renderEspaciosModal()}

      {/* Modal de Escáner QR de Tickets por Cámara */}
      <QrScannerModal
        isOpen={showQrScanner}
        onClose={() => {
          setShowQrScanner(false);
          setScannerToast(null);
        }}
        onScan={handleScanQrResult}
        toast={scannerToast}
        onClearToast={() => setScannerToast(null)}
      />

      {/* Modal de Lectura de Placas con IA (Gemini Flash Vision) */}
      <PlateAiModal
        isOpen={showPlateAiModal}
        onClose={() => setShowPlateAiModal(false)}
        onPlateRecognized={handlePlateRecognized}
      />
    </div>
  );
};
