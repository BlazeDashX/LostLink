// screens/AdminDashboardScreen.tsx
// SRS 13.16 — Admin Dashboard Screen
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { useApp } from "../../context/AppContext";
import { getAdminStats, AdminStats } from "../../services/admin";

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
  redLight: "#FEE2E2",
  text: "#0F172A",
  subtext: "#64748B",
  border: "#E2E8F0",
};

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { currentUserId, currentUser, logout } = useApp();
  const adminId = currentUserId || currentUser?.id || "A001";

  // ── Live PostgreSQL Dashboard Metrics ─────────────────────────────────────
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminStats(adminId);
      setStats(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Failed to load dashboard metrics from database. Tap Retry."
      );
    } finally {
      setIsLoading(false);
    }
  }, [adminId]);

  // Re-fetch live database metrics every time the screen is focused
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function fetchOnFocus() {
        setIsLoading(true);
        setError(null);
        try {
          const data = await getAdminStats(adminId);
          if (!cancelled) setStats(data);
        } catch (err: any) {
          if (!cancelled) {
            setError(
              err?.response?.data?.message ?? "Failed to load dashboard metrics from database. Tap Retry."
            );
          }
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      }
      fetchOnFocus();
      return () => { cancelled = true; };
    }, [adminId])
  );

  // ── Render helpers ────────────────────────────────────────────────────────

  function renderMetrics() {
    if (isLoading) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading metrics...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorState}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchStats} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!stats) return null;

    return (
      <View style={styles.metricsGrid}>
        <MetricCard
          label="Users"
          value={stats.users.total}
          bg={COLORS.primaryLight}
          color={COLORS.primaryDark}
        />
        <MetricCard
          label="Active items"
          value={stats.items.active}
          bg={COLORS.greenLight}
          color={COLORS.green}
        />
        <MetricCard
          label="Pending claims"
          value={stats.claims.pending}
          bg={COLORS.amberLight}
          color={COLORS.amber}
        />
        <MetricCard
          label="Solved"
          value={stats.items.solved}
          bg={COLORS.purpleLight}
          color={COLORS.purple}
        />
      </View>
    );
  }

  function renderStatsBreakdown() {
    if (!stats || isLoading || error) return null;

    return (
      <View style={styles.breakdownRow}>
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Total items</Text>
          <Text style={styles.breakdownValue}>{stats.items.total}</Text>
        </View>
        <View style={styles.breakdownDivider} />
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Total claims</Text>
          <Text style={styles.breakdownValue}>{stats.claims.total}</Text>
        </View>
        <View style={styles.breakdownDivider} />
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Suspended users</Text>
          <Text style={[styles.breakdownValue, { color: COLORS.red }]}>
            {stats.users.suspended}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Admin Dashboard</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={async () => {
              await logout();
              router.replace("/(auth)/login");
            }}
            accessibilityRole="button"
            accessibilityLabel="Logout from admin"
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SRS 13.16.6 — System overview metrics from backend */}
      <Text style={styles.sectionTitle}>System overview</Text>
      {renderMetrics()}
      {renderStatsBreakdown()}

      {/* Requires attention — pending claims from backend stats */}
      <Text style={styles.sectionTitle}>Requires attention</Text>
      {isLoading ? (
        <Text style={styles.emptyText}>Loading...</Text>
      ) : error ? (
        <Text style={styles.emptyText}>Metrics unavailable.</Text>
      ) : stats && stats.claims.pending === 0 ? (
        <Text style={styles.emptyText}>No pending claims right now.</Text>
      ) : stats ? (
        <View style={styles.attentionCard}>
          <View style={styles.attentionThumb}>
            <Text style={styles.attentionThumbText}>!</Text>
          </View>
          <View style={styles.attentionBody}>
            <Text style={styles.attentionTitle}>
              {stats.claims.pending} pending claim{stats.claims.pending !== 1 ? "s" : ""}
            </Text>
            <Text style={styles.attentionSubtitle}>
              Review in Admin Management → Claims
            </Text>
            <View style={styles.attentionBar} />
          </View>
          <TouchableOpacity onPress={() => router.push("/admin-management" as any)}>
            <Text style={styles.openLink}>Open</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Administration</Text>
      <TouchableOpacity
        style={styles.adminButton}
        onPress={() => router.push("/admin-management" as any)}
      >
        <Text style={styles.adminButtonText}>Open Admin Management</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>Administrator role · {currentUser?.name ?? ""}</Text>
    </ScrollView>
  );
}

function MetricCard({
  label,
  value,
  bg,
  color,
}: {
  label: string;
  value: number;
  bg: string;
  color: string;
}) {
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
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoutButton: {
    backgroundColor: COLORS.redLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: COLORS.red,
    fontSize: 12,
    fontWeight: "700",
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginTop: 20, marginBottom: 12 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  metricCard: { width: "47%", borderRadius: 14, padding: 16, marginBottom: 12 },
  metricLabel: { fontSize: 12, fontWeight: "600" },
  metricValue: { fontSize: 26, fontWeight: "800", marginTop: 6 },
  loadingState: { flexDirection: "row", alignItems: "center", paddingVertical: 24, gap: 10 },
  loadingText: { fontSize: 13, color: COLORS.subtext },
  errorState: { alignItems: "center", paddingVertical: 16 },
  errorText: { fontSize: 13, color: COLORS.red, textAlign: "center" },
  retryButton: { marginTop: 10, paddingHorizontal: 24, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.primary },
  retryText: { fontSize: 13, fontWeight: "600", color: COLORS.primary },
  breakdownRow: { flexDirection: "row", backgroundColor: "#F8FAFC", borderRadius: 14, padding: 14, marginBottom: 4, justifyContent: "space-around" },
  breakdownItem: { alignItems: "center", flex: 1 },
  breakdownLabel: { fontSize: 11, color: COLORS.subtext, fontWeight: "600" },
  breakdownValue: { fontSize: 18, fontWeight: "800", color: COLORS.text, marginTop: 4 },
  breakdownDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 4 },
  emptyText: { fontSize: 13, color: COLORS.subtext },
  attentionCard: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 12, marginBottom: 12, gap: 12 },
  attentionThumb: { width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.amberLight, alignItems: "center", justifyContent: "center" },
  attentionThumbText: { fontSize: 16, fontWeight: "700", color: COLORS.amber },
  attentionBody: { flex: 1 },
  attentionTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  attentionSubtitle: { fontSize: 12, color: COLORS.subtext, marginTop: 2, marginBottom: 6 },
  attentionBar: { height: 6, borderRadius: 3, width: "50%", backgroundColor: COLORS.amber },
  openLink: { fontSize: 13, fontWeight: "600", color: COLORS.primary },
  adminButton: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: "center" },
  adminButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  footerText: { textAlign: "center", color: COLORS.subtext, fontSize: 12, marginTop: 40 },
});
