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
      <Text style={styles.label}>로그인된 사용자</Text>
      <Text style={styles.email}>{email ?? '불러오는 중...'}</Text>

      {/* TODO: remove after routing is set up */}
      <Pressable style={styles.button} onPress={() => router.push('/employees')}>
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
