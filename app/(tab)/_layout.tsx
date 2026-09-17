import { ActivityIndicator, View } from "react-native";
import { Tabs, Redirect } from "expo-router";
import { useApp } from "@/context/AppContext";

export default function TabLayout() {
  const { isAuthenticated, authLoading, currentUser } = useApp();

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

  const isAdmin = currentUser?.role === "Admin";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: isAdmin ? { display: "none" } : undefined,
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="feed" options={{ title: "Feed" }} />
      <Tabs.Screen name="report" options={{ title: "Report" }} />
      <Tabs.Screen name="Inbox" options={{ title: "Inbox" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}