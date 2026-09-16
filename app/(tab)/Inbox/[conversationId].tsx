import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppHeader from "@/components/app-header";
import ClaimShortcutCard from "@/components/claim-shortcut-card";
import EmptyState from "@/components/empty-state";
import MessageBubble from "@/components/message-bubble";
import MessageComposer from "@/components/message-composer";
import { COLORS, SPACING } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { api } from "@/services/api";
import {
  findOrCreateConversation,
  getConversationDetails,
  getMessages,
  markAsRead,
  sendMessage as apiSendMessage,
} from "@/services/conversations";
import { getItemById } from "@/services/items";
import { Item, Message, SafeUser } from "@/types";

export default function ChatScreen() {
  const { conversationId, itemId: paramItemId } = useLocalSearchParams() as {
    conversationId: string;
    itemId?: string;
  };
  const [draft, setDraft] = useState("");
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSharingLocation, setIsSharingLocation] = useState(false);

  // Standalone metadata for empty/new conversations
  const [metaItem, setMetaItem] = useState<Item | null>(null);
  const [metaOtherUser, setMetaOtherUser] = useState<SafeUser | null>(null);

  const flatListRef = useRef<FlatList>(null);

  const { claims, currentUserId, items, users } = useApp();

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const loadMessages = useCallback(
    async (isRefresh = false) => {
      if (!conversationId) {
        setIsLoading(false);
        setError("Invalid conversation ID.");
        return;
      }

      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        // 1. Fetch messages via service
        const msgs = await getMessages(conversationId, currentUserId);
        setConversationMessages(msgs);

        // 2. Mark unread messages as read
        if (currentUserId) {
          markAsRead(conversationId, currentUserId)
            .then(() => {
              // Locally mark received messages as read
              setConversationMessages((prev) =>
                prev.map((m) =>
                  m.receiverId === currentUserId ? { ...m, read: true } : m
                )
              );
            })
            .catch((e) => console.log("Mark read notice:", e.message));
        }

        // 3. Fetch conversation details to populate thread header & metadata
        try {
          const conv = await getConversationDetails(conversationId, currentUserId);
          if (conv) {
            const otherId =
              conv.participant_one_id === currentUserId
                ? conv.participant_two_id
                : conv.participant_one_id;

            const resolvedUser = users.find((u) => u.id === otherId);
            if (resolvedUser) {
              setMetaOtherUser(resolvedUser);
            } else {
              setMetaOtherUser({
                id: otherId,
                name:
                  conv.participant_one_id === otherId
                    ? conv.p1_name || "User"
                    : conv.p2_name || "User",
                email: "N/A",
                phone: "N/A",
                role: "User",
                status: "Active",
                avatar:
                  conv.participant_one_id === otherId
                    ? conv.p1_avatar || ""
                    : conv.p2_avatar || "",
              });
            }

            if (conv.item_id) {
              const existingItem = items.find((i) => i.id === conv.item_id);
              if (existingItem) {
                setMetaItem(existingItem);
              } else {
                try {
                  const fetchedItem = await getItemById(conv.item_id);
                  setMetaItem(fetchedItem);
                } catch {
                  // Fallback item from conv join
                  setMetaItem({
                    id: conv.item_id,
                    title: conv.item_title || "Reported Item",
                    type: conv.item_type || "Lost",
                    status: conv.item_status || "Active",
                    categoryId: "",
                    description: "",
                    location: "",
                    reportDate: "",
                    image: conv.item_image || "",
                    reporterId: conv.item_reporter_id || "",
                    createdAt: "",
                  });
                }
              }
            }
          }
        } catch (convErr) {
          console.log("Could not load thread metadata:", convErr);
        }
      } catch (err: any) {
        console.error("Error loading chat messages:", err);

        // Auto-recovery if conversationId was a client-side mock or not found
        if (err.response?.status === 404 && paramItemId && currentUserId) {
          try {
            const targetItem =
              items.find((i) => i.id === paramItemId) ||
              (await getItemById(paramItemId));
            if (
              targetItem &&
              targetItem.reporterId &&
              targetItem.reporterId !== currentUserId
            ) {
              const res = await findOrCreateConversation(
                targetItem.id,
                currentUserId,
                targetItem.reporterId,
                currentUserId
              );
              if (res?.conversation?.id && res.conversation.id !== conversationId) {
                router.replace({
                  pathname: "/Inbox/[conversationId]",
                  params: {
                    conversationId: res.conversation.id,
                    itemId: targetItem.id,
                  },
                } as any);
                return;
              }
            }
          } catch (autoErr) {
            console.log("Auto-recovery conversation failed:", autoErr);
          }
        }

        setError(
          err.response?.data?.message ||
            "Unable to load chat messages. Please check your connection."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [conversationId, currentUserId, items, paramItemId, users]
  );

  useEffect(() => {
    loadMessages(false);
  }, [loadMessages]);

  const activeMessage = conversationMessages[0];

  const item: Item | undefined = useMemo(() => {
    if (metaItem) return metaItem;
    if (activeMessage?.itemId) {
      const found = items.find((candidate) => candidate.id === activeMessage.itemId);
      if (found) return found;
    }
    if (paramItemId) {
      return items.find((candidate) => candidate.id === paramItemId);
    }
    return undefined;
  }, [activeMessage, items, metaItem, paramItemId]);

  const otherUser: SafeUser | undefined = useMemo(() => {
    if (metaOtherUser) return metaOtherUser;
    if (activeMessage) {
      const otherUserId =
        activeMessage.senderId === currentUserId
          ? activeMessage.receiverId
          : activeMessage.senderId;
      const found = users.find((user) => user.id === otherUserId);
      if (found) return found;
      return {
        id: otherUserId,
        name:
          activeMessage.senderId === currentUserId
            ? (activeMessage as any).receiverName || "User"
            : (activeMessage as any).senderName || "User",
        email: "N/A",
        phone: "N/A",
        role: "User",
        status: "Active",
        avatar:
          activeMessage.senderId === currentUserId
            ? (activeMessage as any).receiverAvatar || ""
            : (activeMessage as any).senderAvatar || "",
      };
    }
    if (item) {
      const otherUserId =
        item.reporterId === currentUserId ? undefined : item.reporterId;
      return users.find((user) => user.id === otherUserId);
    }
    return undefined;
  }, [activeMessage, currentUserId, item, metaOtherUser, users]);

  const pendingClaim = useMemo(() => {
    if (!item) return undefined;
    return claims.find(
      (claim) => claim.itemId === item.id && claim.status === "Pending"
    );
  }, [claims, item]);

  const currentUserClaim = useMemo(() => {
    if (!item) return undefined;
    return claims.find(
      (claim) => claim.itemId === item.id && claim.claimantId === currentUserId
    );
  }, [claims, currentUserId, item]);

  const handleSend = async () => {
    if (!draft.trim() || !otherUser || !item || !currentUserId || isSending)
      return;

    const messageText = draft.trim();
    setIsSending(true);

    try {
      const createdMessage = await apiSendMessage(
        conversationId,
        {
          itemId: item.id,
          senderId: currentUserId,
          receiverId: otherUser.id,
          text: messageText,
        },
        currentUserId
      );

      if (createdMessage) {
        setConversationMessages((prev) => [...prev, createdMessage]);
      } else {
        const fallbackMsg: Message = {
          id: `M${Date.now()}`,
          conversationId,
          itemId: item.id,
          senderId: currentUserId,
          receiverId: otherUser.id,
          text: messageText,
          sentAt: new Date().toISOString(),
          read: false,
        };
        setConversationMessages((prev) => [...prev, fallbackMsg]);
      }

      setDraft("");
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      showAlert(
        "Failed to send message",
        err.response?.data?.message ||
          "Could not send your message. Please check your connection and try again."
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleShareLocation = async () => {
    if (!otherUser || !item || !currentUserId || isSharingLocation || isSending)
      return;

    setIsSharingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED && status !== "granted") {
        showAlert(
          "Location Permission Denied",
          "Permission to access device location was denied. Please enable location permissions in your device settings to share your meeting spot."
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = loc.coords;
      let placeName = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          {
            headers: {
              "User-Agent": "LostLink-MobileApp/1.0 (contact@lostlink.local)",
              Accept: "application/json",
            },
          }
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData && geoData.display_name) {
            placeName = geoData.display_name;
          }
        }
      } catch (geoErr) {
        console.log("Reverse geocoding error, falling back to coords:", geoErr);
      }

      const messageText = `📍 Shared Location:\n${placeName}\nhttps://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}`;

      const createdMessage = await apiSendMessage(
        conversationId,
        {
          itemId: item.id,
          senderId: currentUserId,
          receiverId: otherUser.id,
          text: messageText,
        },
        currentUserId
      );

      if (createdMessage) {
        setConversationMessages((prev) => [...prev, createdMessage]);
      } else {
        const fallbackMsg: Message = {
          id: `M${Date.now()}`,
          conversationId,
          itemId: item.id,
          senderId: currentUserId,
          receiverId: otherUser.id,
          text: messageText,
          sentAt: new Date().toISOString(),
          read: false,
        };
        setConversationMessages((prev) => [...prev, fallbackMsg]);
      }

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      console.error("Location share error:", err);
      showAlert(
        "Location Error",
        "Unable to acquire your current location. Please ensure GPS is enabled and try again."
      );
    } finally {
      setIsSharingLocation(false);
    }
  };

  // Error UI with Retry button
  if (error && !isLoading && conversationMessages.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <AppHeader showBack title="Conversation" />
        <View style={styles.centerLoading}>
          <EmptyState
            icon="alert-circle-outline"
            message={error}
            title="Chat Unavailable"
          />
          <TouchableOpacity
            accessibilityLabel="Retry loading messages"
            accessibilityRole="button"
            onPress={() => loadMessages(false)}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!conversationId || (!item && !isLoading) || (!otherUser && !isLoading)) {
    return (
      <SafeAreaView style={styles.screen}>
        <AppHeader showBack title="Conversation" />
        <EmptyState
          icon="chatbubble-ellipses-outline"
          message="This conversation could not be loaded."
          title="Chat unavailable"
        />
      </SafeAreaView>
    );
  }

  const isReporter = item ? item.reporterId === currentUserId : false;
  const canSubmitClaim =
    item && !isReporter && !currentUserClaim && item.status === "Active";

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader
        showBack
        subtitle={item?.title || "Conversation"}
        title={otherUser?.name || "Chat"}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        {item ? (
          <View style={styles.itemStrip}>
            <Text style={styles.itemType}>{item.type}</Text>
            <Text numberOfLines={1} style={styles.itemTitle}>
              {item.title}
            </Text>
            <Text style={styles.itemStatus}>{item.status}</Text>
          </View>
        ) : null}

        {isReporter && pendingClaim ? (
          <ClaimShortcutCard
            actionLabel="Review claim"
            message="A claimant has submitted private ownership evidence for this item."
            onPress={() =>
              router.push({
                pathname: "/report/claim/review",
                params: { claimId: pendingClaim.id },
              } as any)
            }
            title="Pending ownership claim"
          />
        ) : canSubmitClaim ? (
          <ClaimShortcutCard
            actionLabel="Submit claim"
            message="Think this item is yours? Send private ownership evidence to the reporter."
            onPress={() =>
              router.push({
                pathname: "/report/claim",
                params: { itemId: item.id },
              } as any)
            }
            title="Claim this item safely"
          />
        ) : currentUserClaim ? (
          <ClaimShortcutCard
            actionLabel="View claim status"
            message={`Your claim is currently ${currentUserClaim.status.toLowerCase()}.`}
            onPress={() =>
              router.push({
                pathname: "/report/claim/review",
                params: { claimId: currentUserClaim.id },
              } as any)
            }
            title="Claim already submitted"
          />
        ) : null}

        {isLoading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            contentContainerStyle={styles.messageList}
            data={conversationMessages}
            keyExtractor={(msg) => msg.id}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <EmptyState
                icon="chatbubble-outline"
                message="No messages yet. Say hello and inquire about the item!"
                title="Start the conversation"
              />
            }
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            ref={flatListRef}
            refreshControl={
              <RefreshControl
                colors={[COLORS.primary]}
                onRefresh={() => loadMessages(true)}
                refreshing={isRefreshing}
                tintColor={COLORS.primary}
              />
            }
            renderItem={({ item: msg }) => (
              <MessageBubble
                isOwn={msg.senderId === currentUserId}
                message={msg}
              />
            )}
          />
        )}

        <MessageComposer
          isSharingLocation={isSharingLocation}
          loading={isSending}
          onChangeText={setDraft}
          onSend={handleSend}
          onShareLocation={handleShareLocation}
          value={draft}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.background, flex: 1 },
  flex: { flex: 1 },
  itemStrip: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  itemType: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 6,
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 6,
    paddingVertical: 2,
    textTransform: "uppercase",
  },
  itemTitle: { color: COLORS.text, flex: 1, fontSize: 13, fontWeight: "700" },
  itemStatus: { color: COLORS.textMuted, fontSize: 11, fontWeight: "600" },
  messageList: { padding: SPACING.lg, paddingBottom: SPACING.sm },
  centerLoading: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: SPACING.xl,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 13,
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
});