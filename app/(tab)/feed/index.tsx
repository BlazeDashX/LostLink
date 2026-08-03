import { useMemo, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet, View } from "react-native";

import AppHeader from "@/components/app-header";
import ChoiceChip from "@/components/choice-chip";
import EmptyState from "@/components/empty-state";
import ItemSummaryCard from "@/components/item-summary-card";
import SearchBar from "@/components/search-bar";
import { COLORS, SPACING } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

type FilterType = "All" | "Lost" | "Found";

export default function FeedScreen() {
  const [query, setQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("All");
  const { items } = useApp();

  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    return items.filter((item) => {
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
  }, [items, query, selectedFilter]);

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader subtitle="Explore lost & found reports" title="Item Feed" />
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
