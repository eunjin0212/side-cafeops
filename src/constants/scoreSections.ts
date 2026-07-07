import { ScoreSection } from '@/types/score';

export const SCORE_SECTIONS = [
  'daily_performance',
  'manager_review',
  'positive_addup',
  'management_people',
] as const satisfies readonly ScoreSection[];

export const SCORE_SECTION_LABELS: Record<ScoreSection, string> = {
  daily_performance: 'Daily Performance',
  manager_review: 'Manager Review',
  positive_addup: 'Positive Add-Up',
  management_people: 'Management & People',
};
