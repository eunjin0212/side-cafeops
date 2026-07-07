import { useQuery } from '@tanstack/react-query';

import { getLocations } from '@/services/locationService';
import { Location } from '@/types/location';
import { QUERY_KEYS } from '@/constants/queryKeys';

export function useLocations(): {
  locations: Location[];
  isLoading: boolean;
  error: string | null;
} {
  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.locations,
    queryFn: getLocations,
  });

  return {
    locations: data ?? [],
    isLoading,
    error: error instanceof Error ? error.message : error ? 'Failed to load locations.' : null,
  };
}
