// screens/AdminManagementScreen.tsx
// SRS 13.17 — Admin Management Screen (Strict PostgreSQL/Neon Database Integration)
import React, { useMemo, useState, useCallback } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { User, Item, Claim } from "@/types";
import { getAllUsers, updateUserStatus, deleteUser } from "@/services/users";
import { getAllItems, updateItem, deleteItem } from "@/services/items";
import { getAllClaims } from "@/services/claims";
import ConfirmModal from "@/components/confirmModal";
import { appAlert } from "@/utils/alert";

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
  const { currentUserId, currentUser, items, setItems, claims } = useApp();
  const adminId = currentUserId || currentUser?.id || "A001";

  const [tab, setTab] = useState<Tab>("Users");
  const [query, setQuery] = useState("");

  // ── Database State (Live PostgreSQL Data) ───────────────────────────
  const [backendUsers, setBackendUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const [backendItems, setBackendItems] = useState<Item[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [isUpdatingItem, setIsUpdatingItem] = useState(false);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  const [backendClaims, setBackendClaims] = useState<Claim[]>([]);
  const [isLoadingClaims, setIsLoadingClaims] = useState(false);
  const [claimsError, setClaimsError] = useState<string | null>(null);

  // ── In-App Confirmation Modal State (Universal Web/Native) ───────────
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    onConfirm: () => void;
  }>({
    visible: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // ── Database Fetching Callbacks ─────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    setUsersError(null);
    try {
      const data = await getAllUsers(adminId);
      setBackendUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setUsersError(err?.response?.data?.message ?? "Failed to load users from database.");
    } finally {
      setIsLoadingUsers(false);
    }
  }, [adminId]);

  const fetchItems = useCallback(async () => {
    setIsLoadingItems(true);
    setItemsError(null);
    try {
      const data = await getAllItems(adminId);
      setBackendItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setItemsError(err?.response?.data?.message ?? "Failed to load items from database.");
    } finally {
      setIsLoadingItems(false);
    }
  }, [adminId]);

  const fetchClaims = useCallback(async () => {
    setIsLoadingClaims(true);
    setClaimsError(null);
    try {
      const data = await getAllClaims(adminId);
      setBackendClaims(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setClaimsError(err?.response?.data?.message ?? "Failed to load claims from database.");
    } finally {
      setIsLoadingClaims(false);
    }
  }, [adminId]);

  // Refetch live database data on screen focus
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        setIsLoadingUsers(true);
        setIsLoadingItems(true);
        setIsLoadingClaims(true);
        setUsersError(null);
        setItemsError(null);
        setClaimsError(null);
        try {
          const [usersData, itemsData, claimsData] = await Promise.all([
            getAllUsers(adminId),
            getAllItems(adminId),
            getAllClaims(adminId),
          ]);
          console.log("ADMIN - usersData:", usersData);
          console.log("ADMIN - itemsData:", itemsData);
          if (!cancelled) {
            setBackendUsers(Array.isArray(usersData) ? usersData : []);
            setBackendItems(Array.isArray(itemsData) ? itemsData : []);
            setBackendClaims(Array.isArray(claimsData) ? claimsData : []);
          }
        } catch (err: any) {
          if (!cancelled) {
            setUsersError(err?.response?.data?.message ?? "Failed to load database data.");
            setItemsError(err?.response?.data?.message ?? "Failed to load database data.");
            setClaimsError(err?.response?.data?.message ?? "Failed to load database data.");
          }
        } finally {
          if (!cancelled) {
            setIsLoadingUsers(false);
            setIsLoadingItems(false);
            setIsLoadingClaims(false);
          }
        }
      }
      load();
      return () => { cancelled = true; };
    }, [adminId])
  );

  // ── Client Filter Computations (Live DB Records) ───────────────────
  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return backendUsers.filter(
      (u) =>
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.id && u.id.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
    );
  }, [backendUsers, query]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return backendItems.filter(
      (i) => !q || (i.title && i.title.toLowerCase().includes(q)) || (i.id && i.id.toLowerCase().includes(q))
    );
  }, [backendItems, query]);

  const filteredClaims = useMemo(() => {
    const q = query.trim().toLowerCase();
    return backendClaims.filter(
      (c) => !q || (c.id && c.id.toLowerCase().includes(q)) || (c.itemId && c.itemId.toLowerCase().includes(q))
    );
  }, [backendClaims, query]);

  function initials(name?: string) {
    if (!name) return "U";
    return name
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
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
      case "Pending Claim":
        return { bg: COLORS.amberLight, color: COLORS.amber };
      default:
        return { bg: COLORS.primaryLight, color: COLORS.primaryDark };
    }
  }

  // ── Database Mutation Handlers (Persist & Refresh via In-App Modal) ──
  function toggleUserStatus(user: User) {
    if (user.id === adminId) {
      appAlert("Not allowed", "You cannot suspend your own active session.");
      return;
    }
    if (isUpdatingUser || isDeletingUser) return;

    const nextStatus = user.status === "Active" ? "Suspended" : "Active";

    setConfirmModal({
      visible: true,
      title: nextStatus === "Suspended" ? "Suspend User?" : "Activate User?",
      message: `${user.name} will be marked as ${nextStatus} in the PostgreSQL database.`,
      confirmLabel: nextStatus === "Suspended" ? "Suspend" : "Activate",
      destructive: nextStatus === "Suspended",
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, visible: false }));
        setIsUpdatingUser(true);
        try {
          await updateUserStatus(adminId, user.id, nextStatus as "Active" | "Suspended");
          await fetchUsers();
          appAlert("Success", `${user.name} is now ${nextStatus}.`);
        } catch (err: any) {
          appAlert("Error", err?.response?.data?.message ?? "Failed to update user status.");
        } finally {
          setIsUpdatingUser(false);
        }
      },
    });
  }

  function handleDeleteUser(user: User) {
    if (user.id === adminId) {
      appAlert("Not allowed", "You cannot delete your own active session.");
      return;
    }
    if (user.role === "Admin") {
      appAlert("Not allowed", "You cannot delete an Administrator.");
      return;
    }
    if (isDeletingUser || isUpdatingUser) return;

    setConfirmModal({
      visible: true,
      title: "Delete Member?",
      message: `Are you sure you want to permanently delete "${user.name}" (${user.id})? All associated posts and claims will be removed from PostgreSQL.`,
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, visible: false }));
        setIsDeletingUser(true);
        try {
          await deleteUser(adminId, user.id);
          await fetchUsers();
          appAlert("Success", `User "${user.name}" was permanently deleted.`);
        } catch (err: any) {
          appAlert("Error", err?.response?.data?.message ?? "Failed to delete user.");
        } finally {
          setIsDeletingUser(false);
        }
      },
    });
  }

  function toggleItemVisibility(item: Item) {
    if (isUpdatingItem || isDeletingItem) return;

    const nextStatus = item.status === "Hidden" ? "Active" : "Hidden";

    setConfirmModal({
      visible: true,
      title: nextStatus === "Hidden" ? "Hide Report?" : "Restore Report?",
      message: `"${item.title}" will be marked as ${nextStatus} in the PostgreSQL database.`,
      confirmLabel: nextStatus === "Hidden" ? "Hide" : "Restore",
      destructive: nextStatus === "Hidden",
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, visible: false }));
        setIsUpdatingItem(true);
        try {
          await updateItem(item.id, { status: nextStatus }, adminId);
          await fetchItems();
          appAlert("Success", `Report "${item.title}" is now ${nextStatus}.`);
        } catch (err: any) {
          appAlert("Error", err?.response?.data?.message ?? "Failed to update item visibility.");
        } finally {
          setIsUpdatingItem(false);
        }
      },
    });
  }

  function handleDeleteItem(item: Item) {
    if (isDeletingItem || isUpdatingItem) return;

    setConfirmModal({
      visible: true,
      title: "Delete Report?",
      message: `Are you sure you want to permanently delete "${item.title}" (${item.id})? This will delete the report and its claims from PostgreSQL.`,
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, visible: false }));
        setIsDeletingItem(true);
        try {
          await deleteItem(item.id, adminId);
          await fetchItems();
          appAlert("Success", `Report "${item.title}" was permanently deleted.`);
        } catch (err: any) {
          appAlert("Error", err?.response?.data?.message ?? "Failed to delete report.");
        } finally {
          setIsDeletingItem(false);
        }
      },
    });
  }

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(admin)");
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
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
          placeholder={`Search ${tab.toLowerCase()} in database...`}
          placeholderTextColor={COLORS.subtext}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* ── Users Tab (Live PostgreSQL) ────────────────────────────────── */}
      {tab === "Users" && (
        <FlatList
          style={styles.list}
          data={filteredUsers}
          keyExtractor={(u, idx) => u.id || `u-${idx}`}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            isLoadingUsers ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading users from database...</Text>
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
          ListEmptyComponent={
            !isLoadingUsers && !usersError ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No users found in database.</Text>
              </View>
            ) : null
          }
          renderItem={({ item: user }) => {
            const userName = user.name || "Unknown User";
            const userRole = user.role || "User";
            const userStatus = user.status || "Active";
            const statusLabel = userRole === "Admin" ? "Admin" : userStatus;
            const badge = badgeStyle(statusLabel);
            return (
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(userName)}</Text>
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{userName}</Text>
                  <Text style={styles.rowSubtitle}>
                    {user.id} · {userRole} · {userStatus}
                  </Text>
                </View>
                <View style={styles.rowActions}>
                  <TouchableOpacity 
                    style={[styles.badge, { backgroundColor: badge.bg }]}
                    onPress={() => toggleUserStatus(user)} 
                    disabled={isUpdatingUser || isDeletingUser}
                    accessibilityRole="button"
                    accessibilityLabel={`Toggle status for ${userName}`}
                  >
                    <Text style={[styles.badgeText, { color: badge.color }]}>{statusLabel}</Text>
                  </TouchableOpacity>

                  {userRole !== "Admin" && (
                    <TouchableOpacity
                      style={styles.actionIconButton}
                      onPress={() => handleDeleteUser(user)}
                      disabled={isUpdatingUser || isDeletingUser}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete user ${userName}`}
                    >
                      <Ionicons name="trash-outline" size={16} color={COLORS.red} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* ── Items Tab (Live PostgreSQL) ────────────────────────────────── */}
      {tab === "Items" && (
        <View style={styles.list}>
          <View style={styles.subHeaderActionRow}>
            <Text style={styles.subHeaderCount}>{filteredItems.length} reports in PostgreSQL</Text>
            <TouchableOpacity
              style={styles.addItemHeaderButton}
              onPress={() => router.push({ pathname: "/report" as any, params: { from: "admin" } })}
              accessibilityRole="button"
              accessibilityLabel="Add new report"
            >
              <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" />
              <Text style={styles.addItemHeaderButtonText}>Report Item</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            style={styles.list}
            data={filteredItems}
            keyExtractor={(i, idx) => i.id || `i-${idx}`}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              isLoadingItems ? (
                <View style={styles.loadingState}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Loading items from database...</Text>
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
            ListEmptyComponent={
              !isLoadingItems && !itemsError ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No items found in database.</Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              const badge = badgeStyle(item.status);
              return (
                <View style={styles.row}>
                  <TouchableOpacity
                    style={styles.itemRowLeft}
                    onPress={() => router.push({ pathname: "/report/item/[id]" as any, params: { id: item.id, from: "admin" } })}
                    accessibilityRole="button"
                    accessibilityLabel={`View details for ${item.title}`}
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{(item.title || "IT").slice(0, 2).toUpperCase()}</Text>
                    </View>
                    <View style={styles.rowBody}>
                      <Text style={styles.rowTitle}>{item.title}</Text>
                      <Text style={styles.rowSubtitle}>
                        {item.id} · {item.type} · {item.status}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.rowActions}>
                    <TouchableOpacity
                      style={[styles.badge, { backgroundColor: badge.bg }]}
                      onPress={() => toggleItemVisibility(item)}
                      disabled={isUpdatingItem || isDeletingItem}
                      accessibilityRole="button"
                      accessibilityLabel={`Toggle visibility for ${item.title}`}
                    >
                      <Text style={[styles.badgeText, { color: badge.color }]}>{item.status}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionIconButton}
                      onPress={() => handleDeleteItem(item)}
                      disabled={isUpdatingItem || isDeletingItem}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete item ${item.title}`}
                    >
                      <Ionicons name="trash-outline" size={16} color={COLORS.red} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        </View>
      )}

      {/* ── Claims Tab (Live PostgreSQL) ───────────────────────────────── */}
      {tab === "Claims" && (
        <FlatList
          style={styles.list}
          data={filteredClaims}
          keyExtractor={(c, idx) => c.id || `c-${idx}`}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            isLoadingClaims ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading claims from database...</Text>
              </View>
            ) : claimsError ? (
              <View style={styles.errorState}>
                <Text style={styles.errorText}>{claimsError}</Text>
                <TouchableOpacity onPress={fetchClaims} style={styles.retryButton} accessibilityRole="button" accessibilityLabel="Retry loading claims">
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          ListEmptyComponent={
            !isLoadingClaims && !claimsError ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No claims found in database.</Text>
              </View>
            ) : null
          }
          renderItem={({ item: claim }) => {
            const badge = badgeStyle(claim.status);
            return (
              <TouchableOpacity
                style={styles.row}
                onPress={() =>
                  router.push({
                    pathname: "/report/claim/review" as any,
                    params: { claimId: claim.id, from: "admin" },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`Review claim ${claim.id}`}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{claim.id ? claim.id.replace(/[^0-9]/g, "").slice(-2) : "CL"}</Text>
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
        <Text style={styles.footerNoticeTitle}>Destructive actions require confirmation.</Text>
        <Text style={styles.footerNoticeSubtitle}>Changes are permanently saved to the PostgreSQL database.</Text>
      </View>

      {/* In-App Confirmation Modal */}
      <ConfirmModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        cancelLabel={confirmModal.cancelLabel}
        destructive={confirmModal.destructive}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  list: { flex: 1 },
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
  subHeaderActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  subHeaderCount: { fontSize: 12, color: COLORS.subtext, fontWeight: "600" },
  addItemHeaderButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  addItemHeaderButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
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
  itemRowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 12, fontWeight: "700", color: COLORS.primaryDark },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  rowSubtitle: { fontSize: 12, color: COLORS.subtext, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionIconButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: COLORS.redLight,
    alignItems: "center",
    justifyContent: "center",
  },
  footerNotice: { backgroundColor: COLORS.amberLight, marginHorizontal: 20, marginBottom: 20, borderRadius: 14, padding: 16 },
  footerNoticeTitle: { fontSize: 12, fontWeight: "700", color: "#92400E" },
  footerNoticeSubtitle: { fontSize: 12, color: "#92400E", marginTop: 4 },
  loadingState: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 24, gap: 8 },
  loadingText: { fontSize: 13, color: COLORS.subtext },
  errorState: { alignItems: "center", paddingVertical: 16, paddingHorizontal: 20 },
  errorText: { fontSize: 13, color: COLORS.red, textAlign: "center" },
  retryButton: { marginTop: 10, paddingHorizontal: 24, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.primary },
  retryText: { fontSize: 13, fontWeight: "600", color: COLORS.primary },
  emptyState: { alignItems: "center", paddingVertical: 32 },
  emptyText: { fontSize: 14, color: COLORS.subtext },
});
