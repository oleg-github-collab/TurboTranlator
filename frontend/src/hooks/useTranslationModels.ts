import { useQuery } from '@tanstack/react-query';
import { getModels } from '../api/translation';

export const useTranslationModels = () =>
  useQuery({
    queryKey: ['models'],
    queryFn: getModels,
    staleTime: 1000 * 60 * 10
  });
