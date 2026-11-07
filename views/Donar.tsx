import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gift, Heart, ArrowLeft, CreditCard, ShieldCheck, Sparkles, Check, CheckCircle2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { CyberSourcePaymentModal } from '../components/CyberSourcePaymentModal';
import { CyberSourcePaymentResult } from '../services/cybersourceService';

const Donar: React.FC = () => {
  const { showToast } = useToast();
  const [monto, setMonto] = useState<number>(100);
  const [montoPersonalizado, setMontoPersonalizado] = useState<string>('');
  const [nombreDonante, setNombreDonante] = useState<string>('');
  const [correoDonante, setCorreoDonante] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [donationResult, setDonationResult] = useState<CyberSourcePaymentResult | null>(null);

  const presetAmounts = [50, 100, 250, 500];

  const handleStartDonation = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = montoPersonalizado ? parseFloat(montoPersonalizado) : monto;

    if (!finalAmount || finalAmount < 5) {
      showToast('Por favor ingresa un monto válido igual o mayor a Q5.00', 'error');
      return;
    }

    if (!correoDonante || !/\S+@\S+\.\S+/.test(correoDonante)) {
      showToast('Por favor ingresa un correo electrónico válido para tu comprobante oficial.', 'error');
      return;
    }

    setIsModalOpen(true);
  };

  const handlePaymentSuccess = (result: CyberSourcePaymentResult) => {
    setDonationResult(result);
    setIsModalOpen(false);
    showToast('¡Gracias por tu donación! Tu aporte fue procesado con éxito.', 'success');
  };

  const currentAmount = montoPersonalizado ? parseFloat(montoPersonalizado) || 0 : monto;

  return (
    <div className="max-w-3xl mx-auto my-12 p-6 md:p-12 bg-white rounded-[2.5rem] border border-slate-100/90 shadow-2xl text-center space-y-8 animate-in zoom-in-95 duration-500">
      
      {/* Header */}
      <div className="space-y-4">
        <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10 border border-amber-200">
          <Gift size={38} />
        </div>
        
        <div>
          <span className="bg-blue-50 text-blue-900 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-blue-150">
            Apoyo a Obras Sociales
          </span>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mt-3">Haz tu Donación en Línea</h1>
          <p className="text-slate-500 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed font-medium mt-1">
            Cada aporte impulsa nuestras jornadas de salud, visión y asistencia comunitaria en Quetzaltenango. Pago seguro en Quetzales (GTQ) vía Tarjeta de Crédito/Débito con BAC Credomatic.
          </p>
        </div>
      </div>

      {donationResult ? (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-3xl p-8 max-w-xl mx-auto text-center space-y-5 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20">
            <CheckCircle2 size={36} />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">¡Muchas Gracias por tu Solidaridad!</h2>
            <p className="text-xs text-slate-600 mt-1">
              Tu donación de <strong>Q{donationResult.amount.toFixed(2)}</strong> ha sido autorizada correctamente.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 text-left space-y-2 text-xs text-slate-700 font-medium">
            <div className="flex justify-between">
              <span className="text-slate-400">Referencia Bancaria:</span>
              <span className="font-mono font-bold text-slate-900">{donationResult.transactionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Código de Aprobación:</span>
              <span className="font-mono font-bold text-emerald-700">{donationResult.approvalCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Donante:</span>
              <span className="font-bold text-slate-900">{nombreDonante || 'Amigo León Solidario'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Correo Electrónico:</span>
              <span className="text-slate-900 font-bold">{correoDonante}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setDonationResult(null);
              setNombreDonante('');
              setCorreoDonante('');
            }}
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all shadow-md"
          >
            Realizar otra donación
          </button>
        </div>
      ) : (
        /* Donation Form */
        <form onSubmit={handleStartDonation} className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 text-left max-w-xl mx-auto shadow-sm">
          
          {/* Preset Amounts */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">1. Selecciona el Monto (GTQ)</label>
            <div className="grid grid-cols-4 gap-2">
              {presetAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setMonto(amt);
                    setMontoPersonalizado('');
                  }}
                  className={`py-3 rounded-2xl font-black text-sm transition-all border ${
                    monto === amt && !montoPersonalizado
                      ? 'bg-blue-900 text-white border-blue-900 shadow-md scale-[1.02]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100/50'
                  }`}
                >
                  Q{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">O escribe un monto personalizado</label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-slate-400 font-bold text-sm">Q</span>
              <input
                type="number"
                min="5"
                step="any"
                value={montoPersonalizado}
                onChange={(e) => setMontoPersonalizado(e.target.value)}
                placeholder="Ej. 150.00"
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:font-normal placeholder:text-slate-350"
              />
            </div>
          </div>

          {/* Donor Info */}
          <div className="space-y-3 pt-2 border-t border-slate-200/60">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">2. Datos de Contacto</label>
            
            <div>
              <input
                type="text"
                value={nombreDonante}
                onChange={(e) => setNombreDonante(e.target.value)}
                placeholder="Nombre Completo (Opcional si deseas ser anónimo)"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <input
                type="email"
                value={correoDonante}
                onChange={(e) => setCorreoDonante(e.target.value)}
                placeholder="Correo Electrónico (para enviarte tu comprobante)"
                required
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Security Banner */}
          <div className="bg-blue-50/60 border border-blue-150 rounded-2xl p-4 flex items-center space-x-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-blue-900 text-yellow-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <p className="text-[11px] text-slate-600 leading-tight">
              Procesado de forma 100% segura por <strong>CyberSource / BAC Credomatic</strong> con autenticación 3D Secure 2.0 y cifrado SSL bancario. Acepta Visa, Mastercard y AMEX.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white font-black text-sm rounded-2xl transition-all shadow-xl shadow-blue-900/20 active:scale-[0.98] flex items-center justify-center space-x-2"
          >
            <CreditCard size={18} />
            <span>Donar Q{currentAmount > 0 ? currentAmount.toLocaleString() : '0.00'} con Tarjeta (BAC)</span>
          </button>
        </form>
      )}

      {/* CyberSource Modal */}
      <CyberSourcePaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handlePaymentSuccess}
        amount={currentAmount}
        currency="GTQ"
        orderCode={`DON-${Date.now()}`}
        concept={`Donación Obras Sociales: ${nombreDonante || 'Donante Anónimo'}`}
        customer={{
          firstName: nombreDonante.split(' ')[0] || 'Donante',
          lastName: nombreDonante.split(' ').slice(1).join(' ') || 'Solidario',
          email: correoDonante || 'donante@clubdeleonesquetzaltenango.org'
        }}
        allowCuotas={false}
      />

      <div className="pt-2">
        <Link to="/" className="inline-flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={14} />
          <span>Regresar a la página principal</span>
        </Link>
      </div>

    </div>
  );
};

export default Donar;
