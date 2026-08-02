import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { COLORS, SPACING } from "@/constants/theme";
import { Item } from "@/types";
import StatusBadge from "./status-badge";

interface ItemSummaryCardProps {
  item: Item;
}

export default function ItemSummaryCard({ item }: ItemSummaryCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconArea}>
        <Ionicons color={COLORS.primary} name="cube-outline" size={30} />
      </View>
      <View style={styles.content}>
        <Text style={styles.type}>{item.type.toUpperCase()} ITEM</Text>
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.metaRow}>
          <Ionicons color={COLORS.textMuted} name="location-outline" size={14} />
          <Text numberOfLines={1} style={styles.location}>{item.location}</Text>
        </View>
        <View style={styles.badgeSpacing}>
          <StatusBadge status={item.status} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    padding: SPACING.lg,
  },
  iconArea: {
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    height: 64,
    justifyContent: "center",
    marginRight: SPACING.md,
    width: 64,
  },
  content: { flex: 1 },
  type: { color: COLORS.primary, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  title: { color: COLORS.text, fontSize: 16, fontWeight: "800", marginTop: 3 },
  metaRow: { alignItems: "center", flexDirection: "row", marginTop: 5 },
  location: { color: COLORS.textMuted, flex: 1, fontSize: 12, marginLeft: 3 },
  badgeSpacing: { marginTop: SPACING.sm },
});