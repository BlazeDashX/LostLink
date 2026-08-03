import { router } from "expo-router";
import { FlatList, SafeAreaView, StyleSheet, Text, View } from "react-native";

import AppHeader from "@/components/app-header";
import EmptyState from "@/components/empty-state";
import ItemSummaryCard from "@/components/item-summary-card";
import { COLORS, SPACING } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

export default function HomeScreen() {
  const { currentUserId, items, claims, notifications } = useApp();

  const userNotifications = notifications.filter(
    (n) => n.userId === currentUserId
  );
  const unreadCount = userNotifications.filter((n) => !n.read).length;

  const lostCount = items.filter((item) => item.type === "Lost" && item.status === "Active").length;
  const foundCount = items.filter((item) => item.type === "Found" && item.status === "Active").length;
  const pendingClaimsCount = claims.filter((claim) => claim.status === "Pending").length;

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader
        onPressNotification={() => router.push("/home/notifications" as any)}
        subtitle="Reconnecting lost items with owners"
        title="LostLink Home"
        unreadCount={unreadCount}
      />

      <FlatList
        contentContainerStyle={styles.content}
        data={items}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{lostCount}</Text>
              <Text style={styles.statLabel}>Lost Items</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{foundCount}</Text>
              <Text style={styles.statLabel}>Found Items</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{pendingClaimsCount}</Text>
              <Text style={styles.statLabel}>Pending Claims</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="albums-outline"
            message="No reported items available at the moment."
            title="No items found"
          />
        }
        renderItem={({ item }) => (
          <View style={styles.itemWrapper}>
            <ItemSummaryCard item={item} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.background, flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 32 },
  statsContainer: {
    flexDirection: "row",
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingVertical: SPACING.md,
  },
  statNumber: { color: COLORS.primary, fontSize: 20, fontWeight: "800" },
  statLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: "600", marginTop: 2 },
  itemWrapper: { marginBottom: SPACING.md },
});
