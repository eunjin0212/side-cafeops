import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { useScoreCategories } from '@/hooks/useScoreCategories';
import { updateScoreCategory } from '@/services/scoreCategoryService';
import { can } from '@/constants/permissions';
import { SCORE_SECTIONS, SCORE_SECTION_LABELS } from '@/constants/scoreSections';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { goBack } from '@/utils/navigation';

const editCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  section: z.enum(SCORE_SECTIONS),
  points: z
    .string()
    .min(1, 'Points is required')
    .regex(/^-?\d+$/, 'Must be a whole number (e.g. -5 or 5)')
    .refine((v) => v !== '0', 'Points cannot be zero'),
  isActive: z.boolean(),
});

type EditCategoryValues = z.infer<typeof editCategorySchema>;

export default function EditScoreCategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useCurrentProfile();
  const { categories, isLoading } = useScoreCategories();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (profile && !can(profile.role, 'manageScoreCategories')) {
      router.replace('/scores/categories');
    }
  }, [profile]);

  const category = categories.find((c) => c.id === id) ?? null;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditCategoryValues>({
    resolver: zodResolver(editCategorySchema),
    defaultValues: {
      name: '',
      section: 'daily_performance',
      points: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        section: category.section,
        points: String(category.points),
        isActive: category.isActive,
      });
    }
  }, [category, reset]);

  async function onSubmit(data: EditCategoryValues): Promise<void> {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await updateScoreCategory(id, {
        name: data.name.trim(),
        section: data.section,
        points: parseInt(data.points, 10),
        isActive: data.isActive,
      });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.scoreCategories });
      router.replace('/scores/categories');
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to update category. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || !category) {
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
          <Text style={styles.title}>Edit Category</Text>
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

        <View style={[styles.field, styles.switchRow]}>
          <View>
            <Text style={styles.label}>Active</Text>
            <Text style={styles.switchHint}>Inactive categories cannot be used in score entries.</Text>
          </View>
          <Controller
            control={control}
            name="isActive"
            render={({ field: { onChange, value } }) => (
              <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ false: '#E5E7EB', true: '#111827' }}
                thumbColor="#fff"
              />
            )}
          />
        </View>

        <Pressable
          style={[styles.submitButton, (!isDirty || isSubmitting) && styles.submitButtonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={!isDirty || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Save Changes</Text>
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  switchHint: { fontSize: 12, color: '#9CA3AF', marginTop: 2, maxWidth: 260 },
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
