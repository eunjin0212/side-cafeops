import { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

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
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 24,
    alignItems: 'center',
  },
  text: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
