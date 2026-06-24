export type EmployeeRole =
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

export type CreateEmployeeInput = {
  id: string; // must match an existing auth.users id
  email: string;
  fullName?: string;
  phone?: string;
  role?: EmployeeRole;
  locationId: string;
  isPrimary?: boolean;
  hiredAt?: string;
};

export type UpdateEmployeeInput = {
  fullName?: string;
  phone?: string;
  role?: EmployeeRole;
  isActive?: boolean;
};
