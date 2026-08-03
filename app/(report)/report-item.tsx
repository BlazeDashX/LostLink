// screens/ReportItemScreen.tsx
// SRS 13.8 — Report Item Screen
// Adjust the import paths below to match your project's folder structure.
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useApp } from "@/context/AppContext";
import { Item } from "@/types";
import SegmentedControl from "@/components/SegmentedControl";

// SRS 13.8.6 requires category to exist in categories.json. Your AppContext
// does not currently load categories.json, so a fixed list mirrors the
// options implied by the mockup. Swap for real categories.json data if/when
// it's wired into AppContext.
const CATEGORIES = ["Electronics", "Documents", "Bags", "Keys", "Clothing", "Other"];

const COLORS = {
  primary: "#2563EB",
  primaryDark: "#1E3A8A",
  primaryLight: "#DBEAFE",
  border: "#E2E8F0",
  text: "#0F172A",
  subtext: "#64748B",
  placeholder: "#94A3B8",
  danger: "#DC2626",
};

type ReportType = "Lost" | "Found";

interface FormState {
  reportType: ReportType;
  title: string;
  category: string;
  location: string;
  date: string;
  description: string;
}

interface FormErrors {
  title?: string;
  category?: string;
  location?: string;
  date?: string;
  description?: string;
}

export default function ReportItemScreen() {
  const router = useRouter();
  const { currentUserId, items, setItems } = useApp();

  const [form, setForm] = useState<FormState>({
    reportType: "Lost",
    title: "",
    category: "",
    location: "",
    date: "",
    description: "",
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // SRS 13.8.4 — useEffect for validation.
  useEffect(() => {
    const nextErrors: FormErrors = {};

    if (!form.title.trim()) {
      nextErrors.title = "Item title is required.";
    } else if (form.title.trim().length < 3) {
      nextErrors.title = "Title must be at least 3 characters.";
    }

    if (!form.category.trim()) {
      nextErrors.category = "Category is required.";
    }

    if (!form.location.trim()) {
      nextErrors.location = "Location is required.";
    }

    if (!form.date.trim()) {
      nextErrors.date = "Date is required.";
    }

    if (!form.description.trim()) {
      nextErrors.description = "Description is required.";
    } else if (form.description.trim().length < 10) {
      nextErrors.description = "Please add at least 10 characters.";
    }

    setErrors(nextErrors);
  }, [form]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function markTouched(key: string) {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  function fieldError(key: keyof FormErrors) {
    return touched[key] ? errors[key] : undefined;
  }

  // SRS 13.8.8 Workflow steps 3-6.
  function handlePublish() {
    setTouched({
      title: true,
      category: true,
      location: true,
      date: true,
      description: true,
    });

    if (Object.keys(errors).length > 0) {
      Alert.alert("Check the form", "Please fix the highlighted fields before publishing.");
      return;
    }

    setSubmitting(true);

    const nextId = `I${String(items.length + 1).padStart(3, "0")}`;

    const newItem: Item = {
      id: nextId,
      type: form.reportType,
      title: form.title.trim(),
      categoryId: form.category.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      reportDate: form.date.trim(),
      image: "",
      reporterId: currentUserId,
      status: "Active",
      createdAt: new Date().toISOString(),
    } as Item;

    // SRS 9.3 — immutable update, never mutate imported JSON
    setItems((prev) => [newItem, ...prev]);
    setSubmitting(false);

    Alert.alert("Report published", `${newItem.title} is now live.`, [
      {
        text: "OK",
        onPress: () =>
          router.push({ pathname: "../item-details", params: { itemId: newItem.id } }),
      },
    ]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Report Item</Text>

      <Text style={styles.sectionLabel}>What happened?</Text>
      <SegmentedControl<ReportType>
        options={["Lost", "Found"]}
        value={form.reportType}
        onChange={(v) => updateField("reportType", v)}
        variant="track"
      />

      <FieldLabel text="Item title" />
      <TextInput
        style={[styles.input, fieldError("title") && styles.inputError]}
        placeholder="e.g. Blue Student ID Card"
        placeholderTextColor={COLORS.placeholder}
        value={form.title}
        onChangeText={(v) => updateField("title", v)}
        onBlur={() => markTouched("title")}
      />
      <ErrorText text={fieldError("title")} />

      <FieldLabel text="Category" />
      <View style={styles.chipRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, form.category === cat && styles.chipActive]}
            onPress={() => {
              updateField("category", cat);
              markTouched("category");
            }}
          >
            <Text style={[styles.chipText, form.category === cat && styles.chipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ErrorText text={fieldError("category")} />

      <FieldLabel text="Location" />
      <TextInput
        style={[styles.input, fieldError("location") && styles.inputError]}
        placeholder="e.g. AIUB Campus, Building D"
        placeholderTextColor={COLORS.placeholder}
        value={form.location}
        onChangeText={(v) => updateField("location", v)}
        onBlur={() => markTouched("location")}
      />
      <ErrorText text={fieldError("location")} />

      <FieldLabel text="Date" />
      <TextInput
        style={[styles.input, fieldError("date") && styles.inputError]}
        placeholder="e.g. July 27, 2026"
        placeholderTextColor={COLORS.placeholder}
        value={form.date}
        onChangeText={(v) => updateField("date", v)}
        onBlur={() => markTouched("date")}
      />
      <ErrorText text={fieldError("date")} />

      <FieldLabel text="Description" />
      <TextInput
        style={[styles.input, styles.textArea, fieldError("description") && styles.inputError]}
        placeholder="Describe identifying marks without exposing sensitive information."
        placeholderTextColor={COLORS.placeholder}
        value={form.description}
        onChangeText={(v) => updateField("description", v)}
        onBlur={() => markTouched("description")}
        multiline
        numberOfLines={4}
      />
      <ErrorText text={fieldError("description")} />

      <TouchableOpacity
        style={styles.photoRow}
        onPress={() => Alert.alert("Prototype", "Photo attachment is optional for this prototype.")}
      >
        <Text style={styles.photoPlus}>＋</Text>
        <View>
          <Text style={styles.photoTitle}>Add photo from local assets</Text>
          <Text style={styles.photoSubtitle}>Optional for this prototype</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.publishButton, submitting && styles.publishButtonDisabled]}
        onPress={handlePublish}
        disabled={submitting}
      >
        <Text style={styles.publishButtonText}>
          {submitting ? "Publishing..." : "Publish Report"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.fieldLabel}>{text}</Text>;
}

function ErrorText({ text }: { text?: string }) {
  if (!text) return null;
  return <Text style={styles.errorText}>{text}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { padding: 20, paddingBottom: 48 },
  header: { fontSize: 22, fontWeight: "700", color: COLORS.text, marginBottom: 16 },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: COLORS.subtext, marginBottom: 8 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: COLORS.text, marginTop: 20, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: "#FFFFFF",
  },
  inputError: { borderColor: COLORS.danger },
  textArea: { minHeight: 90, textAlignVertical: "top" },
  errorText: { fontSize: 12, color: COLORS.danger, marginTop: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.text, fontWeight: "500" },
  chipTextActive: { color: "#FFFFFF" },
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    gap: 12,
  },
  photoPlus: { fontSize: 20, color: COLORS.primary, fontWeight: "700" },
  photoTitle: { fontSize: 14, fontWeight: "600", color: COLORS.primaryDark },
  photoSubtitle: { fontSize: 12, color: COLORS.subtext },
  publishButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  publishButtonDisabled: { opacity: 0.6 },
  publishButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
