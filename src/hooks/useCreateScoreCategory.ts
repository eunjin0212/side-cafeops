import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createScoreCategory } from '@/services/scoreCategoryService';
import { CreateScoreCategoryInput, ScoreCategory } from '@/types/score';
import { QUERY_KEYS } from '@/constants/queryKeys';

export function useCreateScoreCategory() {
  const queryClient = useQueryClient();

  return useMutation<ScoreCategory, Error, CreateScoreCategoryInput>({
    mutationFn: createScoreCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.scoreCategories }),
  });
}
