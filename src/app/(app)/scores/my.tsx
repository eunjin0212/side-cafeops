import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EmptyState } from '@/components/molecules/EmptyState';
import { ErrorText } from '@/components/molecules/ErrorText';
import { ListCard } from '@/components/molecules/ListCard';
import { LocationTabs } from '@/components/molecules/LocationTabs';
import { PhotoViewerModal } from '@/components/molecules/PhotoViewerModal';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { SectionLabel } from '@/components/molecules/SectionLabel';
import { colors, fontSizes } from '@/constants/theme';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { useMyScores } from '@/hooks/useMyScores';
import { EnrichedEntry } from '@/types/score';
import { formatMonthDay } from '@/utils/dates';
import { formatPoints, pointsColor } from '@/utils/points';
import { computeLocationStats } from '@/utils/scoreStats';

// ─── sub-components ─────────────────────────────────────────

interface StatColProps {
  label: string;
  value: string;
  color?: string;
  large?: boolean;
}

function StatCol({ label, value, color = colors.text, large = false }: StatColProps) {
  return (
    <View style={styles.statCol}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }, large && styles.statValueLarge]}>{value}</Text>
    </View>
  );
}

interface EntryRowProps {
  entry: EnrichedEntry;
  onViewPhotos: (imageUrls: string[]) => void;
}

function EntryRow({ entry, onViewPhotos }: EntryRowProps) {
  return (
    <View style={styles.entryRow}>
      <View style={styles.entryLeft}>
        <View style={styles.entryTopLine}>
          <Text style={styles.entryName} numberOfLines={1}>
            {entry.categoryName}
          </Text>
          {entry.imageUrls.length > 0 && (
            <Pressable
              role="button"
              aria-label={`View photos for ${entry.categoryName}`}
              style={styles.photoButton}
              onPress={() => onViewPhotos(entry.imageUrls)}
              hitSlop={4}
            >
              <View style={styles.photoBadge}>
                <Text style={styles.photoBadgeText}>Photo</Text>
              </View>
            </Pressable>
          )}
        </View>
        {entry.notes !== null && (
          <Text style={styles.entryNote} numberOfLines={2}>
            {entry.notes}
          </Text>
        )}
        <Text style={styles.entryDate}>{formatMonthDay(entry.createdAt)}</Text>
      </View>
      <Text style={[styles.entryPoints, { color: pointsColor(entry.points) }]}>
        {formatPoints(entry.points)}
      </Text>
    </View>
  );
}

// ─── screen ─────────────────────────────────────────────────

export default function MyScoreScreen() {
  const { profile } = useCurrentProfile();
  const { cycle, entries, base, isLoading, isFetching, error, refetch } = useMyScores();
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(undefined);
  const [viewingPhotos, setViewingPhotos] = useState<string[] | null>(null);

  const cycleLabel = cycle
    ? `${formatMonthDay(cycle.startedAt)} – ${formatMonthDay(cycle.endedAt)}`
    : null;

  const locations = profile?.locations ?? [];
  const effectiveLocationId = selectedLocationId ?? profile?.locationId ?? locations[0]?.id;
  const stats = effectiveLocationId
    ? computeLocationStats(entries, effectiveLocationId, base)
    : null;

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} />
        }
      >
        <ScreenHeader backHref="/" title="My Scores" subtitle={cycleLabel ?? undefined} />

        {locations.length > 1 && (
          <LocationTabs
            locations={locations}
            selectedId={effectiveLocationId}
            onSelect={setSelectedLocationId}
          />
        )}

        {isLoading ? (
          <ActivityIndicator aria-label="Loading" style={styles.loader} size="large" />
        ) : error ? (
          <ErrorText style={styles.errorText}>{error}</ErrorText>
        ) : !stats ? (
          <EmptyState style={styles.emptyCard}>No location assigned yet.</EmptyState>
        ) : (
          <>
            <View style={styles.statsCard}>
              <StatCol label="Base" value={String(base)} />
              <View style={styles.statDivider} />
              <StatCol
                label="Positive"
                value={stats.positive > 0 ? `+${stats.positive}` : '0'}
                color={stats.positive > 0 ? colors.success : colors.textMuted}
              />
              <View style={styles.statDivider} />
              <StatCol
                label="Negative"
                value={stats.negative < 0 ? String(stats.negative) : '0'}
                color={stats.negative < 0 ? colors.danger : colors.textMuted}
              />
              <View style={styles.statDivider} />
              <StatCol
                label="Score"
                value={String(stats.score)}
                color={stats.score >= base ? colors.text : colors.danger}
                large
              />
            </View>

            <View style={styles.section}>
              <SectionLabel>Entries</SectionLabel>

              {stats.entries.length === 0 ? (
                <EmptyState style={styles.emptyCard}>No entries this cycle.</EmptyState>
              ) : (
                <ListCard>
                  {stats.entries.map((entry) => (
                    <EntryRow key={entry.id} entry={entry} onViewPhotos={setViewingPhotos} />
                  ))}
                </ListCard>
              )}
            </View>
          </>
        )}
      </ScrollView>
      <PhotoViewerModal imageUrls={viewingPhotos} onClose={() => setViewingPhotos(null)} />
    </>
  );
}

// ─── styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 48,
    gap: 20,
  },
  loader: {
    marginTop: 60,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 40,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statValue: {
    fontSize: fontSizes.h4,
    fontWeight: '700',
  },
  statValueLarge: {
    fontSize: fontSizes.h3,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.surfaceMuted,
    marginVertical: 4,
  },
  section: {
    gap: 10,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  entryLeft: {
    flex: 1,
    gap: 3,
  },
  entryTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  entryName: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },
  photoButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBadge: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  photoBadgeText: {
    fontSize: fontSizes.xxs,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  entryNote: {
    fontSize: fontSizes.md,
    color: colors.textMuted,
    lineHeight: 18,
  },
  entryDate: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  entryPoints: {
    fontSize: fontSizes.xxl,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'right',
  },
  emptyCard: {
    paddingVertical: 32,
  },
});
