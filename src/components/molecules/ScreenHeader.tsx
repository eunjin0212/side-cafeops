import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { type Href } from 'expo-router';

import { ScreenTitle } from '@/components/molecules/ScreenTitle';
import { goBack } from '@/utils/navigation';

export interface ScreenHeaderProps {
  backHref: Href;
  title?: string;
  subtitle?: string;
  right?: ReactNode;
}

export function ScreenHeader({ backHref, title, subtitle, right }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        role="link"
        aria-label="Back"
        style={styles.backButton}
        onPress={() => goBack(backHref)}
        hitSlop={8}
      >
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      {(title || right) && (
        <View style={styles.row}>
          {title ? (
            <View style={styles.titleBlock}>
              <ScreenTitle style={styles.title}>{title}</ScreenTitle>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
          ) : (
            <View />
          )}
          {right ? <View style={styles.right}>{right}</View> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 12,
  },
  backButton: {
    alignSelf: 'flex-start',
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 15,
    color: '#6B7280',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleBlock: {
    gap: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
