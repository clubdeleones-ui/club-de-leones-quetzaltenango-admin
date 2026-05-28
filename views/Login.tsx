
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, Loader2, QrCode, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { MOCK_SOCIOS } from '../constants';
import { Socio, UserRole } from '../types';
import { firebaseService } from '../services/firebaseService';

interface LoginProps {
  onLogin: (user: any, accessToken?: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('Google Login Success:', tokenResponse);
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`
          }
        });
        const profile = await res.json();
        console.log('Google profile details:', profile);

        // Fetch latest socios list from Firestore to get updated details (like photos)
        let sociosList: Socio[] = [];
        try {
          sociosList = await firebaseService.getSocios();
        } catch (e) {
          console.error("Error fetching socios on Google Login:", e);
        }

        let user = sociosList.find(s => s.correo.toLowerCase() === profile.email?.toLowerCase());
        if (!user) {
          user = MOCK_SOCIOS.find(s => s.correo.toLowerCase() === profile.email?.toLowerCase());
        }
        
        if (!user && profile.email?.toLowerCase() === 'clubdeleonesquetzaltenango@gmail.com') {
          user = {
            id: '8', // Sync with constants ID 8 for main admin
            nombre: 'Club de Leones Quetzaltenango',
            correo: 'clubdeleonesquetzaltenango@gmail.com',
            rol: UserRole.SUPER_ADMIN,
            puesto: 'Administrador Principal',
            estadoCuotas: 'Al día',
            montoPendiente: 0,
            foto: profile.picture || 'https://picsum.photos/seed/admin/200/200',
            fechaIngreso: '2026-01-01'
          };
        }

        if (!user) {
          user = {
            id: 'google-user-' + profile.sub,
            nombre: profile.name || 'Invitado Google',
            correo: profile.email || '',
            rol: UserRole.GUEST,
            estadoCuotas: 'Al día',
            montoPendiente: 0,
            foto: profile.picture || 'https://picsum.photos/seed/google/200/200',
            fechaIngreso: new Date().toISOString().split('T')[0]
          };
        }

        onLogin(user, tokenResponse.access_token);
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
      } catch (err) {
        console.error('Error fetching Google profile info:', err);
        onLogin(MOCK_SOCIOS[0], tokenResponse.access_token);
        navigate('/dashboard');
      }
    },
    scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/documents.readonly'
  });

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

    let user = sociosList.find(s => s.correo.toLowerCase() === email.toLowerCase());
    if (!user) {
      user = MOCK_SOCIOS.find(s => s.correo.toLowerCase() === email.toLowerCase());
    }
    
    const isCorrectPassword = 
      (email.toLowerCase() === 'clubdeleonesquetzaltenango@gmail.com' && password === 'Nuevadirectiva2627!') ||
      (email.toLowerCase() !== 'clubdeleonesquetzaltenango@gmail.com' && password === '123456');

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
        email.toLowerCase() === 'clubdeleonesquetzaltenango@gmail.com' 
          ? 'Contraseña incorrecta para Super Admin.' 
          : 'Credenciales inválidas. Use pass: 123456 para otros socios.'
      );
    }
  };

  const handleQuickLogin = async (email: string) => {
    let sociosList: Socio[] = [];
    try {
      sociosList = await firebaseService.getSocios();
    } catch (err) {
      console.error("Error fetching socios on quick login:", err);
    }

    let user = sociosList.find(s => s.correo.toLowerCase() === email.toLowerCase());
    if (!user) {
      user = MOCK_SOCIOS.find(s => s.correo.toLowerCase() === email.toLowerCase());
    }

    if (user) {
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
          <label className="block text-sm font-medium text-slate-700 mb-1">Correo Institucional</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="socio@leonesxela.com"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3.5 text-base rounded-2xl transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98] flex items-center justify-center space-x-2"
        >
          <span>Ingresar ahora</span>
          <ArrowRight size={18} />
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-100"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">O accede con</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loginWithGoogle()}
          className="w-full bg-white border border-slate-200 py-3 rounded-2xl font-semibold text-sm text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center space-x-3 active:scale-[0.98] shadow-sm"
        >
          <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-5 h-5" />
          <span>Cuenta del Club (Workspace)</span>
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
        <p className="text-center text-sm font-semibold text-slate-400 uppercase tracking-widest">Accesos Rápidos de Prueba</p>
        
        {/* Desplegable para Directiva / Administradores */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider">Junta Directiva / Gestión</label>
          <div className="relative">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleQuickLogin(e.target.value);
                  e.target.value = ''; // Reset select
                }
              }}
              defaultValue=""
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer appearance-none"
            >
              <option value="" disabled>Seleccione un cargo administrativo...</option>
              <option value="clubdeleonesquetzaltenango@gmail.com">🦁 Presidente (Admin Principal)</option>
              <option value="innovandoxela@gmail.com">🦁 Edwin Pacheco (Presidente 26-27)</option>
              <option value="oscargarcia@leonesxela.com">💰 Oscar Garcia (Tesorero)</option>
              <option value="ubirod3@gmail.com">📝 Flor Rodríguez (Secretario)</option>
              <option value="mariancruzdl@gmail.com">🤝 Mariantonia Cruz (Mercadotecnia)</option>
              <option value="contactomsixela@gmail.com">📋 Rolando Mérida (Afiliación)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 font-bold text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* Botones separados para Socio y Donante */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => handleQuickLogin('ricardo.solorzano.g@gmail.com')}
            className="p-3.5 rounded-2xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-700 font-bold text-center transition-all flex flex-col items-center justify-center space-y-1 shadow-sm active:scale-95"
          >
            <span className="text-lg">🦁</span>
            <span className="text-sm">Socio Regular</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('donante@leonesxela.com')}
            className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 font-bold text-center transition-all flex flex-col items-center justify-center space-y-1 shadow-sm active:scale-95"
          >
            <span className="text-lg">❤️</span>
            <span className="text-sm">Donante</span>
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-2 leading-relaxed">
          O escribe las credenciales manualmente con contraseña: <br />
          🗝️ Super Admin: <span className="font-mono font-bold text-slate-500">Nuevadirectiva2627!</span> | Otros: <span className="font-mono font-bold text-slate-500">123456</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
