import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { EmptyText } from '@/components/molecules/EmptyText';
import { ErrorText } from '@/components/molecules/ErrorText';
import { ImagePickerField } from '@/components/molecules/ImagePickerField';
import { LoadingScreen } from '@/components/molecules/LoadingScreen';
import { LocationTabs } from '@/components/molecules/LocationTabs';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { SectionLabel } from '@/components/molecules/SectionLabel';
import { SubmitButton } from '@/components/molecules/SubmitButton';
import { CategoryPicker } from '@/components/organisms/CategoryPicker';
import { EmployeePicker } from '@/components/organisms/EmployeePicker';
import { colors, fontSizes } from '@/constants/theme';
import { useScoreEntryForm } from '@/hooks/useScoreEntryForm';
import { formatPoints, pointsColor } from '@/utils/points';

export default function ScoreEntryScreen() {
  const { profileId } = useLocalSearchParams<{ profileId?: string }>();
  const form = useScoreEntryForm(profileId);

  if (form.profileLoading) {
    return <LoadingScreen background={colors.background} />;
  }

  const employeeCount = form.selectedProfileIds.length;
  const categoryCount = form.selectedCategoryIds.length;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader backHref="/" title="Score Entry" />

        {/* ── Location ── */}
        <View style={styles.block}>
          <SectionLabel>Location</SectionLabel>
          {form.scoringLocations.length === 0 ? (
            <EmptyText>No location assigned.</EmptyText>
          ) : form.scoringLocations.length === 1 ? (
            <Text style={styles.singleLocationText}>{form.scoringLocations[0].name}</Text>
          ) : (
            <LocationTabs
              locations={form.scoringLocations}
              selectedId={form.effectiveLocationId}
              onSelect={form.selectLocation}
            />
          )}
        </View>

        <EmployeePicker
          hasLocation={form.effectiveLocationId !== undefined}
          isLoading={form.employeesLoading}
          search={form.employeeSearch}
          onSearchChange={form.setEmployeeSearch}
          searchResults={form.searchResults}
          selectedEmployees={form.selectedEmployees}
          selectedIds={form.selectedProfileIds}
          onToggle={form.toggleEmployee}
        />

        {employeeCount > 0 && (
          <CategoryPicker
            categories={form.activeCategories}
            isLoading={form.categoriesLoading}
            selectedIds={form.selectedCategoryIds}
            onToggle={form.toggleCategory}
            expandedSections={form.expandedSections}
            onToggleSection={form.toggleSection}
          />
        )}

        {/* ── Notes ── */}
        {employeeCount > 0 && (
          <View style={styles.block}>
            <SectionLabel>Notes (optional)</SectionLabel>
            <TextInput
              aria-label="Notes (optional)"
              style={styles.notesInput}
              placeholder="Add a note..."
              placeholderTextColor={colors.textMuted}
              value={form.notes}
              onChangeText={form.setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <ImagePickerField
              images={form.imageUris}
              onAdd={form.addImage}
              onRemove={form.removeImage}
              maxImages={2}
              disabled={form.isPending}
            />
          </View>
        )}

        {form.error && <ErrorText style={styles.errorText}>{form.error.message}</ErrorText>}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Announces the result; the submit label alone is on a disabled button. */}
      <View aria-live="polite" style={styles.visuallyHidden}>
        {form.submitted && <Text>{form.submitLabel}</Text>}
      </View>

      {/* Fixed bottom bar */}
      <View style={styles.bottomBar}>
        {employeeCount > 0 && categoryCount > 0 && (
          <View style={styles.bottomSummary}>
            <Text style={styles.bottomSummaryText}>
              {employeeCount} {employeeCount === 1 ? 'employee' : 'employees'}
              {'  ·  '}
              {categoryCount} {categoryCount === 1 ? 'category' : 'categories'}
            </Text>
            <Text style={[styles.bottomTotal, { color: pointsColor(form.totalPoints) }]}>
              {formatPoints(form.totalPoints)} pts each
            </Text>
          </View>
        )}

        <SubmitButton
          label={form.submitLabel}
          onPress={form.submit}
          isLoading={form.isPending}
          disabled={!form.canSubmit}
          style={styles.submit}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  submit: {
    marginTop: 0,
  },
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  visuallyHidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    opacity: 0,
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
  block: {
    gap: 10,
  },
  singleLocationText: {
    fontSize: fontSizes.xl,
    fontWeight: '600',
    color: colors.text,
  },
  notesInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.textMuted,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: fontSizes.lg,
    color: colors.text,
    minHeight: 80,
  },
  errorText: {
    fontSize: fontSizes.md,
    textAlign: 'center',
  },
  bottomBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
    fontSize: fontSizes.md,
    color: colors.textMuted,
  },
  bottomTotal: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
  },
});
