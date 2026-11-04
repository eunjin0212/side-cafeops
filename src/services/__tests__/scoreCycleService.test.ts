import { supabase } from '@/lib/supabase';
import { getCurrentCycle, getCurrentCycleId } from '@/services/scoreCycleService';

jest.mock('@/lib/supabase', () => ({
  supabase: { rpc: jest.fn(), from: jest.fn() },
}));

const mockedSupabase = supabase as unknown as { rpc: jest.Mock; from: jest.Mock };

function mockCycleRow(result: { data: unknown; error: unknown }): void {
  const single = jest.fn().mockResolvedValue(result);
  const eq = jest.fn().mockReturnValue({ single });
  const select = jest.fn().mockReturnValue({ eq });
  mockedSupabase.from.mockReturnValue({ select });
}

describe('scoreCycleService', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  describe('getCurrentCycleId()', () => {
    it('asks the database to resolve the current cycle', async () => {
      mockedSupabase.rpc.mockResolvedValue({ data: 'cycle-1', error: null });

      await expect(getCurrentCycleId()).resolves.toBe('cycle-1');
      expect(mockedSupabase.rpc).toHaveBeenCalledWith('get_or_create_current_cycle');
    });

    it('hides database errors from users', async () => {
      mockedSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'relation missing' } });

      await expect(getCurrentCycleId()).rejects.toThrow('Failed to resolve current score cycle.');
    });
  });

  describe('getCurrentCycle()', () => {
    it('maps the resolved cycle', async () => {
      mockedSupabase.rpc.mockResolvedValue({ data: 'cycle-1', error: null });
      mockCycleRow({
        data: { id: 'cycle-1', started_at: '2026-11-03', ended_at: '2026-11-17' },
        error: null,
      });

      await expect(getCurrentCycle()).resolves.toEqual({
        id: 'cycle-1',
        startedAt: '2026-11-03',
        endedAt: '2026-11-17',
      });
    });

    it('reports a failure instead of pretending there is no cycle', async () => {
      mockedSupabase.rpc.mockResolvedValue({ data: 'cycle-1', error: null });
      mockCycleRow({ data: null, error: { message: 'network down' } });

      await expect(getCurrentCycle()).rejects.toThrow('Failed to load score cycle.');
    });
  });
});
