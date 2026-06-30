import { EmployeeRole } from '@/types/employee';

export type Permission = 'invite_employee';

const PERMISSIONS: Record<Permission, EmployeeRole[]> = {
  invite_employee: ['location_manager', 'general_manager', 'owner'],
};

export function can(role: EmployeeRole, permission: Permission): boolean {
  return PERMISSIONS[permission].includes(role);
}
