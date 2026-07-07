export type ScoreSection =
  | 'daily_performance'
  | 'manager_review'
  | 'positive_addup'
  | 'management_people';

export type ScoreCategory = {
  id: string;
  name: string;
  section: ScoreSection;
  points: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateScoreCategoryInput = {
  name: string;
  section: ScoreSection;
  points: number;
};

export type UpdateScoreCategoryInput = {
  name?: string;
  section?: ScoreSection;
  points?: number;
  isActive?: boolean;
};
