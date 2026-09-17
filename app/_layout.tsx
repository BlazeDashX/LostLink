import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppProvider, useApp } from "@/context/AppContext";

function AuthGuard() {
  const {
    currentUser,
    isAuthenticated,
    authLoading,
  } = useApp();

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) {
      return;
    }

    const firstSegment = segments[0];

    const isAuthRoute = firstSegment === "(auth)";
    const isProtectedRoute =
      firstSegment === "(tab)" ||
      firstSegment === "(admin)" ||
      firstSegment === "(activity)";

    if (!isAuthenticated) {
      if (isProtectedRoute) {
        router.replace("/(auth)/login");
      }

      return;
    }

    if (isAuthenticated && currentUser) {
      if (isAuthRoute) {
        if (currentUser.role === "Admin") {
          router.replace("/(admin)");
        } else {
          router.replace("/(tab)/home");
        }
      }
    }
  }, [
    authLoading,
    isAuthenticated,
    currentUser,
    segments,
  ]);

  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <AppProvider>
        <AuthGuard />

        <StatusBar style="dark" />

        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </AppProvider>
    </SafeAreaProvider>
  );
}