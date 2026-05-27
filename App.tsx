
import React, { useState } from 'react';
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
import { AuthState, Socio, UserRole } from './types';

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
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });

  const handleLogin = (user: Socio, accessToken?: string) => {
    setAuth({ user, isAuthenticated: true, accessToken });
  };

  const handleLogout = () => {
    setAuth({ user: null, isAuthenticated: false, accessToken: undefined });
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
                  <Dashboard user={auth.user!} />
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
                  <SuperAdmin user={auth.user!} />
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
