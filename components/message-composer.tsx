import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

import { COLORS, SPACING } from "@/constants/theme";

interface MessageComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onShareLocation?: () => void;
  loading?: boolean;
  isSharingLocation?: boolean;
}

export default function MessageComposer({
  value,
  onChangeText,
  onSend,
  onShareLocation,
  loading = false,
  isSharingLocation = false,
}: MessageComposerProps) {
  const disabled = value.trim().length === 0 || loading || isSharingLocation;

  return (
    <View style={styles.container}>
      {onShareLocation && (
        <TouchableOpacity
          accessibilityHint="Fetches GPS coordinates and sends meeting spot in chat"
          accessibilityLabel="Share current location"
          accessibilityRole="button"
          accessibilityState={{ disabled: isSharingLocation || loading }}
          activeOpacity={0.7}
          disabled={isSharingLocation || loading}
          onPress={onShareLocation}
          style={styles.locationButton}
        >
          {isSharingLocation ? (
            <ActivityIndicator color={COLORS.primary} size="small" />
          ) : (
            <Ionicons color={COLORS.primary} name="location-outline" size={22} />
          )}
        </TouchableOpacity>
      )}

      <TextInput
        accessibilityLabel="Type your message"
        editable={!loading && !isSharingLocation}
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
  locationButton: {
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
    borderRadius: 21,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
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