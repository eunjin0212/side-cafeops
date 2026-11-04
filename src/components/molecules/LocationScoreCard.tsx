import { Pressable, StyleSheet, Text, View } from 'react-native';

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
        <Text style={styles.chevron} aria-hidden>›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 18,
    gap: 16,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  score: {
    fontSize: 40,
    fontWeight: '800',
    color: '#111827',
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
    fontSize: 18,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  chevron: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: '600',
  },
});
