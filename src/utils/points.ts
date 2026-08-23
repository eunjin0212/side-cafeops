export function formatPoints(points: number): string {
  return points > 0 ? `+${points}` : String(points);
}

export function pointsColor(points: number): string {
  if (points > 0) return '#16A34A';
  if (points < 0) return '#DC2626';
  return '#6B7280';
}
