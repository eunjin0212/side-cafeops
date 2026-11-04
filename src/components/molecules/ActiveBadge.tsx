import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes } from '@/constants/theme';

export interface ActiveBadgeProps {
  isActive: boolean;
}

export function ActiveBadge({ isActive }: ActiveBadgeProps) {
  return (
    <View style={[styles.badge, isActive ? styles.active : styles.inactive]}>
      <Text style={styles.text}>{isActive ? 'Active' : 'Inactive'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  active: {
    backgroundColor: colors.successSurface,
  },
  inactive: {
    backgroundColor: colors.surfaceMuted,
  },
  text: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
