import { EmployeeRole } from '@/types/employee';

const PERMISSIONS = {
  inviteEmployee: ['location_manager', 'general_manager', 'owner'],
  viewInvitations: ['location_manager', 'general_manager', 'owner'],
  manageScores: ['supervisor', 'location_manager', 'general_manager', 'owner'],
  manageScoreCategories: ['general_manager', 'owner'],
  manageLocations: ['general_manager', 'owner'],
} satisfies Record<string, EmployeeRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: EmployeeRole, permission: Permission): boolean {
  return (PERMISSIONS[permission] as EmployeeRole[]).includes(role);
}
