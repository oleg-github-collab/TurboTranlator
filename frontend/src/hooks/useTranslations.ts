import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getTranslations } from '../api/translation';

export const useTranslations = () => {
  const { tokens } = useAuth();
  return useQuery({
    queryKey: ['translations'],
    queryFn: () => {
      if (!tokens?.accessToken) {
        throw new Error('Not authenticated');
      }
      return getTranslations(tokens.accessToken);
    },
    enabled: Boolean(tokens?.accessToken),
    refetchInterval: (data) => (data?.some((item) => item.status !== 'completed') ? 5000 : false)
  });
};
