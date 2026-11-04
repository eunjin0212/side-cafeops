import { router, useLocalSearchParams } from 'expo-router';

import { LoadingScreen } from '@/components/molecules/LoadingScreen';
import { CategoryForm, CategorySubmission } from '@/components/organisms/CategoryForm';
import { usePermissionGate } from '@/hooks/usePermissionGate';
import { useScoreCategories } from '@/hooks/useScoreCategories';
import { useUpdateScoreCategory } from '@/hooks/useUpdateScoreCategory';
import { goBack } from '@/utils/navigation';

export default function EditScoreCategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isLoading: profileLoading } = usePermissionGate(
    'manageScoreCategories',
    '/scores/categories',
  );
  const { categories, isLoading } = useScoreCategories();
  const { mutate: updateCategory, isPending, error } = useUpdateScoreCategory(id);

  const category = categories.find((c) => c.id === id);

  function handleSubmit(submission: CategorySubmission): void {
    updateCategory(submission, { onSuccess: () => router.replace('/scores/categories') });
  }

  if (profileLoading || isLoading || !category) {
    return <LoadingScreen />;
  }

  return (
    <CategoryForm
      title="Edit Category"
      submitLabel="Save Changes"
      category={category}
      isSubmitting={isPending}
      submitError={error?.message ?? null}
      onSubmit={handleSubmit}
      onDismiss={() => goBack('/scores/categories')}
    />
  );
}
