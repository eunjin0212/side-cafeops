import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SCORE_SECTION_LABELS } from '@/constants/scoreSections';
import { colors, fontSizes } from '@/constants/theme';
import { EnrichedEntry } from '@/types/score';
import { formatRelativeDateTime } from '@/utils/dates';
import { formatPoints, pointsColor } from '@/utils/points';

function pointsBg(pts: number): string {
  if (pts > 0) return colors.successBadge;
  if (pts < 0) return colors.dangerBadge;
  return colors.surfaceMuted;
}

export interface ActivityRowProps {
  entry: EnrichedEntry;
  onViewPhotos: (imageUrls: string[]) => void;
}

export function ActivityRow({ entry, onViewPhotos }: ActivityRowProps) {
  return (
    <View style={styles.row}>
      <View style={[styles.pointsBadge, { backgroundColor: pointsBg(entry.points) }]}>
        <Text style={[styles.pointsBadgeText, { color: pointsColor(entry.points) }]}>
          {formatPoints(entry.points)}
        </Text>
      </View>

      <View style={styles.main}>
        <Text style={styles.name} numberOfLines={1}>
          {entry.categoryName}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {SCORE_SECTION_LABELS[entry.section]}
          {entry.locationName ? ` · ${entry.locationName}` : ''} ·{' '}
          {formatRelativeDateTime(entry.createdAt)}
        </Text>
      </View>

      <View style={styles.icons}>
        {entry.imageUrls.length > 0 && (
          <Pressable
            role="button"
            aria-label={`View photos for ${entry.categoryName}`}
            style={styles.photoButton}
            onPress={() => onViewPhotos(entry.imageUrls)}
            hitSlop={4}
          >
            <Text style={styles.icon} aria-hidden>
              📷
            </Text>
          </Pressable>
        )}
        {entry.notes !== null && (
          <Text style={styles.icon} role="img" aria-label="Has a note">
            📝
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  pointsBadge: {
    minWidth: 44,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  pointsBadgeText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  main: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.text,
  },
  meta: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  icons: {
    flexDirection: 'row',
    gap: 6,
  },
  photoButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: fontSizes.lg,
  },
});
