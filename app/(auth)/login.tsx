import { View, StyleSheet, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import BrandLogo from "@/components/BrandLogo";
import FormField from "@/components/FormField";
import PrimaryButton from "@/components/PrimaryButton";
import { COLORS } from "@/constants/colors";

export default function LoginScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <BrandLogo />

        <Text style={styles.title}>Welcome Back</Text>

        <Text style={styles.subtitle}>
          Sign in to continue your journey
        </Text>

        <FormField
          label="Email Address"
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <FormField
          label="Password"
          placeholder="Enter your password"
          showPasswordToggle
        />

        <View style={styles.forgotPasswordContainer}>
          <Pressable
            onPress={() => router.push("/(auth)/forgot-password")}
          >
            <Text style={styles.forgotPasswordText}>
              Forgot Password?
            </Text>
          </Pressable>
        </View>

        <PrimaryButton
          title="Login"
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don&apos;t have an account?
          </Text>

          <Pressable
            onPress={() => router.push("/(auth)/register")}
          >
            <Text style={styles.registerText}>
              Register
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryLight,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 40,
  },

  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginTop: 8,
    marginBottom: 24,
  },

  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },

  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  registerText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
});