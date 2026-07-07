import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createScoreEntries } from '@/services/scoreEntryService';
import { CreateScoreEntriesBatchInput, ScoreEntry } from '@/types/score';
import { QUERY_KEYS } from '@/constants/queryKeys';

export function useCreateScoreEntry() {
  const queryClient = useQueryClient();

  return useMutation<ScoreEntry[], Error, CreateScoreEntriesBatchInput>({
    mutationFn: createScoreEntries,
    onSuccess: (_, variables) => {
      variables.profileIds.forEach((profileId) => {
        void queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.scoreEntries(profileId),
        });
      });
      // Refresh all leaderboard views (all location filters)
      void queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}
