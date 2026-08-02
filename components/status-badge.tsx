import { StyleSheet, Text, View } from "react-native";

import { COLORS } from "@/constants/theme";
import { ClaimStatus, ItemStatus } from "@/types";

interface StatusBadgeProps {
  status: ClaimStatus | ItemStatus;
}

const STATUS_COLORS: Record<string, { backgroundColor: string; color: string }> = {
  Active: { backgroundColor: COLORS.successLight, color: COLORS.success },
  "Pending Claim": { backgroundColor: COLORS.warningLight, color: COLORS.warning },
  Pending: { backgroundColor: COLORS.warningLight, color: COLORS.warning },
  Approved: { backgroundColor: COLORS.successLight, color: COLORS.success },
  Reserved: { backgroundColor: COLORS.primaryLight, color: COLORS.primaryDark },
  Rejected: { backgroundColor: COLORS.dangerLight, color: COLORS.danger },
  Completed: { backgroundColor: COLORS.purpleLight, color: COLORS.purple },
  Delivered: { backgroundColor: COLORS.primaryLight, color: COLORS.primaryDark },
  Received: { backgroundColor: COLORS.purpleLight, color: COLORS.purple },
  Solved: { backgroundColor: COLORS.successLight, color: COLORS.success },
  Hidden: { backgroundColor: COLORS.border, color: COLORS.textMuted },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const palette = STATUS_COLORS[status] ?? {
    backgroundColor: COLORS.border,
    color: COLORS.textMuted,
  };

  return (
    <View style={[styles.badge, { backgroundColor: palette.backgroundColor }]}> 
      <Text style={[styles.text, { color: palette.color }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  text: { fontSize: 11, fontWeight: "700" },
});