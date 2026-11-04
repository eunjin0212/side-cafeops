import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { ErrorBanner } from '@/components/molecules/ErrorBanner';
import { FormField } from '@/components/molecules/FormField';
import { FormHeader } from '@/components/molecules/FormHeader';
import { FormScreen } from '@/components/molecules/FormScreen';
import { PillRadioGroup } from '@/components/molecules/PillRadioGroup';
import { SubmitButton } from '@/components/molecules/SubmitButton';
import { SwitchField } from '@/components/molecules/SwitchField';
import { TextField } from '@/components/molecules/TextField';
import { SCORE_SECTION_LABELS, SCORE_SECTIONS } from '@/constants/scoreSections';
import { ScoreCategory, ScoreSection } from '@/types/score';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  section: z.enum(SCORE_SECTIONS),
  points: z
    .string()
    .min(1, 'Points is required')
    .regex(/^-?\d+$/, 'Must be a whole number (e.g. -5 or 5)')
    .refine((v) => v !== '0', 'Points cannot be zero'),
  isActive: z.boolean(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export type CategorySubmission = {
  name: string;
  section: ScoreSection;
  points: number;
  isActive: boolean;
};

const SECTION_OPTIONS = SCORE_SECTIONS.map((section) => ({
  value: section,
  label: SCORE_SECTION_LABELS[section],
}));

export interface CategoryFormProps {
  title: string;
  submitLabel: string;
  category?: ScoreCategory;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (submission: CategorySubmission) => void;
  onDismiss: () => void;
}

export function CategoryForm({
  title,
  submitLabel,
  category,
  isSubmitting,
  submitError,
  onSubmit,
  onDismiss,
}: CategoryFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      section: 'daily_performance',
      points: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        section: category.section,
        points: String(category.points),
        isActive: category.isActive,
      });
    }
  }, [category, reset]);

  function submit(values: CategoryFormValues): void {
    onSubmit({
      name: values.name.trim(),
      section: values.section,
      points: parseInt(values.points, 10),
      isActive: values.isActive,
    });
  }

  return (
    <FormScreen>
      <FormHeader title={title} onDismiss={onDismiss} />
      <ErrorBanner message={submitError} />

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Name"
            required
            errorId="category-name-error"
            error={errors.name?.message}
            placeholder="e.g. Late / late notice"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />

      <FormField label="Section" required>
        <Controller
          control={control}
          name="section"
          render={({ field: { onChange, value } }) => (
            <PillRadioGroup
              label="Section"
              options={SECTION_OPTIONS}
              value={value}
              onChange={onChange}
            />
          )}
        />
      </FormField>

      <Controller
        control={control}
        name="points"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Points"
            required
            errorId="category-points-error"
            error={errors.points?.message}
            placeholder="e.g. -5 or 5"
            keyboardType="numbers-and-punctuation"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />

      {category && (
        <Controller
          control={control}
          name="isActive"
          render={({ field: { onChange, value } }) => (
            <SwitchField
              label="Active"
              hint="Inactive categories cannot be used in score entries."
              value={value}
              onChange={onChange}
            />
          )}
        />
      )}

      <SubmitButton
        label={submitLabel}
        onPress={handleSubmit(submit)}
        isLoading={isSubmitting}
        disabled={!isDirty}
      />
    </FormScreen>
  );
}
