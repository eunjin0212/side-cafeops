import { formatPoints, pointsColor } from '@/utils/points';

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
    expect(pointsColor(5)).toBe('#16A34A');
  });

  it('is red for negative points', () => {
    expect(pointsColor(-5)).toBe('#DC2626');
  });

  it('is gray for zero', () => {
    expect(pointsColor(0)).toBe('#6B7280');
  });
});
