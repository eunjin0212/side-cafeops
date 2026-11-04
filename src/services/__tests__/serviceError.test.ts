import { serviceError } from '@/services/serviceError';

describe('serviceError()', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('hides the database message from users and logs it', () => {
    const dbError = { code: '23505', message: 'duplicate key violates constraint' };

    const result = serviceError('service: save', dbError, 'Failed to save.');

    expect(result.message).toBe('Failed to save.');
    expect(consoleError).toHaveBeenCalledWith('service: save', dbError);
  });

  it('uses a default message for permission errors', () => {
    const result = serviceError('ctx', { code: '42501', message: 'denied' }, 'Failed to save.');

    expect(result.message).toBe('You do not have permission to perform this action.');
  });

  it('uses a specific permission message when given one', () => {
    const result = serviceError(
      'ctx',
      { code: '42501', message: 'denied' },
      'Failed to save.',
      'You may not edit this.',
    );

    expect(result.message).toBe('You may not edit this.');
  });
});
