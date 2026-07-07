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

export type ScoreCycle = {
  id: string;
  startedAt: string;
  endedAt: string;
  isActive: boolean;
  createdAt: string;
};

export type ScoreEntry = {
  id: string;
  cycleId: string;
  profileId: string;
  categoryId: string;
  points: number;
  notes: string | null;
  imageUrls: string[];
  submittedBy: string;
  correctionFor: string | null;
  createdAt: string;
};

export type CreateScoreEntryInput = {
  profileId: string;
  categoryId: string;
  points: number;
  notes?: string;
  correctionFor?: string;
};

export type CreateScoreEntriesBatchInput = {
  profileIds: string[];
  selections: { categoryId: string; points: number }[];
  notes?: string;
  imageUris?: string[];
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
