import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { getCurrentUser } from '@/services/authService';

export default function HomeScreen() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then((user) => setEmail(user?.email ?? null))
      .catch(() => setEmail(null));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Signed in as</Text>
      <Text style={styles.email}>{email ?? 'Loading...'}</Text>

      {/* TODO: remove after routing is set up */}
      <Pressable style={styles.button} onPress={() => router.navigate('/employees')}>
        <Text style={styles.buttonText}>Employees</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  button: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#111827',
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
