import { useEffect, useState } from 'react';

import { getInvitations } from '@/services/invitationService';
import { Invitation } from '@/types/invitation';

export function useInvitations(): {
  invitations: Invitation[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchInvitations(refresh = false): Promise<void> {
    if (refresh) setIsRefreshing(true);
    try {
      setError(null);
      const data = await getInvitations();
      setInvitations(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load invitations.',
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    fetchInvitations();
  }, []);

  return {
    invitations,
    isLoading,
    isRefreshing,
    error,
    refetch: () => fetchInvitations(true),
  };
}
