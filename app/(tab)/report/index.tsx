import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "@/components/app-header";
import CategoryDropdown from "@/components/category-dropdown";
import ChoiceChip from "@/components/choice-chip";
import FormField from "@/components/form-field";
import PrimaryButton from "@/components/primary-button";
import PrivacyNotice from "@/components/privacy-notice";
import { COLORS, SPACING } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { createItem, deleteItem, getCategories, getItemById, updateItem } from "@/services/items";
import { uploadImage } from "@/services/uploads";
import { Category, Item, ItemType } from "@/types";

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/** Returns true if the string matches YYYY-MM-DD */
function isValidDateFormat(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

/** Returns true if the date is a real calendar date (not e.g. 2024-02-30) */
function isRealDate(value: string): boolean {
  const d = new Date(value.trim());
  return !isNaN(d.getTime());
}

/** Returns true if the date is not in the future */
function isNotFutureDate(value: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(value.trim());
  return d <= today;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReportScreen() {
  const { currentUserId, currentUser, items, setItems } = useApp();
  const searchParams = useLocalSearchParams<{ id?: string; editId?: string; itemId?: string }>();
  const activeEditId = searchParams.editId || searchParams.itemId || searchParams.id || null;
  const isEditMode = Boolean(activeEditId);

  // Form field state
  const [type, setType] = useState<ItemType>("Lost");
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);

  // Image upload state
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [isPickingImage, setIsPickingImage] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  // Keep last picked asset so we can retry upload without re-opening the picker
  const lastPickedAssetRef = useRef<ImagePicker.ImagePickerAsset | null>(null);

  // Edit mode loading state
  const [isLoadingItem, setIsLoadingItem] = useState<boolean>(isEditMode);
  const [itemLoadError, setItemLoadError] = useState<string | null>(null);

  // Category state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // Submission / validation state
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  /** Inline error for category — shown near the chips after submit attempt */
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    setCategoriesError(null);
    try {
      const data = await getCategories(true);
      const activeList = data.filter((cat) => cat.active !== false);
      setCategories(activeList);
      if (activeList.length > 0) {
        setCategoryId((prevId) => {
          if (prevId) {
            const exists = activeList.some((cat) => cat.id === prevId);
            if (exists) return prevId;
          }
          return prevId;
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
  }, [isEditMode]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Load existing item details when in edit mode
  useEffect(() => {
    if (!activeEditId) {
      setIsLoadingItem(false);
      return;
    }

    let isMounted = true;
    const loadItemData = async () => {
      setIsLoadingItem(true);
      setItemLoadError(null);
      try {
        let itemData: Item | null = null;
        try {
          itemData = await getItemById(activeEditId);
        } catch (apiErr) {
          // If network error, check context cache as fallback
          const cached = items.find((i) => i.id === activeEditId);
          if (cached) {
            itemData = cached;
          } else {
            throw apiErr;
          }
        }

        if (!isMounted) return;

        if (!itemData) {
          setItemLoadError("The requested report could not be found.");
          return;
        }

        // Authorization check on the client (backend also strictly verifies this)
        const isOwner = currentUserId && itemData.reporterId === currentUserId;
        const isAdmin = currentUser?.role === "Admin";
        if (currentUserId && !isOwner && !isAdmin) {
          setItemLoadError("You are not authorized to edit this report.");
          return;
        }

        setType(itemData.type);
        setTitle(itemData.title);
        setCategoryId(itemData.categoryId);
        setLocation(itemData.location);
        setDescription(itemData.description);
        if (itemData.reportDate) {
          setReportDate(itemData.reportDate);
        }
        if (itemData.image && itemData.image !== "placeholder.png") {
          setExistingImageUrl(itemData.image);
          setLocalImageUri(itemData.image);
          setUploadedImageUrl(itemData.image);
        } else {
          setExistingImageUrl(null);
          setLocalImageUri(null);
          setUploadedImageUrl(null);
        }
      } catch (err: any) {
        if (!isMounted) return;
        const msg =
          err.response?.data?.message ||
          err.message ||
          "Failed to load item report. Please check your network connection.";
        setItemLoadError(msg);
      } finally {
        if (isMounted) setIsLoadingItem(false);
      }
    };

    loadItemData();

    return () => {
      isMounted = false;
    };
  }, [activeEditId, currentUserId, currentUser?.role]);

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
      // Clear any stale URL so we never submit with an invalid image URL
      setUploadedImageUrl(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handlePickImage = async () => {
    // Prevent re-entry while already picking or uploading
    if (isPickingImage || isUploadingImage) return;

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

      // User cancelled — no error, no state change
      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const selectedAsset = result.assets[0];
      lastPickedAssetRef.current = selectedAsset;
      setLocalImageUri(selectedAsset.uri);
      // Reset previous URL before uploading the new asset
      setUploadedImageUrl(null);
      await performUpload(selectedAsset);
    } catch (err: any) {
      console.error("Image pick error:", err);
      setImageUploadError("Unable to open photo picker. Please try again.");
    } finally {
      setIsPickingImage(false);
    }
  };

  /** Retry upload using the stored last-picked asset (no re-open of picker) */
  const handleRetryUpload = async () => {
    const asset = lastPickedAssetRef.current;
    if (!asset) {
      // No stored asset — fall back to re-opening the picker
      await handlePickImage();
      return;
    }
    await performUpload(asset);
  };

  const handleRemoveImage = () => {
    setLocalImageUri(null);
    setUploadedImageUrl(null);
    setExistingImageUrl(null);
    setImageUploadError(null);
    lastPickedAssetRef.current = null;
  };

  /**
   * Client-side validation mirroring the backend contract (items.controller.js).
   * Surfaces errors before any network request. Backend remains the final authority.
   */
  const errors = useMemo(() => {
    const errs: Record<string, string> = {};

    // Title — mirrors backend: required, min 3, max 150
    if (!title.trim()) {
      errs.title = "Title is required.";
    } else if (title.trim().length < 3) {
      errs.title = "Title must be at least 3 characters.";
    } else if (title.trim().length > 150) {
      errs.title = "Title cannot exceed 150 characters.";
    }

    // Location — mirrors backend: required, max 255
    if (!location.trim()) {
      errs.location = "Location is required.";
    } else if (location.trim().length > 255) {
      errs.location = "Location cannot exceed 255 characters.";
    }

    // Description — mirrors backend: required, min 10
    if (!description.trim()) {
      errs.description = "Description is required.";
    } else if (description.trim().length < 10) {
      errs.description = "Description must be at least 10 characters.";
    }

    // Report date — mirrors backend: required, valid date format, not future
    if (!reportDate.trim()) {
      errs.reportDate = "Report date is required.";
    } else if (!isValidDateFormat(reportDate)) {
      errs.reportDate = "Date must be in YYYY-MM-DD format.";
    } else if (!isRealDate(reportDate)) {
      errs.reportDate = "Please enter a valid calendar date.";
    } else if (!isNotFutureDate(reportDate)) {
      errs.reportDate = "Report date cannot be in the future.";
    }

    return errs;
  }, [title, location, description, reportDate]);

  const isFormValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  /** Returns the error for a field only after it has been touched or submit was attempted */
  const getError = (field: string): string | undefined =>
    touched[field] || submitAttempted ? errors[field] : undefined;

  /** Select a category and clear the inline category error */
  const handleCategorySelect = (id: string) => {
    setCategoryId(id);
    if (id) setCategoryError(null);
  };

  const handleSubmit = async () => {
    // Mark all fields as touched so all inline errors become visible at once
    setSubmitAttempted(true);
    setTouched({
      title: true,
      location: true,
      description: true,
      reportDate: true,
    });

    // 1. Client-side field validation — prevents unnecessary API/upload calls
    if (!isFormValid) return;

    // 2. Category check — shown inline near the chips
    if (!categoryId) {
      setCategoryError("Please select a category before submitting.");
      return;
    }
    setCategoryError(null);

    // 3. Auth check
    if (!currentUserId) {
      Alert.alert("Login Required", "Please log in before reporting or editing an item.", [
        {
          text: "Log In",
          onPress: () => router.push("/(auth)/login" as any),
        },
        { text: "Cancel", style: "cancel" },
      ]);
      return;
    }

    // 4. Block while image is still uploading
    if (isUploadingImage) {
      Alert.alert(
        "Image Uploading",
        "Please wait for the image upload to finish before submitting."
      );
      return;
    }

    // 5. Block if an image was selected but its upload failed
    if (localImageUri && imageUploadError && !uploadedImageUrl) {
      Alert.alert(
        "Image Upload Failed",
        "The selected image could not be uploaded. Please retry or remove the image before submitting."
      );
      return;
    }

    // 6. Duplicate-submission guard (idempotency lock)
    if (isSubmitting) return;
    setIsSubmitting(true);

    // EDIT MODE: Call PATCH /api/items/:id
    if (isEditMode && activeEditId) {
      try {
        const finalImage = uploadedImageUrl || existingImageUrl || "placeholder.png";
        const response = await updateItem(
          activeEditId,
          {
            type,
            title: title.trim(),
            categoryId,
            description: description.trim(),
            location: location.trim(),
            reportDate: reportDate.trim(),
            image: finalImage,
          },
          currentUserId
        );

        // Update shared AppContext state
        if (response.item) {
          setItems((prev) =>
            prev.map((it) => (it.id === response.item.id ? response.item : it))
          );
        }

        Alert.alert("Success", "Your item report has been updated.", [
          {
            text: "View Details",
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.push({
                  pathname: "/report/item/[id]",
                  params: { id: activeEditId },
                } as any);
              }
            },
          },
        ]);
      } catch (err: any) {
        const message =
          err.response?.data?.message ||
          "Failed to update item report. Please try again.";
        Alert.alert("Update Failed", message);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // CREATE MODE: Call POST /api/items
    try {
      const response = await createItem(
        {
          type,
          title: title.trim(),
          categoryId,
          description: description.trim(),
          location: location.trim(),
          reportDate: reportDate.trim(),
          image: uploadedImageUrl || "placeholder.png",
        },
        currentUserId
      );

      // Update global items list with the newly created item
      if (response.item) {
        setItems((prev) => [response.item, ...prev]);
      }

      // Reset form to initial state
      setTitle("");
      setLocation("");
      setDescription("");
      setReportDate(new Date().toISOString().split("T")[0]);
      setLocalImageUri(null);
      setUploadedImageUrl(null);
      setExistingImageUrl(null);
      setImageUploadError(null);
      lastPickedAssetRef.current = null;
      setTouched({});
      setSubmitAttempted(false);
      setCategoryError(null);

      Alert.alert("Success", "Your item report has been published.", [
        {
          text: "View in Feed",
          onPress: () => router.push("/feed" as any),
        },
      ]);
    } catch (err: any) {
      // Show the server's own message; fall back to a generic user-friendly string.
      // Raw Node.js error strings are not exposed to the user.
      const message =
        err.response?.data?.message ||
        "Failed to post item report. Please try again.";
      Alert.alert("Submission Failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReport = () => {
    if (!activeEditId || isDeleting) return;

    Alert.alert(
      "Delete Report?",
      "Are you sure you want to delete this report? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (isDeleting) return;
            setIsDeleting(true);
            try {
              await deleteItem(activeEditId, currentUserId);
              setItems((prev) => prev.filter((i) => i.id !== activeEditId));

              Alert.alert("Deleted", "Your report has been deleted.", [
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
              const msg =
                err.response?.data?.message ||
                "Failed to delete item report. Please try again.";
              Alert.alert("Deletion Failed", msg);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  /**
   * The submit button is disabled (not just loading) during any async operation
   * to prevent accidental double-taps while uploading an image, deleting, or submitting.
   */
  const isSubmitDisabled =
    isSubmitting || isDeleting || isUploadingImage || isPickingImage || (isEditMode && isLoadingItem);

  if (isEditMode && isLoadingItem) {
    return (
      <SafeAreaView edges={["top"]} style={styles.screen}>
        <AppHeader showBack title="Edit Report" />
        <View style={styles.stateContainer}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.stateLoadingText}>Loading report details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isEditMode && itemLoadError) {
    return (
      <SafeAreaView edges={["top"]} style={styles.screen}>
        <AppHeader showBack title="Edit Report" />
        <View style={styles.stateContainer}>
          <Ionicons color={COLORS.danger} name="alert-circle-outline" size={48} />
          <Text style={styles.stateErrorTitle}>Unable to Edit Report</Text>
          <Text style={styles.stateErrorMessage}>{itemLoadError}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.push("/feed" as any);
              }
            }}
            style={styles.stateBackButton}
          >
            <Text style={styles.stateBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <AppHeader
        showBack={isEditMode}
        subtitle={
          isEditMode
            ? "Update your lost or found item details"
            : "Report a lost or found item to the community"
        }
        title={isEditMode ? "Edit Report" : "Report Item"}
      />
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

          <CategoryDropdown
            categories={categories}
            error={categoryError || categoriesError}
            label="Category"
            loading={loadingCategories}
            onRetry={fetchCategories}
            onSelect={handleCategorySelect}
            placeholder="Select a category..."
            selectedId={categoryId}
          />

          {/* Item Photo Section */}
          <Text style={styles.label}>Item Photo</Text>
          {!localImageUri ? (
            <TouchableOpacity
              activeOpacity={0.75}
              disabled={isPickingImage || isUploadingImage}
              onPress={handlePickImage}
              style={styles.imagePickerButton}
            >
              <View style={styles.imagePickerIconCircle}>
                {isPickingImage ? (
                  <ActivityIndicator color={COLORS.primary} size="small" />
                ) : (
                  <Ionicons color={COLORS.primary} name="camera-outline" size={24} />
                )}
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
                    onPress={handleRetryUpload}
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
                  disabled={isUploadingImage || isPickingImage}
                  onPress={handlePickImage}
                  style={styles.changeImageButton}
                >
                  <Ionicons color={COLORS.primary} name="refresh-outline" size={16} />
                  <Text style={styles.changeImageText}>Change Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={isUploadingImage || isPickingImage}
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
            error={getError("reportDate")}
            label="Report Date (YYYY-MM-DD)"
            onBlur={() => setTouched((p) => ({ ...p, reportDate: true }))}
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
        <PrimaryButton
          disabled={isSubmitDisabled}
          label={isEditMode ? "Save Changes" : `Post ${type} Item Report`}
          loading={isSubmitting}
          onPress={handleSubmit}
        />

        {isEditMode && (
          <TouchableOpacity
            accessibilityLabel="Delete report"
            accessibilityRole="button"
            disabled={isSubmitDisabled}
            onPress={handleDeleteReport}
            style={[styles.deleteReportButton, isDeleting && styles.disabledButton]}
          >
            {isDeleting ? (
              <ActivityIndicator color={COLORS.danger} size="small" />
            ) : (
              <>
                <Ionicons color={COLORS.danger} name="trash-outline" size={18} />
                <Text style={styles.deleteReportButtonText}>Delete Report</Text>
              </>
            )}
          </TouchableOpacity>
        )}
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
  stateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  stateLoadingText: {
    color: COLORS.textMuted,
    fontSize: 15,
    marginTop: SPACING.md,
  },
  stateErrorTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
    marginTop: SPACING.md,
  },
  stateErrorMessage: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: "center",
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  stateBackButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  stateBackButtonText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: "700",
  },
  deleteReportButton: {
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: SPACING.xs,
    justifyContent: "center",
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
  },
  deleteReportButtonText: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.6,
  },
});