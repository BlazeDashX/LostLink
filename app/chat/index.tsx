import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet } from "react-native";

import AppHeader from "@/components/app-header";
import ConversationRow from "@/components/conversation-row";
import EmptyState from "@/components/empty-state";
import SearchBar from "@/components/search-bar";
import { COLORS } from "@/constants/theme";

import { useApp } from "../context/AppContext";
import { ConversationThread } from "@/types";

export default function InboxScreen() {
  const [query, setQuery] = useState("");
  
  const { currentUserId, items, messages, users } = useApp();

  const threads = useMemo(() => {
    const grouped = new Map<string, typeof messages>();

    messages
      .filter((message) => message.senderId === currentUserId || message.receiverId === currentUserId)
      .forEach((message) => {
        const existing = grouped.get(message.conversationId) ?? [];
        grouped.set(message.conversationId, [...existing, message]);
      });

    return Array.from(grouped.entries())
      .map(([conversationId, threadMessages]): ConversationThread | null => {
        const sortedMessages = [...threadMessages].sort(
          (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
        );
        const latestMessage = sortedMessages.at(-1);
        if (!latestMessage) return null;

        const participantId =
          latestMessage.senderId === currentUserId
            ? latestMessage.receiverId
            : latestMessage.senderId;
        const participant = users.find((user) => user.id === participantId);
        const item = items.find((candidate) => candidate.id === latestMessage.itemId);

        if (!participant || !item) return null;

        const unreadCount = sortedMessages.filter(
          (message) => message.receiverId === currentUserId && !message.read,
        ).length;

        return { conversationId, item, participant, latestMessage, unreadCount };
      })
      .filter((thread): thread is ConversationThread => thread !== null)
      .sort(
        (a, b) =>
          new Date(b.latestMessage.sentAt).getTime() - new Date(a.latestMessage.sentAt).getTime(),
      );
  }, [currentUserId, items, messages, users]);

  const filteredThreads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return threads;

    return threads.filter((thread) =>
      [thread.participant.name, thread.item.title, thread.latestMessage.text]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, threads]);

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader title="Inbox" subtitle={`${threads.length} conversation${threads.length === 1 ? "" : "s"}`} />
      <SearchBar
        onChangeText={setQuery}
        placeholder="Search people, items, or messages"
        value={query}
      />
      <FlatList
        data={filteredThreads}
        keyExtractor={(item) => item.conversationId}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            icon="mail-open-outline"
            message={query ? "No conversations match your search." : "Item-related conversations will appear here."}
            title={query ? "No matching conversations" : "Your inbox is empty"}
          />
        }
        renderItem={({ item }) => (
          <ConversationRow
            onPress={(conversationId: string) =>
              router.push({ pathname: "/chat/[conversationId]", params: { conversationId } } as any)
            }
            thread={item}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.background, flex: 1 },
});