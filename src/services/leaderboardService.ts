import { supabase } from '@/lib/supabase';
import { LeaderboardEntry, CycleSummary } from '@/types/leaderboard';
import { EmployeeRole } from '@/types/employee';

type RpcRow = {
  profile_id: string;
  full_name: string | null;
  email: string;
  role: string;
  location_id: string | null;
  location_name: string | null;
  total_points: number;
  rank: number;
};

function mapEntry(row: RpcRow): LeaderboardEntry {
  return {
    profileId: row.profile_id,
    fullName: row.full_name,
    email: row.email,
    role: row.role as EmployeeRole,
    locationId: row.location_id,
    locationName: row.location_name,
    totalPoints: Number(row.total_points),
    rank: Number(row.rank),
  };
}

export async function getLeaderboard(locationId?: string): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_leaderboard', {
    p_location_id: locationId ?? null,
  });
  if (error) throw new Error('Failed to load leaderboard.');
  return (data as RpcRow[]).map(mapEntry);
}

export async function getCurrentCycle(): Promise<CycleSummary | null> {
  const { data, error } = await supabase
    .from('score_cycles')
    .select('started_at, ended_at')
    .eq('is_active', true)
    .gt('ended_at', new Date().toISOString())
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return { startedAt: data.started_at, endedAt: data.ended_at };
}
