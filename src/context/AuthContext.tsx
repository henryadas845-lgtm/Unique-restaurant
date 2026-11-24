import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { dataService } from '../lib/api';
import { isSupabaseConfigured } from '../lib/supabase';
import type { AdminUser } from '../types';

interface AuthContextValue {
  adminUser: AdminUser | null;
  authLoading: boolean;
  needsInitialSetup: boolean;
  login: (password: string, email?: string) => Promise<AdminUser>;
  claimInitialAdmin: (password: string) => Promise<AdminUser>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AdminUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [needsInitialSetup, setNeedsInitialSetup] = useState(false);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        if (isSupabaseConfigured) {
          const user = await dataService.restoreSupabaseSession();
          if (active) {
            setAdminUser(user);
            setNeedsInitialSetup(false);
          }
        } else {
          const status = await dataService.getAuthStatus();
          if (active) {
            setNeedsInitialSetup(status.needsInitialSetup);
          }
        }
      } catch {
        // Ignore initialization errors cleanly; login screen handles unauthenticated state
      } finally {
        if (active) setAuthLoading(false);
      }
    }
    void init();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (password: string, email?: string) => {
    const user = await dataService.loginAdmin(password, email);
    setAdminUser(user);
    setNeedsInitialSetup(false);
    return user;
  }, []);

  const claimInitialAdmin = useCallback(async (password: string) => {
    const user = await dataService.claimInitialAdmin(password);
    setAdminUser(user);
    setNeedsInitialSetup(false);
    return user;
  }, []);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!adminUser) throw new Error('Not authenticated');
      const updated = await dataService.changeAdminPassword(
        currentPassword,
        newPassword,
        adminUser.id
      );
      setAdminUser(updated);
      return updated;
    },
    [adminUser]
  );

  const logout = useCallback(async () => {
    await dataService.logoutAdmin();
    setAdminUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        adminUser,
        authLoading,
        needsInitialSetup,
        login,
        claimInitialAdmin,
        changePassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
