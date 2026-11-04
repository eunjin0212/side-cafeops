import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/queryKeys';
import { createScoreEntries } from '@/services/scoreEntryService';
import { CreateScoreEntriesBatchInput, ScoreEntry } from '@/types/score';

export function useCreateScoreEntry() {
  const queryClient = useQueryClient();

  return useMutation<ScoreEntry[], Error, CreateScoreEntriesBatchInput>({
    mutationFn: createScoreEntries,
    onSuccess: (_, variables) => {
      variables.profiles.forEach(({ profileId }) => {
        void queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.scoreEntries(profileId),
        });
      });
      // Refresh all leaderboard views (all location filters)
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leaderboardAll });
      // A submission made just after a boundary lands in the new cycle.
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentCycle });
    },
  });
}
