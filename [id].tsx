import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppHeader from "@/components/app-header";
import EmptyState from "@/components/empty-state";
import PrimaryButton from "@/components/primary-button";
import StatusBadge from "@/components/status-badge";
import { COLORS, SPACING } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { findOrCreateConversation } from "@/services/conversations";
import {
  deleteItem,
  getItemDetails,
  ItemClaimSummary,
  ReporterSummary,
} from "@/services/items";
import { Category, Item } from "@/types";
import { getCategories } from "@/services/items";

export default function ItemDetailsScreen() {
  const { id } = useLocalSearchParams() as { id?: string };
  const { currentUser, currentUserId, setItems } = useApp();
  const [item, setItem] = useState<Item | null>(null);
  const [reporter, setReporter] = useState<ReporterSummary | null>(null);
  const [currentUserClaim, setCurrentUserClaim] = useState<ItemClaimSummary | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isContacting, setIsContacting] = useState(false);

  const loadDetails = useCallback(async () => {
    if (!id) {
      setError("The item identifier is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [details, categories] = await Promise.all([
        getItemDetails(id, currentUserId),
        getCategories(false),
      ]);

      setItem(details.item);
      setReporter(details.reporter);
      setCurrentUserClaim(details.currentUserClaim);
      setCategory(
        categories.find((candidate) => candidate.id === details.item.categoryId) || null
      );
      setItems((prev) => {
        const exists = prev.some((candidate) => candidate.id === details.item.id);
        return exists
          ? prev.map((candidate) =>
              candidate.id === details.item.id ? details.item : candidate
            )
          : [details.item, ...prev];
      });
    } catch (err: any) {
      const status = err.response?.status;
      setError(
        status === 404
          ? "The requested item could not be found or is no longer publicly available."
          : err.response?.data?.message ||
              "Could not load item details. Please check your connection and try again."
      );
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, id, setItems]);

  useFocusEffect(
    useCallback(() => {
      loadDetails();
    }, [loadDetails])
  );

  const isReporter = item?.reporterId === currentUserId;
  const isReporterOrAdmin = isReporter || currentUser?.role === "Admin";

  const handleContactReporter = async () => {
    if (!item || !reporter || !currentUserId || isContacting) {
      return;
    }

    setIsContacting(true);

    try {
      const result = await findOrCreateConversation({
        itemId: item.id,
        participantOneId: currentUserId,
        participantTwoId: reporter.id,
      });

      router.push({
        pathname: "/Inbox/[conversationId]",
        params: {
          conversationId: result.conversation.id,
          itemId: item.id,
        },
      } as any);
    } catch (err: any) {
      Alert.alert(
        "Could not open chat",
        err.response?.data?.message ||
          "The conversation could not be created. Please try again."
      );
    } finally {
      setIsContacting(false);
    }
  };

  const handleClaimItem = () => {
    if (!item) return;
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

  const handleDeleteReport = () => {
    if (!item || isDeleting) return;

    Alert.alert(
      "Delete Report?",
      `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (isDeleting) return;
            setIsDeleting(true);

            try {
              await deleteItem(item.id, currentUserId);
              setItems((prev) => prev.filter((candidate) => candidate.id !== item.id));
              Alert.alert("Deleted", "Your report has been deleted successfully.", [
                {
                  text: "OK",
                  onPress: () => {
                    if (router.canGoBack()) {
                      router.back();
                    } else {
                      router.push("/feed" as any);
                    }
                  },
                },
              ]);
            } catch (err: any) {
              Alert.alert(
                "Deletion Failed",
                err.response?.data?.message ||
                  "Failed to delete the item report. Please try again."
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <AppHeader showBack title="Item Details" />
        <View style={styles.centerState}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.stateText}>Loading item details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.screen}>
        <AppHeader showBack title="Item Details" />
        <View style={styles.centerState}>
          <EmptyState
            icon="alert-circle-outline"
            message={error || "The requested item could not be found."}
            title="Item Not Found"
          />
          {id ? (
            <View style={styles.retryButton}>
              <PrimaryButton label="Try Again" onPress={loadDetails} />
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  const hasRemoteImage =
    Boolean(item.image) &&
    item.image !== "placeholder.png" &&
    (/^https?:\/\//i.test(item.image) || item.image.startsWith("data:image/"));

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader showBack subtitle={`Item Ref: ${item.id}`} title="Item Details" />

      <ScrollView contentContainerStyle={styles.content}>
        {hasRemoteImage ? (
          <Image
            accessibilityLabel={`Photo of ${item.title}`}
            resizeMode="cover"
            source={{ uri: item.image }}
            style={styles.itemImage}
          />
        ) : null}

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
              <Text style={styles.reporterName}>
                {reporter?.name || "Community Member"}
              </Text>
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
                Your claim is stored in the database and can be reviewed here.
              </Text>
              <PrimaryButton label="View Claim Details" onPress={handleViewClaimStatus} />
            </View>
          ) : isReporterOrAdmin ? (
            <View style={styles.actionStack}>
              <View style={styles.reporterNotice}>
                <Ionicons
                  color={COLORS.primary}
                  name="information-circle-outline"
                  size={20}
                />
                <Text style={styles.reporterNoticeText}>
                  {isReporter
                    ? "You are the reporter of this item."
                    : "Admin Access: You are authorized to manage this report."}
                </Text>
              </View>
              <PrimaryButton
                disabled={isDeleting}
                label="Edit Report"
                onPress={() => {
                  router.push({
                    pathname: "/report",
                    params: { editId: item.id },
                  } as any);
                }}
              />
              <TouchableOpacity
                accessibilityLabel="Delete report"
                accessibilityRole="button"
                disabled={isDeleting}
                onPress={handleDeleteReport}
                style={[styles.deleteButton, isDeleting && styles.disabledButton]}
              >
                {isDeleting ? (
                  <ActivityIndicator color={COLORS.danger} size="small" />
                ) : (
                  <>
                    <Ionicons color={COLORS.danger} name="trash-outline" size={18} />
                    <Text style={styles.deleteButtonText}>Delete Report</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {item.status === "Active" ? (
                <PrimaryButton label="Submit Ownership Claim" onPress={handleClaimItem} />
              ) : null}
              {reporter ? (
                <View style={styles.buttonSpacing}>
                  <PrimaryButton
                    disabled={isContacting}
                    label={isContacting ? "Opening Chat..." : "Contact Reporter"}
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
  centerState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: SPACING.lg,
  },
  stateText: { color: COLORS.textMuted, fontSize: 14, marginTop: SPACING.md },
  retryButton: { marginTop: SPACING.md, width: "100%" },
  itemImage: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    height: 220,
    marginBottom: SPACING.md,
    width: "100%",
  },
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
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
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
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: SPACING.md,
  },
  infoRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  infoText: { color: COLORS.textMuted, fontSize: 14 },
  descriptionLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
    marginTop: SPACING.md,
  },
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
  actionStack: { gap: SPACING.md },
  buttonSpacing: { marginTop: SPACING.md },
  claimStatusBox: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.primary,
    borderRadius: 14,
    borderWidth: 1,
    padding: SPACING.md,
  },
  claimStatusTitle: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 2,
  },
  claimStatusSub: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: SPACING.md,
  },
  reporterNotice: {
    alignItems: "center",
    backgroundColor: COLORS.primaryLight + "44",
    borderRadius: 12,
    flexDirection: "row",
    gap: SPACING.xs,
    padding: SPACING.md,
  },
  reporterNoticeText: { color: COLORS.primary, flex: 1, fontSize: 14, fontWeight: "600" },
  deleteButton: {
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: SPACING.xs,
    justifyContent: "center",
    paddingVertical: SPACING.md,
  },
  deleteButtonText: { color: COLORS.danger, fontSize: 15, fontWeight: "700" },
  disabledButton: { opacity: 0.6 },
});
