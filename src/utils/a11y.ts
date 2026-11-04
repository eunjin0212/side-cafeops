import { Platform } from 'react-native';

// react-native-web honours these ARIA props but React Native's types and
// native renderers don't, so they're only passed through on web.
export function webOnlyProps(props: Record<string, unknown>): object {
  return Platform.OS === 'web' ? props : {};
}

// react-native-web activates a Pressable on Enter, and on Space for buttons,
// with two exceptions. It leaves links to the browser, which does nothing for
// a role="link" <div>, and it ignores Space on checkboxes and radios even
// though their ARIA patterns require it.
export function isUnhandledKeyboardActivation(key: string, role: string | null): boolean {
  if (key === 'Enter') return role === 'link';
  if (key === ' ') return role === 'checkbox' || role === 'radio';
  return false;
}
