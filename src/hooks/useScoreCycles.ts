import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/queryKeys';
import { getScoreCycles } from '@/services/scoreCycleService';
import { CycleSummary } from '@/types/leaderboard';
import { queryErrorMessage } from '@/utils/errors';

export function useScoreCycles(): {
  cycles: CycleSummary[];
  isLoading: boolean;
  error: string | null;
} {
  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.scoreCycles,
    queryFn: getScoreCycles,
  });

  return {
    cycles: data ?? [],
    isLoading,
    error: queryErrorMessage(error, 'Failed to load score cycles.'),
  };
}
