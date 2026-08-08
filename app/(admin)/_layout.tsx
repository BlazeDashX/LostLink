import { Redirect, Stack } from "expo-router";
import { useApp } from "@/context/AppContext";

export default function AdminLayout() {
  const { isAuthenticated, currentUser } = useApp();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (currentUser?.role !== "Admin") {
    return <Redirect href="/(tab)/home" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
