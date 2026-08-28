import { supabase } from '@/lib/supabase';
import {
  Employee,
  EmployeeLocation,
  UpdateEmployeeInput,
} from '@/types/employee';
import { unwrapJoin } from '@/utils/supabaseJoin';

const EMPLOYEE_QUERY = `
  id, email, full_name, phone, avatar_url, role, is_active, created_at, updated_at,
  employee_locations (
    id, is_primary, hired_at, is_active,
    locations ( id, name )
  )
` as const;

type LocationRow = { id: string; name: string } | { id: string; name: string }[] | null;

function mapEmployeeLocation(row: {
  id: string;
  is_primary: boolean;
  hired_at: string | null;
  is_active: boolean;
  locations: LocationRow;
}): EmployeeLocation {
  const loc = unwrapJoin(row.locations);
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

function wrapError(context: string, error: { code?: string; message: string }): Error {
  console.error(`employeeService: ${context}`, error);
  if (error.code === '42501') {
    return new Error('You do not have permission to perform this action.');
  }
  return new Error(`Failed to ${context}. Please try again.`);
}

export async function getEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(EMPLOYEE_QUERY)
    .order('created_at', { ascending: false });

  if (error) throw wrapError('load employees', error);
  return data.map(mapEmployee);
}

export async function getEmployee(id: string): Promise<Employee> {
  const { data, error } = await supabase
    .from('profiles')
    .select(EMPLOYEE_QUERY)
    .eq('id', id)
    .single();

  if (error) throw wrapError('load employee', error);
  return mapEmployee(data);
}

export async function updateEmployeeLocations(
  profileId: string,
  locationIds: string[],
): Promise<void> {
  const { data: current, error: fetchError } = await supabase
    .from('employee_locations')
    .select('location_id, is_primary')
    .eq('profile_id', profileId);

  if (fetchError) throw wrapError('update employee locations', fetchError);

  const currentRows = current ?? [];
  const currentIds = currentRows.map((r) => r.location_id as string);
  const toAdd = locationIds.filter((id) => !currentIds.includes(id));
  const toRemove = currentIds.filter((id) => !locationIds.includes(id));

  // Insert before delete: if a network failure interrupts this sequence,
  // the employee is left with an extra (recoverable) location rather than
  // missing one they should still have.
  if (toAdd.length > 0) {
    const { error } = await supabase
      .from('employee_locations')
      .insert(toAdd.map((locationId) => ({
        profile_id: profileId,
        location_id: locationId,
        is_primary: false,
      })));
    if (error) throw wrapError('update employee locations', error);
  }

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from('employee_locations')
      .delete()
      .eq('profile_id', profileId)
      .in('location_id', toRemove);
    if (error) throw wrapError('update employee locations', error);
  }

  if (locationIds.length > 0) {
    const primaryStillExists = currentRows.some(
      (r) => r.is_primary && locationIds.includes(r.location_id as string),
    );
    if (!primaryStillExists) {
      const { error } = await supabase
        .from('employee_locations')
        .update({ is_primary: true })
        .eq('profile_id', profileId)
        .eq('location_id', locationIds[0]);
      if (error) throw wrapError('update employee locations', error);
    }
  }
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

  if (error) throw wrapError('update employee', error);
  return getEmployee(id);
}
