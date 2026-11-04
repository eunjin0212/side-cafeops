import { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, fontSizes } from '@/constants/theme';

export interface EmptyStateProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({ children, style }: EmptyStateProps) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 24,
    alignItems: 'center',
  },
  text: {
    fontSize: fontSizes.lg,
    color: colors.textMuted,
  },
});
