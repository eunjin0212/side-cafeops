import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { useScoreCategories } from '@/hooks/useScoreCategories';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { can } from '@/constants/permissions';
import { SCORE_SECTIONS, SCORE_SECTION_LABELS } from '@/constants/scoreSections';
import { ScoreCategory } from '@/types/score';
import { goBack } from '@/utils/navigation';

function formatPoints(points: number): string {
  return points >= 0 ? `+${points}` : `${points}`;
}

interface CategoryRowProps {
  category: ScoreCategory;
  canManage: boolean;
  isLast: boolean;
}

function CategoryRow({ category, canManage, isLast }: CategoryRowProps) {
  const isPositive = category.points >= 0;
  return (
    <Pressable
      style={[styles.row, !isLast && styles.rowBorder]}
      onPress={canManage ? () => router.navigate(`/scores/categories/${category.id}/edit`) : undefined}
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
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const visible = canManage ? categories : categories.filter((c) => c.isActive);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Pressable onPress={() => goBack('/')} hitSlop={8}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        {canManage && (
          <Pressable
            onPress={() => router.navigate('/scores/categories/new')}
            hitSlop={8}
          >
            <Text style={styles.addText}>+ Add</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.title}>Score Categories</Text>

      {SCORE_SECTIONS.map((section) => {
        const rows = visible.filter((c) => c.section === section);
        if (rows.length === 0 && !canManage) return null;
        return (
          <View key={section} style={styles.section}>
            <Text style={styles.sectionLabel}>{SCORE_SECTION_LABELS[section]}</Text>
            <View style={styles.card}>
              {rows.length === 0 ? (
                <View style={styles.row}>
                  <Text style={styles.emptyText}>No categories yet</Text>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  scroll: { flex: 1, backgroundColor: '#fff' },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  backText: { fontSize: 15, color: '#6B7280' },
  addText: { fontSize: 15, color: '#111827', fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 28 },
  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowName: { flex: 1, fontSize: 15, color: '#111827' },
  rowNameInactive: { color: '#9CA3AF' },
  rowPoints: { fontSize: 15, fontWeight: '600', marginLeft: 12 },
  pointsPositive: { color: '#10B981' },
  pointsNegative: { color: '#EF4444' },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
  errorText: { fontSize: 14, color: '#EF4444' },
});
