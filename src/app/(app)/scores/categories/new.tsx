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
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { createScoreCategory } from '@/services/scoreCategoryService';
import { can } from '@/constants/permissions';
import { SCORE_SECTIONS, SCORE_SECTION_LABELS } from '@/constants/scoreSections';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { goBack } from '@/utils/navigation';

const newCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  section: z.enum(SCORE_SECTIONS),
  points: z
    .string()
    .min(1, 'Points is required')
    .regex(/^-?\d+$/, 'Must be a whole number (e.g. -5 or 5)')
    .refine((v) => v !== '0', 'Points cannot be zero'),
});

type NewCategoryValues = z.infer<typeof newCategorySchema>;

export default function NewScoreCategoryScreen() {
  const { profile } = useCurrentProfile();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (profile && !can(profile.role, 'manageScoreCategories')) {
      router.replace('/scores/categories');
    }
  }, [profile]);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<NewCategoryValues>({
    resolver: zodResolver(newCategorySchema),
    defaultValues: {
      name: '',
      section: 'daily_performance',
      points: '',
    },
  });

  async function onSubmit(data: NewCategoryValues): Promise<void> {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await createScoreCategory({
        name: data.name.trim(),
        section: data.section,
        points: parseInt(data.points, 10),
      });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.scoreCategories });
      router.replace('/scores/categories');
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to create category. Please try again.',
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
          <Text style={styles.title}>New Category</Text>
          <Pressable onPress={() => goBack('/scores/categories')} hitSlop={8}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>

        {submitError !== null && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{submitError}</Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.name ? styles.inputError : null]}
                placeholder="e.g. Late / late notice"
                placeholderTextColor="#9CA3AF"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.name && <Text style={styles.fieldError}>{errors.name.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Section</Text>
          <Controller
            control={control}
            name="section"
            render={({ field: { onChange, value } }) => (
              <View style={styles.pillGrid}>
                {SCORE_SECTIONS.map((s) => (
                  <Pressable
                    key={s}
                    style={[styles.pill, value === s && styles.pillSelected]}
                    onPress={() => onChange(s)}
                  >
                    <Text style={[styles.pillText, value === s && styles.pillTextSelected]}>
                      {SCORE_SECTION_LABELS[s]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Points</Text>
          <Controller
            control={control}
            name="points"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.points ? styles.inputError : null]}
                placeholder="e.g. -5 or 5"
                placeholderTextColor="#9CA3AF"
                keyboardType="numbers-and-punctuation"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.points && <Text style={styles.fieldError}>{errors.points.message}</Text>}
        </View>

        <Pressable
          style={[styles.submitButton, (!isDirty || isSubmitting) && styles.submitButtonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={!isDirty || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Create Category</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
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
  fieldError: { fontSize: 12, color: '#EF4444', marginTop: 4 },
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  pillSelected: { backgroundColor: '#111827', borderColor: '#111827' },
  pillText: { fontSize: 13, fontWeight: '500', color: '#374151' },
  pillTextSelected: { color: '#fff' },
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
