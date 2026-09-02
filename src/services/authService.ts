import { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { EmployeeRole } from '@/types/employee';
import { unwrapJoin } from '@/utils/supabaseJoin';

export type CurrentProfile = {
  id: string;
  email: string;
  fullName: string | null;
  role: EmployeeRole;
  isActive: boolean;
  avatarUrl: string | null;
  locationId: string | null;
  locationName: string | null;
  locations: { id: string; name: string }[];
};

type LocationRow = { name: string } | { name: string }[] | null;

type EmployeeLocationRow = {
  is_primary: boolean;
  is_active: boolean;
  location_id: string;
  locations: LocationRow;
};

function resolveActiveLocations(
  employeeLocations: EmployeeLocationRow[],
): { id: string; name: string }[] {
  return employeeLocations
    .filter((el) => el.is_active)
    .map((el) => {
      const resolved = unwrapJoin(el.locations);
      return resolved ? { id: el.location_id, name: resolved.name } : null;
    })
    .filter((loc): loc is { id: string; name: string } => loc !== null);
}

function resolvePrimaryLocation(
  employeeLocations: EmployeeLocationRow[],
): { id: string; name: string } | null {
  const primary = employeeLocations.find((el) => el.is_primary && el.is_active);
  if (!primary) return null;
  const resolved = unwrapJoin(primary.locations);
  if (!resolved) return null;
  return { id: primary.location_id, name: resolved.name };
}

export async function signIn(email: string, password: string): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    // AuthSessionMissingError is the expected signal for "not signed in"
    // (login screen, app boot before a session restores) -- not a bug.
    if (userError.name !== 'AuthSessionMissingError') {
      console.error('getCurrentProfile: failed to get auth user', userError);
    }
    return null;
  }
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
      id, email, full_name, role, is_active, avatar_url,
      employee_locations ( is_primary, is_active, location_id, locations ( name ) )
    `,
    )
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('getCurrentProfile: failed to load profile row', error);
    return null;
  }
  if (!data) return null;

  const employeeLocations = data.employee_locations as EmployeeLocationRow[];
  const primaryLocation = resolvePrimaryLocation(employeeLocations);

  return {
    id: data.id as string,
    email: data.email as string,
    fullName: data.full_name as string | null,
    role: data.role as EmployeeRole,
    isActive: data.is_active as boolean,
    avatarUrl: data.avatar_url as string | null,
    locationId: primaryLocation?.id ?? null,
    locationName: primaryLocation?.name ?? null,
    locations: resolveActiveLocations(employeeLocations),
  };
}
