export type EmployeeRole =
  | 'trainee'
  | 'staff'
  | 'supervisor'
  | 'location_manager'
  | 'general_manager'
  | 'owner';

export type EmployeeLocation = {
  id: string;
  locationId: string;
  locationName: string;
  isPrimary: boolean;
  hiredAt: string | null;
  isActive: boolean;
};

export type Employee = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: EmployeeRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  locations: EmployeeLocation[];
};

export type UpdateEmployeeInput = {
  fullName?: string;
  phone?: string;
  role?: EmployeeRole;
  isActive?: boolean;
};
