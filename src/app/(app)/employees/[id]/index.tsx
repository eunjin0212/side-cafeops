import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ActiveBadge } from '@/components/molecules/ActiveBadge';
import { CenteredScreen } from '@/components/molecules/CenteredScreen';
import { EmptyText } from '@/components/molecules/EmptyText';
import { ErrorText } from '@/components/molecules/ErrorText';
import { LoadingScreen } from '@/components/molecules/LoadingScreen';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { ScreenTitle } from '@/components/molecules/ScreenTitle';
import {
  canEditEmployeeRole,
  canEditEmployeeLocation,
  canEditOwnProfile,
  canScoreEmployee,
  can,
} from '@/constants/permissions';
import { ROLE_LABELS } from '@/constants/roles';
import { colors, fontSizes } from '@/constants/theme';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { useEmployee } from '@/hooks/useEmployee';
import { formatDotDate } from '@/utils/dates';

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function EmployeeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { employee, isLoading, error } = useEmployee(id);
  const { profile: currentProfile } = useCurrentProfile();

  const showEditButton =
    currentProfile !== null &&
    employee !== null &&
    (canEditOwnProfile(currentProfile.id, id) ||
      canEditEmployeeRole(currentProfile.role, employee.role) ||
      canEditEmployeeLocation(currentProfile.role, employee.role));

  const showScoreButton =
    currentProfile !== null &&
    employee !== null &&
    currentProfile.id !== id &&
    can(currentProfile.role, 'manageScores') &&
    canScoreEmployee(currentProfile.role, employee.role);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <CenteredScreen>
        <ErrorText>{error}</ErrorText>
      </CenteredScreen>
    );
  }

  if (!employee) {
    return (
      <CenteredScreen>
        <EmptyText>Employee not found.</EmptyText>
      </CenteredScreen>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={styles.headerSpacer}>
        <ScreenHeader
          backHref="/employees"
          right={
            <>
              {showScoreButton && (
                <Pressable
                  role="link"
                  aria-label={`Score ${employee.fullName ?? employee.email}`}
                  style={styles.headerAction}
                  onPress={() => router.navigate(`/scores/entry?profileId=${id}`)}
                  hitSlop={8}
                >
                  <Text style={styles.scoreText}>Score</Text>
                </Pressable>
              )}
              {showEditButton && (
                <Pressable
                  role="link"
                  aria-label={`Edit ${employee.fullName ?? employee.email}`}
                  style={styles.headerAction}
                  onPress={() => router.navigate(`/employees/${id}/edit`)}
                  hitSlop={8}
                >
                  <Text style={styles.editText}>Edit</Text>
                </Pressable>
              )}
            </>
          }
        />
      </View>

      <View style={styles.profile}>
        <ScreenTitle style={styles.name}>{employee.fullName ?? employee.email}</ScreenTitle>
        <View style={styles.badges}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{ROLE_LABELS[employee.role]}</Text>
          </View>
          <ActiveBadge isActive={employee.isActive} />
        </View>
      </View>

      <View style={styles.section}>
        <InfoRow label="Email" value={employee.email} />
        <View style={styles.divider} />
        <InfoRow label="Phone" value={employee.phone ?? 'Not set'} />
        <View style={styles.divider} />
        <InfoRow
          label="Location"
          value={
            employee.locations.length > 0
              ? employee.locations.map((l) => l.locationName).join(', ')
              : 'Unassigned'
          }
        />
        <View style={styles.divider} />
        <InfoRow label="Joined" value={formatDotDate(employee.createdAt)} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerSpacer: {
    marginBottom: 28,
  },
  headerAction: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: fontSizes.xl,
    color: colors.text,
    fontWeight: '600',
  },
  editText: {
    fontSize: fontSizes.xl,
    color: colors.text,
    fontWeight: '600',
  },
  profile: {
    marginBottom: 32,
    gap: 10,
  },
  name: {
    fontSize: fontSizes.h3,
    fontWeight: '700',
    color: colors.text,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
  },
  roleBadgeText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  section: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoLabel: {
    fontSize: fontSizes.lg,
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: fontSizes.lg,
    fontWeight: '500',
    color: colors.text,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceMuted,
    marginHorizontal: 16,
  },
});
