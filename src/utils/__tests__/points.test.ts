import { formatPoints, pointsColor, rankBadgeColors } from '@/utils/points';

describe('formatPoints()', () => {
  it('prefixes positive points with +', () => {
    expect(formatPoints(5)).toBe('+5');
  });

  it('leaves negative points as-is', () => {
    expect(formatPoints(-5)).toBe('-5');
  });

  it('does not prefix zero', () => {
    expect(formatPoints(0)).toBe('0');
  });
});

describe('pointsColor()', () => {
  it('is green for positive points', () => {
    expect(pointsColor(5)).toBe('#166534');
  });

  it('is red for negative points', () => {
    expect(pointsColor(-5)).toBe('#B91C1C');
  });

  it('is gray for zero', () => {
    expect(pointsColor(0)).toBe('#4B5563');
  });
});

describe('rankBadgeColors()', () => {
  it('highlights the top three', () => {
    expect(rankBadgeColors(1).bg).toBe('#F59E0B');
    expect(rankBadgeColors(2).bg).toBe('#6B7280');
    expect(rankBadgeColors(3).bg).toBe('#B45309');
  });

  it('is neutral below third place and when unranked', () => {
    expect(rankBadgeColors(4)).toEqual(rankBadgeColors(null));
    expect(rankBadgeColors(null).bg).toBe('#F3F4F6');
  });
});
