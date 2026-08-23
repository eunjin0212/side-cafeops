import { useQueries } from '@tanstack/react-query';

import { getLeaderboard } from '@/services/leaderboardService';
import { QUERY_KEYS } from '@/constants/queryKeys';

export type LocationRank = {
  locationId: string;
  locationName: string;
  rank: number | null;
  total: number;
  isLoading: boolean;
};

export function useMyLocationRanks(
  profileId: string | undefined,
  locations: { id: string; name: string }[],
): LocationRank[] {
  const results = useQueries({
    queries: locations.map((loc) => ({
      queryKey: QUERY_KEYS.leaderboard(loc.id),
      queryFn: () => getLeaderboard(loc.id),
      enabled: !!profileId,
    })),
  });

  return locations.map((loc, i) => {
    const entries = results[i].data ?? [];
    const mine = entries.find((e) => e.profileId === profileId);
    return {
      locationId: loc.id,
      locationName: loc.name,
      rank: mine?.rank ?? null,
      total: entries.length,
      isLoading: results[i].isLoading,
    };
  });
}
