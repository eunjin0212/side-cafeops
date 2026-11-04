import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
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
import { SwitchField } from '@/components/molecules/SwitchField';
import { TextField } from '@/components/molecules/TextField';
import {
  canDeactivateEmployee,
  canEditEmployeeLocation,
  canEditEmployeeRole,
  canEditOwnProfile,
  ROLE_HIERARCHY,
} from '@/constants/permissions';
import { EMPLOYEE_ROLES, ROLE_OPTIONS } from '@/constants/roles';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { useEmployee } from '@/hooks/useEmployee';
import { useLocations } from '@/hooks/useLocations';
import { useSaveEmployee } from '@/hooks/useSaveEmployee';
import { UpdateEmployeeInput } from '@/types/employee';
import { confirmDestructive } from '@/utils/dialogs';
import { goBack } from '@/utils/navigation';

const editSchema = z.object({
  fullName: z.string(),
  phone: z.string(),
  role: z.enum(EMPLOYEE_ROLES),
  locationIds: z.array(z.string()),
  isActive: z.boolean(),
});

type EditFormValues = z.infer<typeof editSchema>;

export default function EmployeeEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { employee, isLoading: employeeLoading } = useEmployee(id);
  const { profile: currentProfile } = useCurrentProfile();
  const { locations } = useLocations();
  const { mutate: saveEmployee, isPending, error } = useSaveEmployee(id);

  const canSelf = currentProfile !== null && canEditOwnProfile(currentProfile.id, id);
  const canRole =
    currentProfile !== null &&
    employee !== null &&
    currentProfile.id !== id &&
    canEditEmployeeRole(currentProfile.role, employee.role);
  const canLocation =
    currentProfile !== null &&
    employee !== null &&
    currentProfile.id !== id &&
    canEditEmployeeLocation(currentProfile.role, employee.role);
  const canDeactivate =
    currentProfile !== null &&
    employee !== null &&
    currentProfile.id !== id &&
    canDeactivateEmployee(currentProfile.role, employee.role);

  const availableRoles = currentProfile
    ? ROLE_OPTIONS.filter((opt) => ROLE_HIERARCHY[opt.value] < ROLE_HIERARCHY[currentProfile.role])
    : [];

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      role: 'staff',
      locationIds: [],
      isActive: true,
    },
  });

  useEffect(() => {
    if (employee) {
      reset({
        fullName: employee.fullName ?? '',
        phone: employee.phone ?? '',
        role: employee.role,
        locationIds: employee.locations.map((l) => l.locationId),
        isActive: employee.isActive,
      });
    }
  }, [employee, reset]);

  function performSave(data: EditFormValues): void {
    const profile: UpdateEmployeeInput = {};
    if (canSelf) {
      profile.fullName = data.fullName !== '' ? data.fullName : undefined;
      profile.phone = data.phone !== '' ? data.phone : undefined;
    }
    if (canRole && data.role) {
      profile.role = data.role;
    }
    if (canDeactivate) {
      profile.isActive = data.isActive;
    }

    saveEmployee(
      { profile, locationIds: canLocation ? data.locationIds : undefined },
      { onSuccess: () => router.replace(`/employees/${id}`) },
    );
  }

  function onSubmit(data: EditFormValues): void {
    const isDeactivating = canDeactivate && !data.isActive && employee?.isActive === true;

    if (isDeactivating) {
      confirmDestructive({
        title: 'Deactivate Employee',
        message: `${employee?.fullName ?? employee?.email} will no longer be able to log in. Continue?`,
        confirmLabel: 'Deactivate',
        onConfirm: () => performSave(data),
      });
      return;
    }

    performSave(data);
  }

  if (employeeLoading || !employee || !currentProfile) {
    return <LoadingScreen />;
  }

  return (
    <FormScreen>
      <FormHeader title="Edit Employee" onDismiss={() => goBack(`/employees/${id}`)} />
      <ErrorBanner message={error?.message ?? null} />

      <FormField label="Email">
        <ReadOnlyValue>{employee.email}</ReadOnlyValue>
      </FormField>

      {canSelf && (
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Full Name"
              errorId="edit-employee-name-error"
              error={errors.fullName?.message}
              placeholder="John Doe"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
      )}

      {canSelf && (
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Phone"
              errorId="edit-employee-phone-error"
              error={errors.phone?.message}
              placeholder="01012345678"
              keyboardType="number-pad"
              onBlur={onBlur}
              onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ''))}
              value={value}
            />
          )}
        />
      )}

      {canRole && availableRoles.length > 0 && (
        <FormField label="Role">
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
      )}

      {canLocation && (
        <FormField label="Location">
          <Controller
            control={control}
            name="locationIds"
            render={({ field: { onChange, value } }) =>
              locations.length === 0 ? (
                <ReadOnlyValue>No locations available</ReadOnlyValue>
              ) : (
                <OptionList
                  label="Location"
                  selectionMode="multiple"
                  options={locations}
                  selectedIds={value}
                  onToggle={(locationId) =>
                    onChange(
                      value.includes(locationId)
                        ? value.filter((v) => v !== locationId)
                        : [...value, locationId],
                    )
                  }
                />
              )
            }
          />
        </FormField>
      )}

      {canDeactivate && (
        <Controller
          control={control}
          name="isActive"
          render={({ field: { onChange, value } }) => (
            <SwitchField
              label="Active"
              hint="Inactive employees cannot log in."
              value={value}
              onChange={onChange}
            />
          )}
        />
      )}

      <SubmitButton
        label="Save"
        onPress={handleSubmit(onSubmit)}
        isLoading={isPending}
        disabled={!isDirty}
      />
    </FormScreen>
  );
}
