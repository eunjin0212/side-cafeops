import { EmployeeRole } from '@/types/employee';

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export type Invitation = {
  id: string;
  email: string;
  role: EmployeeRole;
  locationId: string | null;
  invitedBy: string;
  token: string;
  status: InvitationStatus;
  acceptedAt: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateInvitationInput = {
  email: string;
  role: EmployeeRole;
  locationId?: string;
};
