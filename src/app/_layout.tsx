import { DarkTheme, DefaultTheme, Redirect, Slot, ThemeProvider } from 'expo-router';
import { useSegments } from 'expo-router';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { useSession } from '@/hooks/useSession';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { session, isLoading } = useSession();
  const segments = useSegments();

  if (isLoading) return null;

  const inAuthGroup = segments[0] === '(auth)';

  if (!session && !inAuthGroup) return <Redirect href="/(auth)/login" />;
  if (inAuthGroup) return <Slot />;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
