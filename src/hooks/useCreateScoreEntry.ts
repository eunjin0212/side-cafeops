import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createScoreEntry } from '@/services/scoreEntryService';
import { CreateScoreEntryInput, ScoreEntry } from '@/types/score';
import { QUERY_KEYS } from '@/constants/queryKeys';

export function useCreateScoreEntry() {
  const queryClient = useQueryClient();

  return useMutation<ScoreEntry, Error, CreateScoreEntryInput>({
    mutationFn: createScoreEntry,
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.scoreEntries(variables.profileId),
      });
    },
  });
}
