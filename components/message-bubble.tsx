import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { COLORS, SPACING } from "@/constants/theme";
import { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

const formatTime = (isoDate: string) =>
  new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(
    new Date(isoDate),
  );

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const isLocation =
    message.text.startsWith("📍") ||
    message.text.includes("openstreetmap.org");

  const handleOpenMap = () => {
    const urlMatch = message.text.match(/https:\/\/www\.openstreetmap\.org\S+/);
    if (urlMatch && urlMatch[0]) {
      Linking.openURL(urlMatch[0]).catch((err) =>
        console.log("Could not open map URL:", err),
      );
    }
  };

  return (
    <View
      style={[styles.wrapper, isOwn ? styles.wrapperOwn : styles.wrapperOther]}
    >
      <View
        style={[
          styles.bubble,
          isOwn ? styles.bubbleOwn : styles.bubbleOther,
          isLocation && (isOwn ? styles.locationBubbleOwn : styles.locationBubbleOther),
        ]}
      >
        {isLocation ? (
          <View style={styles.locationContainer}>
            <View style={styles.locationHeader}>
              <Ionicons
                color={isOwn ? COLORS.surface : COLORS.primary}
                name="location-sharp"
                size={18}
              />
              <Text
                style={[
                  styles.locationTitle,
                  isOwn ? styles.locationTitleOwn : styles.locationTitleOther,
                ]}
              >
                Shared Location
              </Text>
            </View>
            <Text
              style={[
                styles.text,
                isOwn && styles.textOwn,
                styles.locationText,
              ]}
            >
              {message.text.replace(/^📍\s*(Shared Location:?\s*)?/i, "")}
            </Text>
            <TouchableOpacity
              accessibilityHint="Opens this coordinates in your web browser or maps app"
              accessibilityLabel="Open shared location on map"
              accessibilityRole="button"
              activeOpacity={0.8}
              onPress={handleOpenMap}
              style={[
                styles.mapButton,
                isOwn ? styles.mapButtonOwn : styles.mapButtonOther,
              ]}
            >
              <Ionicons
                color={isOwn ? COLORS.primary : COLORS.surface}
                name="map-outline"
                size={14}
              />
              <Text
                style={[
                  styles.mapButtonText,
                  isOwn ? styles.mapButtonTextOwn : styles.mapButtonTextOther,
                ]}
              >
                View on Map
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={[styles.text, isOwn && styles.textOwn]}>
            {message.text}
          </Text>
        )}
        <Text style={[styles.time, isOwn && styles.timeOwn]}>
          {formatTime(message.sentAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  wrapperOwn: { justifyContent: "flex-end" },
  wrapperOther: { justifyContent: "flex-start" },
  bubble: {
    borderRadius: 18,
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleOwn: { backgroundColor: COLORS.primary, borderBottomRightRadius: 5 },
  bubbleOther: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 5,
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  locationBubbleOwn: {
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
  },
  locationBubbleOther: {
    borderColor: COLORS.primaryLight,
    borderWidth: 1.5,
  },
  locationContainer: {
    gap: 6,
  },
  locationHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  locationTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  locationTitleOwn: {
    color: COLORS.surface,
  },
  locationTitleOther: {
    color: COLORS.primary,
  },
  locationText: {
    fontSize: 13,
    lineHeight: 18,
  },
  mapButton: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mapButtonOwn: {
    backgroundColor: COLORS.surface,
  },
  mapButtonOther: {
    backgroundColor: COLORS.primary,
  },
  mapButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  mapButtonTextOwn: {
    color: COLORS.primary,
  },
  mapButtonTextOther: {
    color: COLORS.surface,
  },
  text: { color: COLORS.text, fontSize: 14, lineHeight: 20 },
  textOwn: { color: COLORS.surface },
  time: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 4,
    textAlign: "right",
  },
  timeOwn: { color: "#DBEAFE" },
});
