import { supabase } from '@/lib/supabase';
import {
  ScoreEntry,
  CreateScoreEntryInput,
  CreateScoreEntriesBatchInput,
} from '@/types/score';
import { uploadScoreImages } from '@/services/storageService';

const ENTRY_QUERY =
  'id, cycle_id, profile_id, category_id, points, notes, image_urls, submitted_by, correction_for, location_id, created_at' as const;

function mapScoreEntry(row: {
  id: string;
  cycle_id: string;
  profile_id: string;
  category_id: string;
  points: number;
  notes: string | null;
  image_urls: string[];
  submitted_by: string;
  correction_for: string | null;
  location_id: string | null;
  created_at: string;
}): ScoreEntry {
  return {
    id: row.id,
    cycleId: row.cycle_id,
    profileId: row.profile_id,
    categoryId: row.category_id,
    points: row.points,
    notes: row.notes,
    imageUrls: row.image_urls,
    submittedBy: row.submitted_by,
    correctionFor: row.correction_for,
    locationId: row.location_id,
    createdAt: row.created_at,
  };
}

async function getCurrentCycleId(): Promise<string> {
  const { data, error } = await supabase.rpc('get_or_create_current_cycle');
  if (error) throw new Error('Failed to resolve current score cycle.');
  return data as string;
}

export async function createScoreEntry(
  input: CreateScoreEntryInput,
): Promise<ScoreEntry> {
  const cycleId = await getCurrentCycleId();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) throw new Error('Authentication required.');

  const { data, error } = await supabase
    .from('score_entries')
    .insert({
      cycle_id: cycleId,
      profile_id: input.profileId,
      category_id: input.categoryId,
      points: input.points,
      notes: input.notes ?? null,
      image_urls: [],
      submitted_by: user.id,
      correction_for: input.correctionFor ?? null,
      location_id: input.locationId ?? null,
    })
    .select(ENTRY_QUERY)
    .single();

  if (error) {
    if (error.code === '42501') {
      throw new Error('You do not have permission to submit score entries.');
    }
    throw new Error('Failed to submit score entry. Please try again.');
  }

  return mapScoreEntry(data);
}

// Read-only fetch for a known cycle — the caller resolves the current
// cycle (leaderboardService.getCurrentCycle) so both the cycle summary
// and these entries always agree on which cycle is "current."
export async function getMyScoreEntries(
  profileId: string,
  cycleId: string,
): Promise<ScoreEntry[]> {
  const { data, error } = await supabase
    .from('score_entries')
    .select(ENTRY_QUERY)
    .eq('profile_id', profileId)
    .eq('cycle_id', cycleId)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Failed to load score entries.');
  return data.map(mapScoreEntry);
}

export async function createScoreEntries(
  input: CreateScoreEntriesBatchInput,
): Promise<ScoreEntry[]> {
  const cycleId = await getCurrentCycleId();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) throw new Error('Authentication required.');

  const imageUrls =
    input.imageUris && input.imageUris.length > 0
      ? await uploadScoreImages(input.imageUris, user.id)
      : [];

  const rows = input.profiles.flatMap(({ profileId, locationId }) =>
    input.selections.map((s) => ({
      cycle_id: cycleId,
      profile_id: profileId,
      category_id: s.categoryId,
      points: s.points,
      notes: input.notes ?? null,
      image_urls: imageUrls,
      submitted_by: user.id,
      correction_for: null,
      location_id: locationId,
    })),
  );

  const { data, error } = await supabase
    .from('score_entries')
    .insert(rows)
    .select(ENTRY_QUERY);

  if (error) {
    if (error.code === '42501') {
      throw new Error('You do not have permission to submit score entries.');
    }
    throw new Error('Failed to submit score entries. Please try again.');
  }

  return data.map(mapScoreEntry);
}
