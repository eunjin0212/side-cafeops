import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { useEmployees } from '@/hooks/useEmployees';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { useScoreCategories } from '@/hooks/useScoreCategories';
import { useCreateScoreEntry } from '@/hooks/useCreateScoreEntry';
import { can } from '@/constants/permissions';
import { SCORE_SECTIONS, SCORE_SECTION_LABELS } from '@/constants/scoreSections';
import { ROLE_LABELS } from '@/constants/roles';
import { goBack } from '@/utils/navigation';
import { ScoreSection } from '@/types/score';
import { Employee } from '@/types/employee';
import { ImagePickerField } from '@/components/molecules/ImagePickerField';

function formatPoints(pts: number): string {
  return pts > 0 ? `+${pts}` : String(pts);
}

function pointsColor(pts: number): string {
  if (pts > 0) return '#16A34A';
  if (pts < 0) return '#DC2626';
  return '#6B7280';
}

export default function ScoreEntryScreen() {
  const { profileId: preselectedId } = useLocalSearchParams<{ profileId?: string }>();

  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>(
    preselectedId ? [preselectedId] : [],
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<ScoreSection>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const { profile: currentProfile } = useCurrentProfile();
  const { employees, isLoading: employeesLoading } = useEmployees();
  const { categories, isLoading: categoriesLoading } = useScoreCategories();
  const { mutate, isPending, error, reset: resetMutation } = useCreateScoreEntry();

  useEffect(() => {
    if (currentProfile && !can(currentProfile.role, 'manageScores')) {
      router.replace('/');
    }
  }, [currentProfile]);

  const scorableEmployees = employees.filter(
    (e) => e.isActive && e.id !== currentProfile?.id,
  );

  const searchResults =
    employeeSearch.trim().length > 0
      ? scorableEmployees.filter((e) =>
          (e.fullName ?? e.email)
            .toLowerCase()
            .includes(employeeSearch.toLowerCase()),
        )
      : [];

  const selectedEmployees = scorableEmployees.filter((e) =>
    selectedProfileIds.includes(e.id),
  );

  const activeCategories = categories.filter((c) => c.isActive);
  const selectedCategories = activeCategories.filter((c) =>
    selectedCategoryIds.includes(c.id),
  );
  const totalPoints = selectedCategories.reduce((sum, c) => sum + c.points, 0);
  const totalEntries = selectedProfileIds.length * selectedCategoryIds.length;

  const canSubmit =
    selectedProfileIds.length > 0 &&
    selectedCategoryIds.length > 0 &&
    !isPending &&
    !submitted;

  function toggleEmployee(id: string): void {
    setSelectedProfileIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleCategory(id: string): void {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleSection(section: ScoreSection): void {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }

  function handleSubmit(): void {
    if (!canSubmit) return;
    mutate(
      {
        profileIds: selectedProfileIds,
        selections: selectedCategories.map((c) => ({
          categoryId: c.id,
          points: c.points,
        })),
        notes: notes.trim() || undefined,
        imageUris: imageUris.length > 0 ? imageUris : undefined,
      },
      {
        onSuccess: () => {
          setSelectedCategoryIds([]);
          setNotes('');
          setImageUris([]);
          setSubmitted(true);
          setTimeout(() => {
            setSubmitted(false);
            resetMutation();
          }, 2500);
        },
      },
    );
  }

  function employeeLabel(emp: Employee): string {
    const loc =
      emp.locations.length > 0
        ? emp.locations.map((l) => l.locationName).join(', ')
        : 'Unassigned';
    return `${ROLE_LABELS[emp.role]} · ${loc}`;
  }

  const submitLabel = submitted
    ? `✓ ${totalEntries} ${totalEntries === 1 ? 'entry' : 'entries'} submitted`
    : selectedProfileIds.length === 0
      ? 'Select employees'
      : selectedCategoryIds.length === 0
        ? 'Select categories'
        : `Submit — ${totalEntries} ${totalEntries === 1 ? 'entry' : 'entries'}`;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => goBack('/')} hitSlop={8}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Score Entry</Text>
        </View>

        {/* ── Employees ── */}
        <View style={styles.block}>
          <View style={styles.blockHeader}>
            <Text style={styles.blockTitle}>Employees</Text>
            {selectedProfileIds.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {selectedProfileIds.length} selected
                </Text>
              </View>
            )}
          </View>

          {/* Chips for selected employees */}
          {selectedEmployees.length > 0 && (
            <View style={styles.chipsRow}>
              {selectedEmployees.map((emp) => (
                <Pressable
                  key={emp.id}
                  style={styles.chip}
                  onPress={() => toggleEmployee(emp.id)}
                >
                  <Text style={styles.chipText} numberOfLines={1}>
                    {emp.fullName ?? emp.email}
                  </Text>
                  <Text style={styles.chipRemove}>×</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Search input */}
          <TextInput
            style={styles.searchInput}
            placeholder={
              selectedProfileIds.length > 0
                ? 'Search to add more...'
                : 'Search employees...'
            }
            placeholderTextColor="#9CA3AF"
            value={employeeSearch}
            onChangeText={setEmployeeSearch}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />

          {/* Search results */}
          {employeesLoading ? (
            <ActivityIndicator style={styles.loader} />
          ) : employeeSearch.trim().length > 0 ? (
            searchResults.length === 0 ? (
              <Text style={styles.emptyText}>No employees found.</Text>
            ) : (
              <View style={styles.listCard}>
                {searchResults.map((emp, idx) => {
                  const isSelected = selectedProfileIds.includes(emp.id);
                  return (
                    <View key={emp.id}>
                      {idx > 0 && <View style={styles.divider} />}
                      <Pressable
                        style={[styles.employeeRow, isSelected && styles.rowSelected]}
                        onPress={() => toggleEmployee(emp.id)}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            styles.checkboxCircle,
                            isSelected && styles.checkboxActive,
                          ]}
                        >
                          {isSelected && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <View style={styles.rowContent}>
                          <Text
                            style={[styles.rowLabel, isSelected && styles.rowLabelSelected]}
                            numberOfLines={1}
                          >
                            {emp.fullName ?? emp.email}
                          </Text>
                          <Text style={styles.rowSublabel} numberOfLines={1}>
                            {employeeLabel(emp)}
                          </Text>
                        </View>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )
          ) : selectedProfileIds.length === 0 ? (
            <Text style={styles.hintText}>Search to add employees</Text>
          ) : null}
        </View>

        {/* ── Categories ── */}
        {selectedProfileIds.length > 0 && (
          <View style={styles.block}>
            <View style={styles.blockHeader}>
              <Text style={styles.blockTitle}>Categories</Text>
              {selectedCategoryIds.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {selectedCategoryIds.length} selected
                  </Text>
                </View>
              )}
            </View>

            {categoriesLoading ? (
              <ActivityIndicator style={styles.loader} />
            ) : (
              <View style={styles.listCard}>
                {SCORE_SECTIONS.map((section, sIdx) => {
                  const sectionCats = activeCategories.filter(
                    (c) => c.section === section,
                  );
                  if (sectionCats.length === 0) return null;

                  const selectedInSection = sectionCats.filter((c) =>
                    selectedCategoryIds.includes(c.id),
                  );
                  const isExpanded = expandedSections.has(section);

                  return (
                    <View key={section}>
                      {sIdx > 0 && <View style={styles.divider} />}

                      {/* Section accordion header */}
                      <Pressable
                        style={styles.accordionHeader}
                        onPress={() => toggleSection(section)}
                      >
                        <Text style={styles.accordionLabel}>
                          {SCORE_SECTION_LABELS[section]}
                        </Text>
                        <View style={styles.accordionRight}>
                          {selectedInSection.length > 0 && (
                            <View style={styles.sectionBadge}>
                              <Text style={styles.sectionBadgeText}>
                                {selectedInSection.length}
                              </Text>
                            </View>
                          )}
                          <Text style={styles.chevron}>
                            {isExpanded ? '▲' : '▼'}
                          </Text>
                        </View>
                      </Pressable>

                      {/* Expanded category rows */}
                      {isExpanded &&
                        sectionCats.map((cat) => {
                          const isSelected = selectedCategoryIds.includes(cat.id);
                          return (
                            <View key={cat.id}>
                              <View style={[styles.divider, { marginLeft: 48 }]} />
                              <Pressable
                                style={[
                                  styles.categoryRow,
                                  isSelected && styles.rowSelected,
                                ]}
                                onPress={() => toggleCategory(cat.id)}
                              >
                                <View
                                  style={[
                                    styles.checkbox,
                                    styles.checkboxSquare,
                                    isSelected && styles.checkboxActive,
                                  ]}
                                >
                                  {isSelected && (
                                    <Text style={styles.checkmark}>✓</Text>
                                  )}
                                </View>
                                <Text
                                  style={[
                                    styles.rowLabel,
                                    styles.categoryLabel,
                                    isSelected && styles.rowLabelSelected,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {cat.name}
                                </Text>
                                <Text
                                  style={[
                                    styles.pointsLabel,
                                    { color: pointsColor(cat.points) },
                                  ]}
                                >
                                  {formatPoints(cat.points)}
                                </Text>
                              </Pressable>
                            </View>
                          );
                        })}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ── Notes ── */}
        {selectedProfileIds.length > 0 && (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add a note..."
              placeholderTextColor="#9CA3AF"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <ImagePickerField
              images={imageUris}
              onAdd={(uri) => setImageUris((prev) => [...prev, uri])}
              onRemove={(idx) =>
                setImageUris((prev) => prev.filter((_, i) => i !== idx))
              }
              maxImages={2}
              disabled={isPending}
            />
          </View>
        )}

        {error && <Text style={styles.errorText}>{error.message}</Text>}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed bottom bar */}
      <View style={styles.bottomBar}>
        {selectedProfileIds.length > 0 && selectedCategoryIds.length > 0 && (
          <View style={styles.bottomSummary}>
            <Text style={styles.bottomSummaryText}>
              {selectedProfileIds.length}{' '}
              {selectedProfileIds.length === 1 ? 'employee' : 'employees'}
              {'  ·  '}
              {selectedCategoryIds.length}{' '}
              {selectedCategoryIds.length === 1 ? 'category' : 'categories'}
            </Text>
            <Text style={[styles.bottomTotal, { color: pointsColor(totalPoints) }]}>
              {formatPoints(totalPoints)} pts each
            </Text>
          </View>
        )}

        <Pressable
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>{submitLabel}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backText: {
    fontSize: 15,
    color: '#6B7280',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  block: {
    gap: 10,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blockTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  countBadge: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    maxWidth: 180,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#fff',
    flexShrink: 1,
  },
  chipRemove: {
    fontSize: 15,
    color: '#9CA3AF',
    lineHeight: 16,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  listCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  rowSelected: {
    backgroundColor: '#F0FDF4',
  },
  checkbox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxCircle: {
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  checkboxSquare: {
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  checkboxActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  checkmark: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 14,
    color: '#374151',
  },
  rowLabelSelected: {
    fontWeight: '600',
    color: '#111827',
  },
  rowSublabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#fff',
  },
  categoryLabel: {
    flex: 1,
    fontSize: 14,
  },
  pointsLabel: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'right',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  accordionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  accordionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionBadge: {
    backgroundColor: '#111827',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  chevron: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 14,
  },
  loader: {
    marginVertical: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 12,
  },
  hintText: {
    fontSize: 14,
    color: '#D1D5DB',
    textAlign: 'center',
    paddingVertical: 8,
  },
  notesInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#111827',
    minHeight: 80,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
  },
  bottomBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 8,
  },
  bottomSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  bottomSummaryText: {
    fontSize: 13,
    color: '#6B7280',
  },
  bottomTotal: {
    fontSize: 15,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: '#111827',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.35,
  },
  submitText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
