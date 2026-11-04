import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes } from '@/constants/theme';

export interface FormFieldProps {
  label: string;
  required?: boolean;
  children: ReactNode;
}

export function FormField({ label, required = false, children }: FormFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{required ? `${label} *` : label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
});
