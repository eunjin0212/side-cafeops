import { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import { subscribeToSession } from '@/services/authService';

export function useSession(): { session: Session | null; isLoading: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    return subscribeToSession((session) => {
      setSession(session);
      setIsLoading(false);
    });
  }, []);

  return { session, isLoading };
}
