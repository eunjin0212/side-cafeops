import { Platform } from 'react-native';

import { isUnhandledKeyboardActivation, webOnlyProps } from '@/utils/a11y';

describe('isUnhandledKeyboardActivation()', () => {
  it.each([
    ['Enter', 'link'],
    [' ', 'checkbox'],
    [' ', 'radio'],
  ])('handles %j on role=%s', (key, role) => {
    expect(isUnhandledKeyboardActivation(key, role)).toBe(true);
  });

  it.each([
    ['Enter', 'button'],
    ['Enter', 'checkbox'],
    ['Enter', 'radio'],
    ['Enter', null],
    [' ', 'button'],
    [' ', 'link'],
    [' ', null],
    ['Tab', 'link'],
  ])('leaves %j on role=%s to react-native-web', (key, role) => {
    expect(isUnhandledKeyboardActivation(key, role)).toBe(false);
  });
});

describe('webOnlyProps()', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Platform.OS = originalOS;
  });

  it('passes props through on web', () => {
    Platform.OS = 'web';
    expect(webOnlyProps({ 'aria-invalid': true })).toEqual({ 'aria-invalid': true });
  });

  it('drops props on native', () => {
    Platform.OS = 'ios';
    expect(webOnlyProps({ 'aria-invalid': true })).toEqual({});
  });
});
