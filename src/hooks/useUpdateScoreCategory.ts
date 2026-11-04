import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateScoreCategory } from '@/services/scoreCategoryService';
import { ScoreCategory, UpdateScoreCategoryInput } from '@/types/score';
import { QUERY_KEYS } from '@/constants/queryKeys';

export function useUpdateScoreCategory(id: string) {
  const queryClient = useQueryClient();

  return useMutation<ScoreCategory, Error, UpdateScoreCategoryInput>({
    mutationFn: (input) => updateScoreCategory(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.scoreCategories }),
  });
}
