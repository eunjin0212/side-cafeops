import { useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useMyScores, EnrichedEntry } from '@/hooks/useMyScores';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { LocationTabs } from '@/components/molecules/LocationTabs';
import { ListCard } from '@/components/molecules/ListCard';
import { EmptyState } from '@/components/molecules/EmptyState';
import { formatPoints, pointsColor } from '@/utils/points';

// ─── helpers ────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCycleDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

type LocationStats = {
  entries: EnrichedEntry[];
  positive: number;
  negative: number;
  score: number;
};

function computeLocationStats(
  entries: EnrichedEntry[],
  locationId: string,
  base: number,
): LocationStats {
  const locEntries = entries.filter((e) => e.locationId === locationId);
  const positive = locEntries.reduce((sum, e) => (e.points > 0 ? sum + e.points : sum), 0);
  const negative = locEntries.reduce((sum, e) => (e.points < 0 ? sum + e.points : sum), 0);
  return { entries: locEntries, positive, negative, score: base + positive + negative };
}

// ─── sub-components ─────────────────────────────────────────

interface StatColProps {
  label: string;
  value: string;
  color?: string;
  large?: boolean;
}

function StatCol({ label, value, color = '#111827', large = false }: StatColProps) {
  return (
    <View style={styles.statCol}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }, large && styles.statValueLarge]}>
        {value}
      </Text>
    </View>
  );
}

interface EntryRowProps {
  entry: EnrichedEntry;
}

function EntryRow({ entry }: EntryRowProps) {
  return (
    <View style={styles.entryRow}>
      <View style={styles.entryLeft}>
        <View style={styles.entryTopLine}>
          <Text style={styles.entryName} numberOfLines={1}>
            {entry.categoryName}
          </Text>
          {entry.imageUrls.length > 0 && (
            <View style={styles.photoBadge}>
              <Text style={styles.photoBadgeText}>Photo</Text>
            </View>
          )}
        </View>
        {entry.notes !== null && (
          <Text style={styles.entryNote} numberOfLines={2}>
            {entry.notes}
          </Text>
        )}
        <Text style={styles.entryDate}>{formatDate(entry.createdAt)}</Text>
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

  const cycleLabel =
    cycle
      ? `${formatCycleDate(cycle.startedAt)} – ${formatCycleDate(cycle.endedAt)}`
      : null;

  const locations = profile?.locations ?? [];
  const effectiveLocationId = selectedLocationId ?? profile?.locationId ?? locations[0]?.id;
  const stats = effectiveLocationId
    ? computeLocationStats(entries, effectiveLocationId, base)
    : null;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={isFetching && !isLoading}
          onRefresh={refetch}
        />
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
        <ActivityIndicator style={styles.loader} size="large" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
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
              color={stats.positive > 0 ? '#16A34A' : '#6B7280'}
            />
            <View style={styles.statDivider} />
            <StatCol
              label="Negative"
              value={stats.negative < 0 ? String(stats.negative) : '0'}
              color={stats.negative < 0 ? '#DC2626' : '#6B7280'}
            />
            <View style={styles.statDivider} />
            <StatCol
              label="Score"
              value={String(stats.score)}
              color={stats.score >= base ? '#111827' : '#DC2626'}
              large
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Entries</Text>

            {stats.entries.length === 0 ? (
              <EmptyState style={styles.emptyCard}>No entries this cycle.</EmptyState>
            ) : (
              <ListCard>
                {stats.entries.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} />
                ))}
              </ListCard>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

// ─── styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 40,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statValueLarge: {
    fontSize: 22,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 4,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flexShrink: 1,
  },
  photoBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  photoBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  entryNote: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  entryDate: {
    fontSize: 11,
    color: '#D1D5DB',
    marginTop: 1,
  },
  entryPoints: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'right',
  },
  emptyCard: {
    paddingVertical: 32,
  },
});
