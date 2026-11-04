import { useQuery } from '@tanstack/react-query';

import { getLeaderboard } from '@/services/leaderboardService';
import { getCurrentCycle } from '@/services/scoreCycleService';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { queryErrorMessage } from '@/utils/errors';
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
    error: queryErrorMessage(entriesResult.error, 'Failed to load leaderboard.'),
    refetch: entriesResult.refetch,
  };
}
