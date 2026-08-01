import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { COLORS, SPACING } from "@/constants/theme";

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function EmptyState({ title, message, icon = "chatbubbles-outline" }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons color={COLORS.primary} name={icon} size={34} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", padding: 40 },
  iconCircle: {
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderRadius: 36,
    height: 72,
    justifyContent: "center",
    marginBottom: SPACING.lg,
    width: 72,
  },
  title: { color: COLORS.text, fontSize: 18, fontWeight: "700", marginBottom: SPACING.sm },
  message: { color: COLORS.textMuted, fontSize: 14, lineHeight: 21, textAlign: "center" },
});