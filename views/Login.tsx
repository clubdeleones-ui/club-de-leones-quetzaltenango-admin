
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Briefcase, ArrowRight, Loader2, QrCode, AlertCircle, Eye, EyeOff, Mail, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const [loginMethod, setLoginMethod] = useState<'cargo' | 'correo'>('cargo');
  const [puesto, setPuesto] = useState('');
  const [selectedSocioId, setSelectedSocioId] = useState('');
  const [correoOrCodigo, setCorreoOrCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isQrLoggingIn, setIsQrLoggingIn] = useState(false);
  const [qrLoginError, setQrLoginError] = useState<string | null>(null);
  const [availablePuestos, setAvailablePuestos] = useState<string[]>(PUESTOS_LOGIN);
  const [allSocios, setAllSocios] = useState<Socio[]>([]);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchPuestos = async () => {
      try {
        const list = await firebaseService.getSocios();
        setAllSocios(list);
        
        let rolesOrderMap: Record<string, number> = {};
        try {
          const storedConfig = localStorage.getItem('club_leones_roles_config');
          if (storedConfig) {
            const parsed = JSON.parse(storedConfig);
            parsed.forEach((r: any, idx: number) => {
              rolesOrderMap[r.id] = r.orden !== undefined ? r.orden : idx;
            });
          }
        } catch (e) {
          console.error("Error parsing roles config in Login.tsx:", e);
        }

        const uniquePuestosWithRole = list.reduce((acc: { puesto: string, rol: string }[], socio) => {
          if (socio.puesto && !acc.some(item => item.puesto === socio.puesto)) {
            acc.push({ puesto: socio.puesto, rol: socio.rol || 'SOCIO' });
          }
          return acc;
        }, []);

        if (uniquePuestosWithRole.length > 0) {
          uniquePuestosWithRole.sort((a, b) => {
            const orderA = rolesOrderMap[a.rol] ?? 999;
            const orderB = rolesOrderMap[b.rol] ?? 999;
            if (orderA !== orderB) {
              return orderA - orderB;
            }
            return a.puesto.localeCompare(b.puesto);
          });
          setAvailablePuestos(uniquePuestosWithRole.map(item => item.puesto));
        }
      } catch (err) {
        console.error("Error loading dynamic login positions:", err);
      }
    };
    fetchPuestos();
  }, []);

  // Socios que coinciden con el puesto seleccionado
  const matchingSociosForPuesto = React.useMemo(() => {
    if (!puesto) return [];
    const selPuesto = puesto.toLowerCase().trim();
    return allSocios.filter(s => {
      const sPuesto = (s.puesto || '').toLowerCase().trim();
      return sPuesto === selPuesto || sPuesto.startsWith(selPuesto) || selPuesto.startsWith(sPuesto);
    });
  }, [allSocios, puesto]);

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
    let sociosList: Socio[] = allSocios;
    try {
      sociosList = await firebaseService.getSocios();
      setAllSocios(sociosList);
    } catch (err) {
      console.error("Error fetching socios on credentials login:", err);
    }

    let user: Socio | undefined;

    if (loginMethod === 'correo') {
      const q = correoOrCodigo.trim().toLowerCase();
      if (!q) {
        setError('Por favor ingrese su correo electrónico o código de socio.');
        return;
      }
      user = sociosList.find(s => 
        (s.correo && s.correo.toLowerCase() === q) || 
        (s.codigoSocio && s.codigoSocio.toLowerCase() === q) ||
        (s.id === q)
      );
      if (!user) {
        setError('No se encontró ningún socio con el correo o código ingresado.');
        return;
      }
    } else {
      if (!puesto) {
        setError('Por favor seleccione un cargo.');
        return;
      }
      const selPuesto = puesto.toLowerCase().trim();
      const matching = sociosList.filter(s => {
        const sPuesto = (s.puesto || '').toLowerCase().trim();
        return sPuesto === selPuesto || sPuesto.startsWith(selPuesto) || selPuesto.startsWith(sPuesto);
      });

      if (matching.length === 0) {
        setError('No se encontró ningún socio con el cargo seleccionado.');
        return;
      }

      if (matching.length > 1) {
        if (!selectedSocioId) {
          setError('Hay varios socios en este cargo. Por favor seleccione su nombre específico.');
          return;
        }
        user = matching.find(s => s.id === selectedSocioId);
      } else {
        user = matching[0];
      }
    }

    const isSuperAdminPuesto = 
      user?.puesto === 'Presidente' || 
      user?.puesto === 'Administrador Principal' ||
      user?.rol === UserRole.SUPER_ADMIN;

    const expectedPassword = user?.password || (isSuperAdminPuesto ? 'Nuevadirectiva2627!' : '123456');
    const isCorrectPassword = password === expectedPassword;

    if (user && isCorrectPassword) {
      onLogin(user);
      
      let isAdministrative = false;
      try {
        const saved = localStorage.getItem('club_leones_roles_config');
        if (saved) {
          const config = JSON.parse(saved);
          const roleDetails = config.find((r: any) => r.id === user.rol);
          if (roleDetails) {
            isAdministrative = roleDetails.allowedTabs && roleDetails.allowedTabs.length > 0;
          }
        }
      } catch (e) {
        console.error("Error reading roles config on login:", e);
      }

      if (!isAdministrative) {
        isAdministrative = 
          user.rol === UserRole.SUPER_ADMIN || 
          user.rol === UserRole.TESORERO || 
          user.rol === UserRole.SECRETARIO || 
          user.rol === UserRole.ASESOR_SERVICIOS ||
          user.rol === UserRole.PRESIDENTE_AFILIACION;
      }

      if (isAdministrative) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(
        isSuperAdminPuesto 
          ? 'Contraseña incorrecta para el cargo administrativo principal.' 
          : 'Contraseña incorrecta. Por favor verifica tus credenciales.'
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
    <div className="max-w-md mx-auto mt-12 mb-20 bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl p-8 sm:p-10 border border-white/20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-900 via-yellow-500 to-blue-900" />

      <div className="text-center mb-8">
        <div className="relative inline-block mb-4">
          <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-20 rounded-full" />
          <img
            src="images/logo.png"
            alt="Club Logo"
            className="relative w-20 h-20 mx-auto object-contain drop-shadow-lg"
          />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-blue-900 tracking-tight">Acceso Socios</h2>
        <p className="text-sm text-slate-550 mt-1 font-medium">Club de Leones Quetzaltenango</p>

        {/* Tab switch between Cargo and Correo */}
        <div className="flex bg-slate-100 p-1 rounded-xl mt-6 border border-slate-200">
          <button
            type="button"
            onClick={() => { setLoginMethod('cargo'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              loginMethod === 'cargo'
                ? 'bg-blue-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase size={14} />
            <span>Por Cargo</span>
          </button>
          <button
            type="button"
            onClick={() => { setLoginMethod('correo'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              loginMethod === 'correo'
                ? 'bg-blue-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail size={14} />
            <span>Por Correo o Código</span>
          </button>
        </div>
      </div>

      {qrLoginError && (
        <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-xs mb-6 border border-red-100 font-semibold flex items-start space-x-2 animate-in fade-in">
          <AlertCircle className="flex-shrink-0 mt-0.5 text-red-500" size={14} />
          <span>{qrLoginError}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-6 border border-red-100 flex items-start space-x-2">
          <AlertCircle className="flex-shrink-0 mt-0.5 text-red-500" size={15} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {loginMethod === 'cargo' ? (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Cargo Administrativo</label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-3 text-slate-400" size={18} />
                <select
                  value={puesto}
                  onChange={(e) => {
                    setPuesto(e.target.value);
                    setSelectedSocioId('');
                  }}
                  className="w-full pl-11 pr-10 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white text-slate-800 text-sm font-medium appearance-none cursor-pointer"
                  required
                >
                  <option value="" disabled>Seleccione su cargo...</option>
                  {availablePuestos.map((p) => (
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

            {/* Si más de un socio tiene el mismo cargo (ej. Socio Regular), permitir seleccionar el nombre del socio */}
            {matchingSociosForPuesto.length > 1 && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Seleccione su Nombre
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 text-slate-400" size={18} />
                  <select
                    value={selectedSocioId}
                    onChange={(e) => setSelectedSocioId(e.target.value)}
                    className="w-full pl-11 pr-10 py-2.5 border border-blue-200 bg-blue-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-800 text-sm font-medium appearance-none cursor-pointer"
                    required
                  >
                    <option value="" disabled>¿Quién eres?</option>
                    {matchingSociosForPuesto.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} {s.codigoSocio ? `(${s.codigoSocio})` : ''}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <span className="text-xs">▼</span>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Correo Electrónico o Código
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 text-slate-400" size={18} />
              <input
                type="text"
                value={correoOrCodigo}
                onChange={(e) => setCorreoOrCodigo(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm font-medium text-slate-800"
                placeholder="ej. socio@leonesxela.com o CLQ-2026-001"
                required
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 text-slate-400" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-12 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3 p-0.5 text-slate-400 hover:text-blue-900 transition-colors bg-white rounded-full focus:outline-none"
              title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3.5 text-sm rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98] flex items-center justify-center space-x-2 mt-2"
        >
          <span>Ingresar ahora</span>
          <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
};

export default Login;
