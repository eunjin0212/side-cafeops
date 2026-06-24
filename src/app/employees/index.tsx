import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useEmployees } from '@/hooks/useEmployees';
import { Employee, EmployeeRole } from '@/types/employee';

const ROLE_LABEL: Record<EmployeeRole, string> = {
  staff: 'Staff',
  supervisor: 'Supervisor',
  location_manager: 'Location Manager',
  general_manager: 'General Manager',
  owner: 'Owner',
};

interface EmployeeRowProps {
  employee: Employee;
}

function EmployeeRow({ employee }: EmployeeRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={styles.name}>{employee.fullName ?? employee.email}</Text>
        <Text style={styles.role}>{ROLE_LABEL[employee.role]}</Text>
      </View>
      <View style={[styles.badge, employee.isActive ? styles.badgeActive : styles.badgeInactive]}>
        <Text style={styles.badgeText}>{employee.isActive ? '재직' : '퇴직'}</Text>
      </View>
    </View>
  );
}

export default function EmployeeListScreen() {
  const { employees, isLoading, error } = useEmployees();

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
    <FlatList
      style={styles.list}
      data={employees}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <EmployeeRow employee={item} />}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>등록된 직원이 없습니다.</Text>
        </View>
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      contentContainerStyle={employees.length === 0 ? styles.emptyContainer : styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
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
