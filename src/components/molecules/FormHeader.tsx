import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenTitle } from '@/components/molecules/ScreenTitle';

export interface FormHeaderProps {
  title: string;
  dismissLabel?: string;
  onDismiss: () => void;
}

export function FormHeader({ title, dismissLabel = 'Cancel', onDismiss }: FormHeaderProps) {
  return (
    <View style={styles.header}>
      <ScreenTitle style={styles.title}>{title}</ScreenTitle>
      <Pressable role="button" style={styles.dismissButton} onPress={onDismiss} hitSlop={8}>
        <Text style={styles.dismissText}>{dismissLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  dismissButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  dismissText: {
    fontSize: 15,
    color: '#6B7280',
  },
});
