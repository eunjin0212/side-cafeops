import { Alert, Platform } from 'react-native';

import { confirmDestructive, showNotice } from '@/utils/dialogs';

describe('dialogs', () => {
  const originalOS = Platform.OS;
  const browser = { confirm: jest.fn(), alert: jest.fn() };
  const globals = globalThis as unknown as { window: unknown };
  const originalWindow = globals.window;
  let nativeAlert: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    globals.window = browser;
    nativeAlert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    Platform.OS = originalOS;
    globals.window = originalWindow;
    nativeAlert.mockRestore();
  });

  const options = { title: 'Title', message: 'Message', confirmLabel: 'Delete' };

  describe('on web', () => {
    beforeEach(() => {
      Platform.OS = 'web';
    });

    it('runs the action when the user confirms', () => {
      browser.confirm.mockReturnValue(true);
      const onConfirm = jest.fn();

      confirmDestructive({ ...options, onConfirm });

      expect(browser.confirm).toHaveBeenCalledWith('Title\n\nMessage');
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(nativeAlert).not.toHaveBeenCalled();
    });

    it('does not run the action when the user cancels', () => {
      browser.confirm.mockReturnValue(false);
      const onConfirm = jest.fn();

      confirmDestructive({ ...options, onConfirm });

      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('continues after a notice is dismissed', () => {
      const onDismiss = jest.fn();

      showNotice('Title', 'Message', onDismiss);

      expect(browser.alert).toHaveBeenCalledWith('Title\n\nMessage');
      expect(onDismiss).toHaveBeenCalledTimes(1);
      expect(nativeAlert).not.toHaveBeenCalled();
    });
  });

  describe('on native', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
    });

    it('runs the action only from the confirm button', () => {
      const onConfirm = jest.fn();

      confirmDestructive({ ...options, onConfirm });

      expect(browser.confirm).not.toHaveBeenCalled();
      expect(onConfirm).not.toHaveBeenCalled();
      const [cancel, confirm] = nativeAlert.mock.calls[0][2];
      expect(cancel).toEqual({ text: 'Cancel', style: 'cancel' });
      expect(confirm.text).toBe('Delete');
      confirm.onPress();
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('continues only after the notice is dismissed', () => {
      const onDismiss = jest.fn();

      showNotice('Title', 'Message', onDismiss);

      expect(onDismiss).not.toHaveBeenCalled();
      nativeAlert.mock.calls[0][2][0].onPress();
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });
});
