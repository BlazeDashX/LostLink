import { Alert, Platform } from "react-native";

export interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

/**
 * Universal cross-platform Alert that functions reliably on Web, iOS, and Android.
 * - Web: window.alert() with callback execution
 * - Native: Alert.alert()
 */
export function appAlert(title: string, message?: string, onPress?: () => void) {
  const fullText = title ? (message ? `${title}\n\n${message}` : title) : (message || "");

  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      window.alert(fullText);
    }
    if (onPress) {
      onPress();
    }
    return;
  }

  Alert.alert(title, message, [
    {
      text: "OK",
      onPress,
    },
  ]);
}

/**
 * Universal cross-platform Confirmation Dialog.
 * - Web: uses window.confirm()
 * - Native: uses Alert.alert() with Cancel and Confirm buttons
 */
export function appConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
  confirmLabel: string = "Confirm"
) {
  const fullText = title ? `${title}\n\n${message}` : message;

  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      const isConfirmed = window.confirm(fullText);
      if (isConfirmed) {
        onConfirm();
      } else if (onCancel) {
        onCancel();
      }
    }
    return;
  }

  Alert.alert(title, message, [
    {
      text: "Cancel",
      style: "cancel",
      onPress: onCancel,
    },
    {
      text: confirmLabel,
      style: "destructive",
      onPress: onConfirm,
    },
  ]);
}
