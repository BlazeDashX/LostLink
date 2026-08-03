import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, View } from "react-native";

import AppHeader from "@/components/app-header";
import ClaimShortcutCard from "@/components/claim-shortcut-card";
import EmptyState from "@/components/empty-state";
import MessageBubble from "@/components/message-bubble";
import MessageComposer from "@/components/message-composer";
import { COLORS, SPACING } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

export default function ChatScreen() {
  const { conversationId, itemId: paramItemId } = useLocalSearchParams() as {
    conversationId: string;
    itemId?: string;
  };
  const [draft, setDraft] = useState("");
  
  const {
    claims,
    currentUserId,
    items,
    messages,
    setMessages,
    users,
  } = useApp();

  const conversationMessages = useMemo(() => {
    return messages
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
  }, [conversationId, messages]);

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
      const otherUserId = activeMessage.senderId === currentUserId ? activeMessage.receiverId : activeMessage.senderId;
      return users.find((user) => user.id === otherUserId);
    }
    if (item) {
      const otherUserId = item.reporterId === currentUserId ? undefined : item.reporterId;
      return users.find((user) => user.id === otherUserId);
    }
    return undefined;
  }, [activeMessage, currentUserId, item, users]);

  const pendingClaim = useMemo(() => {
    if (!item) return undefined;
    return claims.find((claim) => claim.itemId === item.id && claim.status === "Pending");
  }, [claims, item]);

  const currentUserClaim = useMemo(() => {
    if (!item) return undefined;
    return claims.find((claim) => claim.itemId === item.id && claim.claimantId === currentUserId);
  }, [claims, currentUserId, item]);

  useEffect(() => {
    if (!activeMessage) return;

    setMessages((prev) =>
      prev.map((message) => {
        if (message.conversationId === conversationId && message.receiverId === currentUserId && !message.read) {
          return { ...message, read: true };
        }
        return message;
      }),
    );
  }, [activeMessage, conversationId, currentUserId, setMessages]);

  const handleSend = () => {
    if (!draft.trim() || !otherUser || !item) return;

    const newMessage = {
      id: `MSG${Date.now()}`,
      conversationId,
      itemId: item.id,
      senderId: currentUserId,
      receiverId: otherUser.id,
      text: draft.trim(),
      sentAt: new Date().toISOString(),
      read: false,
    };

    setMessages((prev) => [...prev, newMessage]);
    setDraft("");
  };

  if (!conversationId || !item || !otherUser) {
    return (
      <SafeAreaView style={styles.screen}>
        <AppHeader showBack title="Conversation" />
        <EmptyState icon="chatbubble-ellipses-outline" message="This conversation could not be loaded." title="Chat unavailable" />
      </SafeAreaView>
    );
  }

  const isReporter = item.reporterId === currentUserId;
  const canSubmitClaim = !isReporter && !currentUserClaim && item.status === "Active";

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader showBack subtitle={item.title} title={otherUser.name} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <View style={styles.itemStrip}>
          <Text style={styles.itemType}>{item.type}</Text>
          <Text numberOfLines={1} style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemStatus}>{item.status}</Text>
        </View>

        {isReporter && pendingClaim ? (
          <ClaimShortcutCard
            actionLabel="Review claim"
            message="A claimant has submitted private ownership evidence for this item."
            onPress={() => router.push({ pathname: "/report/claim/review", params: { claimId: pendingClaim.id } } as any)}
            title="Pending ownership claim"
          />
        ) : canSubmitClaim ? (
          <ClaimShortcutCard
            actionLabel="Submit claim"
            message="Think this item is yours? Send private ownership evidence to the reporter."
            onPress={() => router.push({ pathname: "/report/claim", params: { itemId: item.id } } as any)}
            title="Claim this item safely"
          />
        ) : currentUserClaim ? (
          <ClaimShortcutCard
            actionLabel="View claim status"
            message={`Your claim is currently ${currentUserClaim.status.toLowerCase()}.`}
            onPress={() => router.push({ pathname: "/report/claim/review", params: { claimId: currentUserClaim.id } } as any)}
            title="Claim already submitted"
          />
        ) : null}

        <FlatList
          contentContainerStyle={styles.messageList}
          data={conversationMessages}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => <MessageBubble isOwn={item.senderId === currentUserId} message={item} />}
        />

        <MessageComposer onChangeText={setDraft} onSend={handleSend} value={draft} />
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
});