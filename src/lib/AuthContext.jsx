import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44, session } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings] = useState({ public_settings: {} }); // ya no aplica (era de base44)

  useEffect(() => { checkUserAuth(); }, []);

  /** Valida la sesión contra el backend propio usando el JWT guardado. */
  const checkUserAuth = async () => {
    if (!session.token) {
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
      return;
    }
    try {
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      // El resto de la app espera estos alias
      setUser({
        ...currentUser,
        full_name: currentUser.nombre,
        user_type: (currentUser.role || '').toLowerCase(),
        role: currentUser.role,
      });
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (error) {
      console.error('Auth check failed:', error);
      session.clear();
      setIsAuthenticated(false);
      setAuthError({ type: 'auth_required', message: 'Sesión inválida o expirada' });
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  /** Login con correo y contraseña contra Spring Boot. */
  const login = async (email, password) => {
    setAuthError(null);
    try {
      await base44.auth.login(email, password);   // guarda el token en localStorage
      await checkUserAuth();
      return true;
    } catch (error) {
      setAuthError({ type: 'invalid_credentials', message: error.message });
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('audit_login_logged');
    session.clear();
    window.location.href = '/login';
  };

  const navigateToLogin = () => { window.location.href = '/login'; };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      login,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState: checkUserAuth,   // alias para compatibilidad
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
