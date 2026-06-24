import { supabase } from '@/lib/supabase';
import {
  CreateEmployeeInput,
  Employee,
  EmployeeLocation,
  UpdateEmployeeInput,
} from '@/types/employee';

const EMPLOYEE_QUERY = `
  id, email, full_name, phone, avatar_url, role, is_active, created_at, updated_at,
  employee_locations (
    id, is_primary, hired_at, is_active,
    locations ( id, name )
  )
` as const;

type LocationRow = { id: string; name: string } | { id: string; name: string }[] | null;

function resolveLocation(loc: LocationRow): { id: string; name: string } | null {
  if (!loc) return null;
  return Array.isArray(loc) ? (loc[0] ?? null) : loc;
}

function mapEmployeeLocation(row: {
  id: string;
  is_primary: boolean;
  hired_at: string | null;
  is_active: boolean;
  locations: LocationRow;
}): EmployeeLocation {
  const loc = resolveLocation(row.locations);
  return {
    id: row.id,
    locationId: loc?.id ?? '',
    locationName: loc?.name ?? '',
    isPrimary: row.is_primary,
    hiredAt: row.hired_at,
    isActive: row.is_active,
  };
}

function mapEmployee(row: {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  employee_locations: Parameters<typeof mapEmployeeLocation>[0][];
}): Employee {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    role: row.role as Employee['role'],
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    locations: row.employee_locations.map(mapEmployeeLocation),
  };
}

export async function getEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(EMPLOYEE_QUERY)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(mapEmployee);
}

export async function getEmployee(id: string): Promise<Employee> {
  const { data, error } = await supabase
    .from('profiles')
    .select(EMPLOYEE_QUERY)
    .eq('id', id)
    .single();

  if (error) throw error;
  return mapEmployee(data);
}

export async function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
  const { error: profileError } = await supabase.from('profiles').insert({
    id: input.id,
    email: input.email,
    full_name: input.fullName ?? null,
    phone: input.phone ?? null,
    role: input.role ?? 'staff',
  });

  if (profileError) throw profileError;

  const { error: locationError } = await supabase.from('employee_locations').insert({
    profile_id: input.id,
    location_id: input.locationId,
    is_primary: input.isPrimary ?? true,
    hired_at: input.hiredAt ?? null,
  });

  if (locationError) throw locationError;

  return getEmployee(input.id);
}

export async function updateEmployee(
  id: string,
  input: UpdateEmployeeInput
): Promise<Employee> {
  const { error } = await supabase
    .from('profiles')
    .update({
      ...(input.fullName !== undefined && { full_name: input.fullName }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.role !== undefined && { role: input.role }),
      ...(input.isActive !== undefined && { is_active: input.isActive }),
    })
    .eq('id', id);

  if (error) throw error;
  return getEmployee(id);
}
