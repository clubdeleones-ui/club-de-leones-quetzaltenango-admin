
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Layout from './components/Layout';
import Home from './views/Home';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import Actas from './views/Actas';
import Socios from './views/Socios';
import Galeria from './views/Galeria';
import Estatutos from './views/Estatutos';
import Calendario from './views/Calendario';
import SuperAdmin from './views/SuperAdmin';
import ProponerSocio from './views/ProponerSocio';
import Donar from './views/Donar';
import Solicitudes from './views/Solicitudes';
import { AuthState, Socio, UserRole } from './types';
import { firebaseService } from './services/firebaseService';

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
          const list = await firebaseService.getSocios();
          const freshUser = list.find(s => 
            s.correo.toLowerCase() === auth.user?.correo?.toLowerCase() || 
            s.id === auth.user?.id
          );
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
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || '809679443982-1cohbkabbq88i05uk4d620013g5msed6.apps.googleusercontent.com'}>
      <Router>
        <Layout auth={auth} onLogout={handleLogout}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/actividades" element={<Calendario accessToken={auth.accessToken} />} />
            <Route path="/galeria" element={<Galeria />} />
            <Route path="/socios" element={<Socios user={auth.user} />} />
            <Route path="/proponer-socio" element={<ProponerSocio />} />
            <Route path="/donar" element={<Donar />} />
            <Route path="/solicitudes" element={<Solicitudes user={auth.user} />} />
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
        </Layout>
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;
