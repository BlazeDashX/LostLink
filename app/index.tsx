import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";

import { useApp } from "@/context/AppContext";

export default function IndexScreen() {
  const { isAuthenticated, currentUserId, users, authLoading } = useApp();

  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (isAuthenticated) {
    const currentUser = users.find((user) => user.id === currentUserId);
    if (currentUser?.role === "Admin") {
      return <Redirect href="/(admin)" />;
    }
    return <Redirect href="/(tab)/home" />;
  }

  return <Redirect href="/(auth)/login" />;
}

