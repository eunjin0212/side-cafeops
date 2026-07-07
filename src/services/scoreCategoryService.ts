import { supabase } from '@/lib/supabase';
import {
  ScoreCategory,
  CreateScoreCategoryInput,
  UpdateScoreCategoryInput,
} from '@/types/score';

const CATEGORY_QUERY =
  'id, name, section, points, is_active, created_at, updated_at' as const;

function mapScoreCategory(row: {
  id: string;
  name: string;
  section: string;
  points: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}): ScoreCategory {
  return {
    id: row.id,
    name: row.name,
    section: row.section as ScoreCategory['section'],
    points: row.points,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getScoreCategories(): Promise<ScoreCategory[]> {
  const { data, error } = await supabase
    .from('score_categories')
    .select(CATEGORY_QUERY)
    .order('section')
    .order('name');

  if (error) throw error;
  return data.map(mapScoreCategory);
}

export async function createScoreCategory(
  input: CreateScoreCategoryInput,
): Promise<ScoreCategory> {
  const { data, error } = await supabase
    .from('score_categories')
    .insert({ name: input.name, section: input.section, points: input.points })
    .select(CATEGORY_QUERY)
    .single();

  if (error) {
    if (error.code === '42501') {
      throw new Error('You do not have permission to create score categories.');
    }
    throw new Error('Failed to create category. Please try again.');
  }

  return mapScoreCategory(data);
}

export async function updateScoreCategory(
  id: string,
  input: UpdateScoreCategoryInput,
): Promise<ScoreCategory> {
  const { data, error } = await supabase
    .from('score_categories')
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.section !== undefined && { section: input.section }),
      ...(input.points !== undefined && { points: input.points }),
      ...(input.isActive !== undefined && { is_active: input.isActive }),
    })
    .eq('id', id)
    .select(CATEGORY_QUERY)
    .single();

  if (error) {
    if (error.code === '42501') {
      throw new Error('You do not have permission to update score categories.');
    }
    throw new Error('Failed to update category. Please try again.');
  }

  return mapScoreCategory(data);
}
