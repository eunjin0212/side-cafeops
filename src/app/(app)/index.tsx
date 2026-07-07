import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { signOut } from '@/services/authService';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { can } from '@/constants/permissions';

export default function HomeScreen() {
  const { profile } = useCurrentProfile();
  const queryClient = useQueryClient();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut(): Promise<void> {
    setError(null);
    setIsSigningOut(true);
    try {
      await signOut();
      queryClient.clear();
    } catch {
      setError('Failed to sign out. Please try again.');
      setIsSigningOut(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Signed in as</Text>
      <Text style={styles.email}>{profile?.email ?? 'Loading...'}</Text>

      <Pressable style={styles.button} onPress={() => router.navigate('/employees')}>
        <Text style={styles.buttonText}>Employees</Text>
      </Pressable>

      {profile !== null && can(profile.role, 'manageScoreCategories') && (
        <Pressable style={styles.button} onPress={() => router.navigate('/scores/categories')}>
          <Text style={styles.buttonText}>Score Categories</Text>
        </Pressable>
      )}

      {error !== null && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.signOutButton, isSigningOut && styles.signOutButtonDisabled]}
        onPress={handleSignOut}
        disabled={isSigningOut}
      >
        {isSigningOut ? (
          <ActivityIndicator color="#EF4444" />
        ) : (
          <Text style={styles.signOutText}>Sign Out</Text>
        )}
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
  error: {
    marginTop: 8,
    fontSize: 13,
    color: '#EF4444',
  },
  signOutButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  signOutButtonDisabled: {
    opacity: 0.5,
  },
  signOutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
});
