import { supabase } from '@/lib/supabase';
import { getLeaderboard } from '@/services/leaderboardService';

jest.mock('@/lib/supabase', () => ({
  supabase: { rpc: jest.fn() },
}));

const mockedRpc = supabase.rpc as unknown as jest.Mock;

describe('getLeaderboard()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRpc.mockResolvedValue({
      data: [
        {
          profile_id: 'p1',
          full_name: 'Sam',
          email: 'sam@example.com',
          role: 'staff',
          location_id: null,
          location_name: null,
          total_points: -5,
          rank: 2,
        },
      ],
      error: null,
    });
  });

  it('asks for the current cycle by default', async () => {
    await getLeaderboard();

    expect(mockedRpc).toHaveBeenCalledWith('get_leaderboard', {
      p_location_id: null,
      p_cycle_id: null,
    });
  });

  it('passes the requested location and cycle', async () => {
    await getLeaderboard('location-1', 'cycle-1');

    expect(mockedRpc).toHaveBeenCalledWith('get_leaderboard', {
      p_location_id: 'location-1',
      p_cycle_id: 'cycle-1',
    });
  });

  it('adds the base score to the displayed total', async () => {
    const [entry] = await getLeaderboard();

    expect(entry.totalPoints).toBe(195);
    expect(entry.rank).toBe(2);
  });
});
