import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/queryKeys';
import { getInvitations } from '@/services/invitationService';
import { Invitation } from '@/types/invitation';
import { queryErrorMessage } from '@/utils/errors';

export function useInvitations(): {
  invitations: Invitation[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => void;
} {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.invitations,
    queryFn: getInvitations,
  });

  return {
    invitations: data ?? [],
    isLoading,
    isRefreshing: !isLoading && isFetching,
    error: queryErrorMessage(error, 'Failed to load invitations.'),
    refetch,
  };
}
