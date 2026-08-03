import { router, useLocalSearchParams } from "expo-router";
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import AnswerCard from "@/components/answer-card";
import AppHeader from "@/components/app-header";
import ClaimantCard from "@/components/claimant-card";
import EmptyState from "@/components/empty-state";
import ItemSummaryCard from "@/components/item-summary-card";
import PrimaryButton from "@/components/primary-button";
import StatusBadge from "@/components/status-badge";
import { COLORS, SPACING } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

type ClaimReviewParams = {
  claimId?: string;
};

export default function ClaimReviewScreen() {
  const { claimId } = useLocalSearchParams() as ClaimReviewParams;
  const { claims, currentUserId, items, users, approveClaim, rejectClaim } = useApp();

  const claim = claims.find((candidate) => candidate.id === claimId);
  const item = items.find((candidate) => candidate.id === claim?.itemId);
  const claimant = users.find((user) => user.id === claim?.claimantId);
  const currentUser = users.find((user) => user.id === currentUserId);

  if (!claimId || !claim || !item || !claimant || !currentUser) {
    return (
      <SafeAreaView style={styles.screen}>
        <AppHeader showBack title="Claim Review" />
        <EmptyState icon="alert-circle-outline" message="The claim, item, or claimant could not be resolved." title="Claim unavailable" />
      </SafeAreaView>
    );
  }

  const canReview = currentUser.role === "Admin" || item.reporterId === currentUser.id;
  const canView = canReview || claim.claimantId === currentUser.id;
  const isActionable = canReview && claim.status === "Pending";

  if (!canView) {
    return (
      <SafeAreaView style={styles.screen}>
        <AppHeader showBack title="Claim Review" />
        <EmptyState icon="lock-closed-outline" message="Only the item reporter, claimant, or an admin can view this claim." title="Access denied" />
      </SafeAreaView>
    );
  }

  const handleApprove = () => {
    Alert.alert(
      "Approve this claim?",
      "The claim will become Approved and the item will be reserved for this claimant.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: () => {
            const result = approveClaim(claim.id);
            Alert.alert(result.ok ? "Claim approved" : "Unable to approve", result.message);
          },
        },
      ],
    );
  };

  const handleReject = () => {
    Alert.alert(
      "Reject this claim?",
      "The claim will become Rejected. The item will return to Active if no approved claim exists.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () => {
            const result = rejectClaim(claim.id);
            Alert.alert(result.ok ? "Claim rejected" : "Unable to reject", result.message, [
              { text: "OK", onPress: () => result.ok && router.back() },
            ]);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader showBack subtitle={`Claim ${claim.id}`} title="Claim Review" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusRow}>
          <View>
            <Text style={styles.statusLabel}>CURRENT STATUS</Text>
            <Text style={styles.statusHint}>
              {canReview ? "Review the evidence before deciding." : "The reporter will review your evidence."}
            </Text>
          </View>
          <StatusBadge status={claim.status} />
        </View>

        <View style={styles.sectionGap}>
          <ItemSummaryCard item={item} />
        </View>
        <View style={styles.sectionGap}>
          <ClaimantCard claimant={claimant} />
        </View>

        <Text style={styles.sectionTitle}>Private ownership answers</Text>
        <AnswerCard answer={claim.answers.identifyingDetail} question="Unique feature, mark, or identifying detail" />
        <AnswerCard answer={claim.answers.lossContext} question="Where and approximately when the item was lost" />
        <AnswerCard answer={claim.answers.privateEvidence} question="Additional private ownership evidence" />
        <AnswerCard answer={claim.handoverMethod} question="Preferred handover method" />

        {isActionable ? (
          <View style={styles.actions}>
            <View style={styles.actionItem}>
              <PrimaryButton label="Approve Claim" onPress={handleApprove} />
            </View>
            <View style={styles.actionItem}>
              <PrimaryButton destructive label="Reject Claim" onPress={handleReject} outlined />
            </View>
          </View>
        ) : (
          <View style={styles.readOnlyNotice}>
            <Text style={styles.readOnlyTitle}>No decision available</Text>
            <Text style={styles.readOnlyText}>
              {claim.status !== "Pending"
                ? `This claim is ${claim.status.toLowerCase()} and is now read-only.`
                : "Only the item reporter or an administrator can approve or reject this claim."}
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
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: "800", marginBottom: SPACING.md, marginTop: SPACING.xl },
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
  readOnlyText: { color: COLORS.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4 },
});