import { computeLocationStats } from '@/utils/scoreStats';

const BASE_SCORE = 200;

describe('computeLocationStats()', () => {
  it('sums positive and negative points separately', () => {
    const entries = [
      { locationId: 'loc-1', points: 5 },
      { locationId: 'loc-1', points: -2 },
      { locationId: 'loc-1', points: 3 },
    ];

    const stats = computeLocationStats(entries, 'loc-1', BASE_SCORE);

    expect(stats.positive).toBe(8);
    expect(stats.negative).toBe(-2);
    expect(stats.entries).toHaveLength(3);
  });

  it('adds BASE_SCORE plus the sum of all points for the final score', () => {
    const entries = [
      { locationId: 'loc-1', points: 5 },
      { locationId: 'loc-1', points: -2 },
    ];

    const stats = computeLocationStats(entries, 'loc-1', BASE_SCORE);

    expect(stats.score).toBe(203); // 200 + 5 - 2
  });

  it('only includes entries for the requested location', () => {
    const entries = [
      { locationId: 'loc-1', points: 5 },
      { locationId: 'loc-2', points: 10 },
    ];

    const stats = computeLocationStats(entries, 'loc-1', BASE_SCORE);

    expect(stats.entries).toEqual([{ locationId: 'loc-1', points: 5 }]);
    expect(stats.positive).toBe(5);
  });

  it('returns BASE_SCORE with zero positive/negative when there are no entries', () => {
    const stats = computeLocationStats([], 'loc-1', BASE_SCORE);

    expect(stats.positive).toBe(0);
    expect(stats.negative).toBe(0);
    expect(stats.score).toBe(BASE_SCORE);
  });
});
