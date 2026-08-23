import { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';

export interface ErrorTextProps {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}

export function ErrorText({ children, style }: ErrorTextProps) {
  return <Text style={[styles.text, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    color: '#DC2626',
  },
});
