import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';

export interface CenteredScreenProps {
  children: ReactNode;
  background?: string;
}

export function CenteredScreen({ children, background = colors.white }: CenteredScreenProps) {
  return <View style={[styles.screen, { backgroundColor: background }]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
