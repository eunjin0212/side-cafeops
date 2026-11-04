import { useMutation } from '@tanstack/react-query';
import { Session } from '@supabase/supabase-js';

import { signIn } from '@/services/authService';

export function useSignIn() {
  return useMutation<Session, Error, { email: string; password: string }>({
    mutationFn: ({ email, password }) => signIn(email, password),
  });
}
