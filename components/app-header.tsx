import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { COLORS, SPACING } from "@/constants/theme";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
}

export default function AppHeader({ title, subtitle, showBack = false }: AppHeaderProps) {
  return (
    <View style={styles.container}>
      {showBack ? (
        <TouchableOpacity
          accessibilityLabel="Go back"
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons color={COLORS.text} name="arrow-back" size={22} />
        </TouchableOpacity>
      ) : null}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    minHeight: 68,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    marginRight: SPACING.sm,
    width: 40,
  },
  titleContainer: { flex: 1 },
  title: { color: COLORS.text, fontSize: 22, fontWeight: "800" },
  subtitle: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
});