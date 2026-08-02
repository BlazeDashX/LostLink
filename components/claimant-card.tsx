import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, SPACING } from "@/constants/theme";
import { User } from "@/types";

interface ClaimantCardProps {
  claimant: User;
}

export default function ClaimantCard({ claimant }: ClaimantCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{claimant.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>CLAIMANT</Text>
        <Text style={styles.name}>{claimant.name}</Text>
        <View style={styles.detailRow}>
          <Ionicons color={COLORS.textMuted} name="mail-outline" size={14} />
          <Text style={styles.detail}>{claimant.email}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    padding: SPACING.lg,
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
  label: { color: COLORS.primary, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  name: { color: COLORS.text, fontSize: 16, fontWeight: "800", marginTop: 2 },
  detailRow: { alignItems: "center", flexDirection: "row", marginTop: 4 },
  detail: { color: COLORS.textMuted, fontSize: 12, marginLeft: 4 },
});