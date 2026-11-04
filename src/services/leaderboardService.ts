import { BASE_SCORE } from '@/constants/scoring';
import { supabase } from '@/lib/supabase';
import { serviceError } from '@/services/serviceError';
import { EmployeeRole } from '@/types/employee';
import { LeaderboardEntry } from '@/types/leaderboard';

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
    totalPoints: BASE_SCORE + Number(row.total_points),
    rank: Number(row.rank),
  };
}

export async function getLeaderboard(locationId?: string): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_leaderboard', {
    p_location_id: locationId ?? null,
  });
  if (error) throw serviceError('leaderboardService: load', error, 'Failed to load leaderboard.');
  return (data as RpcRow[]).map(mapEntry);
}
