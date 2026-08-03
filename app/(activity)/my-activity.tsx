// screens/MyActivityScreen.tsx
// SRS 13.15 — My Activity Screen
// Adjust the AppContext import path below to match your project.
import React, { useMemo, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useApp } from "@/context/AppContext";
import { Item, Claim } from "@/types";

const COLORS = {
  primary: "#2563EB",
  primaryDark: "#1E3A8A",
  primaryLight: "#DBEAFE",
  border: "#E2E8F0",
  text: "#0F172A",
  subtext: "#64748B",
  green: "#16A34A",
  amber: "#D97706",
  red: "#DC2626",
};

type Tab = "Reports" | "Claims" | "Solved";

// SRS 17.1 — StatusBadge centralizes color mapping so the same state looks
// identical across screens. Re-implemented locally here as a helper.
function statusColor(status: string) {
  switch (status) {
    case "Active":
      return COLORS.primary;
    case "Pending":
    case "Pending Claim":
    case "Reserved":
    case "Delivered":
      return COLORS.amber;
    case "Solved":
    case "Received":
    case "Approved":
    case "Completed":
      return COLORS.green;
    case "Rejected":
    case "Hidden":
      return COLORS.red;
    default:
      return COLORS.subtext;
  }
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function MyActivityScreen() {
  const router = useRouter();
  const { currentUserId, items, claims } = useApp();
  const [tab, setTab] = useState<Tab>("Reports");

  // SRS 13.15.7 workflow step 1 — filter items by reporterId
  const myReports = useMemo(
    () => items.filter((i) => i.reporterId === currentUserId),
    [items, currentUserId]
  );

  // SRS 13.15.7 workflow step 2 — filter claims by claimantId
  const myClaims = useMemo(
    () => claims.filter((c) => c.claimantId === currentUserId),
    [claims, currentUserId]
  );

  // SRS 13.15.7 workflow step 3 — derive solved recoveries (as reporter or
  // as a claimant whose claim reached Completed and the item is Solved)
  const solvedRecoveries = useMemo(() => {
    const solvedReports = myReports.filter((i) => i.status === "Solved");
    const completedClaimItemIds = myClaims
      .filter((c) => c.status === "Completed")
      .map((c) => c.itemId);
    const solvedFromClaims = items.filter(
      (i) => completedClaimItemIds.includes(i.id) && i.status === "Solved"
    );
    const combined = [...solvedReports, ...solvedFromClaims];
    return combined.filter((item, idx) => combined.findIndex((x) => x.id === item.id) === idx);
  }, [myReports, myClaims, items]);

  function renderItemRow(item: Item) {
    // SRS 13.15.6 — edit action disabled after reservation/delivery
    const editable = item.status === "Active";
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.card}
        onPress={() => router.push({ pathname: "../item-details", params: { itemId: item.id } })}
      >
        <View style={styles.cardThumb}>
          <Text style={styles.cardThumbText}>{item.title.slice(0, 3).toUpperCase()}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSubtitle}>
            {item.type} · {item.status} · {formatShortDate(item.reportDate)}
          </Text>
          <View style={[styles.progressBar, { backgroundColor: statusColor(item.status) }]} />
        </View>
        <TouchableOpacity
          onPress={() =>
            editable
              ? router.push({ pathname: "../report-item", params: { itemId: item.id, mode: "edit" } })
              : router.push({ pathname: "../item-details", params: { itemId: item.id } })
          }
        >
          <Text style={styles.cardAction}>{editable ? "Edit" : "View"}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  function renderClaimRow(claim: Claim) {
    const item = items.find((i) => i.id === claim.itemId);
    if (!item) return null;
    return (
      <TouchableOpacity
        key={claim.id}
        style={styles.card}
        onPress={() => router.push({ pathname: "../claim-review", params: { claimId: claim.id } })}
      >
        <View style={styles.cardThumb}>
          <Text style={styles.cardThumbText}>{item.title.slice(0, 3).toUpperCase()}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSubtitle}>Claim · {claim.status}</Text>
          <View style={[styles.progressBar, { backgroundColor: statusColor(claim.status) }]} />
        </View>
        <Text style={styles.cardAction}>View</Text>
      </TouchableOpacity>
    );
  }

  const data = tab === "Reports" ? myReports : tab === "Claims" ? myClaims : solvedRecoveries;

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>{"‹"}</Text>
        </TouchableOpacity>
        <Text style={styles.header}>My Activity</Text>
      </View>

      <View style={styles.tabRow}>
        {(["Reports", "Claims", "Solved"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabButton, tab === t && styles.tabButtonActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabButtonText, tab === t && styles.tabButtonTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SRS uses FlatList with keyExtractor + renderItem + ListEmptyComponent */}
      <FlatList
        data={data as (Item | Claim)[]}
        keyExtractor={(entry) => entry.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item: entry }) =>
          tab === "Claims" ? renderClaimRow(entry as Claim) : renderItemRow(entry as Item)
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptySubtitle}>
              {tab === "Reports"
                ? "Reports you publish will appear here."
                : tab === "Claims"
                ? "Claims you submit will appear here."
                : "Solved recoveries will appear here."}
            </Text>
          </View>
        }
      />

      <View style={styles.summaryBar}>
        <Text style={styles.summaryLabel}>Activity summary</Text>
        <Text style={styles.summaryText}>
          {myReports.length} reports · {myClaims.length} claims · {solvedRecoveries.length} solved
          recover{solvedRecoveries.length === 1 ? "y" : "ies"}
        </Text>
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
  listContent: { paddingHorizontal: 20, paddingBottom: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  cardThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cardThumbText: { fontSize: 12, fontWeight: "700", color: COLORS.primaryDark },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  cardSubtitle: { fontSize: 12, color: COLORS.subtext, marginTop: 2, marginBottom: 6 },
  progressBar: { height: 6, borderRadius: 3, width: "60%" },
  cardAction: { fontSize: 13, fontWeight: "600", color: COLORS.primary },
  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyTitle: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  emptySubtitle: { fontSize: 13, color: COLORS.subtext, marginTop: 4, textAlign: "center", paddingHorizontal: 32 },
  summaryBar: {
    backgroundColor: COLORS.primaryLight,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 14,
    padding: 16,
  },
  summaryLabel: { fontSize: 12, fontWeight: "700", color: COLORS.primaryDark },
  summaryText: { fontSize: 13, color: COLORS.text, marginTop: 4 },
});
