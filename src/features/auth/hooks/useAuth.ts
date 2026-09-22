/**
 * useAuth — auth store accessor that kicks off initialize() once.
 */

import { useEffect } from 'react';

import { useAuthStore, type AuthState } from '@/store';

export function useAuth(): AuthState {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const initialized = useAuthStore((state) => state.initialized);
  const initialize = useAuthStore((state) => state.initialize);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (!initialized) {
      void initialize();
    }
  }, [initialized, initialize]);

  return { user, loading, initialized, initialize, login, register, logout };
}
