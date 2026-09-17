import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "@/components/app-header";
import EmptyState from "@/components/empty-state";
import PrimaryButton from "@/components/primary-button";
import StatusBadge from "@/components/status-badge";
import categoriesData from "@/data/categories.json";
import { COLORS, SPACING } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { getClaims } from "@/services/claims";
import { findOrCreateConversation } from "@/services/conversations";
import { deleteItem, getItemById } from "@/services/items";
import { resolveItemImageUrl } from "@/services/imageUtils";
import { Claim, Item, Message } from "@/types";
import { appAlert, appConfirm } from "@/utils/alert";

type CategoryItem = {
  id: string;
  name: string;
  active: boolean;
};

export default function ItemDetailsScreen() {
  const { id, from } = useLocalSearchParams() as { id: string; from?: string };
  const {
    claims,
    currentUserId,
    currentUser: contextUser,
    items,
    setItems,
    messages,
    setMessages,
    users,
  } = useApp();
  const [isDeleting, setIsDeleting] = useState(false);
  const [fetchedItem, setFetchedItem] = useState<Item | null>(null);
  const [fetchedClaims, setFetchedClaims] = useState<Claim[]>([]);
  const [isLoadingClaims, setIsLoadingClaims] = useState(false);
  const [isContacting, setIsContacting] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    getItemById(id)
      .then((data) => {
        if (isMounted && data) {
          setFetchedItem(data);
          setItems((prev) =>
            prev.map((i) => (i.id === data.id ? { ...i, ...data } : i))
          );
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch fresh item from API:", err);
      });
    return () => {
      isMounted = false;
    };
  }, [id, setItems]);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setIsLoadingClaims(true);
    getClaims({ itemId: id }, currentUserId)
      .then((data) => {
        if (isMounted) setFetchedClaims(data);
      })
      .catch((err) => {
        console.warn("Failed to fetch claims for item:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingClaims(false);
      });
    return () => {
      isMounted = false;
    };
  }, [id, currentUserId]);

  const itemClaims = useMemo(() => {
    const list = [...fetchedClaims];
    claims.forEach((c) => {
      if (c.itemId === id && !list.some((existing) => existing.id === c.id)) {
        list.push(c);
      }
    });
    return list;
  }, [fetchedClaims, claims, id]);

  const rawItem = fetchedItem || items.find((candidate) => candidate.id === id);

  const effectiveStatus = useMemo(() => {
    if (itemClaims.some((c) => c.status === "Completed")) return "Solved";
    if (itemClaims.some((c) => c.status === "Approved")) return "Reserved";
    if (itemClaims.some((c) => c.status === "Pending")) return "Pending Claim";
    return rawItem?.status || "Active";
  }, [itemClaims, rawItem?.status]);

  const item = useMemo(() => {
    if (!rawItem) return undefined;
    return {
      ...rawItem,
      status: effectiveStatus,
    };
  }, [rawItem, effectiveStatus]);

  const itemImageUrl = useMemo(
    () => resolveItemImageUrl(item?.image),
    [item?.image]
  );

  const reporter = users.find((user) => user.id === item?.reporterId);
  const category = (categoriesData as CategoryItem[]).find(
    (c) => c.id === item?.categoryId
  );

  const isReporter = item?.reporterId === currentUserId;
  const currentUser = contextUser || users.find((user) => user.id === currentUserId);
  const isReporterOrAdmin = isReporter || currentUser?.role === "Admin";

  const currentUserClaim = useMemo(() => {
    if (!item) return undefined;
    return claims.find(
      (claim) => claim.itemId === item.id && claim.claimantId === currentUserId
    );
  }, [claims, currentUserId, item]);

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

  if (!id || !item) {
    return (
      <SafeAreaView edges={["top"]} style={styles.screen}>
        <AppHeader onPressBack={handleBack} showBack title="Item Details" />
        <EmptyState
          icon="alert-circle-outline"
          message="The requested item could not be found or has been removed."
          title="Item Not Found"
        />
      </SafeAreaView>
    );
  }

  const handleContactReporter = async () => {
    if (!reporter || !currentUserId || isContacting) return;

    if (currentUserId === reporter.id) {
      const selfMsg = "You cannot message yourself about your own report.";
      if (Platform.OS === "web") {
        window.alert(selfMsg);
      } else {
        Alert.alert("Notice", selfMsg);
      }
      return;
    }

    // Prevent aria-hidden focus retain warning on web
    if (Platform.OS === "web" && typeof document !== "undefined") {
      (document.activeElement as HTMLElement)?.blur?.();
    }

    setIsContacting(true);
    try {
      const res = await findOrCreateConversation(
        item.id,
        currentUserId,
        reporter.id,
        currentUserId
      );

      router.push({
        pathname: "/Inbox/[conversationId]",
        params: {
          conversationId: res.conversation.id,
          itemId: item.id,
        },
      } as any);
    } catch (err: any) {
      console.error("Error initiating conversation with reporter:", err);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to start conversation. Please check your connection.";
      if (Platform.OS === "web") {
        window.alert(errMsg);
      } else {
        Alert.alert("Error", errMsg);
      }
    } finally {
      setIsContacting(false);
    }
  };

  const handleClaimItem = () => {
    router.push({
      pathname: "/report/claim",
      params: { itemId: item.id },
    } as any);
  };

  const handleViewClaimStatus = () => {
    if (!currentUserClaim) return;
    router.push({
      pathname: "/report/claim/review",
      params: {
        claimId: currentUserClaim.id,
        from: from || (currentUser?.role === "Admin" ? "admin" : undefined),
      },
    } as any);
  };

  const handleDeleteReport = () => {
    if (isDeleting) return;

    appConfirm(
      "Delete Report?",
      `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
      async () => {
        if (isDeleting) return;
        setIsDeleting(true);
        try {
          await deleteItem(item.id, currentUserId);
          setItems((prev) => prev.filter((i) => i.id !== item.id));

          appAlert("Deleted", "Your report has been deleted successfully.", () => {
            if (from === "admin" || currentUser?.role === "Admin") {
              router.replace("/(admin)/admin-management" as any);
            } else if (router.canGoBack()) {
              router.back();
            } else {
              router.push("/feed" as any);
            }
          });
        } catch (err: any) {
          const msg =
            err.response?.data?.message ||
            "Failed to delete item report. Please try again.";
          appAlert("Deletion Failed", msg);
        } finally {
          setIsDeleting(false);
        }
      },
      undefined,
      "Delete"
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <AppHeader
        onPressBack={handleBack}
        showBack
        subtitle={`Item Ref: ${item.id}`}
        title="Item Details"
      />

      <ScrollView contentContainerStyle={styles.content}>
        {itemImageUrl && !imageError ? (
          <View style={styles.heroImageCard}>
            <Image
              source={{ uri: itemImageUrl }}
              style={styles.heroImage}
              contentFit="cover"
              transition={300}
              onError={() => setImageError(true)}
            />
          </View>
        ) : null}

        <View style={styles.mainCard}>
          <View style={styles.headerRow}>
            <View style={styles.iconContainer}>
              {itemImageUrl && !imageError ? (
                <Image
                  source={{ uri: itemImageUrl }}
                  style={styles.thumbImage}
                  contentFit="cover"
                />
              ) : (
                <Ionicons color={COLORS.primary} name="cube-outline" size={36} />
              )}
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
              <Text style={styles.reporterName}>{reporter?.name || "Community Member"}</Text>
              <Text style={styles.reporterRole}>
                {reporter?.role ? `Role: ${reporter.role}` : "Verified Reporter"}
              </Text>
            </View>
          </View>
        </View>

        {/* Claims for Reporter/Admin Section */}
        {isReporterOrAdmin ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons color={COLORS.primary} name="shield-checkmark-outline" size={20} />
                <Text style={styles.claimsSectionTitle}>Claims Received</Text>
              </View>
              <View style={styles.claimsCountBadge}>
                <Text style={styles.claimsCountText}>
                  {itemClaims.length} {itemClaims.length === 1 ? "claim" : "claims"}
                </Text>
              </View>
            </View>

            {isLoadingClaims ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.lg }} />
            ) : itemClaims.length > 0 ? (
              <View style={{ gap: SPACING.sm, marginTop: SPACING.xs }}>
                {itemClaims.map((c) => {
                  const claimantUser = users.find((u) => u.id === c.claimantId);
                  const claimantName =
                    claimantUser?.name || (c as any).claimantName || `Claimant (${c.claimantId})`;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      accessibilityLabel={`Review claim ${c.id} from ${claimantName}`}
                      accessibilityRole="button"
                      onPress={() => {
                        router.push({
                          pathname: "/report/claim/review",
                          params: {
                            claimId: c.id,
                            from: from || (currentUser?.role === "Admin" ? "admin" : undefined),
                          },
                        } as any);
                      }}
                      style={styles.claimListItem}
                    >
                      <View style={styles.claimantAvatarCircle}>
                        <Text style={styles.claimantAvatarText}>
                          {claimantName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.claimantItemName}>{claimantName}</Text>
                        <Text style={styles.claimantItemSub}>
                          Handover: {c.handoverMethod || "Standard"}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end", gap: 4 }}>
                        <StatusBadge status={c.status} />
                        <View style={styles.reviewLinkRow}>
                          <Text style={styles.reviewLinkText}>Review Evidence</Text>
                          <Ionicons color={COLORS.primary} name="chevron-forward" size={14} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.noClaimsNotice}>
                <Ionicons color={COLORS.textMuted} name="document-text-outline" size={28} />
                <Text style={styles.noClaimsTitle}>No Claims Submitted Yet</Text>
                <Text style={styles.noClaimsSub}>
                  When someone submits an ownership claim for this item, their answers will appear here for you to review evidence, chat with them, and approve or reject.
                </Text>
              </View>
            )}
          </View>
        ) : null}

        <View style={styles.actionsContainer}>
          {currentUserClaim ? (
            <View style={styles.claimStatusBox}>
              <Text style={styles.claimStatusTitle}>
                Your Claim Status: {currentUserClaim.status}
              </Text>
              <Text style={styles.claimStatusSub}>
                You submitted private evidence for this item.
              </Text>
              <PrimaryButton
                label="View Claim Details"
                onPress={handleViewClaimStatus}
              />
            </View>
          ) : isReporterOrAdmin ? (
            <View style={{ gap: SPACING.md }}>
              <View style={styles.reporterNotice}>
                <Ionicons color={COLORS.primary} name="information-circle-outline" size={20} />
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
                    params: {
                      editId: item.id,
                      from: from || (currentUser?.role === "Admin" ? "admin" : undefined),
                    },
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
                <PrimaryButton
                  label="Submit Ownership Claim"
                  onPress={handleClaimItem}
                />
              ) : null}
              {reporter ? (
                <View style={styles.buttonSpacing}>
                  <PrimaryButton
                    disabled={isContacting}
                    loading={isContacting}
                    label="Contact Reporter"
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
  heroImageCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 240,
    marginBottom: SPACING.md,
    overflow: "hidden",
  },
  heroImage: {
    height: "100%",
    width: "100%",
  },
  thumbImage: {
    height: "100%",
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
    overflow: "hidden",
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
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs, marginTop: SPACING.xs },
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
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: "800", marginBottom: SPACING.md },
  infoRow: { alignItems: "center", flexDirection: "row", gap: SPACING.xs, marginBottom: SPACING.xs },
  infoText: { color: COLORS.textMuted, fontSize: 14 },
  descriptionLabel: { color: COLORS.text, fontSize: 14, fontWeight: "700", marginBottom: 4, marginTop: SPACING.md },
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
  buttonSpacing: { marginTop: SPACING.md },
  claimStatusBox: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.primary,
    borderRadius: 14,
    borderWidth: 1,
    padding: SPACING.md,
  },
  claimStatusTitle: { color: COLORS.primary, fontSize: 15, fontWeight: "800", marginBottom: 2 },
  claimStatusSub: { color: COLORS.textMuted, fontSize: 13, marginBottom: SPACING.md },
  reporterNotice: {
    alignItems: "center",
    backgroundColor: COLORS.primaryLight + "44",
    borderRadius: 12,
    flexDirection: "row",
    gap: SPACING.xs,
    padding: SPACING.md,
  },
  reporterNoticeText: { color: COLORS.primary, fontSize: 14, fontWeight: "600" },
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
  deleteButtonText: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.6,
  },
  sectionHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  claimsSectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  claimsCountBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  claimsCountText: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: "700",
  },
  claimListItem: {
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  claimantAvatarCircle: {
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  claimantAvatarText: {
    color: COLORS.primaryDark,
    fontSize: 14,
    fontWeight: "800",
  },
  claimantItemName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  claimantItemSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  reviewLinkRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
    marginTop: 2,
  },
  reviewLinkText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  noClaimsNotice: {
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: SPACING.lg,
  },
  noClaimsTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    marginTop: SPACING.xs,
  },
  noClaimsSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
    textAlign: "center",
  },
});
