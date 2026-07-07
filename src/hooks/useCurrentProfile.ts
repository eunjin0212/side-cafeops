import { useQuery } from '@tanstack/react-query';

import { getCurrentProfile, CurrentProfile } from '@/services/authService';
import { QUERY_KEYS } from '@/constants/queryKeys';

export function useCurrentProfile(): {
  profile: CurrentProfile | null;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.currentProfile,
    queryFn: getCurrentProfile,
  });

  return { profile: data ?? null, isLoading };
}
