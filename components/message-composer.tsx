import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

import { COLORS, SPACING } from "@/constants/theme";

interface MessageComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
}

export default function MessageComposer({ value, onChangeText, onSend }: MessageComposerProps) {
  const disabled = value.trim().length === 0;

  return (
    <View style={styles.container}>
      <TextInput
        multiline
        onChangeText={onChangeText}
        placeholder="Write a message..."
        placeholderTextColor={COLORS.textMuted}
        style={styles.input}
        value={value}
      />
      <TouchableOpacity
        accessibilityLabel="Send message"
        activeOpacity={0.7}
        disabled={disabled}
        onPress={onSend}
        style={[styles.sendButton, disabled && styles.sendButtonDisabled]}
      >
        <Ionicons color={COLORS.surface} name="send" size={19} />
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