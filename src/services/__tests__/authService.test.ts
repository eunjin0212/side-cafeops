import { supabase } from '@/lib/supabase';
import { signIn, signOut, subscribeToSession } from '@/services/authService';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}));

const auth = supabase.auth as unknown as {
  signInWithPassword: jest.Mock;
  signOut: jest.Mock;
  onAuthStateChange: jest.Mock;
};

describe('authService', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  describe('signIn()', () => {
    it('returns the session on success', async () => {
      const session = { access_token: 'token' };
      auth.signInWithPassword.mockResolvedValue({ data: { session }, error: null });

      await expect(signIn('a@example.com', 'pw')).resolves.toBe(session);
    });

    it('reports wrong credentials as such, without logging', async () => {
      auth.signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: { code: 'invalid_credentials', message: 'Invalid login credentials' },
      });

      await expect(signIn('a@example.com', 'pw')).rejects.toThrow('Invalid email or password.');
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('does not blame the password for other failures, and logs them', async () => {
      const failure = { name: 'AuthRetryableFetchError', message: 'Failed to fetch' };
      auth.signInWithPassword.mockResolvedValue({ data: { session: null }, error: failure });

      await expect(signIn('a@example.com', 'pw')).rejects.toThrow(
        'Unable to sign in. Please try again.',
      );
      expect(consoleError).toHaveBeenCalledWith('signIn: failed', failure);
    });
  });

  describe('signOut()', () => {
    it('hides technical details and logs the failure', async () => {
      const failure = { message: 'network down' };
      auth.signOut.mockResolvedValue({ error: failure });

      await expect(signOut()).rejects.toThrow('Failed to sign out. Please try again.');
      expect(consoleError).toHaveBeenCalledWith('signOut: failed', failure);
    });
  });

  describe('subscribeToSession()', () => {
    it('forwards the session and returns an unsubscribe function', () => {
      const unsubscribe = jest.fn();
      auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } });
      const onChange = jest.fn();

      const stop = subscribeToSession(onChange);
      const session = { access_token: 'token' };
      auth.onAuthStateChange.mock.calls[0][0]('SIGNED_IN', session);
      expect(onChange).toHaveBeenCalledWith(session);

      stop();
      expect(unsubscribe).toHaveBeenCalled();
    });
  });
});
