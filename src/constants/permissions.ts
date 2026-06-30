import { EmployeeRole } from '@/types/employee';

export type Permission =
  | 'inviteEmployee'
  | 'viewInvitations'
  | 'manageScores'
  | 'manageScoreCategories'
  | 'manageLocations';

const PERMISSIONS: Record<Permission, EmployeeRole[]> = {
  inviteEmployee: ['location_manager', 'general_manager', 'owner'],
  viewInvitations: ['location_manager', 'general_manager', 'owner'],
  manageScores: ['supervisor', 'location_manager', 'general_manager', 'owner'],
  manageScoreCategories: ['general_manager', 'owner'],
  manageLocations: ['general_manager', 'owner'],
};

export function can(role: EmployeeRole, permission: Permission): boolean {
  return PERMISSIONS[permission].includes(role);
}
