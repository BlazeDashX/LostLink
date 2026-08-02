import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import AppHeader from "@/components/app-header";
import ChoiceChip from "@/components/choice-chip";
import EmptyState from "@/components/empty-state";
import FormField from "@/components/form-field";
import ItemSummaryCard from "@/components/item-summary-card";
import PrimaryButton from "@/components/primary-button";
import PrivacyNotice from "@/components/privacy-notice";
import { COLORS, SPACING } from "@/constants/theme";
import { useApp } from "@/app/context/AppContext";
import { ClaimAnswers } from "@/types";

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
    else if (value.length < 12) errors[field] = "Please provide at least 12 characters of useful detail.";
  });

  if (!data.handoverMethod) errors.handoverMethod = "Select one handover preference.";
  return errors;
}

export default function SubmitClaimScreen() {
  const { itemId } = useLocalSearchParams() as { itemId: string };
  const [formData, setFormData] = useState<ClaimFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<ClaimFormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ClaimFormData, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { claims, currentUserId, items, submitClaim } = useApp();

  const item = items.find((candidate) => candidate.id === itemId);
  const duplicateClaim = claims.find(
    (claim) =>
      claim.itemId === itemId &&
      claim.claimantId === currentUserId &&
      ["Pending", "Approved"].includes(claim.status),
  );

  useEffect(() => {
    setErrors(validateForm(formData));
  }, [formData]);

  const isFormValid = useMemo(
    () => Object.keys(validateForm(formData)).length === 0,
    [formData],
  );

  const updateField = (field: keyof ClaimFormData, value: string) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
  };

  const markTouched = (field: keyof ClaimFormData) => {
    setTouched((previous) => ({ ...previous, [field]: true }));
  };

  const getError = (field: keyof ClaimFormData) =>
    touched[field] || submitAttempted ? errors[field] : undefined;

  // Workflow validation guards
  if (!itemId || !item) {
    return (
      <SafeAreaView style={styles.screen}>
        <AppHeader showBack title="Submit Claim" />
        <EmptyState icon="alert-circle-outline" message="A valid item reference is required." title="Item unavailable" />
      </SafeAreaView>
    );
  }

  if (item.reporterId === currentUserId) {
    return (
      <SafeAreaView style={styles.screen}>
        <AppHeader showBack title="Submit Claim" />
        <EmptyState icon="shield-outline" message="The reporter cannot submit an ownership claim." title="Claim not allowed" />
      </SafeAreaView>
    );
  }

  if (duplicateClaim) {
    return (
      <SafeAreaView style={styles.screen}>
        <AppHeader showBack title="Submit Claim" />
        <EmptyState icon="document-text-outline" message="You already have a pending or approved claim." title="Active claim exists" />
      </SafeAreaView>
    );
  }

  const handleSubmit = () => {
    setSubmitAttempted(true);
    setTouched({
      identifyingDetail: true,
      lossContext: true,
      privateEvidence: true,
      handoverMethod: true,
    });

    if (!isFormValid) return;
    setIsSubmitting(true);
    
    const result = submitClaim({
      itemId: item.id,
      answers: {
        identifyingDetail: formData.identifyingDetail,
        lossContext: formData.lossContext,
        privateEvidence: formData.privateEvidence,
      },
      handoverMethod: formData.handoverMethod,
    });
    
    setIsSubmitting(false);

    if (!result.ok || !result.claimId) {
      Alert.alert("Error", result.message);
      return;
    }

    Alert.alert("Claim submitted", result.message, [
      {
        text: "View status",
        onPress: () => router.replace({ pathname: "/claim/review", params: { claimId: result.claimId } }),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader showBack subtitle="Private ownership verification" title="Submit Claim" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ItemSummaryCard item={item} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ownership evidence</Text>
          <Text style={styles.sectionDescription}>
            Give details that the public item description does not reveal.
          </Text>

          <FormField
            error={getError("identifyingDetail")}
            label="Describe a unique feature, mark, or identifying detail"
            multiline
            onBlur={() => markTouched("identifyingDetail")}
            onChangeText={(text) => updateField("identifyingDetail", text)}
            placeholder="Example: a scratch, engraving, sticker, or hidden mark"
            value={formData.identifyingDetail}
          />
          <FormField
            error={getError("lossContext")}
            label="Where and approximately when did you lose the item?"
            multiline
            onBlur={() => markTouched("lossContext")}
            onChangeText={(text) => updateField("lossContext", text)}
            placeholder="Mention the approximate place, date, and situation"
            value={formData.lossContext}
          />
          <FormField
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
        <PrimaryButton label="Submit Claim" loading={isSubmitting} onPress={handleSubmit} />
        <View style={styles.cancelSpacing}>
          <PrimaryButton label="Cancel" onPress={() => router.back()} outlined />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.background, flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 40 },
  section: { marginTop: SPACING.xl },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: "800" },
  sectionDescription: { color: COLORS.textMuted, fontSize: 13, lineHeight: 19, marginBottom: SPACING.lg, marginTop: 4 },
  chipContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: SPACING.md },
  choiceError: { color: COLORS.danger, fontSize: 11, marginBottom: SPACING.lg },
  cancelSpacing: { marginTop: SPACING.md },
});