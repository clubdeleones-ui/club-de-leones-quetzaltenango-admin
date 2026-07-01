import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  LogIn, 
  LogOut, 
  User, 
  FileText, 
  Calendar, 
  Image, 
  ShieldCheck, 
  Home,
  Users,
  ChevronDown,
  Info,
  Gift,
  DollarSign,
  Clock,
  HeartHandshake,
  Facebook,
  Instagram,
  Award
} from 'lucide-react';
import { AuthState, UserRole } from '../types';
import { googleService } from '../services/googleService';

interface LayoutProps {
  children: React.ReactNode;
  auth: AuthState;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, auth, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'public' | 'private'>('public');
  const navigate = useNavigate();
  const location = useLocation();
  const isEvaluationView = location.pathname.startsWith('/ficha-evaluacion') || location.pathname === '/evaluacion-compartida';
  const isPublicRoute = [
    '/',
    '/actividades',
    '/galeria',
    '/historia',
    '/convencion',
    '/socios',
    '/solicitudes',
    '/donar',
    '/proponer-socio'
  ].includes(location.pathname);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset mobile menu tab to public when mobile drawer is closed
  useEffect(() => {
    if (!isOpen) {
      setMobileTab('public');
    }
  }, [isOpen]);

  // Initialize Gapi client
  useEffect(() => {
    const initGapi = async () => {
      try {
        await googleService.initClient();
        if (auth.accessToken) {
          googleService.setAccessToken(auth.accessToken);
        }
      } catch (error) {
        console.error('Failed to init GAPI:', error);
      }
    };
    initGapi();
  }, [auth.accessToken]);

  // Click outside to close user dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navItems = [
    { label: 'Inicio', path: '/', icon: Home, public: true },
    { label: 'Actividades', path: '/actividades', icon: Calendar, public: true },
    { label: 'Convención', path: '/convencion', icon: Award, public: true },
    { label: 'Galería', path: '/galeria', icon: Image, public: true },
    { label: 'Historia', path: '/historia', icon: Clock, public: true },
    { label: 'Solicitudes', path: '/solicitudes', icon: FileText, public: true },
  ];

  const getProtectedItems = () => {
    if (!auth.user) return [];
    
    const items = [
      { label: 'Mi Panel', path: '/dashboard', icon: User },
      { label: 'Directorio', path: '/socios', icon: Users },
      { label: 'Estatutos', path: '/estatutos', icon: ShieldCheck },
      { label: 'Estrategia Retención', path: '/retencion', icon: HeartHandshake }
    ];
    
    if (auth.user.rol !== UserRole.DONANTE) {
      items.push({ label: 'Actas', path: '/actas', icon: FileText });
    }
    
    const isAdministrative = 
      auth.user.rol === UserRole.SUPER_ADMIN || 
      auth.user.rol === UserRole.TESORERO || 
      auth.user.rol === UserRole.SECRETARIO || 
      auth.user.rol === UserRole.ASESOR_SERVICIOS ||
      auth.user.rol === UserRole.PRESIDENTE_AFILIACION;
      
    if (isAdministrative) {
      items.push({ label: 'Gestión', path: '/admin', icon: ShieldCheck });
    }
    
    return items;
  };

  const protectedItems = getProtectedItems();

  const handleNav = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      {/* Main Premium Navbar */}
      <nav className="bg-blue-900/95 backdrop-blur-md text-white shadow-xl sticky top-0 z-50 border-b border-blue-800/40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            {/* Logo Section */}
            <div className="flex items-center space-x-4 cursor-pointer group" onClick={() => navigate('/')}>
              <div className="bg-white p-1 rounded-2xl overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 shadow-lg">
                <img src="images/logo.png" alt="Logo" className="w-11 h-11 object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight leading-none">Club de Leones</span>
                <span className="text-[11px] font-black text-yellow-400 uppercase tracking-widest mt-1">Quetzaltenango</span>
              </div>
            </div>
             {/* Desktop Nav Items */}
             {!isEvaluationView && (
               <div className="hidden md:flex items-center space-x-2">
                 {navItems.map((item) => {
                   const active = location.pathname === item.path;
                   return (
                     <Link
                       key={item.path}
                       to={item.path}
                       className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center space-x-2 border border-transparent ${
                         active 
                           ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20 shadow-sm' 
                           : 'text-slate-200 hover:bg-white/5 hover:text-white'
                       }`}
                     >
                       <span>{item.label}</span>
                     </Link>
                   );
                 })}

                 <Link
                   to="/donar"
                   className="ml-3 px-4 py-2.5 rounded-xl text-sm font-black transition-all duration-305 flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-blue-955 hover:from-yellow-400 hover:to-amber-400 shadow-lg shadow-yellow-500/10 hover:scale-105 active:scale-95"
                 >
                   <Gift size={16} />
                   <span>Donar</span>
                 </Link>

                 {/* Authentication Actions / Dropdown */}
                 {auth.isAuthenticated ? (
                   <>
                     <div className="h-8 w-px bg-blue-850/60 mx-4" />
                     
                     {/* User Dropdown */}
                     <div className="relative" ref={dropdownRef}>
                       <button
                         onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                         className="flex items-center space-x-2 focus:outline-none hover:bg-blue-800/50 p-1.5 rounded-2xl transition-all duration-300 border border-transparent hover:border-blue-750"
                       >
                         <img
                           src={auth.user?.foto || 'https://picsum.photos/seed/' + auth.user?.id + '/100/100'}
                           alt={auth.user?.nombre}
                           className="w-10 h-10 rounded-xl object-cover border border-slate-300/30"
                         />
                         <ChevronDown size={16} className={`text-slate-300 transition-transform duration-300 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                       </button>

                       {/* Dropdown Menu Floating Card */}
                       {isUserDropdownOpen && (
                         <div className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-md text-slate-800 rounded-[1.75rem] shadow-2xl border border-slate-100/90 py-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                           {/* Member Details */}
                           <div className="px-5 py-3.5 mx-2 mb-2 bg-blue-50/50 rounded-2xl border border-blue-100/40">
                             <p className="font-black text-slate-850 text-base truncate leading-tight">{auth.user?.nombre}</p>
                             <p className="text-[10px] text-blue-800 font-extrabold uppercase tracking-wider mt-1 inline-block bg-blue-100/80 px-2.5 py-0.5 rounded-md">
                               {auth.user?.puesto || 'Socio Regular'}
                             </p>
                           </div>
                           
                           {/* Protected links */}
                           <div className="py-1 px-2 space-y-1">
                             {protectedItems.map((item) => {
                               const Icon = item.icon;
                               const isLinkActive = location.pathname === item.path;
                               return (
                                 <Link
                                   key={item.path}
                                   to={item.path}
                                   onClick={() => setIsUserDropdownOpen(false)}
                                   className={`flex items-center space-x-3 px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 group ${
                                     isLinkActive 
                                       ? 'bg-blue-900 text-white shadow-md shadow-blue-900/10' 
                                       : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                   }`}
                                 >
                                   <Icon size={18} className={`transition-transform duration-200 group-hover:scale-110 ${isLinkActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-900'}`} />
                                   <span>{item.label}</span>
                                 </Link>
                               );
                             })}
                           </div>

                           {/* Logout action */}
                           <div className="border-t border-slate-100 pt-2 px-2">
                             <button
                               onClick={() => {
                                 setIsUserDropdownOpen(false);
                                 onLogout();
                               }}
                               className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-bold text-red-650 hover:bg-red-50 rounded-xl transition-all duration-200 group"
                             >
                               <LogOut size={18} className="transition-transform duration-200 group-hover:-translate-x-0.5 text-red-400 group-hover:text-red-650" />
                               <span>Cerrar Sesión</span>
                             </button>
                           </div>
                         </div>
                       )}
                     </div>
                   </>
                 ) : (
                   <button
                     onClick={() => navigate('/login')}
                     className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-blue-955 px-5 py-2.5 rounded-xl font-black transition-all ml-4 shadow-lg shadow-yellow-500/10 hover:-translate-y-0.5"
                   >
                     <LogIn size={18} />
                     <span>Acceso Socios</span>
                   </button>
                 )}
               </div>
             )}

            {/* Mobile menu button */}
            {!isEvaluationView && (
              <div className="md:hidden flex items-center">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="inline-flex items-center justify-center p-2.5 rounded-xl hover:bg-blue-800 focus:outline-none transition-colors border border-transparent hover:border-blue-750"
                >
                  {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {!isEvaluationView && isOpen && (
          <div className="md:hidden bg-blue-900 border-t border-blue-800 px-4 py-5 space-y-4 animate-in slide-in-from-top duration-300">
            {/* Segmented Tab Control */}
            <div className="bg-blue-950/60 p-1.5 rounded-2xl flex border border-blue-800/40">
              <button
                onClick={() => setMobileTab('public')}
                className={`flex-1 py-2.5 text-center text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${
                  mobileTab === 'public'
                    ? 'bg-yellow-500 text-blue-955 shadow-md font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Menú
              </button>
              <button
                onClick={() => setMobileTab('private')}
                className={`flex-1 py-2.5 text-center text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center space-x-1.5 ${
                  mobileTab === 'private'
                    ? 'bg-yellow-500 text-blue-955 shadow-md font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>Mi Cuenta</span>
                {auth.isAuthenticated && (
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                )}
              </button>
            </div>

            {/* Public Links (General Tab) */}
            {mobileTab === 'public' && (
              <div className="space-y-1 animate-in fade-in duration-200">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNav(item.path)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-base font-bold transition-all ${
                      location.pathname === item.path 
                        ? 'bg-blue-800 text-yellow-400' 
                        : 'text-slate-200 hover:bg-blue-850'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
                <button
                  onClick={() => handleNav('/donar')}
                  className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-left text-base font-black transition-all bg-gradient-to-r from-yellow-500 to-amber-500 text-blue-955 hover:from-yellow-450 hover:to-amber-450 mt-3 shadow-lg shadow-yellow-500/10"
                >
                  <Gift size={18} />
                  <span>Donar</span>
                </button>
              </div>
            )}

            {/* Private Links / Profile (Mi Cuenta Tab) */}
            {mobileTab === 'private' && (
              <div className="animate-in fade-in duration-200 space-y-4">
                {auth.isAuthenticated ? (
                  <div className="space-y-4">
                    {/* Profile card mobile */}
                    <div className="flex items-center space-x-4 px-4 py-3 bg-blue-850/40 rounded-2xl border border-blue-850/70">
                      <img 
                        src={auth.user?.foto || 'https://picsum.photos/seed/' + auth.user?.id + '/100/100'} 
                        alt={auth.user?.nombre} 
                        className="w-12 h-12 rounded-xl object-cover border border-blue-800"
                      />
                      <div className="min-w-0 flex-grow">
                        <p className="font-extrabold text-white text-base truncate leading-snug">{auth.user?.nombre}</p>
                        <p className="text-xs text-yellow-400 font-bold uppercase tracking-wider mt-0.5 truncate">{auth.user?.puesto || 'Socio'}</p>
                      </div>
                    </div>

                    {/* Sub links */}
                    <div className="space-y-1">
                      {protectedItems.map((item) => {
                        const Icon = item.icon;
                        const isLinkActive = location.pathname === item.path;
                        return (
                          <button
                            key={item.path}
                            onClick={() => handleNav(item.path)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-base font-bold transition-all ${
                              isLinkActive 
                                ? 'bg-blue-800 text-yellow-400' 
                                : 'text-slate-200 hover:bg-blue-850'
                            }`}
                          >
                            <Icon size={18} className={isLinkActive ? 'text-yellow-400' : 'text-slate-400'} />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Logout Button */}
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-left text-base font-bold text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                    >
                      <LogOut size={18} />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                ) : (
                  /* Guest User Teaser Card */
                  <div className="bg-blue-850/30 border border-blue-800/60 p-5 rounded-2xl space-y-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-800/50 flex items-center justify-center mx-auto text-yellow-400">
                      <User size={24} />
                    </div>
                    <div className="space-y-1">
                      <p className="font-extrabold text-white text-base">Área de Socios</p>
                      <p className="text-xs text-slate-350 leading-relaxed">
                        Ingresa a tu cuenta de socio para acceder a actas oficiales, estatutos de la asociación, directorio privado y funciones administrativas del Club.
                      </p>
                    </div>
                    <button
                      onClick={() => handleNav('/login')}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-sm font-black bg-yellow-500 text-blue-955 hover:bg-yellow-600 transition-all shadow-lg shadow-yellow-500/10 active:scale-95"
                    >
                      <LogIn size={16} />
                      <span>Acceso Socios</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {children}
      </main>

      {/* Redes del Club Section */}
      {isPublicRoute && (
        <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 py-10 text-white border-t border-blue-800/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(253,224,71,0.05),transparent_40%)]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-center bg-gradient-to-r from-white via-slate-100 to-yellow-300 bg-clip-text text-transparent mb-6 uppercase tracking-wider">
              Síguenos en nuestras redes
            </h2>

            <div className="flex items-center justify-center gap-8 sm:gap-12">
              {/* Facebook Button */}
              <a
                href="https://www.facebook.com/clubdeleonesdequetzaltenango"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] bg-white/5 border border-white/10 hover:border-blue-500/40 hover:bg-blue-600/10 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 active:scale-95"
              >
                <div className="absolute inset-0 rounded-[1.5rem] bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                <Facebook size={26} className="text-slate-300 group-hover:text-blue-400 transition-all duration-300 group-hover:scale-115" />
              </a>

              {/* Instagram Button */}
              <a
                href="https://www.instagram.com/clubdeleonesxela"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] bg-white/5 border border-white/10 hover:border-pink-500/40 hover:bg-pink-600/10 transition-all duration-300 shadow-lg hover:shadow-pink-500/25 active:scale-95"
              >
                <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-tr from-yellow-500/10 via-pink-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                <Instagram size={26} className="text-slate-300 group-hover:text-pink-400 transition-all duration-300 group-hover:scale-115" />
              </a>

              {/* TikTok Button */}
              <a
                href="https://www.tiktok.com/@clubdeleonesxela"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] bg-white/5 border border-white/10 hover:border-teal-500/40 hover:bg-slate-800/20 transition-all duration-300 shadow-lg hover:shadow-teal-500/25 active:scale-95"
              >
                <div className="absolute inset-0 rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm bg-gradient-to-r from-cyan-400/20 via-transparent to-red-400/20 -z-10" />
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 448 512" className="w-6 h-6 text-slate-300 group-hover:text-teal-400 transition-all duration-305 group-hover:scale-115">
                  <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/>
                </svg>
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Footer Section */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 ${isEvaluationView ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-12`}>
          <div className="space-y-4">
            <h3 className="text-white text-xl font-bold tracking-tight flex items-center space-x-2">
              <span className="bg-white p-1 rounded-xl block"><img src="images/logo.png" alt="Logo" className="w-8 h-8 object-contain" /></span>
              <span>Club de Leones Xela</span>
            </h3>
            <p className="text-sm leading-relaxed">
              Sirviendo a la comunidad altense y de Quetzaltenango desde hace décadas con integridad, compañerismo y un firme compromiso de servicio comunitario.
            </p>
          </div>
          {!isEvaluationView && (
            <div>
              <h4 className="text-white font-black uppercase text-sm tracking-widest mb-6">Enlaces Rápidos</h4>
              <ul className="space-y-3 text-sm font-semibold">
                <li><Link to="/estatutos" className="hover:text-yellow-400 transition-colors">Estatutos Oficiales</Link></li>
                <li><Link to="/actividades" className="hover:text-yellow-400 transition-colors">Calendario de Actividades</Link></li>
                <li><Link to="/galeria" className="hover:text-yellow-400 transition-colors">Galería Interactiva</Link></li>
                <li>
                  <Link to="/proponer-socio" className="text-yellow-400 hover:text-yellow-500 font-bold flex items-center transition-colors">
                    <Info size={14} className="mr-2" />
                    Proponer Nuevo Socio (Público)
                  </Link>
                </li>
              </ul>
            </div>
          )}
          <div className="space-y-4">
            <h4 className="text-white font-black uppercase text-sm tracking-widest mb-6">Contacto y Sede</h4>
            <p className="text-sm leading-relaxed">
              Quetzaltenango, Guatemala <br />
              <span className="text-slate-500">Sede Central del Club de Leones</span>
            </p>
            <p className="text-sm">
              Email: <a href="mailto:clubdeleonesquetzaltenango@gmail.com" className="text-slate-300 hover:text-yellow-400 transition-colors">clubdeleonesquetzaltenango@gmail.com</a>
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-center text-xs">
          &copy; {new Date().getFullYear()} Club de Leones Quetzaltenango. Diseñado para servicio y liderazgo. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
