import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gift, Heart, ArrowLeft, CreditCard, ShieldCheck, Sparkles, Check } from 'lucide-react';
import { recurrenteService } from '../services/recurrenteService';
import { useToast } from '../context/ToastContext';

const Donar: React.FC = () => {
  const { showToast } = useToast();
  const [monto, setMonto] = useState<number>(100);
  const [montoPersonalizado, setMontoPersonalizado] = useState<string>('');
  const [nombreDonante, setNombreDonante] = useState<string>('');
  const [correoDonante, setCorreoDonante] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const presetAmounts = [50, 100, 250, 500];

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = montoPersonalizado ? parseFloat(montoPersonalizado) : monto;

    if (!finalAmount || finalAmount < 5) {
      showToast('Por favor ingresa un monto válido igual o mayor a Q5.00', 'error');
      return;
    }

    setLoading(true);
    try {
      const currentOrigin = window.location.origin + window.location.pathname;
      const cleanOrigin = currentOrigin.endsWith('/') ? currentOrigin.slice(0, -1) : currentOrigin;

      const successUrl = `${cleanOrigin}#/donar?status=success&monto=${finalAmount}`;
      const cancelUrl = `${cleanOrigin}#/donar?status=cancel`;

      const checkout = await recurrenteService.createCheckout({
        items: [
          {
            name: `Donación al Club de Leones de Quetzaltenango ${nombreDonante ? `(${nombreDonante})` : ''}`,
            amount_in_cents: Math.round(finalAmount * 100),
            currency: 'GTQ',
            quantity: 1,
          }
        ],
        userEmail: correoDonante || undefined,
        successUrl,
        cancelUrl,
        metadata: {
          tipo: 'donacion_general',
          donanteNombre: nombreDonante || 'Anónimo',
          donanteCorreo: correoDonante || 'N/A'
        }
      });

      if (checkout.checkout_url) {
        window.location.href = checkout.checkout_url;
      } else {
        throw new Error('No se pudo generar el enlace de pago.');
      }
    } catch (err: any) {
      console.error('Error al iniciar donación en Recurrente:', err);
      showToast(err.message || 'Error al conectar con la pasarela de Recurrente GT.', 'error');
      setLoading(false);
    }
  };

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
            Cada aporte impulsa nuestras jornadas de salud, visión y asistencia comunitaria en Quetzaltenango. Pago seguro en Quetzales (GTQ) vía Tarjeta de Crédito/Débito.
          </p>
        </div>
      </div>

      {/* Donation Form */}
      <form onSubmit={handleDonate} className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 text-left max-w-xl mx-auto shadow-sm">
        
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
                    ? 'bg-blue-900 text-white border-blue-950 shadow-md shadow-blue-900/20'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Q{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">O ingresa un monto personalizado (Q)</label>
          <input
            type="number"
            placeholder="Ej. 150"
            min="5"
            value={montoPersonalizado}
            onChange={(e) => setMontoPersonalizado(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-900 outline-none font-bold text-sm text-slate-800"
          />
        </div>

        {/* Donor Info (Optional) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tu Nombre (Opcional)</label>
            <input
              type="text"
              placeholder="Nombre para el agradecimiento"
              value={nombreDonante}
              onChange={(e) => setNombreDonante(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-xs font-semibold text-slate-700"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Correo Electrónico (Opcional)</label>
            <input
              type="email"
              placeholder="Para enviarte el recibo"
              value={correoDonante}
              onChange={(e) => setCorreoDonante(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-xs font-semibold text-slate-700"
            />
          </div>
        </div>

        {/* Security badge */}
        <div className="bg-blue-900/5 border border-blue-900/10 rounded-2xl p-3.5 flex items-center space-x-3 text-xs text-blue-900 font-semibold">
          <ShieldCheck className="text-blue-900 flex-shrink-0" size={20} />
          <p className="leading-snug text-[11px]">
            Procesado de forma 100% segura por <strong>Recurrente Guatemala</strong> con encriptación bancaria SSL. Acepta Visa y Mastercard.
          </p>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 hover:from-blue-950 hover:to-slate-950 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-900/20 text-xs uppercase tracking-wider flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Conectando con pasarela Recurrente...</span>
            </>
          ) : (
            <>
              <CreditCard size={18} />
              <span>Donar Q{montoPersonalizado || monto} con Tarjeta</span>
            </>
          )}
        </button>
      </form>

      {/* Info card of ongoing projects */}
      <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 text-left space-y-4 max-w-xl mx-auto">
        <h3 className="font-bold text-slate-800 flex items-center space-x-2 text-xs uppercase tracking-wider">
          <Heart size={16} className="text-red-500 fill-red-500" />
          <span>Tus aportes harán posible:</span>
        </h3>
        <ul className="text-xs text-slate-600 space-y-2 font-medium">
          <li>✨ Jornadas de Oftalmología y donación de lentes graduados.</li>
          <li>✨ Campañas médicas pediátricas gratuitas en comunidades rurales.</li>
          <li>✨ Kits de víveres y apoyo alimenticio a adultos mayores.</li>
          <li>✨ Equipamiento y útiles escolares para escuelas locales.</li>
        </ul>
      </div>

      <div className="pt-2">
        <Link 
          to="/" 
          className="inline-flex items-center space-x-2 text-slate-500 hover:text-blue-900 font-bold text-xs transition-all"
        >
          <ArrowLeft size={16} />
          <span>Volver al Inicio</span>
        </Link>
      </div>
    </div>
  );
};

export default Donar;
