// components/StatusBadge.tsx
// SRS 17.1 — "Maps statuses to consistent colors." Centralizes status ->
// color mapping so the same state looks identical across every screen
// (Home, Search, Item Details, My Activity, Claim Review, Admin screens).
import React from "react";
import { View, Text, StyleSheet } from "react-native";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Active: { bg: "#DBEAFE", color: "#1E3A8A" },
  Lost: { bg: "#FEE2E2", color: "#DC2626" },
  Found: { bg: "#DCFCE7", color: "#16A34A" },
  Pending: { bg: "#FEF3C7", color: "#D97706" },
  "Pending Claim": { bg: "#FEF3C7", color: "#D97706" },
  Reserved: { bg: "#FEF3C7", color: "#D97706" },
  Delivered: { bg: "#FEF3C7", color: "#D97706" },
  Received: { bg: "#DCFCE7", color: "#16A34A" },
  Approved: { bg: "#DCFCE7", color: "#16A34A" },
  Completed: { bg: "#DCFCE7", color: "#16A34A" },
  Solved: { bg: "#DCFCE7", color: "#16A34A" },
  Rejected: { bg: "#FEE2E2", color: "#DC2626" },
  Hidden: { bg: "#FEE2E2", color: "#DC2626" },
  Suspended: { bg: "#FEE2E2", color: "#DC2626" },
  Admin: { bg: "#EDE9FE", color: "#7C3AED" },
};

const DEFAULT_COLORS = { bg: "#DBEAFE", color: "#1E3A8A" };

interface StatusBadgeProps {
  status: string;
  size?: "small" | "medium";
}

export default function StatusBadge({ status, size = "medium" }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status] ?? DEFAULT_COLORS;
  const isSmall = size === "small";

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.bg },
        isSmall && styles.badgeSmall,
      ]}
    >
      <Text style={[styles.text, { color: colors.color }, isSmall && styles.textSmall]}>
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeSmall: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  text: { fontSize: 12, fontWeight: "700" },
  textSmall: { fontSize: 10 },
});
