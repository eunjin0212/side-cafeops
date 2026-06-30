import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { useEmployees } from '@/hooks/useEmployees';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { Employee } from '@/types/employee';
import { ROLE_LABELS } from '@/constants/roles';
import { can } from '@/constants/permissions';

interface EmployeeRowProps {
  employee: Employee;
  onPress: () => void;
}

function EmployeeRow({ employee, onPress }: EmployeeRowProps) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowMain}>
        <Text style={styles.name}>{employee.fullName ?? employee.email}</Text>
        <Text style={styles.role}>{ROLE_LABELS[employee.role]}</Text>
      </View>
      <View style={[styles.badge, employee.isActive ? styles.badgeActive : styles.badgeInactive]}>
        <Text style={styles.badgeText}>{employee.isActive ? '재직' : '퇴직'}</Text>
      </View>
    </Pressable>
  );
}

export default function EmployeeListScreen() {
  const { employees, isLoading, error } = useEmployees();
  const { profile } = useCurrentProfile();
  const canInvite = profile !== null && can(profile.role, 'inviteEmployee');

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>직원</Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.navigate('/employees/invitations')}
          >
            <Text style={styles.headerLink}>초대 목록</Text>
          </Pressable>
          {canInvite && (
            <Pressable
              style={styles.inviteButton}
              onPress={() => router.navigate('/employees/invite')}
            >
              <Text style={styles.inviteButtonText}>직원 초대</Text>
            </Pressable>
          )}
        </View>
      </View>
      <FlatList
        style={styles.list}
        data={employees}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EmployeeRow
            employee={item}
            onPress={() => router.navigate(`/employees/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>등록된 직원이 없습니다.</Text>
          </View>
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLink: {
    fontSize: 13,
    color: '#6B7280',
  },
  inviteButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#111827',
    borderRadius: 8,
  },
  inviteButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  list: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  role: {
    fontSize: 13,
    color: '#6B7280',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeActive: {
    backgroundColor: '#D1FAE5',
  },
  badgeInactive: {
    backgroundColor: '#F3F4F6',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
