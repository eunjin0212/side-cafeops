import { useQuery } from '@tanstack/react-query';

import { getScoreCategories } from '@/services/scoreCategoryService';
import { ScoreCategory } from '@/types/score';
import { QUERY_KEYS } from '@/constants/queryKeys';

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
    error: error instanceof Error ? error.message : error ? 'Failed to load categories.' : null,
  };
}
