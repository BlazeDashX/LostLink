// components/ConfirmModal.tsx
// SRS 17.1 — "Reusable confirmation overlay when Modal is preferred [over Alert]."
// Use this instead of Alert.alert() wherever you want an in-app styled
// confirmation instead of the native OS dialog (e.g. Admin Management's
// suspend/hide actions, per SRS 13.17.2 "Confirmation Modal/Alert").
import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, destructive && styles.confirmButtonDestructive]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  card: { width: "100%",
      backgroundColor: "#FFFFFF",
      borderRadius: 16, 
      padding: 20 },

  title: { fontSize: 16,
     fontWeight: "700", 
     color: "#0F172A", 
     marginBottom: 8 },

  message: { fontSize: 13, 
    color: "#64748B", 
    marginBottom: 20, 
    lineHeight: 18 },
  buttonRow: { flexDirection: "row", 
    gap: 12 },

  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  cancelText: { fontSize: 14, 
    fontWeight: "600", 
    color: "#0F172A" },
  confirmButton: { flex: 1, 
    paddingVertical: 12,
     borderRadius: 10, 
     backgroundColor: "#2563EB", 
     alignItems: "center" },

  confirmButtonDestructive: { backgroundColor: "#DC2626" },

  confirmText: { fontSize: 14, 
    fontWeight: "700", 
    color: "#FFFFFF" },
    
});
