import { colors } from '@/constants/theme';
export function formatPoints(points: number): string {
  return points > 0 ? `+${points}` : String(points);
}

export function pointsColor(points: number): string {
  if (points > 0) return colors.success;
  if (points < 0) return colors.dangerStrong;
  return colors.textTertiary;
}

export function rankBadgeColors(rank: number | null): { bg: string; text: string } {
  if (rank === 1) return { bg: colors.rankGold, text: colors.text };
  if (rank === 2) return { bg: colors.textMuted, text: colors.white };
  if (rank === 3) return { bg: colors.rankBronze, text: colors.white };
  return { bg: colors.surfaceMuted, text: colors.textTertiary };
}
