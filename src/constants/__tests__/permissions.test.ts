import {
  can,
  canEditEmployeeRole,
  canEditEmployeeLocation,
  canEditOwnProfile,
  canScoreEmployee,
  canDeactivateEmployee,
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

  describe('viewInvitations', () => {
    it('location_manager and above can view invitations', () => {
      expect(can('location_manager', 'viewInvitations')).toBe(true);
      expect(can('general_manager', 'viewInvitations')).toBe(true);
      expect(can('owner', 'viewInvitations')).toBe(true);
    });

    it('supervisor and below cannot view invitations', () => {
      expect(can('supervisor', 'viewInvitations')).toBe(false);
      expect(can('staff', 'viewInvitations')).toBe(false);
      expect(can('trainee', 'viewInvitations')).toBe(false);
    });
  });

  describe('manageScores', () => {
    it('supervisor and above can manage scores', () => {
      expect(can('supervisor', 'manageScores')).toBe(true);
      expect(can('location_manager', 'manageScores')).toBe(true);
      expect(can('general_manager', 'manageScores')).toBe(true);
      expect(can('owner', 'manageScores')).toBe(true);
    });

    it('staff and trainee cannot manage scores', () => {
      expect(can('staff', 'manageScores')).toBe(false);
      expect(can('trainee', 'manageScores')).toBe(false);
    });
  });

  describe('manageScoreCategories', () => {
    it('general_manager and owner can manage score categories', () => {
      expect(can('general_manager', 'manageScoreCategories')).toBe(true);
      expect(can('owner', 'manageScoreCategories')).toBe(true);
    });

    it('location_manager and below cannot manage score categories', () => {
      expect(can('location_manager', 'manageScoreCategories')).toBe(false);
      expect(can('supervisor', 'manageScoreCategories')).toBe(false);
    });
  });

  describe('manageLocations', () => {
    it('general_manager and owner can manage locations', () => {
      expect(can('general_manager', 'manageLocations')).toBe(true);
      expect(can('owner', 'manageLocations')).toBe(true);
    });

    it('location_manager and below cannot manage locations', () => {
      expect(can('location_manager', 'manageLocations')).toBe(false);
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
    it('cannot edit trainee location', () => {
      expect(canEditEmployeeLocation('supervisor', 'trainee')).toBe(false);
    });

    it('cannot edit staff location', () => {
      expect(canEditEmployeeLocation('supervisor', 'staff')).toBe(false);
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

    it('can edit another location_manager location', () => {
      expect(canEditEmployeeLocation('location_manager', 'location_manager')).toBe(true);
    });

    it('cannot edit general_manager location', () => {
      expect(canEditEmployeeLocation('location_manager', 'general_manager')).toBe(false);
    });
  });

  describe('general_manager', () => {
    it('can edit location_manager location', () => {
      expect(canEditEmployeeLocation('general_manager', 'location_manager')).toBe(true);
    });

    it('can edit another general_manager location', () => {
      expect(canEditEmployeeLocation('general_manager', 'general_manager')).toBe(true);
    });

    it('cannot edit owner location', () => {
      expect(canEditEmployeeLocation('general_manager', 'owner')).toBe(false);
    });
  });

  describe('owner', () => {
    it('can edit general_manager location', () => {
      expect(canEditEmployeeLocation('owner', 'general_manager')).toBe(true);
    });

    it('can edit another owner location', () => {
      expect(canEditEmployeeLocation('owner', 'owner')).toBe(true);
    });
  });
});

// ─── canScoreEmployee() ────────────────────────────────────────────────────

describe('canScoreEmployee()', () => {
  it('can score a strictly lower-ranked employee', () => {
    expect(canScoreEmployee('supervisor', 'trainee')).toBe(true);
    expect(canScoreEmployee('supervisor', 'staff')).toBe(true);
  });

  it('can score a peer at the same rank', () => {
    expect(canScoreEmployee('supervisor', 'supervisor')).toBe(true);
  });

  it('cannot score someone who outranks them', () => {
    expect(canScoreEmployee('supervisor', 'location_manager')).toBe(false);
    expect(canScoreEmployee('staff', 'supervisor')).toBe(false);
  });

  it('owner can score anyone up to their own rank', () => {
    expect(canScoreEmployee('owner', 'general_manager')).toBe(true);
    expect(canScoreEmployee('owner', 'owner')).toBe(true);
  });
});

// ─── canDeactivateEmployee() ────────────────────────────────────────────────

describe('canDeactivateEmployee()', () => {
  it('location_manager and above can deactivate a strictly lower-ranked employee', () => {
    expect(canDeactivateEmployee('location_manager', 'supervisor')).toBe(true);
    expect(canDeactivateEmployee('general_manager', 'location_manager')).toBe(true);
  });

  it('supervisor and below cannot deactivate anyone', () => {
    expect(canDeactivateEmployee('supervisor', 'trainee')).toBe(false);
    expect(canDeactivateEmployee('staff', 'trainee')).toBe(false);
  });

  it('cannot deactivate a peer at the same rank', () => {
    expect(canDeactivateEmployee('location_manager', 'location_manager')).toBe(false);
  });

  it('cannot deactivate someone who outranks them', () => {
    expect(canDeactivateEmployee('location_manager', 'general_manager')).toBe(false);
  });
});
