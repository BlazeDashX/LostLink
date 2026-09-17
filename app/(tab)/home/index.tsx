import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AppHeader from "@/components/app-header";
import EmptyState from "@/components/empty-state";
import ItemSummaryCard from "@/components/item-summary-card";
import { COLORS, SPACING } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { getMyReports } from "@/services/items";
import { Item } from "@/types";

export default function HomeScreen() {
  const { currentUserId, currentUser, items, claims, notifications } = useApp();

  const [myReports, setMyReports] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUserDashboard = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const userReports = await getMyReports(currentUserId);
      setMyReports(userReports);
    } catch (err) {
      console.warn("Error loading user dashboard reports:", err);
      // Fallback to filtering items by current user
      const localUserReports = items.filter((item) => item.reporterId === currentUserId);
      setMyReports(localUserReports);
    }
  }, [currentUserId, items]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      await fetchUserDashboard();
      if (isMounted) setIsLoading(false);
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [fetchUserDashboard]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchUserDashboard();
    setIsRefreshing(false);
  };

  const userNotifications = notifications.filter(
    (n) => n.userId === currentUserId
  );
  const unreadCount = userNotifications.filter((n) => !n.read).length;

  const displayReports = myReports.length > 0
    ? myReports
    : items.filter((item) => item.reporterId === currentUserId);

  const myLostCount = displayReports.filter((item) => item.type === "Lost").length;
  const myFoundCount = displayReports.filter((item) => item.type === "Found").length;
  const myPendingClaimsCount = claims.filter(
    (claim) =>
      (claim.claimantId === currentUserId ||
        displayReports.some((item) => item.id === claim.itemId)) &&
      claim.status === "Pending"
  ).length;

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader
        onPressNotification={() => router.push("/home/notifications" as any)}
        subtitle={currentUser?.name ? `Welcome back, ${currentUser.name}` : "Your personal activity overview"}
        title="Dashboard"
        unreadCount={unreadCount}
      />

      <FlatList
        contentContainerStyle={styles.content}
        data={displayReports}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            colors={[COLORS.primary]}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{myLostCount}</Text>
                <Text style={styles.statLabel}>My Lost</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{myFoundCount}</Text>
                <Text style={styles.statLabel}>My Found</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{myPendingClaimsCount}</Text>
                <Text style={styles.statLabel}>My Claims</Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Reported Items</Text>
              <Text style={styles.sectionCount}>({displayReports.length})</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={{ paddingVertical: SPACING.xl, alignItems: "center" }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <EmptyState
              icon="document-text-outline"
              message="You haven't reported any lost or found items yet. Tap 'Report' below to add one."
              title="No reports submitted"
            />
          )
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
  },
  sectionCount: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  itemWrapper: { marginBottom: SPACING.md },
});
