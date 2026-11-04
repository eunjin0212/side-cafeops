import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/queryKeys';
import { getCurrentProfile } from '@/services/authService';
import { CurrentProfile } from '@/types/employee';

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
