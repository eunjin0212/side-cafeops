import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes } from '@/constants/theme';

export interface PillRadioGroupProps<T extends string> {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function PillRadioGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: PillRadioGroupProps<T>) {
  return (
    <View style={styles.group} role="radiogroup" aria-label={label}>
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <Pressable
            key={option.value}
            role="radio"
            aria-checked={isSelected}
            style={[styles.pill, isSelected && styles.pillSelected]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  pillSelected: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  pillText: {
    fontSize: fontSizes.md,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  pillTextSelected: {
    color: colors.white,
  },
});
