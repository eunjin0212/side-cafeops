import { useQuery } from '@tanstack/react-query';

import { getLeaderboard, getCurrentCycle } from '@/services/leaderboardService';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { LeaderboardEntry, CycleSummary } from '@/types/leaderboard';

export function useLeaderboard(locationId?: string): {
  entries: LeaderboardEntry[];
  cycle: CycleSummary | null;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  refetch: () => void;
} {
  const entriesResult = useQuery({
    queryKey: QUERY_KEYS.leaderboard(locationId),
    queryFn: () => getLeaderboard(locationId),
  });

  const cycleResult = useQuery({
    queryKey: QUERY_KEYS.currentCycle,
    queryFn: getCurrentCycle,
  });

  return {
    entries: entriesResult.data ?? [],
    cycle: cycleResult.data ?? null,
    isLoading: entriesResult.isLoading,
    isFetching: entriesResult.isFetching,
    error:
      entriesResult.error instanceof Error
        ? entriesResult.error.message
        : entriesResult.error
          ? 'Failed to load leaderboard.'
          : null,
    refetch: entriesResult.refetch,
  };
}
