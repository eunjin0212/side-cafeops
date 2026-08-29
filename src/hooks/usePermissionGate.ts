import { useEffect } from 'react';
import { router, type Href } from 'expo-router';

import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { can, Permission } from '@/constants/permissions';
import { CurrentProfile } from '@/services/authService';

// Redirects away and reports "still loading" for as long as the profile
// hasn't resolved OR the resolved profile lacks the permission — so a
// screen can block rendering until it's confirmed the caller belongs here.
export function usePermissionGate(
  permission: Permission,
  redirectTo: Href,
): { profile: CurrentProfile | null; isLoading: boolean } {
  const { profile, isLoading } = useCurrentProfile();
  const isBlocked = profile !== null && !can(profile.role, permission);

  useEffect(() => {
    if (isBlocked) {
      router.replace(redirectTo);
    }
  }, [isBlocked, redirectTo]);

  return { profile, isLoading: isLoading || isBlocked };
}
