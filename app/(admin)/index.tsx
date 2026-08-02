// screens/AdminDashboardScreen.tsx
// SRS 13.16 — Admin Dashboard Screen
// Adjust the AppContext import path below to match your project.
import React, { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useApp } from "../../context/AppContext";

const COLORS = {
  primary: "#2563EB",
  primaryDark: "#1E3A8A",
  primaryLight: "#DBEAFE",
  green: "#16A34A",
  greenLight: "#DCFCE7",
  amber: "#D97706",
  amberLight: "#FEF3C7",
  purple: "#7C3AED",
  purpleLight: "#EDE9FE",
  red: "#DC2626",
  text: "#0F172A",
  subtext: "#64748B",
  border: "#E2E8F0",
};

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { users, items, claims, notifications, currentUserId } = useApp();

  // SRS 13.16.6 — counts are calculated, not hard-coded, and derived from
  // local arrays (13.16.8 workflow step 2).
  const usersCount = users.length;

  const activeItemsCount = useMemo(
    () => items.filter((i) => i.status === "Active").length,
    [items]
  );

  const pendingClaims = useMemo(() => claims.filter((c) => c.status === "Pending"), [claims]);

  const solvedCount = useMemo(() => items.filter((i) => i.status === "Solved").length, [items]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.userId === currentUserId && !n.read).length,
    [notifications, currentUserId]
  );

  // SRS 13.16.8 workflow step 3 — build attention queue from pending claims
  const attentionClaims = pendingClaims.slice(0, 3).map((claim) => {
    const item = items.find((i) => i.id === claim.itemId);
    return { claim, item };
  });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Admin Dashboard</Text>
        <TouchableOpacity style={styles.bellWrap} onPress={() => router.push("../notifications")}>
          <Text style={styles.bellIcon}>⟳</Text>
          {unreadCount > 0 && <View style={styles.bellDot} />}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>System overview</Text>
      <View style={styles.metricsGrid}>
        <MetricCard label="Users" value={usersCount} bg={COLORS.primaryLight} color={COLORS.primaryDark} />
        <MetricCard label="Active items" value={activeItemsCount} bg={COLORS.greenLight} color={COLORS.green} />
        <MetricCard label="Pending claims" value={pendingClaims.length} bg={COLORS.amberLight} color={COLORS.amber} />
        <MetricCard label="Solved" value={solvedCount} bg={COLORS.purpleLight} color={COLORS.purple} />
      </View>

      <Text style={styles.sectionTitle}>Requires attention</Text>
      {attentionClaims.length === 0 ? (
        <Text style={styles.emptyText}>No pending claims right now.</Text>
      ) : (
        attentionClaims.map(({ claim, item }) => (
          // SRS 13.16.7 — Claim card -> Claim Review
          <TouchableOpacity
            key={claim.id}
            style={styles.attentionCard}
            onPress={() =>
              router.push({
                pathname: "/(admin)/claim-review" as any,
                params: { claimId: claim.id },
              })
            }
          >
            <View style={styles.attentionThumb}>
              <Text style={styles.attentionThumbText}>
                {claim.id.replace(/[^0-9]/g, "").slice(-3).padStart(3, "0")}
              </Text>
            </View>
            <View style={styles.attentionBody}>
              <Text style={styles.attentionTitle}>Claim {claim.id}</Text>
              <Text style={styles.attentionSubtitle}>
                {item ? item.title : "Item unavailable"} · {claim.status}
              </Text>
              <View style={styles.attentionBar} />
            </View>
            <Text style={styles.openLink}>Open</Text>
          </TouchableOpacity>
        ))
      )}

      <Text style={styles.sectionTitle}>Administration</Text>
      <TouchableOpacity style={styles.adminButton} onPress={() => router.push("/admin-management")}>
        <Text style={styles.adminButtonText}>Open Admin Management</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>Administrator role</Text>
    </ScrollView>
  );
}

function MetricCard({ label, value, bg, color }: { label: string; value: number; bg: string; color: string }) {
  return (
    <View style={[styles.metricCard, { backgroundColor: bg }]}>
      <Text style={[styles.metricLabel, { color }]}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { padding: 20, paddingBottom: 48 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  header: { fontSize: 22, fontWeight: "700", color: COLORS.text },
  bellWrap: { padding: 6 },
  bellIcon: { fontSize: 18, color: COLORS.text },
  bellDot: { position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.red },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginTop: 20, marginBottom: 12 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  metricCard: { width: "47%", borderRadius: 14, padding: 16, marginBottom: 12 },
  metricLabel: { fontSize: 12, fontWeight: "600" },
  metricValue: { fontSize: 26, fontWeight: "800", marginTop: 6 },
  emptyText: { fontSize: 13, color: COLORS.subtext },
  attentionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  attentionThumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  attentionThumbText: { fontSize: 11, fontWeight: "700", color: COLORS.primaryDark },
  attentionBody: { flex: 1 },
  attentionTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  attentionSubtitle: { fontSize: 12, color: COLORS.subtext, marginTop: 2, marginBottom: 6 },
  attentionBar: { height: 6, borderRadius: 3, width: "50%", backgroundColor: COLORS.amber },
  openLink: { fontSize: 13, fontWeight: "600", color: COLORS.primary },
  adminButton: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: "center" },
  adminButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  footerText: { textAlign: "center", color: COLORS.subtext, fontSize: 12, marginTop: 40 },
});
