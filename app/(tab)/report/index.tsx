import { router } from "expo-router";
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
import FormField from "@/components/form-field";
import PrimaryButton from "@/components/primary-button";
import PrivacyNotice from "@/components/privacy-notice";
import { COLORS, SPACING } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { createItem, getCategories } from "@/services/items";
import { Category, ItemType } from "@/types";

export default function ReportScreen() {
  const { currentUserId, setItems } = useApp();

  const [type, setType] = useState<ItemType>("Lost");
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    setCategoriesError(null);
    try {
      const data = await getCategories(true);
      const activeList = data.filter((cat) => cat.active !== false);
      setCategories(activeList);
      if (activeList.length > 0) {
        setCategoryId((prevId) => {
          const exists = activeList.some((cat) => cat.id === prevId);
          return exists ? prevId : activeList[0].id;
        });
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to load categories. Please try again.";
      setCategoriesError(message);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!title.trim()) {
      errs.title = "Title is required.";
    } else if (title.trim().length < 3) {
      errs.title = "Title must be at least 3 characters.";
    }

    if (!location.trim()) {
      errs.location = "Location is required.";
    }

    if (!description.trim()) {
      errs.description = "Description is required.";
    } else if (description.trim().length < 10) {
      errs.description = "Description must be at least 10 characters.";
    }

    return errs;
  }, [title, location, description]);

  const isFormValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const getError = (field: string) =>
    touched[field] || submitAttempted ? errors[field] : undefined;

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    setTouched({
      title: true,
      location: true,
      description: true,
    });

    if (!isFormValid) return;

    if (!categoryId) {
      Alert.alert("Category Required", "Please select a category before submitting.");
      return;
    }

    if (!currentUserId) {
      Alert.alert("Login Required", "Please log in before reporting an item.", [
        {
          text: "Log In",
          onPress: () => router.push("/(auth)/login" as any),
        },
        { text: "Cancel", style: "cancel" },
      ]);
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await createItem(
        {
          type,
          title: title.trim(),
          categoryId,
          description: description.trim(),
          location: location.trim(),
          reportDate,
          image: "placeholder.png",
        },
        currentUserId
      );

      if (response.item) {
        setItems((prev) => [response.item, ...prev]);
      }

      // Reset form
      setTitle("");
      setLocation("");
      setDescription("");
      setTouched({});
      setSubmitAttempted(false);

      Alert.alert("Success", "Your item report has been published.", [
        {
          text: "View in Feed",
          onPress: () => router.push("/feed" as any),
        },
      ]);
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to post item report. Please try again.";
      Alert.alert("Submission Failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader subtitle="Report a lost or found item to the community" title="Report Item" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Item Report Type</Text>
          <View style={styles.chipContainer}>
            <ChoiceChip
              label="I Lost something"
              onPress={() => setType("Lost")}
              selected={type === "Lost"}
            />
            <ChoiceChip
              label="I Found something"
              onPress={() => setType("Found")}
              selected={type === "Found"}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Item Details</Text>
          <FormField
            error={getError("title")}
            label="Item Title"
            onBlur={() => setTouched((p) => ({ ...p, title: true }))}
            onChangeText={setTitle}
            placeholder="e.g. Blue Leather Wallet, Silver Macbook Pro"
            value={title}
          />

          <Text style={styles.label}>Category</Text>
          {loadingCategories ? (
            <View style={styles.categoryLoadingContainer}>
              <ActivityIndicator color={COLORS.primary} size="small" />
              <Text style={styles.categoryStatusText}>Loading categories...</Text>
            </View>
          ) : categoriesError ? (
            <View style={styles.categoryErrorContainer}>
              <Text style={styles.categoryErrorText}>{categoriesError}</Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={fetchCategories}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : categories.length === 0 ? (
            <View style={styles.categoryLoadingContainer}>
              <Text style={styles.categoryStatusText}>No categories available.</Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={fetchCategories}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              <View style={styles.chipRow}>
                {categories.map((cat) => (
                  <ChoiceChip
                    key={cat.id}
                    label={cat.name}
                    onPress={() => setCategoryId(cat.id)}
                    selected={categoryId === cat.id}
                  />
                ))}
              </View>
            </ScrollView>
          )}

          <FormField
            error={getError("location")}
            label="Location"
            onBlur={() => setTouched((p) => ({ ...p, location: true }))}
            onChangeText={setLocation}
            placeholder="e.g. Dhanmondi 27, Central Library Hall"
            value={location}
          />

          <FormField
            label="Report Date (YYYY-MM-DD)"
            onChangeText={setReportDate}
            placeholder="YYYY-MM-DD"
            value={reportDate}
          />

          <FormField
            error={getError("description")}
            label="Description & Public Details"
            multiline
            onBlur={() => setTouched((p) => ({ ...p, description: true }))}
            onChangeText={setDescription}
            placeholder="Describe the item's appearance, distinguishing traits, and circumstances."
            value={description}
          />
        </View>

        <PrivacyNotice />
        <PrimaryButton label={`Post ${type} Item Report`} loading={isSubmitting} onPress={handleSubmit} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.background, flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 40 },
  section: { marginBottom: SPACING.xl },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: "800", marginBottom: SPACING.sm },
  label: { color: COLORS.text, fontSize: 14, fontWeight: "600", marginBottom: SPACING.xs, marginTop: SPACING.sm },
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs, marginTop: SPACING.xs },
  chipRow: { flexDirection: "row", gap: SPACING.xs, paddingVertical: SPACING.xs },
  categoryScroll: { marginBottom: SPACING.md },
  categoryLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  categoryStatusText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  categoryErrorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.dangerLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  categoryErrorText: {
    color: COLORS.danger,
    fontSize: 13,
    flex: 1,
    marginRight: SPACING.sm,
  },
  retryButton: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  retryButtonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "600",
  },
});