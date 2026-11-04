import { useMutation, useQueryClient } from '@tanstack/react-query';

import { cancelInvitation, resendInvitation } from '@/services/invitationService';
import { QUERY_KEYS } from '@/constants/queryKeys';

export function useInvitationActions() {
  const queryClient = useQueryClient();
  const refreshInvitations = () =>
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invitations });

  const cancel = useMutation<void, Error, string>({
    mutationFn: cancelInvitation,
    onSuccess: refreshInvitations,
  });

  const resend = useMutation<void, Error, string>({
    mutationFn: resendInvitation,
    onSuccess: refreshInvitations,
  });

  return { cancel, resend };
}
