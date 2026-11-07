import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  CreditCard, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  Sparkles,
  Building2,
  Calendar,
  DollarSign
} from 'lucide-react';
import { cybersourceService, CyberSourcePaymentResult } from '../services/cybersourceService';

interface CyberSourcePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: CyberSourcePaymentResult) => void;
  amount: number;
  currency?: 'GTQ' | 'USD';
  orderCode: string;
  concept: string; // e.g. "Inscripción Convención D-3", "Aportación Cuota Socio", "Alquiler Salón"
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
  allowCuotas?: boolean; // Habilitar programa de Cuotas BAC
}

export const CyberSourcePaymentModal: React.FC<CyberSourcePaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  amount,
  currency = 'GTQ',
  orderCode,
  concept,
  customer,
  allowCuotas = true
}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState(`${customer.firstName} ${customer.lastName}`.trim());
  const [expiry, setExpiry] = useState(''); // MM/YY
  const [cvv, setCvv] = useState('');
  const [cuotas, setCuotas] = useState<number>(1);

  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cuotasWarning, setCuotasWarning] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<CyberSourcePaymentResult | null>(null);

  // Detect card brand
  const detectedBrand = cybersourceService.detectCardBrand(cardNumber);

  // Reset states on open
  useEffect(() => {
    if (isOpen) {
      setCardNumber('');
      setCardholderName(`${customer.firstName} ${customer.lastName}`.trim());
      setExpiry('');
      setCvv('');
      setCuotas(1);
      setLoading(false);
      setProgressMsg('');
      setErrorMsg(null);
      setCuotasWarning(null);
      setSuccessResult(null);
    }
  }, [isOpen, customer]);

  if (!isOpen) return null;

  // Format Card Number (Spaces every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
    setErrorMsg(null);

    // Revalidar cuotas si ya seleccionó plazo > 1
    if (cuotas > 1) {
      const check = cybersourceService.validateBacCuotasEligibility(raw, cuotas);
      setCuotasWarning(check.eligible ? null : (check.message || null));
    }
  };

  // Format Expiration Date (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setExpiry(raw);
    setErrorMsg(null);
  };

  // Handle Cuotas Change
  const handleCuotasChange = (val: number) => {
    setCuotas(val);
    if (val > 1) {
      const check = cybersourceService.validateBacCuotasEligibility(cardNumber, val);
      setCuotasWarning(check.eligible ? null : (check.message || null));
    } else {
      setCuotasWarning(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanCard = cardNumber.replace(/\D/g, '');
    if (cleanCard.length < 15) {
      setErrorMsg('Ingresa un número de tarjeta válido (15 o 16 dígitos).');
      return;
    }

    const expiryParts = expiry.split('/');
    if (expiryParts.length !== 2 || expiryParts[0].length !== 2 || expiryParts[1].length !== 2) {
      setErrorMsg('Ingresa la fecha de vencimiento en formato MM/AA.');
      return;
    }

    const monthNum = parseInt(expiryParts[0], 10);
    if (monthNum < 1 || monthNum > 12) {
      setErrorMsg('El mes de vencimiento debe estar entre 01 y 12.');
      return;
    }

    if (cvv.length < 3) {
      setErrorMsg('El código de seguridad (CVV) debe tener al menos 3 dígitos.');
      return;
    }

    if (cuotasWarning) {
      setErrorMsg(cuotasWarning);
      return;
    }

    setLoading(true);
    setProgressMsg('Iniciando procesamiento seguro con BAC Credomatic...');

    try {
      const result = await cybersourceService.processPayment({
        amount,
        currency,
        orderCode,
        concept,
        customer: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phoneNumber: customer.phoneNumber
        },
        card: {
          number: cleanCard,
          cardholderName: cardholderName.trim(),
          expirationMonth: expiryParts[0],
          expirationYear: `20${expiryParts[1]}`,
          securityCode: cvv
        },
        cuotas,
        onProgress: (msg) => setProgressMsg(msg)
      });

      setSuccessResult(result);
      setTimeout(() => {
        onSuccess(result);
      }, 1600);
    } catch (err: any) {
      console.error('Error procesando cobro:', err);
      setErrorMsg(err.message || 'La transacción no pudo ser autorizada. Verifica los datos de tu tarjeta o intenta con otra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con branding bancario oficial */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white disabled:opacity-40"
            title="Cerrar ventana"
          >
            <X size={18} />
          </button>

          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
              <ShieldCheck size={22} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">
                Pasarela Oficial BAC Credomatic
              </span>
              <h3 className="text-xl font-black tracking-tight text-white mt-0.5">
                Pago Seguro en Línea
              </h3>
            </div>
          </div>

          <p className="text-xs text-blue-200 font-medium line-clamp-1">
            {concept}
          </p>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-slate-300 font-semibold">Total a Cancelar:</span>
            <span className="text-2xl font-black text-white tracking-tight">
              {currency === 'GTQ' ? 'Q' : '$'}{amount.toLocaleString('es-GT', { minimumFractionDigits: 2 })} {currency}
            </span>
          </div>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 overflow-y-auto space-y-5">
          {successResult ? (
            /* Pantalla de Éxito */
            <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10 border border-emerald-200">
                <CheckCircle2 size={44} />
              </div>
              <div>
                <h4 className="text-2xl font-black text-slate-900 tracking-tight">¡Transacción Aprobada!</h4>
                <p className="text-xs text-slate-550 mt-1 font-medium">
                  El pago fue procesado exitosamente por CyberSource y verificado con 3D Secure.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2 text-xs font-medium text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400">Referencia EBC:</span>
                  <span className="font-mono font-bold text-slate-900">{successResult.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Código de Aprobación:</span>
                  <span className="font-mono font-bold text-emerald-700">{successResult.approvalCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tarjeta:</span>
                  <span className="font-bold text-slate-800">{successResult.brand} •••• {successResult.last4}</span>
                </div>
              </div>

              <p className="text-xs text-emerald-600 font-bold animate-pulse">
                Completando registro oficial...
              </p>
            </div>
          ) : (
            /* Formulario de Tarjeta */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-2.5 text-rose-800 text-xs font-semibold animate-in fade-in duration-200">
                  <AlertCircle size={18} className="shrink-0 text-rose-600 mt-0.5" />
                  <div className="flex-1">{errorMsg}</div>
                </div>
              )}

              {/* Plazo / Cuotas BAC */}
              {allowCuotas && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center justify-between">
                    <span>Modalidad de Pago</span>
                    <span className="text-red-700 font-black text-[10px]">Programa Cuotas BAC</span>
                  </label>
                  <select
                    value={cuotas}
                    onChange={(e) => handleCuotasChange(Number(e.target.value))}
                    disabled={loading}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all cursor-pointer"
                  >
                    <option value={1}>1 Pago de Contado (Q{amount.toLocaleString('es-GT', { minimumFractionDigits: 2 })})</option>
                    <option value={3}>3 Cuotas BAC de Q{(amount / 3).toFixed(2)}/mes</option>
                    <option value={6}>6 Cuotas BAC de Q{(amount / 6).toFixed(2)}/mes</option>
                    <option value={10}>10 Cuotas BAC de Q{(amount / 10).toFixed(2)}/mes</option>
                    <option value={12}>12 Cuotas BAC de Q{(amount / 12).toFixed(2)}/mes</option>
                  </select>

                  {cuotasWarning && (
                    <p className="text-[11px] font-bold text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 leading-tight">
                      ⚠️ {cuotasWarning}
                    </p>
                  )}
                </div>
              )}

              {/* Número de Tarjeta con Detector de Marca */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                    Número de Tarjeta
                  </label>
                  <div className="flex items-center space-x-1.5">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                      detectedBrand.brand === 'Visa' 
                        ? 'bg-blue-900 text-white border-blue-900 shadow-sm' 
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}>
                      VISA
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                      detectedBrand.brand === 'MasterCard' 
                        ? 'bg-red-600 text-white border-red-600 shadow-sm' 
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}>
                      MC
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                      detectedBrand.brand === 'American Express' 
                        ? 'bg-cyan-700 text-white border-cyan-700 shadow-sm' 
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}>
                      AMEX
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <CreditCard size={18} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    disabled={loading}
                    placeholder="4000 0000 0000 0000"
                    required
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all placeholder:text-slate-350"
                  />
                </div>
              </div>

              {/* Nombre en la Tarjeta */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                  Nombre del Tarjetahabiente (como aparece en el plástico)
                </label>
                <input
                  type="text"
                  autoComplete="cc-name"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                  disabled={loading}
                  placeholder="JUAN PEREZ"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 uppercase focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all placeholder:text-slate-350"
                />
              </div>

              {/* Vencimiento y CVV */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                    Vencimiento (MM/AA)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    value={expiry}
                    onChange={handleExpiryChange}
                    disabled={loading}
                    placeholder="12/28"
                    maxLength={5}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 text-center focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all placeholder:text-slate-350"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                      CVV / CVC
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">3 o 4 dígitos</span>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      disabled={loading}
                      placeholder="•••"
                      maxLength={4}
                      required
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 text-center focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all placeholder:text-slate-350"
                    />
                  </div>
                </div>
              </div>

              {/* Badges de Seguridad */}
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center justify-between text-[11px] text-blue-900 font-semibold">
                <div className="flex items-center space-x-2">
                  <ShieldCheck size={18} className="text-blue-700 shrink-0" />
                  <span>Autenticación 3D Secure 2.0 y encriptación bancaria PCI-DSS</span>
                </div>
              </div>

              {/* Botón de Pagar */}
              <button
                type="submit"
                disabled={loading || !!cuotasWarning}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white font-black text-sm rounded-2xl transition-all shadow-lg shadow-blue-950/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-yellow-400" />
                    <span>{progressMsg || 'Procesando pago seguro...'}</span>
                  </>
                ) : (
                  <>
                    <Lock size={16} className="text-yellow-400" />
                    <span>
                      Pagar {currency === 'GTQ' ? 'Q' : '$'}{amount.toLocaleString('es-GT', { minimumFractionDigits: 2 })} con BAC
                    </span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>Procesado por CyberSource (Visa Solution)</span>
          <span className="font-bold text-slate-700">Club de Leones Quetzaltenango</span>
        </div>
      </div>
    </div>
  );
};

