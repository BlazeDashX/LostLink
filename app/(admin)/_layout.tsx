import { ActivityIndicator, View } from "react-native";
import { Redirect, Stack } from "expo-router";
import { useApp } from "@/context/AppContext";

export default function AdminLayout() {
  const { isAuthenticated, currentUser, authLoading } = useApp();

  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (currentUser?.role !== "Admin") {
    return <Redirect href="/(tab)/home" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
