import { DarkTheme, DefaultTheme, Redirect, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { useSession } from '@/hooks/useSession';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { session, isLoading } = useSession();

  if (isLoading) return null;
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
