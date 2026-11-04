import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { z } from 'zod';

import { ErrorText } from '@/components/molecules/ErrorText';
import { ScreenTitle } from '@/components/molecules/ScreenTitle';
import { SubmitButton } from '@/components/molecules/SubmitButton';
import { colors, fontSizes } from '@/constants/theme';
import { useSignIn } from '@/hooks/useSignIn';
import { fieldA11yProps } from '@/utils/a11y';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { mutate: signIn, isPending: isLoading, error } = useSignIn();
  const authError = error?.message ?? null;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  function onSubmit(data: LoginFormValues): void {
    signIn(data, { onSuccess: () => router.replace('/') });
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner} role="form">
        <ScreenTitle style={styles.title} documentTitle="Sign In · Twilight Cafe">
          Twilight Cafe & Bar
        </ScreenTitle>

        <Text style={styles.label}>Email</Text>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              aria-label="Email"
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              editable={!isLoading}
              nativeID="email"
              autoComplete="email"
              textContentType="username"
              {...fieldA11yProps({
                required: true,
                error: errors.email?.message,
                errorId: 'login-email-error',
              })}
            />
          )}
        />
        {errors.email && (
          <Text role="alert" nativeID="login-email-error" style={styles.fieldError}>
            {errors.email.message}
          </Text>
        )}

        <Text style={styles.label}>Password</Text>

        <View style={styles.passwordWrapper}>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                aria-label="Password"
                placeholder="Enter your password"
                placeholderTextColor={colors.textMuted}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry={!isPasswordVisible}
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit)}
                editable={!isLoading}
                nativeID="password"
                autoComplete="current-password"
                textContentType="password"
                {...fieldA11yProps({
                  required: true,
                  error: errors.password?.message,
                  errorId: 'login-password-error',
                })}
              />
            )}
          />
          <Pressable
            role="button"
            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
            style={styles.passwordToggle}
            onPress={() => setIsPasswordVisible((visible) => !visible)}
            hitSlop={8}
          >
            <Text style={styles.passwordToggleText}>{isPasswordVisible ? 'Hide' : 'Show'}</Text>
          </Pressable>
        </View>
        {errors.password && (
          <Text role="alert" nativeID="login-password-error" style={styles.fieldError}>
            {errors.password.message}
          </Text>
        )}

        {authError !== null && <ErrorText>{authError}</ErrorText>}

        <SubmitButton
          label="Sign In"
          onPress={handleSubmit(onSubmit)}
          isLoading={isLoading}
          style={styles.submit}
        />

        <Pressable
          role="link"
          aria-label="How to install this app on your phone"
          style={styles.installLink}
          onPress={() => router.push('/install')}
          hitSlop={8}
        >
          <Text style={styles.installLinkText}>How to install this app on your phone →</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  submit: {
    height: 52,
    justifyContent: 'center',
    paddingVertical: 0,
    marginTop: 4,
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    fontSize: fontSizes.h2,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    color: colors.text,
  },
  label: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: -6,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.textMuted,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: fontSizes.xxl,
    color: colors.text,
    backgroundColor: colors.background,
  },
  inputError: {
    borderColor: colors.danger,
  },
  fieldError: {
    fontSize: fontSizes.sm,
    color: colors.danger,
    marginTop: -4,
  },
  passwordWrapper: {
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 64,
  },
  passwordToggle: {
    position: 'absolute',
    right: 8,
    paddingHorizontal: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  passwordToggleText: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.textMuted,
  },
  installLink: {
    marginTop: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  installLinkText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
