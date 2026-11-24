import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gift, Heart, ArrowLeft, CreditCard, ShieldCheck, Sparkles, Check, CheckCircle2, Building2, Copy, MessageCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { CyberSourcePaymentModal } from '../components/CyberSourcePaymentModal';
import { CyberSourcePaymentResult } from '../services/cybersourceService';
import { firebaseService } from '../services/firebaseService';
import { Donacion } from '../types';

const Donar: React.FC = () => {
  const { showToast } = useToast();
  const [metodoDonacion, setMetodoDonacion] = useState<'tarjeta' | 'transferencia'>('tarjeta');
  const [copiedCuenta, setCopiedCuenta] = useState(false);
  const [monto, setMonto] = useState<number>(100);
  const [montoPersonalizado, setMontoPersonalizado] = useState<string>('');
  const [nombreDonante, setNombreDonante] = useState<string>('');
  const [correoDonante, setCorreoDonante] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [donationResult, setDonationResult] = useState<CyberSourcePaymentResult | null>(null);

  const CUENTA_BANRURAL_CUEVA = '3827008592';
  const WHATSAPP_CLUB = '50277612345';

  const handleCopyCuenta = async () => {
    try {
      await navigator.clipboard.writeText(CUENTA_BANRURAL_CUEVA);
      setCopiedCuenta(true);
      showToast('Número de cuenta Banrural copiado al portapapeles.', 'success');
      setTimeout(() => setCopiedCuenta(false), 2500);
    } catch {
      showToast(`Cuenta Banrural: ${CUENTA_BANRURAL_CUEVA}`, 'info');
    }
  };

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

  const handlePaymentSuccess = async (result: CyberSourcePaymentResult) => {
    setDonationResult(result);
    setIsModalOpen(false);

    // Registrar automáticamente en Donaciones y reflejar el ingreso en Presupuestos (Cuenta Cueva 3827008592)
    try {
      const nuevaDonacion: Donacion = {
        id: `don-bac-${result.transactionId || Date.now()}`,
        donante: nombreDonante.trim() || 'Amigo León Solidario',
        monto: Number(result.amount) || currentAmount,
        fecha: new Date().toISOString().split('T')[0],
        proyecto: 'Obras Sociales (Donación en Línea)',
        tipo: 'Individual',
        origen: 'Pasarela BAC',
        cuentaDestinoId: 'cueva_3827008592',
        numeroCuentaDestino: '3827008592',
        correoDonante: correoDonante.trim(),
        referenciaPago: result.transactionId,
        codigoAprobacion: result.approvalCode
      };
      await firebaseService.saveDonacionConPresupuesto(nuevaDonacion);
    } catch (err) {
      console.error('Error registrando donación de pasarela en Firestore:', err);
    }

    showToast('¡Gracias por tu donación! Tu aporte fue procesado y registrado con éxito.', 'success');
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
          
          {/* Method Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <button
              type="button"
              onClick={() => setMetodoDonacion('tarjeta')}
              className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                metodoDonacion === 'tarjeta'
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CreditCard size={15} />
              <span>Tarjeta (BAC)</span>
            </button>
            <button
              type="button"
              onClick={() => setMetodoDonacion('transferencia')}
              className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                metodoDonacion === 'transferencia'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Building2 size={15} />
              <span>Transferencia / Depósito</span>
            </button>
          </div>

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

          {metodoDonacion === 'tarjeta' ? (
            <>
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
            </>
          ) : (
            <div className="space-y-4 pt-2 border-t border-slate-200/60 animate-in fade-in duration-300">
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                    Cuenta Oficial Obras Sociales
                  </span>
                  <span className="text-xs font-black text-emerald-900">Banrural S.A.</span>
                </div>

                <div className="bg-white rounded-xl p-3.5 border border-emerald-200/80 flex items-center justify-between gap-3">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cuenta Monetaria</span>
                    <span className="font-mono text-xl font-black text-slate-900 tracking-wider">{CUENTA_BANRURAL_CUEVA}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCuenta}
                    className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                      copiedCuenta
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {copiedCuenta ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedCuenta ? '¡Copiada!' : 'Copiar cuenta'}</span>
                  </button>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p><strong>A nombre de:</strong> Club de Leones Quetzaltenango (Cuenta Cueva)</p>
                  <p><strong>Monto sugerido:</strong> <span className="font-black text-emerald-800">Q{currentAmount > 0 ? currentAmount.toLocaleString() : '100'}</span></p>
                </div>
              </div>

              <div>
                <input
                  type="text"
                  value={nombreDonante}
                  onChange={(e) => setNombreDonante(e.target.value)}
                  placeholder="Tu nombre (opcional, para incluirlo en el mensaje)"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
                />
              </div>

              <a
                href={`https://wa.me/${WHATSAPP_CLUB}?text=${encodeURIComponent(
                  `Hola Club de Leones Quetzaltenango, adjunto comprobante de mi donación por Q${currentAmount > 0 ? currentAmount.toFixed(2) : '100.00'} a la cuenta Banrural ${CUENTA_BANRURAL_CUEVA}.${nombreDonante.trim() ? ` Donante: ${nombreDonante.trim()}.` : ''}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-black text-sm rounded-2xl transition-all shadow-xl shadow-emerald-600/20 active:scale-[0.98] flex items-center justify-center space-x-2"
              >
                <MessageCircle size={18} />
                <span>Enviar Boleta por WhatsApp</span>
              </a>
            </div>
          )}
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
