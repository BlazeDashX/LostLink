import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import ProfileHeader from "@/components/profile-header";
import ProfileSummary from "@/components/profile-summary";
import ProfileMenuRow from "@/components/profile-menu-row";
import PrimaryButton from "@/components/PrimaryButton";

export default function ProfileScreen() {
  const showComingSoon = (feature: string) => {
    Alert.alert(feature, "This feature will be implemented later.");
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
          onPress: () => {
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <ProfileHeader />

        <ProfileSummary />

        <View style={styles.menuContainer}>
          <ProfileMenuRow
            icon="document-text-outline"
            title="My Activity"
            subtitle="Reports, claims and solved items"
            onPress={() => showComingSoon("My Activity")}
          />

          <ProfileMenuRow
            icon="notifications-outline"
            title="Notifications"
            subtitle="View alerts and updates"
            onPress={() => showComingSoon("Notifications")}
          />

          <ProfileMenuRow
            icon="create-outline"
            title="Edit Profile"
            subtitle="Update your display information"
            onPress={() => showComingSoon("Edit Profile")}
          />

          <ProfileMenuRow
            icon="help-circle-outline"
            title="Help & Rules"
            subtitle="Privacy and safe handover guidance"
            onPress={() => showComingSoon("Help & Rules")}
          />
        </View>

        <View style={styles.logoutContainer}>
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
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  content: {
    paddingBottom: 32,
  },

  menuContainer: {
    paddingHorizontal: 20,
    marginTop: 12,
  },

  logoutContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
});