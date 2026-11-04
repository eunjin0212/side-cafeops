export function formatPoints(points: number): string {
  return points > 0 ? `+${points}` : String(points);
}

export function pointsColor(points: number): string {
  if (points > 0) return '#166534';
  if (points < 0) return '#B91C1C';
  return '#4B5563';
}
