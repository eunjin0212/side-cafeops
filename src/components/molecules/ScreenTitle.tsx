import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { Platform, StyleProp, Text, TextStyle } from 'react-native';

import { webOnlyProps } from '@/utils/a11y';

export interface ScreenTitleProps {
  children: string;
  documentTitle?: string;
  style?: StyleProp<TextStyle>;
}

// The screen's <h1>. A client-side route change is silent to screen readers,
// so on web this also updates the tab title and moves focus here whenever the
// screen comes into focus.
export function ScreenTitle({ children, documentTitle, style }: ScreenTitleProps) {
  const ref = useRef<Text>(null);
  const tabTitle = documentTitle ?? `${children} · Twilight Cafe`;

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'web') return;
      document.title = tabTitle;
      (ref.current as unknown as HTMLElement | null)?.focus({ preventScroll: true });
    }, [tabTitle]),
  );

  return (
    <Text
      ref={ref}
      role="heading"
      style={style}
      {...webOnlyProps({ 'aria-level': 1, tabIndex: -1 })}
    >
      {children}
    </Text>
  );
}
