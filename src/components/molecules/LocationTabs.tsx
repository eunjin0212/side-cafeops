import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export interface LocationTabsProps {
  locations: { id: string; name: string }[];
  selectedId: string | undefined;
  onSelect: (id: string | undefined) => void;
  showAll?: boolean;
  allLabel?: string;
}

export function LocationTabs({
  locations,
  selectedId,
  onSelect,
  showAll = false,
  allLabel = 'All',
}: LocationTabsProps) {
  return (
    <View role="radiogroup" aria-label="Location">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {showAll && (
          <Pressable
            role="radio"
            aria-checked={selectedId === undefined}
            style={[styles.chip, selectedId === undefined && styles.chipActive]}
            onPress={() => onSelect(undefined)}
          >
            <Text style={[styles.chipText, selectedId === undefined && styles.chipTextActive]}>
              {allLabel}
            </Text>
          </Pressable>
        )}
        {locations.map((loc) => {
          const isActive = selectedId === loc.id;
          return (
            <Pressable
              key={loc.id}
              role="radio"
              aria-checked={isActive}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onSelect(loc.id)}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{loc.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  chipTextActive: {
    color: '#fff',
  },
});
