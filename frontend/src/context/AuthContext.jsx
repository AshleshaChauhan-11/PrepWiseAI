import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setShowAuthModal(true);
      setAuthMode('login');
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      const userPayload = data.user || data.data?.user;
      const tokenPayload = data.token || data.data?.token;

      setUser(userPayload);
      setToken(tokenPayload);
      localStorage.setItem('user', JSON.stringify(userPayload));
      localStorage.setItem('token', tokenPayload);
      setShowAuthModal(false);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.error || error.message || 'Login failed. Please check credentials.',
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    setLoading(true);
    try {
      const data = await authService.register(username, email, password);
      const userPayload = data.user || data.data?.user;
      const tokenPayload = data.token || data.data?.token;

      setUser(userPayload);
      setToken(tokenPayload);
      localStorage.setItem('user', JSON.stringify(userPayload));
      localStorage.setItem('token', tokenPayload);
      setShowAuthModal(false);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.error || error.message || 'Registration failed. Try a different email.',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        showAuthModal,
        setShowAuthModal,
        authMode,
        setAuthMode,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

