import { EmployeeRole } from '@/types/employee';

export type LeaderboardEntry = {
  profileId: string;
  fullName: string | null;
  email: string;
  role: EmployeeRole;
  locationId: string | null;
  locationName: string | null;
  totalPoints: number;
  rank: number;
};

export type CycleSummary = {
  startedAt: string;
  endedAt: string;
};
