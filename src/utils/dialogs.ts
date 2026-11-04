import { Alert, Platform } from 'react-native';

// Alert.alert does nothing in react-native-web, so a dialog's buttons never
// fire there. These use the browser's dialogs on web and Alert on native.

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
}

export function confirmDestructive({
  title,
  message,
  confirmLabel,
  onConfirm,
}: ConfirmOptions): void {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

export function showNotice(title: string, message: string, onDismiss: () => void): void {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    onDismiss();
    return;
  }

  Alert.alert(title, message, [{ text: 'OK', onPress: onDismiss }]);
}
