import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';

import { useSession } from '@/hooks/useSession';
import { isUnhandledKeyboardActivation } from '@/utils/a11y';

// By default an offline mutation pauses and replays when back online, which
// shows an endless spinner and later resends whatever the user had typed.
// Failing immediately lets the screen show an error instead.
const queryClient = new QueryClient({
  defaultOptions: { mutations: { networkMode: 'always' } },
});

// On web, tapping a Pressable (e.g. a list row) to navigate leaves it
// DOM-focused. expo-router then freezes the outgoing screen and marks it
// aria-hidden while that focused element is still inside it, which Chrome
// flags as an accessibility violation. Blurring non-form elements at the
// start of every click — before React's onPress/navigation handlers run —
// clears focus in time, without ever touching a real text input's focus.
// Keyboard activation (detail === 0) keeps focus unless it's a link, so
// toggling a checkbox with Space doesn't lose the user's place.
function useBlurStaleFocusOnWebNavigation(): void {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    function blurNonFormActiveElement(event: MouseEvent): void {
      const active = document.activeElement as HTMLElement | null;
      if (!active) return;
      if (event.detail === 0 && active.getAttribute('role') !== 'link') return;
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

// Fills the gaps in react-native-web's keyboard handling; see
// isUnhandledKeyboardActivation. Listens in the capture phase because the
// library stops propagation of the key presses it does handle.
function useKeyboardActivation(): void {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.repeat) return;
      const target = event.target as HTMLElement;
      if (!isUnhandledKeyboardActivation(event.key, target.getAttribute('role'))) return;
      event.preventDefault();
      target.click();
    }

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, []);
}

function RootLayoutNav() {
  const { session, isLoading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useBlurStaleFocusOnWebNavigation();
  useKeyboardActivation();

  // Loading and error states render no ScreenTitle. expo-router's head manager
  // emits an empty <title> first, so one set in +html.tsx would be ignored.
  useEffect(() => {
    if (Platform.OS === 'web' && !document.title) document.title = 'Twilight Cafe';
  }, []);

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

  return (
    <View role="main" style={{ flex: 1 }}>
      <Slot />
    </View>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}
