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
  Info
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
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    { label: 'Galería', path: '/galeria', icon: Image, public: true },
    { label: 'Directorio', path: '/socios', icon: Users, public: true },
  ];

  const getProtectedItems = () => {
    if (!auth.user) return [];
    
    const items = [
      { label: 'Mi Panel', path: '/dashboard', icon: User },
      { label: 'Estatutos', path: '/estatutos', icon: ShieldCheck }
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
      items.push({ label: 'Administrador', path: '/admin', icon: ShieldCheck });
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
            <div className="hidden md:flex items-center space-x-2">
              {navItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center space-x-2 ${
                      active 
                        ? 'bg-blue-850/65 text-yellow-400 shadow-inner' 
                        : 'text-slate-200 hover:bg-blue-800/50 hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                  </Link>
                );
              })}

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
                      <div className="absolute right-0 mt-3 w-64 bg-white text-slate-800 rounded-[1.5rem] shadow-2xl border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Member Details */}
                        <div className="px-5 py-3 border-b border-slate-100">
                          <p className="font-extrabold text-slate-805 truncate leading-snug">{auth.user?.nombre}</p>
                          <p className="text-xs text-blue-900 font-bold uppercase tracking-wider mt-1 truncate">
                            {auth.user?.puesto || 'Socio Regular'}
                          </p>
                        </div>
                        
                        {/* Protected links */}
                        <div className="py-2">
                          {protectedItems.map((item) => {
                            const Icon = item.icon;
                            const isLinkActive = location.pathname === item.path;
                            return (
                              <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsUserDropdownOpen(false)}
                                className={`flex items-center space-x-3 px-5 py-3 text-sm font-bold transition-colors ${
                                  isLinkActive 
                                    ? 'bg-blue-50 text-blue-900' 
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                <Icon size={18} className={isLinkActive ? 'text-blue-900' : 'text-slate-400'} />
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
                            className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <LogOut size={18} />
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

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2.5 rounded-xl hover:bg-blue-800 focus:outline-none transition-colors border border-transparent hover:border-blue-750"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isOpen && (
          <div className="md:hidden bg-blue-900 border-t border-blue-800 px-4 py-4 space-y-3 animate-in slide-in-from-top duration-300">
            {/* Public Links */}
            <div className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-base font-bold transition-all ${
                    location.pathname === item.path ? 'bg-blue-800 text-yellow-400' : 'text-slate-200 hover:bg-blue-850'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Private Links / Profile */}
            {auth.isAuthenticated ? (
              <div className="border-t border-blue-850 pt-4 space-y-4">
                {/* Profile card mobile */}
                <div className="flex items-center space-x-4 px-4 py-2 bg-blue-850/40 rounded-2xl border border-blue-800/40">
                  <img 
                    src={auth.user?.foto || 'https://picsum.photos/seed/' + auth.user?.id + '/100/100'} 
                    alt={auth.user?.nombre} 
                    className="w-12 h-12 rounded-xl object-cover" 
                  />
                  <div className="min-w-0">
                    <p className="font-extrabold text-white text-base truncate">{auth.user?.nombre}</p>
                    <p className="text-xs text-yellow-400 font-bold uppercase tracking-wider mt-0.5 truncate">{auth.user?.puesto || 'Socio'}</p>
                  </div>
                </div>

                {/* Sub links */}
                <div className="space-y-1">
                  {protectedItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleNav(item.path)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-base font-bold transition-all ${
                          location.pathname === item.path ? 'bg-blue-800 text-yellow-400' : 'text-slate-200 hover:bg-blue-850'
                        }`}
                      >
                        <Icon size={18} className="text-slate-400" />
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
              <button
                onClick={() => handleNav('/login')}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3.5 rounded-xl text-base font-black bg-yellow-500 text-blue-955 hover:bg-yellow-600 transition-all"
              >
                <LogIn size={18} />
                <span>Acceso Socios</span>
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {children}
      </main>

      {/* Footer Section */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <h3 className="text-white text-xl font-bold tracking-tight flex items-center space-x-2">
              <span className="bg-white p-1 rounded-xl block"><img src="images/logo.png" alt="Logo" className="w-8 h-8 object-contain" /></span>
              <span>Club de Leones Xela</span>
            </h3>
            <p className="text-sm leading-relaxed">
              Sirviendo a la comunidad altense y de Quetzaltenango desde hace décadas con integridad, compañerismo y un firme compromiso de servicio comunitario.
            </p>
          </div>
          <div>
            <h4 className="text-white font-black uppercase text-sm tracking-widest mb-6">Enlaces Rápidos</h4>
            <ul className="space-y-3 text-sm font-semibold">
              <li><Link to="/estatutos" className="hover:text-yellow-400 transition-colors">Estatutos Oficiales</Link></li>
              <li><Link to="/actividades" className="hover:text-yellow-400 transition-colors">Calendario de Actividades</Link></li>
              <li><Link to="/galeria" className="hover:text-yellow-400 transition-colors">Galería Histórica</Link></li>
              <li>
                <Link to="/proponer-socio" className="text-yellow-400 hover:text-yellow-500 font-bold flex items-center transition-colors">
                  <Info size={14} className="mr-2" />
                  Proponer Nuevo Socio (Público)
                </Link>
              </li>
            </ul>
          </div>
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
