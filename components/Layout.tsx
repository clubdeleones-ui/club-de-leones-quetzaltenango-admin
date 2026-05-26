
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogIn, LogOut, User, FileText, Calendar, Image, ShieldCheck, Home } from 'lucide-react';
import { AuthState, UserRole } from '../types';
import { googleService } from '../services/googleService';

interface LayoutProps {
  children: React.ReactNode;
  auth: AuthState;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, auth, onLogout }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
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

  const navItems = [
    { label: 'Inicio', path: '/', icon: Home, public: true },
    { label: 'Actividades', path: '/actividades', icon: Calendar, public: true },
    { label: 'Galería', path: '/galeria', icon: Image, public: true },
    { label: 'Estatutos', path: '/estatutos', icon: ShieldCheck, public: true },
  ];

  const getProtectedItems = () => {
    if (!auth.user) return [];
    
    const items = [{ label: 'Mi Panel', path: '/dashboard', icon: User }];
    
    // Donors do not have access to internal club documents (actas) or member directories
    if (auth.user.rol !== UserRole.DONANTE) {
      items.push({ label: 'Actas', path: '/actas', icon: FileText });
      items.push({ label: 'Directorio', path: '/socios', icon: User });
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
    <div className="min-h-screen flex flex-col">
      <nav className="bg-blue-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => navigate('/')}>
              <div className="bg-white p-1 rounded-full overflow-hidden transition-transform group-hover:scale-110 shadow-md">
                <img src="/images/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight leading-none">Club de Leones</span>
                <span className="text-xs font-medium text-yellow-400 uppercase tracking-widest mt-0.5">Quetzaltenango</span>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === item.path ? 'bg-blue-800 text-yellow-400' : 'hover:bg-blue-800'
                    }`}
                >
                  {item.label}
                </Link>
              ))}

              {auth.isAuthenticated ? (
                <>
                  <div className="h-6 w-px bg-blue-700 mx-2" />
                  {protectedItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === item.path ? 'bg-blue-800 text-yellow-400' : 'hover:bg-blue-800'
                        }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <button
                    onClick={onLogout}
                    className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors ml-4"
                  >
                    <LogOut size={18} />
                    <span>Salir</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-blue-900 px-4 py-2 rounded-lg font-bold transition-colors ml-4"
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
                className="inline-flex items-center justify-center p-2 rounded-md hover:bg-blue-800 focus:outline-none"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="md:hidden bg-blue-900 border-t border-blue-800 px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800"
              >
                {item.label}
              </button>
            ))}
            {auth.isAuthenticated ? (
              <>
                <div className="border-t border-blue-800 my-2 pt-2">
                  {protectedItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => handleNav(item.path)}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800"
                    >
                      {item.label}
                    </button>
                  ))}
                  <button
                    onClick={onLogout}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-blue-800"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => handleNav('/login')}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium bg-yellow-500 text-blue-900 mt-4"
              >
                Acceso Socios
              </button>
            )}
          </div>
        )}
      </nav>

      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white text-xl font-bold mb-4">Club de Leones Quetzaltenango</h3>
            <p className="text-sm">Sirviendo a la comunidad altense desde hace décadas con integridad y compromiso.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/estatutos" className="hover:text-yellow-500">Estatutos</Link></li>
              <li><Link to="/actividades" className="hover:text-yellow-500">Actividades</Link></li>
              <li><Link to="/galeria" className="hover:text-yellow-500">Historia</Link></li>
              <li><Link to="/proponer-socio" className="hover:text-yellow-500 font-bold text-yellow-400">Proponer Nuevo Socio</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Contacto</h4>
            <p className="text-sm italic">Quetzaltenango, Guatemala</p>
            <p className="text-sm">Email: info@leonesxela.com</p>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-8 pt-8 border-t border-slate-800 text-center text-xs">
          &copy; {new Date().getFullYear()} Club de Leones Quetzaltenango. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
