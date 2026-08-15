import { Pressable, StyleSheet, Text, View } from 'react-native';

export interface FormHeaderProps {
  title: string;
  dismissLabel?: string;
  onDismiss: () => void;
}

export function FormHeader({ title, dismissLabel = 'Cancel', onDismiss }: FormHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <Pressable onPress={onDismiss} hitSlop={8}>
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
  dismissText: {
    fontSize: 15,
    color: '#6B7280',
  },
});
