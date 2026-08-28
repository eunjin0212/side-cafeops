import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getMyScoreEntries } from '@/services/scoreEntryService';
import { getCurrentCycle } from '@/services/leaderboardService';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { useScoreCategories } from '@/hooks/useScoreCategories';
import { useLocations } from '@/hooks/useLocations';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { BASE_SCORE } from '@/constants/scoring';
import { ScoreEntry, ScoreSection } from '@/types/score';
import { CycleSummary } from '@/types/leaderboard';

export type EnrichedEntry = ScoreEntry & {
  categoryName: string;
  section: ScoreSection;
  locationName: string | null;
};

export type MyScores = {
  cycle: CycleSummary | null;
  entries: EnrichedEntry[];
  base: number;
  positivePoints: number;
  negativePoints: number;
  totalPoints: number;
  performanceScore: number;
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

  const positivePoints = useMemo(
    () => entries.reduce((sum, e) => (e.points > 0 ? sum + e.points : sum), 0),
    [entries],
  );

  const negativePoints = useMemo(
    () => entries.reduce((sum, e) => (e.points < 0 ? sum + e.points : sum), 0),
    [entries],
  );

  const totalPoints = positivePoints + negativePoints;
  const performanceScore = BASE_SCORE + totalPoints;

  const error =
    entriesResult.error instanceof Error
      ? entriesResult.error.message
      : entriesResult.error
        ? 'Failed to load score entries.'
        : null;

  return {
    cycle: cycleResult.data ?? null,
    entries,
    base: BASE_SCORE,
    positivePoints,
    negativePoints,
    totalPoints,
    performanceScore,
    isLoading: entriesResult.isLoading,
    isFetching: entriesResult.isFetching,
    error,
    refetch: entriesResult.refetch,
  };
}
