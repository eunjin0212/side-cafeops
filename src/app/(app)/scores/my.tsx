import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useMyScores, EnrichedEntry } from '@/hooks/useMyScores';
import { goBack } from '@/utils/navigation';

// ─── helpers ────────────────────────────────────────────────

function formatPoints(pts: number): string {
  if (pts > 0) return `+${pts}`;
  return String(pts);
}

function pointsColor(pts: number): string {
  if (pts > 0) return '#16A34A';
  if (pts < 0) return '#DC2626';
  return '#6B7280';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCycleDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
  isLast: boolean;
}

function EntryRow({ entry, isLast }: EntryRowProps) {
  return (
    <View>
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
      {!isLast && <View style={styles.divider} />}
    </View>
  );
}

// ─── screen ─────────────────────────────────────────────────

export default function MyScoreScreen() {
  const {
    cycle,
    entries,
    base,
    positivePoints,
    negativePoints,
    performanceScore,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useMyScores();

  const cycleLabel =
    cycle
      ? `${formatCycleDate(cycle.startedAt)} – ${formatCycleDate(cycle.endedAt)}`
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
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => goBack('/')} hitSlop={8}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <View style={styles.headerRight}>
          <Text style={styles.title}>My Scores</Text>
          {cycleLabel && <Text style={styles.cycleLabel}>{cycleLabel}</Text>}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <>
          {/* Stats card */}
          <View style={styles.statsCard}>
            <StatCol label="Base" value={String(base)} />
            <View style={styles.statDivider} />
            <StatCol
              label="Positive"
              value={positivePoints > 0 ? `+${positivePoints}` : '0'}
              color={positivePoints > 0 ? '#16A34A' : '#6B7280'}
            />
            <View style={styles.statDivider} />
            <StatCol
              label="Negative"
              value={negativePoints < 0 ? String(negativePoints) : '0'}
              color={negativePoints < 0 ? '#DC2626' : '#6B7280'}
            />
            <View style={styles.statDivider} />
            <StatCol
              label="Score"
              value={String(performanceScore)}
              color={performanceScore >= base ? '#111827' : '#DC2626'}
              large
            />
          </View>

          {/* Entries */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Entries</Text>

            {entries.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No entries this cycle.</Text>
              </View>
            ) : (
              <View style={styles.listCard}>
                {entries.map((entry, idx) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    isLast={idx === entries.length - 1}
                  />
                ))}
              </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  backText: {
    fontSize: 15,
    color: '#6B7280',
    paddingTop: 3,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  cycleLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
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
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
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
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
