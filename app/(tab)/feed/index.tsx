import { useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import AppHeader from "@/components/app-header";
import ChoiceChip from "@/components/choice-chip";
import EmptyState from "@/components/empty-state";
import ItemSummaryCard from "@/components/item-summary-card";
import SearchBar from "@/components/search-bar";
import { COLORS, SPACING } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { getClaims } from "@/services/claims";
import { getAllItems } from "@/services/items";

type FilterType = "All" | "Lost" | "Found";

export default function FeedScreen() {
  const [query, setQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("All");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { items, claims, currentUserId, notifications, setItems, setClaims } = useApp();

  const userNotifications = (notifications || []).filter((n) => n.userId === currentUserId);
  const unreadCount = userNotifications.filter((n) => !n.read).length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log("[FeedScreen] Fetching items from PostgreSQL database...");
      const [freshItems, freshClaims] = await Promise.allSettled([
        getAllItems(currentUserId),
        getClaims({}, currentUserId),
      ]);
      if (freshItems.status === "fulfilled" && Array.isArray(freshItems.value)) {
        console.log(`[FeedScreen] Received ${freshItems.value.length} items from database.`);
        setItems(freshItems.value);
      } else if (freshItems.status === "rejected") {
        console.error("[FeedScreen] Failed to fetch items from database:", freshItems.reason);
      }

      if (freshClaims.status === "fulfilled" && Array.isArray(freshClaims.value)) {
        setClaims(freshClaims.value);
      }
    } catch (err) {
      console.warn("Feed refresh error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    handleRefresh();
  }, [currentUserId]);

  const synchronizedItems = useMemo(() => {
    return items.map((item) => {
      const itemClaims = claims.filter((c) => c.itemId === item.id);
      if (itemClaims.some((c) => c.status === "Completed")) {
        return { ...item, status: "Solved" as const };
      }
      if (itemClaims.some((c) => c.status === "Approved")) {
        return { ...item, status: "Reserved" as const };
      }
      if (itemClaims.some((c) => c.status === "Pending") && item.status === "Active") {
        return { ...item, status: "Pending Claim" as const };
      }
      return item;
    });
  }, [items, claims]);

  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    // Feed will show all the active and pending reports
    const activeAndPendingItems = synchronizedItems.filter(
      (item) => item.status === "Active" || item.status === "Pending Claim"
    );

    return activeAndPendingItems.filter((item) => {
      if (selectedFilter !== "All" && item.type !== selectedFilter) {
        return false;
      }

      if (trimmed) {
        const matchTitle = item.title.toLowerCase().includes(trimmed);
        const matchDesc = item.description.toLowerCase().includes(trimmed);
        const matchLoc = item.location.toLowerCase().includes(trimmed);
        return matchTitle || matchDesc || matchLoc;
      }

      return true;
    });
  }, [synchronizedItems, query, selectedFilter]);

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <AppHeader
        title="Item Feed"
        subtitle="Explore lost & found reports"
        onPressNotification={() => router.push("/profile/notifications" as any)}
        unreadCount={unreadCount}
      />
      <SearchBar onChangeText={setQuery} placeholder="Search lost or found items..." value={query} />

      <View style={styles.filterRow}>
        <ChoiceChip
          label="All Items"
          onPress={() => setSelectedFilter("All")}
          selected={selectedFilter === "All"}
        />
        <ChoiceChip
          label="Lost Items"
          onPress={() => setSelectedFilter("Lost")}
          selected={selectedFilter === "Lost"}
        />
        <ChoiceChip
          label="Found Items"
          onPress={() => setSelectedFilter("Found")}
          selected={selectedFilter === "Found"}
        />
      </View>

      <FlatList
        contentContainerStyle={styles.content}
        data={filteredItems}
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
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            message={
              query
                ? "No items match your search term."
                : selectedFilter !== "All"
                ? `No ${selectedFilter.toLowerCase()} items available right now.`
                : "No feed items available right now."
            }
            title={query ? "No search results" : "Feed is empty"}
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
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  content: { padding: SPACING.lg, paddingBottom: 32 },
  itemWrapper: { marginBottom: SPACING.md },
});
