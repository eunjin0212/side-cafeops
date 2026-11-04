import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes } from '@/constants/theme';

export interface ImagePickerFieldProps {
  images: string[];
  onAdd: (uri: string) => void;
  onRemove: (index: number) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function ImagePickerField({
  images,
  onAdd,
  onRemove,
  maxImages = 2,
  disabled = false,
}: ImagePickerFieldProps) {
  const [busy, setBusy] = useState(false);

  async function handleAdd(): Promise<void> {
    if (busy || disabled) return;
    setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.6,
        allowsEditing: false,
        exif: false,
      });
      if (!result.canceled && result.assets[0]) {
        onAdd(result.assets[0].uri);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.row}>
      {images.map((uri, idx) => (
        <View key={`${uri}-${idx}`} style={styles.thumb}>
          <Image
            source={{ uri }}
            alt={`Selected photo ${idx + 1}`}
            style={styles.thumbImg}
            contentFit="cover"
          />
          <Pressable
            role="button"
            aria-label={`Remove selected photo ${idx + 1}`}
            style={styles.removeBtn}
            onPress={() => onRemove(idx)}
            hitSlop={6}
            disabled={disabled}
          >
            <View style={styles.removeBtnCircle}>
              <Text style={styles.removeBtnText} aria-hidden>
                ✕
              </Text>
            </View>
          </Pressable>
        </View>
      ))}

      {images.length < maxImages && (
        <Pressable
          role="button"
          aria-label="Add photo"
          style={[styles.addBtn, (busy || disabled) && styles.addBtnDisabled]}
          onPress={handleAdd}
          disabled={busy || disabled}
        >
          <Text style={styles.addIcon} aria-hidden>
            📷
          </Text>
          <Text style={styles.addLabel}>{busy ? '...' : 'Photo'}</Text>
        </Pressable>
      )}
    </View>
  );
}

const THUMB_SIZE = 80;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 8,
    overflow: 'visible',
  },
  thumbImg: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
  },
  removeBtn: {
    position: 'absolute',
    top: -18,
    right: -18,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: colors.white,
    fontSize: fontSizes.md,
    lineHeight: 14,
    fontWeight: '700',
  },
  addBtn: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.white,
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  addIcon: {
    fontSize: fontSizes.h4,
  },
  addLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
