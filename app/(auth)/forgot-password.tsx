import { useState } from "react";

import {
  Alert,
  Platform,
  View,
  StyleSheet,
  Text,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { router } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import FormField from "@/components/FormField";

import PrimaryButton from "@/components/PrimaryButton";

import { COLORS } from "@/constants/colors";

import { api } from "@/services/api";

const showAlert = (
  title: string,
  message: string,
  onPress?: () => void
) => {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);

    if (onPress) {
      onPress();
    }

    return;
  }

  Alert.alert(
    title,
    message,
    [
      {
        text: "OK",
        onPress,
      },
    ]
  );
};

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      showAlert(
        "Missing Information",
        "Please enter your email."
      );
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;

    if (!emailRegex.test(email.trim())) {
      showAlert(
        "Invalid Email",
        "Please enter a valid email."
      );
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

      showAlert(
        "Reset Request",
        response.data.message,
        () => router.replace("/(auth)/login")
      );
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "Something went wrong. Please try again.";

      showAlert(
        "Request Failed",
        message
      );
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
          LostLink will show a confirmation alert.
        </Text>

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

  note: {
    marginTop: 18,
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: 12,
  },
});