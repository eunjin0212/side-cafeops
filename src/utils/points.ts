export function formatPoints(points: number): string {
  return points > 0 ? `+${points}` : String(points);
}

export function pointsColor(points: number): string {
  if (points > 0) return '#166534';
  if (points < 0) return '#B91C1C';
  return '#4B5563';
}

export function rankBadgeColors(rank: number | null): { bg: string; text: string } {
  if (rank === 1) return { bg: '#F59E0B', text: '#111827' };
  if (rank === 2) return { bg: '#6B7280', text: '#fff' };
  if (rank === 3) return { bg: '#B45309', text: '#fff' };
  return { bg: '#F3F4F6', text: '#4B5563' };
}
