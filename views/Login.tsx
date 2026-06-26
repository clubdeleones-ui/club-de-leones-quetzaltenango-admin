
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Briefcase, ArrowRight, Loader2, QrCode, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MOCK_SOCIOS } from '../constants';
import { Socio, UserRole } from '../types';
import { firebaseService } from '../services/firebaseService';

const PUESTOS_LOGIN = [
  'Presidente',
  'Primer Vicepresidente',
  'Segundo Vicepresidente',
  'Secretario',
  'Tesorero',
  'Asesor de Servicio',
  'Asesor de Mercadotecnia',
  'Presidente de Afiliación',
  'Vocal 1',
  'Vocal 2',
  'Socio Regular',
  'Club Leo',
  'Donante',
  'Administrador Principal'
];

interface LoginProps {
  onLogin: (user: any, accessToken?: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [puesto, setPuesto] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isQrLoggingIn, setIsQrLoggingIn] = useState(false);
  const [qrLoginError, setQrLoginError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hashQuery = window.location.hash.split('?')[1];
    const searchParams = new URLSearchParams(hashQuery || window.location.search);
    const qrToken = searchParams.get('qr_token');

    if (qrToken) {
      const loginWithQrToken = async () => {
        setIsQrLoggingIn(true);
        setQrLoginError(null);
        try {
          const list = await firebaseService.getSocios();
          const matchingSocio = list.find(s => s.qrToken === qrToken);

          if (matchingSocio) {
            onLogin(matchingSocio);
            const isAdministrative = 
              matchingSocio.rol === UserRole.SUPER_ADMIN || 
              matchingSocio.rol === UserRole.TESORERO || 
              matchingSocio.rol === UserRole.SECRETARIO || 
              matchingSocio.rol === UserRole.ASESOR_SERVICIOS ||
              matchingSocio.rol === UserRole.PRESIDENTE_AFILIACION;
            if (isAdministrative) {
              navigate('/admin');
            } else {
              navigate('/dashboard');
            }
          } else {
            setQrLoginError("Código QR inválido, expirado o revocado por el administrador.");
          }
        } catch (err) {
          console.error("Error logging in via QR token:", err);
          setQrLoginError("Error de conexión al procesar el inicio de sesión QR.");
        } finally {
          setIsQrLoggingIn(false);
        }
      };
      loginWithQrToken();
    }
  }, [location.search, location.hash]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Fetch latest socios list from Firestore to get updated details
    let sociosList: Socio[] = [];
    try {
      sociosList = await firebaseService.getSocios();
    } catch (err) {
      console.error("Error fetching socios on credentials login:", err);
    }

    // Find user matching selected position
    let user = sociosList.find(s => {
      const sPuesto = (s.puesto || '').toLowerCase().trim();
      const selPuesto = puesto.toLowerCase().trim();
      return sPuesto === selPuesto || sPuesto.startsWith(selPuesto) || selPuesto.startsWith(sPuesto);
    });

    if (!user) {
      user = MOCK_SOCIOS.find(s => {
        const sPuesto = (s.puesto || '').toLowerCase().trim();
        const selPuesto = puesto.toLowerCase().trim();
        return sPuesto === selPuesto || sPuesto.startsWith(selPuesto) || selPuesto.startsWith(sPuesto);
      });
    }

    // Construct a fallback mock user if not found in db or MOCK_SOCIOS
    if (!user && puesto) {
      let role = UserRole.SOCIO;
      if (puesto === 'Donante') {
        role = UserRole.DONANTE;
      } else if (puesto === 'Club Leo') {
        role = UserRole.SOCIO;
      } else if (puesto === 'Presidente' || puesto === 'Administrador Principal') {
        role = UserRole.SUPER_ADMIN;
      } else if (puesto === 'Secretario') {
        role = UserRole.SECRETARIO;
      } else if (puesto === 'Tesorero') {
        role = UserRole.TESORERO;
      } else if (puesto === 'Asesor de Servicio') {
        role = UserRole.ASESOR_SERVICIOS;
      } else if (puesto === 'Presidente de Afiliación') {
        role = UserRole.PRESIDENTE_AFILIACION;
      }

      user = {
        id: `login-fallback-${puesto.toLowerCase().replace(/\s+/g, '-')}`,
        nombre: `Usuario ${puesto}`,
        correo: `${puesto.toLowerCase().replace(/\s+/g, '')}@leonesxela.com`,
        rol: role,
        puesto: puesto,
        estadoCuotas: 'Al día',
        montoPendiente: 0,
        foto: `https://picsum.photos/seed/${puesto}/200/200`,
        fechaIngreso: new Date().toISOString().split('T')[0],
        estatus: 'Active',
        club: 'QUETZALTENANGO'
      };
    }

    const isSuperAdminPuesto = 
      puesto === 'Presidente' || 
      puesto === 'Administrador Principal';

    const isCorrectPassword = 
      (isSuperAdminPuesto && password === 'Nuevadirectiva2627!') ||
      (!isSuperAdminPuesto && password === '123456');

    if (user && isCorrectPassword) {
      onLogin(user);
      const isAdministrative = 
        user.rol === UserRole.SUPER_ADMIN || 
        user.rol === UserRole.TESORERO || 
        user.rol === UserRole.SECRETARIO || 
        user.rol === UserRole.ASESOR_SERVICIOS ||
        user.rol === UserRole.PRESIDENTE_AFILIACION;
      if (isAdministrative) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(
        isSuperAdminPuesto 
          ? 'Contraseña incorrecta para el cargo administrativo principal.' 
          : 'Contraseña incorrecta para el cargo seleccionado.'
      );
    }
  };

  if (isQrLoggingIn) {
    return (
      <div className="max-w-md mx-auto mt-12 mb-20 bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl p-10 border border-white/20 relative overflow-hidden text-center flex flex-col items-center justify-center py-20 space-y-6">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-900 via-yellow-500 to-blue-900" />
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-20 rounded-full" />
          <QrCode className="relative text-blue-900 animate-pulse" size={64} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-blue-900">Autenticación por QR</h2>
          <p className="text-sm text-slate-550 font-medium">Validando tus credenciales con Firestore...</p>
        </div>
        <Loader2 className="animate-spin text-blue-900 mt-4" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12 mb-20 bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl p-10 border border-white/20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-900 via-yellow-500 to-blue-900" />

      <div className="text-center mb-10">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-20 rounded-full" />
          <img
            src="images/logo.png"
            alt="Club Logo"
            className="relative w-24 h-24 mx-auto object-contain drop-shadow-lg"
          />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-blue-900 tracking-tight">Acceso Socios</h2>
        <p className="text-sm text-slate-550 mt-1.5 font-medium">Panel Administrativo</p>
      </div>

      {qrLoginError && (
        <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-xs mb-6 border border-red-100 font-semibold flex items-start space-x-2 animate-in fade-in">
          <AlertCircle className="flex-shrink-0 mt-0.5 text-red-500" size={14} />
          <span>{qrLoginError}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cargo Administrativo</label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-3 text-slate-400" size={18} />
            <select
              value={puesto}
              onChange={(e) => setPuesto(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white text-slate-700 font-medium appearance-none cursor-pointer"
              required
            >
              <option value="" disabled>Seleccione su cargo...</option>
              {PUESTOS_LOGIN.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <span className="text-xs">▼</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-blue-900 transition-colors bg-white rounded-full focus:outline-none"
              title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3.5 text-base rounded-2xl transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98] flex items-center justify-center space-x-2"
        >
          <span>Ingresar ahora</span>
          <ArrowRight size={18} />
        </button>
      </form>
    </div>
  );
};

export default Login;
