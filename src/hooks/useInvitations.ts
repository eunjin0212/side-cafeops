import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getInvitations } from '@/services/invitationService';
import { Invitation } from '@/types/invitation';
import { QUERY_KEYS } from '@/constants/queryKeys';

export function useInvitations(): {
  invitations: Invitation[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => void;
} {
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.invitations,
    queryFn: getInvitations,
  });

  return {
    invitations: data ?? [],
    isLoading,
    isRefreshing: !isLoading && isFetching,
    error: error instanceof Error ? error.message : error ? 'Failed to load invitations.' : null,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invitations });
    },
  };
}
