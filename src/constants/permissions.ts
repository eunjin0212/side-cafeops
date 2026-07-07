import { EmployeeRole } from '@/types/employee';

export const ROLE_HIERARCHY: Record<EmployeeRole, number> = {
  trainee: 0,
  staff: 1,
  supervisor: 2,
  location_manager: 3,
  general_manager: 4,
  owner: 5,
} as const;

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

export function canEditEmployeeRole(
  currentUserRole: EmployeeRole,
  targetUserRole: EmployeeRole,
): boolean {
  return (
    ROLE_HIERARCHY[currentUserRole] >= ROLE_HIERARCHY['location_manager'] &&
    ROLE_HIERARCHY[currentUserRole] > ROLE_HIERARCHY[targetUserRole]
  );
}

export function canEditEmployeeLocation(
  currentUserRole: EmployeeRole,
  targetUserRole: EmployeeRole,
): boolean {
  return (
    ROLE_HIERARCHY[currentUserRole] >= ROLE_HIERARCHY['location_manager'] &&
    ROLE_HIERARCHY[currentUserRole] > ROLE_HIERARCHY[targetUserRole]
  );
}

export function canEditOwnProfile(
  currentUserId: string,
  targetUserId: string,
): boolean {
  return currentUserId === targetUserId;
}
