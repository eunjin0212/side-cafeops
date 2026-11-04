import { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';

import { colors, fontSizes } from '@/constants/theme';

export interface ErrorTextProps {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}

export function ErrorText({ children, style }: ErrorTextProps) {
  return (
    <Text role="alert" style={[styles.text, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: fontSizes.lg,
    color: colors.danger,
  },
});
