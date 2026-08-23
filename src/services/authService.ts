import { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { EmployeeRole } from '@/types/employee';

export type CurrentProfile = {
  id: string;
  email: string;
  fullName: string | null;
  role: EmployeeRole;
  isActive: boolean;
  avatarUrl: string | null;
  locationId: string | null;
  locationName: string | null;
};

type LocationRow = { name: string } | { name: string }[] | null;

function resolvePrimaryLocation(
  employeeLocations: {
    is_primary: boolean;
    is_active: boolean;
    location_id: string;
    locations: LocationRow;
  }[],
): { id: string; name: string } | null {
  const primary = employeeLocations.find((el) => el.is_primary && el.is_active);
  if (!primary) return null;
  const loc = primary.locations;
  const resolved = Array.isArray(loc) ? (loc[0] ?? null) : loc;
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

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return null;

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

  if (error || !data) return null;

  const primaryLocation = resolvePrimaryLocation(
    data.employee_locations as Parameters<typeof resolvePrimaryLocation>[0],
  );

  return {
    id: data.id as string,
    email: data.email as string,
    fullName: data.full_name as string | null,
    role: data.role as EmployeeRole,
    isActive: data.is_active as boolean,
    avatarUrl: data.avatar_url as string | null,
    locationId: primaryLocation?.id ?? null,
    locationName: primaryLocation?.name ?? null,
  };
}
