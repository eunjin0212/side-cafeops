import { supabase } from '@/lib/supabase';
import { EmployeeRole } from '@/types/employee';
import {
  CreateInvitationInput,
  Invitation,
  InvitationStatus,
} from '@/types/invitation';

type LocationResult =
  | { id: string; name: string }
  | { id: string; name: string }[]
  | null;

type InvitationRow = {
  id: string;
  email: string;
  role: string;
  location_id: string | null;
  locations: LocationResult;
  invited_by: string;
  token: string;
  status: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

function resolveLocationName(locations: LocationResult): string | null {
  if (!locations) return null;
  const loc = Array.isArray(locations) ? locations[0] : locations;
  return loc?.name ?? null;
}

function mapInvitation(row: InvitationRow): Invitation {
  return {
    id: row.id,
    email: row.email,
    role: row.role as EmployeeRole,
    locationId: row.location_id,
    locationName: resolveLocationName(row.locations),
    invitedBy: row.invited_by,
    token: row.token,
    status: row.status as InvitationStatus,
    acceptedAt: row.accepted_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createInvitation(
  input: CreateInvitationInput,
): Promise<Invitation> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('로그인이 필요합니다.');
  }

  const { data, error } = await supabase
    .from('invitations')
    .insert({
      email: input.email,
      role: input.role,
      location_id: input.locationId ?? null,
      invited_by: user.id,
    })
    .select('*, locations(id, name)')
    .single();

  if (error) {
    if (error.code === '42501') {
      throw new Error('초대 권한이 없습니다. 위치 관리자 이상만 초대할 수 있습니다.');
    }
    throw new Error('초대 중 오류가 발생했습니다. 다시 시도해주세요.');
  }

  return mapInvitation(data as InvitationRow);
}

export async function getInvitations(): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*, locations(id, name)')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('초대 목록을 불러오지 못했습니다.');
  }

  return (data as InvitationRow[]).map(mapInvitation);
}
