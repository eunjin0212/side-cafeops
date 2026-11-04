import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/queryKeys';
import { createInvitation } from '@/services/invitationService';
import { CreateInvitationInput, Invitation } from '@/types/invitation';

export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation<Invitation, Error, CreateInvitationInput>({
    mutationFn: createInvitation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invitations }),
  });
}
