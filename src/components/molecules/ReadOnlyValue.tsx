import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes } from '@/constants/theme';

export interface ReadOnlyValueProps {
  children: ReactNode;
}

export function ReadOnlyValue({ children }: ReadOnlyValueProps) {
  return (
    <View style={styles.box}>
      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: colors.textMuted,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  text: {
    fontSize: fontSizes.xl,
    color: colors.textMuted,
  },
});
