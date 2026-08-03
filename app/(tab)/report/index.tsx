import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import AppHeader from "@/components/app-header";
import ChoiceChip from "@/components/choice-chip";
import FormField from "@/components/form-field";
import PrimaryButton from "@/components/primary-button";
import PrivacyNotice from "@/components/privacy-notice";
import categoriesData from "@/data/categories.json";
import { COLORS, SPACING } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { ItemType } from "@/types";

type CategoryItem = {
  id: string;
  name: string;
  active: boolean;
};

const activeCategories: CategoryItem[] = (categoriesData as CategoryItem[]).filter(
  (cat) => cat.active
);

export default function ReportScreen() {
  const { addItem } = useApp();

  const [type, setType] = useState<ItemType>("Lost");
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(activeCategories[0]?.id || "C001");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = () => {
    setSubmitAttempted(true);
    setTouched({
      title: true,
      location: true,
      description: true,
    });

    if (!isFormValid) return;

    setIsSubmitting(true);
    const result = addItem({
      type,
      title: title.trim(),
      categoryId,
      description: description.trim(),
      location: location.trim(),
      reportDate,
      image: "placeholder.png",
    });
    setIsSubmitting(false);

    if (!result.ok) {
      Alert.alert("Error", result.message);
      return;
    }

    Alert.alert("Success", "Your item report has been published.", [
      {
        text: "View in Feed",
        onPress: () => router.push("/feed" as any),
      },
    ]);
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            <View style={styles.chipRow}>
              {activeCategories.map((cat) => (
                <ChoiceChip
                  key={cat.id}
                  label={cat.name}
                  onPress={() => setCategoryId(cat.id)}
                  selected={categoryId === cat.id}
                />
              ))}
            </View>
          </ScrollView>

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
});