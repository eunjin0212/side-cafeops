export type ScoredEntry = {
  locationId: string | null;
  points: number;
};

export type LocationStats<T extends ScoredEntry> = {
  entries: T[];
  positive: number;
  negative: number;
  score: number;
};

// Performance Score = BASE_SCORE + SUM(points), scoped to one location.
// Positive/negative are summed separately for display (per the scoring
// rules in CLAUDE.md).
export function computeLocationStats<T extends ScoredEntry>(
  entries: T[],
  locationId: string,
  base: number,
): LocationStats<T> {
  const locEntries = entries.filter((e) => e.locationId === locationId);
  const positive = locEntries.reduce((sum, e) => (e.points > 0 ? sum + e.points : sum), 0);
  const negative = locEntries.reduce((sum, e) => (e.points < 0 ? sum + e.points : sum), 0);
  return { entries: locEntries, positive, negative, score: base + positive + negative };
}
