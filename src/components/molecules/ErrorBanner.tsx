import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes } from '@/constants/theme';

export interface ErrorBannerProps {
  message: string | null;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  if (message === null) return null;

  return (
    <View role="alert" style={styles.banner}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.dangerSurface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  text: {
    fontSize: fontSizes.md,
    color: colors.dangerStrong,
  },
});
