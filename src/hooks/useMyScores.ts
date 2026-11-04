import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getMyScoreEntries } from '@/services/scoreEntryService';
import { getCurrentCycle } from '@/services/leaderboardService';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { useScoreCategories } from '@/hooks/useScoreCategories';
import { useLocations } from '@/hooks/useLocations';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { queryErrorMessage } from '@/utils/errors';
import { BASE_SCORE } from '@/constants/scoring';
import { EnrichedEntry } from '@/types/score';
import { CycleSummary } from '@/types/leaderboard';

export type MyScores = {
  cycle: CycleSummary | null;
  entries: EnrichedEntry[];
  base: number;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  refetch: () => void;
};

export function useMyScores(): MyScores {
  const { profile } = useCurrentProfile();
  const { categories } = useScoreCategories();
  const { locations } = useLocations();

  const cycleResult = useQuery({
    queryKey: QUERY_KEYS.currentCycle,
    queryFn: getCurrentCycle,
  });

  const cycleId = cycleResult.data?.id;

  const entriesResult = useQuery({
    queryKey: QUERY_KEYS.scoreEntries(profile?.id ?? ''),
    queryFn: () => getMyScoreEntries(profile!.id, cycleId!),
    enabled: !!profile && !!cycleId,
  });

  const categoryMap = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c]));
    return map;
  }, [categories]);

  const locationMap = useMemo(() => {
    const map = new Map(locations.map((l) => [l.id, l.name]));
    return map;
  }, [locations]);

  const entries: EnrichedEntry[] = useMemo(() => {
    return (entriesResult.data ?? []).map((entry) => {
      const cat = categoryMap.get(entry.categoryId);
      return {
        ...entry,
        categoryName: cat?.name ?? 'Unknown Category',
        section: cat?.section ?? 'daily_performance',
        locationName: entry.locationId ? (locationMap.get(entry.locationId) ?? null) : null,
      };
    });
  }, [entriesResult.data, categoryMap, locationMap]);

  return {
    cycle: cycleResult.data ?? null,
    entries,
    base: BASE_SCORE,
    isLoading: entriesResult.isLoading,
    isFetching: entriesResult.isFetching,
    error: queryErrorMessage(entriesResult.error, 'Failed to load score entries.'),
    refetch: entriesResult.refetch,
  };
}
