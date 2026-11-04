import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes } from '@/constants/theme';
import { rankBadgeColors } from '@/utils/points';

export interface LocationScoreCardProps {
  locationName: string;
  score: number;
  rank: number | null;
  total: number;
  onPress: () => void;
}

export function LocationScoreCard({
  locationName,
  score,
  rank,
  total,
  onPress,
}: LocationScoreCardProps) {
  const badge = rankBadgeColors(rank);

  return (
    <Pressable role="link" style={styles.card} onPress={onPress}>
      <View style={styles.top}>
        <View>
          <Text style={styles.label}>{locationName}</Text>
          <Text style={styles.score}>{score}</Text>
        </View>
        <View style={[styles.rankCircle, { backgroundColor: badge.bg }]} aria-hidden>
          <Text style={[styles.rankNumber, { color: badge.text }]}>
            {rank !== null ? `#${rank}` : '–'}
          </Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {rank !== null ? `Rank #${rank} of ${total}` : 'View My Scores'}
        </Text>
        <Text style={styles.chevron} aria-hidden>
          ›
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 16,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: fontSizes.md,
    color: colors.textMuted,
    marginBottom: 4,
  },
  score: {
    fontSize: fontSizes.display,
    fontWeight: '800',
    color: colors.text,
  },
  rankCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rankNumber: {
    fontSize: fontSizes.h4,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceMuted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: fontSizes.xl,
    fontWeight: '600',
    color: colors.text,
  },
  chevron: {
    fontSize: fontSizes.h4,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
