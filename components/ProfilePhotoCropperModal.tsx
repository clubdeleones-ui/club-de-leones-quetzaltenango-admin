import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg, PixelCrop } from '../utils/cropImage';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Check, 
  X, 
  Crop as CropIcon, 
  Loader2, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface ProfilePhotoCropperModalProps {
  imageSrc: string;
  onCropComplete: (croppedBase64: string) => void;
  onClose: () => void;
  title?: string;
}

export default function ProfilePhotoCropperModal({
  imageSrc,
  onCropComplete,
  onClose,
  title = "Ajustar Foto de Perfil"
}: ProfilePhotoCropperModalProps) {
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [cropShape, setCropShape] = useState<'round' | 'rect'>('round');
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropAreaChange = useCallback(
    (_croppedArea: any, currentCroppedAreaPixels: PixelCrop) => {
      setCroppedAreaPixels(currentCroppedAreaPixels);
    },
    []
  );

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        500 // Standardized 500x500 square dimensions
      );
      onCropComplete(croppedImage);
      onClose();
    } catch (err) {
      console.error("Error cropping image:", err);
      alert("No se pudo procesar el recorte. Intenta nuevamente.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white relative">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 bg-yellow-500/20 text-yellow-400 rounded-xl">
              <CropIcon size={18} />
            </span>
            <div>
              <h3 className="text-base font-black tracking-tight text-white">{title}</h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Estandarización cuadrada (1:1) para credenciales y directorio
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Crop Area Container */}
        <div className="relative w-full h-[320px] sm:h-[380px] bg-slate-950 overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape={cropShape}
            showGrid={true}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropAreaChange}
            classes={{
              containerClassName: "relative w-full h-full",
              cropAreaClassName: "border-2 border-yellow-400 shadow-2xl"
            }}
          />
        </div>

        {/* Controls Toolbar */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 space-y-4">
          
          {/* Zoom Control Slider */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(1, prev - 0.2))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Alejar"
            >
              <ZoomOut size={16} />
            </button>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-yellow-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(3, prev + 0.2))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Acercar"
            >
              <ZoomIn size={16} />
            </button>
          </div>

          {/* Secondary Actions: Rotation, Shape & Reset */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 pt-1">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleRotate}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all flex items-center space-x-1.5"
                title="Girar 90 grados"
              >
                <RotateCw size={13} className="text-yellow-400" />
                <span>Girar 90°</span>
              </button>

              <button
                type="button"
                onClick={() => setCropShape((prev) => (prev === 'round' ? 'rect' : 'round'))}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
                title="Alternar máscara circular o rectangular"
              >
                {cropShape === 'round' ? '🔘 Círculo' : '⬛ Cuadrado'}
              </button>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="text-slate-400 hover:text-white flex items-center space-x-1 transition-colors"
              title="Restablecer recorte"
            >
              <RefreshCw size={13} />
              <span>Restablecer</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition-all"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={processing}
              className="flex-2 py-3 px-5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-blue-955 font-black text-xs uppercase tracking-wider shadow-lg shadow-yellow-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {processing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Estandarizando...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Aplicar y Guardar Recorte</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
