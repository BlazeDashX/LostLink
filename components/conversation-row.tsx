import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { COLORS, SPACING } from "@/constants/theme";
import { ConversationThread } from "@/types";

interface ConversationRowProps {
  thread: ConversationThread;
  onPress: (conversationId: string) => void;
}

const formatTime = (isoDate?: string) => {
  if (!isoDate) return "";
  try {
    return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(isoDate));
  } catch {
    return "";
  }
};

export default function ConversationRow({ thread, onPress }: ConversationRowProps) {
  const participantName = thread.participant?.name || "User";
  const itemTitle = thread.item?.title || "Item";
  const messagePreview = thread.latestMessage?.text || "No messages yet";
  const sentTime = formatTime(thread.latestMessage?.sentAt);

  const a11yLabel = `Conversation with ${participantName} regarding ${itemTitle}. Latest message: ${messagePreview}.${
    thread.unreadCount > 0 ? ` ${thread.unreadCount} unread.` : ""
  }`;

  return (
    <TouchableOpacity
      accessibilityHint="Opens chat conversation"
      accessibilityLabel={a11yLabel}
      accessibilityRole="button"
      activeOpacity={0.7}
      onPress={() => onPress(thread.conversationId)}
      style={styles.container}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{participantName.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text numberOfLines={1} style={styles.name}>{participantName}</Text>
          {sentTime ? <Text style={styles.time}>{sentTime}</Text> : null}
        </View>
        <Text numberOfLines={1} style={styles.itemTitle}>{itemTitle}</Text>
        <View style={styles.bottomRow}>
          <Text
            numberOfLines={1}
            style={[styles.preview, thread.unreadCount > 0 && styles.previewUnread]}
          >
            {messagePreview}
          </Text>
          {thread.unreadCount > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{thread.unreadCount}</Text>
            </View>
          ) : (
            <Ionicons color={COLORS.textMuted} name="chevron-forward" size={18} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    marginRight: SPACING.md,
    width: 48,
  },
  avatarText: { color: COLORS.primaryDark, fontSize: 18, fontWeight: "800" },
  content: { flex: 1 },
  topRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  name: { color: COLORS.text, flex: 1, fontSize: 15, fontWeight: "700", marginRight: SPACING.sm },
  time: { color: COLORS.textMuted, fontSize: 11 },
  itemTitle: { color: COLORS.primary, fontSize: 12, fontWeight: "600", marginTop: 2 },
  bottomRow: { alignItems: "center", flexDirection: "row", marginTop: 4 },
  preview: { color: COLORS.textMuted, flex: 1, fontSize: 13, marginRight: SPACING.sm },
  previewUnread: { color: COLORS.text, fontWeight: "600" },
  unreadBadge: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 20,
    minWidth: 20,
    paddingHorizontal: 5,
  },
  unreadText: { color: COLORS.surface, fontSize: 10, fontWeight: "800" },
});