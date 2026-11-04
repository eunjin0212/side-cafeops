import { queryErrorMessage } from '@/utils/errors';

describe('queryErrorMessage()', () => {
  it('is null when there is no error', () => {
    expect(queryErrorMessage(null, 'Fallback')).toBeNull();
  });

  it('uses the message of an Error', () => {
    expect(queryErrorMessage(new Error('Failed to load.'), 'Fallback')).toBe('Failed to load.');
  });

  it('uses the fallback for anything else', () => {
    expect(queryErrorMessage('unexpected', 'Fallback')).toBe('Fallback');
  });
});
