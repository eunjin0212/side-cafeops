import {
  formatDateTime,
  formatDotDate,
  formatMonthDay,
  formatRelativeDateTime,
} from '@/utils/dates';

// Built from local time so the tests pass in any timezone.
const iso = new Date(2026, 9, 5, 15, 7).toISOString();

describe('formatMonthDay()', () => {
  it('shows the short month and day', () => {
    expect(formatMonthDay(iso)).toBe('Oct 5');
  });
});

describe('formatDotDate()', () => {
  it('pads the month and day', () => {
    expect(formatDotDate(new Date(2026, 0, 2).toISOString())).toBe('2026.01.02');
  });
});

describe('formatDateTime()', () => {
  it('shows the date and time', () => {
    expect(formatDateTime(iso)).toMatch(/^Oct 5, 3:07\sPM$/);
  });
});

describe('formatRelativeDateTime()', () => {
  it('says Today on the same day', () => {
    expect(formatRelativeDateTime(iso, new Date(2026, 9, 5, 23, 0))).toMatch(/^Today, 3:07\sPM$/);
  });

  it('says Yesterday across a month boundary', () => {
    const lastOfMonth = new Date(2026, 8, 30, 15, 7).toISOString();
    expect(formatRelativeDateTime(lastOfMonth, new Date(2026, 9, 1, 8, 0))).toMatch(
      /^Yesterday, 3:07\sPM$/,
    );
  });

  it('shows the date when older', () => {
    expect(formatRelativeDateTime(iso, new Date(2026, 9, 8, 8, 0))).toMatch(/^Oct 5, 3:07\sPM$/);
  });
});
