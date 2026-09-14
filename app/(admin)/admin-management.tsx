// screens/AdminManagementScreen.tsx
// SRS 13.17 — Admin Management Screen
import React, { useMemo, useState, useCallback } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useApp } from "@/context/AppContext";
import { User, Item } from "@/types";
import { getAllUsers, updateUserStatus } from "@/services/users";
import { getAllItems, updateItem } from "@/services/items";

const COLORS = {
  primary: "#2563EB",
  primaryDark: "#1E3A8A",
  primaryLight: "#DBEAFE",
  green: "#16A34A",
  greenLight: "#DCFCE7",
  purple: "#7C3AED",
  purpleLight: "#EDE9FE",
  red: "#DC2626",
  redLight: "#FEE2E2",
  amber: "#D97706",
  amberLight: "#FEF3C7",
  text: "#0F172A",
  subtext: "#64748B",
  border: "#E2E8F0",
};

type Tab = "Users" | "Items" | "Claims";

export default function AdminManagementScreen() {
  const router = useRouter();
  const { currentUserId, items, setItems, claims } = useApp();

  const [tab, setTab] = useState<Tab>("Users");
  const [query, setQuery] = useState("");

  // Users data from backend
  const [backendUsers, setBackendUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Items data from backend
  const [backendItems, setBackendItems] = useState<Item[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [isUpdatingItem, setIsUpdatingItem] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    setUsersError(null);
    try {
      const data = await getAllUsers(currentUserId);
      setBackendUsers(data);
    } catch (err: any) {
      setUsersError(err?.response?.data?.message ?? "Failed to load users.");
    } finally {
      setIsLoadingUsers(false);
    }
  }, [currentUserId]);

  const fetchItems = useCallback(async () => {
    setIsLoadingItems(true);
    setItemsError(null);
    try {
      const data = await getAllItems(currentUserId);
      setBackendItems(data);
    } catch (err: any) {
      setItemsError(err?.response?.data?.message ?? "Failed to load items.");
    } finally {
      setIsLoadingItems(false);
    }
  }, [currentUserId]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        setIsLoadingUsers(true);
        setIsLoadingItems(true);
        setUsersError(null);
        setItemsError(null);
        try {
          const [usersData, itemsData] = await Promise.all([
            getAllUsers(currentUserId),
            getAllItems(currentUserId),
          ]);
          if (!cancelled) {
            setBackendUsers(usersData);
            setBackendItems(itemsData);
          }
        } catch (err: any) {
          if (!cancelled) {
            setUsersError(err?.response?.data?.message ?? "Failed to load data.");
            setItemsError(err?.response?.data?.message ?? "Failed to load data.");
          }
        } finally {
          if (!cancelled) {
            setIsLoadingUsers(false);
            setIsLoadingItems(false);
          }
        }
      }
      load();
      return () => { cancelled = true; };
    }, [currentUserId])
  );

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return backendUsers.filter((u) => !q || u.name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q));
  }, [backendUsers, query]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return backendItems.filter((i) => !q || i.title.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
  }, [backendItems, query]);

  const filteredClaims = useMemo(() => {
    const q = query.trim().toLowerCase();
    return claims.filter((c) => !q || c.id.toLowerCase().includes(q) || c.itemId.toLowerCase().includes(q));
  }, [claims, query]);

  function initials(name: string) {
    return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  }

  function badgeStyle(status: string) {
    switch (status) {
      case "Active":
        return { bg: COLORS.greenLight, color: COLORS.green };
      case "Admin":
        return { bg: COLORS.purpleLight, color: COLORS.purple };
      case "Suspended":
      case "Hidden":
        return { bg: COLORS.redLight, color: COLORS.red };
      case "Pending":
        return { bg: COLORS.amberLight, color: COLORS.amber };
      default:
        return { bg: COLORS.primaryLight, color: COLORS.primaryDark };
    }
  }

  function toggleUserStatus(user: User) {
    if (user.id === currentUserId) {
      Alert.alert("Not allowed", "You cannot suspend your own active session.");
      return;
    }
    if (isUpdating) return;

    const nextStatus = user.status === "Active" ? "Suspended" : "Active";

    Alert.alert(
      nextStatus === "Suspended" ? "Suspend user?" : "Activate user?",
      `${user.name} will be marked ${nextStatus}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: nextStatus === "Suspended" ? "destructive" : "default",
          onPress: async () => {
            setIsUpdating(true);
            try {
              const res = await updateUserStatus(currentUserId, user.id, nextStatus as "Active" | "Suspended");
              setBackendUsers((prev) => prev.map((u) => (u.id === user.id ? res.user : u)));
            } catch (err: any) {
              Alert.alert("Error", err?.response?.data?.message ?? "Failed to update user status.");
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  }

  function toggleItemVisibility(item: Item) {
    if (isUpdatingItem) return;

    const nextStatus = item.status === "Hidden" ? "Active" : "Hidden";

    Alert.alert(
      nextStatus === "Hidden" ? "Hide report?" : "Restore report?",
      `${item.title} will be marked ${nextStatus}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: nextStatus === "Hidden" ? "destructive" : "default",
          onPress: async () => {
            setIsUpdatingItem(true);
            try {
              const res = await updateItem(item.id, { status: nextStatus }, currentUserId);
              setBackendItems((prev) => prev.map((i) => (i.id === item.id ? res.item : i)));
            } catch (err: any) {
              Alert.alert("Error", err?.response?.data?.message ?? "Failed to update item visibility.");
            } finally {
              setIsUpdatingItem(false);
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.backArrow}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.header}>Admin Management</Text>
      </View>

      <View style={styles.tabRow}>
        {(["Users", "Items", "Claims"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabButton, tab === t && styles.tabButtonActive]}
            onPress={() => setTab(t)}
            accessibilityRole="tab"
            accessibilityLabel={`${t} tab`}
            accessibilityState={{ selected: tab === t }}
          >
            <Text style={[styles.tabButtonText, tab === t && styles.tabButtonTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${tab.toLowerCase()}`}
          placeholderTextColor={COLORS.subtext}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {tab === "Users" && (
        <FlatList
          data={filteredUsers}
          keyExtractor={(u) => u.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            isLoadingUsers ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading users...</Text>
              </View>
            ) : usersError ? (
              <View style={styles.errorState}>
                <Text style={styles.errorText}>{usersError}</Text>
                <TouchableOpacity onPress={fetchUsers} style={styles.retryButton} accessibilityRole="button" accessibilityLabel="Retry loading users">
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          renderItem={({ item: user }) => {
            const statusLabel = user.role === "Admin" ? "Admin" : user.status;
            const badge = badgeStyle(statusLabel);
            return (
              <TouchableOpacity 
                style={styles.row} 
                onPress={() => toggleUserStatus(user)} 
                disabled={isUpdating}
                accessibilityRole="button"
                accessibilityLabel={`Toggle status for ${user.name}`}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(user.name)}</Text>
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{user.name}</Text>
                  <Text style={styles.rowSubtitle}>
                    {user.id} · {user.role} · {user.status}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.color }]}>{statusLabel}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {tab === "Items" && (
        <FlatList
          data={filteredItems}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            isLoadingItems ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading items...</Text>
              </View>
            ) : itemsError ? (
              <View style={styles.errorState}>
                <Text style={styles.errorText}>{itemsError}</Text>
                <TouchableOpacity onPress={fetchItems} style={styles.retryButton} accessibilityRole="button" accessibilityLabel="Retry loading items">
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const badge = badgeStyle(item.status);
            return (
              <TouchableOpacity 
                style={styles.row} 
                onPress={() => toggleItemVisibility(item)} 
                disabled={isUpdatingItem}
                accessibilityRole="button"
                accessibilityLabel={`Toggle visibility for item ${item.title}`}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.title.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowSubtitle}>
                    {item.id} · {item.type} · {item.status}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.color }]}>{item.status}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {tab === "Claims" && (
        <FlatList
          data={filteredClaims}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item: claim }) => {
            const badge = badgeStyle(claim.status);
            return (
              <TouchableOpacity
                style={styles.row}
                onPress={() => router.push({ pathname: "/report/claim/review" as any, params: { claimId: claim.id } })}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{claim.id.replace(/[^0-9]/g, "").slice(-2)}</Text>
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>Claim {claim.id}</Text>
                  <Text style={styles.rowSubtitle}>
                    Item {claim.itemId} · {claim.status}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.color }]}>{claim.status}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <View style={styles.footerNotice}>
        <Text style={styles.footerNoticeTitle}>Destructive actions require Alert confirmation.</Text>
        <Text style={styles.footerNoticeSubtitle}>Changes remain in memory until the app restarts.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  headerRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  backArrow: { fontSize: 24, color: COLORS.text },
  header: { fontSize: 20, fontWeight: "700", color: COLORS.text },
  tabRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingVertical: 14 },
  tabButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  tabButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabButtonText: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  tabButtonTextActive: { color: "#FFFFFF" },
  searchWrap: { paddingHorizontal: 20, marginBottom: 12 },
  searchInput: {
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 12, fontWeight: "700", color: COLORS.primaryDark },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  rowSubtitle: { fontSize: 12, color: COLORS.subtext, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  footerNotice: { backgroundColor: COLORS.amberLight, marginHorizontal: 20, marginBottom: 20, borderRadius: 14, padding: 16 },
  footerNoticeTitle: { fontSize: 12, fontWeight: "700", color: "#92400E" },
  footerNoticeSubtitle: { fontSize: 12, color: "#92400E", marginTop: 4 },
  loadingState: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 24, gap: 8 },
  loadingText: { fontSize: 13, color: COLORS.subtext },
  errorState: { alignItems: "center", paddingVertical: 16, paddingHorizontal: 20 },
  errorText: { fontSize: 13, color: COLORS.red, textAlign: "center" },
  retryButton: { marginTop: 10, paddingHorizontal: 24, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.primary },
  retryText: { fontSize: 13, fontWeight: "600", color: COLORS.primary },
});
