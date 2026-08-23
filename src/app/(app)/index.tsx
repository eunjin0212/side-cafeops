import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { signOut } from '@/services/authService';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { useMyScores, EnrichedEntry } from '@/hooks/useMyScores';
import { useMyLocationRanks } from '@/hooks/useMyLocationRanks';
import { LocationTabs } from '@/components/molecules/LocationTabs';
import { can } from '@/constants/permissions';
import { ROLE_LABELS } from '@/constants/roles';
import { SCORE_SECTION_LABELS } from '@/constants/scoreSections';
import { BASE_SCORE } from '@/constants/scoring';

// ─── helpers ────────────────────────────────────────────────

function formatPoints(pts: number): string {
  return pts > 0 ? `+${pts}` : String(pts);
}

function pointsColor(pts: number): string {
  if (pts > 0) return '#16A34A';
  if (pts < 0) return '#DC2626';
  return '#6B7280';
}

function pointsBg(pts: number): string {
  if (pts > 0) return '#DCFCE7';
  if (pts < 0) return '#FEE2E2';
  return '#F3F4F6';
}

function rankBadgeStyle(rank: number): { bg: string; text: string } {
  if (rank === 1) return { bg: '#F59E0B', text: '#fff' };
  if (rank === 2) return { bg: '#9CA3AF', text: '#fff' };
  if (rank === 3) return { bg: '#B45309', text: '#fff' };
  return { bg: '#F3F4F6', text: '#6B7280' };
}

function formatEntryDateTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(d, now)) return `Today, ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(d, yesterday)) return `Yesterday, ${time}`;

  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`;
}

function getInitial(fullName: string | null, email: string): string {
  const source = fullName && fullName.trim().length > 0 ? fullName : email;
  return source.charAt(0).toUpperCase();
}

function formatLocationsLabel(locations: { id: string; name: string }[]): string | null {
  if (locations.length === 0) return null;
  if (locations.length <= 2) return locations.map((l) => l.name).join(', ');
  return `${locations.length} Locations`;
}

function locationNetPoints(entries: EnrichedEntry[], locationId: string): number {
  return entries
    .filter((e) => e.locationId === locationId)
    .reduce((sum, e) => sum + e.points, 0);
}

// ─── sub-components ─────────────────────────────────────────

interface ActivityRowProps {
  entry: EnrichedEntry;
  isLast: boolean;
}

function ActivityRow({ entry, isLast }: ActivityRowProps) {
  return (
    <View>
      <View style={styles.activityRow}>
        <View style={[styles.pointsBadge, { backgroundColor: pointsBg(entry.points) }]}>
          <Text style={[styles.pointsBadgeText, { color: pointsColor(entry.points) }]}>
            {formatPoints(entry.points)}
          </Text>
        </View>

        <View style={styles.activityMain}>
          <Text style={styles.activityName} numberOfLines={1}>
            {entry.categoryName}
          </Text>
          <Text style={styles.activityMeta} numberOfLines={1}>
            {SCORE_SECTION_LABELS[entry.section]}
            {entry.locationName ? ` · ${entry.locationName}` : ''} ·{' '}
            {formatEntryDateTime(entry.createdAt)}
          </Text>
        </View>

        <View style={styles.activityIcons}>
          {entry.imageUrls.length > 0 && <Text style={styles.activityIcon}>📷</Text>}
          {entry.notes !== null && <Text style={styles.activityIcon}>📝</Text>}
        </View>
      </View>
      {!isLast && <View style={styles.divider} />}
    </View>
  );
}

interface NavCardProps {
  label: string;
  icon: string;
  onPress: () => void;
}

function NavCard({ label, icon, onPress }: NavCardProps) {
  return (
    <Pressable style={styles.navCard} onPress={onPress}>
      <Text style={styles.navCardIcon}>{icon}</Text>
      <Text style={styles.navCardText}>{label}</Text>
    </Pressable>
  );
}

interface LocationScoreCardProps {
  locationName: string;
  score: number;
  rank: number | null;
  total: number;
  onPress: () => void;
}

function LocationScoreCard({ locationName, score, rank, total, onPress }: LocationScoreCardProps) {
  const badge = rank !== null ? rankBadgeStyle(rank) : { bg: '#F3F4F6', text: '#9CA3AF' };

  return (
    <Pressable style={styles.locationCard} onPress={onPress}>
      <View style={styles.locationCardTop}>
        <View>
          <Text style={styles.locationCardLabel}>{locationName}</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
        <View style={[styles.rankBadgeCircle, { backgroundColor: badge.bg }]}>
          <Text style={[styles.rankBadgeNumber, { color: badge.text }]}>
            {rank !== null ? `#${rank}` : '–'}
          </Text>
        </View>
      </View>
      <View style={styles.cardDivider} />
      <View style={styles.viewScoresRow}>
        <Text style={styles.viewScoresText}>
          {rank !== null ? `Rank #${rank} of ${total}` : 'View My Scores'}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
}

// ─── screen ─────────────────────────────────────────────────

export default function HomeScreen() {
  const { profile } = useCurrentProfile();
  const { entries, isLoading, error } = useMyScores();
  const locations = profile?.locations ?? [];
  const myLocationRanks = useMyLocationRanks(profile?.id, locations);

  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(undefined);

  const queryClient = useQueryClient();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  async function handleSignOut(): Promise<void> {
    setSignOutError(null);
    setIsSigningOut(true);
    try {
      await signOut();
      queryClient.clear();
    } catch {
      setSignOutError('Failed to sign out. Please try again.');
      setIsSigningOut(false);
    }
  }

  const showScoreDashboard = profile !== null && profile.role !== 'owner';
  const recentEntries = entries.slice(0, 3);
  const locationsLabel = profile ? formatLocationsLabel(profile.locations) : null;

  const effectiveLocationId = selectedLocationId ?? profile?.locationId ?? locations[0]?.id;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <Text style={styles.appTitle}>CafeOps</Text>

      <View style={styles.profileRow}>
        {profile?.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>
              {profile ? getInitial(profile.fullName, profile.email) : '?'}
            </Text>
          </View>
        )}
        <View style={styles.profileText}>
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

      {/* Score dashboard — not shown for owner */}
      {showScoreDashboard && (
        <>
          {locations.length > 1 && (
            <LocationTabs
              locations={locations}
              selectedId={effectiveLocationId}
              onSelect={setSelectedLocationId}
            />
          )}

          {(() => {
            const loc = locations.find((l) => l.id === effectiveLocationId);
            const lr = myLocationRanks.find((r) => r.locationId === effectiveLocationId);
            if (!loc || !lr || lr.isLoading) return null;
            return (
              <LocationScoreCard
                locationName={loc.name}
                score={BASE_SCORE + locationNetPoints(entries, loc.id)}
                rank={lr.rank}
                total={lr.total}
                onPress={() => router.navigate('/scores/my')}
              />
            );
          })()}

          {/* Recent Activity */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <Pressable onPress={() => router.navigate('/scores/my')}>
                <Text style={styles.viewAllText}>View All</Text>
              </Pressable>
            </View>

            {isLoading ? (
              <ActivityIndicator style={styles.loader} />
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : recentEntries.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No recent activity.</Text>
              </View>
            ) : (
              <View style={styles.listCard}>
                {recentEntries.map((entry, idx) => (
                  <ActivityRow
                    key={entry.id}
                    entry={entry}
                    isLast={idx === recentEntries.length - 1}
                  />
                ))}
              </View>
            )}
          </View>
        </>
      )}

      {/* Existing navigation actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manage</Text>
        <View style={styles.navGrid}>
          <NavCard
            label="Employees"
            icon="👥"
            onPress={() => router.navigate('/employees')}
          />
          <NavCard
            label="Leaderboard"
            icon="🏆"
            onPress={() => router.navigate('/scores/leaderboard')}
          />
          {profile !== null && can(profile.role, 'manageScores') && (
            <NavCard
              label="Score Entry"
              icon="✏️"
              onPress={() => router.navigate('/scores/entry')}
            />
          )}
          {profile !== null && can(profile.role, 'manageScoreCategories') && (
            <NavCard
              label="Score Categories"
              icon="🗂️"
              onPress={() => router.navigate('/scores/categories')}
            />
          )}
        </View>
      </View>

      {signOutError !== null && <Text style={styles.errorText}>{signOutError}</Text>}

      <Pressable
        style={[styles.signOutButton, isSigningOut && styles.signOutButtonDisabled]}
        onPress={handleSignOut}
        disabled={isSigningOut}
      >
        {isSigningOut ? (
          <ActivityIndicator color="#EF4444" />
        ) : (
          <Text style={styles.signOutText}>Sign Out</Text>
        )}
      </Pressable>
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
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  profileRow: {
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
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  profileText: {
    gap: 2,
  },
  greeting: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
  },
  subGreeting: {
    fontSize: 13,
    color: '#6B7280',
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 18,
    gap: 16,
  },
  locationCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  locationCardLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: '800',
    color: '#111827',
  },
  rankBadgeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rankBadgeNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  viewScoresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewScoresText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  chevron: {
    fontSize: 20,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  loader: {
    marginVertical: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  activityRow: {
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
    fontSize: 13,
    fontWeight: '700',
  },
  activityMain: {
    flex: 1,
    gap: 2,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  activityMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  activityIcons: {
    flexDirection: 'row',
    gap: 6,
  },
  activityIcon: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 14,
  },
  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  navCard: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  navCardIcon: {
    fontSize: 18,
  },
  navCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  signOutButton: {
    marginTop: 4,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EF4444',
    alignItems: 'center',
  },
  signOutButtonDisabled: {
    opacity: 0.5,
  },
  signOutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
});
