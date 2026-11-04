import { saveEmployee } from '@/services/employeeService';

const mockCalls: string[] = [];
let mockProfileUpdateError: { message: string } | null = null;

const mockEmployeeRow = {
  id: 'e1',
  email: 'e1@example.com',
  full_name: null,
  phone: null,
  avatar_url: null,
  role: 'staff',
  is_active: true,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  employee_locations: [],
};

// Mimics supabase-js: every step returns the builder, and awaiting it runs the query.
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      let operation = 'select';
      const builder = {
        select: () => builder,
        eq: () => builder,
        in: () => builder,
        update: () => {
          operation = 'update';
          mockCalls.push(`${table}.update`);
          return builder;
        },
        insert: () => {
          operation = 'insert';
          mockCalls.push(`${table}.insert`);
          return builder;
        },
        delete: () => {
          operation = 'delete';
          mockCalls.push(`${table}.delete`);
          return builder;
        },
        single: () => Promise.resolve({ data: mockEmployeeRow, error: null }),
        then: (resolve: (result: unknown) => void) => {
          const error =
            table === 'profiles' && operation === 'update' ? mockProfileUpdateError : null;
          resolve({ data: [], error });
        },
      };
      return builder;
    },
  },
}));

describe('saveEmployee()', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    mockCalls.length = 0;
    mockProfileUpdateError = null;
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('saves the profile before the locations', async () => {
    await saveEmployee('e1', { profile: { role: 'staff' }, locationIds: ['l1'] });

    expect(mockCalls).toEqual([
      'profiles.update',
      'employee_locations.insert',
      'employee_locations.update',
    ]);
  });

  it('skips the profile update when there is nothing to change', async () => {
    await saveEmployee('e1', { profile: {}, locationIds: ['l1'] });

    expect(mockCalls).toEqual(['employee_locations.insert', 'employee_locations.update']);
  });

  it('leaves locations alone when the actor may not edit them', async () => {
    await saveEmployee('e1', { profile: { role: 'staff' } });

    expect(mockCalls).toEqual(['profiles.update']);
  });

  it('writes nothing when an employee with no locations is given an empty list', async () => {
    await saveEmployee('e1', { profile: {}, locationIds: [] });

    expect(mockCalls).toEqual([]);
  });

  it('stops before touching locations when the profile update fails', async () => {
    mockProfileUpdateError = { message: 'denied' };

    await expect(
      saveEmployee('e1', { profile: { role: 'staff' }, locationIds: ['l1'] }),
    ).rejects.toThrow('Failed to update employee. Please try again.');
    expect(mockCalls).toEqual(['profiles.update']);
  });
});
