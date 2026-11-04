import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes } from '@/constants/theme';

export interface CycleSelectorProps {
  label: string;
  onPrevious?: () => void;
  onNext?: () => void;
  onCurrent?: () => void;
}

export function CycleSelector({ label, onPrevious, onNext, onCurrent }: CycleSelectorProps) {
  return (
    <View>
      <View style={styles.row}>
        <Pressable
          role="button"
          aria-label="Previous cycle"
          style={[styles.button, !onPrevious && styles.buttonDisabled]}
          onPress={onPrevious}
          disabled={!onPrevious}
        >
          <Text style={styles.arrow} aria-hidden>
            ‹
          </Text>
        </Pressable>
        <Text style={styles.label} aria-live="polite">
          {label}
        </Text>
        <Pressable
          role="button"
          aria-label="Next cycle"
          style={[styles.button, !onNext && styles.buttonDisabled]}
          onPress={onNext}
          disabled={!onNext}
        >
          <Text style={styles.arrow} aria-hidden>
            ›
          </Text>
        </Pressable>
      </View>
      {onCurrent && (
        <Pressable role="button" style={styles.currentButton} onPress={onCurrent}>
          <Text style={styles.currentText}>Go to current cycle</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 4,
  },
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  arrow: {
    fontSize: fontSizes.h3,
    color: colors.text,
  },
  currentButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.link,
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.text,
  },
});
