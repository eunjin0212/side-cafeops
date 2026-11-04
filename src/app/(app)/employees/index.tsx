import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ActiveBadge } from '@/components/molecules/ActiveBadge';
import { CenteredScreen } from '@/components/molecules/CenteredScreen';
import { EmptyText } from '@/components/molecules/EmptyText';
import { ErrorText } from '@/components/molecules/ErrorText';
import { LoadingScreen } from '@/components/molecules/LoadingScreen';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { can } from '@/constants/permissions';
import { ROLE_LABELS } from '@/constants/roles';
import { colors, fontSizes } from '@/constants/theme';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { useEmployees } from '@/hooks/useEmployees';
import { Employee } from '@/types/employee';

interface EmployeeRowProps {
  employee: Employee;
  onPress: () => void;
}

function EmployeeRow({ employee, onPress }: EmployeeRowProps) {
  return (
    <Pressable role="link" style={styles.row} onPress={onPress}>
      <View style={styles.rowMain}>
        <Text style={styles.name}>{employee.fullName ?? employee.email}</Text>
        <Text style={styles.role}>
          {ROLE_LABELS[employee.role]}
          {employee.locations.length > 0
            ? `  ·  ${employee.locations.map((l) => l.locationName).join(', ')}`
            : ''}
        </Text>
      </View>
      <ActiveBadge isActive={employee.isActive} />
    </Pressable>
  );
}

export default function EmployeeListScreen() {
  const { employees, isLoading, error } = useEmployees();
  const { profile } = useCurrentProfile();
  const canInvite = profile !== null && can(profile.role, 'inviteEmployee');

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ScreenHeader
          backHref="/"
          title="Employees"
          right={
            <>
              <Pressable
                role="link"
                style={styles.headerLinkButton}
                onPress={() => router.navigate('/employees/invitations')}
              >
                <Text style={styles.headerLink}>Invitations</Text>
              </Pressable>
              {canInvite && (
                <Pressable
                  role="link"
                  style={styles.inviteButton}
                  onPress={() => router.navigate('/employees/invite')}
                >
                  <Text style={styles.inviteButtonText}>Invite</Text>
                </Pressable>
              )}
            </>
          }
        />
      </View>
      <FlatList
        style={styles.list}
        data={employees}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EmployeeRow employee={item} onPress={() => router.navigate(`/employees/${item.id}`)} />
        )}
        ListEmptyComponent={
          <CenteredScreen>
            <EmptyText>No employees yet.</EmptyText>
          </CenteredScreen>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={employees.length === 0 ? styles.emptyContainer : styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.white,
  },
  headerLinkButton: {
    minHeight: 44,
    justifyContent: 'center',
  },
  headerLink: {
    fontSize: fontSizes.md,
    color: colors.textMuted,
  },
  inviteButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: colors.text,
    borderRadius: 8,
  },
  inviteButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.white,
  },
  list: {
    flex: 1,
    backgroundColor: colors.white,
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  rowMain: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: fontSizes.xxl,
    fontWeight: '600',
    color: colors.text,
  },
  role: {
    fontSize: fontSizes.md,
    color: colors.textMuted,
  },
  separator: {
    height: 1,
    backgroundColor: colors.surfaceMuted,
    marginHorizontal: 20,
  },
});
