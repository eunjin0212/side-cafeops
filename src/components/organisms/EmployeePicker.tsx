import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { EmptyText } from '@/components/molecules/EmptyText';
import { ListCard } from '@/components/molecules/ListCard';
import { SectionLabel } from '@/components/molecules/SectionLabel';
import { ROLE_LABELS } from '@/constants/roles';
import { colors, fontSizes } from '@/constants/theme';
import { Employee } from '@/types/employee';

function employeeLabel(emp: Employee): string {
  const loc =
    emp.locations.length > 0 ? emp.locations.map((l) => l.locationName).join(', ') : 'Unassigned';
  return `${ROLE_LABELS[emp.role]} · ${loc}`;
}

export interface EmployeePickerProps {
  hasLocation: boolean;
  isLoading: boolean;
  search: string;
  onSearchChange: (search: string) => void;
  searchResults: Employee[];
  selectedEmployees: Employee[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export function EmployeePicker({
  hasLocation,
  isLoading,
  search,
  onSearchChange,
  searchResults,
  selectedEmployees,
  selectedIds,
  onToggle,
}: EmployeePickerProps) {
  return (
    <View style={styles.block}>
      <View style={styles.blockHeader}>
        <SectionLabel>Employees</SectionLabel>
        {selectedIds.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{selectedIds.length} selected</Text>
          </View>
        )}
      </View>

      {!hasLocation ? (
        <Text style={styles.hintText}>Select a location to find employees</Text>
      ) : (
        <>
          {/* Chips for selected employees */}
          {selectedEmployees.length > 0 && (
            <View style={styles.chipsRow}>
              {selectedEmployees.map((emp) => (
                <Pressable
                  key={emp.id}
                  role="button"
                  aria-label={`Remove ${emp.fullName ?? emp.email}`}
                  style={styles.chip}
                  onPress={() => onToggle(emp.id)}
                >
                  <Text style={styles.chipText} numberOfLines={1}>
                    {emp.fullName ?? emp.email}
                  </Text>
                  <Text style={styles.chipRemove} aria-hidden>
                    ✕
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Search input */}
          <TextInput
            aria-label="Search employees"
            style={styles.searchInput}
            placeholder={selectedIds.length > 0 ? 'Search to add more...' : 'Search employees...'}
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={onSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />

          {/* Search results */}
          {isLoading ? (
            <ActivityIndicator aria-label="Loading" style={styles.loader} />
          ) : search.trim().length > 0 ? (
            searchResults.length === 0 ? (
              <EmptyText style={styles.emptyText}>No employees found.</EmptyText>
            ) : (
              <ListCard dividerInset={14}>
                {searchResults.map((emp) => {
                  const isSelected = selectedIds.includes(emp.id);
                  return (
                    <Pressable
                      key={emp.id}
                      role="checkbox"
                      aria-checked={isSelected}
                      style={[styles.employeeRow, isSelected && styles.rowSelected]}
                      onPress={() => onToggle(emp.id)}
                    >
                      <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                        {isSelected && (
                          <Text style={styles.checkmark} aria-hidden>
                            ✓
                          </Text>
                        )}
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
                  );
                })}
              </ListCard>
            )
          ) : selectedIds.length === 0 ? (
            <Text style={styles.hintText}>Search to add employees</Text>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 10,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    backgroundColor: colors.text,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.white,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.text,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 44,
    gap: 6,
    maxWidth: 180,
  },
  chipText: {
    fontSize: fontSizes.md,
    fontWeight: '500',
    color: colors.white,
    flexShrink: 1,
  },
  chipRemove: {
    fontSize: fontSizes.xl,
    color: colors.border,
    lineHeight: 16,
  },
  searchInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.textMuted,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    fontSize: fontSizes.xl,
    color: colors.text,
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  rowSelected: {
    backgroundColor: colors.successTint,
  },
  checkbox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textMuted,
  },
  checkboxActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  checkmark: {
    fontSize: fontSizes.sm,
    color: colors.white,
    fontWeight: '700',
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
  },
  rowLabelSelected: {
    fontWeight: '600',
    color: colors.text,
  },
  rowSublabel: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  loader: {
    marginVertical: 16,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 12,
  },
  hintText: {
    fontSize: fontSizes.lg,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
