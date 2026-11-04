import { supabase } from '@/lib/supabase';
import { serviceError } from '@/services/serviceError';
import { CycleSummary } from '@/types/leaderboard';

// Cycles run on a fixed calendar. The database creates the current one the
// first time it's needed, whether that's a read or a score submission.
export async function getCurrentCycleId(): Promise<string> {
  const { data, error } = await supabase.rpc('get_or_create_current_cycle');
  if (error) {
    throw serviceError(
      'scoreCycleService: resolve cycle',
      error,
      'Failed to resolve current score cycle.',
    );
  }
  return data as string;
}

export async function getCurrentCycle(): Promise<CycleSummary> {
  const id = await getCurrentCycleId();

  const { data, error } = await supabase
    .from('score_cycles')
    .select('id, started_at, ended_at')
    .eq('id', id)
    .single();

  if (error) {
    throw serviceError('scoreCycleService: load cycle', error, 'Failed to load score cycle.');
  }
  return { id: data.id, startedAt: data.started_at, endedAt: data.ended_at };
}

// Newest first. Resolves the current cycle first so a new one is included.
export async function getScoreCycles(): Promise<CycleSummary[]> {
  await getCurrentCycleId();

  const { data, error } = await supabase
    .from('score_cycles')
    .select('id, started_at, ended_at')
    .lte('started_at', new Date().toISOString())
    .order('started_at', { ascending: false });

  if (error) {
    throw serviceError('scoreCycleService: load cycles', error, 'Failed to load score cycles.');
  }
  return data.map((row) => ({ id: row.id, startedAt: row.started_at, endedAt: row.ended_at }));
}
