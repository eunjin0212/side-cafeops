import { StyleSheet, Switch, Text, View } from 'react-native';

import { colors, fontSizes } from '@/constants/theme';
import { webOnlyProps } from '@/utils/a11y';

export interface SwitchFieldProps {
  label: string;
  hint: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function SwitchField({ label, hint, value, onChange }: SwitchFieldProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
      <Switch
        aria-label={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.textMuted, true: colors.text }}
        thumbColor={colors.white}
        {...webOnlyProps({ activeThumbColor: colors.white })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  text: {
    flex: 1,
    marginRight: 16,
  },
  label: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  hint: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
});
