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
import { Message } from "@/types";

export default function ChatScreen() {
  const { conversationId, itemId: paramItemId } = useLocalSearchParams() as {
    conversationId: string;
    itemId?: string;
  };
  const [draft, setDraft] = useState("");
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  const {
    claims,
    currentUserId,
    items,
    users,
  } = useApp();

  const loadMessages = useCallback(
    async (isRefresh = false) => {
      if (!conversationId) return;

      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const response = await api.get(`/api/conversations/${conversationId}/messages`);
        const msgs: Message[] = response.data.messages || [];
        setConversationMessages(msgs);

        // Mark unread messages as read on server
        if (currentUserId) {
          api
            .patch(`/api/conversations/${conversationId}/read`, {
              userId: currentUserId,
            })
            .catch((e) => console.log("Mark read error:", e.message));
        }
      } catch (err: any) {
        console.error("Error loading chat messages:", err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [conversationId, currentUserId],
  );

  useEffect(() => {
    loadMessages(false);
  }, [loadMessages]);

  const activeMessage = conversationMessages[0];

  const item = useMemo(() => {
    if (activeMessage?.itemId) {
      return items.find((candidate) => candidate.id === activeMessage.itemId);
    }
    if (paramItemId) {
      return items.find((candidate) => candidate.id === paramItemId);
    }
    return undefined;
  }, [activeMessage, items, paramItemId]);

  const otherUser = useMemo(() => {
    if (activeMessage) {
      const otherUserId =
        activeMessage.senderId === currentUserId
          ? activeMessage.receiverId
          : activeMessage.senderId;
      return users.find((user) => user.id === otherUserId);
    }
    if (item) {
      const otherUserId =
        item.reporterId === currentUserId ? undefined : item.reporterId;
      return users.find((user) => user.id === otherUserId);
    }
    return undefined;
  }, [activeMessage, currentUserId, item, users]);

  const pendingClaim = useMemo(() => {
    if (!item) return undefined;
    return claims.find(
      (claim) => claim.itemId === item.id && claim.status === "Pending",
    );
  }, [claims, item]);

  const currentUserClaim = useMemo(() => {
    if (!item) return undefined;
    return claims.find(
      (claim) => claim.itemId === item.id && claim.claimantId === currentUserId,
    );
  }, [claims, currentUserId, item]);

  const handleSend = async () => {
    if (!draft.trim() || !otherUser || !item || !currentUserId || isSending) return;

    const messageText = draft.trim();
    setIsSending(true);

    try {
      const response = await api.post(
        `/api/conversations/${conversationId}/messages`,
        {
          itemId: item.id,
          senderId: currentUserId,
          receiverId: otherUser.id,
          text: messageText,
        },
      );

      const createdMessage: Message = response.data.data;

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
      Alert.alert(
        "Failed to send message",
        err.response?.data?.message ||
          "Could not send your message. Please check your connection and try again.",
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleShareLocation = async () => {
    if (!otherUser || !item || !currentUserId || isSharingLocation || isSending) return;

    setIsSharingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED && status !== "granted") {
        Alert.alert(
          "Location Permission Denied",
          "Permission to access device location was denied. Please enable location permissions in your device settings to share your meeting spot.",
          [{ text: "OK" }],
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
          },
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

      const response = await api.post(
        `/api/conversations/${conversationId}/messages`,
        {
          itemId: item.id,
          senderId: currentUserId,
          receiverId: otherUser.id,
          text: messageText,
        },
      );

      const createdMessage: Message = response.data.data;

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
      Alert.alert(
        "Location Error",
        "Unable to acquire your current location. Please ensure GPS is enabled and try again.",
      );
    } finally {
      setIsSharingLocation(false);
    }
  };

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
            keyExtractor={(item) => item.id}
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
});