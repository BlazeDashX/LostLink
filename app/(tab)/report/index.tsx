import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
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
import { uploadImage } from "@/services/uploads";
import { Category, ItemType } from "@/types";

export default function ReportScreen() {
  const { currentUserId, setItems } = useApp();

  const [type, setType] = useState<ItemType>("Lost");
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);

  // Image upload state
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isPickingImage, setIsPickingImage] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

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

  const performUpload = async (asset: ImagePicker.ImagePickerAsset) => {
    setIsUploadingImage(true);
    setImageUploadError(null);
    try {
      const uploadResult = await uploadImage(
        {
          base64: asset.base64,
          uri: asset.uri,
          filename: asset.fileName || "item_photo.jpg",
          mimeType: asset.mimeType || "image/jpeg",
        },
        currentUserId
      );

      setUploadedImageUrl(uploadResult.url);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to upload image to cloud storage.";
      setImageUploadError(msg);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handlePickImage = async () => {
    setImageUploadError(null);
    try {
      setIsPickingImage(true);
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow photo library access to upload a picture of the item."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const selectedAsset = result.assets[0];
      setLocalImageUri(selectedAsset.uri);
      await performUpload(selectedAsset);
    } catch (err: any) {
      console.error("Image pick error:", err);
      setImageUploadError("Unable to open photo picker. Please try again.");
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setLocalImageUri(null);
    setUploadedImageUrl(null);
    setImageUploadError(null);
  };

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

    if (isUploadingImage) {
      Alert.alert(
        "Image Uploading",
        "Please wait for the image upload to finish before submitting."
      );
      return;
    }

    if (localImageUri && imageUploadError && !uploadedImageUrl) {
      Alert.alert(
        "Image Upload Failed",
        "The selected image could not be uploaded. Please retry or remove the image before submitting."
      );
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
          image: uploadedImageUrl || "placeholder.png",
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
      setLocalImageUri(null);
      setUploadedImageUrl(null);
      setImageUploadError(null);
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

          {/* Item Photo Section */}
          <Text style={styles.label}>Item Photo</Text>
          {!localImageUri ? (
            <TouchableOpacity
              activeOpacity={0.75}
              disabled={isPickingImage}
              onPress={handlePickImage}
              style={styles.imagePickerButton}
            >
              <View style={styles.imagePickerIconCircle}>
                <Ionicons color={COLORS.primary} name="camera-outline" size={24} />
              </View>
              <Text style={styles.imagePickerText}>
                {isPickingImage ? "Opening Gallery..." : "Add Item Photo"}
              </Text>
              <Text style={styles.imagePickerSubtext}>
                Photos help the community verify and return items faster
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.imagePreviewWrapper}>
              <Image
                contentFit="cover"
                source={{ uri: localImageUri }}
                style={styles.imagePreview}
                transition={200}
              />

              {isUploadingImage && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color={COLORS.surface} size="small" />
                  <Text style={styles.uploadingText}>Uploading to persistent storage...</Text>
                </View>
              )}

              {imageUploadError && !isUploadingImage && (
                <View style={styles.imageErrorBanner}>
                  <Text style={styles.imageErrorText}>{imageUploadError}</Text>
                  <TouchableOpacity
                    onPress={() => localImageUri && handlePickImage()}
                    style={styles.retryImageBtn}
                  >
                    <Text style={styles.retryImageBtnText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              )}

              {uploadedImageUrl && !isUploadingImage && (
                <View style={styles.imageSuccessBadge}>
                  <Ionicons color={COLORS.success} name="checkmark-circle" size={16} />
                  <Text style={styles.imageSuccessText}>Image uploaded to persistent cloud storage</Text>
                </View>
              )}

              <View style={styles.imageActionsRow}>
                <TouchableOpacity
                  disabled={isUploadingImage}
                  onPress={handlePickImage}
                  style={styles.changeImageButton}
                >
                  <Ionicons color={COLORS.primary} name="refresh-outline" size={16} />
                  <Text style={styles.changeImageText}>Change Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={isUploadingImage}
                  onPress={handleRemoveImage}
                  style={styles.removeImageButton}
                >
                  <Ionicons color={COLORS.danger} name="trash-outline" size={16} />
                  <Text style={styles.removeImageText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  // Image Picker Styles
  imagePickerButton: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  imagePickerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  imagePickerText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  imagePickerSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  imagePreviewWrapper: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    backgroundColor: "#F1F5F9",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
  },
  uploadingText: {
    color: COLORS.surface,
    fontSize: 13,
    fontWeight: "600",
  },
  imageErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.dangerLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  imageErrorText: {
    color: COLORS.danger,
    fontSize: 12,
    flex: 1,
    marginRight: SPACING.sm,
  },
  retryImageBtn: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  retryImageBtnText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: "700",
  },
  imageSuccessBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
  },
  imageSuccessText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: "600",
  },
  imageActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  changeImageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  changeImageText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  removeImageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  removeImageText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: "600",
  },
});