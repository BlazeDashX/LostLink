import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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
import ChoiceChip from "@/components/choice-chip";
import EmptyState from "@/components/empty-state";
import ItemSummaryCard from "@/components/item-summary-card";
import PrimaryButton from "@/components/primary-button";
import SearchBar from "@/components/search-bar";
import { COLORS, SPACING } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { getItems } from "@/services/items";
import { Item } from "@/types";

type FilterType = "All" | "Lost" | "Found";

export default function FeedScreen() {
  const { currentUserId, setItems } = useApp();
  const [query, setQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("All");
  const [feedItems, setFeedItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(
    async (isRefresh = false) => {
      if (!currentUserId) {
        setError("Please log in to load the item feed.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const result = await getItems({ userId: currentUserId });
        setFeedItems(result);
        setItems(result);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            "Could not load the item feed. Check your connection and try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentUserId, setItems]
  );

  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [loadFeed])
  );

  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    return feedItems.filter((item) => {
      if (item.status === "Hidden") {
        return false;
      }

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
  }, [feedItems, query, selectedFilter]);

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader subtitle="Explore lost & found reports" title="Item Feed" />
      <SearchBar
        onChangeText={setQuery}
        placeholder="Search title, description or location..."
        value={query}
      />

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

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.stateText}>Loading item feed...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <EmptyState
            icon="cloud-offline-outline"
            message={error}
            title="Could not load Feed"
          />
          <View style={styles.retryButton}>
            <PrimaryButton label="Try Again" onPress={() => loadFeed()} />
          </View>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.content}
          data={filteredItems}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              onRefresh={() => loadFeed(true)}
              refreshing={refreshing}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              message={
                query
                  ? "No visible items match your search term."
                  : selectedFilter !== "All"
                  ? `No ${selectedFilter.toLowerCase()} items are available right now.`
                  : "No feed items are available right now."
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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.background, flex: 1 },
  filterRow: {
    flexDirection: "row",
    marginBottom: SPACING.xs,
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.lg,
  },
  centerState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: SPACING.lg,
  },
  stateText: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: SPACING.md,
  },
  retryButton: { marginTop: SPACING.md, width: "100%" },
  content: { padding: SPACING.lg, paddingBottom: 32 },
  itemWrapper: { marginBottom: SPACING.md },
});
