import { Children, Fragment, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

export interface ListCardProps {
  children: ReactNode;
  dividerInset?: number;
}

export function ListCard({ children, dividerInset = 16 }: ListCardProps) {
  const items = Children.toArray(children);
  return (
    <View style={styles.card}>
      {items.map((child, idx) => (
        <Fragment key={idx}>
          {idx > 0 && <View style={[styles.divider, { marginHorizontal: dividerInset }]} />}
          {child}
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
});
