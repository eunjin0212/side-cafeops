import { useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CycleSelector } from '@/components/molecules/CycleSelector';
import { EmptyText } from '@/components/molecules/EmptyText';
import { ErrorText } from '@/components/molecules/ErrorText';
import { ListCard } from '@/components/molecules/ListCard';
import { LocationTabs } from '@/components/molecules/LocationTabs';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { can } from '@/constants/permissions';
import { ROLE_LABELS } from '@/constants/roles';
import { BASE_SCORE } from '@/constants/scoring';
import { colors, fontSizes } from '@/constants/theme';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useLocations } from '@/hooks/useLocations';
import { useScoreCycles } from '@/hooks/useScoreCycles';
import { LeaderboardEntry } from '@/types/leaderboard';
import { formatMonthDay } from '@/utils/dates';
import { rankBadgeColors } from '@/utils/points';

// Colors a displayed score against the base, unlike utils/points' pointsColor,
// which colors a point change against zero.
function scoreColor(pts: number): string {
  if (pts > BASE_SCORE) return colors.success;
  if (pts < BASE_SCORE) return colors.dangerStrong;
  return colors.textMuted;
}

function rankBadgeSize(rank: number): number {
  if (rank === 1) return 32;
  return rank <= 3 ? 30 : 28;
}

interface EntryRowProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}

function EntryRow({ entry, isCurrentUser }: EntryRowProps) {
  const badge = rankBadgeColors(entry.rank);
  const badgeSize = rankBadgeSize(entry.rank);
  const displayName = entry.fullName ?? entry.email;

  return (
    <View
      role="group"
      aria-label={`Rank ${entry.rank}: ${displayName}${isCurrentUser ? ' (you)' : ''}, score ${entry.totalPoints}`}
      style={[styles.row, isCurrentUser && styles.rowHighlight]}
    >
      <View
        style={[
          styles.rankBadge,
          { width: badgeSize, height: badgeSize, backgroundColor: badge.bg },
        ]}
      >
        <Text
          style={[
            styles.rankText,
            { color: badge.text, fontSize: entry.rank < 10 ? fontSizes.md : fontSizes.xs },
          ]}
        >
          {entry.rank}
        </Text>
      </View>

      <View style={styles.rowInfo}>
        <View style={styles.rowNameRow}>
          <Text style={styles.rowName} numberOfLines={1}>
            {displayName}
          </Text>
          {isCurrentUser && (
            <View style={styles.youBadge}>
              <Text style={styles.youText}>You</Text>
            </View>
          )}
        </View>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {ROLE_LABELS[entry.role]}
          {entry.locationName ? ` · ${entry.locationName}` : ''}
        </Text>
      </View>

      <Text style={[styles.points, { color: scoreColor(entry.totalPoints) }]}>
        {entry.totalPoints}
      </Text>
    </View>
  );
}

export default function LeaderboardScreen() {
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(undefined);

  const [selectedCycleId, setSelectedCycleId] = useState<string | undefined>(undefined);

  const { entries, isLoading, isFetching, error, refetch } = useLeaderboard(
    selectedLocationId,
    selectedCycleId,
  );
  const { cycles } = useScoreCycles();
  const { locations: allLocations } = useLocations();
  const { profile: currentProfile } = useCurrentProfile();
  const canBrowseAllLocations =
    currentProfile !== null && can(currentProfile.role, 'browseAllLocations');

  // GM/owner may filter across every location; everyone else may only
  // switch between the locations they themselves work at (if more than one).
  const filterLocations = canBrowseAllLocations ? allLocations : (currentProfile?.locations ?? []);

  // Newest first, so with nothing selected this is the current cycle.
  const cycleIndex = selectedCycleId ? cycles.findIndex((c) => c.id === selectedCycleId) : 0;
  const cycle = cycles[cycleIndex];
  const previousCycle = cycles[cycleIndex + 1];
  const nextCycle = cycles[cycleIndex - 1];

  const cycleLabel = cycle
    ? `${formatMonthDay(cycle.startedAt)} – ${formatMonthDay(cycle.endedAt)}`
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
        <ScreenHeader backHref="/" title="Leaderboard" />

        <CycleSelector
          label={cycleLabel}
          onPrevious={previousCycle ? () => setSelectedCycleId(previousCycle.id) : undefined}
          onNext={nextCycle ? () => setSelectedCycleId(nextCycle.id) : undefined}
          onCurrent={nextCycle ? () => setSelectedCycleId(undefined) : undefined}
        />

        {/* Location filter — GM/owner browse every location; everyone
            else may only switch between locations they work at */}
        {filterLocations.length > 1 && (
          <LocationTabs
            locations={filterLocations}
            selectedId={selectedLocationId}
            onSelect={setSelectedLocationId}
            showAll
          />
        )}

        {/* Content */}
        {isLoading ? (
          <ActivityIndicator aria-label="Loading" style={styles.loader} size="large" />
        ) : error ? (
          <ErrorText style={styles.errorText}>{error}</ErrorText>
        ) : entries.length === 0 ? (
          <EmptyText style={styles.emptyText}>No employees found.</EmptyText>
        ) : (
          <ListCard>
            {entries.map((entry) => (
              <EntryRow
                key={`${entry.profileId}-${entry.locationId}`}
                entry={entry}
                isCurrentUser={entry.profileId === currentProfile?.id}
              />
            ))}
          </ListCard>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
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
  loader: {
    marginTop: 60,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  rowHighlight: {
    backgroundColor: colors.highlight,
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
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },
  youBadge: {
    backgroundColor: colors.linkSurface,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  youText: {
    fontSize: fontSizes.xxs,
    fontWeight: '700',
    color: colors.link,
  },
  rowMeta: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  points: {
    fontSize: fontSizes.xxl,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'right',
  },
});
