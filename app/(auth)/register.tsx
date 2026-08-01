import { View,Pressable, StyleSheet, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";
import FormField from "@/components/FormField";
import PrimaryButton from "@/components/PrimaryButton";

export default function RegisterScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.textPrimary}
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            Create Account
          </Text>
        </View>

        <Text style={styles.heading}>Join LostLink</Text>

        <Text style={styles.helperText}>
          Create a simulated account using local data.
        </Text>

        <FormField
          label="Full Name"
          placeholder="Enter your full name"
        />

        <FormField
          label="Email Address"
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <FormField
          label="Phone Number"
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
        />

        <FormField
          label="Password"
          placeholder="Create a password"
          showPasswordToggle
        />

        <FormField
          label="Confirm Password"
          placeholder="Confirm your password"
          showPasswordToggle
        />

        <PrimaryButton
          title="Create Account"
        />

        <Text style={styles.noteText}>
          By registering, you agree to the prototype rules.
        </Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account?
          </Text>

          <Pressable onPress={() => router.replace("/(auth)/login")}>
          <Text style={styles.loginText}>
            Login
          </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 32,
  },

  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },

  helperText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 28,
    lineHeight: 20,
  },

  noteText: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },

  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  loginText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },

headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginLeft: 16,
  },
});