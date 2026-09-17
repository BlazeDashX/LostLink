import React, { useState } from "react";

import {
  View,
  Pressable,
  StyleSheet,
  Text,
  ScrollView,
  Alert,
  Platform,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/constants/colors";

import FormField from "@/components/FormField";
import PrimaryButton from "@/components/PrimaryButton";

import { api } from "@/services/api";
import { useApp } from "@/context/AppContext";

interface FormErrors {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface TouchedFields {
  name: boolean;
  email: boolean;
  phone: boolean;
  password: boolean;
  confirmPassword: boolean;
}

export default function RegisterScreen() {
  const { setUsers } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [touched, setTouched] = useState<TouchedFields>({
    name: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
  });

  const validateField = (
    field: keyof FormErrors,
    value: string
  ): string => {
    switch (field) {
      case "name":
        if (!value.trim()) {
          return "Full name is required.";
        }

        if (value.trim().length < 3) {
          return "Name must be at least 3 characters.";
        }

        return "";

      case "email":
        if (!value.trim()) {
          return "Email address is required.";
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return "Please enter a valid email address.";
        }

        return "";

      case "phone":
        if (!value.trim()) {
          return "Phone number is required.";
        }

        return "";

      case "password":
        if (!value) {
          return "Password is required.";
        }

        if (value.length < 6) {
          return "Password must be at least 6 characters.";
        }

        return "";

      case "confirmPassword":
        if (!value) {
          return "Please confirm your password.";
        }

        if (value !== password) {
          return "Passwords do not match.";
        }

        return "";

      default:
        return "";
    }
  };

  const handleFieldChange = (
    field: keyof FormErrors,
    value: string
  ) => {
    switch (field) {
      case "name":
        setName(value);
        break;

      case "email":
        setEmail(value);
        break;

      case "phone":
        setPhone(value);
        break;

      case "password":
        setPassword(value);
        break;

      case "confirmPassword":
        setConfirmPassword(value);
        break;
    }

    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));

    const error = validateField(field, value);

    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }));

    if (field === "password" && touched.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        password: error,
        confirmPassword:
          confirmPassword && confirmPassword !== value
            ? "Passwords do not match."
            : "",
      }));
    }
  };

  const validateAllFields = (): boolean => {
    const newErrors: FormErrors = {
      name: validateField("name", name),
      email: validateField("email", email),
      phone: validateField("phone", phone),
      password: validateField("password", password),
      confirmPassword: validateField(
        "confirmPassword",
        confirmPassword
      ),
    };

    setErrors(newErrors);

    setTouched({
      name: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
    });

    return !Object.values(newErrors).some(
      (error) => error !== ""
    );
  };

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

  const handleRegister = async () => {
    const isValid = validateAllFields();

    if (!isValid) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/api/auth/register", {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });

      if (response.data?.user) {
        setUsers((prev) => {
          const exists = prev.some((u) => u.id === response.data.user.id || u.email.toLowerCase() === response.data.user.email.toLowerCase());
          return exists ? prev : [response.data.user, ...prev];
        });
      }

      showAlert(
        "Registration Successful",
        response.data.message,
        () => {
          router.replace("/(auth)/login");
        }
      );
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "Registration failed. Please try again.";

      showAlert(
        "Registration Failed",
        message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Returns to the previous screen"
            onPress={() => router.back()}
          >
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

        <Text style={styles.heading}>
          Join LostLink
        </Text>

        <Text style={styles.helperText}>
          Create your LostLink account.
        </Text>

        <FormField
          label="Full Name"
          placeholder="Enter your full name"
          value={name}
          onChangeText={(value) =>
            handleFieldChange("name", value)
          }
          error={touched.name ? errors.name : ""}
        />

        <FormField
          label="Email Address"
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={(value) =>
            handleFieldChange("email", value)
          }
          error={touched.email ? errors.email : ""}
        />

        <FormField
          label="Phone Number"
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={(value) =>
            handleFieldChange("phone", value)
          }
          error={touched.phone ? errors.phone : ""}
        />

        <FormField
          label="Password"
          placeholder="Create a password"
          showPasswordToggle
          value={password}
          onChangeText={(value) =>
            handleFieldChange("password", value)
          }
          error={touched.password ? errors.password : ""}
        />

        <FormField
          label="Confirm Password"
          placeholder="Confirm your password"
          showPasswordToggle
          value={confirmPassword}
          onChangeText={(value) =>
            handleFieldChange(
              "confirmPassword",
              value
            )
          }
          error={
            touched.confirmPassword
              ? errors.confirmPassword
              : ""
          }
        />

        <PrimaryButton
          title="Create Account"
          onPress={handleRegister}
          loading={loading}
        />

        <Text style={styles.noteText}>
          By registering, you agree to the prototype rules.
        </Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account?
          </Text>

          <Pressable
              accessibilityRole="button"
              accessibilityLabel="Login"
              accessibilityHint="Opens the login screen"
              onPress={() =>
              router.replace("/(auth)/login")
            }
          >
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