import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { ErrorBanner } from '@/components/molecules/ErrorBanner';
import { FormField } from '@/components/molecules/FormField';
import { FormHeader } from '@/components/molecules/FormHeader';
import { FormScreen } from '@/components/molecules/FormScreen';
import { LoadingScreen } from '@/components/molecules/LoadingScreen';
import { OptionList } from '@/components/molecules/OptionList';
import { PillRadioGroup } from '@/components/molecules/PillRadioGroup';
import { ReadOnlyValue } from '@/components/molecules/ReadOnlyValue';
import { SubmitButton } from '@/components/molecules/SubmitButton';
import { TextField } from '@/components/molecules/TextField';
import { ROLE_HIERARCHY } from '@/constants/permissions';
import { EMPLOYEE_ROLES, ROLE_OPTIONS } from '@/constants/roles';
import { useCreateInvitation } from '@/hooks/useCreateInvitation';
import { useLocations } from '@/hooks/useLocations';
import { usePermissionGate } from '@/hooks/usePermissionGate';
import { showNotice } from '@/utils/dialogs';
import { goBack } from '@/utils/navigation';

const inviteSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Invalid email address'),
  role: z.enum(EMPLOYEE_ROLES),
  locationId: z.string().optional(),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export default function InviteEmployeeScreen() {
  const { profile: currentProfile, isLoading: profileLoading } = usePermissionGate(
    'inviteEmployee',
    '/employees',
  );
  const { locations } = useLocations();
  const { mutate: createInvitation, isPending, error } = useCreateInvitation();

  const availableRoles = currentProfile
    ? ROLE_OPTIONS.filter((opt) => ROLE_HIERARCHY[opt.value] < ROLE_HIERARCHY[currentProfile.role])
    : [];

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'staff',
    },
  });

  function onSubmit(data: InviteFormValues): void {
    createInvitation(
      { email: data.email, role: data.role, locationId: data.locationId },
      {
        onSuccess: () => {
          showNotice('Invitation Sent', `Invitation sent to ${data.email}.`, () =>
            router.navigate('/employees'),
          );
        },
      },
    );
  }

  if (profileLoading) {
    return <LoadingScreen />;
  }

  return (
    <FormScreen>
      <FormHeader title="Invite Employee" onDismiss={() => goBack('/employees')} />
      <ErrorBanner message={error?.message ?? null} />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Email"
            required
            errorId="invite-email-error"
            error={errors.email?.message}
            placeholder="employee@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />

      <FormField label="Role" required>
        <Controller
          control={control}
          name="role"
          render={({ field: { onChange, value } }) => (
            <PillRadioGroup
              label="Role"
              options={availableRoles}
              value={value}
              onChange={onChange}
            />
          )}
        />
      </FormField>

      <FormField label="Location">
        <Controller
          control={control}
          name="locationId"
          render={({ field: { onChange, value } }) =>
            locations.length === 0 ? (
              <ReadOnlyValue>No locations available</ReadOnlyValue>
            ) : (
              <OptionList
                label="Location"
                selectionMode="single"
                options={locations}
                selectedIds={value ? [value] : []}
                onToggle={(id) => onChange(value === id ? undefined : id)}
              />
            )
          }
        />
      </FormField>

      <SubmitButton label="Send Invite" onPress={handleSubmit(onSubmit)} isLoading={isPending} />
    </FormScreen>
  );
}
