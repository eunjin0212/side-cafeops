import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { signIn } from '@/services/authService';
import { ErrorText } from '@/components/molecules/ErrorText';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(data: LoginFormValues): Promise<void> {
    setAuthError(null);
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      router.replace('/');
    } catch {
      setAuthError('Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner} role="form">
        <Text style={styles.title}>CafeOps</Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
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
            />
          )}
        />
        {errors.email && <Text style={styles.fieldError}>{errors.email.message}</Text>}

        <View style={styles.passwordWrapper}>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  errors.password && styles.inputError,
                ]}
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
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
              />
            )}
          />
          <Pressable
            style={styles.passwordToggle}
            onPress={() => setIsPasswordVisible((visible) => !visible)}
            hitSlop={8}
          >
            <Text style={styles.passwordToggleText}>
              {isPasswordVisible ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
        </View>
        {errors.password && <Text style={styles.fieldError}>{errors.password.message}</Text>}

        {authError !== null && <ErrorText>{authError}</ErrorText>}

        <Pressable
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    color: '#111827',
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  inputError: {
    borderColor: '#DC2626',
  },
  fieldError: {
    fontSize: 12,
    color: '#DC2626',
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
    right: 16,
  },
  passwordToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  button: {
    height: 52,
    backgroundColor: '#111827',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
