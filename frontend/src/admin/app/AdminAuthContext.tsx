import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  adminLogin,
  clearAdminSession,
  getStoredAdminSession,
  saveAdminSession,
} from '../services/adminApi';
import type { AdminSession } from '../types/models';

interface AdminAuthContextType {
  session: AdminSession | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AdminSession | null>(() => getStoredAdminSession());

  const login = async (username: string, password: string): Promise<void> => {
    const nextSession = await adminLogin(username, password);
    saveAdminSession(nextSession);
    setSession(nextSession);
  };

  const logout = (): void => {
    clearAdminSession();
    setSession(null);
  };

  const contextValue = useMemo<AdminAuthContextType>(
    () => ({
      session,
      isAuthenticated: !!session,
      login,
      logout,
    }),
    [session]
  );

  return <AdminAuthContext.Provider value={contextValue}>{children}</AdminAuthContext.Provider>;
};

export function useAdminAuth(): AdminAuthContextType {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
