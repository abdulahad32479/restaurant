"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '@/src/types';
import { authService } from '@/src/services/auth.service';
import { resolvePermission } from '@/src/lib/rbac';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Define logout first so initAuth can reference it
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }, []);

  // Refresh user from backend
  const refreshUser = useCallback(async () => {
    try {
      const latestUser = await authService.getCurrentUser();
      setUser(latestUser);
      localStorage.setItem('user', JSON.stringify(latestUser));
    } catch (e: any) {
      console.error('Failed to sync user profile', e);
      if (e?.response?.status === 401) {
        logout();
      }
    }
  }, [logout]);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');

      if (storedToken) {
        setToken(storedToken);

        // Optimistically set stored user while we fetch fresh data
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            console.error('Failed to parse stored user', e);
          }
        }

        // Always sync with backend to get latest role + permissions
        await refreshUser();
      }

      setLoading(false);
    };

    initAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback((newToken: string, newRefreshToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('access_token', newToken);
    localStorage.setItem('refresh_token', newRefreshToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  }, []);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    return resolvePermission(
      permission,
      user.role || '',
      user.permissions || [],
      user.permissions_list || '',
    );
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, loading, hasPermission, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
