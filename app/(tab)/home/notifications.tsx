import { Ionicons } from "@expo/vector-icons";
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import AppHeader from "@/components/app-header";
import EmptyState from "@/components/empty-state";
import { COLORS, SPACING } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

export default function NotificationsScreen() {
  const { currentUserId, notifications, setNotifications } = useApp();

  const userNotifications = notifications.filter((n) => n.userId === currentUserId);
  const unreadCount = userNotifications.filter((n) => !n.read).length;

  const handleMarkAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => (n.userId === currentUserId ? { ...n, read: true } : n))
    );
  };

  const handleMarkSingleAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader showBack subtitle="Updates on your items & claims" title="Notifications" />

      <View style={styles.content}>
        {unreadCount > 0 ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleMarkAllAsRead}
            style={styles.markReadBar}
          >
            <Ionicons color={COLORS.primary} name="checkmark-done-outline" size={18} />
            <Text style={styles.markReadText}>Mark all as read</Text>
          </TouchableOpacity>
        ) : null}

        <FlatList
          contentContainerStyle={{ paddingBottom: 32 }}
          data={userNotifications}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <EmptyState
              icon="notifications-off-outline"
              message="You don't have any notifications right now."
              title="No Notifications"
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleMarkSingleAsRead(item.id)}
              style={[styles.notifCard, !item.read && styles.notifUnread]}
            >
              <View style={styles.notifHeader}>
                <View style={styles.notifTitleRow}>
                  {!item.read ? <View style={styles.unreadDot} /> : null}
                  <Text style={styles.notifTitle}>{item.title}</Text>
                </View>
                <Text style={styles.notifDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.notifMessage}>{item.message}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: COLORS.background, flex: 1 },
  content: { flex: 1, padding: SPACING.lg },
  markReadBar: {
    alignItems: "center",
    alignSelf: "flex-end",
    flexDirection: "row",
    gap: 4,
    marginBottom: SPACING.md,
  },
  markReadText: { color: COLORS.primary, fontSize: 13, fontWeight: "700" },
  notifCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  notifUnread: {
    backgroundColor: COLORS.primaryLight + "33",
    borderColor: COLORS.primary,
  },
  notifHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  notifTitleRow: { alignItems: "center", flexDirection: "row", gap: 6 },
  unreadDot: {
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  notifTitle: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  notifDate: { color: COLORS.textMuted, fontSize: 11 },
  notifMessage: { color: COLORS.textMuted, fontSize: 13, lineHeight: 18 },
});
