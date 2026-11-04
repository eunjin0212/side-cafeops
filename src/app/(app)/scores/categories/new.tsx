import { router } from 'expo-router';

import { LoadingScreen } from '@/components/molecules/LoadingScreen';
import { CategoryForm, CategorySubmission } from '@/components/organisms/CategoryForm';
import { useCreateScoreCategory } from '@/hooks/useCreateScoreCategory';
import { usePermissionGate } from '@/hooks/usePermissionGate';
import { goBack } from '@/utils/navigation';

export default function NewScoreCategoryScreen() {
  const { isLoading: profileLoading } = usePermissionGate(
    'manageScoreCategories',
    '/scores/categories',
  );
  const { mutate: createCategory, isPending, error } = useCreateScoreCategory();

  function handleSubmit({ name, section, points }: CategorySubmission): void {
    createCategory(
      { name, section, points },
      { onSuccess: () => router.replace('/scores/categories') },
    );
  }

  if (profileLoading) {
    return <LoadingScreen />;
  }

  return (
    <CategoryForm
      title="New Category"
      submitLabel="Create Category"
      isSubmitting={isPending}
      submitError={error?.message ?? null}
      onSubmit={handleSubmit}
      onDismiss={() => goBack('/scores/categories')}
    />
  );
}
