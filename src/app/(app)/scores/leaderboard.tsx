import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useLocations } from '@/hooks/useLocations';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { ROLE_LABELS } from '@/constants/roles';
import { goBack } from '@/utils/navigation';
import { LeaderboardEntry } from '@/types/leaderboard';
import { useState } from 'react';

function formatCycleDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatPoints(pts: number): string {
  if (pts > 0) return `+${pts}`;
  return String(pts);
}

function pointsColor(pts: number): string {
  if (pts > 0) return '#16A34A';
  if (pts < 0) return '#DC2626';
  return '#9CA3AF';
}

function rankBadgeStyle(rank: number): {
  bg: string;
  text: string;
  size: number;
} {
  if (rank === 1) return { bg: '#F59E0B', text: '#fff', size: 32 };
  if (rank === 2) return { bg: '#9CA3AF', text: '#fff', size: 30 };
  if (rank === 3) return { bg: '#B45309', text: '#fff', size: 30 };
  return { bg: '#F3F4F6', text: '#6B7280', size: 28 };
}

interface EntryRowProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}

function EntryRow({ entry, isCurrentUser }: EntryRowProps) {
  const badge = rankBadgeStyle(entry.rank);
  const displayName = entry.fullName ?? entry.email;

  return (
    <View style={[styles.row, isCurrentUser && styles.rowHighlight]}>
      <View
        style={[
          styles.rankBadge,
          { width: badge.size, height: badge.size, backgroundColor: badge.bg },
        ]}
      >
        <Text style={[styles.rankText, { color: badge.text, fontSize: entry.rank < 10 ? 13 : 11 }]}>
          {entry.rank}
        </Text>
      </View>

      <View style={styles.rowInfo}>
        <View style={styles.rowNameRow}>
          <Text style={styles.rowName} numberOfLines={1}>
            {displayName}
          </Text>
          {isCurrentUser && <View style={styles.youBadge}><Text style={styles.youText}>You</Text></View>}
        </View>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {ROLE_LABELS[entry.role]}
          {entry.locationName ? ` · ${entry.locationName}` : ''}
        </Text>
      </View>

      <Text style={[styles.points, { color: pointsColor(entry.totalPoints) }]}>
        {formatPoints(entry.totalPoints)}
      </Text>
    </View>
  );
}

export default function LeaderboardScreen() {
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(undefined);

  const { entries, cycle, isLoading, isFetching, error, refetch } =
    useLeaderboard(selectedLocationId);
  const { locations } = useLocations();
  const { profile: currentProfile } = useCurrentProfile();

  const cycleLabel =
    cycle
      ? `${formatCycleDate(cycle.startedAt)} – ${formatCycleDate(cycle.endedAt)}`
      : 'Current Cycle';

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => goBack('/')} hitSlop={8}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <View style={styles.headerRight}>
            <Text style={styles.title}>Leaderboard</Text>
            <Text style={styles.cycleLabel}>{cycleLabel}</Text>
          </View>
        </View>

        {/* Location filter */}
        {locations.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            <Pressable
              style={[styles.filterChip, !selectedLocationId && styles.filterChipActive]}
              onPress={() => setSelectedLocationId(undefined)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  !selectedLocationId && styles.filterChipTextActive,
                ]}
              >
                All
              </Text>
            </Pressable>
            {locations.map((loc) => (
              <Pressable
                key={loc.id}
                style={[
                  styles.filterChip,
                  selectedLocationId === loc.id && styles.filterChipActive,
                ]}
                onPress={() => setSelectedLocationId(loc.id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedLocationId === loc.id && styles.filterChipTextActive,
                  ]}
                >
                  {loc.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Content */}
        {isLoading ? (
          <ActivityIndicator style={styles.loader} size="large" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : entries.length === 0 ? (
          <Text style={styles.emptyText}>No employees found.</Text>
        ) : (
          <View style={styles.listCard}>
            {entries.map((entry, idx) => (
              <View key={entry.profileId}>
                {idx > 0 && <View style={styles.divider} />}
                <EntryRow
                  entry={entry}
                  isCurrentUser={entry.profileId === currentProfile?.id}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 40,
    gap: 16,
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
  filterRow: {
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  filterChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#fff',
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
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 40,
  },
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  rowHighlight: {
    backgroundColor: '#FEFCE8',
  },
  rankBadge: {
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rankText: {
    fontWeight: '700',
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flexShrink: 1,
  },
  youBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  youText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3B82F6',
  },
  rowMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  points: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
});
