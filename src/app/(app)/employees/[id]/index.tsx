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
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { ROLE_LABELS } from '@/constants/roles';
import {
  canEditEmployeeRole,
  canEditEmployeeLocation,
  canEditOwnProfile,
} from '@/constants/permissions';
import { goBack } from '@/utils/navigation';

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
  const { profile: currentProfile } = useCurrentProfile();

  const showEditButton =
    currentProfile !== null &&
    employee !== null &&
    (canEditOwnProfile(currentProfile.id, id) ||
      canEditEmployeeRole(currentProfile.role, employee?.role ?? 'owner') ||
      canEditEmployeeLocation(currentProfile.role, employee?.role ?? 'owner'));

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
        <Text style={styles.emptyText}>Employee not found.</Text>
      </View>
    );
  }

  const primaryLocation =
    employee.locations.find((l) => l.isPrimary) ?? employee.locations[0] ?? null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        {showEditButton && (
          <Pressable
            onPress={() => router.navigate(`/employees/${id}/edit`)}
            hitSlop={8}
          >
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.profile}>
        <Text style={styles.name}>{employee.fullName ?? employee.email}</Text>
        <View style={styles.badges}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{ROLE_LABELS[employee.role]}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              employee.isActive ? styles.statusActive : styles.statusInactive,
            ]}
          >
            <Text style={styles.statusBadgeText}>
              {employee.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <InfoRow label="Email" value={employee.email} />
        <View style={styles.divider} />
        <InfoRow label="Phone" value={employee.phone ?? 'Not set'} />
        <View style={styles.divider} />
        <InfoRow
          label="Location"
          value={primaryLocation ? primaryLocation.locationName : 'Unassigned'}
        />
        <View style={styles.divider} />
        <InfoRow label="Joined" value={formatDate(employee.createdAt)} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  backText: {
    fontSize: 15,
    color: '#6B7280',
  },
  editText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
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
