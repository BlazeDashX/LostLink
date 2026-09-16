import { useState } from "react";

import {
  View,
  StyleSheet,
  Text,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import FormField from "@/components/FormField";
import PrimaryButton from "@/components/PrimaryButton";

import { COLORS } from "@/constants/colors";

import { router } from "expo-router";
import { api } from "@/services/api";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [feedback, setFeedback] = useState<{
    title: string;
    message: string;
    success: boolean;
  } | null>(null);

  const handleReset = async () => {
    setFeedback(null);

    if (!email.trim()) {
      setFeedback({
        title: "Missing Information",
        message: "Please enter your email.",
        success: false,
      });
      return;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      setFeedback({
        title: "Invalid Email",
        message: "Please enter a valid email.",
        success: false,
      });
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        "/api/auth/forgot-password",
        {
          email: email.trim(),
        }
      );

      setFeedback({
        title: "Reset Request",
        message: response.data.message,
        success: true,
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "Something went wrong. Please try again.";

      setFeedback({
        title: "Request Failed",
        message,
        success: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="lock-closed-outline"
            size={46}
            color={COLORS.primary}
          />
        </View>

        <Text style={styles.title}>
          Reset access
        </Text>

        <Text style={styles.subtitle}>
          Enter the email used in the simulated account.
          {"\n"}
          LostLink will show a confirmation message.
        </Text>

        {feedback ? (
          <View
            style={[
              styles.feedbackContainer,
              feedback.success
                ? styles.successFeedback
                : styles.errorFeedback,
            ]}
          >
            <Text style={styles.feedbackTitle}>
              {feedback.title}
            </Text>

            <Text style={styles.feedbackMessage}>
              {feedback.message}
            </Text>

            {feedback.success ? (
              <PrimaryButton
                title="Continue to Login"
                onPress={() =>
                  router.replace("/(auth)/login")
                }
              />
            ) : (
              <PrimaryButton
                title="Dismiss"
                onPress={() => setFeedback(null)}
              />
            )}
          </View>
        ) : null}

        <FormField
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <PrimaryButton
          title="Send Reset Instruction"
          onPress={handleReset}
          loading={loading}
          disabled={!!feedback}
        />

        <Text style={styles.note}>
          No email is actually sent in this frontend prototype.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 28,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 12,
  },

  subtitle: {
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 36,
  },

  feedbackContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },

  successFeedback: {
    backgroundColor: "#ECFDF5",
    borderColor: "#16A34A",
  },

  errorFeedback: {
    backgroundColor: "#FEF2F2",
    borderColor: "#DC2626",
  },

  feedbackTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },

  feedbackMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },

  note: {
    marginTop: 18,
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: 12,
  },
});