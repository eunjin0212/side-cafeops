import { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';

import { colors, fontSizes } from '@/constants/theme';
import { webOnlyProps } from '@/utils/a11y';

export interface SectionLabelProps {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}

export function SectionLabel({ children, style }: SectionLabelProps) {
  return (
    <Text role="heading" style={[styles.text, style]} {...webOnlyProps({ 'aria-level': 2 })}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
