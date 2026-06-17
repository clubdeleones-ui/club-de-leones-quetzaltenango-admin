import React, { useState, useEffect, Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Layout from './components/Layout';
import { AuthState, Socio, UserRole } from './types';
import { firebaseService } from './services/firebaseService';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import { env } from './config/env';

// Lazy loading views for performance optimization
const Home = lazy(() => import('./views/Home'));
const Login = lazy(() => import('./views/Login'));
const Dashboard = lazy(() => import('./views/Dashboard'));
const Actas = lazy(() => import('./views/Actas'));
const Socios = lazy(() => import('./views/Socios'));
const Galeria = lazy(() => import('./views/Galeria'));
const Estatutos = lazy(() => import('./views/Estatutos'));
const Calendario = lazy(() => import('./views/Calendario'));
const SuperAdmin = lazy(() => import('./views/SuperAdmin'));
const ProponerSocio = lazy(() => import('./views/ProponerSocio'));
const Donar = lazy(() => import('./views/Donar'));
const Solicitudes = lazy(() => import('./views/Solicitudes'));
const FichaEvaluacion = lazy(() => import('./views/FichaEvaluacion').then(m => ({ default: m.FichaEvaluacion })));
const EvaluacionCompartida = lazy(() => import('./views/EvaluacionCompartida').then(m => ({ default: m.EvaluacionCompartida })));
const ConfirmarInvitacion = lazy(() => import('./views/ConfirmarInvitacion'));

// ProtectedRoute moved outside of App to resolve typing errors and improve performance
interface ProtectedRouteProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>(() => {
    try {
      const savedAuth = localStorage.getItem('club_leones_auth');
      if (savedAuth) {
        return JSON.parse(savedAuth);
      }
    } catch (e) {
      console.error("Error reading auth from localStorage", e);
    }
    return {
      user: null,
      isAuthenticated: false,
    };
  });

  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      const refreshUserSession = async () => {
        try {
          const freshUser = await firebaseService.getSocioByIdOrEmail(auth.user?.id, auth.user?.correo);
          if (freshUser) {
            // Compare stringified versions to avoid unnecessary updates
            if (JSON.stringify(freshUser) !== JSON.stringify(auth.user)) {
              handleUpdateUser(freshUser);
            }
          }
        } catch (e) {
          console.error("Error refreshing user session on load:", e);
        }
      };
      refreshUserSession();
    }
  }, [auth.isAuthenticated]);

  const handleLogin = (user: Socio, accessToken?: string) => {
    const newAuth = { user, isAuthenticated: true, accessToken };
    setAuth(newAuth);
    localStorage.setItem('club_leones_auth', JSON.stringify(newAuth));
  };

  const handleUpdateUser = (updatedUser: Socio) => {
    setAuth(prev => {
      const newAuth = { ...prev, user: updatedUser };
      localStorage.setItem('club_leones_auth', JSON.stringify(newAuth));
      return newAuth;
    });
  };

  const handleLogout = () => {
    setAuth({ user: null, isAuthenticated: false, accessToken: undefined });
    localStorage.removeItem('club_leones_auth');
  };

  return (
    <GoogleOAuthProvider clientId={env.googleClientId}>
      <ToastProvider>
        <ErrorBoundary>
          <Router>
            <Layout auth={auth} onLogout={handleLogout}>
              <Suspense fallback={
                <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/50">
                  <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin shadow-lg"></div>
                  <p className="mt-4 text-blue-900 font-bold animate-pulse">Cargando...</p>
                </div>
              }>
                <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/actividades" element={<Calendario accessToken={auth.accessToken} isAuthenticated={auth.isAuthenticated} />} />
            <Route path="/galeria" element={<Galeria />} />
            <Route path="/socios" element={<Socios user={auth.user} />} />
            <Route path="/proponer-socio" element={<ProponerSocio />} />
            <Route path="/donar" element={<Donar />} />
            <Route path="/solicitudes" element={<Solicitudes user={auth.user} />} />
            <Route path="/ficha-evaluacion/:id" element={<FichaEvaluacion />} />
            <Route path="/evaluacion-compartida" element={<EvaluacionCompartida />} />
            <Route path="/confirmar-invitacion/:id" element={<ConfirmarInvitacion />} />

            <Route path="/login" element={auth.isAuthenticated ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />

            {/* Protected Routes */}
            <Route
              path="/estatutos"
              element={
                <ProtectedRoute isAuthenticated={auth.isAuthenticated}>
                  <Estatutos accessToken={auth.accessToken} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute isAuthenticated={auth.isAuthenticated}>
                  <Dashboard user={auth.user!} onUpdateUser={handleUpdateUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute isAuthenticated={
                  auth.isAuthenticated && 
                  (auth.user?.rol === UserRole.SUPER_ADMIN || 
                   auth.user?.rol === UserRole.TESORERO || 
                   auth.user?.rol === UserRole.SECRETARIO || 
                   auth.user?.rol === UserRole.ASESOR_SERVICIOS ||
                   auth.user?.rol === UserRole.PRESIDENTE_AFILIACION)
                }>
                  <SuperAdmin user={auth.user!} onUpdateUser={handleUpdateUser} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/actas"
              element={
                <ProtectedRoute isAuthenticated={auth.isAuthenticated}>
                  <Actas accessToken={auth.accessToken} />
                </ProtectedRoute>
              }
            />
                </Routes>
              </Suspense>
            </Layout>
          </Router>
        </ErrorBoundary>
      </ToastProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
