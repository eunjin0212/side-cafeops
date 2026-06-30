import { EmployeeRole } from '@/types/employee';

export const EMPLOYEE_ROLES = [
  'trainee',
  'staff',
  'supervisor',
  'location_manager',
  'general_manager',
  'owner',
] as const satisfies readonly EmployeeRole[];

export const ROLE_LABELS: Record<EmployeeRole, string> = {
  trainee: 'Trainee',
  staff: 'Staff',
  supervisor: 'Supervisor',
  location_manager: 'Location Manager',
  general_manager: 'General Manager',
  owner: 'Owner',
};

export const ROLE_OPTIONS: { value: EmployeeRole; label: string }[] =
  EMPLOYEE_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }));
