import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CenteredScreen } from '@/components/molecules/CenteredScreen';
import { EmptyText } from '@/components/molecules/EmptyText';
import { ErrorText } from '@/components/molecules/ErrorText';
import { LoadingScreen } from '@/components/molecules/LoadingScreen';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { can } from '@/constants/permissions';
import { SCORE_SECTIONS, SCORE_SECTION_LABELS } from '@/constants/scoreSections';
import { colors, fontSizes } from '@/constants/theme';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { useScoreCategories } from '@/hooks/useScoreCategories';
import { ScoreCategory } from '@/types/score';
import { webOnlyProps } from '@/utils/a11y';
import { formatPoints } from '@/utils/points';

interface CategoryRowProps {
  category: ScoreCategory;
  canManage: boolean;
  isLast: boolean;
}

function CategoryRow({ category, canManage, isLast }: CategoryRowProps) {
  const isPositive = category.points >= 0;
  return (
    <Pressable
      role={canManage ? 'link' : undefined}
      focusable={canManage}
      style={[styles.row, !isLast && styles.rowBorder]}
      onPress={
        canManage ? () => router.navigate(`/scores/categories/${category.id}/edit`) : undefined
      }
      disabled={!canManage}
    >
      <Text style={[styles.rowName, !category.isActive && styles.rowNameInactive]}>
        {category.name}
        {!category.isActive && ' (Inactive)'}
      </Text>
      <Text style={[styles.rowPoints, isPositive ? styles.pointsPositive : styles.pointsNegative]}>
        {formatPoints(category.points)}
      </Text>
    </Pressable>
  );
}

export default function ScoreCategoriesScreen() {
  const { categories, isLoading, error } = useScoreCategories();
  const { profile } = useCurrentProfile();

  const canManage = profile !== null && can(profile.role, 'manageScoreCategories');

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <CenteredScreen>
        <ErrorText>{error}</ErrorText>
      </CenteredScreen>
    );
  }

  const visible = canManage ? categories : categories.filter((c) => c.isActive);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <ScreenHeader
          backHref="/"
          title="Score Categories"
          right={
            canManage && (
              <Pressable
                role="link"
                aria-label="Add category"
                style={styles.addButton}
                onPress={() => router.navigate('/scores/categories/new')}
                hitSlop={8}
              >
                <Text style={styles.addText}>+ Add</Text>
              </Pressable>
            )
          }
        />
      </View>

      {SCORE_SECTIONS.map((section) => {
        const rows = visible.filter((c) => c.section === section);
        if (rows.length === 0 && !canManage) return null;
        return (
          <View key={section} style={styles.section}>
            <Text role="heading" style={styles.sectionLabel} {...webOnlyProps({ 'aria-level': 2 })}>
              {SCORE_SECTION_LABELS[section]}
            </Text>
            <View style={styles.card}>
              {rows.length === 0 ? (
                <View style={styles.row}>
                  <EmptyText>No categories yet</EmptyText>
                </View>
              ) : (
                rows.map((cat, i) => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    canManage={canManage}
                    isLast={i === rows.length - 1}
                  />
                ))
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 28,
  },
  addButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  addText: {
    fontSize: fontSizes.xl,
    color: colors.text,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceMuted,
  },
  rowName: {
    flex: 1,
    fontSize: fontSizes.xl,
    color: colors.text,
  },
  rowNameInactive: {
    color: colors.textMuted,
  },
  rowPoints: {
    fontSize: fontSizes.xl,
    fontWeight: '600',
    marginLeft: 12,
  },
  pointsPositive: {
    color: colors.success,
  },
  pointsNegative: {
    color: colors.danger,
  },
});
