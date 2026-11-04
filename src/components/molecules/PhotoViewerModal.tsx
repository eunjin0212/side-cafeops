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
      <Pressable style={styles.backdrop} onPress={onClose} focusable={false}>
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {(imageUrls ?? []).map((uri, index) => (
            <Image
              key={uri}
              source={{ uri }}
              alt={`Photo ${index + 1} of ${imageUrls?.length ?? 0}`}
              style={styles.image}
              contentFit="contain"
            />
          ))}
        </ScrollView>
        <Pressable
          role="button"
          aria-label="Close photo viewer"
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={10}
        >
          <Text style={styles.closeText} aria-hidden>×</Text>
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
  scrollArea: {
    width: '100%',
  },
  content: {
    gap: 12,
    paddingVertical: 60,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    maxWidth: 480,
    aspectRatio: 1,
    borderRadius: 8,
    alignSelf: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 52,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
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
