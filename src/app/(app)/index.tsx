import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ActivityRow } from '@/components/molecules/ActivityRow';
import { EmptyState } from '@/components/molecules/EmptyState';
import { ErrorText } from '@/components/molecules/ErrorText';
import { ListCard } from '@/components/molecules/ListCard';
import { LocationScoreCard } from '@/components/molecules/LocationScoreCard';
import { LocationTabs } from '@/components/molecules/LocationTabs';
import { NavCard } from '@/components/molecules/NavCard';
import { PhotoViewerModal } from '@/components/molecules/PhotoViewerModal';
import { ProfileSummary } from '@/components/molecules/ProfileSummary';
import { ScreenTitle } from '@/components/molecules/ScreenTitle';
import { SectionLabel } from '@/components/molecules/SectionLabel';
import { can } from '@/constants/permissions';
import { BASE_SCORE } from '@/constants/scoring';
import { colors, fontSizes } from '@/constants/theme';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { useMyLocationRanks } from '@/hooks/useMyLocationRanks';
import { useMyScores } from '@/hooks/useMyScores';
import { useNotifications } from '@/hooks/useNotifications';
import { usePushNotificationRegistration } from '@/hooks/usePushNotificationRegistration';
import { useSignOut } from '@/hooks/useSignOut';
import { computeLocationStats } from '@/utils/scoreStats';

export default function HomeScreen() {
  const { profile } = useCurrentProfile();
  const { entries, isLoading, error } = useMyScores();
  const { unreadCount } = useNotifications();
  const { webPushPermission, requestWebPushPermission, subscribeError } =
    usePushNotificationRegistration();
  const locations = profile?.locations ?? [];
  const myLocationRanks = useMyLocationRanks(profile?.id, locations);

  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(undefined);
  const [viewingPhotos, setViewingPhotos] = useState<string[] | null>(null);

  const { mutate: signOut, isPending: isSigningOut, error: signOutFailure } = useSignOut();
  const signOutError = signOutFailure?.message ?? null;

  function handleSignOut(): void {
    signOut();
  }

  const showScoreDashboard = profile !== null && can(profile.role, 'viewScoreDashboard');

  const effectiveLocationId = selectedLocationId ?? profile?.locationId ?? locations[0]?.id;
  const recentEntries = entries.filter((e) => e.locationId === effectiveLocationId).slice(0, 3);
  const activeLocation = locations.find((l) => l.id === effectiveLocationId);
  const activeRank = myLocationRanks.find((r) => r.locationId === effectiveLocationId);

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.titleRow}>
          <ScreenTitle style={styles.appTitle} documentTitle="Home · Twilight Cafe">
            Twilight Cafe
          </ScreenTitle>
          <Pressable
            role="link"
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            style={styles.bellButton}
            onPress={() => router.navigate('/notifications')}
            hitSlop={8}
          >
            <Text style={styles.bellIcon} aria-hidden>
              🔔
            </Text>
            {unreadCount > 0 && (
              <View style={styles.bellBadge} aria-hidden>
                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {webPushPermission === 'default' && (
          <Pressable
            role="button"
            aria-label="Turn on notifications"
            style={styles.notifyBanner}
            onPress={requestWebPushPermission}
          >
            <Text style={styles.notifyBannerText}>🔔 Turn on notifications</Text>
            <Text style={styles.notifyBannerChevron} aria-hidden>
              ›
            </Text>
          </Pressable>
        )}
        {subscribeError !== null && (
          <ErrorText style={styles.notifyError}>{subscribeError}</ErrorText>
        )}

        <ProfileSummary profile={profile} />

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

            {activeLocation && activeRank && !activeRank.isLoading && (
              <LocationScoreCard
                locationName={activeLocation.name}
                score={computeLocationStats(entries, activeLocation.id, BASE_SCORE).score}
                rank={activeRank.rank}
                total={activeRank.total}
                onPress={() => router.navigate('/scores/my')}
              />
            )}

            {/* Recent Activity */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <SectionLabel>Recent Activity</SectionLabel>
                <Pressable
                  role="link"
                  aria-label="View all recent activity"
                  style={styles.viewAllButton}
                  onPress={() => router.navigate('/scores/my')}
                >
                  <Text style={styles.viewAllText}>View All</Text>
                </Pressable>
              </View>

              {isLoading ? (
                <ActivityIndicator aria-label="Loading" style={styles.loader} />
              ) : error ? (
                <ErrorText style={styles.errorText}>{error}</ErrorText>
              ) : recentEntries.length === 0 ? (
                <EmptyState>No recent activity.</EmptyState>
              ) : (
                <ListCard dividerInset={14}>
                  {recentEntries.map((entry) => (
                    <ActivityRow key={entry.id} entry={entry} onViewPhotos={setViewingPhotos} />
                  ))}
                </ListCard>
              )}
            </View>
          </>
        )}

        {/* Existing navigation actions */}
        <View style={styles.section}>
          <SectionLabel>Manage</SectionLabel>
          <View style={styles.navGrid}>
            <NavCard label="Employees" icon="👥" onPress={() => router.navigate('/employees')} />
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

        {signOutError !== null && <ErrorText style={styles.errorText}>{signOutError}</ErrorText>}

        <Pressable
          role="button"
          aria-label="Sign Out"
          style={[styles.signOutButton, isSigningOut && styles.signOutButtonDisabled]}
          onPress={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <ActivityIndicator aria-label="Loading" color={colors.dangerAccent} />
          ) : (
            <Text style={styles.signOutText}>Sign Out</Text>
          )}
        </Pressable>
      </ScrollView>
      <PhotoViewerModal imageUrls={viewingPhotos} onClose={() => setViewingPhotos(null)} />
    </>
  );
}

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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appTitle: {
    fontSize: fontSizes.h2,
    fontWeight: '700',
    color: colors.text,
  },
  bellButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    fontSize: fontSizes.h3,
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    fontSize: fontSizes.xxs,
    fontWeight: '700',
    color: colors.white,
  },
  notifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.linkSurface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
  },
  notifyBannerText: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.link,
  },
  notifyBannerChevron: {
    fontSize: fontSizes.xxl,
    color: colors.link,
  },
  notifyError: {
    marginTop: 6,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewAllButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  viewAllText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.link,
  },
  loader: {
    marginVertical: 16,
  },
  errorText: {
    fontSize: fontSizes.md,
    textAlign: 'center',
  },
  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  signOutButton: {
    marginTop: 4,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.dangerAccent,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  signOutButtonDisabled: {
    opacity: 0.5,
  },
  signOutText: {
    color: colors.danger,
    fontSize: fontSizes.xl,
    fontWeight: '600',
  },
});
