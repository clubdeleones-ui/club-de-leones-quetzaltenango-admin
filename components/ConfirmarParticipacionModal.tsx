import React, { useState } from 'react';
import { XIcon, User, Phone, Users, Send, CheckCircle, Loader2 } from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { useToast } from '../context/ToastContext';
import { RegistroParticipacion } from '../types';

interface ConfirmarParticipacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actividadId: string;
  actividadTitulo: string;
}

export const ConfirmarParticipacionModal: React.FC<ConfirmarParticipacionModalProps> = ({
  isOpen,
  onClose,
  actividadId,
  actividadTitulo
}) => {
  const { showToast } = useToast();
  const [nombre, setNombre] = useState('');
  const [esSocio, setEsSocio] = useState(false);
  const [telefonoDigitos, setTelefonoDigitos] = useState('');
  const [llevaInvitados, setLlevaInvitados] = useState(false);
  const [cantidadInvitados, setCantidadInvitados] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim() || telefonoDigitos.length !== 8) {
      showToast("Por favor complete todos los campos requeridos correctamente.", "error");
      return;
    }

    if (llevaInvitados && (cantidadInvitados < 1 || isNaN(cantidadInvitados))) {
      showToast("Por favor especifique una cantidad válida de invitados.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const registro: RegistroParticipacion = {
        id: `rsvp_${Date.now()}`,
        actividadId,
        actividadTitulo,
        nombre: nombre.trim(),
        esSocio,
        telefono: `+502${telefonoDigitos}`,
        llevaInvitados,
        cantidadInvitados: llevaInvitados ? cantidadInvitados : 0,
        fechaRegistro: new Date().toISOString()
      };

      await firebaseService.saveRegistroParticipacion(registro);
      showToast("¡Participación confirmada con éxito! Gracias por acompañarnos.", "success");
      
      // Reset form
      setNombre('');
      setEsSocio(false);
      setTelefonoDigitos('');
      setLlevaInvitados(false);
      setCantidadInvitados(1);
      onClose();
    } catch (error) {
      console.error("Error al registrar participación:", error);
      showToast("Hubo un error al confirmar tu participación. Por favor intenta de nuevo.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ''); // Solo dígitos
    if (val.length <= 8) {
      setTelefonoDigitos(val);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 max-w-lg w-full space-y-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300 my-8 relative overflow-hidden text-left">
        
        {/* Decorative Top Accent Line */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-900 to-indigo-700" />
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-blue-900 tracking-tight flex items-center gap-2">
              <CheckCircle className="text-green-500 fill-green-50" size={24} />
              <span>Confirmar Asistencia</span>
            </h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-relaxed">
              {actividadTitulo}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all active:scale-95"
            disabled={isSubmitting}
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-455" size={16} />
              <input
                type="text"
                required
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900 outline-none transition-all text-xs font-bold text-slate-800"
              />
            </div>
          </div>

          {/* Teléfono */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Teléfono de Contacto</label>
            <div className="flex gap-2">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-3 py-3 text-xs font-bold text-slate-500 flex items-center justify-center select-none">
                +502
              </div>
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-455" size={16} />
                <input
                  type="tel"
                  required
                  value={telefonoDigitos}
                  onChange={handlePhoneChange}
                  placeholder="Número de 8 dígitos"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900 outline-none transition-all text-xs font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Checkbox: ¿Es socio del club? */}
          <div className="flex items-center space-x-3 bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4">
            <input
              type="checkbox"
              id="esSocio"
              checked={esSocio}
              onChange={e => setEsSocio(e.target.checked)}
              className="w-5 h-5 text-blue-900 border-slate-300 rounded focus:ring-blue-900 cursor-pointer accent-blue-900"
            />
            <label htmlFor="esSocio" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
              Soy socio activo del Club de Leones Quetzaltenango
            </label>
          </div>

          {/* Checkbox: ¿Lleva invitados? */}
          <div className="space-y-4 bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="llevaInvitados"
                checked={llevaInvitados}
                onChange={e => {
                  setLlevaInvitados(e.target.checked);
                  if (!e.target.checked) setCantidadInvitados(1);
                }}
                className="w-5 h-5 text-blue-900 border-slate-300 rounded focus:ring-blue-900 cursor-pointer accent-blue-900"
              />
              <label htmlFor="llevaInvitados" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                Llevaré acompañantes / invitados
              </label>
            </div>

            {/* Selector de cantidad de invitados */}
            {llevaInvitados && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/40 animate-in slide-in-from-top-2 duration-200">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <Users size={15} />
                  <span>¿Cuántos invitados te acompañan?</span>
                </span>
                <div className="flex items-center space-x-3 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setCantidadInvitados(Math.max(1, cantidadInvitados - 1))}
                    className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-lg font-black transition-colors"
                  >
                    -
                  </button>
                  <span className="text-xs font-extrabold text-slate-800 w-6 text-center">{cantidadInvitados}</span>
                  <button
                    type="button"
                    onClick={() => setCantidadInvitados(cantidadInvitados + 1)}
                    className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-lg font-black transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-extrabold py-3.5 px-6 rounded-2xl transition-all shadow-md active:scale-98 flex items-center justify-center space-x-2 text-xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Registrando participación...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Confirmar mi Participación</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
