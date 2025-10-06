import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client';
import type { TokenPair, User } from '../types/auth';

type AuthContextValue = {
  user: User | null;
  tokens: TokenPair | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, confirm: string, agbAccepted: boolean) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<TokenPair | null>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'kli.auth';

interface StoredState {
  user: User;
  tokens: TokenPair;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<TokenPair | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setLoading(false);
      return;
    }
    try {
      const stored = JSON.parse(raw) as StoredState;
      setUser(stored.user);
      setTokens(stored.tokens);
    } catch (err) {
      console.warn('Failed to parse stored auth state', err);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && tokens) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, tokens }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user, tokens]);

  const login = useCallback(async (username: string, password: string) => {
    const response = await apiRequest<{ user: User; tokens: TokenPair }>(
      '/api/v1/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ username, password })
      }
    );
    setUser(response.user);
    setTokens(response.tokens);
  }, []);

  const register = useCallback(async (username: string, password: string, confirm: string, agbAccepted: boolean) => {
    const response = await apiRequest<{ user: User; tokens: TokenPair }>(
      '/api/v1/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ username, password, confirm, agbAccept: agbAccepted })
      }
    );
    setUser(response.user);
    setTokens(response.tokens);
  }, []);

  const refresh = useCallback(async (): Promise<TokenPair | null> => {
    if (!tokens?.refreshToken) return null;
    const response = await apiRequest<{ user: User; tokens: TokenPair }>(
      '/api/v1/auth/refresh',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken: tokens.refreshToken })
      }
    );
    setUser(response.user);
    setTokens(response.tokens);
    return response.tokens;
  }, [tokens]);

  const logout = useCallback(() => {
    setUser(null);
    setTokens(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      tokens,
      loading,
      login,
      register,
      logout,
      refresh,
      isAuthenticated: Boolean(user && tokens)
    }),
    [user, tokens, loading, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
