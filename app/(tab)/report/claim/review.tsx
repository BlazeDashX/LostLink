import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AnswerCard from "@/components/answer-card";
import AppHeader from "@/components/app-header";
import ClaimantCard from "@/components/claimant-card";
import EmptyState from "@/components/empty-state";
import ItemSummaryCard from "@/components/item-summary-card";
import PrimaryButton from "@/components/primary-button";
import StatusBadge from "@/components/status-badge";
import { COLORS, SPACING } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { getClaimById, updateClaimDecision } from "@/services/claims";
import { findOrCreateConversation } from "@/services/conversations";
import { getItemById } from "@/services/items";
import { Claim, Item, SafeUser } from "@/types";

type ClaimReviewParams = {
  claimId?: string;
  from?: string;
};

export default function ClaimReviewScreen() {
  const { claimId, from } = useLocalSearchParams() as ClaimReviewParams;
  const {
    claims,
    currentUserId,
    currentUser: contextUser,
    items,
    users,
    setClaims,
    setItems,
  } = useApp();

  const [claim, setClaim] = useState<Claim | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [claimant, setClaimant] = useState<SafeUser | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  const currentUser = contextUser || users.find((user) => user.id === currentUserId);

  const handleBack = () => {
    if (from === "admin" || currentUser?.role === "Admin") {
      router.replace("/(admin)/admin-management" as any);
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tab)/feed" as any);
    }
  };

  const fetchClaimData = useCallback(
    async (isRefresh = false) => {
      if (!claimId) {
        setIsLoading(false);
        setError("A valid claim ID is required.");
        return;
      }

      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        // 1. Fetch claim from database via service
        let fetchedClaim: Claim | null = null;
        try {
          fetchedClaim = await getClaimById(claimId, currentUserId);
        } catch (apiErr: any) {
          // Fallback to memory context if API fails
          const cached = claims.find((c) => c.id === claimId);
          if (cached) {
            fetchedClaim = cached;
          } else {
            throw apiErr;
          }
        }

        if (!fetchedClaim) {
          setError("The requested claim could not be found.");
          return;
        }

        setClaim(fetchedClaim);

        // 2. Resolve Item details
        let resolvedItem = items.find((i) => i.id === fetchedClaim?.itemId);
        if (!resolvedItem && fetchedClaim?.itemId) {
          try {
            resolvedItem = await getItemById(fetchedClaim.itemId);
          } catch {
            // Keep resolvedItem undefined if fetch fails
          }
        }
        setItem(resolvedItem || null);

        // 3. Resolve Claimant details
        const resolvedClaimant = users.find(
          (u) => u.id === fetchedClaim?.claimantId
        );
        if (resolvedClaimant) {
          setClaimant(resolvedClaimant);
        } else if (fetchedClaim) {
          // Basic fallback user for display
          setClaimant({
            id: fetchedClaim.claimantId,
            name: "Claimant",
            email: "N/A",
            phone: "N/A",
            role: "User",
            status: "Active",
            avatar: "",
          });
        }
      } catch (err: any) {
        console.error("Error fetching claim details:", err);
        setError(
          err.response?.data?.message ||
            "Unable to load claim details. Please check your connection."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [claimId, claims, currentUserId, items, users]
  );

  useEffect(() => {
    fetchClaimData(false);
  }, [fetchClaimData]);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <AppHeader onPressBack={handleBack} showBack title="Claim Review" />
        <View style={styles.centerContainer}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Loading claim details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state with Retry
  if (error || !claimId || !claim) {
    return (
      <SafeAreaView style={styles.screen}>
        <AppHeader onPressBack={handleBack} showBack title="Claim Review" />
        <View style={styles.centerContainer}>
          <EmptyState
            icon="alert-circle-outline"
            message={error || "The claim could not be resolved."}
            title="Claim Unavailable"
          />
          <TouchableOpacity
            accessibilityLabel="Retry loading claim"
            accessibilityRole="button"
            onPress={() => fetchClaimData(false)}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Robust ownership and permission checks
  const effectiveReporterId =
    item?.reporterId || (claim as any)?.reporterId;
  const isReporter =
    !!currentUserId &&
    !!effectiveReporterId &&
    currentUserId === effectiveReporterId;
  const isClaimant =
    !!currentUserId && claim.claimantId === currentUserId;
  const isAdmin = currentUser?.role === "Admin";
  const canReview = isReporter || isAdmin;
  const canView = canReview || isClaimant;
  const isPendingDecision = canReview && claim.status === "Pending";
  const isApprovedAndCanComplete = canReview && claim.status === "Approved";

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText: string = "Confirm"
  ) => {
    if (Platform.OS === "web") {
      const ok =
        typeof window !== "undefined"
          ? window.confirm(`${title}\n\n${message}`)
          : true;
      if (ok) {
        onConfirm();
      }
    } else {
      Alert.alert(title, message, [
        { text: "Cancel", style: "cancel" },
        { text: confirmText, onPress: onConfirm },
      ]);
    }
  };

  const showAlert = (
    title: string,
    message: string,
    onClose?: () => void
  ) => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") {
        window.alert(`${title}\n\n${message}`);
      }
      onClose?.();
    } else {
      Alert.alert(title, message, [{ text: "OK", onPress: onClose }]);
    }
  };

  const handleOpenChat = async () => {
    if (!currentUserId || !claim) return;
    const otherUserId = isReporter ? claim.claimantId : effectiveReporterId;
    if (!otherUserId) {
      showAlert(
        "Unable to Start Chat",
        "Participant details could not be resolved."
      );
      return;
    }

    setIsStartingChat(true);
    try {
      const res = await findOrCreateConversation(
        claim.itemId,
        currentUserId,
        otherUserId,
        currentUserId
      );
      router.push({
        pathname: "/Inbox/[conversationId]",
        params: {
          conversationId: res.conversation.id,
          itemId: claim.itemId,
        },
      } as any);
    } catch (err: any) {
      console.error("Error starting chat from claim review:", err);
      showAlert(
        "Chat Unavailable",
        err.response?.data?.message ||
          err.message ||
          "Failed to connect to chat thread."
      );
    } finally {
      setIsStartingChat(false);
    }
  };

  if (!canView) {
    return (
      <SafeAreaView style={styles.screen}>
        <AppHeader onPressBack={handleBack} showBack title="Claim Review" />
        <EmptyState
          icon="lock-closed-outline"
          message="Only the item reporter, claimant, or an administrator can view this claim."
          title="Access Denied"
        />
      </SafeAreaView>
    );
  }

  const handleApprove = () => {
    if (isApproving || isRejecting || isCompleting) return;
    showConfirm(
      "Approve this claim?",
      "The claim will become Approved, competing pending claims will be rejected, and the item will be reserved for this claimant.",
      async () => {
        setIsApproving(true);
        try {
          const reviewerId = currentUserId || effectiveReporterId;
          const res = await updateClaimDecision(
            claim.id,
            "Approved",
            reviewerId || undefined
          );
          const targetItemId = item?.id || claim.itemId;
          setClaim((prev) => (prev ? { ...prev, status: "Approved" } : null));
          setItem((prev) => (prev ? { ...prev, status: "Reserved" } : null));
          if (targetItemId) {
            setItems((prev) =>
              prev.map((i) =>
                i.id === targetItemId ? { ...i, status: "Reserved" } : i
              )
            );
          }
          setClaims((prev) =>
            prev.map((c) =>
              c.id === claim.id ? { ...c, status: "Approved" } : c
            )
          );
          showAlert("Claim Approved", res.message || "Item is now reserved.");
        } catch (err: any) {
          showAlert(
            "Unable to Approve",
            err.response?.data?.message || err.message || "An error occurred."
          );
        } finally {
          setIsApproving(false);
        }
      },
      "Approve"
    );
  };

  const handleReject = () => {
    if (isApproving || isRejecting || isCompleting) return;
    showConfirm(
      "Reject this claim?",
      "The claim will become Rejected. The item will return to Active if no other active claim exists.",
      async () => {
        setIsRejecting(true);
        try {
          const reviewerId = currentUserId || effectiveReporterId;
          const res = await updateClaimDecision(
            claim.id,
            "Rejected",
            reviewerId || undefined
          );
          const targetItemId = item?.id || claim.itemId;
          const newStatus = res.itemStatus || "Active";
          setClaim((prev) => (prev ? { ...prev, status: "Rejected" } : null));
          setItem((prev) => (prev ? { ...prev, status: newStatus } : null));
          if (targetItemId) {
            setItems((prev) =>
              prev.map((i) =>
                i.id === targetItemId ? { ...i, status: newStatus } : i
              )
            );
          }
          setClaims((prev) =>
            prev.map((c) =>
              c.id === claim.id ? { ...c, status: "Rejected" } : c
            )
          );
          showAlert("Claim Rejected", res.message || "Claim was rejected.", () =>
            handleBack()
          );
        } catch (err: any) {
          showAlert(
            "Unable to Reject",
            err.response?.data?.message || err.message || "An error occurred."
          );
        } finally {
          setIsRejecting(false);
        }
      },
      "Reject"
    );
  };

  const handleMarkComplete = () => {
    if (isApproving || isRejecting || isCompleting) return;
    showConfirm(
      "Mark Handover Complete?",
      "Confirm that the item has been safely returned to the claimant. The claim will be marked as Completed and the item as Solved.",
      async () => {
        setIsCompleting(true);
        try {
          const reviewerId = currentUserId || effectiveReporterId;
          const res = await updateClaimDecision(
            claim.id,
            "Completed",
            reviewerId || undefined
          );
          const targetItemId = item?.id || claim.itemId;
          setClaim((prev) => (prev ? { ...prev, status: "Completed" } : null));
          setItem((prev) => (prev ? { ...prev, status: "Solved" } : null));
          if (targetItemId) {
            setItems((prev) =>
              prev.map((i) =>
                i.id === targetItemId ? { ...i, status: "Solved" } : i
              )
            );
          }
          setClaims((prev) =>
            prev.map((c) =>
              c.id === claim.id ? { ...c, status: "Completed" } : c
            )
          );
          showAlert(
            "Recovery Completed",
            res.message || "Item is marked as Solved."
          );
        } catch (err: any) {
          showAlert(
            "Unable to Complete",
            err.response?.data?.message || err.message || "An error occurred."
          );
        } finally {
          setIsCompleting(false);
        }
      },
      "Complete Handover"
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader
        onPressBack={handleBack}
        showBack
        subtitle={`Claim ${claim.id}`}
        title="Claim Review"
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[COLORS.primary]}
            onRefresh={() => fetchClaimData(true)}
            refreshing={isRefreshing}
            tintColor={COLORS.primary}
          />
        }
      >
        <View style={styles.statusRow}>
          <View>
            <Text style={styles.statusLabel}>CURRENT STATUS</Text>
            <Text style={styles.statusHint}>
              {canReview
                ? claim.status === "Pending"
                  ? "Review the evidence before deciding."
                  : claim.status === "Approved"
                  ? "Item reserved. Confirm handover when completed."
                  : `Claim is ${claim.status.toLowerCase()}.`
                : "The reporter will review your evidence."}
            </Text>
          </View>
          <StatusBadge status={claim.status} />
        </View>

        {item ? (
          <View style={styles.sectionGap}>
            <ItemSummaryCard item={item} />
          </View>
        ) : null}

        {claimant ? (
          <View style={styles.sectionGap}>
            <ClaimantCard
              claimant={claimant}
              isMessaging={isStartingChat}
              onMessage={isReporter ? handleOpenChat : undefined}
            />
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Private ownership answers</Text>
        <AnswerCard
          answer={claim.answers?.identifyingDetail || "N/A"}
          question="Unique feature, mark, or identifying detail"
        />
        <AnswerCard
          answer={claim.answers?.lossContext || "N/A"}
          question="Where and approximately when the item was lost"
        />
        <AnswerCard
          answer={claim.answers?.privateEvidence || "N/A"}
          question="Additional private ownership evidence"
        />
        <AnswerCard
          answer={claim.handoverMethod || "N/A"}
          question="Preferred handover method"
        />

        {/* Messaging & Coordination Action */}
        <View style={styles.messagingCard}>
          <View style={styles.messagingMeta}>
            <View style={styles.messagingIconCircle}>
              <Ionicons color={COLORS.primary} name="chatbubbles" size={22} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.messagingTitle}>
                {isReporter ? "Contact Claimant" : "Contact Item Reporter"}
              </Text>
              <Text style={styles.messagingSubtitle}>
                {isReporter
                  ? "Clarify ownership details, verify evidence, or coordinate handover."
                  : "Message the reporter to coordinate verification and handover."}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            accessibilityLabel={isReporter ? "Open chat with claimant" : "Open chat with reporter"}
            accessibilityRole="button"
            disabled={isStartingChat}
            onPress={handleOpenChat}
            style={styles.messageChatButton}
          >
            {isStartingChat ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons color="#FFFFFF" name="chatbubble-ellipses-outline" size={18} />
                <Text style={styles.messageChatButtonText}>
                  {isReporter ? "Message Claimant" : "Message Reporter"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Action Buttons for Pending decision */}
        {isPendingDecision ? (
          <View style={styles.actions}>
            <View style={styles.actionItem}>
              <PrimaryButton
                accessibilityLabel="Approve this claim"
                disabled={isApproving || isRejecting}
                label="Approve Claim"
                loading={isApproving}
                onPress={handleApprove}
              />
            </View>
            <View style={styles.actionItem}>
              <PrimaryButton
                accessibilityLabel="Reject this claim"
                destructive
                disabled={isApproving || isRejecting}
                label="Reject Claim"
                loading={isRejecting}
                onPress={handleReject}
                outlined
              />
            </View>
          </View>
        ) : isApprovedAndCanComplete ? (
          <View style={styles.actions}>
            <View style={styles.actionItem}>
              <PrimaryButton
                accessibilityLabel="Mark item handover complete"
                disabled={isCompleting}
                label="Mark Handover Complete"
                loading={isCompleting}
                onPress={handleMarkComplete}
              />
            </View>
          </View>
        ) : (
          <View style={styles.readOnlyNotice}>
            <Text style={styles.readOnlyTitle}>
              {claim.status === "Completed"
                ? "Recovery Solved"
                : isClaimant
                ? "Claim Submitted"
                : "Decision Locked"}
            </Text>
            <Text style={styles.readOnlyText}>
              {claim.status === "Completed"
                ? "This claim is completed and the item has been marked as Solved."
                : claim.status !== "Pending"
                ? `This claim is ${claim.status.toLowerCase()} and is now read-only.`
                : isClaimant
                ? `You submitted this claim. The item reporter (${effectiveReporterId || "reporter"}) will review your answers.`
                : `Logged in as ${currentUser?.name || currentUserId || "User"}. Only the item reporter (${effectiveReporterId || "reporter"}) or an administrator can approve or reject this claim.`}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.background, flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 40 },
  centerContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: SPACING.xl,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: SPACING.md,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  statusRow: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: SPACING.lg,
  },
  statusLabel: { color: COLORS.text, fontSize: 12, fontWeight: "800" },
  statusHint: { color: COLORS.textMuted, fontSize: 11, marginTop: 3 },
  sectionGap: { marginTop: SPACING.lg },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: SPACING.md,
    marginTop: SPACING.xl,
  },
  actions: { marginTop: SPACING.md },
  actionItem: { marginBottom: SPACING.md },
  readOnlyNotice: {
    backgroundColor: COLORS.primaryLight,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    borderWidth: 1,
    marginTop: SPACING.md,
    padding: SPACING.lg,
  },
  readOnlyTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  readOnlyText: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  messagingCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: SPACING.lg,
    padding: SPACING.lg,
  },
  messagingMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  messagingIconCircle: {
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  messagingTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },
  messagingSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  messageChatButton: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    flexDirection: "row",
    gap: SPACING.sm,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: SPACING.lg,
  },
  messageChatButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});