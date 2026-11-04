import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/queryKeys';
import { cancelInvitation, resendInvitation } from '@/services/invitationService';

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
