import { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';

export interface EmptyTextProps {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}

export function EmptyText({ children, style }: EmptyTextProps) {
  return <Text style={[styles.text, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
