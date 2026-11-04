import { useQuery } from '@tanstack/react-query';

import { getScoreCategories } from '@/services/scoreCategoryService';
import { ScoreCategory } from '@/types/score';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { queryErrorMessage } from '@/utils/errors';

export function useScoreCategories(): {
  categories: ScoreCategory[];
  isLoading: boolean;
  error: string | null;
} {
  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.scoreCategories,
    queryFn: getScoreCategories,
  });

  return {
    categories: data ?? [],
    isLoading,
    error: queryErrorMessage(error, 'Failed to load categories.'),
  };
}
