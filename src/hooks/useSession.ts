import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';

import { getSession } from '@/services/authService';

export function useSession(): { session: Session | null; isLoading: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSession()
      .then(setSession)
      .catch(() => setSession(null))
      .finally(() => setIsLoading(false));
  }, []);

  return { session, isLoading };
}
