import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Platform = 'ios' | 'android';

const STEPS: Record<Platform, { icon: string; text: string }[]> = {
  ios: [
    { icon: '🧭', text: 'Open this page in Safari (it must be Safari, not Chrome).' },
    { icon: '􀈂', text: 'Tap the Share icon in the toolbar (a square with an arrow pointing up).' },
    { icon: '➕', text: 'Scroll down and tap "Add to Home Screen".' },
    { icon: '✅', text: 'Tap "Add" in the top-right corner.' },
  ],
  android: [
    { icon: '🌐', text: 'Open this page in Chrome.' },
    { icon: '⋮', text: 'Tap the three-dot menu in the top-right corner.' },
    { icon: '➕', text: 'Tap "Add to Home screen" or "Install app".' },
    { icon: '✅', text: 'Tap "Add" / "Install" to confirm.' },
  ],
};

export default function InstallGuideScreen(): React.JSX.Element {
  const [platform, setPlatform] = useState<Platform>('ios');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Install Twilight Cafe & Bar</Text>
      <Text style={styles.subtitle}>
        Add this app to your home screen so you can open it like a regular app and receive
        notifications.
      </Text>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, platform === 'ios' && styles.tabActive]}
          onPress={() => setPlatform('ios')}
        >
          <Text style={[styles.tabText, platform === 'ios' && styles.tabTextActive]}>
            📱 iPhone
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, platform === 'android' && styles.tabActive]}
          onPress={() => setPlatform('android')}
        >
          <Text style={[styles.tabText, platform === 'android' && styles.tabTextActive]}>
            🤖 Android
          </Text>
        </Pressable>
      </View>

      <View style={styles.steps}>
        {STEPS[platform].map((step, index) => (
          <View key={index} style={styles.step}>
            <View style={styles.stepIconWrap}>
              <Text style={styles.stepIcon}>{step.icon}</Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepNumber}>Step {index + 1}</Text>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.note}>
        {platform === 'ios'
          ? "Notifications only work after the app is added to your home screen — opening the site in a regular Safari tab isn't enough."
          : 'Once installed, open the app from your home screen and turn on notifications from the home tab.'}
      </Text>

      <Pressable style={styles.backLink} onPress={() => router.replace('/(auth)/login')}>
        <Text style={styles.backLinkText}>← Back to sign in</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111827',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 28,
    lineHeight: 21,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#111827',
  },
  steps: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  stepIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIcon: {
    fontSize: 18,
  },
  stepBody: {
    flex: 1,
    paddingTop: 2,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#208AEF',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  stepText: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 21,
  },
  note: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
    marginTop: 28,
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
  },
  backLink: {
    marginTop: 28,
    alignItems: 'center',
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
});
