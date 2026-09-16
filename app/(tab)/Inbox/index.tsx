import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppHeader from "@/components/app-header";
import ConversationRow from "@/components/conversation-row";
import EmptyState from "@/components/empty-state";
import SearchBar from "@/components/search-bar";
import { COLORS, SPACING } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { api } from "@/services/api";
import { ConversationThread } from "@/types";

export default function InboxScreen() {
  const [query, setQuery] = useState("");
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { currentUserId } = useApp();

  const fetchConversations = useCallback(
    async (isRefresh = false) => {
      if (!currentUserId) {
        setThreads([]);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const response = await api.get(`/api/conversations?userId=${currentUserId}`);
        const data: ConversationThread[] = response.data.conversations || [];
        setThreads(data);
      } catch (err: any) {
        console.error("Error fetching conversations:", err);
        setError(
          err.response?.data?.message ||
            "Unable to load conversations. Please check your connection and try again.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [currentUserId],
  );

  // Reload threads whenever user focuses back on the Inbox screen
  useFocusEffect(
    useCallback(() => {
      fetchConversations(false);
    }, [fetchConversations]),
  );

  const filteredThreads = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return threads;
    }

    return threads.filter((thread) => {
      const participantMatch =
        thread.participant?.name?.toLowerCase().includes(trimmed) ?? false;
      const itemMatch =
        thread.item?.title?.toLowerCase().includes(trimmed) ?? false;
      const messageMatch =
        thread.latestMessage?.text?.toLowerCase().includes(trimmed) ?? false;
      return participantMatch || itemMatch || messageMatch;
    });
  }, [query, threads]);

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader title="Inbox" />
      <SearchBar
        onChangeText={setQuery}
        placeholder="Search messages or items..."
        value={query}
      />

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <EmptyState
            icon="cloud-offline-outline"
            message={error}
            title="Connection Error"
          />
          <TouchableOpacity
            accessibilityLabel="Retry loading conversations"
            accessibilityRole="button"
            activeOpacity={0.75}
            onPress={() => fetchConversations(false)}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={filteredThreads}
          keyExtractor={(item) => item.conversationId}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyState
              icon="mail-open-outline"
              message={
                query
                  ? "No conversations match your search."
                  : "Item-related conversations will appear here."
              }
              title={
                query ? "No matching conversations" : "Your inbox is empty"
              }
            />
          }
          refreshControl={
            <RefreshControl
              colors={[COLORS.primary]}
              onRefresh={() => fetchConversations(true)}
              refreshing={isRefreshing}
              tintColor={COLORS.primary}
            />
          }
          renderItem={({ item }) => (
            <ConversationRow
              onPress={(conversationId: string) =>
                router.push({
                  pathname: "/Inbox/[conversationId]",
                  params: { conversationId },
                } as any)
              }
              thread={item}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.background, flex: 1 },
  listContent: { paddingBottom: 24 },
  centerContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: SPACING.lg,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: SPACING.md,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    marginTop: SPACING.lg,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: "700",
  },
});
