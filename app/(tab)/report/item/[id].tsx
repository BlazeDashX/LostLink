import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import AppHeader from "@/components/app-header";
import EmptyState from "@/components/empty-state";
import PrimaryButton from "@/components/primary-button";
import StatusBadge from "@/components/status-badge";
import categoriesData from "@/data/categories.json";
import { COLORS, SPACING } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { Message } from "@/types";

type CategoryItem = {
  id: string;
  name: string;
  active: boolean;
};

export default function ItemDetailsScreen() {
  const { id } = useLocalSearchParams() as { id: string };
  const { claims, currentUserId, items, messages, setMessages, users } = useApp();

  const item = items.find((candidate) => candidate.id === id);
  const reporter = users.find((user) => user.id === item?.reporterId);
  const category = (categoriesData as CategoryItem[]).find(
    (c) => c.id === item?.categoryId
  );

  const isReporter = item?.reporterId === currentUserId;
  const currentUserClaim = useMemo(() => {
    if (!item) return undefined;
    return claims.find(
      (claim) => claim.itemId === item.id && claim.claimantId === currentUserId
    );
  }, [claims, currentUserId, item]);

  if (!id || !item) {
    return (
      <SafeAreaView style={styles.screen}>
        <AppHeader showBack title="Item Details" />
        <EmptyState
          icon="alert-circle-outline"
          message="The requested item could not be found or has been removed."
          title="Item Not Found"
        />
      </SafeAreaView>
    );
  }

  const handleContactReporter = () => {
    if (!reporter) return;

    const existingMessage = messages.find(
      (m) =>
        m.itemId === item.id &&
        ((m.senderId === currentUserId && m.receiverId === reporter.id) ||
          (m.senderId === reporter.id && m.receiverId === currentUserId))
    );

    let conversationId = existingMessage?.conversationId;

    if (!conversationId) {
      conversationId = `CV${Date.now()}`;
      const initialMessage: Message = {
        id: `M${Date.now()}`,
        conversationId,
        itemId: item.id,
        senderId: currentUserId,
        receiverId: reporter.id,
        text: `Hi ${reporter.name}, I am inquiring about your reported item "${item.title}".`,
        sentAt: new Date().toISOString(),
        read: false,
      };
      setMessages((prev) => [...prev, initialMessage]);
    }

    router.push({
      pathname: "/Inbox/[conversationId]",
      params: { conversationId, itemId: item.id },
    } as any);
  };

  const handleClaimItem = () => {
    router.push({
      pathname: "/report/claim",
      params: { itemId: item.id },
    } as any);
  };

  const handleViewClaimStatus = () => {
    if (!currentUserClaim) return;
    router.push({
      pathname: "/report/claim/review",
      params: { claimId: currentUserClaim.id },
    } as any);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader showBack subtitle={`Item Ref: ${item.id}`} title="Item Details" />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mainCard}>
          <View style={styles.headerRow}>
            <View style={styles.iconContainer}>
              <Ionicons color={COLORS.primary} name="cube-outline" size={36} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.typeBadge}>{item.type.toUpperCase()} ITEM</Text>
              <Text style={styles.title}>{item.title}</Text>
              <View style={styles.badgeRow}>
                <StatusBadge status={item.status} />
                {category ? (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{category.name}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Overview & Location</Text>
          
          <View style={styles.infoRow}>
            <Ionicons color={COLORS.textMuted} name="location-outline" size={18} />
            <Text style={styles.infoText}>{item.location}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons color={COLORS.textMuted} name="calendar-outline" size={18} />
            <Text style={styles.infoText}>Reported on {item.reportDate}</Text>
          </View>

          <Text style={styles.descriptionLabel}>Description</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Reporter Details</Text>
          <View style={styles.reporterRow}>
            <View style={styles.avatarCircle}>
              <Ionicons color={COLORS.primary} name="person-outline" size={20} />
            </View>
            <View style={styles.reporterMeta}>
              <Text style={styles.reporterName}>{reporter?.name || "Community Member"}</Text>
              <Text style={styles.reporterRole}>
                {reporter?.role ? `Role: ${reporter.role}` : "Verified Reporter"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          {currentUserClaim ? (
            <View style={styles.claimStatusBox}>
              <Text style={styles.claimStatusTitle}>
                Your Claim Status: {currentUserClaim.status}
              </Text>
              <Text style={styles.claimStatusSub}>
                You submitted private evidence for this item.
              </Text>
              <PrimaryButton
                label="View Claim Details"
                onPress={handleViewClaimStatus}
              />
            </View>
          ) : isReporter ? (
            <View style={styles.reporterNotice}>
              <Ionicons color={COLORS.primary} name="information-circle-outline" size={20} />
              <Text style={styles.reporterNoticeText}>
                You are the reporter of this item.
              </Text>
            </View>
          ) : (
            <>
              {item.status === "Active" ? (
                <PrimaryButton
                  label="Submit Ownership Claim"
                  onPress={handleClaimItem}
                />
              ) : null}
              {reporter ? (
                <View style={styles.buttonSpacing}>
                  <PrimaryButton
                    label="Contact Reporter"
                    onPress={handleContactReporter}
                    outlined
                  />
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.background, flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 40 },
  mainCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
  },
  headerRow: { flexDirection: "row", gap: SPACING.md },
  iconContainer: {
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  headerInfo: { flex: 1 },
  typeBadge: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  title: { color: COLORS.text, fontSize: 18, fontWeight: "800", marginTop: 2 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs, marginTop: SPACING.xs },
  categoryBadge: {
    backgroundColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryText: { color: COLORS.textMuted, fontSize: 11, fontWeight: "600" },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
  },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: "800", marginBottom: SPACING.md },
  infoRow: { alignItems: "center", flexDirection: "row", gap: SPACING.xs, marginBottom: SPACING.xs },
  infoText: { color: COLORS.textMuted, fontSize: 14 },
  descriptionLabel: { color: COLORS.text, fontSize: 14, fontWeight: "700", marginBottom: 4, marginTop: SPACING.md },
  description: { color: COLORS.textMuted, fontSize: 14, lineHeight: 20 },
  reporterRow: { alignItems: "center", flexDirection: "row", gap: SPACING.md },
  avatarCircle: {
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  reporterMeta: { flex: 1 },
  reporterName: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  reporterRole: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  actionsContainer: { marginTop: SPACING.sm },
  buttonSpacing: { marginTop: SPACING.md },
  claimStatusBox: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.primary,
    borderRadius: 14,
    borderWidth: 1,
    padding: SPACING.md,
  },
  claimStatusTitle: { color: COLORS.primary, fontSize: 15, fontWeight: "800", marginBottom: 2 },
  claimStatusSub: { color: COLORS.textMuted, fontSize: 13, marginBottom: SPACING.md },
  reporterNotice: {
    alignItems: "center",
    backgroundColor: COLORS.primaryLight + "44",
    borderRadius: 12,
    flexDirection: "row",
    gap: SPACING.xs,
    padding: SPACING.md,
  },
  reporterNoticeText: { color: COLORS.primary, fontSize: 14, fontWeight: "600" },
});
