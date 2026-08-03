import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS, SPACING } from "@/constants/theme";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onPressBack?: () => void;
  rightElement?: React.ReactNode;
  onPressNotification?: () => void;
  unreadCount?: number;
}

export default function AppHeader({
  title,
  subtitle,
  showBack = false,
  onPressBack,
  rightElement,
  onPressNotification,
  unreadCount = 0,
}: AppHeaderProps) {
  const handleBack = () => {
    if (onPressBack) {
      onPressBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      {showBack ? (
        <Pressable
          accessibilityLabel="Go back"
          onPress={handleBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons color={COLORS.text} name="arrow-back" size={22} />
        </Pressable>
      ) : null}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightElement ? (
        rightElement
      ) : onPressNotification ? (
        <Pressable
          accessibilityLabel="Notifications"
          onPress={onPressNotification}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Ionicons color={COLORS.text} name="notifications-outline" size={24} />
          {unreadCount > 0 ? (
            <View pointerEvents="none" style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
      ) : null}
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
    zIndex: 10,
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
  iconButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    position: "relative",
    width: 40,
  },
  pressed: { opacity: 0.7 },
  badge: {
    alignItems: "center",
    backgroundColor: COLORS.danger,
    borderRadius: 9,
    height: 18,
    justifyContent: "center",
    minWidth: 18,
    paddingHorizontal: 4,
    position: "absolute",
    right: 2,
    top: 2,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
});