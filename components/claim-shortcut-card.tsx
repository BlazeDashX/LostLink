import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { COLORS, SPACING } from "@/constants/theme";

interface ClaimShortcutCardProps {
  title: string;
  message: string;
  actionLabel: string;
  onPress: () => void;
}

export default function ClaimShortcutCard({
  title,
  message,
  actionLabel,
  onPress,
}: ClaimShortcutCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Ionicons color={COLORS.primary} name="shield-checkmark-outline" size={24} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.action}>
          <Text style={styles.actionText}>{actionLabel}</Text>
          <Ionicons color={COLORS.primary} name="arrow-forward" size={16} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.primaryLight,
    borderColor: "#BFDBFE",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    margin: SPACING.lg,
    padding: SPACING.md,
  },
  iconCircle: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    marginRight: SPACING.md,
    width: 44,
  },
  content: { flex: 1 },
  title: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  message: { color: COLORS.textMuted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  action: { alignItems: "center", flexDirection: "row", gap: 4, marginTop: SPACING.sm },
  actionText: { color: COLORS.primary, fontSize: 13, fontWeight: "700" },
});