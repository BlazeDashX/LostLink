// components/ItemCard.tsx
// SRS 17.2 — Representative ItemCard Interface, extended with a colored
// progress/status strip to match the Home / Search / My Activity mockups.
// Used by FlatList rows: keyExtractor={item => item.id}, renderItem -> ItemCard.
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import StatusBadge from "./StatusBadge";
import { Item } from "@/types";

interface ItemCardProps {
  item: Item;
  onPress: (itemId: string) => void;
  actionLabel?: string;
  onAction?: (itemId: string) => void;
}

export default function ItemCard({ item, onPress, actionLabel, onAction }: ItemCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item.id)}>
      <View style={styles.thumb}>
        <Text style={styles.thumbText}>{item.title.slice(0, 3).toUpperCase()}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.location} numberOfLines={1}>
          {item.location}
        </Text>
        <StatusBadge status={item.status} size="small" />
      </View>

      {actionLabel && onAction && (
        <TouchableOpacity onPress={() => onAction(item.id)} hitSlop={8}>
          <Text style={styles.action}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbText: { fontSize: 12,
     fontWeight: "700", 
     color: "#1E3A8A" },

  info: { flex: 1, gap: 4 },

  title: { fontSize: 14, 
    fontWeight: "700",
     color: "#0F172A" },

  location: { fontSize: 12,
     color: "#64748B" },

  action: { fontSize: 13,
     fontWeight: "600",
      color: "#2563EB" },
      
});
