import { Modal, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Image } from 'expo-image';

export interface PhotoViewerModalProps {
  imageUrls: string[] | null;
  onClose: () => void;
}

export function PhotoViewerModal({ imageUrls, onClose }: PhotoViewerModalProps) {
  return (
    <Modal
      visible={imageUrls !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {(imageUrls ?? []).map((uri) => (
            <Image key={uri} source={{ uri }} style={styles.image} contentFit="contain" />
          ))}
        </ScrollView>
        <Pressable style={styles.closeButton} onPress={onClose} hitSlop={10}>
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: 12,
    paddingVertical: 60,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 52,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '600',
  },
});
