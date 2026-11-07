import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Sparkles, RefreshCw, AlertCircle, Upload, CheckCircle2 } from 'lucide-react';
import { geminiService, LicensePlateRecognitionResult } from '../services/geminiService';

interface PlateAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlateRecognized: (result: {
    tipoPlaca: string;
    numeroPlaca: string;
    colorLabel: string;
    isExtranjera: boolean;
  }) => void;
}

export const PlateAiModal: React.FC<PlateAiModalProps> = ({ isOpen, onClose, onPlateRecognized }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setIsAnalyzing(false);
      setErrorMsg(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setErrorMsg(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraActive(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn("No se pudo iniciar el visor en vivo de cámara:", err);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const compressAndProcessImage = async (imageSource: HTMLVideoElement | HTMLImageElement) => {
    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      // 1. Verificar si hay conexión
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Sin conexión a internet. La lectura con IA requiere señal activa. Ingrese la placa manualmente.');
      }

      // 2. Dibujar y comprimir en canvas a resolución balanceada (máx 800px)
      const canvas = document.createElement('canvas');
      const maxDim = 800;
      let width = (imageSource as any).videoWidth || (imageSource as any).naturalWidth || (imageSource as any).width || 800;
      let height = (imageSource as any).videoHeight || (imageSource as any).naturalHeight || (imageSource as any).height || 600;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No se pudo inicializar el procesador de imágenes.');

      ctx.drawImage(imageSource, 0, 0, width, height);
      const base64Jpeg = canvas.toDataURL('image/jpeg', 0.85);

      // 3. Llamar al servicio Gemini IA
      const res: LicensePlateRecognitionResult = await geminiService.recognizeLicensePlate(base64Jpeg);

      if (!res.success || !res.numeroPlaca) {
        if (res.error === 'NO_API_KEY') {
          throw new Error('Clave de IA no configurada. Ingrese los datos manualmente.');
        } else if (res.error === 'PLACA_NO_LEGIBLE') {
          throw new Error('No se detectó con claridad la placa del vehículo. Intente una toma más cercana o de frente.');
        } else {
          throw new Error('Error al procesar la imagen con IA. Verifique su señal de internet o escriba la placa manualmente.');
        }
      }

      // 4. Notificar resultado al formulario principal
      onPlateRecognized({
        tipoPlaca: res.tipoPlaca || 'P',
        numeroPlaca: res.numeroPlaca,
        colorLabel: res.color || 'Blanco',
        isExtranjera: Boolean(res.esExtranjera)
      });

      onClose();
    } catch (err: any) {
      console.error("Error en reconocimiento de placa:", err);
      setErrorMsg(err.message || 'Error al reconocer la placa.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCaptureFromVideo = () => {
    if (!videoRef.current) return;
    compressAndProcessImage(videoRef.current);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (event) => {
      img.onload = () => {
        compressAndProcessImage(img);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-between items-center p-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center text-white pt-2 z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 rounded-xl shadow-md">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-black text-sm tracking-tight flex items-center gap-1.5">
              <span>Lectura Inteligente de Placa</span>
              <span className="text-[9px] bg-blue-900/80 text-blue-200 px-1.5 py-0.5 rounded-full border border-blue-400/40">IA</span>
            </h3>
            <p className="text-[10px] text-slate-300 font-medium">Detecta placa y color del vehículo al instante</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={isAnalyzing}
          className="p-2.5 bg-white/10 hover:bg-red-600 border border-white/20 text-white rounded-xl transition-all cursor-pointer disabled:opacity-50"
          title="Cerrar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Viewport / Camera Preview */}
      <div className="relative w-full max-w-sm aspect-[4/3] my-auto rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl flex items-center justify-center bg-slate-950">
        {cameraActive ? (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover"
            />
            {/* Viewfinder Target Frame */}
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-28 border-2 border-dashed border-yellow-400/90 rounded-2xl pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex items-center justify-center">
              <span className="text-[11px] font-black text-yellow-300 bg-black/60 px-3 py-1 rounded-full uppercase tracking-wider">
                Alinee la placa aquí
              </span>
            </div>
          </>
        ) : (
          <div className="p-6 text-center text-white space-y-3">
            <Camera size={40} className="text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-200">Cámara en espera</p>
            <p className="text-[11px] text-slate-400">
              Puede tomar una foto directa con el botón inferior o seleccionar una imagen existente.
            </p>
          </div>
        )}

        {/* Loading overlay during AI analysis */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white space-y-3 z-20">
            <RefreshCw size={36} className="text-yellow-400 animate-spin" />
            <div className="space-y-1">
              <p className="text-sm font-black text-yellow-300 tracking-tight">Analizando vehículo...</p>
              <p className="text-[11px] text-slate-300">Extrayendo número de placa y color con IA de Google</p>
            </div>
          </div>
        )}
      </div>

      {/* Error or Warning Message */}
      {errorMsg && (
        <div className="w-full max-w-md p-3.5 bg-red-600/90 border border-red-400 text-white rounded-2xl text-xs font-bold flex items-center justify-between gap-2 shadow-xl animate-in slide-in-from-bottom duration-200 z-10">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0 text-amber-200" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="p-1 hover:opacity-75 cursor-pointer shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Footer Controls */}
      <div className="w-full max-w-md pb-4 z-10 space-y-3">
        <div className="grid grid-cols-2 gap-2.5">
          {cameraActive ? (
            <button
              type="button"
              onClick={handleCaptureFromVideo}
              disabled={isAnalyzing}
              className="col-span-2 py-3.5 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 text-sm font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Camera size={20} />
              <span>Tomar Foto y Leer Placa</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startCamera}
              disabled={isAnalyzing}
              className="py-3 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <Camera size={16} />
              <span>Activar Visor</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className={`py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 ${cameraActive ? 'col-span-2' : ''}`}
          >
            <Upload size={16} />
            <span>Usar Cámara / Galería</span>
          </button>
        </div>

        {/* Hidden input for direct camera snap or image file picker */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] font-bold text-slate-300 hover:text-white underline cursor-pointer"
          >
            Cancelar y escribir placa manualmente
          </button>
        </div>
      </div>
    </div>
  );
};
