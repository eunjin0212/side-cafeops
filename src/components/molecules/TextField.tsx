import { StyleSheet, Text, TextInput, TextInputProps } from 'react-native';

import { FormField } from '@/components/molecules/FormField';
import { colors, fontSizes } from '@/constants/theme';
import { fieldA11yProps } from '@/utils/a11y';

export interface TextFieldProps extends TextInputProps {
  label: string;
  errorId: string;
  error?: string;
  required?: boolean;
}

export function TextField({
  label,
  errorId,
  error,
  required = false,
  ...inputProps
}: TextFieldProps) {
  return (
    <FormField label={label} required={required}>
      <TextInput
        aria-label={label}
        style={[styles.input, error !== undefined && styles.inputError]}
        placeholderTextColor={colors.textMuted}
        {...fieldA11yProps({ required, error, errorId })}
        {...inputProps}
      />
      {error !== undefined && (
        <Text role="alert" nativeID={errorId} style={styles.error}>
          {error}
        </Text>
      )}
    </FormField>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.textMuted,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: fontSizes.xl,
    color: colors.text,
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.dangerAccent,
  },
  error: {
    fontSize: fontSizes.sm,
    color: colors.danger,
    marginTop: 4,
  },
});
