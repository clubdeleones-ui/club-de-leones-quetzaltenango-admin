import React, { useState } from 'react';
import { X, User, Mail, Phone, MessageSquare, Send, Heart, Loader2 } from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { useToast } from '../context/ToastContext';
import { SolicitudVoluntario } from '../types';

interface InscripcionVoluntarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  actividadId: string;
  actividadTitulo: string;
}

export const InscripcionVoluntarioModal: React.FC<InscripcionVoluntarioModalProps> = ({
  isOpen,
  onClose,
  actividadId,
  actividadTitulo
}) => {
  const { showToast } = useToast();
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefonoDigitos, setTelefonoDigitos] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim() || !correo.trim() || telefonoDigitos.length !== 8) {
      showToast("Por favor complete todos los campos requeridos correctamente.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const solicitud: SolicitudVoluntario = {
        id: `vol_${Date.now()}`,
        actividadId,
        actividadTitulo,
        nombre: nombre.trim(),
        correo: correo.trim(),
        telefono: `+502${telefonoDigitos}`,
        mensaje: mensaje.trim() || undefined,
        fechaRegistro: new Date().toISOString(),
        estado: 'Pendiente'
      };

      await firebaseService.saveSolicitudVoluntario(solicitud);
      showToast("¡Solicitud enviada con éxito! Gracias por tu interés en ayudar.", "success");
      
      // Reset form
      setNombre('');
      setCorreo('');
      setTelefonoDigitos('');
      setMensaje('');
      onClose();
    } catch (error) {
      console.error("Error al registrar voluntario:", error);
      showToast("Hubo un error al enviar tu solicitud. Por favor intenta de nuevo.", "error");
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
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 max-w-lg w-full space-y-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300 my-8 relative overflow-hidden">
        
        {/* Decorative Top Accent Line */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-900 to-indigo-700" />
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-blue-900 tracking-tight flex items-center gap-2">
              <Heart className="text-red-500 fill-red-500 animate-pulse" size={24} />
              <span>Ficha de Inscripción</span>
            </h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
              Voluntariado para Actividad
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all active:scale-95"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Selected Activity Alert Box */}
        <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-2xl flex flex-col gap-1">
          <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">
            Actividad Seleccionada
          </span>
          <span className="font-extrabold text-slate-800 text-base">
            {actividadTitulo}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Nombre Completo */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Nombre Completo *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User size={16} />
              </span>
              <input
                type="text"
                required
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej. Juan Pérez López"
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm text-slate-800 font-medium"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Correo Electrónico */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Correo Electrónico *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                value={correo}
                onChange={e => setCorreo(e.target.value)}
                placeholder="Ej. juanperez@gmail.com"
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm text-slate-800 font-medium"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Teléfono */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Número de Teléfono *
            </label>
            <div className="flex rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-900 focus-within:border-transparent overflow-hidden transition-all">
              <span className="bg-slate-100 text-slate-500 px-4 py-3 flex items-center justify-center border-r border-slate-200 text-sm font-extrabold select-none">
                +502
              </span>
              <div className="relative w-full">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone size={14} />
                </span>
                <input
                  type="tel"
                  required
                  value={telefonoDigitos}
                  onChange={handlePhoneChange}
                  placeholder="5555 5555"
                  className="w-full pl-9 pr-4 py-3 outline-none text-sm text-slate-800 font-medium"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Ingrese los 8 dígitos de su número de teléfono de Guatemala.</p>
          </div>

          {/* Mensaje */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              ¿Por qué deseas apoyar? (Opcional)
            </label>
            <div className="relative">
              <span className="absolute top-3 left-3.5 text-slate-400">
                <MessageSquare size={16} />
              </span>
              <textarea
                rows={3}
                value={mensaje}
                onChange={e => setMensaje(e.target.value)}
                placeholder="Cuéntanos un poco sobre tu motivación o alguna información importante..."
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all resize-none text-sm text-slate-800 font-medium leading-relaxed"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl transition-all text-sm active:scale-98"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-1/2 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-900/50 text-white font-black py-3.5 rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center space-x-2 text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Inscribirse</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
