import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, View } from "react-native";

import AppHeader from "@/components/app-header";
import ClaimShortcutCard from "@/components/claim-shortcut-card";
import EmptyState from "@/components/empty-state";
import MessageBubble from "@/components/message-bubble";
import MessageComposer from "@/components/message-composer";
import { COLORS, SPACING } from "@/constants/theme";
import { useApp } from "../context/AppContext";

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams() as { conversationId: string };
  const [draft, setDraft] = useState("");
  
  const {
    claims,
    currentUserId,
    items,
    messages,
    setMessages,
    users,
  } = useApp();

  const conversationMessages = useMemo(
    () =>
      messages
        .filter((message) => message.conversationId === conversationId)
        .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()),
    [conversationId, messages],
  );

  const latestMessage = conversationMessages.at(-1);
  const item = items.find((candidate) => candidate.id === latestMessage?.itemId);
  
  const participantId = latestMessage
    ? latestMessage.senderId === currentUserId
      ? latestMessage.receiverId
      : latestMessage.senderId
    : undefined;
  const participant = users.find((user) => user.id === participantId);
  const currentUser = users.find((user) => user.id === currentUserId);

  useEffect(() => {
    if (conversationId) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.conversationId === conversationId && msg.receiverId === currentUserId
            ? { ...msg, read: true }
            : msg
        )
      );
    }
  }, [conversationId, currentUserId, setMessages]);

  if (!conversationId || !latestMessage || !item || !participant || !currentUser) {
    return (
      <SafeAreaView style={styles.screen}>
        <AppHeader showBack title="Chat" />
        <EmptyState
          icon="alert-circle-outline"
          message="The conversation, item, or participant reference is invalid."
          title="Conversation unavailable"
        />
      </SafeAreaView>
    );
  }

  const pendingClaim = claims.find(
    (claim) => claim.itemId === item.id && claim.status === "Pending",
  );
  const currentUserClaim = claims.find(
    (claim) =>
      claim.itemId === item.id &&
      claim.claimantId === currentUser.id &&
      ["Pending", "Approved"].includes(claim.status),
  );
  const isReporter = item.reporterId === currentUser.id;
  const canSubmitClaim =
    !isReporter &&
    !currentUserClaim &&
    ["Active", "Pending Claim"].includes(item.status);

  const handleSend = () => {
    if (!draft.trim()) return;

    const newMessage = {
      id: `msg-${Date.now()}`,
      conversationId,
      itemId: item.id,
      senderId: currentUserId,
      receiverId: participant.id,
      text: draft.trim(),
      sentAt: new Date().toISOString(),
      read: false,
    };

    setMessages((prev) => [...prev, newMessage]);
    setDraft("");
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <AppHeader showBack subtitle={item.title} title={participant.name} />
        <View style={styles.itemStrip}>
          <Text style={styles.itemType}>{item.type}</Text>
          <Text numberOfLines={1} style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemStatus}>{item.status}</Text>
        </View>

        {isReporter && pendingClaim ? (
          <ClaimShortcutCard
            actionLabel="Review claim"
            message="A claimant has submitted private ownership evidence for this item."
            onPress={() => router.push({ pathname: "/claim/review", params: { claimId: pendingClaim.id } } as any)}
            title="Pending ownership claim"
          />
        ) : canSubmitClaim ? (
          <ClaimShortcutCard
            actionLabel="Submit claim"
            message="Think this item is yours? Send private ownership evidence to the reporter."
            onPress={() => router.push({ pathname: "/claim/submit", params: { itemId: item.id } } as any)}
            title="Claim this item safely"
          />
        ) : currentUserClaim ? (
          <ClaimShortcutCard
            actionLabel="View claim status"
            message={`Your claim is currently ${currentUserClaim.status.toLowerCase()}.`}
            onPress={() => router.push({ pathname: "/claim/review", params: { claimId: currentUserClaim.id } } as any)}
            title="Claim already submitted"
          />
        ) : null}

        <FlatList
          contentContainerStyle={styles.messageList}
          data={conversationMessages}
          keyExtractor={(message) => message.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item: message }) => (
            <MessageBubble isOwn={message.senderId === currentUserId} message={message} />
          )}
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
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  itemType: { color: COLORS.primary, fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  itemTitle: { color: COLORS.text, flex: 1, fontSize: 13, fontWeight: "700" },
  itemStatus: { color: COLORS.textMuted, fontSize: 11 },
  messageList: { paddingBottom: SPACING.md, paddingTop: SPACING.md },
});