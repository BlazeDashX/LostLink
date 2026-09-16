import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import AppHeader from "@/components/app-header";
import FormField from "@/components/FormField";
import PrimaryButton from "@/components/PrimaryButton";

import { COLORS, SPACING } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { api } from "@/services/api";
import { updateUserProfile } from "@/services/users";

export default function EditProfileScreen() {
  const { currentUserId } = useApp();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUserId) {
        setError("No logged-in user found.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/api/users/${currentUserId}`,
          {
            headers: {
              "x-user-id": currentUserId,
            },
          }
        );

        const user = response.data.data;

        setName(user.name || "");
        setPhone(user.phone || "");
      } catch (error: any) {
        console.error("Failed to load profile:", error);

        setError(
          error.response?.data?.message ||
            "Failed to load profile. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [currentUserId]);

  const handleSave = async () => {
    if (!currentUserId) {
      setError("No logged-in user found.");
      return;
    }

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!phone.trim()) {
      setError("Phone number is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await updateUserProfile(
        currentUserId,
        {
          name: name.trim(),
          phone: phone.trim(),
        }
      );

      // Server confirmed the update
      if (Platform.OS === "web") {
        router.back();
      } else {
        Alert.alert(
          "Success",
          response.message,
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error("Failed to update profile:", error);

      setError(
        error.response?.data?.message ||
          "Failed to update profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <AppHeader title="Edit Profile" />

        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" />

          <Text style={styles.statusText}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader title="Edit Profile" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.description}>
          Update your profile information below.
        </Text>

        <FormField
          label="Name"
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          editable={!saving}
        />

        <FormField
          label="Phone"
          placeholder="Enter your phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          editable={!saving}
        />

        {error ? (
          <Text style={styles.errorText}>
            {error}
          </Text>
        ) : null}

        {success ? (
          <Text style={styles.successText}>
            {success}
          </Text>
        ) : null}

        <View style={styles.buttonContainer}>
          <PrimaryButton
            title={saving ? "Saving..." : "Save Changes"}
            onPress={handleSave}
            disabled={saving}
          />
        </View>

        <View style={styles.cancelContainer}>
          <PrimaryButton
            title="Cancel"
            onPress={() => router.back()}
            disabled={saving}
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

  description: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
  },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  statusText: {
    color: "#6B7280",
    fontSize: 14,
  },

  errorText: {
    color: "#D32F2F",
    fontSize: 14,
    marginBottom: 12,
  },

  successText: {
    color: "#15803D",
    fontSize: 14,
    marginBottom: 12,
    fontWeight: "600",
  },

  buttonContainer: {
    marginTop: 8,
  },

  cancelContainer: {
    marginTop: 12,
  },
});