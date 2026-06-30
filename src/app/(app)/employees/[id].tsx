import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { useEmployee } from '@/hooks/useEmployee';
import { ROLE_LABELS } from '@/constants/roles';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

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

  if (!employee) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>직원 정보를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const primaryLocation =
    employee.locations.find((l) => l.isPrimary) ?? employee.locations[0] ?? null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backText}>← 뒤로</Text>
        </Pressable>
      </View>

      <View style={styles.profile}>
        <Text style={styles.name}>{employee.fullName ?? employee.email}</Text>
        <View style={styles.badges}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{ROLE_LABELS[employee.role]}</Text>
          </View>
          <View style={[styles.statusBadge, employee.isActive ? styles.statusActive : styles.statusInactive]}>
            <Text style={styles.statusBadgeText}>
              {employee.isActive ? '재직' : '퇴직'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <InfoRow label="이메일" value={employee.email} />
        <View style={styles.divider} />
        <InfoRow label="연락처" value={employee.phone ?? '미등록'} />
        <View style={styles.divider} />
        <InfoRow
          label="위치"
          value={primaryLocation ? primaryLocation.locationName : '미지정'}
        />
        <View style={styles.divider} />
        <InfoRow label="등록일" value={formatDate(employee.createdAt)} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 28,
  },
  backText: {
    fontSize: 15,
    color: '#6B7280',
  },
  profile: {
    marginBottom: 32,
    gap: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusActive: {
    backgroundColor: '#D1FAE5',
  },
  statusInactive: {
    backgroundColor: '#F3F4F6',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  section: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
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
