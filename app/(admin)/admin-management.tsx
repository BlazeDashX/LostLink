// screens/AdminManagementScreen.tsx
// SRS 13.17 — Admin Management Screen
// Adjust the AppContext import path below to match your project.
import React, { useMemo, useState } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useApp } from "@/context/AppContext";
import { User, Item } from "@/types";

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
  const { currentUserId, users, setUsers, items, setItems, claims } = useApp();

  const [tab, setTab] = useState<Tab>("Users");
  const [query, setQuery] = useState("");

  // SRS 13.17.6 — search/filter local records (case-insensitive)
  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => !q || u.name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q));
  }, [users, query]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => !q || i.title.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
  }, [items, query]);

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

  // SRS 13.17.10 — current admin cannot suspend own active session.
  // SRS 13.17.4 — every destructive change requires confirmation (Alert).
  function toggleUserStatus(user: User) {
    if (user.id === currentUserId) {
      Alert.alert("Not allowed", "You cannot suspend your own active session.");
      return;
    }

    const nextStatus = user.status === "Active" ? "Suspended" : "Active";

    Alert.alert(
      nextStatus === "Suspended" ? "Suspend user?" : "Activate user?",
      `${user.name} will be marked ${nextStatus}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: nextStatus === "Suspended" ? "destructive" : "default",
          onPress: () => {
            // SRS 9.3 — immutable update
            setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)));
          },
        },
      ]
    );
  }

  // SRS 13.17.10 — hidden items disappear from public discovery lists
  function toggleItemVisibility(item: Item) {
    const nextStatus = item.status === "Hidden" ? "Active" : "Hidden";

    Alert.alert(
      nextStatus === "Hidden" ? "Hide report?" : "Restore report?",
      `${item.title} will be marked ${nextStatus}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: nextStatus === "Hidden" ? "destructive" : "default",
          onPress: () => {
            setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: nextStatus } : i)));
          },
        },
      ]
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>{"‹"}</Text>
        </TouchableOpacity>
        <Text style={styles.header}>Admin Management</Text>
      </View>

      <View style={styles.tabRow}>
        {(["Users", "Items", "Claims"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabButton, tab === t && styles.tabButtonActive]}
            onPress={() => setTab(t)}
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
          renderItem={({ item: user }) => {
            const statusLabel = user.role === "Admin" ? "Admin" : user.status;
            const badge = badgeStyle(statusLabel);
            return (
              // SRS 13.17.9 — Suspend/activate action on row tap
              <TouchableOpacity style={styles.row} onPress={() => toggleUserStatus(user)}>
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
          renderItem={({ item }) => {
            const badge = badgeStyle(item.status);
            return (
              // SRS 13.17.9 — Hide/restore action on row tap
              <TouchableOpacity style={styles.row} onPress={() => toggleItemVisibility(item)}>
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
              // SRS 13.17.7 — row -> related claim review
              <TouchableOpacity
                style={styles.row}
                onPress={() => router.push({ pathname: "/(admin)/claim-review" as any, params: { claimId: claim.id } })}
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

      {/* SRS mockup footer notice */}
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
});
