import { Image, StyleSheet, Text, View } from 'react-native';

import { ROLE_LABELS } from '@/constants/roles';
import { colors, fontSizes } from '@/constants/theme';
import { CurrentProfile } from '@/types/employee';

function getInitial(fullName: string | null, email: string): string {
  const source = fullName && fullName.trim().length > 0 ? fullName : email;
  return source.charAt(0).toUpperCase();
}

function formatLocationsLabel(locations: { id: string; name: string }[]): string | null {
  if (locations.length === 0) return null;
  if (locations.length <= 2) return locations.map((l) => l.name).join(', ');
  return `${locations.length} Locations`;
}

export interface ProfileSummaryProps {
  profile: CurrentProfile | null;
}

export function ProfileSummary({ profile }: ProfileSummaryProps) {
  const locationsLabel = profile ? formatLocationsLabel(profile.locations) : null;

  return (
    <View style={styles.row}>
      {profile?.avatarUrl ? (
        <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarInitial}>
            {profile ? getInitial(profile.fullName, profile.email) : '?'}
          </Text>
        </View>
      )}
      <View style={styles.text}>
        <Text style={styles.greeting}>
          {profile ? `Hi, ${profile.fullName ?? profile.email}! 👋` : 'Loading...'}
        </Text>
        {profile && (
          <Text style={styles.subGreeting}>
            {locationsLabel
              ? `${locationsLabel} · ${ROLE_LABELS[profile.role]}`
              : ROLE_LABELS[profile.role]}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: fontSizes.h3,
    fontWeight: '700',
    color: colors.white,
  },
  text: {
    gap: 2,
  },
  greeting: {
    fontSize: fontSizes.h4,
    fontWeight: '700',
    color: colors.text,
  },
  subGreeting: {
    fontSize: fontSizes.md,
    color: colors.textMuted,
  },
});
