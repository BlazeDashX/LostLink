import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { COLORS, SPACING } from "@/constants/theme";
import { Category } from "@/types";

interface CategoryDropdownProps {
  label?: string;
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
  error?: string | null;
  loading?: boolean;
  onRetry?: () => void;
  placeholder?: string;
}

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Electronics: "phone-portrait-outline",
  Documents: "document-text-outline",
  "Bags & Luggage": "briefcase-outline",
  Keys: "key-outline",
  Wallets: "wallet-outline",
  Clothing: "shirt-outline",
  Eyewear: "glasses-outline",
  Books: "book-outline",
  Stationery: "pencil-outline",
  Umbrellas: "umbrella-outline",
  "Water Bottles": "water-outline",
  "Pets & Animals": "paw-outline",
  Jewelry: "diamond-outline",
  Watches: "watch-outline",
  "Sports Equipment": "football-outline",
  "Musical Instruments": "musical-notes-outline",
  "Toys & Games": "game-controller-outline",
  Cosmetics: "color-wand-outline",
  Medications: "medkit-outline",
  "Tools & Hardware": "construct-outline",
  Footwear: "footsteps-outline",
  "Art Supplies": "brush-outline",
  Groceries: "cart-outline",
  "Other / Miscellaneous": "cube-outline",
  Miscellaneous: "cube-outline",
  Other: "cube-outline",
};

export default function CategoryDropdown({
  label = "Category",
  categories,
  selectedId,
  onSelect,
  error,
  loading = false,
  onRetry,
  placeholder = "Select a category...",
}: CategoryDropdownProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedCategory = useMemo(
    () => categories.find((cat) => cat.id === selectedId),
    [categories, selectedId]
  );

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((cat) => cat.name.toLowerCase().includes(q));
  }, [categories, searchQuery]);

  const getIcon = (name: string): keyof typeof Ionicons.glyphMap => {
    return CATEGORY_ICONS[name] || "pricetag-outline";
  };

  const handleOpen = () => {
    setSearchQuery("");
    setModalVisible(true);
  };

  const handleSelect = (id: string) => {
    onSelect(id);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={COLORS.primary} size="small" />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      ) : (
        <TouchableOpacity
          accessibilityHint="Tap to choose item category from a list"
          accessibilityLabel={`Category: ${selectedCategory?.name || "none selected"}`}
          accessibilityRole="combobox"
          activeOpacity={0.75}
          onPress={handleOpen}
          style={[styles.triggerButton, error ? styles.triggerError : null]}
        >
          <View style={styles.triggerLeft}>
            <View
              style={[
                styles.iconBadge,
                selectedCategory ? styles.iconBadgeSelected : styles.iconBadgeEmpty,
              ]}
            >
              <Ionicons
                color={selectedCategory ? COLORS.primary : COLORS.textMuted}
                name={selectedCategory ? getIcon(selectedCategory.name) : "grid-outline"}
                size={18}
              />
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.selectedText,
                !selectedCategory && styles.placeholderText,
              ]}
            >
              {selectedCategory?.name || placeholder}
            </Text>
          </View>
          <Ionicons
            color={COLORS.textMuted}
            name="chevron-down"
            size={18}
            style={styles.chevron}
          />
        </TouchableOpacity>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
        transparent
        visible={modalVisible}
      >
        <Pressable
          onPress={() => setModalVisible(false)}
          style={styles.modalOverlay}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContainer}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Ionicons color={COLORS.primary} name="grid-outline" size={20} />
                <Text style={styles.modalTitle}>Select Category</Text>
              </View>
              <TouchableOpacity
                accessibilityLabel="Close category picker"
                accessibilityRole="button"
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons color={COLORS.textMuted} name="close" size={20} />
              </TouchableOpacity>
            </View>

            {/* Quick Search */}
            <View style={styles.searchContainer}>
              <Ionicons
                color={COLORS.textMuted}
                name="search-outline"
                size={18}
                style={styles.searchIcon}
              />
              <TextInput
                accessibilityLabel="Search categories"
                autoCapitalize="none"
                clearButtonMode="while-editing"
                onChangeText={setSearchQuery}
                placeholder="Search categories (e.g. Keys, Wallet, Phone)..."
                placeholderTextColor={COLORS.textMuted}
                style={styles.searchInput}
                value={searchQuery}
              />
              {searchQuery.length > 0 ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons color={COLORS.textMuted} name="close-circle" size={16} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* List */}
            <FlatList
              contentContainerStyle={styles.listContent}
              data={filteredCategories}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons color={COLORS.textMuted} name="help-circle-outline" size={32} />
                  <Text style={styles.emptyText}>
                    No category matching &quot;{searchQuery}&quot;
                  </Text>
                  {categories.some(
                    (c) =>
                      c.name.toLowerCase().includes("misc") ||
                      c.name.toLowerCase().includes("other")
                  ) ? (
                    <TouchableOpacity
                      onPress={() => {
                        const otherCat = categories.find(
                          (c) =>
                            c.name.toLowerCase().includes("misc") ||
                            c.name.toLowerCase().includes("other")
                        );
                        if (otherCat) handleSelect(otherCat.id);
                      }}
                      style={styles.selectOtherButton}
                    >
                      <Text style={styles.selectOtherButtonText}>
                        Select &quot;Other / Miscellaneous&quot;
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = item.id === selectedId;
                return (
                  <TouchableOpacity
                    accessibilityLabel={item.name}
                    accessibilityRole="button"
                    activeOpacity={0.7}
                    onPress={() => handleSelect(item.id)}
                    style={[
                      styles.categoryRow,
                      isSelected && styles.categoryRowSelected,
                    ]}
                  >
                    <View style={styles.categoryRowLeft}>
                      <View
                        style={[
                          styles.rowIconBadge,
                          isSelected && styles.rowIconBadgeSelected,
                        ]}
                      >
                        <Ionicons
                          color={isSelected ? COLORS.surface : COLORS.primary}
                          name={getIcon(item.name)}
                          size={18}
                        />
                      </View>
                      <Text
                        style={[
                          styles.categoryRowName,
                          isSelected && styles.categoryRowNameSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                    </View>
                    {isSelected ? (
                      <Ionicons
                        color={COLORS.primary}
                        name="checkmark-circle"
                        size={20}
                      />
                    ) : (
                      <Ionicons
                        color={COLORS.border}
                        name="chevron-forward"
                        size={16}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
              style={styles.list}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  triggerButton: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  triggerError: {
    backgroundColor: "#FFF7F7",
    borderColor: COLORS.danger,
  },
  triggerLeft: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: SPACING.sm,
  },
  iconBadge: {
    alignItems: "center",
    borderRadius: 8,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  iconBadgeSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  iconBadgeEmpty: {
    backgroundColor: COLORS.background,
  },
  selectedText: {
    color: COLORS.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  placeholderText: {
    color: COLORS.textMuted,
    fontWeight: "400",
  },
  chevron: {
    marginLeft: SPACING.xs,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 11,
    marginTop: 5,
  },
  loadingBox: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: SPACING.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flex: 1,
    justifyContent: "center",
    padding: SPACING.md,
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    maxHeight: "80%",
    maxWidth: 480,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    width: "100%",
  },
  modalHeader: {
    alignItems: "center",
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  modalHeaderTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.sm,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  closeButton: {
    borderRadius: 16,
    padding: 4,
  },
  searchContainer: {
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: Platform.OS === "ios" ? SPACING.sm : 4,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    color: COLORS.text,
    flex: 1,
    fontSize: 13,
    paddingVertical: 4,
    outlineStyle: "none",
  } as any,
  list: {
    maxHeight: 380,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  categoryRow: {
    alignItems: "center",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  categoryRowSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  categoryRowLeft: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: SPACING.sm,
  },
  rowIconBadge: {
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 8,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  rowIconBadgeSelected: {
    backgroundColor: COLORS.primary,
  },
  categoryRowName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "500",
  },
  categoryRowNameSelected: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  separator: {
    height: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: SPACING.xs,
  },
  selectOtherButton: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  selectOtherButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },
});
