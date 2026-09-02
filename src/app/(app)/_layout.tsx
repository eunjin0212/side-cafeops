import { DarkTheme, DefaultTheme, Slot, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useAppBadgeSync } from '@/hooks/useAppBadgeSync';
import { usePushNotificationRegistration } from '@/hooks/usePushNotificationRegistration';

export default function AppLayout() {
  const colorScheme = useColorScheme();
  usePushNotificationRegistration();
  useAppBadgeSync();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Slot />
    </ThemeProvider>
  );
}
