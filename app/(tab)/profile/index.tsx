import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import AppHeader from "@/components/app-header";
import ProfileSummary from "@/components/profile-summary";
import ProfileMenuRow from "@/components/profile-menu-row";
import PrimaryButton from "@/components/PrimaryButton";

import { COLORS, SPACING } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { SafeUser } from "@/types";
import { api } from "@/services/api";

export default function ProfileScreen() {
  const { currentUserId, logout } = useApp();

  const [profile, setProfile] = useState<SafeUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUserId) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }

      try {
        setProfileLoading(true);
        setProfileError("");

        const response = await api.get(
          `/api/users/${currentUserId}`,
          {
            headers: {
              "x-user-id": currentUserId,
            },
          }
        );

        setProfile(response.data.data);
      } catch (error: any) {
        console.error("Failed to load profile:", error);

        setProfileError(
          error.response?.data?.message ||
            "Failed to load profile. Please try again."
        );
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [currentUserId]);

  const handleLogout = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmed) return;

    await logout();
    router.replace("/(auth)/login");
  };

  const handleRetry = () => {
    if (!currentUserId) return;

    setProfileLoading(true);
    setProfileError("");

    api
      .get(`/api/users/${currentUserId}`, {
        headers: {
          "x-user-id": currentUserId,
        },
      })
      .then((response) => {
        setProfile(response.data.data);
      })
      .catch((error: any) => {
        console.error("Failed to reload profile:", error);

        setProfileError(
          error.response?.data?.message ||
            "Failed to load profile. Please try again."
        );
      })
      .finally(() => {
        setProfileLoading(false);
      });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader title="Profile" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {profileLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" />
            <Text style={styles.statusText}>
              Loading profile...
            </Text>
          </View>
        ) : profileError ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>
              {profileError}
            </Text>

            <PrimaryButton
              title="Retry"
              onPress={handleRetry}
            />
          </View>
        ) : profile ? (
          <ProfileSummary
            name={profile.name}
            email={profile.email}
          />
        ) : (
          <View style={styles.centerContainer}>
            <Text style={styles.statusText}>
              Profile information is unavailable.
            </Text>
          </View>
        )}

        <View style={styles.menuContainer}>
          <ProfileMenuRow
            icon="document-text-outline"
            title="My Activity"
            subtitle="Reports, claims and solved items"
            onPress={() => router.push("/my-activity" as any)}
          />

          <ProfileMenuRow
            icon="notifications-outline"
            title="Notifications"
            subtitle="View alerts and updates"
            onPress={() =>
              Alert.alert(
                "Notifications",
                "Notifications screen will be connected next."
              )
            }
          />

          <ProfileMenuRow
            icon="create-outline"
            title="Edit Profile"
            subtitle="Update your display information"
            onPress={() =>
              Alert.alert(
                "Edit Profile",
                "Profile editing will be connected next."
              )
            }
          />

          <ProfileMenuRow
            icon="help-circle-outline"
            title="Help & Rules"
            subtitle="Privacy and safe handover guidance"
            onPress={() =>
              Alert.alert(
                "Help & Rules",
                "Help and rules content will be connected next."
              )
            }
          />
        </View>

        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Logout"
            onPress={handleLogout}
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

  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },

  statusText: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
  },

  errorText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
  },

  menuContainer: {
    marginTop: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },

  buttonContainer: {
    marginTop: 28,
  },
});