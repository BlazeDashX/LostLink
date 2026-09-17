import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS, SPACING } from "@/constants/theme";
import { resolveItemImageUrl } from "@/services/imageUtils";
import { Item } from "@/types";
import StatusBadge from "./status-badge";

interface ItemSummaryCardProps {
  item: Item;
  onPress?: () => void;
}

export default function ItemSummaryCard({ item, onPress }: ItemSummaryCardProps) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = resolveItemImageUrl(item.image);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({ pathname: "/report/item/[id]", params: { id: item.id } } as any);
    }
  };

  return (
    <Pressable
      accessibilityHint="Opens detailed item view"
      accessibilityLabel={`View details for ${item.title}`}
      accessibilityRole="button"
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.iconArea}>
        {imageUrl && !imgError ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.thumbImage}
            contentFit="cover"
            transition={200}
            onError={() => setImgError(true)}
          />
        ) : (
          <Ionicons color={COLORS.primary} name="cube-outline" size={30} />
        )}
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
    </Pressable>
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
  pressed: { opacity: 0.8 },
  iconArea: {
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    height: 64,
    justifyContent: "center",
    marginRight: SPACING.md,
    overflow: "hidden",
    width: 64,
  },
  thumbImage: {
    height: "100%",
    width: "100%",
  },
  content: { flex: 1 },
  type: { color: COLORS.primary, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  title: { color: COLORS.text, fontSize: 16, fontWeight: "800", marginTop: 3 },
  metaRow: { alignItems: "center", flexDirection: "row", marginTop: 5 },
  location: { color: COLORS.textMuted, flex: 1, fontSize: 12, marginLeft: 3 },
  badgeSpacing: { marginTop: SPACING.sm },
});