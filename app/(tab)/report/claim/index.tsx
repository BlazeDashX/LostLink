import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppHeader from "@/components/app-header";
import ChoiceChip from "@/components/choice-chip";
import EmptyState from "@/components/empty-state";
import FormField from "@/components/form-field";
import ItemSummaryCard from "@/components/item-summary-card";
import PrimaryButton from "@/components/primary-button";
import PrivacyNotice from "@/components/privacy-notice";
import { COLORS, SPACING } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { submitClaim as apiSubmitClaim } from "@/services/claims";
import { getItemById } from "@/services/items";
import { ClaimAnswers, Item } from "@/types";

type ClaimFormData = ClaimAnswers & { handoverMethod: string };
type ClaimFormErrors = Partial<Record<keyof ClaimFormData, string>>;

const HANDOVER_OPTIONS = [
  "Meet in a public place",
  "Collect from the reporter",
  "Arrange later through chat",
];

const INITIAL_FORM: ClaimFormData = {
  identifyingDetail: "",
  lossContext: "",
  privateEvidence: "",
  handoverMethod: "",
};

function validateForm(data: ClaimFormData): ClaimFormErrors {
  const errors: ClaimFormErrors = {};
  const requiredAnswers: (keyof ClaimAnswers)[] = [
    "identifyingDetail",
    "lossContext",
    "privateEvidence",
  ];

  requiredAnswers.forEach((field) => {
    const value = data[field].trim();
    if (!value) errors[field] = "This ownership answer is required.";
    else if (value.length < 12)
      errors[field] = "Please provide at least 12 characters of useful detail.";
  });

  if (!data.handoverMethod)
    errors.handoverMethod = "Select one handover preference.";
  return errors;
}

export default function SubmitClaimScreen() {
  const { itemId } = useLocalSearchParams() as { itemId: string };
  const [formData, setFormData] = useState<ClaimFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<ClaimFormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof ClaimFormData, boolean>>
  >({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { claims, currentUserId, items, setClaims, setItems } = useApp();

  const [activeItem, setActiveItem] = useState<Item | null>(() => {
    return items.find((candidate) => candidate.id === itemId) || null;
  });
  const [isLoadingItem, setIsLoadingItem] = useState(!activeItem);

  const fetchItemData = useCallback(async () => {
    if (!itemId) {
      setIsLoadingItem(false);
      return;
    }

    const cached = items.find((candidate) => candidate.id === itemId);
    if (cached) {
      setActiveItem(cached);
      setIsLoadingItem(false);
      return;
    }

    setIsLoadingItem(true);
    try {
      const fetched = await getItemById(itemId);
      if (fetched) {
        setActiveItem(fetched);
        setItems((prev) => {
          if (prev.some((i) => i.id === fetched.id)) return prev;
          return [fetched, ...prev];
        });
      }
    } catch (err) {
      console.error("Error fetching item for claim:", err);
    } finally {
      setIsLoadingItem(false);
    }
  }, [itemId, items, setItems]);

  useEffect(() => {
    if (!activeItem) {
      fetchItemData();
    }
  }, [activeItem, fetchItemData]);

  const duplicateClaim = claims.find(
    (claim) =>
      claim.itemId === itemId &&
      claim.claimantId === currentUserId &&
      ["Pending", "Approved"].includes(claim.status)
  );

  useEffect(() => {
    setErrors(validateForm(formData));
  }, [formData]);

  const isFormValid = useMemo(
    () => Object.keys(validateForm(formData)).length === 0,
    [formData]
  );

  const updateField = (field: keyof ClaimFormData, value: string) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
  };

  const markTouched = (field: keyof ClaimFormData) => {
    setTouched((previous) => ({ ...previous, [field]: true }));
  };

  const getError = (field: keyof ClaimFormData) =>
    touched[field] || submitAttempted ? errors[field] : undefined;

  // Loading indicator for item
  if (isLoadingItem) {
    return (
      <SafeAreaView style={styles.screen}>
        <AppHeader showBack title="Submit Claim" />
        <View style={styles.centerContainer}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Loading item details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Workflow validation guards
  if (!itemId || !activeItem) {
    return (
      <SafeAreaView style={styles.screen}>
        <AppHeader showBack title="Submit Claim" />
        <View style={styles.centerContainer}>
          <EmptyState
            icon="alert-circle-outline"
            message="A valid item reference is required to submit a claim."
            title="Item unavailable"
          />
          <TouchableOpacity
            accessibilityLabel="Retry loading item"
            accessibilityRole="button"
            onPress={fetchItemData}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (activeItem.reporterId === currentUserId) {
    return (
      <SafeAreaView style={styles.screen}>
        <AppHeader showBack title="Submit Claim" />
        <EmptyState
          icon="shield-outline"
          message="The reporter cannot submit an ownership claim for their own reported item."
          title="Claim not allowed"
        />
      </SafeAreaView>
    );
  }

  if (duplicateClaim) {
    return (
      <SafeAreaView style={styles.screen}>
        <AppHeader showBack title="Submit Claim" />
        <EmptyState
          icon="document-text-outline"
          message="You already have an active or pending claim for this item."
          title="Active claim exists"
        />
      </SafeAreaView>
    );
  }

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    setTouched({
      identifyingDetail: true,
      lossContext: true,
      privateEvidence: true,
      handoverMethod: true,
    });

    if (!isFormValid || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await apiSubmitClaim(
        {
          itemId: activeItem.id,
          claimantId: currentUserId || undefined,
          answers: {
            identifyingDetail: formData.identifyingDetail.trim(),
            lossContext: formData.lossContext.trim(),
            privateEvidence: formData.privateEvidence.trim(),
          },
          handoverMethod: formData.handoverMethod,
        },
        currentUserId
      );

      const createdClaim = response.claim;

      if (createdClaim) {
        setClaims((prev) => [createdClaim, ...prev]);
        setItems((prev) =>
          prev.map((i) =>
            i.id === activeItem.id && i.status === "Active"
              ? { ...i, status: "Pending Claim" }
              : i
          )
        );
      }

      Alert.alert(
        "Claim Submitted",
        response.message || "Your ownership claim has been sent to the reporter.",
        [
          {
            text: "View Status",
            onPress: () =>
              router.replace({
                pathname: "/report/claim/review",
                params: { claimId: createdClaim?.id },
              }),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        "Submission Failed",
        err.response?.data?.message ||
          err.message ||
          "Could not submit claim. Please check your connection."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader
        showBack
        subtitle="Private ownership verification"
        title="Submit Claim"
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <ItemSummaryCard item={activeItem} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ownership evidence</Text>
          <Text style={styles.sectionDescription}>
            Give details that the public item description does not reveal.
          </Text>

          <FormField
            accessibilityLabel="Describe unique feature, mark, or identifying detail"
            error={getError("identifyingDetail")}
            label="Describe a unique feature, mark, or identifying detail"
            multiline
            onBlur={() => markTouched("identifyingDetail")}
            onChangeText={(text) => updateField("identifyingDetail", text)}
            placeholder="Example: a scratch, engraving, sticker, or hidden mark"
            value={formData.identifyingDetail}
          />
          <FormField
            accessibilityLabel="Where and approximately when did you lose the item"
            error={getError("lossContext")}
            label="Where and approximately when did you lose the item?"
            multiline
            onBlur={() => markTouched("lossContext")}
            onChangeText={(text) => updateField("lossContext", text)}
            placeholder="Mention the approximate place, date, and situation"
            value={formData.lossContext}
          />
          <FormField
            accessibilityLabel="Provide another ownership detail not publicly visible"
            error={getError("privateEvidence")}
            label="Provide another ownership detail that is not publicly visible"
            multiline
            onBlur={() => markTouched("privateEvidence")}
            onChangeText={(text) => updateField("privateEvidence", text)}
            placeholder="Share a safe private detail without full sensitive identifiers"
            value={formData.privateEvidence}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Handover preference</Text>
          <View style={styles.chipContainer}>
            {HANDOVER_OPTIONS.map((option) => (
              <ChoiceChip
                key={option}
                label={option}
                onPress={() => {
                  updateField("handoverMethod", option);
                  markTouched("handoverMethod");
                }}
                selected={formData.handoverMethod === option}
              />
            ))}
          </View>
          {getError("handoverMethod") ? (
            <Text style={styles.choiceError}>{getError("handoverMethod")}</Text>
          ) : null}
        </View>

        <PrivacyNotice />
        <PrimaryButton
          accessibilityLabel="Submit claim button"
          label="Submit Claim"
          loading={isSubmitting}
          onPress={handleSubmit}
        />
        <View style={styles.cancelSpacing}>
          <PrimaryButton
            accessibilityLabel="Cancel claim submission"
            label="Cancel"
            onPress={() => router.back()}
            outlined
          />
        </View>
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
  section: { marginTop: SPACING.xl },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: "800" },
  sectionDescription: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: SPACING.lg,
    marginTop: 4,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: SPACING.md,
  },
  choiceError: {
    color: COLORS.danger,
    fontSize: 11,
    marginBottom: SPACING.lg,
  },
  cancelSpacing: { marginTop: SPACING.md },
});