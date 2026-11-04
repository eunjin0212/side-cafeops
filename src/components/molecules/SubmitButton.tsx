import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors, fontSizes } from '@/constants/theme';

export interface SubmitButtonProps {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function SubmitButton({
  label,
  onPress,
  isLoading = false,
  disabled = false,
  style,
}: SubmitButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      role="button"
      aria-label={label}
      style={[styles.button, isDisabled && styles.buttonDisabled, style]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {isLoading ? (
        <ActivityIndicator aria-label="Loading" color={colors.white} />
      ) : (
        <Text style={styles.text}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.text,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  text: {
    color: colors.white,
    fontSize: fontSizes.xl,
    fontWeight: '600',
  },
});
