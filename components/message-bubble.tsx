import { StyleSheet, Text, View } from "react-native";

import { COLORS, SPACING } from "@/constants/theme";
import { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

const formatTime = (isoDate: string) =>
  new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(
    new Date(isoDate),
  );

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <View
      style={[styles.wrapper, isOwn ? styles.wrapperOwn : styles.wrapperOther]}
    >
      <View
        style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}
      >
        <Text style={[styles.text, isOwn && styles.textOwn]}>
          {message.text}
        </Text>
        <Text style={[styles.time, isOwn && styles.timeOwn]}>
          {formatTime(message.sentAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  wrapperOwn: { justifyContent: "flex-end" },
  wrapperOther: { justifyContent: "flex-start" },
  bubble: {
    borderRadius: 18,
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleOwn: { backgroundColor: COLORS.primary, borderBottomRightRadius: 5 },
  bubbleOther: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 5,
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  text: { color: COLORS.text, fontSize: 14, lineHeight: 20 },
  textOwn: { color: COLORS.surface },
  time: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 4,
    textAlign: "right",
  },
  timeOwn: { color: "#DBEAFE" },
});
