import { useEffect, useState } from 'react';

import { getCurrentProfile, CurrentProfile } from '@/services/authService';

export function useCurrentProfile(): {
  profile: CurrentProfile | null;
  isLoading: boolean;
} {
  const [profile, setProfile] = useState<CurrentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCurrentProfile()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setIsLoading(false));
  }, []);

  return { profile, isLoading };
}
