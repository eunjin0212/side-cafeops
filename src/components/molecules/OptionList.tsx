import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes } from '@/constants/theme';

export interface OptionListProps {
  label: string;
  selectionMode: 'single' | 'multiple';
  options: { id: string; name: string }[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export function OptionList({
  label,
  selectionMode,
  options,
  selectedIds,
  onToggle,
}: OptionListProps) {
  const isSingle = selectionMode === 'single';

  return (
    <View style={styles.list} role={isSingle ? 'radiogroup' : 'group'} aria-label={label}>
      {options.map((option) => {
        const isSelected = selectedIds.includes(option.id);
        return (
          <Pressable
            key={option.id}
            role={isSingle ? 'radio' : 'checkbox'}
            aria-checked={isSelected}
            style={[styles.row, isSelected && styles.rowSelected]}
            onPress={() => onToggle(option.id)}
          >
            <Text style={[styles.rowText, isSelected && styles.rowTextSelected]}>
              {option.name}
            </Text>
            {isSelected && (
              <Text style={styles.checkmark} aria-hidden>
                ✓
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: colors.white,
  },
  rowSelected: {
    backgroundColor: colors.background,
  },
  rowText: {
    flex: 1,
    fontSize: fontSizes.xl,
    color: colors.text,
  },
  rowTextSelected: {
    fontWeight: '600',
  },
  checkmark: {
    fontSize: fontSizes.xl,
    color: colors.text,
  },
});
