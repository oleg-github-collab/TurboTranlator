import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';

export const useAuthenticatedFetch = () => {
  const { tokens, refresh } = useAuth();

  const request = async <T>(url: string, init: RequestInit = {}) => {
    if (!tokens?.accessToken) {
      throw new Error('Not authenticated');
    }
    try {
      return await apiRequest<T>(url, init, tokens.accessToken);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.toLowerCase().includes('token')) {
        const refreshed = await refresh();
        if (!refreshed?.accessToken) throw err;
        return apiRequest<T>(url, init, refreshed.accessToken);
      }
      throw err;
    }
  };

  return { request };
};
