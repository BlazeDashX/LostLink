import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

import { COLORS, SPACING } from "@/constants/theme";

interface MessageComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  loading?: boolean;
}

export default function MessageComposer({
  value,
  onChangeText,
  onSend,
  loading = false,
}: MessageComposerProps) {
  const disabled = value.trim().length === 0 || loading;

  return (
    <View style={styles.container}>
      <TextInput
        accessibilityLabel="Type your message"
        editable={!loading}
        multiline
        onChangeText={onChangeText}
        placeholder="Write a message..."
        placeholderTextColor={COLORS.textMuted}
        style={styles.input}
        value={value}
      />
      <TouchableOpacity
        accessibilityHint="Sends the written message"
        accessibilityLabel="Send message"
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        activeOpacity={0.7}
        disabled={disabled}
        onPress={onSend}
        style={[styles.sendButton, disabled && styles.sendButtonDisabled]}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.surface} size="small" />
        ) : (
          <Ionicons color={COLORS.surface} name="send" size={19} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-end",
    backgroundColor: COLORS.surface,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderRadius: 20,
    borderWidth: 1,
    color: COLORS.text,
    flex: 1,
    fontSize: 14,
    maxHeight: 110,
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 21,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  sendButtonDisabled: { opacity: 0.45 },
});