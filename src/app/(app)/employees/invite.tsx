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
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { usePermissionGate } from '@/hooks/usePermissionGate';
import { useLocations } from '@/hooks/useLocations';
import { useCreateInvitation } from '@/hooks/useCreateInvitation';
import { EMPLOYEE_ROLES, ROLE_OPTIONS } from '@/constants/roles';
import { ROLE_HIERARCHY } from '@/constants/permissions';
import { webOnlyProps } from '@/utils/a11y';
import { showNotice } from '@/utils/dialogs';
import { goBack } from '@/utils/navigation';
import { FormHeader } from '@/components/molecules/FormHeader';

const inviteSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .refine(
      (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      'Invalid email address',
    ),
  role: z.enum(EMPLOYEE_ROLES),
  locationId: z.string().optional(),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export default function InviteEmployeeScreen() {
  const { profile: currentProfile, isLoading: profileLoading } = usePermissionGate(
    'inviteEmployee',
    '/employees',
  );
  const { locations } = useLocations();
  const { mutate: createInvitation, isPending: isSubmitting, error } = useCreateInvitation();
  const submitError = error?.message ?? null;

  const availableRoles = currentProfile
    ? ROLE_OPTIONS.filter(
        (opt) => ROLE_HIERARCHY[opt.value] < ROLE_HIERARCHY[currentProfile.role],
      )
    : [];

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'staff',
    },
  });

  function onSubmit(data: InviteFormValues): void {
    createInvitation(
      { email: data.email, role: data.role, locationId: data.locationId },
      {
        onSuccess: () => {
          showNotice('Invitation Sent', `Invitation sent to ${data.email}.`, () =>
            router.navigate('/employees'),
          );
        },
      },
    );
  }

  if (profileLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator aria-label="Loading" size="large" />
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
        <FormHeader title="Invite Employee" onDismiss={() => goBack('/employees')} />

        {submitError !== null && (
          <View role="alert" style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{submitError}</Text>
          </View>
        )}

        {/* Email */}
        <View style={styles.field}>
          <Text style={styles.label}>Email *</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.email ? styles.inputError : null]}
                aria-label="Email"
                placeholder="employee@example.com"
                {...webOnlyProps({
                  'aria-required': true,
                  'aria-invalid': errors.email !== undefined,
                  'aria-describedby': errors.email ? 'invite-email-error' : undefined,
                })}
                placeholderTextColor="#6B7280"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.email && (
            <Text role="alert" nativeID="invite-email-error" style={styles.fieldError}>
              {errors.email.message}
            </Text>
          )}
        </View>

        {/* Role */}
        <View style={styles.field}>
          <Text style={styles.label}>Role *</Text>
          <Controller
            control={control}
            name="role"
            render={({ field: { onChange, value } }) => (
              <View style={styles.roleGrid} role="radiogroup" aria-label="Role">
                {availableRoles.map((option) => (
                  <Pressable
                    key={option.value}
                    role="radio"
                    aria-checked={value === option.value}
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

        {/* Location */}
        <View style={styles.field}>
          <Text style={styles.label}>Location</Text>
          <Controller
            control={control}
            name="locationId"
            render={({ field: { onChange, value } }) =>
              locations.length === 0 ? (
                <View style={[styles.input, styles.inputDisabled]}>
                  <Text style={styles.placeholderText}>No locations available</Text>
                </View>
              ) : (
                <View style={styles.locationList} role="radiogroup" aria-label="Location">
                  {locations.map((loc) => (
                    <Pressable
                      key={loc.id}
                      role="radio"
                      aria-checked={value === loc.id}
                      style={[
                        styles.locationRow,
                        value === loc.id && styles.locationRowSelected,
                      ]}
                      onPress={() => onChange(value === loc.id ? undefined : loc.id)}
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
                        <Text style={styles.checkmark} aria-hidden>✓</Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              )
            }
          />
        </View>

        <Pressable
          role="button"
          aria-label="Send Invite"
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator aria-label="Loading" color="#fff" />
          ) : (
            <Text style={styles.submitText}>Send Invite</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorBannerText: {
    fontSize: 13,
    color: '#B91C1C',
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#6B7280',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputDisabled: {
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 15,
    color: '#6B7280',
  },
  fieldError: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rolePill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  rolePillSelected: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  rolePillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  rolePillTextSelected: {
    color: '#fff',
  },
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
  locationRowSelected: {
    backgroundColor: '#F9FAFB',
  },
  locationRowText: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  locationRowTextSelected: {
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 15,
    color: '#111827',
  },
  submitButton: {
    backgroundColor: '#111827',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
