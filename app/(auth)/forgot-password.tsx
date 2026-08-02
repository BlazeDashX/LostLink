import { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import FormField from "@/components/FormField";
import PrimaryButton from "@/components/PrimaryButton";
import { COLORS } from "@/constants/colors";
import users from "@/data/users.json";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");

  const handleReset = () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email.");
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;

    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email.");
      return;
    }

    users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    Alert.alert(
      "Reset Request",
      "If an account exists, reset instruction has been simulated.",
      [
        {
          text: "OK",
          onPress: () => router.replace("/login"),
        },
      ]
    );
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