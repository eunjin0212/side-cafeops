import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useSession } from '@/hooks/useSession';

const queryClient = new QueryClient();

// On web, tapping a Pressable (e.g. a list row) to navigate leaves it
// DOM-focused. expo-router then freezes the outgoing screen and marks it
// aria-hidden while that focused element is still inside it, which Chrome
// flags as an accessibility violation. Blurring non-form elements at the
// start of every click — before React's onPress/navigation handlers run —
// clears focus in time, without ever touching a real text input's focus.
function useBlurStaleFocusOnWebNavigation(): void {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    function blurNonFormActiveElement(): void {
      const active = document.activeElement as HTMLElement | null;
      if (!active) return;
      const tag = active.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || active.isContentEditable) {
        return;
      }
      active.blur();
    }

    document.addEventListener('click', blurNonFormActiveElement, true);
    return () => document.removeEventListener('click', blurNonFormActiveElement, true);
  }, []);
}

function RootLayoutNav() {
  const { session, isLoading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useBlurStaleFocusOnWebNavigation();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/');
    }
  }, [session, isLoading, segments, router]);

  if (isLoading) return null;

  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}
