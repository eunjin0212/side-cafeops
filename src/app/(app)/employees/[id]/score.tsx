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

import { useEmployee } from '@/hooks/useEmployee';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { useScoreCategories } from '@/hooks/useScoreCategories';
import { useCreateScoreEntry } from '@/hooks/useCreateScoreEntry';
import { can } from '@/constants/permissions';
import { SCORE_SECTIONS, SCORE_SECTION_LABELS } from '@/constants/scoreSections';
import { ScoreCategory } from '@/types/score';
import { ROLE_LABELS } from '@/constants/roles';
import { goBack } from '@/utils/navigation';

function formatPoints(points: number): string {
  return points >= 0 ? `+${points}` : `${points}`;
}

interface CategoryRowProps {
  category: ScoreCategory;
  selected: boolean;
  onSelect: () => void;
}

function CategoryRow({ category, selected, onSelect }: CategoryRowProps) {
  const isPositive = category.points >= 0;
  return (
    <Pressable
      style={[styles.categoryRow, selected && styles.categoryRowSelected]}
      onPress={onSelect}
    >
      <Text style={[styles.categoryName, selected && styles.categoryNameSelected]}>
        {category.name}
      </Text>
      <Text
        style={[
          styles.categoryPoints,
          isPositive ? styles.pointsPositive : styles.pointsNegative,
          selected && styles.categoryPointsSelected,
        ]}
      >
        {formatPoints(category.points)}
      </Text>
    </Pressable>
  );
}

export default function ScoreEntryScreen() {
  const { id: profileId } = useLocalSearchParams<{ id: string }>();
  const { employee, isLoading: employeeLoading } = useEmployee(profileId);
  const { categories, isLoading: categoriesLoading } = useScoreCategories();
  const { profile: currentProfile } = useCurrentProfile();
  const { mutate, isPending, isSuccess, isError, error, reset } = useCreateScoreEntry();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const canScore =
    currentProfile !== null &&
    can(currentProfile.role, 'manageScores') &&
    currentProfile.id !== profileId;

  useEffect(() => {
    if (currentProfile && !canScore) {
      router.replace(`/employees/${profileId}`);
    }
  }, [currentProfile, canScore, profileId]);

  const activeCategories = categories.filter((c) => c.isActive);
  const selectedCategory = activeCategories.find((c) => c.id === selectedCategoryId) ?? null;

  function handleSubmit(): void {
    if (!selectedCategory) return;
    mutate(
      {
        profileId,
        categoryId: selectedCategory.id,
        points: selectedCategory.points,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          setSelectedCategoryId(null);
          setNotes('');
          setTimeout(() => reset(), 2500);
        },
      },
    );
  }

  if (employeeLoading || categoriesLoading || !employee || !currentProfile) {
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
          <Pressable onPress={() => goBack(`/employees/${profileId}`)} hitSlop={8}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Score Entry</Text>
        </View>

        <View style={styles.employeeCard}>
          <Text style={styles.employeeName}>{employee.fullName ?? employee.email}</Text>
          <Text style={styles.employeeMeta}>
            {ROLE_LABELS[employee.role]}
            {employee.locations.length > 0
              ? `  ·  ${employee.locations.map((l) => l.locationName).join(', ')}`
              : ''}
          </Text>
        </View>

        {isError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>
              {error?.message ?? 'Failed to submit. Please try again.'}
            </Text>
          </View>
        )}

        {isSuccess && (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>Entry submitted.</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Select Category</Text>

        {SCORE_SECTIONS.map((section) => {
          const rows = activeCategories.filter((c) => c.section === section);
          if (rows.length === 0) return null;
          return (
            <View key={section} style={styles.section}>
              <Text style={styles.sectionLabel}>{SCORE_SECTION_LABELS[section]}</Text>
              <View style={styles.categoryList}>
                {rows.map((cat, i) => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    selected={cat.id === selectedCategoryId}
                    onSelect={() =>
                      setSelectedCategoryId(cat.id === selectedCategoryId ? null : cat.id)
                    }
                  />
                ))}
              </View>
            </View>
          );
        })}

        {activeCategories.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No active score categories.</Text>
            <Text style={styles.emptyStateHint}>
              Ask a General Manager to add categories first.
            </Text>
          </View>
        )}

        <View style={styles.notesField}>
          <Text style={styles.notesLabel}>Notes (optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add context or details..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <Pressable
          style={[
            styles.submitButton,
            (!selectedCategory || isPending || isSuccess) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!selectedCategory || isPending || isSuccess}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : isSuccess ? (
            <Text style={styles.submitText}>✓ Submitted</Text>
          ) : (
            <Text style={styles.submitText}>
              {selectedCategory
                ? `Submit  ${formatPoints(selectedCategory.points)}`
                : 'Select a Category'}
            </Text>
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
    gap: 16,
    marginBottom: 24,
  },
  backText: { fontSize: 15, color: '#6B7280' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  employeeCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    gap: 4,
  },
  employeeName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  employeeMeta: { fontSize: 13, color: '#6B7280' },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: { fontSize: 13, color: '#EF4444' },
  successBanner: {
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  successBannerText: { fontSize: 13, color: '#065F46', fontWeight: '500' },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  categoryList: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryRowSelected: {
    backgroundColor: '#111827',
    borderBottomColor: '#374151',
  },
  categoryName: { flex: 1, fontSize: 14, color: '#111827' },
  categoryNameSelected: { color: '#fff' },
  categoryPoints: { fontSize: 14, fontWeight: '700', marginLeft: 12 },
  categoryPointsSelected: { color: '#fff' },
  pointsPositive: { color: '#10B981' },
  pointsNegative: { color: '#EF4444' },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 6,
  },
  emptyStateText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  emptyStateHint: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  notesField: { marginTop: 8, marginBottom: 24 },
  notesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#111827',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
