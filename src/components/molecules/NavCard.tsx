import { Pressable, StyleSheet, Text } from 'react-native';

export interface NavCardProps {
  label: string;
  icon: string;
  onPress: () => void;
}

export function NavCard({ label, icon, onPress }: NavCardProps) {
  return (
    <Pressable role="link" style={styles.card} onPress={onPress}>
      <Text style={styles.icon} aria-hidden>{icon}</Text>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  icon: {
    fontSize: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});
