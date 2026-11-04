import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/queryKeys';
import { getLocations } from '@/services/locationService';
import { Location } from '@/types/location';
import { queryErrorMessage } from '@/utils/errors';

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
    error: queryErrorMessage(error, 'Failed to load locations.'),
  };
}
