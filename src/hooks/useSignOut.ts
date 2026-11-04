import { useMutation, useQueryClient } from '@tanstack/react-query';

import { signOut } from '@/services/authService';

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: signOut,
    onSuccess: () => queryClient.clear(),
  });
}
