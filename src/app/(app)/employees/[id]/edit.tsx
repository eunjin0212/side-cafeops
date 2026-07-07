import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useEmployee } from '@/hooks/useEmployee';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { useLocations } from '@/hooks/useLocations';
import { updateEmployee, updateEmployeeLocation } from '@/services/employeeService';
import { ROLE_OPTIONS } from '@/constants/roles';
import {
  canEditEmployeeRole,
  canEditEmployeeLocation,
  canEditOwnProfile,
  ROLE_HIERARCHY,
} from '@/constants/permissions';
import { UpdateEmployeeInput } from '@/types/employee';

const editSchema = z.object({
  fullName: z.string(),
  phone: z.string(),
  role: z.enum(['trainee', 'staff', 'supervisor', 'location_manager', 'general_manager', 'owner']),
  locationId: z.string().optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

export default function EmployeeEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { employee, isLoading: employeeLoading } = useEmployee(id);
  const { profile: currentProfile } = useCurrentProfile();
  const { locations } = useLocations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSelf =
    currentProfile !== null && canEditOwnProfile(currentProfile.id, id);
  const canRole =
    currentProfile !== null &&
    employee !== null &&
    currentProfile.id !== id &&
    canEditEmployeeRole(currentProfile.role, employee.role);
  const canLocation =
    currentProfile !== null &&
    employee !== null &&
    currentProfile.id !== id &&
    canEditEmployeeLocation(currentProfile.role, employee.role);

  const availableRoles = currentProfile
    ? ROLE_OPTIONS.filter(
        (opt) => ROLE_HIERARCHY[opt.value] < ROLE_HIERARCHY[currentProfile.role],
      )
    : [];

  const primaryLocation =
    employee?.locations.find((l) => l.isPrimary) ??
    employee?.locations[0] ??
    null;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      role: 'staff',
      locationId: undefined,
    },
  });

  useEffect(() => {
    if (employee) {
      reset({
        fullName: employee.fullName ?? '',
        phone: employee.phone ?? '',
        role: employee.role,
        locationId: primaryLocation?.locationId ?? undefined,
      });
    }
  }, [employee]);

  async function onSubmit(data: EditFormValues): Promise<void> {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const profileInput: UpdateEmployeeInput = {};
      if (canSelf) {
        profileInput.fullName = data.fullName !== '' ? data.fullName : undefined;
        profileInput.phone = data.phone !== '' ? data.phone : undefined;
      }
      if (canRole && data.role) {
        profileInput.role = data.role;
      }

      if (Object.keys(profileInput).length > 0) {
        await updateEmployee(id, profileInput);
      }

      if (canLocation && data.locationId) {
        await updateEmployeeLocation(id, data.locationId);
      }

      router.replace(`/employees/${id}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to save. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (employeeLoading || !employee || !currentProfile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Edit Employee</Text>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>

        {submitError !== null && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{submitError}</Text>
          </View>
        )}

        {/* Email — always read-only */}
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <View style={[styles.input, styles.inputDisabled]}>
            <Text style={styles.inputDisabledText}>{employee.email}</Text>
          </View>
        </View>

        {/* Full Name — only if canEditSelf */}
        {canSelf && (
          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.fullName ? styles.inputError : null]}
                  placeholder="John Doe"
                  placeholderTextColor="#9CA3AF"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.fullName && (
              <Text style={styles.fieldError}>{errors.fullName.message}</Text>
            )}
          </View>
        )}

        {/* Phone — only if canEditSelf */}
        {canSelf && (
          <View style={styles.field}>
            <Text style={styles.label}>Phone</Text>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="01012345678"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  onBlur={onBlur}
                  onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ''))}
                  value={value}
                />
              )}
            />
          </View>
        )}

        {/* Role — only if canEditRole */}
        {canRole && availableRoles.length > 0 && (
          <View style={styles.field}>
            <Text style={styles.label}>Role</Text>
            <Controller
              control={control}
              name="role"
              render={({ field: { onChange, value } }) => (
                <View style={styles.roleGrid}>
                  {availableRoles.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.rolePill,
                        value === option.value && styles.rolePillSelected,
                      ]}
                      onPress={() => onChange(option.value)}
                    >
                      <Text
                        style={[
                          styles.rolePillText,
                          value === option.value && styles.rolePillTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            />
          </View>
        )}

        {/* Location — only if canEditLocation */}
        {canLocation && (
          <View style={styles.field}>
            <Text style={styles.label}>Location</Text>
            <Controller
              control={control}
              name="locationId"
              render={({ field: { onChange, value } }) =>
                locations.length === 0 ? (
                  <View style={[styles.input, styles.inputDisabled]}>
                    <Text style={styles.inputDisabledText}>No locations available</Text>
                  </View>
                ) : (
                  <View style={styles.locationList}>
                    {locations.map((loc) => (
                      <Pressable
                        key={loc.id}
                        style={[
                          styles.locationRow,
                          value === loc.id && styles.locationRowSelected,
                        ]}
                        onPress={() =>
                          onChange(value === loc.id ? undefined : loc.id)
                        }
                      >
                        <Text
                          style={[
                            styles.locationRowText,
                            value === loc.id && styles.locationRowTextSelected,
                          ]}
                        >
                          {loc.name}
                        </Text>
                        {value === loc.id && (
                          <Text style={styles.checkmark}>✓</Text>
                        )}
                      </Pressable>
                    ))}
                  </View>
                )
              }
            />
          </View>
        )}

        <Pressable
          style={[styles.submitButton, (!isDirty || isSubmitting) && styles.submitButtonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={!isDirty || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Save</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  cancelText: { fontSize: 15, color: '#6B7280' },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorBannerText: { fontSize: 13, color: '#EF4444' },
  field: { marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fff',
  },
  inputError: { borderColor: '#EF4444' },
  inputDisabled: { backgroundColor: '#F9FAFB', justifyContent: 'center' },
  inputDisabledText: { fontSize: 15, color: '#9CA3AF' },
  fieldError: { fontSize: 12, color: '#EF4444', marginTop: 4 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rolePill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  rolePillSelected: { backgroundColor: '#111827', borderColor: '#111827' },
  rolePillText: { fontSize: 13, fontWeight: '500', color: '#374151' },
  rolePillTextSelected: { color: '#fff' },
  locationList: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  locationRowSelected: { backgroundColor: '#F9FAFB' },
  locationRowText: { flex: 1, fontSize: 15, color: '#111827' },
  locationRowTextSelected: { fontWeight: '600' },
  checkmark: { fontSize: 15, color: '#111827' },
  submitButton: {
    backgroundColor: '#111827',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
