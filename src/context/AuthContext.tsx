import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: any) => Promise<any>;
  loginWithGoogle: (payload: { credential?: string; profile?: { email: string; name: string; picture?: string; sub?: string } }) => Promise<any>;
  register: (payload: any) => Promise<any>;
  logout: () => void;
  switchAccount: (target: 'customer' | 'admin') => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('nexora_token'));
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    const curToken = localStorage.getItem('nexora_token');
    if (!curToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (err) {
      console.warn('Session expired or invalid, logging out:', err);
      localStorage.removeItem('nexora_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const loginWithGoogle = async (payload: { credential?: string; profile?: { email: string; name: string; picture?: string; sub?: string } }) => {
    const res = await api.loginWithGoogle(payload);
    if (res.token && res.user) {
      localStorage.setItem('nexora_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const login = async (credentials: any) => {
    const res = await api.login(credentials);
    if (res.token && res.user) {
      localStorage.setItem('nexora_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const register = async (payload: any) => {
    const res = await api.register(payload);
    if (res.token && res.user) {
      localStorage.setItem('nexora_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('nexora_token');
    setToken(null);
    setUser(null);
  };

  const switchAccount = async (target: 'customer' | 'admin') => {
    setIsLoading(true);
    try {
      if (target === 'customer') {
        const res = await api.login({ email: 'client@techstart.io', password: 'Client@123456' });
        localStorage.setItem('nexora_token', res.token);
        setToken(res.token);
        setUser(res.user);
      } else {
        const res = await api.login({ email: 'admin@nexoracloud.com', password: 'Admin@123456', twoFactorCode: '654321' });
        localStorage.setItem('nexora_token', res.token);
        setToken(res.token);
        setUser(res.user);
      }
    } catch (err) {
      console.error('Account switch failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, loginWithGoogle, register, logout, switchAccount, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
