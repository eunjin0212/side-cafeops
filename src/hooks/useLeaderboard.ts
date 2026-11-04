import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/queryKeys';
import { getLeaderboard } from '@/services/leaderboardService';
import { LeaderboardEntry } from '@/types/leaderboard';
import { queryErrorMessage } from '@/utils/errors';

export function useLeaderboard(
  locationId?: string,
  cycleId?: string,
): {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  refetch: () => void;
} {
  const entriesResult = useQuery({
    queryKey: QUERY_KEYS.leaderboard(locationId, cycleId),
    queryFn: () => getLeaderboard(locationId, cycleId),
  });

  return {
    entries: entriesResult.data ?? [],
    isLoading: entriesResult.isLoading,
    isFetching: entriesResult.isFetching,
    error: queryErrorMessage(entriesResult.error, 'Failed to load leaderboard.'),
    refetch: entriesResult.refetch,
  };
}
