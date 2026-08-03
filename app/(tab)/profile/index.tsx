import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import AppHeader from "@/components/app-header";
import ProfileSummary from "@/components/profile-summary";
import ProfileMenuRow from "@/components/profile-menu-row";
import PrimaryButton from "@/components/PrimaryButton";

import { COLORS, SPACING } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

export default function ProfileScreen() {
  const { currentUserId, users } = useApp();

  const currentUser = users.find(
    (user) => user.id === currentUserId
  );

  const comingSoon = (feature: string) => {
    Alert.alert(
      feature,
      "This feature will be implemented later."
    );
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => router.replace("/(auth)/login"),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader title="Profile" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <ProfileSummary
          name={currentUser?.name ?? ""}
          email={currentUser?.email ?? ""}
        />

        <View style={styles.menuContainer}>
          <ProfileMenuRow
            icon="document-text-outline"
            title="My Activity"
            subtitle="Reports, claims and solved items"
            onPress={() => comingSoon("My Activity")}
          />

          <ProfileMenuRow
            icon="notifications-outline"
            title="Notifications"
            subtitle="View alerts and updates"
            onPress={() => comingSoon("Notifications")}
          />

          <ProfileMenuRow
            icon="create-outline"
            title="Edit Profile"
            subtitle="Update your display information"
            onPress={() => comingSoon("Edit Profile")}
          />

          <ProfileMenuRow
            icon="help-circle-outline"
            title="Help & Rules"
            subtitle="Privacy and safe handover guidance"
            onPress={() => comingSoon("Help & Rules")}
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