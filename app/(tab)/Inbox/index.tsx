import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet } from "react-native";

import AppHeader from "@/components/app-header";
import ConversationRow from "@/components/conversation-row";
import EmptyState from "@/components/empty-state";
import SearchBar from "@/components/search-bar";
import { COLORS } from "@/constants/theme";

import { useApp } from "@/context/AppContext";
import { ConversationThread } from "@/types";

export default function InboxScreen() {
  const [query, setQuery] = useState("");
  const { currentUserId, items, messages, users } = useApp();

  const threads = useMemo<ConversationThread[]>(() => {
    const map = new Map<string, ConversationThread>();

    messages.forEach((message) => {
      if (message.senderId !== currentUserId && message.receiverId !== currentUserId) {
        return;
      }

      const otherUserId = message.senderId === currentUserId ? message.receiverId : message.senderId;
      const participant = users.find((user) => user.id === otherUserId);
      const item = items.find((candidate) => candidate.id === message.itemId);

      if (!participant || !item) {
        return;
      }

      const existing = map.get(message.conversationId);
      const isNewer = !existing || new Date(message.sentAt) > new Date(existing.latestMessage.sentAt);

      if (isNewer) {
        map.set(message.conversationId, {
          conversationId: message.conversationId,
          item,
          latestMessage: message,
          participant,
          unreadCount: 0,
        });
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.latestMessage.sentAt).getTime() - new Date(a.latestMessage.sentAt).getTime(),
    );
  }, [currentUserId, items, messages, users]);

  const filteredThreads = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return threads;
    }

    return threads.filter(
      (thread) =>
        thread.participant.name.toLowerCase().includes(trimmed) ||
        thread.item.title.toLowerCase().includes(trimmed) ||
        thread.latestMessage.text.toLowerCase().includes(trimmed),
    );
  }, [query, threads]);

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader title="Inbox" />
      <SearchBar onChangeText={setQuery} placeholder="Search messages or items..." value={query} />

      <FlatList
        contentContainerStyle={{ paddingBottom: 24 }}
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
              router.push({ pathname: "/Inbox/[conversationId]", params: { conversationId } } as any)
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
