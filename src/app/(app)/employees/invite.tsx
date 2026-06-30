import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { useLocations } from '@/hooks/useLocations';
import { EMPLOYEE_ROLES, ROLE_OPTIONS } from '@/constants/roles';
import { createInvitation } from '@/services/invitationService';

const inviteSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .refine(
      (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      '올바른 이메일 형식이 아닙니다',
    ),
  role: z.enum(EMPLOYEE_ROLES),
  locationId: z.string().optional(),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export default function InviteEmployeeScreen() {
  const { locations } = useLocations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  async function onSubmit(data: InviteFormValues): Promise<void> {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await createInvitation({
        email: data.email,
        role: data.role,
        locationId: data.locationId,
      });
      Alert.alert('초대 완료', `${data.email}로 초대를 보냈습니다.`, [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : '초대 중 오류가 발생했습니다.',
      );
    } finally {
      setIsSubmitting(false);
    }
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
          <Text style={styles.title}>직원 초대</Text>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.cancelText}>취소</Text>
          </Pressable>
        </View>

        {submitError !== null && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{submitError}</Text>
          </View>
        )}

        {/* Email */}
        <View style={styles.field}>
          <Text style={styles.label}>이메일 *</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.email ? styles.inputError : null]}
                placeholder="employee@example.com"
                placeholderTextColor="#9CA3AF"
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
            <Text style={styles.fieldError}>{errors.email.message}</Text>
          )}
        </View>

        {/* Role */}
        <View style={styles.field}>
          <Text style={styles.label}>역할 *</Text>
          <Controller
            control={control}
            name="role"
            render={({ field: { onChange, value } }) => (
              <View style={styles.roleGrid}>
                {ROLE_OPTIONS.map((option) => (
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

        {/* Location */}
        <View style={styles.field}>
          <Text style={styles.label}>위치</Text>
          <Controller
            control={control}
            name="locationId"
            render={({ field: { onChange, value } }) =>
              locations.length === 0 ? (
                <View style={[styles.input, styles.inputDisabled]}>
                  <Text style={styles.placeholderText}>등록된 위치가 없습니다</Text>
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
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              )
            }
          />
        </View>

        <Pressable
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>초대 보내기</Text>
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
  scroll: {
    flex: 1,
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
    marginBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  cancelText: {
    fontSize: 15,
    color: '#6B7280',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorBannerText: {
    fontSize: 13,
    color: '#EF4444',
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
    borderColor: '#E5E7EB',
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
    color: '#9CA3AF',
  },
  fieldError: {
    fontSize: 12,
    color: '#EF4444',
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
