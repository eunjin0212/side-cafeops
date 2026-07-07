import {
  can,
  canEditEmployeeRole,
  canEditEmployeeLocation,
  canEditOwnProfile,
} from '@/constants/permissions';

// ─── can() ───────────────────────────────────────────────────────────────────

describe('can()', () => {
  describe('inviteEmployee', () => {
    it('owner can invite employees', () => {
      expect(can('owner', 'inviteEmployee')).toBe(true);
    });

    it('general_manager can invite employees', () => {
      expect(can('general_manager', 'inviteEmployee')).toBe(true);
    });

    it('location_manager can invite employees', () => {
      expect(can('location_manager', 'inviteEmployee')).toBe(true);
    });

    it('supervisor cannot invite employees', () => {
      expect(can('supervisor', 'inviteEmployee')).toBe(false);
    });

    it('staff cannot invite employees', () => {
      expect(can('staff', 'inviteEmployee')).toBe(false);
    });

    it('trainee cannot invite employees', () => {
      expect(can('trainee', 'inviteEmployee')).toBe(false);
    });
  });
});

// ─── canEditEmployeeRole() ────────────────────────────────────────────────────

describe('canEditEmployeeRole()', () => {
  describe('supervisor', () => {
    it('can edit trainee', () => {
      expect(canEditEmployeeRole('supervisor', 'trainee')).toBe(true);
    });

    it('can edit staff', () => {
      expect(canEditEmployeeRole('supervisor', 'staff')).toBe(true);
    });

    it('cannot edit supervisor', () => {
      expect(canEditEmployeeRole('supervisor', 'supervisor')).toBe(false);
    });

    it('cannot edit location_manager', () => {
      expect(canEditEmployeeRole('supervisor', 'location_manager')).toBe(false);
    });
  });

  describe('location_manager', () => {
    it('can edit supervisor', () => {
      expect(canEditEmployeeRole('location_manager', 'supervisor')).toBe(true);
    });

    it('can edit staff', () => {
      expect(canEditEmployeeRole('location_manager', 'staff')).toBe(true);
    });

    it('cannot edit general_manager', () => {
      expect(canEditEmployeeRole('location_manager', 'general_manager')).toBe(false);
    });
  });

  describe('general_manager', () => {
    it('can edit location_manager', () => {
      expect(canEditEmployeeRole('general_manager', 'location_manager')).toBe(true);
    });

    it('cannot edit owner', () => {
      expect(canEditEmployeeRole('general_manager', 'owner')).toBe(false);
    });
  });

  describe('owner', () => {
    it('can edit general_manager', () => {
      expect(canEditEmployeeRole('owner', 'general_manager')).toBe(true);
    });

    it('cannot edit owner', () => {
      expect(canEditEmployeeRole('owner', 'owner')).toBe(false);
    });
  });
});

// ─── canEditOwnProfile() ─────────────────────────────────────────────────────

describe('canEditOwnProfile()', () => {
  it('user can edit own profile', () => {
    expect(canEditOwnProfile('user-123', 'user-123')).toBe(true);
  });

  it('user cannot edit another user\'s profile', () => {
    expect(canEditOwnProfile('user-123', 'user-456')).toBe(false);
  });
});

// ─── canEditEmployeeLocation() ────────────────────────────────────────────────

describe('canEditEmployeeLocation()', () => {
  describe('supervisor', () => {
    it('can edit trainee location', () => {
      expect(canEditEmployeeLocation('supervisor', 'trainee')).toBe(true);
    });

    it('can edit staff location', () => {
      expect(canEditEmployeeLocation('supervisor', 'staff')).toBe(true);
    });

    it('cannot edit supervisor location', () => {
      expect(canEditEmployeeLocation('supervisor', 'supervisor')).toBe(false);
    });

    it('cannot edit location_manager location', () => {
      expect(canEditEmployeeLocation('supervisor', 'location_manager')).toBe(false);
    });
  });

  describe('location_manager', () => {
    it('can edit supervisor location', () => {
      expect(canEditEmployeeLocation('location_manager', 'supervisor')).toBe(true);
    });

    it('can edit staff location', () => {
      expect(canEditEmployeeLocation('location_manager', 'staff')).toBe(true);
    });

    it('cannot edit general_manager location', () => {
      expect(canEditEmployeeLocation('location_manager', 'general_manager')).toBe(false);
    });
  });

  describe('general_manager', () => {
    it('can edit location_manager location', () => {
      expect(canEditEmployeeLocation('general_manager', 'location_manager')).toBe(true);
    });

    it('cannot edit owner location', () => {
      expect(canEditEmployeeLocation('general_manager', 'owner')).toBe(false);
    });
  });

  describe('owner', () => {
    it('can edit general_manager location', () => {
      expect(canEditEmployeeLocation('owner', 'general_manager')).toBe(true);
    });

    it('cannot edit owner location', () => {
      expect(canEditEmployeeLocation('owner', 'owner')).toBe(false);
    });
  });
});
