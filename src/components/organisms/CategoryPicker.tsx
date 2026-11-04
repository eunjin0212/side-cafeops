import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ListCard } from '@/components/molecules/ListCard';
import { SectionLabel } from '@/components/molecules/SectionLabel';
import { SCORE_SECTIONS, SCORE_SECTION_LABELS } from '@/constants/scoreSections';
import { colors, fontSizes } from '@/constants/theme';
import { ScoreCategory, ScoreSection } from '@/types/score';
import { formatPoints, pointsColor } from '@/utils/points';

export interface CategoryPickerProps {
  categories: ScoreCategory[];
  isLoading: boolean;
  selectedIds: string[];
  onToggle: (id: string) => void;
  expandedSections: Set<ScoreSection>;
  onToggleSection: (section: ScoreSection) => void;
}

export function CategoryPicker({
  categories,
  isLoading,
  selectedIds,
  onToggle,
  expandedSections,
  onToggleSection,
}: CategoryPickerProps) {
  return (
    <View style={styles.block}>
      <View style={styles.blockHeader}>
        <SectionLabel>Categories</SectionLabel>
        {selectedIds.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{selectedIds.length} selected</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator aria-label="Loading" style={styles.loader} />
      ) : (
        <ListCard dividerInset={14}>
          {SCORE_SECTIONS.map((section) => {
            const sectionCats = categories.filter((c) => c.section === section);
            if (sectionCats.length === 0) return null;

            const selectedInSection = sectionCats.filter((c) => selectedIds.includes(c.id));
            const isExpanded = expandedSections.has(section);

            return (
              <View key={section}>
                {/* Section accordion header */}
                <Pressable
                  role="button"
                  aria-expanded={isExpanded}
                  style={styles.accordionHeader}
                  onPress={() => onToggleSection(section)}
                >
                  <Text style={styles.accordionLabel}>{SCORE_SECTION_LABELS[section]}</Text>
                  <View style={styles.accordionRight}>
                    {selectedInSection.length > 0 && (
                      <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeText}>{selectedInSection.length}</Text>
                        <Text style={styles.visuallyHidden}> selected</Text>
                      </View>
                    )}
                    <View style={[styles.chevron, isExpanded && styles.chevronExpanded]} />
                  </View>
                </Pressable>

                {/* Expanded category rows */}
                {isExpanded &&
                  sectionCats.map((cat) => {
                    const isSelected = selectedIds.includes(cat.id);
                    return (
                      <View key={cat.id}>
                        <View style={styles.divider} />
                        <Pressable
                          role="checkbox"
                          aria-checked={isSelected}
                          style={[styles.categoryRow, isSelected && styles.rowSelected]}
                          onPress={() => onToggle(cat.id)}
                        >
                          <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                            {isSelected && (
                              <Text style={styles.checkmark} aria-hidden>
                                ✓
                              </Text>
                            )}
                          </View>
                          <Text
                            style={[
                              styles.categoryLabel,
                              isSelected && styles.categoryLabelSelected,
                            ]}
                            numberOfLines={1}
                          >
                            {cat.name}
                          </Text>
                          <Text style={[styles.pointsLabel, { color: pointsColor(cat.points) }]}>
                            {formatPoints(cat.points)}
                          </Text>
                        </Pressable>
                      </View>
                    );
                  })}
              </View>
            );
          })}
        </ListCard>
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
  loader: {
    marginVertical: 16,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  accordionLabel: {
    flex: 1,
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.text,
  },
  accordionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionBadge: {
    backgroundColor: colors.text,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  sectionBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.white,
  },
  visuallyHidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    opacity: 0,
  },
  chevron: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.textMuted,
  },
  chevronExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceMuted,
    marginLeft: 48,
    marginRight: 14,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: colors.white,
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
    borderRadius: 5,
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
  categoryLabel: {
    flex: 1,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
  },
  categoryLabelSelected: {
    fontWeight: '600',
    color: colors.text,
  },
  pointsLabel: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'right',
  },
});
