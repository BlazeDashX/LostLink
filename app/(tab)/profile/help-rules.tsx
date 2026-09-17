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

export default function HelpRulesScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader title="Help & Rules" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.card}>
          <Text style={styles.title}>
            LostLink Help & Safety Rules
          </Text>

          <Text style={styles.rule}>
            • Provide accurate information when reporting a
            lost or found item.
          </Text>

          <Text style={styles.rule}>
            • Verify ownership before handing over an item.
          </Text>

          <Text style={styles.rule}>
            • Do not share unnecessary personal information
            with other users.
          </Text>

          <Text style={styles.rule}>
            • Meet in a safe and appropriate place when
            arranging a handover.
          </Text>

          <Text style={styles.rule}>
            • Report suspicious activity through the
            appropriate app features.
          </Text>
        </View>

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

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 18,
  },

  rule: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6B7280",
    marginBottom: 14,
  },

  buttonContainer: {
    marginTop: 24,
  },
});