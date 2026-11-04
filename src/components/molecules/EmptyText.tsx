import { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';

import { colors, fontSizes } from '@/constants/theme';

export interface EmptyTextProps {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}

export function EmptyText({ children, style }: EmptyTextProps) {
  return <Text style={[styles.text, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: fontSizes.lg,
    color: colors.textMuted,
  },
});
