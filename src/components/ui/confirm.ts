import { Alert } from 'react-native';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
}

/** Native confirmation dialog for destructive actions (delete). */
export function confirmAction({ title, message, confirmLabel, cancelLabel, onConfirm }: ConfirmOptions) {
  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
