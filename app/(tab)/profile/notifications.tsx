import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import AppHeader from "@/components/app-header";
import PrimaryButton from "@/components/PrimaryButton";

import { COLORS, SPACING } from "@/constants/theme";

export default function NotificationsScreen() {
  const notifications = [
    {
      id: "1",
      title: "Welcome to LostLink",
      message:
        "Stay updated about your reported items and claims.",
    },
    {
      id: "2",
      title: "Safety Reminder",
      message:
        "Always verify ownership before handing over a found item.",
    },
  ];

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader title="Notifications" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              No notifications
            </Text>

            <Text style={styles.emptyText}>
              You don't have any notifications yet.
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {notifications.map((notification) => (
              <View
                key={notification.id}
                style={styles.notificationCard}
              >
                <Text style={styles.notificationTitle}>
                  {notification.title}
                </Text>

                <Text style={styles.notificationMessage}>
                  {notification.message}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Back to Profile"
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    padding: SPACING.lg,
    paddingBottom: 32,
  },

  listContainer: {
    gap: 12,
  },

  notificationCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
  },

  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },

  buttonContainer: {
    marginTop: 28,
  },
});