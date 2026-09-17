import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORS, SPACING } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

export default function SplashScreen() {
  const { isAuthenticated, currentUserId, users, authLoading } = useApp();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation sequence
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(subtitleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    });

    // Wait 2.2 seconds for splash presentation, then route
    const timer = setTimeout(() => {
      if (!authLoading) {
        if (isAuthenticated) {
          const currentUser = users.find((user) => user.id === currentUserId);
          if (currentUser?.role === "Admin") {
            router.replace("/(admin)");
          } else {
            router.replace("/(tab)/home");
          }
        } else {
          router.replace("/(auth)/login");
        }
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, [authLoading, isAuthenticated, currentUserId, users, fadeAnim, scaleAnim, subtitleAnim]);

  return (
    <SafeAreaView
      accessibilityLabel="LostLink splash screen, loading application"
      accessibilityRole="text"
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.iconWrapper,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.iconCircleOuter}>
            <View style={styles.iconCircleInner}>
              <Ionicons color={COLORS.surface} name="shield-checkmark" size={54} />
            </View>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, alignItems: "center" }}>
          <Text style={styles.title}>
            Lost<Text style={styles.titleHighlight}>Link</Text>
          </Text>
          <Text style={styles.tagline}>AIUB Campus Lost & Found Community</Text>
        </Animated.View>

        <Animated.View style={[styles.badgeContainer, { opacity: subtitleAnim }]}>
          <View style={styles.badge}>
            <Ionicons color={COLORS.primary} name="sparkles" size={13} />
            <Text style={styles.badgeText}>Safe & Verified Returns</Text>
          </View>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <ActivityIndicator color={COLORS.primary} size="small" />
        <Text style={styles.loadingText}>Connecting to campus network...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: COLORS.background,
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: SPACING.xxl,
  },
  content: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
  },
  iconWrapper: {
    marginBottom: SPACING.xl,
  },
  iconCircleOuter: {
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderRadius: 65,
    height: 130,
    justifyContent: "center",
    width: 130,
  },
  iconCircleInner: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 48,
    elevation: 8,
    height: 96,
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    width: 96,
  },
  title: {
    color: COLORS.text,
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  titleHighlight: {
    color: COLORS.primary,
  },
  tagline: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "center",
  },
  badgeContainer: {
    marginTop: SPACING.xl,
  },
  badge: {
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderColor: "#BFDBFE",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  badgeText: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: "700",
  },
  footer: {
    alignItems: "center",
    gap: SPACING.xs,
    paddingBottom: SPACING.lg,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
});

